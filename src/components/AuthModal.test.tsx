import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthModal } from './AuthModal'
import { COOLDOWN_KEY, REMEMBERED_EMAIL_KEY } from '../lib/authClient'
import type { MvpContextValue } from '../context/MvpContextValue'

// AuthModal reads the auth context via useMvp. Mock it so we can drive signIn
// success/failure and demoMode without a real Supabase client.
const ctx: { value: Partial<MvpContextValue> } = { value: {} }
vi.mock('../context/useMvp', () => ({ useMvp: () => ctx.value }))

function renderModal() {
  return render(<AuthModal action="participate in campaigns" onClose={() => {}} />)
}

const emailInput = () => screen.getByPlaceholderText('you@example.com') as HTMLInputElement
const sendButton = () => screen.getByRole('button', { name: /send magic link|send another link|sending/i })

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  ctx.value = {
    profile: null,
    demoMode: false,
    signIn: vi.fn(async () => {}),
    completeProfile: vi.fn(async () => {}),
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AuthModal — returning user', () => {
  it('prefills the remembered email and shows the returning message', () => {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, 'saved@example.com')
    renderModal()
    expect(emailInput().value).toBe('saved@example.com')
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByText(/remember this email on this device/i)).toBeInTheDocument()
  })

  it('"Use a different email" clears storage and the input', () => {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, 'saved@example.com')
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /use a different email/i }))
    expect(emailInput().value).toBe('')
    expect(localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
  })

  it('does not prefill when no email is remembered', () => {
    renderModal()
    expect(emailInput().value).toBe('')
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
  })
})

describe('AuthModal — rate-limit cooldown', () => {
  it('starts a 60s cooldown after a successful request and persists it', async () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'investor@example.com' } })
    fireEvent.click(sendButton())
    await waitFor(() => expect(screen.getByText(/check your inbox/i)).toBeInTheDocument())
    expect(ctx.value.signIn).toHaveBeenCalledWith('investor@example.com')
    expect(screen.getByRole('button', { name: /send another link in 60s/i })).toBeDisabled()
    expect(sessionStorage.getItem(COOLDOWN_KEY)).not.toBeNull()
  })

  it('prevents a duplicate request while cooling down', async () => {
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } })
    fireEvent.click(sendButton())
    await waitFor(() => expect(screen.getByText(/check your inbox/i)).toBeInTheDocument())
    const resend = screen.getByRole('button', { name: /send another link in/i })
    fireEvent.click(resend)
    // Still only the initial call — the disabled cooldown button blocks a resend.
    expect(ctx.value.signIn).toHaveBeenCalledTimes(1)
  })

  it('shows a specific message and wait time for an HTTP 429', async () => {
    ctx.value.signIn = vi.fn(async () => {
      throw Object.assign(new Error('For security purposes, you can only request this after 38 seconds.'), { status: 429 })
    })
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } })
    fireEvent.click(sendButton())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/wait 38 seconds before requesting another/i))
    // The button reflects the server-provided cooldown.
    expect(screen.getByRole('button', { name: /send another link in 38s/i })).toBeDisabled()
  })

  it('handles the over_email_send_rate_limit code', async () => {
    ctx.value.signIn = vi.fn(async () => {
      throw Object.assign(new Error('rate limited'), { code: 'over_email_send_rate_limit' })
    })
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } })
    fireEvent.click(sendButton())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/recently sent/i))
  })

  it('shows the generic message only for unexpected failures', async () => {
    ctx.value.signIn = vi.fn(async () => {
      throw new Error('network down')
    })
    renderModal()
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } })
    fireEvent.click(sendButton())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not start sign-in/i))
  })

  it('re-enables the request after an expired cooldown (retry works)', () => {
    // A cooldown that already expired must not block a fresh request.
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() - 1000))
    renderModal()
    const button = screen.getByRole('button', { name: /send magic link/i })
    expect(button).not.toBeDisabled()
  })
})

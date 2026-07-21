import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthModal } from './AuthModal'
import type { MvpContextValue } from '../context/MvpContextValue'

// AuthModal reads the auth context via useMvp. Mock it so we can drive
// login/completeProfile without a real Supabase client.
const ctx: { value: Partial<MvpContextValue> } = { value: {} }
vi.mock('../context/useMvp', () => ({ useMvp: () => ctx.value }))

function renderModal() {
  return render(
    <MemoryRouter>
      <AuthModal action="participate in campaigns" onClose={() => {}} />
    </MemoryRouter>,
  )
}

const identifierInput = () => screen.getByPlaceholderText(/you@example.com or username/i) as HTMLInputElement
const passwordInput = () => document.querySelector('input[name=password]') as HTMLInputElement

beforeEach(() => {
  localStorage.clear()
  ctx.value = {
    profile: null,
    demoMode: true,
    login: vi.fn(async () => {}),
    completeProfile: vi.fn(async () => {}),
  }
})

describe('AuthModal — password sign-in', () => {
  it('shows the password sign-in step and no magic-link copy', () => {
    renderModal()
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument()
    expect(screen.queryByText(/magic link/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    // Full auth pages are reachable from the modal.
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('calls login with the identifier and password', async () => {
    renderModal()
    fireEvent.change(identifierInput(), { target: { value: 'quiet_investor' } })
    fireEvent.change(passwordInput(), { target: { value: 'demo-password-1234' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(ctx.value.login).toHaveBeenCalledWith('quiet_investor', 'demo-password-1234'))
  })

  it('shows one generic error when login fails (no field disclosure)', async () => {
    ctx.value.login = vi.fn(async () => {
      throw new Error('nope')
    })
    renderModal()
    fireEvent.change(identifierInput(), { target: { value: 'person@example.com' } })
    fireEvent.change(passwordInput(), { target: { value: 'whatever1234' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/incorrect username\/email or password/i))
  })
})

describe('AuthModal — account completion', () => {
  it('prompts to finish setup when signed in but incomplete', async () => {
    ctx.value = {
      profile: { id: 'demo-1', displayName: 'Investor', complete: false },
      demoMode: true,
      login: vi.fn(async () => {}),
      completeProfile: vi.fn(async () => {}),
    }
    renderModal()
    expect(screen.getByText(/one quick profile detail/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(ctx.value.completeProfile).toHaveBeenCalled())
  })
})

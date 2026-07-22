import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './RequireAdmin'
import type { MvpContextValue } from '../../context/MvpContextValue'

// RequireAdmin is the render-time gate on every admin route. The real security
// boundary is server-side (is_admin() + RLS); these tests prove the client never
// shows protected content to the wrong viewer and never flashes it while the
// admin check is still in flight.
const ctx: { value: Partial<MvpContextValue> } = { value: {} }
vi.mock('../../context/useMvp', () => ({ useMvp: () => ctx.value }))

const SECRET = 'SECRET ADMIN CONTENT'

function renderGate(entry = '/admin/queue') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route path="/admin/queue" element={<div>{SECRET}</div>} />
          <Route path="/admin/users" element={<div>{SECRET}</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const base: Partial<MvpContextValue> = { loading: false, adminLoading: false, isAdmin: false, profile: null }
const adminProfile = { id: 'u1', displayName: 'Admin', username: 'luke' } as unknown as MvpContextValue['profile']
const userProfile = { id: 'u2', displayName: 'Investor', username: 'quiet' } as unknown as MvpContextValue['profile']

beforeEach(() => {
  ctx.value = { ...base }
})

describe('RequireAdmin authorization', () => {
  it('redirects a signed-out visitor to login and never shows admin content', async () => {
    ctx.value = { ...base, profile: null }
    renderGate()
    await waitFor(() => expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument())
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
  })

  it('denies a verified non-admin user without revealing admin content', () => {
    ctx.value = { ...base, profile: userProfile, isAdmin: false }
    renderGate()
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
    expect(screen.getByText(/don’t have access|access to this area/i)).toBeInTheDocument()
  })

  it('shows a neutral skeleton (no content) while auth is loading', () => {
    ctx.value = { ...base, loading: true, profile: null }
    renderGate()
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument()
  })

  it('does NOT flash admin content while the admin check is still in flight', () => {
    // Profile is loaded and the user *would* be an admin, but adminLoading is true:
    // content must not appear until the check resolves.
    ctx.value = { ...base, profile: adminProfile, isAdmin: true, adminLoading: true }
    renderGate()
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
  })

  it('allows the confirmed sole administrator', () => {
    ctx.value = { ...base, profile: adminProfile, isAdmin: true, adminLoading: false }
    renderGate()
    expect(screen.getByText(SECRET)).toBeInTheDocument()
  })

  it('protects nested routes independently — a direct deep link is gated too', () => {
    ctx.value = { ...base, profile: userProfile, isAdmin: false }
    renderGate('/admin/users')
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument()
    expect(screen.getByText(/don’t have access|access to this area/i)).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Route-resolution tests: mount the real <App /> router and assert each path
// resolves to the intended (lazy-loaded) page. Keep the mount light + offline —
// no analytics script, no real intake network — mirroring App.analytics.test.tsx.
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
vi.mock('./lib/analytics', () => ({ track: vi.fn() }))
vi.mock('./lib/intake', () => ({
  submitBugReport: vi.fn(async () => ({ reference: 'BUG-TEST' })),
  submitSupportTicket: vi.fn(async () => ({ ticketNumber: 'OF-TEST' })),
  newIdempotencyKey: () => 'test-idem-key',
  INTAKE_UNAVAILABLE: 'intake_unavailable',
}))

import App from './App'
import { MvpProvider } from './context/MvpContext'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MvpProvider>
        <App />
      </MvpProvider>
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('/report-bug renders ReportBugPage', async () => {
    renderAt('/report-bug')
    expect(await screen.findByPlaceholderText(/describe the problem/i)).toBeInTheDocument()
  })

  it('/contact renders the intended Prompt 4 contact/support form (not the old static page)', async () => {
    renderAt('/contact')
    // The support form is unique to the intended Contact page — the old static
    // page had only mailto links, no message field or submit button.
    expect(await screen.findByPlaceholderText(/how can we help/i)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('an unknown route renders NotFound', async () => {
    renderAt('/this-route-does-not-exist')
    expect(await screen.findByText(/page not found/i)).toBeInTheDocument()
  })
})

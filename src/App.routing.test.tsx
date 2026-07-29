import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Route-resolution tests: mount the real <App /> router and assert each path
// resolves to the intended (lazy-loaded) page. Keep the mount light + offline —
// no analytics script, no real intake network — mirroring App.analytics.test.tsx.
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
vi.mock('./lib/analytics', () => ({ track: vi.fn() }))
// Stub only the two network calls; the real module supplies the attachment
// limits and validator the form renders, so a change to either is caught here.
vi.mock('./lib/intake', async importActual => ({
  ...(await importActual<typeof import('./lib/intake')>()),
  submitBugReport: vi.fn(async () => ({ reference: 'BUG-TEST', attachmentsStored: 0, attachmentsFailed: false })),
  submitSupportTicket: vi.fn(async () => ({ ticketNumber: 'OF-TEST' })),
  newIdempotencyKey: () => 'test-idem-key',
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

/* ===========================================================================
   Admin route protection. The real boundary is server-side is_admin(); these
   tests assert the client never RENDERS an admin page to someone who is not
   signed in as the administrator — including the Prompt 5 /admin/system page
   and the unknown-admin-route fallback.
   =========================================================================== */

describe('admin routes are protected', () => {
  for (const path of ['/admin', '/admin/system', '/admin/bugs', '/admin/support', '/admin/not-a-real-page']) {
    it(`${path} renders no admin content to a signed-out visitor`, async () => {
      renderAt(path)
      // Assert the security property itself: none of the console is rendered,
      // ever — not even briefly. RequireAdmin shows a neutral skeleton while the
      // session resolves and then redirects, so there is no protected content to
      // flash. (The real boundary is server-side is_admin(); this guards the
      // client from displaying anything it should not.)
      await waitFor(() => expect(screen.queryByText(/loading|skeleton/i)).not.toBeInTheDocument())
      expect(screen.queryByText('Open Floor Admin')).not.toBeInTheDocument()
      expect(screen.queryByRole('navigation', { name: /admin sections/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /work queue/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/audit log/i)).not.toBeInTheDocument()
    })
  }
})

import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Vercel Analytics must be mounted exactly once at the app root. Mock the package
// so no analytics script is injected and no network request is made; the mock
// renders a marker we can count in the DOM.
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}))

import App from './App'
import { MvpProvider } from './context/MvpContext'

describe('Vercel Analytics mounting', () => {
  it('mounts <Analytics /> exactly once at the application root', async () => {
    render(
      <MvpProvider>
        <App />
      </MvpProvider>,
    )
    await waitFor(() => expect(screen.getAllByTestId('vercel-analytics')).toHaveLength(1))
  })
})

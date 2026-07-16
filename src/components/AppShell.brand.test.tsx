import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { MvpProvider } from '../context/MvpContext'

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/discover']}>
      <MvpProvider>
        <AppShell>
          <p>Page content</p>
        </AppShell>
      </MvpProvider>
    </MemoryRouter>,
  )
}

describe('AppShell — Open Floor branding', () => {
  it('renders the Open Floor wordmark and footer branding', () => {
    renderShell()
    // Wordmark (sidebar) + mobile topbar brand + footer heading all read "Open Floor".
    expect(screen.getAllByText('Open Floor').length).toBeGreaterThanOrEqual(2)
    // Home wordmark link is labelled for assistive tech.
    expect(screen.getByRole('link', { name: /open floor home/i })).toBeInTheDocument()
  })

  it('shows no legacy GroundFloor / Ground Floor references', () => {
    renderShell()
    expect(screen.queryByText(/ground\s*floor/i)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/ground\s*floor/i)
  })

  it('exposes primary navigation and a footer landmark', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})

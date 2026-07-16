import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './HomePage'
import { signInWithMagicLink, startCampaign } from '../lib/api'

// PostHog is never loaded in the test environment (no VITE_POSTHOG_KEY), so
// track() calls are real no-ops there — analytics wiring is verified here by
// mocking the module directly, the one place it's actually observable.
vi.mock('../lib/analytics', () => ({ track: vi.fn(), identify: vi.fn() }))
import { track } from '../lib/analytics'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<div>DISCOVER PAGE</div>} />
        <Route path="/how-it-works" element={<div>HOW IT WORKS PAGE</div>} />
        <Route path="/transparency" element={<div>TRANSPARENCY PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomePage analytics wiring', () => {
  it('fires homepage_viewed once on mount', () => {
    renderHome()
    expect(track).toHaveBeenCalledWith('homepage_viewed', {})
  })

  it('fires homepage_primary_cta_clicked and navigates to Discover', () => {
    renderHome()
    // Two "Find a company" buttons exist (hero + final CTA); the hero one is first.
    fireEvent.click(screen.getAllByRole('button', { name: /find a company/i })[0])
    expect(track).toHaveBeenCalledWith('homepage_primary_cta_clicked', { source: 'hero_primary' })
    expect(screen.getByText('DISCOVER PAGE')).toBeInTheDocument()
  })

  it('fires homepage_secondary_cta_clicked and navigates to How It Works', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /see how it works/i }))
    expect(track).toHaveBeenCalledWith('homepage_secondary_cta_clicked', {})
    expect(screen.getByText('HOW IT WORKS PAGE')).toBeInTheDocument()
  })

  it('fires homepage_how_it_works_clicked from the How It Works section link', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: /full details/i }))
    expect(track).toHaveBeenCalledWith('homepage_how_it_works_clicked', {})
  })

  it('fires homepage_trust_link_clicked with the target policy', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: 'Transparency' }))
    expect(track).toHaveBeenCalledWith('homepage_trust_link_clicked', { target: 'transparency' })
  })

  it('fires homepage_final_cta_clicked from the closing CTA', () => {
    renderHome()
    // Two "Find a company" buttons exist (hero + final CTA); the final CTA is the last one.
    const buttons = screen.getAllByRole('button', { name: /find a company/i })
    fireEvent.click(buttons[buttons.length - 1])
    expect(track).toHaveBeenCalledWith('homepage_final_cta_clicked', {})
  })

  it('never sends raw search text — only length — for homepage search', async () => {
    renderHome()
    const input = screen.getByPlaceholderText(/search companies or tickers/i)
    fireEvent.change(input, { target: { value: 'AAPL' } })
    await waitFor(() => expect(track).toHaveBeenCalledWith('homepage_search_started', {}))
    const calls = (track as unknown as ReturnType<typeof vi.fn>).mock.calls
    for (const [, props] of calls) {
      expect(JSON.stringify(props)).not.toContain('AAPL')
    }
  })
})

describe('HomePage live-participation section', () => {
  it('shows an honest empty state with no real campaigns', async () => {
    renderHome()
    await screen.findByText('Open Floor is newly launched.')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('shows real campaign content once a demo campaign exists', async () => {
    const profile = await signInWithMagicLink('homepage-live-test@test.dev')
    await startCampaign('apple', profile!.id)
    renderHome()
    await waitFor(() => expect(screen.queryByText('Open Floor is newly launched.')).not.toBeInTheDocument())
    expect(await screen.findByText('AAPL', { exact: false })).toBeInTheDocument()
  })
})

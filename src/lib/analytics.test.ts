import { afterEach, describe, expect, it, vi } from 'vitest'

// Exercises the PostHog wrapper in isolation with posthog-js mocked, controlling
// VITE_POSTHOG_KEY via env stubbing + a fresh module graph per test. Confirms the
// privacy-critical behaviour: identify carries no email, logout resets, autocapture
// and session recording are off, and everything no-ops without a key. No real
// network requests are made (posthog-js is mocked).

const posthog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}

async function loadAnalytics(key: string) {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('VITE_POSTHOG_KEY', key)
  vi.doMock('posthog-js', () => ({ default: posthog }))
  const mod = await import('./analytics')
  return mod
}

async function loadAndInit(key: string) {
  const mod = await loadAnalytics(key)
  mod.initAnalytics()
  await vi.waitFor(() => expect(posthog.init).toHaveBeenCalled())
  return mod
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.doUnmock('posthog-js')
})

describe('analytics wrapper — no key', () => {
  it('safely no-ops and never loads posthog-js', async () => {
    const { initAnalytics, track, identify, resetAnalytics } = await loadAnalytics('')
    initAnalytics()
    track('campaign_supported', { ticker: 'AAPL' })
    identify('user-123')
    resetAnalytics()
    await Promise.resolve()
    expect(posthog.init).not.toHaveBeenCalled()
    expect(posthog.capture).not.toHaveBeenCalled()
    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.reset).not.toHaveBeenCalled()
  })
})

describe('analytics wrapper — configured', () => {
  it('initializes with autocapture, page views/leaves, and session recording OFF', async () => {
    await loadAndInit('phc_test')
    const options = posthog.init.mock.calls[0][1]
    expect(options.autocapture).toBe(false)
    expect(options.disable_session_recording).toBe(true)
    expect(options.capture_pageview).toBe(false)
    expect(options.capture_pageleave).toBe(false)
  })

  it('routes track() to posthog.capture with the given props (PostHog, not Vercel)', async () => {
    const mod = await loadAndInit('phc_test')
    mod.track('campaign_supported', { ticker: 'AAPL', authenticated: true })
    expect(posthog.capture).toHaveBeenCalledWith('campaign_supported', { ticker: 'AAPL', authenticated: true })
  })

  it('identifies with the Supabase user id only — never an email/person property', async () => {
    const mod = await loadAndInit('phc_test')
    mod.identify('11111111-2222-3333-4444-555555555555')
    expect(posthog.identify).toHaveBeenCalledWith('11111111-2222-3333-4444-555555555555')
    // Exactly one argument — no second properties object that could carry email.
    expect(posthog.identify.mock.calls[0]).toHaveLength(1)
    const arg = JSON.stringify(posthog.identify.mock.calls[0])
    expect(arg).not.toMatch(/@|email|name/i)
  })

  it('resetAnalytics() calls posthog.reset() (logout clears identity)', async () => {
    const mod = await loadAndInit('phc_test')
    mod.resetAnalytics()
    expect(posthog.reset).toHaveBeenCalledTimes(1)
  })
})

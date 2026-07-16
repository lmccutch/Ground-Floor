import { beforeEach, describe, expect, it } from 'vitest'
import { getAttribution } from './analytics'
import { getRecentSearches } from './recentSearches'
import { getSessionProfile } from './api'

// The Open Floor rebrand renamed the local storage keys. These tests prove a
// returning user's local state (demo store, attribution, recent searches) is
// migrated forward from the pre-rename keys rather than silently lost.

beforeEach(() => {
  localStorage.clear()
})

describe('storage-key migration (Open Floor rebrand)', () => {
  it('migrates the demo store from groundfloor-mvp to open-floor-mvp', async () => {
    localStorage.setItem('groundfloor-mvp', JSON.stringify({ user: { id: 'demo-x', displayName: 'Legacy User', complete: true } }))
    const profile = await getSessionProfile()
    expect(profile?.displayName).toBe('Legacy User')
    expect(localStorage.getItem('open-floor-mvp')).not.toBeNull()
  })

  it('also migrates from the original grround-floor-mvp key', async () => {
    localStorage.setItem('grround-floor-mvp', JSON.stringify({ user: { id: 'demo-y', displayName: 'Original User', complete: true } }))
    const profile = await getSessionProfile()
    expect(profile?.displayName).toBe('Original User')
  })

  it('does not overwrite existing open-floor data', async () => {
    localStorage.setItem('open-floor-mvp', JSON.stringify({ user: { id: 'demo-new', displayName: 'Current', complete: true } }))
    localStorage.setItem('groundfloor-mvp', JSON.stringify({ user: { id: 'demo-old', displayName: 'Stale', complete: true } }))
    const profile = await getSessionProfile()
    expect(profile?.displayName).toBe('Current')
  })

  it('migrates attribution to open-floor-attribution', () => {
    localStorage.setItem('groundfloor-attribution', JSON.stringify({ utm_source: 'newsletter' }))
    expect(getAttribution().utm_source).toBe('newsletter')
    expect(localStorage.getItem('open-floor-attribution')).not.toBeNull()
  })

  it('migrates recent searches from the pre-rename key', () => {
    const entries = [{ ticker: 'AAPL', name: 'Apple', path: '/company/AAPL' }]
    localStorage.setItem('groundfloor-mvp-recent-searches', JSON.stringify(entries))
    expect(getRecentSearches()).toEqual(entries)
    expect(localStorage.getItem('open-floor-mvp-recent-searches')).not.toBeNull()
  })
})

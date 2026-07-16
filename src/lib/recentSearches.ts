// Recent company searches, stored locally in this browser only — never sent to
// the server. Namespaced by data mode so test runs never touch demo/real history.

import { getDataModeConfig } from './dataMode'

export type RecentSearch = {
  ticker: string
  name: string
  /** Route path to open when re-selected, e.g. /company/AAPL */
  path: string
}

const MAX_RECENT = 8

function storageKey(): string {
  return `${getDataModeConfig().storageKey}-recent-searches`
}

// Pre-Open-Floor base storage keys, so recent searches survive the rebrand.
const LEGACY_BASE_KEYS = ['groundfloor-mvp', 'grround-floor-mvp']

// One-time migration: carry forward recent searches stored under a pre-rename key.
function migrateLegacyRecentSearches(): void {
  const key = storageKey()
  if (getDataModeConfig().isTestMode || localStorage.getItem(key) !== null) return
  for (const base of LEGACY_BASE_KEYS) {
    const legacy = localStorage.getItem(`${base}-recent-searches`)
    if (legacy !== null) {
      localStorage.setItem(key, legacy)
      return
    }
  }
}

export function getRecentSearches(): RecentSearch[] {
  migrateLegacyRecentSearches()
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey()) || '[]') as RecentSearch[]
    return Array.isArray(parsed) ? parsed.filter(item => item && item.ticker && item.path) : []
  } catch {
    return []
  }
}

export function addRecentSearch(entry: RecentSearch): void {
  const existing = getRecentSearches().filter(item => item.ticker !== entry.ticker)
  localStorage.setItem(storageKey(), JSON.stringify([entry, ...existing].slice(0, MAX_RECENT)))
}

export function clearRecentSearches(): void {
  localStorage.removeItem(storageKey())
}

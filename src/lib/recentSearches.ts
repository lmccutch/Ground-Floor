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

export function getRecentSearches(): RecentSearch[] {
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

import { describe, expect, it } from 'vitest'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from './recentSearches'

const entry = (ticker: string) => ({ ticker, name: `${ticker} Co`, path: `/company/${ticker}` })

describe('recent searches', () => {
  it('stores the most recent selection first', () => {
    addRecentSearch(entry('AAPL'))
    addRecentSearch(entry('MSFT'))
    expect(getRecentSearches().map(item => item.ticker)).toEqual(['MSFT', 'AAPL'])
  })

  it('dedupes by ticker, moving a reselected company to the front', () => {
    addRecentSearch(entry('AAPL'))
    addRecentSearch(entry('MSFT'))
    addRecentSearch(entry('AAPL'))
    expect(getRecentSearches().map(item => item.ticker)).toEqual(['AAPL', 'MSFT'])
  })

  it('caps the history at eight entries', () => {
    for (const ticker of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) addRecentSearch(entry(ticker))
    expect(getRecentSearches()).toHaveLength(8)
    expect(getRecentSearches()[0].ticker).toBe('J')
  })

  it('clears the whole history', () => {
    addRecentSearch(entry('AAPL'))
    clearRecentSearches()
    expect(getRecentSearches()).toEqual([])
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('open-floor-mvp-recent-searches', '{not json')
    expect(getRecentSearches()).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { retailPopularity, retailPopularityMeta } from './retailPopularity'
import { companyDirectory } from './companyDirectory'

// Guards the generated retail-popularity dataset (produced by
// scripts/import-retail-popularity.ts). If the CSV or directory drifts so a
// featured company no longer resolves, this fails loudly rather than shipping a
// broken Discover card.

describe('retailPopularity generated data', () => {
  it('has featured records', () => {
    expect(retailPopularity.length).toBeGreaterThan(0)
    expect(retailPopularity.every(record => record.isFeatured)).toBe(true)
  })

  it('every companyKey resolves to a directory company', () => {
    const keys = new Set(companyDirectory.map(entry => entry.key))
    for (const record of retailPopularity) {
      expect(keys.has(record.companyKey), `${record.companyKey} (rank ${record.featureRank}) is not in the directory`).toBe(true)
    }
  })

  it('is ordered by featureRank with no duplicate ranks', () => {
    const ranks = retailPopularity.map(record => record.featureRank)
    expect([...ranks]).toEqual([...ranks].sort((a, b) => a - b))
    expect(new Set(ranks).size).toBe(ranks.length)
  })

  it('features each company at most once (no duplicate companies)', () => {
    const keys = retailPopularity.map(record => record.companyKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('does not carry sensitive panel provenance fields in the client dataset', () => {
    const sensitive = ['panelOwnerCount', 'panelTrackedValueUsd', 'panelAvgPositionUsd', 'panelMarketSharePct', 'marketCapUsdMm']
    for (const record of retailPopularity) {
      for (const field of sensitive) {
        expect(record, `${field} must not be shipped to the client`).not.toHaveProperty(field)
      }
    }
  })

  it('exposes section-level source metadata', () => {
    expect(retailPopularityMeta.sourceName).toBeTruthy()
    expect(retailPopularityMeta.sourceAsOf).toBeTruthy()
  })
})

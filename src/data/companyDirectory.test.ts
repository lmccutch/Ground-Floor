import { describe, expect, it } from 'vitest'
import { normalizeSymbol } from '../lib/companyIdentity'
import { companyDirectory } from './companyDirectory'

describe('companyDirectory data integrity', () => {
  it('has a substantial, non-exhaustive curated set (roughly 180-230 companies)', () => {
    expect(companyDirectory.length).toBeGreaterThanOrEqual(150)
    expect(companyDirectory.length).toBeLessThanOrEqual(260)
  })

  it('has unique keys', () => {
    const keys = companyDirectory.map(entry => entry.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has exactly one primary security per company', () => {
    for (const entry of companyDirectory) {
      const primaryCount = entry.securities.filter(security => security.isPrimary).length
      expect(primaryCount, `${entry.key} should have exactly one primary security`).toBe(1)
    }
  })

  it('has no duplicate normalized ticker across the whole directory', () => {
    const seen = new Map<string, string>()
    for (const entry of companyDirectory) {
      for (const security of entry.securities) {
        const normalized = `${security.exchange}:${normalizeSymbol(security.symbol)}`
        const existingOwner = seen.get(normalized)
        expect(existingOwner, `${normalized} claimed by both ${existingOwner} and ${entry.key}`).toBeUndefined()
        seen.set(normalized, entry.key)
      }
    }
  })

  it('includes at least one dual-class company, one ADR, one former-ticker alias, and one no-campaign company', () => {
    expect(companyDirectory.some(entry => entry.securities.length > 1)).toBe(true)
    expect(companyDirectory.some(entry => entry.securities.some(security => security.isAdr))).toBe(true)
    expect(companyDirectory.some(entry => entry.aliases?.some(alias => alias.aliasType === 'former_ticker'))).toBe(true)
    expect(companyDirectory.some(entry => entry.seedNoCampaign)).toBe(true)
  })

  it('never stores an exact numeric market-cap value, only broad bands', () => {
    const validBands = new Set(['$300M-$1B', '$1B-$5B', '$5B-$25B', '$25B-$100B', 'Over $100B'])
    for (const entry of companyDirectory) {
      expect(validBands.has(entry.marketCapCategory), `${entry.key} has an invalid band: ${entry.marketCapCategory}`).toBe(true)
    }
  })
})

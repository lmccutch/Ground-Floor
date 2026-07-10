import { describe, expect, it } from 'vitest'
import { buildCompanySlug, normalizeName, normalizeSymbol } from './companyIdentity'

describe('normalizeSymbol', () => {
  it('treats dot, dash, and slash share-class separators as equal', () => {
    expect(normalizeSymbol('BRK.B')).toBe('BRK.B')
    expect(normalizeSymbol('BRK-B')).toBe('BRK.B')
    expect(normalizeSymbol('BRK/B')).toBe('BRK.B')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeSymbol('  aapl  ')).toBe('AAPL')
  })

  it('collapses repeated separators and strips leading/trailing dots', () => {
    expect(normalizeSymbol('-brk--b-')).toBe('BRK.B')
  })
})

describe('normalizeName', () => {
  it('lowercases and collapses internal whitespace', () => {
    expect(normalizeName('  SoFi   Technologies ')).toBe('sofi technologies')
  })
})

describe('buildCompanySlug', () => {
  it('produces a lowercase, hyphenated slug with a stable suffix', () => {
    const slug = buildCompanySlug('SoFi Technologies', 'sofi')
    expect(slug).toBe('sofi-technologies-sofi')
  })

  it('is deterministic for the same inputs', () => {
    expect(buildCompanySlug('Apple Inc.', 'apple')).toBe(buildCompanySlug('Apple Inc.', 'apple'))
  })

  it('strips punctuation', () => {
    expect(buildCompanySlug("McDonald's", 'mcd')).toBe('mcdonald-s-mcd')
  })
})

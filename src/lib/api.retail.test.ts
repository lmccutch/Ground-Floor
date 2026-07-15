import { beforeEach, describe, expect, it } from 'vitest'
import { getCompanyByTicker, getFeaturedRetailCompanies, startCampaign } from './api'

// Demo-mode coverage for the "Popular with Retail Investors" Discover section.
// vitest.config.ts unsets the Supabase env vars, so this exercises the same path
// a credential-less run uses.

beforeEach(() => {
  localStorage.clear()
})

describe('getFeaturedRetailCompanies (demo mode)', () => {
  it('returns featured companies ordered by feature rank, TSLA first', async () => {
    const { companies } = await getFeaturedRetailCompanies()
    expect(companies.length).toBeGreaterThan(10)
    expect(companies[0].ticker).toBe('TSLA')
    expect(companies[0].featureRank).toBe(1)
    const ranks = companies.map(company => company.featureRank)
    expect([...ranks]).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('features Alphabet once (GOOG/GOOGL collapsed) via its primary ticker', async () => {
    const { companies } = await getFeaturedRetailCompanies()
    const alphabet = companies.filter(company => company.name === 'Alphabet')
    expect(alphabet).toHaveLength(1)
    expect(alphabet[0].ticker).toBe('GOOGL')
  })

  it('every featured company links to a resolvable canonical company page', async () => {
    const { companies } = await getFeaturedRetailCompanies()
    // Spot-check a representative sample (resolving all would hit the whole directory).
    for (const company of [companies[0], companies[5], companies[companies.length - 1]]) {
      const lookup = await getCompanyByTicker(company.ticker)
      expect(lookup.company, `${company.ticker} should resolve`).not.toBeNull()
      expect(lookup.redirectTicker, `${company.ticker} should be a primary ticker`).toBeUndefined()
    }
  })

  it('reflects real campaign state: no fabricated supporters or campaigns', async () => {
    const { companies } = await getFeaturedRetailCompanies()
    expect(companies.every(company => company.hasCampaign === false)).toBe(true)
    expect(companies.every(company => company.supporters === 0 && company.questions === 0)).toBe(true)
  })

  it('joins real campaign metadata once a campaign is actually started', async () => {
    const tesla = await getCompanyByTicker('TSLA')
    await startCampaign(tesla.company!.id)
    const { companies } = await getFeaturedRetailCompanies()
    const teslaCard = companies.find(company => company.ticker === 'TSLA')
    expect(teslaCard?.hasCampaign).toBe(true)
  })

  it('returns section-level source metadata', async () => {
    const { meta } = await getFeaturedRetailCompanies()
    expect(meta.sourceName).toMatch(/Fintel/i)
    expect(meta.sourceAsOf).toBeTruthy()
  })

  it('respects the limit argument', async () => {
    const { companies } = await getFeaturedRetailCompanies(5)
    expect(companies).toHaveLength(5)
    expect(companies[0].featureRank).toBe(1)
  })
})

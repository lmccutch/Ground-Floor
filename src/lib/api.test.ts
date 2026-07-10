import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCampaign,
  getCompanyByTicker,
  requestCompany,
  searchCompanies,
  startCampaign,
} from './api'

// This suite runs in demo mode (vitest.config.ts unsets the Supabase env vars),
// so every assertion here exercises the same code path a credential-less
// contributor or CI run would use.

beforeEach(() => {
  localStorage.clear()
})

describe('getCompanyByTicker (demo mode)', () => {
  it('resolves an exact primary ticker with no redirect', async () => {
    const result = await getCompanyByTicker('AAPL')
    expect(result.company?.ticker).toBe('AAPL')
    expect(result.redirectTicker).toBeUndefined()
  })

  it('is case-insensitive', async () => {
    const result = await getCompanyByTicker('aapl')
    expect(result.company?.ticker).toBe('AAPL')
  })

  it('redirects a non-primary dual-class ticker to the primary one', async () => {
    const result = await getCompanyByTicker('GOOG')
    expect(result.company?.name).toBe('Alphabet')
    expect(result.redirectTicker).toBe('GOOGL')
  })

  it('resolving the redirect target again does not redirect again (no loop)', async () => {
    const first = await getCompanyByTicker('GOOG')
    expect(first.redirectTicker).toBe('GOOGL')
    const second = await getCompanyByTicker(first.redirectTicker!)
    expect(second.redirectTicker).toBeUndefined()
    expect(second.company?.ticker).toBe('GOOGL')
  })

  it('resolves a former ticker alias to the current primary ticker', async () => {
    const result = await getCompanyByTicker('FB')
    expect(result.company?.name).toBe('Meta Platforms')
    expect(result.redirectTicker).toBe('META')
  })

  it('returns null for an unknown ticker', async () => {
    const result = await getCompanyByTicker('ZZZZNOPE')
    expect(result.company).toBeNull()
    expect(result.redirectTicker).toBeUndefined()
  })
})

describe('searchCompanies (demo mode)', () => {
  it('ranks an exact ticker match first, ahead of name-based fuzzy matches', async () => {
    const results = await searchCompanies('SOFI')
    expect(results[0]?.ticker).toBe('SOFI')
  })

  it('is case-insensitive', async () => {
    const results = await searchCompanies('sofi')
    expect(results[0]?.ticker).toBe('SOFI')
  })

  it('finds a company by name prefix', async () => {
    const results = await searchCompanies('Microsoft')
    expect(results.some(result => result.ticker === 'MSFT')).toBe(true)
  })

  it('finds a company by a former ticker alias', async () => {
    const results = await searchCompanies('VIAC')
    expect(results.some(result => result.name === 'Paramount Global')).toBe(true)
  })

  it('never lets campaign engagement outrank an exact ticker match', async () => {
    // Support a well-known company's campaign so it has a high supporter count,
    // then confirm an exact-ticker search for a different company still wins.
    const netflixCampaign = await startCampaign('netflix')
    expect(netflixCampaign).not.toBeNull()
    const results = await searchCompanies('AAPL')
    expect(results[0]?.ticker).toBe('AAPL')
  })

  it('returns no results for an empty query', async () => {
    expect(await searchCompanies('')).toEqual([])
    expect(await searchCompanies('   ')).toEqual([])
  })
})

describe('on-demand campaign creation (demo mode)', () => {
  it('a company flagged seedNoCampaign has no campaign until started', async () => {
    const before = await getCampaign('datadog')
    expect(before).toBeNull()
    const created = await startCampaign('datadog')
    expect(created).not.toBeNull()
    expect(created?.companyId).toBe('datadog')
    const after = await getCampaign('datadog')
    expect(after?.id).toBe(created?.id)
  })

  it('starting a campaign twice does not create a duplicate (idempotent)', async () => {
    const first = await startCampaign('datadog')
    const second = await startCampaign('datadog')
    expect(second?.id).toBe(first?.id)
  })

  it('a non-seedNoCampaign company already has a plausible demo campaign', async () => {
    const campaign = await getCampaign('apple')
    expect(campaign).not.toBeNull()
    expect(campaign?.supporters).toBeGreaterThan(0)
    // No fabricated question content ships with a demo-seeded campaign.
    expect(campaign?.questions).toBe(0)
  })
})

describe('requestCompany matching (demo mode)', () => {
  it('matches an existing company by ticker instead of creating a duplicate request', async () => {
    const result = await requestCompany({
      name: 'Apple',
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      reason: 'Would like to see this company added to the directory for discussion.',
      shareholderStatus: 'Current shareholder',
      consent: true,
    })
    expect('matchedCompany' in result).toBe(true)
    if ('matchedCompany' in result) expect(result.matchedCompany.ticker).toBe('AAPL')
  })

  it('creates a request when no match exists', async () => {
    const result = await requestCompany({
      name: 'Totally Fictional Test Co',
      ticker: 'ZZZFAKE',
      exchange: 'NASDAQ',
      reason: 'This is a genuinely new company not in the directory yet.',
      shareholderStatus: 'Considering investing',
      consent: true,
    })
    expect('requestId' in result).toBe(true)
  })
})

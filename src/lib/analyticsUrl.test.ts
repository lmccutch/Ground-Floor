import { describe, expect, it } from 'vitest'
import { sanitizeAnalyticsUrl } from './analyticsUrl'

describe('sanitizeAnalyticsUrl', () => {
  it('keeps a clean path unchanged', () => {
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/discover')).toBe('https://open-floor.ca/discover')
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/company/AAPL')).toBe('https://open-floor.ca/company/AAPL')
  })

  it('strips query strings (including otherwise-harmless ones)', () => {
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/discover?q=tesla')).toBe('https://open-floor.ca/discover')
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/?utm_source=google&utm_campaign=x')).toBe('https://open-floor.ca/')
  })

  it('strips URL fragments', () => {
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/company/AAPL#question-42')).toBe('https://open-floor.ca/company/AAPL')
  })

  it('suppresses (returns null) magic-link tokens in the hash', () => {
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/#access_token=abc123&refresh_token=def&type=magiclink')).toBeNull()
  })

  it('suppresses PKCE / recovery auth params in the query', () => {
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/?code=oauthcode')).toBeNull()
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/reset?token_hash=abc&type=recovery')).toBeNull()
    expect(sanitizeAnalyticsUrl('https://open-floor.ca/?type=signup')).toBeNull()
  })

  it('returns null for invalid input rather than passing it through', () => {
    expect(sanitizeAnalyticsUrl('not a url')).toBeNull()
    expect(sanitizeAnalyticsUrl('')).toBeNull()
  })

  it('never returns a URL containing a query or fragment', () => {
    const result = sanitizeAnalyticsUrl('https://open-floor.ca/x?a=1#b')
    expect(result).not.toBeNull()
    expect(result).not.toContain('?')
    expect(result).not.toContain('#')
  })
})

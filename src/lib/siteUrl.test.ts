import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSiteUrl, isValidSiteUrl, resolveSiteUrl } from './siteUrl'

const PROD = 'https://open-floor.ca'
const LOCAL = 'http://localhost:5173'

describe('isValidSiteUrl', () => {
  it('accepts absolute http and https URLs', () => {
    expect(isValidSiteUrl(PROD)).toBe(true)
    expect(isValidSiteUrl(LOCAL)).toBe(true)
  })

  it('rejects the literal env-var name (the production bug)', () => {
    expect(isValidSiteUrl('VITE_SITE_URL')).toBe(false)
  })

  it('rejects empty, whitespace, and non-URL values', () => {
    expect(isValidSiteUrl('')).toBe(false)
    expect(isValidSiteUrl('   ')).toBe(false)
    expect(isValidSiteUrl(undefined)).toBe(false)
    expect(isValidSiteUrl(null)).toBe(false)
    expect(isValidSiteUrl('not a url')).toBe(false)
    expect(isValidSiteUrl('ftp://example.com')).toBe(false)
  })
})

describe('resolveSiteUrl (pure)', () => {
  it('resolves a configured URL', () => {
    expect(resolveSiteUrl(PROD, 'http://ignored')).toBe(PROD)
  })

  it('production URL resolves to https://open-floor.ca', () => {
    expect(resolveSiteUrl('https://open-floor.ca', LOCAL)).toBe(PROD)
  })

  it('local development URL resolves to http://localhost:5173', () => {
    expect(resolveSiteUrl(LOCAL, 'http://other')).toBe(LOCAL)
  })

  it('removes a single trailing slash', () => {
    expect(resolveSiteUrl('https://open-floor.ca/', LOCAL)).toBe(PROD)
  })

  it('removes multiple trailing slashes', () => {
    expect(resolveSiteUrl('https://open-floor.ca///', LOCAL)).toBe(PROD)
  })

  it('falls back to the origin when configured is missing', () => {
    expect(resolveSiteUrl(undefined, LOCAL)).toBe(LOCAL)
  })

  it('falls back to the origin when configured is the literal env-var name', () => {
    expect(resolveSiteUrl('VITE_SITE_URL', PROD)).toBe(PROD)
  })

  it('falls back to the origin when configured is not a valid URL', () => {
    expect(resolveSiteUrl('open-floor.ca', PROD)).toBe(PROD)
  })

  it('never returns the literal string "VITE_SITE_URL" for a configured literal', () => {
    // The env var (configured) is guarded; the origin comes from the browser and
    // is always a real URL, so it is trusted as the fallback.
    expect(resolveSiteUrl('VITE_SITE_URL', LOCAL)).not.toBe('VITE_SITE_URL')
    expect(resolveSiteUrl('VITE_SITE_URL', PROD)).toBe(PROD)
  })

  it('a resolved URL joined with a route never produces a double slash', () => {
    const base = resolveSiteUrl('https://open-floor.ca/', LOCAL)
    expect(`${base}/reset-password`).toBe('https://open-floor.ca/reset-password')
    expect(`${base}/auth/callback`).toBe('https://open-floor.ca/auth/callback')
  })
})

describe('getSiteUrl (reads env + window)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses a valid VITE_SITE_URL, normalized', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://open-floor.ca/')
    expect(getSiteUrl()).toBe(PROD)
  })

  it('resolves the local development value', () => {
    vi.stubEnv('VITE_SITE_URL', LOCAL)
    expect(getSiteUrl()).toBe(LOCAL)
  })

  it('falls back to window.location.origin when VITE_SITE_URL is unset', () => {
    vi.stubEnv('VITE_SITE_URL', '')
    expect(getSiteUrl()).toBe(window.location.origin.replace(/\/+$/, ''))
  })

  it('falls back to window.location.origin when VITE_SITE_URL is the literal name', () => {
    vi.stubEnv('VITE_SITE_URL', 'VITE_SITE_URL')
    expect(getSiteUrl()).toBe(window.location.origin.replace(/\/+$/, ''))
    expect(getSiteUrl()).not.toBe('VITE_SITE_URL')
  })
})

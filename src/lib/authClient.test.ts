import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuthRequestError,
  clearCooldown,
  clearRememberedEmail,
  COOLDOWN_KEY,
  DEFAULT_COOLDOWN_SECONDS,
  getCooldownRemainingSeconds,
  getRememberedEmail,
  normalizeEmail,
  parseRateLimit,
  rememberEmail,
  REMEMBERED_EMAIL_KEY,
  startCooldown,
} from './authClient'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('remembered email', () => {
  it('normalizes (trim + lowercase) before storing', () => {
    rememberEmail('  Investor@Example.COM  ')
    expect(localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBe('investor@example.com')
    expect(getRememberedEmail()).toBe('investor@example.com')
  })

  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  A@B.CO ')).toBe('a@b.co')
  })

  it('ignores invalid or empty values on write', () => {
    rememberEmail('not-an-email')
    rememberEmail('   ')
    expect(localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
    expect(getRememberedEmail()).toBeNull()
  })

  it('ignores (and cleans up) an invalid stored value on read', () => {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, 'garbage')
    expect(getRememberedEmail()).toBeNull()
    expect(localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
  })

  it('clears the remembered email', () => {
    rememberEmail('a@b.com')
    clearRememberedEmail()
    expect(getRememberedEmail()).toBeNull()
  })

  it('stores only a normalized email — never a token or secret', () => {
    rememberEmail('user@example.com')
    // The only stored key is the email key, and its value is exactly the email.
    expect(localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBe('user@example.com')
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)!
      expect(key).toBe(REMEMBERED_EMAIL_KEY)
      expect(localStorage.getItem(key)).not.toMatch(/eyJ|token|Bearer/i)
    }
  })
})

describe('cooldown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts a cooldown and persists the expiry in sessionStorage', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'))
    startCooldown(60)
    expect(sessionStorage.getItem(COOLDOWN_KEY)).not.toBeNull()
    expect(getCooldownRemainingSeconds()).toBe(60)
  })

  it('survives a simulated refresh (re-reads sessionStorage)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'))
    startCooldown(60)
    vi.advanceTimersByTime(10_000)
    // A "refresh" is just another read of the same sessionStorage value.
    expect(getCooldownRemainingSeconds()).toBe(50)
  })

  it('counts down and expires to 0, clearing the key', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'))
    startCooldown(3)
    expect(getCooldownRemainingSeconds()).toBe(3)
    vi.advanceTimersByTime(2_000)
    expect(getCooldownRemainingSeconds()).toBe(1)
    vi.advanceTimersByTime(2_000)
    expect(getCooldownRemainingSeconds()).toBe(0)
    expect(sessionStorage.getItem(COOLDOWN_KEY)).toBeNull()
  })

  it('falls back to the default when given invalid seconds', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T00:00:00Z'))
    startCooldown(0)
    expect(getCooldownRemainingSeconds()).toBe(DEFAULT_COOLDOWN_SECONDS)
  })

  it('clears the cooldown', () => {
    startCooldown(60)
    clearCooldown()
    expect(getCooldownRemainingSeconds()).toBe(0)
  })
})

describe('parseRateLimit', () => {
  it('detects HTTP 429', () => {
    expect(parseRateLimit({ status: 429, message: 'Too many requests' }).isRateLimited).toBe(true)
  })

  it('detects the over_email_send_rate_limit code', () => {
    expect(parseRateLimit({ code: 'over_email_send_rate_limit', message: 'nope' }).isRateLimited).toBe(true)
  })

  it('extracts the wait time from the Supabase message', () => {
    const info = parseRateLimit(new Error('For security purposes, you can only request this after 38 seconds.'))
    expect(info.isRateLimited).toBe(true)
    expect(info.retryAfterSeconds).toBe(38)
  })

  it('detects "rate limit" and "too many requests" phrasings', () => {
    expect(parseRateLimit(new Error('email rate limit exceeded')).isRateLimited).toBe(true)
    expect(parseRateLimit(new Error('Too Many Requests')).isRateLimited).toBe(true)
  })

  it('treats an ordinary error as not rate-limited', () => {
    const info = parseRateLimit(new Error('network down'))
    expect(info.isRateLimited).toBe(false)
    expect(info.retryAfterSeconds).toBeUndefined()
  })

  it('reads status/code carried by AuthRequestError', () => {
    const error = new AuthRequestError('For security purposes, you can only request this after 12 seconds.', {
      status: 429,
      code: 'over_email_send_rate_limit',
    })
    const info = parseRateLimit(error)
    expect(info.isRateLimited).toBe(true)
    expect(info.retryAfterSeconds).toBe(12)
    expect(error.status).toBe(429)
    expect(error.code).toBe('over_email_send_rate_limit')
  })
})

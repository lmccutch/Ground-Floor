import { describe, expect, it } from 'vitest'
import {
  GENERIC_AUTH_ERROR,
  isEmailIdentifier,
  mapUsernameError,
  validatePassword,
  validateUsername,
} from './authValidation'

describe('validateUsername', () => {
  it('accepts a valid username', () => {
    expect(validateUsername('quiet_investor7')).toBeNull()
    expect(validateUsername('abc')).toBeNull()
  })
  it('rejects too short / too long', () => {
    expect(validateUsername('ab')).toMatch(/at least 3/)
    expect(validateUsername('a'.repeat(31))).toMatch(/30 characters/)
  })
  it('requires starting with a letter or number', () => {
    expect(validateUsername('_abc')).toMatch(/start with a letter or number/)
  })
  it('rejects spaces and disallowed punctuation', () => {
    expect(validateUsername('bad name')).toBeTruthy()
    expect(validateUsername('no-hyphens')).toBeTruthy()
  })
  it('blocks reserved usernames case-insensitively (Luke vs luke style)', () => {
    expect(validateUsername('Admin')).toMatch(/reserved/)
    expect(validateUsername('openfloor')).toMatch(/reserved/)
  })
})

describe('validatePassword', () => {
  it('accepts a password of at least 10 characters', () => {
    expect(validatePassword('correcthorse')).toBeNull()
  })
  it('rejects passwords shorter than 10', () => {
    expect(validatePassword('short')).toMatch(/at least 10/)
  })
  it('rejects leading or trailing whitespace', () => {
    expect(validatePassword(' leadingspace9')).toMatch(/space/)
    expect(validatePassword('trailingspace9 ')).toMatch(/space/)
  })
})

describe('isEmailIdentifier', () => {
  it('treats a value with @ as an email, otherwise a username', () => {
    expect(isEmailIdentifier('person@example.com')).toBe(true)
    expect(isEmailIdentifier('person')).toBe(false)
  })
})

describe('generic auth error + username mapping', () => {
  it('generic error does not disclose which field was wrong', () => {
    const lower = GENERIC_AUTH_ERROR.toLowerCase()
    expect(lower).not.toMatch(/no such|not found|does not exist|missing/)
  })
  it('maps username RPC errors to friendly copy', () => {
    expect(mapUsernameError('username_taken')).toMatch(/taken/i)
    expect(mapUsernameError('username_reserved')).toMatch(/reserved/i)
    expect(mapUsernameError('invalid_username')).toMatch(/not valid/i)
    expect(mapUsernameError(undefined)).toBeTruthy()
  })
})

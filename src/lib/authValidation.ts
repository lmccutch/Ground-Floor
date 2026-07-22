// Pure, dependency-free validation + mapping helpers for the password-auth flow.
// Kept separate from api.ts so they can be unit-tested without a Supabase client
// and reused by both the auth pages and the sign-in modal. The database is always
// the source of truth (claim_username / username_available enforce the same
// rules server-side); these give immediate, accessible client-side feedback.

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
export const PASSWORD_MIN = 10

// Mirrors profiles_username_format_chk: 3–30 chars, begins with a letter/number,
// letters/numbers/underscore only.
const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9_]{2,29}$/

// Mirrors public.reserved_usernames (seed). The server list is authoritative and
// may grow; this is a fast-feedback subset.
export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'moderator', 'support', 'openfloor', 'open_floor',
  'open-floor', 'staff', 'security', 'privacy', 'legal', 'help', 'system', 'root', 'official',
]

/** Returns an error message, or null when the username is acceptable. */
export function validateUsername(raw: string): string | null {
  const u = raw.trim()
  if (u.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`
  if (u.length > USERNAME_MAX) return `Username must be ${USERNAME_MAX} characters or fewer.`
  if (!/^[A-Za-z0-9]/.test(u)) return 'Username must start with a letter or number.'
  if (!USERNAME_RE.test(u)) return 'Use only letters, numbers, and underscores — no spaces.'
  if (RESERVED_USERNAMES.includes(u.toLowerCase())) return 'That username is reserved.'
  return null
}

/** Returns an error message, or null when the password meets the policy. */
export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`
  if (pw !== pw.trim()) return 'Password cannot start or end with a space.'
  return null
}

/** An identifier is treated as an email when it contains "@" — otherwise a username. */
export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes('@')
}

export function looksLikeEmail(email: string): boolean {
  return /.+@.+\..+/.test(email.trim())
}

// One generic message for every authentication failure, so login never discloses
// whether an account/username exists or which field was wrong.
export const GENERIC_AUTH_ERROR = 'Incorrect username/email or password.'

/**
 * Maps a claim_username RPC error (whose message is the raised token, e.g.
 * "username_taken") to friendly copy. Falls back to a generic message.
 */
export function mapUsernameError(message: string | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('username_taken')) return 'That username is already taken.'
  if (m.includes('username_reserved')) return 'That username is reserved.'
  if (m.includes('invalid_username')) return 'That username is not valid.'
  return 'We could not reserve that username. Please try another.'
}

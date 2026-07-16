// Small, reusable client-side helpers for the magic-link sign-in experience:
//   - remembered email (localStorage) — a returning-user convenience only,
//   - magic-link cooldown (sessionStorage) — rate-limit UX that survives refresh,
//   - rate-limit error parsing — turns a Supabase auth error into UX-friendly info.
//
// All storage access is funnelled through the safe wrappers here so no component
// touches localStorage/sessionStorage directly, and everything degrades to a
// no-op in non-browser or storage-restricted environments (SSR, private mode).
//
// This never stores access tokens, magic-link tokens, or anything that could be
// mistaken for proof of identity — only a normalized email address for prefill.

export const REMEMBERED_EMAIL_KEY = 'openfloor:last_email'
export const COOLDOWN_KEY = 'openfloor:magic_link_cooldown_until'
export const DEFAULT_COOLDOWN_SECONDS = 60

/* ------------------------------ safe storage ------------------------------ */

type StorageKind = 'local' | 'session'

function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function readStorage(kind: StorageKind, key: string): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStorage(kind: StorageKind, key: string, value: string): void {
  try {
    getStorage(kind)?.setItem(key, value)
  } catch {
    // Ignore quota/access errors — these features are non-essential conveniences.
  }
}

function removeStorage(kind: StorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key)
  } catch {
    // Ignore.
  }
}

/* --------------------------- email normalization -------------------------- */

/** Trim + lowercase, matching how the address is stored and compared. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Mirrors the lightweight validation used by the sign-in form. */
export function looksLikeEmail(email: string): boolean {
  return /.+@.+\..+/.test(email.trim())
}

/* ----------------------------- remembered email --------------------------- */

/**
 * The email remembered on this device, or null. Invalid or empty stored values
 * are ignored (and cleaned up) rather than surfaced.
 */
export function getRememberedEmail(): string | null {
  const raw = readStorage('local', REMEMBERED_EMAIL_KEY)
  if (!raw) return null
  const normalized = normalizeEmail(raw)
  if (!looksLikeEmail(normalized)) {
    removeStorage('local', REMEMBERED_EMAIL_KEY)
    return null
  }
  return normalized
}

/** Stores the normalized email for faster future sign-in. No-op for invalid input. */
export function rememberEmail(email: string): void {
  const normalized = normalizeEmail(email)
  if (!looksLikeEmail(normalized)) return
  writeStorage('local', REMEMBERED_EMAIL_KEY, normalized)
}

export function clearRememberedEmail(): void {
  removeStorage('local', REMEMBERED_EMAIL_KEY)
}

/* -------------------------------- cooldown -------------------------------- */

/**
 * Starts (or extends) the magic-link cooldown, persisting the expiry timestamp
 * in sessionStorage so a page refresh cannot bypass it. Returns the expiry (ms).
 */
export function startCooldown(seconds: number = DEFAULT_COOLDOWN_SECONDS): number {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : DEFAULT_COOLDOWN_SECONDS
  const expiry = Date.now() + safeSeconds * 1000
  writeStorage('session', COOLDOWN_KEY, String(expiry))
  return expiry
}

/** Expiry timestamp in ms, or 0 when there is no active cooldown. */
export function getCooldownExpiry(): number {
  const raw = readStorage('session', COOLDOWN_KEY)
  if (!raw) return 0
  const expiry = Number(raw)
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    removeStorage('session', COOLDOWN_KEY)
    return 0
  }
  return expiry
}

/** Whole seconds remaining on the cooldown (0 when inactive). */
export function getCooldownRemainingSeconds(): number {
  const expiry = getCooldownExpiry()
  if (!expiry) return 0
  return Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
}

export function clearCooldown(): void {
  removeStorage('session', COOLDOWN_KEY)
}

/* --------------------------- rate-limit parsing --------------------------- */

/** Auth error that preserves the Supabase HTTP status and error code. */
export class AuthRequestError extends Error {
  status?: number
  code?: string
  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message)
    this.name = 'AuthRequestError'
    this.status = options?.status
    this.code = options?.code
  }
}

export type RateLimitInfo = {
  isRateLimited: boolean
  /** Remaining wait extracted from the Supabase message, when present. */
  retryAfterSeconds?: number
}

function errorStatus(error: unknown): number | undefined {
  const value = (error as { status?: unknown })?.status
  return typeof value === 'number' ? value : undefined
}

function errorCode(error: unknown): string | undefined {
  const value = (error as { code?: unknown })?.code
  return typeof value === 'string' ? value : undefined
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

/**
 * Classifies an auth error as a rate-limit (or not) and extracts the wait time.
 * Detects HTTP 429, the `over_email_send_rate_limit` code, and the common
 * Supabase rate-limit phrasings.
 */
export function parseRateLimit(error: unknown): RateLimitInfo {
  const status = errorStatus(error)
  const code = errorCode(error)
  const message = errorMessage(error)
  const lower = message.toLowerCase()

  const isRateLimited =
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    lower.includes('for security purposes') ||
    lower.includes('only request this after') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')

  const match = message.match(/(\d+)\s*second/i)
  const retryAfterSeconds = match ? Number(match[1]) : undefined

  return { isRateLimited, retryAfterSeconds }
}

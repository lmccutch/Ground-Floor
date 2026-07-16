// Centralized, production-safe resolver for the app's public site URL. Used for
// every auth redirect (magic-link email redirect) and for canonical link tags.
//
// Why this exists: the production magic-link request was sending the literal
// string "VITE_SITE_URL" as redirect_to. The source always read
// import.meta.env.VITE_SITE_URL (never a literal), so the cause was a
// misconfigured build-time env var (set to its own name, or unset). This module
// makes the resolution robust regardless of that misconfiguration: it rejects the
// literal name and any non-URL value, falls back to the runtime origin, and
// strips trailing slashes so appended routes never double up.

const LITERAL_ENV_NAME = 'VITE_SITE_URL'

export class SiteUrlConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteUrlConfigError'
  }
}

/**
 * True only for a usable absolute http(s) URL. Rejects empty values and — the
 * crux of the production bug — the literal string "VITE_SITE_URL" that an
 * env-var name accidentally set as its own value produces.
 */
export function isValidSiteUrl(value: string | undefined | null): value is string {
  if (!value) return false
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === LITERAL_ENV_NAME) return false
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Removes trailing slashes so `${siteUrl}/path` never yields a double slash. */
function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * Pure resolver, kept separate from the env/window-reading getSiteUrl() below so
 * the logic can be unit-tested against arbitrary inputs. A valid configured URL
 * always wins; otherwise the runtime origin is used. The result never contains a
 * trailing slash and is never the literal "VITE_SITE_URL".
 */
export function resolveSiteUrl(configured: string | undefined | null, origin: string | undefined | null): string {
  const configuredValid = isValidSiteUrl(configured) ? configured.trim() : undefined
  return stripTrailingSlashes(configuredValid || origin || '')
}

/**
 * The resolved site URL for this runtime. Reads VITE_SITE_URL (the configured
 * production origin, e.g. https://open-floor.ca) and falls back to
 * window.location.origin (e.g. http://localhost:5173 in dev). Always returns a
 * normalized absolute URL with no trailing slash — never the literal env-var
 * name and never a broken redirect target.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  return resolveSiteUrl(configured, origin)
}

/**
 * Startup validation. In production a missing/invalid VITE_SITE_URL means auth
 * redirects fall back to the runtime origin. That is usually correct (the app is
 * served from its production domain), so this does not brick the app — but it is
 * a real misconfiguration, so surface it loudly and actionably rather than
 * silently. Throws only in the impossible case where there is no usable URL at
 * all (no valid config AND no runtime origin), where a broken redirect would
 * otherwise be sent.
 */
export function assertSiteUrlConfig(): void {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  if (!import.meta.env.PROD || isValidSiteUrl(configured)) return

  const message =
    `VITE_SITE_URL is missing or invalid (received ${JSON.stringify(configured ?? null)}). ` +
    `Set it to the production origin (e.g. https://open-floor.ca) in the Vercel environment — ` +
    `it is used verbatim as the auth magic-link redirect. ` +
    (origin ? `Falling back to ${origin} for now.` : 'No runtime origin is available to fall back to.')

  console.error(`[siteUrl] ${message}`)
  if (!origin) throw new SiteUrlConfigError(message)
}

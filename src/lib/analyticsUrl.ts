// Sanitizes URLs before they reach Vercel Web Analytics. Vercel is used for
// aggregate traffic only (path-level page views), so query strings and URL
// fragments — which can carry auth tokens and other private data — must never be
// sent. The magic-link flow in particular returns to the site root with the
// Supabase token in the URL hash (and, for PKCE, a `code` query param), so those
// must be stripped, and token-bearing page views suppressed entirely.

// Parameter names (query or hash) that indicate an auth/recovery flow. When any
// is present, the page view is suppressed rather than merely stripped.
const AUTH_SENSITIVE_PARAMS = [
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'token',
  'token_hash',
  'code',
  'otp',
  'error_code',
]

function hasAuthSensitiveData(search: string, hash: string): boolean {
  const haystacks = [search, hash.replace(/^#/, '')]
  for (const raw of haystacks) {
    if (!raw) continue
    const params = new URLSearchParams(raw.replace(/^[?#]/, ''))
    for (const name of AUTH_SENSITIVE_PARAMS) {
      if (params.has(name)) return true
    }
    // `type=recovery|magiclink|signup|invite` appears alongside Supabase auth links.
    const type = params.get('type')
    if (type && ['recovery', 'magiclink', 'signup', 'invite', 'email_change'].includes(type)) return true
  }
  return false
}

/**
 * Returns a path-only URL safe for aggregate analytics (origin + pathname, no
 * query, no fragment), or `null` to suppress the page view when the URL carries
 * auth/recovery data. Invalid input is dropped (returns null) rather than passed
 * through.
 */
export function sanitizeAnalyticsUrl(input: string): string | null {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  if (hasAuthSensitiveData(url.search, url.hash)) return null
  // Drop everything after the path: no query string, no fragment.
  return `${url.origin}${url.pathname}`
}

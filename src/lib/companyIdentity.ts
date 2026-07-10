// Shared identity helpers used by demo-mode search, the Supabase search_companies
// RPC's client-side equivalent, the company-directory dataset, and the bootstrap
// generator — kept in one place so ticker/name normalization can never drift
// between the app and the SQL it produces.

/**
 * Canonicalizes a ticker/symbol so that share-class notations are treated as
 * equal regardless of separator: BRK.B, BRK-B, and BRK/B all normalize to BRK.B.
 */
export function normalizeSymbol(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/[-/]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Slugifies a company's display name into a lowercase, hyphenated form. */
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Builds a stable, human-readable canonical slug: name + a short id fragment. */
export function buildCompanySlug(name: string, id: string): string {
  const fragment = id.replace(/-/g, '').slice(0, 6)
  return `${slugifyName(name)}-${fragment}`
}

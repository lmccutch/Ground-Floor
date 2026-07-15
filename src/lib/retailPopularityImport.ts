// Pure resolver for the "Popular with Retail Investors" CSV import. It parses and
// validates the curated CSV, normalizes tickers, matches each row against the
// canonical company directory (reusing the same identity helpers as search and
// the bootstrap generator), and collapses multi-security companies to a single
// featured record. It never touches the filesystem, a database, or the network,
// so it is safe to import from both the Node import script and unit tests.
//
// Source & methodology: the CSV is a point-in-time snapshot of a third-party
// linked-broker investor panel's most-widely-held list. It is NOT total retail
// ownership, and this module performs no live lookups of any kind.

// Explicit .ts extensions: this module is shared with the Node import script,
// which typechecks under nodenext resolution (see scripts/*.ts for the same
// convention). The bundler/vitest also resolve these.
import { companyDirectory, type DirectoryCompany, type DirectorySecurity } from '../data/companyDirectory.ts'
import { normalizeSymbol } from './companyIdentity.ts'

/** Columns the CSV must contain (order-independent). */
export const RETAIL_CSV_COLUMNS = [
  'feature_rank',
  'fintel_source_rank',
  'ticker',
  'company_name',
  'market_cap_usd_mm',
  'fintel_panel_market_share_pct',
  'fintel_panel_avg_position_usd',
  'fintel_panel_owner_count',
  'fintel_panel_tracked_value_usd',
  'source_name',
  'source_url',
  'source_as_of',
  'ranking_method',
  'is_featured',
] as const

export type RawRetailRow = Record<string, string>

/** A CSV row resolved to a canonical directory company, ready to persist. */
export type ResolvedRetailRecord = {
  featureRank: number
  sourceRank: number | null
  /** Directory key — the demo-mode/company upsert identity. */
  companyKey: string
  /** Canonical symbol the source ranked (e.g. GOOGL, GOOG, BRK.B). */
  matchedTicker: string
  matchedNormalizedSymbol: string
  matchedExchange: string
  matchedIsPrimary: boolean
  /** The company's primary security — what its canonical page and card link use. */
  primaryTicker: string
  primaryExchange: string
  displayName: string
  sourceName: string
  sourceUrl: string | null
  sourceAsOf: string | null
  rankingMethod: string | null
  marketCapUsdMm: number | null
  panelMarketSharePct: number | null
  panelAvgPositionUsd: number | null
  panelOwnerCount: number | null
  panelTrackedValueUsd: number | null
  isFeatured: boolean
}

export type RowIssue = { line: number; ticker: string; reason: string }

export type ResolveResult = {
  /** Deduped featured records, sorted by featureRank ascending. */
  records: ResolvedRetailRecord[]
  totalRows: number
  /** Featured rows that resolved to a company (includes rows later merged as duplicates). */
  matched: number
  /** Unique featured companies in `records`. */
  featured: number
  /** Rows merged into a company already featured by a better (lower) rank. */
  duplicates: RowIssue[]
  /** Rows explicitly not featured (is_featured = FALSE). */
  skipped: RowIssue[]
  /** Rows that were invalid or could not be resolved to a company. */
  failed: RowIssue[]
  summary: string
}

/* ------------------------------- CSV parsing ------------------------------- */

/** Minimal RFC-4180 field splitter: honors double-quoted fields and "" escapes. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(field)
      field = ''
    } else {
      field += char
    }
  }
  fields.push(field)
  return fields
}

/**
 * Parses CSV text into header-keyed row objects. Throws (with a clear message)
 * when the header is missing required columns — the import should fail loudly
 * rather than silently produce an empty ranking.
 */
export function parseRetailCsv(text: string): RawRetailRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '')
  if (lines.length === 0) throw new Error('CSV is empty.')

  const header = splitCsvLine(lines[0]).map(column => column.trim())
  const missing = RETAIL_CSV_COLUMNS.filter(column => !header.includes(column))
  if (missing.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missing.join(', ')}.`)
  }

  return lines.slice(1).map(line => {
    const values = splitCsvLine(line)
    const row: RawRetailRow = {}
    header.forEach((column, index) => {
      row[column] = (values[index] ?? '').trim()
    })
    return row
  })
}

/* ------------------------------- matching --------------------------------- */

type SecurityMatch = { entry: DirectoryCompany; security: DirectorySecurity }

function primarySecurityOf(entry: DirectoryCompany): DirectorySecurity {
  return entry.securities.find(security => security.isPrimary) ?? entry.securities[0]
}

/**
 * Builds a normalized-symbol → company/security index from the directory. Active
 * securities win over former-ticker aliases, so a symbol reused as both never
 * mis-resolves to a defunct alias.
 */
function buildTickerIndex(directory: DirectoryCompany[]): Map<string, SecurityMatch> {
  const index = new Map<string, SecurityMatch>()
  for (const entry of directory) {
    for (const security of entry.securities) {
      const key = normalizeSymbol(security.symbol)
      if (key && !index.has(key)) index.set(key, { entry, security })
    }
  }
  for (const entry of directory) {
    for (const alias of entry.aliases ?? []) {
      if (alias.aliasType !== 'former_ticker') continue
      const key = normalizeSymbol(alias.alias)
      // A former ticker points at the company; the current primary security is
      // used for the primary-ticker/exchange fields.
      if (key && !index.has(key)) index.set(key, { entry, security: primarySecurityOf(entry) })
    }
  }
  return index
}

/* ------------------------------ validation -------------------------------- */

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function parseNumOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBool(value: string): boolean | null {
  const normalized = value.trim().toLowerCase()
  if (['true', 't', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', 'f', '0', 'no', 'n'].includes(normalized)) return false
  return null
}

/* ------------------------------- resolving -------------------------------- */

/**
 * Resolves parsed CSV rows to canonical company records. Deterministic and
 * idempotent: the same input always yields the same output, so the import is
 * safe to rerun. Never throws on bad rows — they are collected into `failed`.
 */
export function resolveRetailRows(rows: RawRetailRow[], directory: DirectoryCompany[] = companyDirectory): ResolveResult {
  const index = buildTickerIndex(directory)
  const byCompany = new Map<string, ResolvedRetailRecord>()
  const duplicates: RowIssue[] = []
  const skipped: RowIssue[] = []
  const failed: RowIssue[] = []
  let matched = 0

  rows.forEach((row, rowIndex) => {
    const line = rowIndex + 2 // 1-based, +1 for the header row
    const rawTicker = (row.ticker ?? '').trim()

    const featureRank = parseIntOrNull(row.feature_rank ?? '')
    if (featureRank === null || featureRank <= 0) {
      failed.push({ line, ticker: rawTicker, reason: `invalid feature_rank "${row.feature_rank ?? ''}"` })
      return
    }
    if (rawTicker === '') {
      failed.push({ line, ticker: rawTicker, reason: 'missing ticker' })
      return
    }
    if ((row.source_name ?? '').trim() === '') {
      failed.push({ line, ticker: rawTicker, reason: 'missing source_name' })
      return
    }

    const isFeatured = parseBool(row.is_featured ?? '')
    if (isFeatured === null) {
      failed.push({ line, ticker: rawTicker, reason: `invalid is_featured "${row.is_featured ?? ''}"` })
      return
    }
    if (!isFeatured) {
      skipped.push({ line, ticker: rawTicker, reason: 'is_featured = FALSE' })
      return
    }

    const normalized = normalizeSymbol(rawTicker)
    const found = index.get(normalized)
    if (!found) {
      failed.push({ line, ticker: rawTicker, reason: 'no matching company/security in the directory' })
      return
    }

    matched += 1
    const primary = primarySecurityOf(found.entry)
    const record: ResolvedRetailRecord = {
      featureRank,
      sourceRank: parseIntOrNull(row.fintel_source_rank ?? ''),
      companyKey: found.entry.key,
      matchedTicker: found.security.symbol,
      matchedNormalizedSymbol: normalizeSymbol(found.security.symbol),
      matchedExchange: found.security.exchange,
      matchedIsPrimary: Boolean(found.security.isPrimary),
      primaryTicker: primary.symbol,
      primaryExchange: primary.exchange,
      displayName: found.entry.displayName,
      sourceName: (row.source_name ?? '').trim(),
      sourceUrl: (row.source_url ?? '').trim() || null,
      sourceAsOf: (row.source_as_of ?? '').trim() || null,
      rankingMethod: (row.ranking_method ?? '').trim() || null,
      marketCapUsdMm: parseNumOrNull(row.market_cap_usd_mm ?? ''),
      panelMarketSharePct: parseNumOrNull(row.fintel_panel_market_share_pct ?? ''),
      panelAvgPositionUsd: parseNumOrNull(row.fintel_panel_avg_position_usd ?? ''),
      panelOwnerCount: parseIntOrNull(row.fintel_panel_owner_count ?? ''),
      panelTrackedValueUsd: parseNumOrNull(row.fintel_panel_tracked_value_usd ?? ''),
      isFeatured: true,
    }

    // Collapse multiple securities of one company (e.g. GOOGL + GOOG, or BRK.B
    // resolving to Berkshire) to a single featured entry — the best (lowest) rank.
    const existing = byCompany.get(record.companyKey)
    if (!existing) {
      byCompany.set(record.companyKey, record)
      return
    }
    if (record.featureRank < existing.featureRank) {
      duplicates.push({ line, ticker: existing.matchedTicker, reason: `duplicate of ${record.companyKey}; superseded by rank ${record.featureRank}` })
      byCompany.set(record.companyKey, record)
    } else {
      duplicates.push({ line, ticker: rawTicker, reason: `duplicate of ${record.companyKey} (already featured at rank ${existing.featureRank})` })
    }
  })

  const records = [...byCompany.values()].sort((a, b) => a.featureRank - b.featureRank)
  const summary =
    `${rows.length} row(s) read · ${matched} matched · ${records.length} featured company(ies) · ` +
    `${duplicates.length} duplicate(s) merged · ${skipped.length} not featured · ${failed.length} failed`

  return {
    records,
    totalRows: rows.length,
    matched,
    featured: records.length,
    duplicates,
    skipped,
    failed,
    summary,
  }
}

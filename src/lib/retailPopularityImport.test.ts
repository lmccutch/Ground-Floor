import { describe, expect, it } from 'vitest'
import { parseRetailCsv, resolveRetailRows, RETAIL_CSV_COLUMNS } from './retailPopularityImport'

// These tests run against the real curated company directory (demo-mode path), so
// they exercise the same matching a credential-less contributor or CI run uses.

const HEADER = RETAIL_CSV_COLUMNS.join(',')

type RowOverrides = Partial<Record<(typeof RETAIL_CSV_COLUMNS)[number], string>>

function csvRow(overrides: RowOverrides): string {
  const defaults: Record<(typeof RETAIL_CSV_COLUMNS)[number], string> = {
    feature_rank: '1',
    fintel_source_rank: '1',
    ticker: 'MSFT',
    company_name: 'Microsoft Corporation',
    market_cap_usd_mm: '1000',
    fintel_panel_market_share_pct: '0.5',
    fintel_panel_avg_position_usd: '1000',
    fintel_panel_owner_count: '10',
    fintel_panel_tracked_value_usd: '10000',
    source_name: 'Fintel Retail Ownership',
    source_url: 'https://fintel.io/sro',
    source_as_of: '2026-07-15',
    ranking_method: 'Fintel linked-broker panel rank',
    is_featured: 'TRUE',
  }
  return RETAIL_CSV_COLUMNS.map(column => {
    const value = overrides[column] ?? defaults[column]
    // Quote values that contain commas so the parser round-trips them.
    return value.includes(',') ? `"${value}"` : value
  }).join(',')
}

function csv(...rows: RowOverrides[]): string {
  return [HEADER, ...rows.map(csvRow)].join('\n')
}

describe('parseRetailCsv', () => {
  it('parses a quoted field containing commas', () => {
    const rows = parseRetailCsv(csv({ ticker: 'MSFT', company_name: 'Microsoft, Inc.', ranking_method: 'a, b, c' }))
    expect(rows).toHaveLength(1)
    expect(rows[0].company_name).toBe('Microsoft, Inc.')
    expect(rows[0].ranking_method).toBe('a, b, c')
  })

  it('throws when a required column is missing', () => {
    const badHeader = RETAIL_CSV_COLUMNS.filter(column => column !== 'ticker').join(',')
    expect(() => parseRetailCsv(`${badHeader}\n1,1`)).toThrow(/missing required column/i)
  })
})

describe('resolveRetailRows — matching', () => {
  it('matches an existing company by its primary ticker', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'MSFT', feature_rank: '1' })))
    expect(result.failed).toHaveLength(0)
    expect(result.records).toHaveLength(1)
    expect(result.records[0].companyKey).toBe('microsoft')
    expect(result.records[0].primaryTicker).toBe('MSFT')
  })

  it('matches a company added for the retail beta (TSLA)', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'TSLA', feature_rank: '1' })))
    expect(result.records[0].companyKey).toBe('tesla')
  })

  it('normalizes ticker separators (brk-b, brk.b) to the same company', () => {
    const dash = resolveRetailRows(parseRetailCsv(csv({ ticker: 'brk-b' })))
    const dot = resolveRetailRows(parseRetailCsv(csv({ ticker: 'BRK.B' })))
    expect(dash.records[0].companyKey).toBe('berkshire-hathaway')
    expect(dot.records[0].companyKey).toBe('berkshire-hathaway')
    expect(dash.records[0].matchedNormalizedSymbol).toBe('BRK.B')
  })

  it('resolves a non-primary (dual-class) security to its company', () => {
    const goog = resolveRetailRows(parseRetailCsv(csv({ ticker: 'GOOG', feature_rank: '40' })))
    expect(goog.records[0].companyKey).toBe('alphabet')
    expect(goog.records[0].matchedIsPrimary).toBe(false)
    // The card/link still uses the company's primary ticker.
    expect(goog.records[0].primaryTicker).toBe('GOOGL')
  })

  it('BRK.B resolves to Berkshire and records the primary ticker for linking', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'BRK.B', feature_rank: '55' })))
    expect(result.records[0].companyKey).toBe('berkshire-hathaway')
    expect(result.records[0].matchedTicker).toBe('BRK.B')
    expect(result.records[0].primaryTicker).toBe('BRK.A')
  })
})

describe('resolveRetailRows — dedupe and validation', () => {
  it('collapses GOOG + GOOGL into one Alphabet entry, keeping the best rank', () => {
    const result = resolveRetailRows(
      parseRetailCsv(csv({ ticker: 'GOOGL', feature_rank: '13' }, { ticker: 'GOOG', feature_rank: '40' })),
    )
    const alphabet = result.records.filter(record => record.companyKey === 'alphabet')
    expect(alphabet).toHaveLength(1)
    expect(alphabet[0].featureRank).toBe(13)
    expect(result.duplicates).toHaveLength(1)
    expect(result.matched).toBe(2)
    expect(result.featured).toBe(1)
  })

  it('keeps the best rank regardless of row order', () => {
    const result = resolveRetailRows(
      parseRetailCsv(csv({ ticker: 'GOOG', feature_rank: '40' }, { ticker: 'GOOGL', feature_rank: '13' })),
    )
    expect(result.records.filter(record => record.companyKey === 'alphabet')[0].featureRank).toBe(13)
    expect(result.duplicates).toHaveLength(1)
  })

  it('prevents duplicate company records when the same ticker appears twice', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'MSFT', feature_rank: '2' }, { ticker: 'MSFT', feature_rank: '9' })))
    expect(result.records.filter(record => record.companyKey === 'microsoft')).toHaveLength(1)
    expect(result.duplicates).toHaveLength(1)
  })

  it('reports invalid rows without throwing, and keeps valid ones', () => {
    const result = resolveRetailRows(
      parseRetailCsv(csv({ ticker: 'MSFT', feature_rank: 'abc' }, { ticker: '', feature_rank: '2' }, { ticker: 'AAPL', feature_rank: '3' })),
    )
    expect(result.failed).toHaveLength(2)
    expect(result.records).toHaveLength(1)
    expect(result.records[0].companyKey).toBe('apple')
  })

  it('reports an unresolved ticker as failed rather than inventing a company', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'ZZZZNOPE', feature_rank: '1' })))
    expect(result.records).toHaveLength(0)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].reason).toMatch(/no matching company/i)
  })

  it('skips rows explicitly marked not featured', () => {
    const result = resolveRetailRows(parseRetailCsv(csv({ ticker: 'MSFT', is_featured: 'FALSE' })))
    expect(result.records).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
  })

  it('is idempotent: resolving the same input twice yields identical records', () => {
    const input = parseRetailCsv(csv({ ticker: 'MSFT', feature_rank: '1' }, { ticker: 'AAPL', feature_rank: '2' }))
    expect(resolveRetailRows(input).records).toEqual(resolveRetailRows(input).records)
  })
})

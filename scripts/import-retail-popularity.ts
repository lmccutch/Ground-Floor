// Imports the curated "Popular with Retail Investors" CSV into two generated,
// committed artifacts:
//
//   1. src/data/retailPopularity.ts        — public-safe featured ranking used by
//                                             demo/test mode and the client bundle.
//   2. supabase/seed/<date>_retail_popularity.sql — idempotent upsert applied to a
//                                             Supabase project by an admin/service role.
//
// Like scripts/generate-company-bootstrap.ts, this script ONLY reads a local CSV
// and WRITES files. It never connects to a database, reads credentials, scrapes,
// or runs automatically (not in `build`, not in a migration, not on app startup).
// Run it manually: `npm run retail:import [path/to.csv]`. It is safe to rerun —
// output is deterministic and the SQL is an upsert.
//
// Rows are matched against the canonical company directory. If any featured row
// cannot be resolved to a company, the script FAILS (non-zero exit) and lists the
// tickers, unless `--skip-unresolved` is passed (then it excludes and logs them).
// Resolve failures by adding the company to src/data/companyDirectory.ts (the
// approved company-bootstrap pattern) and rerunning.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRetailCsv, resolveRetailRows, type ResolvedRetailRecord } from '../src/lib/retailPopularityImport.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const DEFAULT_CSV = 'groundfloor_popular_retail_stocks_fintel_2026-07-15.csv'

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}
function sqlNullableString(value: string | null): string {
  return value === null ? 'null' : sqlString(value)
}
function sqlNumber(value: number | null): string {
  return value === null ? 'null' : String(value)
}
function sqlDate(value: string | null): string {
  return value === null ? 'null' : `${sqlString(value)}::date`
}

/* ------------------------ generated TS (client-safe) ---------------------- */

function generateDataModule(records: ResolvedRetailRecord[]): string {
  const meta = records[0]
  const rows = records
    .map(
      record =>
        `  { featureRank: ${record.featureRank}, companyKey: ${JSON.stringify(record.companyKey)}, ` +
        `primaryTicker: ${JSON.stringify(record.primaryTicker)}, matchedTicker: ${JSON.stringify(record.matchedTicker)}, isFeatured: true },`,
    )
    .join('\n')

  return `// GENERATED FILE — do not hand-edit.
// Produced by scripts/import-retail-popularity.ts from the curated retail CSV.
// Re-run \`npm run retail:import\` to regenerate.
//
// Public-safe fields ONLY. The panel provenance columns (owner count, tracked
// value, average position, market-cap) are deliberately NOT included here — they
// live only in the SQL seed / database and are never shipped to the client. See
// docs/popular-with-retail.md.

export type RetailPopularityRecord = {
  /** Display order for the beta. */
  featureRank: number
  /** Canonical company directory key. */
  companyKey: string
  /** The company's primary ticker — what its canonical page/card link use. */
  primaryTicker: string
  /** The specific ticker the source ranked (e.g. GOOGL, BRK.B). Provenance only. */
  matchedTicker: string
  isFeatured: boolean
}

export type RetailPopularityMeta = {
  sourceName: string
  sourceUrl: string | null
  sourceAsOf: string | null
}

export const retailPopularityMeta: RetailPopularityMeta = {
  sourceName: ${JSON.stringify(meta?.sourceName ?? '')},
  sourceUrl: ${JSON.stringify(meta?.sourceUrl ?? null)},
  sourceAsOf: ${JSON.stringify(meta?.sourceAsOf ?? null)},
}

export const retailPopularity: RetailPopularityRecord[] = [
${rows}
]
`
}

/* ---------------------------- generated SQL ------------------------------- */

function sqlStatement(record: ResolvedRetailRecord): string {
  return (
    `-- #${record.featureRank} ${record.displayName} (${record.matchedTicker})\n` +
    `insert into public.company_retail_popularity (\n` +
    `  company_id, security_id, feature_rank, source_rank, source_name, source_url, source_as_of,\n` +
    `  panel_market_share_pct, panel_avg_position_usd, panel_owner_count, panel_tracked_value_usd,\n` +
    `  market_cap_usd_mm, ranking_method, is_featured)\n` +
    `select c.id, s.id, ${record.featureRank}, ${sqlNumber(record.sourceRank)}, ${sqlString(record.sourceName)}, ` +
    `${sqlNullableString(record.sourceUrl)}, ${sqlDate(record.sourceAsOf)},\n` +
    `  ${sqlNumber(record.panelMarketSharePct)}, ${sqlNumber(record.panelAvgPositionUsd)}, ${sqlNumber(record.panelOwnerCount)}, ${sqlNumber(record.panelTrackedValueUsd)},\n` +
    `  ${sqlNumber(record.marketCapUsdMm)}, ${sqlNullableString(record.rankingMethod)}, true\n` +
    `from public.companies c\n` +
    `left join public.securities s on s.exchange = ${sqlString(record.matchedExchange)} and s.normalized_symbol = ${sqlString(record.matchedNormalizedSymbol)} and s.is_active\n` +
    `where c.ticker = ${sqlString(record.primaryTicker)} and c.exchange = ${sqlString(record.primaryExchange)}\n` +
    `on conflict (company_id) do update set\n` +
    `  security_id = excluded.security_id, feature_rank = excluded.feature_rank, source_rank = excluded.source_rank,\n` +
    `  source_name = excluded.source_name, source_url = excluded.source_url, source_as_of = excluded.source_as_of,\n` +
    `  panel_market_share_pct = excluded.panel_market_share_pct, panel_avg_position_usd = excluded.panel_avg_position_usd,\n` +
    `  panel_owner_count = excluded.panel_owner_count, panel_tracked_value_usd = excluded.panel_tracked_value_usd,\n` +
    `  market_cap_usd_mm = excluded.market_cap_usd_mm, ranking_method = excluded.ranking_method,\n` +
    `  is_featured = excluded.is_featured, updated_at = now();`
  )
}

function generateSql(records: ResolvedRetailRecord[]): string {
  return `-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/import-retail-popularity.ts from the curated retail CSV.
-- Re-run \`npm run retail:import\` to regenerate.
--
-- Upserts featured retail-popularity rows. Safe to re-run: every statement is an
-- upsert keyed on company_id. A row inserts nothing if its company has not been
-- bootstrapped yet (apply the company-directory bootstrap first). Apply this file
-- to a Supabase project manually as an admin/service role — it is never run
-- automatically. Requires migration 202607150001_retail_popularity.sql.
--
-- Featured companies: ${records.length}
-- Generated: ${new Date().toISOString().slice(0, 10)}

begin;

${records.map(sqlStatement).join('\n\n')}

commit;
`
}

/* --------------------------------- main ----------------------------------- */

function main() {
  const args = process.argv.slice(2)
  const skipUnresolved = args.includes('--skip-unresolved')
  const csvArg = args.find(arg => !arg.startsWith('--'))
  const csvPath = csvArg ? resolve(process.cwd(), csvArg) : join(repoRoot, DEFAULT_CSV)

  console.log(`Reading CSV: ${csvPath}`)
  const text = readFileSync(csvPath, 'utf8')
  const rows = parseRetailCsv(text)
  const result = resolveRetailRows(rows)

  console.log('\n=== Import summary ===')
  console.log(result.summary)

  if (result.duplicates.length > 0) {
    console.log(`\nMerged duplicates (same company, multiple securities):`)
    for (const issue of result.duplicates) console.log(`  line ${issue.line} ${issue.ticker}: ${issue.reason}`)
  }
  if (result.skipped.length > 0) {
    console.log(`\nSkipped (not featured):`)
    for (const issue of result.skipped) console.log(`  line ${issue.line} ${issue.ticker}: ${issue.reason}`)
  }
  if (result.failed.length > 0) {
    console.log(`\nFAILED / unresolved rows:`)
    for (const issue of result.failed) console.log(`  line ${issue.line} ${issue.ticker || '(no ticker)'}: ${issue.reason}`)
  }

  if (result.failed.length > 0 && !skipUnresolved) {
    console.error(
      `\n${result.failed.length} row(s) could not be resolved. Add the missing companies to ` +
        `src/data/companyDirectory.ts (the approved company-bootstrap pattern) and rerun, ` +
        `or pass --skip-unresolved to exclude them.`,
    )
    process.exit(1)
  }

  const dataPath = join(repoRoot, 'src', 'data', 'retailPopularity.ts')
  writeFileSync(dataPath, generateDataModule(result.records), 'utf8')
  console.log(`\nWrote ${result.records.length} featured records to ${dataPath}`)

  const seedDir = join(repoRoot, 'supabase', 'seed')
  mkdirSync(seedDir, { recursive: true })
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seedPath = join(seedDir, `${date}000002_retail_popularity.sql`)
  writeFileSync(seedPath, generateSql(result.records), 'utf8')
  console.log(`Wrote SQL seed to ${seedPath}`)
}

main()

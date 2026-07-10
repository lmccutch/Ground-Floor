// Generates an idempotent SQL bootstrap file from src/data/companyDirectory.ts.
//
// This script only ever WRITES a .sql file to disk — it never connects to a
// database, never reads credentials, and never runs automatically (not in
// `build`, not in any migration, not on app startup). Run it manually with
// `npm run bootstrap:generate`, then apply the resulting file to a Supabase
// project yourself (CLI, dashboard SQL editor, or `psql`) whenever you choose
// to connect one. Re-running it is safe: every statement is an upsert.
//
// It populates companies, securities, and company_aliases ONLY — no
// campaigns, questions, votes, followers, or users are ever generated here.
// Sample community activity lives in supabase/seed/ (dev-only) instead.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { companyDirectory, type DirectoryCompany } from '../src/data/companyDirectory.ts'
import { buildCompanySlug, normalizeName, normalizeSymbol } from '../src/lib/companyIdentity.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlBool(value: boolean): string {
  return value ? 'true' : 'false'
}

function sqlNullableString(value: string | undefined): string {
  return value === undefined ? 'null' : sqlString(value)
}

function companyStatements(company: DirectoryCompany): string {
  const primary = company.securities.find(security => security.isPrimary) ?? company.securities[0]
  const slug = buildCompanySlug(company.displayName, company.key)
  const statements: string[] = []

  statements.push(
    `-- ${company.displayName} (${primary.symbol})\n` +
      `insert into public.companies (name, ticker, exchange, country, sector, description, market_cap_category, status, is_public, legal_name, display_name, slug, country_code, is_operating_company, is_directory_eligible, is_discoverable, metadata_source)\n` +
      `values (${sqlString(company.displayName)}, ${sqlString(primary.symbol)}, ${sqlString(primary.exchange)}, ${sqlString(company.country)}, ${sqlString(company.sector)}, ${sqlString(company.description)}, ${sqlString(company.marketCapCategory)}, 'Early shareholder campaign', true, ${sqlString(company.legalName)}, ${sqlString(company.displayName)}, ${sqlString(slug)}, null, true, true, true, 'admin')\n` +
      `on conflict (ticker, exchange) do update set\n` +
      `  name = excluded.name, country = excluded.country, sector = excluded.sector, description = excluded.description,\n` +
      `  market_cap_category = excluded.market_cap_category, legal_name = excluded.legal_name, display_name = excluded.display_name,\n` +
      `  slug = excluded.slug, is_operating_company = excluded.is_operating_company, is_directory_eligible = excluded.is_directory_eligible,\n` +
      `  is_discoverable = excluded.is_discoverable, metadata_source = excluded.metadata_source, updated_at = now();`,
  )

  for (const security of company.securities) {
    const normalized = normalizeSymbol(security.symbol)
    statements.push(
      `insert into public.securities (company_id, symbol, normalized_symbol, exchange, is_primary, is_active, is_adr, share_class, source)\n` +
        `select c.id, ${sqlString(security.symbol)}, ${sqlString(normalized)}, ${sqlString(security.exchange)}, ${sqlBool(security.isPrimary)}, true, ${sqlBool(Boolean(security.isAdr))}, ${sqlNullableString(security.shareClass)}, 'admin'\n` +
        `from public.companies c where c.ticker = ${sqlString(primary.symbol)} and c.exchange = ${sqlString(primary.exchange)}\n` +
        `on conflict (exchange, normalized_symbol) where is_active do update set\n` +
        `  company_id = excluded.company_id, symbol = excluded.symbol, is_primary = excluded.is_primary, is_adr = excluded.is_adr, share_class = excluded.share_class, updated_at = now();`,
    )
  }

  for (const alias of company.aliases ?? []) {
    const normalizedAlias = alias.aliasType === 'former_ticker' ? normalizeSymbol(alias.alias) : normalizeName(alias.alias)
    statements.push(
      `insert into public.company_aliases (company_id, alias, normalized_alias, alias_type, source)\n` +
        `select c.id, ${sqlString(alias.alias)}, ${sqlString(normalizedAlias)}, ${sqlString(alias.aliasType)}, 'admin'\n` +
        `from public.companies c where c.ticker = ${sqlString(primary.symbol)} and c.exchange = ${sqlString(primary.exchange)}\n` +
        `on conflict (company_id, normalized_alias, alias_type) do update set\n` +
        `  alias = excluded.alias, source = excluded.source;`,
    )
  }

  return statements.join('\n\n')
}

function generate(): string {
  const header = `-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/generate-company-bootstrap.ts from src/data/companyDirectory.ts.
-- Re-run \`npm run bootstrap:generate\` to regenerate after editing the directory data.
--
-- This bootstrap populates companies, securities, and company_aliases ONLY.
-- It creates no campaigns, questions, votes, followers, or users. It is safe
-- to re-run: every statement is an upsert. Apply it to a Supabase project
-- manually (CLI, dashboard SQL editor, or psql) — it is never run automatically.
--
-- Companies: ${companyDirectory.length}
-- Generated: ${new Date().toISOString().slice(0, 10)}

begin;

${companyDirectory.map(companyStatements).join('\n\n')}

commit;
`
  return header
}

function main() {
  const sql = generate()
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const outDir = join(__dirname, '..', 'supabase', 'seed')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `${date}000001_company_directory_bootstrap.sql`)
  writeFileSync(outPath, sql, 'utf8')
  console.log(`Wrote ${companyDirectory.length} companies to ${outPath}`)
}

main()

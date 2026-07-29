import { describe, expect, it } from 'vitest'
import { EXPECTED_MIGRATIONS, EXPECTED_MIGRATION_VERSIONS } from './expectedMigrations'

/* ===========================================================================
   The /admin/system migration-drift check is only meaningful if the "expected"
   list actually reflects the migrations in this repository. This test reads the
   directory through Vite's glob (the same mechanism the other static-audit tests
   use — no Node built-ins, which the browser tsconfig does not provide) and fails
   when the two diverge. Adding a migration without updating the list is therefore
   caught here, rather than showing the operator a false clean bill of health in
   production.
   =========================================================================== */

const migrationModules = import.meta.glob('../../supabase/migrations/*.sql', { query: '?raw', import: 'default', eager: true })

function migrationsOnDisk(): string[] {
  return Object.keys(migrationModules)
    .map(path => path.split('/').pop()!.replace(/\.sql$/, ''))
    .sort()
}

describe('expected migration list', () => {
  it('finds the migrations directory at all (guards against a glob that matches nothing)', () => {
    expect(migrationsOnDisk().length).toBeGreaterThan(20)
  })

  it('matches supabase/migrations/ exactly', () => {
    const onDisk = migrationsOnDisk()
    const declared: string[] = [...EXPECTED_MIGRATIONS].sort()
    const missing = onDisk.filter(m => !declared.includes(m))
    const stale = declared.filter(m => !onDisk.includes(m))
    expect(missing, `Migration(s) on disk but absent from EXPECTED_MIGRATIONS:\n${missing.join('\n')}`).toEqual([])
    expect(stale, `Migration(s) in EXPECTED_MIGRATIONS but absent from disk:\n${stale.join('\n')}`).toEqual([])
  })

  it('is ordered, so the last entry really is the newest migration', () => {
    const declared: string[] = [...EXPECTED_MIGRATIONS]
    expect(declared).toEqual([...declared].sort())
  })

  it('exposes bare timestamp versions — what schema_migrations.version stores', () => {
    expect(EXPECTED_MIGRATION_VERSIONS).toHaveLength(EXPECTED_MIGRATIONS.length)
    for (const v of EXPECTED_MIGRATION_VERSIONS) {
      expect(v, `"${v}" is not a bare migration timestamp`).toMatch(/^\d{12,14}$/)
    }
  })
})

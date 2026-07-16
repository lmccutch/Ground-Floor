import { describe, expect, it } from 'vitest'

// Repository brand guard: fails if a prohibited legacy product name (GroundFloor /
// Ground Floor / groundfloor / ground-floor / ground_floor / grround) appears in
// the source tree outside a narrow, documented allowlist. A NEW current reference
// to the old brand will fail this test. Uses Vite's raw glob so it needs no Node
// APIs. (Docs/README are additionally covered by the pre-commit git-grep audit.)

const modules = import.meta.glob('./**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

const FORBIDDEN = /groundfloor|ground[ _-]floor|grround/i

// Files that legitimately reference legacy names in full (exempt from scanning).
const EXEMPT_FILES = new Set([
  './brandAudit.test.ts',
  './lib/storageMigration.test.ts',
  './components/AppShell.brand.test.tsx',
])

// Specific (file, substring) matches retained for backwards-compat reasons:
// legacy storage keys migrated forward on read.
const ALLOWLIST: [string, string][] = [
  ['./lib/api.ts', 'groundfloor-mvp'],
  ['./lib/api.ts', 'grround-floor-mvp'],
  ['./lib/analytics.ts', 'groundfloor-attribution'],
  ['./lib/analytics.ts', 'grround-floor-attribution'],
  ['./lib/recentSearches.ts', 'groundfloor-mvp'],
  ['./lib/recentSearches.ts', 'grround-floor-mvp'],
]

describe('Open Floor brand audit (src tree)', () => {
  it('has no prohibited legacy brand references outside the allowlist', () => {
    const offenders: string[] = []
    for (const [path, content] of Object.entries(modules)) {
      if (EXEMPT_FILES.has(path)) continue
      content.split('\n').forEach((line, index) => {
        if (!FORBIDDEN.test(line)) return
        const allowed = ALLOWLIST.some(([file, substring]) => path === file && line.includes(substring))
        if (!allowed) offenders.push(`${path}:${index + 1}: ${line.trim()}`)
      })
    }
    expect(offenders, `Prohibited legacy brand references:\n${offenders.join('\n')}`).toEqual([])
  })
})

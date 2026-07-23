import { describe, expect, it } from 'vitest'

/* ===========================================================================
   Static audit of the transition-enforcement migration (202607220005). This is
   the CI-runnable regression guard that the SERVER-SIDE enforcement code is
   PRESENT in every admin mutation RPC and that each definer function is pinned
   to an empty search_path. It complements scripts/verify-transition-enforcement.ts
   (the live direct-RPC proof that the enforcement actually rejects invalid
   transitions against a real database). If a future edit deletes a guard or
   relaxes a search_path, this test fails without needing a database.
   =========================================================================== */

const files = import.meta.glob('../../../supabase/migrations/202607220005_transition_enforcement.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const sql = Object.values(files)[0] ?? ''

// Split the migration into per-function bodies so a guard in one function cannot
// be mistaken for coverage of another.
function fnBody(name: string): string {
  const start = sql.indexOf(`function public.${name}(`)
  expect(start, `function ${name} not found in migration`).toBeGreaterThanOrEqual(0)
  // Body runs to the next `create or replace function` (or end of file).
  const rest = sql.slice(start)
  const next = rest.indexOf('create or replace function', 10)
  return next === -1 ? rest : rest.slice(0, next)
}

const MUTATION_RPCS = [
  'admin_update_company_request',
  'admin_approve_company_request',
  'admin_update_campaign_ops',
  'admin_moderate_question',
  'admin_resolve_report',
  'admin_update_bug',
  'admin_update_support_ticket',
  'admin_mark_notification_read',
  'admin_dismiss_notification',
  'admin_record_support_response',
]

describe('search_path hardening', () => {
  it('the migration was loaded', () => {
    expect(sql.length, 'migration SQL is empty — glob path may be wrong').toBeGreaterThan(1000)
  })

  it('every recreated definer function pins search_path to empty', () => {
    // Every function definition in this migration must use SET search_path = ''.
    const defs = sql.match(/language (?:sql|plpgsql)[\s\S]*?set search_path = '[^']*'/g) ?? []
    expect(defs.length, 'expected multiple functions with a pinned search_path').toBeGreaterThanOrEqual(12)
    for (const d of defs) {
      expect(d, `a function still uses a non-empty search_path:\n${d.slice(-120)}`).toMatch(/set search_path = ''/)
    }
    // And no function in this migration may fall back to the shadowable public path.
    expect(sql).not.toMatch(/set search_path = public\b/)
  })

  it('every mutation RPC still checks is_admin()', () => {
    for (const fn of MUTATION_RPCS) {
      expect(fnBody(fn), `${fn} must guard on is_admin()`).toMatch(/if not public\.is_admin\(\) then/)
    }
  })
})

describe('transition enforcement is present in every workflow RPC', () => {
  it('company request: blocks status->approved and validates the transition', () => {
    const b = fnBody('admin_update_company_request')
    expect(b).toMatch(/p_status = 'approved'/)
    expect(b).toMatch(/admin_is_valid_transition\('company_request'/)
  })

  it('campaign: validates the transition and requires a completion/closed reason', () => {
    const b = fnBody('admin_update_campaign_ops')
    expect(b).toMatch(/admin_is_valid_transition\('campaign'/)
    expect(b).toMatch(/completing a campaign requires a completion reason/)
    expect(b).toMatch(/closing a campaign requires a closed reason/)
  })

  it('question: blocks publishing a hidden/removed/archived question directly', () => {
    const b = fnBody('admin_moderate_question')
    expect(b).toMatch(/p_action = 'publish' and v_before\.moderation_status in \('hidden', 'removed', 'archived'\)/)
    expect(b).toMatch(/must be restored before it can be published/)
  })

  it('report: enforces open-state + coordinated resolution for confirm', () => {
    const b = fnBody('admin_resolve_report')
    expect(b).toMatch(/cannot be re-resolved/)
    expect(b).toMatch(/p_action = 'confirm' and coalesce\(trim\(p_resolution\), ''\) = ''/)
  })

  it('bug: validates the transition and requires fix/deployment metadata', () => {
    const b = fnBody('admin_update_bug')
    expect(b).toMatch(/admin_is_valid_transition\('bug'/)
    expect(b).toMatch(/requires fix\/deployment metadata/)
  })

  it('support ticket: validates the transition and requires a resolution reason', () => {
    const update = fnBody('admin_update_support_ticket')
    expect(update).toMatch(/admin_is_valid_transition\('support_ticket'/)
    expect(update).toMatch(/requires a resolution reason/)
    // The record-response path can also change status, so it must gate too.
    const record = fnBody('admin_record_support_response')
    expect(record).toMatch(/admin_is_valid_transition\('support_ticket'/)
    expect(record).toMatch(/requires a resolution reason/)
  })
})

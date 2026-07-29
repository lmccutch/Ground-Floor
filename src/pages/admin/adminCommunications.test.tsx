import { describe, expect, it } from 'vitest'

/* ===========================================================================
   Prompt 5 security invariants, asserted against the real source of the
   migrations, Edge Functions and admin data layer.

   These are static-audit tests. They cannot replace running the SQL (see
   scripts/verify-admin-communications-security.ts for the live proof), but they
   do catch the regressions that are easiest to introduce by accident and
   hardest to spot in review: a recipient becoming client-supplied, a SECURITY
   DEFINER function losing its pinned search_path, a grant to anon creeping in,
   or a secret being echoed back to the browser.
   =========================================================================== */

// Sources are read through Vite's raw glob (the pattern adminActions.test.tsx
// already uses) rather than Node's fs, which the browser tsconfig does not type.
const sources = {
  ...import.meta.glob('../../../supabase/migrations/2026072800*.sql', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../../supabase/functions/*/index.ts', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('../../lib/adminApi.ts', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>

/** Exactly one source whose path contains `fragment`. Throws loudly if a rename
 *  ever makes a lookup silently match nothing — a test that reads '' would pass
 *  every "must not contain" assertion vacuously. */
function source(fragment: string): string {
  const hits = Object.entries(sources).filter(([path]) => path.includes(fragment))
  if (hits.length !== 1) throw new Error(`Expected exactly one source matching "${fragment}", found ${hits.length}`)
  return hits[1 - 1][1]
}

const sql = [
  source('202607280002_admin_communications'),
  source('202607280003_bug_attachments'),
  source('202607280004_system_health'),
].join('\n')

const sendFn = source('functions/send-transactional-email/')
const webhookFn = source('functions/resend-webhook/')
const intakeFn = source('functions/submit-intake/')
const attachmentFn = source('functions/admin-attachment-url/')
const diagnosticsFn = source('functions/admin-system-diagnostics/')
const adminApi = source('lib/adminApi.ts')

/** Strips `--` comments so assertions test the SCHEMA, not the prose about it. */
const stripSqlComments = (s: string) => s.replace(/^\s*--.*$/gm, '')
/** Strips `//` comments so ordering assertions test the CODE, not the header docs. */
const stripTsComments = (s: string) => s.replace(/^\s*\/\/.*$/gm, '')

/* ------------------------- SECURITY DEFINER hygiene ------------------------ */

/** Splits the combined SQL into one chunk per function definition. */
function functionBlocks(source: string): { name: string; body: string }[] {
  const blocks: { name: string; body: string }[] = []
  const re = /create or replace function (public\.[a-z_]+)\s*\(([\s\S]*?)\)\s*\n?returns([\s\S]*?)\$\$;/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    blocks.push({ name: m[1], body: m[0] })
  }
  return blocks
}

describe('SECURITY DEFINER hygiene', () => {
  const blocks = functionBlocks(sql)

  it('finds every new function (guards against the parser silently matching nothing)', () => {
    expect(blocks.length).toBeGreaterThanOrEqual(14)
  })

  it('pins an EMPTY search_path on every SECURITY DEFINER function', () => {
    const offenders = blocks
      .filter(b => /security definer/.test(b.body))
      .filter(b => !/set search_path = ''/.test(b.body))
      .map(b => b.name)
    expect(offenders, `SECURITY DEFINER without search_path='':\n${offenders.join('\n')}`).toEqual([])
  })

  it('revokes EXECUTE from public and anon for every new function', () => {
    const names = [...new Set(blocks.map(b => b.name.replace('public.', '')))]
    const missing = names.filter(n => !new RegExp(`revoke execute on function public\\.${n}\\(`).test(sql))
    expect(missing, `No revoke for:\n${missing.join('\n')}`).toEqual([])
    // Nothing may be granted straight to anon.
    expect(sql).not.toMatch(/grant execute on function public\.admin_[a-z_]+\([^)]*\) to [^;]*anon/)
  })

  it('grants the admin-facing RPCs to authenticated only, and the internal ones to service_role only', () => {
    for (const fn of ['admin_create_reply', 'admin_request_email_retry', 'admin_email_history', 'admin_entity_detail',
      'admin_resolve_attachment', 'admin_get_system_health', 'admin_get_email_health', 'admin_get_intake_health',
      'admin_acknowledge_system_warning', 'admin_applied_migrations']) {
      expect(sql, `${fn} must be granted to authenticated`).toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to authenticated`))
    }
    for (const fn of ['record_email_dispatch_result', 'record_email_event_log', 'record_bug_attachment',
      'record_attachment_failure', 'record_webhook_verification_failure']) {
      expect(sql, `${fn} must be service_role only`).toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role`))
      expect(sql).not.toMatch(new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to authenticated`))
    }
  })

  it('gates every admin-facing RPC on is_admin() before it does anything', () => {
    const adminFns = blocks.filter(b => /public\.admin_[a-z_]+/.test(b.name))
    const ungated = adminFns.filter(b => !/if not public\.is_admin\(\) then/.test(b.body)).map(b => b.name)
    expect(ungated, `Admin RPC without an is_admin() guard:\n${ungated.join('\n')}`).toEqual([])
  })
})

/* ---------------------------- RLS on new tables ---------------------------- */

describe('new tables', () => {
  for (const table of ['admin_replies', 'email_event_log', 'bug_attachments', 'system_warning_acks']) {
    it(`${table} enables RLS, is admin-read-only and has no client write policy`, () => {
      expect(sql).toMatch(new RegExp(`alter table public\\.${table} enable row level security`))
      expect(sql).toMatch(new RegExp(`revoke all on public\\.${table} from anon, authenticated`))
      // A SELECT policy gated on is_admin(), and nothing else.
      const policies = [...sql.matchAll(new RegExp(`create policy "[^"]+" on public\\.${table}\\s+for (\\w+)`, 'g'))].map(m => m[1])
      expect(policies, `${table} must have only SELECT policies`).toEqual(policies.filter(p => p === 'select'))
      expect(policies.length).toBeGreaterThan(0)
    })
  }

  it('never grants INSERT, UPDATE or DELETE on a new table to a browser role', () => {
    for (const table of ['admin_replies', 'email_event_log', 'bug_attachments', 'system_warning_acks']) {
      expect(sql).not.toMatch(new RegExp(`grant (insert|update|delete)[^;]*on public\\.${table}[^;]*to (anon|authenticated)`))
    }
  })

  it('creates the attachment bucket as PRIVATE', () => {
    expect(sql).toMatch(/insert into storage\.buckets[\s\S]*?'bug-attachments'[\s\S]*?false/)
    expect(sql).toMatch(/set public = false/)
  })

  it('adds no storage policy for anon or authenticated — all access goes through the audited function', () => {
    expect(sql).not.toMatch(/create policy[^;]*on storage\.objects/)
  })
})

/* ------------------------- reply: server-derived recipient ------------------ */

describe('administrator replies', () => {
  it('has NO recipient parameter — the address can only come from the record', () => {
    const fn = sql.match(/create or replace function public\.admin_create_reply\(([\s\S]*?)\)\s*\nreturns/)
    expect(fn).toBeTruthy()
    expect(fn![1]).not.toMatch(/recipient|p_to\b|p_email/)
  })

  it('reads the recipient off bug_reports / support_tickets inside the function', () => {
    expect(sql).toMatch(/select b\.reporter_email[\s\S]*?from public\.bug_reports/)
    expect(sql).toMatch(/select t\.email[\s\S]*?from public\.support_tickets/)
  })

  it('never sends a recipient from the browser', () => {
    // The reply/retry payloads built in the data layer must carry no address.
    const replyCall = adminApi.match(/mode: 'reply'[\s\S]*?\}/)
    expect(replyCall).toBeTruthy()
    expect(replyCall![0]).not.toMatch(/\bto:|recipient/)
    expect(adminApi).not.toMatch(/recipient_email/)
  })

  it('records the reply and its queued attempt before the provider is contacted', () => {
    // The RPC that creates both rows is called before dispatchAdminMessage.
    const order = sendFn.indexOf('admin_create_reply') < sendFn.indexOf('dispatchAdminMessage({')
    expect(order).toBe(true)
    expect(sql).toMatch(/insert into public\.admin_replies[\s\S]*?insert into public\.email_messages/)
  })

  it('uses a deterministic idempotency key and returns duplicate rather than re-sending', () => {
    expect(sql).toMatch(/v_key := 'reply:' \|\| p_entity_type \|\| ':' \|\| p_entity_id::text \|\| ':' \|\| trim\(p_client_token\)/)
    expect(sql).toMatch(/idempotency_key text not null unique/)
    expect(sendFn).toMatch(/if \(d\.duplicate\) return json\(200, \{ status: "duplicate"/)
  })

  it('sanitizes the subject and body server-side and sends the SANITIZED values', () => {
    expect(sql).toMatch(/v_subject := public\.sanitize_email_header\(p_subject\)/)
    expect(sql).toMatch(/v_body := public\.sanitize_email_body\(p_body\)/)
    // The dispatcher is handed d.subject / d.body — the RPC's output, not the request.
    expect(sendFn).toMatch(/subject: String\(d\.subject\)/)
    expect(sendFn).toMatch(/body: String\(d\.body\)/)
  })

  it('strips CR and LF from the subject, preventing header injection', () => {
    const header = sql.match(/function public\.sanitize_email_header[\s\S]*?\$\$;/)![0]
    expect(header).toMatch(/\\x00-\\x1F/)
  })

  it('escapes everything it renders — administrator HTML is never markup', () => {
    // The admin_reply template feeds plain lines through layout(), which escapes.
    expect(sendFn).toMatch(/admin_reply: \(d\) =>/)
    expect(sendFn).toMatch(/esc\(l\)/)
  })

  it('applies length limits', () => {
    expect(sql).toMatch(/char_length\(v_subject\) > 200/)
    expect(sql).toMatch(/char_length\(v_body\) > 5000/)
  })

  it('never changes the bug or ticket status as a side effect of replying', () => {
    const fn = sql.match(/create or replace function public\.admin_create_reply[\s\S]*?\$\$;/)![0]
    expect(fn).not.toMatch(/update public\.(bug_reports|support_tickets)/)
  })

  it('writes an audit entry containing only a MASKED recipient', () => {
    const fn = sql.match(/create or replace function public\.admin_create_reply[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/write_admin_audit\(\s*'admin_reply_created'/)
    expect(fn).toMatch(/'recipient', public\.mask_email\(v_recipient\)/)
    // The raw body is never copied into the audit log — only its length.
    expect(fn).toMatch(/'body_length', char_length\(v_body\)/)
  })

  it('refuses the admin_reply template on the ordinary caller-supplied-recipient path', () => {
    expect(sendFn).toMatch(/if \(template === "admin_reply"\) return json\(400/)
  })

  it('requires an administrator JWT for reply and retry — the intake secret is not enough', () => {
    const modeBlock = sendFn.match(/if \(mode === "reply" \|\| mode === "retry"\)[\s\S]{0,400}/)![0]
    expect(modeBlock).toMatch(/if \(!adminToken \|\| !\(await isAdmin\(adminToken\)\)\) return json\(401/)
  })
})

/* --------------------------------- retries --------------------------------- */

describe('email retry', () => {
  const eligibility = sql.match(/create or replace function public\.email_retry_ineligible_reason[\s\S]*?\$\$;/)![0]

  it('never allows retrying a delivered or complained message', () => {
    expect(eligibility).toMatch(/if m\.status = 'delivered' then\s*\n\s*return/)
    expect(eligibility).toMatch(/if m\.status = 'complained' then\s*\n\s*return/)
    expect(eligibility).toMatch(/if m\.status = 'suppressed' then\s*\n\s*return/)
  })

  it('refuses permanent bounces and only allows plausibly-temporary ones', () => {
    expect(eligibility).toMatch(/invalid\|unknown\|no such/)
    expect(eligibility).toMatch(/mailbox full\|over quota/)
  })

  it('refuses messages with no connected operational record, and stale ones', () => {
    expect(eligibility).toMatch(/if m\.entity_id is null/)
    expect(eligibility).toMatch(/interval '30 days'/)
  })

  it('creates a NEW linked attempt and never modifies the original row', () => {
    const fn = sql.match(/create or replace function public\.admin_request_email_retry[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/insert into public\.email_messages/)
    expect(fn).toMatch(/retry_of_message_id/)
    expect(fn).toMatch(/attempt_number, m\.attempt_number \+ 1|m\.attempt_number \+ 1/)
    // No UPDATE of email_messages anywhere in the retry request path.
    expect(fn).not.toMatch(/update public\.email_messages/)
  })

  it('rate-limits retries and is idempotent on the retry token', () => {
    const fn = sql.match(/create or replace function public\.admin_request_email_retry[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/check_login_rate_limit\('email_retry:'/)
    expect(fn).toMatch(/v_key := 'retry:'/)
    expect(fn).toMatch(/return jsonb_build_object\('duplicate', true/)
  })

  it('audits the request and the outcome separately', () => {
    expect(sql).toMatch(/'email_retry_requested'/)
    expect(sql).toMatch(/'email_retry_sent'/)
    expect(sql).toMatch(/'email_retry_failed'/)
  })

  it('records a dispatch outcome through the monotonic transition graph, so a retry cannot regress state', () => {
    const fn = sql.match(/create or replace function public\.record_email_dispatch_result[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/public\.email_next_status\(m\.status, p_status\)/)
    // Only dispatch outcomes; delivery states must come from the signed webhook.
    expect(fn).toMatch(/if p_status not in \('sent', 'failed'\) then/)
  })
})

/* ------------------------------- attachments ------------------------------- */

describe('attachments', () => {
  it('verifies file types from magic bytes, not the browser Content-Type', () => {
    expect(intakeFn).toMatch(/function sniff\(/)
    expect(intakeFn).toMatch(/0x89 && at\(1\) === 0x50/) // PNG
    expect(intakeFn).toMatch(/0xff && at\(1\) === 0xd8/) // JPEG
    expect(intakeFn).toMatch(/0x25 && at\(1\) === 0x50/) // PDF
    // A declared type that disagrees with the content is rejected.
    expect(intakeFn).toMatch(/declared !== sniffed\.mime/)
  })

  it('rejects everything outside the four-type allowlist (no SVG, HTML, script or archive)', () => {
    expect(intakeFn).not.toMatch(/image\/svg/)
    const mimes = [...intakeFn.matchAll(/mime: "([^"]+)"/g)].map(m => m[1])
    expect(new Set(mimes)).toEqual(new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']))
  })

  it('enforces count and size limits on the server, and again in the database', () => {
    expect(intakeFn).toMatch(/MAX_FILES = 3/)
    expect(intakeFn).toMatch(/MAX_FILE_BYTES = 5 \* 1024 \* 1024/)
    expect(intakeFn).toMatch(/MAX_TOTAL_BYTES = 10 \* 1024 \* 1024/)
    expect(sql).toMatch(/A bug report may have at most 3 attachments/)
    expect(sql).toMatch(/size_bytes <= 5242880/)
    expect(sql).toMatch(/v_total \+ new\.size_bytes > 10485760/)
  })

  it('validates files BEFORE the record is created, and runs Turnstile before either', () => {
    const turnstile = intakeFn.indexOf('turnstileOk(turnstileToken, ip)')
    const validate = intakeFn.indexOf('validateAttachments(rawAttachments)')
    const submit = intakeFn.indexOf('submit_bug_report')
    expect(turnstile).toBeGreaterThan(-1)
    expect(turnstile).toBeLessThan(validate)
    expect(validate).toBeLessThan(submit)
  })

  it('generates the object path server-side and never uses the uploaded filename as a path', () => {
    expect(intakeFn).toMatch(/const path = `\$\{bugId\}\/\$\{crypto\.randomUUID\(\)\}\.\$\{f\.ext\}`/)
    // The DB independently refuses a path outside the report's own prefix.
    expect(sql).toMatch(/p_object_path not like p_bug_report_id::text \|\| '\/%'/)
  })

  it('cleans up orphaned objects and alerts when a store fails after the report exists', () => {
    expect(intakeFn).toMatch(/await removeObjects\(written\)/)
    expect(intakeFn).toMatch(/record_attachment_failure/)
  })

  it('mints only short-lived signed URLs, after two independent admin checks', () => {
    expect(attachmentFn).toMatch(/const EXPIRES_IN = 60/)
    // Comments stripped so the header documentation cannot satisfy the ordering.
    const code = stripTsComments(attachmentFn)
    const guard = code.indexOf('if (!token || !(await isAdmin(token)))')
    const resolve = code.indexOf('admin_resolve_attachment')
    const sign = code.indexOf('/storage/v1/object/sign/')
    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(resolve)
    expect(resolve).toBeLessThan(sign)
    // The RPC is called with the ADMIN's token, not the service role.
    expect(attachmentFn).toMatch(/admin_resolve_attachment`, \{[\s\S]*?Authorization: `Bearer \$\{token\}`/)
  })

  it('audits every attachment access', () => {
    const fn = sql.match(/create or replace function public\.admin_resolve_attachment[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/'attachment_downloaded'/)
    expect(fn).toMatch(/'attachment_viewed'/)
  })
})

/* --------------------------------- webhook --------------------------------- */

describe('resend webhook', () => {
  it('still verifies the signature against the RAW request body', () => {
    expect(webhookFn).toMatch(/const body = await req\.text\(\);/)
    expect(webhookFn).toMatch(/if \(!\(await verify\(body, req\.headers\)\)\)/)
    // Verification happens before the body is parsed.
    expect(webhookFn.indexOf('await verify(body')).toBeLessThan(webhookFn.indexOf('JSON.parse(body)'))
  })

  it('deduplicates the event log by the provider (Svix) event id', () => {
    expect(webhookFn).toMatch(/req\.headers\.get\("svix-id"\)/)
    expect(sql).toMatch(/provider_event_id text not null unique/)
    expect(sql).toMatch(/on conflict \(provider_event_id\) do nothing/)
  })

  it('stores no bodies, recipients or headers in the event log', () => {
    // Comments stripped: the column list is what matters, not the prose above it.
    const table = stripSqlComments(sql).match(/create table if not exists public\.email_event_log \([\s\S]*?\);/)![0]
    expect(table).not.toMatch(/body|recipient|header|payload|secret|signature/i)
  })

  it('raises at most one deduplicated alert per hour on repeated verification failures', () => {
    const fn = sql.match(/create or replace function public\.record_webhook_verification_failure[\s\S]*?\$\$;/)![0]
    expect(fn).toMatch(/check_login_rate_limit\('webhook_verify_fail:' \|\| v_bucket, 5, 3600\)/)
    expect(fn).toMatch(/'webhook_verify_fail:' \|\| v_bucket\)/)
  })
})

/* ------------------------------ secret handling ---------------------------- */

describe('secret handling', () => {
  it('never returns or logs a secret value from any function', () => {
    for (const [name, source] of Object.entries({ sendFn, webhookFn, intakeFn, attachmentFn, diagnosticsFn })) {
      // No secret is ever interpolated into a response body or a console call.
      expect(source, `${name} must not log`).not.toMatch(/console\.(log|error|warn)\([^)]*(?:KEY|SECRET|TOKEN)/)
      expect(source, `${name} must not return a secret`).not.toMatch(/json\([0-9]+, \{[^}]*(?:RESEND_API_KEY|SERVICE_KEY|WEBHOOK_SECRET|TURNSTILE_SECRET)/)
    }
  })

  it('reports configuration as presence only, never as a value', () => {
    // check() reads the env var into a local, tests it, and returns a state word.
    expect(diagnosticsFn).toMatch(/return "configured"/)
    expect(diagnosticsFn).toMatch(/return "missing"/)
    expect(diagnosticsFn).toMatch(/return "invalid_format"/)
    // The only Deno.env read in check() is discarded — no value reaches the payload.
    expect(diagnosticsFn).not.toMatch(/secrets\[[^\]]*\] = v\b/)
    expect(diagnosticsFn).not.toMatch(/value: v\b/)
  })

  it('marks what it cannot verify as unknown rather than asserting it', () => {
    expect(diagnosticsFn).toMatch(/turnstile_fail_closed: "unknown"/)
    expect(diagnosticsFn).toMatch(/malware_scanning: "not_integrated"/)
    expect(diagnosticsFn).toMatch(/inbound_email_ingestion: "not_implemented"/)
  })

  it('keeps the health RPCs free of raw recipients — addresses are masked', () => {
    expect(sql).toMatch(/public\.mask_email\(m\.recipient_email\)/)
    const history = sql.match(/create or replace function public\.admin_email_history[\s\S]*?\$\$;/)![0]
    expect(history).not.toMatch(/select[\s\S]{0,80}m\.recipient_email,/)
  })
})

/* ------------------------------- data layer -------------------------------- */

describe('admin data layer', () => {
  it('still performs no direct client table writes', () => {
    const offenders = adminApi.match(/\.(insert|update|upsert|delete)\s*\(/g) ?? []
    expect(offenders, `Direct table write in adminApi:\n${offenders.join('\n')}`).toEqual([])
  })

  it('invokes only the expected Edge Functions', () => {
    const invoked = [...adminApi.matchAll(/functions\.invoke\('([a-z-]+)'/g)].map(m => m[1])
    expect(new Set(invoked)).toEqual(new Set(['send-transactional-email', 'admin-attachment-url', 'admin-system-diagnostics']))
  })

  it('never references the service-role key', () => {
    expect(adminApi).not.toMatch(/SERVICE_ROLE|service_role/)
  })
})

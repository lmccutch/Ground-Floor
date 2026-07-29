import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import {
  acknowledgeSystemWarning,
  checkQueueStaleness,
  getAppliedMigrations,
  getDiagnostics,
  getEmailHealth,
  getIntakeHealth,
  getOperationalFailures,
  getSystemHealth,
} from '../../../lib/adminApi'
import { EXPECTED_MIGRATION_VERSIONS } from '../../../lib/expectedMigrations'
import { formatDateTime, humanize, timeAgo } from '../../../lib/adminFormat'
import {
  configStatus,
  deploymentStatus,
  emailStatus,
  migrationStatus,
  queueStatus,
  sortWarnings,
  storageStatus,
  STATUS_MEANING,
  THRESHOLDS,
  webhookStatus,
  worst,
  type ConfigState,
  type HealthStatus,
  type SystemWarning,
} from '../../../lib/systemHealth'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { AdminPageHeader, Chip, Field, HealthBadge, HealthLine, HealthPanel, Loading } from '../components/adminUi'

/* ===========================================================================
   /admin/system — a truthful operational overview.

   THE ONE RULE: a check is Healthy only when current data proves it. Everything
   this page cannot verify shows as Unknown, and Unknown is styled and worded as
   NOT a pass. Every verdict is computed by src/lib/systemHealth.ts, which owns
   all thresholds — there are no magic numbers below.

   Each section fetches independently, so a single failing check degrades to
   Unknown instead of blanking the page.
   =========================================================================== */

// Build-time facts. VITE_APP_COMMIT is the documented variable (it is also what
// the public intake stamps onto reports); VITE_COMMIT_SHA is accepted as a
// legacy fallback. Neither is invented when absent.
const ENVIRONMENT = import.meta.env.MODE
const COMMIT =
  ((import.meta.env.VITE_APP_COMMIT as string | undefined) ?? (import.meta.env.VITE_COMMIT_SHA as string | undefined))?.slice(0, 12)
const SITE_URL = import.meta.env.VITE_SITE_URL as string | undefined
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

/** Secrets the system genuinely cannot work without, versus ones that fall back
 *  to a safe default. Drives whether "missing" is Critical or Warning. */
const REQUIRED_SECRETS = ['RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET', 'TURNSTILE_SECRET_KEY', 'INTAKE_FUNCTION_SECRET']
const SECRET_NOTES: Record<string, string> = {
  RESEND_API_KEY: 'Without it no email can be sent; attempts are recorded as failed.',
  RESEND_WEBHOOK_SECRET: 'Without it delivery events are rejected and every message stays at "sent" forever.',
  TURNSTILE_SECRET_KEY: 'The intake function fails CLOSED without it — every public submission is rejected.',
  INTAKE_FUNCTION_SECRET: 'Without it submitter confirmations and admin alerts are never sent.',
  ADMIN_ALERT_EMAIL: 'Optional. Without it no email alert is sent when something is submitted.',
  EMAIL_SENDER: 'Optional — falls back to Open Floor <no-reply@open-floor.ca>.',
  EMAIL_REPLY_SUPPORT: 'Optional — falls back to support@open-floor.ca.',
  EMAIL_REPLY_BUGS: 'Optional — falls back to bugs@open-floor.ca.',
  EMAIL_REPLY_PRIVACY: 'Optional — falls back to privacy@open-floor.ca.',
  EMAIL_REPLY_CONTACT: 'Optional — falls back to contact@open-floor.ca.',
  ALLOWED_ORIGIN: 'Optional — defaults to "*". Set it to the production origin to tighten CORS.',
}

const EXPECTED_FUNCTIONS: Record<string, string> = {
  'submit-intake': 'Receives every public bug and contact submission.',
  'send-transactional-email': 'The only path to Resend; also sends administrator replies.',
  'resend-webhook': 'Applies signed delivery events to email history.',
  'admin-attachment-url': 'Mints short-lived signed URLs for private attachments.',
}

function fmtCount(n: number | null | undefined): string {
  return n == null ? 'Unknown' : String(n)
}

function since(iso?: string | null): string {
  return iso ? `${timeAgo(iso)} (${formatDateTime(iso)})` : 'Never'
}

/* --------------------------- warning acknowledgement ----------------------- */

function WarningRow({ warning, onAcknowledged }: { warning: SystemWarning; onAcknowledged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ack() {
    setBusy(true)
    setError(null)
    try {
      await acknowledgeSystemWarning({ key: warning.key })
      onAcknowledged()
    } catch (e) {
      setError((e as Error)?.message ?? 'That could not be acknowledged.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`admin-warning health-${warning.status} ${warning.acknowledged ? 'is-acknowledged' : ''}`}>
      <div className="admin-warning-head">
        <HealthBadge status={warning.status} />
        <strong>{warning.title}</strong>
      </div>
      <p>{warning.detail}</p>
      {warning.acknowledged ? (
        <p className="admin-inline-note">
          Acknowledged. The condition is still present — this only silences it for {THRESHOLDS.acknowledgementHours} hours.
        </p>
      ) : (
        <button className="btn ghost small" onClick={() => void ack()} disabled={busy}>
          {busy ? 'Acknowledging…' : 'Acknowledge'}
        </button>
      )}
      {error && (
        <p className="admin-action-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}
    </li>
  )
}

/* ================================== page =================================== */

export function SystemPage() {
  const [version, setVersion] = useState(0)
  const reload = () => setVersion(v => v + 1)

  // Independent queries: one failure never blanks the others.
  const health = useAdminQuery(() => getSystemHealth(), [version])
  const email = useAdminQuery(() => getEmailHealth(), [version])
  const intake = useAdminQuery(() => getIntakeHealth(), [version])
  const failures = useAdminQuery(() => getOperationalFailures(15), [version])
  const migrations = useAdminQuery(() => getAppliedMigrations(), [version])
  // The diagnostics function may not be deployed yet. A failure here must read as
  // Unknown, never as "no problems found" — HealthPanel enforces that.
  const diagnostics = useAdminQuery(() => getDiagnostics(), [version])

  // Evaluating staleness raises at most one notification per day. Fire and forget:
  // a failure here must never affect the page.
  useEffect(() => {
    void checkQueueStaleness().catch(() => {})
  }, [])

  const h = health.data
  const e = email.data
  const i = intake.data
  const d = diagnostics.data

  /* ----------------------------- verdicts ---------------------------------- */

  const emailVerdict = e
    ? emailStatus({
        totalMessages: e.totalMessages,
        lastSendAt: e.lastSendAt,
        lastDeliveredAt: e.lastDeliveredAt,
        failed24h: e.failed24h,
        failed7d: e.failed7d,
        bounced7d: e.bounced7d,
        complained7d: e.complained7d,
        delayedCurrent: e.delayedCurrent,
        stuckQueued: e.stuckQueued,
        statusInconsistencies: e.statusInconsistencies,
        retryBacklog: e.retryBacklog,
      })
    : { status: 'unknown' as HealthStatus, reason: 'Email health could not be read.' }

  const webhookVerdict = e
    ? webhookStatus(e.lastWebhookEventAt, e.lastSendAt)
    : { status: 'unknown' as HealthStatus, reason: 'Webhook evidence could not be read.' }

  const queueVerdict = h
    ? queueStatus(h.queue.openItems, h.queue.oldestCreatedAt)
    : { status: 'unknown' as HealthStatus, reason: 'The work queue could not be read.' }

  const storageVerdict = storageStatus(h?.storage)
  const migrationVerdict = migrations.error
    ? { status: 'unknown' as HealthStatus, reason: 'The applied-migration list could not be read.', missing: [], extra: [] }
    : migrationStatus(EXPECTED_MIGRATION_VERSIONS, migrations.data)

  const secretState = (name: string): ConfigState => (d ? (d.secrets[name] ?? 'unknown') : 'unknown')
  const configVerdict = worst(...Object.keys(SECRET_NOTES).map(n => configStatus(secretState(n), REQUIRED_SECRETS.includes(n))))
  const functionsVerdict = worst(...Object.keys(EXPECTED_FUNCTIONS).map(n => deploymentStatus(d?.functions[n])))

  // Turnstile: the site key is a build-time fact we CAN see; the secret comes
  // from diagnostics; fail-closed behaviour of the deployed code cannot be
  // proven from the browser, so it stays Unknown by design.
  const turnstileVerdict = worst(
    configStatus(secretState('TURNSTILE_SECRET_KEY'), true),
    TURNSTILE_SITE_KEY ? 'healthy' : 'warning',
  )

  const appVerdict: HealthStatus = COMMIT ? 'healthy' : 'unknown'
  const dbVerdict: HealthStatus = health.error ? 'critical' : h?.database.reachable ? 'healthy' : 'unknown'
  const intakeVerdict: HealthStatus = intake.error
    ? 'unknown'
    : i && i.bugs.unprocessed + i.supportTickets.unprocessed >= THRESHOLDS.intakeUnprocessedWarning
      ? 'warning'
      : i
        ? 'healthy'
        : 'unknown'
  const opsVerdict: HealthStatus = health.error
    ? 'unknown'
    : h && h.operations.unhandledNotifications >= THRESHOLDS.notificationsUnreadWarning
      ? 'warning'
      : h
        ? 'healthy'
        : 'unknown'

  const overall = worst(
    appVerdict, dbVerdict, migrationVerdict.status, emailVerdict.status, webhookVerdict.status,
    queueVerdict.status, storageVerdict.status, configVerdict, functionsVerdict, turnstileVerdict,
    intakeVerdict, opsVerdict,
  )

  /* ----------------------------- warnings ---------------------------------- */

  const acks = h?.acknowledgedWarnings ?? {}
  const warnings: SystemWarning[] = []
  const warn = (key: string, status: HealthStatus, title: string, detail: string) => {
    if (status === 'healthy') return
    warnings.push({ key, status, title, detail, acknowledged: Boolean(acks[key]) })
  }

  warn('migration_drift', migrationVerdict.status, 'Migration drift', migrationVerdict.reason)
  warn('email_delivery', emailVerdict.status, 'Email delivery', emailVerdict.reason)
  warn('webhook_recency', webhookVerdict.status, 'Delivery webhook', webhookVerdict.reason)
  warn('storage_bucket', storageVerdict.status, 'Attachment storage', storageVerdict.reason)
  warn('queue_backlog', queueVerdict.status, 'Work queue', queueVerdict.reason)
  for (const name of REQUIRED_SECRETS) {
    const s = configStatus(secretState(name), true)
    warn(`secret_${name}`, s, `Secret ${name}`, s === 'unknown'
      ? 'Configuration could not be read — the diagnostics function may not be deployed. This is not a pass.'
      : `${humanize(secretState(name))}. ${SECRET_NOTES[name]}`)
  }
  for (const [name] of Object.entries(EXPECTED_FUNCTIONS)) {
    const probe = d?.functions[name]
    warn(`function_${name}`, deploymentStatus(probe), `Edge function ${name}`, probe === 'not_deployed'
      ? 'The functions gateway returns 404 for this function — it is not deployed.'
      : 'Deployment could not be probed, so it is unknown.')
  }
  if (d && d.senderDomain && d.expectedDomain && d.senderDomain !== d.expectedDomain) {
    warn('sender_domain', 'critical', 'Sender domain mismatch',
      `Mail is being sent from @${d.senderDomain} but the production domain is @${d.expectedDomain}. Delivery and trust will both suffer.`)
  }
  if (!COMMIT) {
    warn('missing_commit', 'unknown', 'Build commit not recorded',
      'VITE_APP_COMMIT was not set at build time, so this page cannot tell you which build you are looking at.')
  }
  if (!TURNSTILE_SITE_KEY) {
    warn('turnstile_site_key', 'warning', 'Turnstile site key missing from this build',
      'VITE_TURNSTILE_SITE_KEY is not set, so the public forms render no challenge. If the server secret IS set, every submission will be rejected.')
  }
  if (e && e.statusInconsistencies > 0) {
    warn('email_inconsistency', 'critical', 'Email status inconsistency',
      `${e.statusInconsistencies} message(s) hold a delivery timestamp that contradicts their status.`)
  }

  const sorted = sortWarnings(warnings)

  return (
    <div className="admin-system">
      <AdminPageHeader
        title="System"
        description="What the backend can actually prove right now. Anything that cannot be verified is shown as Unknown — which is not the same as healthy, and is never rendered as a pass."
        actions={
          <div className="admin-system-overall">
            <span>Overall</span>
            <HealthBadge status={overall} />
          </div>
        }
      />

      <p className="admin-system-legend">
        <strong>Healthy</strong> {STATUS_MEANING.healthy} <strong>Warning</strong> {STATUS_MEANING.warning}{' '}
        <strong>Critical</strong> {STATUS_MEANING.critical} <strong>Unknown</strong> {STATUS_MEANING.unknown}
      </p>

      {/* -------------------- H. warnings (most important first) ------------- */}
      <section className="admin-panel" aria-labelledby="sys-warnings">
        <div className="admin-panel-head">
          <h2 id="sys-warnings">Security and configuration warnings</h2>
          <Chip tone={sorted.some(w => w.status === 'critical') ? 'critical' : sorted.length ? 'high' : 'success'}>
            {sorted.length === 0 ? 'None' : `${sorted.length}`}
          </Chip>
        </div>
        {sorted.length === 0 ? (
          <p className="admin-panel-note">
            No warning conditions are currently detectable. That covers only the checks on this page — it is not a
            statement about anything they cannot see.
          </p>
        ) : (
          <ul className="admin-warning-list">
            {sorted.map(w => (
              <WarningRow key={w.key} warning={w} onAcknowledged={reload} />
            ))}
          </ul>
        )}
      </section>

      <div className="admin-two-col">
        {/* ----------------------------- A. application ---------------------- */}
        <HealthPanel
          title="Application"
          status={appVerdict}
          description="Build-time facts baked into the JavaScript you are running."
        >
          <div className="admin-detail">
            <Field label="Environment">{humanize(ENVIRONMENT)}</Field>
            <Field label="Frontend commit">
              {COMMIT ? <span className="admin-mono">{COMMIT}</span> : 'Unknown — VITE_APP_COMMIT was not set at build time'}
            </Field>
            <Field label="Configured site URL">{SITE_URL || 'Unknown — VITE_SITE_URL is not set'}</Field>
            <Field label="Serving hostname">{typeof window === 'undefined' ? 'Unknown' : window.location.hostname}</Field>
            <Field label="Build timestamp">
              Not recorded. Vite does not stamp one, so no value is shown rather than a guess.
            </Field>
          </div>
        </HealthPanel>

        {/* ------------------------------ B. database ------------------------ */}
        <HealthPanel
          title="Database"
          status={worst(dbVerdict, migrationVerdict.status)}
          description="Reachability is proven by this page loading at all — the data below came through the admin read path."
          error={health.error}
          loading={health.loading && !h}
          onRetry={health.reload}
        >
          <div className="admin-check-list">
            <HealthLine status={dbVerdict} label="Admin read path" detail={h?.database.reachable ? 'Reachable — these figures were read live.' : 'Could not be confirmed.'} />
            <HealthLine
              status={migrationVerdict.status}
              label="Schema migrations"
              detail={
                <>
                  {migrationVerdict.reason}
                  {migrationVerdict.missing.length > 0 && (
                    <>
                      {' '}
                      Missing: <span className="admin-mono">{migrationVerdict.missing.join(', ')}</span>.
                    </>
                  )}
                </>
              }
            />
          </div>
          <div className="admin-detail">
            <Field label="Latest expected migration">
              <span className="admin-mono">{EXPECTED_MIGRATION_VERSIONS[EXPECTED_MIGRATION_VERSIONS.length - 1]}</span>
            </Field>
            <Field label="Latest applied migration">
              {migrations.data && migrations.data.length > 0 ? (
                <span className="admin-mono">{migrations.data[migrations.data.length - 1]}</span>
              ) : (
                'Unknown'
              )}
            </Field>
            <Field label="Server time">{h?.database.serverTime ? formatDateTime(h.database.serverTime) : 'Unknown'}</Field>
            <Field label="Admin RPCs present">
              {h
                ? `${Object.values(h.adminRpcs).filter(Boolean).length} of ${Object.keys(h.adminRpcs).length} verified in the catalogue`
                : 'Unknown'}
            </Field>
            {h && Object.entries(h.adminRpcs).some(([, present]) => !present) && (
              <Field label="Missing RPCs">
                <span className="admin-mono">
                  {Object.entries(h.adminRpcs)
                    .filter(([, present]) => !present)
                    .map(([name]) => name.split('(')[0])
                    .join(', ')}
                </span>
              </Field>
            )}
          </div>
        </HealthPanel>

        {/* --------------------------- C. edge functions --------------------- */}
        <HealthPanel
          title="Edge functions"
          status={functionsVerdict}
          description="Deployment is probed live against the functions gateway. Source files existing on disk proves nothing and is not used here."
          error={diagnostics.error}
          loading={diagnostics.loading && !d}
          onRetry={diagnostics.reload}
        >
          <div className="admin-check-list">
            {Object.entries(EXPECTED_FUNCTIONS).map(([name, purpose]) => (
              <HealthLine
                key={name}
                status={deploymentStatus(d?.functions[name])}
                label={name}
                detail={
                  <>
                    {purpose}{' '}
                    {d?.functions[name] === 'unknown' && 'The gateway could not be probed, so deployment is unknown.'}
                  </>
                }
              />
            ))}
          </div>
          <p className="admin-inline-note">
            Per-invocation telemetry (success and failure counts) is not exposed by Supabase to the application, so it is
            not shown. Use the Supabase dashboard logs for that.
          </p>
        </HealthPanel>

        {/* ------------------------------- D. email -------------------------- */}
        <HealthPanel
          title="Email"
          status={worst(emailVerdict.status, webhookVerdict.status, configVerdict)}
          description="Delivery evidence recorded by Open Floor, plus configuration presence reported by the diagnostics function. No secret value is ever fetched."
          error={email.error}
          loading={email.loading && !e}
          onRetry={email.reload}
        >
          <div className="admin-check-list">
            <HealthLine status={emailVerdict.status} label="Delivery" detail={emailVerdict.reason} />
            <HealthLine status={webhookVerdict.status} label="Delivery webhook" detail={webhookVerdict.reason} />
          </div>
          <div className="admin-detail">
            <Field label="Most recent send">{since(e?.lastSendAt)}</Field>
            <Field label="Most recent confirmed delivery">{since(e?.lastDeliveredAt)}</Field>
            <Field label="Most recent webhook event">{since(e?.lastWebhookEventAt)}</Field>
            <Field label="Failed (24h / 7d)">{`${fmtCount(e?.failed24h)} / ${fmtCount(e?.failed7d)}`}</Field>
            <Field label="Bounced (7d)">{fmtCount(e?.bounced7d)}</Field>
            <Field label="Complaints (7d)">{fmtCount(e?.complained7d)}</Field>
            <Field label="Currently delayed">{fmtCount(e?.delayedCurrent)}</Field>
            <Field label="Stuck in queue">
              {fmtCount(e?.stuckQueued)}
              {e && e.stuckQueued > 0 && ` (queued over ${THRESHOLDS.emailStuckQueuedHours}h)`}
            </Field>
            <Field label="Oldest unresolved failure">{since(e?.oldestUnresolvedFailureAt)}</Field>
            <Field label="Status inconsistencies">{fmtCount(e?.statusInconsistencies)}</Field>
            <Field label="Retry backlog">
              {fmtCount(e?.retryBacklog)} eligible, {fmtCount(e?.retryAttemptsTotal)} retries made
            </Field>
            <Field label="Unmatched webhook events (24h)">{fmtCount(e?.webhookUnmatched24h)}</Field>
          </div>

          <h3 className="admin-subheading">Configuration</h3>
          <div className="admin-check-list">
            {Object.entries(SECRET_NOTES).map(([name, note]) => {
              const state = secretState(name)
              return (
                <HealthLine
                  key={name}
                  status={configStatus(state, REQUIRED_SECRETS.includes(name))}
                  label={name}
                  detail={`${state === 'unknown' ? 'Could not be read' : humanize(state)}. ${note}`}
                />
              )
            })}
          </div>
          {d?.senderDomain && (
            <Field label="Sender domain">
              <span className="admin-mono">@{d.senderDomain}</span>
              {d.expectedDomain && d.senderDomain !== d.expectedDomain && ` — expected @${d.expectedDomain}`}
            </Field>
          )}
          <p className="admin-inline-note">
            Open Floor has <strong>no inbound email ingestion</strong>. Replies from recipients land in the Workspace
            alias mailboxes and never appear in the application.
          </p>
        </HealthPanel>

        {/* ----------------------------- E. turnstile ------------------------ */}
        <HealthPanel
          title="Turnstile"
          status={turnstileVerdict}
          description="Captcha configuration. Whether the deployed intake code still fails closed cannot be proven from a browser, so it is reported as unknown rather than asserted."
        >
          <div className="admin-check-list">
            <HealthLine
              status={configStatus(secretState('TURNSTILE_SECRET_KEY'), true)}
              label="Server secret (TURNSTILE_SECRET_KEY)"
              detail={SECRET_NOTES.TURNSTILE_SECRET_KEY}
            />
            <HealthLine
              status={TURNSTILE_SITE_KEY ? 'healthy' : 'warning'}
              label="Public site key in this build"
              detail={
                TURNSTILE_SITE_KEY
                  ? 'VITE_TURNSTILE_SITE_KEY is present, so the forms render a challenge.'
                  : 'VITE_TURNSTILE_SITE_KEY is absent, so no challenge is rendered and submissions will be rejected if the server secret is set.'
              }
            />
            <HealthLine
              status="unknown"
              label="Fail-closed behaviour of the deployed function"
              detail={
                <>
                  Cannot be verified from here without submitting a real form. It is enforced in source and proven against a
                  scratch project by <span className="admin-mono">npm run verify:intake-security</span>.
                </>
              }
            />
            <HealthLine
              status="unknown"
              label="Captcha rejection counts"
              detail="Rejections happen in the Edge Function before any row is created, so there is nothing to count. Zero is not reported, because zero would be a lie."
            />
          </div>
        </HealthPanel>

        {/* --------------------------- F. public intake ---------------------- */}
        <HealthPanel
          title="Public intake"
          status={intakeVerdict}
          description="Submission volume and backlog for /report-bug and /contact."
          error={intake.error}
          loading={intake.loading && !i}
          onRetry={intake.reload}
        >
          <div className="admin-detail">
            <Field label="Bug reports (24h / 7d / total)">
              {`${fmtCount(i?.bugs.last24h)} / ${fmtCount(i?.bugs.last7d)} / ${fmtCount(i?.bugs.total)}`}
            </Field>
            <Field label="Support tickets (24h / 7d / total)">
              {`${fmtCount(i?.supportTickets.last24h)} / ${fmtCount(i?.supportTickets.last7d)} / ${fmtCount(i?.supportTickets.total)}`}
            </Field>
            <Field label="Last submission">
              {since(
                [i?.bugs.lastSubmissionAt, i?.supportTickets.lastSubmissionAt].filter(Boolean).sort().pop() ?? undefined,
              )}
            </Field>
            <Field label="Untriaged">
              {`${fmtCount(i?.bugs.unprocessed)} bug(s), ${fmtCount(i?.supportTickets.unprocessed)} ticket(s)`}
            </Field>
            <Field label="Oldest untriaged">
              {since([i?.bugs.oldestUnprocessedAt, i?.supportTickets.oldestUnprocessedAt].filter(Boolean).sort()[0] ?? undefined)}
            </Field>
            <Field label="Marked spam">{fmtCount(i?.supportTickets.spam)}</Field>
            <Field label="Rate limiting (last hour)">
              {i
                ? `${i.rateLimits.throttledKeys} key(s) over the limit, ${i.rateLimits.intakeIpKeysActive} IP + ${i.rateLimits.intakeSubmitterKeysActive} submitter key(s) active`
                : 'Unknown'}
            </Field>
            <Field label="Attachments">
              {i?.attachments.supported
                ? `${fmtCount(i.attachments.total)} stored (${fmtCount(i.attachments.last7d)} in 7d)`
                : 'Attachment storage is not installed on this database.'}
            </Field>
            <Field label="Captcha rejections">
              {i?.captchaRejectionsTracked ? 'Tracked' : 'Not tracked — rejections occur before any record exists.'}
            </Field>
          </div>
        </HealthPanel>

        {/* -------------------------- G. admin operations -------------------- */}
        <HealthPanel
          title="Admin operations"
          status={worst(opsVerdict, queueVerdict.status)}
          description="Outstanding operational work, read from the same queue that drives /admin/queue."
          error={health.error}
          loading={health.loading && !h}
          onRetry={health.reload}
        >
          <div className="admin-check-list">
            <HealthLine status={queueVerdict.status} label="Work queue" detail={queueVerdict.reason} />
          </div>
          <div className="admin-detail">
            <Field label="Unresolved bugs">{fmtCount(h?.operations.unresolvedBugs)}</Field>
            <Field label="Open support tickets">{fmtCount(h?.operations.openSupportTickets)}</Field>
            <Field label="Unhandled notifications">
              {fmtCount(h?.operations.unhandledNotifications)}
              {h && h.operations.criticalNotifications > 0 && ` (${h.operations.criticalNotifications} high or critical)`}
            </Field>
            <Field label="Open work items">
              {fmtCount(h?.queue.openItems)}
              {h && h.queue.staleOver7d > 0 && ` — ${h.queue.staleOver7d} over ${THRESHOLDS.queueStaleDays} days old`}
            </Field>
            <Field label="Oldest open item">{since(h?.queue.oldestCreatedAt)}</Field>
            <Field label="Audit events (24h)">{fmtCount(h?.operations.auditEvents24h)}</Field>
            <Field label="Most recent audit entry">{since(h?.operations.lastAuditAt)}</Field>
          </div>
          <Link className="btn ghost small" to="/admin/queue">
            Open the work queue
          </Link>
        </HealthPanel>

        {/* ----------------------------- storage ----------------------------- */}
        <HealthPanel
          title="Attachment storage"
          status={storageVerdict.status}
          description="The bug-attachments bucket must be private. A public bucket exposes files submitted in confidence."
          error={health.error}
          loading={health.loading && !h}
          onRetry={health.reload}
        >
          <div className="admin-check-list">
            <HealthLine status={storageVerdict.status} label="bug-attachments bucket" detail={storageVerdict.reason} />
          </div>
          <p className="admin-inline-note">
            Uploaded files are <strong>not scanned for malware</strong>. The mitigations are a narrow type allowlist
            (PNG, JPEG, WebP, PDF, verified from the file's own bytes), size caps, private storage and 60-second signed
            URLs.
          </p>
        </HealthPanel>

        {/* -------------------------- recent failures ------------------------ */}
        <section className="admin-panel" aria-labelledby="sys-failures">
          <div className="admin-panel-head">
            <h2 id="sys-failures">Recent operational failures</h2>
          </div>
          <p className="admin-panel-note">Deduplicated failure alerts and failed sends from the last 7 days.</p>
          {failures.error ? (
            <p className="admin-inline-note">This list could not be read, so recent failures are unknown.</p>
          ) : failures.loading && !failures.data ? (
            <Loading />
          ) : (failures.data ?? []).length === 0 ? (
            <p className="admin-inline-note">No failure has been recorded in the last 7 days.</p>
          ) : (
            <ul className="admin-plain-list">
              {(failures.data ?? []).map((f, idx) => (
                <li key={`${f.source}-${f.occurredAt}-${idx}`}>
                  <Chip tone={f.severity === 'critical' || f.severity === 'high' ? 'critical' : 'muted'}>
                    {humanize(f.severity)}
                  </Chip>{' '}
                  {f.summary} · <span title={formatDateTime(f.occurredAt)}>{timeAgo(f.occurredAt)}</span>
                  {f.acknowledged && ' · dismissed'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {h?.generatedAt && <p className="admin-generated-at">Health data generated {timeAgo(h.generatedAt)}.</p>}
    </div>
  )
}

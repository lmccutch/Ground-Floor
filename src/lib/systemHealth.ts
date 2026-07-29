// The single, documented home for every system-health threshold and every
// health verdict in Open Floor. Components render what this module decides; they
// never compare a number to a literal themselves.
//
// THE RULE THIS MODULE ENFORCES
//   A check may only be Healthy when current data PROVES it. Absence of evidence
//   is Unknown — never Healthy. Every helper below therefore takes evidence that
//   can be null/undefined and returns 'unknown' for it, rather than defaulting to
//   a pass. There is deliberately no code path that upgrades 'unknown' to
//   'healthy'.
//
// Pure and unit-tested: no React, no network, no side effects.

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

/** Configuration presence as reported by admin-system-diagnostics. Never a value. */
export type ConfigState = 'configured' | 'missing' | 'invalid_format' | 'unknown'

/** Deployment probe result for an Edge Function. */
export type DeploymentState = 'deployed' | 'not_deployed' | 'unknown'

/* ============================== thresholds ================================= */

/**
 * Every threshold in one place, with the reasoning attached. Changing an
 * operational tolerance means changing exactly one line here.
 */
export const THRESHOLDS = {
  /** A queued message not handed to the provider within this long is stuck. */
  emailStuckQueuedHours: 1,
  /** Failed sends in 24h before the email channel is degraded / broken. */
  emailFailed24hWarning: 1,
  emailFailed24hCritical: 5,
  /** A bounce is only retryable after the provider's own delay window. */
  emailDelayedRetryHours: 6,
  /** Complaints are rare and serious: even one in a week is worth surfacing. */
  emailComplained7dWarning: 1,
  /** Bounces happen; a cluster suggests a list or domain problem. */
  emailBounced7dWarning: 3,
  /**
   * How long we tolerate silence from the delivery webhook while messages are
   * actually being sent. Resend delivers events within seconds, so a day of
   * silence after a recent send means the endpoint or secret is broken.
   */
  webhookSilenceHours: 24,
  /** Work-queue backlog before the operator is told to catch up. */
  queueBacklogWarning: 25,
  queueBacklogCritical: 75,
  /** An open work item older than this is stale. */
  queueStaleDays: 7,
  /** Unprocessed intake ('new') before triage is considered behind. */
  intakeUnprocessedWarning: 10,
  /** Unread admin notifications before the inbox is considered neglected. */
  notificationsUnreadWarning: 25,
  /** Eligible-but-unretried failed emails before the backlog is flagged. */
  retryBacklogWarning: 3,
  /** A system-warning acknowledgement lapses after this long (mirrors SQL). */
  acknowledgementHours: 24,
} as const

/* ============================ status helpers =============================== */

const RANK: Record<HealthStatus, number> = { healthy: 0, unknown: 1, warning: 2, critical: 3 }

/**
 * Combines child statuses into a parent. Note that 'unknown' outranks 'healthy':
 * a section containing an unverifiable check is never reported as fully healthy.
 */
export function worst(...statuses: (HealthStatus | undefined | null)[]): HealthStatus {
  const present = statuses.filter((s): s is HealthStatus => Boolean(s))
  if (present.length === 0) return 'unknown'
  return present.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'healthy' as HealthStatus)
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  unknown: 'Unknown',
}

export const STATUS_MEANING: Record<HealthStatus, string> = {
  healthy: 'Verified from current data.',
  warning: 'Degraded, or the evidence is stale.',
  critical: 'A known broken condition.',
  unknown: 'This cannot be verified — it is not a pass.',
}

/** Config presence → status. 'unknown' stays unknown; it never becomes healthy. */
export function configStatus(state: ConfigState | undefined, required: boolean): HealthStatus {
  if (state === 'configured') return 'healthy'
  if (state === 'invalid_format') return 'critical'
  if (state === 'missing') return required ? 'critical' : 'warning'
  return 'unknown'
}

export function deploymentStatus(state: DeploymentState | undefined): HealthStatus {
  if (state === 'deployed') return 'healthy'
  if (state === 'not_deployed') return 'critical'
  return 'unknown'
}

/** Hours since an ISO timestamp, or null when there is no timestamp at all. */
export function hoursSince(iso: string | null | undefined, now: number = Date.now()): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return (now - t) / 3_600_000
}

/* ============================ domain verdicts ============================== */

export type EmailHealthInput = {
  totalMessages?: number | null
  lastSendAt?: string | null
  lastDeliveredAt?: string | null
  failed24h?: number | null
  failed7d?: number | null
  bounced7d?: number | null
  complained7d?: number | null
  delayedCurrent?: number | null
  stuckQueued?: number | null
  statusInconsistencies?: number | null
  lastWebhookEventAt?: string | null
  retryBacklog?: number | null
}

/**
 * Email delivery verdict.
 *
 * Explicitly: having sent nothing yet is UNKNOWN, not healthy — an untested
 * channel is not a working one. That is the single most tempting false green on
 * this page, so it is handled first.
 */
export function emailStatus(e: EmailHealthInput): { status: HealthStatus; reason: string } {
  if (e.totalMessages == null) return { status: 'unknown', reason: 'Email delivery data could not be read.' }
  if (e.totalMessages === 0) {
    return { status: 'unknown', reason: 'No email has ever been sent, so delivery is unproven. This is not a pass.' }
  }
  if ((e.failed24h ?? 0) >= THRESHOLDS.emailFailed24hCritical) {
    return { status: 'critical', reason: `${e.failed24h} sends failed in the last 24 hours.` }
  }
  if ((e.stuckQueued ?? 0) > 0) {
    return { status: 'critical', reason: `${e.stuckQueued} message(s) queued for over ${THRESHOLDS.emailStuckQueuedHours}h and never handed to the provider.` }
  }
  if ((e.statusInconsistencies ?? 0) > 0) {
    return { status: 'critical', reason: `${e.statusInconsistencies} message(s) have contradictory delivery state — a recorder bug, not a delivery problem.` }
  }
  if ((e.failed24h ?? 0) >= THRESHOLDS.emailFailed24hWarning) {
    return { status: 'warning', reason: `${e.failed24h} send(s) failed in the last 24 hours.` }
  }
  if ((e.complained7d ?? 0) >= THRESHOLDS.emailComplained7dWarning) {
    return { status: 'warning', reason: `${e.complained7d} spam complaint(s) in the last 7 days.` }
  }
  if ((e.bounced7d ?? 0) >= THRESHOLDS.emailBounced7dWarning) {
    return { status: 'warning', reason: `${e.bounced7d} bounce(s) in the last 7 days.` }
  }
  if ((e.retryBacklog ?? 0) >= THRESHOLDS.retryBacklogWarning) {
    return { status: 'warning', reason: `${e.retryBacklog} failed message(s) are eligible for retry and waiting.` }
  }
  if (!e.lastDeliveredAt) {
    return { status: 'unknown', reason: 'No delivery has ever been confirmed by the provider, so delivery cannot be called healthy.' }
  }
  return { status: 'healthy', reason: 'Recent sends are being delivered and no failures are outstanding.' }
}

/**
 * Webhook verdict, judged only against SENDS. Silence with nothing sent proves
 * nothing; silence after a recent send is real evidence of a broken endpoint.
 */
export function webhookStatus(
  lastEventAt: string | null | undefined,
  lastSendAt: string | null | undefined,
  now: number = Date.now(),
): { status: HealthStatus; reason: string } {
  const sinceSend = hoursSince(lastSendAt, now)
  const sinceEvent = hoursSince(lastEventAt, now)

  if (sinceEvent == null) {
    if (sinceSend == null) {
      return { status: 'unknown', reason: 'Nothing has been sent, so there is no webhook evidence either way.' }
    }
    if (sinceSend > THRESHOLDS.webhookSilenceHours) {
      return { status: 'critical', reason: `Mail has been sent but no delivery event has EVER been received. The webhook or its signing secret is almost certainly wrong.` }
    }
    return { status: 'unknown', reason: 'No delivery event received yet for the recent send. Give it a few minutes.' }
  }
  if (sinceEvent > THRESHOLDS.webhookSilenceHours && sinceSend != null && sinceSend < sinceEvent) {
    return { status: 'critical', reason: `Mail was sent ${Math.round(sinceSend)}h ago but the last webhook event was ${Math.round(sinceEvent)}h ago. Events have stopped arriving.` }
  }
  if (sinceEvent > THRESHOLDS.webhookSilenceHours) {
    return { status: 'warning', reason: `No webhook event in ${Math.round(sinceEvent)}h. Nothing recent has been sent, so this may simply be quiet.` }
  }
  return { status: 'healthy', reason: `A signed delivery event was received ${Math.round(sinceEvent)}h ago.` }
}

export function queueStatus(open: number | null | undefined, oldestAt: string | null | undefined, now: number = Date.now()): { status: HealthStatus; reason: string } {
  if (open == null) return { status: 'unknown', reason: 'The work queue could not be read.' }
  const ageDays = (hoursSince(oldestAt, now) ?? 0) / 24
  if (open >= THRESHOLDS.queueBacklogCritical) return { status: 'critical', reason: `${open} open work items.` }
  if (open >= THRESHOLDS.queueBacklogWarning) return { status: 'warning', reason: `${open} open work items.` }
  if (oldestAt && ageDays > THRESHOLDS.queueStaleDays) {
    return { status: 'warning', reason: `The oldest open item has been waiting ${Math.floor(ageDays)} days.` }
  }
  return { status: 'healthy', reason: open === 0 ? 'The queue is clear.' : `${open} open item(s), none stale.` }
}

/** The private-attachment-bucket invariant. A public bucket is always critical. */
export function storageStatus(s: { readable?: boolean; exists?: boolean | null; isPublic?: boolean | null } | null | undefined): { status: HealthStatus; reason: string } {
  if (!s || s.readable === false) return { status: 'unknown', reason: 'The storage catalogue could not be read from the database.' }
  if (s.exists === false) return { status: 'unknown', reason: 'The bug-attachments bucket does not exist yet. Create it before enabling attachments.' }
  if (s.isPublic === true) return { status: 'critical', reason: 'The bug-attachments bucket is PUBLIC. Private files are exposed — make it private immediately.' }
  if (s.isPublic === false) return { status: 'healthy', reason: 'The bug-attachments bucket is private.' }
  return { status: 'unknown', reason: 'The bucket visibility could not be determined.' }
}

/** Migration drift: expected (in source) versus applied (in the database). */
export function migrationStatus(
  expected: readonly string[],
  applied: readonly string[] | null | undefined,
): { status: HealthStatus; reason: string; missing: string[]; extra: string[] } {
  if (applied == null) {
    return { status: 'unknown', reason: 'The applied-migration list could not be read.', missing: [], extra: [] }
  }
  if (applied.length === 0) {
    return { status: 'unknown', reason: 'This database records no migration history, so drift cannot be checked.', missing: [], extra: [] }
  }
  const appliedSet = new Set(applied)
  const expectedSet = new Set(expected)
  const missing = expected.filter(v => !appliedSet.has(v))
  const extra = applied.filter(v => !expectedSet.has(v))
  if (missing.length > 0) {
    return { status: 'critical', reason: `${missing.length} migration(s) in this build have not been applied to the database.`, missing, extra }
  }
  if (extra.length > 0) {
    return { status: 'warning', reason: `The database has ${extra.length} migration(s) this build does not know about — it is likely ahead of the deployed frontend.`, missing, extra }
  }
  return { status: 'healthy', reason: `All ${expected.length} migrations are applied.`, missing, extra }
}

/* ============================== warnings =================================== */

export type SystemWarning = {
  key: string
  status: Exclude<HealthStatus, 'healthy'>
  title: string
  detail: string
  acknowledged?: boolean
}

/** Sorts warnings so the most serious are read first. */
export function sortWarnings(warnings: SystemWarning[]): SystemWarning[] {
  return [...warnings].sort((a, b) => {
    if (Boolean(a.acknowledged) !== Boolean(b.acknowledged)) return a.acknowledged ? 1 : -1
    return RANK[b.status] - RANK[a.status]
  })
}

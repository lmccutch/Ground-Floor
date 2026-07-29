import { describe, expect, it } from 'vitest'
import {
  configStatus,
  deploymentStatus,
  emailStatus,
  hoursSince,
  migrationStatus,
  queueStatus,
  sortWarnings,
  storageStatus,
  THRESHOLDS,
  webhookStatus,
  worst,
  type SystemWarning,
} from './systemHealth'

/* ===========================================================================
   The invariant these tests exist to protect: NOTHING may report Healthy
   without positive evidence. Every "absence" case below asserts Unknown or
   worse — because a green tick on this page is a claim the operator will act on.
   =========================================================================== */

const HOUR = 3_600_000
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString()

describe('worst()', () => {
  it('ranks unknown above healthy so an unverifiable section is never fully healthy', () => {
    expect(worst('healthy', 'unknown')).toBe('unknown')
    expect(worst('healthy', 'healthy')).toBe('healthy')
  })

  it('lets warning and critical outrank unknown', () => {
    expect(worst('unknown', 'warning')).toBe('warning')
    expect(worst('warning', 'critical')).toBe('critical')
    expect(worst('critical', 'unknown', 'healthy')).toBe('critical')
  })

  it('is unknown when there is nothing to combine', () => {
    expect(worst()).toBe('unknown')
    expect(worst(undefined, null)).toBe('unknown')
  })
})

describe('configStatus()', () => {
  it('never turns an unreadable configuration into healthy', () => {
    expect(configStatus(undefined, true)).toBe('unknown')
    expect(configStatus('unknown', true)).toBe('unknown')
    expect(configStatus('unknown', false)).toBe('unknown')
  })

  it('treats a missing required secret as critical and an optional one as a warning', () => {
    expect(configStatus('missing', true)).toBe('critical')
    expect(configStatus('missing', false)).toBe('warning')
  })

  it('treats a malformed value as critical regardless of whether it is required', () => {
    expect(configStatus('invalid_format', false)).toBe('critical')
  })

  it('is healthy only when the secret is actually configured', () => {
    expect(configStatus('configured', true)).toBe('healthy')
  })
})

describe('deploymentStatus()', () => {
  it('reports an unprobeable function as unknown, not deployed', () => {
    expect(deploymentStatus(undefined)).toBe('unknown')
    expect(deploymentStatus('unknown')).toBe('unknown')
  })

  it('reports a 404 from the gateway as critical', () => {
    expect(deploymentStatus('not_deployed')).toBe('critical')
    expect(deploymentStatus('deployed')).toBe('healthy')
  })
})

describe('emailStatus()', () => {
  it('is UNKNOWN when nothing has ever been sent — an untested channel is not a working one', () => {
    const r = emailStatus({ totalMessages: 0 })
    expect(r.status).toBe('unknown')
    expect(r.reason).toMatch(/not a pass/i)
  })

  it('is unknown when the data could not be read at all', () => {
    expect(emailStatus({ totalMessages: null }).status).toBe('unknown')
  })

  it('is unknown when messages were sent but no delivery was ever confirmed', () => {
    const r = emailStatus({ totalMessages: 5, lastSendAt: ago(1), lastDeliveredAt: null })
    expect(r.status).toBe('unknown')
  })

  it('is critical on a cluster of failures', () => {
    const r = emailStatus({ totalMessages: 20, failed24h: THRESHOLDS.emailFailed24hCritical, lastDeliveredAt: ago(1) })
    expect(r.status).toBe('critical')
  })

  it('is critical when messages are stuck in the queue', () => {
    expect(emailStatus({ totalMessages: 5, stuckQueued: 1, lastDeliveredAt: ago(1) }).status).toBe('critical')
  })

  it('is critical when delivery timestamps contradict the recorded status', () => {
    const r = emailStatus({ totalMessages: 5, statusInconsistencies: 2, lastDeliveredAt: ago(1) })
    expect(r.status).toBe('critical')
    expect(r.reason).toMatch(/recorder bug/i)
  })

  it('warns on a single failure, a complaint, or a bounce cluster', () => {
    expect(emailStatus({ totalMessages: 9, failed24h: 1, lastDeliveredAt: ago(1) }).status).toBe('warning')
    expect(emailStatus({ totalMessages: 9, complained7d: 1, lastDeliveredAt: ago(1) }).status).toBe('warning')
    expect(emailStatus({ totalMessages: 9, bounced7d: THRESHOLDS.emailBounced7dWarning, lastDeliveredAt: ago(1) }).status).toBe('warning')
  })

  it('warns when eligible failures are piling up unretried', () => {
    const r = emailStatus({ totalMessages: 30, retryBacklog: THRESHOLDS.retryBacklogWarning, lastDeliveredAt: ago(1) })
    expect(r.status).toBe('warning')
  })

  it('is healthy only with sends, a confirmed delivery and no outstanding failures', () => {
    const r = emailStatus({ totalMessages: 12, lastSendAt: ago(1), lastDeliveredAt: ago(1), failed24h: 0 })
    expect(r.status).toBe('healthy')
  })
})

describe('webhookStatus()', () => {
  it('is unknown when nothing has been sent — silence proves nothing', () => {
    expect(webhookStatus(null, null).status).toBe('unknown')
  })

  it('is unknown, not healthy, while a very recent send awaits its first event', () => {
    expect(webhookStatus(null, ago(1)).status).toBe('unknown')
  })

  it('is critical when mail has been sent for a long time and NO event has ever arrived', () => {
    const r = webhookStatus(null, ago(THRESHOLDS.webhookSilenceHours + 5))
    expect(r.status).toBe('critical')
    expect(r.reason).toMatch(/signing secret/i)
  })

  it('is critical when events stopped arriving but sending continued', () => {
    const r = webhookStatus(ago(THRESHOLDS.webhookSilenceHours + 10), ago(2))
    expect(r.status).toBe('critical')
  })

  it('only warns when both the events and the sends are old — the system may just be quiet', () => {
    const r = webhookStatus(ago(THRESHOLDS.webhookSilenceHours + 2), ago(THRESHOLDS.webhookSilenceHours + 40))
    expect(r.status).toBe('warning')
  })

  it('is healthy on a recent signed event', () => {
    expect(webhookStatus(ago(1), ago(2)).status).toBe('healthy')
  })
})

describe('queueStatus()', () => {
  it('is unknown when the queue could not be read', () => {
    expect(queueStatus(null, null).status).toBe('unknown')
  })

  it('escalates with backlog size', () => {
    expect(queueStatus(0, null).status).toBe('healthy')
    expect(queueStatus(THRESHOLDS.queueBacklogWarning, null).status).toBe('warning')
    expect(queueStatus(THRESHOLDS.queueBacklogCritical, null).status).toBe('critical')
  })

  it('warns on a small but stale queue', () => {
    const r = queueStatus(2, ago(24 * (THRESHOLDS.queueStaleDays + 2)))
    expect(r.status).toBe('warning')
    expect(r.reason).toMatch(/waiting/i)
  })
})

describe('storageStatus()', () => {
  it('is unknown when the catalogue is unreadable or the bucket is absent', () => {
    expect(storageStatus(null).status).toBe('unknown')
    expect(storageStatus({ readable: false }).status).toBe('unknown')
    expect(storageStatus({ readable: true, exists: false }).status).toBe('unknown')
  })

  it('is CRITICAL when the private bucket has been made public', () => {
    const r = storageStatus({ readable: true, exists: true, isPublic: true })
    expect(r.status).toBe('critical')
    expect(r.reason).toMatch(/PUBLIC/)
  })

  it('is healthy only when the bucket exists and is private', () => {
    expect(storageStatus({ readable: true, exists: true, isPublic: false }).status).toBe('healthy')
  })
})

describe('migrationStatus()', () => {
  const expected = ['202607100001', '202607280002', '202607280003']

  it('is unknown when the applied list could not be read or is empty', () => {
    expect(migrationStatus(expected, null).status).toBe('unknown')
    expect(migrationStatus(expected, []).status).toBe('unknown')
  })

  it('is critical when the database is behind this build, and names what is missing', () => {
    const r = migrationStatus(expected, ['202607100001'])
    expect(r.status).toBe('critical')
    expect(r.missing).toEqual(['202607280002', '202607280003'])
  })

  it('warns when the database is ahead of this build', () => {
    const r = migrationStatus(expected, [...expected, '202607290001'])
    expect(r.status).toBe('warning')
    expect(r.extra).toEqual(['202607290001'])
  })

  it('is healthy only on an exact match', () => {
    expect(migrationStatus(expected, expected).status).toBe('healthy')
  })
})

describe('hoursSince()', () => {
  it('returns null rather than 0 for a missing or invalid timestamp', () => {
    expect(hoursSince(null)).toBeNull()
    expect(hoursSince(undefined)).toBeNull()
    expect(hoursSince('not a date')).toBeNull()
  })

  it('measures elapsed hours', () => {
    expect(hoursSince(ago(3))).toBeCloseTo(3, 1)
  })
})

describe('sortWarnings()', () => {
  const w = (key: string, status: SystemWarning['status'], acknowledged = false): SystemWarning => ({
    key, status, title: key, detail: '', acknowledged,
  })

  it('puts the most serious first and sinks acknowledged warnings', () => {
    const sorted = sortWarnings([w('a', 'warning'), w('b', 'critical'), w('c', 'critical', true), w('d', 'unknown')])
    expect(sorted.map(x => x.key)).toEqual(['b', 'a', 'd', 'c'])
  })
})

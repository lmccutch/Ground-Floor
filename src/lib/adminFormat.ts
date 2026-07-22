// Presentation helpers for the admin centre — pure and unit-testable.

export type Tone = 'critical' | 'high' | 'normal' | 'low' | 'info' | 'success' | 'muted'

/** Compact relative age, e.g. "just now", "5m", "3h", "4d", "2w". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 45) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 9) return `${weeks}w`
  const months = Math.floor(days / 30)
  if (months < 18) return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

/** Absolute, human date-time for detail views and tooltips. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, critical: 0, high: 1, normal: 2, medium: 2, low: 3 }
export function priorityRank(p?: string): number {
  return PRIORITY_RANK[(p ?? '').toLowerCase()] ?? 2
}

export function priorityTone(p?: string): Tone {
  const v = (p ?? '').toLowerCase()
  if (v === 'urgent' || v === 'critical') return 'critical'
  if (v === 'high') return 'high'
  if (v === 'low') return 'low'
  return 'normal'
}

// Coarse status → tone mapping shared across pages (color is never the only cue —
// the status text is always shown alongside).
export function statusTone(status?: string): Tone {
  const v = (status ?? '').toLowerCase()
  if (['new', 'pending', 'pending_review', 'open', 'reported', 'outreach_required'].includes(v)) return 'high'
  if (['under_review', 'reviewing', 'triaged', 'confirmed', 'in_progress', 'waiting_on_user', 'near_threshold', 'threshold_reached', 'escalated'].includes(v)) return 'info'
  if (['approved', 'published', 'fixed', 'deployed', 'resolved', 'restored', 'action_taken', 'completed', 'management_engaged', 'scheduled'].includes(v)) return 'success'
  if (['rejected', 'removed', 'hidden', 'closed', 'spam', 'duplicate', 'dismissed', 'cannot_reproduce', 'stalled', 'paused', 'archived'].includes(v)) return 'muted'
  return 'normal'
}

/** Human label for enum-ish snake/case values, e.g. "outreach_required" → "Outreach required". */
export function humanize(value?: string): string {
  if (!value) return '—'
  const s = value.replace(/[_-]+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { formatDateTime, humanize, priorityRank, priorityTone, statusTone, timeAgo } from './adminFormat'

describe('adminFormat — timeAgo', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-07-22T12:00:00Z')))
  afterEach(() => vi.useRealTimers())

  it('returns an em dash for missing or invalid input', () => {
    expect(timeAgo(undefined)).toBe('—')
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo('not-a-date')).toBe('—')
  })

  it('renders compact buckets from seconds up to years', () => {
    const iso = (ms: number) => new Date(Date.now() - ms).toISOString()
    expect(timeAgo(iso(10 * 1000))).toBe('just now')
    expect(timeAgo(iso(5 * 60 * 1000))).toBe('5m')
    expect(timeAgo(iso(3 * 60 * 60 * 1000))).toBe('3h')
    expect(timeAgo(iso(4 * 24 * 60 * 60 * 1000))).toBe('4d')
    expect(timeAgo(iso(3 * 7 * 24 * 60 * 60 * 1000))).toBe('3w')
    expect(timeAgo(iso(3 * 30 * 24 * 60 * 60 * 1000))).toBe('3mo')
    expect(timeAgo(iso(2 * 365 * 24 * 60 * 60 * 1000))).toBe('2y')
  })

  it('never renders a negative age for a future timestamp', () => {
    expect(timeAgo(new Date(Date.now() + 60_000).toISOString())).toBe('just now')
  })
})

describe('adminFormat — formatDateTime', () => {
  it('returns an em dash for missing or invalid input', () => {
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('nope')).toBe('—')
  })

  it('produces a human date-time string for a valid ISO timestamp', () => {
    const out = formatDateTime('2026-07-22T12:00:00Z')
    expect(out).not.toBe('—')
    expect(out).toMatch(/2026/)
  })
})

describe('adminFormat — priority ranking and tone', () => {
  it('orders critical/urgent before high before normal before low', () => {
    expect(priorityRank('urgent')).toBeLessThan(priorityRank('high'))
    expect(priorityRank('critical')).toBeLessThan(priorityRank('high'))
    expect(priorityRank('high')).toBeLessThan(priorityRank('normal'))
    expect(priorityRank('normal')).toBeLessThan(priorityRank('low'))
  })

  it('treats unknown and medium as the normal band', () => {
    expect(priorityRank('medium')).toBe(priorityRank('normal'))
    expect(priorityRank(undefined)).toBe(priorityRank('normal'))
    expect(priorityRank('whatever')).toBe(priorityRank('normal'))
  })

  it('maps priority to a colour tone', () => {
    expect(priorityTone('critical')).toBe('critical')
    expect(priorityTone('urgent')).toBe('critical')
    expect(priorityTone('high')).toBe('high')
    expect(priorityTone('low')).toBe('low')
    expect(priorityTone('normal')).toBe('normal')
  })
})

describe('adminFormat — statusTone', () => {
  it('flags actionable states, in-progress states, resolved states and closed states distinctly', () => {
    expect(statusTone('pending')).toBe('high')
    expect(statusTone('under_review')).toBe('info')
    expect(statusTone('resolved')).toBe('success')
    expect(statusTone('closed')).toBe('muted')
    expect(statusTone('unknown_status')).toBe('normal')
  })
})

describe('adminFormat — humanize', () => {
  it('turns snake/kebab enum values into sentence case', () => {
    expect(humanize('outreach_required')).toBe('Outreach required')
    expect(humanize('needs-information')).toBe('Needs information')
    expect(humanize('pending')).toBe('Pending')
  })

  it('returns an em dash for empty input', () => {
    expect(humanize(undefined)).toBe('—')
    expect(humanize('')).toBe('—')
  })
})

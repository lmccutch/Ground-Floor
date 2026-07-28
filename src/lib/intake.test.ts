import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mutable supabase mock so we can exercise both the wired and the unavailable path.
const invoke = vi.fn()
const ref: { current: unknown } = { current: { functions: { invoke } } }
vi.mock('./supabase', () => ({ get supabase() { return ref.current } }))

import { submitBugReport, submitSupportTicket, newIdempotencyKey, INTAKE_UNAVAILABLE } from './intake'

beforeEach(() => {
  invoke.mockReset()
  ref.current = { functions: { invoke } }
})

describe('newIdempotencyKey', () => {
  it('returns a distinct string each call', () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey())
    expect(typeof newIdempotencyKey()).toBe('string')
  })
})

describe('submitBugReport', () => {
  it('invokes submit-intake with kind=bug, the payload, and the idempotency key', async () => {
    invoke.mockResolvedValue({ data: { ok: true, reference: 'BUG-ABC12345' }, error: null })
    const res = await submitBugReport({ description: 'x'.repeat(20), steps: 'do a thing', idempotencyKey: 'k1', website: '' })
    expect(res.reference).toBe('BUG-ABC12345')
    const [fnName, opts] = invoke.mock.calls[0] as [string, { body: any }]
    expect(fnName).toBe('submit-intake')
    expect(opts.body.kind).toBe('bug')
    expect(opts.body.idempotencyKey).toBe('k1')
    expect(opts.body.payload.description).toContain('x')
    // Honeypot value is forwarded so the server can decide.
    expect(opts.body).toHaveProperty('website')
    // Never forwards a client-supplied user id / status / severity.
    expect(opts.body.payload).not.toHaveProperty('submitted_by')
    expect(opts.body.payload).not.toHaveProperty('status')
    expect(opts.body.payload).not.toHaveProperty('severity')
  })

  it('throws when the function reports not-ok', async () => {
    invoke.mockResolvedValue({ data: { ok: false }, error: null })
    await expect(submitBugReport({ description: 'x'.repeat(20), idempotencyKey: 'k' })).rejects.toThrow()
  })

  it('throws INTAKE_UNAVAILABLE when Supabase is not configured', async () => {
    ref.current = null
    await expect(submitBugReport({ description: 'x'.repeat(20), idempotencyKey: 'k' })).rejects.toThrow(INTAKE_UNAVAILABLE)
  })
})

describe('submitSupportTicket', () => {
  it('invokes submit-intake with kind=support and returns the ticket number', async () => {
    invoke.mockResolvedValue({ data: { ok: true, ticket_number: 'OF-2026-00001' }, error: null })
    const res = await submitSupportTicket({ category: 'privacy', message: 'x'.repeat(20), email: 'a@b.co', idempotencyKey: 'k2' })
    expect(res.ticketNumber).toBe('OF-2026-00001')
    const [, opts] = invoke.mock.calls[0] as [string, { body: any }]
    expect(opts.body.kind).toBe('support')
    expect(opts.body.payload.category).toBe('privacy')
    // No client control over status/priority/assignment.
    expect(opts.body.payload).not.toHaveProperty('status')
    expect(opts.body.payload).not.toHaveProperty('priority')
  })
})

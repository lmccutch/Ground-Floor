// Client for the public intake layer (Prompt 4). Both forms submit through the
// submit-intake Edge Function, which enforces the honeypot / Turnstile / per-IP
// controls a browser cannot be trusted with and then delegates to the
// SECURITY DEFINER submission RPCs. The browser never inserts into operational
// tables directly and never sees a Resend key.

import { supabase } from './supabase'

/** A per-form-instance idempotency token so an accidental double-submit (or a
 *  network retry) can never create a second record. Generated once when a form
 *  mounts and reused across retries of THAT submission. */
export function newIdempotencyKey(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

// Best-effort, privacy-safe technical context. We never capture cookies, storage,
// tokens, or query strings (which can carry sensitive values from other pages).
function captureContext(): Record<string, string | undefined> {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return {}
  const ua = navigator.userAgent || ''
  const os = /Windows/i.test(ua) ? 'Windows' : /Mac OS X|Macintosh/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Linux/i.test(ua) ? 'Linux' : undefined
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : undefined
  const deviceType = /Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : /iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop'
  // Page the user came from, path only (strip any query string).
  let pageUrl: string | undefined
  try { pageUrl = document.referrer ? new URL(document.referrer).pathname : undefined } catch { pageUrl = undefined }
  const screenSize = window.screen ? `${window.screen.width}x${window.screen.height}` : undefined
  return { pageUrl, browser, os, deviceType, screenSize, appVersion: (import.meta.env.VITE_APP_COMMIT as string | undefined) ?? import.meta.env.MODE }
}

export const INTAKE_UNAVAILABLE = 'intake_unavailable'

async function invoke(kind: 'bug' | 'support', payload: Record<string, unknown>, opts: { turnstileToken?: string; website?: string; idempotencyKey: string }) {
  if (!supabase) throw new Error(INTAKE_UNAVAILABLE)
  const { data, error } = await supabase.functions.invoke('submit-intake', {
    body: { kind, payload, turnstileToken: opts.turnstileToken ?? '', website: opts.website ?? '', idempotencyKey: opts.idempotencyKey },
  })
  if (error) throw error
  const d = data as { ok?: boolean; reference?: string; ticket_number?: string } | null
  if (!d?.ok) throw new Error('intake_failed')
  return d
}

export type BugReportInput = {
  description: string
  steps?: string
  expected?: string
  actual?: string
  email?: string
  turnstileToken?: string
  website?: string
  idempotencyKey: string
}

export async function submitBugReport(input: BugReportInput): Promise<{ reference: string | null }> {
  const ctx = captureContext()
  const d = await invoke('bug', {
    description: input.description,
    steps: input.steps || undefined,
    expected: input.expected || undefined,
    actual: input.actual || undefined,
    email: input.email || undefined,
    ...ctx,
  }, input)
  return { reference: d.reference ?? null }
}

export type SupportTicketInput = {
  category: string
  message: string
  subject?: string
  name?: string
  email?: string
  turnstileToken?: string
  website?: string
  idempotencyKey: string
}

export async function submitSupportTicket(input: SupportTicketInput): Promise<{ ticketNumber: string | null }> {
  const d = await invoke('support', {
    category: input.category,
    message: input.message,
    subject: input.subject || undefined,
    name: input.name || undefined,
    email: input.email || undefined,
  }, input)
  return { ticketNumber: d.ticket_number ?? null }
}

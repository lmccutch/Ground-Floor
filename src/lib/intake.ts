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

/* -------------------------------- attachments ------------------------------ */

/** Limits mirrored from the server. The server re-checks ALL of them (and the
 *  file's real magic bytes) — these exist to give a fast, kind error rather than
 *  to be the enforcement point. */
export const ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 10 * 1024 * 1024,
  /** SVG is deliberately absent: it is a script-bearing format. */
  accept: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const,
} as const

export const ATTACHMENT_ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf'

export type AttachmentError = 'too_many' | 'too_large' | 'total_too_large' | 'unsupported_type' | 'unreadable'

export const ATTACHMENT_ERROR_TEXT: Record<AttachmentError, string> = {
  too_many: `You can attach up to ${ATTACHMENT_LIMITS.maxFiles} files.`,
  too_large: 'Each file must be 5 MB or smaller.',
  total_too_large: 'Your attachments come to more than 10 MB in total.',
  unsupported_type: 'Only PNG, JPEG, WebP and PDF files can be attached.',
  unreadable: 'That file could not be read. Try selecting it again.',
}

/** Client-side pre-check. Returns the first problem, or null when the selection
 *  is acceptable. The server validates independently and is the real gate. */
export function validateAttachmentSelection(files: File[]): AttachmentError | null {
  if (files.length > ATTACHMENT_LIMITS.maxFiles) return 'too_many'
  let total = 0
  for (const f of files) {
    if (f.size > ATTACHMENT_LIMITS.maxFileBytes) return 'too_large'
    total += f.size
    if (!(ATTACHMENT_LIMITS.accept as readonly string[]).includes(f.type)) return 'unsupported_type'
  }
  if (total > ATTACHMENT_LIMITS.maxTotalBytes) return 'total_too_large'
  return null
}

type EncodedAttachment = { filename: string; contentType: string; dataBase64: string }

async function encode(file: File): Promise<EncodedAttachment> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  // Chunked to avoid blowing the argument limit on a multi-megabyte file.
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < buffer.length; i += CHUNK) {
    binary += String.fromCharCode(...buffer.subarray(i, i + CHUNK))
  }
  return { filename: file.name, contentType: file.type, dataBase64: btoa(binary) }
}

async function invoke(
  kind: 'bug' | 'support',
  payload: Record<string, unknown>,
  opts: { turnstileToken?: string; website?: string; idempotencyKey: string },
  attachments?: EncodedAttachment[],
) {
  if (!supabase) throw new Error(INTAKE_UNAVAILABLE)
  const { data, error } = await supabase.functions.invoke('submit-intake', {
    body: {
      kind,
      payload,
      turnstileToken: opts.turnstileToken ?? '',
      website: opts.website ?? '',
      idempotencyKey: opts.idempotencyKey,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    },
  })
  if (error) throw error
  const d = data as { ok?: boolean; reference?: string; ticket_number?: string; attachments_stored?: number; attachments_failed?: boolean } | null
  if (!d?.ok) throw new Error('intake_failed')
  return d
}

export type BugReportInput = {
  description: string
  steps?: string
  expected?: string
  actual?: string
  email?: string
  /** Optional screenshots or a PDF. Validated here and again server-side. */
  attachments?: File[]
  turnstileToken?: string
  website?: string
  idempotencyKey: string
}

export async function submitBugReport(input: BugReportInput): Promise<{ reference: string | null; attachmentsStored: number; attachmentsFailed: boolean }> {
  const ctx = captureContext()
  const files = input.attachments ?? []
  if (files.length > 0) {
    const problem = validateAttachmentSelection(files)
    if (problem) throw new Error(problem)
  }
  let encoded: EncodedAttachment[] = []
  try {
    encoded = await Promise.all(files.map(encode))
  } catch {
    throw new Error('unreadable')
  }
  const d = await invoke('bug', {
    description: input.description,
    steps: input.steps || undefined,
    expected: input.expected || undefined,
    actual: input.actual || undefined,
    email: input.email || undefined,
    ...ctx,
  }, input, encoded)
  return {
    reference: d.reference ?? null,
    attachmentsStored: d.attachments_stored ?? 0,
    // Reported honestly: the report was saved, but a file did not make it.
    attachmentsFailed: Boolean(d.attachments_failed),
  }
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

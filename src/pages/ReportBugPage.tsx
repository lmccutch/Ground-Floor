import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bug, Check, ChevronRight, Paperclip, X } from 'lucide-react'
import { track } from '../lib/analytics'
import {
  ATTACHMENT_ACCEPT_ATTR,
  ATTACHMENT_ERROR_TEXT,
  ATTACHMENT_LIMITS,
  INTAKE_UNAVAILABLE,
  newIdempotencyKey,
  submitBugReport,
  validateAttachmentSelection,
  type AttachmentError,
} from '../lib/intake'
import { Turnstile, TURNSTILE_ENABLED } from '../components/Turnstile'

const schema = z.object({
  description: z.string().trim().min(10, 'Please describe the problem in a little more detail.').max(5000),
  steps: z.string().trim().max(5000).optional(),
  expected: z.string().trim().max(2000).optional(),
  actual: z.string().trim().max(2000).optional(),
  email: z.string().trim().max(254).email('Enter a valid email address.').optional().or(z.literal('')),
  website: z.string().max(0).optional(), // honeypot: must stay empty
})
type Values = z.infer<typeof schema>

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ReportBugPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState<{ reference: string | null; attachmentsStored: number; attachmentsFailed: boolean } | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const idempotencyKey = useMemo(() => newIdempotencyKey(), [])
  const startedRef = useRef(false)

  function addFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return
    const next = [...files, ...Array.from(selected)]
    const problem = validateAttachmentSelection(next)
    if (problem) {
      setFileError(ATTACHMENT_ERROR_TEXT[problem])
    } else {
      setFileError('')
      setFiles(next)
    }
    // Always clear the input so re-picking the same file fires a change event.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setFiles(current => current.filter((_, i) => i !== index))
    setFileError('')
  }
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function markStarted() {
    if (startedRef.current) return
    startedRef.current = true
    track('bug_report_started')
  }

  async function onSubmit(values: Values) {
    setSubmitError('')
    setConsentError('')
    if (!consent) {
      setConsentError('Please confirm before submitting.')
      return
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setSubmitError('Please complete the verification challenge above.')
      return
    }
    try {
      const result = await submitBugReport({
        description: values.description,
        steps: values.steps,
        expected: values.expected,
        actual: values.actual,
        email: values.email || undefined,
        attachments: files,
        turnstileToken,
        website: values.website,
        idempotencyKey,
      })
      track('bug_report_submitted')
      setDone(result)
    } catch (e) {
      const msg = (e as Error)?.message ?? ''
      if (msg in ATTACHMENT_ERROR_TEXT) {
        setFileError(ATTACHMENT_ERROR_TEXT[msg as AttachmentError])
        return
      }
      // The server rejects files it cannot verify; say so specifically rather
      // than blaming the whole report.
      if (msg.includes('attachment_too_large')) {
        setFileError(ATTACHMENT_ERROR_TEXT.too_large)
        return
      }
      if (msg.includes('attachment_type_rejected')) {
        setFileError('One of those files was rejected. Only genuine PNG, JPEG, WebP and PDF files can be attached.')
        return
      }
      setSubmitError(msg === INTAKE_UNAVAILABLE ? 'Bug reporting is temporarily unavailable. Please email us instead.' : 'We could not submit your report. Please try again.')
    }
  }

  if (done) {
    return (
      <div className="request-confirmation">
        <div className="success-icon">
          <Check size={24} />
        </div>
        <span className="eyebrow">Report received</span>
        <h1>Thanks — we’ve logged your report.</h1>
        {done.reference && (
          <p>
            Your reference is <b>{done.reference}</b>.
          </p>
        )}
        {done.attachmentsStored > 0 && (
          <p>
            {done.attachmentsStored} file{done.attachmentsStored === 1 ? '' : 's'} attached.
          </p>
        )}
        {/* Told plainly rather than quietly dropped. */}
        {done.attachmentsFailed && (
          <p className="form-error" role="alert">
            Your report was saved, but we could not store the file you attached. Nothing else was lost — if the file
            matters, reply to our confirmation email with it.
          </p>
        )}
        <p>We read every report. There’s no need to submit it again — we have it. If you gave an email, we may follow up there.</p>
        <div className="empty-actions">
          <button className="btn primary" onClick={() => navigate('/')}>
            Back to Open Floor <ChevronRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="request-page">
      <div className="request-intro">
        <span className="eyebrow">Report a bug</span>
        <h1>Something not working?</h1>
        <p>Tell us what happened. Technical details about your browser and device are attached automatically to help us reproduce it.</p>
      </div>
      <form className="panel request-form" onSubmit={handleSubmit(onSubmit)} onInput={markStarted} noValidate>
        <label className="field">
          What went wrong? <span className="admin-req" aria-hidden="true">*</span>
          <textarea className="text-input" rows={4} {...register('description')} placeholder="Describe the problem you ran into." aria-invalid={Boolean(errors.description)} />
          {errors.description && <small className="form-error" role="alert">{errors.description.message}</small>}
        </label>
        <label className="field">
          Steps to reproduce
          <textarea className="text-input" rows={3} {...register('steps')} placeholder="1. Go to… 2. Click… 3. See…" />
        </label>
        <div className="field-row">
          <label className="field">
            What you expected
            <input className="text-input" {...register('expected')} placeholder="What should have happened" />
          </label>
          <label className="field">
            What happened instead
            <input className="text-input" {...register('actual')} placeholder="What actually happened" />
          </label>
        </div>
        <label className="field">
          Your email (optional)
          <input className="text-input" type="email" {...register('email')} placeholder="So we can follow up — optional" autoComplete="email" aria-invalid={Boolean(errors.email)} />
          {errors.email && <small className="form-error" role="alert">{errors.email.message}</small>}
        </label>

        <fieldset className="field attachment-field">
          <legend>Screenshots or a PDF (optional)</legend>
          <p className="form-hint">
            Up to {ATTACHMENT_LIMITS.maxFiles} files, 5 MB each and 10 MB in total. PNG, JPEG, WebP or PDF.
          </p>
          <p className="form-hint form-hint-warning">
            Please don’t attach anything containing passwords, account numbers, identity documents or other sensitive
            personal information. We can’t scan uploads for viruses, so we only accept these few file types.
          </p>

          <input
            ref={fileInputRef}
            id="bug-attachments"
            className="visually-hidden-input"
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT_ATTR}
            onChange={e => addFiles(e.target.files)}
            disabled={files.length >= ATTACHMENT_LIMITS.maxFiles}
          />
          <label className="btn secondary small attachment-add" htmlFor="bug-attachments">
            <Paperclip size={14} aria-hidden="true" />{' '}
            {files.length === 0 ? 'Attach a file' : `Attach another (${files.length} of ${ATTACHMENT_LIMITS.maxFiles})`}
          </label>

          {files.length > 0 && (
            <ul className="attachment-list">
              {files.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`}>
                  <span className="attachment-name">{f.name}</span>
                  <span className="attachment-size">{formatSize(f.size)}</span>
                  <button type="button" className="icon-btn" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileError && (
            <small className="form-error" role="alert">
              {fileError}
            </small>
          )}
        </fieldset>

        {/* Honeypot — visually hidden, must stay empty. Real users never fill it. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
          <label>
            Leave this field empty
            <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          </label>
        </div>

        {TURNSTILE_ENABLED && <Turnstile onToken={setTurnstileToken} />}

        <label className="field checkbox-field">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>I understand this report and the technical details above will be stored so Open Floor can investigate.</span>
        </label>
        {consentError && <small className="form-error" role="alert">{consentError}</small>}

        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button className="btn primary full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Sending…' : 'Submit bug report'} <Bug size={15} />
        </button>
        <p className="form-footnote">Please don’t include passwords, financial account numbers, or verification codes.</p>
      </form>
    </div>
  )
}

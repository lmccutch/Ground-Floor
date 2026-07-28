import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bug, Check, ChevronRight } from 'lucide-react'
import { track } from '../lib/analytics'
import { newIdempotencyKey, submitBugReport, INTAKE_UNAVAILABLE } from '../lib/intake'
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

export function ReportBugPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState<{ reference: string | null } | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const idempotencyKey = useMemo(() => newIdempotencyKey(), [])
  const startedRef = useRef(false)
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
        turnstileToken,
        website: values.website,
        idempotencyKey,
      })
      track('bug_report_submitted')
      setDone(result)
    } catch (e) {
      const msg = (e as Error)?.message
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

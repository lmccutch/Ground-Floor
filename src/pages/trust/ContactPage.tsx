import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Mail, Send } from 'lucide-react'
import { track } from '../../lib/analytics'
import { CONTACT_EMAIL, CONTACT_EMAIL_IS_PLACEHOLDER, contactMailto, enquirySubject, type EnquiryType } from '../../lib/contact'
import { newIdempotencyKey, submitSupportTicket, INTAKE_UNAVAILABLE } from '../../lib/intake'
import { Turnstile, TURNSTILE_ENABLED } from '../../components/Turnstile'
import { TrustPage } from './TrustPage'

// support_tickets.category production values, with friendly labels.
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'technical_support', label: 'Technical support' },
  { value: 'company_request', label: 'Request a company' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'privacy', label: 'Privacy / data request' },
  { value: 'company_management', label: 'Company / Investor Relations team' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'media', label: 'Media / press' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Something else' },
]

const mailtoEnquiries: { type: EnquiryType; copy: string }[] = [
  { type: 'security', copy: 'Report a vulnerability or suspected security issue — include reproduction steps.' },
  { type: 'press', copy: 'Media and interview requests about Open Floor itself.' },
]

const schema = z.object({
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().min(1, 'Enter your email so we can reply.').max(254).email('Enter a valid email address.'),
  category: z.string().min(1),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, 'Please add a little more detail to your message.').max(5000),
  website: z.string().max(0).optional(),
})
type Values = z.infer<typeof schema>

export function ContactPage() {
  const [done, setDone] = useState<{ ticketNumber: string | null } | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [category, setCategory] = useState('general')
  const [turnstileToken, setTurnstileToken] = useState('')
  const idempotencyKey = useMemo(() => newIdempotencyKey(), [])
  const startedRef = useRef(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { category: 'general' } })

  function markStarted() {
    if (startedRef.current) return
    startedRef.current = true
    track('support_ticket_started')
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
      const result = await submitSupportTicket({
        category: values.category,
        message: values.message,
        subject: values.subject,
        name: values.name,
        email: values.email,
        turnstileToken,
        website: values.website,
        idempotencyKey,
      })
      track('support_ticket_submitted', { category: values.category })
      setDone(result)
    } catch (e) {
      const msg = (e as Error)?.message
      setSubmitError(msg === INTAKE_UNAVAILABLE ? 'The contact form is temporarily unavailable — please email us instead.' : 'We could not send your message. Please try again.')
    }
  }

  const isPrivacyOrLegal = category === 'privacy' || category === 'legal'

  return (
    <TrustPage
      slug="contact"
      path="/contact"
      title="Contact"
      metaDescription="Contact Open Floor: send a message and a person will reply by email. Dedicated routes for company requests, bug reports, security, and press."
      eyebrow="Contact"
      heading="Talk to a person."
      intro="Send a message below and a person will reply by email. We can’t promise a timeline, but we read everything."
    >
      {done ? (
        <div className="request-confirmation">
          <div className="success-icon">
            <Check size={24} />
          </div>
          <span className="eyebrow">Message received</span>
          <h1>Thanks — we’ll reply by email.</h1>
          {done.ticketNumber && (
            <p>
              Your reference is <b>{done.ticketNumber}</b>.
            </p>
          )}
          <p>Please don’t resubmit the same message — we have it.</p>
        </div>
      ) : (
        <>
          <form className="panel request-form" onSubmit={handleSubmit(onSubmit)} onInput={markStarted} noValidate>
            <div className="field-row">
              <label className="field">
                Your name
                <input className="text-input" {...register('name')} placeholder="Optional" autoComplete="name" />
              </label>
              <label className="field">
                Email <span className="admin-req" aria-hidden="true">*</span>
                <input className="text-input" type="email" {...register('email')} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(errors.email)} />
                {errors.email && <small className="form-error" role="alert">{errors.email.message}</small>}
              </label>
            </div>
            <label className="field">
              Category
              <select className="text-input" {...register('category')} onChange={e => { setCategory(e.target.value); track('support_category_selected', { category: e.target.value }) }}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>

            {category === 'company_request' && (
              <p className="section-note">
                Looking to add a company? The <Link to="/request-company">Request a company</Link> form is the fastest route — it checks the directory for you.
              </p>
            )}
            {category === 'bug' && (
              <p className="section-note">
                Found a bug? The <Link to="/report-bug">Report a bug</Link> form captures the technical details we need. You can still send it here if you prefer.
              </p>
            )}
            {isPrivacyOrLegal && (
              <p className="section-note">
                This is not legal advice and not an emergency channel. For a data-access or deletion request, tell us the email on your account.
              </p>
            )}

            <label className="field">
              Subject
              <input className="text-input" {...register('subject')} placeholder="Optional" />
            </label>
            <label className="field">
              Message <span className="admin-req" aria-hidden="true">*</span>
              <textarea className="text-input" rows={5} {...register('message')} placeholder="How can we help?" aria-invalid={Boolean(errors.message)} />
              {errors.message && <small className="form-error" role="alert">{errors.message.message}</small>}
            </label>

            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                Leave this field empty
                <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </label>
            </div>

            {TURNSTILE_ENABLED && <Turnstile onToken={setTurnstileToken} />}

            <label className="field checkbox-field">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
              <span>I understand my message and email will be stored so Open Floor can respond.</span>
            </label>
            {consentError && <small className="form-error" role="alert">{consentError}</small>}

            {submitError && <p className="form-error" role="alert">{submitError}</p>}
            <button className="btn primary full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Sending…' : 'Send message'} <Send size={15} />
            </button>
            <p className="form-footnote">Please don’t include passwords, financial account numbers, or verification codes.</p>
          </form>

          <p className="section-note">Prefer email? You can also reach us directly:</p>
          <div className="contact-list">
            {mailtoEnquiries.map(({ type, copy }) => (
              <a key={type} className="contact-row" href={contactMailto(type)} onClick={() => track('contact_link_clicked', { type, source: 'contact-page' })}>
                <Mail size={15} aria-hidden="true" />
                <span>
                  <b>{enquirySubject(type)}</b>
                  <small>{copy}</small>
                </span>
              </a>
            ))}
          </div>
          <p className="section-note">
            Direct email goes to <b>{CONTACT_EMAIL}</b>
            {CONTACT_EMAIL_IS_PLACEHOLDER && ' (placeholder address — the real inbox is configured before launch)'}.
          </p>
        </>
      )}
    </TrustPage>
  )
}

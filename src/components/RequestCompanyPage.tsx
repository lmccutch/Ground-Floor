import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronRight, Search } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { requestCompany, type PublicCompany } from '../lib/api'
import { track } from '../lib/analytics'
import { Monogram } from './ui'

// The form collects only what a reviewer needs to identify the company. A ticker
// is a short symbol — letters, digits, and the dot/hyphen used by class shares
// (e.g. BRK.B). It is normalised to upper case before submission.
const requestSchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name.').max(120),
  ticker: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[A-Za-z0-9.-]+$/, 'Enter a valid ticker (letters and numbers).'),
})

type RequestValues = z.infer<typeof requestSchema>

export function RequestCompanyPage() {
  const navigate = useNavigate()
  const { profile, requireAuth } = useMvp()
  const [done, setDone] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [matchedCompany, setMatchedCompany] = useState<PublicCompany | null>(null)
  const [submitError, setSubmitError] = useState('')
  const startedRef = useRef(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({ resolver: zodResolver(requestSchema) })

  // Fire "started" once, on the first real interaction — not on mount, so it is
  // unaffected by Strict Mode's double effect invocation and reflects genuine intent.
  function markStarted() {
    if (startedRef.current) return
    startedRef.current = true
    track('company_request_started')
  }

  async function submit(values: RequestValues) {
    if (!requireAuth('request a company')) return
    setSubmitError('')
    try {
      const result = await requestCompany({ name: values.name, ticker: values.ticker }, profile?.id)
      if ('matchedCompany' in result) {
        track('company_request_existing_company')
        setMatchedCompany(result.matchedCompany)
        return
      }
      if ('duplicate' in result) {
        track('company_request_duplicate_blocked')
        setDuplicate(true)
        return
      }
      track('company_request_submitted')
      setDone(true)
    } catch {
      setSubmitError('We could not save your request. Please try again.')
    }
  }

  if (matchedCompany) {
    return (
      <div className="request-confirmation">
        <div className="success-icon">
          <Search size={24} />
        </div>
        <span className="eyebrow">Already in the directory</span>
        <h1>This company is already here.</h1>
        <p>{matchedCompany.name} is already part of the Open Floor directory — you can open it now instead of requesting it.</p>
        <Link to={`/company/${matchedCompany.ticker}`} className="matched-company-card">
          <Monogram ticker={matchedCompany.ticker} accent={matchedCompany.accent} />
          <span>
            <b>{matchedCompany.name}</b>
            <small>
              {matchedCompany.ticker} · {matchedCompany.exchange}
            </small>
          </span>
          <ChevronRight size={16} />
        </Link>
        <div className="empty-actions">
          <button className="btn secondary" onClick={() => navigate('/discover')}>
            Back to Discover
          </button>
        </div>
      </div>
    )
  }

  if (duplicate) {
    return (
      <div className="request-confirmation">
        <div className="success-icon">
          <Check size={24} />
        </div>
        <span className="eyebrow">Already requested</span>
        <h1>You’ve already requested this company.</h1>
        <p>We have your earlier request on file for review — there’s no need to send it again.</p>
        <div className="empty-actions">
          <button className="btn primary" onClick={() => navigate('/discover')}>
            Back to Discover <ChevronRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="request-confirmation">
        <div className="success-icon">
          <Check size={24} />
        </div>
        <span className="eyebrow">Request received</span>
        <h1>We’ll review it within 24 hours.</h1>
        <p>Submitting a request does not guarantee that the company will be added.</p>
        <div className="empty-actions">
          <button className="btn primary" onClick={() => navigate('/discover')}>
            Back to Discover <ChevronRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="request-page">
      <div className="request-intro">
        <span className="eyebrow">Request a company</span>
        <h1>Can’t find the company?</h1>
        <p>Tell us its name and ticker. We review new requests and add companies that fit the directory.</p>
      </div>
      <form className="panel request-form" onSubmit={handleSubmit(submit)} onInput={markStarted} noValidate>
        <label className="field">
          Company name
          <input className="text-input" {...register('name')} placeholder="Example: Instacart" autoComplete="off" />
          {errors.name && <small className="form-error">{errors.name.message ?? 'Enter the company name.'}</small>}
        </label>
        <label className="field">
          Ticker
          <input
            className="text-input"
            {...register('ticker')}
            placeholder="CART"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          {errors.ticker && <small className="form-error">{errors.ticker.message ?? 'Enter a ticker.'}</small>}
        </label>
        {submitError && <p className="form-error">{submitError}</p>}
        <button className="btn primary full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Sending request…' : 'Request this company'} <ChevronRight size={15} />
        </button>
        <p className="form-footnote">By submitting, you agree to the community guidelines. Open Floor does not provide investment advice.</p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronRight, Search } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { requestCompany, type PublicCompany, type ShareholderStatus } from '../lib/api'
import { track } from '../lib/analytics'
import { Monogram } from './ui'

const statuses: ShareholderStatus[] = ['Current shareholder', 'Former shareholder', 'Considering investing', 'Following the company', 'Prefer not to say']

const requestSchema = z.object({
  name: z.string().min(2),
  ticker: z.string().min(1).max(10),
  exchange: z.string().min(2),
  reason: z.string().min(20).max(1000),
  shareholderStatus: z.enum(statuses as [ShareholderStatus, ...ShareholderStatus[]]),
  suggestedTopic: z.string().max(300).optional(),
  consent: z.boolean().refine(value => value),
})

type RequestValues = z.infer<typeof requestSchema>

export function RequestCompanyPage() {
  const navigate = useNavigate()
  const { profile, requireAuth } = useMvp()
  const [done, setDone] = useState(false)
  const [matchedCompany, setMatchedCompany] = useState<PublicCompany | null>(null)
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { shareholderStatus: 'Current shareholder', exchange: 'NASDAQ' },
  })

  async function submit(values: RequestValues) {
    if (!requireAuth('request a company')) return
    setSubmitError('')
    try {
      const result = await requestCompany(values, profile?.id)
      if ('matchedCompany' in result) {
        track('missing_company_suggested', { ticker: values.ticker.toUpperCase(), matched_existing: true })
        setMatchedCompany(result.matchedCompany)
        return
      }
      track('missing_company_suggested', { ticker: values.ticker.toUpperCase(), matched_existing: false })
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
        <h1>We found this company.</h1>
        <p>{matchedCompany.name} is already part of the GroundFloor directory — no need to submit a duplicate request.</p>
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
          <button className="btn secondary" onClick={() => navigate('/')}>
            Back home
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
        <h1>Your request has been added.</h1>
        <p>The more shareholders who join, the stronger the case for adding it to the directory.</p>
        <div className="empty-actions">
          <button className="btn primary" onClick={() => navigate('/discover')}>
            Find another company <ChevronRight size={15} />
          </button>
          <button className="btn secondary" onClick={() => navigate('/')}>
            Back home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="request-page">
      <div className="request-intro">
        <span className="eyebrow">Suggest a company</span>
        <h1>Can’t find the company?</h1>
        <p>Suggest it for review. Once it's added to the directory, any shareholder can start a campaign and build a clear signal of demand.</p>
      </div>
      <form className="panel request-form" onSubmit={handleSubmit(submit)} noValidate>
        <label className="field">
          Company name
          <input className="text-input" {...register('name')} placeholder="Example: Instacart" />
          {errors.name && <small className="form-error">Enter the company name.</small>}
        </label>
        <div className="field-row">
          <label className="field">
            Ticker
            <input className="text-input" {...register('ticker')} placeholder="CART" />
            {errors.ticker && <small className="form-error">Enter a ticker.</small>}
          </label>
          <label className="field">
            Exchange
            <select className="text-input" {...register('exchange')}>
              <option>NASDAQ</option>
              <option>NYSE</option>
              <option>TSX</option>
              <option>LSE</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label className="field">
          Why should management be interviewed?
          <textarea {...register('reason')} placeholder="What would you want leadership to address?" />
          {errors.reason && <small className="form-error">Please give at least 20 characters.</small>}
        </label>
        <label className="field">
          Suggested topic <span className="optional">Optional</span>
          <input className="text-input" {...register('suggestedTopic')} placeholder="Margins, competition, capital allocation…" />
        </label>
        <label className="field">
          Your status
          <select className="text-input" {...register('shareholderStatus')}>
            {statuses.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" {...register('consent')} /> Email me updates about this campaign
        </label>
        {errors.consent && <p className="form-error">Please confirm you’d like campaign updates so we can follow up.</p>}
        {submitError && <p className="form-error">{submitError}</p>}
        <button className="btn primary full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Adding request…' : 'Request this company'} <ChevronRight size={15} />
        </button>
        <p className="form-footnote">By submitting, you agree to the community guidelines. GroundFloor does not provide investment advice.</p>
      </form>
    </div>
  )
}

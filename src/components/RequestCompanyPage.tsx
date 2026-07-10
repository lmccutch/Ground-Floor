import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronRight } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { requestCompany, type ShareholderStatus } from '../lib/api'
import { track } from '../lib/analytics'

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
      await requestCompany(values, profile?.id)
      track('company_requested', { ticker: values.ticker.toUpperCase() })
      setDone(true)
    } catch {
      setSubmitError('We could not save your request. Please try again.')
    }
  }

  if (done) {
    return (
      <div className="request-confirmation">
        <div className="success-icon">
          <Check size={24} />
        </div>
        <span className="eyebrow">Request received</span>
        <h1>Your request has been added.</h1>
        <p>The more shareholders who join, the stronger the case for management to participate.</p>
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
        <span className="eyebrow">Early campaigns</span>
        <h1>Can’t find the company?</h1>
        <p>Request it. We’ll create a public campaign so other shareholders can join, ask questions, and build a clear signal of demand.</p>
      </div>
      <form className="panel request-form" onSubmit={handleSubmit(submit)} noValidate>
        <label className="field">
          Company name
          <input className="text-input" {...register('name')} placeholder="Example: Northstar Grid Systems" />
          {errors.name && <small className="form-error">Enter the company name.</small>}
        </label>
        <div className="field-row">
          <label className="field">
            Ticker
            <input className="text-input" {...register('ticker')} placeholder="NGS" />
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
        <p className="form-footnote">By submitting, you agree to the community guidelines. Grround Floor does not provide investment advice.</p>
      </form>
    </div>
  )
}

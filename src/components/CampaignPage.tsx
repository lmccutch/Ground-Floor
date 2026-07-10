import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowUp, CalendarDays, Check, ExternalLink, Link2, MessageSquare, Plus, ShieldCheck, Users } from 'lucide-react'
import {
  getCampaign,
  getCompanyBySlug,
  getCompanyByTicker,
  getQuestions,
  startCampaign,
  submitQuestion,
  voteQuestion,
  type Campaign,
  type CompanyLookup,
  type PublicCompany,
  type PublicQuestion,
  type ShareholderStatus,
} from '../lib/api'
import { track } from '../lib/analytics'
import { useMvp } from '../context/useMvp'
import { CampaignActions, ShareMenu } from './CampaignActions'
import { Modal } from './Modal'
import { copyToClipboard } from '../lib/helpers'
import { Badge, EmptyState, ErrorState, Monogram, Skeleton } from './ui'

const topics = ['Strategy', 'Financial performance', 'Capital allocation', 'Competition', 'Operations', 'Governance', 'Executive compensation', 'Industry conditions', 'Risk', 'Other']
const shareholderStatuses: ShareholderStatus[] = ['Current shareholder', 'Former shareholder', 'Considering investing', 'Following the company', 'Prefer not to say']

type PageState = 'loading' | 'ready' | 'missing' | 'error' | 'redirect'

export function CampaignPage() {
  const { ticker, slug } = useParams()
  const { profile, requireAuth } = useMvp()
  const [company, setCompany] = useState<PublicCompany | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [state, setState] = useState<PageState>('loading')
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const trackedTicker = useRef('')
  const profileId = profile?.id
  const routeKey = slug ?? ticker ?? ''

  useEffect(() => {
    let cancelled = false
    setState('loading')

    async function resolveCompany(): Promise<CompanyLookup> {
      if (slug) return { company: await getCompanyBySlug(slug) }
      return getCompanyByTicker(ticker ?? '')
    }

    resolveCompany()
      .then(async result => {
        if (cancelled) return
        if (result.redirectTicker) {
          track('ticker_route_redirected', { from: ticker, to: result.redirectTicker })
          setRedirectTo(`/company/${result.redirectTicker}`)
          setState('redirect')
          return
        }
        if (!result.company) {
          setState('missing')
          return
        }
        const found = result.company
        setCompany(found)
        if (trackedTicker.current !== found.ticker) {
          trackedTicker.current = found.ticker
          track('company_directory_page_viewed', { ticker: found.ticker, logged_in: Boolean(profileId) })
        }
        const [campaignData, questionData] = await Promise.all([getCampaign(found.id, profileId), getQuestions(found.id, profileId)])
        if (cancelled) return
        setCampaign(campaignData)
        setQuestions(questionData)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [routeKey, slug, ticker, profileId, reloadKey])

  if (state === 'redirect' && redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  if (state === 'loading') {
    return (
      <div className="campaign-page">
        <Skeleton height={120} />
        <Skeleton height={72} className="mt" />
        <Skeleton height={260} className="mt" />
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <EmptyState
        title={`We don't have ${(ticker ?? slug ?? '').toUpperCase()} yet`}
        copy="No company matches this address. You can request the company and we will review it for the directory."
        action={
          <div className="empty-actions">
            <Link className="btn primary" to="/request-company">
              Request this company
            </Link>
            <Link className="btn secondary" to="/discover">
              Browse the directory
            </Link>
          </div>
        }
      />
    )
  }

  if (state === 'error' || !company) {
    return <ErrorState copy="We could not load this company. Please try again." onRetry={() => setReloadKey(key => key + 1)} />
  }

  const voteTotal = questions.reduce((sum, question) => sum + question.votes, 0)
  const progress = campaign ? Math.min(100, Math.round((campaign.supporters / campaign.outreachTarget) * 100)) : 0

  async function onVote(question: PublicQuestion) {
    if (question.votedByUser) return
    if (!requireAuth('vote on a question')) return
    try {
      const counted = await voteQuestion(question, profileId)
      if (!counted) return
      setQuestions(current => current.map(item => (item.id === question.id ? { ...item, votes: item.votes + 1, votedByUser: true } : item)))
      track('question_voted', { ticker: company!.ticker, question_id: question.id })
    } catch {
      // Leave the count unchanged; the button remains available to retry.
    }
  }

  return (
    <div className="campaign-page">
      <div className="campaign-header">
        <div className="company-heading">
          <Monogram ticker={company.ticker} accent={company.accent} large />
          <div>
            <div className="eyebrow">
              {company.sector} · {company.exchange}
            </div>
            <h1>
              {company.name} <span className="ticker-tag">{company.ticker}</span>
            </h1>
            <p className="company-description">{company.description}</p>
            {(company.website || company.investorRelationsUrl) && (
              <div className="public-links">
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer">
                    Company website <ExternalLink size={12} />
                  </a>
                )}
                {company.investorRelationsUrl && (
                  <a href={company.investorRelationsUrl} target="_blank" rel="noreferrer">
                    Investor relations <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <ShareMenu company={company} />
      </div>

      {campaign ? (
        <ActiveCampaign
          company={company}
          campaign={campaign}
          questions={questions}
          voteTotal={voteTotal}
          progress={progress}
          onCampaignChange={setCampaign}
          onVote={onVote}
          onAskQuestion={() => {
            if (requireAuth('submit a question')) setShowForm(true)
          }}
        />
      ) : (
        <NoCampaignYet
          company={company}
          onStarted={created => setCampaign(created)}
          onAskFirstQuestion={() => {
            if (requireAuth('ask the first question')) setShowForm(true)
          }}
        />
      )}

      {showForm && (
        <QuestionForm
          company={company}
          campaign={campaign}
          onClose={() => setShowForm(false)}
          onSaved={(question, nextCampaign) => {
            setQuestions(current => (current.some(item => item.id === question.id) ? current : [question, ...current]))
            if (nextCampaign) setCampaign(nextCampaign)
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function NoCampaignYet({
  company,
  onStarted,
  onAskFirstQuestion,
}: {
  company: PublicCompany
  onStarted: (campaign: Campaign) => void
  onAskFirstQuestion: () => void
}) {
  const { profile, requireAuth } = useMvp()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    if (starting) return
    if (!requireAuth('start this campaign')) return
    setStarting(true)
    setError('')
    track('campaign_start_started', { ticker: company.ticker, trigger: 'start_button' })
    try {
      const created = await startCampaign(company.id, profile?.id)
      if (created) {
        track('campaign_created', { ticker: company.ticker, trigger: 'start_button' })
        onStarted(created)
      } else {
        setError('We could not start this campaign. Please try again.')
      }
    } catch {
      setError('We could not start this campaign. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <EmptyState
      icon={<MessageSquare size={22} />}
      title="No shareholder campaign has started for this company."
      copy="Be the first to request a dedicated management interview and help decide what shareholders want management to answer."
      action={
        <div className="empty-actions-column">
          <div className="empty-actions">
            <button className="btn primary" onClick={() => void handleStart()} disabled={starting}>
              {starting ? 'Starting…' : 'Start this campaign'}
            </button>
            <button className="btn secondary" onClick={onAskFirstQuestion}>
              Ask the first question
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
      }
    />
  )
}

function ActiveCampaign({
  company,
  campaign,
  questions,
  voteTotal,
  progress,
  onCampaignChange,
  onVote,
  onAskQuestion,
}: {
  company: PublicCompany
  campaign: Campaign
  questions: PublicQuestion[]
  voteTotal: number
  progress: number
  onCampaignChange: (campaign: Campaign | null) => void
  onVote: (question: PublicQuestion) => void
  onAskQuestion: () => void
}) {
  return (
    <>
      <div className="status-panel">
        <div>
          <span className="eyebrow">Campaign status</span>
          <h2>{campaign.status}</h2>
          <p>Management participation is voluntary and has not been confirmed.</p>
        </div>
        <Badge tone="gold">Early campaign</Badge>
      </div>

      <CampaignActions company={company} campaign={campaign} onCampaignChange={onCampaignChange} />

      <div className="campaign-metrics">
        <div>
          <Users size={16} />
          <b>{campaign.supporters}</b>
          <span>supporters</span>
        </div>
        <div>
          <ShieldCheck size={16} />
          <b>{campaign.currentShareholders}</b>
          <span>current shareholders</span>
        </div>
        <div>
          <Users size={16} />
          <b>{campaign.followers}</b>
          <span>followers</span>
        </div>
        <div>
          <MessageSquare size={16} />
          <b>{questions.length}</b>
          <span>questions</span>
        </div>
        <div>
          <ArrowUp size={16} />
          <b>{voteTotal}</b>
          <span>votes cast</span>
        </div>
      </div>

      <div className="progress-panel">
        <div>
          <b>At {campaign.outreachTarget} supporters, GroundFloor makes a formal interview request to management.</b>
          <span>We do not guarantee that management will accept.</span>
        </div>
        <div className="progress-meter">
          <div className="progress-bar" role="progressbar" aria-valuenow={campaign.supporters} aria-valuemin={0} aria-valuemax={campaign.outreachTarget}>
            <i style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
          <span>
            {campaign.supporters} of {campaign.outreachTarget} supporters
          </span>
        </div>
      </div>

      <div className="campaign-grid">
        <section>
          <div className="section-row">
            <div>
              <span className="eyebrow">Shareholder questions</span>
              <h2>What would you ask management?</h2>
            </div>
            <button className="btn primary" onClick={onAskQuestion}>
              <Plus size={15} /> Submit a question
            </button>
          </div>
          <p className="guidance">Ask one clear question. Avoid speeches, allegations, and questions that can be answered with a basic search.</p>
          {questions.length === 0 ? (
            <EmptyState icon={<MessageSquare size={22} />} title="No questions yet" copy="Be the first shareholder to put a question to management." />
          ) : (
            questions.map(question => <QuestionCard key={question.id} question={question} company={company} onVote={() => onVote(question)} />)
          )}
        </section>

        <aside className="side-rail">
          <div className="panel">
            <span className="eyebrow">What makes a strong question</span>
            <ul className="tips-list">
              <li>Specific enough that the answer is verifiable later.</li>
              <li>About decisions and assumptions, not share-price predictions.</li>
              <li>Something management alone can answer — not public filings.</li>
            </ul>
          </div>
          <div className="panel">
            <span className="eyebrow">Campaign timeline</span>
            <div className="timeline-row">
              <CalendarDays size={15} />
              <div>
                <b>Campaign launched</b>
                <small>{new Date(campaign.launchedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</small>
              </div>
            </div>
            <div className="timeline-row">
              <Users size={15} />
              <div>
                <b>Interview request</b>
                <small>Sent when the campaign reaches {campaign.outreachTarget} supporters.</small>
              </div>
            </div>
          </div>
          <p className="ownership-disclaimer">
            <ShieldCheck size={15} /> Ownership status is self-reported. Position sizes are never displayed publicly.
          </p>
        </aside>
      </div>
    </>
  )
}

function QuestionCard({ question, company, onVote }: { question: PublicQuestion; company: PublicCompany; onVote: () => void }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    await copyToClipboard(`${window.location.origin}/company/${company.ticker}#${question.id}`)
    setCopied(true)
    track('question_shared', { ticker: company.ticker, question_id: question.id })
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <article className="question-card" id={question.id}>
      <div className="vote-box">
        <button
          className={question.votedByUser ? 'vote-btn voted' : 'vote-btn'}
          onClick={onVote}
          disabled={question.votedByUser}
          aria-pressed={question.votedByUser}
          aria-label={question.votedByUser ? 'You voted for this question' : 'Vote for this question'}
        >
          <ArrowUp size={17} />
        </button>
        <b>{question.votes}</b>
        <span>votes</span>
      </div>
      <div className="question-body">
        <div className="question-meta">
          <span className="topic-tag">{question.topic}</span>
          <time dateTime={question.createdAt}>{new Date(question.createdAt).toLocaleDateString()}</time>
          {question.status !== 'Open' && <Badge tone="green">{question.status}</Badge>}
        </div>
        <h3>{question.text}</h3>
        <div className="question-footer">
          <span>{question.author}</span>
          <span>
            <MessageSquare size={12} /> {question.commentCount} comments
          </span>
          <button className="link-btn" onClick={() => void share()}>
            {copied ? <Check size={12} /> : <Link2 size={12} />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    </article>
  )
}

function QuestionForm({
  company,
  campaign,
  onClose,
  onSaved,
}: {
  company: PublicCompany
  campaign: Campaign | null
  onClose: () => void
  onSaved: (question: PublicQuestion, nextCampaign?: Campaign) => void
}) {
  const { profile } = useMvp()
  const [text, setText] = useState('')
  const [topic, setTopic] = useState(topics[0])
  const [status, setStatus] = useState<ShareholderStatus>('Current shareholder')
  const [anonymous, setAnonymous] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const trimmed = text.trim()
    if (trimmed.length < 10 || trimmed.length > 500) {
      setError('Questions must be between 10 and 500 characters.')
      return
    }
    setBusy(true)
    setError('')
    try {
      let activeCampaign = campaign ?? undefined
      if (!activeCampaign) {
        track('campaign_start_started', { ticker: company.ticker, trigger: 'ask_first_question' })
        const created = await startCampaign(company.id, profile?.id)
        if (!created) throw new Error('Could not start campaign')
        activeCampaign = created
        track('campaign_created', { ticker: company.ticker, trigger: 'ask_first_question' })
      }
      const saved = await submitQuestion(company.id, { text: trimmed, topic, shareholderStatus: status, anonymous }, profile)
      track('question_submitted', { ticker: company.ticker, topic, shareholder_status: status })
      onSaved(saved, activeCampaign)
    } catch {
      setError('We could not save your question. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <span className="eyebrow">Ask {company.ticker} management</span>
        <h2>{campaign ? 'Submit one clear question.' : 'Ask the first question.'}</h2>
        <p className="modal-copy">
          Your question will be public. Do not include material non-public information, personal attacks, or unsupported allegations.
        </p>
        <label className="field">
          Question
          <textarea
            maxLength={500}
            value={text}
            onChange={event => setText(event.target.value)}
            placeholder="What would you like management to address?"
            autoFocus
          />
        </label>
        <small className="char-count">{text.length}/500</small>
        <label className="field">
          Topic
          <select className="text-input" value={topic} onChange={event => setTopic(event.target.value)}>
            {topics.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Self-reported shareholder status
          <select className="text-input" value={status} onChange={event => setStatus(event.target.value as ShareholderStatus)}>
            {shareholderStatuses.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /> Submit anonymously
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish question'} <ArrowUp size={15} />
        </button>
      </form>
    </Modal>
  )
}

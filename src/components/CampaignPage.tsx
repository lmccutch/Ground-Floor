import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowUp, Check, ExternalLink, Flag, MessageSquare, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import {
  deleteQuestion,
  getCampaign,
  reportQuestion,
  getCompanyBySlug,
  getCompanyByTicker,
  getQuestions,
  isQuestionEditable,
  startCampaign,
  submitQuestion,
  unvoteQuestion,
  updateQuestion,
  voteQuestion,
  type Campaign,
  type CompanyLookup,
  type PublicCompany,
  type PublicQuestion,
  type ShareholderStatus,
} from '../lib/api'
import { track } from '../lib/analytics'
import { supabaseDataErrorHint } from '../lib/dataMode'
import { companyShareContent, questionShareContent } from '../lib/share'
import { useMvp } from '../context/useMvp'
import { CampaignActions } from './CampaignActions'
import { CampaignLifecycle } from './CampaignLifecycle'
import { CampaignTimeline } from './CampaignTimeline'
import { Modal } from './Modal'
import { ShareMenu } from './ShareMenu'
import { Badge, EmptyState, ErrorState, Monogram, Skeleton } from './ui'

const topics = ['Strategy', 'Financial performance', 'Capital allocation', 'Competition', 'Operations', 'Governance', 'Executive compensation', 'Industry conditions', 'Risk', 'Other']
const shareholderStatuses: ShareholderStatus[] = ['Current shareholder', 'Former shareholder', 'Considering investing', 'Following the company', 'Prefer not to say']
const reportReasons = ['Spam or promotion', 'Abusive or inappropriate', 'Misleading or false claims', 'Off topic', 'Other']

type PageState = 'loading' | 'ready' | 'missing' | 'error' | 'redirect'
type QuestionSort = 'top' | 'newest'
type QuestionFilter = 'all' | 'unanswered'

export function CampaignPage() {
  const { ticker, slug } = useParams()
  const location = useLocation()
  const { profile, requireAuth } = useMvp()
  const [company, setCompany] = useState<PublicCompany | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [state, setState] = useState<PageState>('loading')
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const trackedTicker = useRef('')
  const highlightedRef = useRef(false)
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

  // Direct question URLs: /company/TICKER#<questionId>. Once questions render,
  // scroll the linked card into view and highlight it.
  useEffect(() => {
    if (state !== 'ready' || highlightedRef.current) return
    const hash = location.hash.replace(/^#/, '')
    if (!hash || !questions.some(question => question.id === hash)) return
    const element = document.getElementById(hash)
    if (!element) return
    highlightedRef.current = true
    element.scrollIntoView({ block: 'center' })
    element.classList.add('linked-question')
    element.setAttribute('tabindex', '-1')
    ;(element as HTMLElement).focus({ preventScroll: true })
  }, [state, questions, location.hash])

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
    return (
      <ErrorState
        copy={['We could not load this company. Please try again.', supabaseDataErrorHint()].filter(Boolean).join(' ')}
        onRetry={() => setReloadKey(key => key + 1)}
      />
    )
  }

  const companyUrl = `${window.location.origin}/company/${company.ticker}`

  async function onToggleVote(question: PublicQuestion) {
    if (!requireAuth('vote on a question')) return
    try {
      if (question.votedByUser) {
        const removed = await unvoteQuestion(question, profileId)
        if (!removed) return
        setQuestions(current =>
          current.map(item => (item.id === question.id ? { ...item, votes: Math.max(0, item.votes - 1), votedByUser: false } : item)),
        )
        track('question_vote_removed', { ticker: company!.ticker, question_id: question.id })
      } else {
        const counted = await voteQuestion(question, profileId)
        if (!counted) return
        setQuestions(current => current.map(item => (item.id === question.id ? { ...item, votes: item.votes + 1, votedByUser: true } : item)))
        track('question_voted', { ticker: company!.ticker, question_id: question.id })
      }
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
        <ShareMenu content={companyShareContent(company, companyUrl)} analyticsEvent="company_shared" analyticsProps={{ ticker: company.ticker }} />
      </div>

      {campaign ? (
        <ActiveCampaign
          company={company}
          campaign={campaign}
          questions={questions}
          onCampaignChange={setCampaign}
          onToggleVote={onToggleVote}
          onQuestionsChange={setQuestions}
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
          existingQuestions={questions}
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
  onCampaignChange,
  onToggleVote,
  onQuestionsChange,
  onAskQuestion,
}: {
  company: PublicCompany
  campaign: Campaign
  questions: PublicQuestion[]
  onCampaignChange: (campaign: Campaign | null) => void
  onToggleVote: (question: PublicQuestion) => void
  onQuestionsChange: (update: (current: PublicQuestion[]) => PublicQuestion[]) => void
  onAskQuestion: () => void
}) {
  const [sort, setSort] = useState<QuestionSort>('top')
  const [filter, setFilter] = useState<QuestionFilter>('all')
  const voteTotal = questions.reduce((sum, question) => sum + question.votes, 0)

  const visibleQuestions = useMemo(() => {
    const filtered = filter === 'unanswered' ? questions.filter(question => question.status !== 'Answered') : questions
    const sorted = [...filtered]
    if (sort === 'top') sorted.sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt))
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return sorted
  }, [questions, sort, filter])

  return (
    <>
      <CampaignLifecycle campaign={campaign} companyTicker={company.ticker} />

      <CampaignActions company={company} campaign={campaign} onCampaignChange={onCampaignChange} />

      <div className="campaign-metrics">
        <div>
          <ShieldCheck size={16} />
          <b>{campaign.supporters}</b>
          <span>supporters</span>
        </div>
        <div>
          <ShieldCheck size={16} />
          <b>{campaign.currentShareholders}</b>
          <span>current shareholders</span>
        </div>
        <div>
          <ShieldCheck size={16} />
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

          {questions.length > 0 && (
            <div className="question-controls">
              <div className="chip-row" role="group" aria-label="Sort questions">
                {(['top', 'newest'] as const).map(option => (
                  <button
                    key={option}
                    className={sort === option ? 'chip active' : 'chip'}
                    aria-pressed={sort === option}
                    onClick={() => {
                      setSort(option)
                      track('question_sorted', { ticker: company.ticker, sort: option })
                    }}
                  >
                    {option === 'top' ? 'Top' : 'Newest'}
                  </button>
                ))}
              </div>
              <div className="chip-row" role="group" aria-label="Filter questions">
                {(['all', 'unanswered'] as const).map(option => (
                  <button
                    key={option}
                    className={filter === option ? 'chip active' : 'chip'}
                    aria-pressed={filter === option}
                    onClick={() => {
                      setFilter(option)
                      track('question_filtered', { ticker: company.ticker, filter: option })
                    }}
                  >
                    {option === 'all' ? 'All' : 'Unanswered'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {questions.length === 0 ? (
            <EmptyState icon={<MessageSquare size={22} />} title="No questions yet" copy="Be the first shareholder to put a question to management." />
          ) : visibleQuestions.length === 0 ? (
            <EmptyState icon={<MessageSquare size={22} />} title="No questions match this filter" copy="Try switching back to all questions." />
          ) : (
            visibleQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                company={company}
                campaign={campaign}
                onToggleVote={() => onToggleVote(question)}
                onQuestionsChange={onQuestionsChange}
                onCampaignChange={onCampaignChange}
              />
            ))
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
          <CampaignTimeline campaign={campaign} />
          <p className="ownership-disclaimer">
            <ShieldCheck size={15} /> Ownership status is self-reported. Position sizes are never displayed publicly.
          </p>
        </aside>
      </div>
    </>
  )
}

function QuestionCard({
  question,
  company,
  campaign,
  onToggleVote,
  onQuestionsChange,
  onCampaignChange,
}: {
  question: PublicQuestion
  company: PublicCompany
  campaign: Campaign
  onToggleVote: () => void
  onQuestionsChange: (update: (current: PublicQuestion[]) => PublicQuestion[]) => void
  onCampaignChange: (campaign: Campaign | null) => void
}) {
  const { profile, requireAuth } = useMvp()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [reporting, setReporting] = useState(false)
  const questionUrl = `${window.location.origin}/company/${company.ticker}#${question.id}`
  const editable = isQuestionEditable(question)

  return (
    <article className="question-card" id={question.id}>
      <div className="vote-box">
        <button
          className={question.votedByUser ? 'vote-btn voted' : 'vote-btn'}
          onClick={onToggleVote}
          aria-pressed={question.votedByUser}
          aria-label={question.votedByUser ? 'Remove your vote for this question' : 'Vote for this question'}
          title={question.votedByUser ? 'Remove your vote' : 'Vote for this question'}
        >
          <ArrowUp size={17} />
        </button>
        <b>{question.votes}</b>
        <span>{question.votes === 1 ? 'vote' : 'votes'}</span>
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
          <ShareMenu
            content={questionShareContent(question, company, questionUrl)}
            analyticsEvent="question_shared"
            analyticsProps={{ ticker: company.ticker, question_id: question.id }}
            small
          />
          {editable && (
            <>
              <button className="link-btn" onClick={() => setEditing(true)}>
                <Pencil size={12} /> Edit
              </button>
              <button className="link-btn" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={12} /> Delete
              </button>
            </>
          )}
          {!question.isAuthor && (
            <button
              className="link-btn"
              onClick={() => {
                if (requireAuth('report a question')) setReporting(true)
              }}
            >
              <Flag size={12} /> Report
            </button>
          )}
        </div>
      </div>

      {editing && (
        <EditQuestionModal
          question={question}
          userId={profile?.id}
          companyTicker={company.ticker}
          onClose={() => setEditing(false)}
          onSaved={updated => {
            onQuestionsChange(current => current.map(item => (item.id === updated.id ? updated : item)))
            setEditing(false)
          }}
        />
      )}
      {confirmingDelete && (
        <DeleteQuestionModal
          question={question}
          userId={profile?.id}
          companyTicker={company.ticker}
          onClose={() => setConfirmingDelete(false)}
          onDeleted={() => {
            onQuestionsChange(current => current.filter(item => item.id !== question.id))
            onCampaignChange({
              ...campaign,
              questions: Math.max(0, campaign.questions - 1),
              votes: Math.max(0, campaign.votes - question.votes),
            })
            setConfirmingDelete(false)
          }}
        />
      )}
      {reporting && <ReportQuestionModal question={question} companyTicker={company.ticker} userId={profile?.id} onClose={() => setReporting(false)} />}
    </article>
  )
}

function EditQuestionModal({
  question,
  userId,
  companyTicker,
  onClose,
  onSaved,
}: {
  question: PublicQuestion
  userId?: string
  companyTicker: string
  onClose: () => void
  onSaved: (question: PublicQuestion) => void
}) {
  const [text, setText] = useState(question.text)
  const [topic, setTopic] = useState(question.topic)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
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
      const updated = await updateQuestion(question, { text: trimmed, topic }, userId)
      if (!updated) {
        setError('This question can no longer be edited — its status has moved forward.')
        setBusy(false)
        return
      }
      track('question_edited', { ticker: companyTicker, question_id: question.id })
      onSaved(updated)
    } catch {
      setError('We could not save your changes. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={save}>
        <span className="eyebrow">Edit your question</span>
        <h2>Refine what you’re asking.</h2>
        <p className="modal-copy">You can edit your question while it is open or under review — not after it has been sent to management.</p>
        <label className="field">
          Question
          <textarea maxLength={500} value={text} onChange={event => setText(event.target.value)} autoFocus />
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
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'} <Check size={15} />
        </button>
      </form>
    </Modal>
  )
}

function DeleteQuestionModal({
  question,
  userId,
  companyTicker,
  onClose,
  onDeleted,
}: {
  question: PublicQuestion
  userId?: string
  companyTicker: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const deleted = await deleteQuestion(question, userId)
      if (!deleted) {
        setError('This question can no longer be deleted — its status has moved forward.')
        setBusy(false)
        return
      }
      track('question_deleted', { ticker: companyTicker, question_id: question.id })
      onDeleted()
    } catch {
      setError('We could not delete this question. Please try again.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <span className="eyebrow">Delete question</span>
      <h2>Delete this question?</h2>
      <p className="modal-copy">
        “{question.text.length > 140 ? `${question.text.slice(0, 140)}…` : question.text}”
      </p>
      <p className="modal-copy">Its votes are removed with it. This cannot be undone.</p>
      {error && <p className="form-error">{error}</p>}
      <div className="empty-actions">
        <button className="btn primary" onClick={() => void confirm()} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete question'}
        </button>
        <button className="btn secondary" onClick={onClose} disabled={busy}>
          Keep it
        </button>
      </div>
    </Modal>
  )
}

function ReportQuestionModal({
  question,
  companyTicker,
  userId,
  onClose,
}: {
  question: PublicQuestion
  companyTicker: string
  userId?: string
  onClose: () => void
}) {
  const [reason, setReason] = useState(reportReasons[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await reportQuestion(question.id, reason, details.trim() || undefined, userId)
      track('question_reported', { ticker: companyTicker, question_id: question.id, reason })
      setSent(true)
    } catch {
      setError('We could not send your report. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {sent ? (
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <h2>Report received.</h2>
          <p>Thanks — a moderator will review this question. Your report is private and is never shown publicly.</p>
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <span className="eyebrow">Report question</span>
          <h2>Flag this for review.</h2>
          <p className="modal-copy">Reports are private — the author is not told who reported.</p>
          <label className="field">
            Reason
            <select className="text-input" value={reason} onChange={event => setReason(event.target.value)}>
              {reportReasons.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Details <span className="optional">Optional</span>
            <textarea maxLength={500} value={details} onChange={event => setDetails(event.target.value)} placeholder="Anything a moderator should know." />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary full" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send report'} <Flag size={15} />
          </button>
        </form>
      )}
    </Modal>
  )
}

/** Significant-word overlap check used for pre-submission duplicate guidance. */
function similarQuestions(draft: string, existing: PublicQuestion[]): PublicQuestion[] {
  const words = new Set(
    draft
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(word => word.length > 3),
  )
  if (words.size < 2) return []
  return existing
    .map(question => {
      const questionWords = question.text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(word => word.length > 3)
      const overlap = questionWords.filter(word => words.has(word)).length
      return { question, overlap }
    })
    .filter(item => item.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap || b.question.votes - a.question.votes)
    .slice(0, 3)
    .map(item => item.question)
}

function QuestionForm({
  company,
  campaign,
  existingQuestions,
  onClose,
  onSaved,
}: {
  company: PublicCompany
  campaign: Campaign | null
  existingQuestions: PublicQuestion[]
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

  const similar = useMemo(() => (text.trim().length >= 12 ? similarQuestions(text, existingQuestions) : []), [text, existingQuestions])

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
        {similar.length > 0 && (
          <div className="similar-questions" role="note">
            <b>Similar questions already exist — voting for one adds more weight than a duplicate:</b>
            {similar.map(item => (
              <span key={item.id} className="similar-question">
                “{item.text.length > 90 ? `${item.text.slice(0, 90)}…` : item.text}” · {item.votes} {item.votes === 1 ? 'vote' : 'votes'}
              </span>
            ))}
          </div>
        )}
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, MessageSquare, Users } from 'lucide-react'
import { getDashboardData, type DashboardData, type PublicCompany, type PublicQuestion } from '../lib/api'
import { supabaseDataErrorHint } from '../lib/dataMode'
import { useMvp } from '../context/useMvp'
import { EmptyState, ErrorState, Monogram, PageHeading, Skeleton } from './ui'

function CompanyList({ title, companies, empty }: { title: string; companies: PublicCompany[]; empty: string }) {
  return (
    <section className="dashboard-section">
      <h2>{title}</h2>
      {companies.length ? (
        companies.map(company => (
          <Link to={`/company/${company.ticker}`} className="list-row" key={company.id}>
            <Monogram ticker={company.ticker} accent={company.accent} />
            <span className="list-row-main">
              <b>{company.name}</b>
              <small>
                {company.ticker} · {company.sector}
              </small>
            </span>
            <ChevronRight size={15} />
          </Link>
        ))
      ) : (
        <p className="list-empty">{empty}</p>
      )}
    </section>
  )
}

function QuestionRow({ question }: { question: PublicQuestion }) {
  const body = (
    <span className="list-row-main">
      <b>{question.text}</b>
      <small>
        {question.votes} {question.votes === 1 ? 'vote' : 'votes'} · {question.status}
        {question.companyTicker ? ` · ${question.companyTicker}` : ''}
      </small>
    </span>
  )
  return question.companyTicker ? (
    <Link to={`/company/${question.companyTicker}#${question.id}`} className="list-row">
      {body}
      <ChevronRight size={15} />
    </Link>
  ) : (
    <div className="list-row">{body}</div>
  )
}

export function DashboardPage() {
  const { profile, requireAuth, demoMode } = useMvp()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!profile) {
      setData(null)
      return
    }
    let cancelled = false
    setError(false)
    setData(null)
    getDashboardData(profile.id)
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [profile, reloadKey])

  if (!profile) {
    return (
      <EmptyState
        icon={<Users size={22} />}
        title="Keep your shareholder activity in one place."
        copy="Sign in to see the campaigns you support, companies you follow, your questions, and your votes."
        action={
          <button className="btn primary" onClick={() => requireAuth('view your dashboard')}>
            Sign in to view your dashboard
          </button>
        }
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        copy={['We could not load your dashboard. Please try again.', supabaseDataErrorHint()].filter(Boolean).join(' ')}
        onRetry={() => setReloadKey(key => key + 1)}
      />
    )
  }

  if (!data) {
    return (
      <>
        <Skeleton height={70} />
        <Skeleton height={110} className="mt" />
        <Skeleton height={320} className="mt" />
      </>
    )
  }

  return (
    <div className="dashboard-page">
      <PageHeading
        eyebrow="Your workspace"
        title="My companies"
        copy="Your support and participation, backed by your actual activity."
        action={
          <Link to="/discover" className="btn secondary">
            Discover companies <ChevronRight size={15} />
          </Link>
        }
      />
      <div className="dashboard-metrics">
        <div className="metric">
          <strong>{data.supported.length}</strong>
          <span>supported campaigns</span>
        </div>
        <div className="metric">
          <strong>{data.followed.length}</strong>
          <span>followed companies</span>
        </div>
        <div className="metric">
          <strong>{data.submitted.length}</strong>
          <span>questions submitted</span>
        </div>
        <div className="metric">
          <strong>{data.voted.length}</strong>
          <span>questions voted for</span>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <CompanyList title="Supported campaigns" companies={data.supported} empty="You have not supported a campaign yet." />
          <CompanyList title="Followed companies" companies={data.followed} empty="You are not following any companies yet." />
        </div>
        <div className="panel">
          <h2>Your questions</h2>
          {data.submitted.length ? (
            data.submitted.map(question => <QuestionRow key={question.id} question={question} />)
          ) : (
            <p className="list-empty">
              <MessageSquare size={14} /> Questions you submit will appear here.
            </p>
          )}
          <h2 className="panel-subhead">Questions you voted for</h2>
          {data.voted.length ? (
            data.voted.map(question => <QuestionRow key={question.id} question={question} />)
          ) : (
            <p className="list-empty">Votes you cast will appear here.</p>
          )}
        </div>
        <div className="panel">
          <h2>Notifications</h2>
          {data.notifications.length ? (
            data.notifications.map(notification => (
              <div className={notification.read ? 'list-row read' : 'list-row'} key={notification.id}>
                <span className="notification-dot">
                  <Bell size={13} />
                </span>
                <span className="list-row-main">
                  <b>{notification.title}</b>
                  <small>{notification.body}</small>
                </span>
              </div>
            ))
          ) : (
            <p className="list-empty">
              <Bell size={14} /> {demoMode ? 'Notifications are not available in demo mode.' : 'Notifications arrive when campaigns you support progress.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

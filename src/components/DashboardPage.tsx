import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, ChevronRight, Clock, MessageSquare, Users } from 'lucide-react'
import {
  getDashboardData,
  markAllNotificationsRead,
  markNotificationRead,
  type DashboardData,
  type Notification,
  type PublicCompany,
  type PublicQuestion,
} from '../lib/api'
import { track } from '../lib/analytics'
import { supabaseDataErrorHint } from '../lib/dataMode'
import { useMvp } from '../context/useMvp'
import { EmptyState, ErrorState, Monogram, PageHeading, Skeleton } from './ui'

const investorTypes = ['Individual investor', 'Finance professional', 'Industry professional', 'Other']

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

function NotificationsPanel({
  notifications,
  userId,
  demoMode,
  onChanged,
}: {
  notifications: Notification[]
  userId: string
  demoMode: boolean
  onChanged: (next: Notification[]) => void
}) {
  const [error, setError] = useState('')
  const opened = useRef(false)

  useEffect(() => {
    if (!opened.current && notifications.length > 0) {
      opened.current = true
      track('notification_opened', { count: notifications.length, unread: notifications.filter(item => !item.read).length })
    }
  }, [notifications])

  const unread = notifications.filter(item => !item.read)

  async function markOne(notification: Notification) {
    setError('')
    try {
      await markNotificationRead(notification.id, userId)
      onChanged(notifications.map(item => (item.id === notification.id ? { ...item, read: true } : item)))
      track('notification_marked_read', { scope: 'one' })
    } catch {
      setError('Could not update the notification. Please try again.')
    }
  }

  async function markAll() {
    setError('')
    try {
      await markAllNotificationsRead(userId)
      onChanged(notifications.map(item => ({ ...item, read: true })))
      track('notification_marked_read', { scope: 'all', count: unread.length })
    } catch {
      setError('Could not update notifications. Please try again.')
    }
  }

  return (
    <>
      <div className="panel-head-row">
        <h2>Notifications</h2>
        {unread.length > 0 && (
          <button className="link-btn" onClick={() => void markAll()}>
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      {notifications.length ? (
        notifications.map(notification => (
          <div className={notification.read ? 'list-row read' : 'list-row'} key={notification.id}>
            <span className="notification-dot">
              <Bell size={13} />
            </span>
            <span className="list-row-main">
              <b>{notification.title}</b>
              <small>{notification.body}</small>
            </span>
            {!notification.read && (
              <button className="link-btn" onClick={() => void markOne(notification)} aria-label={`Mark "${notification.title}" as read`}>
                Mark read
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="list-empty">
          <Bell size={14} /> {demoMode ? 'Notifications are not available in demo mode.' : 'Notifications arrive when campaigns you support progress.'}
        </p>
      )}
    </>
  )
}

function ProfileSettings() {
  const { profile, updateProfileDetails } = useMvp()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [investorType, setInvestorType] = useState(profile?.investorType ?? investorTypes[0])
  const [publicAnonymous, setPublicAnonymous] = useState(Boolean(profile?.publicAnonymous))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Display name cannot be empty.')
      return
    }
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      await updateProfileDetails({ displayName: trimmed, country: country.trim() || undefined, investorType, publicAnonymous })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('We could not save your profile. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="dashboard-section">
      <h2>Profile settings</h2>
      <form className="profile-form" onSubmit={save}>
        <label className="field">
          Display name
          <input className="text-input" value={displayName} maxLength={60} onChange={event => setDisplayName(event.target.value)} />
        </label>
        <label className="field">
          Country <span className="optional">Optional</span>
          <input className="text-input" value={country} maxLength={60} onChange={event => setCountry(event.target.value)} placeholder="e.g. Canada" />
        </label>
        <label className="field">
          Investor type
          <select className="text-input" value={investorType} onChange={event => setInvestorType(event.target.value)}>
            {investorTypes.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={publicAnonymous} onChange={event => setPublicAnonymous(event.target.checked)} />
          Show all my questions as “Anonymous Shareholder”
        </label>
        <p className="form-footnote">Your email address is never shown publicly.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="btn secondary small" type="submit" disabled={busy}>
          {busy ? 'Saving…' : saved ? 'Saved' : 'Save profile'} {saved && <Check size={13} />}
        </button>
      </form>
    </section>
  )
}

export function DashboardPage() {
  const { profile, requireAuth, demoMode } = useMvp()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const profileId = profile?.id

  useEffect(() => {
    if (!profileId) {
      setData(null)
      return
    }
    let cancelled = false
    setError(false)
    setData(null)
    getDashboardData(profileId)
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [profileId, reloadKey])

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
          <ProfileSettings />
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
          <h2 className="panel-subhead">Recent activity</h2>
          {data.activity.length ? (
            data.activity.map(item => (
              <div className="list-row" key={item.id}>
                <span className="notification-dot">
                  <Clock size={13} />
                </span>
                <span className="list-row-main">
                  <b>{item.label}</b>
                  <small>
                    {new Date(item.at).toLocaleDateString()}
                    {item.companyTicker ? ` · ${item.companyTicker}` : ''}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <p className="list-empty">Your campaign, question, and voting activity will appear here.</p>
          )}
        </div>
        <div className="panel">
          <NotificationsPanel
            notifications={data.notifications}
            userId={profile.id}
            demoMode={demoMode}
            onChanged={next => setData(current => (current ? { ...current, notifications: next } : current))}
          />
        </div>
      </div>
    </div>
  )
}

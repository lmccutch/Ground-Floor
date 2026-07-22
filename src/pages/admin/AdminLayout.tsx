import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { useAdminQuery } from '../../hooks/useAdminQuery'
import { getOverviewCounts, type OverviewCounts } from '../../lib/adminApi'
import { useAdminRefresh } from './components/refresh'

type NavItem = { to: string; label: string; end?: boolean; badge?: (c: OverviewCounts) => number }

const NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/queue', label: 'Work queue', badge: c => c.openWorkItems },
  { to: '/admin/company-requests', label: 'Company requests', badge: c => c.pendingCompanyRequests },
  { to: '/admin/campaigns', label: 'Campaigns', badge: c => c.campaignsNearThreshold + c.campaignsAtThreshold + c.campaignsOutreachRequired },
  { to: '/admin/questions', label: 'Questions', badge: c => c.questionsPendingReview },
  { to: '/admin/reports', label: 'Reports', badge: c => c.openQuestionReports },
  { to: '/admin/bugs', label: 'Bug reports', badge: c => c.openBugReports },
  { to: '/admin/support', label: 'Support', badge: c => c.newSupportTickets },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/notifications', label: 'Notifications', badge: c => c.unreadNotifications },
  { to: '/admin/audit-log', label: 'Audit log' },
  { to: '/admin/system', label: 'System' },
]

export function AdminLayout() {
  const { profile, signOut } = useMvp()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { version } = useAdminRefresh()
  // Nav badges + attention count re-fetch whenever a mutation bumps the version.
  const counts = useAdminQuery(() => getOverviewCounts(), [version])

  useEffect(() => setMenuOpen(false), [location.pathname])

  const navList = (
    <ul className="admin-nav-list">
      {NAV.map(item => {
        const badge = counts.data && item.badge ? item.badge(counts.data) : 0
        return (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}>
              <span>{item.label}</span>
              {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )

  const attention = counts.data?.openWorkItems ?? 0

  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <button className="icon-btn admin-menu-toggle" aria-label="Open admin menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/admin" className="admin-brand">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span>Open Floor Admin</span>
        </Link>
        <span className="admin-attention" aria-live="polite">
          {counts.loading ? 'Loading…' : `${attention} need${attention === 1 ? 's' : ''} attention`}
        </span>
        <div className="admin-topbar-actions">
          <span className="admin-identity" title="Signed in as the administrator">
            {profile?.displayName ?? 'Administrator'}
          </span>
          <Link to="/" className="btn ghost small">
            <ExternalLink size={14} /> View site
          </Link>
          <button className="btn ghost small" onClick={() => void signOut()}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-sidebar" aria-label="Admin sections">
          {navList}
        </nav>
        {menuOpen && (
          <>
            <div className="admin-mobile-backdrop" onClick={() => setMenuOpen(false)} />
            <nav className="admin-mobile-nav" aria-label="Admin sections">
              {navList}
            </nav>
          </>
        )}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

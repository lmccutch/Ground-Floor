import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, LayoutDashboard, LogOut, Mail, Menu, PlusCircle, Search } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { FeedbackWidget } from './FeedbackWidget'

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/discover', label: 'Discover', icon: Search, end: false },
  { to: '/companies', label: 'My companies', icon: BarChart3, end: false },
  { to: '/request-company', label: 'Request a company', icon: PlusCircle, end: false },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, demoMode, requireAuth, signOut } = useMvp()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const initials = profile ? profile.displayName.slice(0, 2).toUpperCase() : 'GU'
  const demoHint = 'No backend is configured — activity is stored in this browser only.'

  return (
    <div className="app-shell">
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <Link to="/" className="logo-mark">
          <span>G</span>
          <b>GroundFloor</b>
        </Link>
        <nav aria-label="Primary">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {demoMode && (
            <div className="demo-pill" title={demoHint}>
              Demo mode · data stays in this browser
            </div>
          )}
          <div className="profile-row">
            <span className="avatar">{initials}</span>
            <span className="profile-name">
              <strong>{profile ? profile.displayName : 'Guest'}</strong>
              <small>{profile ? (profile.email ?? 'Signed in') : 'Browsing freely'}</small>
            </span>
          </div>
          {profile ? (
            <button className="btn ghost small full" onClick={() => void signOut()}>
              <LogOut size={14} /> Sign out
            </button>
          ) : (
            <button className="btn gold small full" onClick={() => requireAuth('participate in campaigns')}>
              <Mail size={14} /> Sign in
            </button>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenuOpen(open => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu size={18} />
          </button>
          <Link to="/" className="topbar-brand">
            GroundFloor
          </Link>
          <div className="topbar-right">
            {demoMode && (
              <span className="badge neutral" title={demoHint}>
                Demo data
              </span>
            )}
            {profile ? (
              <span className="topbar-user">
                <span className="avatar small">{initials}</span>
                <span className="topbar-user-name">{profile.displayName}</span>
              </span>
            ) : (
              <button className="btn primary small" onClick={() => requireAuth('participate in campaigns')}>
                Sign in
              </button>
            )}
          </div>
        </header>
        <main className="page-content">{children}</main>
        <SiteFooter />
        <FeedbackWidget />
      </div>
    </div>
  )
}

const footerColumns: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'GroundFloor',
    links: [
      ['/about', 'About'],
      ['/how-it-works', 'How It Works'],
      ['/faq', 'FAQ'],
      ['/contact', 'Contact'],
    ],
  },
  {
    heading: 'Policies',
    links: [
      ['/transparency', 'Transparency'],
      ['/guidelines', 'Community Guidelines'],
      ['/voting-rules', 'Voting Rules'],
      ['/moderation', 'Moderation Policy'],
    ],
  },
  {
    heading: 'Legal',
    links: [
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
      ['/disclaimer', 'Investment Disclaimer'],
    ],
  },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="footer-columns" aria-label="Footer">
        {footerColumns.map(column => (
          <div key={column.heading} className="footer-column">
            <span className="footer-heading">{column.heading}</span>
            {column.links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <p className="footer-note">
        GroundFloor is not affiliated with any company shown, does not provide investment advice, and does not verify
        share ownership. Management participation is voluntary and never guaranteed.
      </p>
    </footer>
  )
}

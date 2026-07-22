import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, Search, X } from 'lucide-react'
import { useMvp } from '../context/useMvp'
import { FeedbackWidget } from './FeedbackWidget'

const primaryNav = [
  { to: '/discover', label: 'Discover' },
  { to: '/companies', label: 'My companies' },
  { to: '/how-it-works', label: 'How it works' },
]

const DEMO_HINT = 'No backend is configured — activity is stored in this browser only.'

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, demoMode, requireAuth, signOut, isAdmin } = useMvp()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Mobile-menu dialog behaviour: body-scroll lock, focus trap, Escape-to-close,
  // and focus return to the trigger on close.
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const menu = menuRef.current
    const focusable = () =>
      menu
        ? Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        : []
    focusable()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  // The admin action centre is a standalone internal application with its own
  // full-height chrome (topbar, sidebar, footerless). Render it bare so the public
  // site header/footer/feedback widget don't wrap it in a second layer of chrome.
  const isAdminArea = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
  if (isAdminArea) return <>{children}</>

  const initials = profile ? profile.displayName.slice(0, 2).toUpperCase() : 'GU'

  // The admin link is shown only after the server-verified admin check passes.
  // Hiding it is a convenience, NOT the security boundary — /admin, its data, and
  // every admin action are gated server-side by is_admin() + RLS.
  const shellNav = isAdmin ? [...primaryNav, { to: '/admin', label: 'Admin' }] : primaryNav

  const navLinks = shellNav.map(({ to, label }) => (
    <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
      {label}
    </NavLink>
  ))

  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="topnav-inner">
          <Link to="/" className="brand" aria-label="Open Floor home">
            <span className="brand-mark" aria-hidden="true">
              O
            </span>
            <span className="brand-name">Open Floor</span>
          </Link>

          <nav className="topnav-links" aria-label="Primary">
            {navLinks}
          </nav>

          <div className="topnav-actions">
            {demoMode && (
              <span className="badge neutral" title={DEMO_HINT}>
                Demo data
              </span>
            )}
            <Link to="/discover" className="icon-btn nav-search" aria-label="Find a company">
              <Search size={17} />
            </Link>
            {profile ? (
              <span className="account">
                <span className="avatar small" aria-hidden="true">
                  {initials}
                </span>
                <span className="account-name">{profile.displayName}</span>
                <button className="btn ghost small" onClick={() => void signOut()}>
                  <LogOut size={14} /> Sign out
                </button>
              </span>
            ) : (
              <button className="btn primary small nav-signin" onClick={() => requireAuth('participate in campaigns')}>
                Sign in
              </button>
            )}
          </div>

          <button
            ref={toggleRef}
            className="icon-btn nav-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div id="mobile-menu" ref={menuRef} className="mobile-menu open" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mobile-menu-head">
              <span className="brand-name">Menu</span>
              <button
                className="icon-btn"
                aria-label="Close menu"
                onClick={() => {
                  setMenuOpen(false)
                  toggleRef.current?.focus()
                }}
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mobile-nav" aria-label="Mobile primary">
              {navLinks}
              <NavLink to="/request-company" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Request a company
              </NavLink>
            </nav>
            <div className="mobile-menu-account">
              {demoMode && (
                <span className="badge neutral" title={DEMO_HINT}>
                  Demo data
                </span>
              )}
              {profile ? (
                <>
                  <span className="account-name">
                    <span className="avatar small" aria-hidden="true">
                      {initials}
                    </span>
                    {profile.displayName}
                  </span>
                  <button
                    className="btn ghost full"
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </>
              ) : (
                <button
                  className="btn primary full"
                  onClick={() => {
                    setMenuOpen(false)
                    requireAuth('participate in campaigns')
                  }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <main className="page-content">{children}</main>
      <SiteFooter />
      <FeedbackWidget />
    </div>
  )
}

const footerColumns: { heading: string; links: [string, string][] }[] = [
  {
    heading: 'Open Floor',
    links: [
      ['/about', 'About'],
      ['/how-it-works', 'How it works'],
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
      <div className="footer-inner">
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
          Open Floor is not affiliated with any company shown, does not provide investment advice, and does not verify
          share ownership. Management participation is voluntary and never guaranteed.
        </p>
      </div>
    </footer>
  )
}

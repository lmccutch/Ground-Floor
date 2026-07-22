import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { Skeleton } from '../../components/ui'
import { track } from '../../lib/analytics'

// The protected /admin foundation. The security boundary is server-side
// (is_admin() + RLS); this guard only decides what to render. It never flashes
// protected content: while auth or the admin check is loading it shows a
// skeleton, and only the confirmed sole administrator sees the placeholder.
export function AdminPage() {
  const { loading, adminLoading, isAdmin, profile } = useMvp()
  const navigate = useNavigate()
  const checking = loading || adminLoading

  useEffect(() => {
    if (!checking && isAdmin) track('admin_dashboard_viewed', {})
  }, [checking, isAdmin])

  // Unauthenticated visitors go through the normal password login flow.
  useEffect(() => {
    if (!loading && !profile) navigate('/login?redirect=/admin', { replace: true })
  }, [loading, profile, navigate])

  if (checking || !profile) {
    return (
      <div className="admin-shell">
        <Skeleton height={40} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (!isAdmin) {
    // Verified regular users (and unverified users) get a not-found/forbidden state.
    return (
      <div className="admin-shell">
        <div className="empty-state">
          <ShieldCheck size={22} />
          <h2>Page not found</h2>
          <p>You don’t have access to this area.</p>
          <Link className="btn secondary" to="/">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <div className="admin-placeholder">
        <span className="eyebrow">Administrator</span>
        <h1>Open Floor Admin</h1>
        <p>The operational dashboard will be added in the next phase.</p>
      </div>
    </div>
  )
}

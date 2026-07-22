import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { Skeleton } from '../../components/ui'

/**
 * Independent authorization gate for EVERY admin route (it wraps the whole admin
 * route subtree, so a direct URL to any nested page is guarded too). The security
 * boundary is server-side — is_admin() + RLS + guarded RPCs; this only decides
 * what to render, and never flashes protected content: while auth or the admin
 * check is in flight it shows a neutral skeleton, and only the confirmed sole
 * administrator sees the admin app.
 */
export function RequireAdmin() {
  const { loading, adminLoading, isAdmin, profile } = useMvp()
  const navigate = useNavigate()
  const location = useLocation()
  const checking = loading || adminLoading

  useEffect(() => {
    if (!loading && !profile) navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
  }, [loading, profile, navigate, location.pathname])

  if (checking || !profile) {
    return (
      <div className="admin-shell">
        <Skeleton height={44} />
        <Skeleton height={220} />
      </div>
    )
  }

  if (!isAdmin) {
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

  return <Outlet />
}

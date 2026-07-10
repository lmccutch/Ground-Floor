import { Link } from 'react-router-dom'
import { CircleHelp } from 'lucide-react'
import { EmptyState } from '../components/ui'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<CircleHelp size={22} />}
      title="Page not found"
      copy="The page you are looking for does not exist or has moved."
      action={
        <div className="empty-actions">
          <Link className="btn primary" to="/">
            Back home
          </Link>
          <Link className="btn secondary" to="/discover">
            Browse campaigns
          </Link>
        </div>
      }
    />
  )
}

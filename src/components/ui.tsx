import type { ReactNode } from 'react'
import { CircleAlert, Inbox } from 'lucide-react'
import { accentFor } from '../lib/helpers'

export function Monogram({ ticker, accent, large }: { ticker: string; accent?: string; large?: boolean }) {
  return (
    <span className={large ? 'monogram lg' : 'monogram'} style={{ background: accentFor(ticker, accent) }} aria-hidden="true">
      {ticker.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function PageHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'gold' | 'green'; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function EmptyState({ icon, title, copy, action }: { icon?: ReactNode; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon ?? <Inbox size={22} />}
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', copy, onRetry }: { title?: string; copy?: string; onRetry?: () => void }) {
  return (
    <div className="empty-state error">
      <CircleAlert size={22} />
      <h2>{title}</h2>
      <p>{copy ?? 'We could not load this right now. Please try again.'}</p>
      {onRetry && (
        <button className="btn secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Skeleton({ height, className }: { height: number; className?: string }) {
  return <div className={className ? `skeleton ${className}` : 'skeleton'} style={{ height }} aria-hidden="true" />
}

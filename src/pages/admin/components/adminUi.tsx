import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Copy, Inbox, Loader2, X } from 'lucide-react'
import type { QueryState } from '../../../hooks/useAdminQuery'
import type { Tone } from '../../../lib/adminFormat'

/* ------------------------------- page header ------------------------------- */

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="admin-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  )
}

/* ---------------------------------- chip ----------------------------------- */

export function Chip({ tone = 'normal', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`admin-chip tone-${tone}`}>{children}</span>
}

/* -------------------------------- stat card -------------------------------- */

export function StatCard({ label, value, to, tone = 'normal', hint }: { label: string; value: number | string; to?: string; tone?: Tone; hint?: string }) {
  const body = (
    <>
      <span className={`admin-stat-value tone-${tone}`}>{value}</span>
      <span className="admin-stat-label">{label}</span>
      {hint && <span className="admin-stat-hint">{hint}</span>}
    </>
  )
  return to ? (
    <Link to={to} className="admin-stat-card is-link">
      {body}
    </Link>
  ) : (
    <div className="admin-stat-card">{body}</div>
  )
}

/* ------------------------------ data states -------------------------------- */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <Loader2 className="spin" size={18} aria-hidden="true" /> <span>{label}</span>
    </div>
  )
}

export function AdminError({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="admin-empty error" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <p>{message ?? 'We could not load this data.'}</p>
      {onRetry && (
        <button className="btn secondary small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, message, icon }: { title: string; message?: string; icon?: ReactNode }) {
  return (
    <div className="admin-empty">
      {icon ?? <Inbox size={20} aria-hidden="true" />}
      <p className="admin-empty-title">{title}</p>
      {message && <p>{message}</p>}
    </div>
  )
}

/**
 * Renders the right state for a query: skeleton while first-loading, an error
 * with retry, or the children. `isEmpty` distinguishes "no records" from a load
 * — callers pass an empty node.
 */
export function DataState<T>({ query, children, empty }: { query: QueryState<T>; children: (data: T) => ReactNode; empty?: (data: T) => ReactNode }) {
  if (query.error) return <AdminError onRetry={query.reload} />
  if (query.loading && query.data == null) return <Loading />
  if (query.data == null) return <Loading />
  const emptyNode = empty?.(query.data)
  if (emptyNode) return <>{emptyNode}</>
  return <>{children(query.data)}</>
}

/* ------------------------------- pagination -------------------------------- */

export function Pagination({ offset, limit, total, onPage }: { offset: number; limit: number; total: number; onPage: (offset: number) => void }) {
  if (total <= limit) return null
  const page = Math.floor(offset / limit) + 1
  const pages = Math.ceil(total / limit)
  return (
    <nav className="admin-pagination" aria-label="Pagination">
      <button className="btn ghost small" disabled={offset <= 0} onClick={() => onPage(Math.max(0, offset - limit))}>
        Previous
      </button>
      <span className="admin-pagination-info">
        Page {page} of {pages} · {total} total
      </span>
      <button className="btn ghost small" disabled={offset + limit >= total} onClick={() => onPage(offset + limit)}>
        Next
      </button>
    </nav>
  )
}

/* --------------------------------- filters --------------------------------- */

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="admin-filter">
      <span className="admin-filter-label">{label}</span>
      <select className="text-input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="admin-filter grow">
      <span className="admin-filter-label">Search</span>
      <input className="text-input" type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? 'Search…'} />
    </label>
  )
}

/* ------------------------------ detail drawer ------------------------------ */

export function DetailDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="admin-drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="admin-drawer-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>
        <div className="admin-drawer-body">{children}</div>
      </aside>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-field">
      <span className="admin-field-label">{label}</span>
      <div className="admin-field-value">{children ?? '—'}</div>
    </div>
  )
}

export function CopyId({ id }: { id: string }) {
  return (
    <button
      className="admin-copy-id"
      onClick={() => void navigator.clipboard?.writeText(id).catch(() => {})}
      title="Copy identifier"
      aria-label={`Copy identifier ${id}`}
    >
      <span>{id.slice(0, 8)}…</span> <Copy size={12} />
    </button>
  )
}

export function CheckLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={`admin-check-line ${ok ? 'ok' : 'warn'}`}>
      {ok ? <Check size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />} {children}
    </div>
  )
}

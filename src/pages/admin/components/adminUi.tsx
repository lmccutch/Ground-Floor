import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, Check, Copy, HelpCircle, Inbox, Loader2, X } from 'lucide-react'
import type { QueryState } from '../../../hooks/useAdminQuery'
import type { Tone } from '../../../lib/adminFormat'
import { STATUS_LABEL, type HealthStatus } from '../../../lib/systemHealth'

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

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal detail drawer. Escape closes it, the page behind is scroll-locked, focus
 * moves in on open, Tab is trapped inside while it is open, and the element that
 * opened it is refocused on close — so a keyboard operator is never dropped back
 * at the top of the document or left tabbing through content they cannot see.
 */
export function DetailDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    // Focus the panel itself rather than the first control: the operator should
    // hear the drawer title before its actions.
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!e.shiftKey && (active === last || active === panel)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      // Restore focus to whatever opened the drawer.
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="admin-drawer-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={title} ref={panelRef} tabIndex={-1}>
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

/* --------------------------- collapsible section --------------------------- */

/** A labelled section inside a drawer. Rendered as a native <details> so keyboard
 *  and screen-reader behaviour is the platform's, not a re-implementation. */
export function DrawerSection({ title, count, defaultOpen = false, children }: { title: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="admin-drawer-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {count != null && <span className="admin-section-count">{count}</span>}
      </summary>
      <div className="admin-drawer-section-body">{children}</div>
    </details>
  )
}

/* ------------------------------ health status ------------------------------ */

const HEALTH_ICON: Record<HealthStatus, ReactNode> = {
  healthy: <Check size={14} aria-hidden="true" />,
  warning: <AlertTriangle size={14} aria-hidden="true" />,
  critical: <AlertOctagon size={14} aria-hidden="true" />,
  unknown: <HelpCircle size={14} aria-hidden="true" />,
}

/**
 * Status badge. The label is always spelled out — colour is never the only cue —
 * and Unknown gets its own distinct treatment so it can never be mistaken for a
 * pass at a glance.
 */
export function HealthBadge({ status }: { status: HealthStatus }) {
  return (
    <span className={`admin-health-badge health-${status}`}>
      {HEALTH_ICON[status]} {STATUS_LABEL[status]}
    </span>
  )
}

/** One health check: name, verdict and the evidence behind the verdict. */
export function HealthLine({ status, label, detail }: { status: HealthStatus; label: string; detail?: ReactNode }) {
  return (
    <div className={`admin-health-line health-${status}`}>
      <div className="admin-health-line-head">
        <span className="admin-health-line-label">{label}</span>
        <HealthBadge status={status} />
      </div>
      {detail && <p className="admin-health-line-detail">{detail}</p>}
    </div>
  )
}

/**
 * Wraps one section of the system page. A section whose data failed to load
 * renders its own error and the rest of the page still works — no single failed
 * check can blank the dashboard.
 */
export function HealthPanel({ title, status, description, error, loading, onRetry, children }: {
  title: string
  status: HealthStatus
  description?: string
  error?: unknown
  loading?: boolean
  onRetry?: () => void
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section className="admin-panel admin-health-panel" aria-labelledby={headingId}>
      <div className="admin-panel-head">
        <h2 id={headingId}>{title}</h2>
        <HealthBadge status={error ? 'unknown' : status} />
      </div>
      {description && <p className="admin-panel-note">{description}</p>}
      {error ? (
        <AdminError message="This check could not be read, so its state is unknown — not healthy." onRetry={onRetry} />
      ) : loading ? (
        <Loading />
      ) : (
        children
      )}
    </section>
  )
}

/* ------------------------------ copyable value ----------------------------- */

/** Full-value copy control for admin-only identifiers (e.g. a provider message
 *  id an operator needs to paste into the Resend dashboard). */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="admin-copy-value">
      <code>{value}</code>
      <button
        className="admin-copy-id"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(value)
            .then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            })
            .catch(() => {})
        }}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </span>
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

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

/** Shared centered-card layout for every auth screen. */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="auth-page">
      <div className="auth-card panel">
        <Link to="/" className="auth-brand" aria-label="Open Floor home">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span className="brand-name">Open Floor</span>
        </Link>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="auth-foot">{footer}</div>}
    </div>
  )
}

/** Password input with a show/hide toggle, reused across auth screens. */
export function PasswordField({
  label,
  value,
  onChange,
  name,
  autoComplete,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  name: string
  autoComplete: string
  hint?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      {label}
      <span className="password-field">
        <input
          className="text-input"
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, UserPlus } from 'lucide-react'
import { useMvp } from '../../context/useMvp'
import { checkUsernameAvailable } from '../../lib/api'
import { looksLikeEmail, validatePassword, validateUsername } from '../../lib/authValidation'
import { useDebouncedValue } from '../../lib/useDebouncedValue'
import { AuthLayout } from './AuthLayout'

// One source of truth: the same validators the server enforces (claim_username /
// username_available). Passwords are validated for policy only — never stored,
// hashed, or logged here; Supabase Auth is the sole credential store.
const schema = z
  .object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
    confirm: z.string(),
    accept: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const usernameError = validateUsername(values.username)
    if (usernameError) ctx.addIssue({ path: ['username'], code: 'custom', message: usernameError })
    if (!looksLikeEmail(values.email)) ctx.addIssue({ path: ['email'], code: 'custom', message: 'Enter a valid email address.' })
    const passwordError = validatePassword(values.password)
    if (passwordError) ctx.addIssue({ path: ['password'], code: 'custom', message: passwordError })
    if (values.password !== values.confirm) ctx.addIssue({ path: ['confirm'], code: 'custom', message: 'Passwords do not match.' })
    if (!values.accept) ctx.addIssue({ path: ['accept'], code: 'custom', message: 'Please accept the Terms and Privacy Policy.' })
  })

type SignupValues = z.infer<typeof schema>

export function SignupPage() {
  const { signUp } = useMvp()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(schema), defaultValues: { accept: false } })

  // Live availability hint (server-authoritative). Debounced to limit requests.
  const usernameValue = watch('username') ?? ''
  const debounced = useDebouncedValue(usernameValue.trim(), 400)
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  useEffect(() => {
    if (!debounced || validateUsername(debounced)) {
      setAvailability('idle')
      return
    }
    let active = true
    setAvailability('checking')
    checkUsernameAvailable(debounced)
      .then(ok => active && setAvailability(ok ? 'available' : 'taken'))
      .catch(() => active && setAvailability('idle'))
    return () => {
      active = false
    }
  }, [debounced])

  async function onSubmit(values: SignupValues) {
    setSubmitError('')
    const available = await checkUsernameAvailable(values.username.trim())
    if (!available) {
      setError('username', { message: 'That username is already taken.' })
      return
    }
    try {
      const result = await signUp({ username: values.username.trim(), email: values.email.trim().toLowerCase(), password: values.password })
      if (result.status === 'verification_sent') {
        setSentEmail(values.email.trim().toLowerCase())
      } else {
        // Demo mode signs in immediately; the completion dialog handles the rest.
        navigate('/companies')
      }
    } catch {
      // Generic — Supabase intentionally does not reveal whether the email exists.
      setSubmitError('We could not create your account. Please check your details and try again.')
    }
  }

  if (sentEmail) {
    return (
      <AuthLayout
        eyebrow="Verify your email"
        title="Check your inbox."
        subtitle={`We sent a verification link to ${sentEmail}. Confirm it, then sign in with your password.`}
        footer={
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        }
      >
        <div className="success-state">
          <div className="success-icon">
            <Check size={22} />
          </div>
          <p>Didn’t get it? Check your spam folder, or resend the verification email.</p>
          <Link className="btn secondary" to={`/verify-email?email=${encodeURIComponent(sentEmail)}`}>
            Resend verification email
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Join Open Floor"
      subtitle="Choose a username, add your email, and set a password."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="field">
          Username
          <input className="text-input" {...register('username')} placeholder="quiet_investor" autoComplete="username" autoCapitalize="none" spellCheck={false} />
          {errors.username ? (
            <small className="form-error">{errors.username.message}</small>
          ) : availability === 'available' ? (
            <small className="field-hint success">That username is available.</small>
          ) : availability === 'taken' ? (
            <small className="form-error">That username is already taken.</small>
          ) : availability === 'checking' ? (
            <small className="field-hint">Checking availability…</small>
          ) : (
            <small className="field-hint">3–30 characters: letters, numbers, and underscores.</small>
          )}
        </label>
        <label className="field">
          Email
          <input className="text-input" type="email" {...register('email')} placeholder="you@example.com" autoComplete="email" />
          {errors.email && <small className="form-error">{errors.email.message}</small>}
        </label>
        <label className="field">
          Password
          <span className="password-field">
            <input
              className="text-input"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              autoComplete="new-password"
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
          {errors.password ? <small className="form-error">{errors.password.message}</small> : <small className="field-hint">At least 10 characters.</small>}
        </label>
        <label className="field">
          Confirm password
          <input className="text-input" type={showPassword ? 'text' : 'password'} {...register('confirm')} autoComplete="new-password" />
          {errors.confirm && <small className="form-error">{errors.confirm.message}</small>}
        </label>
        <label className="checkbox-field">
          <input type="checkbox" {...register('accept')} />
          <span>
            I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        {errors.accept && <small className="form-error">{errors.accept.message}</small>}
        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
        <button className="btn primary full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'} <UserPlus size={15} />
        </button>
      </form>
    </AuthLayout>
  )
}

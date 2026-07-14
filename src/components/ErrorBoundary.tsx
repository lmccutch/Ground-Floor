import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Catches unexpected React render-phase errors only — not API/network failures or
 * form-submission errors, which every page already handles itself via ErrorState and
 * inline form-error messages. A render crash here means a real bug, so the fallback is
 * intentionally generic (no stack trace or error message shown to the user) rather than
 * trying to explain what broke.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Unexpected rendering error caught by ErrorBoundary:', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="config-error-screen" role="alert">
          <CircleAlert size={28} color="var(--red)" aria-hidden="true" />
          <h1>Something went wrong.</h1>
          <p>
            We hit an unexpected error and couldn't display this page. Your account and activity are safe — try
            again, or head back to the homepage.
          </p>
          <div className="empty-actions">
            {/* Full reload rather than resetting local state: the crash may be caused by
                app state outside this boundary, which resetting hasError alone would not clear. */}
            <button className="btn primary" type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
            <a className="btn secondary" href="/">
              Return home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

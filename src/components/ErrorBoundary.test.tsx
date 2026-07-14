import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // React logs caught render errors to console.error even when a boundary handles
    // them — expected here, so silence it rather than letting it clutter test output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>Everything is fine</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Everything is fine')).toBeInTheDocument()
  })

  it('renders a credible fallback instead of crashing when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /something went wrong/i })).toBeInTheDocument()
    // No stack trace or raw error message shown to the user.
    expect(screen.queryByText('boom')).not.toBeInTheDocument()
  })

  it('offers keyboard-reachable retry and return-home controls', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    const retry = screen.getByRole('button', { name: /try again/i })
    const home = screen.getByRole('link', { name: /return home/i })
    expect(retry).toBeInTheDocument()
    expect(home).toHaveAttribute('href', '/')

    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    })
    fireEvent.click(retry)
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})

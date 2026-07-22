import { useCallback, useEffect, useRef, useState } from 'react'

export type QueryState<T> = {
  data: T | null
  loading: boolean
  error: unknown | null
  reload: () => void
}

/**
 * Small data-fetching hook for the admin centre: loading/error state, manual
 * reload, and stale-request cancellation (a superseded fetch never sets state).
 * Re-runs whenever `deps` change, so URL-driven filters trigger a fresh query.
 */
export function useAdminQuery<T>(fn: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown | null>(null)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then(result => {
        if (active) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          setError(err)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick(t => t + 1), [])
  return { data, loading, error, reload }
}

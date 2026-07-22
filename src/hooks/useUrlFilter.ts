import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Reads/writes a single filter value in the URL query string so filter + search
 * state survives refresh and back/forward navigation. Changing any filter clears
 * the pagination offset (except when setting `offset` itself). Empty/default
 * values are removed from the URL to keep it clean.
 */
export function useUrlFilter(key: string, def = ''): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? def
  const set = useCallback(
    (next: string) => {
      setParams(
        prev => {
          const p = new URLSearchParams(prev)
          if (next && next !== def) p.set(key, next)
          else p.delete(key)
          if (key !== 'offset') p.delete('offset')
          return p
        },
        { replace: true },
      )
    },
    [key, def, setParams],
  )
  return [value, set]
}

export function useUrlOffset(): [number, (offset: number) => void] {
  const [raw, setRaw] = useUrlFilter('offset', '0')
  const offset = Math.max(0, Number(raw) || 0)
  return [offset, (o: number) => setRaw(String(Math.max(0, o)))]
}

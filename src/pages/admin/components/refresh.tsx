import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

// A tiny version counter shared across the admin app. Every admin data query
// includes `version` in its deps, so calling refresh() after a successful mutation
// re-runs the affected list queries AND the layout's overview/nav counts — an
// immediate, refresh-free update without optimistically faking high-impact results.
type RefreshCtx = { version: number; refresh: () => void }

const Ctx = createContext<RefreshCtx>({ version: 0, refresh: () => {} })

export function AdminRefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion(v => v + 1), [])
  const value = useMemo(() => ({ version, refresh }), [version, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminRefresh(): RefreshCtx {
  return useContext(Ctx)
}

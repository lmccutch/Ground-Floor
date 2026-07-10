// Single source of truth for deciding how the app sources its data. Nothing else
// in the codebase should inspect import.meta.env.VITE_DATA_MODE or the Supabase
// credential env vars to make this decision — import getDataModeConfig() instead.

export type DataMode = 'demo' | 'supabase' | 'test'

const VALID_MODES: readonly DataMode[] = ['demo', 'supabase', 'test']

export class DataModeConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataModeConfigError'
  }
}

export type DataModeEnv = {
  VITE_DATA_MODE?: string
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  DEV?: boolean
}

export type DataModeConfig = {
  mode: DataMode
  isDemoMode: boolean
  isSupabaseMode: boolean
  isTestMode: boolean
  /** localStorage namespace for demo/test local data. Test mode never shares this with demo mode. */
  storageKey: string
}

function isDataMode(value: string): value is DataMode {
  return (VALID_MODES as readonly string[]).includes(value)
}

/**
 * Pure resolver, kept separate from the memoized getDataModeConfig() below, so
 * mode detection can be unit-tested against arbitrary env objects rather than
 * only through whatever import.meta.env happens to be at module-load time.
 *
 * Credentials being present is never sufficient on its own to select Supabase
 * mode — VITE_DATA_MODE is the only thing that selects it.
 */
export function resolveDataModeConfig(env: DataModeEnv): DataModeConfig {
  const raw = env.VITE_DATA_MODE?.trim()
  let mode: DataMode

  if (raw) {
    if (!isDataMode(raw)) {
      throw new DataModeConfigError(`Invalid VITE_DATA_MODE "${raw}". Expected "demo", "supabase", or "test".`)
    }
    mode = raw
  } else if (env.DEV) {
    // Convenience default for local development only — production builds must set it explicitly.
    mode = 'demo'
  } else {
    throw new DataModeConfigError(
      'VITE_DATA_MODE is required in production. Set it to "demo", "supabase", or "test" — see README.md for details.',
    )
  }

  if (mode === 'supabase' && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    throw new DataModeConfigError(
      'VITE_DATA_MODE=supabase requires both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set.',
    )
  }

  return {
    mode,
    isDemoMode: mode === 'demo',
    isSupabaseMode: mode === 'supabase',
    isTestMode: mode === 'test',
    storageKey: mode === 'test' ? 'groundfloor-mvp-test' : 'groundfloor-mvp',
  }
}

let cached: DataModeConfig | null = null

/** Memoized so repeated calls don't re-validate, but still lazy so importing this module never throws by itself. */
export function getDataModeConfig(): DataModeConfig {
  if (!cached) cached = resolveDataModeConfig(import.meta.env as DataModeEnv)
  return cached
}

/**
 * Extra guidance appended to generic load-error copy when running Supabase mode
 * locally, so a developer suspects unapplied migrations/bootstrap data instead of
 * guessing. Omitted outside local dev so production users never see infra details.
 */
export function supabaseDataErrorHint(): string | undefined {
  if (!import.meta.env.DEV) return undefined
  if (!getDataModeConfig().isSupabaseMode) return undefined
  return 'In Supabase mode, this usually means a migration or the company-directory bootstrap has not been applied yet — see README.md.'
}

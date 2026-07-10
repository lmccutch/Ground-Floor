import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDataModeConfig } from './dataMode'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Supabase mode is selected explicitly via VITE_DATA_MODE — never merely because
// credentials happen to be present (getDataModeConfig() already validates that
// both env vars exist whenever mode === 'supabase').
export const supabase: SupabaseClient | null = getDataModeConfig().isSupabaseMode
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null

export const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined
export const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

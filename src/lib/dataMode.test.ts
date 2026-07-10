import { describe, expect, it } from 'vitest'
import { DataModeConfigError, resolveDataModeConfig } from './dataMode'

describe('resolveDataModeConfig', () => {
  it('demo mode with Supabase credentials present still uses demo data — credentials alone never select Supabase mode', () => {
    const config = resolveDataModeConfig({
      VITE_DATA_MODE: 'demo',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      DEV: true,
    })
    expect(config.mode).toBe('demo')
    expect(config.isDemoMode).toBe(true)
    expect(config.isSupabaseMode).toBe(false)
  })

  it('Supabase mode without credentials produces a clear configuration error', () => {
    expect(() => resolveDataModeConfig({ VITE_DATA_MODE: 'supabase', DEV: true })).toThrow(DataModeConfigError)
    expect(() => resolveDataModeConfig({ VITE_DATA_MODE: 'supabase', DEV: true })).toThrow(/VITE_SUPABASE_URL/)
  })

  it('Supabase mode with credentials resolves successfully', () => {
    const config = resolveDataModeConfig({
      VITE_DATA_MODE: 'supabase',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
      DEV: true,
    })
    expect(config.mode).toBe('supabase')
    expect(config.isSupabaseMode).toBe(true)
  })

  it('an invalid mode produces a clear configuration error', () => {
    expect(() => resolveDataModeConfig({ VITE_DATA_MODE: 'bogus', DEV: true })).toThrow(DataModeConfigError)
    expect(() => resolveDataModeConfig({ VITE_DATA_MODE: 'bogus', DEV: true })).toThrow(/Invalid VITE_DATA_MODE/)
  })

  it('test mode uses a storage namespace separate from demo mode', () => {
    const demo = resolveDataModeConfig({ VITE_DATA_MODE: 'demo', DEV: true })
    const test = resolveDataModeConfig({ VITE_DATA_MODE: 'test', DEV: true })
    expect(test.isTestMode).toBe(true)
    expect(test.storageKey).not.toBe(demo.storageKey)
  })

  it('defaults to demo mode in development when VITE_DATA_MODE is missing', () => {
    const config = resolveDataModeConfig({ DEV: true })
    expect(config.mode).toBe('demo')
  })

  it('requires an explicit VITE_DATA_MODE in production and fails clearly if missing', () => {
    expect(() => resolveDataModeConfig({ DEV: false })).toThrow(DataModeConfigError)
    expect(() => resolveDataModeConfig({ DEV: false })).toThrow(/required in production/)
  })
})

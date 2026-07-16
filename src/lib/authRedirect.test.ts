import { afterEach, describe, expect, it, vi } from 'vitest'

// Verifies the magic-link auth call sends the resolved site URL as its redirect,
// never the literal "VITE_SITE_URL". The real Supabase client is null in test
// mode (no credentials), so we mock the module to force the supabase branch and
// capture the options passed to signInWithOtp.

const signInWithOtp = vi.fn(async (_args: unknown) => ({ error: null }))

vi.mock('./supabase', () => ({
  supabase: { auth: { signInWithOtp } },
  posthogKey: undefined,
  posthogHost: undefined,
}))

async function callMagicLink(email: string) {
  // Import after the mock is registered so api.ts binds to the mocked client.
  const { signInWithMagicLink } = await import('./api')
  return signInWithMagicLink(email)
}

describe('signInWithMagicLink redirect', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    signInWithOtp.mockClear()
    vi.resetModules()
  })

  it('uses the configured production site URL as emailRedirectTo', async () => {
    vi.stubEnv('VITE_SITE_URL', 'https://open-floor.ca')
    await callMagicLink('investor@example.com')
    expect(signInWithOtp).toHaveBeenCalledTimes(1)
    const args = signInWithOtp.mock.calls[0][0] as { email: string; options: { emailRedirectTo: string } }
    expect(args.email).toBe('investor@example.com')
    expect(args.options.emailRedirectTo).toBe('https://open-floor.ca')
  })

  it('normalizes a trailing slash in the configured site URL', async () => {
    vi.stubEnv('VITE_SITE_URL', 'https://open-floor.ca/')
    await callMagicLink('a@b.com')
    const args = signInWithOtp.mock.calls[0][0] as { options: { emailRedirectTo: string } }
    expect(args.options.emailRedirectTo).toBe('https://open-floor.ca')
  })

  it('never sends the literal string "VITE_SITE_URL"', async () => {
    vi.stubEnv('VITE_SITE_URL', 'VITE_SITE_URL')
    await callMagicLink('a@b.com')
    const args = signInWithOtp.mock.calls[0][0] as { options: { emailRedirectTo: string } }
    expect(args.options.emailRedirectTo).not.toBe('VITE_SITE_URL')
    expect(args.options.emailRedirectTo).toContain('http')
  })
})

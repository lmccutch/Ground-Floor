import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { identify, resetAnalytics, track } from '../lib/analytics'
import {
  buildSupabaseProfile,
  claimUsername,
  getSessionProfile,
  isCurrentUserAdmin,
  loginWithIdentifier,
  signOut as apiSignOut,
  signUpAccount,
  updateProfile,
  type Profile,
  type SignUpAccountInput,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { rememberEmail } from '../lib/authClient'
import { AuthModal } from '../components/AuthModal'
import { MvpContext, type MvpContextValue } from './MvpContextValue'

export function MvpProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authAction, setAuthAction] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  // The last id passed to PostHog identify(), so an auth-state change that fires
  // repeatedly (e.g. token refresh) does not re-identify the same user.
  const identifiedId = useRef<string | null>(null)

  // Server-verified admin status. Never inferred from the client — always the
  // is_admin() RPC, which checks membership + approved email + verification.
  const refreshAdmin = useCallback(async (signedIn: boolean) => {
    setAdminLoading(true)
    const next = signedIn ? await isCurrentUserAdmin() : false
    setIsAdmin(next)
    setAdminLoading(false)
  }, [])

  const applyProfile = useCallback(
    (next: Profile | null) => {
      setProfile(next)
      if (next?.id && identifiedId.current !== next.id) {
        identifiedId.current = next.id
        identify(next.id)
      }
      void refreshAdmin(Boolean(next))
    },
    [refreshAdmin],
  )

  useEffect(() => {
    getSessionProfile()
      .then(applyProfile)
      .catch(() => applyProfile(null))
      .finally(() => setLoading(false))
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (!user) {
        applyProfile(null)
        return
      }
      void buildSupabaseProfile(user.id, user.email, Boolean(user.email_confirmed_at)).then(async next => {
        // If a just-verified/just-signed-in account has no username yet, claim the
        // one chosen at signup (stored in auth metadata). Best-effort: if it was
        // taken in the meantime, the completion dialog prompts for another.
        const desired = (user.user_metadata?.username as string | undefined)?.trim()
        if (!next.username && desired) {
          try {
            await claimUsername(desired)
            next = { ...next, username: desired }
          } catch {
            /* username no longer available — completion dialog handles it */
          }
        }
        applyProfile(next)
      })
    })
    return () => data.subscription.unsubscribe()
  }, [applyProfile])

  // A signed-in user who hasn't finished setup (no confirmed display name, or —
  // in Supabase mode — no username yet) is prompted to complete it — except on the
  // auth screens themselves, where the completion dialog would fight the page
  // (e.g. a recovery session on /reset-password).
  useEffect(() => {
    if (loading || !profile) return
    const authPaths = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password']
    if (typeof window !== 'undefined' && authPaths.includes(window.location.pathname)) return
    const needsUsername = Boolean(supabase) && !profile.username
    if (!profile.complete || needsUsername) setAuthAction('finish setting up your profile')
  }, [loading, profile])

  // Remember the email of any established session on this device so a returning
  // user sees it prefilled. Stores only a normalized email — never a token.
  useEffect(() => {
    if (profile?.email) rememberEmail(profile.email)
  }, [profile?.email])

  const value = useMemo<MvpContextValue>(
    () => ({
      profile,
      loading,
      demoMode: !supabase,
      isAdmin,
      adminLoading,
      login: async (identifier, password) => {
        track('login_attempted', {})
        try {
          await loginWithIdentifier(identifier, password)
        } catch (error) {
          track('login_failed', {})
          throw error
        }
        const next = await getSessionProfile()
        applyProfile(next)
        track('login_succeeded', {})
      },
      signUp: async (input: SignUpAccountInput) => {
        track('signup_started', { source: 'signup_page' })
        const result = await signUpAccount(input)
        track('signup_completed', { verification_required: result.status === 'verification_sent' })
        if (result.status === 'verification_sent') track('email_verification_prompted', {})
        // Demo mode establishes a session immediately; reflect it.
        if (!supabase) applyProfile(await getSessionProfile())
        return result
      },
      signOut: async () => {
        await apiSignOut()
        setProfile(null)
        setIsAdmin(false)
        // Clear the analytics identity so the next visitor on this device is not
        // attributed to the account that just signed out.
        identifiedId.current = null
        resetAnalytics()
      },
      completeProfile: async input => {
        if (!profile) return
        if (input.username && !profile.username) await claimUsername(input.username)
        const updated = await updateProfile({ displayName: input.displayName, investorType: input.investorType }, profile.id, profile.email)
        applyProfile({ ...updated, username: input.username ?? profile.username })
        track('signup_completed', { investor_type: input.investorType })
      },
      updateProfileDetails: async input => {
        if (!profile) return
        const updated = await updateProfile(input, profile.id, profile.email)
        applyProfile({ ...updated, username: profile.username })
        // Only non-private facts: whether optional fields are set, never their values.
        track('profile_updated', { has_country: Boolean(input.country), public_anonymous: Boolean(input.publicAnonymous) })
      },
      requireAuth: action => {
        if (profile) return true
        track('signup_started', { action })
        setAuthAction(action)
        return false
      },
    }),
    [profile, loading, isAdmin, adminLoading, applyProfile],
  )

  return (
    <MvpContext.Provider value={value}>
      {children}
      {authAction && <AuthModal action={authAction} onClose={() => setAuthAction(null)} />}
    </MvpContext.Provider>
  )
}

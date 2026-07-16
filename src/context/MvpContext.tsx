import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { identify, resetAnalytics, track } from '../lib/analytics'
import {
  buildSupabaseProfile,
  getSessionProfile,
  signInWithMagicLink,
  signOut as apiSignOut,
  updateProfile,
  type Profile,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { rememberEmail } from '../lib/authClient'
import { AuthModal } from '../components/AuthModal'
import { MvpContext, type MvpContextValue } from './MvpContextValue'

export function MvpProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authAction, setAuthAction] = useState<string | null>(null)
  // The last id passed to PostHog identify(), so an auth-state change that fires
  // repeatedly (e.g. token refresh) does not re-identify the same user.
  const identifiedId = useRef<string | null>(null)

  useEffect(() => {
    getSessionProfile()
      .then(profile => {
        setProfile(profile)
        if (profile?.id && identifiedId.current !== profile.id) {
          identifiedId.current = profile.id
          identify(profile.id)
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (!user) {
        setProfile(null)
        return
      }
      void buildSupabaseProfile(user.id, user.email).then(next => {
        setProfile(next)
        // Identify with the pseudonymous Supabase user id only — never email.
        if (identifiedId.current !== next.id) {
          identifiedId.current = next.id
          identify(next.id)
        }
      })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // A signed-in user without a confirmed display name is prompted to finish setup.
  useEffect(() => {
    if (!loading && profile && !profile.complete) setAuthAction('finish setting up your profile')
  }, [loading, profile])

  // Remember the email of any established authenticated session on this device,
  // so a returning user (including after logout) sees it prefilled. This stores
  // only a normalized email for convenience — never a token or proof of identity.
  useEffect(() => {
    if (profile?.email) rememberEmail(profile.email)
  }, [profile?.email])

  const value = useMemo<MvpContextValue>(
    () => ({
      profile,
      loading,
      demoMode: !supabase,
      signIn: async email => {
        const next = await signInWithMagicLink(email)
        // A successful request (link sent, or demo auto-auth) — remember the email.
        rememberEmail(email)
        track('magic_link_requested', { demo: !supabase })
        if (next) {
          setProfile(next)
          if (identifiedId.current !== next.id) {
            identifiedId.current = next.id
            identify(next.id)
          }
        }
      },
      signOut: async () => {
        await apiSignOut()
        setProfile(null)
        // Clear the analytics identity so the next visitor on this device is not
        // attributed to the account that just signed out.
        identifiedId.current = null
        resetAnalytics()
      },
      completeProfile: async input => {
        if (!profile) return
        const updated = await updateProfile(input, profile.id, profile.email)
        setProfile(updated)
        track('signup_completed', { investor_type: input.investorType })
      },
      updateProfileDetails: async input => {
        if (!profile) return
        const updated = await updateProfile(input, profile.id, profile.email)
        setProfile(updated)
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
    [profile, loading],
  )

  return (
    <MvpContext.Provider value={value}>
      {children}
      {authAction && <AuthModal action={authAction} onClose={() => setAuthAction(null)} />}
    </MvpContext.Provider>
  )
}

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { identify, track } from '../lib/analytics'
import {
  buildSupabaseProfile,
  getSessionProfile,
  signInWithMagicLink,
  signOut as apiSignOut,
  updateProfile,
  type Profile,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { AuthModal } from '../components/AuthModal'
import { MvpContext, type MvpContextValue } from './MvpContextValue'

export function MvpProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authAction, setAuthAction] = useState<string | null>(null)

  useEffect(() => {
    getSessionProfile()
      .then(setProfile)
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
        identify(next.id, { email: next.email })
      })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // A signed-in user without a confirmed display name is prompted to finish setup.
  useEffect(() => {
    if (!loading && profile && !profile.complete) setAuthAction('finish setting up your profile')
  }, [loading, profile])

  const value = useMemo<MvpContextValue>(
    () => ({
      profile,
      loading,
      demoMode: !supabase,
      signIn: async email => {
        const next = await signInWithMagicLink(email)
        track('magic_link_requested', { demo: !supabase })
        if (next) {
          setProfile(next)
          identify(next.id, { email: next.email })
        }
      },
      signOut: async () => {
        await apiSignOut()
        setProfile(null)
      },
      completeProfile: async input => {
        if (!profile) return
        const updated = await updateProfile(input, profile.id, profile.email)
        setProfile(updated)
        track('signup_completed', { investor_type: input.investorType })
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

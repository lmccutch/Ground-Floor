import { createContext } from 'react'
import type { Profile } from '../lib/api'

export type MvpContextValue = {
  profile: Profile | null
  loading: boolean
  demoMode: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  completeProfile: (input: { displayName: string; investorType?: string }) => Promise<void>
  /** Returns true when signed in; otherwise opens the sign-in dialog and returns false. */
  requireAuth: (action: string) => boolean
}

export const MvpContext = createContext<MvpContextValue | null>(null)

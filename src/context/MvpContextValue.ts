import { createContext } from 'react'
import type { Profile, ProfileUpdateInput, SignUpAccountInput, SignUpResult } from '../lib/api'

export type MvpContextValue = {
  profile: Profile | null
  loading: boolean
  demoMode: boolean
  /** True only for the verified, active sole administrator (server-verified via is_admin()). */
  isAdmin: boolean
  /** True while the admin check is in flight — used to avoid a protected-content flash. */
  adminLoading: boolean
  /** Sign in with a username OR email, plus password. Throws a generic error on failure. */
  login: (identifier: string, password: string) => Promise<void>
  /** Create a username/email/password account. Returns whether verification is required. */
  signUp: (input: SignUpAccountInput) => Promise<SignUpResult>
  signOut: () => Promise<void>
  /** Finish account setup: reserve a username (when missing) and confirm display name / investor type. */
  completeProfile: (input: { displayName: string; username?: string; investorType?: string }) => Promise<void>
  /** Full profile-settings update (display name, country, investor type, anonymity). */
  updateProfileDetails: (input: ProfileUpdateInput) => Promise<void>
  /** Returns true when signed in; otherwise opens the sign-in dialog and returns false. */
  requireAuth: (action: string) => boolean
}

export const MvpContext = createContext<MvpContextValue | null>(null)

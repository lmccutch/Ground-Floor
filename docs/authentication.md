# Authentication — username/email + password

Open Floor uses conventional **username or email + password** authentication backed
entirely by **Supabase Auth**. Magic-link / OTP sign-in has been removed. This
document describes the architecture, flows, and the Supabase configuration
required in production.

> Passwords are stored and verified **only** by Supabase Auth. They are never
> written to a profile table, hashed in the browser, logged, sent through Resend,
> or included in analytics/error payloads.

## Screens & routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in with username **or** email + password. |
| `/signup` | Create an account: username, email, password, confirm, accept Terms/Privacy. |
| `/verify-email` | Redirect target for the verification link; also resends verification. |
| `/forgot-password` | Request a password-reset email (generic response — no enumeration). |
| `/reset-password` | Redirect target for the recovery link; set a new password. |

A compact **sign-in modal** (`src/components/AuthModal.tsx`) is still opened by
`requireAuth()` for inline gating (e.g. "support this campaign"); it shares the
same logic and links out to the full pages. In demo mode (no Supabase) it accepts
any credentials so the app is usable without a backend.

## Sign-up

`src/pages/auth/SignupPage.tsx` → `signUpAccount()` in `src/lib/api.ts`.

1. Client validates with the shared rules in `src/lib/authValidation.ts`
   (`validateUsername`, `validatePassword`) and a debounced availability check
   (`username_available` RPC — returns only a boolean).
2. `supabase.auth.signUp({ email, password, options.data: { username, display_name } })`
   with `emailRedirectTo = <site>/verify-email`.
3. The `on_auth_user_created` trigger inserts the profile row (display_name from
   metadata). The **username is reserved separately** via `claim_username()` once
   a session exists (see below) so uniqueness conflicts surface to the user.
4. With email confirmation enabled, no session is returned → the screen shows
   "check your inbox".

### Username rules (server-enforced)

Enforced by `profiles_username_format_chk`, the unique index on
`username_normalized`, `public.reserved_usernames`, and `claim_username()`:

- 3–30 characters; begins with a letter or number; letters/numbers/underscore only.
- Case-insensitive uniqueness (`username_normalized = lower(username)`), so
  `Luke` and `luke` cannot both exist.
- Reserved names blocked (admin, moderator, openfloor, support, …).
- Concurrency: two simultaneous claims for the same name → exactly one winner via
  the unique index; the loser receives `username_taken`.

`claim_username()` is the **only** write path for `username`/`username_normalized`
— client `UPDATE` of those columns is revoked (`202607210002`).

### Username reservation timing

`username` is claimed when a session first exists. `MvpContext` reads the desired
username from `user_metadata` after sign-in/verification and calls
`claim_username()`; if it was taken in the meantime, the account-completion dialog
prompts for another. This leaves a small window where a just-created account has
no username yet — the account is never "half-created" (the profile row exists).

## Login

`src/pages/auth/LoginPage.tsx` / the modal → `loginWithIdentifier()`.

- **Email** identifier → `supabase.auth.signInWithPassword`.
- **Username** identifier → the **`login` Edge Function**
  (`supabase/functions/login/index.ts`) resolves username→email **server-side with
  the service-role key** (the browser never receives that mapping), performs the
  password grant, and returns a session, which the client applies with
  `setSession`. It returns a single generic `invalid_credentials` for every
  failure (unknown username, wrong password, unverified) — no enumeration.
- All failures surface as one generic message (`GENERIC_AUTH_ERROR`).

The Edge Function has a best-effort per-IP rate limiter; GoTrue also rate-limits
token grants. Deploy it and set its secrets before enabling username login (see
the runbook).

## Email verification (not a login method)

The verification link confirms ownership and lands on `/verify-email`, which shows
a success state and directs the user to sign in with their password. It is **not**
a passwordless login. Expired/invalid/reused links show a clear error and a resend
option. No "magic link" language anywhere.

## Password reset

`/forgot-password` → `resetPasswordForEmail(email, { redirectTo: <site>/reset-password })`.
Always returns a generic response. The recovery link lands on `/reset-password`,
which detects the recovery session, lets the user set a new password
(`supabase.auth.updateUser`), clears the recovery session (`signOut`), and directs
back to `/login`. The recovery link is permitted because it resets a password — it
is not a general passwordless login.

## Existing users (magic-link → password migration)

All existing accounts, usernames, and profile data are preserved (same
`auth.users` UUIDs). Existing accounts have no password, so a one-time migration
emails each a password-reset link:

```
SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… \
SITE_URL=https://www.open-floor.ca \
  npx tsx scripts/send-password-setup-emails.ts --dry-run   # preview
# then re-run without --dry-run
```

Run it **after** the frontend (with `/reset-password`) is deployed and the
redirect allow-list includes `<site>/reset-password`. "Forgot password" remains a
permanent fallback.

## Supabase dashboard configuration (production)

Authentication → Providers / URL configuration / Email templates:

- **Email + password**: enabled. **Magic link / Email OTP**: disabled.
- **Confirm email**: enabled (verification required).
- **Site URL**: `https://www.open-floor.ca`.
- **Redirect allow-list**: `https://www.open-floor.ca/verify-email`,
  `https://www.open-floor.ca/reset-password`, plus `http://localhost:5173/*` for
  local dev and preview URLs as needed.
- **Email templates** (branded, no "magic link" wording):
  - *Confirm signup* → "Verify your Open Floor email", link to `/verify-email`.
  - *Reset password* → "Reset your Open Floor password", link to `/reset-password`.
  - Optionally *Change email address* confirmations.
- **SMTP**: default Supabase sender for low volume, or custom SMTP (e.g. Resend)
  for higher throughput and branding. Resend is **only** a mail transport — never
  password storage or auth logic.

## Analytics events (no PII)

`signup_started`, `signup_completed`, `email_verification_prompted`,
`email_verified`, `login_attempted`, `login_succeeded`, `login_failed`,
`password_reset_requested`, `password_reset_completed`. No passwords, tokens, full
emails, or raw auth error payloads are ever sent. `sanitizeAnalyticsUrl` still
strips recovery/verify tokens from URLs before any analytics call.

## Local testing

- Demo mode (`VITE_DATA_MODE=demo`): no Supabase; auth screens accept any
  credentials. This is what the e2e suite exercises.
- Supabase mode: point `.env.local` at a **scratch** project, set redirect URLs,
  and run `npm run verify:admin-security` (needs a service-role key).

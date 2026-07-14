# Production deployment

Status as of 2026-07-13: Phase 1 has passed browser acceptance against a live
scratch Supabase project (see [supabase-verification-checklist.md](supabase-verification-checklist.md)
and [security-notes.md](security-notes.md)). This document is deployment
*preparation* — it does not link any project or deploy anything. No commands
here have been run against production.

## Recommended host: Vercel

Nothing in this repo is currently configured for any host (no `vercel.json`,
`netlify.toml`, or CI deploy workflow). Vercel is recommended: this is a
Vite + React SPA with no server-side rendering or backend code (all backend
logic lives in Supabase), which is exactly Vercel's zero-config static-build
case, plus it gives free preview deployments per PR/branch and simple
per-environment env-var management (Production / Preview / Development).
Netlify or Cloudflare Pages would work equally well if preferred — the
settings below map directly.

## 1. Production environment variables

Set these in the hosting provider's dashboard (Vercel: Project Settings →
Environment Variables), **never committed to the repo**. `.env.example` is
the template; `.env.local` is git-ignored (`*.local`) and must stay that way.

| Variable | Production value | Notes |
|---|---|---|
| `VITE_DATA_MODE` | `supabase` | Required — production builds fail at startup with no default (see `src/lib/dataMode.ts`). |
| `VITE_SUPABASE_URL` | `https://<prod-ref>.supabase.co` | The **production** Supabase project, not the scratch one used for verification. |
| `VITE_SUPABASE_ANON_KEY` | prod anon/publishable key | Safe to expose to the browser — access is enforced by RLS, not by keeping this secret. |
| `VITE_SITE_URL` | `https://<production-domain>` | Must exactly match the domain (scheme, no trailing slash) — it's passed verbatim as `emailRedirectTo` for magic links. |
| `VITE_POSTHOG_KEY` | prod PostHog key, or leave unset | Optional. Unset disables analytics cleanly (see `src/lib/analytics.ts`); don't reuse a dev/test PostHog project. |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (or self-hosted) | Only relevant if `VITE_POSTHOG_KEY` is set. |
| `VITE_TURNSTILE_SITE_KEY` | leave unset | README flags this as only safe to enable once a server-side verification endpoint exists — none does yet. Setting the site key without that endpoint would show a captcha that verifies nothing. |

`SUPABASE_SERVICE_ROLE_KEY` and every other var in the "Phase 2 — NOT USED
YET" block of `.env.example` must **never** be set as a `VITE_*` var or
otherwise bundled into the client — anything prefixed `VITE_` ships to the
browser verbatim.

If Vercel preview deployments stay enabled for this project, either point
Preview env vars at a **separate, non-production** Supabase project (a second
scratch-like project, not the disposable one used for this verification pass)
or set Preview's `VITE_DATA_MODE=demo`. Otherwise every PR preview writes
real campaigns/questions/votes into the production database.

## 2. Production Supabase project checklist

1. Create the production Supabase project (separate from both the disposable
   `openvoice-scratch` project used for this verification pass and from
   `lmccutch's Project`, which appears to be a different pre-existing
   project — confirm which project is actually intended for production
   before proceeding).
2. `supabase link --project-ref <prod-ref>`, then apply migrations **in
   order** with `supabase db push` (dry-run first): `202607100001`,
   `202607110001`, `202607130001`, `202607130002`. All four are forward-only
   and have been applied and verified against the scratch project.
3. Apply the company-directory bootstrap deliberately — `supabase/config.toml`
   ships with `db.seed.enabled = false` on purpose. Regenerate with
   `npm run bootstrap:generate` to confirm it's current, then apply only that
   file via `db push --include-seed` with `sql_paths` scoped to it (see the
   migration's own header comment). Never apply
   `supabase/seed/202607100002_seed_fictional_companies.sql` — that is
   fictional local-dev seed data, not directory content.
4. **Authentication → URL Configuration**: Site URL =
   `https://<production-domain>`; Additional Redirect URLs includes that same
   origin. Do not leave it pointed at `localhost`.
5. **Configure a custom SMTP provider** (Authentication → Emails → SMTP
   Settings) before inviting real users. Confirmed live during this
   verification pass: Supabase's built-in/default email sender enforces a
   project-wide rate limit and returned `429 over_email_send_rate_limit`
   after a handful of magic-link requests in quick succession. That's fine
   for scratch-project testing but would silently break sign-in for real
   users under any real traffic.
6. Confirm RLS is enabled on every table (it is, per both migrations) and
   spot-check with the anon key that writes are rejected and reads are
   scoped correctly — the same pattern used in this verification pass
   (`scripts/verify-start-campaign-security.ts` and the ad hoc RLS checks in
   this conversation) is reusable against the production project.
7. Rotate/regenerate the anon key if it was ever pasted anywhere outside
   `.env.local` or the hosting provider's env-var UI during setup.
8. Decide on a Postgres backup/PITR policy appropriate to the paid tier in
   use — not configured by these migrations.

## 3. Vercel build settings

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` (runs `tsc -b && vite build`) |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 20.x or later — no `engines` field is currently pinned in `package.json`; Vite 8 requires a current Node LTS. Consider adding an `engines.node` field so local/CI Node drift is caught early. |

## 4. SPA route-rewrite configuration — required

`src/App.tsx` uses `react-router-dom`'s `BrowserRouter`, so routes like
`/company/AAPL` or `/discover` must be served `index.html` on direct load or
refresh, not a 404. Vercel's static build usually infers this for a Vite SPA,
but don't rely on inference — add an explicit `vercel.json` at the repo root
before the first deploy:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This wasn't added during this pass (out of scope for verification-only work)
but is a hard requirement before deploying — without it, every non-root URL
a user shares or refreshes (exactly what the Share menu on `CampaignPage`
generates) 404s.

## 5. Production authentication redirect URLs

- **Site URL**: `https://<production-domain>` (no trailing slash), set in
  both Supabase Auth settings and `VITE_SITE_URL`.
- **Additional Redirect URLs**: same origin, plus a wildcard only if there's
  a real reason for it (e.g. `https://<production-domain>/**`). Don't leave
  the scratch project's `http://localhost:5173` entries in the production
  project's allow-list.
- If Preview deployments are enabled and intentionally point at a
  non-production Supabase project (see §1), that project needs its own
  Site URL matching Vercel's preview URL pattern
  (`https://<project>-*.vercel.app`) — preview URLs are dynamic per deploy.

## 6. Production error handling

Current state, verified working during this pass:

- Missing/invalid `VITE_DATA_MODE` (or `supabase` mode missing its URL/key)
  renders a plain-language "Configuration error" screen (`src/main.tsx`)
  instead of a blank page or a stack trace — confirmed by design, not
  independently re-triggered live in this pass.
- Per-page data-load failures (`DiscoverPage`, `CampaignPage`,
  `DashboardPage`) render an `ErrorState` with a retry action rather than
  crashing; observed zero console errors and zero failed Supabase requests
  across the full 26-check browser walkthrough.

Gap worth addressing before or shortly after launch: there is no top-level
React error boundary around `<App />` in `main.tsx`. An uncaught render
error anywhere in the component tree (not a data-fetch error — those are
already handled) unmounts to a blank white page with no recovery UI. Adding
one is a small, low-risk change but is a judgment call left to you rather
than made unilaterally here, since it's hardening rather than something this
verification pass found broken.

## 7. robots.txt and sitemap — not present

Neither `public/robots.txt` nor a sitemap exists. For a public directory
site this is worth adding before launch (a minimal `robots.txt` allowing
crawl of the marketing/discovery pages, and a sitemap listing at least
`/`, `/discover`, and static company routes) but is an SEO/growth decision,
not a functional blocker — not added here.

## 8. Favicon and metadata — present, no action needed

`public/favicon.svg` exists and is linked in `index.html`. `index.html`
already has a real `<title>`, meta description, `theme-color`, and
Open Graph / Twitter card tags pointing at GroundFloor's actual copy (not
placeholder Vite boilerplate) — confirmed by inspection, nothing to fix.

## 9. Domain configuration

1. In Vercel: Project → Settings → Domains → add the production domain
   (apex and/or `www`, per preference) and follow Vercel's DNS instructions
   (an `A`/`ALIAS` record for the apex to Vercel's IP, or a `CNAME` for a
   subdomain).
2. Vercel provisions and renews the TLS certificate automatically once DNS
   verifies — no manual certificate steps.
3. Only after the domain resolves and serves the app: update
   `VITE_SITE_URL` and the Supabase Auth Site URL/redirect list to the final
   domain (§5), then redeploy so the env var takes effect (Vite inlines
   `VITE_*` vars at build time — changing them requires a rebuild, not just
   a config change).
4. Re-run the magic-link sign-in flow once against the production domain
   before announcing launch — the redirect-URL allow-list is a common first-
   deploy breakage point.

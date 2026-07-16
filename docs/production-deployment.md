# Production deployment

Status as of 2026-07-13: Phase 1 has passed browser acceptance against a live
scratch Supabase project (see [supabase-verification-checklist.md](supabase-verification-checklist.md)
and [security-notes.md](security-notes.md)). This document is deployment
*preparation* — it does not link any project or deploy anything. No commands
here have been run against production.

## Recommended host: Vercel

No CI deploy workflow exists yet, and the repo isn't linked to any host.
Vercel is recommended: this is a Vite + React SPA with no server-side
rendering or backend code (all backend logic lives in Supabase), which is
exactly Vercel's zero-config static-build case, plus it gives free preview
deployments per PR/branch and simple per-environment env-var management
(Production / Preview / Development). Netlify or Cloudflare Pages would work
equally well if preferred — the settings below map directly, though
`vercel.json`'s rewrite syntax (§4) would need translating to that host's
equivalent (`_redirects` for Netlify, for example).

## Exact production deployment sequence

1. Create or confirm a dedicated production Supabase project — distinct from
   both `openvoice-scratch` (this verification pass's disposable project) and
   `lmccutch's Project` (a separate pre-existing project of unconfirmed
   purpose). Do not proceed until it's clear which project is production.
2. Apply migrations in order: `202607100001`, `202607110001`, `202607130001`,
   `202607130002`, `202607140001`, `202607150001` (`supabase link --project-ref
   <prod-ref>`, then `supabase db push --dry-run` to confirm the plan, then
   `supabase db push`).
3. Apply the curated company bootstrap FIRST
   (`supabase/seed/20260715000001_company_directory_bootstrap.sql`), then the
   retail-popularity seed (`supabase/seed/20260715000002_retail_popularity.sql`)
   — the retail seed resolves companies by (ticker, exchange), so it must run
   after the bootstrap or its rows silently insert nothing.
   `db.seed.enabled` in `supabase/config.toml` stays `false` by default; scope
   `sql_paths` to those files when applying, and never apply
   `supabase/seed/202607100002_seed_fictional_companies.sql`.
4. Confirm engagement tables are empty before opening signups: `campaigns`,
   `campaign_supporters`, `campaign_followers`, `questions`, `question_votes`,
   `company_requests`, `profiles` should all be `0` rows — a fresh production
   project should have companies/securities/aliases only, nothing
   user-generated.
5. Configure custom SMTP (Authentication → Emails → SMTP Settings) — required
   before real signups; see §2 below for why.
6. Configure the production Site URL and redirect URLs, both in Supabase
   Auth settings and as `VITE_SITE_URL` (see §5 below).
7. Set all Vercel environment variables for the Production environment (see
   §1 below for the exact names).
8. Deploy a Vercel preview (push a branch / open a PR) and confirm it builds
   and the SPA rewrite in `vercel.json` serves nested routes correctly.
9. Run acceptance tests against that preview: at minimum, the 23-flow
   checklist in `supabase-verification-checklist.md`, real magic-link
   sign-in against the production Supabase project's SMTP, and a manual
   check of `/discover`, a `/company/:ticker` page, and a direct reload on
   each.
10. Promote the verified deployment to production (Vercel: promote the
    preview, or merge to the branch Vercel tracks for Production).
11. Run production smoke tests against the live domain: homepage loads,
    search works, a real magic-link sign-in completes end-to-end, and
    `robots.txt`/`sitemap.xml` resolve with the real domain substituted in
    (see §7 below — both ship with a placeholder domain that must be
    replaced first).
12. Merge `phase-1-company-directory` to `main` only after step 11 passes.
    Merging is a separate, explicit decision — nothing in this checklist
    merges automatically.

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

## 4. SPA route-rewrite configuration — done

`src/App.tsx` uses `react-router-dom`'s `BrowserRouter`, so every route
(`/discover`, `/company/:ticker`, `/companies`, `/companies/:slug`,
`/request-company`, and any future route — there is no separate
authentication-callback path, since sign-in is a modal and magic-link
completion lands on `/` via a URL fragment) must be served `index.html` on
direct load or refresh, not a 404.

`vercel.json` now exists at the repo root with the minimal correct
catch-all rewrite:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

A single catch-all is deliberate over per-route entries: it already covers
every route above plus any route added later (legal/informational pages,
etc.) without touching this file again, and unmatched paths still correctly
fall through to the client-side `NotFoundPage` (React Router's `*` route)
once `index.html` loads.

**Verified locally**, not yet on an actual Vercel deployment: `vite preview`
serves a production build the same way a static host does, and a headless
browser was driven directly to `/discover`, `/company/AAPL`, `/companies`,
`/request-company`, and an unknown path — all five returned HTTP 200 and
rendered the correct page client-side, with zero page errors. One caveat:
Vite's dev/preview servers have their own built-in SPA fallback (`appType:
'spa'`), so this only proves the React Router side works once `index.html`
is served — it does not prove Vercel's rewrite engine itself, which can only
be confirmed with an actual Vercel deploy (§ step 8 above).

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

- Missing/invalid `VITE_DATA_MODE` (or `supabase` mode missing its URL/key)
  renders a plain-language "Configuration error" screen (`src/main.tsx`)
  instead of a blank page or a stack trace.
- Per-page data-load failures (`DiscoverPage`, `CampaignPage`,
  `DashboardPage`) render an `ErrorState` with a retry action rather than
  crashing; observed zero console errors and zero failed Supabase requests
  across the full 26-check browser walkthrough in the prior verification
  pass.
- `src/components/ErrorBoundary.tsx` now wraps `<MvpProvider><App /></MvpProvider>`
  in `main.tsx`, catching any unexpected React render-phase error that isn't
  already one of the two cases above. The fallback (`role="alert"`, an `<h1>`
  so it's reachable as a landmark heading) shows a generic, credible message
  with no stack trace or error detail exposed to the user; the actual error
  is logged to the console only when `import.meta.env.DEV` is true. It offers
  a "Try again" button (a full `window.location.reload()`, not just resetting
  the boundary's local state — the crash may be caused by state living
  outside the boundary, which a local reset wouldn't clear) and a "Return
  home" link (a plain `<a href="/">`, not a router `Link`, so it still works
  even if the router itself is what crashed). No feedback/contact link is
  included — none exists anywhere else in the app either (see the browser
  acceptance pass's finding on item #18), so adding one only here would be
  inconsistent; add it repo-wide if/when a real contact path exists.
  Covered by `src/components/ErrorBoundary.test.tsx` (renders children
  normally; shows the fallback without leaking the thrown error's message;
  both controls are present, keyboard-reachable, and functional).

  This boundary intentionally does **not** catch normal API or form errors —
  React error boundaries only catch synchronous render-phase throws, never
  errors in event handlers, promises, or `fetch` calls, so the existing
  per-page `ErrorState`/inline form-error handling is untouched and still
  the first line of defense for anything data-related.

## 7. robots.txt and sitemap — decided and added

`public/robots.txt` and `public/sitemap.xml` now exist.

- **robots.txt**: allows crawling by default; specifically disallows the bare
  `/companies` route (the private "My companies" dashboard) while explicitly
  re-allowing `/companies/<slug>` (public campaign pages, which happen to
  share the same path prefix). There's no separate path to disallow for
  "authentication" — sign-in is a modal, not a route, and magic-link
  completion happens via a URL fragment on `/`, which crawlers never see.
- **sitemap.xml**: intentionally minimal — only `/` and `/discover`. The
  ~225 individual company/campaign pages are excluded on purpose: nearly all
  currently show the honest "no campaign has started" empty state, which is
  not meaningful indexable content, and listing them would misrepresent an
  empty directory as active campaigns. About, a standalone How It Works page,
  FAQ, Community Guidelines, and Transparency are **not** in the sitemap
  because none of those pages exist yet in this Phase 1 build (confirmed
  against `src/App.tsx`'s route list) — sitemap expansion for them is
  deferred until they're actually built, not represented here.
- Both files ship with the literal placeholder `REPLACE-WITH-PRODUCTION-DOMAIN`
  in place of a real domain, since it isn't known yet. This must be replaced
  with the real production domain as part of domain configuration (§9) —
  search both files for that exact string before or immediately after the
  first production deploy.

## 8. Favicon and metadata — present, no action needed

`public/favicon.svg` exists and is linked in `index.html`. `index.html`
already has a real `<title>`, meta description, `theme-color`, and
Open Graph / Twitter card tags pointing at Open Floor's actual copy (not
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

## 10. Trust-layer launch items (added 2026-07-14)

- Set `VITE_CONTACT_EMAIL` in the hosting env — the Contact page and legal
  documents fall back to a visible placeholder address until it is set.
- The Privacy Policy, Terms of Use, and Investment Disclaimer are drafts:
  professional legal review is required before commercial launch (each page
  carries this notice; see docs/trust-and-transparency.md for the full gap
  list, including the governing-law placeholder in the Terms).
- `sitemap.xml` now lists all trust routes — the
  REPLACE-WITH-PRODUCTION-DOMAIN placeholder still applies.
- Account deletion / data access requests arrive via the contact inbox and
  must be honored manually until automated flows exist.

## 11. Homepage positioning (added 2026-07-14)

No new production steps — the homepage rewrite changed only copy, structure,
and `index.html`'s baked-in title/description/OG tags (now reflecting "Where
shareholders decide what management answers next"). No new env vars, no
schema changes.

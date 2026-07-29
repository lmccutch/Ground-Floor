# Admin communications, email operations, attachments and system health

Prompt 5. Covers the administrator reply workflow, the email attempt/retry model,
bug-report attachments, and the `/admin/system` health console.

No secret values appear in this document. Secrets are referred to by name only.

---

## 1. The limitation to read first: there is no inbound email

Open Floor sends email. It does **not** receive it.

- The administrator can send a recorded reply from `/admin/bugs` and
  `/admin/support`. That reply is stored in `admin_replies`, sent through Resend,
  and its delivery state is tracked in `email_messages`.
- When the recipient replies, their message goes to the Workspace alias
  (`support@`, `bugs@`, `privacy@`, `contact@`). **It does not come back into the
  application.** There is no inbound-email provider, no ingestion pipeline, and no
  parsing of replies.

This is stated in the UI in three places — the reply composer, the email timeline
and the `/admin/system` email panel — so nobody mistakes the console for a shared
inbox. Building inbound ingestion is a separate piece of work requiring an inbound
provider (Resend inbound, Postmark, SES + SNS), a signed receiving endpoint,
thread correlation, and spam/loop protection. It was explicitly out of scope here.

---

## 2. Administrator reply workflow

### Flow

```
Admin console (ReplyForm)
  │  { mode: "reply", entity_type, entity_id, subject, body, client_token }
  │  NOTE: no recipient. There is no parameter for one, anywhere.
  ▼
send-transactional-email  (Edge Function)
  │  1. verifies the admin JWT via is_admin() against the database
  │  2. calls admin_create_reply() WITH THE ADMIN'S JWT
  ▼
admin_create_reply()  (SECURITY DEFINER, search_path='')
  │  • reads the recipient off bug_reports.reporter_email / support_tickets.email
  │  • sanitizes subject (no CR/LF) and body (control chars stripped)
  │  • rate-limits (20/hour per admin)
  │  • INSERT admin_replies  +  INSERT email_messages (status 'queued')
  │  • writes an audit entry with a MASKED recipient
  │  • returns the SANITIZED subject/body + the derived recipient
  ▼
send-transactional-email renders the fixed `admin_reply` template from those
returned values, HTML-escaping everything, and POSTs to Resend with the reply's
deterministic idempotency key.
  ▼
record_email_dispatch_result()  (service role)
  updates that one row to 'sent' or 'failed' through the monotonic transition
  graph, and writes the outcome audit entry.
  ▼
resend-webhook  →  record_email_event()  →  delivered / bounced / complained
```

### Why the recipient can never be injected

`admin_create_reply` has five parameters: `p_entity_type`, `p_entity_id`,
`p_subject`, `p_body`, `p_client_token`. There is no recipient parameter. The
address is read from the record inside the function. Passing an extra
`p_recipient_email` argument fails as an unknown function signature.

### Idempotency

The compose token is generated **once** when the composer opens and reused for
every attempt of that reply, including retries after an error.

- App key: `reply:<entity_type>:<entity_id>:<client_token>`, `UNIQUE` on both
  `admin_replies.idempotency_key` and `email_messages.idempotency_key`.
- Provider key: the same string is sent to Resend as `Idempotency-Key`.

A double-click, a refresh, or a network retry therefore resolves to the same
recorded reply and a single delivery. A repeat returns `duplicate` and nothing is
sent again. Composing a *new* reply generates a *new* token.

### From / Reply-To semantics

| Field | Value | Why |
|---|---|---|
| `From` | `EMAIL_SENDER` — `Open Floor <no-reply@open-floor.ca>` | The verified Resend sending identity. Only this domain is authenticated for DKIM/SPF. |
| `Reply-To` | the operational alias for the record | So a human reply reaches a mailbox a person reads. |

Alias mapping (enforced in `admin_create_reply`, resolved to an address in the
Edge Function so the mailbox is never chosen by the browser):

| Record | Alias | Secret |
|---|---|---|
| bug report | `bugs@open-floor.ca` | `EMAIL_REPLY_BUGS` |
| support ticket, category `privacy` | `privacy@open-floor.ca` | `EMAIL_REPLY_PRIVACY` |
| support ticket, category `technical_support` / `bug` / `company_management` | `support@open-floor.ca` | `EMAIL_REPLY_SUPPORT` |
| support ticket, all other categories | `contact@open-floor.ca` | `EMAIL_REPLY_CONTACT` |

Each falls back to the `@open-floor.ca` default above when its secret is unset.

### Content safety

- Subject: control characters (including CR and LF) replaced with spaces →
  header injection is impossible. 3–200 characters.
- Body: CRLF normalised, control characters stripped, runs of blank lines
  collapsed. 10–5000 characters.
- The email is rendered from a **fixed template**. Every value is HTML-escaped by
  `esc()`. Administrator-supplied HTML is never rendered as markup — it appears
  literally, and the composer says so.
- Internal notes (`admin_notes`) are never read by the reply path and never
  included in any email. In the UI they carry an explicit
  "Internal — never emailed" tag.
- Sending a reply **never** changes the bug or ticket status. Status changes go
  only through the transition-enforced update RPCs.

---

## 3. Email delivery states

Stored in `email_messages.status`.

| State | Meaning | Set by |
|---|---|---|
| `queued` | Recorded by us, not yet handed to the provider. | `admin_create_reply`, `admin_request_email_retry` |
| `sent` | Accepted by Resend. **Not** a delivery. | dispatch result, `email.sent` webhook |
| `delayed` | Provider reported a temporary delay. | `email.delivery_delayed` |
| `delivered` | Confirmed delivered to the recipient. | `email.delivered` |
| `bounced` | Rejected by the receiving server. | `email.bounced` |
| `complained` | Recipient marked it as spam. | `email.complained` |
| `failed` | Send failed, or the provider reported failure. | dispatch result, `email.failed` |
| `suppressed` | Provider-level suppression. | reserved |

### Out-of-order event handling

Resend does not guarantee event ordering. `public.email_next_status(current, event)`
(migration `202607280001`) is an explicit transition graph, not a naive rank:

- `bounced` / `complained` / `failed` / `suppressed` are **sticky terminals** — no
  later event changes them.
- A complaint always wins from anywhere on the positive path (it legitimately
  follows delivery).
- A bounce or failure sets an adverse terminal **except** over a confirmed
  `delivered` — a confirmed inbox delivery is authoritative, so a late bounce is
  ignored.
- Otherwise advance-only by rank: `queued < sent < delayed < delivered`. A late
  earlier-stage event never regresses a later one.

Milestone timestamps use `coalesce` (first one wins) and are stamped only when the
event is actually adopted, so a rejected late event never leaves a contradictory
`*_at` behind.

`record_email_dispatch_result` routes through the same graph, so a slow dispatch
response cannot regress a state the webhook already advanced.

Proven live by `npm run verify:email-progression`.

---

## 4. Retry eligibility

One source of truth: `public.email_retry_ineligible_reason(message_id)`. It
returns `NULL` when a message may be retried, otherwise the operator-facing
reason. Both the retry RPC (enforcement) and `admin_email_history` (which drives
the button) call it, so the UI can never offer an action the server will refuse.

**Eligible**

- `failed` — the provider rejected the send or never accepted it.
- `bounced` — **only** when the recorded error reads as temporary: mailbox full,
  over quota, deferred, throttled, greylisted, timeout, temporarily unavailable.
- `delayed` — only after 6 hours (`THRESHOLDS.emailDelayedRetryHours`).

**Never eligible**

- `delivered` — resending duplicates it.
- `complained` — the recipient reported us as spam. Resending is abuse.
- `suppressed` — provider-level suppression.
- `queued` / `sent` — still in flight.
- Permanent bounces: invalid / unknown / no such user / does not exist / blocked /
  rejected / suppressed / spam / abuse / unsubscribed.
- Messages with no connected operational record (`entity_id IS NULL`).
- Messages older than 30 days.
- A message that already has a newer attempt — retry the newest, not an old one.

### What a retry does

1. Creates a **new** `email_messages` row: `attempt_number = original + 1`,
   `retry_of_message_id = original.id`, `sending_actor = the admin`.
2. **Never modifies the original row.** Its provider message id, error text and
   timestamps are preserved permanently as evidence.
3. New idempotency key `retry:<original_id>:<client_token>`, unique, and also sent
   to Resend as its `Idempotency-Key`.
4. Rate-limited to 10 per hour per administrator.
5. Requires an explicit in-UI confirmation; the button is disabled while in flight.
6. Audited as `email_retry_requested`, then `email_retry_sent` or
   `email_retry_failed`.

Only administrator replies can be retried. System templates (confirmations,
alerts) are not archived verbatim, so re-rendering one could silently send
different content — the function refuses and says to compose a new reply instead.

**A retry request is never evidence of delivery.** The UI says this on the
confirmation.

---

## 5. Resend webhook behaviour

- Deployed with `verify_jwt = false` — Resend cannot present a Supabase JWT.
  Security is the **Svix signature**, verified against the **raw request body**,
  byte for byte, before any parsing. Re-serialising would change the bytes and
  break the HMAC.
- Timestamp tolerance: 300 seconds. Stale deliveries are rejected.
- Verified events are applied via `record_email_event` and logged to
  `email_event_log`, deduplicated by the Svix message id, so replays are recorded
  once.
- The event log stores **only**: provider event id, provider message id, event
  type, occurred-at, received-at, processing result. No bodies, recipients,
  headers or signing material.
- Rejected (unsigned/invalid) deliveries increment an hourly counter. Past five in
  an hour, **one** deduplicated `webhook_failed` notification is raised. No
  per-request row is written, so the endpoint cannot be used to exhaust storage.

Required secret: `RESEND_WEBHOOK_SECRET` (`whsec_…`).

---

## 6. Attachments

### Limits

| Limit | Value | Enforced at |
|---|---|---|
| Files per report | 3 | browser, Edge Function, DB trigger |
| Per file | 5 MB | browser, Edge Function, DB `CHECK`, bucket `file_size_limit` |
| Per submission | 10 MB | browser, Edge Function, DB trigger |
| Types | PNG, JPEG, WebP, PDF | browser, Edge Function (magic bytes), DB `CHECK`, bucket `allowed_mime_types` |

### Storage model

- Private bucket `bug-attachments` (`public = false`). There is no public URL.
- **No storage RLS policy exists for `anon` or `authenticated`.** That is
  deliberate: every read and write goes through an Edge Function using the
  service role, which is the only place MIME sniffing, size limits and admin
  authorization can actually be enforced. With no policy, Storage denies browser
  access by default.
- Object keys are server-generated: `<bug_id>/<uuid>.<ext>`. The uploader's
  filename is **never** used as a path; it is sanitized (directory components,
  control characters and leading dots removed, 120 chars) and stored separately in
  `bug_attachments.original_filename` for display only.
- `record_bug_attachment` independently refuses any path outside the report's own
  prefix — this is what prevents one record pointing at another's object.
- If a store fails after the report exists, every object written for that
  submission is deleted and an `attachment_failed` notification is raised. The
  report is kept, and the reporter is told plainly that the file did not save.

### Type validation

The browser's `Content-Type` is **not** trusted. `submit-intake` decodes the
bytes and checks the file signature:

| Type | Magic bytes |
|---|---|
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| JPEG | `FF D8 FF` |
| WebP | `RIFF….WEBP` |
| PDF | `%PDF-` |

Anything else is rejected — including SVG and HTML, which are script-bearing and
would be an XSS vector in the admin console even from private storage. A declared
type that disagrees with the sniffed type is also rejected.

### Admin viewing

`admin-attachment-url` mints a **60-second** signed URL, after two independent
checks: the function verifies `is_admin()`, then `admin_resolve_attachment`
(itself `is_admin()`-guarded, rate-limited to 60/hour, and audited) resolves the
id to its object path. A non-admin cannot obtain a path to sign.

- Images are previewed inline — the type allowlist means they cannot carry script.
- **PDFs are never embedded.** An untrusted PDF in an `<iframe>` or `<embed>` runs
  in the admin's origin context; it opens in a new tab (`noopener,noreferrer`) so
  the browser's own sandboxed viewer handles it.
- Every view and download writes an audit entry.

### Malware scanning: NOT INTEGRATED

**No file is scanned for viruses or malware.** No scanner is integrated and none
is claimed anywhere in the UI. The compensating controls are the narrow type
allowlist verified from file contents, small size caps, private storage,
short-lived signed URLs, and never rendering a PDF inline. The public form warns
against uploading passwords, account numbers or identity documents, and the admin
attachment panel repeats that files are unscanned.

If scanning becomes necessary, the natural insertion point is between the upload
and `record_bug_attachment` in `submit-intake` — quarantine the object, scan, then
record or delete.

Turnstile, the honeypot and both rate limiters run **before** any file is
touched, so attachment handling adds no unauthenticated processing surface.

---

## 7. System health

`/admin/system`. All thresholds live in one place: `src/lib/systemHealth.ts`.

### Status definitions

| Status | Meaning |
|---|---|
| **Healthy** | Verified from current data. |
| **Warning** | Degraded, or the evidence is stale. |
| **Critical** | A known broken condition. |
| **Unknown** | Cannot be verified. **This is not a pass.** |

`worst()` ranks `healthy < unknown < warning < critical`, so a section containing
an unverifiable check is never reported as fully healthy. There is no code path
that converts Unknown into Healthy, and `src/lib/systemHealth.test.ts` asserts it.

Cases that are deliberately **Unknown rather than Healthy**:

- No email has ever been sent → delivery is unproven.
- Messages sent but no delivery ever confirmed.
- The diagnostics function is unreachable → configuration state unknown.
- An Edge Function gateway probe errored → deployment unknown.
- The database records no migration history → drift cannot be checked.
- The `bug-attachments` bucket does not exist, or the storage catalogue is
  unreadable.
- Turnstile fail-closed behaviour of the deployed function.
- Turnstile rejection counts (they occur before any row exists — reported as *not
  tracked*, never as zero).

### Where each fact comes from

| Section | Source |
|---|---|
| Application | Build-time `import.meta.env` (`VITE_APP_COMMIT`, `VITE_SITE_URL`, `MODE`). |
| Database | `admin_get_system_health()` + `admin_applied_migrations()`. |
| Migration drift | `EXPECTED_MIGRATIONS` (source) vs `schema_migrations` (database). |
| Edge functions | `admin-system-diagnostics` probes each function's gateway URL. A 404 means not deployed; source files on disk prove nothing and are not used. |
| Email | `admin_get_email_health()` + `admin-system-diagnostics` for secret presence. |
| Turnstile | `VITE_TURNSTILE_SITE_KEY` (build) + `TURNSTILE_SECRET_KEY` presence. |
| Public intake | `admin_get_intake_health()`. |
| Admin operations | `admin_get_system_health()`, sharing `admin_work_queue()` with `/admin/queue`. |
| Storage | `storage.buckets` read inside the health RPC. |

Each section fetches independently and renders its own error state, so one failed
check degrades to Unknown instead of blanking the page.

### Configuration reporting

`admin-system-diagnostics` returns only `configured` / `missing` / `invalid_format`
per secret. It reads the value, tests its shape, and discards it. **No value, no
prefix, no length and no hash is ever returned or logged.**

Format checks: `RESEND_API_KEY` starts `re_`; `RESEND_WEBHOOK_SECRET` starts
`whsec_`; `INTAKE_FUNCTION_SECRET` is at least 16 characters; reply aliases must be
valid addresses ending `@open-floor.ca` (this is what catches a leftover
placeholder domain); `EMAIL_SENDER` must be a valid address or `Name <address>`.

Supabase Edge Function secrets are project-wide, so one function truthfully
reports the presence of all of them.

### Warning acknowledgement

An acknowledgement (`admin_acknowledge_system_warning`) records the operator's
decision and writes an audit entry. It **never** suppresses the check — the
warning is still returned, flagged as acknowledged, and the acknowledgement lapses
after 24 hours.

---

## 8. Required secrets, by name

Supabase Edge Function secrets:

| Name | Required | Without it |
|---|---|---|
| `RESEND_API_KEY` | yes | No email can be sent; attempts are recorded as `failed`. |
| `RESEND_WEBHOOK_SECRET` | yes | Delivery events are rejected; every message stays at `sent`. |
| `TURNSTILE_SECRET_KEY` | yes | Intake **fails closed** — every public submission is rejected. |
| `INTAKE_FUNCTION_SECRET` | yes | Submitter confirmations and admin alerts are never sent. |
| `ADMIN_ALERT_EMAIL` | optional | No email alert on new submissions (in-app notifications still work). |
| `EMAIL_SENDER` | optional | Falls back to `Open Floor <no-reply@open-floor.ca>`. |
| `EMAIL_REPLY_SUPPORT` / `_BUGS` / `_PRIVACY` / `_CONTACT` | optional | Fall back to the matching `@open-floor.ca` alias. |
| `ALLOWED_ORIGIN` | optional | Defaults to `*`. Set to the production origin to tighten CORS. |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
by Supabase.

Vercel build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_SITE_URL`, `VITE_CONTACT_EMAIL`, `VITE_TURNSTILE_SITE_KEY`,
`VITE_APP_COMMIT`.

### Google Workspace alias usage

`support@`, `bugs@`, `privacy@` and `contact@open-floor.ca` are Workspace aliases
read by a human. They are used as `Reply-To` only — Resend sends from
`no-reply@open-floor.ca`, the DKIM/SPF-verified identity. Mail arriving at an
alias stays in Workspace; see §1.

---

## 9. Recovery procedures

### A transactional email failed

1. Open `/admin/system` → Email. Check `RESEND_API_KEY` status and the failure
   counts.
2. Open the affected bug or ticket. The email history shows each attempt, its
   sanitized failure reason and its provider message id (copyable — paste it into
   the Resend dashboard for the provider's own record).
3. If the timeline offers **Retry this message**, the server has already confirmed
   eligibility. Confirm it. A new linked attempt is created; the original is kept.
4. If retry is blocked, the reason says why. A permanent bounce means the address
   is wrong — do not retry; contact the person another way.
5. If `RESEND_API_KEY` shows `missing` or `invalid_format`, set it
   (`supabase secrets set RESEND_API_KEY=…`), redeploy
   `send-transactional-email`, then retry.

### The webhook stopped delivering events

Symptom: `/admin/system` → Email shows **Delivery webhook: Critical** — mail sent
recently but no event received.

1. Check `RESEND_WEBHOOK_SECRET` shows `configured` with the `whsec_` prefix.
2. In the Resend dashboard, confirm the endpoint URL is
   `https://<project-ref>.supabase.co/functions/v1/resend-webhook` and that
   `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`,
   `email.complained` and `email.failed` are subscribed.
3. Look for a `webhook_failed` notification in `/admin/notifications` — that means
   signatures are being rejected, which almost always means a rotated secret.
4. If the secret was rotated, set it again and redeploy `resend-webhook`.
5. Resend can replay recent events. Because the event log deduplicates on the Svix
   id and `record_email_event` is monotonic, replaying is safe.

Messages stuck at `sent` while the webhook was broken are not lost — they simply
have no confirmation. They are **not** retryable (still in flight), which is
correct: they were very likely delivered.

### Migration drift

`/admin/system` → Database shows **Critical** and names the missing versions.
Apply them to the environment that is behind (see §10) and reload.

If the database is *ahead* (Warning), the deployed frontend is older than the
database — redeploy the frontend.

---

## 10. Production deployment checklist

Nothing below is automated. Each step is run by the owner.

**Scratch first**

1. `supabase link --project-ref <scratch-ref>`
2. `supabase db push` — applies `202607280002`, `202607280003`, `202607280004`.
3. `supabase functions deploy submit-intake send-transactional-email resend-webhook admin-attachment-url admin-system-diagnostics`
4. Set the scratch secrets by name (§8).
5. Verify:
   ```
   SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:admin-communications
   SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:email-progression
   SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:intake-security
   SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npm run verify:transition-security
   ```
   All must pass before production is touched.

**Production, after approval**

6. `supabase link --project-ref <prod-ref>` then `supabase db push`.
7. Confirm the bucket: Storage → `bug-attachments` exists and **Public is OFF**.
   The migration creates it private; verify visually, because a public bucket is a
   Critical finding on `/admin/system`.
8. Deploy the same five Edge Functions.
9. Set any new secret by name — `EMAIL_REPLY_CONTACT` is the only addition, and it
   falls back to `contact@open-floor.ca` if omitted.
10. Set `VITE_APP_COMMIT` in the Vercel project so `/admin/system` can name the
    running build.
11. Deploy the Vercel **Preview** and run the browser acceptance tests below.
12. Merge only after approval.
13. Production smoke test.

**Browser acceptance tests (preview, then production)**

- `/report-bug` submits without an attachment.
- `/report-bug` submits with a PNG; the admin drawer previews it; the signed URL
  expires after ~60s.
- `/report-bug` rejects an SVG and a 6 MB file with a specific message.
- `/contact` still submits.
- An invalid Turnstile token is still rejected.
- Open a bug and a ticket: the drawer shows the full record, attachments, email
  history and audit history.
- Send a reply to an address you control. Confirm: it arrives; `From` is
  `no-reply@open-floor.ca`; `Reply-To` is the right alias; the timeline moves
  `queued → sent → delivered`.
- Press Send twice quickly — exactly one email arrives.
- Confirm the delivered message offers **no** retry.
- `/admin/system` — every section renders; nothing unverifiable shows green.
- `/admin/audit-log` — `admin_reply_created` and `admin_reply_sent` are present.

**Rollback**

The migrations are additive: new tables, new nullable columns, new functions. No
existing function signature changed and nothing was dropped. To disable the new
features without a schema rollback, redeploy the previous frontend build — the new
tables simply stop being read. `record_email_attempt` and `record_email_event` are
untouched, so the Prompt 4 email path keeps working either way.

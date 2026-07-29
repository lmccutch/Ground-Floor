// Public intake orchestrator (Supabase Edge Function, Deno) — Prompt 4.
//
// The single public entry point for the /report-bug and /contact forms. It is the
// layer that enforces the controls a browser cannot be trusted with — honeypot,
// Cloudflare Turnstile verification, and per-IP rate limiting — then delegates the
// actual record creation to the SECURITY DEFINER submission RPCs (which run their
// own validation + per-user/email rate limiting + idempotency). On success it makes
// a best-effort call to send-transactional-email for the submitter confirmation and
// the admin alert; email failure never affects the submission result.
//
// Deploy with verify_jwt = false (anonymous visitors must reach it). Authenticated
// callers' JWT is forwarded to the RPC so auth.uid() attributes the record
// server-side; a client-supplied user id is never trusted.
//
// Client contract:
//   POST { kind: "bug"|"support", payload: {...}, turnstileToken?, website?, idempotencyKey?,
//          attachments?: [{ filename, contentType, dataBase64 }] }
//     ("website" is the honeypot; real users leave it empty)
//   200 -> { ok: true, reference?, ticket_number?, attachments_stored?, attachments_failed? }
//   400 -> { error: "invalid_request" }
//   413 -> { error: "attachment_too_large" }
//   415 -> { error: "attachment_type_rejected" }
//   429 -> { error: "rate_limited" }
//
// ATTACHMENTS (Prompt 5, bug reports only)
//   Files arrive base64-encoded and are validated HERE, server-side, before the
//   submission is accepted: count (3), per-file size (5 MB), total size (10 MB),
//   and — crucially — the actual MAGIC BYTES of the decoded content. The browser's
//   Content-Type is never trusted. Only PNG/JPEG/WebP/PDF are accepted; SVG, HTML,
//   scripts, archives and executables are rejected outright.
//   Objects are written to the PRIVATE 'bug-attachments' bucket under a
//   server-generated key (<bug_id>/<uuid>.<ext>) using the service role, so the
//   uploader's filename is never used as a path. If a store fails after the report
//   was created, the objects already written for that submission are deleted and
//   an admin notification is raised — the report itself is still kept.
//   Turnstile, the honeypot and both rate limiters run BEFORE any file is touched.
//   Files are NOT malware-scanned; see docs/admin-communications.md.
//
// Secrets: TURNSTILE_SECRET_KEY (REQUIRED in production — if unavailable the function
// fails CLOSED and rejects every submission rather than skipping verification).
// Optional: INTAKE_FUNCTION_SECRET (to call the email function),
// ADMIN_ALERT_EMAIL, ALLOWED_ORIGIN. SUPABASE_URL / SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY are injected.

// deno-lint-ignore-file no-explicit-any
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
const INTAKE_SECRET = Deno.env.get("INTAKE_FUNCTION_SECRET") ?? "";
const ADMIN_ALERT_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") ?? "";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function rateLimited(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_login_rate_limit`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_key: `intake:ip:${ip}`, p_max: 12, p_window_seconds: 3600 }),
    });
    if (!res.ok) return false; // fail-open: never block a legitimate submitter on a limiter glitch
    return (await res.json()) === false;
  } catch {
    return false;
  }
}

async function turnstileOk(token: string, ip: string): Promise<boolean> {
  // Fail CLOSED: if the secret is unavailable we cannot verify the token, so we must
  // reject rather than silently accept unverified submissions. (Turnstile is now a
  // required production control; the honeypot + per-IP rate limit remain in addition.)
  if (!TURNSTILE_SECRET) return false;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

async function callRpc(fn: string, body: unknown, userToken: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${userToken || ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

/* ------------------------------- attachments ------------------------------- */

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;   // 5 MB per file
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB per submission
const BUCKET = "bug-attachments";

type IncomingFile = { filename?: unknown; contentType?: unknown; dataBase64?: unknown };
type ValidFile = { bytes: Uint8Array; mime: string; ext: string; filename: string };

// Content sniffing. The declared Content-Type is advisory only — the decoded
// bytes decide, so a .png that is really an HTML document is rejected.
function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  const at = (i: number) => b[i];
  if (b.length >= 8 && at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 &&
      at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a) return { mime: "image/png", ext: "png" };
  if (b.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  // RIFF....WEBP
  if (b.length >= 12 && at(0) === 0x52 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x46 &&
      at(8) === 0x57 && at(9) === 0x45 && at(10) === 0x42 && at(11) === 0x50) return { mime: "image/webp", ext: "webp" };
  if (b.length >= 5 && at(0) === 0x25 && at(1) === 0x50 && at(2) === 0x44 && at(3) === 0x46 && at(4) === 0x2d)
    return { mime: "application/pdf", ext: "pdf" };
  return null; // includes SVG/HTML/JS/archives/executables — all rejected
}

// Display name only. Strips directory components, control characters and leading
// dots. Never used to address the stored object.
function safeName(raw: unknown, ext: string): string {
  // deno-lint-ignore no-control-regex
  const base = String(raw ?? "").replace(/.*[/\\]/, "").replace(/[\x00-\x1F\x7F]/g, "").replace(/^[.\s]+/, "").trim();
  return (base || `attachment.${ext}`).slice(0, 120);
}

function decodeBase64(value: unknown): Uint8Array | null {
  try {
    const raw = String(value ?? "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
    if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
    const bin = atob(raw);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Validates every file up front. Returns an error code on the first rejection so
 *  nothing is stored — and no record is created — for an invalid submission. */
function validateAttachments(input: unknown): { files: ValidFile[] } | { error: string } {
  if (input == null) return { files: [] };
  if (!Array.isArray(input)) return { error: "invalid_request" };
  if (input.length === 0) return { files: [] };
  if (input.length > MAX_FILES) return { error: "attachment_type_rejected" };

  const files: ValidFile[] = [];
  let total = 0;
  for (const raw of input as IncomingFile[]) {
    const bytes = decodeBase64(raw?.dataBase64);
    if (!bytes || bytes.length === 0) return { error: "invalid_request" };
    if (bytes.length > MAX_FILE_BYTES) return { error: "attachment_too_large" };
    total += bytes.length;
    if (total > MAX_TOTAL_BYTES) return { error: "attachment_too_large" };
    const sniffed = sniff(bytes);
    if (!sniffed) return { error: "attachment_type_rejected" };
    // The declared type, when present, must agree with the real content.
    const declared = String(raw?.contentType ?? "").toLowerCase().split(";")[0].trim();
    if (declared && declared !== sniffed.mime) return { error: "attachment_type_rejected" };
    files.push({ bytes, mime: sniffed.mime, ext: sniffed.ext, filename: safeName(raw?.filename, sniffed.ext) });
  }
  return { files };
}

async function storeObject(path: string, bytes: Uint8Array, mime: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": mime, "x-upsert": "false" },
      body: bytes,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  }).catch(() => {});
}

async function serviceRpc(fn: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

/** Stores validated files for a created bug report. All-or-nothing per submission:
 *  if any file fails, everything stored for this submission is removed again and
 *  the administrator is notified, so a half-attached report is never left behind. */
async function storeAttachments(bugId: string, files: ValidFile[]): Promise<{ stored: number; failed: boolean }> {
  const written: string[] = [];
  for (const f of files) {
    const path = `${bugId}/${crypto.randomUUID()}.${f.ext}`;
    if (!(await storeObject(path, f.bytes, f.mime))) {
      await removeObjects(written);
      await serviceRpc("record_attachment_failure", { p_bug_report_id: bugId, p_detail: "object storage write failed" });
      return { stored: 0, failed: true };
    }
    written.push(path);
    const res = await serviceRpc("record_bug_attachment", {
      p_bug_report_id: bugId,
      p_object_path: path,
      p_original_filename: f.filename,
      p_mime_type: f.mime,
      p_size_bytes: f.bytes.length,
    });
    if (!res || !res.ok) {
      await removeObjects(written);
      await serviceRpc("record_attachment_failure", { p_bug_report_id: bugId, p_detail: "attachment record rejected" });
      return { stored: 0, failed: true };
    }
  }
  return { stored: written.length, failed: false };
}

// Fire-and-forget email; never affects the submission result.
function sendEmail(template: string, to: string, entityType: string, entityId: string | null, data: Record<string, unknown>): void {
  if (!INTAKE_SECRET || !to) return;
  fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, "x-intake-secret": INTAKE_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ template, to, entity_type: entityType, entity_id: entityId, data }),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const auth = req.headers.get("Authorization") ?? "";
  const userToken = auth.startsWith("Bearer ") && auth.slice(7) !== ANON_KEY ? auth.slice(7) : "";

  let kind = "", payload: any = {}, turnstileToken = "", honeypot = "", idempotencyKey = "", rawAttachments: unknown = null;
  try {
    const body = (await req.json()) as any;
    kind = String(body?.kind ?? "");
    payload = body?.payload ?? {};
    turnstileToken = String(body?.turnstileToken ?? "");
    honeypot = String(body?.website ?? "");
    idempotencyKey = String(body?.idempotencyKey ?? "");
    rawAttachments = body?.attachments ?? null;
  } catch {
    return json(400, { error: "invalid_request" });
  }

  // Honeypot: a filled hidden field means a bot. Respond as success without doing
  // anything, so the bot gets no signal.
  if (honeypot.trim() !== "") return json(200, { ok: true });

  if (kind !== "bug" && kind !== "support") return json(400, { error: "invalid_request" });
  // Attachments are a bug-report-only feature; silently accepting them elsewhere
  // would be a quiet data-loss surprise, so reject explicitly.
  if (kind !== "bug" && Array.isArray(rawAttachments) && rawAttachments.length > 0) {
    return json(400, { error: "invalid_request" });
  }
  if (await rateLimited(ip)) return json(429, { error: "rate_limited" });
  if (!(await turnstileOk(turnstileToken, ip))) return json(400, { error: "captcha_failed" });

  // Validate files BEFORE creating any record, so an invalid attachment never
  // leaves a partial submission behind. Turnstile and both rate limiters have
  // already run, so this cannot be used as an unauthenticated decode oracle.
  const attachmentCheck = kind === "bug" ? validateAttachments(rawAttachments) : { files: [] as ValidFile[] };
  if ("error" in attachmentCheck) {
    const code = attachmentCheck.error;
    return json(code === "attachment_too_large" ? 413 : code === "attachment_type_rejected" ? 415 : 400, { error: code });
  }

  if (kind === "bug") {
    const r = await callRpc("submit_bug_report", {
      p_description: payload.description ?? null,
      p_steps_to_reproduce: payload.steps ?? null,
      p_expected_result: payload.expected ?? null,
      p_actual_result: payload.actual ?? null,
      p_reporter_email: payload.email ?? null,
      p_page_url: payload.pageUrl ?? null,
      p_browser: payload.browser ?? null,
      p_operating_system: payload.os ?? null,
      p_device_type: payload.deviceType ?? null,
      p_screen_size: payload.screenSize ?? null,
      p_app_version: payload.appVersion ?? null,
      p_idempotency_key: idempotencyKey || null,
    }, userToken);
    if (r.status !== 200) return json(400, { error: "invalid_request" });
    const reference = r.data?.reference ?? null;
    const id = r.data?.id ?? null;

    // Store files only for a genuinely new report: a deduplicated resubmission
    // must not attach the same screenshots twice.
    let stored = 0, attachmentsFailed = false;
    if (id && !r.data?.duplicate && attachmentCheck.files.length > 0) {
      const outcome = await storeAttachments(String(id), attachmentCheck.files);
      stored = outcome.stored;
      attachmentsFailed = outcome.failed;
    }

    if (!r.data?.duplicate) {
      if (payload.email) sendEmail("bug_report_received", String(payload.email), "bug_report", id, { reference });
      if (ADMIN_ALERT_EMAIL) sendEmail("admin_new_bug_alert", ADMIN_ALERT_EMAIL, "bug_report", id, { reference, summary: String(payload.description ?? "").slice(0, 140) });
    }
    // The report is kept even when a file could not be stored — the reporter's
    // words matter more than the screenshot — but the failure is reported back
    // honestly and raised to the administrator.
    return json(200, { ok: true, reference, attachments_stored: stored, attachments_failed: attachmentsFailed });
  }

  // support
  const r = await callRpc("submit_support_ticket", {
    p_category: payload.category ?? null,
    p_message: payload.message ?? null,
    p_subject: payload.subject ?? null,
    p_name: payload.name ?? null,
    p_email: payload.email ?? null,
    p_idempotency_key: idempotencyKey || null,
  }, userToken);
  if (r.status !== 200) return json(400, { error: "invalid_request" });
  const ticketNumber = r.data?.ticket_number ?? null;
  const id = r.data?.id ?? null;
  if (!r.data?.duplicate) {
    if (payload.email) sendEmail("support_ticket_received", String(payload.email), "support_ticket", id, { ticket_number: ticketNumber });
    if (ADMIN_ALERT_EMAIL) sendEmail("admin_new_support_alert", ADMIN_ALERT_EMAIL, "support_ticket", id, { ticket_number: ticketNumber, category: String(payload.category ?? "") });
  }
  return json(200, { ok: true, ticket_number: ticketNumber });
});

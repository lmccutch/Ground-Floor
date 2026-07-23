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
//   POST { kind: "bug"|"support", payload: {...}, turnstileToken?, website?, idempotencyKey? }
//     ("website" is the honeypot; real users leave it empty)
//   200 -> { ok: true, reference?, ticket_number? }
//   400 -> { error: "invalid_request" }
//   429 -> { error: "rate_limited" }
//
// Optional secrets: TURNSTILE_SECRET_KEY (if unset, CAPTCHA is skipped with a log —
// set it to enforce), INTAKE_FUNCTION_SECRET (to call the email function),
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
  if (!TURNSTILE_SECRET) return true; // not configured yet — honeypot + rate limit still apply
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

  let kind = "", payload: any = {}, turnstileToken = "", honeypot = "", idempotencyKey = "";
  try {
    const body = (await req.json()) as any;
    kind = String(body?.kind ?? "");
    payload = body?.payload ?? {};
    turnstileToken = String(body?.turnstileToken ?? "");
    honeypot = String(body?.website ?? "");
    idempotencyKey = String(body?.idempotencyKey ?? "");
  } catch {
    return json(400, { error: "invalid_request" });
  }

  // Honeypot: a filled hidden field means a bot. Respond as success without doing
  // anything, so the bot gets no signal.
  if (honeypot.trim() !== "") return json(200, { ok: true });

  if (kind !== "bug" && kind !== "support") return json(400, { error: "invalid_request" });
  if (await rateLimited(ip)) return json(429, { error: "rate_limited" });
  if (!(await turnstileOk(turnstileToken, ip))) return json(400, { error: "captcha_failed" });

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
    if (!r.data?.duplicate) {
      if (payload.email) sendEmail("bug_report_received", String(payload.email), "bug_report", id, { reference });
      if (ADMIN_ALERT_EMAIL) sendEmail("admin_new_bug_alert", ADMIN_ALERT_EMAIL, "bug_report", id, { reference, summary: String(payload.description ?? "").slice(0, 140) });
    }
    return json(200, { ok: true, reference });
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

// Transactional email sender (Supabase Edge Function, Deno) — Prompt 4.
//
// The ONLY server path that talks to Resend. It never exposes the Resend key, never
// accepts arbitrary recipients+HTML from the browser, and only renders from a fixed
// template allowlist with typed payloads. Every attempt is recorded in
// email_messages (via record_email_attempt, service role) so delivery state is
// auditable and admin-visible.
//
// Callers (one of):
//   * The sole admin: send a signed-in request with the user's JWT in Authorization;
//     the function verifies is_admin() server-side.
//   * Internal (submit-intake): send header `x-intake-secret: <INTAKE_FUNCTION_SECRET>`.
//
// Client contract:
//   POST { template, to, entity_type?, entity_id?, data? }
//   200 -> { status: "sent" | "duplicate", id? }
//   400 -> { error: "invalid_request" }        (bad template/recipient/payload)
//   401 -> { error: "unauthorized" }
//   503 -> { error: "email_not_configured" }   (RESEND_API_KEY not set — recorded as failed)
//
// Required secrets: RESEND_API_KEY. Optional: EMAIL_SENDER, INTAKE_FUNCTION_SECRET,
// EMAIL_REPLY_SUPPORT, EMAIL_REPLY_BUGS, EMAIL_REPLY_PRIVACY, ALLOWED_ORIGIN.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected.

// deno-lint-ignore-file no-explicit-any
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SENDER = Deno.env.get("EMAIL_SENDER") ?? "Open Floor <no-reply@open-floor.ca>";
const INTAKE_SECRET = Deno.env.get("INTAKE_FUNCTION_SECRET") ?? "";
const REPLY_SUPPORT = Deno.env.get("EMAIL_REPLY_SUPPORT") ?? "support@open-floor.ca";
const REPLY_BUGS = Deno.env.get("EMAIL_REPLY_BUGS") ?? "bugs@open-floor.ca";
const REPLY_PRIVACY = Deno.env.get("EMAIL_REPLY_PRIVACY") ?? "privacy@open-floor.ca";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-intake-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/* ------------------------------ template registry -------------------------- */
// Each template maps a TYPED payload to a subject + plain lines + reply-to. HTML is
// generated here from escaped values only — never accepted from the caller.

type Built = { subject: string; heading: string; lines: string[]; replyTo: string };
type Tmpl = (d: any) => Built;

const SIGNOFF = "— Open Floor";
const REGISTRY: Record<string, Tmpl> = {
  bug_report_received: (d) => ({
    subject: `[Open Floor ${d.reference ?? "BUG"}] Bug report received`,
    heading: "Thanks for reporting this",
    lines: [
      `We've received your bug report (${d.reference ?? "reference on file"}) and logged it for review.`,
      "We read every report. We can't promise a timeline, but this helps us make Open Floor better.",
      "You don't need to resubmit — we have it.",
    ],
    replyTo: REPLY_BUGS,
  }),
  support_ticket_received: (d) => ({
    subject: `[Open Floor ${d.ticket_number ?? "ticket"}] We received your message`,
    heading: "We've received your message",
    lines: [
      `Your reference is ${d.ticket_number ?? "on file"}.`,
      "A person will read this and reply by email. Please don't resubmit the same request.",
    ],
    replyTo: REPLY_SUPPORT,
  }),
  company_request_approved: (d) => ({
    subject: `[Open Floor] Your company request was approved`,
    heading: "Your company request was approved",
    lines: [`${d.company_name ?? "The company"} you requested is now on Open Floor.`, "Thank you for helping expand coverage."],
    replyTo: REPLY_SUPPORT,
  }),
  company_request_rejected: (d) => ({
    subject: `[Open Floor] Update on your company request`,
    heading: "Update on your company request",
    lines: [`We reviewed your request for ${d.company_name ?? "the company"} and won't be adding it at this time.`, d.reason ? `Note: ${d.reason}` : "You're welcome to reply if you have questions."],
    replyTo: REPLY_SUPPORT,
  }),
  company_request_needs_information: (d) => ({
    subject: `[Open Floor] More information needed for your company request`,
    heading: "We need a little more information",
    lines: [`To review your request for ${d.company_name ?? "the company"}, could you reply with more detail?`, d.reason ? `What we need: ${d.reason}` : ""],
    replyTo: REPLY_SUPPORT,
  }),
  question_removed: (d) => ({
    subject: `[Open Floor] A question was removed`,
    heading: "A question was removed",
    lines: ["One of your questions was removed by moderation.", d.reason ? `Reason: ${d.reason}` : "", "If you believe this was a mistake, reply and let us know."],
    replyTo: REPLY_SUPPORT,
  }),
  question_restored: () => ({
    subject: `[Open Floor] A question was restored`,
    heading: "Your question is visible again",
    lines: ["A question of yours that was previously hidden has been restored to public view."],
    replyTo: REPLY_SUPPORT,
  }),
  bug_more_information_requested: (d) => ({
    subject: `[Open Floor ${d.reference ?? "BUG"}] We need a little more detail`,
    heading: "Could you tell us a bit more?",
    lines: ["We're looking into the bug you reported and need a little more information to reproduce it.", d.reason ? `Specifically: ${d.reason}` : "", "Just reply to this email."],
    replyTo: REPLY_BUGS,
  }),
  bug_fixed: (d) => ({
    subject: `[Open Floor ${d.reference ?? "BUG"}] Fixed`,
    heading: "The bug you reported is fixed",
    lines: ["Thanks again for reporting it — the fix is on its way to production."],
    replyTo: REPLY_BUGS,
  }),
  bug_deployed: (d) => ({
    subject: `[Open Floor ${d.reference ?? "BUG"}] Fix deployed`,
    heading: "The fix is live",
    lines: ["The fix for the bug you reported is now deployed. Thank you for helping improve Open Floor."],
    replyTo: REPLY_BUGS,
  }),
  support_response_recorded: (d) => ({
    subject: `[Open Floor ${d.ticket_number ?? "ticket"}] Update on your request`,
    heading: "There's an update on your request",
    lines: [d.summary ? String(d.summary) : "We've followed up on your request. Please check your inbox for our reply."],
    replyTo: REPLY_SUPPORT,
  }),
  admin_new_bug_alert: (d) => ({
    subject: `[Open Floor admin] New bug report ${d.reference ?? ""}`.trim(),
    heading: "New bug report",
    lines: [d.summary ? String(d.summary) : "A new bug report was submitted.", "Open the admin bugs page to triage."],
    replyTo: REPLY_BUGS,
  }),
  admin_new_support_alert: (d) => ({
    subject: `[Open Floor admin] New support ticket ${d.ticket_number ?? ""}`.trim(),
    heading: "New support ticket",
    lines: [`Category: ${d.category ?? "unknown"}.`, "Open the admin support page to respond."],
    replyTo: REPLY_SUPPORT,
  }),
  admin_email_delivery_failure: (d) => ({
    subject: `[Open Floor admin] Email delivery failure`,
    heading: "An application email failed to deliver",
    lines: [`Template: ${d.template ?? "unknown"}. Status: ${d.status ?? "failed"}.`, "See the System email-health panel."],
    replyTo: REPLY_SUPPORT,
  }),
};

function layout(b: Built): { html: string; text: string } {
  const text = [b.heading, "", ...b.lines.filter(Boolean), "", SIGNOFF, "https://www.open-floor.ca"].join("\n");
  const paras = b.lines.filter(Boolean).map((l) => `<p style="margin:0 0 14px;color:#222;font-size:15px;line-height:1.55">${esc(l)}</p>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:28px">
<tr><td><h1 style="margin:0 0 16px;font-size:19px;color:#111">${esc(b.heading)}</h1>${paras}
<p style="margin:20px 0 0;color:#888;font-size:13px">${esc(SIGNOFF)} · <a href="https://www.open-floor.ca" style="color:#3059f7">open-floor.ca</a></p>
</td></tr></table></td></tr></table></body></html>`;
  return { html, text };
}

/* -------------------------------- authorization ---------------------------- */

async function isAdmin(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    return res.ok && (await res.json()) === true;
  } catch {
    return false;
  }
}

async function recordAttempt(row: Record<string, unknown>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_email_attempt`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(row),
  }).catch(() => {});
}

/* ---------------------------------- handler -------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // AuthN: internal shared secret OR the sole admin's JWT.
  const intakeHeader = req.headers.get("x-intake-secret") ?? "";
  const internal = INTAKE_SECRET !== "" && intakeHeader === INTAKE_SECRET;
  if (!internal) {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || !(await isAdmin(token))) return json(401, { error: "unauthorized" });
  }

  let template = "", to = "", data: any = {}, entityType: string | null = null, entityId: string | null = null;
  try {
    const body = (await req.json()) as any;
    template = String(body?.template ?? "");
    to = String(body?.to ?? "").trim().toLowerCase();
    data = body?.data ?? {};
    entityType = body?.entity_type ? String(body.entity_type) : null;
    entityId = body?.entity_id ? String(body.entity_id) : null;
  } catch {
    return json(400, { error: "invalid_request" });
  }

  const build = REGISTRY[template];
  if (!build) return json(400, { error: "invalid_request", detail: "unknown_template" });
  if (!EMAIL_RE.test(to) || to.length > 254) return json(400, { error: "invalid_request", detail: "recipient" });

  const idempotencyKey = `${template}:${entityId ?? "none"}:${to}`;
  const built = build(data);
  const { html, text } = layout(built);

  if (!RESEND_API_KEY) {
    await recordAttempt({ p_template: template, p_recipient_email: to, p_entity_type: entityType, p_entity_id: entityId, p_idempotency_key: idempotencyKey, p_status: "failed", p_error_code: "not_configured", p_error_message: "RESEND_API_KEY is not set" });
    return json(503, { error: "email_not_configured" });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ from: SENDER, to, reply_to: built.replyTo, subject: built.subject, html, text }),
    });
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      await recordAttempt({ p_template: template, p_recipient_email: to, p_entity_type: entityType, p_entity_id: entityId, p_idempotency_key: idempotencyKey, p_status: "failed", p_error_code: `http_${res.status}`, p_error_message: errText });
      return json(502, { error: "send_failed" });
    }
    const out = (await res.json()) as { id?: string };
    await recordAttempt({ p_template: template, p_recipient_email: to, p_entity_type: entityType, p_entity_id: entityId, p_idempotency_key: idempotencyKey, p_status: "sent", p_provider_message_id: out.id ?? null });
    return json(200, { status: "sent", id: out.id ?? null });
  } catch (e) {
    await recordAttempt({ p_template: template, p_recipient_email: to, p_entity_type: entityType, p_entity_id: entityId, p_idempotency_key: idempotencyKey, p_status: "failed", p_error_code: "exception", p_error_message: String((e as Error)?.message ?? "").slice(0, 200) });
    return json(502, { error: "send_failed" });
  }
});

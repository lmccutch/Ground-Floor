// Configuration + deployment diagnostics for /admin/system (Supabase Edge
// Function, Deno) — Prompt 5.
//
// WHY THIS EXISTS
//   The database cannot see Edge Function secrets, and no SQL query can prove
//   that a function is deployed. Without this, /admin/system could only guess —
//   and a guess presented as a green tick is exactly what this prompt forbids.
//   Supabase secrets are project-wide and shared by every function, so one
//   function can truthfully report the presence of all of them.
//
// WHAT IT RETURNS, AND WHAT IT NEVER RETURNS
//   For each secret: "configured" | "missing" | "invalid_format" — and NOTHING
//   else. No value, no prefix, no length, no hash. A value is never logged.
//   Deployment status is probed by making an OPTIONS request to each expected
//   function's gateway URL: a 404 means not deployed, any other response means it
//   is, and a network error is reported as "unknown" rather than assumed either
//   way.
//
// WHAT IT DELIBERATELY REFUSES TO CLAIM
//   Whether the DEPLOYED intake code still fails closed on a missing Turnstile
//   secret cannot be verified from here — a probe would have to submit a real
//   form. It is reported as "unknown" with a pointer to the documentation, never
//   as verified.
//
// Client contract:
//   POST {}  (admin JWT required)
//   200 -> { generated_at, secrets: {...}, functions: {...}, notes: {...} }
//   401 -> { error: "unauthorized" }
//
// Deploy with verify_jwt = false — it performs its own admin verification.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type ConfigState = "configured" | "missing" | "invalid_format";

/** Presence + shape only. The value is read, tested, and discarded — never
 *  returned, logged, or included in any error. */
function check(name: string, validate?: (v: string) => boolean): ConfigState {
  const v = Deno.env.get(name) ?? "";
  if (v.trim() === "") return "missing";
  if (validate && !validate(v)) return "invalid_format";
  return "configured";
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Accepts either "name@domain" or "Display Name <name@domain>".
const isSender = (v: string) => {
  const m = v.match(/<([^>]+)>/);
  return EMAIL_RE.test((m ? m[1] : v).trim());
};
// Operational aliases must be on the production domain — a leftover
// @openfloor.example or a personal address is a real configuration defect.
const isProductionAlias = (v: string) => EMAIL_RE.test(v.trim()) && v.trim().toLowerCase().endsWith("@open-floor.ca");
const senderDomainOf = (v: string) => {
  const m = v.match(/<([^>]+)>/);
  const addr = (m ? m[1] : v).trim();
  const at = addr.lastIndexOf("@");
  return at === -1 ? null : addr.slice(at + 1).toLowerCase();
};

const EXPECTED_FUNCTIONS = ["submit-intake", "send-transactional-email", "resend-webhook", "admin-attachment-url"];

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

/** "deployed" | "not_deployed" | "unknown". A 404 from the functions gateway is
 *  the only signal that reliably means "no such function"; anything else means
 *  something answered, and a thrown error means we simply could not tell. */
async function probe(name: string): Promise<string> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "OPTIONS",
      headers: { apikey: ANON_KEY },
      signal: AbortSignal.timeout(4000),
    });
    return res.status === 404 ? "not_deployed" : "deployed";
  } catch {
    return "unknown";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !(await isAdmin(token))) return json(401, { error: "unauthorized" });

  const senderRaw = Deno.env.get("EMAIL_SENDER") ?? "";
  const senderDomain = senderRaw ? senderDomainOf(senderRaw) : null;

  const secrets: Record<string, ConfigState> = {
    RESEND_API_KEY: check("RESEND_API_KEY", (v) => v.startsWith("re_")),
    RESEND_WEBHOOK_SECRET: check("RESEND_WEBHOOK_SECRET", (v) => v.startsWith("whsec_")),
    TURNSTILE_SECRET_KEY: check("TURNSTILE_SECRET_KEY"),
    INTAKE_FUNCTION_SECRET: check("INTAKE_FUNCTION_SECRET", (v) => v.length >= 16),
    ADMIN_ALERT_EMAIL: check("ADMIN_ALERT_EMAIL", (v) => EMAIL_RE.test(v.trim())),
    // Unset sender/alias vars fall back to an @open-floor.ca default in the send
    // function, so "missing" here means "using the built-in default", not broken.
    EMAIL_SENDER: check("EMAIL_SENDER", isSender),
    EMAIL_REPLY_SUPPORT: check("EMAIL_REPLY_SUPPORT", isProductionAlias),
    EMAIL_REPLY_BUGS: check("EMAIL_REPLY_BUGS", isProductionAlias),
    EMAIL_REPLY_PRIVACY: check("EMAIL_REPLY_PRIVACY", isProductionAlias),
    EMAIL_REPLY_CONTACT: check("EMAIL_REPLY_CONTACT", isProductionAlias),
    ALLOWED_ORIGIN: check("ALLOWED_ORIGIN"),
  };

  const functions: Record<string, string> = {};
  await Promise.all(EXPECTED_FUNCTIONS.map(async (n) => { functions[n] = await probe(n); }));

  return json(200, {
    generated_at: new Date().toISOString(),
    secrets,
    functions,
    // Facts the caller needs to judge configuration, none of which reveal a value.
    sender_domain: senderDomain,
    expected_domain: "open-floor.ca",
    notes: {
      // Stated explicitly so the UI shows Unknown instead of inventing a verdict.
      turnstile_fail_closed: "unknown",
      turnstile_fail_closed_detail:
        "Whether the deployed intake function rejects submissions when the Turnstile secret is absent cannot be proven from here without submitting a real form. Verified in source (submit-intake turnstileOk) and by scripts/verify-intake-security.ts against a scratch project.",
      malware_scanning: "not_integrated",
      inbound_email_ingestion: "not_implemented",
      edge_invocation_telemetry: "unavailable",
    },
  });
});

// Resend delivery-event webhook receiver (Supabase Edge Function, Deno) — Prompt 4.
//
// Resend signs webhooks with Svix. This function verifies the signature, rejects
// anything unsigned/invalid/stale, then applies the event to the matching
// email_messages row via record_email_event (service role), which also raises a
// high-priority admin notification on bounce/complaint/failure. Idempotent: the DB
// function re-applies the same event to the same row without side effects.
//
// Deploy with verify_jwt = false (Resend cannot send a Supabase JWT). Security is
// the signature check, not JWT.
//
// Required secret: RESEND_WEBHOOK_SECRET (the Svix signing secret, "whsec_...").
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected.
//
// Never logs recipient details or the signing secret. Returns 200 quickly.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
const TOLERANCE_SECONDS = 300;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Svix signature verification. secret is "whsec_<base64>"; sign
// "<id>.<timestamp>.<body>" with the base64-decoded key, base64 the HMAC-SHA256,
// and match any "v1,<sig>" entry in the svix-signature header.
async function verify(body: string, headers: Headers): Promise<boolean> {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !timestamp || !sigHeader || !WEBHOOK_SECRET) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

  const secretBytes = Uint8Array.from(atob(WEBHOOK_SECRET.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
  const mac = await crypto.subtle.sign("HMAC", key, signed);
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // Header is space-separated "v1,<sig>" pairs; any match passes.
  for (const part of sigHeader.split(" ")) {
    const [, sig] = part.split(",");
    if (sig && timingSafeEqual(sig, expected)) return true;
  }
  return false;
}

const rpc = (fn: string, body: unknown) =>
  fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("not_configured", { status: 503 });

  // IMPORTANT: verification must run against the RAW request body, byte for byte.
  // Parsing first and re-serializing would change the bytes and break the HMAC.
  const body = await req.text();
  if (!(await verify(body, req.headers))) {
    // Counted (not stored per-request) so a burst of bad signatures raises one
    // deduplicated admin alert per hour instead of flooding or filling a table.
    await rpc("record_webhook_verification_failure", {}).catch(() => {});
    return new Response("invalid_signature", { status: 401 });
  }

  // Svix message id: the provider's own delivery identifier. Used to deduplicate
  // the event log so webhook replays are recorded exactly once.
  const eventId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = Number(req.headers.get("svix-timestamp") ?? "");
  const occurredAt = Number.isFinite(svixTimestamp) ? new Date(svixTimestamp * 1000).toISOString() : null;

  let event: { type?: string; data?: { email_id?: string; reason?: string; bounce?: { message?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    await rpc("record_email_event_log", {
      p_provider_event_id: eventId, p_provider_message_id: null, p_event_type: "unparseable",
      p_occurred_at: occurredAt, p_processing_result: "error",
    }).catch(() => {});
    return new Response("bad_json", { status: 400 });
  }

  const messageId = event.data?.email_id ?? null;
  const type = event.type ?? "";

  // Log the event before applying it, so evidence exists even when the event
  // references a message we never sent. Never logs bodies, recipients or headers.
  const logResult = async (result: string) => {
    await rpc("record_email_event_log", {
      p_provider_event_id: eventId,
      p_provider_message_id: messageId,
      p_event_type: type || "unknown",
      p_occurred_at: occurredAt,
      p_processing_result: result,
    }).catch(() => {});
  };

  if (!messageId || !type) {
    await logResult("ignored_unknown_event");
    return new Response("ok", { status: 200 }); // nothing actionable; ack
  }

  const errMsg = event.data?.bounce?.message ?? event.data?.reason ?? null;
  let applied = false;
  try {
    const res = await rpc("record_email_event", {
      p_provider_message_id: messageId,
      p_event: type,
      // Only adverse events carry an error code; record_email_event ignores it
      // for successful ones.
      p_error_code: type.split(".")[1] ?? null,
      p_error_message: errMsg,
    });
    applied = res.ok && (await res.json()) === true;
  } catch {
    applied = false;
  }
  await logResult(applied ? "applied" : "unmatched_message");

  return new Response("ok", { status: 200 });
});

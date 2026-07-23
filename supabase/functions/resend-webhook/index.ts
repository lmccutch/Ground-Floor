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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("not_configured", { status: 503 });

  const body = await req.text();
  if (!(await verify(body, req.headers))) return new Response("invalid_signature", { status: 401 });

  let event: { type?: string; data?: { email_id?: string; reason?: string; bounce?: { message?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("bad_json", { status: 400 });
  }

  const messageId = event.data?.email_id ?? null;
  const type = event.type ?? "";
  if (!messageId || !type) return new Response("ok", { status: 200 }); // nothing actionable; ack

  const errMsg = event.data?.bounce?.message ?? event.data?.reason ?? null;
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_email_event`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_provider_message_id: messageId, p_event: type, p_error_code: type.split(".")[1] ?? null, p_error_message: errMsg }),
  }).catch(() => {});

  return new Response("ok", { status: 200 });
});

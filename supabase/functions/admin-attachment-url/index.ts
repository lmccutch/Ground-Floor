// Short-lived signed URLs for private bug-report attachments (Supabase Edge
// Function, Deno) — Prompt 5.
//
// Attachments live in the PRIVATE 'bug-attachments' bucket. There is no public
// URL for any of them, and no browser role has a storage policy on the bucket, so
// this function is the only way to read one. It exists because Storage URL
// signing is not available from SQL.
//
// Authorization is two-layered, and the weaker layer is never sufficient:
//   1. The caller must present the administrator's JWT; is_admin() is verified
//      server-side against the database.
//   2. admin_resolve_attachment() — itself is_admin()-guarded, rate-limited and
//      audited — is called WITH THE ADMIN'S JWT to resolve the attachment id to
//      its object path. A non-admin cannot obtain a path to sign even if they
//      reached this function, because the RPC refuses them.
// Only after both pass does the service role mint a 60-second signed URL.
//
// Client contract:
//   POST { attachment_id, intent?: "view" | "download" }
//   200 -> { url, filename, mime_type, size_bytes, expires_in }
//   400 -> { error: "invalid_request" }
//   401 -> { error: "unauthorized" }
//   404 -> { error: "not_found" }
//   502 -> { error: "sign_failed" }
//
// Deploy with verify_jwt = false — this function performs its own, stronger
// admin verification rather than accepting any authenticated user.
// No secret is ever returned or logged.

// deno-lint-ignore-file no-explicit-any
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const BUCKET = "bug-attachments";
// Deliberately short: long enough to load an image in the drawer, short enough
// that a leaked URL (browser history, screen share, referrer) is quickly useless.
const EXPIRES_IN = 60;

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !(await isAdmin(token))) return json(401, { error: "unauthorized" });

  let attachmentId = "", intent = "view";
  try {
    const body = (await req.json()) as any;
    attachmentId = String(body?.attachment_id ?? "");
    intent = body?.intent === "download" ? "download" : "view";
  } catch {
    return json(400, { error: "invalid_request" });
  }
  if (!UUID_RE.test(attachmentId)) return json(400, { error: "invalid_request" });

  // Authorize + audit in the database, as the administrator. This is what
  // prevents cross-record access: the path comes from the row, never the caller.
  const resolved = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_resolve_attachment`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_attachment_id: attachmentId, p_intent: intent }),
  });
  if (!resolved.ok) return json(resolved.status === 404 ? 404 : 400, { error: "not_found" });

  let meta: any = null;
  try { meta = await resolved.json(); } catch { /* ignore */ }
  const objectPath = typeof meta?.object_path === "string" ? meta.object_path : "";
  if (!objectPath) return json(404, { error: "not_found" });

  // Mint the signed URL with the service role. This is the ONLY step that uses it,
  // and it runs strictly after both authorization checks have passed.
  try {
    const signed = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${objectPath}`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: EXPIRES_IN }),
    });
    if (!signed.ok) return json(502, { error: "sign_failed" });
    const out = (await signed.json()) as { signedURL?: string; signedUrl?: string };
    const rel = out.signedURL ?? out.signedUrl ?? "";
    if (!rel) return json(502, { error: "sign_failed" });
    return json(200, {
      url: `${SUPABASE_URL}/storage/v1${rel.startsWith("/") ? rel : `/${rel}`}`,
      filename: meta?.filename ?? "attachment",
      mime_type: meta?.mime_type ?? "application/octet-stream",
      size_bytes: meta?.size_bytes ?? null,
      expires_in: EXPIRES_IN,
    });
  } catch {
    return json(502, { error: "sign_failed" });
  }
});

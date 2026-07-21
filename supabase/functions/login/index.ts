// Secure username-or-email + password login (Supabase Edge Function, Deno).
//
// Why this exists: Supabase Auth natively authenticates by email + password, but
// Open Floor also allows signing in with a username. Resolving a username to its
// email MUST happen server-side with the service-role key — the browser must
// never receive the username→email mapping (account enumeration / privacy). This
// function performs that resolution and the password grant, and returns only a
// session (on success) or a single generic error (on any failure), so it never
// discloses whether a username exists or whether the password was wrong.
//
// Client contract:
//   POST { "identifier": "<username or email>", "password": "<password>" }
//   200 -> GoTrue session JSON: { access_token, refresh_token, ... }
//          (client calls supabase.auth.setSession({ access_token, refresh_token }))
//   400 -> { "error": "invalid_credentials" }   (generic, for ALL auth failures)
//   429 -> { "error": "rate_limited" }
//
// Required function secrets (set with `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are injected by
//   the platform. Optionally set LOGIN_ALLOWED_ORIGIN to lock CORS to the site.
//
// Never logs identifiers, passwords, tokens, or emails.

// deno-lint-ignore-file no-explicit-any
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGIN = Deno.env.get("LOGIN_ALLOWED_ORIGIN") ?? "*";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Generic auth failure — identical for every reason so nothing is disclosed.
const invalid = () => json(400, { error: "invalid_credentials" });

/* --------------------------- best-effort rate limit ------------------------ */
// Per-instance, in-memory sliding window. Edge instances are ephemeral and not
// shared, so this is defense-in-depth only; GoTrue also rate-limits token grants
// upstream. For strict global limits, back this with a Postgres table.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

/* ------------------------------ email resolution --------------------------- */

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

async function emailForUsername(username: string): Promise<string | null> {
  const normalized = username.trim().toLowerCase();
  // 1) username_normalized -> profile id (service role, RLS-bypassing).
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id&username_normalized=eq.${encodeURIComponent(normalized)}&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  if (!profileRes.ok) return null;
  const rows = (await profileRes.json()) as Array<{ id?: string }>;
  const id = rows[0]?.id;
  if (!id) return null;

  // 2) profile id -> auth email (admin API).
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as { email?: string };
  return user.email ?? null;
}

/* ---------------------------------- handler -------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return json(429, { error: "rate_limited" });

  let identifier = "";
  let password = "";
  try {
    const body = (await req.json()) as any;
    identifier = String(body?.identifier ?? "").trim();
    password = String(body?.password ?? "");
  } catch {
    return invalid();
  }
  if (!identifier || !password) return invalid();

  let email: string | null = isEmail(identifier) ? identifier.toLowerCase() : await emailForUsername(identifier);
  if (!email) return invalid();

  // Password grant through GoTrue. Any non-200 (bad password, unverified email,
  // unknown account) collapses to the same generic error.
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!tokenRes.ok) return invalid();

  const session = await tokenRes.json();
  return json(200, session);
});

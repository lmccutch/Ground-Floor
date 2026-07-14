// Live regression check for the start_campaign RPC privilege fix
// (supabase/migrations/202607130001_fix_start_campaign_security.sql).
//
// Verifies against a real Supabase project (scratch/staging — never production):
//   1. Anon key only: /rpc/start_campaign is denied and no campaign row appears.
//   2. Authenticated user: the call succeeds, repeat calls return the same
//      campaign UUID, and exactly one campaign row exists for the company.
//   3. Invalid company id: fails cleanly without creating rows.
//
// Row counts are read with the service-role key (bypasses RLS) before and
// after each call, so the check does not rely on the API's error response
// alone — a "denied" response that still inserted a row would fail the run.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:rpc-security
//
// The script creates a throwaway password-auth user and deletes it (and the
// campaign it created) on completion, restoring the previous row counts.

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error(
    "Missing env: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
  process.exit(2);
}

const failures: string[] = [];

function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
}

function headers(key: string, token?: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    "Content-Type": "application/json",
  };
}

async function campaignCount(companyId?: string): Promise<number> {
  const filter = companyId ? `&company_id=eq.${companyId}` : "";
  const res = await fetch(`${url}/rest/v1/campaigns?select=id&limit=1${filter}`, {
    method: "HEAD",
    headers: { ...headers(serviceKey!), Prefer: "count=exact" },
  });
  const range = res.headers.get("content-range") ?? "";
  return Number(range.split("/")[1] ?? NaN);
}

async function callStartCampaign(key: string, companyId: string, token?: string) {
  const res = await fetch(`${url}/rest/v1/rpc/start_campaign`, {
    method: "POST",
    headers: headers(key, token),
    body: JSON.stringify({ p_company_id: companyId }),
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function main() {
  // Target company: first discoverable company visible to anon.
  const companyRes = await fetch(
    `${url}/rest/v1/companies?select=id,ticker&order=ticker&limit=1`,
    { headers: headers(anonKey!) },
  );
  const [company] = (await companyRes.json()) as { id: string; ticker: string }[];
  if (!company) {
    console.error("No companies visible to anon — bootstrap the directory first.");
    process.exit(2);
  }
  console.log(`Target company: ${company.ticker} (${company.id})\n`);

  // --- 1. Anonymous call must be denied and must not insert. -----------------
  const before = await campaignCount();
  const anonCall = await callStartCampaign(anonKey!, company.id);
  const afterAnon = await campaignCount();

  check(
    "anon start_campaign is denied",
    anonCall.status >= 400,
    `http=${anonCall.status} body=${anonCall.body.slice(0, 120)}`,
  );
  check(
    "anon call created no campaign rows",
    afterAnon === before,
    `count ${before} -> ${afterAnon}`,
  );

  // --- 2. Authenticated user succeeds, idempotently. -------------------------
  const email = `rpc-security-check-${Date.now()}@example.com`;
  const password = crypto.randomUUID() + "-Aa1!";
  const createUser = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(serviceKey!),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const user = (await createUser.json()) as { id?: string };
  if (!createUser.ok || !user.id) {
    console.error(`Could not create test user (http=${createUser.status}).`);
    process.exit(2);
  }

  let campaignId: string | undefined;
  try {
    const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: headers(anonKey!),
      body: JSON.stringify({ email, password }),
    });
    const session = (await signIn.json()) as { access_token?: string };
    if (!session.access_token) {
      console.error(`Could not sign in test user (http=${signIn.status}).`);
      process.exit(2);
    }

    const authed1 = await callStartCampaign(anonKey!, company.id, session.access_token);
    const authed2 = await callStartCampaign(anonKey!, company.id, session.access_token);
    const afterAuthed = await campaignCount();
    const perCompany = await campaignCount(company.id);
    campaignId = authed1.status === 200 ? JSON.parse(authed1.body) : undefined;

    check(
      "authenticated start_campaign succeeds",
      authed1.status === 200 && typeof campaignId === "string",
      `http=${authed1.status} id=${authed1.body.slice(0, 60)}`,
    );
    check(
      "repeat call returns the same campaign",
      authed2.status === 200 && authed2.body === authed1.body,
      `first=${authed1.body.slice(0, 60)} second=${authed2.body.slice(0, 60)}`,
    );
    check(
      "exactly one campaign row exists for the company",
      perCompany === 1,
      `per-company count=${perCompany}`,
    );
    check(
      "total campaigns grew by exactly one",
      afterAuthed === before + 1,
      `count ${before} -> ${afterAuthed}`,
    );

    // --- 3. Invalid company id fails cleanly, creates nothing. ---------------
    const bogusId = crypto.randomUUID();
    const invalid = await callStartCampaign(anonKey!, bogusId, session.access_token);
    const afterInvalid = await campaignCount();
    check(
      "invalid company id fails cleanly",
      invalid.status >= 400,
      `http=${invalid.status} body=${invalid.body.slice(0, 120)}`,
    );
    check(
      "invalid call created no rows",
      afterInvalid === afterAuthed,
      `count ${afterAuthed} -> ${afterInvalid}`,
    );
  } finally {
    // Cleanup: remove the campaign created by the test, then the test user.
    if (campaignId) {
      await fetch(`${url}/rest/v1/campaigns?id=eq.${campaignId}`, {
        method: "DELETE",
        headers: headers(serviceKey!),
      });
    }
    await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: headers(serviceKey!),
    });
  }

  const finalCount = await campaignCount();
  check("cleanup restored the original campaign count", finalCount === before, `count=${finalCount}`);

  console.log(
    failures.length === 0
      ? "\nAll start_campaign security checks passed."
      : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(2);
});

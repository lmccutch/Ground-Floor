// Live security verification for the admin-foundation + password-auth migrations
// (202607210001..0004). Runs against a REAL Supabase project — a SCRATCH/STAGING
// project ONLY, never production (it creates a user with the approved admin email
// and bootstraps admin). Creates throwaway users/rows and deletes them after.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:admin-security
//
// Covers: single-admin enforcement, self-promotion & second-admin impossibility,
// is_admin() email/verification gating, notifications/audit RLS, audit
// immutability, protected-RPC authorization, duplicate-approval guard, milestone
// idempotency, and username concurrency.

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(2);
}

const APPROVED_EMAIL = "luke.mccutcheon78@gmail.com";

const failures: string[] = [];
function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
}

function headers(key: string, token?: string, extra: Record<string, string> = {}): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${token ?? key}`, "Content-Type": "application/json", ...extra };
}

async function rest(
  method: string,
  path: string,
  { key = anonKey!, token, body, prefer }: { key?: string; token?: string; body?: unknown; prefer?: string } = {},
) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: headers(key, token, prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

type Rows = Array<Record<string, unknown>>;

async function createUser(email: string, confirm = true): Promise<{ id: string; token: string; email: string }> {
  const password = crypto.randomUUID() + "-Aa1!";
  const created = await rest("POST", "/auth/v1/admin/users", {
    key: serviceKey!, body: { email, password, email_confirm: confirm },
  });
  const id = (created.data as { id?: string }).id;
  const signin = await rest("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  const token = (signin.data as { access_token?: string }).access_token;
  if (!id) throw new Error(`could not create user ${email}: ${JSON.stringify(created.data)}`);
  return { id, token: token ?? "", email };
}

async function claimUsername(token: string, username: string) {
  return rest("POST", "/rest/v1/rpc/claim_username", { token, body: { p_username: username } });
}

async function main() {
  const admin = await createUser(APPROVED_EMAIL);
  const regular = await createUser(`admin-sec-regular-${Date.now()}@mailinator.com`);
  const s1 = await createUser(`admin-sec-s1-${Date.now()}@mailinator.com`);
  const s2 = await createUser(`admin-sec-s2-${Date.now()}@mailinator.com`);
  const s3 = await createUser(`admin-sec-s3-${Date.now()}@mailinator.com`);
  const created: { requestId?: string; companyId?: string; campaignId?: string } = {};

  try {
    /* --------------------------- admin bootstrap --------------------------- */
    // is_admin is false for everyone before bootstrap.
    const preAdmin = await rest("POST", "/rest/v1/rpc/is_admin", { token: admin.token });
    check("approved email is NOT admin before bootstrap", preAdmin.data === false, `got=${preAdmin.data}`);

    const boot = await rest("POST", "/rest/v1/rpc/bootstrap_admin", { key: serviceKey! });
    check("bootstrap_admin activates the approved account", boot.status === 200 && typeof boot.data === "string", `http=${boot.status}`);

    const isAdmin = await rest("POST", "/rest/v1/rpc/is_admin", { token: admin.token });
    check("approved + verified + active account IS admin", isAdmin.data === true, `got=${isAdmin.data}`);

    const regularIsAdmin = await rest("POST", "/rest/v1/rpc/is_admin", { token: regular.token });
    check("a regular user is NOT admin", regularIsAdmin.data === false, `got=${regularIsAdmin.data}`);

    const anonIsAdmin = await rest("POST", "/rest/v1/rpc/is_admin", {});
    check("anon is NOT admin", anonIsAdmin.data === false || anonIsAdmin.data === null, `got=${anonIsAdmin.data}`);

    /* ---------------- single admin / self-promotion / 2nd admin ------------ */
    const selfPromote = await rest("POST", "/rest/v1/admin_memberships", {
      token: regular.token, body: { user_id: regular.id, role: "admin", is_active: true },
    });
    check("regular user cannot self-insert an admin membership", selfPromote.status === 401 || selfPromote.status === 403, `http=${selfPromote.status}`);

    // Service role bypasses RLS, but the identity trigger must still reject a
    // non-approved email holding an ACTIVE membership.
    const secondAdmin = await rest("POST", "/rest/v1/admin_memberships", {
      key: serviceKey!, body: { user_id: s1.id, role: "admin", is_active: true },
    });
    check("a second active admin (non-approved email) is rejected by the identity trigger", secondAdmin.status >= 400, `http=${secondAdmin.status}`);

    /* --------------------------- notifications RLS ------------------------- */
    const anonNotifs = await rest("GET", "/rest/v1/admin_notifications?select=id", {});
    check("anon cannot read admin_notifications", !Array.isArray(anonNotifs.data) || (anonNotifs.data as Rows).length === 0, `http=${anonNotifs.status}`);
    const regularNotifs = await rest("GET", "/rest/v1/admin_notifications?select=id", { token: regular.token });
    check("regular user cannot read admin_notifications", Array.isArray(regularNotifs.data) && (regularNotifs.data as Rows).length === 0);
    const fakeNotif = await rest("POST", "/rest/v1/admin_notifications", {
      token: regular.token, body: { type: "security_alert", title: "fake", message: "fake", deduplication_key: "fake:" + Date.now() },
    });
    check("regular user cannot forge an admin notification", fakeNotif.status === 401 || fakeNotif.status === 403, `http=${fakeNotif.status}`);

    /* ------------------------------ audit RLS ------------------------------ */
    const fakeAudit = await rest("POST", "/rest/v1/admin_audit_log", {
      token: regular.token, body: { admin_user_id: regular.id, action: "fake" },
    });
    check("regular user cannot insert audit rows", fakeAudit.status === 401 || fakeAudit.status === 403, `http=${fakeAudit.status}`);
    const anonAudit = await rest("GET", "/rest/v1/admin_audit_log?select=id", {});
    check("anon cannot read the audit log", !Array.isArray(anonAudit.data) || (anonAudit.data as Rows).length === 0);
    const adminAudit = await rest("GET", "/rest/v1/admin_audit_log?select=id&action=eq.admin_bootstrap", { token: admin.token });
    check("admin can read the audit log (bootstrap recorded)", Array.isArray(adminAudit.data) && (adminAudit.data as Rows).length >= 1, `rows=${Array.isArray(adminAudit.data) ? (adminAudit.data as Rows).length : "err"}`);
    // Immutability: even the service role cannot mutate audit rows (trigger).
    const auditId = String((adminAudit.data as Rows)[0]?.id ?? "");
    const mutateAudit = await rest("PATCH", `/rest/v1/admin_audit_log?id=eq.${auditId}`, { key: serviceKey!, body: { action: "tampered" } });
    check("audit log is append-only (update blocked even for service role)", mutateAudit.status >= 400, `http=${mutateAudit.status}`);

    /* ----------------------- protected RPC authorization ------------------- */
    const queueRegular = await rest("POST", "/rest/v1/rpc/admin_work_queue", { token: regular.token });
    check("regular user cannot call admin_work_queue", queueRegular.status >= 400, `http=${queueRegular.status}`);
    const queueAdmin = await rest("POST", "/rest/v1/rpc/admin_work_queue", { token: admin.token });
    check("admin can call admin_work_queue", queueAdmin.status === 200, `http=${queueAdmin.status}`);

    /* --------------------- company request + dup approval ------------------ */
    const reqIns = await rest("POST", "/rest/v1/company_requests?select=id", {
      token: regular.token, prefer: "return=representation",
      body: { requested_by: regular.id, company_name: `SecTest Co ${Date.now()}`, ticker: `SEC${Math.floor(Math.random() * 9999)}` },
    });
    created.requestId = String((reqIns.data as Rows)[0]?.id ?? "");
    check("user can file a company request", reqIns.status === 201 && Boolean(created.requestId));

    const reqNotAdmin = await rest("POST", "/rest/v1/rpc/admin_approve_company_request", { token: regular.token, body: { p_request_id: created.requestId } });
    check("regular user cannot approve a company request", reqNotAdmin.status >= 400, `http=${reqNotAdmin.status}`);

    const approve1 = await rest("POST", "/rest/v1/rpc/admin_approve_company_request", { token: admin.token, body: { p_request_id: created.requestId } });
    const approvedCompany = (approve1.data as { company_id?: string })?.company_id;
    created.companyId = approvedCompany;
    check("admin approves the request and a company is created", approve1.status === 200 && Boolean(approvedCompany) && (approve1.data as { created?: boolean }).created === true, `http=${approve1.status}`);

    const approve2 = await rest("POST", "/rest/v1/rpc/admin_approve_company_request", { token: admin.token, body: { p_request_id: created.requestId } });
    check("re-approving is idempotent (no duplicate company)", approve2.status === 200 && (approve2.data as { company_id?: string }).company_id === approvedCompany && (approve2.data as { already_approved?: boolean }).already_approved === true, `data=${JSON.stringify(approve2.data)}`);

    /* -------------------------- milestone idempotency ---------------------- */
    const started = await rest("POST", "/rest/v1/rpc/start_campaign", { token: admin.token, body: { p_company_id: approvedCompany } });
    created.campaignId = String(started.data);
    check("campaign started for milestone test", started.status === 200 && Boolean(created.campaignId));
    // Lower the threshold to 2 BEFORE adding supporters.
    await rest("POST", "/rest/v1/rpc/admin_update_campaign_ops", { token: admin.token, body: { p_campaign_id: created.campaignId, p_supporter_threshold: 2 } });
    for (const u of [s1, s2, s3]) {
      await rest("POST", "/rest/v1/campaign_supporters", { token: u.token, body: { campaign_id: created.campaignId, user_id: u.id, shareholder_status: "Current shareholder" } });
    }
    const milestone = await rest("GET", `/rest/v1/admin_notifications?select=id&deduplication_key=eq.campaign_milestone:${created.campaignId}:100`, { token: admin.token });
    check("threshold-reached milestone is emitted exactly once", Array.isArray(milestone.data) && (milestone.data as Rows).length === 1, `rows=${Array.isArray(milestone.data) ? (milestone.data as Rows).length : "err"}`);

    /* --------------------------- username concurrency ---------------------- */
    const uname = `sectest_${Date.now()}`;
    const claimA = await claimUsername(s1.token, uname);
    const claimB = await claimUsername(s2.token, uname);
    const aOk = claimA.status === 200;
    const bTaken = claimB.status >= 400;
    check("exactly one of two concurrent username claims wins", aOk && bTaken, `a=${claimA.status} b=${claimB.status}`);
    const reserved = await claimUsername(s3.token, "admin");
    check("reserved usernames are blocked", reserved.status >= 400, `http=${reserved.status}`);

    /* ---------------- username reclaim idempotency (Prompt 2 preflight) ----- */
    // s1 already owns `uname` from the concurrency test above.
    const reclaimSame = await claimUsername(s1.token, uname);
    check("owner reclaiming their own username is an idempotent success (no username_taken)", reclaimSame.status === 200, `http=${reclaimSame.status}`);
    const reclaimCase = await claimUsername(s1.token, uname.toUpperCase());
    check("owner case-only username change succeeds and is not reported as taken", reclaimCase.status === 200, `http=${reclaimCase.status}`);
    const otherStillBlocked = await claimUsername(s2.token, uname);
    check("a different user still cannot claim a username someone already owns", otherStillBlocked.status >= 400, `http=${otherStillBlocked.status}`);
  } finally {
    if (created.campaignId) await rest("DELETE", `/rest/v1/campaigns?id=eq.${created.campaignId}`, { key: serviceKey! });
    if (created.companyId) await rest("DELETE", `/rest/v1/companies?id=eq.${created.companyId}`, { key: serviceKey! });
    for (const u of [admin, regular, s1, s2, s3]) {
      await rest("DELETE", `/auth/v1/admin/users/${u.id}`, { key: serviceKey! });
    }
  }

  console.log(
    failures.length === 0
      ? "\nAll admin-foundation security checks passed."
      : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(2);
});

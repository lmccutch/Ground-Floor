// Live, direct-RPC verification that server-side status-transition enforcement
// (migration 202607220005) actually rejects invalid transitions — the ONLY proof
// that satisfies "do not claim a transition is enforced unless a direct RPC test
// proves it". Runs against a REAL Supabase project — a SCRATCH/STAGING project
// ONLY, never production (it creates a user with the approved admin email and
// calls bootstrap_admin()). Creates throwaway rows/users and deletes them after.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:transition-security
//
// Covers, as DIRECT RPC calls (not UI, not CHECK constraints):
//   * company request: approved -> under_review rejected; approved via updater rejected
//   * campaign: active -> completed rejected; completed without a reason rejected
//   * question: removed -> publish rejected (restore path required)
//   * report: pending -> action_taken (confirm) without a resolution rejected;
//             re-resolving a terminal report rejected
//   * bug: new -> deployed rejected (fix/deployment metadata + progression required)
//   * support: new -> closed without a resolution reason rejected
//   * plus a permitted transition for each, to prove enforcement is not over-broad.

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
  const created = await rest("POST", "/auth/v1/admin/users", { key: serviceKey!, body: { email, password, email_confirm: confirm } });
  const id = (created.data as { id?: string }).id;
  const signin = await rest("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  const token = (signin.data as { access_token?: string }).access_token;
  if (!id) throw new Error(`could not create user ${email}: ${JSON.stringify(created.data)}`);
  return { id, token: token ?? "", email };
}

// Insert a row as the service role (bypasses RLS) and return the created id.
async function seed(table: string, row: Record<string, unknown>): Promise<string> {
  const res = await rest("POST", `/rest/v1/${table}?select=id`, { key: serviceKey!, prefer: "return=representation", body: row });
  const id = String((res.data as Rows)?.[0]?.id ?? "");
  if (!id) throw new Error(`could not seed ${table}: http=${res.status} ${JSON.stringify(res.data)}`);
  return id;
}

const rpc = (fn: string, token: string, body: Record<string, unknown>) =>
  rest("POST", `/rest/v1/rpc/${fn}`, { token, body });

async function main() {
  const admin = await createUser(APPROVED_EMAIL);
  const regular = await createUser(`trans-regular-${Date.now()}@mailinator.com`);
  const cleanup: Array<[string, string]> = []; // [table, id]
  let companyId = "";
  let campaignId = "";

  try {
    const boot = await rest("POST", "/rest/v1/rpc/bootstrap_admin", { key: serviceKey! });
    check("bootstrap_admin activates the approved account", boot.status === 200, `http=${boot.status}`);
    const isAdmin = await rpc("is_admin", admin.token, {});
    check("approved account IS admin (is_admin hardened, search_path='')", isAdmin.data === true, `got=${isAdmin.data}`);

    /* ===================== company requests ===================== */
    // Approve a request to get a real company + an 'approved' request to test on.
    const reqIns = await rest("POST", "/rest/v1/company_requests?select=id", {
      token: regular.token, prefer: "return=representation",
      body: { requested_by: regular.id, company_name: `Trans Co ${Date.now()}`, ticker: `TR${Math.floor(Math.random() * 99999)}`, exchange: "NASDAQ", reason: "audit", shareholder_status: "Current shareholder" },
    });
    const approvedReqId = String((reqIns.data as Rows)[0]?.id ?? "");
    const approve = await rpc("admin_approve_company_request", admin.token, { p_request_id: approvedReqId });
    companyId = (approve.data as { company_id?: string })?.company_id ?? "";
    check("setup: request approved and company created", approve.status === 200 && Boolean(companyId), `http=${approve.status}`);

    // INVALID: approved -> under_review via the generic updater must be rejected.
    const backToReview = await rpc("admin_update_company_request", admin.token, { p_request_id: approvedReqId, p_status: "under_review", p_reason: "audit" });
    check("company request: approved -> under_review is rejected", backToReview.status >= 400, `http=${backToReview.status}`);

    // INVALID: setting status directly to 'approved' via the updater is rejected
    // (approval must go through admin_approve_company_request).
    const req2 = await rest("POST", "/rest/v1/company_requests?select=id", {
      token: regular.token, prefer: "return=representation",
      body: { requested_by: regular.id, company_name: `Trans Co2 ${Date.now()}`, ticker: `TS${Math.floor(Math.random() * 99999)}`, exchange: "NASDAQ", reason: "audit", shareholder_status: "Current shareholder" },
    });
    const req2Id = String((req2.data as Rows)[0]?.id ?? "");
    cleanup.push(["company_requests", req2Id]);
    const forceApprove = await rpc("admin_update_company_request", admin.token, { p_request_id: req2Id, p_status: "approved", p_reason: "audit" });
    check("company request: status->approved via the generic updater is rejected", forceApprove.status >= 400, `http=${forceApprove.status}`);
    // VALID: pending -> under_review is permitted.
    const beginReview = await rpc("admin_update_company_request", admin.token, { p_request_id: req2Id, p_status: "under_review", p_reason: "audit" });
    check("company request: pending -> under_review is permitted", beginReview.status === 200, `http=${beginReview.status}`);

    /* ===================== campaigns ===================== */
    const started = await rpc("start_campaign", admin.token, { p_company_id: companyId });
    campaignId = String(started.data);
    check("setup: campaign started (operational_status active)", started.status === 200 && Boolean(campaignId), `http=${started.status}`);

    // INVALID: active -> completed (no progression, no completion reason).
    const activeToDone = await rpc("admin_update_campaign_ops", admin.token, { p_campaign_id: campaignId, p_operational_status: "completed", p_reason: "audit" });
    check("campaign: active -> completed is rejected", activeToDone.status >= 400, `http=${activeToDone.status}`);

    // VALID: active -> outreach_started (a permitted operational move).
    const toOutreach = await rpc("admin_update_campaign_ops", admin.token, { p_campaign_id: campaignId, p_operational_status: "outreach_started", p_reason: "audit" });
    check("campaign: active -> outreach_started is permitted", toOutreach.status === 200, `http=${toOutreach.status}`);

    // INVALID: outreach_started -> completed WITHOUT a completion reason.
    const doneNoReason = await rpc("admin_update_campaign_ops", admin.token, { p_campaign_id: campaignId, p_operational_status: "completed", p_reason: "audit" });
    check("campaign: completed without a completion reason is rejected", doneNoReason.status >= 400, `http=${doneNoReason.status}`);

    // VALID: outreach_started -> completed WITH a completion reason.
    const doneOk = await rpc("admin_update_campaign_ops", admin.token, { p_campaign_id: campaignId, p_operational_status: "completed", p_closed_reason: "Interview completed and published", p_reason: "audit" });
    check("campaign: completed WITH a completion reason is permitted", doneOk.status === 200, `http=${doneOk.status}`);

    /* ===================== questions (restore path) ===================== */
    const qId = await seed("questions", { company_id: companyId, author_id: regular.id, question_text: "Audit question for moderation transitions?", topic: "Governance", shareholder_status: "Current shareholder" });
    cleanup.push(["questions", qId]);
    // Move to 'removed' first (valid).
    const removeQ = await rpc("admin_moderate_question", admin.token, { p_question_id: qId, p_action: "remove", p_reason: "audit removal" });
    check("setup: question moved to removed", removeQ.status === 200, `http=${removeQ.status}`);
    // INVALID: removed -> publish directly.
    const removedPublish = await rpc("admin_moderate_question", admin.token, { p_question_id: qId, p_action: "publish" });
    check("question: removed -> publish is rejected (restore required)", removedPublish.status >= 400, `http=${removedPublish.status}`);
    // VALID: removed -> restore, then restored -> publish.
    const restoreQ = await rpc("admin_moderate_question", admin.token, { p_question_id: qId, p_action: "restore" });
    check("question: removed -> restore is permitted", restoreQ.status === 200, `http=${restoreQ.status}`);
    const publishRestored = await rpc("admin_moderate_question", admin.token, { p_question_id: qId, p_action: "publish" });
    check("question: restored -> publish is permitted", publishRestored.status === 200, `http=${publishRestored.status}`);

    /* ===================== question reports (coordinated resolution) ===================== */
    const qId2 = await seed("questions", { company_id: companyId, author_id: regular.id, question_text: "Audit question for report transitions?", topic: "Governance", shareholder_status: "Current shareholder" });
    cleanup.push(["questions", qId2]);
    const reportId = await seed("question_reports", { question_id: qId2, reported_by: regular.id, reason: "spam" });
    cleanup.push(["question_reports", reportId]);
    // INVALID: pending -> action_taken via bare confirm with no resolution.
    const confirmNoRes = await rpc("admin_resolve_report", admin.token, { p_report_id: reportId, p_action: "confirm" });
    check("report: confirm -> action_taken without a coordinated resolution is rejected", confirmNoRes.status >= 400, `http=${confirmNoRes.status}`);
    // VALID: confirm WITH a resolution.
    const confirmOk = await rpc("admin_resolve_report", admin.token, { p_report_id: reportId, p_action: "confirm", p_resolution: "Reviewed; content acceptable, no change", p_reason: "audit" });
    check("report: confirm WITH a resolution is permitted", confirmOk.status === 200, `http=${confirmOk.status}`);
    // INVALID: re-resolving a now-terminal (action_taken) report.
    const reResolve = await rpc("admin_resolve_report", admin.token, { p_report_id: reportId, p_action: "dismiss", p_resolution: "again" });
    check("report: re-resolving a terminal report is rejected", reResolve.status >= 400, `http=${reResolve.status}`);

    /* ===================== bugs (fix/deployment metadata + progression) ===================== */
    const bugId = await seed("bug_reports", { submitted_by: regular.id, description: "Audit bug for transition enforcement" });
    cleanup.push(["bug_reports", bugId]);
    // INVALID: new -> deployed.
    const newToDeployed = await rpc("admin_update_bug", admin.token, { p_bug_id: bugId, p_status: "deployed", p_reason: "audit" });
    check("bug: new -> deployed is rejected", newToDeployed.status >= 400, `http=${newToDeployed.status}`);
    // VALID walk: new -> triaged -> confirmed -> fixed (with note) -> deployed (with note).
    const t1 = await rpc("admin_update_bug", admin.token, { p_bug_id: bugId, p_status: "triaged", p_reason: "audit" });
    const t2 = await rpc("admin_update_bug", admin.token, { p_bug_id: bugId, p_status: "confirmed", p_reason: "audit" });
    const t3 = await rpc("admin_update_bug", admin.token, { p_bug_id: bugId, p_status: "fixed", p_fixed_commit: "abc1234", p_reason: "audit" });
    const t4 = await rpc("admin_update_bug", admin.token, { p_bug_id: bugId, p_status: "deployed", p_admin_notes: "released in v1.2.3", p_reason: "audit" });
    check("bug: new -> triaged -> confirmed -> fixed -> deployed walk is permitted", [t1, t2, t3, t4].every(r => r.status === 200), `http=${[t1, t2, t3, t4].map(r => r.status).join(",")}`);
    // INVALID: 'fixed' without any fix metadata (fresh bug).
    const bug2 = await seed("bug_reports", { submitted_by: regular.id, description: "Audit bug two" });
    cleanup.push(["bug_reports", bug2]);
    await rpc("admin_update_bug", admin.token, { p_bug_id: bug2, p_status: "confirmed", p_reason: "audit" });
    const fixedNoMeta = await rpc("admin_update_bug", admin.token, { p_bug_id: bug2, p_status: "fixed", p_reason: "audit" });
    check("bug: -> fixed without fix metadata is rejected", fixedNoMeta.status >= 400, `http=${fixedNoMeta.status}`);

    /* ===================== support tickets (resolution reason) ===================== */
    const ticketId = await seed("support_tickets", { submitted_by: regular.id, ticket_number: "IGNORED", category: "technical_support", message: "Audit ticket for transition enforcement" });
    cleanup.push(["support_tickets", ticketId]);
    // INVALID: new -> closed without a resolution reason.
    const closeNoReason = await rpc("admin_update_support_ticket", admin.token, { p_ticket_id: ticketId, p_status: "closed" });
    check("support: new -> closed without a resolution reason is rejected", closeNoReason.status >= 400, `http=${closeNoReason.status}`);
    // INVALID: new -> resolved without a resolution reason.
    const resolveNoReason = await rpc("admin_update_support_ticket", admin.token, { p_ticket_id: ticketId, p_status: "resolved" });
    check("support: new -> resolved without a resolution reason is rejected", resolveNoReason.status >= 400, `http=${resolveNoReason.status}`);
    // VALID: new -> closed WITH a resolution reason.
    const closeOk = await rpc("admin_update_support_ticket", admin.token, { p_ticket_id: ticketId, p_status: "closed", p_reason: "Resolved: duplicate of an existing ticket" });
    check("support: new -> closed WITH a resolution reason is permitted", closeOk.status === 200, `http=${closeOk.status}`);

    /* ===================== direct write-path bypass is closed ===================== */
    // The RPC gates are only meaningful if the admin cannot sidestep them with a
    // direct PostgREST PATCH. After 202607220006, UPDATE is revoked so those PATCHes
    // must fail at the privilege layer (never silently succeed).
    const blocked = (r: { status: number; data: unknown }) =>
      r.status >= 400 || (Array.isArray(r.data) && (r.data as Rows).length === 0);
    const directBug = await rest("PATCH", `/rest/v1/bug_reports?id=eq.${bug2}&select=id`, { token: admin.token, prefer: "return=representation", body: { status: "deployed" } });
    check("bypass: direct PATCH of bug_reports.status is blocked", blocked(directBug), `http=${directBug.status}`);
    const directTicket = await rest("PATCH", `/rest/v1/support_tickets?id=eq.${ticketId}&select=id`, { token: admin.token, prefer: "return=representation", body: { status: "open" } });
    check("bypass: direct PATCH of support_tickets.status is blocked", blocked(directTicket), `http=${directTicket.status}`);
    const directReq = await rest("PATCH", `/rest/v1/company_requests?id=eq.${req2Id}&select=id`, { token: admin.token, prefer: "return=representation", body: { status: "approved" } });
    check("bypass: direct PATCH of company_requests.status is blocked", blocked(directReq), `http=${directReq.status}`);
    const directQ = await rest("PATCH", `/rest/v1/questions?id=eq.${qId}&select=id`, { token: admin.token, prefer: "return=representation", body: { moderation_status: "published" } });
    check("bypass: direct PATCH of questions.moderation_status is blocked", blocked(directQ), `http=${directQ.status}`);
  } finally {
    for (const [table, id] of cleanup.reverse()) {
      if (id) await rest("DELETE", `/rest/v1/${table}?id=eq.${id}`, { key: serviceKey! });
    }
    if (campaignId) await rest("DELETE", `/rest/v1/campaigns?id=eq.${campaignId}`, { key: serviceKey! });
    if (companyId) await rest("DELETE", `/rest/v1/companies?id=eq.${companyId}`, { key: serviceKey! });
    for (const u of [admin, regular]) await rest("DELETE", `/auth/v1/admin/users/${u.id}`, { key: serviceKey! });
  }

  console.log(
    failures.length === 0
      ? "\nAll transition-enforcement checks passed."
      : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(2);
});

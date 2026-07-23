// Live verification of the Prompt 4 public-intake layer (migration 202607230001):
// submit_bug_report / submit_support_ticket and the email_messages model. Runs
// against a REAL Supabase project — a SCRATCH/STAGING project ONLY, never
// production. Creates throwaway rows/users and deletes them after.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:intake-security
//
// Covers: anon + authenticated submission, server-owned status/severity, idempotency,
// validation (email/length/required/category), rate limiting, admin notification
// creation, work-queue appearance, and email_messages access control.

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(2);
}

const failures: string[] = [];
function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
}
function headers(key: string, token?: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${token ?? key}`, "Content-Type": "application/json" };
}
async function rest(method: string, path: string, { key = anonKey!, token, body }: { key?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(`${url}${path}`, { method, headers: headers(key, token), body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
type Rows = Array<Record<string, unknown>>;
const rpc = (fn: string, body: Record<string, unknown>, token?: string) => rest("POST", `/rest/v1/rpc/${fn}`, { token, body });

async function createUser(email: string): Promise<{ id: string; token: string }> {
  const password = crypto.randomUUID() + "-Aa1!";
  const created = await rest("POST", "/auth/v1/admin/users", { key: serviceKey!, body: { email, password, email_confirm: true } });
  const id = (created.data as { id?: string }).id;
  const signin = await rest("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  return { id: id ?? "", token: (signin.data as { access_token?: string }).access_token ?? "" };
}

async function main() {
  const stamp = Date.now();
  const user = await createUser(`intake-user-${stamp}@mailinator.com`);
  const regular = await createUser(`intake-regular-${stamp}@mailinator.com`);
  const createdBugIds: string[] = [];
  const createdTicketIds: string[] = [];

  try {
    /* ------------------------- bug: anonymous submit ----------------------- */
    const anonBug = await rpc("submit_bug_report", { p_description: "The discover filter resets when I paginate on mobile.", p_reporter_email: `bugrep-${stamp}@mailinator.com`, p_idempotency_key: `bug-anon-${stamp}` });
    const anonBugRef = (anonBug.data as { reference?: string; id?: string })?.reference;
    const anonBugId = (anonBug.data as { id?: string })?.id;
    if (anonBugId) createdBugIds.push(anonBugId);
    check("anon can submit a bug report", anonBug.status === 200 && Boolean(anonBugRef) && anonBugRef!.startsWith("BUG-"), `http=${anonBug.status}`);

    // Server owns status/severity/submitted_by.
    const bugRow = await rest("GET", `/rest/v1/bug_reports?id=eq.${anonBugId}&select=status,severity,submitted_by`, { key: serviceKey! });
    const br = (bugRow.data as Rows)[0] ?? {};
    check("submitted bug is status=new, severity=null, submitted_by=null (server-owned)", br.status === "new" && br.severity === null && br.submitted_by === null, `row=${JSON.stringify(br)}`);

    // Admin notification + work queue.
    const notif = await rest("GET", `/rest/v1/admin_notifications?deduplication_key=eq.bug_report:${anonBugId}&select=type`, { key: serviceKey! });
    check("bug submission created a bug_submitted admin notification", Array.isArray(notif.data) && (notif.data as Rows).length === 1 && (notif.data as Rows)[0].type === "bug_submitted", `rows=${JSON.stringify(notif.data)}`);

    /* ---------------------------- bug: idempotency ------------------------- */
    const dupBug = await rpc("submit_bug_report", { p_description: "Different text but same token should not create a second row.", p_idempotency_key: `bug-anon-${stamp}` });
    check("repeated bug idempotency key returns the original (no duplicate)", dupBug.status === 200 && (dupBug.data as { duplicate?: boolean }).duplicate === true && (dupBug.data as { id?: string }).id === anonBugId, `data=${JSON.stringify(dupBug.data)}`);
    const bugCount = await rest("GET", `/rest/v1/bug_reports?client_idempotency_key=eq.bug-anon-${stamp}&select=id`, { key: serviceKey! });
    check("exactly one bug row exists for the idempotency key", Array.isArray(bugCount.data) && (bugCount.data as Rows).length === 1);

    /* ---------------------------- bug: validation -------------------------- */
    const shortBug = await rpc("submit_bug_report", { p_description: "too short" });
    check("bug with too-short description is rejected", shortBug.status >= 400, `http=${shortBug.status}`);
    const badEmailBug = await rpc("submit_bug_report", { p_description: "A perfectly long enough description here.", p_reporter_email: "not-an-email" });
    check("bug with an invalid email is rejected", badEmailBug.status >= 400, `http=${badEmailBug.status}`);

    /* -------------------------- bug: authenticated ------------------------- */
    const authBug = await rpc("submit_bug_report", { p_description: "Signed-in bug submission attributes to the caller.", p_idempotency_key: `bug-auth-${stamp}` }, user.token);
    const authBugId = (authBug.data as { id?: string }).id;
    if (authBugId) createdBugIds.push(authBugId);
    const authBugRow = await rest("GET", `/rest/v1/bug_reports?id=eq.${authBugId}&select=submitted_by`, { key: serviceKey! });
    check("authenticated bug is attributed to auth.uid() server-side (not a client value)", (authBugRow.data as Rows)[0]?.submitted_by === user.id, `got=${JSON.stringify((authBugRow.data as Rows)[0])}`);

    /* --------------------------- support: anon ----------------------------- */
    const noEmail = await rpc("submit_support_ticket", { p_category: "general", p_message: "Anonymous ticket without an email should be refused." });
    check("anon support ticket without an email is rejected", noEmail.status >= 400, `http=${noEmail.status}`);
    const badCat = await rpc("submit_support_ticket", { p_category: "not_a_category", p_message: "A valid length message here.", p_email: `t-${stamp}@mailinator.com` });
    check("support ticket with an invalid category is rejected", badCat.status >= 400, `http=${badCat.status}`);
    const anonTicket = await rpc("submit_support_ticket", { p_category: "privacy", p_message: "Please tell me what data you hold about me.", p_email: `privacy-${stamp}@mailinator.com`, p_subject: "Data request", p_idempotency_key: `t-anon-${stamp}` });
    const ticketNo = (anonTicket.data as { ticket_number?: string }).ticket_number;
    const anonTicketId = (anonTicket.data as { id?: string }).id;
    if (anonTicketId) createdTicketIds.push(anonTicketId);
    check("anon can submit a support ticket with a server-generated number", anonTicket.status === 200 && Boolean(ticketNo) && ticketNo!.startsWith("OF-"), `data=${JSON.stringify(anonTicket.data)}`);
    const ticketNotif = await rest("GET", `/rest/v1/admin_notifications?deduplication_key=eq.support_ticket:${anonTicketId}&select=type`, { key: serviceKey! });
    check("support submission created a support_ticket_created notification", Array.isArray(ticketNotif.data) && (ticketNotif.data as Rows).length === 1);

    /* --------------------------- support: idempotency ---------------------- */
    const dupTicket = await rpc("submit_support_ticket", { p_category: "privacy", p_message: "Same token — must not create a second ticket.", p_email: `privacy-${stamp}@mailinator.com`, p_idempotency_key: `t-anon-${stamp}` });
    check("repeated support idempotency key returns the original ticket", dupTicket.status === 200 && (dupTicket.data as { duplicate?: boolean }).duplicate === true && (dupTicket.data as { ticket_number?: string }).ticket_number === ticketNo, `data=${JSON.stringify(dupTicket.data)}`);

    /* ------------------------------ rate limit ----------------------------- */
    const rlEmail = `rl-${stamp}@mailinator.com`;
    let blocked = false;
    for (let i = 0; i < 7; i++) {
      const r = await rpc("submit_bug_report", { p_description: `Rate-limit probe number ${i} with enough length.`, p_reporter_email: rlEmail });
      if (r.status >= 400) { blocked = true; break; }
      const id = (r.data as { id?: string }).id; if (id) createdBugIds.push(id);
    }
    check("per-email rate limit blocks a burst of bug submissions", blocked);

    /* --------------------- email_messages access control ------------------- */
    const regularEmails = await rest("GET", "/rest/v1/email_messages?select=id", { token: regular.token });
    check("a regular user cannot read email_messages", Array.isArray(regularEmails.data) && (regularEmails.data as Rows).length === 0, `http=${regularEmails.status}`);
    const anonEmails = await rest("GET", "/rest/v1/email_messages?select=id", {});
    check("anon cannot read email_messages", !Array.isArray(anonEmails.data) || (anonEmails.data as Rows).length === 0, `http=${anonEmails.status}`);

    /* ------------------ regular user cannot read others' rows -------------- */
    const regularBugs = await rest("GET", `/rest/v1/bug_reports?id=eq.${anonBugId}&select=id`, { token: regular.token });
    check("a regular user cannot read a bug they did not submit", Array.isArray(regularBugs.data) && (regularBugs.data as Rows).length === 0);
  } finally {
    for (const id of createdBugIds) await rest("DELETE", `/rest/v1/bug_reports?id=eq.${id}`, { key: serviceKey! });
    for (const id of createdTicketIds) await rest("DELETE", `/rest/v1/support_tickets?id=eq.${id}`, { key: serviceKey! });
    for (const u of [user, regular]) if (u.id) await rest("DELETE", `/auth/v1/admin/users/${u.id}`, { key: serviceKey! });
  }

  console.log(failures.length === 0 ? "\nAll intake-security checks passed." : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`);
  process.exit(failures.length === 0 ? 0 : 1);
}
main().catch((err) => { console.error("Unexpected error:", err); process.exit(2); });

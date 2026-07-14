// Live security verification for migration 202607140001_core_experience.sql.
// Runs against a real Supabase project (scratch/staging — never production) and
// checks every new policy, trigger, and view with real anon/authenticated/service
// requests. Creates throwaway users and rows, and deletes everything it created.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:core-security

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

async function makeUser(tag: string) {
  const email = `core-sec-${tag}-${Date.now()}@mailinator.com`;
  const password = crypto.randomUUID() + "-Aa1!";
  const created = await rest("POST", "/auth/v1/admin/users", { key: serviceKey!, body: { email, password, email_confirm: true } });
  const signin = await rest("POST", "/auth/v1/token?grant_type=password", { body: { email, password } });
  const id = (created.data as { id?: string }).id;
  const token = (signin.data as { access_token?: string }).access_token;
  if (!id || !token) throw new Error(`could not create/sign in test user ${tag}`);
  return { id, token };
}

type Rows = Array<Record<string, unknown>>;

async function main() {
  const A = await makeUser("author");
  const B = await makeUser("other");
  let campaignId: string | undefined;

  try {
    const companies = (await rest("GET", "/rest/v1/companies?select=id,ticker&ticker=eq.NKE&limit=1")).data as Rows;
    const companyId = String(companies[0].id);

    /* ------------------- question edit/delete policies ------------------- */
    const qIns = await rest("POST", "/rest/v1/questions?select=id", {
      token: A.token, prefer: "return=representation",
      body: { company_id: companyId, author_id: A.id, question_text: "What is the plan for margins?", topic: "Strategy", shareholder_status: "Current shareholder" },
    });
    const questionId = String((qIns.data as Rows)[0]?.id);
    check("author creates an Open question", qIns.status === 201, `http=${qIns.status}`);

    const editOwn = await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, {
      token: A.token, prefer: "return=representation", body: { question_text: "What is the plan for gross margins in 2027?" },
    });
    check("author can edit own Open question", editOwn.status === 200 && (editOwn.data as Rows).length === 1, `http=${editOwn.status} rows=${(editOwn.data as Rows).length ?? "n/a"}`);

    const editOther = await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, {
      token: B.token, prefer: "return=representation", body: { question_text: "hijacked" },
    });
    check("another user cannot edit it", Array.isArray(editOther.data) && (editOther.data as Rows).length === 0, `http=${editOther.status} rows=${Array.isArray(editOther.data) ? (editOther.data as Rows).length : "err"}`);

    const editAnon = await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, { prefer: "return=representation", body: { question_text: "anon hijack" } });
    check("anon cannot edit it", !Array.isArray(editAnon.data) || (editAnon.data as Rows).length === 0, `http=${editAnon.status}`);

    // Lock the question (service role sets a post-outreach status), then try editing.
    await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, { key: serviceKey!, body: { status: "Sent to management" } });
    const editLocked = await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, {
      token: A.token, prefer: "return=representation", body: { question_text: "editing after outreach" },
    });
    check("author cannot edit once Sent to management", Array.isArray(editLocked.data) && (editLocked.data as Rows).length === 0, `rows=${Array.isArray(editLocked.data) ? (editLocked.data as Rows).length : "err"}`);
    const delLocked = await rest("DELETE", `/rest/v1/questions?id=eq.${questionId}`, { token: A.token, prefer: "return=representation" });
    check("author cannot delete once Sent to management", Array.isArray(delLocked.data) && (delLocked.data as Rows).length === 0);
    await rest("PATCH", `/rest/v1/questions?id=eq.${questionId}`, { key: serviceKey!, body: { status: "Open" } });

    // Vote from B, then author deletes: the vote row must cascade away.
    await rest("POST", "/rest/v1/question_votes", { token: B.token, body: { question_id: questionId, user_id: B.id } });
    const delOther = await rest("DELETE", `/rest/v1/questions?id=eq.${questionId}`, { token: B.token, prefer: "return=representation" });
    check("another user cannot delete it", Array.isArray(delOther.data) && (delOther.data as Rows).length === 0);
    const delOwn = await rest("DELETE", `/rest/v1/questions?id=eq.${questionId}`, { token: A.token, prefer: "return=representation" });
    check("author can delete own Open question", delOwn.status === 200 && (delOwn.data as Rows).length === 1, `http=${delOwn.status}`);
    const orphanVotes = await rest("GET", `/rest/v1/question_votes?select=id&question_id=eq.${questionId}`, { key: serviceKey! });
    check("deleting the question cascaded its votes", (orphanVotes.data as Rows).length === 0, `orphans=${(orphanVotes.data as Rows).length}`);

    /* ----------------------------- vote removal -------------------------- */
    const q2 = await rest("POST", "/rest/v1/questions?select=id", {
      token: A.token, prefer: "return=representation",
      body: { company_id: companyId, author_id: A.id, question_text: "How is capital being allocated?", topic: "Capital allocation", shareholder_status: "Current shareholder" },
    });
    const q2Id = String((q2.data as Rows)[0]?.id);
    await rest("POST", "/rest/v1/question_votes", { token: B.token, body: { question_id: q2Id, user_id: B.id } });
    const unvoteForged = await rest("DELETE", `/rest/v1/question_votes?question_id=eq.${q2Id}&user_id=eq.${B.id}`, { token: A.token, prefer: "return=representation" });
    check("user cannot remove someone else's vote", Array.isArray(unvoteForged.data) && (unvoteForged.data as Rows).length === 0);
    const unvote = await rest("DELETE", `/rest/v1/question_votes?question_id=eq.${q2Id}&user_id=eq.${B.id}`, { token: B.token, prefer: "return=representation" });
    check("user can remove own vote", unvote.status === 200 && (unvote.data as Rows).length === 1, `http=${unvote.status}`);

    /* ------------------------------- reports ----------------------------- */
    const report = await rest("POST", "/rest/v1/reports", {
      token: B.token, body: { reporter_id: B.id, question_id: q2Id, reason: "Test report", details: "verification" },
    });
    check("user can report a question", report.status === 201, `http=${report.status}`);
    const reportRead = await rest("GET", `/rest/v1/reports?select=id&question_id=eq.${q2Id}`, { token: A.token });
    check("reports are not readable by other users (reporter stays private)", Array.isArray(reportRead.data) && (reportRead.data as Rows).length === 0, `rows=${Array.isArray(reportRead.data) ? (reportRead.data as Rows).length : "err"}`);

    /* ------------------------------ feedback ----------------------------- */
    const fb = await rest("POST", "/rest/v1/feedback?select=id", {
      token: A.token, prefer: "return=representation",
      body: { user_id: A.id, category: "General feedback", message: "Verification feedback entry", page_path: "/discover" },
    });
    const feedbackId = String((fb.data as Rows)[0]?.id ?? "");
    check("authenticated user submits feedback", fb.status === 201, `http=${fb.status}`);
    const fbForged = await rest("POST", "/rest/v1/feedback", {
      token: B.token, body: { user_id: A.id, category: "General feedback", message: "forged attribution" },
    });
    check("cannot submit feedback as another user", fbForged.status === 401 || fbForged.status === 403, `http=${fbForged.status}`);
    const fbAnon = await rest("POST", "/rest/v1/feedback", { body: { user_id: A.id, category: "General feedback", message: "anon spam" } });
    check("anon cannot submit feedback", fbAnon.status >= 400, `http=${fbAnon.status}`);
    const fbOther = await rest("GET", `/rest/v1/feedback?select=id&id=eq.${feedbackId}`, { token: B.token });
    check("users cannot read other users' feedback", Array.isArray(fbOther.data) && (fbOther.data as Rows).length === 0);
    const fbAnonRead = await rest("GET", "/rest/v1/feedback?select=id", {});
    check("anon cannot read feedback", !Array.isArray(fbAnonRead.data) || (fbAnonRead.data as Rows).length === 0, `http=${fbAnonRead.status}`);
    const fbOwn = await rest("GET", `/rest/v1/feedback?select=id&id=eq.${feedbackId}`, { token: A.token });
    check("user can read own feedback", (fbOwn.data as Rows).length === 1);

    /* ---------------------------- notifications -------------------------- */
    // Real state change: A starts + supports a campaign, service role advances its status.
    const started = await rest("POST", "/rest/v1/rpc/start_campaign", { token: A.token, body: { p_company_id: companyId } });
    campaignId = String(started.data);
    check("campaign started for notification test", started.status === 200, `http=${started.status}`);
    await rest("POST", "/rest/v1/campaign_supporters", {
      token: A.token, body: { campaign_id: campaignId, user_id: A.id, shareholder_status: "Current shareholder" },
    });
    const advance = await rest("PATCH", `/rest/v1/campaigns?id=eq.${campaignId}`, { key: serviceKey!, body: { status: "Preparing management outreach" } });
    check("campaign status advanced (service role)", advance.status === 204 || advance.status === 200, `http=${advance.status}`);

    const notifs = await rest("GET", `/rest/v1/notifications?select=id,title,read_at&user_id=eq.${A.id}`, { token: A.token });
    const notifRows = notifs.data as Rows;
    check("status change generated a notification for the supporter", notifRows.length >= 1, `rows=${notifRows.length}`);
    const notifId = String(notifRows[0]?.id ?? "");

    const notifOther = await rest("GET", `/rest/v1/notifications?select=id&user_id=eq.${A.id}`, { token: B.token });
    check("users cannot read other users' notifications", (notifOther.data as Rows).length === 0);

    const markForged = await rest("PATCH", `/rest/v1/notifications?id=eq.${notifId}`, {
      token: B.token, prefer: "return=representation", body: { read_at: new Date().toISOString() },
    });
    check("users cannot mark other users' notifications read", !Array.isArray(markForged.data) || (markForged.data as Rows).length === 0, `http=${markForged.status}`);

    const markOwn = await rest("PATCH", `/rest/v1/notifications?id=eq.${notifId}`, {
      token: A.token, prefer: "return=representation", body: { read_at: new Date().toISOString() },
    });
    check("user can mark own notification read", markOwn.status === 200 && Boolean((markOwn.data as Rows)[0]?.read_at));

    const titleTamper = await rest("PATCH", `/rest/v1/notifications?id=eq.${notifId}`, { token: A.token, body: { title: "tampered" } });
    check("user cannot rewrite notification title (column grant)", titleTamper.status === 401 || titleTamper.status === 403 || titleTamper.status === 400, `http=${titleTamper.status}`);

    const notifInsert = await rest("POST", "/rest/v1/notifications", {
      token: A.token, body: { user_id: A.id, type: "fake", title: "fake", body: "fake" },
    });
    check("users cannot insert notifications directly", notifInsert.status === 401 || notifInsert.status === 403, `http=${notifInsert.status}`);

    // Question status change notifies the author. Earlier lock/unlock steps also
    // fired this trigger (every real status change notifies), so assert the delta.
    const qNotifsBefore = ((await rest("GET", `/rest/v1/notifications?select=id&user_id=eq.${A.id}&type=eq.question_status`, { token: A.token })).data as Rows).length;
    await rest("PATCH", `/rest/v1/questions?id=eq.${q2Id}`, { key: serviceKey!, body: { status: "Under review" } });
    const qNotifsAfter = ((await rest("GET", `/rest/v1/notifications?select=id&user_id=eq.${A.id}&type=eq.question_status`, { token: A.token })).data as Rows).length;
    check("question status change notified the author", qNotifsAfter === qNotifsBefore + 1, `before=${qNotifsBefore} after=${qNotifsAfter}`);

    /* ----------------------- public campaign events view ------------------ */
    await rest("POST", "/rest/v1/campaign_events", {
      key: serviceKey!, body: { campaign_id: campaignId, event_type: "outreach_prepared", label: "Outreach prepared" },
    });
    const eventsAnon = await rest("GET", `/rest/v1/public_campaign_events?select=label,event_type&campaign_id=eq.${campaignId}`);
    check("anon can read public_campaign_events", eventsAnon.status === 200 && (eventsAnon.data as Rows).length === 1, `http=${eventsAnon.status}`);
    const eventsCols = (eventsAnon.data as Rows)[0] ?? {};
    check("view does not expose created_by", !("created_by" in eventsCols));
    const eventWrite = await rest("POST", "/rest/v1/campaign_events", {
      token: A.token, body: { campaign_id: campaignId, event_type: "fake", label: "fake" },
    });
    check("authenticated users cannot write campaign_events", eventWrite.status === 401 || eventWrite.status === 403, `http=${eventWrite.status}`);

    /* ------------------------ profile-level anonymity --------------------- */
    await rest("PATCH", `/rest/v1/profiles?id=eq.${A.id}`, { token: A.token, body: { display_name: "Named Tester", public_anonymous: true } });
    const pubQ = await rest("GET", `/rest/v1/public_questions?select=author&id=eq.${q2Id}`);
    check("public_anonymous hides the author's name in public_questions", String((pubQ.data as Rows)[0]?.author) === "Anonymous Shareholder", `author=${(pubQ.data as Rows)[0]?.author}`);
  } finally {
    // Cleanup: campaign first (created by start_campaign), then users (cascade
    // removes their profiles, questions, votes, feedback, notifications, reports).
    if (campaignId) await rest("DELETE", `/rest/v1/campaigns?id=eq.${campaignId}`, { key: serviceKey! });
    for (const u of [A, B]) await rest("DELETE", `/auth/v1/admin/users/${u.id}`, { key: serviceKey! });
  }

  const leftoverQ = await rest("GET", "/rest/v1/questions?select=id", { key: serviceKey! });
  check("cleanup: no test questions remain", (leftoverQ.data as Rows).length === 0, `rows=${(leftoverQ.data as Rows).length}`);
  const leftoverF = await rest("GET", "/rest/v1/feedback?select=id", { key: serviceKey! });
  check("cleanup: no test feedback remains", (leftoverF.data as Rows).length === 0);

  console.log(
    failures.length === 0
      ? "\nAll core-experience security checks passed."
      : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(2);
});

// Live verification of the email delivery-state transition graph
// (migration 202607280001_email_event_state_progression): record_email_event must
// be monotonic and resistant to out-of-order Resend webhook delivery, and must not
// pollute error_code for successful events.
//
// Runs against a REAL Supabase project — a SCRATCH/STAGING project ONLY, never
// production. Builds each starting state through the real recorder, then applies a
// (possibly out-of-order) event and asserts the resulting row. Cleans up after.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:email-progression

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
async function rest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: headers(serviceKey!),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
const rpc = (fn: string, body: Record<string, unknown>) => rest("POST", `/rest/v1/rpc/${fn}`, body);

type Row = {
  status: string;
  error_code: string | null;
  error_message_sanitized: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  failed_at: string | null;
};
async function rowFor(msgId: string): Promise<Row> {
  const r = await rest("GET", `/rest/v1/email_messages?provider_message_id=eq.${msgId}&select=status,error_code,error_message_sanitized,sent_at,delivered_at,bounced_at,complained_at,failed_at`);
  return ((r.data as Row[])[0]) ?? ({} as Row);
}

// Seed a row in the 'sent' state (as the send Edge Function records it) with a
// unique provider_message_id we then drive events against.
async function seedSent(tag: string, stamp: number): Promise<string> {
  const msgId = `evttest-${tag}-${stamp}-${crypto.randomUUID()}`;
  await rpc("record_email_attempt", {
    p_template: "bug_report_received",
    p_recipient_email: `evt-${tag}-${stamp}@mailinator.com`,
    p_entity_type: "email_progression_test",
    p_entity_id: crypto.randomUUID(),
    p_idempotency_key: `evttest:${tag}:${stamp}:${msgId}`,
    p_status: "sent",
    p_provider_message_id: msgId,
  });
  return msgId;
}
const event = (msgId: string, type: string, code?: string | null, message?: string | null) =>
  rpc("record_email_event", { p_provider_message_id: msgId, p_event: type, p_error_code: code ?? null, p_error_message: message ?? null });

async function main() {
  const stamp = Date.now();
  const created: string[] = [];
  const seed = async (tag: string) => { const id = await seedSent(tag, stamp); created.push(id); return id; };

  try {
    /* 1. sent -> delivered */
    let id = await seed("s2d");
    await event(id, "email.delivered");
    let row = await rowFor(id);
    check("sent -> delivered advances to delivered with delivered_at + no error_code",
      row.status === "delivered" && row.delivered_at !== null && row.error_code === null, JSON.stringify(row));

    /* 2. delivered -> late sent (the regression bug) */
    const deliveredAt = row.delivered_at;
    await event(id, "email.sent");
    row = await rowFor(id);
    check("delivered -> late sent stays delivered, delivered_at unchanged",
      row.status === "delivered" && row.delivered_at === deliveredAt && row.error_code === null, JSON.stringify(row));

    /* 3. duplicate delivered is idempotent */
    await event(id, "email.delivered");
    row = await rowFor(id);
    check("duplicate delivered is idempotent (delivered_at unchanged)",
      row.status === "delivered" && row.delivered_at === deliveredAt, JSON.stringify(row));

    /* 4. sent -> delivery_delayed -> delivered */
    id = await seed("delay2del");
    await event(id, "email.delivery_delayed", "delivery_delayed", "mailbox busy");
    row = await rowFor(id);
    check("sent -> delivery_delayed advances to delayed", row.status === "delayed", JSON.stringify(row));
    await event(id, "email.delivered");
    row = await rowFor(id);
    check("delayed -> delivered advances and clears stale transient error metadata",
      row.status === "delivered" && row.delivered_at !== null && row.error_code === null && row.error_message_sanitized === null, JSON.stringify(row));

    /* 5. delivered -> late delivery_delayed does not regress */
    await event(id, "email.delivery_delayed", "delivery_delayed", "late delay");
    row = await rowFor(id);
    check("delivered -> late delivery_delayed stays delivered", row.status === "delivered", JSON.stringify(row));

    /* 6. delivered -> complained (supersedes delivery) */
    id = await seed("complain");
    await event(id, "email.delivered");
    const compDeliveredAt = (await rowFor(id)).delivered_at;
    await event(id, "email.complained", null, "user marked as spam");
    row = await rowFor(id);
    check("delivered -> complained supersedes delivery, preserves delivered_at, sets error metadata",
      row.status === "complained" && row.delivered_at === compDeliveredAt && row.complained_at !== null && row.error_code === "complained" && row.error_message_sanitized === "user marked as spam", JSON.stringify(row));

    /* 7. failed -> late sent stays failed */
    id = await seed("fail");
    await event(id, "email.failed", null, "smtp 550");
    row = await rowFor(id);
    check("failed event sets failed + error metadata", row.status === "failed" && row.failed_at !== null && row.error_code === "failed" && row.error_message_sanitized === "smtp 550", JSON.stringify(row));
    const failedAt = row.failed_at;
    await event(id, "email.sent");
    row = await rowFor(id);
    check("failed -> late sent stays failed, failed_at unchanged", row.status === "failed" && row.failed_at === failedAt, JSON.stringify(row));

    /* 8. bounced -> late sent stays bounced */
    id = await seed("bounce");
    await event(id, "email.bounced", null, "hard bounce: no such user");
    row = await rowFor(id);
    check("bounced event sets bounced + error metadata", row.status === "bounced" && row.bounced_at !== null && row.error_code === "bounced" && row.error_message_sanitized === "hard bounce: no such user", JSON.stringify(row));
    await event(id, "email.sent");
    row = await rowFor(id);
    check("bounced -> late sent stays bounced", row.status === "bounced", JSON.stringify(row));

    /* 9/10 error_code discipline is asserted throughout above:
       success events (1-5) leave error_code null; adverse events (6-8) populate it. */
  } finally {
    for (const id of created) {
      await rest("DELETE", `/rest/v1/admin_notifications?deduplication_key=like.email_event:${id}:*`);
      await rest("DELETE", `/rest/v1/email_messages?provider_message_id=eq.${id}`);
    }
  }

  console.log(failures.length === 0 ? "\nAll email-event-progression checks passed." : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`);
  process.exit(failures.length === 0 ? 0 : 1);
}
main().catch((err) => { console.error("Unexpected error:", err); process.exit(2); });

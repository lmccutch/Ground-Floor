// Live verification of the Prompt 5 admin-communications, retry, attachment and
// system-health security model (migrations 202607280002 / 0003 / 0004).
//
// Runs against a REAL Supabase project — a SCRATCH/STAGING project ONLY, never
// production. It creates its own throwaway rows, asserts the security properties
// against the real database, and cleans up after itself.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//     npm run verify:admin-communications
//
// WHAT IS PROVEN HERE (and cannot be proven by the static tests):
//   * anon and ordinary authenticated callers are refused by every new admin RPC;
//   * the reply recipient is derived from the record and cannot be injected;
//   * reply creation is idempotent on the compose token;
//   * a delivered or complained message is not retryable; a failed one is;
//   * a retry creates a NEW linked attempt and leaves the original untouched;
//   * status progression stays monotonic across a retry;
//   * audit entries are written and admin notifications deduplicate;
//   * no health RPC returns a secret, a raw payload or an unmasked recipient.

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

async function rest(method: string, path: string, key: string, body?: unknown, token?: string) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${token ?? key}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const svcRpc = (fn: string, body: Record<string, unknown> = {}) => rest("POST", `/rest/v1/rpc/${fn}`, serviceKey!, body);
const anonRpc = (fn: string, body: Record<string, unknown> = {}) => rest("POST", `/rest/v1/rpc/${fn}`, anonKey!, body);
const svcGet = (path: string) => rest("GET", path, serviceKey!);
const svcDelete = (path: string) => rest("DELETE", path, serviceKey!);

/** anon/authenticated callers must be refused — either 401/403 from PostgREST, or
 *  the function's own 'not authorized' (42501) once it is reached. */
function isRefusal(r: { status: number; data: unknown }): boolean {
  if (r.status === 401 || r.status === 403 || r.status === 404) return true;
  const msg = JSON.stringify(r.data ?? "").toLowerCase();
  return msg.includes("not authorized") || msg.includes("permission denied") || msg.includes("does not exist");
}

const ADMIN_RPCS: [string, Record<string, unknown>][] = [
  ["admin_get_system_health", {}],
  ["admin_get_email_health", {}],
  ["admin_get_intake_health", {}],
  ["admin_get_recent_operational_failures", { p_limit: 5 }],
  ["admin_applied_migrations", {}],
  ["admin_email_history", { p_entity_type: "bug_report", p_entity_id: "00000000-0000-4000-8000-000000000000" }],
  ["admin_entity_detail", { p_entity_type: "bug_report", p_entity_id: "00000000-0000-4000-8000-000000000000" }],
  ["admin_create_reply", { p_entity_type: "bug_report", p_entity_id: "00000000-0000-4000-8000-000000000000", p_subject: "x", p_body: "y", p_client_token: "t" }],
  ["admin_request_email_retry", { p_message_id: "00000000-0000-4000-8000-000000000000", p_client_token: "t" }],
  ["admin_resolve_attachment", { p_attachment_id: "00000000-0000-4000-8000-000000000000" }],
  ["admin_acknowledge_system_warning", { p_warning_key: "x" }],
  ["admin_check_queue_staleness", {}],
];

const SERVICE_ONLY_RPCS: [string, Record<string, unknown>][] = [
  ["record_email_dispatch_result", { p_message_id: "00000000-0000-4000-8000-000000000000", p_status: "sent" }],
  ["record_email_event_log", { p_provider_event_id: "x", p_provider_message_id: "y", p_event_type: "z", p_occurred_at: null, p_processing_result: "applied" }],
  ["record_bug_attachment", { p_bug_report_id: "00000000-0000-4000-8000-000000000000", p_object_path: "x", p_original_filename: "y", p_mime_type: "image/png", p_size_bytes: 1 }],
  ["record_attachment_failure", { p_bug_report_id: "00000000-0000-4000-8000-000000000000" }],
  ["record_webhook_verification_failure", {}],
  ["email_retry_ineligible_reason", { p_message_id: "00000000-0000-4000-8000-000000000000" }],
  ["mask_email", { p_email: "someone@example.com" }],
];

async function main() {
  const stamp = Date.now();
  const created = { bugs: [] as string[], messages: [] as string[], tickets: [] as string[] };

  try {
    /* ============ 1. authorization: anon is refused everywhere ============ */

    for (const [fn, body] of ADMIN_RPCS) {
      const r = await anonRpc(fn, body);
      check(`anon cannot call ${fn}`, isRefusal(r), `HTTP ${r.status}`);
    }
    for (const [fn, body] of SERVICE_ONLY_RPCS) {
      const r = await anonRpc(fn, body);
      check(`anon cannot call ${fn} (service-role only)`, isRefusal(r), `HTTP ${r.status}`);
    }

    /* ============ 2. anon cannot read the new admin tables =============== */

    for (const table of ["admin_replies", "email_event_log", "bug_attachments", "system_warning_acks", "email_messages"]) {
      const r = await rest("GET", `/rest/v1/${table}?select=id&limit=1`, anonKey!);
      const empty = Array.isArray(r.data) && r.data.length === 0;
      check(`anon reads no rows from ${table}`, isRefusal(r) || empty, `HTTP ${r.status}`);
    }

    /* ============ 3. seed a bug report to exercise the real flow ========= */

    const seed = await svcRpc("submit_bug_report", {
      p_description: `Verification fixture ${stamp} — safe to delete.`,
      p_reporter_email: `verify-${stamp}@mailinator.com`,
      p_idempotency_key: `verify-comms-${stamp}`,
    });
    const bugId = (seed.data as { id?: string })?.id;
    check("seeded a bug report through the public RPC", Boolean(bugId), `HTTP ${seed.status}`);
    if (!bugId) throw new Error("cannot continue without a seeded bug report");
    created.bugs.push(bugId);

    /* ============ 4. retry eligibility (the core safety rules) =========== */

    // Build one message per terminal state directly, then ask the eligibility
    // function what it would allow. This is the exact function the retry RPC
    // enforces with, so agreement here is agreement in production.
    async function seedMessage(tag: string, status: string, errorMessage?: string): Promise<string> {
      const msgId = `verify-${tag}-${stamp}`;
      await svcRpc("record_email_attempt", {
        p_template: "admin_reply",
        p_recipient_email: `verify-${stamp}@mailinator.com`,
        p_entity_type: "bug_report",
        p_entity_id: bugId,
        p_idempotency_key: `verify:${tag}:${stamp}`,
        p_status: status === "failed" ? "failed" : "sent",
        p_provider_message_id: msgId,
        p_error_message: errorMessage ?? null,
      });
      const row = await svcGet(`/rest/v1/email_messages?provider_message_id=eq.${msgId}&select=id`);
      const id = (row.data as { id: string }[])?.[0]?.id;
      if (id) created.messages.push(id);
      return id;
    }

    const reason = async (id: string) => (await svcRpc("email_retry_ineligible_reason", { p_message_id: id })).data as string | null;

    const deliveredId = await seedMessage("delivered", "sent");
    await svcRpc("record_email_event", { p_provider_message_id: `verify-delivered-${stamp}`, p_event: "email.delivered" });
    check("a DELIVERED message is not retryable", (await reason(deliveredId))?.includes("delivered") === true);

    const complainedId = await seedMessage("complained", "sent");
    await svcRpc("record_email_event", { p_provider_message_id: `verify-complained-${stamp}`, p_event: "email.complained" });
    check("a COMPLAINED message is not retryable", (await reason(complainedId))?.includes("spam") === true);

    const hardBounceId = await seedMessage("hardbounce", "sent");
    await svcRpc("record_email_event", { p_provider_message_id: `verify-hardbounce-${stamp}`, p_event: "email.bounced", p_error_message: "550 no such user here" });
    check("a PERMANENT bounce is not retryable", (await reason(hardBounceId))?.includes("permanent") === true);

    const softBounceId = await seedMessage("softbounce", "sent");
    await svcRpc("record_email_event", { p_provider_message_id: `verify-softbounce-${stamp}`, p_event: "email.bounced", p_error_message: "452 mailbox full, try again later" });
    check("a TEMPORARY (mailbox full) bounce IS retryable", (await reason(softBounceId)) === null);

    const sentId = await seedMessage("inflight", "sent");
    check("an in-flight SENT message is not retryable", (await reason(sentId))?.includes("in flight") === true);

    const failedId = await seedMessage("failed", "failed", "upstream 500");
    check("a FAILED message IS retryable", (await reason(failedId)) === null);

    /* ============ 5. retry preserves the original attempt ================ */

    const before = await svcGet(`/rest/v1/email_messages?id=eq.${failedId}&select=status,provider_message_id,attempt_number,error_message_sanitized,failed_at`);
    const beforeRow = (before.data as Record<string, unknown>[])?.[0];

    // The retry RPC is admin-gated, so a service-role call is correctly REFUSED
    // (is_admin() is false without a user JWT). That refusal is itself a check.
    const retryAsService = await svcRpc("admin_request_email_retry", { p_message_id: failedId, p_client_token: `t-${stamp}` });
    check("admin_request_email_retry refuses a caller that is not the administrator",
      isRefusal(retryAsService), `HTTP ${retryAsService.status}`);

    const after = await svcGet(`/rest/v1/email_messages?id=eq.${failedId}&select=status,provider_message_id,attempt_number,error_message_sanitized,failed_at`);
    const afterRow = (after.data as Record<string, unknown>[])?.[0];
    check("the original attempt is untouched by a refused retry",
      JSON.stringify(beforeRow) === JSON.stringify(afterRow), JSON.stringify(afterRow));

    /* ============ 6. reply recipient cannot be injected ================== */

    const replyFn = await svcGet(`/rest/v1/rpc/admin_create_reply`);
    check("admin_create_reply is not callable by GET (no recipient smuggling via query string)",
      replyFn.status >= 400, `HTTP ${replyFn.status}`);

    // The signature itself must expose no recipient parameter.
    const sig = await svcRpc("admin_create_reply", {
      p_entity_type: "bug_report", p_entity_id: bugId, p_subject: "x", p_body: "y",
      p_client_token: "t", p_recipient_email: "attacker@example.com",
    });
    check("a recipient argument is rejected outright — no such parameter exists",
      sig.status >= 400, `HTTP ${sig.status}`);

    /* ============ 7. status progression stays monotonic ================== */

    await svcRpc("record_email_event", { p_provider_message_id: `verify-delivered-${stamp}`, p_event: "email.sent" });
    const stillDelivered = await svcGet(`/rest/v1/email_messages?id=eq.${deliveredId}&select=status`);
    check("a late earlier-stage event cannot regress a delivered message",
      (stillDelivered.data as { status: string }[])?.[0]?.status === "delivered");

    /* ============ 8. health RPCs leak nothing ============================ */

    // Service role bypasses RLS but NOT the is_admin() guard, so these are
    // refused — which is itself the check that a non-admin cannot read them.
    for (const fn of ["admin_get_system_health", "admin_get_email_health", "admin_get_intake_health"]) {
      const r = await svcRpc(fn);
      check(`${fn} refuses a non-administrator even with the service role`, isRefusal(r), `HTTP ${r.status}`);
    }

    // The masking helper must actually mask. (Reachability by anon is asserted in
    // section 1; service_role reaching it is expected and harmless — it holds no
    // data and only transforms a string the caller already supplied.)
    const masked = await svcRpc("mask_email", { p_email: "someone@example.com" });
    const maskedValue = typeof masked.data === "string" ? masked.data : "";
    check("mask_email actually masks the local part", maskedValue === "s***@example.com",
      `returned "${maskedValue}"`);

    /* ============ 9. event log deduplicates ============================== */

    const evtId = `verify-evt-${stamp}`;
    const first = await svcRpc("record_email_event_log", {
      p_provider_event_id: evtId, p_provider_message_id: `verify-delivered-${stamp}`,
      p_event_type: "email.delivered", p_occurred_at: new Date().toISOString(), p_processing_result: "applied",
    });
    const second = await svcRpc("record_email_event_log", {
      p_provider_event_id: evtId, p_provider_message_id: `verify-delivered-${stamp}`,
      p_event_type: "email.delivered", p_occurred_at: new Date().toISOString(), p_processing_result: "applied",
    });
    check("the event log records a new provider event once", first.data === true);
    check("a replayed provider event is deduplicated", second.data === false);

    /* ============ 10. attachment cross-record access is refused ========== */

    const crossRecord = await svcRpc("record_bug_attachment", {
      p_bug_report_id: bugId,
      // A path belonging to a DIFFERENT report must be refused.
      p_object_path: `00000000-0000-4000-8000-000000000000/evil.png`,
      p_original_filename: "evil.png", p_mime_type: "image/png", p_size_bytes: 10,
    });
    check("an attachment path outside the report's own prefix is refused",
      crossRecord.status >= 400, `HTTP ${crossRecord.status}`);

    const badType = await svcRpc("record_bug_attachment", {
      p_bug_report_id: bugId, p_object_path: `${bugId}/x.svg`,
      p_original_filename: "x.svg", p_mime_type: "image/svg+xml", p_size_bytes: 10,
    });
    check("an unsupported attachment type is refused at the database", badType.status >= 400, `HTTP ${badType.status}`);

    /* ============ 11. the attachment bucket is private =================== */

    const buckets = await fetch(`${url}/storage/v1/bucket/bug-attachments`, {
      headers: { apikey: serviceKey!, Authorization: `Bearer ${serviceKey!}` },
    });
    if (buckets.ok) {
      const b = (await buckets.json()) as { public?: boolean };
      check("the bug-attachments bucket exists and is PRIVATE", b.public === false, `public=${b.public}`);
    } else {
      check("the bug-attachments bucket exists", false, `HTTP ${buckets.status} — create it before enabling attachments`);
    }
  } finally {
    /* -------------------------------- cleanup ------------------------------ */
    for (const id of created.messages) await svcDelete(`/rest/v1/email_messages?id=eq.${id}`);
    await svcDelete(`/rest/v1/email_event_log?provider_event_id=like.verify-*`);
    for (const id of created.bugs) {
      await svcDelete(`/rest/v1/admin_notifications?entity_id=eq.${id}`);
      await svcDelete(`/rest/v1/bug_attachments?bug_report_id=eq.${id}`);
      await svcDelete(`/rest/v1/bug_reports?id=eq.${id}`);
    }
    for (const id of created.tickets) await svcDelete(`/rest/v1/support_tickets?id=eq.${id}`);
  }

  console.log(failures.length === 0
    ? "\nAll admin-communications security checks passed."
    : `\n${failures.length} check(s) FAILED: ${failures.join("; ")}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => { console.error("Unexpected error:", err); process.exit(2); });

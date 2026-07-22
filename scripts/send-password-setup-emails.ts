// One-time migration: email every existing user a password-reset link so they can
// set a password before magic-link login is retired. Recovery links reset a
// password — they are NOT passwordless login — so nobody is stranded and no
// passwordless login survives. Existing accounts, usernames, and profiles are
// untouched (same auth.users UUIDs).
//
// Safe to run repeatedly. Prints counts only — never emails, tokens, or links.
//
// Usage (run AFTER the frontend with /reset-password is deployed and the Supabase
// redirect allow-list includes <site>/reset-password):
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//   SITE_URL=https://www.open-floor.ca \
//     npx tsx scripts/send-password-setup-emails.ts [--dry-run] [--limit N] [--all] [--sleep-ms 1500]
//
// Notes:
//   * Defaults to confirmed accounts only (existing magic-link users are already
//     confirmed). Pass --all to also include never-confirmed signups.
//   * Supabase/GoTrue rate-limits recovery emails. The script throttles and backs
//     off on 429. For a large user base, prefer custom SMTP (Resend) so the hourly
//     cap is high enough; see docs/authentication.md.

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.SITE_URL || "https://www.open-floor.ca";

if (!url || !anonKey || !serviceKey) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(2);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const includeUnconfirmed = args.includes("--all");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const sleepArg = args.indexOf("--sleep-ms");
const sleepMs = sleepArg >= 0 ? Number(args[sleepArg + 1]) : 1500;
const redirectTo = `${siteUrl.replace(/\/$/, "")}/reset-password`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type AuthUser = { id: string; email?: string; email_confirmed_at?: string | null };

async function listAllUsers(): Promise<AuthUser[]> {
  const out: AuthUser[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: { apikey: serviceKey!, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) throw new Error(`admin list users failed: ${res.status}`);
    const body = (await res.json()) as { users?: AuthUser[] };
    const users = body.users ?? [];
    out.push(...users);
    if (users.length < 1000) break;
  }
  return out;
}

async function sendRecovery(email: string): Promise<number> {
  const res = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: { apikey: anonKey!, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.status;
}

async function main() {
  const all = await listAllUsers();
  const targets = all.filter((u) => u.email && (includeUnconfirmed || u.email_confirmed_at));
  console.log(
    `Found ${all.length} users; ${targets.length} eligible (${includeUnconfirmed ? "all" : "confirmed only"}). ` +
      `Redirect: ${redirectTo}. ${dryRun ? "DRY RUN — nothing sent." : ""}`,
  );

  let sent = 0;
  let failed = 0;
  let processed = 0;
  for (const user of targets) {
    if (processed >= limit) break;
    processed++;
    if (dryRun) continue;

    let status = await sendRecovery(user.email!);
    if (status === 429) {
      await sleep(Math.max(sleepMs * 4, 6000)); // back off and retry once
      status = await sendRecovery(user.email!);
    }
    if (status >= 200 && status < 300) sent++;
    else {
      failed++;
      console.warn(`[${processed}/${targets.length}] send failed (http ${status})`);
    }
    await sleep(sleepMs);
  }

  console.log(`Done. processed=${processed} sent=${sent} failed=${failed} dryRun=${dryRun}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err instanceof Error ? err.message : err);
  process.exit(2);
});

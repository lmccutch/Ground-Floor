# Trust and transparency layer

What the trust/legal layer actually contains, how it's operated, and what
still requires professional review. Built entirely with the existing router
and design system; no schema changes were needed.

## Pages implemented

All reachable from the site footer, listed in `sitemap.xml`, with unique
titles, meta descriptions, and canonical URLs (`src/lib/meta.ts`):

| Route | Page | Notes |
|---|---|---|
| `/about` | About | What GroundFloor is and, explicitly, what it is not. |
| `/how-it-works` | How It Works | The real 8-step process, including decline/non-response handling. |
| `/faq` | FAQ | 21 questions; features that don't exist are stated plainly as not existing. |
| `/guidelines` | Community Guidelines | Full prohibited-content list; MNPI section; enforcement rules. |
| `/voting-rules` | Voting Rules | Matches the implementation exactly (one vote, removable, top/newest/unanswered, merge policy). |
| `/transparency` | Transparency | Every number explained; conflicts-of-interest section; interview handling labelled as intended policy. |
| `/moderation` | Moderation Policy | Connected to the real report flow; documents the no-dashboard operation below. |
| `/contact` | Contact | Six mailto enquiry types; no fake form. |
| `/privacy` | Privacy Policy | **Draft** — carries the review notice. |
| `/terms` | Terms of Use | **Draft** — carries the review notice; governing law is a labelled placeholder. |
| `/disclaimer` | Investment Disclaimer | **Draft** notice; all nine required statements. |

The conflict-of-interest policy is a section of the Transparency page rather
than a separate route (permitted by the requirements; keeps the footer sane).

## Contact method

`src/lib/contact.ts`: the public address comes from `VITE_CONTACT_EMAIL`,
falling back to `contact@groundfloor.example` — an RFC 2606 reserved domain
that is unmistakably a placeholder (and flagged as such on the Contact page
when active). Mailto links carry typed subjects (general, IR, press,
legal/privacy, moderation appeal, security, account deletion, data access) so
one inbox can triage. **Set `VITE_CONTACT_EMAIL` before launch** — added to
`.env.example` and the production checklist.

## Reporting categories

`src/lib/reporting.ts` is the single source of truth, used by both the report
modal and the Moderation Policy page: spam/promotion, abusive/harassing,
manipulation/coordinated abuse, duplicate question, misinformation/unsupported
allegation, personal information, confidential or material non-public
information, other. `reports.reason` is free text in the schema, so this
needed no migration and existing RLS is unchanged (verified by the existing
`verify:core-security` checks: reporter privacy, anon/user read denial).
Reporting never auto-removes content.

## MNPI protections

Warnings appear in four places: the Community Guidelines (dedicated section),
the question form (visible `mnpi-warning` note above the submit button, linking
to the guidelines), the Transparency page, and the Terms. The consistent
message: don't post it, it will be removed on suspicion, use legal/compliance
channels, and GroundFloor does not advise on materiality.

## Moderation operations (deliberately minimal)

No moderation dashboard was built. Operating procedure:

1. Reports land in the `reports` table (admin-read-only via `is_admin()`).
2. Review happens via direct administrative access (Supabase dashboard/SQL).
3. Actions — edit for clarity, merge duplicates, archive, status changes —
   are applied the same way; question status changes automatically notify the
   author (existing trigger).
4. Appeals arrive by email (`moderation-appeal` subject).
5. Records of removed content are preserved where evidence is needed.

Revisit when report volume makes SQL review impractical.

## Account and data controls (current state)

- Edit profile (name, country, investor type, anonymity): self-service on the
  dashboard.
- Delete own questions / withdraw votes: self-service while status permits.
- Remove support / unfollow: **not self-service yet** (supports have no
  delete policy; follows do but no UI) — documented gap below.
- Account deletion / data access: **contact-based**, not automated. The FAQ
  and Privacy Policy state this plainly and provide typed mailto links;
  requests are tracked via the `account_deletion_requested` event (no email
  content is sent to analytics).

## Analytics events added

`trust_page_viewed` {page}, `faq_item_opened` {question},
`contact_link_clicked` {type, source}, `disclaimer_viewed`,
`community_guidelines_viewed`, `transparency_viewed`,
`report_reason_selected` {reason}, `account_deletion_requested` {source}.
No legal-enquiry content, email addresses, or report text is ever sent.

## SEO and metadata

Per-route title/description/canonical via `usePageMeta`. Open Graph tags
remain page-global in `index.html`: this SPA serves one HTML shell for every
route and social crawlers generally don't execute JavaScript, so per-route OG
tags would be ineffective — honest limitation, revisit if SSR/prerendering is
ever added. `sitemap.xml` lists all public routes (still with the
`REPLACE-WITH-PRODUCTION-DOMAIN` placeholder); `robots.txt` continues to
exclude only the private `/companies` dashboard.

## Current vs. intended processes

Stated as **current** on the pages: everything about campaigns, support,
voting, ranking, moderation mechanics, reporting, and data handling.
Stated as **intended policy** (explicitly labelled): interview recording/
transcript/correction handling and founder-holdings disclosure timing — no
interview has occurred yet, so these are commitments, not descriptions.

## Legal-review gaps (before commercial launch)

1. Privacy Policy, Terms of Use, and Investment Disclaimer are drafts written
   without counsel — each carries a visible notice.
2. Governing law/venue in the Terms is an explicit placeholder.
3. International data-transfer framework (e.g. SCCs) not in place; stated in
   the Privacy Policy.
4. No compliance certifications exist and none are claimed.
5. Automated account deletion and data export are not built; the
   contact-based process must be honored manually until they are.
6. Securities-law review of the overall model (question solicitation,
   outreach, publishing management statements) has not been performed.

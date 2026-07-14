import { Link } from 'react-router-dom'
import { contactMailto, CONTACT_EMAIL } from '../../lib/contact'
import { track } from '../../lib/analytics'
import { TrustPage } from './TrustPage'
import { REPORT_REASONS } from '../../lib/reporting'

export function ModerationPolicyPage() {
  return (
    <TrustPage
      slug="moderation"
      path="/moderation"
      title="Moderation Policy"
      metaDescription="How GroundFloor moderates content: what may be removed, editing versus changing meaning, duplicate merging, report handling, and appeals."
      eyebrow="Moderation Policy"
      heading="How moderation works here."
      intro="Moderation exists to keep questions credible for management and fair for shareholders — not to filter viewpoints."
    >
      <h2>What may be moderated</h2>
      <p>
        Questions and any user-submitted content that violates the <Link to="/guidelines">Community Guidelines</Link>:
        spam, harassment, manipulation, impersonation, unsupported allegations, personal information, suspected
        confidential or material non-public information, duplicates, and off-topic content. Content may be removed,
        edited for clarity, merged, archived, or held for review.
      </p>

      <h2>Editing for clarity vs. changing meaning</h2>
      <p>
        We may fix typos, tighten wording, or split a compound question so it can be answered — that is editing for
        clarity. We never change what a question is actually asking, soften its substance, or redirect it at a
        different topic. If a question can't be made answerable without changing its meaning, it is left alone or
        declined for outreach, not rewritten.
      </p>

      <h2>Duplicate-question merging</h2>
      <p>
        Near-identical questions may be merged so votes concentrate on one well-worded version instead of splitting.
        The submission form also warns you before you post something similar to an existing question, so most
        duplicates never get created.
      </p>

      <h2>Reporting</h2>
      <p>Any signed-in user can report a question they didn't write. Report categories:</p>
      <ul>
        {REPORT_REASONS.map(reason => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <ul>
        <li>Reports are private. The reported author never sees who reported, and reports are not publicly visible.</li>
        <li>Reporting does not automatically remove anything — a human reviews first.</li>
        <li>Reviews happen as promptly as a small team allows; we don't promise turnaround times we can't keep.</li>
        <li>Where content is removed for serious violations, we preserve the underlying records as evidence where necessary.</li>
      </ul>

      <h2>Repeat offenders, suspension, and appeals</h2>
      <p>
        Repeated or serious violations can lead to content restrictions, account suspension, or account removal. If
        you believe a moderation decision was wrong, email{' '}
        <a href={contactMailto('moderation-appeal')} onClick={() => track('contact_link_clicked', { type: 'moderation-appeal', source: 'moderation-policy' })}>
          {CONTACT_EMAIL}
        </a>{' '}
        with the subject “Moderation appeal”, linking the content in question. A person reads every appeal.
      </p>

      <h2>How this is operated today</h2>
      <p>
        There is deliberately no large moderation dashboard yet. Reports land in a protected database table that only
        administrators can read; review happens through direct administrative access, and actions (edit, merge,
        archive, status changes) are applied the same way. This is proportionate to current volumes and is documented
        in <code>docs/trust-and-transparency.md</code>.
      </p>
    </TrustPage>
  )
}

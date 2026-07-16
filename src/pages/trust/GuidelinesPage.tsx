import { Link } from 'react-router-dom'
import { TrustPage } from './TrustPage'

const prohibited: [string, string][] = [
  ['Harassment and personal attacks', 'Criticize decisions and results, not people. No insults, threats, or pile-ons aimed at executives, employees, or other users.'],
  ['Spam and promotion', 'No advertising, referral links, repeated posting, or promotional content — including pump-and-dump style promotion of any security.'],
  ['Manipulation and coordinated abuse', 'No fake accounts, vote rings, brigading, or any coordinated effort to distort question rankings or supporter counts.'],
  ['Impersonation', 'Do not pose as a company, its employees, its management, or another user.'],
  ['Misrepresenting shareholder status', 'Self-reported status is honesty-based. Claiming to be a shareholder when you are not undermines the entire signal.'],
  ['Unsupported allegations and defamation', 'Do not state accusations of fraud, crime, or misconduct as fact without credible public support. Ask about concerns as questions instead.'],
  ['Doxxing and personal information', 'Never post anyone’s private information — addresses, phone numbers, private emails, or financial details, including your own.'],
  ['Confidential and material non-public information', 'Do not post anything you are bound to keep confidential or that a reasonable investor would consider material and non-public. See the warning below.'],
  ['Duplicate and off-topic posting', 'One clear question, once. Content unrelated to the company or campaign may be removed.'],
]

export function GuidelinesPage() {
  return (
    <TrustPage
      slug="guidelines"
      path="/guidelines"
      title="Community Guidelines"
      metaDescription="Open Floor's community rules: what makes a good shareholder question, what content is prohibited, and how reports and enforcement work."
      eyebrow="Community Guidelines"
      heading="Keep it sharp, keep it fair."
      intro="These rules exist so that management takes shareholder questions seriously — and so this stays a place worth participating in."
      extraEvent="community_guidelines_viewed"
    >
      <h2>What good participation looks like</h2>
      <ul>
        <li>Ask clear, answerable questions about strategy, operations, governance, capital allocation, risk, and performance.</li>
        <li>Make questions specific enough that an answer can be verified later.</li>
        <li>Vote for the questions you genuinely want answered — that's the whole ranking system.</li>
        <li>Report your shareholder status honestly, including “not a shareholder”. That's allowed and useful.</li>
        <li>Disagree freely — with arguments, not abuse.</li>
      </ul>

      <h2>Prohibited content and behaviour</h2>
      <ul>
        {prohibited.map(([title, copy]) => (
          <li key={title}>
            <b>{title}.</b> {copy}
          </li>
        ))}
      </ul>

      <h2 id="mnpi">Material non-public information (MNPI)</h2>
      <p>
        Do not submit confidential information or information that a reasonable investor would consider material and
        that is not public — whether it's yours, your employer's, or something you were told. Open Floor may remove
        suspected MNPI immediately and without notice. If you believe you hold MNPI, contact appropriate legal or
        compliance channels; do not post it here. Open Floor cannot and does not advise on whether any specific
        information is material or public.
      </p>

      <h2>Enforcement</h2>
      <ul>
        <li>Reports are reviewed privately — the reported author never learns who reported.</li>
        <li>Open Floor may remove, edit for clarity, merge, archive, or restrict content that breaks these rules.</li>
        <li>Repeated or serious violations can lead to account suspension or removal.</li>
        <li>
          We review reports as promptly as a small team can; we deliberately do not promise response times we can't
          keep. Details in the <Link to="/moderation">Moderation Policy</Link>.
        </li>
      </ul>
    </TrustPage>
  )
}

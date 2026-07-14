import { Link } from 'react-router-dom'
import { track } from '../../lib/analytics'
import { CONTACT_EMAIL, contactMailto } from '../../lib/contact'
import { DraftNotice, TrustPage } from './TrustPage'

export function TermsPage() {
  return (
    <TrustPage
      slug="terms"
      path="/terms"
      title="Terms of Use"
      metaDescription="Draft GroundFloor Terms of Use: acceptable use, user content, moderation rights, disclaimers, and limitations."
      eyebrow="Terms of Use"
      heading="The deal, in plain English."
      intro="Last updated: July 2026."
    >
      <DraftNotice />

      <h2>1. Eligibility and your account</h2>
      <p>
        You must be old enough to form a binding contract where you live (18 in most places) to create an account. You
        are responsible for activity under your account and for keeping access to your sign-in email secure. One
        account per person.
      </p>

      <h2>2. What GroundFloor is — and is not</h2>
      <ul>
        <li>GroundFloor is a platform for coordinating shareholder questions and requesting management interviews.</li>
        <li>GroundFloor is <b>not affiliated with any public company</b> featured on it, and nothing here is company-approved.</li>
        <li>Nothing on GroundFloor is <b>investment advice</b> — see the <Link to="/disclaimer">Investment Disclaimer</Link>, which is part of these terms.</li>
        <li><b>No guarantee of management participation:</b> outreach thresholds trigger a request from us, nothing from the company.</li>
        <li><b>No guarantee of accuracy:</b> content is largely user-submitted and shareholder status is self-reported. Do not rely on it without your own verification.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>
        You agree to follow the <Link to="/guidelines">Community Guidelines</Link>, which are part of these terms.
        Prohibited conduct includes (without limitation): harassment, spam, manipulation of votes or supporter counts,
        impersonation, misrepresenting shareholder status, posting others' personal information, posting confidential
        or material non-public information, unlawful content, and attempting to probe or disrupt the service.
      </p>

      <h2>4. Your content</h2>
      <ul>
        <li>You keep ownership of what you submit.</li>
        <li>You grant GroundFloor a worldwide, non-exclusive, royalty-free licence to host, display, reproduce, excerpt, and distribute your submitted content in connection with operating and promoting the service — including presenting ranked questions to companies and publishing campaign records.</li>
        <li>You confirm you have the right to post what you post.</li>
        <li>We may moderate — remove, edit for clarity, merge, archive, or restrict — content as described in the <Link to="/moderation">Moderation Policy</Link>.</li>
      </ul>

      <h2>5. Intellectual property</h2>
      <p>
        The GroundFloor name, site design, and software are ours. Company names and tickers belong to their owners and
        appear for identification only — their appearance implies no relationship.
      </p>

      <h2>6. Suspension and termination</h2>
      <p>
        We may suspend or remove accounts that violate these terms or the guidelines, and may preserve related records
        as evidence where necessary. You may stop using GroundFloor at any time and request account deletion as
        described in the <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The service is provided “as is” and “as available”, without warranties of any kind, express or implied,
        including fitness for a particular purpose and non-infringement. We do not warrant that the service will be
        uninterrupted, error-free, or that content is accurate or complete.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, GroundFloor and its operators are not liable for indirect, incidental,
        special, consequential, or exemplary damages — including lost profits or investment losses — arising from your
        use of the service or reliance on its content. Where liability cannot be excluded, it is limited to the
        greater of the amount you paid us in the past twelve months (currently zero) or the minimum permitted by law.
      </p>

      <h2>9. Indemnity</h2>
      <p>
        You agree to indemnify GroundFloor against claims arising from content you submit or your violation of these
        terms, to the extent permitted by law.
      </p>

      <h2>10. Governing law</h2>
      <p className="legal-placeholder">
        [PLACEHOLDER — governing law and venue to be determined with legal counsel before commercial launch. No
        jurisdiction has been selected, and none should be inferred.]
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms; material changes will be flagged on this page with an updated date. Continuing to
        use the service after changes take effect means you accept them.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href={contactMailto('legal-privacy')} onClick={() => track('contact_link_clicked', { type: 'legal-privacy', source: 'terms' })}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </TrustPage>
  )
}

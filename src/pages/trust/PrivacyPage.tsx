import { Link } from 'react-router-dom'
import { track } from '../../lib/analytics'
import { CONTACT_EMAIL, contactMailto } from '../../lib/contact'
import { DraftNotice, TrustPage } from './TrustPage'

export function PrivacyPage() {
  return (
    <TrustPage
      slug="privacy"
      path="/privacy"
      title="Privacy Policy"
      metaDescription="Draft Open Floor Privacy Policy: what data is collected, where it lives, how long it's kept, and how to request access or deletion."
      eyebrow="Privacy Policy"
      heading="What we collect and why."
      intro="Written to be read, not skimmed past. Last updated: July 2026."
    >
      <DraftNotice />

      <h2>What we collect</h2>
      <ul>
        <li><b>Account information:</b> your username and email address, used to sign in. Your password is handled entirely by our authentication provider (Supabase Auth) — it is stored only as a secure hash we never see, and is never kept in your profile, logged, or included in analytics.</li>
        <li><b>Profile information:</b> a display name you choose, and optionally your country, investor type, and a public-anonymity preference. Your email address is never displayed publicly.</li>
        <li><b>Self-reported shareholder status:</b> the status you select when supporting a campaign or asking a question, and an optional coarse position-size range. Position ranges are never displayed publicly or shown with your name.</li>
        <li><b>Questions and votes:</b> questions you submit are public (under your display name, or “Anonymous Shareholder” if you choose). Your individual votes are stored so counts are accurate and so you can remove them; vote counts are public, your identity behind a vote is not displayed.</li>
        <li><b>Feedback and reports:</b> feedback you send and reports you file, stored privately — visible to you (feedback) and to administrators, never to other users.</li>
        <li>
          <b>Search and analytics data:</b> recent searches are stored only in your browser (localStorage) and never
          sent to our servers. We use two separate, limited analytics layers:
          <ul>
            <li>
              <b>Vercel Web Analytics</b> measures aggregate website traffic — page views, visitors, routes, referrers,
              and device/browser type. It receives only the page path; query strings and URL fragments are stripped
              before sending, so sign-in links and tokens are never included, and no custom product events are sent to it.
            </li>
            <li>
              <b>PostHog</b> (only when configured on a deployment) records explicit product events — which features you
              use, such as supporting a campaign or voting — linked to a pseudonymous account identifier (your Supabase
              user ID, not your email). It is never sent your email address, display name, question or search text,
              feedback or report text, or position sizes.
            </li>
          </ul>
        </li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We use browser localStorage for your sign-in session, demo-mode data, recent searches, and (when analytics are
        enabled) an analytics identifier. We do not run third-party advertising cookies.
      </p>

      <h2>Where your data lives</h2>
      <ul>
        <li><b>Supabase</b> hosts the database and authentication. Access to your rows is controlled by database-level row security, which we test against a live project as part of our release checks.</li>
        <li><b>PostHog</b> (only if enabled on a deployment) receives explicit product-interaction events, keyed to a pseudonymous account identifier rather than your email, as described above.</li>
        <li><b>Vercel Web Analytics</b> receives aggregate, path-level traffic metrics only — no email, no custom product events, and no query strings or URL fragments.</li>
        <li><b>Email delivery:</b> account emails — email verification and password-reset links — are sent through the email provider configured for the deployment (Supabase's sender or a custom SMTP provider). Your email address is shared with that provider solely to deliver those messages.</li>
      </ul>

      <h2>Retention and deletion</h2>
      <ul>
        <li>Your data is kept while your account exists.</li>
        <li>
          <b>Deletion:</b> automated self-service account deletion is not built yet. Email{' '}
          <a
            href={contactMailto('account-deletion')}
            onClick={() => {
              track('account_deletion_requested', { source: 'privacy' })
              track('contact_link_clicked', { type: 'account-deletion', source: 'privacy' })
            }}
          >
            {CONTACT_EMAIL}
          </a>{' '}
          with the subject “Account deletion request” from your account email. Deleting your account removes your
          profile, questions, votes, supports, follows, feedback, and notifications (these cascade at the database
          level). Content already merged into an outreach record sent to a company cannot be recalled from that
          company.
        </li>
        <li>
          <b>Access:</b> to request a copy of the data we hold about you, email{' '}
          <a
            href={contactMailto('data-access')}
            onClick={() => track('contact_link_clicked', { type: 'data-access', source: 'privacy' })}
          >
            {CONTACT_EMAIL}
          </a>{' '}
          with the subject “Data access request”.
        </li>
      </ul>

      <h2>International users</h2>
      <p>
        Data is hosted in the region of the configured Supabase project (currently North America for this deployment).
        If you use Open Floor from elsewhere, your data is transferred there. A formal international-transfer
        framework (e.g. SCCs) has not yet been put in place — one of the items requiring legal review below.
      </p>

      <h2>Security — honestly stated</h2>
      <p>
        Access control is enforced with database row-level security and role separation, verified by automated live
        tests. Traffic to the site and database is encrypted in transit (HTTPS/TLS). We have not independently
        verified storage-level encryption claims beyond what our hosting providers state, and we hold no compliance
        certifications (no SOC 2, no ISO 27001). No system is perfectly secure; report vulnerabilities via the{' '}
        <Link to="/contact">Contact page</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href={contactMailto('legal-privacy')} onClick={() => track('contact_link_clicked', { type: 'legal-privacy', source: 'privacy' })}>{CONTACT_EMAIL}</a>.
      </p>
    </TrustPage>
  )
}

import { Link } from 'react-router-dom'
import { track } from '../../lib/analytics'
import { CONTACT_EMAIL, contactMailto } from '../../lib/contact'
import { TrustPage } from './TrustPage'

type Faq = { q: string; a: React.ReactNode }

const faqs: Faq[] = [
  {
    q: 'What is Open Floor?',
    a: 'A platform where individual shareholders combine their questions for a public company into one ranked list, and Open Floor uses that collective signal to request a management interview. The questions, support, outcome, and any interview are all public.',
  },
  {
    q: 'Is Open Floor investment advice?',
    a: (
      <>
        No. Nothing on Open Floor is investment advice, a recommendation, or an offer to buy or sell securities. User
        questions and votes reflect curiosity, not analysis you should rely on. See the{' '}
        <Link to="/disclaimer">Investment Disclaimer</Link>.
      </>
    ),
  },
  {
    q: 'Does Open Floor represent public companies?',
    a: 'No. Open Floor has no affiliation, partnership, or agreement with any company in the directory. Companies do not approve, sponsor, or endorse their campaign pages.',
  },
  {
    q: 'Are management interviews guaranteed?',
    a: 'No. Participation is entirely the company’s choice. Reaching a supporter target only means Open Floor prepares and sends an interview request. As of now, no interview has yet been conducted or published.',
  },
  {
    q: 'How are companies selected?',
    a: (
      <>
        The launch directory is a hand-curated set of roughly 225 recognizable U.S.-listed companies. It is not
        comprehensive. You can <Link to="/request-company">request a company</Link> that isn’t listed and we review it
        for inclusion.
      </>
    ),
  },
  {
    q: 'How are campaigns created?',
    a: 'Any signed-in user can start a company’s campaign by clicking “Start this campaign” or by asking the first question. There is exactly one campaign per company.',
  },
  {
    q: 'How are questions ranked?',
    a: (
      <>
        By votes: one vote per user per question, removable at any time. The default “Top” sort orders by vote count
        (ties by newest). Full detail in the <Link to="/voting-rules">Voting Rules</Link>.
      </>
    ),
  },
  {
    q: 'Can management choose which questions to answer?',
    a: 'Yes. Management may decline any question, and Open Floor cannot compel an answer. A published transcript shows what was asked and what was and wasn’t addressed.',
  },
  {
    q: 'Can Open Floor edit or merge questions?',
    a: (
      <>
        Yes, within limits: duplicates may be merged so votes concentrate, and wording may be edited for clarity —
        never to change meaning. See the <Link to="/moderation">Moderation Policy</Link>.
      </>
    ),
  },
  {
    q: 'What does “self-reported shareholder” mean?',
    a: 'When you support a campaign or ask a question, you choose a status like “Current shareholder” yourself. Open Floor records what you selected. It is an honesty-based signal, not a verified fact.',
  },
  {
    q: 'Does Open Floor verify holdings?',
    a: 'No. There is no brokerage connection and no ownership verification. Optional position-size ranges are collected privately for aggregate context and are never displayed with your name.',
  },
  {
    q: 'Can non-shareholders participate?',
    a: 'Yes. Anyone can browse and search. Signed-in users can participate and honestly select statuses like “Considering investing” or “Following the company”.',
  },
  {
    q: 'What happens if management declines?',
    a: 'The campaign page says so plainly, and the record of shareholder support and questions stays public. Outreach may be revisited later. Silence is treated the same way — we never imply participation that didn’t happen.',
  },
  {
    q: 'How does Open Floor make money?',
    a: 'Right now, it doesn’t — there is no revenue: no ads, no subscriptions, no paid placements, and no payments from companies. If that changes, this FAQ and the Transparency page will be updated first.',
  },
  {
    q: 'Can a company pay to influence which questions get selected?',
    a: (
      <>
        No. Payment cannot determine question ranking or suppress criticism — ranking comes from user votes. See the
        conflict-of-interest section of the <Link to="/transparency">Transparency page</Link>.
      </>
    ),
  },
  {
    q: 'How are conflicts of interest handled?',
    a: (
      <>
        Through disclosure — founder/employee holdings, any paid relationships, and any sponsorships are to be
        disclosed on the <Link to="/transparency">Transparency page</Link>. There are currently no issuer
        relationships, sponsorships, or paid promotions of any kind.
      </>
    ),
  },
  {
    q: 'What content is prohibited?',
    a: (
      <>
        Harassment, spam, manipulation, impersonation, unsupported allegations, personal information, and confidential
        or material non-public information, among others — the full list is in the{' '}
        <Link to="/guidelines">Community Guidelines</Link>.
      </>
    ),
  },
  {
    q: 'How do I report a question?',
    a: 'Use the “Report” link on any question card (you must be signed in). Reports are private: the author never sees who reported, and reports are reviewed before any action is taken.',
  },
  {
    q: 'How do I request a company?',
    a: (
      <>
        Use <Link to="/request-company">Request a company</Link>. If the company already exists in the directory,
        we’ll point you to it instead of creating a duplicate.
      </>
    ),
  },
  {
    q: 'How do I delete my account or data?',
    a: (
      <>
        Automated account deletion is not built yet. Email{' '}
        <a
          href={contactMailto('account-deletion')}
          onClick={() => {
            track('account_deletion_requested', { source: 'faq' })
            track('contact_link_clicked', { type: 'account-deletion', source: 'faq' })
          }}
        >
          {CONTACT_EMAIL}
        </a>{' '}
        with the subject “Account deletion request” and we will remove your account and associated data. Details in
        the <Link to="/privacy">Privacy Policy</Link>.
      </>
    ),
  },
  {
    q: 'How do I contact Open Floor?',
    a: (
      <>
        See the <Link to="/contact">Contact page</Link> — it lists addresses for general, press, legal/privacy,
        moderation, and security enquiries.
      </>
    ),
  },
]

export function FaqPage() {
  return (
    <TrustPage
      slug="faq"
      path="/faq"
      title="FAQ"
      metaDescription="Frequently asked questions about Open Floor: what it is, what it isn't, how campaigns and voting work, and how your data is handled."
      eyebrow="FAQ"
      heading="Questions we actually get."
      intro="Plain answers. Where a feature doesn't exist yet, we say so."
    >
      <div className="faq-list">
        {faqs.map(item => (
          <details
            key={item.q}
            className="faq-item"
            onToggle={event => {
              if ((event.target as HTMLDetailsElement).open) track('faq_item_opened', { question: item.q })
            }}
          >
            <summary>{item.q}</summary>
            <div className="faq-answer">{typeof item.a === 'string' ? <p>{item.a}</p> : item.a}</div>
          </details>
        ))}
      </div>
    </TrustPage>
  )
}

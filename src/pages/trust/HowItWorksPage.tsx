import { Link } from 'react-router-dom'
import { TrustPage } from './TrustPage'

const steps: [string, string][] = [
  ['Find a company', 'Browse the directory or search by name or ticker. If a company is missing, request it for review.'],
  ['Start or support a campaign', 'Any signed-in user can start a company’s campaign or add self-reported support to an existing one.'],
  ['Submit and rank questions', 'Shareholders write the questions they want answered and vote on each other’s. Votes rank the list.'],
  ['GroundFloor prepares outreach', 'Once a campaign shows meaningful support, we assemble the top-ranked questions into a formal interview request.'],
  ['We may contact Investor Relations', 'GroundFloor sends the request to the company’s Investor Relations team.'],
  ['Management decides', 'Participation is entirely the company’s choice. They may accept, decline, ask for changes, or not respond.'],
  ['If management participates', 'The interview and its transcript are published on the campaign page for everyone.'],
  ['If management declines or does not respond', 'We say so on the campaign page, plainly. The campaign record — support and questions — stays public.'],
]

export function HowItWorksPage() {
  return (
    <TrustPage
      slug="how-it-works"
      path="/how-it-works"
      title="How It Works"
      metaDescription="The real GroundFloor process, step by step: campaigns, question ranking, outreach, and what happens when management participates — or doesn't."
      eyebrow="How It Works"
      heading="The process, step by step."
      intro="No hidden mechanics: this is exactly what happens between finding a company and (potentially) a published interview."
    >
      <ol className="trust-steps">
        {steps.map(([title, copy], index) => (
          <li key={title}>
            <b>
              {index + 1}. {title}
            </b>
            <p>{copy}</p>
          </li>
        ))}
      </ol>

      <h2>Things to understand before you rely on the numbers</h2>
      <ul>
        <li>
          <b>Support counts are not verified share ownership.</b> Shareholder status is self-reported unless a page
          explicitly states otherwise. We ask for it honestly; we do not check brokerage accounts.
        </li>
        <li>
          <b>Reaching the outreach target guarantees nothing.</b> It triggers GroundFloor preparing and sending a
          request. It does not guarantee the company will be contacted successfully, respond, or participate.
        </li>
        <li>
          <b>Questions may be combined or lightly edited.</b> Duplicate questions may be merged so votes concentrate
          rather than split, and we may edit for clarity — never to change a question's meaning. See the{' '}
          <Link to="/moderation">Moderation Policy</Link>.
        </li>
        <li>
          <b>Management chooses what to answer.</b> Even in a completed interview, management may decline specific
          questions, and their answers may be incomplete or promotional. See the{' '}
          <Link to="/disclaimer">Investment Disclaimer</Link>.
        </li>
      </ul>

      <p>
        For the full detail on what every number and stage means, read the{' '}
        <Link to="/transparency">Transparency page</Link> and the <Link to="/voting-rules">Voting Rules</Link>.
      </p>
    </TrustPage>
  )
}

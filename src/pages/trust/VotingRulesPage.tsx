import { Link } from 'react-router-dom'
import { TrustPage } from './TrustPage'

export function VotingRulesPage() {
  return (
    <TrustPage
      slug="voting-rules"
      path="/voting-rules"
      title="Voting Rules"
      metaDescription="How question voting works on GroundFloor: one vote per user, removable votes, ranking rules, and what vote counts do and don't represent."
      eyebrow="Voting Rules"
      heading="How votes actually work."
      intro="Votes rank shareholder questions. Here is exactly what a vote is, what it counts for, and what it doesn't."
    >
      <h2>The mechanics (as implemented today)</h2>
      <ul>
        <li><b>One vote per user per question.</b> Enforced in the database, not just the interface.</li>
        <li><b>Votes are removable.</b> Voting is a toggle — you can withdraw your vote at any time, and counts update immediately.</li>
        <li><b>Ranking:</b> the default “Top” sort orders questions by vote count, with ties broken by newest first. A “Newest” sort and an “Unanswered” filter are also available. Moderation state matters: questions under review or archived are not publicly listed.</li>
        <li><b>Duplicates may be merged</b> so votes concentrate on one well-worded question instead of splitting across near-identical ones (see the <Link to="/moderation">Moderation Policy</Link>).</li>
      </ul>

      <h2>What a vote is not</h2>
      <ul>
        <li>Votes reflect <b>user support for a question</b>, not verified economic ownership. One person with one share and one person with ten thousand shares each get one vote per question.</li>
        <li>Vote counts are <b>not shareholder votes under corporate law</b>. They have no proxy, meeting, or legal significance whatsoever.</li>
        <li>A top-ranked question is <b>not guaranteed an answer</b>. Management chooses what to address; GroundFloor presents the ranking, nothing more.</li>
      </ul>

      <h2>Integrity</h2>
      <p>
        GroundFloor may exclude or reverse activity that appears manipulated or fraudulent — vote rings, throwaway
        accounts, coordinated brigading — and may restrict the accounts involved under the{' '}
        <Link to="/guidelines">Community Guidelines</Link>. We would rather show smaller honest numbers than larger
        gamed ones.
      </p>
    </TrustPage>
  )
}

import { Link } from 'react-router-dom'
import { IntendedPolicy, TrustPage } from './TrustPage'

export function TransparencyPage() {
  return (
    <TrustPage
      slug="transparency"
      path="/transparency"
      title="Transparency"
      metaDescription="Exactly how GroundFloor works under the hood: what supporter counts mean, how ranking works, how outreach happens, interview handling, and conflicts of interest."
      eyebrow="Transparency"
      heading="What every number on this site means."
      intro="If a claim on GroundFloor isn't explained on this page, tell us and we'll add it. Where something describes a future process, it is labelled as intended policy rather than current functionality."
      extraEvent="transparency_viewed"
    >
      <h2>Campaign creation</h2>
      <ul>
        <li><b>Who can start one:</b> any signed-in user, for any company in the directory. One campaign per company.</li>
        <li><b>What a campaign means:</b> at least one person wants a management interview to happen and said so. That's all it takes to start.</li>
        <li><b>What it does not mean:</b> the company is not involved, aware, or affiliated. A campaign page is not endorsed by, approved by, or connected to the company it concerns.</li>
      </ul>

      <h2>Support</h2>
      <ul>
        <li><b>Supporter counts</b> are the number of signed-in accounts that clicked support — nothing more. They are not verified shareholders and not weighted by holdings.</li>
        <li><b>Self-reported status:</b> each supporter selects their own status (current shareholder, former, considering, following, prefer not to say). We display the aggregate count of self-reported current shareholders separately and label it as self-reported.</li>
        <li><b>Position sizes:</b> an optional, coarse range (e.g. “$1,000–$5,000”) collected privately for aggregate context. Position sizes are never displayed publicly and never shown with your name.</li>
      </ul>

      <h2>Question ranking</h2>
      <ul>
        <li><b>Votes:</b> one per user per question, removable. The “Top” sort is vote count descending; ties go to the newest question. “Newest” and “Unanswered” views are available to everyone.</li>
        <li><b>Moderation state:</b> questions under review or archived are not publicly listed; a question's status (e.g. “Sent to management”, “Answered”) is shown on its card.</li>
        <li><b>Duplicates:</b> may be merged so votes concentrate; the submission form warns about similar existing questions first. Full rules: <Link to="/voting-rules">Voting Rules</Link>.</li>
      </ul>

      <h2>Outreach</h2>
      <ul>
        <li><b>When:</b> the default outreach threshold is 100 supporters. Reaching it triggers GroundFloor preparing a formal request; GroundFloor may also prepare outreach earlier where support is clearly meaningful.</li>
        <li><b>What we share with the company:</b> the top-ranked questions, aggregate campaign numbers (supporters, self-reported shareholder count, vote totals), and nothing personal — never individual identities, emails, or position information.</li>
        <li><b>Voluntary:</b> management participation is entirely the company's decision. An outreach threshold obligates GroundFloor to act; it obligates the company to nothing.</li>
        <li><b>No paid priority:</b> companies cannot pay to reorder questions, remove questions, or influence which questions are sent. Ranking comes from user votes.</li>
      </ul>

      <h2>Interviews</h2>
      <p>No interview has been conducted or published yet. The following is how interviews are intended to work, stated as policy in advance:</p>
      <IntendedPolicy>
        Participants will be identified by name and role. Interviews will be recorded with the participant's knowledge
        and consent. Transcripts will be published in full alongside any summary, with edits limited to
        clarity/filler-removal and marked where made. Factual corrections requested after publication will be appended
        transparently, not silently rewritten. Questions management declines to answer will be listed as declined in
        the published record.
      </IntendedPolicy>

      <h2>Conflicts of interest</h2>
      <ul>
        <li><b>Founder and employee holdings:</b> people who build GroundFloor may personally own shares of companies in the directory. Holdings in a company will be disclosed on that company's campaign page before any interview with it is published. <em>(Intended policy — no interviews exist yet; no such disclosure has yet been necessary.)</em></li>
        <li><b>Issuer relationships, sponsorships, and paid promotion:</b> there are none today — no company has paid GroundFloor anything, sponsored anything, or been promised anything. If any paid relationship ever exists, it will be disclosed on this page and on every affected campaign page.</li>
        <li><b>Referral and affiliate arrangements:</b> none exist today. Any future arrangement will be disclosed here.</li>
        <li><b>Editorial independence:</b> payment can never determine question ranking, suppress criticism, or decide which questions reach management. If a company conditions participation on removing questions, the campaign page will say so.</li>
      </ul>

      <h2>Declines and non-responses</h2>
      <ul>
        <li>If management declines, the campaign status says “Management declined” and the lifecycle shows it plainly — the support and question record stays public.</li>
        <li>If management doesn't respond, the campaign remains at “Management contacted” — silence is shown as silence, never dressed up as progress.</li>
        <li>GroundFloor will never imply participation, scheduling, or interest that has not actually happened. Stage progress on campaign pages is driven only by recorded status changes.</li>
      </ul>
    </TrustPage>
  )
}

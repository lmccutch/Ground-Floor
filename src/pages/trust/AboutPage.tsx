import { Link } from 'react-router-dom'
import { TrustPage } from './TrustPage'

export function AboutPage() {
  return (
    <TrustPage
      slug="about"
      path="/about"
      title="About"
      metaDescription="Why GroundFloor exists: closing the information-access gap between institutional and individual investors through coordinated shareholder questions."
      eyebrow="About GroundFloor"
      heading="Why we're building this."
      intro="GroundFloor helps individual shareholders combine their questions into one credible, public request for a management interview."
    >
      <h2>The access gap</h2>
      <p>
        Institutional investors get scheduled calls with management, dedicated investor-relations contacts, and analyst
        days. Individual investors get a scripted earnings call they can't speak on, filings written for lawyers, and
        fragmented forum threads that management never reads. Both groups own the same shares. Only one gets to ask
        questions.
      </p>

      <h2>Why coordination matters</h2>
      <p>
        A single retail shareholder emailing Investor Relations is easy to ignore. Hundreds of shareholders behind one
        clear, well-ranked set of questions are harder to ignore — and easier for a company to engage with, because the
        work of collecting, deduplicating, and prioritising questions has already been done. GroundFloor exists to do
        that work.
      </p>

      <h2>What we're trying to build</h2>
      <p>
        A public record, one company at a time: what shareholders most want to know, whether management engaged, and
        what management said. Over time, we want a shareholder's first question about any listed company to be
        answerable by that record.
      </p>

      <h2>What GroundFloor does today</h2>
      <ul>
        <li>A curated directory of roughly 225 U.S.-listed companies you can browse and search.</li>
        <li>Shareholder campaigns: anyone with an account can start one, support one, and follow its progress.</li>
        <li>Question submission and voting, so the community ranks what matters most.</li>
        <li>
          A transparent campaign lifecycle showing exactly where each campaign stands — see{' '}
          <Link to="/how-it-works">How It Works</Link>.
        </li>
      </ul>

      <h2>What GroundFloor does not do yet</h2>
      <ul>
        <li>We have not yet conducted or published a management interview.</li>
        <li>We do not verify share ownership — shareholder status is self-reported.</li>
        <li>We do not cover every listed company — the directory is a curated starting set.</li>
        <li>We have no partnerships or agreements with any public company.</li>
        <li>We do not send email notifications yet; updates appear in the app.</li>
      </ul>

      <h2>What GroundFloor is not</h2>
      <p>
        GroundFloor is not a broker, dealer, investment adviser, analyst, fiduciary, or proxy solicitor. We are not
        affiliated with, endorsed by, or approved by any company in the directory, and we do not represent shareholders
        in any legal sense. Nothing on this site is investment advice — see the{' '}
        <Link to="/disclaimer">Investment Disclaimer</Link>.
      </p>
    </TrustPage>
  )
}

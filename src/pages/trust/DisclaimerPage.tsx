import { DraftNotice, TrustPage } from './TrustPage'

export function DisclaimerPage() {
  return (
    <TrustPage
      slug="disclaimer"
      path="/disclaimer"
      title="Investment Disclaimer"
      metaDescription="Open Floor is not a broker, adviser, or fiduciary. Nothing on this site is investment advice, a recommendation, or an offer of securities."
      eyebrow="Investment Disclaimer"
      heading="Read this before relying on anything here."
      extraEvent="disclaimer_viewed"
    >
      <DraftNotice />
      <ul className="disclaimer-list">
        <li><b>Open Floor is not a broker, dealer, investment adviser, analyst, or fiduciary.</b> We are a platform for coordinating shareholder questions — nothing more.</li>
        <li><b>Everything on this site is for informational purposes only.</b> It is not investment, legal, tax, or accounting advice.</li>
        <li><b>User questions and votes are not recommendations.</b> A heavily-voted question means many users are curious — not that anyone should buy, sell, or hold anything.</li>
        <li><b>Management statements may be incomplete, promotional, or forward-looking.</b> If interviews are published, treat management's words the way you would treat any company communication: as one side's account.</li>
        <li><b>Do your own research.</b> Verify anything material against official filings and disclosures before acting on it.</li>
        <li><b>Investing involves risk, including the possible loss of principal.</b> Past performance does not predict future results.</li>
        <li><b>Open Floor does not verify all user statements.</b> Shareholder status is self-reported; user-submitted content may be wrong.</li>
        <li><b>No guarantee of accuracy or completeness.</b> We work to keep displayed data honest, but we cannot warrant it.</li>
        <li><b>Nothing on this site is an offer or solicitation</b> to buy or sell any security, in any jurisdiction.</li>
      </ul>
    </TrustPage>
  )
}

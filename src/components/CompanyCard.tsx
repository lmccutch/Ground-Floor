import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import type { CompanySearchResult } from '../lib/api'
import { companyPath } from '../lib/routes'
import { Monogram } from './ui'

/**
 * A directory result. The two states are structurally different, not just a
 * different badge colour: a company with a campaign shows a live metrics panel
 * (supporters + questions) and routes to "View campaign"; a company without one
 * shows a quieter invitation to be the first shareholder and routes to
 * "View company". The `.company-card` root class is retained for e2e coverage.
 */
export function CompanyCard({ company }: { company: CompanySearchResult }) {
  return (
    <Link
      to={companyPath(company.ticker)}
      className={company.hasCampaign ? 'company-card has-campaign' : 'company-card no-campaign'}
    >
      <div className="company-card-top">
        <Monogram ticker={company.ticker} />
        {company.hasCampaign && (
          <span className="campaign-flag">
            <span className="campaign-dot" aria-hidden="true" />
            Campaign
          </span>
        )}
      </div>
      {company.sector && <span className="card-sector">{company.sector}</span>}
      <h3>{company.name}</h3>
      <span className="ticker-line">
        {company.ticker} · {company.exchange}
      </span>

      {company.hasCampaign ? (
        <div className="card-campaign-metrics" aria-label="Campaign activity">
          <div className="card-metric">
            <b>{company.supporters.toLocaleString()}</b>
            <span>supporter{company.supporters === 1 ? '' : 's'}</span>
          </div>
          <div className="card-metric">
            <b>{company.questions.toLocaleString()}</b>
            <span>question{company.questions === 1 ? '' : 's'}</span>
          </div>
        </div>
      ) : (
        <div className="card-start">
          <Users size={15} aria-hidden="true" />
          <div>
            <b>No campaign yet</b>
            <span>Be the first shareholder to start one.</span>
          </div>
        </div>
      )}

      <span className="card-cta">
        {company.hasCampaign ? 'View campaign' : 'View company'} <ChevronRight size={15} />
      </span>
    </Link>
  )
}

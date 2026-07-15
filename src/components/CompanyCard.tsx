import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { CompanySearchResult } from '../lib/api'
import { companyPath } from '../lib/routes'
import { Badge, Monogram } from './ui'

export function CompanyCard({ company }: { company: CompanySearchResult }) {
  return (
    <Link to={companyPath(company.ticker)} className="company-card">
      <div className="company-card-top">
        <Monogram ticker={company.ticker} />
        {company.hasCampaign ? <Badge tone="gold">Early campaign</Badge> : <Badge tone="neutral">No campaign yet</Badge>}
      </div>
      {company.sector && <span className="card-sector">{company.sector}</span>}
      <h3>{company.name}</h3>
      <span className="ticker-line">
        {company.ticker} · {company.exchange}
      </span>
      <span className="card-stats">
        {company.hasCampaign ? (
          <>
            <b>{company.supporters}</b> supporter{company.supporters === 1 ? '' : 's'} · <b>{company.questions}</b> question
            {company.questions === 1 ? '' : 's'}
          </>
        ) : (
          'Be the first to start this campaign'
        )}
      </span>
      <span className="card-cta">
        {company.hasCampaign ? 'View campaign' : 'View company'} <ChevronRight size={15} />
      </span>
    </Link>
  )
}

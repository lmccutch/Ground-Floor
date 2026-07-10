import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { PublicCompany } from '../lib/api'
import { Badge, Monogram } from './ui'

export function CompanyCard({ company }: { company: PublicCompany }) {
  return (
    <Link to={`/company/${company.ticker}`} className="company-card">
      <div className="company-card-top">
        <Monogram ticker={company.ticker} accent={company.accent} />
        <Badge tone="gold">Early campaign</Badge>
      </div>
      <span className="card-sector">{company.sector}</span>
      <h3>{company.name}</h3>
      <span className="ticker-line">
        {company.ticker} · {company.exchange}
        {company.country ? ` · ${company.country}` : ''}
      </span>
      <p className="clamp-2">{company.description}</p>
      <span className="card-cta">
        View campaign <ChevronRight size={15} />
      </span>
    </Link>
  )
}

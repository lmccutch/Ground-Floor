import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getFeaturedRetailCompanies, type FeaturedRetailCompany, type FeaturedRetailResult } from '../lib/api'
import { track } from '../lib/analytics'
import { companyPath } from '../lib/routes'
import { useMvp } from '../context/useMvp'
import { Badge, Monogram, Skeleton } from './ui'

const INITIAL_COUNT = 12

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: FeaturedRetailResult }

/**
 * "Popular with Retail Investors" — a curated Discover section ranking companies
 * by their standing in a third-party linked-broker investor panel (see
 * docs/popular-with-retail.md). The ranking reflects activity within that sample,
 * not total retail ownership; the disclosure below keeps that explicit.
 *
 * This section is self-contained and defensive: if the ranking fails to load it
 * renders nothing, so the rest of Discover (search, filters, directory) is never
 * blocked. No supporters, questions, or campaigns are ever fabricated — every
 * count and CTA reflects real campaign state (or its absence).
 */
export function PopularRetailSection() {
  const { profile } = useMvp()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [expanded, setExpanded] = useState(false)
  const viewedRef = useRef(false)
  const authed = Boolean(profile?.id)

  useEffect(() => {
    let cancelled = false
    getFeaturedRetailCompanies()
      .then(data => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch(() => {
        // Ranking is supplementary — degrade to hidden rather than breaking Discover.
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const companies = state.status === 'ready' ? state.data.companies : []

  useEffect(() => {
    if (state.status !== 'ready' || viewedRef.current || companies.length === 0) return
    viewedRef.current = true
    track('popular_retail_section_viewed', { count: companies.length, authenticated: authed })
  }, [state.status, companies.length, authed])

  // A failed ranking request must not break the rest of Discover.
  if (state.status === 'error') return null

  if (state.status === 'loading') {
    return (
      <section className="retail-section" aria-busy="true">
        <RetailHeader />
        <div className="company-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={196} />
          ))}
        </div>
      </section>
    )
  }

  // No featured companies available — show the header + a neutral note instead of
  // an empty void, so the section still reads intentionally.
  if (companies.length === 0) {
    return (
      <section className="retail-section">
        <RetailHeader />
        <p className="section-note">Popular-with-retail rankings will appear here soon.</p>
      </section>
    )
  }

  const visible = expanded ? companies : companies.slice(0, INITIAL_COUNT)
  const hasMore = companies.length > INITIAL_COUNT

  const onCompanyClick = (company: FeaturedRetailCompany) => {
    track('popular_retail_company_clicked', {
      company_id: company.id,
      ticker: company.ticker,
      feature_rank: company.featureRank,
      has_campaign: company.hasCampaign,
      campaign_status: company.campaignStatus,
      authenticated: authed,
    })
  }

  const onCtaClick = (company: FeaturedRetailCompany) => {
    track('popular_retail_campaign_cta_clicked', {
      company_id: company.id,
      ticker: company.ticker,
      feature_rank: company.featureRank,
      has_campaign: company.hasCampaign,
      campaign_status: company.campaignStatus,
      authenticated: authed,
    })
  }

  const onToggle = () => {
    if (!expanded) track('popular_retail_view_all_clicked', { total: companies.length })
    setExpanded(value => !value)
  }

  return (
    <section className="retail-section">
      <RetailHeader meta={state.data.meta} />
      <div className="company-grid">
        {visible.map(company => (
          <RetailCompanyCard
            key={company.id}
            company={company}
            onCompanyClick={() => onCompanyClick(company)}
            onCtaClick={() => onCtaClick(company)}
          />
        ))}
      </div>
      {hasMore && (
        <div className="load-more-row">
          <button className="btn secondary" onClick={onToggle} aria-expanded={expanded}>
            {expanded ? 'Show fewer' : `View all ${companies.length} companies`}
          </button>
        </div>
      )}
    </section>
  )
}

function RetailHeader({ meta }: { meta?: FeaturedRetailResult['meta'] }) {
  const asOf = meta?.sourceAsOf
  return (
    <div className="retail-header">
      <span className="eyebrow">Popular with Retail Investors</span>
      <p className="section-note">Explore companies that rank highly among investors in a linked-broker retail panel.</p>
      <p className="retail-disclosure">
        Companies are ranked using aggregated holdings from a third-party linked-broker investor panel. The ranking
        reflects activity within that sample and is not a measure of total retail ownership.
        {asOf ? ` Source snapshot: ${asOf}.` : ''}
      </p>
    </div>
  )
}

function RetailCompanyCard({
  company,
  onCompanyClick,
  onCtaClick,
}: {
  company: FeaturedRetailCompany
  onCompanyClick: () => void
  onCtaClick: () => void
}) {
  const to = companyPath(company.ticker)
  const cta = company.hasCampaign ? 'Support campaign' : 'Start campaign'
  return (
    <div className="company-card retail-card">
      <Link to={to} className="retail-card-body" onClick={onCompanyClick}>
        <div className="company-card-top">
          <span className="retail-rank" aria-label={`Rank ${company.featureRank}`}>
            #{company.featureRank}
          </span>
          {company.hasCampaign ? <Badge tone="gold">Early campaign</Badge> : <Badge tone="neutral">No campaign yet</Badge>}
        </div>
        <div className="retail-card-id">
          <Monogram ticker={company.ticker} />
          <div>
            <h3>{company.name}</h3>
            <span className="ticker-line">
              {company.ticker} · {company.exchange}
            </span>
          </div>
        </div>
        <span className="card-stats">
          {company.hasCampaign ? (
            <>
              <b>{company.supporters}</b> supporter{company.supporters === 1 ? '' : 's'} · <b>{company.questions}</b>{' '}
              question{company.questions === 1 ? '' : 's'}
            </>
          ) : (
            'Be the first to start this campaign'
          )}
        </span>
      </Link>
      <Link to={to} className="card-cta retail-cta" onClick={onCtaClick}>
        {cta} <ChevronRight size={15} />
      </Link>
    </div>
  )
}

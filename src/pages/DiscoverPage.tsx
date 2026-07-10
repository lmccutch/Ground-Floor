import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { getCompanies, type PublicCompany } from '../lib/api'
import { CompanyCard } from '../components/CompanyCard'
import { EmptyState, ErrorState, PageHeading, Skeleton } from '../components/ui'

const ALL_SECTORS = 'All sectors'

export function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState(ALL_SECTORS)
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setCompanies(null)
    getCompanies()
      .then(setCompanies)
      .catch(() => setError(true))
  }, [])

  useEffect(load, [load])

  const sectors = useMemo(() => [ALL_SECTORS, ...new Set((companies ?? []).map(company => company.sector))], [companies])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (companies ?? []).filter(
      company =>
        (sector === ALL_SECTORS || company.sector === sector) &&
        (!needle || `${company.name} ${company.ticker} ${company.sector} ${company.exchange}`.toLowerCase().includes(needle)),
    )
  }, [companies, query, sector])

  return (
    <>
      <PageHeading
        eyebrow="Company directory"
        title="Find your companies."
        copy="Explore shareholder campaigns and the questions their communities are asking."
      />
      <label className="search-field">
        <Search size={17} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search companies, tickers, or sectors" />
      </label>
      {sectors.length > 2 && (
        <div className="chip-row" role="group" aria-label="Filter by sector">
          {sectors.map(item => (
            <button key={item} className={sector === item ? 'chip active' : 'chip'} aria-pressed={sector === item} onClick={() => setSector(item)}>
              {item}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState copy="We could not load the company directory." onRetry={load} />
      ) : companies === null ? (
        <div className="company-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={210} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No companies match"
          copy="Try a different search — or request the company and we’ll open a campaign for it."
          action={
            <Link className="btn primary" to="/request-company">
              Request a company
            </Link>
          }
        />
      ) : (
        <div className="company-grid">
          {filtered.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}

      <div className="request-band">
        <div>
          <h2>Can’t find your company?</h2>
          <p>Request it and we’ll open a public campaign other shareholders can join.</p>
        </div>
        <Link to="/request-company" className="btn gold">
          Request a company <ChevronRight size={15} />
        </Link>
      </div>
    </>
  )
}

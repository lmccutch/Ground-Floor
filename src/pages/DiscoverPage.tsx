import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import {
  discoverCompanies,
  getDiscoverHighlights,
  getKnownSectors,
  KNOWN_EXCHANGES,
  MARKET_CAP_BANDS,
  type CompanySearchResult,
  type DiscoverFilters,
  type DiscoverHighlights,
} from '../lib/api'
import { supabaseDataErrorHint } from '../lib/dataMode'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { CompanyCard } from '../components/CompanyCard'
import { EmptyState, ErrorState, PageHeading, Skeleton } from '../components/ui'

const ALL = 'All'
const PAGE_SIZE = 24

type LoadState = 'loading' | 'ready' | 'error'

export function DiscoverPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [sector, setSector] = useState(ALL)
  const [exchange, setExchange] = useState(ALL)
  const [marketCapCategory, setMarketCapCategory] = useState(ALL)
  const [campaignState, setCampaignState] = useState<'All' | 'has-campaign' | 'no-campaign'>('All')

  const [results, setResults] = useState<CompanySearchResult[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [state, setState] = useState<LoadState>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [highlights, setHighlights] = useState<DiscoverHighlights | null | 'error'>(null)

  const sectors = useMemo(() => getKnownSectors(), [])

  useEffect(() => {
    let cancelled = false
    getDiscoverHighlights()
      .then(data => {
        if (!cancelled) setHighlights(data)
      })
      .catch(() => {
        // Highlights are supplementary — the directory below still works, so a
        // failed highlights fetch degrades to simply not showing the sections.
        if (!cancelled) setHighlights('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filters: DiscoverFilters = useMemo(
    () => ({
      query: debouncedQuery.trim() || undefined,
      sector: sector === ALL ? undefined : sector,
      exchange: exchange === ALL ? undefined : exchange,
      marketCapCategory: marketCapCategory === ALL ? undefined : marketCapCategory,
      campaignState: campaignState === 'All' ? undefined : campaignState,
    }),
    [debouncedQuery, sector, exchange, marketCapCategory, campaignState],
  )

  const load = useCallback((activeFilters: DiscoverFilters) => {
    setState('loading')
    discoverCompanies(activeFilters, 0, PAGE_SIZE)
      .then(page => {
        setResults(page.results)
        setHasMore(page.hasMore)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    load(filters)
  }, [filters, load])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const page = await discoverCompanies(filters, results.length, PAGE_SIZE)
      setResults(current => [...current, ...page.results])
      setHasMore(page.hasMore)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Company directory"
        title="Find your companies."
        copy="Search the launch directory and see which campaigns already have shareholder momentum."
      />

      <HighlightSections highlights={highlights} />

      <label className="search-field">
        <Search size={17} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search companies, tickers, or sectors" />
      </label>

      <div className="chip-row" role="group" aria-label="Filter by sector">
        {[ALL, ...sectors].map(item => (
          <button key={item} className={sector === item ? 'chip active' : 'chip'} aria-pressed={sector === item} onClick={() => setSector(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="Filter by exchange">
        {[ALL, ...KNOWN_EXCHANGES].map(item => (
          <button key={item} className={exchange === item ? 'chip active' : 'chip'} aria-pressed={exchange === item} onClick={() => setExchange(item)}>
            {item === 'NYSE_AMERICAN' ? 'NYSE American' : item}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="Filter by market-cap band">
        {[ALL, ...MARKET_CAP_BANDS].map(item => (
          <button
            key={item}
            className={marketCapCategory === item ? 'chip active' : 'chip'}
            aria-pressed={marketCapCategory === item}
            onClick={() => setMarketCapCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="Filter by campaign status">
        {(['All', 'has-campaign', 'no-campaign'] as const).map(item => (
          <button
            key={item}
            className={campaignState === item ? 'chip active' : 'chip'}
            aria-pressed={campaignState === item}
            onClick={() => setCampaignState(item)}
          >
            {item === 'All' ? 'All companies' : item === 'has-campaign' ? 'Has a campaign' : 'No campaign yet'}
          </button>
        ))}
      </div>

      {state === 'error' ? (
        <ErrorState
          copy={['We could not load the company directory.', supabaseDataErrorHint()].filter(Boolean).join(' ')}
          onRetry={() => load(filters)}
        />
      ) : state === 'loading' ? (
        <div className="company-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={210} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No companies match"
          copy="Try a different search or filter — or request the company and we’ll review it for the directory."
          action={
            <Link className="btn primary" to="/request-company">
              Request a company
            </Link>
          }
        />
      ) : (
        <>
          <div className="company-grid">
            {results.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-row">
              <button className="btn secondary" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more companies'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="request-band">
        <div>
          <h2>Can’t find your company?</h2>
          <p>Request it and we’ll review it for the directory.</p>
        </div>
        <Link to="/request-company" className="btn gold">
          Request a company <ChevronRight size={15} />
        </Link>
      </div>
    </>
  )
}

/**
 * Real-activity highlight rows. Every section is driven by persisted campaign
 * metrics (ranking rules: docs/core-user-experience.md) and a section renders
 * only when it has actual entries — no activity is ever manufactured.
 */
function HighlightSections({ highlights }: { highlights: DiscoverHighlights | null | 'error' }) {
  if (highlights === 'error') return null
  if (highlights === null) {
    return (
      <div className="highlight-loading" aria-hidden="true">
        <Skeleton height={64} />
      </div>
    )
  }
  const sections: { title: string; copy: string; items: CompanySearchResult[] }[] = [
    { title: 'Close to the outreach target', copy: 'Campaigns at or past half of their supporter target.', items: highlights.nearThreshold },
    { title: 'Most supported', copy: 'Campaigns with the most self-reported shareholder support.', items: highlights.mostSupported },
    { title: 'Most voted questions', copy: 'Campaigns whose questions have drawn the most votes.', items: highlights.mostVoted },
    { title: 'Newest campaigns', copy: 'Recently started by shareholders.', items: highlights.newest },
  ].filter(section => section.items.length > 0)

  if (sections.length === 0) {
    return <p className="section-note">Campaign highlights appear here once campaigns have real shareholder activity.</p>
  }

  return (
    <>
      {sections.map(section => (
        <section key={section.title} className="highlight-section">
          <div className="section-row">
            <div>
              <span className="eyebrow">{section.title}</span>
              <p className="section-note">{section.copy}</p>
            </div>
          </div>
          <div className="company-grid">
            {section.items.map(company => (
              <CompanyCard key={`${section.title}-${company.id}`} company={company} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

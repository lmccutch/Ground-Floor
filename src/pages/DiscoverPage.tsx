import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import {
  discoverCompanies,
  getDiscoverHighlights,
  getKnownSectors,
  MARKET_CAP_BANDS,
  type CompanySearchResult,
  type DiscoverFilters,
  type DiscoverHighlights,
} from '../lib/api'
import { track } from '../lib/analytics'
import { supabaseDataErrorHint } from '../lib/dataMode'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { CompanyCard } from '../components/CompanyCard'
import { PopularRetailSection } from '../components/PopularRetailSection'
import { DiscoverFilterControl } from '../components/DiscoverFilterControl'
import { countActiveFilters, type FilterSelection } from '../lib/discoverFilters'
import { EmptyState, ErrorState, PageHeading, Skeleton } from '../components/ui'

const PAGE_SIZE = 24
const EXCHANGE_VALUES = ['NASDAQ', 'NYSE', 'NYSE_AMERICAN']

type LoadState = 'loading' | 'ready' | 'error'

const exchangeLabel = (value: string) => (value === 'NYSE_AMERICAN' ? 'NYSE American' : value)
const campaignLabel = (value: string) => (value === 'has-campaign' ? 'Has a campaign' : 'No campaign yet')
const bandLabel = (value: string) => value.replace('-', '–')

/** Reads a validated filter selection from URL params — unknown/invalid values fall back to "All". */
function readSelection(params: URLSearchParams, sectors: string[]): FilterSelection {
  const sector = params.get('sector') ?? ''
  const exchange = params.get('exchange') ?? ''
  const mcap = params.get('mcap') ?? ''
  const campaign = params.get('campaign') ?? ''
  return {
    sector: sectors.includes(sector) ? sector : '',
    exchange: EXCHANGE_VALUES.includes(exchange) ? exchange : '',
    marketCapCategory: (MARKET_CAP_BANDS as readonly string[]).includes(mcap) ? mcap : '',
    campaignState: campaign === 'has-campaign' || campaign === 'no-campaign' ? campaign : '',
  }
}

export function DiscoverPage() {
  const sectors = useMemo(() => getKnownSectors(), [])
  const [searchParams, setSearchParams] = useSearchParams()

  const applied = useMemo(() => readSelection(searchParams, sectors), [searchParams, sectors])
  const urlQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)
  const debouncedQuery = useDebouncedValue(query, 300)
  const selfWroteQuery = useRef(false)

  const [results, setResults] = useState<CompanySearchResult[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [state, setState] = useState<LoadState>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [highlights, setHighlights] = useState<DiscoverHighlights | null | 'error'>(null)

  useEffect(() => {
    let cancelled = false
    getDiscoverHighlights()
      .then(data => {
        if (!cancelled) setHighlights(data)
      })
      .catch(() => {
        if (!cancelled) setHighlights('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Search text ⇆ URL. The debounced value is written to `q` with replace (no
  // per-keystroke history), and external navigation (back/forward) syncs the input.
  useEffect(() => {
    const next = debouncedQuery.trim()
    if (next === urlQuery) return
    selfWroteQuery.current = true
    setSearchParams(
      previous => {
        const params = new URLSearchParams(previous)
        if (next) params.set('q', next)
        else params.delete('q')
        return params
      },
      { replace: true },
    )
  }, [debouncedQuery, urlQuery, setSearchParams])

  useEffect(() => {
    if (selfWroteQuery.current) {
      selfWroteQuery.current = false
      return
    }
    setQuery(urlQuery)
  }, [urlQuery])

  const filters: DiscoverFilters = useMemo(
    () => ({
      query: debouncedQuery.trim() || undefined,
      sector: applied.sector || undefined,
      exchange: applied.exchange || undefined,
      marketCapCategory: applied.marketCapCategory || undefined,
      campaignState: applied.campaignState || undefined,
    }),
    [debouncedQuery, applied],
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

  const updateFilterParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutate(params)
      setSearchParams(params)
    },
    [searchParams, setSearchParams],
  )

  function applyFilters(next: FilterSelection) {
    updateFilterParams(params => {
      setOrDelete(params, 'sector', next.sector)
      setOrDelete(params, 'exchange', next.exchange)
      setOrDelete(params, 'mcap', next.marketCapCategory)
      setOrDelete(params, 'campaign', next.campaignState)
    })
    track('discover_filters_applied', { active_filters: countActiveFilters(next), groups: activeGroupNames(next) })
  }

  function clearAllFilters() {
    updateFilterParams(params => {
      for (const key of ['sector', 'exchange', 'mcap', 'campaign']) params.delete(key)
    })
    track('discover_filters_cleared', {})
  }

  function removeFilter(group: keyof FilterSelection) {
    updateFilterParams(params => params.delete(PARAM_FOR[group]))
    track('discover_filter_removed', { group })
  }

  const activeChips = useMemo(() => {
    const chips: { group: keyof FilterSelection; label: string }[] = []
    if (applied.sector) chips.push({ group: 'sector', label: applied.sector })
    if (applied.exchange) chips.push({ group: 'exchange', label: exchangeLabel(applied.exchange) })
    if (applied.marketCapCategory) chips.push({ group: 'marketCapCategory', label: bandLabel(applied.marketCapCategory) })
    if (applied.campaignState) chips.push({ group: 'campaignState', label: campaignLabel(applied.campaignState) })
    return chips
  }, [applied])

  const activeCount = countActiveFilters(applied)
  const trimmedQuery = debouncedQuery.trim()

  return (
    <>
      <PageHeading
        eyebrow="Company directory"
        title="Find your companies."
        copy="Search the launch directory and see which campaigns already have shareholder momentum."
      />

      <PopularRetailSection />

      <HighlightSections highlights={highlights} />

      <div className="discover-controls">
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search companies, tickers, or sectors"
            aria-label="Search companies"
          />
        </label>
        <DiscoverFilterControl
          selection={applied}
          sectors={sectors}
          onApply={applyFilters}
          onClear={clearAllFilters}
          onOpen={() => track('discover_filters_opened', { active_filters: activeCount })}
        />
      </div>

      {activeChips.length > 0 && (
        <div className="active-filters" aria-label="Active filters">
          {activeChips.map(chip => (
            <button
              key={chip.group}
              type="button"
              className="filter-chip"
              onClick={() => removeFilter(chip.group)}
              aria-label={`Remove ${chip.label} filter`}
            >
              {chip.label}
              <X size={13} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="link-btn clear-filters" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}

      {state === 'ready' && results.length > 0 && (
        <p className="results-count" role="status">
          {results.length}
          {hasMore ? '+' : ''} {results.length === 1 ? 'company' : 'companies'}
        </p>
      )}

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
        activeCount > 0 ? (
          <EmptyState
            title="No companies match these filters."
            copy="Try removing a filter to widen the results."
            action={
              <button className="btn secondary" onClick={clearAllFilters}>
                Clear filters
              </button>
            }
          />
        ) : trimmedQuery ? (
          <EmptyState
            title={`No companies match “${trimmedQuery}”.`}
            copy="Try a different name or ticker — or request the company and we’ll review it for the directory."
            action={
              <Link className="btn primary" to="/request-company">
                Request a company
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No companies to show."
            copy="The directory could not be loaded right now."
            action={
              <button className="btn secondary" onClick={() => load(filters)}>
                Try again
              </button>
            }
          />
        )
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

const PARAM_FOR: Record<keyof FilterSelection, string> = {
  sector: 'sector',
  exchange: 'exchange',
  marketCapCategory: 'mcap',
  campaignState: 'campaign',
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value)
  else params.delete(key)
}

function activeGroupNames(selection: FilterSelection): string[] {
  const groups: string[] = []
  if (selection.sector) groups.push('sector')
  if (selection.exchange) groups.push('exchange')
  if (selection.marketCapCategory) groups.push('market_cap')
  if (selection.campaignState) groups.push('campaign_status')
  return groups
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

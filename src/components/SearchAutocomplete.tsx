import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchCompanies, type CompanySearchResult } from '../lib/api'
import { track } from '../lib/analytics'
import { useDebouncedValue } from '../lib/useDebouncedValue'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function SearchAutocomplete({ placeholder = 'Search companies or tickers', autoFocus = false }: { placeholder?: string; autoFocus?: boolean }) {
  const navigate = useNavigate()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<CompanySearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)
  const debouncedQuery = useDebouncedValue(query, 250)

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setStatus('idle')
      setResults([])
      return
    }
    const thisRequest = ++requestId.current
    setStatus('loading')
    track('global_company_search_started', { query_length: trimmed.length })
    searchCompanies(trimmed, 10)
      .then(found => {
        if (requestId.current !== thisRequest) return // a newer request superseded this one
        setResults(found)
        setStatus('ready')
        setActiveIndex(-1)
        if (found.length === 0) track('global_company_search_no_result', { query_length: trimmed.length })
        else track('global_company_search_completed', { query_length: trimmed.length, result_count: found.length })
      })
      .catch(() => {
        if (requestId.current !== thisRequest) return
        setStatus('error')
        setResults([])
      })
  }, [debouncedQuery])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function goToResult(result: CompanySearchResult, position: number) {
    track('search_result_clicked', { ticker: result.ticker, result_position: position, has_campaign: result.hasCampaign })
    setOpen(false)
    setQuery('')
    navigate(`/company/${result.ticker}`)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      goToResult(results[activeIndex], activeIndex)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showPanel = open && query.trim().length > 0

  return (
    <div className="search-autocomplete" ref={containerRef}>
      <label className="search-field">
        <Search size={17} />
        <input
          value={query}
          onChange={event => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        />
      </label>
      {showPanel && (
        <div className="search-panel" role="listbox" id={listId}>
          {status === 'loading' && <div className="search-panel-note">Searching…</div>}
          {status === 'error' && <div className="search-panel-note">We could not search right now. Please try again.</div>}
          {status === 'ready' && results.length === 0 && (
            <div className="search-panel-empty">
              <p>No matches for “{query.trim()}”.</p>
              <a href="/request-company" onClick={event => event.stopPropagation()}>
                Can’t find the company? Suggest it for review.
              </a>
            </div>
          )}
          {status === 'ready' &&
            results.map((result, index) => (
              <button
                type="button"
                key={result.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? 'search-result active' : 'search-result'}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToResult(result, index)}
              >
                <span className="search-result-ticker">{result.ticker}</span>
                <span className="search-result-main">
                  <b>{result.name}</b>
                  <small>
                    {result.exchange}
                    {result.sector ? ` · ${result.sector}` : ''}
                  </small>
                </span>
                <span className="search-result-meta">
                  {result.hasCampaign ? `${result.supporters} supporters` : 'No campaign yet'}
                </span>
              </button>
            ))}
        </div>
      )}
      <div className="visually-hidden" aria-live="polite">
        {status === 'ready' ? `${results.length} result${results.length === 1 ? '' : 's'} found` : ''}
      </div>
    </div>
  )
}

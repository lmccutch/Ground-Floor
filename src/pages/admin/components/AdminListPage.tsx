import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { useDebouncedValue } from '../../../lib/useDebouncedValue'
import { AdminPageHeader, DataState, DetailDrawer, Empty, FilterSelect, Pagination, SearchInput } from './adminUi'

export type Column<T> = { header: string; render: (row: T) => ReactNode; className?: string }
export type FilterDef = { key: string; label: string; options: { value: string; label: string }[] }
export type PageResult<T> = { rows: T[]; total: number }
export type FetchArgs = { search: string; filters: Record<string, string>; offset: number; limit: number }

const LIMIT = 25

export function AdminListPage<T>({
  title,
  description,
  searchPlaceholder,
  filters = [],
  columns,
  gridTemplate,
  fetchPage,
  getRowKey,
  emptyTitle,
  emptyMessage,
  detailTitle,
  renderDetail,
}: {
  title: string
  description?: string
  searchPlaceholder?: string
  filters?: FilterDef[]
  columns: Column<T>[]
  gridTemplate: string
  fetchPage: (args: FetchArgs) => Promise<PageResult<T>>
  getRowKey: (row: T) => string
  emptyTitle?: string
  emptyMessage?: string
  detailTitle?: (row: T) => string
  renderDetail?: (row: T) => ReactNode
}) {
  const [params, setParams] = useSearchParams()
  const offset = Math.max(0, Number(params.get('offset')) || 0)
  const [selected, setSelected] = useState<T | null>(null)

  const filterValues = useMemo(() => {
    const v: Record<string, string> = {}
    filters.forEach(f => (v[f.key] = params.get(f.key) ?? ''))
    return v
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, filters.map(f => f.key).join(',')])

  const urlSearch = params.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300)

  // Sync the debounced search into the URL (and reset the page) — but never on the
  // initial render, so a shared deep link keeps its offset.
  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('search') ?? ''
    if (debouncedSearch === current) return
    setParams(
      prev => {
        const p = new URLSearchParams(prev)
        if (debouncedSearch) p.set('search', debouncedSearch)
        else p.delete('search')
        p.delete('offset')
        return p
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  function setFilter(key: string, value: string) {
    setParams(
      prev => {
        const p = new URLSearchParams(prev)
        if (value) p.set(key, value)
        else p.delete(key)
        p.delete('offset')
        return p
      },
      { replace: true },
    )
  }

  function setOffset(next: number) {
    setParams(
      prev => {
        const p = new URLSearchParams(prev)
        if (next > 0) p.set('offset', String(next))
        else p.delete('offset')
        return p
      },
      { replace: true },
    )
  }

  function clearAll() {
    setSearchInput('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const query = useAdminQuery(
    () => fetchPage({ search: debouncedSearch, filters: filterValues, offset, limit: LIMIT }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, offset, ...filters.map(f => filterValues[f.key])],
  )

  const hasFilters = Boolean(debouncedSearch) || filters.some(f => filterValues[f.key])

  return (
    <div className="admin-list-page">
      <AdminPageHeader title={title} description={description} />

      <div className="admin-filter-bar" role="search">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder={searchPlaceholder} />
        {filters.map(f => (
          <FilterSelect
            key={f.key}
            label={f.label}
            value={filterValues[f.key]}
            onChange={v => setFilter(f.key, v)}
            options={[{ value: '', label: `All ${f.label.toLowerCase()}` }, ...f.options]}
          />
        ))}
        {hasFilters && (
          <button className="btn ghost small admin-clear-filters" onClick={clearAll}>
            Clear filters
          </button>
        )}
      </div>

      <DataState
        query={query}
        empty={result =>
          result.rows.length === 0 ? (
            <Empty
              title={hasFilters ? 'No matches' : emptyTitle ?? 'Nothing here yet'}
              message={hasFilters ? 'No records match the current filters.' : emptyMessage}
            />
          ) : null
        }
      >
        {result => (
          <>
            <div className="admin-table" role="table" aria-label={title} style={{ ['--admin-cols' as string]: gridTemplate }}>
              <div className="admin-thead" role="row">
                {columns.map((c, i) => (
                  <div key={i} role="columnheader" className={c.className}>
                    {c.header}
                  </div>
                ))}
              </div>
              {result.rows.map(row => {
                const openable = Boolean(renderDetail)
                return (
                  <div
                    key={getRowKey(row)}
                    role="row"
                    className={openable ? 'admin-trow is-openable' : 'admin-trow'}
                    tabIndex={openable ? 0 : undefined}
                    onClick={openable ? () => setSelected(row) : undefined}
                    onKeyDown={openable ? e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelected(row)) : undefined}
                  >
                    {columns.map((c, i) => (
                      <div key={i} role="cell" className={c.className} data-label={c.header}>
                        {c.render(row)}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
            <Pagination offset={offset} limit={LIMIT} total={result.total} onPage={setOffset} />
          </>
        )}
      </DataState>

      {renderDetail && detailTitle && (
        <DetailDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? detailTitle(selected) : ''}>
          {selected && renderDetail(selected)}
        </DetailDrawer>
      )}
    </div>
  )
}

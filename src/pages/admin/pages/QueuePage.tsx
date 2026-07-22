import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkQueue, type WorkItem } from '../../../lib/adminApi'
import { humanize, priorityRank, priorityTone, timeAgo } from '../../../lib/adminFormat'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { useDebouncedValue } from '../../../lib/useDebouncedValue'
import { useUrlFilter, useUrlOffset } from '../../../hooks/useUrlFilter'
import { AdminError, AdminPageHeader, Chip, Empty, FilterSelect, Loading, Pagination, SearchInput } from '../components/adminUi'

const LIMIT = 25

const SECTION: Record<string, string> = {
  company_request: '/admin/company-requests',
  campaign: '/admin/campaigns',
  question_report: '/admin/reports',
  bug_report: '/admin/bugs',
  support_ticket: '/admin/support',
}

export function QueuePage() {
  const query = useAdminQuery(() => getWorkQueue(), [])
  const [type, setType] = useUrlFilter('type')
  const [priority, setPriority] = useUrlFilter('priority')
  const [status, setStatus] = useUrlFilter('status')
  const [searchInput, setSearchInput] = useUrlFilter('search')
  const [offset, setOffset] = useUrlOffset()
  const search = useDebouncedValue(searchInput.trim().toLowerCase(), 250)

  const all = useMemo(() => query.data ?? [], [query.data])
  const typeOptions = useMemo(() => Array.from(new Set(all.map(i => i.itemType))).sort(), [all])
  const statusOptions = useMemo(() => Array.from(new Set(all.map(i => i.status).filter(Boolean))).sort(), [all])

  const filtered = useMemo(() => {
    return all
      .filter(i => (!type || i.itemType === type) && (!priority || priorityTone(i.priority) === priority) && (!status || i.status === status))
      .filter(i => !search || `${i.title} ${i.reason} ${i.summary}`.toLowerCase().includes(search))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || +new Date(a.createdAt) - +new Date(b.createdAt))
  }, [all, type, priority, status, search])

  const paged = filtered.slice(offset, offset + LIMIT)
  const hasFilters = Boolean(type || priority || status || searchInput)

  return (
    <div className="admin-list-page">
      <AdminPageHeader title="Work queue" description="Everything that needs attention, highest priority first, oldest first within a priority. Every item shows why it is here." />

      <div className="admin-filter-bar" role="search">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search titles and reasons" />
        <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: '', label: 'All types' }, ...typeOptions.map(t => ({ value: t, label: humanize(t) }))]} />
        <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[{ value: '', label: 'All priorities' }, { value: 'critical', label: 'Critical / urgent' }, { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All statuses' }, ...statusOptions.map(s => ({ value: s, label: humanize(s) }))]} />
        {hasFilters && (
          <button className="btn ghost small admin-clear-filters" onClick={() => { setType(''); setPriority(''); setStatus(''); setSearchInput('') }}>
            Clear filters
          </button>
        )}
      </div>

      {query.error ? (
        <AdminError onRetry={query.reload} />
      ) : query.loading && query.data == null ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title={hasFilters ? 'No matches' : 'The queue is clear'} message={hasFilters ? 'No work items match the current filters.' : 'Nothing needs attention right now.'} />
      ) : (
        <>
          <div className="admin-table" role="table" aria-label="Work queue" style={{ ['--admin-cols' as string]: '0.8fr 1fr 2fr 2fr 1fr 0.6fr 0.7fr' }}>
            <div className="admin-thead" role="row">
              {['Priority', 'Type', 'Title', 'Reason', 'Status', 'Age', ''].map((h, i) => (
                <div key={i} role="columnheader">
                  {h}
                </div>
              ))}
            </div>
            {paged.map((i: WorkItem) => (
              <div key={`${i.itemType}:${i.itemId}`} role="row" className="admin-trow">
                <div role="cell" data-label="Priority">
                  <Chip tone={priorityTone(i.priority)}>{humanize(i.priority)}</Chip>
                </div>
                <div role="cell" data-label="Type">{humanize(i.itemType)}</div>
                <div role="cell" data-label="Title" className="admin-clamp">{i.title}</div>
                <div role="cell" data-label="Reason" className="admin-clamp admin-sub">{i.reason}</div>
                <div role="cell" data-label="Status">{humanize(i.status)}</div>
                <div role="cell" data-label="Age">{timeAgo(i.createdAt)}</div>
                <div role="cell" data-label="">
                  {SECTION[i.itemType] && (
                    <Link className="admin-link" to={SECTION[i.itemType]}>
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination offset={offset} limit={LIMIT} total={filtered.length} onPage={setOffset} />
        </>
      )}
    </div>
  )
}

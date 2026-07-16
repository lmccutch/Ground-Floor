import { useEffect, useId, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { MARKET_CAP_BANDS } from '../lib/api'
import { countActiveFilters, EMPTY_SELECTION, type FilterSelection } from '../lib/discoverFilters'

type Group = { key: keyof FilterSelection; label: string; options: { value: string; label: string }[] }

/**
 * Compact "Filters" trigger that opens an accessible dialog — an anchored popover
 * on desktop, a bottom sheet on mobile (CSS-driven). Single-select radio groups,
 * a draft applied only on "Apply", focus trap + Escape + focus return, and body
 * scroll lock while open.
 */
export function DiscoverFilterControl({
  selection,
  sectors,
  onApply,
  onClear,
  onOpen,
}: {
  selection: FilterSelection
  sectors: string[]
  onApply: (next: FilterSelection) => void
  onClear: () => void
  onOpen: () => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterSelection>(selection)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const activeCount = countActiveFilters(selection)

  const groups: Group[] = [
    { key: 'sector', label: 'Sector', options: [{ value: '', label: 'All' }, ...sectors.map(s => ({ value: s, label: s }))] },
    {
      key: 'exchange',
      label: 'Exchange',
      options: [
        { value: '', label: 'All' },
        { value: 'NASDAQ', label: 'NASDAQ' },
        { value: 'NYSE', label: 'NYSE' },
        { value: 'NYSE_AMERICAN', label: 'NYSE American' },
      ],
    },
    {
      key: 'marketCapCategory',
      label: 'Market capitalization',
      options: [{ value: '', label: 'All' }, ...MARKET_CAP_BANDS.map(b => ({ value: b, label: b.replace('-', '–') }))],
    },
    {
      key: 'campaignState',
      label: 'Campaign status',
      options: [
        { value: '', label: 'All companies' },
        { value: 'has-campaign', label: 'Has a campaign' },
        { value: 'no-campaign', label: 'No campaign yet' },
      ],
    },
  ]

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function toggleOpen() {
    setOpen(current => {
      const next = !current
      if (next) {
        setDraft(selection)
        onOpen()
      }
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const focusable = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')).filter(
            el => !el.hasAttribute('disabled'),
          )
        : []
    focusable()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="filter-control">
      <button
        ref={triggerRef}
        type="button"
        className="btn secondary filter-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <SlidersHorizontal size={15} /> Filters
        {activeCount > 0 && (
          <span className="filter-count" aria-label={`${activeCount} active filter${activeCount === 1 ? '' : 's'}`}>
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="filter-backdrop" onClick={close} />
          <div ref={panelRef} className="filter-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="filter-panel-head">
              <span id={titleId} className="filter-panel-title">
                Filters
              </span>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={close}>
                <X size={16} />
              </button>
            </div>
            <div className="filter-groups">
              {groups.map(group => (
                <fieldset className="filter-group" key={group.key}>
                  <legend>{group.label}</legend>
                  <div className="filter-options">
                    {group.options.map(option => (
                      <label
                        key={option.value || 'all'}
                        className={draft[group.key] === option.value ? 'filter-option selected' : 'filter-option'}
                      >
                        <input
                          type="radio"
                          name={group.key}
                          checked={draft[group.key] === option.value}
                          onChange={() => setDraft(current => ({ ...current, [group.key]: option.value }))}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  setDraft(EMPTY_SELECTION)
                  onClear()
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                Clear all
              </button>
              <button
                type="button"
                className="btn primary small"
                onClick={() => {
                  onApply(draft)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

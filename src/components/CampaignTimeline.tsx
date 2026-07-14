import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Flag, Users } from 'lucide-react'
import { getCampaignTimeline, type Campaign, type TimelineEvent } from '../lib/api'
import { track } from '../lib/analytics'
import { Skeleton } from './ui'

function formatDate(iso?: string): string | null {
  if (!iso) return null
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Truthful campaign timeline: launch date, supporter milestones dated by when
 * the Nth supporter actually joined, and admin-recorded outreach events. Events
 * that haven't happened are simply absent — no projected or invented dates.
 */
export function CampaignTimeline({ campaign }: { campaign: Campaign }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const tracked = useRef(false)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    getCampaignTimeline(campaign)
      .then(items => {
        if (cancelled) return
        setEvents(items)
        if (!tracked.current) {
          tracked.current = true
          track('campaign_timeline_viewed', { campaign_id: campaign.id, event_count: items.length })
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // Refetch when supporter count changes so a milestone crossed just now appears.
  }, [campaign, reloadKey])

  return (
    <div className="panel">
      <span className="eyebrow">Campaign timeline</span>
      {failed ? (
        <p className="list-empty">
          The timeline could not be loaded.{' '}
          <button className="link-btn" onClick={() => setReloadKey(key => key + 1)}>
            Try again
          </button>
        </p>
      ) : events === null ? (
        <Skeleton height={72} />
      ) : (
        <>
          {events.map(event => {
            const date = formatDate(event.at)
            return (
              <div className="timeline-row" key={event.id}>
                {event.kind === 'launch' ? <CalendarDays size={15} /> : event.kind === 'milestone' ? <Users size={15} /> : <Flag size={15} />}
                <div>
                  <b>{event.label}</b>
                  <small>{date ?? 'Date not recorded'}</small>
                </div>
              </div>
            )
          })}
          <div className="timeline-row upcoming">
            <Users size={15} />
            <div>
              <b>Interview request</b>
              <small>Sent when the campaign reaches {campaign.outreachTarget} supporters. Not guaranteed to be accepted.</small>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

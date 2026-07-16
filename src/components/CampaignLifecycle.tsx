import { useEffect, useRef } from 'react'
import { Check, PauseCircle, ShieldCheck, XCircle } from 'lucide-react'
import type { Campaign } from '../lib/api'
import { lifecycleForStatus } from '../lib/campaignLifecycle'
import { track } from '../lib/analytics'

/**
 * The six-stage campaign lifecycle: where this campaign is now, what that
 * means, and what happens next. Stage completion comes only from the persisted
 * campaign status — nothing is shown as done unless the status proves it.
 */
export function CampaignLifecycle({ campaign, companyTicker }: { campaign: Campaign; companyTicker: string }) {
  const view = lifecycleForStatus(campaign.status)
  const progress = Math.min(100, Math.round((campaign.supporters / campaign.outreachTarget) * 100))
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('campaign_stage_viewed', { ticker: companyTicker, status: campaign.status })
  }, [companyTicker, campaign.status])

  return (
    <section className="lifecycle-panel" aria-label="Campaign lifecycle">
      <div className="lifecycle-head">
        <div>
          <span className="eyebrow">Campaign status</span>
          <h2>{campaign.status}</h2>
          <p className="lifecycle-explanation">{view.explanation}</p>
        </div>
        {view.outcome === 'declined' && (
          <span className="lifecycle-outcome declined">
            <XCircle size={15} /> Management declined
          </span>
        )}
        {view.outcome === 'paused' && (
          <span className="lifecycle-outcome paused">
            <PauseCircle size={15} /> Paused
          </span>
        )}
        {view.outcome === 'completed' && (
          <span className="lifecycle-outcome completed">
            <Check size={15} /> Interview completed
          </span>
        )}
      </div>

      <ol className="lifecycle-steps">
        {view.stages.map((stage, index) => (
          <li key={stage.title} className={`lifecycle-step ${stage.state}`} aria-current={stage.state === 'current' ? 'step' : undefined}>
            <span className="lifecycle-marker" aria-hidden="true">
              {stage.state === 'done' ? <Check size={13} /> : index + 1}
            </span>
            <span className="lifecycle-title">{stage.title}</span>
          </li>
        ))}
      </ol>

      <p className="lifecycle-next">
        <b>What happens next:</b> {view.nextStep}
      </p>

      <div className="progress-panel">
        <div>
          <b>At {campaign.outreachTarget} supporters, Open Floor makes a formal interview request to management.</b>
          <span>Reaching the support target does not guarantee an interview — participation is management’s decision.</span>
        </div>
        <div className="progress-meter">
          <div className="progress-bar" role="progressbar" aria-valuenow={campaign.supporters} aria-valuemin={0} aria-valuemax={campaign.outreachTarget}>
            <i style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
          <span>
            {campaign.supporters} of {campaign.outreachTarget} supporters
          </span>
        </div>
      </div>

      <p className="ownership-disclaimer">
        <ShieldCheck size={15} /> Support is self-reported by shareholders. Management participation is voluntary and has not been confirmed
        unless an interview stage explicitly says so.
      </p>
    </section>
  )
}

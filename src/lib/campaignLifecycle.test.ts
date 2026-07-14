import { describe, expect, it } from 'vitest'
import { LIFECYCLE_STAGES, lifecycleForStatus } from './campaignLifecycle'

describe('lifecycleForStatus', () => {
  it('marks support and questions as concurrently current while gathering interest', () => {
    const view = lifecycleForStatus('Gathering shareholder interest')
    expect(view.stages.map(stage => stage.state)).toEqual(['current', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
    expect(view.outcome).toBeUndefined()
  })

  it('never claims a done stage that the status does not prove', () => {
    const view = lifecycleForStatus('Preparing management outreach')
    expect(view.stages[2].state).toBe('current')
    expect(view.stages[3].state).toBe('upcoming')
    expect(view.stages[4].state).toBe('upcoming')
    expect(view.stages[5].state).toBe('upcoming')
  })

  it('management contacted marks the outreach stages done and the contact stage current', () => {
    const view = lifecycleForStatus('Management contacted')
    expect(view.stages.map(stage => stage.state)).toEqual(['done', 'done', 'done', 'current', 'upcoming', 'upcoming'])
  })

  it('interview completed marks everything done with a completed outcome', () => {
    const view = lifecycleForStatus('Interview completed')
    expect(view.stages.every(stage => stage.state === 'done')).toBe(true)
    expect(view.outcome).toBe('completed')
  })

  it('management declined ends at the decision stage without claiming a published interview', () => {
    const view = lifecycleForStatus('Management declined')
    expect(view.outcome).toBe('declined')
    expect(view.stages[5].state).toBe('upcoming')
  })

  it('paused claims no progress at all', () => {
    const view = lifecycleForStatus('Campaign paused')
    expect(view.outcome).toBe('paused')
    expect(view.stages.every(stage => stage.state === 'upcoming')).toBe(true)
  })

  it('an unknown status shows the raw status without fabricating progress', () => {
    const view = lifecycleForStatus('Some future status')
    expect(view.stages.every(stage => stage.state === 'upcoming')).toBe(true)
    expect(view.explanation).toContain('Some future status')
  })

  it.each([
    'Gathering shareholder interest',
    'Preparing management outreach',
    'Management contacted',
    'Management reviewing request',
    'Interview discussions underway',
    'Management declined',
    'Campaign paused',
  ])('"%s" copy never implies guaranteed participation', status => {
    const view = lifecycleForStatus(status)
    const copy = `${view.explanation} ${view.nextStep}`.toLowerCase()
    expect(copy).not.toContain('guaranteed access')
    expect(copy).not.toMatch(/\bwill participate\b/)
    // Pre-decision statuses must carry the voluntary-participation disclaimer.
    if (status !== 'Campaign paused' && status !== 'Management declined') {
      expect(copy).toMatch(/voluntary|does not guarantee/)
    }
  })

  it('exposes exactly the six documented stages', () => {
    expect(LIFECYCLE_STAGES).toHaveLength(6)
    expect(LIFECYCLE_STAGES[0]).toMatch(/build support/i)
    expect(LIFECYCLE_STAGES[5]).toMatch(/interview and transcript/i)
  })
})

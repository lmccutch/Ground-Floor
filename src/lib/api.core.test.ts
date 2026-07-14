import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteQuestion,
  getCampaign,
  getCampaignTimeline,
  getDashboardData,
  getDiscoverHighlights,
  getQuestions,
  isQuestionEditable,
  signInWithMagicLink,
  startCampaign,
  submitFeedback,
  submitQuestion,
  unvoteQuestion,
  updateQuestion,
  voteQuestion,
  type Campaign,
  type Profile,
} from './api'

// Demo-mode coverage for the core-experience additions. Supabase-mode behavior
// (RLS enforcement, cascades, triggers) is verified live by
// scripts/verify-core-experience-security.ts against the scratch project.

const COMPANY = 'apple' // directory key for Apple in companyDirectory.ts

async function signedInUser(): Promise<Profile> {
  const profile = await signInWithMagicLink('core-tests@test.dev')
  if (!profile) throw new Error('demo sign-in should return a profile')
  return profile
}

async function campaignWithQuestion(profile: Profile): Promise<{ campaign: Campaign; questionId: string }> {
  const campaign = await startCampaign(COMPANY, profile.id)
  const question = await submitQuestion(
    COMPANY,
    { text: 'What are the margin assumptions for the next two years?', topic: 'Strategy', shareholderStatus: 'Current shareholder', anonymous: false },
    profile,
  )
  return { campaign: campaign!, questionId: question.id }
}

beforeEach(() => {
  localStorage.clear()
})

describe('question editing (demo mode)', () => {
  it('edits an own open question', async () => {
    const profile = await signedInUser()
    const { questionId } = await campaignWithQuestion(profile)
    const [question] = await getQuestions(COMPANY, profile.id)
    expect(question.isAuthor).toBe(true)
    expect(isQuestionEditable(question)).toBe(true)

    const updated = await updateQuestion(question, { text: 'What are the gross-margin assumptions through 2028?', topic: 'Financial performance' }, profile.id)
    expect(updated?.text).toContain('2028')

    const reloaded = await getQuestions(COMPANY, profile.id)
    expect(reloaded.find(item => item.id === questionId)?.text).toContain('2028')
    expect(reloaded.find(item => item.id === questionId)?.topic).toBe('Financial performance')
  })

  it('is not editable once the status moves past review', () => {
    expect(isQuestionEditable({ isAuthor: true, status: 'Sent to management' })).toBe(false)
    expect(isQuestionEditable({ isAuthor: true, status: 'Answered' })).toBe(false)
    expect(isQuestionEditable({ isAuthor: false, status: 'Open' })).toBe(false)
    expect(isQuestionEditable({ isAuthor: true, status: 'Under review' })).toBe(true)
  })
})

describe('question deletion (demo mode)', () => {
  it('removes the question, its vote, and the campaign counters', async () => {
    const profile = await signedInUser()
    const { questionId } = await campaignWithQuestion(profile)
    let [question] = await getQuestions(COMPANY, profile.id)
    await voteQuestion(question, profile.id)
    ;[question] = await getQuestions(COMPANY, profile.id)
    expect(question.votes).toBe(1)

    const deleted = await deleteQuestion(question, profile.id)
    expect(deleted).toBe(true)
    expect(await getQuestions(COMPANY, profile.id)).toHaveLength(0)

    // No orphaned counters: the campaign's question and vote counts return to zero.
    const campaign = await getCampaign(COMPANY, profile.id)
    expect(campaign?.questions).toBe(0)
    expect(campaign?.votes).toBe(0)

    // No orphaned dashboard records either.
    const dashboard = await getDashboardData(profile.id)
    expect(dashboard.submitted.find(item => item.id === questionId)).toBeUndefined()
    expect(dashboard.voted.find(item => item.id === questionId)).toBeUndefined()
  })
})

describe('vote removal (demo mode)', () => {
  it('removes a vote, persists it, and updates counts', async () => {
    const profile = await signedInUser()
    await campaignWithQuestion(profile)
    let [question] = await getQuestions(COMPANY, profile.id)
    await voteQuestion(question, profile.id)
    ;[question] = await getQuestions(COMPANY, profile.id)
    expect(question.votedByUser).toBe(true)

    const removed = await unvoteQuestion(question, profile.id)
    expect(removed).toBe(true)
    ;[question] = await getQuestions(COMPANY, profile.id)
    expect(question.votedByUser).toBe(false)
    expect(question.votes).toBe(0)
    expect((await getCampaign(COMPANY, profile.id))?.votes).toBe(0)

    // Removing again is a no-op, not an error.
    expect(await unvoteQuestion(question, profile.id)).toBe(false)
  })
})

describe('campaign timeline (demo mode)', () => {
  it('starts with only the launch event and invents no milestone dates', async () => {
    const profile = await signedInUser()
    const campaign = (await startCampaign(COMPANY, profile.id))!
    const events = await getCampaignTimeline(campaign)
    expect(events).toHaveLength(1)
    expect(events[0].kind).toBe('launch')
    expect(events[0].at).toBeTruthy()
  })

  it('shows a reached milestone without a date rather than inventing one', async () => {
    const profile = await signedInUser()
    const campaign = (await startCampaign(COMPANY, profile.id))!
    const events = await getCampaignTimeline({ ...campaign, supporters: 25 })
    const milestones = events.filter(event => event.kind === 'milestone')
    expect(milestones.map(event => event.label)).toEqual(['10 supporters reached', '25 supporters reached'])
    expect(milestones.every(event => event.at === undefined)).toBe(true)
  })
})

describe('feedback (demo mode)', () => {
  it('accepts and stores feedback locally', async () => {
    const profile = await signedInUser()
    await submitFeedback({ category: 'Feature request', message: 'Add sector pages', pagePath: '/discover' }, profile.id)
    const stored = JSON.parse(localStorage.getItem('groundfloor-mvp') || '{}') as { feedback?: unknown[] }
    expect(stored.feedback).toHaveLength(1)
  })
})

describe('discover highlights (demo mode)', () => {
  it('returns empty sections when no campaigns exist — nothing is manufactured', async () => {
    const highlights = await getDiscoverHighlights()
    expect(highlights.newest).toEqual([])
    expect(highlights.mostSupported).toEqual([])
    expect(highlights.mostVoted).toEqual([])
    expect(highlights.nearThreshold).toEqual([])
  })

  it('lists a started campaign under newest only until it has real support/votes', async () => {
    const profile = await signedInUser()
    await startCampaign(COMPANY, profile.id)
    const highlights = await getDiscoverHighlights()
    expect(highlights.newest.map(item => item.ticker)).toEqual(['AAPL'])
    expect(highlights.mostSupported).toEqual([])
    expect(highlights.mostVoted).toEqual([])
  })
})

describe('dashboard activity (demo mode)', () => {
  it('lists submitted questions as dated activity entries', async () => {
    const profile = await signedInUser()
    await campaignWithQuestion(profile)
    const dashboard = await getDashboardData(profile.id)
    expect(dashboard.activity).toHaveLength(1)
    expect(dashboard.activity[0].kind).toBe('question')
    expect(dashboard.activity[0].at).toBeTruthy()
  })
})

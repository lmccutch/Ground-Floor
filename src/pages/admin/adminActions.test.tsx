import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* ===========================================================================
   Prompt 3 mutation-safety invariants. Operational actions now EXIST, but they
   must still go only through narrow, is_admin()-guarded RPCs — never a direct
   client table write and never a generic "update any record" endpoint — and
   high-impact actions must confirm and (where required) collect a reason before
   the RPC is ever called. Opening a record must not mutate it.
   =========================================================================== */

const adminApiSrc = import.meta.glob('../../lib/adminApi.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('mutation safety — static audit of the data layer', () => {
  const src = Object.values(adminApiSrc)[0]

  it('performs no direct client table writes — every write is an RPC', () => {
    const WRITE = /\.(insert|update|upsert|delete)\s*\(/g
    const offenders = (src.match(WRITE) ?? [])
    expect(offenders, `Direct table write in adminApi:\n${offenders.join('\n')}`).toEqual([])
  })

  it('calls only a fixed allowlist of narrow mutation RPCs — no generic mutator', () => {
    const rpcNames = [...src.matchAll(/\.rpc\(\s*['"]([a-z_]+)['"]/g)].map(m => m[1])
    const mutating = rpcNames.filter(n => /update|approve|reject|moderate|resolve|dismiss|mark_|record_/.test(n))
    const allowed = new Set([
      'admin_update_company_request',
      'admin_approve_company_request',
      'admin_update_campaign_ops',
      'admin_moderate_question',
      'admin_resolve_report',
      'admin_update_bug',
      'admin_update_support_ticket',
      'admin_record_support_response',
      'admin_mark_notification_read',
      'admin_dismiss_notification',
    ])
    const unexpected = mutating.filter(n => !allowed.has(n))
    expect(unexpected, `Unexpected/generic mutation RPC:\n${unexpected.join('\n')}`).toEqual([])
    // Guard against an arbitrary-table mutator sneaking in.
    expect(src).not.toMatch(/admin_update_record|admin_mutate|exec_sql|admin_update_table/)
  })
})

/* ------------------------------ question moderation ------------------------ */

const questions = [
  {
    id: 'q-1',
    text: 'Why did margins fall?',
    topic: 'Financials',
    status: 'Open',
    moderationStatus: 'pending_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAnonymous: false,
    authorName: 'Investor A',
    companyName: 'Example Corp',
    ticker: 'EXC',
    companyId: 'c-1',
    votes: 3,
    reportCount: 0,
  },
]

const moderateQuestion = vi.fn(async () => {})
const getQuestions = vi.fn(async () => ({ rows: questions, total: questions.length }))

const notifications = [
  { id: 'n-1', type: 'question_reported', title: 'A question was reported', message: 'off-topic', severity: 'medium', createdAt: new Date().toISOString(), readAt: undefined, dismissedAt: undefined },
]
const markNotificationRead = vi.fn(async () => {})
const dismissNotification = vi.fn(async () => {})

vi.mock('../../lib/adminApi', () => ({
  getQuestions,
  moderateQuestion,
  getNotifications: vi.fn(async () => ({ rows: notifications, total: notifications.length })),
  markNotificationRead,
  dismissNotification,
}))

async function openFirstRow(text: RegExp) {
  const row = await screen.findByText(text)
  fireEvent.click(row)
  return screen.findByRole('dialog')
}

describe('question moderation actions', () => {
  beforeEach(async () => {
    moderateQuestion.mockClear()
    const { QuestionsPage } = await import('./pages/QuestionsPage')
    render(
      <MemoryRouter initialEntries={['/admin/questions']}>
        <QuestionsPage />
      </MemoryRouter>,
    )
  })

  it('opening a question does not mutate it', async () => {
    await openFirstRow(/margins fall/i)
    expect(moderateQuestion).not.toHaveBeenCalled()
  })

  it('shows state-appropriate action controls in the detail drawer', async () => {
    const drawer = await openFirstRow(/margins fall/i)
    // pending_review question can be published, hidden, removed, archived
    expect(within(drawer).getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Hide' })).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    // …but not Restore (it isn't hidden/removed/archived)
    expect(within(drawer).queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument()
  })

  it('a high-impact action opens a confirmation dialog and only calls the RPC on confirm', async () => {
    const drawer = await openFirstRow(/margins fall/i)
    fireEvent.click(within(drawer).getByRole('button', { name: 'Remove' }))
    // A confirmation dialog appears; the RPC has NOT been called yet.
    const confirm = await screen.findByRole('dialog', { name: 'Remove' })
    expect(moderateQuestion).not.toHaveBeenCalled()
    // Confirm the action (a structured reason is preselected).
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(moderateQuestion).toHaveBeenCalledTimes(1))
    expect(moderateQuestion).toHaveBeenCalledWith(expect.objectContaining({ id: 'q-1', action: 'remove' }))
  })
})

describe('notification actions', () => {
  beforeEach(async () => {
    markNotificationRead.mockClear()
    const { NotificationsPage } = await import('./pages/NotificationsPage')
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <NotificationsPage />
      </MemoryRouter>,
    )
  })

  it('mark read is a low-risk action that runs immediately without a dialog', async () => {
    const drawer = await openFirstRow(/a question was reported/i)
    fireEvent.click(within(drawer).getByRole('button', { name: 'Mark read' }))
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith({ id: 'n-1', read: true }))
  })
})

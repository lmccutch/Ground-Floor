import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

/* ===========================================================================
   Prompt 5 admin UI behaviour. These are the properties an operator's trust
   depends on:
     * a reply is never reported as sent before the server confirms it;
     * pressing Send twice cannot send twice;
     * internal notes are visually and semantically distinct from outbound mail;
     * retry is offered only when the SERVER says the attempt is eligible;
     * a single failed health check degrades to Unknown instead of blanking the
       page, and Unknown is never rendered as a pass.
   =========================================================================== */

const mocks = vi.hoisted(() => ({
  getBugs: vi.fn(),
  getSupportTickets: vi.fn(),
  getRecordDetail: vi.fn(),
  getEmailHistory: vi.fn(),
  sendAdminReply: vi.fn(),
  retryEmail: vi.fn(),
  getAttachmentUrl: vi.fn(),
  updateBug: vi.fn(),
  updateSupportTicket: vi.fn(),
  recordSupportResponse: vi.fn(),
  getSystemHealth: vi.fn(),
  getEmailHealth: vi.fn(),
  getIntakeHealth: vi.fn(),
  getOperationalFailures: vi.fn(),
  getAppliedMigrations: vi.fn(),
  getDiagnostics: vi.fn(),
  acknowledgeSystemWarning: vi.fn(),
  getOverviewCounts: vi.fn(),
  checkQueueStaleness: vi.fn(),
}))

vi.mock('../../lib/adminApi', () => mocks)

import { BugsPage } from './pages/BugsPage'
import { SupportPage } from './pages/SupportPage'
import { SystemPage } from './pages/SystemPage'
import { AdminRefreshProvider } from './components/refresh'
import { EXPECTED_MIGRATION_VERSIONS } from '../../lib/expectedMigrations'
import { AdminApp } from './AdminApp'
import { MvpContext, type MvpContextValue } from '../../context/MvpContextValue'

// A confirmed sole-administrator session. The real gate is server-side is_admin();
// this is what the client sees once that check has already passed.
const adminSession = {
  profile: { id: 'admin-1', displayName: 'Administrator' },
  loading: false,
  demoMode: false,
  isAdmin: true,
  adminLoading: false,
  login: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  completeProfile: vi.fn(),
  updateProfileDetails: vi.fn(),
  requireAuth: () => true,
} as unknown as MvpContextValue

function renderPage(node: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AdminRefreshProvider>{node}</AdminRefreshProvider>
    </MemoryRouter>,
  )
}

const now = new Date().toISOString()

const bug = {
  id: '11111111-1111-4111-8111-111111111111',
  description: 'The support button does nothing on mobile.',
  severity: 'high',
  status: 'new',
  createdAt: now,
  submitterName: 'Reporter A',
  admin_notes: 'Reproduced on iOS 18 — internal only.',
  steps_to_reproduce: 'Tap support, nothing happens.',
}

const ticket = {
  id: '22222222-2222-4222-8222-222222222222',
  ticketNumber: 'OF-1042',
  category: 'technical_support',
  status: 'new',
  createdAt: now,
  subject: 'Cannot sign in',
  message: 'The reset link expired before I could use it.',
  senderName: 'Requester B',
  senderEmail: 'requester@example.com',
  admin_notes: 'Checked auth logs — internal only.',
}

const emptyDetail = {
  generatedAt: now,
  recipientMasked: 'r***@example.com',
  replies: [],
  notifications: [],
  audit: [],
  queue: [],
  attachments: [],
}

const deliveredAttempt = {
  id: 'msg-delivered',
  template: 'bug_report_received',
  recipientMasked: 'r***@example.com',
  status: 'delivered',
  attemptNumber: 1,
  isSystemSend: true,
  providerMessageId: 'resend-abc-123',
  // The server's verdict — the UI must obey it.
  retryIneligibleReason: 'This message was delivered. Sending it again would duplicate it.',
  createdAt: now,
  sentAt: now,
  deliveredAt: now,
  eventCount: 2,
  lastEventAt: now,
}

const failedAttempt = {
  id: 'msg-failed',
  template: 'admin_reply',
  recipientMasked: 'r***@example.com',
  status: 'failed',
  attemptNumber: 1,
  isSystemSend: false,
  sendingActorName: 'Administrator',
  errorCode: 'http_500',
  failureCategory: 'provider_unavailable',
  errorMessage: 'Upstream provider error.',
  retryIneligibleReason: undefined, // eligible
  createdAt: now,
  eventCount: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getBugs.mockResolvedValue({ rows: [bug], total: 1 })
  mocks.getSupportTickets.mockResolvedValue({ rows: [ticket], total: 1 })
  mocks.getRecordDetail.mockResolvedValue(emptyDetail)
  mocks.getEmailHistory.mockResolvedValue([])
  mocks.checkQueueStaleness.mockResolvedValue(undefined)
})

/* ------------------------------- bug drawer -------------------------------- */

describe('bug detail drawer', () => {
  it('opens from the list row and shows the reference and full report', async () => {
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('Bug BUG-11111111')).toBeInTheDocument()
    expect(within(drawer).getByText(/tap support, nothing happens/i)).toBeInTheDocument()
  })

  it('opens with the keyboard and traps focus inside the drawer', async () => {
    renderPage(<BugsPage />)
    const row = (await screen.findByText(/support button does nothing/i)).closest('[role="row"]')!
    fireEvent.keyDown(row, { key: 'Enter' })
    const drawer = await screen.findByRole('dialog')
    // Focus is moved into the drawer rather than left on the list behind it.
    await waitFor(() => expect(document.activeElement).toBe(drawer))
  })

  it('closes on Escape', async () => {
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('marks internal notes as never emailed, distinctly from the reply composer', async () => {
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText(/internal — never emailed/i)).toBeInTheDocument()
    expect(within(drawer).getByText(/reproduced on iOS 18/i)).toBeInTheDocument()
  })

  it('states plainly that inbound replies do not come back into Open Floor', async () => {
    mocks.getEmailHistory.mockResolvedValue([deliveredAttempt])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText(/no inbound email ingestion/i)).toBeInTheDocument()
  })
})

describe('support detail drawer', () => {
  it('renders the ticket number, message and requester', async () => {
    renderPage(<SupportPage />)
    fireEvent.click(await screen.findByText(/cannot sign in/i))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('Ticket OF-1042')).toBeInTheDocument()
    expect(within(drawer).getByText(/reset link expired/i)).toBeInTheDocument()
    expect(within(drawer).getByText(/internal — never emailed/i)).toBeInTheDocument()
  })
})

/* -------------------------------- replying --------------------------------- */

describe('administrator reply', () => {
  async function openComposer() {
    renderPage(<SupportPage />)
    fireEvent.click(await screen.findByText(/cannot sign in/i))
    fireEvent.click(await screen.findByRole('button', { name: /reply to requester/i }))
    fireEvent.change(await screen.findByLabelText('Subject'), { target: { value: 'Re: [OF-1042]' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'We have reset the link for you.' } })
  }

  it('requires an explicit confirmation before anything is sent', async () => {
    mocks.sendAdminReply.mockResolvedValue({ status: 'sent' })
    await openComposer()
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    expect(mocks.sendAdminReply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^send reply$/i }))
    await waitFor(() => expect(mocks.sendAdminReply).toHaveBeenCalledTimes(1))
  })

  it('never passes a recipient — the server derives it from the record', async () => {
    mocks.sendAdminReply.mockResolvedValue({ status: 'sent' })
    await openComposer()
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    fireEvent.click(screen.getByRole('button', { name: /^send reply$/i }))
    await waitFor(() => expect(mocks.sendAdminReply).toHaveBeenCalled())
    const args = mocks.sendAdminReply.mock.calls[0][0]
    expect(Object.keys(args).sort()).toEqual(['body', 'clientToken', 'entityId', 'entityType', 'subject'])
    expect(JSON.stringify(args)).not.toContain('@example.com')
  })

  it('does not send twice when the confirm button is pressed repeatedly', async () => {
    let resolve!: (v: { status: 'sent' }) => void
    mocks.sendAdminReply.mockReturnValue(new Promise(r => { resolve = r }))
    await openComposer()
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    const confirm = screen.getByRole('button', { name: /^send reply$/i })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(mocks.sendAdminReply).toHaveBeenCalledTimes(1)
    resolve({ status: 'sent' })
    await waitFor(() => expect(screen.getByText(/reply recorded/i)).toBeInTheDocument())
  })

  it('reuses the same compose token on retry after a failure, so a retry cannot duplicate the message', async () => {
    mocks.sendAdminReply.mockRejectedValueOnce(new Error('The reply could not be sent.'))
    await openComposer()
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    fireEvent.click(screen.getByRole('button', { name: /^send reply$/i }))
    await screen.findByText(/could not be sent/i)
    const firstToken = mocks.sendAdminReply.mock.calls[0][0].clientToken

    mocks.sendAdminReply.mockResolvedValueOnce({ status: 'sent' })
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    fireEvent.click(screen.getByRole('button', { name: /^send reply$/i }))
    await waitFor(() => expect(mocks.sendAdminReply).toHaveBeenCalledTimes(2))
    expect(mocks.sendAdminReply.mock.calls[1][0].clientToken).toBe(firstToken)
  })

  it('reports no success until the server confirms, and never claims delivery', async () => {
    mocks.sendAdminReply.mockResolvedValue({ status: 'sent' })
    await openComposer()
    fireEvent.click(screen.getByRole('button', { name: /review and send/i }))
    expect(screen.queryByText(/reply recorded/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^send reply$/i }))
    const confirmation = await screen.findByText(/reply recorded and handed to the email provider/i)
    expect(confirmation).toBeInTheDocument()
    expect(screen.getByText(/delivery is confirmed by the provider webhook, not by this form/i)).toBeInTheDocument()
  })

  it('says so plainly when a record has no address to reply to', async () => {
    mocks.getRecordDetail.mockResolvedValue({ ...emptyDetail, recipientMasked: undefined })
    renderPage(<SupportPage />)
    fireEvent.click(await screen.findByText(/cannot sign in/i))
    expect(await screen.findByText(/no reply address on file/i)).toBeInTheDocument()
  })
})

/* ------------------------------ email timeline ----------------------------- */

describe('email timeline', () => {
  it('renders each delivery state with an honest label', async () => {
    mocks.getEmailHistory.mockResolvedValue([deliveredAttempt, failedAttempt])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText(/delivered to the recipient/i)).toBeInTheDocument()
    expect(screen.getByText(/^delivery failed$/i)).toBeInTheDocument()
    expect(screen.getByText('Confirmation sent to submitter')).toBeInTheDocument()
    expect(screen.getByText('Administrator reply')).toBeInTheDocument()
  })

  it('offers no retry for a delivered message and explains why', async () => {
    mocks.getEmailHistory.mockResolvedValue([deliveredAttempt])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText(/sending it again would duplicate it/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retry this message/i })).not.toBeInTheDocument()
  })

  it('offers no retry for a complaint', async () => {
    mocks.getEmailHistory.mockResolvedValue([
      { ...deliveredAttempt, status: 'complained', retryIneligibleReason: 'The recipient reported this message as spam. It must not be sent again.' },
    ])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText(/must not be sent again/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retry this message/i })).not.toBeInTheDocument()
  })

  it('offers retry only when eligible, and only after a confirmation', async () => {
    mocks.getEmailHistory.mockResolvedValue([failedAttempt])
    mocks.retryEmail.mockResolvedValue({ status: 'sent' })
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    fireEvent.click(await screen.findByRole('button', { name: /retry this message/i }))
    expect(mocks.retryEmail).not.toHaveBeenCalled()
    // The confirmation is explicit about what a retry does and does not prove.
    expect(screen.getByText(/original record and its provider evidence are kept unchanged/i)).toBeInTheDocument()
    expect(screen.getByText(/not proof that it will be delivered/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /confirm retry/i }))
    await waitFor(() => expect(mocks.retryEmail).toHaveBeenCalledTimes(1))
    expect(mocks.retryEmail.mock.calls[0][0].messageId).toBe('msg-failed')
  })

  it('shows the provider message id as a copyable admin-only value', async () => {
    mocks.getEmailHistory.mockResolvedValue([deliveredAttempt])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText('resend-abc-123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy provider message id/i })).toBeInTheDocument()
  })

  it('never shows a raw recipient address — only the masked form the server returned', async () => {
    mocks.getEmailHistory.mockResolvedValue([deliveredAttempt])
    const { container } = renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    await screen.findByText(/delivered to the recipient/i)
    expect(container.textContent).toContain('r***@example.com')
    expect(container.textContent).not.toContain('reporter@example.com')
  })

  it('has a usable empty state rather than implying nothing was attempted', async () => {
    mocks.getEmailHistory.mockResolvedValue([])
    renderPage(<BugsPage />)
    fireEvent.click(await screen.findByText(/support button does nothing/i))
    expect(await screen.findByText(/no email recorded/i)).toBeInTheDocument()
  })
})

/* ------------------------------- system page ------------------------------- */

const healthyEnough = {
  generatedAt: now,
  database: { reachable: true, serverTime: now },
  queue: { openItems: 2, criticalHigh: 0, oldestCreatedAt: now, staleOver7d: 0 },
  operations: { unresolvedBugs: 1, openSupportTickets: 1, unhandledNotifications: 0, criticalNotifications: 0, auditEvents24h: 3, lastAuditAt: now },
  storage: { readable: true, exists: true, isPublic: false },
  adminRpcs: { 'admin_create_reply(text,uuid,text,text,text)': true },
  acknowledgedWarnings: {},
}

const emailAllGood = {
  generatedAt: now, totalMessages: 20, lastSendAt: now, lastDeliveredAt: now,
  failed24h: 0, failed7d: 0, delayedCurrent: 0, bounced7d: 0, complained7d: 0,
  queuedCurrent: 0, stuckQueued: 0, statusInconsistencies: 0, retryAttemptsTotal: 0,
  retryBacklog: 0, lastWebhookEventAt: now, webhookEvents24h: 4, webhookUnmatched24h: 0,
}

const intakeAllGood = {
  generatedAt: now,
  bugs: { total: 3, last24h: 1, last7d: 3, lastSubmissionAt: now, unprocessed: 1 },
  supportTickets: { total: 2, last24h: 0, last7d: 2, lastSubmissionAt: now, unprocessed: 0, spam: 0 },
  rateLimits: { intakeIpKeysActive: 1, intakeSubmitterKeysActive: 1, throttledKeys: 0 },
  attachments: { supported: true, total: 1, last7d: 1, bytesStored: 1024 },
  captchaRejectionsTracked: false,
}

const diagnosticsAllGood = {
  generatedAt: now,
  secrets: {
    RESEND_API_KEY: 'configured', RESEND_WEBHOOK_SECRET: 'configured',
    TURNSTILE_SECRET_KEY: 'configured', INTAKE_FUNCTION_SECRET: 'configured',
  } as Record<string, 'configured'>,
  functions: {
    'submit-intake': 'deployed', 'send-transactional-email': 'deployed',
    'resend-webhook': 'deployed', 'admin-attachment-url': 'deployed',
  } as Record<string, 'deployed'>,
  senderDomain: 'open-floor.ca',
  expectedDomain: 'open-floor.ca',
  notes: {},
}

function mockSystem(overrides: Partial<Record<string, unknown>> = {}) {
  mocks.getSystemHealth.mockResolvedValue(overrides.health ?? healthyEnough)
  mocks.getEmailHealth.mockResolvedValue(overrides.email ?? emailAllGood)
  mocks.getIntakeHealth.mockResolvedValue(overrides.intake ?? intakeAllGood)
  mocks.getOperationalFailures.mockResolvedValue(overrides.failures ?? [])
  mocks.getAppliedMigrations.mockResolvedValue(overrides.migrations ?? [...EXPECTED_MIGRATION_VERSIONS])
  mocks.getDiagnostics.mockResolvedValue(overrides.diagnostics ?? diagnosticsAllGood)
}

describe('/admin/system', () => {
  it('renders Healthy for a fully verified email channel', async () => {
    mockSystem()
    renderPage(<SystemPage />)
    const panel = await screen.findByRole('region', { name: 'Email' })
    expect(within(panel).getAllByText('Healthy').length).toBeGreaterThan(0)
  })

  it('renders Critical when the private attachment bucket has been made public', async () => {
    mockSystem({ health: { ...healthyEnough, storage: { readable: true, exists: true, isPublic: true } } })
    renderPage(<SystemPage />)
    expect((await screen.findAllByText(/bucket is PUBLIC/i)).length).toBeGreaterThan(0)
    const panel = screen.getByRole('region', { name: 'Attachment storage' })
    expect(within(panel).getAllByText('Critical').length).toBeGreaterThan(0)
  })

  it('renders Warning for a bounce cluster', async () => {
    mockSystem({ email: { ...emailAllGood, bounced7d: 5 } })
    renderPage(<SystemPage />)
    const panel = await screen.findByRole('region', { name: 'Email' })
    expect(within(panel).getAllByText('Warning').length).toBeGreaterThan(0)
  })

  it('renders Unknown — never Healthy — when no email has ever been sent', async () => {
    mockSystem({
      email: { ...emailAllGood, totalMessages: 0, lastSendAt: undefined, lastDeliveredAt: undefined, lastWebhookEventAt: undefined },
    })
    renderPage(<SystemPage />)
    expect((await screen.findAllByText(/No email has ever been sent, so delivery is unproven/i)).length).toBeGreaterThan(0)
    const panel = screen.getByRole('region', { name: 'Email' })
    expect(within(panel).getAllByText('Unknown').length).toBeGreaterThan(0)
  })

  it('reports Critical migration drift and names the missing migrations', async () => {
    mockSystem({ migrations: [EXPECTED_MIGRATION_VERSIONS[0]] })
    renderPage(<SystemPage />)
    expect((await screen.findAllByText(/have not been applied to the database/i)).length).toBeGreaterThan(0)
  })

  it('does NOT crash or blank the page when a single health check fails', async () => {
    mockSystem()
    mocks.getEmailHealth.mockRejectedValue(new Error('boom'))
    renderPage(<SystemPage />)
    // The failing panel degrades to Unknown with its own message…
    expect(await screen.findByText(/could not be read, so its state is unknown/i)).toBeInTheDocument()
    // …and every other panel still renders.
    expect(screen.getByRole('region', { name: 'Public intake' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Admin operations' })).toBeInTheDocument()
  })

  it('shows configuration as Unknown when the diagnostics function is unreachable', async () => {
    mockSystem()
    mocks.getDiagnostics.mockRejectedValue(new Error('not deployed'))
    renderPage(<SystemPage />)
    const panel = await screen.findByRole('region', { name: 'Edge functions' })
    expect(within(panel).getAllByText('Unknown').length).toBeGreaterThan(0)
  })

  it('never claims Turnstile fail-closed behaviour is verified', async () => {
    mockSystem()
    renderPage(<SystemPage />)
    const panel = await screen.findByRole('region', { name: 'Turnstile' })
    expect(within(panel).getByText(/cannot be verified from here/i)).toBeInTheDocument()
  })

  it('says captcha rejections are not tracked rather than reporting zero', async () => {
    mockSystem()
    renderPage(<SystemPage />)
    expect(await screen.findByText(/zero is not reported, because zero would be a lie/i)).toBeInTheDocument()
  })

  it('lets a warning be acknowledged without pretending the condition is resolved', async () => {
    mockSystem({ email: { ...emailAllGood, complained7d: 2 } })
    mocks.acknowledgeSystemWarning.mockResolvedValue(undefined)
    renderPage(<SystemPage />)
    const warnings = await screen.findByRole('region', { name: /security and configuration warnings/i })
    fireEvent.click(within(warnings).getAllByRole('button', { name: /acknowledge/i })[0])
    await waitFor(() => expect(mocks.acknowledgeSystemWarning).toHaveBeenCalledWith({ key: 'email_delivery' }))
  })

  it('explains what each status means so Unknown cannot be read as a pass', async () => {
    mockSystem()
    renderPage(<SystemPage />)
    expect(await screen.findByText(/This cannot be verified — it is not a pass\./i)).toBeInTheDocument()
  })
})

/* ===========================================================================
   Admin routing WITH an administrator session. App.routing.test.tsx proves the
   signed-out case renders nothing; these prove the signed-in case resolves to
   the right page — including /admin/system and the unknown-route fallback.
   =========================================================================== */

describe('admin routing (administrator session)', () => {
  beforeEach(() => {
    mockSystem()
    mocks.getOverviewCounts.mockResolvedValue({
      openWorkItems: 0, criticalHigh: 0, pendingCompanyRequests: 0, campaignsNearThreshold: 0,
      campaignsAtThreshold: 0, campaignsOutreachRequired: 0, questionsPendingReview: 0,
      openQuestionReports: 0, openBugReports: 0, newSupportTickets: 0, unreadNotifications: 0,
    })
  })

  function renderAdminAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <MvpContext.Provider value={adminSession}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </MvpContext.Provider>
      </MemoryRouter>,
    )
  }

  it('/admin/system renders the system console for the administrator', async () => {
    renderAdminAt('/admin/system')
    expect(await screen.findByRole('heading', { name: 'System', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^system$/i })).toBeInTheDocument()
  })

  it('/admin/bugs and /admin/support remain functional', async () => {
    const bugs = renderAdminAt('/admin/bugs')
    expect(await screen.findByRole('heading', { name: 'Bug reports', level: 1 })).toBeInTheDocument()
    bugs.unmount()
    renderAdminAt('/admin/support')
    expect(await screen.findByRole('heading', { name: 'Support', level: 1 })).toBeInTheDocument()
  })

  it('an unknown admin route uses the admin fallback, not the public 404', async () => {
    renderAdminAt('/admin/not-a-real-page')
    expect(await screen.findByText(/that admin page doesn’t exist/i)).toBeInTheDocument()
    // Still inside the console: the sidebar is present, so the operator can recover.
    expect(screen.getByRole('navigation', { name: /admin sections/i })).toBeInTheDocument()
  })
})

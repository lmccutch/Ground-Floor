// Read-only data layer for the Admin Action Centre. Every function requires the
// authenticated sole-admin session; access is enforced server-side by is_admin()
// (RLS + guarded SECURITY DEFINER RPCs). Nothing here mutates data. The service
// role is never used in the browser — only the admin's own session.

import { supabase } from './supabase'
import { THRESHOLDS } from './systemHealth'

function client() {
  if (!supabase) throw new Error('admin_unavailable')
  return supabase
}

type Row = Record<string, unknown>
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0)) || 0
const str = (v: unknown) => (v == null ? undefined : String(v))
// List RPCs return total_count as a window function on every row; read it off the
// first row (falling back to the page length when the page is empty).
const totalOf = (data: unknown, fallback: number) => num((Array.isArray(data) ? (data[0] as Row) : undefined)?.total_count) || fallback

/* --------------------------------- overview -------------------------------- */

export type OverviewCounts = {
  openWorkItems: number
  criticalHigh: number
  pendingCompanyRequests: number
  campaignsNearThreshold: number
  campaignsAtThreshold: number
  campaignsOutreachRequired: number
  questionsPendingReview: number
  openQuestionReports: number
  openBugReports: number
  newSupportTickets: number
  unreadNotifications: number
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
  const { data, error } = await client().rpc('admin_overview_counts')
  if (error) throw error
  const r = (Array.isArray(data) ? data[0] : data) as Row
  return {
    openWorkItems: num(r?.open_work_items),
    criticalHigh: num(r?.critical_high),
    pendingCompanyRequests: num(r?.pending_company_requests),
    campaignsNearThreshold: num(r?.campaigns_near_threshold),
    campaignsAtThreshold: num(r?.campaigns_at_threshold),
    campaignsOutreachRequired: num(r?.campaigns_outreach_required),
    questionsPendingReview: num(r?.questions_pending_review),
    openQuestionReports: num(r?.open_question_reports),
    openBugReports: num(r?.open_bug_reports),
    newSupportTickets: num(r?.new_support_tickets),
    unreadNotifications: num(r?.unread_notifications),
  }
}

/* -------------------------------- work queue ------------------------------- */

export type WorkItem = {
  itemType: string
  itemId: string
  title: string
  summary: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  entityPath: string
  reason: string
}

export async function getWorkQueue(): Promise<WorkItem[]> {
  const { data, error } = await client().rpc('admin_work_queue')
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    itemType: String(r.item_type),
    itemId: String(r.item_id),
    title: String(r.title ?? ''),
    summary: String(r.summary ?? ''),
    priority: String(r.priority ?? 'normal'),
    status: String(r.status ?? ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at ?? r.created_at),
    entityPath: String(r.entity_path ?? ''),
    reason: String(r.reason_for_attention ?? ''),
  }))
}

/* -------------------------------- campaigns -------------------------------- */

export type AdminCampaign = {
  campaignId: string
  companyId: string
  companyName: string
  ticker?: string
  exchange?: string
  publicStatus: string
  operationalStatus: string
  supporters: number
  supporterThreshold: number
  progressPct: number
  band: string
  questions: number
  reportedQuestions: number
  thresholdReachedAt?: string
  assignedAdmin?: string
  assignedAdminName?: string
  managementContactStatus?: string
  lastOutreachAt?: string
  nextFollowUpAt?: string
  riskStatus?: string
  internalNotes?: string
  closedReason?: string
  launchedAt?: string
  updatedAt?: string
  totalCount: number
}

export type ListParams = { search?: string; limit?: number; offset?: number }

export async function getCampaigns(params: ListParams & { band?: string } = {}): Promise<AdminCampaign[]> {
  const { data, error } = await client().rpc('admin_campaigns_list', {
    p_band: params.band ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    campaignId: String(r.campaign_id),
    companyId: String(r.company_id),
    companyName: String(r.company_name ?? ''),
    ticker: str(r.ticker),
    exchange: str(r.exchange),
    publicStatus: String(r.public_status ?? ''),
    operationalStatus: String(r.operational_status ?? ''),
    supporters: num(r.supporters),
    supporterThreshold: num(r.supporter_threshold),
    progressPct: num(r.progress_pct),
    band: String(r.band ?? 'other'),
    questions: num(r.questions),
    reportedQuestions: num(r.reported_questions),
    thresholdReachedAt: str(r.threshold_reached_at),
    assignedAdmin: str(r.assigned_admin),
    assignedAdminName: str(r.assigned_admin_name),
    managementContactStatus: str(r.management_contact_status),
    lastOutreachAt: str(r.last_outreach_at),
    nextFollowUpAt: str(r.next_follow_up_at),
    riskStatus: str(r.risk_status),
    internalNotes: str(r.internal_notes),
    closedReason: str(r.closed_reason),
    launchedAt: str(r.launched_at),
    updatedAt: str(r.updated_at),
    totalCount: num(r.total_count),
  }))
}

/* ----------------------------- company requests ---------------------------- */

export type AdminCompanyRequest = {
  id: string
  companyName: string
  ticker?: string
  status: string
  priority: string
  requestedBy?: string
  requesterName?: string
  createdAt: string
  updatedAt?: string
  reviewedBy?: string
  reviewerName?: string
  reviewedAt?: string
  rejectionReason?: string
  adminNotes?: string
  duplicateOfRequestId?: string
  createdCompanyId?: string
  totalCount: number
}

export async function getCompanyRequests(params: ListParams & { status?: string } = {}): Promise<AdminCompanyRequest[]> {
  const { data, error } = await client().rpc('admin_company_requests_list', {
    p_status: params.status ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    companyName: String(r.company_name ?? ''),
    ticker: str(r.ticker),
    status: String(r.status ?? ''),
    priority: String(r.priority ?? 'normal'),
    requestedBy: str(r.requested_by),
    requesterName: str(r.requester_name),
    createdAt: String(r.created_at),
    updatedAt: str(r.updated_at),
    reviewedBy: str(r.reviewed_by),
    reviewerName: str(r.reviewer_name),
    reviewedAt: str(r.reviewed_at),
    rejectionReason: str(r.rejection_reason),
    adminNotes: str(r.admin_notes),
    duplicateOfRequestId: str(r.duplicate_of_request_id),
    createdCompanyId: str(r.created_company_id),
    totalCount: num(r.total_count),
  }))
}

/* ---------------------------------- users ---------------------------------- */

export type AdminUser = {
  id: string
  username?: string
  displayName?: string
  investorType?: string
  createdAt: string
  emailConfirmed: boolean
  lastSignInAt?: string
  questionsCount: number
  votesCount: number
  supportedCount: number
  requestsCount: number
  reportsSubmitted: number
  bugReportsCount: number
  supportTicketsCount: number
  totalCount: number
}

export async function getUsers(params: ListParams = {}): Promise<AdminUser[]> {
  const { data, error } = await client().rpc('admin_users_list', {
    p_search: params.search || null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    username: str(r.username),
    displayName: str(r.display_name),
    investorType: str(r.investor_type),
    createdAt: String(r.created_at),
    emailConfirmed: Boolean(r.email_confirmed),
    lastSignInAt: str(r.last_sign_in_at),
    questionsCount: num(r.questions_count),
    votesCount: num(r.votes_count),
    supportedCount: num(r.supported_count),
    requestsCount: num(r.requests_count),
    reportsSubmitted: num(r.reports_submitted),
    bugReportsCount: num(r.bug_reports_count),
    supportTicketsCount: num(r.support_tickets_count),
    totalCount: num(r.total_count),
  }))
}

/* ------------------------------ recent activity ---------------------------- */

export type ActivityEntry = { source: string; at: string; title: string; detail?: string; entityType?: string; entityId?: string }

export async function getRecentActivity(limit = 25): Promise<ActivityEntry[]> {
  const { data, error } = await client().rpc('admin_recent_activity', { p_limit: limit })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    source: String(r.source),
    at: String(r.at),
    title: String(r.title ?? ''),
    detail: str(r.detail),
    entityType: str(r.entity_type),
    entityId: str(r.entity_id),
  }))
}

/* --------------- moderation / support read models (admin RPCs) -------------- */
// These four pages read through dedicated is_admin()-guarded RPCs rather than
// direct table queries: their tables each have TWO foreign keys to profiles
// (author/moderator, reporter/reviewer, submitter/assignee), which makes a
// PostgREST profiles embed ambiguous (HTTP 300 PGRST201). The RPCs resolve the
// correct FK in SQL and return only the fields the UI needs. Read-only.

export type AdminQuestion = {
  id: string
  text: string
  topic?: string
  status: string
  moderationStatus: string
  createdAt: string
  updatedAt?: string
  isAnonymous: boolean
  authorName?: string
  companyName?: string
  ticker?: string
  companyId?: string
  votes: number
  reportCount: number
  moderatedBy?: string
  moderatedByName?: string
  moderatedAt?: string
  moderationReason?: string
}

export async function getQuestions(params: { moderationStatus?: string; companyId?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AdminQuestion[]; total: number }> {
  const { data, error } = await client().rpc('admin_questions_list', {
    p_moderation_status: params.moderationStatus ?? null,
    p_company_id: params.companyId ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    text: String(r.question_text ?? ''),
    topic: str(r.topic),
    status: String(r.status ?? ''),
    moderationStatus: String(r.moderation_status ?? ''),
    createdAt: String(r.created_at),
    updatedAt: str(r.updated_at),
    isAnonymous: Boolean(r.is_anonymous),
    authorName: str(r.author_name),
    companyName: str(r.company_name),
    ticker: str(r.ticker),
    companyId: str(r.company_id),
    votes: num(r.votes),
    reportCount: num(r.report_count),
    moderatedBy: str(r.moderated_by),
    moderatedByName: str(r.moderated_by_name),
    moderatedAt: str(r.moderated_at),
    moderationReason: str(r.moderation_reason),
  }))
  return { rows, total: totalOf(data, rows.length) }
}

export type AdminReport = {
  id: string
  questionId: string
  questionText?: string
  companyName?: string
  ticker?: string
  reason: string
  details?: string
  status: string
  reporterName?: string
  questionAuthorName?: string
  reportsAgainstQuestion: number
  createdAt: string
  reviewedAt?: string
  reviewedByName?: string
  resolution?: string
  questionModerationStatus?: string
}

export async function getReports(params: { status?: string; reason?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AdminReport[]; total: number }> {
  const { data, error } = await client().rpc('admin_question_reports_list', {
    p_status: params.status ?? null,
    p_reason: params.reason ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    questionId: String(r.question_id),
    questionText: str(r.question_text),
    companyName: str(r.company_name),
    ticker: str(r.ticker),
    reason: String(r.reason ?? ''),
    details: str(r.details),
    status: String(r.status ?? ''),
    reporterName: str(r.reporter_name),
    questionAuthorName: str(r.question_author_name),
    reportsAgainstQuestion: num(r.reports_against_question),
    createdAt: String(r.created_at),
    reviewedAt: str(r.reviewed_at),
    reviewedByName: str(r.reviewed_by_name),
    resolution: str(r.resolution),
    questionModerationStatus: str(r.question_moderation_status),
  }))
  return { rows, total: totalOf(data, rows.length) }
}

export type AdminBug = Row & {
  id: string
  description: string
  severity?: string
  status: string
  createdAt: string
  submitterName?: string
  assignedAdminName?: string
}

export async function getBugs(params: { status?: string; severity?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AdminBug[]; total: number }> {
  const { data, error } = await client().rpc('admin_bug_reports_list', {
    p_status: params.status ?? null,
    p_severity: params.severity ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    ...r,
    id: String(r.id),
    description: String(r.description ?? ''),
    severity: str(r.severity),
    status: String(r.status ?? ''),
    createdAt: String(r.created_at),
    submitterName: str(r.submitter_name),
    assignedAdminName: str(r.assigned_admin_name),
  }) as AdminBug)
  return { rows, total: totalOf(data, rows.length) }
}

export type AdminTicket = Row & {
  id: string
  ticketNumber: string
  category: string
  status: string
  createdAt: string
  senderName?: string
  senderEmail?: string
  submitterName?: string
  assignedAdminName?: string
}

export async function getSupportTickets(params: { status?: string; category?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AdminTicket[]; total: number }> {
  const { data, error } = await client().rpc('admin_support_tickets_list', {
    p_status: params.status ?? null,
    p_category: params.category ?? null,
    p_search: params.search || null,
    p_limit: params.limit ?? 25,
    p_offset: params.offset ?? 0,
  })
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    ...r,
    id: String(r.id),
    ticketNumber: String(r.ticket_number ?? ''),
    category: String(r.category ?? ''),
    status: String(r.status ?? ''),
    createdAt: String(r.created_at),
    senderName: str(r.sender_name) ?? str(r.submitter_name),
    senderEmail: str(r.sender_email),
    submitterName: str(r.submitter_name),
    assignedAdminName: str(r.assigned_admin_name),
  }) as AdminTicket)
  return { rows, total: totalOf(data, rows.length) }
}

export type AdminNotification = {
  id: string
  type: string
  title: string
  message: string
  severity: string
  entityType?: string
  entityId?: string
  actionPath?: string
  readAt?: string
  dismissedAt?: string
  createdAt: string
}

export async function getNotifications(params: { state?: 'unread' | 'read' | 'dismissed'; severity?: string; type?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AdminNotification[]; total: number }> {
  // Read-only: opening this page never marks anything read.
  let q = client()
    .from('admin_notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1)
  if (params.state === 'unread') q = q.is('read_at', null).is('dismissed_at', null)
  if (params.state === 'read') q = q.not('read_at', 'is', null)
  if (params.state === 'dismissed') q = q.not('dismissed_at', 'is', null)
  if (params.severity) q = q.eq('severity', params.severity)
  if (params.type) q = q.eq('type', params.type)
  const { data, error, count } = await q
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    type: String(r.type ?? ''),
    title: String(r.title ?? ''),
    message: String(r.message ?? ''),
    severity: String(r.severity ?? 'info'),
    entityType: str(r.entity_type),
    entityId: str(r.entity_id),
    actionPath: str(r.action_path),
    readAt: str(r.read_at),
    dismissedAt: str(r.dismissed_at),
    createdAt: String(r.created_at),
  }))
  return { rows, total: count ?? rows.length }
}

export type AuditEntry = {
  id: string
  adminUserId: string
  action: string
  entityType?: string
  entityId?: string
  beforeState?: unknown
  afterState?: unknown
  reason?: string
  requestRef?: string
  createdAt: string
}

export async function getAuditLog(params: { action?: string; entityType?: string; search?: string; limit?: number; offset?: number } = {}): Promise<{ rows: AuditEntry[]; total: number }> {
  let q = client()
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1)
  if (params.action) q = q.eq('action', params.action)
  if (params.entityType) q = q.eq('entity_type', params.entityType)
  const { data, error, count } = await q
  if (error) throw error
  const rows = ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    adminUserId: String(r.admin_user_id ?? ''),
    action: String(r.action ?? ''),
    entityType: str(r.entity_type),
    entityId: str(r.entity_id),
    beforeState: r.before_state,
    afterState: r.after_state,
    reason: str(r.reason),
    requestRef: str(r.request_ref),
    createdAt: String(r.created_at),
  }))
  return { rows, total: count ?? rows.length }
}

/* -------------------- record detail (bugs + support tickets) ---------------- */
// One explicit RPC per record rather than PostgREST embeds: bug_reports and
// support_tickets each have two foreign keys to profiles, which makes an embed
// ambiguous (the PGRST201 failure this codebase already fixed once).

export type RecordReply = {
  id: string
  subject: string
  body: string
  recipientMasked?: string
  replyToAlias: string
  authorName?: string
  emailMessageId?: string
  status?: string
  createdAt: string
}

export type RecordNotification = { id: string; type: string; title: string; severity: string; readAt?: string; dismissedAt?: string; createdAt: string }
export type RecordAudit = { id: string; action: string; reason?: string; actorName?: string; createdAt: string }
export type RecordQueueState = { priority: string; reason: string; status: string; updatedAt?: string }
export type RecordAttachment = { id: string; filename: string; mimeType: string; sizeBytes: number; createdAt: string }

export type RecordDetail = {
  generatedAt: string
  recipientMasked?: string
  replies: RecordReply[]
  notifications: RecordNotification[]
  audit: RecordAudit[]
  queue: RecordQueueState[]
  attachments: RecordAttachment[]
}

export type EntityType = 'bug_report' | 'support_ticket'

export async function getRecordDetail(entityType: EntityType, entityId: string): Promise<RecordDetail> {
  const { data, error } = await client().rpc('admin_entity_detail', { p_entity_type: entityType, p_entity_id: entityId })
  if (error) throw error
  const d = (data ?? {}) as Row
  return {
    generatedAt: String(d.generated_at ?? ''),
    recipientMasked: str(d.recipient_masked),
    replies: ((d.replies ?? []) as Row[]).map(r => ({
      id: String(r.id),
      subject: String(r.subject ?? ''),
      body: String(r.body ?? ''),
      recipientMasked: str(r.recipient_masked),
      replyToAlias: String(r.reply_to_alias ?? 'support'),
      authorName: str(r.author_name),
      emailMessageId: str(r.email_message_id),
      status: str(r.status),
      createdAt: String(r.created_at),
    })),
    notifications: ((d.notifications ?? []) as Row[]).map(r => ({
      id: String(r.id),
      type: String(r.type ?? ''),
      title: String(r.title ?? ''),
      severity: String(r.severity ?? 'info'),
      readAt: str(r.read_at),
      dismissedAt: str(r.dismissed_at),
      createdAt: String(r.created_at),
    })),
    audit: ((d.audit ?? []) as Row[]).map(r => ({
      id: String(r.id),
      action: String(r.action ?? ''),
      reason: str(r.reason),
      actorName: str(r.actor_name),
      createdAt: String(r.created_at),
    })),
    queue: ((d.queue ?? []) as Row[]).map(r => ({
      priority: String(r.priority ?? 'normal'),
      reason: String(r.reason ?? ''),
      status: String(r.status ?? ''),
      updatedAt: str(r.updated_at),
    })),
    attachments: ((d.attachments ?? []) as Row[]).map(r => ({
      id: String(r.id),
      filename: String(r.filename ?? 'attachment'),
      mimeType: String(r.mime_type ?? ''),
      sizeBytes: num(r.size_bytes),
      createdAt: String(r.created_at),
    })),
  }
}

/* ----------------------------- email history ------------------------------- */

export type EmailAttempt = {
  id: string
  template: string
  recipientMasked?: string
  status: string
  attemptNumber: number
  retryOfMessageId?: string
  replyId?: string
  sendingActorName?: string
  isSystemSend: boolean
  providerMessageId?: string
  errorCode?: string
  failureCategory?: string
  errorMessage?: string
  /** null/undefined => retryable. A string is the operator-facing reason it is not. */
  retryIneligibleReason?: string
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  bouncedAt?: string
  complainedAt?: string
  failedAt?: string
  lastEventAt?: string
  eventCount: number
}

export async function getEmailHistory(entityType: EntityType, entityId: string): Promise<EmailAttempt[]> {
  const { data, error } = await client().rpc('admin_email_history', { p_entity_type: entityType, p_entity_id: entityId })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    id: String(r.id),
    template: String(r.template ?? ''),
    recipientMasked: str(r.recipient_masked),
    status: String(r.status ?? 'queued'),
    attemptNumber: num(r.attempt_number) || 1,
    retryOfMessageId: str(r.retry_of_message_id),
    replyId: str(r.reply_id),
    sendingActorName: str(r.sending_actor_name),
    isSystemSend: Boolean(r.is_system_send),
    providerMessageId: str(r.provider_message_id),
    errorCode: str(r.error_code),
    failureCategory: str(r.failure_category),
    errorMessage: str(r.error_message_sanitized),
    retryIneligibleReason: str(r.retry_ineligible_reason),
    createdAt: String(r.created_at),
    sentAt: str(r.sent_at),
    deliveredAt: str(r.delivered_at),
    bouncedAt: str(r.bounced_at),
    complainedAt: str(r.complained_at),
    failedAt: str(r.failed_at),
    lastEventAt: str(r.last_event_at),
    eventCount: num(r.event_count),
  }))
}

/* --------------------------------- system ---------------------------------- */

export type SystemHealth = {
  generatedAt?: string
  database: { reachable: boolean; serverTime?: string; defaultSupporterThreshold?: number }
  queue: { openItems: number; criticalHigh: number; oldestCreatedAt?: string; staleOver7d: number }
  operations: {
    unresolvedBugs: number
    openSupportTickets: number
    unhandledNotifications: number
    criticalNotifications: number
    auditEvents24h: number
    lastAuditAt?: string
  }
  storage: { readable?: boolean; exists?: boolean | null; isPublic?: boolean | null }
  adminRpcs: Record<string, boolean>
  acknowledgedWarnings: Record<string, { acknowledgedAt: string; note?: string }>
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const { data, error } = await client().rpc('admin_get_system_health')
  if (error) throw error
  const d = (data ?? {}) as Row
  const db = (d.database ?? {}) as Row
  const q = (d.queue ?? {}) as Row
  const ops = (d.operations ?? {}) as Row
  const st = (d.storage ?? {}) as Row
  const acks = (d.acknowledged_warnings ?? {}) as Record<string, Row>
  return {
    generatedAt: str(d.generated_at),
    database: {
      reachable: Boolean(db.reachable),
      serverTime: str(db.server_time),
      defaultSupporterThreshold: num(db.default_supporter_threshold) || undefined,
    },
    queue: {
      openItems: num(q.open_items),
      criticalHigh: num(q.critical_high),
      oldestCreatedAt: str(q.oldest_created_at),
      staleOver7d: num(q.stale_over_7d),
    },
    operations: {
      unresolvedBugs: num(ops.unresolved_bugs),
      openSupportTickets: num(ops.open_support_tickets),
      unhandledNotifications: num(ops.unhandled_notifications),
      criticalNotifications: num(ops.critical_notifications),
      auditEvents24h: num(ops.audit_events_24h),
      lastAuditAt: str(ops.last_audit_at),
    },
    storage: {
      readable: st.readable == null ? undefined : Boolean(st.readable),
      exists: st.exists == null ? null : Boolean(st.exists),
      isPublic: st.is_public == null ? null : Boolean(st.is_public),
    },
    adminRpcs: Object.fromEntries(Object.entries((d.admin_rpcs ?? {}) as Record<string, unknown>).map(([k, v]) => [k, Boolean(v)])),
    acknowledgedWarnings: Object.fromEntries(
      Object.entries(acks).map(([k, v]) => [k, { acknowledgedAt: String((v as Row)?.acknowledged_at ?? ''), note: str((v as Row)?.note) }]),
    ),
  }
}

export type EmailHealth = {
  generatedAt?: string
  totalMessages: number
  lastSendAt?: string
  lastDeliveredAt?: string
  failed24h: number
  failed7d: number
  delayedCurrent: number
  bounced7d: number
  complained7d: number
  queuedCurrent: number
  stuckQueued: number
  oldestUnresolvedFailureAt?: string
  statusInconsistencies: number
  retryAttemptsTotal: number
  retryBacklog: number
  lastWebhookEventAt?: string
  webhookEvents24h: number
  webhookUnmatched24h: number
}

export async function getEmailHealth(): Promise<EmailHealth> {
  const { data, error } = await client().rpc('admin_get_email_health')
  if (error) throw error
  const d = (data ?? {}) as Row
  return {
    generatedAt: str(d.generated_at),
    totalMessages: num(d.total_messages),
    lastSendAt: str(d.last_send_at),
    lastDeliveredAt: str(d.last_delivered_at),
    failed24h: num(d.failed_24h),
    failed7d: num(d.failed_7d),
    delayedCurrent: num(d.delayed_current),
    bounced7d: num(d.bounced_7d),
    complained7d: num(d.complained_7d),
    queuedCurrent: num(d.queued_current),
    stuckQueued: num(d.stuck_queued),
    oldestUnresolvedFailureAt: str(d.oldest_unresolved_failure_at),
    statusInconsistencies: num(d.status_inconsistencies),
    retryAttemptsTotal: num(d.retry_attempts_total),
    retryBacklog: num(d.retry_backlog),
    lastWebhookEventAt: str(d.last_webhook_event_at),
    webhookEvents24h: num(d.webhook_events_24h),
    webhookUnmatched24h: num(d.webhook_unmatched_24h),
  }
}

export type IntakeVolume = { total: number; last24h: number; last7d: number; lastSubmissionAt?: string; unprocessed: number; oldestUnprocessedAt?: string; spam?: number }

export type IntakeHealth = {
  generatedAt?: string
  bugs: IntakeVolume
  supportTickets: IntakeVolume
  rateLimits: { intakeIpKeysActive: number; intakeSubmitterKeysActive: number; throttledKeys: number; windowSince?: string }
  attachments: { supported: boolean; total?: number; last7d?: number; bytesStored?: number }
  /** Turnstile rejections happen before any row exists — never render 0 as "none". */
  captchaRejectionsTracked: boolean
}

const volume = (r: Row | undefined): IntakeVolume => ({
  total: num(r?.total),
  last24h: num(r?.last_24h),
  last7d: num(r?.last_7d),
  lastSubmissionAt: str(r?.last_submission_at),
  unprocessed: num(r?.unprocessed),
  oldestUnprocessedAt: str(r?.oldest_unprocessed_at),
  spam: r?.spam == null ? undefined : num(r.spam),
})

export async function getIntakeHealth(): Promise<IntakeHealth> {
  const { data, error } = await client().rpc('admin_get_intake_health')
  if (error) throw error
  const d = (data ?? {}) as Row
  const rl = (d.rate_limits ?? {}) as Row
  const at = (d.attachments ?? {}) as Row
  return {
    generatedAt: str(d.generated_at),
    bugs: volume(d.bugs as Row | undefined),
    supportTickets: volume(d.support_tickets as Row | undefined),
    rateLimits: {
      intakeIpKeysActive: num(rl.intake_ip_keys_active),
      intakeSubmitterKeysActive: num(rl.intake_submitter_keys_active),
      throttledKeys: num(rl.throttled_keys),
      windowSince: str(rl.window_since),
    },
    attachments: {
      supported: Boolean(at.supported),
      total: at.total == null ? undefined : num(at.total),
      last7d: at.last_7d == null ? undefined : num(at.last_7d),
      bytesStored: at.bytes_stored == null ? undefined : num(at.bytes_stored),
    },
    captchaRejectionsTracked: Boolean(d.captcha_rejections_tracked),
  }
}

export type OperationalFailure = {
  source: string
  occurredAt: string
  severity: string
  summary: string
  entityType?: string
  entityId?: string
  actionPath?: string
  acknowledged: boolean
}

export async function getOperationalFailures(limit = 20): Promise<OperationalFailure[]> {
  const { data, error } = await client().rpc('admin_get_recent_operational_failures', { p_limit: limit })
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => ({
    source: String(r.source ?? ''),
    occurredAt: String(r.occurred_at ?? ''),
    severity: String(r.severity ?? 'info'),
    summary: String(r.summary ?? ''),
    entityType: str(r.entity_type),
    entityId: str(r.entity_id),
    actionPath: str(r.action_path),
    acknowledged: Boolean(r.acknowledged),
  }))
}

export async function getAppliedMigrations(): Promise<string[]> {
  const { data, error } = await client().rpc('admin_applied_migrations')
  if (error) throw error
  return ((data ?? []) as Row[]).map(r => String(r.version))
}

/** Configuration + deployment facts the DATABASE cannot see. Presence only. */
export type Diagnostics = {
  generatedAt?: string
  secrets: Record<string, 'configured' | 'missing' | 'invalid_format'>
  functions: Record<string, 'deployed' | 'not_deployed' | 'unknown'>
  senderDomain?: string
  expectedDomain?: string
  notes: Record<string, string>
}

export async function getDiagnostics(): Promise<Diagnostics> {
  const { data, error } = await client().functions.invoke('admin-system-diagnostics', { body: {} })
  if (error) throw error
  const d = (data ?? {}) as Row
  return {
    generatedAt: str(d.generated_at),
    secrets: (d.secrets ?? {}) as Diagnostics['secrets'],
    functions: (d.functions ?? {}) as Diagnostics['functions'],
    senderDomain: str(d.sender_domain),
    expectedDomain: str(d.expected_domain),
    notes: (d.notes ?? {}) as Record<string, string>,
  }
}

/* ------------------------------- mutations --------------------------------- */
// Every admin write goes through a narrow, is_admin()-guarded, audited RPC — never
// a direct table write and never a generic "update record" endpoint. Each RPC
// validates the transition server-side, locks the row, writes an audit entry, and
// resolves related notifications; the caller refreshes the read models on success.

export async function updateCompanyRequest(p: { id: string; status?: string; priority?: string; adminNotes?: string; rejectionReason?: string; reason?: string }): Promise<void> {
  const { error } = await client().rpc('admin_update_company_request', {
    p_request_id: p.id,
    p_status: p.status ?? null,
    p_priority: p.priority ?? null,
    p_admin_notes: p.adminNotes ?? null,
    p_rejection_reason: p.rejectionReason ?? null,
    p_reason: p.reason ?? null,
  })
  if (error) throw error
}

export type ApproveResult = { request_id: string; company_id: string; created: boolean; already_approved?: boolean }

export async function approveCompanyRequest(p: { id: string; exchange?: string; sector?: string; reason?: string }): Promise<ApproveResult> {
  const { data, error } = await client().rpc('admin_approve_company_request', {
    p_request_id: p.id,
    p_exchange: p.exchange || 'NASDAQ',
    p_sector: p.sector || 'Unknown',
    p_reason: p.reason ?? null,
  })
  if (error) throw error
  return data as ApproveResult
}

export async function updateCampaignOps(p: {
  id: string
  operationalStatus?: string
  assignedAdmin?: string | null
  managementContactStatus?: string
  internalNotes?: string
  riskStatus?: string
  nextFollowUpAt?: string
  supporterThreshold?: number
  closedReason?: string
  reason?: string
}): Promise<void> {
  const { error } = await client().rpc('admin_update_campaign_ops', {
    p_campaign_id: p.id,
    p_operational_status: p.operationalStatus ?? null,
    p_assigned_admin: p.assignedAdmin ?? null,
    p_management_contact_status: p.managementContactStatus ?? null,
    p_internal_notes: p.internalNotes ?? null,
    p_risk_status: p.riskStatus ?? null,
    p_next_follow_up_at: p.nextFollowUpAt ?? null,
    p_supporter_threshold: p.supporterThreshold ?? null,
    p_closed_reason: p.closedReason ?? null,
    p_reason: p.reason ?? null,
  })
  if (error) throw error
}

export type ModerationAction = 'publish' | 'hide' | 'remove' | 'restore' | 'archive'

export async function moderateQuestion(p: { id: string; action: ModerationAction; reason?: string }): Promise<void> {
  const { error } = await client().rpc('admin_moderate_question', { p_question_id: p.id, p_action: p.action, p_reason: p.reason ?? null })
  if (error) throw error
}

export type ReportAction = 'dismiss' | 'confirm' | 'hide_question' | 'remove_question' | 'escalate'

export async function resolveReport(p: { id: string; action: ReportAction; resolution?: string; reason?: string }): Promise<void> {
  const { error } = await client().rpc('admin_resolve_report', { p_report_id: p.id, p_action: p.action, p_resolution: p.resolution ?? null, p_reason: p.reason ?? null })
  if (error) throw error
}

export async function updateBug(p: { id: string; status?: string; severity?: string; assignedTo?: string | null; adminNotes?: string; linkedIssueUrl?: string; fixedCommit?: string; reason?: string }): Promise<void> {
  const { error } = await client().rpc('admin_update_bug', {
    p_bug_id: p.id,
    p_status: p.status ?? null,
    p_severity: p.severity ?? null,
    p_assigned_to: p.assignedTo ?? null,
    p_admin_notes: p.adminNotes ?? null,
    p_linked_issue_url: p.linkedIssueUrl ?? null,
    p_fixed_commit: p.fixedCommit ?? null,
    p_reason: p.reason ?? null,
  })
  if (error) throw error
}

export async function updateSupportTicket(p: { id: string; status?: string; priority?: string; assignedTo?: string | null; adminNotes?: string; reason?: string }): Promise<void> {
  const { error } = await client().rpc('admin_update_support_ticket', {
    p_ticket_id: p.id,
    p_status: p.status ?? null,
    p_priority: p.priority ?? null,
    p_assigned_to: p.assignedTo ?? null,
    p_admin_notes: p.adminNotes ?? null,
    p_reason: p.reason ?? null,
  })
  if (error) throw error
}

export async function recordSupportResponse(p: { id: string; status?: string; summary?: string }): Promise<void> {
  const { error } = await client().rpc('admin_record_support_response', { p_ticket_id: p.id, p_status: p.status ?? null, p_summary: p.summary ?? null })
  if (error) throw error
}

export async function markNotificationRead(p: { id: string; read: boolean }): Promise<void> {
  const { error } = await client().rpc('admin_mark_notification_read', { p_notification_id: p.id, p_read: p.read })
  if (error) throw error
}

export async function dismissNotification(p: { id: string; dismiss: boolean }): Promise<void> {
  const { error } = await client().rpc('admin_dismiss_notification', { p_notification_id: p.id, p_dismiss: p.dismiss })
  if (error) throw error
}

export async function acknowledgeSystemWarning(p: { key: string; note?: string }): Promise<void> {
  const { error } = await client().rpc('admin_acknowledge_system_warning', { p_warning_key: p.key, p_note: p.note ?? null })
  if (error) throw error
}

/** Raises at most one stale-queue notification per day; safe to call on page load. */
export async function checkQueueStaleness(): Promise<void> {
  const { error } = await client().rpc('admin_check_queue_staleness', { p_threshold_days: THRESHOLDS.queueStaleDays })
  if (error) throw error
}

/* ------------------------- outbound email operations ----------------------- */
// Replies and retries go through the send-transactional-email Edge Function
// rather than an RPC, because the send itself must happen server-side with the
// Resend key. The function verifies is_admin() again and calls the guarded RPCs
// with the administrator's own JWT — so the recipient is derived from the record
// server-side and is never taken from this client. There is deliberately no
// `to` parameter anywhere in this file.

export type SendOutcome = { status: 'sent' | 'duplicate'; messageId?: string; providerId?: string }

/** Turns an Edge Function error into an operator-facing sentence. Provider and
 *  internal details are never surfaced — the function has already sanitized what
 *  is safe to show. */
async function edgeError(error: unknown, fallback: string): Promise<Error> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } })?.context
  try {
    const body = (await ctx?.json?.()) as { message?: string; error?: string } | undefined
    if (body?.message && body.message.length < 300) return new Error(body.message)
    if (body?.error === 'email_not_configured') return new Error('Email sending is not configured on the server. The message was recorded but not sent.')
    if (body?.error === 'unauthorized') return new Error('Your session is not authorized to send mail. Sign in again.')
  } catch {
    /* fall through to the generic message */
  }
  return new Error(fallback)
}

export async function sendAdminReply(p: {
  entityType: EntityType
  entityId: string
  subject: string
  body: string
  /** Stable per compose session. The same token can never send twice. */
  clientToken: string
}): Promise<SendOutcome> {
  const { data, error } = await client().functions.invoke('send-transactional-email', {
    body: {
      mode: 'reply',
      entity_type: p.entityType,
      entity_id: p.entityId,
      subject: p.subject,
      body: p.body,
      client_token: p.clientToken,
    },
  })
  if (error) throw await edgeError(error, 'The reply could not be sent. It has not been delivered — try again.')
  const d = (data ?? {}) as Row
  return { status: d.status === 'duplicate' ? 'duplicate' : 'sent', messageId: str(d.message_id), providerId: str(d.id) }
}

export async function retryEmail(p: { messageId: string; clientToken: string }): Promise<SendOutcome> {
  const { data, error } = await client().functions.invoke('send-transactional-email', {
    body: { mode: 'retry', message_id: p.messageId, client_token: p.clientToken },
  })
  if (error) throw await edgeError(error, 'The retry could not be completed. The original attempt is unchanged.')
  const d = (data ?? {}) as Row
  return { status: d.status === 'duplicate' ? 'duplicate' : 'sent', messageId: str(d.message_id), providerId: str(d.id) }
}

/* -------------------------------- attachments ------------------------------ */

export type SignedAttachment = { url: string; filename: string; mimeType: string; sizeBytes?: number; expiresIn: number }

/**
 * Mints a short-lived signed URL for a private attachment. Authorization is
 * enforced twice server-side (the function verifies is_admin(), then the
 * admin_resolve_attachment RPC verifies it again and audits the access) — this
 * client cannot reach the object any other way.
 */
export async function getAttachmentUrl(p: { attachmentId: string; intent?: 'view' | 'download' }): Promise<SignedAttachment> {
  const { data, error } = await client().functions.invoke('admin-attachment-url', {
    body: { attachment_id: p.attachmentId, intent: p.intent ?? 'view' },
  })
  if (error) throw await edgeError(error, 'That attachment could not be opened.')
  const d = (data ?? {}) as Row
  if (!d.url) throw new Error('That attachment could not be opened.')
  return {
    url: String(d.url),
    filename: String(d.filename ?? 'attachment'),
    mimeType: String(d.mime_type ?? 'application/octet-stream'),
    sizeBytes: d.size_bytes == null ? undefined : num(d.size_bytes),
    expiresIn: num(d.expires_in) || 60,
  }
}

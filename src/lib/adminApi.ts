// Read-only data layer for the Admin Action Centre. Every function requires the
// authenticated sole-admin session; access is enforced server-side by is_admin()
// (RLS + guarded SECURITY DEFINER RPCs). Nothing here mutates data. The service
// role is never used in the browser — only the admin's own session.

import { supabase } from './supabase'

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

/* --------------------------------- system ---------------------------------- */

export type SystemInfo = {
  defaultSupporterThreshold?: number
  tables: { name: string; reachable: boolean }[]
  lastEmailFailure?: string
  lastWebhookFailure?: string
  lastSecurityAlert?: string
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const c = client()
  const settings = await c.from('app_settings').select('key, value_int').eq('key', 'default_supporter_threshold').maybeSingle()
  // Reachability probes: a HEAD count on each admin table confirms the read path.
  const tableNames = ['company_requests', 'campaigns', 'questions', 'question_reports', 'bug_reports', 'support_tickets', 'admin_notifications', 'admin_audit_log']
  const tables = await Promise.all(
    tableNames.map(async name => {
      const { error } = await c.from(name).select('id', { count: 'exact', head: true })
      return { name, reachable: !error }
    }),
  )
  const lastFailure = async (type: string) => {
    const { data } = await c.from('admin_notifications').select('created_at').eq('type', type).order('created_at', { ascending: false }).limit(1).maybeSingle()
    return str((data as Row | null)?.created_at)
  }
  return {
    defaultSupporterThreshold: num((settings.data as Row | null)?.value_int) || undefined,
    tables,
    lastEmailFailure: await lastFailure('email_failed'),
    lastWebhookFailure: await lastFailure('webhook_failed'),
    lastSecurityAlert: await lastFailure('security_alert'),
  }
}

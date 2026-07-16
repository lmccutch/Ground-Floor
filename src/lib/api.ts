import { companyDirectory, type DirectoryCompany, type DirectorySecurity } from '../data/companyDirectory'
import { retailPopularity, retailPopularityMeta, type RetailPopularityMeta } from '../data/retailPopularity'
import { buildCompanySlug, normalizeName, normalizeSymbol } from './companyIdentity'
import { AuthRequestError } from './authClient'
import { getSiteUrl } from './siteUrl'
import { getDataModeConfig } from './dataMode'
import { supabase } from './supabase'

// When Supabase is configured every function reads/writes the real database and
// throws on failure. Without it, the app runs in demo mode: data comes from the
// curated src/data/companyDirectory.ts dataset plus localStorage, and is clearly
// labelled as demo data in the UI. The two modes are never merged.

export type CampaignStatus =
  | 'Gathering shareholder interest'
  | 'Preparing management outreach'
  | 'Management contacted'
  | 'Management reviewing request'
  | 'Interview discussions underway'
  | 'Interview scheduled'
  | 'Interview completed'
  | 'Management declined'
  | 'Campaign paused'

export type ShareholderStatus =
  | 'Current shareholder'
  | 'Former shareholder'
  | 'Considering investing'
  | 'Following the company'
  | 'Prefer not to say'

export type PositionRange =
  | 'Under $1,000'
  | '$1,000-$5,000'
  | '$5,000-$25,000'
  | '$25,000-$100,000'
  | 'More than $100,000'
  | 'Prefer not to say'

export type PublicCompany = {
  id: string
  slug: string
  name: string
  ticker: string
  exchange: string
  sector: string
  country?: string
  description: string
  website?: string
  investorRelationsUrl?: string
  status: string
  accent?: string
  marketCapCategory?: string
}

/** Lightweight shape returned by search and Discover — never carries restricted enrichment fields. */
export type CompanySearchResult = {
  id: string
  slug: string
  name: string
  ticker: string
  exchange: string
  sector?: string
  hasCampaign: boolean
  campaignStatus?: string
  supporters: number
  questions: number
}

export type CompanyLookup = { company: PublicCompany | null; redirectTicker?: string }

export type PublicQuestion = {
  id: string
  companyId: string
  companyTicker?: string
  text: string
  topic: string
  author: string
  votes: number
  status: string
  createdAt: string
  votedByUser: boolean
  commentCount: number
  /** True when the signed-in user wrote this question (drives edit/delete controls). */
  isAuthor: boolean
}

/** Statuses in which the author may still edit or delete their own question (mirrors RLS). */
export const EDITABLE_QUESTION_STATUSES = ['Open', 'Under review'] as const

export function isQuestionEditable(question: Pick<PublicQuestion, 'isAuthor' | 'status'>): boolean {
  return question.isAuthor && (EDITABLE_QUESTION_STATUSES as readonly string[]).includes(question.status)
}

export type Campaign = {
  id: string
  companyId: string
  status: CampaignStatus
  outreachTarget: number
  supporters: number
  currentShareholders: number
  questions: number
  votes: number
  followers: number
  launchedAt: string
  supportedByUser: boolean
  followedByUser: boolean
}

export type Profile = {
  id: string
  email?: string
  displayName: string
  country?: string
  investorType?: string
  /** When true, all of the user's questions display as "Anonymous Shareholder". */
  publicAnonymous?: boolean
  /** True once the user has confirmed display name / investor type. */
  complete?: boolean
}

export type Notification = { id: string; title: string; body: string; createdAt: string; read: boolean }

/** One entry in the dashboard's recent-activity feed — always backed by a persisted row. */
export type ActivityItem = {
  id: string
  kind: 'supported' | 'followed' | 'question' | 'vote'
  label: string
  companyTicker?: string
  at: string
}

export type DashboardData = {
  supported: PublicCompany[]
  followed: PublicCompany[]
  submitted: PublicQuestion[]
  voted: PublicQuestion[]
  notifications: Notification[]
  activity: ActivityItem[]
}

export type FeedbackCategory =
  | 'Something is broken'
  | 'Confusing experience'
  | 'Feature request'
  | 'Company request'
  | 'General feedback'

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  'Something is broken',
  'Confusing experience',
  'Feature request',
  'Company request',
  'General feedback',
]

export type FeedbackInput = { category: FeedbackCategory; message: string; pagePath?: string }

/**
 * A campaign timeline entry. Every entry is derived from persisted data:
 * launched_at, the created_at of the Nth supporter row, or an admin-recorded
 * campaign_events row. `at` is omitted when a milestone is real but its exact
 * date is unknown (demo mode) — the UI never invents dates.
 */
export type TimelineEvent = {
  id: string
  label: string
  at?: string
  kind: 'launch' | 'milestone' | 'event'
}

export const SUPPORTER_MILESTONES = [10, 25, 50, 100] as const

export type DiscoverHighlights = {
  newest: CompanySearchResult[]
  mostSupported: CompanySearchResult[]
  mostVoted: CompanySearchResult[]
  nearThreshold: CompanySearchResult[]
}

export type QuestionInput = {
  text: string
  topic: string
  context?: string
  shareholderStatus: ShareholderStatus
  anonymous: boolean
}

// The request form collects only what a reviewer needs to identify the company:
// its name and ticker. The legacy exchange/reason/shareholder_status/consent
// fields are no longer collected and are left NULL rather than fabricated.
export type CompanyRequestInput = {
  name: string
  ticker: string
}

export type RequestCompanyResult =
  | { matchedCompany: PublicCompany }
  | { duplicate: true }
  | { requestId: string }

export type DiscoverFilters = {
  query?: string
  sector?: string
  exchange?: string
  marketCapCategory?: string
  /** 'has-campaign' | 'no-campaign' | undefined (any) */
  campaignState?: 'has-campaign' | 'no-campaign'
}

export type DiscoverResults = { results: CompanySearchResult[]; hasMore: boolean }

export const MARKET_CAP_BANDS = ['$300M-$1B', '$1B-$5B', '$5B-$25B', '$25B-$100B', 'Over $100B'] as const
export const KNOWN_EXCHANGES = ['NASDAQ', 'NYSE', 'NYSE_AMERICAN'] as const

const DISCOVER_PAGE_SIZE = 24
const SEARCH_LIMIT_DEFAULT = 10

/* ------------------------------ demo storage ------------------------------ */

const storageKey = getDataModeConfig().storageKey
// Pre-Open-Floor demo keys, newest first. Carried forward for backwards
// compatibility so a returning user's local demo data is not stranded by the
// rebrand: 'groundfloor-mvp' (previous name) and 'grround-floor-mvp' (original).
const legacyStorageKeys = ['groundfloor-mvp', 'grround-floor-mvp']

// One-time migration: carry forward demo-mode data stored under a pre-rename key.
// Never runs in test mode — test mode's storage namespace must never be seeded
// from whatever demo data exists in a developer's browser.
function migrateLegacyStorage() {
  if (getDataModeConfig().isTestMode) return
  if (localStorage.getItem(storageKey) !== null) return
  for (const legacyKey of legacyStorageKeys) {
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      localStorage.setItem(storageKey, legacy)
      return
    }
  }
}

type LocalQuestion = {
  id: string
  companyId: string
  text: string
  topic: string
  context?: string
  shareholderStatus: ShareholderStatus
  anonymous: boolean
  author: string
  createdAt: string
}

type LocalCampaign = Partial<
  Pick<Campaign, 'supporters' | 'currentShareholders' | 'questions' | 'votes' | 'followers' | 'launchedAt' | 'supportedByUser' | 'followedByUser'>
> & {
  /** True once a campaign has actually been created for this company (via startCampaign). */
  exists?: boolean
}

type LocalRequest = CompanyRequestInput & { id: string; createdAt: string }

type LocalStore = {
  user?: Profile
  campaigns?: Record<string, LocalCampaign>
  votes?: Record<string, boolean>
  questions?: LocalQuestion[]
  requests?: LocalRequest[]
  feedback?: Array<FeedbackInput & { id: string; createdAt: string }>
}

function readLocal(): LocalStore {
  migrateLegacyStorage()
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}') as LocalStore
  } catch {
    return {}
  }
}

function writeLocal(store: LocalStore) {
  localStorage.setItem(storageKey, JSON.stringify(store))
}

function updateLocalCampaign(companyId: string, update: (campaign: LocalCampaign) => LocalCampaign) {
  const store = readLocal()
  const campaigns = store.campaigns ?? {}
  campaigns[companyId] = update(campaigns[companyId] ?? {})
  writeLocal({ ...store, campaigns })
  return campaigns[companyId]
}

/* --------------------------- directory (demo data) -------------------------- */

function primarySecurityOf(entry: DirectoryCompany): DirectorySecurity {
  return entry.securities.find(security => security.isPrimary) ?? entry.securities[0]
}

function directoryEntrySlug(entry: DirectoryCompany): string {
  return buildCompanySlug(entry.displayName, entry.key)
}

function directoryCompanyToPublic(entry: DirectoryCompany): PublicCompany {
  const primary = primarySecurityOf(entry)
  return {
    id: entry.key,
    slug: directoryEntrySlug(entry),
    name: entry.displayName,
    ticker: primary.symbol,
    exchange: primary.exchange,
    sector: entry.sector,
    country: entry.country,
    description: entry.description,
    status: 'Early shareholder campaign',
    marketCapCategory: entry.marketCapCategory,
  }
}

function findDirectoryEntryByTicker(ticker: string): { entry: DirectoryCompany; isPrimaryMatch: boolean } | null {
  const normalized = normalizeSymbol(ticker)
  if (!normalized) return null
  for (const entry of companyDirectory) {
    const security = entry.securities.find(item => normalizeSymbol(item.symbol) === normalized)
    if (security) return { entry, isPrimaryMatch: security.isPrimary }
  }
  for (const entry of companyDirectory) {
    const hasAlias = entry.aliases?.some(alias => alias.aliasType === 'former_ticker' && normalizeSymbol(alias.alias) === normalized)
    if (hasAlias) return { entry, isPrimaryMatch: false }
  }
  return null
}

function findDirectoryEntryBySlug(slug: string): DirectoryCompany | null {
  return companyDirectory.find(entry => directoryEntrySlug(entry) === slug) ?? null
}

/**
 * Returns the demo campaign for a company, or null if one has never been started
 * in this browser. Demo mode never fabricates supporters, followers, questions, or
 * votes — every number here reflects only what this browser's user actually did.
 */
function getLocalCampaign(companyId: string): LocalCampaign | null {
  const store = readLocal()
  const existing = store.campaigns?.[companyId]
  return existing?.exists ? existing : null
}

function toSearchResult(entry: DirectoryCompany): CompanySearchResult {
  const primary = primarySecurityOf(entry)
  const campaign = getLocalCampaign(entry.key)
  return {
    id: entry.key,
    slug: directoryEntrySlug(entry),
    name: entry.displayName,
    ticker: primary.symbol,
    exchange: primary.exchange,
    sector: entry.sector,
    hasCampaign: Boolean(campaign?.exists),
    campaignStatus: campaign?.exists ? 'Gathering shareholder interest' : undefined,
    supporters: campaign?.supporters ?? 0,
    questions: campaign?.questions ?? 0,
  }
}

/* -------------------------------- companies ------------------------------- */

type Row = Record<string, unknown>

function asOptional(value: unknown): string | undefined {
  return value ? String(value) : undefined
}

function mapCompany(row: Row): PublicCompany {
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.display_name ?? row.name),
    ticker: String(row.ticker),
    exchange: String(row.exchange ?? ''),
    sector: String(row.sector ?? ''),
    country: asOptional(row.country),
    description: String(row.description ?? ''),
    website: asOptional(row.website),
    investorRelationsUrl: asOptional(row.investor_relations_url ?? row.investorRelationsUrl),
    status: String(row.status ?? 'Early shareholder campaign'),
    accent: asOptional(row.accent),
    marketCapCategory: asOptional(row.market_cap_category),
  }
}

export async function getCompanies(limit = 24): Promise<PublicCompany[]> {
  if (supabase) {
    const { data, error } = await supabase.from('companies').select('*').eq('is_discoverable', true).order('display_name').limit(limit)
    if (error) throw new Error(error.message)
    return ((data ?? []) as Row[]).map(mapCompany)
  }
  return companyDirectory.slice(0, limit).map(directoryCompanyToPublic)
}

export async function getCompanyByTicker(ticker: string): Promise<CompanyLookup> {
  const normalized = normalizeSymbol(ticker)
  if (!normalized) return { company: null }

  if (supabase) {
    const { data: securityMatch, error: securityError } = await supabase
      .from('securities')
      .select('symbol, is_primary, company:companies(*)')
      .eq('normalized_symbol', normalized)
      .eq('is_active', true)
      .maybeSingle()
    if (securityError) throw new Error(securityError.message)
    if (securityMatch?.company) {
      const company = mapCompany(securityMatch.company as unknown as Row)
      return { company, redirectTicker: securityMatch.is_primary ? undefined : company.ticker }
    }

    const { data: aliasMatch, error: aliasError } = await supabase
      .from('company_aliases')
      .select('company:companies(*)')
      .eq('alias_type', 'former_ticker')
      .eq('normalized_alias', normalized)
      .maybeSingle()
    if (aliasError) throw new Error(aliasError.message)
    if (aliasMatch?.company) {
      const company = mapCompany(aliasMatch.company as unknown as Row)
      return { company, redirectTicker: company.ticker }
    }
    return { company: null }
  }

  const found = findDirectoryEntryByTicker(ticker)
  if (!found) return { company: null }
  const company = directoryCompanyToPublic(found.entry)
  return { company, redirectTicker: found.isPrimaryMatch ? undefined : company.ticker }
}

export async function getCompanyBySlug(slug: string): Promise<PublicCompany | null> {
  if (supabase) {
    const { data, error } = await supabase.from('companies').select('*').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapCompany(data as Row) : null
  }
  const entry = findDirectoryEntryBySlug(slug)
  return entry ? directoryCompanyToPublic(entry) : null
}

/** Database-backed ranked search. Debounce and cancel stale calls in the UI layer. */
export async function searchCompanies(query: string, limit = SEARCH_LIMIT_DEFAULT): Promise<CompanySearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (supabase) {
    const { data, error } = await supabase.rpc('search_companies', { search_query: trimmed, result_limit: limit })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Row[]).map(row => ({
      id: String(row.company_id),
      slug: String(row.company_id),
      name: String(row.display_name),
      ticker: String(row.ticker),
      exchange: String(row.exchange ?? ''),
      sector: asOptional(row.sector),
      hasCampaign: Boolean(row.has_campaign),
      campaignStatus: asOptional(row.campaign_status),
      supporters: Number(row.supporters ?? 0),
      questions: Number(row.questions ?? 0),
    }))
  }

  const tickerQuery = normalizeSymbol(trimmed)
  const textQuery = normalizeName(trimmed)
  const scored: { entry: DirectoryCompany; tier: number }[] = []

  for (const entry of companyDirectory) {
    let tier: number | null = null
    const consider = (candidate: number) => {
      tier = tier === null ? candidate : Math.min(tier, candidate)
    }
    for (const security of entry.securities) {
      const normalizedSymbol = normalizeSymbol(security.symbol)
      if (normalizedSymbol === tickerQuery) consider(security.isPrimary ? 0 : 1)
      else if (security.isPrimary && tickerQuery && normalizedSymbol.startsWith(tickerQuery)) consider(3)
    }
    for (const alias of entry.aliases ?? []) {
      if (alias.aliasType === 'former_ticker' && normalizeSymbol(alias.alias) === tickerQuery) consider(2)
      else if (textQuery && normalizeName(alias.alias).startsWith(textQuery)) consider(6)
    }
    const normalizedName = normalizeName(entry.displayName)
    if (textQuery && normalizedName === textQuery) consider(4)
    else if (textQuery && normalizedName.startsWith(textQuery)) consider(5)
    else if (textQuery && normalizedName.includes(textQuery)) consider(7)
    if (tier !== null) scored.push({ entry, tier })
  }

  scored.sort((a, b) => a.tier - b.tier || a.entry.displayName.localeCompare(b.entry.displayName))
  return scored.slice(0, limit).map(({ entry }) => toSearchResult(entry))
}

export function getKnownSectors(): string[] {
  return [...new Set(companyDirectory.map(entry => entry.sector))].sort()
}

/**
 * Filtered/paginated browsing for Discover — distinct from searchCompanies, which is
 * ranked full-text search. Never fetches the full directory in one call.
 * Note (Phase 1, proportionate-schema tradeoff): campaignState filtering happens after
 * the page is fetched, so a page may contain fewer than the page size when that filter
 * is active. Acceptable at the current directory size; revisit if the directory grows
 * enough that this noticeably thins result pages.
 */
export async function discoverCompanies(filters: DiscoverFilters, offset = 0, limit = DISCOVER_PAGE_SIZE): Promise<DiscoverResults> {
  if (supabase) {
    let request = supabase
      .from('companies')
      .select('*, securities!inner(symbol, exchange, is_primary)', { count: 'exact' })
      .eq('is_discoverable', true)
      .eq('securities.is_primary', true)
    if (filters.sector) request = request.eq('sector', filters.sector)
    if (filters.marketCapCategory) request = request.eq('market_cap_category', filters.marketCapCategory)
    if (filters.exchange) request = request.eq('securities.exchange', filters.exchange)
    if (filters.query) request = request.ilike('display_name', `%${filters.query}%`)
    const { data, error, count } = await request.order('display_name', { ascending: true }).range(offset, offset + limit - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Row[]
    const companyIds = rows.map(row => String(row.id))
    const metricsByCompany = new Map<string, Row>()
    if (companyIds.length) {
      const { data: metricsRows } = await supabase.from('public_campaign_metrics').select('*').in('company_id', companyIds)
      for (const row of (metricsRows ?? []) as Row[]) metricsByCompany.set(String(row.company_id), row)
    }
    let results: CompanySearchResult[] = rows.map(row => {
      const embedded = row.securities as Row[] | Row | undefined
      const security = (Array.isArray(embedded) ? embedded[0] : embedded) ?? {}
      const metrics = metricsByCompany.get(String(row.id))
      return {
        id: String(row.id),
        slug: String(row.slug ?? row.id),
        name: String(row.display_name ?? row.name),
        ticker: String((security as Row).symbol ?? row.ticker),
        exchange: String((security as Row).exchange ?? row.exchange),
        sector: asOptional(row.sector),
        hasCampaign: Boolean(metrics),
        campaignStatus: asOptional(metrics?.status),
        supporters: Number(metrics?.supporters ?? 0),
        questions: Number(metrics?.questions ?? 0),
      }
    })
    if (filters.campaignState === 'has-campaign') results = results.filter(result => result.hasCampaign)
    if (filters.campaignState === 'no-campaign') results = results.filter(result => !result.hasCampaign)
    return { results, hasMore: (count ?? 0) > offset + limit }
  }

  let entries = companyDirectory.slice()
  if (filters.sector) entries = entries.filter(entry => entry.sector === filters.sector)
  if (filters.marketCapCategory) entries = entries.filter(entry => entry.marketCapCategory === filters.marketCapCategory)
  if (filters.exchange) entries = entries.filter(entry => primarySecurityOf(entry).exchange === filters.exchange)
  if (filters.query) {
    const needle = normalizeName(filters.query)
    entries = entries.filter(entry => normalizeName(entry.displayName).includes(needle))
  }
  entries.sort((a, b) => a.displayName.localeCompare(b.displayName))
  let results = entries.map(toSearchResult)
  if (filters.campaignState === 'has-campaign') results = results.filter(result => result.hasCampaign)
  if (filters.campaignState === 'no-campaign') results = results.filter(result => !result.hasCampaign)
  return { results: results.slice(offset, offset + limit), hasMore: results.length > offset + limit }
}

/* -------------------------------- campaigns ------------------------------- */

export async function getCampaign(companyId: string, userId?: string): Promise<Campaign | null> {
  if (supabase) {
    const { data, error } = await supabase.from('public_campaign_metrics').select('*').eq('company_id', companyId).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    const row = data as Row
    const campaignId = String(row.id)
    let supportedByUser = false
    let followedByUser = false
    if (userId) {
      const [supportResult, followResult] = await Promise.all([
        supabase.from('campaign_supporters').select('id').eq('campaign_id', campaignId).eq('user_id', userId).maybeSingle(),
        supabase.from('campaign_followers').select('id').eq('campaign_id', campaignId).eq('user_id', userId).maybeSingle(),
      ])
      supportedByUser = Boolean(supportResult.data)
      followedByUser = Boolean(followResult.data)
    }
    return {
      id: campaignId,
      companyId,
      status: String(row.status) as CampaignStatus,
      outreachTarget: Number(row.outreach_target ?? 100),
      supporters: Number(row.supporters ?? 0),
      currentShareholders: Number(row.current_shareholders ?? 0),
      questions: Number(row.questions ?? 0),
      votes: Number(row.votes ?? 0),
      followers: Number(row.followers ?? 0),
      launchedAt: String(row.launched_at ?? new Date().toISOString()),
      supportedByUser,
      followedByUser,
    }
  }

  const item = getLocalCampaign(companyId)
  if (!item) return null
  return {
    id: `campaign-${companyId}`,
    companyId,
    status: 'Gathering shareholder interest',
    outreachTarget: 100,
    supporters: item.supporters ?? 0,
    currentShareholders: item.currentShareholders ?? 0,
    questions: item.questions ?? 0,
    votes: item.votes ?? 0,
    followers: item.followers ?? 0,
    launchedAt: item.launchedAt ?? new Date().toISOString(),
    supportedByUser: Boolean(item.supportedByUser),
    followedByUser: Boolean(item.followedByUser),
  }
}

/** Creates the campaign if none exists yet (idempotent), then returns it. */
export async function startCampaign(companyId: string, userId?: string): Promise<Campaign | null> {
  if (supabase) {
    const { error } = await supabase.rpc('start_campaign', { p_company_id: companyId })
    if (error) throw new Error(error.message)
    return getCampaign(companyId, userId)
  }
  updateLocalCampaign(companyId, current =>
    current.exists ? current : { ...current, exists: true, launchedAt: new Date().toISOString(), questions: 0, votes: 0 },
  )
  return getCampaign(companyId)
}

export async function supportCampaign(
  campaign: Campaign,
  shareholderStatus: ShareholderStatus,
  positionRange?: PositionRange,
  userId?: string,
): Promise<Campaign | null> {
  if (supabase && userId) {
    const { error } = await supabase
      .from('campaign_supporters')
      .upsert(
        { campaign_id: campaign.id, user_id: userId, shareholder_status: shareholderStatus, position_range: positionRange ?? null },
        { onConflict: 'campaign_id,user_id' },
      )
    if (error) throw new Error(error.message)
    return getCampaign(campaign.companyId, userId)
  }
  updateLocalCampaign(campaign.companyId, current =>
    current.supportedByUser
      ? current
      : {
          ...current,
          supportedByUser: true,
          supporters: (current.supporters ?? 0) + 1,
          currentShareholders: (current.currentShareholders ?? 0) + (shareholderStatus === 'Current shareholder' ? 1 : 0),
        },
  )
  return getCampaign(campaign.companyId)
}

export async function followCampaign(campaign: Campaign, userId?: string): Promise<Campaign | null> {
  if (supabase && userId) {
    const { error } = await supabase
      .from('campaign_followers')
      .upsert({ campaign_id: campaign.id, user_id: userId }, { onConflict: 'campaign_id,user_id' })
    if (error) throw new Error(error.message)
    return getCampaign(campaign.companyId, userId)
  }
  updateLocalCampaign(campaign.companyId, current =>
    current.followedByUser ? current : { ...current, followedByUser: true, followers: (current.followers ?? 0) + 1 },
  )
  return getCampaign(campaign.companyId)
}

/* -------------------------------- questions ------------------------------- */

export async function getQuestions(companyId: string, userId?: string): Promise<PublicQuestion[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('public_questions')
      .select('*')
      .eq('company_id', companyId)
      .order('votes', { ascending: false })
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Row[]
    let votedIds = new Set<string>()
    let authoredIds = new Set<string>()
    if (userId && rows.length) {
      const ids = rows.map(row => String(row.id))
      // The public_questions view intentionally never exposes author_id (it would
      // deanonymize anonymous questions), so ownership is resolved by asking for
      // the user's own rows — RLS scopes this to questions they can already see.
      const [voteResult, authoredResult] = await Promise.all([
        supabase.from('question_votes').select('question_id').eq('user_id', userId).in('question_id', ids),
        supabase.from('questions').select('id').eq('author_id', userId).in('id', ids),
      ])
      votedIds = new Set(((voteResult.data ?? []) as Row[]).map(row => String(row.question_id)))
      authoredIds = new Set(((authoredResult.data ?? []) as Row[]).map(row => String(row.id)))
    }
    return rows.map(row => ({
      id: String(row.id),
      companyId: String(row.company_id),
      text: String(row.text),
      topic: String(row.topic),
      author: String(row.author ?? 'Anonymous Shareholder'),
      votes: Number(row.votes ?? 0),
      status: String(row.status ?? 'Open'),
      createdAt: String(row.created_at),
      votedByUser: votedIds.has(String(row.id)),
      commentCount: Number(row.comment_count ?? 0),
      isAuthor: authoredIds.has(String(row.id)),
    }))
  }

  // Demo mode only ever shows questions the current browser actually submitted —
  // it never fabricates example question text under a real company's name.
  const store = readLocal()
  const votes = store.votes ?? {}
  return (store.questions ?? [])
    .filter(question => question.companyId === companyId)
    .map(question => ({
      id: question.id,
      companyId,
      text: question.text,
      topic: question.topic,
      author: question.author,
      votes: votes[question.id] ? 1 : 0,
      status: 'Open',
      createdAt: question.createdAt,
      votedByUser: Boolean(votes[question.id]),
      commentCount: 0,
      // Every demo-mode question was written in this browser by its single user.
      isAuthor: Boolean(store.user),
    }))
    .sort((a, b) => b.votes - a.votes)
}

export async function submitQuestion(companyId: string, input: QuestionInput, profile?: Profile | null): Promise<PublicQuestion> {
  const author = input.anonymous ? 'Anonymous Shareholder' : profile?.displayName || 'You'
  if (supabase && profile?.id) {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        company_id: companyId,
        author_id: profile.id,
        question_text: input.text,
        topic: input.topic,
        context: input.context || null,
        shareholder_status: input.shareholderStatus,
        is_anonymous: input.anonymous,
      })
      .select('id, created_at')
      .single()
    if (error) throw new Error(error.message)
    const row = data as Row
    return {
      id: String(row.id),
      companyId,
      text: input.text,
      topic: input.topic,
      author,
      votes: 0,
      status: 'Open',
      createdAt: String(row.created_at),
      votedByUser: false,
      commentCount: 0,
      isAuthor: true,
    }
  }
  const store = readLocal()
  const existing = (store.questions ?? []).find(question => question.companyId === companyId && question.text === input.text)
  const item: LocalQuestion = existing ?? {
    id: `local-question-${Date.now()}`,
    companyId,
    text: input.text,
    topic: input.topic,
    context: input.context,
    shareholderStatus: input.shareholderStatus,
    anonymous: input.anonymous,
    author,
    createdAt: new Date().toISOString(),
  }
  if (!existing) {
    writeLocal({ ...store, questions: [...(store.questions ?? []), item] })
    updateLocalCampaign(companyId, current => ({ ...current, questions: (current.questions ?? 0) + 1 }))
  }
  return {
    id: item.id,
    companyId,
    text: item.text,
    topic: item.topic,
    author: item.author,
    votes: 0,
    status: 'Open',
    createdAt: item.createdAt,
    votedByUser: false,
    commentCount: 0,
    isAuthor: true,
  }
}

/**
 * Updates the text/topic of the user's own question. Only 'Open' / 'Under review'
 * questions are editable (enforced by RLS; mirrored client-side by
 * isQuestionEditable). Returns the updated question, or null when the row was
 * not editable (e.g. its status advanced since the page loaded).
 */
export async function updateQuestion(
  question: PublicQuestion,
  input: { text: string; topic: string },
  userId?: string,
): Promise<PublicQuestion | null> {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('questions')
      .update({ question_text: input.text, topic: input.topic })
      .eq('id', question.id)
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return null
    return { ...question, text: input.text, topic: input.topic }
  }
  const store = readLocal()
  const questions = store.questions ?? []
  const index = questions.findIndex(item => item.id === question.id)
  if (index === -1) return null
  questions[index] = { ...questions[index], text: input.text, topic: input.topic }
  writeLocal({ ...store, questions })
  return { ...question, text: input.text, topic: input.topic }
}

/**
 * Deletes the user's own question. Votes/comments/reports cascade in the
 * database; demo mode removes the local vote record and decrements the local
 * campaign counters so no orphaned state is left. Returns false when the row
 * was not deletable.
 */
export async function deleteQuestion(question: PublicQuestion, userId?: string): Promise<boolean> {
  if (supabase && userId) {
    const { data, error } = await supabase.from('questions').delete().eq('id', question.id).select('id')
    if (error) throw new Error(error.message)
    return Boolean(data && data.length > 0)
  }
  const store = readLocal()
  const questions = store.questions ?? []
  if (!questions.some(item => item.id === question.id)) return false
  const votes = { ...(store.votes ?? {}) }
  const hadVote = Boolean(votes[question.id])
  delete votes[question.id]
  writeLocal({ ...store, questions: questions.filter(item => item.id !== question.id), votes })
  updateLocalCampaign(question.companyId, current => ({
    ...current,
    questions: Math.max(0, (current.questions ?? 0) - 1),
    votes: Math.max(0, (current.votes ?? 0) - (hadVote ? 1 : 0)),
  }))
  return true
}

/** Removes the user's own vote; returns false when there was no vote to remove. */
export async function unvoteQuestion(question: PublicQuestion, userId?: string): Promise<boolean> {
  if (!question.votedByUser) return false
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('question_votes')
      .delete()
      .eq('question_id', question.id)
      .eq('user_id', userId)
      .select('id')
    if (error) throw new Error(error.message)
    return Boolean(data && data.length > 0)
  }
  const store = readLocal()
  const votes = { ...(store.votes ?? {}) }
  if (!votes[question.id]) return false
  delete votes[question.id]
  writeLocal({ ...store, votes })
  updateLocalCampaign(question.companyId, current => ({ ...current, votes: Math.max(0, (current.votes ?? 0) - 1) }))
  return true
}

/**
 * Reports a question for moderation. The reporter is stored server-side but is
 * never exposed publicly (reports has no public SELECT policy). Demo mode has no
 * moderation queue, so the report is accepted without being persisted anywhere.
 */
export async function reportQuestion(questionId: string, reason: string, details?: string, userId?: string): Promise<void> {
  if (supabase && userId) {
    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: userId, question_id: questionId, reason, details: details || null })
    if (error) throw new Error(error.message)
  }
}

/** Records a vote once; returns false when the user had already voted. */
export async function voteQuestion(question: PublicQuestion, userId?: string): Promise<boolean> {
  if (question.votedByUser) return false
  if (supabase && userId) {
    const { error } = await supabase
      .from('question_votes')
      .upsert({ question_id: question.id, user_id: userId }, { onConflict: 'question_id,user_id' })
    if (error) throw new Error(error.message)
    return true
  }
  const store = readLocal()
  const votes = store.votes ?? {}
  if (votes[question.id]) return false
  votes[question.id] = true
  writeLocal({ ...store, votes })
  updateLocalCampaign(question.companyId, current => ({ ...current, votes: (current.votes ?? 0) + 1 }))
  return true
}

/* -------------------------------- timeline -------------------------------- */

/**
 * Builds the campaign timeline strictly from persisted data: the launch date,
 * supporter-count milestones dated by the created_at of the Nth supporter row,
 * and admin-recorded campaign_events (outreach prepared, IR contacted, …).
 * Nothing is fabricated: a milestone appears only once actually reached, and an
 * event appears only if an admin recorded it.
 */
export async function getCampaignTimeline(campaign: Campaign): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [
    { id: 'launch', label: 'Campaign started', at: campaign.launchedAt, kind: 'launch' },
  ]

  if (supabase) {
    const [supportersResult, eventsResult] = await Promise.all([
      supabase
        .from('campaign_supporters')
        .select('created_at')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('public_campaign_events')
        .select('id, event_type, label, created_at')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: true }),
    ])
    if (supportersResult.error) throw new Error(supportersResult.error.message)
    if (eventsResult.error) throw new Error(eventsResult.error.message)
    const supporterDates = ((supportersResult.data ?? []) as Row[]).map(row => String(row.created_at))
    for (const milestone of SUPPORTER_MILESTONES) {
      if (supporterDates.length >= milestone) {
        events.push({
          id: `milestone-${milestone}`,
          label: `${milestone} supporters reached`,
          at: supporterDates[milestone - 1],
          kind: 'milestone',
        })
      }
    }
    for (const row of (eventsResult.data ?? []) as Row[]) {
      events.push({ id: String(row.id), label: String(row.label), at: String(row.created_at), kind: 'event' })
    }
  } else {
    // Demo mode tracks only supporter counts, not when each supporter joined, so
    // reached milestones are shown without a date rather than with an invented one.
    for (const milestone of SUPPORTER_MILESTONES) {
      if (campaign.supporters >= milestone) {
        events.push({ id: `milestone-${milestone}`, label: `${milestone} supporters reached`, kind: 'milestone' })
      }
    }
  }

  return events.sort((a, b) => (a.at && b.at ? a.at.localeCompare(b.at) : 0))
}

/* -------------------------------- feedback -------------------------------- */

/** Persists product feedback. Requires a signed-in user in Supabase mode (see migration 202607140001). */
export async function submitFeedback(input: FeedbackInput, userId?: string): Promise<void> {
  if (supabase) {
    if (!userId) throw new Error('Sign in to send feedback.')
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      category: input.category,
      message: input.message,
      page_path: input.pagePath || null,
    })
    if (error) throw new Error(error.message)
    return
  }
  // Demo mode: acknowledged but stored locally only, like all other demo activity.
  const store = readLocal()
  const feedback = [...(store.feedback ?? []), { ...input, id: `feedback-${Date.now()}`, createdAt: new Date().toISOString() }]
  writeLocal({ ...store, feedback })
}

/* ------------------------------ notifications ------------------------------ */

export async function markNotificationRead(notificationId: string, userId?: string): Promise<void> {
  if (supabase && userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (supabase && userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw new Error(error.message)
  }
}

/* --------------------------- discover highlights --------------------------- */

function metricsToHighlight(row: Row, company: PublicCompany): CompanySearchResult {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    ticker: company.ticker,
    exchange: company.exchange,
    sector: company.sector,
    hasCampaign: true,
    campaignStatus: asOptional(row.status),
    supporters: Number(row.supporters ?? 0),
    questions: Number(row.questions ?? 0),
  }
}

/**
 * Real-activity Discover sections. Every list is derived from persisted
 * campaign metrics — a section simply has no entries (and is hidden by the UI)
 * until real campaigns exist. Ranking rules are documented in
 * docs/core-user-experience.md.
 */
export async function getDiscoverHighlights(limit = 4): Promise<DiscoverHighlights> {
  const empty: DiscoverHighlights = { newest: [], mostSupported: [], mostVoted: [], nearThreshold: [] }

  if (supabase) {
    const { data, error } = await supabase.from('public_campaign_metrics').select('*')
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Row[]
    if (!rows.length) return empty
    const companyIds = [...new Set(rows.map(row => String(row.company_id)))]
    const { data: companyRows, error: companyError } = await supabase.from('companies').select('*').in('id', companyIds)
    if (companyError) throw new Error(companyError.message)
    const companiesById = new Map(((companyRows ?? []) as Row[]).map(row => [String(row.id), mapCompany(row)]))
    const withCompany = rows.flatMap(row => {
      const company = companiesById.get(String(row.company_id))
      return company ? [{ row, company }] : []
    })
    const toResults = (items: typeof withCompany) => items.slice(0, limit).map(({ row, company }) => metricsToHighlight(row, company))
    return {
      newest: toResults([...withCompany].sort((a, b) => String(b.row.launched_at).localeCompare(String(a.row.launched_at)))),
      mostSupported: toResults(
        withCompany.filter(({ row }) => Number(row.supporters) > 0).sort((a, b) => Number(b.row.supporters) - Number(a.row.supporters)),
      ),
      mostVoted: toResults(
        withCompany.filter(({ row }) => Number(row.votes) > 0).sort((a, b) => Number(b.row.votes) - Number(a.row.votes)),
      ),
      nearThreshold: toResults(
        withCompany
          .filter(({ row }) => {
            const supporters = Number(row.supporters ?? 0)
            const target = Number(row.outreach_target ?? 100)
            return supporters >= target / 2 && supporters < target
          })
          .sort((a, b) => Number(b.row.supporters) - Number(a.row.supporters)),
      ),
    }
  }

  const store = readLocal()
  const campaigns = Object.entries(store.campaigns ?? {}).filter(([, campaign]) => campaign.exists)
  if (!campaigns.length) return empty
  const entriesById = new Map(companyDirectory.map(entry => [entry.key, entry]))
  const items = campaigns.flatMap(([companyId, campaign]) => {
    const entry = entriesById.get(companyId)
    return entry ? [{ campaign, result: toSearchResult(entry) }] : []
  })
  return {
    newest: [...items]
      .sort((a, b) => String(b.campaign.launchedAt ?? '').localeCompare(String(a.campaign.launchedAt ?? '')))
      .slice(0, limit)
      .map(item => item.result),
    mostSupported: items.filter(item => (item.campaign.supporters ?? 0) > 0).slice(0, limit).map(item => item.result),
    mostVoted: items.filter(item => (item.campaign.votes ?? 0) > 0).slice(0, limit).map(item => item.result),
    nearThreshold: items.filter(item => (item.campaign.supporters ?? 0) >= 50 && (item.campaign.supporters ?? 0) < 100).slice(0, limit).map(item => item.result),
  }
}

/* ------------------------- popular with retail ---------------------------- */

export type FeaturedRetailCompany = CompanySearchResult & { featureRank: number }
export type FeaturedRetailResult = { companies: FeaturedRetailCompany[]; meta: RetailPopularityMeta }

/**
 * The curated "Popular with Retail Investors" ranking (Discover beta), ordered by
 * feature_rank. This is an editorial snapshot from a third-party linked-broker
 * investor panel — NOT a measure of total retail ownership, and never a live
 * lookup. Only featured records are returned, and every entry maps to a real
 * canonical company page; a record whose company can't be resolved is excluded
 * (not rendered as a broken link) rather than throwing. Panel provenance fields
 * (owner count, tracked value, …) are never exposed here.
 */
export async function getFeaturedRetailCompanies(limit = 100): Promise<FeaturedRetailResult> {
  if (supabase) {
    const { data, error } = await supabase
      .from('public_retail_popularity')
      .select('company_id, feature_rank, source_name, source_url, source_as_of')
      .eq('is_featured', true)
      .order('feature_rank', { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    const rankRows = (data ?? []) as Row[]
    if (!rankRows.length) return { companies: [], meta: retailPopularityMeta }

    const rankByCompany = new Map<string, number>()
    for (const row of rankRows) rankByCompany.set(String(row.company_id), Number(row.feature_rank))
    const companyIds = [...rankByCompany.keys()]

    const [companiesResult, metricsResult] = await Promise.all([
      supabase
        .from('companies')
        .select('*, securities!inner(symbol, exchange, is_primary)')
        .in('id', companyIds)
        .eq('is_discoverable', true)
        .eq('securities.is_primary', true),
      supabase.from('public_campaign_metrics').select('*').in('company_id', companyIds),
    ])
    if (companiesResult.error) throw new Error(companiesResult.error.message)

    const metricsByCompany = new Map<string, Row>()
    for (const row of (metricsResult.data ?? []) as Row[]) metricsByCompany.set(String(row.company_id), row)

    const companies: FeaturedRetailCompany[] = ((companiesResult.data ?? []) as Row[])
      .flatMap(row => {
        const id = String(row.id)
        const rank = rankByCompany.get(id)
        if (rank === undefined) return []
        const embedded = row.securities as Row[] | Row | undefined
        const security = (Array.isArray(embedded) ? embedded[0] : embedded) ?? {}
        const metrics = metricsByCompany.get(id)
        return [
          {
            id,
            slug: String(row.slug ?? id),
            name: String(row.display_name ?? row.name),
            ticker: String((security as Row).symbol ?? row.ticker),
            exchange: String((security as Row).exchange ?? row.exchange),
            sector: asOptional(row.sector),
            hasCampaign: Boolean(metrics),
            campaignStatus: asOptional(metrics?.status),
            supporters: Number(metrics?.supporters ?? 0),
            questions: Number(metrics?.questions ?? 0),
            featureRank: rank,
          },
        ]
      })
      .sort((a, b) => a.featureRank - b.featureRank)

    const first = rankRows[0]
    const meta: RetailPopularityMeta = {
      sourceName: String(first.source_name ?? retailPopularityMeta.sourceName),
      sourceUrl: asOptional(first.source_url) ?? retailPopularityMeta.sourceUrl,
      sourceAsOf: asOptional(first.source_as_of) ?? retailPopularityMeta.sourceAsOf,
    }
    return { companies, meta }
  }

  const entriesByKey = new Map(companyDirectory.map(entry => [entry.key, entry]))
  const companies: FeaturedRetailCompany[] = retailPopularity
    .filter(record => record.isFeatured)
    .flatMap(record => {
      const entry = entriesByKey.get(record.companyKey)
      if (!entry) return []
      return [{ ...toSearchResult(entry), featureRank: record.featureRank }]
    })
    .sort((a, b) => a.featureRank - b.featureRank)
    .slice(0, limit)
  return { companies, meta: retailPopularityMeta }
}

/* --------------------------------- requests ------------------------------- */

async function findMatchingCompany(name: string, ticker: string): Promise<PublicCompany | null> {
  const lookup = await getCompanyByTicker(ticker)
  if (lookup.company) return lookup.company

  const needle = normalizeName(name)
  if (!needle) return null

  if (supabase) {
    const { data, error } = await supabase.from('companies').select('*').ilike('display_name', name).eq('is_discoverable', true).limit(1)
    if (error) throw new Error(error.message)
    const row = (data ?? [])[0] as Row | undefined
    return row ? mapCompany(row) : null
  }
  const entry = companyDirectory.find(candidate => normalizeName(candidate.displayName) === needle)
  return entry ? directoryCompanyToPublic(entry) : null
}

export async function requestCompany(input: CompanyRequestInput, userId?: string): Promise<RequestCompanyResult> {
  const name = input.name.trim()
  const ticker = input.ticker.trim().toUpperCase()

  const matched = await findMatchingCompany(name, ticker)
  if (matched) return { matchedCompany: matched }

  if (supabase && userId) {
    const { data, error } = await supabase
      .from('company_requests')
      .insert({
        requested_by: userId,
        company_name: name,
        ticker,
        // exchange / reason / shareholder_status / consent are no longer
        // collected; they are left to their column defaults (NULL / false)
        // rather than populated with fabricated values.
      })
      .select('id')
      .single()
    if (error) {
      // 23505 = unique_violation on the per-user dedupe index: this shareholder
      // has already requested this company.
      if (error.code === '23505') return { duplicate: true }
      throw new Error(error.message)
    }
    return { requestId: String((data as Row).id) }
  }

  const store = readLocal()
  const requests = store.requests ?? []
  const existing = requests.find(request => request.ticker.toUpperCase() === ticker)
  if (existing) return { duplicate: true }
  const item: LocalRequest = { name, ticker, id: `request-${Date.now()}`, createdAt: new Date().toISOString() }
  writeLocal({ ...store, requests: [...requests, item] })
  return { requestId: item.id }
}

/* ------------------------------ auth & profile ---------------------------- */

export async function getProfileRow(userId: string): Promise<Profile | null> {
  if (!supabase) return readLocal().user ?? null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as Row
  return {
    id: userId,
    displayName: String(row.display_name ?? 'Shareholder'),
    country: asOptional(row.country),
    investorType: asOptional(row.investor_type),
    publicAnonymous: Boolean(row.public_anonymous),
    // The on_auth_user_created trigger inserts a profiles row for every new user
    // (display_name defaulted from their email), before they ever see the profile
    // completion step. investor_type is never set by that trigger — only by
    // completeProfile — so it is the signal that the user actually completed setup.
    complete: row.investor_type != null,
  }
}

export async function buildSupabaseProfile(userId: string, email?: string | null): Promise<Profile> {
  const fallbackName = email?.split('@')[0] || 'Shareholder'
  try {
    const row = await getProfileRow(userId)
    if (row) return { ...row, email: email ?? undefined }
  } catch {
    // Fall through to the minimal profile; the completion prompt will retry the upsert.
  }
  return { id: userId, email: email ?? undefined, displayName: fallbackName, complete: false }
}

export async function getSessionProfile(): Promise<Profile | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return null
    return buildSupabaseProfile(user.id, user.email)
  }
  return readLocal().user ?? null
}

/** Demo mode returns the signed-in profile immediately; Supabase mode returns null until the link is followed. */
export async function signInWithMagicLink(email: string): Promise<Profile | null> {
  if (supabase) {
    // Resolve via the centralized helper so the magic-link redirect is always a
    // normalized absolute URL (never the literal "VITE_SITE_URL"). No dedicated
    // /auth/callback route exists — the link returns to the site root, where
    // supabase-js detects the session in the URL and getSessionProfile() reads it.
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getSiteUrl() } })
    // Preserve the Supabase status/code so the UI can detect rate limits (429 /
    // over_email_send_rate_limit) and show a specific, actionable message rather
    // than a generic failure.
    if (error) {
      throw new AuthRequestError(error.message, {
        status: (error as { status?: number }).status,
        code: (error as { code?: string }).code,
      })
    }
    return null
  }
  const store = readLocal()
  const existing = store.user
  const profile: Profile =
    existing && existing.email === email ? existing : { id: `demo-${email.toLowerCase()}`, email, displayName: email.split('@')[0], complete: false }
  writeLocal({ ...store, user: profile })
  return profile
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    return
  }
  const store = readLocal()
  delete store.user
  writeLocal(store)
}

export type ProfileUpdateInput = {
  displayName: string
  investorType?: string
  country?: string
  publicAnonymous?: boolean
}

export async function updateProfile(input: ProfileUpdateInput, userId: string, email?: string): Promise<Profile> {
  if (supabase) {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: input.displayName,
      investor_type: input.investorType ?? null,
      country: input.country?.trim() || null,
      public_anonymous: input.publicAnonymous ?? false,
    })
    if (error) throw new Error(error.message)
    return {
      id: userId,
      email,
      displayName: input.displayName,
      investorType: input.investorType,
      country: input.country?.trim() || undefined,
      publicAnonymous: input.publicAnonymous ?? false,
      complete: true,
    }
  }
  const store = readLocal()
  const updated: Profile = {
    ...(store.user ?? { id: userId, displayName: input.displayName }),
    email: store.user?.email ?? email,
    displayName: input.displayName,
    investorType: input.investorType,
    country: input.country?.trim() || undefined,
    publicAnonymous: input.publicAnonymous ?? false,
    complete: true,
  }
  writeLocal({ ...store, user: updated })
  return updated
}

/* -------------------------------- dashboard ------------------------------- */

function tickerFor(companyId: string, lookup: Map<string, string>): string | undefined {
  return lookup.get(companyId)
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  if (supabase) {
    const [supportsResult, followsResult, submittedResult, votesResult, notificationsResult] = await Promise.all([
      supabase.from('campaign_supporters').select('created_at, campaign:campaigns(company:companies(*))').eq('user_id', userId),
      supabase.from('campaign_followers').select('created_at, campaign:campaigns(company:companies(*))').eq('user_id', userId),
      supabase.from('questions').select('*, company:companies(ticker)').eq('author_id', userId).order('created_at', { ascending: false }),
      supabase.from('question_votes').select('question_id, created_at').eq('user_id', userId),
      supabase.from('notifications').select('id, title, body, created_at, read_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ])
    const extractCompany = (item: unknown): PublicCompany | null => {
      const company = (item as { campaign?: { company?: Row } }).campaign?.company
      return company ? mapCompany(company) : null
    }
    const supported = (supportsResult.data ?? []).map(extractCompany).filter((c): c is PublicCompany => c !== null)
    const followed = (followsResult.data ?? []).map(extractCompany).filter((c): c is PublicCompany => c !== null)

    const submitted: PublicQuestion[] = ((submittedResult.data ?? []) as Row[]).map(row => ({
      id: String(row.id),
      companyId: String(row.company_id),
      companyTicker: asOptional((row.company as Row | null)?.ticker),
      text: String(row.question_text),
      topic: String(row.topic),
      author: 'You',
      votes: 0,
      status: String(row.status ?? 'Open'),
      createdAt: String(row.created_at),
      votedByUser: false,
      commentCount: 0,
      isAuthor: true,
    }))

    let voted: PublicQuestion[] = []
    const votedIds = ((votesResult.data ?? []) as Row[]).map(row => String(row.question_id))
    if (votedIds.length) {
      const { data: questionRows } = await supabase.from('public_questions').select('*').in('id', votedIds)
      const rows = (questionRows ?? []) as Row[]
      const companyIds = [...new Set(rows.map(row => String(row.company_id)))]
      const tickerLookup = new Map<string, string>()
      if (companyIds.length) {
        const { data: companyRows } = await supabase.from('companies').select('id, ticker').in('id', companyIds)
        for (const row of (companyRows ?? []) as Row[]) tickerLookup.set(String(row.id), String(row.ticker))
      }
      voted = rows.map(row => ({
        id: String(row.id),
        companyId: String(row.company_id),
        companyTicker: tickerFor(String(row.company_id), tickerLookup),
        text: String(row.text),
        topic: String(row.topic),
        author: String(row.author ?? 'Anonymous Shareholder'),
        votes: Number(row.votes ?? 0),
        status: String(row.status ?? 'Open'),
        createdAt: String(row.created_at),
        votedByUser: true,
        commentCount: Number(row.comment_count ?? 0),
        isAuthor: false,
      }))
    }

    const notifications: Notification[] = ((notificationsResult.data ?? []) as Row[]).map(row => ({
      id: String(row.id),
      title: String(row.title),
      body: String(row.body),
      createdAt: String(row.created_at),
      read: Boolean(row.read_at),
    }))

    // Recent activity: each entry corresponds 1:1 to a persisted row the user created.
    const activity: ActivityItem[] = [
      ...((supportsResult.data ?? []) as unknown as Row[]).flatMap((row, index) => {
        const company = extractCompany(row)
        return company
          ? [{ id: `support-${index}`, kind: 'supported' as const, label: `Supported the ${company.name} campaign`, companyTicker: company.ticker, at: String(row.created_at) }]
          : []
      }),
      ...((followsResult.data ?? []) as unknown as Row[]).flatMap((row, index) => {
        const company = extractCompany(row)
        return company
          ? [{ id: `follow-${index}`, kind: 'followed' as const, label: `Followed ${company.name}`, companyTicker: company.ticker, at: String(row.created_at) }]
          : []
      }),
      ...submitted.map(question => ({
        id: `question-${question.id}`,
        kind: 'question' as const,
        label: `Asked: “${question.text.length > 80 ? question.text.slice(0, 80) + '…' : question.text}”`,
        companyTicker: question.companyTicker,
        at: question.createdAt,
      })),
      ...((votesResult.data ?? []) as Row[]).map((row, index) => ({
        id: `vote-${index}`,
        kind: 'vote' as const,
        label: 'Voted for a shareholder question',
        at: String(row.created_at),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 15)

    return { supported, followed, submitted, voted, notifications, activity }
  }

  const store = readLocal()
  const campaigns = store.campaigns ?? {}
  const supportedIds = Object.entries(campaigns).filter(([, c]) => c.supportedByUser).map(([id]) => id)
  const followedIds = Object.entries(campaigns).filter(([, c]) => c.followedByUser).map(([id]) => id)
  const tickerLookup = new Map(companyDirectory.map(entry => [entry.key, primarySecurityOf(entry).symbol]))
  const votedIds = new Set(Object.entries(store.votes ?? {}).filter(([, on]) => on).map(([id]) => id))

  const submitted: PublicQuestion[] = (store.questions ?? []).map(question => ({
    id: question.id,
    companyId: question.companyId,
    companyTicker: tickerFor(question.companyId, tickerLookup),
    text: question.text,
    topic: question.topic,
    author: 'You',
    votes: votedIds.has(question.id) ? 1 : 0,
    status: 'Open',
    createdAt: question.createdAt,
    votedByUser: votedIds.has(question.id),
    commentCount: 0,
    isAuthor: true,
  }))

  // Demo mode doesn't record when supports/follows/votes happened (only that
  // they did), so the activity feed shows only dated events — the questions
  // this browser actually submitted. No dates are invented.
  const activity: ActivityItem[] = submitted
    .map(question => ({
      id: `question-${question.id}`,
      kind: 'question' as const,
      label: `Asked: “${question.text.length > 80 ? question.text.slice(0, 80) + '…' : question.text}”`,
      companyTicker: question.companyTicker,
      at: question.createdAt,
    }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15)

  return {
    supported: companyDirectory.filter(entry => supportedIds.includes(entry.key)).map(directoryCompanyToPublic),
    followed: companyDirectory.filter(entry => followedIds.includes(entry.key)).map(directoryCompanyToPublic),
    submitted,
    voted: submitted.filter(question => question.votedByUser),
    notifications: [],
    activity,
  }
}

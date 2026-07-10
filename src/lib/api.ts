import { companyDirectory, type DirectoryCompany, type DirectorySecurity } from '../data/companyDirectory'
import { buildCompanySlug, normalizeName, normalizeSymbol } from './companyIdentity'
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
  /** True once the user has confirmed display name / investor type. */
  complete?: boolean
}

export type Notification = { id: string; title: string; body: string; createdAt: string; read: boolean }

export type DashboardData = {
  supported: PublicCompany[]
  followed: PublicCompany[]
  submitted: PublicQuestion[]
  voted: PublicQuestion[]
  notifications: Notification[]
}

export type QuestionInput = {
  text: string
  topic: string
  context?: string
  shareholderStatus: ShareholderStatus
  anonymous: boolean
}

export type CompanyRequestInput = {
  name: string
  ticker: string
  exchange: string
  reason: string
  shareholderStatus: ShareholderStatus
  suggestedTopic?: string
  consent: boolean
}

export type RequestCompanyResult = { matchedCompany: PublicCompany } | { requestId: string }

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
const legacyStorageKey = 'grround-floor-mvp'

// One-time migration: carry forward demo-mode data stored under the pre-rename key.
// Never runs in test mode — test mode's storage namespace must never be seeded
// from whatever demo data exists in a developer's browser.
function migrateLegacyStorage() {
  if (getDataModeConfig().isTestMode) return
  if (localStorage.getItem(storageKey) !== null) return
  const legacy = localStorage.getItem(legacyStorageKey)
  if (legacy !== null) localStorage.setItem(storageKey, legacy)
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
    if (userId && rows.length) {
      const { data: voteRows } = await supabase
        .from('question_votes')
        .select('question_id')
        .eq('user_id', userId)
        .in('question_id', rows.map(row => String(row.id)))
      votedIds = new Set(((voteRows ?? []) as Row[]).map(row => String(row.question_id)))
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
  const matched = await findMatchingCompany(input.name, input.ticker)
  if (matched) return { matchedCompany: matched }

  const ticker = input.ticker.toUpperCase()
  if (supabase && userId) {
    const { data, error } = await supabase
      .from('company_requests')
      .insert({
        requested_by: userId,
        company_name: input.name,
        ticker,
        exchange: input.exchange,
        reason: input.reason,
        shareholder_status: input.shareholderStatus,
        suggested_topic: input.suggestedTopic || null,
        consent: input.consent,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { requestId: String((data as Row).id) }
  }
  const store = readLocal()
  const requests = store.requests ?? []
  const existing = requests.find(request => request.ticker.toUpperCase() === ticker)
  if (existing) return { requestId: existing.id }
  const item: LocalRequest = { ...input, ticker, id: `request-${Date.now()}`, createdAt: new Date().toISOString() }
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
    complete: true,
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
    const redirectTo = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    if (error) throw new Error(error.message)
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

export async function updateProfile(input: { displayName: string; investorType?: string }, userId: string, email?: string): Promise<Profile> {
  if (supabase) {
    const { error } = await supabase.from('profiles').upsert({ id: userId, display_name: input.displayName, investor_type: input.investorType ?? null })
    if (error) throw new Error(error.message)
    return { id: userId, email, displayName: input.displayName, investorType: input.investorType, complete: true }
  }
  const store = readLocal()
  const updated: Profile = {
    ...(store.user ?? { id: userId, displayName: input.displayName }),
    email: store.user?.email ?? email,
    displayName: input.displayName,
    investorType: input.investorType,
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
      supabase.from('campaign_supporters').select('campaign:campaigns(company:companies(*))').eq('user_id', userId),
      supabase.from('campaign_followers').select('campaign:campaigns(company:companies(*))').eq('user_id', userId),
      supabase.from('questions').select('*, company:companies(ticker)').eq('author_id', userId).order('created_at', { ascending: false }),
      supabase.from('question_votes').select('question_id').eq('user_id', userId),
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
      }))
    }

    const notifications: Notification[] = ((notificationsResult.data ?? []) as Row[]).map(row => ({
      id: String(row.id),
      title: String(row.title),
      body: String(row.body),
      createdAt: String(row.created_at),
      read: Boolean(row.read_at),
    }))

    return { supported, followed, submitted, voted, notifications }
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
  }))

  return {
    supported: companyDirectory.filter(entry => supportedIds.includes(entry.key)).map(directoryCompanyToPublic),
    followed: companyDirectory.filter(entry => followedIds.includes(entry.key)).map(directoryCompanyToPublic),
    submitted,
    voted: submitted.filter(question => question.votedByUser),
    notifications: [],
  }
}

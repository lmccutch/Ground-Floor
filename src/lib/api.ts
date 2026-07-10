import { companies as seedCompanies, sampleQuestions } from '../data'
import { supabase } from './supabase'

// When Supabase is configured every function reads/writes the real database and
// throws on failure. Without it, the app runs in demo mode: data lives in
// localStorage and is clearly labelled as such in the UI.

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
}

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
  sample?: boolean
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

/* ------------------------------ demo storage ------------------------------ */

const storageKey = 'grround-floor-mvp'

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
>

type LocalRequest = CompanyRequestInput & { id: string; createdAt: string }

type LocalStore = {
  user?: Profile
  campaigns?: Record<string, LocalCampaign>
  votes?: Record<string, boolean>
  questions?: LocalQuestion[]
  requests?: LocalRequest[]
}

function readLocal(): LocalStore {
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
}

const demoCompanies: PublicCompany[] = seedCompanies.map((company, index) => ({
  id: `company-${index + 1}`,
  ...company,
  description: `${company.name} is a fictional company used to demonstrate Grround Floor.`,
  website: 'https://example.com',
  investorRelationsUrl: 'https://example.com/investors',
  status: 'Early shareholder campaign',
}))

/* -------------------------------- companies ------------------------------- */

type Row = Record<string, unknown>

function asOptional(value: unknown): string | undefined {
  return value ? String(value) : undefined
}

function mapCompany(row: Row): PublicCompany {
  return {
    id: String(row.id),
    name: String(row.name),
    ticker: String(row.ticker),
    exchange: String(row.exchange ?? ''),
    sector: String(row.sector ?? ''),
    country: asOptional(row.country),
    description: String(row.description ?? ''),
    website: asOptional(row.website),
    investorRelationsUrl: asOptional(row.investor_relations_url ?? row.investorRelationsUrl),
    status: String(row.status ?? 'Early shareholder campaign'),
    accent: asOptional(row.accent),
  }
}

export async function getCompanies(query = ''): Promise<PublicCompany[]> {
  let list: PublicCompany[]
  if (supabase) {
    const { data, error } = await supabase.from('companies').select('*').eq('is_public', true).order('name')
    if (error) throw new Error(error.message)
    list = ((data ?? []) as Row[]).map(mapCompany)
  } else {
    list = demoCompanies
  }
  const needle = query.trim().toLowerCase()
  if (!needle) return list
  return list.filter(company => `${company.name} ${company.ticker} ${company.sector} ${company.exchange}`.toLowerCase().includes(needle))
}

export async function getCompanyByTicker(ticker: string): Promise<PublicCompany | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('ticker', ticker)
      .eq('is_public', true)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapCompany(data as Row) : null
  }
  return demoCompanies.find(company => company.ticker.toLowerCase() === ticker.toLowerCase()) ?? null
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
  const store = readLocal()
  const item = store.campaigns?.[companyId] ?? {}
  if (!item.launchedAt) {
    updateLocalCampaign(companyId, current => ({ ...current, launchedAt: new Date().toISOString() }))
  }
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
  const store = readLocal()
  const votes = store.votes ?? {}
  const own = (store.questions ?? [])
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
  // Example questions appear on the first demo campaign only, badged as samples.
  const samples =
    companyId === 'company-1'
      ? sampleQuestions.map((question, index) => {
          const id = `question-${index + 1}`
          const voted = Boolean(votes[id])
          return {
            id,
            companyId,
            text: question.text,
            topic: question.topic,
            author: question.author,
            votes: question.votes + (voted ? 1 : 0),
            status: 'Open',
            createdAt: question.createdAt,
            votedByUser: voted,
            commentCount: question.comments,
            sample: true,
          }
        })
      : []
  return [...own, ...samples].sort((a, b) => b.votes - a.votes)
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

export async function requestCompany(input: CompanyRequestInput, userId?: string) {
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
    return data
  }
  const store = readLocal()
  const requests = store.requests ?? []
  const existing = requests.find(request => request.ticker.toUpperCase() === ticker)
  if (existing) return existing
  const item: LocalRequest = { ...input, ticker, id: `request-${Date.now()}`, createdAt: new Date().toISOString() }
  writeLocal({ ...store, requests: [...requests, item] })
  return item
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
  const tickerLookup = new Map(demoCompanies.map(company => [company.id, company.ticker]))
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

  const votedSamples: PublicQuestion[] = sampleQuestions
    .map((question, index) => ({ question, id: `question-${index + 1}` }))
    .filter(({ id }) => votedIds.has(id))
    .map(({ question, id }) => ({
      id,
      companyId: 'company-1',
      companyTicker: tickerFor('company-1', tickerLookup),
      text: question.text,
      topic: question.topic,
      author: question.author,
      votes: question.votes + 1,
      status: 'Open',
      createdAt: question.createdAt,
      votedByUser: true,
      commentCount: question.comments,
      sample: true,
    }))

  return {
    supported: demoCompanies.filter(company => supportedIds.includes(company.id)),
    followed: demoCompanies.filter(company => followedIds.includes(company.id)),
    submitted,
    voted: [...submitted.filter(question => question.votedByUser), ...votedSamples],
    notifications: [],
  }
}

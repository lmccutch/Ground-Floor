// Fictional seed data used only when Supabase is not configured (demo mode).
// It mirrors supabase/seed/202607100002_seed_fictional_companies.sql.

export type SeedCompany = {
  name: string
  ticker: string
  exchange: string
  sector: string
  country: string
  accent: string
}

export const companies: SeedCompany[] = [
  { name: 'Northstar Grid Systems', ticker: 'NGS', exchange: 'NYSE', sector: 'Energy infrastructure', country: 'United States', accent: '#f2b134' },
  { name: 'Asteria Cloud', ticker: 'ASTR', exchange: 'NASDAQ', sector: 'Software', country: 'United States', accent: '#93b7d8' },
  { name: 'Morrow Foods', ticker: 'MRWF', exchange: 'TSX', sector: 'Consumer products', country: 'Canada', accent: '#e58b75' },
  { name: 'LumenPay', ticker: 'LMPY', exchange: 'LSE', sector: 'Financial technology', country: 'United Kingdom', accent: '#9b8bd4' },
  { name: 'Ironvale Robotics', ticker: 'IVRB', exchange: 'XETRA', sector: 'Industrials', country: 'Germany', accent: '#7dbca8' },
  { name: 'Vireo Health', ticker: 'VIRE', exchange: 'NASDAQ', sector: 'Healthcare', country: 'United States', accent: '#86b6b2' },
  { name: 'Redwood Minerals', ticker: 'RWDM', exchange: 'ASX', sector: 'Mining', country: 'Australia', accent: '#bf9b70' },
  { name: 'SignalNorth', ticker: 'SGNL', exchange: 'NASDAQ', sector: 'Telecommunications', country: 'Sweden', accent: '#6ca2c6' },
]

export type SampleQuestion = {
  text: string
  topic: string
  author: string
  votes: number
  comments: number
  createdAt: string
}

// Example questions shown on the Northstar demo campaign only, always badged as examples.
export const sampleQuestions: SampleQuestion[] = [
  { text: 'What assumptions support management’s target of reaching 30% gross margins by 2028?', topic: 'Financial performance', author: 'Priya K.', votes: 38, comments: 6, createdAt: '2026-06-28T14:00:00Z' },
  { text: 'How much of the current backlog is contractually committed rather than based on non-binding purchase intentions?', topic: 'Operations', author: 'Anonymous Shareholder', votes: 27, comments: 4, createdAt: '2026-06-30T09:30:00Z' },
  { text: 'Why has executive compensation increased faster than free cash flow over the past three years?', topic: 'Executive compensation', author: 'Daniel R.', votes: 19, comments: 8, createdAt: '2026-07-01T18:15:00Z' },
  { text: 'What would cause the company to delay construction of the Arizona production facility?', topic: 'Strategy', author: 'Maya T.', votes: 12, comments: 3, createdAt: '2026-07-03T11:45:00Z' },
  { text: 'How does management assess customer concentration risk among its three largest utility clients?', topic: 'Competition', author: 'Jon Bell', votes: 9, comments: 2, createdAt: '2026-07-05T16:20:00Z' },
]

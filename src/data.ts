export type Company = {
  name: string
  ticker: string
  sector: string
  marketCap: string
  retailOwnership: string
  shareholders: string
  shares: string
  nextCall: string
  questions: number
  accent: string
  country: string
}

export type Question = {
  rank: number
  text: string
  topic: string
  author: string
  votes: number
  shares: string
  status: string
  discussion: number
  verified: boolean
}

export const companies: Company[] = [
  { name: 'Northstar Grid Systems', ticker: 'NGS', sector: 'Energy infrastructure', marketCap: '$2.4B', retailOwnership: '38%', shareholders: '3,842', shares: '6.7M', nextCall: 'Jun 18, 2026', questions: 86, accent: '#f2b134', country: 'United States' },
  { name: 'Asteria Cloud', ticker: 'ASTR', sector: 'Software', marketCap: '$8.1B', retailOwnership: '31%', shareholders: '2,906', shares: '4.1M', nextCall: 'Jun 24, 2026', questions: 42, accent: '#93b7d8', country: 'United States' },
  { name: 'Morrow Foods', ticker: 'MRWF', sector: 'Consumer products', marketCap: '$1.1B', retailOwnership: '46%', shareholders: '1,884', shares: '2.9M', nextCall: 'Jul 02, 2026', questions: 34, accent: '#e58b75', country: 'Canada' },
  { name: 'LumenPay', ticker: 'LMPY', sector: 'Financial technology', marketCap: '$3.7B', retailOwnership: '27%', shareholders: '1,622', shares: '1.8M', nextCall: 'Jul 09, 2026', questions: 28, accent: '#9b8bd4', country: 'United Kingdom' },
  { name: 'Ironvale Robotics', ticker: 'IVRB', sector: 'Industrials', marketCap: '$5.2B', retailOwnership: '22%', shareholders: '1,210', shares: '1.4M', nextCall: 'Aug 04, 2026', questions: 19, accent: '#7dbca8', country: 'Germany' },
  { name: 'Vireo Health', ticker: 'VIRE', sector: 'Healthcare', marketCap: '$960M', retailOwnership: '54%', shareholders: '980', shares: '2.2M', nextCall: 'Aug 11, 2026', questions: 61, accent: '#86b6b2', country: 'United States' },
  { name: 'Redwood Minerals', ticker: 'RWDM', sector: 'Mining', marketCap: '$1.8B', retailOwnership: '41%', shareholders: '764', shares: '3.6M', nextCall: 'Sep 01, 2026', questions: 17, accent: '#bf9b70', country: 'Australia' },
  { name: 'SignalNorth', ticker: 'SGNL', sector: 'Telecommunications', marketCap: '$4.6B', retailOwnership: '35%', shareholders: '612', shares: '1.1M', nextCall: 'Sep 16, 2026', questions: 23, accent: '#6ca2c6', country: 'Sweden' },
]

export const questions: Question[] = [
  { rank: 1, text: 'What assumptions support management’s target of reaching 30% gross margins by 2028?', topic: 'Financials', author: 'Priya K.', votes: 318, shares: '1.2M', status: 'Management selected', discussion: 24, verified: true },
  { rank: 2, text: 'How much of the current backlog is contractually committed rather than based on non-binding purchase intentions?', topic: 'Operations', author: 'Anonymous shareholder', votes: 274, shares: '890K', status: 'Open', discussion: 18, verified: true },
  { rank: 3, text: 'Why has executive compensation increased faster than free cash flow over the past three years?', topic: 'Governance', author: 'Daniel R.', votes: 231, shares: '740K', status: 'Open', discussion: 31, verified: true },
  { rank: 4, text: 'What would cause the company to delay construction of the Arizona production facility?', topic: 'Strategy', author: 'Maya T.', votes: 188, shares: '520K', status: 'Open', discussion: 12, verified: true },
  { rank: 5, text: 'How does management assess customer concentration risk among its three largest utility clients?', topic: 'Competition', author: 'Jon Bell', votes: 156, shares: '410K', status: 'Answered', discussion: 9, verified: false },
]

export const callChapters = ['00:00 Introduction', '02:14 Backlog quality', '07:48 Gross-margin targets', '13:25 Arizona facility', '19:40 Capital allocation', '25:15 Customer concentration', '31:10 Shareholder questions']

export const claims = [
  { claim: 'Gross margins will exceed 30% by 2028', date: 'May 14, 2026', evidence: 'Q1 shareholder interview', contrary: 'Current margin is 24.8%', status: 'On track', confidence: 'Medium', event: 'Q2 2026 results' },
  { claim: 'Arizona facility will begin production in Q3 2027', date: 'May 14, 2026', evidence: 'Site permits approved', contrary: 'Interconnection study pending', status: 'At risk', confidence: 'Medium', event: 'Construction update' },
  { claim: 'Customer concentration will decline below 40%', date: 'Feb 27, 2026', evidence: 'Two new utility contracts', contrary: 'Top three remain 48%', status: 'Unverified', confidence: 'Low', event: 'FY 2026 filing' },
  { claim: 'Free cash flow will turn positive next year', date: 'Nov 08, 2025', evidence: 'Operating leverage trend', contrary: 'Capex guidance increased', status: 'At risk', confidence: 'Medium', event: 'FY 2026 results' },
]

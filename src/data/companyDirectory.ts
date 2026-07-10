// GroundFloor curated launch directory (Phase 1).
//
// This is a hand-curated list of recognizable, real U.S.-listed operating
// companies used as a launch directory while GroundFloor has no live provider
// integration. It is NOT a comprehensive or exhaustive screen of every
// U.S.-listed company above any market-cap threshold — see docs/company-universe.md.
//
// This file is the single source of truth for company/security/alias facts.
// It is imported by:
//   - demo mode (src/lib/api.ts), so the app works with no backend at all
//   - unit tests (search ranking, symbol normalization)
//   - Playwright e2e tests
//   - the Supabase bootstrap generator (scripts/generate-company-bootstrap.ts)
//
// Do not duplicate this list elsewhere. Market-cap values are broad, static
// bands only — never exact figures, and never presented as recently verified.

export type Exchange = 'NASDAQ' | 'NYSE' | 'NYSE_AMERICAN'

export type MarketCapBand = '$300M-$1B' | '$1B-$5B' | '$5B-$25B' | '$25B-$100B' | 'Over $100B'

export type DirectorySecurity = {
  symbol: string
  exchange: Exchange
  isPrimary: boolean
  isAdr?: boolean
  shareClass?: string
}

export type DirectoryAlias = {
  alias: string
  aliasType: 'former_company_name' | 'former_ticker' | 'abbreviation' | 'brand_name'
}

export type DirectoryCompany = {
  /** Stable, hand-assigned key — used as the demo-mode id and the bootstrap upsert key. */
  key: string
  legalName: string
  displayName: string
  sector: string
  country: string
  marketCapCategory: MarketCapBand
  description: string
  securities: DirectorySecurity[]
  aliases?: DirectoryAlias[]
  /** Demo mode intentionally seeds no campaign for these, so the empty-campaign
   *  state is reachable without any admin tool. */
  seedNoCampaign?: boolean
}

function simple(
  key: string,
  legalName: string,
  sector: string,
  country: string,
  marketCapCategory: MarketCapBand,
  ticker: string,
  exchange: Exchange,
  description: string,
  options?: { isAdr?: boolean; displayName?: string; seedNoCampaign?: boolean; aliases?: DirectoryAlias[] },
): DirectoryCompany {
  return {
    key,
    legalName,
    displayName: options?.displayName ?? legalName,
    sector,
    country,
    marketCapCategory,
    description,
    securities: [{ symbol: ticker, exchange, isPrimary: true, isAdr: options?.isAdr }],
    aliases: options?.aliases,
    seedNoCampaign: options?.seedNoCampaign,
  }
}

/* ------------------------------- Technology ------------------------------ */

const technology: DirectoryCompany[] = [
  simple('apple', 'Apple Inc.', 'Technology', 'United States', 'Over $100B', 'AAPL', 'NASDAQ', 'Designs, manufactures, and sells smartphones, personal computers, wearables, and related services.'),
  simple('microsoft', 'Microsoft Corporation', 'Technology', 'United States', 'Over $100B', 'MSFT', 'NASDAQ', 'Develops operating systems, productivity software, cloud computing, and gaming platforms.'),
  {
    key: 'alphabet',
    legalName: 'Alphabet Inc.',
    displayName: 'Alphabet',
    sector: 'Technology',
    country: 'United States',
    marketCapCategory: 'Over $100B',
    description: 'Parent company of Google, providing search, advertising, cloud computing, and other internet services.',
    securities: [
      { symbol: 'GOOGL', exchange: 'NASDAQ', isPrimary: true, shareClass: 'Class A' },
      { symbol: 'GOOG', exchange: 'NASDAQ', isPrimary: false, shareClass: 'Class C' },
    ],
  },
  simple('amazon', 'Amazon.com, Inc.', 'Technology', 'United States', 'Over $100B', 'AMZN', 'NASDAQ', 'Operates online retail, cloud computing (AWS), digital advertising, and logistics businesses.'),
  {
    key: 'meta-platforms',
    legalName: 'Meta Platforms, Inc.',
    displayName: 'Meta Platforms',
    sector: 'Technology',
    country: 'United States',
    marketCapCategory: 'Over $100B',
    description: 'Operates Facebook, Instagram, and WhatsApp, and develops virtual and augmented reality products.',
    securities: [{ symbol: 'META', exchange: 'NASDAQ', isPrimary: true }],
    aliases: [
      { alias: 'FB', aliasType: 'former_ticker' },
      { alias: 'Facebook, Inc.', aliasType: 'former_company_name' },
      { alias: 'Facebook', aliasType: 'brand_name' },
    ],
  },
  simple('nvidia', 'NVIDIA Corporation', 'Technology', 'United States', 'Over $100B', 'NVDA', 'NASDAQ', 'Designs graphics processors and AI computing hardware and software platforms.'),
  simple('adobe', 'Adobe Inc.', 'Technology', 'United States', '$25B-$100B', 'ADBE', 'NASDAQ', 'Develops creative, document, and digital-marketing software.'),
  simple('salesforce', 'Salesforce, Inc.', 'Technology', 'United States', '$25B-$100B', 'CRM', 'NYSE', 'Provides cloud-based customer relationship management and enterprise software.'),
  simple('oracle', 'Oracle Corporation', 'Technology', 'United States', 'Over $100B', 'ORCL', 'NYSE', 'Develops database software, cloud infrastructure, and enterprise applications.'),
  simple('intel', 'Intel Corporation', 'Technology', 'United States', '$25B-$100B', 'INTC', 'NASDAQ', 'Designs and manufactures semiconductors and computing hardware.'),
  simple('cisco', 'Cisco Systems, Inc.', 'Technology', 'United States', '$25B-$100B', 'CSCO', 'NASDAQ', 'Manufactures networking hardware, software, and cybersecurity products.'),
  simple('ibm', 'International Business Machines Corporation', 'Technology', 'United States', 'Over $100B', 'IBM', 'NYSE', 'Provides enterprise IT infrastructure, consulting, and hybrid-cloud software.', { displayName: 'IBM' }),
  simple('qualcomm', 'QUALCOMM Incorporated', 'Technology', 'United States', '$25B-$100B', 'QCOM', 'NASDAQ', 'Designs semiconductors and wireless technology for mobile devices.', { displayName: 'Qualcomm' }),
  simple('texas-instruments', 'Texas Instruments Incorporated', 'Technology', 'United States', '$25B-$100B', 'TXN', 'NASDAQ', 'Designs and manufactures analog and embedded processing semiconductors.', { displayName: 'Texas Instruments' }),
  simple('broadcom', 'Broadcom Inc.', 'Technology', 'United States', 'Over $100B', 'AVGO', 'NASDAQ', 'Designs semiconductors and infrastructure software for networking and data centers.'),
  simple('amd', 'Advanced Micro Devices, Inc.', 'Technology', 'United States', '$25B-$100B', 'AMD', 'NASDAQ', 'Designs microprocessors and graphics processors for computing and gaming.', { displayName: 'AMD' }),
  simple('servicenow', 'ServiceNow, Inc.', 'Technology', 'United States', '$25B-$100B', 'NOW', 'NYSE', 'Provides cloud-based workflow automation software for enterprises.'),
  simple('workday', 'Workday, Inc.', 'Technology', 'United States', '$5B-$25B', 'WDAY', 'NASDAQ', 'Provides cloud-based finance and human-capital-management software.'),
  simple('palo-alto-networks', 'Palo Alto Networks, Inc.', 'Technology', 'United States', '$25B-$100B', 'PANW', 'NASDAQ', 'Provides cybersecurity platforms for network, cloud, and endpoint security.', { displayName: 'Palo Alto Networks' }),
  simple('crowdstrike', 'CrowdStrike Holdings, Inc.', 'Technology', 'United States', '$25B-$100B', 'CRWD', 'NASDAQ', 'Provides cloud-delivered endpoint and threat-detection security software.'),
  simple('shopify', 'Shopify Inc.', 'Technology', 'Canada', '$25B-$100B', 'SHOP', 'NYSE', 'Provides e-commerce software that lets merchants build and manage online stores.'),
  simple('sap', 'SAP SE', 'Technology', 'Germany', 'Over $100B', 'SAP', 'NYSE', 'Develops enterprise resource planning and business-application software.', { isAdr: true }),
  simple('snowflake', 'Snowflake Inc.', 'Technology', 'United States', '$25B-$100B', 'SNOW', 'NYSE', 'Provides a cloud-based data platform for storage, analytics, and sharing.'),
  simple('palantir', 'Palantir Technologies Inc.', 'Technology', 'United States', 'Over $100B', 'PLTR', 'NYSE', 'Builds data-integration and analytics software for government and commercial customers.'),
  simple('uber', 'Uber Technologies, Inc.', 'Technology', 'United States', '$25B-$100B', 'UBER', 'NYSE', 'Operates ride-hailing, food-delivery, and freight marketplace platforms.'),
  simple('airbnb', 'Airbnb, Inc.', 'Technology', 'United States', '$25B-$100B', 'ABNB', 'NASDAQ', 'Operates an online marketplace for short-term lodging and experiences.'),
  simple('doordash', 'DoorDash, Inc.', 'Technology', 'United States', '$25B-$100B', 'DASH', 'NASDAQ', 'Operates a local commerce and food-delivery logistics platform.'),
  simple('micron', 'Micron Technology, Inc.', 'Technology', 'United States', '$25B-$100B', 'MU', 'NASDAQ', 'Manufactures memory and storage semiconductors.', { displayName: 'Micron Technology' }),
  simple('applied-materials', 'Applied Materials, Inc.', 'Technology', 'United States', '$25B-$100B', 'AMAT', 'NASDAQ', 'Manufactures equipment used to fabricate semiconductors and displays.'),
  simple('lam-research', 'Lam Research Corporation', 'Technology', 'United States', '$25B-$100B', 'LRCX', 'NASDAQ', 'Manufactures wafer-fabrication equipment for the semiconductor industry.'),
  simple('kla', 'KLA Corporation', 'Technology', 'United States', '$25B-$100B', 'KLAC', 'NASDAQ', 'Manufactures process-control and yield-management systems for semiconductor manufacturing.', { displayName: 'KLA' }),
  simple('analog-devices', 'Analog Devices, Inc.', 'Technology', 'United States', '$25B-$100B', 'ADI', 'NASDAQ', 'Designs analog, mixed-signal, and digital signal processing semiconductors.'),
  simple('synopsys', 'Synopsys, Inc.', 'Technology', 'United States', '$25B-$100B', 'SNPS', 'NASDAQ', 'Provides electronic design automation software for chip design.'),
  simple('cadence', 'Cadence Design Systems, Inc.', 'Technology', 'United States', '$25B-$100B', 'CDNS', 'NASDAQ', 'Provides electronic design automation software and IP for chip and system design.', { displayName: 'Cadence Design Systems' }),
  simple('autodesk', 'Autodesk, Inc.', 'Technology', 'United States', '$25B-$100B', 'ADSK', 'NASDAQ', 'Develops design and engineering software for architecture, construction, and manufacturing.'),
  simple('intuit', 'Intuit Inc.', 'Technology', 'United States', 'Over $100B', 'INTU', 'NASDAQ', 'Develops financial and tax software including TurboTax and QuickBooks.'),
  simple('booking-holdings', 'Booking Holdings Inc.', 'Technology', 'United States', 'Over $100B', 'BKNG', 'NASDAQ', 'Operates online travel and reservation platforms including Booking.com and Priceline.', { displayName: 'Booking Holdings' }),
  simple('netflix', 'Netflix, Inc.', 'Technology', 'United States', 'Over $100B', 'NFLX', 'NASDAQ', 'Operates a subscription streaming service for films and television series.'),
  simple('datadog', 'Datadog, Inc.', 'Technology', 'United States', '$25B-$100B', 'DDOG', 'NASDAQ', 'Provides cloud-monitoring and observability software for infrastructure and applications.', { seedNoCampaign: true }),
  simple('mongodb', 'MongoDB, Inc.', 'Technology', 'United States', '$5B-$25B', 'MDB', 'NASDAQ', 'Develops a general-purpose document database platform.', { seedNoCampaign: true }),
  simple('zoom', 'Zoom Communications, Inc.', 'Technology', 'United States', '$5B-$25B', 'ZM', 'NASDAQ', 'Provides video conferencing and unified communications software.', { displayName: 'Zoom' }),
  simple('atlassian', 'Atlassian Corporation', 'Technology', 'Australia', '$25B-$100B', 'TEAM', 'NASDAQ', 'Develops collaboration and software-development tools including Jira and Confluence.'),
  simple('spotify', 'Spotify Technology S.A.', 'Technology', 'Luxembourg', '$25B-$100B', 'SPOT', 'NYSE', 'Operates an audio streaming platform for music and podcasts.', { displayName: 'Spotify' }),
  simple('mercadolibre', 'MercadoLibre, Inc.', 'Technology', 'Argentina', '$25B-$100B', 'MELI', 'NASDAQ', 'Operates e-commerce and fintech platforms across Latin America.', { displayName: 'MercadoLibre' }),
]

/* --------------------------------- Financial services --------------------------------- */

const financials: DirectoryCompany[] = [
  simple('jpmorgan', 'JPMorgan Chase & Co.', 'Financial services', 'United States', 'Over $100B', 'JPM', 'NYSE', 'Operates a global bank offering consumer, commercial, and investment banking services.', { displayName: 'JPMorgan Chase' }),
  simple('bank-of-america', 'Bank of America Corporation', 'Financial services', 'United States', 'Over $100B', 'BAC', 'NYSE', 'Provides consumer and commercial banking, wealth management, and investment banking.', { displayName: 'Bank of America' }),
  simple('wells-fargo', 'Wells Fargo & Company', 'Financial services', 'United States', 'Over $100B', 'WFC', 'NYSE', 'Provides consumer and commercial banking and financial services.'),
  simple('citigroup', 'Citigroup Inc.', 'Financial services', 'United States', 'Over $100B', 'C', 'NYSE', 'Operates a global bank offering consumer and institutional financial services.'),
  simple('goldman-sachs', 'The Goldman Sachs Group, Inc.', 'Financial services', 'United States', 'Over $100B', 'GS', 'NYSE', 'Provides investment banking, securities, and investment management services.', { displayName: 'Goldman Sachs' }),
  simple('morgan-stanley', 'Morgan Stanley', 'Financial services', 'United States', 'Over $100B', 'MS', 'NYSE', 'Provides investment banking, wealth management, and institutional securities services.'),
  {
    key: 'berkshire-hathaway',
    legalName: 'Berkshire Hathaway Inc.',
    displayName: 'Berkshire Hathaway',
    sector: 'Financial services',
    country: 'United States',
    marketCapCategory: 'Over $100B',
    description: 'A diversified holding company with insurance, railroad, energy, and manufacturing operations.',
    securities: [
      { symbol: 'BRK.A', exchange: 'NYSE', isPrimary: true, shareClass: 'Class A' },
      { symbol: 'BRK.B', exchange: 'NYSE', isPrimary: false, shareClass: 'Class B' },
    ],
  },
  simple('american-express', 'American Express Company', 'Financial services', 'United States', 'Over $100B', 'AXP', 'NYSE', 'Issues charge and credit cards and provides merchant payment services.', { displayName: 'American Express' }),
  simple('visa', 'Visa Inc.', 'Financial services', 'United States', 'Over $100B', 'V', 'NYSE', 'Operates a global electronic payments network.'),
  simple('mastercard', 'Mastercard Incorporated', 'Financial services', 'United States', 'Over $100B', 'MA', 'NYSE', 'Operates a global electronic payments network.'),
  simple('paypal', 'PayPal Holdings, Inc.', 'Financial services', 'United States', '$25B-$100B', 'PYPL', 'NASDAQ', 'Operates a digital payments and money-transfer platform.', { displayName: 'PayPal' }),
  simple('sofi', 'SoFi Technologies, Inc.', 'Financial services', 'United States', '$5B-$25B', 'SOFI', 'NASDAQ', 'Provides digital banking, lending, and investing products.', { displayName: 'SoFi Technologies' }),
  simple('charles-schwab', 'The Charles Schwab Corporation', 'Financial services', 'United States', 'Over $100B', 'SCHW', 'NYSE', 'Provides brokerage, banking, and wealth-management services.', { displayName: 'Charles Schwab' }),
  simple('blackrock', 'BlackRock, Inc.', 'Financial services', 'United States', 'Over $100B', 'BLK', 'NYSE', 'Provides investment management and financial technology services.'),
  simple('us-bancorp', 'U.S. Bancorp', 'Financial services', 'United States', '$25B-$100B', 'USB', 'NYSE', 'Operates a regional bank holding company offering consumer and commercial banking.', { displayName: 'U.S. Bancorp' }),
  simple('pnc-financial', 'The PNC Financial Services Group, Inc.', 'Financial services', 'United States', '$25B-$100B', 'PNC', 'NYSE', 'Provides regional banking, asset management, and corporate banking services.', { displayName: 'PNC Financial Services' }),
  simple('truist', 'Truist Financial Corporation', 'Financial services', 'United States', '$25B-$100B', 'TFC', 'NYSE', 'Provides regional consumer and commercial banking services.', { displayName: 'Truist Financial' }),
  simple('capital-one', 'Capital One Financial Corporation', 'Financial services', 'United States', '$25B-$100B', 'COF', 'NYSE', 'Provides credit cards, consumer banking, and commercial banking services.', { displayName: 'Capital One' }),
  simple('discover-financial', 'Discover Financial Services', 'Financial services', 'United States', '$25B-$100B', 'DFS', 'NYSE', 'Issues credit cards and operates a payments network and direct bank.', { displayName: 'Discover Financial Services' }),
  simple('metlife', 'MetLife, Inc.', 'Financial services', 'United States', '$25B-$100B', 'MET', 'NYSE', 'Provides life insurance, annuities, and employee benefits.', { displayName: 'MetLife' }),
  simple('prudential-financial', 'Prudential Financial, Inc.', 'Financial services', 'United States', '$25B-$100B', 'PRU', 'NYSE', 'Provides life insurance, annuities, and investment management services.', { displayName: 'Prudential Financial' }),
  simple('aon', 'Aon plc', 'Financial services', 'Ireland', '$25B-$100B', 'AON', 'NYSE', 'Provides insurance brokerage, risk management, and consulting services.'),
  simple('marsh-mclennan', 'Marsh & McLennan Companies, Inc.', 'Financial services', 'United States', '$25B-$100B', 'MMC', 'NYSE', 'Provides insurance brokerage, risk management, and consulting services.', { displayName: 'Marsh & McLennan' }),
  simple('progressive', 'The Progressive Corporation', 'Financial services', 'United States', 'Over $100B', 'PGR', 'NYSE', 'Underwrites auto, home, and commercial insurance.', { displayName: 'Progressive' }),
  simple('chubb', 'Chubb Limited', 'Financial services', 'Switzerland', '$25B-$100B', 'CB', 'NYSE', 'Underwrites property, casualty, and specialty insurance.'),
  simple('royal-bank-of-canada', 'Royal Bank of Canada', 'Financial services', 'Canada', 'Over $100B', 'RY', 'NYSE', 'Operates a diversified Canadian bank offering personal, commercial, and investment banking.'),
  simple('td-bank', 'The Toronto-Dominion Bank', 'Financial services', 'Canada', '$25B-$100B', 'TD', 'NYSE', 'Operates a diversified Canadian and U.S. bank.', { displayName: 'TD Bank Group' }),
  simple('ice', 'Intercontinental Exchange, Inc.', 'Financial services', 'United States', '$25B-$100B', 'ICE', 'NYSE', 'Operates financial exchanges, clearing houses, and mortgage-technology platforms.', { displayName: 'Intercontinental Exchange' }),
  simple('cme-group', 'CME Group Inc.', 'Financial services', 'United States', '$25B-$100B', 'CME', 'NASDAQ', 'Operates derivatives and futures exchanges.', { displayName: 'CME Group' }),
  simple('moodys', "Moody's Corporation", 'Financial services', 'United States', '$25B-$100B', 'MCO', 'NYSE', 'Provides credit ratings, research, and risk-analysis tools.', { displayName: "Moody's" }),
  simple('sp-global', 'S&P Global Inc.', 'Financial services', 'United States', 'Over $100B', 'SPGI', 'NYSE', 'Provides credit ratings, market-data, and index services.', { displayName: 'S&P Global' }),
  simple('ameriprise', 'Ameriprise Financial, Inc.', 'Financial services', 'United States', '$25B-$100B', 'AMP', 'NYSE', 'Provides financial planning, asset management, and insurance services.', { displayName: 'Ameriprise Financial' }),
  simple('synchrony', 'Synchrony Financial', 'Financial services', 'United States', '$5B-$25B', 'SYF', 'NYSE', 'Provides consumer financing and private-label credit card programs.', { seedNoCampaign: true }),
  simple('fifth-third', 'Fifth Third Bancorp', 'Financial services', 'United States', '$5B-$25B', 'FITB', 'NASDAQ', 'Operates a regional bank holding company in the Midwest and Southeast.', { seedNoCampaign: true }),
  simple('mt-bank', 'M&T Bank Corporation', 'Financial services', 'United States', '$5B-$25B', 'MTB', 'NYSE', 'Operates a regional bank holding company in the Northeast and Mid-Atlantic.', { displayName: 'M&T Bank' }),
]

/* ----------------------------------- Energy ----------------------------------- */

const energy: DirectoryCompany[] = [
  simple('exxonmobil', 'Exxon Mobil Corporation', 'Energy', 'United States', 'Over $100B', 'XOM', 'NYSE', 'Explores for, produces, and refines oil and natural gas.', { displayName: 'ExxonMobil' }),
  simple('chevron', 'Chevron Corporation', 'Energy', 'United States', 'Over $100B', 'CVX', 'NYSE', 'Explores for, produces, and refines oil and natural gas.'),
  simple('conocophillips', 'ConocoPhillips', 'Energy', 'United States', 'Over $100B', 'COP', 'NYSE', 'Explores for and produces crude oil and natural gas.'),
  simple('occidental', 'Occidental Petroleum Corporation', 'Energy', 'United States', '$25B-$100B', 'OXY', 'NYSE', 'Explores for and produces oil and natural gas, and operates chemical manufacturing.', { displayName: 'Occidental Petroleum' }),
  simple('slb', 'SLB', 'Energy', 'United States', '$25B-$100B', 'SLB', 'NYSE', 'Provides technology and services for oil and gas exploration and production.'),
  simple('marathon-petroleum', 'Marathon Petroleum Corporation', 'Energy', 'United States', '$25B-$100B', 'MPC', 'NYSE', 'Refines, transports, and markets petroleum products.', { displayName: 'Marathon Petroleum' }),
  simple('valero', 'Valero Energy Corporation', 'Energy', 'United States', '$25B-$100B', 'VLO', 'NYSE', 'Refines and markets petroleum and renewable fuel products.', { displayName: 'Valero Energy' }),
  simple('phillips-66', 'Phillips 66', 'Energy', 'United States', '$25B-$100B', 'PSX', 'NYSE', 'Refines, transports, and markets petroleum and chemical products.'),
  simple('eog-resources', 'EOG Resources, Inc.', 'Energy', 'United States', '$25B-$100B', 'EOG', 'NYSE', 'Explores for and produces crude oil and natural gas.', { displayName: 'EOG Resources' }),
  simple('williams-companies', 'The Williams Companies, Inc.', 'Energy', 'United States', '$25B-$100B', 'WMB', 'NYSE', 'Gathers, processes, and transports natural gas through pipeline infrastructure.', { displayName: 'Williams Companies' }),
  simple('kinder-morgan', 'Kinder Morgan, Inc.', 'Energy', 'United States', '$25B-$100B', 'KMI', 'NYSE', 'Operates energy infrastructure including pipelines and terminals.', { displayName: 'Kinder Morgan' }),
  simple('baker-hughes', 'Baker Hughes Company', 'Energy', 'United States', '$25B-$100B', 'BKR', 'NASDAQ', 'Provides oilfield services, equipment, and energy technology.', { displayName: 'Baker Hughes' }),
  simple('halliburton', 'Halliburton Company', 'Energy', 'United States', '$5B-$25B', 'HAL', 'NYSE', 'Provides products and services for oil and gas exploration and production.'),
  simple('devon-energy', 'Devon Energy Corporation', 'Energy', 'United States', '$5B-$25B', 'DVN', 'NYSE', 'Explores for and produces crude oil and natural gas.', { displayName: 'Devon Energy' }),
  simple('enbridge', 'Enbridge Inc.', 'Energy', 'Canada', '$25B-$100B', 'ENB', 'NYSE', 'Operates crude oil and natural gas pipeline and midstream infrastructure.'),
  simple('suncor', 'Suncor Energy Inc.', 'Energy', 'Canada', '$25B-$100B', 'SU', 'NYSE', 'Produces synthetic crude oil from oil sands and operates refining and retail fuel businesses.', { displayName: 'Suncor Energy' }),
  simple('targa-resources', 'Targa Resources Corp.', 'Energy', 'United States', '$25B-$100B', 'TRGP', 'NYSE', 'Gathers, processes, and transports natural gas liquids.', { displayName: 'Targa Resources' }),
  simple('oneok', 'ONEOK, Inc.', 'Energy', 'United States', '$25B-$100B', 'OKE', 'NYSE', 'Gathers, processes, and transports natural gas and natural gas liquids.', { seedNoCampaign: true }),
  simple('coterra', 'Coterra Energy Inc.', 'Energy', 'United States', '$5B-$25B', 'CTRA', 'NYSE', 'Explores for and produces crude oil and natural gas.', { displayName: 'Coterra Energy', seedNoCampaign: true }),
]

/* ---------------------------------- Mining ---------------------------------- */

const mining: DirectoryCompany[] = [
  simple('freeport-mcmoran', 'Freeport-McMoRan Inc.', 'Mining', 'United States', '$25B-$100B', 'FCX', 'NYSE', 'Mines copper, gold, and molybdenum.', { displayName: 'Freeport-McMoRan' }),
  simple('newmont', 'Newmont Corporation', 'Mining', 'United States', '$25B-$100B', 'NEM', 'NYSE', 'Mines gold and copper.'),
  simple('barrick-gold', 'Barrick Mining Corporation', 'Mining', 'Canada', '$25B-$100B', 'GOLD', 'NYSE', 'Mines gold and copper.', { displayName: 'Barrick Gold' }),
  simple('southern-copper', 'Southern Copper Corporation', 'Mining', 'United States', '$25B-$100B', 'SCCO', 'NYSE', 'Mines and processes copper and other base metals.', { displayName: 'Southern Copper' }),
  simple('albemarle', 'Albemarle Corporation', 'Mining', 'United States', '$5B-$25B', 'ALB', 'NYSE', 'Produces lithium and other specialty chemicals for batteries and industrial uses.'),
  simple('nucor', 'Nucor Corporation', 'Mining', 'United States', '$25B-$100B', 'NUE', 'NYSE', 'Manufactures steel and steel products.'),
  simple('steel-dynamics', 'Steel Dynamics, Inc.', 'Mining', 'United States', '$5B-$25B', 'STLD', 'NASDAQ', 'Manufactures steel and metal recycling.', { displayName: 'Steel Dynamics', seedNoCampaign: true }),
  simple('alcoa', 'Alcoa Corporation', 'Mining', 'United States', '$5B-$25B', 'AA', 'NYSE', 'Produces bauxite, alumina, and aluminum products.'),
  simple('vale', 'Vale S.A.', 'Mining', 'Brazil', '$25B-$100B', 'VALE', 'NYSE', 'Mines iron ore, nickel, and other base metals.', { isAdr: true }),
  simple('rio-tinto', 'Rio Tinto Group', 'Mining', 'United Kingdom', 'Over $100B', 'RIO', 'NYSE', 'Mines iron ore, aluminum, copper, and other minerals.', { isAdr: true, displayName: 'Rio Tinto' }),
  simple('wheaton-precious-metals', 'Wheaton Precious Metals Corp.', 'Mining', 'Canada', '$25B-$100B', 'WPM', 'NYSE', 'Holds streaming interests in precious-metals mining operations.', { displayName: 'Wheaton Precious Metals' }),
  simple('agnico-eagle', 'Agnico Eagle Mines Limited', 'Mining', 'Canada', '$25B-$100B', 'AEM', 'NYSE', 'Mines gold, primarily in Canada, Finland, and Mexico.', { displayName: 'Agnico Eagle Mines' }),
  simple('cleveland-cliffs', 'Cleveland-Cliffs Inc.', 'Mining', 'United States', '$1B-$5B', 'CLF', 'NYSE', 'Mines iron ore and manufactures steel.', { seedNoCampaign: true }),
]

/* --------------------------------- Industrials --------------------------------- */

const industrials: DirectoryCompany[] = [
  simple('boeing', 'The Boeing Company', 'Industrials', 'United States', 'Over $100B', 'BA', 'NYSE', 'Designs and manufactures commercial airplanes, defense products, and space systems.', { displayName: 'Boeing' }),
  simple('caterpillar', 'Caterpillar Inc.', 'Industrials', 'United States', 'Over $100B', 'CAT', 'NYSE', 'Manufactures construction, mining, and industrial equipment.'),
  simple('honeywell', 'Honeywell International Inc.', 'Industrials', 'United States', 'Over $100B', 'HON', 'NASDAQ', 'Manufactures aerospace systems, building technologies, and industrial products.'),
  simple('general-electric', 'GE Aerospace', 'Industrials', 'United States', 'Over $100B', 'GE', 'NYSE', 'Designs and manufactures jet engines and aerospace propulsion systems.', { displayName: 'GE Aerospace', aliases: [{ alias: 'General Electric Company', aliasType: 'former_company_name' }] }),
  simple('3m', '3M Company', 'Industrials', 'United States', '$25B-$100B', 'MMM', 'NYSE', 'Manufactures industrial, safety, and consumer products.'),
  simple('union-pacific', 'Union Pacific Corporation', 'Industrials', 'United States', 'Over $100B', 'UNP', 'NYSE', 'Operates a freight railroad network across the western United States.', { displayName: 'Union Pacific' }),
  simple('lockheed-martin', 'Lockheed Martin Corporation', 'Industrials', 'United States', 'Over $100B', 'LMT', 'NYSE', 'Designs and manufactures aerospace and defense systems.', { displayName: 'Lockheed Martin' }),
  simple('rtx', 'RTX Corporation', 'Industrials', 'United States', 'Over $100B', 'RTX', 'NYSE', 'Manufactures aerospace and defense systems and jet engines.', { aliases: [{ alias: 'Raytheon Technologies Corporation', aliasType: 'former_company_name' }] }),
  simple('deere', 'Deere & Company', 'Industrials', 'United States', 'Over $100B', 'DE', 'NYSE', 'Manufactures agricultural, construction, and forestry equipment.', { displayName: 'John Deere' }),
  simple('emerson', 'Emerson Electric Co.', 'Industrials', 'United States', '$25B-$100B', 'EMR', 'NYSE', 'Manufactures automation and industrial process-control equipment.', { displayName: 'Emerson Electric' }),
  simple('illinois-tool-works', 'Illinois Tool Works Inc.', 'Industrials', 'United States', '$25B-$100B', 'ITW', 'NYSE', 'Manufactures diversified industrial equipment and specialty products.', { displayName: 'Illinois Tool Works' }),
  simple('parker-hannifin', 'Parker-Hannifin Corporation', 'Industrials', 'United States', '$25B-$100B', 'PH', 'NYSE', 'Manufactures motion and control technologies.', { displayName: 'Parker Hannifin' }),
  simple('eaton', 'Eaton Corporation plc', 'Industrials', 'Ireland', 'Over $100B', 'ETN', 'NYSE', 'Manufactures electrical, hydraulic, and mechanical power-management products.', { displayName: 'Eaton' }),
  simple('cummins', 'Cummins Inc.', 'Industrials', 'United States', '$25B-$100B', 'CMI', 'NYSE', 'Designs and manufactures engines and power-generation equipment.'),
  simple('northrop-grumman', 'Northrop Grumman Corporation', 'Industrials', 'United States', '$25B-$100B', 'NOC', 'NYSE', 'Designs and manufactures aerospace and defense systems.', { displayName: 'Northrop Grumman' }),
  simple('general-dynamics', 'General Dynamics Corporation', 'Industrials', 'United States', '$25B-$100B', 'GD', 'NYSE', 'Manufactures defense systems, business jets, and marine vessels.', { displayName: 'General Dynamics' }),
  simple('fedex', 'FedEx Corporation', 'Industrials', 'United States', '$25B-$100B', 'FDX', 'NYSE', 'Provides package delivery, freight, and logistics services.', { displayName: 'FedEx' }),
  simple('ups', 'United Parcel Service, Inc.', 'Industrials', 'United States', '$25B-$100B', 'UPS', 'NYSE', 'Provides package delivery, freight, and supply-chain services.', { displayName: 'UPS' }),
  simple('canadian-national', 'Canadian National Railway Company', 'Industrials', 'Canada', '$25B-$100B', 'CNI', 'NYSE', 'Operates a freight railroad network across Canada and the central United States.', { displayName: 'Canadian National Railway' }),
  simple('waste-management', 'WM (Waste Management, Inc.)', 'Industrials', 'United States', '$25B-$100B', 'WM', 'NYSE', 'Provides waste collection, recycling, and disposal services.', { displayName: 'Waste Management' }),
  simple('delta-air-lines', 'Delta Air Lines, Inc.', 'Industrials', 'United States', '$25B-$100B', 'DAL', 'NYSE', 'Operates a global passenger and cargo airline.', { displayName: 'Delta Air Lines' }),
  simple('southwest-airlines', 'Southwest Airlines Co.', 'Industrials', 'United States', '$5B-$25B', 'LUV', 'NYSE', 'Operates a low-cost passenger airline in the United States.', { displayName: 'Southwest Airlines' }),
  simple('ryder', 'Ryder System, Inc.', 'Industrials', 'United States', '$5B-$25B', 'R', 'NYSE', 'Provides fleet management, supply chain, and dedicated transportation services.', { displayName: 'Ryder System', seedNoCampaign: true }),
  simple('old-dominion', 'Old Dominion Freight Line, Inc.', 'Industrials', 'United States', '$25B-$100B', 'ODFL', 'NASDAQ', 'Provides less-than-truckload freight transportation.', { displayName: 'Old Dominion Freight Line', seedNoCampaign: true }),
  simple('rockwell-automation', 'Rockwell Automation, Inc.', 'Industrials', 'United States', '$25B-$100B', 'ROK', 'NYSE', 'Manufactures industrial automation and information technology.', { displayName: 'Rockwell Automation' }),
]

/* ---------------------------------- Consumer ---------------------------------- */

const consumer: DirectoryCompany[] = [
  simple('walmart', 'Walmart Inc.', 'Consumer products', 'United States', 'Over $100B', 'WMT', 'NYSE', 'Operates discount department stores, supercenters, and e-commerce.'),
  simple('procter-gamble', 'The Procter & Gamble Company', 'Consumer products', 'United States', 'Over $100B', 'PG', 'NYSE', 'Manufactures household and personal-care consumer products.', { displayName: 'Procter & Gamble' }),
  simple('coca-cola', 'The Coca-Cola Company', 'Consumer products', 'United States', 'Over $100B', 'KO', 'NYSE', 'Manufactures and markets nonalcoholic beverages.', { displayName: 'Coca-Cola' }),
  simple('pepsico', 'PepsiCo, Inc.', 'Consumer products', 'United States', 'Over $100B', 'PEP', 'NASDAQ', 'Manufactures beverages and snack foods.', { displayName: 'PepsiCo' }),
  simple('costco', 'Costco Wholesale Corporation', 'Consumer products', 'United States', 'Over $100B', 'COST', 'NASDAQ', 'Operates membership-based warehouse retail clubs.', { displayName: 'Costco' }),
  simple('home-depot', 'The Home Depot, Inc.', 'Consumer products', 'United States', 'Over $100B', 'HD', 'NYSE', 'Operates home-improvement retail stores.', { displayName: 'The Home Depot' }),
  simple('nike', 'NIKE, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'NKE', 'NYSE', 'Designs and markets athletic footwear, apparel, and equipment.', { displayName: 'Nike' }),
  simple('mcdonalds', "McDonald's Corporation", 'Consumer products', 'United States', 'Over $100B', 'MCD', 'NYSE', 'Franchises and operates quick-service restaurants.', { displayName: "McDonald's" }),
  simple('starbucks', 'Starbucks Corporation', 'Consumer products', 'United States', '$25B-$100B', 'SBUX', 'NASDAQ', 'Operates and licenses coffeehouses.'),
  simple('target', 'Target Corporation', 'Consumer products', 'United States', '$25B-$100B', 'TGT', 'NYSE', 'Operates general-merchandise discount retail stores.'),
  simple('lowes', "Lowe's Companies, Inc.", 'Consumer products', 'United States', 'Over $100B', 'LOW', 'NYSE', 'Operates home-improvement retail stores.', { displayName: "Lowe's" }),
  simple('colgate-palmolive', 'Colgate-Palmolive Company', 'Consumer products', 'United States', '$25B-$100B', 'CL', 'NYSE', 'Manufactures oral care, personal care, and household products.', { displayName: 'Colgate-Palmolive' }),
  simple('kimberly-clark', 'Kimberly-Clark Corporation', 'Consumer products', 'United States', '$25B-$100B', 'KMB', 'NYSE', 'Manufactures personal-care and consumer tissue products.', { displayName: 'Kimberly-Clark' }),
  simple('general-mills', 'General Mills, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'GIS', 'NYSE', 'Manufactures packaged food products.', { displayName: 'General Mills' }),
  simple('kraft-heinz', 'The Kraft Heinz Company', 'Consumer products', 'United States', '$25B-$100B', 'KHC', 'NASDAQ', 'Manufactures packaged food and beverage products.', { displayName: 'Kraft Heinz' }),
  simple('mondelez', 'Mondelez International, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'MDLZ', 'NASDAQ', 'Manufactures snack foods including cookies, chocolate, and candy.', { displayName: 'Mondelez International' }),
  simple('hershey', 'The Hershey Company', 'Consumer products', 'United States', '$25B-$100B', 'HSY', 'NYSE', 'Manufactures chocolate and confectionery products.'),
  simple('estee-lauder', 'The Estée Lauder Companies Inc.', 'Consumer products', 'United States', '$5B-$25B', 'EL', 'NYSE', 'Manufactures and markets prestige skincare, makeup, and fragrance products.', { displayName: 'Estée Lauder' }),
  {
    key: 'under-armour',
    legalName: 'Under Armour, Inc.',
    displayName: 'Under Armour',
    sector: 'Consumer products',
    country: 'United States',
    marketCapCategory: '$1B-$5B',
    description: 'Designs and markets athletic apparel, footwear, and accessories.',
    securities: [
      { symbol: 'UAA', exchange: 'NYSE', isPrimary: true, shareClass: 'Class A' },
      { symbol: 'UA', exchange: 'NYSE', isPrimary: false, shareClass: 'Class C' },
    ],
  },
  {
    key: 'ww-international',
    legalName: 'WW International, Inc.',
    displayName: 'WW International',
    sector: 'Consumer products',
    country: 'United States',
    marketCapCategory: '$300M-$1B',
    description: 'Provides weight-management programs and products under the WeightWatchers brand.',
    securities: [{ symbol: 'WW', exchange: 'NASDAQ', isPrimary: true }],
    aliases: [
      { alias: 'WTW', aliasType: 'former_ticker' },
      { alias: 'Weight Watchers International, Inc.', aliasType: 'former_company_name' },
      { alias: 'WeightWatchers', aliasType: 'brand_name' },
    ],
  },
  simple('restaurant-brands', 'Restaurant Brands International Inc.', 'Consumer products', 'Canada', '$25B-$100B', 'QSR', 'NYSE', 'Franchises Burger King, Tim Hortons, Popeyes, and Firehouse Subs.', { displayName: 'Restaurant Brands International' }),
  simple('yum-brands', 'Yum! Brands, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'YUM', 'NYSE', 'Franchises KFC, Taco Bell, and Pizza Hut restaurants.', { displayName: 'Yum! Brands' }),
  simple('chipotle', 'Chipotle Mexican Grill, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'CMG', 'NYSE', 'Operates fast-casual Mexican food restaurants.', { displayName: 'Chipotle Mexican Grill' }),
  simple('ross-stores', 'Ross Stores, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'ROST', 'NASDAQ', 'Operates off-price apparel and home-goods retail stores.', { displayName: 'Ross Stores' }),
  simple('tjx', 'The TJX Companies, Inc.', 'Consumer products', 'United States', 'Over $100B', 'TJX', 'NYSE', 'Operates off-price apparel and home-goods retail stores including T.J. Maxx and Marshalls.', { displayName: 'TJX Companies' }),
  simple('dollar-general', 'Dollar General Corporation', 'Consumer products', 'United States', '$25B-$100B', 'DG', 'NYSE', 'Operates small-format discount retail stores.', { displayName: 'Dollar General' }),
  simple('ebay', 'eBay Inc.', 'Consumer products', 'United States', '$25B-$100B', 'EBAY', 'NASDAQ', 'Operates an online marketplace connecting buyers and sellers.', { displayName: 'eBay' }),
  simple('constellation-brands', 'Constellation Brands, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'STZ', 'NYSE', 'Produces and markets beer, wine, and spirits.', { displayName: 'Constellation Brands' }),
  simple('molson-coors', 'Molson Coors Beverage Company', 'Consumer products', 'United States', '$5B-$25B', 'TAP', 'NYSE', 'Produces and markets beer and other beverages.', { displayName: 'Molson Coors' }),
  simple('church-dwight', 'Church & Dwight Co., Inc.', 'Consumer products', 'United States', '$25B-$100B', 'CHD', 'NYSE', 'Manufactures household and personal-care products.', { displayName: 'Church & Dwight', seedNoCampaign: true }),
  simple('clorox', 'The Clorox Company', 'Consumer products', 'United States', '$5B-$25B', 'CLX', 'NYSE', 'Manufactures cleaning, disinfecting, and household consumer products.', { displayName: 'Clorox' }),
  simple('kroger', 'The Kroger Co.', 'Consumer products', 'United States', '$25B-$100B', 'KR', 'NYSE', 'Operates supermarkets and grocery retail stores.', { displayName: 'Kroger' }),
  simple('albertsons', 'Albertsons Companies, Inc.', 'Consumer products', 'United States', '$5B-$25B', 'ACI', 'NYSE', 'Operates supermarkets and grocery retail stores.', { displayName: 'Albertsons Companies', seedNoCampaign: true }),
  simple('marriott', 'Marriott International, Inc.', 'Consumer products', 'United States', '$25B-$100B', 'MAR', 'NASDAQ', 'Franchises and manages hotel brands worldwide.', { displayName: 'Marriott International' }),
  simple('hilton', 'Hilton Worldwide Holdings Inc.', 'Consumer products', 'United States', '$25B-$100B', 'HLT', 'NYSE', 'Franchises and manages hotel brands worldwide.', { displayName: 'Hilton Worldwide' }),
  simple('expedia', 'Expedia Group, Inc.', 'Consumer products', 'United States', '$5B-$25B', 'EXPE', 'NASDAQ', 'Operates online travel-booking platforms.', { displayName: 'Expedia Group' }),
]

/* --------------------------------- Healthcare --------------------------------- */

const healthcare: DirectoryCompany[] = [
  simple('unitedhealth', 'UnitedHealth Group Incorporated', 'Healthcare', 'United States', 'Over $100B', 'UNH', 'NYSE', 'Provides health insurance and health-services technology.', { displayName: 'UnitedHealth Group' }),
  simple('johnson-johnson', 'Johnson & Johnson', 'Healthcare', 'United States', 'Over $100B', 'JNJ', 'NYSE', 'Manufactures pharmaceuticals and medical devices.', { displayName: 'Johnson & Johnson' }),
  simple('pfizer', 'Pfizer Inc.', 'Healthcare', 'United States', 'Over $100B', 'PFE', 'NYSE', 'Discovers, develops, and manufactures pharmaceuticals and vaccines.'),
  simple('eli-lilly', 'Eli Lilly and Company', 'Healthcare', 'United States', 'Over $100B', 'LLY', 'NYSE', 'Discovers, develops, and manufactures pharmaceuticals.', { displayName: 'Eli Lilly' }),
  simple('abbvie', 'AbbVie Inc.', 'Healthcare', 'United States', 'Over $100B', 'ABBV', 'NYSE', 'Discovers, develops, and manufactures pharmaceuticals.'),
  simple('merck', 'Merck & Co., Inc.', 'Healthcare', 'United States', 'Over $100B', 'MRK', 'NYSE', 'Discovers, develops, and manufactures pharmaceuticals and vaccines.'),
  simple('thermo-fisher', 'Thermo Fisher Scientific Inc.', 'Healthcare', 'United States', 'Over $100B', 'TMO', 'NYSE', 'Manufactures scientific instruments, reagents, and laboratory equipment.', { displayName: 'Thermo Fisher Scientific' }),
  simple('abbott', 'Abbott Laboratories', 'Healthcare', 'United States', 'Over $100B', 'ABT', 'NYSE', 'Manufactures medical devices, diagnostics, and nutrition products.'),
  simple('bristol-myers', 'Bristol-Myers Squibb Company', 'Healthcare', 'United States', '$25B-$100B', 'BMY', 'NYSE', 'Discovers, develops, and manufactures pharmaceuticals.', { displayName: 'Bristol-Myers Squibb' }),
  simple('amgen', 'Amgen Inc.', 'Healthcare', 'United States', 'Over $100B', 'AMGN', 'NASDAQ', 'Discovers, develops, and manufactures biologic medicines.'),
  simple('gilead', 'Gilead Sciences, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'GILD', 'NASDAQ', 'Discovers, develops, and manufactures antiviral and oncology medicines.', { displayName: 'Gilead Sciences' }),
  simple('vertex', 'Vertex Pharmaceuticals Incorporated', 'Healthcare', 'United States', 'Over $100B', 'VRTX', 'NASDAQ', 'Discovers, develops, and manufactures treatments for serious diseases.', { displayName: 'Vertex Pharmaceuticals' }),
  simple('regeneron', 'Regeneron Pharmaceuticals, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'REGN', 'NASDAQ', 'Discovers, develops, and manufactures biologic medicines.', { displayName: 'Regeneron Pharmaceuticals' }),
  simple('moderna', 'Moderna, Inc.', 'Healthcare', 'United States', '$5B-$25B', 'MRNA', 'NASDAQ', 'Develops mRNA-based vaccines and therapeutics.'),
  simple('cvs-health', 'CVS Health Corporation', 'Healthcare', 'United States', '$25B-$100B', 'CVS', 'NYSE', 'Operates pharmacies, health insurance, and healthcare-services businesses.', { displayName: 'CVS Health' }),
  simple('cigna', 'The Cigna Group', 'Healthcare', 'United States', '$25B-$100B', 'CI', 'NYSE', 'Provides health insurance and pharmacy-benefit management services.'),
  simple('elevance-health', 'Elevance Health, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'ELV', 'NYSE', 'Provides health insurance and health-services technology.', { displayName: 'Elevance Health', aliases: [{ alias: 'Anthem, Inc.', aliasType: 'former_company_name' }] }),
  simple('hca-healthcare', 'HCA Healthcare, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'HCA', 'NYSE', 'Operates general acute-care hospitals and outpatient facilities.', { displayName: 'HCA Healthcare' }),
  simple('novo-nordisk', 'Novo Nordisk A/S', 'Healthcare', 'Denmark', 'Over $100B', 'NVO', 'NYSE', 'Discovers, develops, and manufactures diabetes and obesity treatments.', { isAdr: true, displayName: 'Novo Nordisk' }),
  simple('biogen', 'Biogen Inc.', 'Healthcare', 'United States', '$5B-$25B', 'BIIB', 'NASDAQ', 'Discovers, develops, and manufactures treatments for neurological diseases.'),
  simple('zoetis', 'Zoetis Inc.', 'Healthcare', 'United States', '$25B-$100B', 'ZTS', 'NYSE', 'Discovers, develops, and manufactures medicines and vaccines for animals.', { seedNoCampaign: true }),
  simple('idexx', 'IDEXX Laboratories, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'IDXX', 'NASDAQ', 'Manufactures diagnostic products and services for veterinary and food safety.', { displayName: 'IDEXX Laboratories', seedNoCampaign: true }),
  simple('stryker', 'Stryker Corporation', 'Healthcare', 'United States', 'Over $100B', 'SYK', 'NYSE', 'Manufactures orthopaedic implants and medical technology.'),
  simple('boston-scientific', 'Boston Scientific Corporation', 'Healthcare', 'United States', 'Over $100B', 'BSX', 'NYSE', 'Manufactures interventional medical devices.', { displayName: 'Boston Scientific' }),
  simple('medtronic', 'Medtronic plc', 'Healthcare', 'Ireland', 'Over $100B', 'MDT', 'NYSE', 'Manufactures medical devices for cardiac, neurological, and diabetes care.'),
  simple('becton-dickinson', 'Becton, Dickinson and Company', 'Healthcare', 'United States', '$25B-$100B', 'BDX', 'NYSE', 'Manufactures medical devices, laboratory equipment, and diagnostic products.', { displayName: 'BD' }),
  simple('illumina', 'Illumina, Inc.', 'Healthcare', 'United States', '$5B-$25B', 'ILMN', 'NASDAQ', 'Manufactures genomic sequencing and array-based technologies.'),
  simple('dexcom', 'DexCom, Inc.', 'Healthcare', 'United States', '$25B-$100B', 'DXCM', 'NASDAQ', 'Manufactures continuous glucose-monitoring systems.', { displayName: 'Dexcom', seedNoCampaign: true }),
]

/* ------------------------------ Telecommunications ------------------------------ */

const telecommunications: DirectoryCompany[] = [
  simple('att', 'AT&T Inc.', 'Telecommunications', 'United States', 'Over $100B', 'T', 'NYSE', 'Provides wireless, broadband, and media communications services.', { displayName: 'AT&T' }),
  simple('verizon', 'Verizon Communications Inc.', 'Telecommunications', 'United States', 'Over $100B', 'VZ', 'NYSE', 'Provides wireless and broadband communications services.', { displayName: 'Verizon' }),
  simple('t-mobile', 'T-Mobile US, Inc.', 'Telecommunications', 'United States', 'Over $100B', 'TMUS', 'NASDAQ', 'Provides wireless communications services.', { displayName: 'T-Mobile' }),
  {
    key: 'paramount-global',
    legalName: 'Paramount Global',
    displayName: 'Paramount Global',
    sector: 'Telecommunications',
    country: 'United States',
    marketCapCategory: '$5B-$25B',
    description: 'Operates media and entertainment networks, film studios, and streaming services.',
    securities: [{ symbol: 'PARA', exchange: 'NASDAQ', isPrimary: true }],
    aliases: [
      { alias: 'VIAC', aliasType: 'former_ticker' },
      { alias: 'ViacomCBS Inc.', aliasType: 'former_company_name' },
    ],
  },
  simple('comcast', 'Comcast Corporation', 'Telecommunications', 'United States', 'Over $100B', 'CMCSA', 'NASDAQ', 'Provides cable, broadband, and media and entertainment services.'),
  simple('charter', 'Charter Communications, Inc.', 'Telecommunications', 'United States', '$25B-$100B', 'CHTR', 'NASDAQ', 'Provides cable television, broadband, and voice services.', { displayName: 'Charter Communications' }),
  simple('bce', 'BCE Inc.', 'Telecommunications', 'Canada', '$25B-$100B', 'BCE', 'NYSE', 'Provides wireless, wireline, and media communications services in Canada.'),
  simple('warner-bros-discovery', 'Warner Bros. Discovery, Inc.', 'Telecommunications', 'United States', '$25B-$100B', 'WBD', 'NASDAQ', 'Operates media networks, film studios, and streaming services.', { displayName: 'Warner Bros. Discovery' }),
  simple('vodafone', 'Vodafone Group Plc', 'Telecommunications', 'United Kingdom', '$25B-$100B', 'VOD', 'NASDAQ', 'Provides mobile and fixed communications services across Europe and Africa.', { isAdr: true, displayName: 'Vodafone' }),
  simple('america-movil', 'América Móvil, S.A.B. de C.V.', 'Telecommunications', 'Mexico', '$25B-$100B', 'AMX', 'NYSE', 'Provides wireless and fixed-line telecommunications services across Latin America.', { isAdr: true, displayName: 'América Móvil' }),
  simple('telus', 'TELUS Corporation', 'Telecommunications', 'Canada', '$25B-$100B', 'TU', 'NYSE', 'Provides wireless, internet, and television services in Canada.', { displayName: 'Telus' }),
  {
    key: 'liberty-broadband',
    legalName: 'Liberty Broadband Corporation',
    displayName: 'Liberty Broadband',
    sector: 'Telecommunications',
    country: 'United States',
    marketCapCategory: '$5B-$25B',
    description: 'Holds interests in broadband and communications businesses, including Charter Communications.',
    securities: [
      { symbol: 'LBRDA', exchange: 'NASDAQ', isPrimary: true, shareClass: 'Series A' },
      { symbol: 'LBRDK', exchange: 'NASDAQ', isPrimary: false, shareClass: 'Series K' },
    ],
    seedNoCampaign: true,
  },
]

/* ---------------------------------- Real estate ---------------------------------- */

const realEstate: DirectoryCompany[] = [
  simple('american-tower', 'American Tower Corporation', 'Real estate', 'United States', '$25B-$100B', 'AMT', 'NYSE', 'Owns and operates wireless and broadcast communications infrastructure.', { displayName: 'American Tower' }),
  simple('prologis', 'Prologis, Inc.', 'Real estate', 'United States', '$25B-$100B', 'PLD', 'NYSE', 'Owns and develops logistics and industrial real estate.'),
  simple('equinix', 'Equinix, Inc.', 'Real estate', 'United States', '$25B-$100B', 'EQIX', 'NASDAQ', 'Owns and operates data centers and interconnection facilities.'),
  simple('simon-property', 'Simon Property Group, Inc.', 'Real estate', 'United States', '$25B-$100B', 'SPG', 'NYSE', 'Owns and operates shopping malls and premium outlet centers.', { displayName: 'Simon Property Group' }),
  simple('public-storage', 'Public Storage', 'Real estate', 'United States', '$25B-$100B', 'PSA', 'NYSE', 'Owns and operates self-storage facilities.'),
  simple('realty-income', 'Realty Income Corporation', 'Real estate', 'United States', '$25B-$100B', 'O', 'NYSE', 'Owns and leases free-standing commercial real estate.', { displayName: 'Realty Income' }),
  simple('digital-realty', 'Digital Realty Trust, Inc.', 'Real estate', 'United States', '$25B-$100B', 'DLR', 'NYSE', 'Owns and operates data centers globally.', { displayName: 'Digital Realty' }),
  simple('welltower', 'Welltower Inc.', 'Real estate', 'United States', '$25B-$100B', 'WELL', 'NYSE', 'Owns and operates senior housing and healthcare real estate.'),
  simple('avalonbay', 'AvalonBay Communities, Inc.', 'Real estate', 'United States', '$25B-$100B', 'AVB', 'NYSE', 'Owns and develops multifamily residential apartment communities.', { displayName: 'AvalonBay Communities' }),
  simple('brookfield', 'Brookfield Corporation', 'Real estate', 'Canada', 'Over $100B', 'BN', 'NYSE', 'Manages real estate, renewable power, infrastructure, and private-equity assets.', { displayName: 'Brookfield' }),
  simple('iron-mountain', 'Iron Mountain Incorporated', 'Real estate', 'United States', '$25B-$100B', 'IRM', 'NYSE', 'Provides records management, data-center, and storage real estate services.', { displayName: 'Iron Mountain', seedNoCampaign: true }),
  simple('extra-space', 'Extra Space Storage Inc.', 'Real estate', 'United States', '$25B-$100B', 'EXR', 'NYSE', 'Owns and operates self-storage facilities.', { displayName: 'Extra Space Storage' }),
  simple('ventas', 'Ventas, Inc.', 'Real estate', 'United States', '$25B-$100B', 'VTR', 'NYSE', 'Owns and operates senior housing and healthcare real estate.', { seedNoCampaign: true }),
]

export const companyDirectory: DirectoryCompany[] = [
  ...technology,
  ...financials,
  ...energy,
  ...mining,
  ...industrials,
  ...consumer,
  ...healthcare,
  ...telecommunications,
  ...realEstate,
]

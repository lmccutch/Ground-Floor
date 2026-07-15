// GENERATED FILE — do not hand-edit.
// Produced by scripts/import-retail-popularity.ts from the curated retail CSV.
// Re-run `npm run retail:import` to regenerate.
//
// Public-safe fields ONLY. The panel provenance columns (owner count, tracked
// value, average position, market-cap) are deliberately NOT included here — they
// live only in the SQL seed / database and are never shipped to the client. See
// docs/popular-with-retail.md.

export type RetailPopularityRecord = {
  /** Display order for the beta. */
  featureRank: number
  /** Canonical company directory key. */
  companyKey: string
  /** The company's primary ticker — what its canonical page/card link use. */
  primaryTicker: string
  /** The specific ticker the source ranked (e.g. GOOGL, BRK.B). Provenance only. */
  matchedTicker: string
  isFeatured: boolean
}

export type RetailPopularityMeta = {
  sourceName: string
  sourceUrl: string | null
  sourceAsOf: string | null
}

export const retailPopularityMeta: RetailPopularityMeta = {
  sourceName: "Fintel Retail Ownership - Most Widely Held Stocks",
  sourceUrl: "https://fintel.io/sro",
  sourceAsOf: "2026-07-15",
}

export const retailPopularity: RetailPopularityRecord[] = [
  { featureRank: 1, companyKey: "tesla", primaryTicker: "TSLA", matchedTicker: "TSLA", isFeatured: true },
  { featureRank: 2, companyKey: "microsoft", primaryTicker: "MSFT", matchedTicker: "MSFT", isFeatured: true },
  { featureRank: 3, companyKey: "nektar", primaryTicker: "NKTR", matchedTicker: "NKTR", isFeatured: true },
  { featureRank: 4, companyKey: "transocean", primaryTicker: "RIG", matchedTicker: "RIG", isFeatured: true },
  { featureRank: 5, companyKey: "palantir", primaryTicker: "PLTR", matchedTicker: "PLTR", isFeatured: true },
  { featureRank: 6, companyKey: "nebius", primaryTicker: "NBIS", matchedTicker: "NBIS", isFeatured: true },
  { featureRank: 7, companyKey: "amazon", primaryTicker: "AMZN", matchedTicker: "AMZN", isFeatured: true },
  { featureRank: 8, companyKey: "apple", primaryTicker: "AAPL", matchedTicker: "AAPL", isFeatured: true },
  { featureRank: 9, companyKey: "nvidia", primaryTicker: "NVDA", matchedTicker: "NVDA", isFeatured: true },
  { featureRank: 10, companyKey: "iren", primaryTicker: "IREN", matchedTicker: "IREN", isFeatured: true },
  { featureRank: 11, companyKey: "servicenow", primaryTicker: "NOW", matchedTicker: "NOW", isFeatured: true },
  { featureRank: 12, companyKey: "oracle", primaryTicker: "ORCL", matchedTicker: "ORCL", isFeatured: true },
  { featureRank: 13, companyKey: "alphabet", primaryTicker: "GOOGL", matchedTicker: "GOOGL", isFeatured: true },
  { featureRank: 14, companyKey: "micron", primaryTicker: "MU", matchedTicker: "MU", isFeatured: true },
  { featureRank: 15, companyKey: "salesforce", primaryTicker: "CRM", matchedTicker: "CRM", isFeatured: true },
  { featureRank: 16, companyKey: "sofi", primaryTicker: "SOFI", matchedTicker: "SOFI", isFeatured: true },
  { featureRank: 17, companyKey: "alibaba", primaryTicker: "BABA", matchedTicker: "BABA", isFeatured: true },
  { featureRank: 18, companyKey: "tmc-metals", primaryTicker: "TMC", matchedTicker: "TMC", isFeatured: true },
  { featureRank: 19, companyKey: "coinbase", primaryTicker: "COIN", matchedTicker: "COIN", isFeatured: true },
  { featureRank: 20, companyKey: "applied-digital", primaryTicker: "APLD", matchedTicker: "APLD", isFeatured: true },
  { featureRank: 21, companyKey: "ge-vernova", primaryTicker: "GEV", matchedTicker: "GEV", isFeatured: true },
  { featureRank: 22, companyKey: "viking-therapeutics", primaryTicker: "VKTX", matchedTicker: "VKTX", isFeatured: true },
  { featureRank: 23, companyKey: "strategy", primaryTicker: "MSTR", matchedTicker: "MSTR", isFeatured: true },
  { featureRank: 24, companyKey: "applied-optoelectronics", primaryTicker: "AAOI", matchedTicker: "AAOI", isFeatured: true },
  { featureRank: 25, companyKey: "meta-platforms", primaryTicker: "META", matchedTicker: "META", isFeatured: true },
  { featureRank: 26, companyKey: "rocket-lab", primaryTicker: "RKLB", matchedTicker: "RKLB", isFeatured: true },
  { featureRank: 27, companyKey: "netflix", primaryTicker: "NFLX", matchedTicker: "NFLX", isFeatured: true },
  { featureRank: 28, companyKey: "sea-limited", primaryTicker: "SE", matchedTicker: "SE", isFeatured: true },
  { featureRank: 29, companyKey: "fiserv", primaryTicker: "FISV", matchedTicker: "FISV", isFeatured: true },
  { featureRank: 30, companyKey: "arm-holdings", primaryTicker: "ARM", matchedTicker: "ARM", isFeatured: true },
  { featureRank: 31, companyKey: "robinhood", primaryTicker: "HOOD", matchedTicker: "HOOD", isFeatured: true },
  { featureRank: 32, companyKey: "credo-technology", primaryTicker: "CRDO", matchedTicker: "CRDO", isFeatured: true },
  { featureRank: 33, companyKey: "applovin", primaryTicker: "APP", matchedTicker: "APP", isFeatured: true },
  { featureRank: 34, companyKey: "taiwan-semiconductor", primaryTicker: "TSM", matchedTicker: "TSM", isFeatured: true },
  { featureRank: 35, companyKey: "ast-spacemobile", primaryTicker: "ASTS", matchedTicker: "ASTS", isFeatured: true },
  { featureRank: 36, companyKey: "amd", primaryTicker: "AMD", matchedTicker: "AMD", isFeatured: true },
  { featureRank: 37, companyKey: "ibm", primaryTicker: "IBM", matchedTicker: "IBM", isFeatured: true },
  { featureRank: 38, companyKey: "coreweave", primaryTicker: "CRWV", matchedTicker: "CRWV", isFeatured: true },
  { featureRank: 39, companyKey: "intel", primaryTicker: "INTC", matchedTicker: "INTC", isFeatured: true },
  { featureRank: 41, companyKey: "broadcom", primaryTicker: "AVGO", matchedTicker: "AVGO", isFeatured: true },
  { featureRank: 42, companyKey: "cipher-mining", primaryTicker: "CIFR", matchedTicker: "CIFR", isFeatured: true },
  { featureRank: 43, companyKey: "sellas", primaryTicker: "SLS", matchedTicker: "SLS", isFeatured: true },
  { featureRank: 44, companyKey: "us-antimony", primaryTicker: "UAMY", matchedTicker: "UAMY", isFeatured: true },
  { featureRank: 45, companyKey: "archer-aviation", primaryTicker: "ACHR", matchedTicker: "ACHR", isFeatured: true },
  { featureRank: 46, companyKey: "corning", primaryTicker: "GLW", matchedTicker: "GLW", isFeatured: true },
  { featureRank: 47, companyKey: "qxo", primaryTicker: "QXO", matchedTicker: "QXO", isFeatured: true },
  { featureRank: 48, companyKey: "astera-labs", primaryTicker: "ALAB", matchedTicker: "ALAB", isFeatured: true },
  { featureRank: 49, companyKey: "paypal", primaryTicker: "PYPL", matchedTicker: "PYPL", isFeatured: true },
  { featureRank: 50, companyKey: "vertiv", primaryTicker: "VRT", matchedTicker: "VRT", isFeatured: true },
  { featureRank: 51, companyKey: "terawulf", primaryTicker: "WULF", matchedTicker: "WULF", isFeatured: true },
  { featureRank: 52, companyKey: "eli-lilly", primaryTicker: "LLY", matchedTicker: "LLY", isFeatured: true },
  { featureRank: 53, companyKey: "oklo", primaryTicker: "OKLO", matchedTicker: "OKLO", isFeatured: true },
  { featureRank: 54, companyKey: "verizon", primaryTicker: "VZ", matchedTicker: "VZ", isFeatured: true },
  { featureRank: 55, companyKey: "berkshire-hathaway", primaryTicker: "BRK.A", matchedTicker: "BRK.B", isFeatured: true },
  { featureRank: 56, companyKey: "webull", primaryTicker: "BULL", matchedTicker: "BULL", isFeatured: true },
  { featureRank: 57, companyKey: "crowdstrike", primaryTicker: "CRWD", matchedTicker: "CRWD", isFeatured: true },
  { featureRank: 58, companyKey: "rigetti", primaryTicker: "RGTI", matchedTicker: "RGTI", isFeatured: true },
  { featureRank: 59, companyKey: "trade-desk", primaryTicker: "TTD", matchedTicker: "TTD", isFeatured: true },
  { featureRank: 60, companyKey: "att", primaryTicker: "T", matchedTicker: "T", isFeatured: true },
  { featureRank: 61, companyKey: "gamestop", primaryTicker: "GME", matchedTicker: "GME", isFeatured: true },
  { featureRank: 62, companyKey: "amc-entertainment", primaryTicker: "AMC", matchedTicker: "AMC", isFeatured: true },
  { featureRank: 63, companyKey: "galaxy-digital", primaryTicker: "GLXY", matchedTicker: "GLXY", isFeatured: true },
  { featureRank: 64, companyKey: "enovix", primaryTicker: "ENVX", matchedTicker: "ENVX", isFeatured: true },
  { featureRank: 65, companyKey: "mercadolibre", primaryTicker: "MELI", matchedTicker: "MELI", isFeatured: true },
  { featureRank: 66, companyKey: "adobe", primaryTicker: "ADBE", matchedTicker: "ADBE", isFeatured: true },
  { featureRank: 67, companyKey: "kratos", primaryTicker: "KTOS", matchedTicker: "KTOS", isFeatured: true },
  { featureRank: 68, companyKey: "ondas", primaryTicker: "ONDS", matchedTicker: "ONDS", isFeatured: true },
  { featureRank: 69, companyKey: "rezolve", primaryTicker: "RZLV", matchedTicker: "RZLV", isFeatured: true },
  { featureRank: 70, companyKey: "hecla", primaryTicker: "HL", matchedTicker: "HL", isFeatured: true },
  { featureRank: 71, companyKey: "joby", primaryTicker: "JOBY", matchedTicker: "JOBY", isFeatured: true },
  { featureRank: 72, companyKey: "soundhound", primaryTicker: "SOUN", matchedTicker: "SOUN", isFeatured: true },
  { featureRank: 73, companyKey: "blackberry", primaryTicker: "BB", matchedTicker: "BB", isFeatured: true },
]

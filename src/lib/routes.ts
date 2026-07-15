// Central route helpers so company links are built in exactly one place. Company
// pages are addressed by ticker (/company/:ticker); the app resolves current
// tickers, historical-ticker redirects, and dual-class share symbols server-side
// (see getCompanyByTicker), so passing any known ticker for a company always
// lands on — or redirects to — its canonical page. Prefer these helpers over
// string-concatenating URLs at call sites.

/** Path to a company's canonical page, keyed by ticker. */
export function companyPath(ticker: string): string {
  return `/company/${encodeURIComponent(ticker)}`
}

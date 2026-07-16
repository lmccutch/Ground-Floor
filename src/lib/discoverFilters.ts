// Shared Discover filter model. Single selection per group; an empty string
// means "no filter" (the "All" option). Kept out of the component file so the
// type/constants can be imported by both the control and the page.

export type FilterSelection = {
  sector: string
  exchange: string
  marketCapCategory: string
  campaignState: '' | 'has-campaign' | 'no-campaign'
}

export const EMPTY_SELECTION: FilterSelection = {
  sector: '',
  exchange: '',
  marketCapCategory: '',
  campaignState: '',
}

export function countActiveFilters(selection: FilterSelection): number {
  return [selection.sector, selection.exchange, selection.marketCapCategory, selection.campaignState].filter(Boolean)
    .length
}

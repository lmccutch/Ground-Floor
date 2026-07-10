const ACCENTS = ['#e8c886', '#a9c6de', '#e5a893', '#b3a5de', '#93c6b2', '#9fc0bd', '#d4b48c', '#8fb5d2']

/** Deterministic fallback colour for company monograms without a stored accent. */
export function accentFor(ticker: string, accent?: string) {
  if (accent) return accent
  let sum = 0
  for (const char of ticker) sum += char.charCodeAt(0)
  return ACCENTS[sum % ACCENTS.length]
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    window.prompt('Copy this link:', text)
    return false
  }
}

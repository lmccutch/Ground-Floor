// Share-link and share-copy builders. All copy is deliberately restrained:
// it invites people to join a shareholder campaign and never implies that
// management has agreed (or is guaranteed) to participate.

export type ShareChannel = 'copy' | 'reddit' | 'x' | 'linkedin' | 'email' | 'native'

export type ShareContent = {
  /** Absolute URL of the thing being shared (before UTM tagging). */
  url: string
  /** Short message used by social channels. */
  text: string
  /** Subject line for email shares. */
  subject: string
}

/** Appends UTM attribution so shared links are distinguishable in analytics. */
export function withUtm(url: string, source: string, medium = 'share'): string {
  try {
    const tagged = new URL(url)
    tagged.searchParams.set('utm_source', source)
    tagged.searchParams.set('utm_medium', medium)
    return tagged.toString()
  } catch {
    return url
  }
}

export function companyShareContent(company: { name: string; ticker: string }, url: string): ShareContent {
  return {
    url,
    text: `I want to hear directly from ${company.ticker} management. Join the shareholder campaign for ${company.name} on GroundFloor — support the interview request and vote on the questions management should answer. Participation by management is voluntary.`,
    subject: `Shareholder campaign for ${company.name}`,
  }
}

export function questionShareContent(question: { text: string }, company: { name: string; ticker: string }, url: string): ShareContent {
  const excerpt = question.text.length > 120 ? `${question.text.slice(0, 120)}…` : question.text
  return {
    url,
    text: `A shareholder question for ${company.name} (${company.ticker}) management on GroundFloor: “${excerpt}” Vote if you want it answered.`,
    subject: `A shareholder question for ${company.name} management`,
  }
}

export function shareHref(channel: Exclude<ShareChannel, 'copy' | 'native'>, content: ShareContent): string {
  const url = withUtm(content.url, channel)
  switch (channel) {
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(content.text)}`
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.text)}&url=${encodeURIComponent(url)}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    case 'email':
      return `mailto:?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(`${content.text}\n\n${url}`)}`
  }
}

/** True when the browser exposes the native share sheet (mostly mobile). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function nativeShare(content: ShareContent): Promise<boolean> {
  if (!canNativeShare()) return false
  try {
    await navigator.share({ title: content.subject, text: content.text, url: withUtm(content.url, 'native') })
    return true
  } catch {
    // The user closing the share sheet rejects the promise — not an error worth surfacing.
    return false
  }
}

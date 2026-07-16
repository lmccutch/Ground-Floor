import { useEffect } from 'react'
import { getSiteUrl } from './siteUrl'

const BASE_TITLE = 'GroundFloor'

/**
 * Per-route document metadata for an SPA: title, meta description, and a
 * canonical link derived from VITE_SITE_URL (falling back to the current
 * origin). Open Graph tags stay page-global in index.html — this architecture
 * serves one HTML shell for every route, so per-route OG tags would only be
 * seen by clients that execute JavaScript, which social crawlers generally
 * don't; documented in docs/trust-and-transparency.md.
 */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | ${BASE_TITLE}`

    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.content ?? ''
    if (meta) meta.content = description

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const created = !canonical
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    // Same centralized resolution as auth redirects, so canonical links never
    // carry the literal env-var name or a trailing-slash double up.
    canonical.href = `${getSiteUrl()}${path}`

    return () => {
      document.title = previousTitle
      if (meta) meta.content = previousDescription
      if (created) canonical?.remove()
    }
  }, [title, description, path])
}

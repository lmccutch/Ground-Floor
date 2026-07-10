import { posthogHost, posthogKey } from './supabase'

type PostHogClient = (typeof import('posthog-js'))['default']

let client: PostHogClient | null = null
let loading = false
let pending: Array<(posthog: PostHogClient) => void> = []

export function initAnalytics() {
  if (!posthogKey || client || loading) return
  const key = posthogKey
  loading = true
  // Loaded on demand so the analytics bundle is never shipped when no key is configured.
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, { api_host: posthogHost, capture_pageview: false, persistence: 'localStorage' })
      client = posthog
      pending.forEach(callback => callback(posthog))
      pending = []
    })
    .catch(() => {
      pending = []
      loading = false
    })
}

function enqueue(callback: (posthog: PostHogClient) => void) {
  if (!posthogKey) return
  if (client) callback(client)
  else pending.push(callback)
}

export function track(event: string, properties: Record<string, unknown> = {}) {
  enqueue(posthog => posthog.capture(event, properties))
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  enqueue(posthog => posthog.identify(userId, properties))
}

export function getAttribution() {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const attribution = Object.fromEntries(keys.flatMap(key => (params.get(key) ? [[key, params.get(key)!]] : [])))
  if (Object.keys(attribution).length) localStorage.setItem('grround-floor-attribution', JSON.stringify(attribution))
  try {
    return JSON.parse(localStorage.getItem('grround-floor-attribution') || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

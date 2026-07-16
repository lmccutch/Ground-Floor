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
  // PostHog is scoped to EXPLICIT product events only: page views and aggregate
  // traffic are handled by Vercel Web Analytics, so autocapture, automatic page
  // views, and session recording are all off. This keeps PostHog free of
  // incidental text/DOM/URL capture and avoids duplicating Vercel's page views.
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: false,
        autocapture: false,
        disable_session_recording: true,
        persistence: 'localStorage',
      })
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

/**
 * Links subsequent events to a stable, pseudonymous account identifier (the
 * Supabase user id). Pseudonymous — not anonymous: the id can be correlated back
 * to an account through Supabase, but it is not directly identifying on its own.
 * Deliberately sends NO person properties — never email, name, or any other
 * directly identifying field.
 */
export function identify(userId: string) {
  enqueue(posthog => posthog.identify(userId))
}

/**
 * Clears the current analytics identity (call on logout) so the next visitor on
 * this device is not attributed to the previous account. Safely no-ops when
 * PostHog is not configured, preserving the lazy/no-key behaviour.
 */
export function resetAnalytics() {
  enqueue(posthog => posthog.reset())
}

const ATTRIBUTION_KEY = 'groundfloor-attribution'
const LEGACY_ATTRIBUTION_KEY = 'grround-floor-attribution'

// One-time migration: carry forward attribution stored under the pre-rename key.
function migrateLegacyAttribution() {
  if (localStorage.getItem(ATTRIBUTION_KEY) !== null) return
  const legacy = localStorage.getItem(LEGACY_ATTRIBUTION_KEY)
  if (legacy !== null) localStorage.setItem(ATTRIBUTION_KEY, legacy)
}

export function getAttribution() {
  migrateLegacyAttribution()
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const attribution = Object.fromEntries(keys.flatMap(key => (params.get(key) ? [[key, params.get(key)!]] : [])))
  if (Object.keys(attribution).length) localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
  try {
    return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

import { useEffect, useRef, type ReactNode } from 'react'
import { FileWarning } from 'lucide-react'
import { track } from '../../lib/analytics'
import { usePageMeta } from '../../lib/meta'
import { PageHeading } from '../../components/ui'

/**
 * Shared layout for the trust/legal pages: sets per-route metadata, fires
 * trust_page_viewed (plus an optional page-specific event) once, and renders
 * long-form content in the existing design system's prose styling.
 */
export function TrustPage({
  slug,
  path,
  title,
  metaDescription,
  eyebrow,
  heading,
  intro,
  extraEvent,
  children,
}: {
  slug: string
  path: string
  title: string
  metaDescription: string
  eyebrow: string
  heading: string
  intro?: string
  /** Additional page-specific analytics event (e.g. disclaimer_viewed). */
  extraEvent?: string
  children: ReactNode
}) {
  usePageMeta(title, metaDescription, path)
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('trust_page_viewed', { page: slug })
    if (extraEvent) track(extraEvent, { page: slug })
  }, [slug, extraEvent])

  return (
    <div className="trust-page">
      <PageHeading eyebrow={eyebrow} title={heading} copy={intro} />
      <div className="trust-prose">{children}</div>
    </div>
  )
}

/** Prominent draft notice required on every legal page until counsel reviews it. */
export function DraftNotice() {
  return (
    <p className="draft-notice" role="note">
      <FileWarning size={15} aria-hidden="true" />
      <b>Draft — professional legal review required before commercial launch.</b> This document was prepared without
      legal counsel and is published for transparency while GroundFloor is in pre-launch testing. It is not legal
      advice.
    </p>
  )
}

/** Labels an described process that is planned policy rather than built functionality. */
export function IntendedPolicy({ children }: { children: ReactNode }) {
  return (
    <p className="intended-policy" role="note">
      <b>Intended policy — not yet built:</b> {children}
    </p>
  )
}

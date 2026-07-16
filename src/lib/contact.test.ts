import { describe, expect, it } from 'vitest'
import { CONTACT_EMAIL, CONTACT_EMAIL_IS_PLACEHOLDER, contactMailto, enquirySubject } from './contact'
import { REPORT_REASONS } from './reporting'

describe('contact addressing', () => {
  it('falls back to an unmistakable placeholder, never a guessed real domain', () => {
    // Tests run without VITE_CONTACT_EMAIL, so the fallback applies.
    expect(CONTACT_EMAIL).toBe('contact@openfloor.example')
    expect(CONTACT_EMAIL_IS_PLACEHOLDER).toBe(true)
  })

  it('builds mailto links with a typed subject for every enquiry type', () => {
    for (const type of ['general', 'investor-relations', 'press', 'legal-privacy', 'moderation-appeal', 'security', 'account-deletion', 'data-access'] as const) {
      const href = contactMailto(type)
      expect(href.startsWith(`mailto:${CONTACT_EMAIL}?subject=`)).toBe(true)
      expect(decodeURIComponent(href)).toContain(enquirySubject(type))
    }
  })
})

describe('report reasons', () => {
  it('covers every required category', () => {
    const joined = REPORT_REASONS.join(' | ').toLowerCase()
    for (const required of ['spam', 'abus', 'manipulation', 'duplicate', 'misinformation', 'personal information', 'material non-public', 'other']) {
      expect(joined).toContain(required)
    }
  })

  it('has no duplicates', () => {
    expect(new Set(REPORT_REASONS).size).toBe(REPORT_REASONS.length)
  })
})

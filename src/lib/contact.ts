// Public contact addressing. The address is configurable via VITE_CONTACT_EMAIL;
// the fallback is an obvious placeholder (RFC 2606 reserved domain) so an
// unconfigured deployment shows something visibly non-final rather than a
// guessed real address. Set the real address before launch — see
// docs/production-deployment.md.

export const CONTACT_EMAIL = ((import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'contact@openfloor.example').trim()

export const CONTACT_EMAIL_IS_PLACEHOLDER = CONTACT_EMAIL.endsWith('@openfloor.example')

export type EnquiryType = 'general' | 'investor-relations' | 'press' | 'legal-privacy' | 'moderation-appeal' | 'security' | 'account-deletion' | 'data-access'

const SUBJECTS: Record<EnquiryType, string> = {
  general: 'General enquiry',
  'investor-relations': 'Investor Relations enquiry',
  press: 'Press enquiry',
  'legal-privacy': 'Legal / privacy enquiry',
  'moderation-appeal': 'Moderation appeal',
  security: 'Security report',
  'account-deletion': 'Account deletion request',
  'data-access': 'Data access request',
}

export function enquirySubject(type: EnquiryType): string {
  return SUBJECTS[type]
}

export function contactMailto(type: EnquiryType): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SUBJECTS[type]} — Open Floor`)}`
}

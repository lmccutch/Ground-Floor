// Public contact addressing. The address is configurable via VITE_CONTACT_EMAIL;
// if unset it falls back to the real production address (contact@open-floor.ca) so a
// deployment never renders a placeholder domain. Override per environment with
// VITE_CONTACT_EMAIL — see docs/production-deployment.md.

export const CONTACT_EMAIL = ((import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'contact@open-floor.ca').trim()

// Guards against a deployment being explicitly misconfigured with the reserved
// placeholder domain; the default fallback above is the real production address.
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

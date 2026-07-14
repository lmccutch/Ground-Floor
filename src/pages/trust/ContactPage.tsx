import { Mail } from 'lucide-react'
import { track } from '../../lib/analytics'
import { CONTACT_EMAIL, CONTACT_EMAIL_IS_PLACEHOLDER, contactMailto, enquirySubject, type EnquiryType } from '../../lib/contact'
import { TrustPage } from './TrustPage'

const enquiries: { type: EnquiryType; copy: string }[] = [
  { type: 'general', copy: 'Anything that doesn’t fit the categories below.' },
  { type: 'investor-relations', copy: 'For company Investor Relations teams responding to or asking about an outreach request.' },
  { type: 'press', copy: 'Media and interview requests about GroundFloor itself.' },
  { type: 'legal-privacy', copy: 'Legal notices, privacy questions, and data-protection requests.' },
  { type: 'moderation-appeal', copy: 'Appeal a moderation decision — include a link to the content.' },
  { type: 'security', copy: 'Report a vulnerability or suspected security issue. Please include reproduction steps.' },
]

export function ContactPage() {
  return (
    <TrustPage
      slug="contact"
      path="/contact"
      title="Contact"
      metaDescription="How to reach GroundFloor: general, Investor Relations, press, legal and privacy, moderation appeals, and security reports."
      eyebrow="Contact"
      heading="Talk to a person."
      intro="There is no contact form yet — these are direct email addresses with pre-filled subjects so the right thing happens with your message. A person reads everything."
    >
      <div className="contact-list">
        {enquiries.map(({ type, copy }) => (
          <a
            key={type}
            className="contact-row"
            href={contactMailto(type)}
            onClick={() => track('contact_link_clicked', { type, source: 'contact-page' })}
          >
            <Mail size={15} aria-hidden="true" />
            <span>
              <b>{enquirySubject(type)}</b>
              <small>{copy}</small>
            </span>
          </a>
        ))}
      </div>
      <p className="section-note">
        All enquiries go to <b>{CONTACT_EMAIL}</b>
        {CONTACT_EMAIL_IS_PLACEHOLDER && ' (placeholder address — the real inbox is configured before launch)'}. For
        account deletion or data access requests, see the Privacy Policy for exactly what to send.
      </p>
    </TrustPage>
  )
}

// One barrel so App.tsx can lazy-load every trust/legal page as a single chunk —
// they share the TrustPage layout and are visited far less often than the app core.
export { AboutPage } from './AboutPage'
export { HowItWorksPage } from './HowItWorksPage'
export { FaqPage } from './FaqPage'
export { GuidelinesPage } from './GuidelinesPage'
export { VotingRulesPage } from './VotingRulesPage'
export { TransparencyPage } from './TransparencyPage'
export { ModerationPolicyPage } from './ModerationPolicyPage'
export { ContactPage } from './ContactPage'
export { PrivacyPage } from './PrivacyPage'
export { TermsPage } from './TermsPage'
export { DisclaimerPage } from './DisclaimerPage'

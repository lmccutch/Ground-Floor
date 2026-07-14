import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CampaignPage } from './components/CampaignPage'
import { DashboardPage } from './components/DashboardPage'
import { Skeleton } from './components/ui'
import { DiscoverPage } from './pages/DiscoverPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

// Lazy so the form stack (react-hook-form + zod) stays out of the main bundle.
const RequestCompanyPage = lazy(() =>
  import('./components/RequestCompanyPage').then(module => ({ default: module.RequestCompanyPage })),
)

// Trust/legal pages load as one lazy chunk — long-form content visited far less
// often than the app core.
const trust = (pick: (module: typeof import('./pages/trust')) => ComponentType) =>
  lazy(() => import('./pages/trust').then(module => ({ default: pick(module) })))

const AboutPage = trust(module => module.AboutPage)
const HowItWorksPage = trust(module => module.HowItWorksPage)
const FaqPage = trust(module => module.FaqPage)
const GuidelinesPage = trust(module => module.GuidelinesPage)
const VotingRulesPage = trust(module => module.VotingRulesPage)
const TransparencyPage = trust(module => module.TransparencyPage)
const ModerationPolicyPage = trust(module => module.ModerationPolicyPage)
const ContactPage = trust(module => module.ContactPage)
const PrivacyPage = trust(module => module.PrivacyPage)
const TermsPage = trust(module => module.TermsPage)
const DisclaimerPage = trust(module => module.DisclaimerPage)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const lazyFallback = <Skeleton height={420} />

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell>
        <Suspense fallback={lazyFallback}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/company/:ticker" element={<CampaignPage />} />
            <Route path="/companies" element={<DashboardPage />} />
            <Route path="/companies/:slug" element={<CampaignPage />} />
            <Route path="/request-company" element={<RequestCompanyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/voting-rules" element={<VotingRulesPage />} />
            <Route path="/transparency" element={<TransparencyPage />} />
            <Route path="/moderation" element={<ModerationPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}

export default App

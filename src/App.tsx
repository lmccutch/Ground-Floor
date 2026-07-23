import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { sanitizeAnalyticsUrl } from './lib/analyticsUrl'
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
const ReportBugPage = lazy(() => import('./pages/ReportBugPage').then(module => ({ default: module.ReportBugPage })))

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

// Auth screens load as one lazy chunk — form validation + Supabase auth stay out
// of the main bundle.
const auth = (pick: (module: typeof import('./pages/auth')) => ComponentType) =>
  lazy(() => import('./pages/auth').then(module => ({ default: pick(module) })))

const LoginPage = auth(module => module.LoginPage)
const SignupPage = auth(module => module.SignupPage)
const VerifyEmailPage = auth(module => module.VerifyEmailPage)
const ForgotPasswordPage = auth(module => module.ForgotPasswordPage)
const ResetPasswordPage = auth(module => module.ResetPasswordPage)

// The entire admin action centre loads as its own lazy chunk so none of it (or
// its data layer) ships in the public bundle. Guarded server-side by is_admin().
const AdminApp = lazy(() => import('./pages/admin/AdminApp').then(module => ({ default: module.AdminApp })))

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
    <>
      {/* Vercel Web Analytics: aggregate traffic only (page views/visitors/routes).
          Mounted once at the root so it persists across SPA route changes. No
          custom product events are sent here — those go to PostHog via track().
          beforeSend strips query strings and fragments and suppresses auth/recovery
          URLs so tokens never reach analytics. */}
      <Analytics
        beforeSend={event => {
          const url = sanitizeAnalyticsUrl(event.url)
          return url ? { ...event, url } : null
        }}
      />
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
            <Route path="/report-bug" element={<ReportBugPage />} />
            {/* Password-auth screens (magic-link login has been removed). */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Protected admin action centre (guarded server-side by is_admin()).
                The splat lets the admin app own its own nested routes. */}
            <Route path="/admin/*" element={<AdminApp />} />
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
    </>
  )
}

export default App

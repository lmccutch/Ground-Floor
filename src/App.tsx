import { lazy, Suspense, useEffect } from 'react'
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/company/:ticker" element={<CampaignPage />} />
          <Route path="/companies" element={<DashboardPage />} />
          <Route
            path="/request-company"
            element={
              <Suspense fallback={<Skeleton height={420} />}>
                <RequestCompanyPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App

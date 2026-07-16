import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DataModeConfigError, getDataModeConfig } from './lib/dataMode'
import { assertSiteUrlConfig } from './lib/siteUrl'
import { ErrorBoundary } from './components/ErrorBoundary'

const root = createRoot(document.getElementById('root')!)

function renderConfigError(message: string) {
  root.render(
    <div className="config-error-screen">
      <h1>Configuration error</h1>
      <p>{message}</p>
    </div>,
  )
}

// Data-mode validation runs before any of the app's other modules (which read
// the resolved config at import time) are loaded, so an invalid/missing
// VITE_DATA_MODE fails with a clear message instead of a blank crashed page.
async function bootstrap() {
  try {
    getDataModeConfig()
  } catch (error) {
    if (error instanceof DataModeConfigError) {
      renderConfigError(error.message)
      return
    }
    throw error
  }

  // Validate the auth redirect origin. Non-fatal in a browser (auth falls back to
  // the runtime origin), but surfaces a misconfigured VITE_SITE_URL loudly in
  // production instead of silently sending a broken magic-link redirect.
  assertSiteUrlConfig()

  const [{ default: App }, { MvpProvider }, { getAttribution, initAnalytics }] = await Promise.all([
    import('./App.tsx'),
    import('./context/MvpContext.tsx'),
    import('./lib/analytics'),
  ])

  initAnalytics()
  getAttribution()

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <MvpProvider>
          <App />
        </MvpProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

void bootstrap()

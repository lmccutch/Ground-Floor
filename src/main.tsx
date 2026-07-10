import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MvpProvider } from './context/MvpContext.tsx'
import { getAttribution, initAnalytics } from './lib/analytics'

initAnalytics()
getAttribution()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MvpProvider>
      <App />
    </MvpProvider>
  </StrictMode>,
)

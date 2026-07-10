import { defineConfig, devices } from '@playwright/test'

const PORT = 4319

// The dev server is launched with VITE_DATA_MODE explicitly forced to 'demo' and
// Supabase/PostHog env vars unset (not inherited from the shell), so every e2e run
// exercises demo mode deterministically, regardless of what a developer's machine
// happens to have configured.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Chromium-based mobile emulation (not iPhone/WebKit) so this project doesn't
    // require installing a second browser engine.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_DATA_MODE: 'demo',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_POSTHOG_KEY: '',
    },
  },
})

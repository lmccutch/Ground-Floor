import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Supabase env vars are intentionally left unset here (not inherited, not read from
// a local .env file) so every unit test runs against demo mode regardless of what a
// developer's machine happens to have configured.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_POSTHOG_KEY: '',
    },
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
  },
})

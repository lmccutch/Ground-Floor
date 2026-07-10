import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// VITE_DATA_MODE is explicitly forced to 'demo' and Supabase env vars are left
// unset here (not inherited, not read from a local .env file) so every unit test
// runs against demo mode regardless of what a developer's machine happens to have
// configured.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_DATA_MODE: 'demo',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_POSTHOG_KEY: '',
    },
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
  },
})

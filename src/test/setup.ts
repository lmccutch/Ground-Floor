import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

// Storage is cleared before and after every test so demo/test-mode local data never
// leaks between test cases, regardless of which suite runs first or last.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

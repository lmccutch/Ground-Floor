import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Storage is cleared before and after every test so demo/test-mode local data never
// leaks between test cases, regardless of which suite runs first or last.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  // Unmounts anything rendered with @testing-library/react so component tests don't
  // leak DOM nodes into the next test in the same file.
  cleanup()
})

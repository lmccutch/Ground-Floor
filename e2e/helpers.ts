import type { Page } from '@playwright/test'

/** Completes the demo-mode sign-in + profile-completion flow inside the open AuthModal. */
export async function signInDemo(page: Page, email: string, displayName = 'E2E Tester') {
  await page.waitForSelector('.modal >> text=Sign in to continue')
  await page.fill('.modal input[type=email]', email)
  await page.click('.modal button[type=submit]')
  await page.waitForSelector('.modal >> text=One quick profile detail')
  await page.fill('.modal input.text-input >> nth=0', displayName)
  await page.click('.modal button[type=submit]')
  await page.waitForSelector('.modal', { state: 'detached' })
}

/** Below the mobile breakpoint the sidebar starts off-canvas — open it via the hamburger before clicking a sidebar-only control. */
export async function openSidebarIfCollapsed(page: Page) {
  const viewport = page.viewportSize()
  if (viewport && viewport.width < 760) {
    await page.click('.mobile-menu')
    await page.waitForSelector('.sidebar.open')
  }
}

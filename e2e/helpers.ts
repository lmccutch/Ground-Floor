import { expect, type Page } from '@playwright/test'

// Matches the CSS breakpoint below which the top nav collapses into a menu.
const MOBILE_NAV_BREAKPOINT = 860

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

/** Opens the mobile menu when below the desktop-nav breakpoint. Idempotent. */
export async function openMobileMenu(page: Page) {
  const viewport = page.viewportSize()
  if (!viewport || viewport.width >= MOBILE_NAV_BREAKPOINT) return
  if (await page.locator('.mobile-menu.open').count()) return
  await page.click('.nav-toggle')
  await page.waitForSelector('.mobile-menu.open')
}

/** Signs in via the shell control (top nav on desktop, mobile menu on small screens). */
export async function shellSignIn(page: Page, email: string, displayName = 'E2E Tester') {
  await openMobileMenu(page)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await signInDemo(page, email, displayName)
}

/** Clicks a primary-nav destination from the shell, opening the mobile menu first if needed. */
export async function navigateTo(page: Page, label: string) {
  await openMobileMenu(page)
  const menu = page.locator('.mobile-menu.open')
  const scope = (await menu.count()) ? menu : page.locator('.topnav-links')
  await scope.getByRole('link', { name: label }).click()
}

/** Asserts the document has no horizontal overflow. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

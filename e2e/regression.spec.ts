import { test, expect } from '@playwright/test'
import { expectNoHorizontalOverflow, navigateTo, openMobileMenu, shellSignIn, signInDemo } from './helpers'

// Confirms the pre-existing cleaned flows still work after wiring them to the
// new company/security model — not a re-test of company-universe.spec.ts.
test.describe('Preserved cleanup functionality', () => {
  test('supporting a campaign and following it both work, and the dashboard reflects it', async ({ page }) => {
    await page.goto('/company/DXCM')
    await page.click('text=Start this campaign')
    await signInDemo(page, `e2e-regression-${Date.now()}@test.dev`)
    await page.click('text=Start this campaign')
    await page.waitForSelector('.campaign-metrics')

    await page.click('text=Support this interview')
    await page.waitForSelector('.modal >> text=Tell us where you stand')
    await page.click('.modal button[type=submit]')
    await page.waitForSelector('.modal >> text=You joined the campaign')
    await page.click('.modal >> text=Continue')
    await expect(page.locator('text=You support this interview')).toBeVisible()

    await page.click('text=Follow updates')
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible()

    await navigateTo(page, 'My companies')
    await page.waitForSelector('text=supported campaigns')
    await expect(page.locator('text=Dexcom').first()).toBeVisible()
  })

  test('404 route and unknown ticker both show honest not-found states', async ({ page }) => {
    await page.goto('/nonsense/route')
    await expect(page.locator('text=Page not found')).toBeVisible()

    await page.goto('/company/ZZZZNOPE')
    await expect(page.locator("text=We don't have ZZZZNOPE yet")).toBeVisible()
  })

  test('sign out returns to guest state', async ({ page }) => {
    await page.goto('/')
    await shellSignIn(page, `e2e-signout-${Date.now()}@test.dev`)
    // Signed-in: a Sign out control is reachable in the shell (reopen the menu on mobile).
    await openMobileMenu(page)
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    // Guest again: the Sign in control returns.
    await openMobileMenu(page)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('mobile navigation opens and links to Discover', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.click('.nav-toggle')
    await page.waitForSelector('.mobile-menu.open')
    await page.locator('.mobile-menu').getByRole('link', { name: 'Discover' }).click()
    await page.waitForSelector('.company-card')
    await expectNoHorizontalOverflow(page)
  })
})

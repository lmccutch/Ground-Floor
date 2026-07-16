import { expect, test } from '@playwright/test'
import { signInDemo } from './helpers'

// The streamlined "Request a company" flow collects only a company name and
// ticker, requires sign-in, points existing companies back to the directory,
// blocks duplicate requests, and never promises an email that isn't sent.

test.describe('Request a company', () => {
  test('collects only company name and ticker — no legacy fields', async ({ page }) => {
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await expect(page.locator('.request-form input')).toHaveCount(2)
    await expect(page.locator('.request-form textarea')).toHaveCount(0)
    await expect(page.locator('.request-form select')).toHaveCount(0)
    await expect(page.locator('.request-form .check-row')).toHaveCount(0)
    await expect(page.locator('.request-form')).toContainText('Company name')
    await expect(page.locator('.request-form')).toContainText('Ticker')
  })

  test('makes no email or delivery promise anywhere on the page', async ({ page }) => {
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await expect(page.locator('.request-intro')).not.toContainText(/email/i)
    await expect(page.locator('.request-form')).not.toContainText(/email/i)
  })

  test('validates required fields and ticker format before submitting', async ({ page }) => {
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.click('button[type=submit]')
    await expect(page.locator('.form-error')).toHaveCount(2)
    // No sign-in modal is opened while the form is invalid.
    await expect(page.locator('.modal')).toHaveCount(0)

    // A malformed ticker (illegal character) is rejected too.
    await page.fill('input[placeholder*="Instacart"]', 'Some New Company')
    await page.fill('input[placeholder="CART"]', 'AB@')
    await page.click('button[type=submit]')
    await expect(page.locator('.form-error')).toContainText('valid ticker')
    await expect(page.locator('.modal')).toHaveCount(0)
  })

  test('requires sign-in before a valid request is accepted', async ({ page }) => {
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.fill('input[placeholder*="Instacart"]', 'A Brand New Company')
    await page.fill('input[placeholder="CART"]', 'ZQNEW')
    await page.click('button[type=submit]')
    // requireAuth opens the sign-in gate instead of writing the request.
    await expect(page.locator('.modal')).toContainText('Sign in to continue')
  })

  test('an existing company (even lower-case ticker) routes back to the directory', async ({ page }) => {
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.fill('input[placeholder*="Instacart"]', 'apple')
    await page.fill('input[placeholder="CART"]', 'aapl')
    await page.click('button[type=submit]')
    await signInDemo(page, `e2e-existing-${Date.now()}@test.dev`)
    await page.click('button[type=submit]')
    await expect(page.locator('text=This company is already here.')).toBeVisible()
    await expect(page.locator('.matched-company-card')).toContainText('Apple')
  })

  test('a genuinely new company succeeds with an honest, no-email confirmation', async ({ page }) => {
    const ticker = `ZQ${Date.now().toString(36).slice(-6).toUpperCase()}`
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.fill('input[placeholder*="Instacart"]', 'Totally Fictional Newco')
    await page.fill('input[placeholder="CART"]', ticker)
    await page.click('button[type=submit]')
    await signInDemo(page, `e2e-newco-${Date.now()}@test.dev`)
    await page.click('button[type=submit]')

    const confirmation = page.locator('.request-confirmation')
    await expect(confirmation).toContainText('Request received')
    await expect(confirmation).toContainText('We’ll review it within 24 hours.')
    await expect(confirmation).toContainText('does not guarantee that the company will be added')
    await expect(confirmation).not.toContainText(/email/i)
  })

  test('the same shareholder cannot file the same company twice', async ({ page }) => {
    const ticker = `ZD${Date.now().toString(36).slice(-6).toUpperCase()}`
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.fill('input[placeholder*="Instacart"]', 'Repeat Request Co')
    await page.fill('input[placeholder="CART"]', ticker)
    await page.click('button[type=submit]')
    await signInDemo(page, `e2e-dupe-${Date.now()}@test.dev`)
    await page.click('button[type=submit]')
    await expect(page.locator('text=We’ll review it within 24 hours.')).toBeVisible()

    // File the identical company again (still signed in) → blocked as a duplicate.
    await page.goto('/request-company')
    await page.waitForSelector('.request-form')
    await page.fill('input[placeholder*="Instacart"]', 'Repeat Request Co')
    await page.fill('input[placeholder="CART"]', ticker.toLowerCase())
    await page.click('button[type=submit]')
    await expect(page.locator('text=You’ve already requested this company.')).toBeVisible()
  })
})

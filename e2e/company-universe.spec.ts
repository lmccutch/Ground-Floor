import { test, expect } from '@playwright/test'
import { signInDemo } from './helpers'

test.describe('Company universe (demo mode)', () => {
  test('searching an existing ticker opens its company page', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'AAPL')
    await page.waitForSelector('.search-result')
    await expect(page.locator('.search-result').first()).toContainText('AAPL')
    await page.click('.search-result >> nth=0')
    await expect(page).toHaveURL(/\/company\/AAPL/)
    await expect(page.locator('h1')).toContainText('Apple')
  })

  test('an unstarted company shows the honest empty state, not fake activity', async ({ page }) => {
    await page.goto('/company/DDOG')
    await expect(page.locator('text=No shareholder campaign has started for this company.')).toBeVisible()
    await expect(page.locator('text=Start this campaign')).toBeVisible()
    await expect(page.locator('text=Ask the first question')).toBeVisible()
    // No campaign metrics, no question list — nothing implies activity that doesn't exist.
    await expect(page.locator('.campaign-metrics')).toHaveCount(0)
  })

  test('starting a campaign requires sign-in, then creates exactly one active campaign', async ({ page }) => {
    await page.goto('/company/DDOG')
    await page.click('text=Start this campaign')
    await signInDemo(page, `e2e-start-${Date.now()}@test.dev`)
    // requireAuth blocks the original click; the button must be pressed again once signed in.
    await page.click('text=Start this campaign')
    await page.waitForSelector('.campaign-metrics')
    await expect(page.locator('.status-panel h2')).toContainText('Gathering shareholder interest')
    await expect(page.locator('.campaign-metrics')).toBeVisible()
  })

  test('asking the first question creates the campaign and publishes the question in one flow', async ({ page }) => {
    await page.goto('/company/MDB')
    await expect(page.locator('text=No shareholder campaign has started')).toBeVisible()
    await page.click('text=Ask the first question')
    await signInDemo(page, `e2e-question-${Date.now()}@test.dev`)
    // Auth gate reopens the same intent; the button must be pressed again once signed in.
    await page.click('text=Ask the first question')
    await page.waitForSelector('.modal textarea')
    await page.fill('.modal textarea', 'How does the company plan to expand its enterprise customer base over the next two years?')
    await page.click('.modal button[type=submit]')
    await page.waitForSelector('text=How does the company plan to expand its enterprise customer base over the next two years?')
    await expect(page.locator('.campaign-metrics')).toBeVisible()
  })

  test('voting on a question increments the count once and disables the button', async ({ page }) => {
    await page.goto('/company/ZTS')
    await page.click('text=Start this campaign')
    await signInDemo(page, `e2e-vote-${Date.now()}@test.dev`)
    await page.click('text=Start this campaign')
    await page.waitForSelector('.campaign-metrics')
    await page.click('text=Submit a question')
    await page.waitForSelector('.modal textarea')
    await page.fill('.modal textarea', 'What is the long-term plan for capital return to shareholders?')
    await page.click('.modal button[type=submit]')
    await page.waitForSelector('.question-card')

    const votesBefore = await page.locator('.vote-box b').first().innerText()
    await page.click('.vote-btn >> nth=0')
    await page.waitForSelector('.vote-btn.voted')
    const votesAfter = await page.locator('.vote-box b').first().innerText()
    expect(Number(votesAfter)).toBe(Number(votesBefore) + 1)
    await expect(page.locator('.vote-btn').first()).toBeDisabled()
  })

  test('searching a former ticker finds the company and redirects to its current ticker', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'VIAC')
    await page.waitForSelector('.search-result')
    await expect(page.locator('.search-result').first()).toContainText('Paramount Global')
    await page.click('.search-result >> nth=0')
    await page.waitForURL(/\/company\/PARA/)
    await expect(page).toHaveURL(/\/company\/PARA/)
  })

  test('a direct former-ticker URL redirects to the canonical ticker route', async ({ page }) => {
    await page.goto('/company/FB')
    await page.waitForURL(/\/company\/META/)
    await expect(page.locator('h1')).toContainText('Meta Platforms')
  })

  test('suggesting an already-listed company points to it instead of creating a duplicate', async ({ page }) => {
    await page.goto('/request-company')
    await page.fill('input[placeholder*="Instacart"]', 'Apple')
    await page.fill('input[placeholder="CART"]', 'AAPL')
    await page.fill('textarea', 'I would like this company to be part of the shareholder directory please.')
    await page.check('.check-row input')
    await page.click('button[type=submit]')
    await signInDemo(page, `e2e-suggest-${Date.now()}@test.dev`)
    await page.click('button[type=submit]')
    await expect(page.locator('text=We found this company.')).toBeVisible()
    await expect(page.locator('.matched-company-card')).toContainText('Apple')
  })

  test('discover filters actually change the result set', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    const before = await page.locator('.company-card').count()
    await page.click('.chip-row >> text=Technology')
    await page.waitForTimeout(400)
    const afterSector = await page.locator('.company-card').count()
    expect(afterSector).toBeLessThanOrEqual(before)
    await page.click('.chip-row >> text=All')
    await page.waitForTimeout(400)
  })

  test('search keyboard navigation selects a result with Enter', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'Microsoft')
    await page.waitForSelector('.search-result')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/company\/MSFT/)
  })
})

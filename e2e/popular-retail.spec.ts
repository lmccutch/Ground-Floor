import { test, expect } from '@playwright/test'

// "Popular with Retail Investors" Discover section (demo mode). Runs on both the
// desktop and mobile projects (see playwright.config.ts).

test.describe('Popular with Retail Investors', () => {
  test('renders on Discover with heading, disclosure, and ranked cards', async ({ page }) => {
    await page.goto('/discover')
    const section = page.locator('.retail-section')
    await expect(section).toBeVisible()
    await expect(section.locator('.eyebrow')).toContainText('Popular with Retail Investors')
    // The methodology disclosure must be present and honest.
    await expect(section.locator('.retail-disclosure')).toContainText('not a measure of total retail ownership')
    // Cards render, top-ranked first.
    await expect(section.locator('.retail-card').first()).toContainText('#1')
    await expect(section.locator('.retail-card').first()).toContainText('Tesla')
  })

  test('the first featured company opens its canonical page', async ({ page }) => {
    await page.goto('/discover')
    await page.locator('.retail-section .retail-card').first().locator('.retail-card-body').click()
    await expect(page).toHaveURL(/\/company\/TSLA/)
    await expect(page.locator('h1')).toContainText('Tesla')
  })

  test('a featured company without a campaign opens its honest empty state', async ({ page }) => {
    await page.goto('/discover')
    // Microsoft (rank 2) is in the initial list and has no campaign in a fresh demo session.
    const card = page.locator('.retail-section .retail-card', { hasText: 'Microsoft' })
    await expect(card).toContainText('No campaign yet')
    await card.locator('.retail-cta').click()
    await expect(page).toHaveURL(/\/company\/MSFT/)
    await expect(page.locator('text=No shareholder campaign has started')).toBeVisible()
    await expect(page.locator('.campaign-metrics')).toHaveCount(0)
  })

  test('View all reveals the full ranked list, then collapses', async ({ page }) => {
    await page.goto('/discover')
    const section = page.locator('.retail-section')
    await section.locator('.retail-card').first().waitFor()
    const initialCount = await section.locator('.retail-card').count()
    expect(initialCount).toBe(12)
    await section.getByRole('button', { name: /View all/ }).click()
    await expect.poll(async () => section.locator('.retail-card').count()).toBeGreaterThan(initialCount)
    await section.getByRole('button', { name: /Show fewer/ }).click()
    await expect.poll(async () => section.locator('.retail-card').count()).toBe(initialCount)
  })

  test('the campaign CTA takes an unauthenticated user to the company page and its sign-in gate', async ({ page }) => {
    await page.goto('/discover')
    // Tesla (rank 1) has no campaign yet → CTA is "Start campaign".
    const tesla = page.locator('.retail-section .retail-card', { hasText: 'Tesla' })
    await expect(tesla.locator('.retail-cta')).toContainText('Start campaign')
    await tesla.locator('.retail-cta').click()
    await expect(page).toHaveURL(/\/company\/TSLA/)
    // Existing auth/return-path behaviour is preserved: starting requires sign-in.
    await page.click('text=Start this campaign')
    await expect(page.locator('.modal')).toContainText('Sign in to continue')
  })
})

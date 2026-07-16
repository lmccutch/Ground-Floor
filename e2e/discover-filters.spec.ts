import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow } from './helpers'

// The Discover filters are a compact, accessible control: a "Filters" trigger
// (an anchored popover on desktop, a bottom sheet on mobile) with active-filter
// chips and fully shareable, URL-driven state. These run on desktop + mobile.

test.describe('Discover filters', () => {
  test('are hidden behind a single trigger by default — no permanent filter rows', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await expect(page.locator('.filter-trigger')).toBeVisible()
    // The old always-open filter chip row is gone, nothing is applied, no dialog is open.
    await expect(page.locator('.chip-row')).toHaveCount(0)
    await expect(page.locator('.filter-panel')).toHaveCount(0)
    await expect(page.locator('.active-filters')).toHaveCount(0)
    await expect(page.locator('.filter-trigger .filter-count')).toHaveCount(0)
  })

  test('open and close: trigger opens the dialog; Escape closes it and returns focus', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await page.click('.filter-trigger')
    const panel = page.locator('.filter-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('role', 'dialog')
    await expect(panel).toHaveAttribute('aria-modal', 'true')

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(page.locator('.filter-trigger')).toBeFocused()
  })

  test('clicking the backdrop closes the dialog', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await page.click('.filter-trigger')
    await expect(page.locator('.filter-panel')).toBeVisible()
    // Click a corner of the backdrop that neither the desktop popover nor the
    // mobile bottom sheet covers.
    await page.locator('.filter-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(page.locator('.filter-panel')).toHaveCount(0)
  })

  test('applying filters shows chips + a count badge and writes shareable URL params', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await page.click('.filter-trigger')
    await page.locator('.filter-panel .filter-option', { hasText: 'NYSE American' }).click()
    await page.locator('.filter-panel .filter-option', { hasText: 'Technology' }).click()
    await page.click('.filter-panel >> text=Apply filters')

    // URL is the single source of truth.
    await expect(page).toHaveURL(/sector=Technology/)
    await expect(page).toHaveURL(/exchange=NYSE_AMERICAN/)
    // Count badge reflects the two active filters; chips are shown for each.
    await expect(page.locator('.filter-trigger .filter-count')).toHaveText('2')
    await expect(page.locator('.filter-chip')).toHaveCount(2)
    await expect(page.locator('.active-filters')).toContainText('Technology')
    await expect(page.locator('.active-filters')).toContainText('NYSE American')
    // The dialog closes after applying.
    await expect(page.locator('.filter-panel')).toHaveCount(0)
  })

  test('a chip removes only its own filter; Clear all removes them all', async ({ page }) => {
    await page.goto('/discover?sector=Technology&exchange=NASDAQ')
    await page.waitForSelector('.company-card')
    await expect(page.locator('.filter-chip')).toHaveCount(2)

    await page.locator('.filter-chip', { hasText: 'NASDAQ' }).click()
    await expect(page).not.toHaveURL(/exchange=/)
    await expect(page).toHaveURL(/sector=Technology/)
    await expect(page.locator('.filter-chip')).toHaveCount(1)

    await page.click('.active-filters >> text=Clear all')
    await expect(page.locator('.active-filters')).toHaveCount(0)
    await expect(page).not.toHaveURL(/sector=/)
  })

  test('filter state survives a reload and responds to back/forward', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await page.click('.filter-trigger')
    await page.locator('.filter-panel .filter-option', { hasText: 'Technology' }).click()
    await page.click('.filter-panel >> text=Apply filters')
    await expect(page).toHaveURL(/sector=Technology/)

    // Refresh persistence.
    await page.reload()
    await page.waitForSelector('.company-card')
    await expect(page.locator('.filter-chip', { hasText: 'Technology' })).toBeVisible()

    // Back removes the filter; forward restores it.
    await page.goBack()
    await expect(page).not.toHaveURL(/sector=/)
    await expect(page.locator('.filter-chip')).toHaveCount(0)
    await page.goForward()
    await expect(page).toHaveURL(/sector=Technology/)
    await expect(page.locator('.filter-chip', { hasText: 'Technology' })).toBeVisible()
  })

  test('invalid URL params fail safely — no crash, no phantom chips', async ({ page }) => {
    await page.goto('/discover?sector=NotReal&exchange=BOGUS&mcap=huge&campaign=maybe')
    await page.waitForSelector('.company-card')
    // Unknown values are ignored, so nothing reads as an active filter.
    await expect(page.locator('.active-filters')).toHaveCount(0)
    await expect(page.locator('.filter-trigger .filter-count')).toHaveCount(0)
    // The directory still renders.
    expect(await page.locator('.company-card').count()).toBeGreaterThan(0)
  })

  test('a filter with no matches shows the honest filters-active empty state', async ({ page }) => {
    // The discoverable directory has no campaign-backed companies in a fresh demo
    // session, so "Has a campaign" yields an empty result set. (The always-on
    // campaign highlights row is separate, so `.company-card` is not counted here.)
    await page.goto('/discover?campaign=has-campaign')
    // The filters-active empty state only renders when the result grid is empty…
    await expect(page.locator('text=No companies match these filters.')).toBeVisible()
    // …and the results count (shown only when there are results) is absent.
    await expect(page.locator('.results-count')).toHaveCount(0)
    await page.click('text=Clear filters')
    await expect(page).not.toHaveURL(/campaign=/)
    await expect(page.locator('.results-count')).toBeVisible()
  })

  test('opening the filter dialog does not cause horizontal overflow', async ({ page }) => {
    await page.goto('/discover')
    await page.waitForSelector('.company-card')
    await page.click('.filter-trigger')
    await expect(page.locator('.filter-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

import { test, expect } from '@playwright/test'
import { expectNoHorizontalOverflow } from './helpers'

test.describe('Top navigation', () => {
  test('desktop: top nav is present, the sidebar is gone, and the active section is indicated', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/discover')
    await expect(page.locator('.topnav')).toBeVisible()
    // The desktop sidebar has been fully removed.
    await expect(page.locator('.sidebar')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Open Floor home' })).toBeVisible()
    await expect(page.locator('.topnav-links').getByRole('link', { name: 'Discover' })).toHaveClass(/active/)
    await page.locator('.topnav-links').getByRole('link', { name: 'How it works' }).click()
    await expect(page).toHaveURL(/\/how-it-works/)
    await expectNoHorizontalOverflow(page)
  })

  test('desktop: primary nav links are keyboard reachable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const discover = page.locator('.topnav-links').getByRole('link', { name: 'Discover' })
    await discover.focus()
    await expect(discover).toBeFocused()
    await discover.press('Enter')
    await expect(page).toHaveURL(/\/discover/)
  })

  test('mobile: menu opens, locks scroll, and closes on Escape with focus returned', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.locator('.nav-toggle')
    await expect(toggle).toBeVisible()
    await expect(page.locator('.topnav-links')).toBeHidden()

    await toggle.click()
    await expect(page.locator('.mobile-menu.open')).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect(page.locator('.mobile-menu')).toHaveCount(0)
    await expect(toggle).toBeFocused()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  })

  test('mobile: a menu link navigates and closes the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.nav-toggle').click()
    await page.locator('.mobile-menu').getByRole('link', { name: 'How it works' }).click()
    await expect(page).toHaveURL(/\/how-it-works/)
    await expect(page.locator('.mobile-menu')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})

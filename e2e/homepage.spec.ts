import { expect, test } from '@playwright/test'
import { signInDemo } from './helpers'

// Homepage rewrite: hero clarity, both CTAs, search (ticker/name/keyboard/recent),
// honest empty vs. real-data live-participation section, illustrative example
// (clearly labelled, no fabricated activity on a real company), trust links, no
// banned claims or fake metrics, and mobile layout. Runs on desktop + mobile.

const bannedClaims = [
  'guaranteed access',
  'official company campaign',
  'verified shareholders',
  'company partnership',
  'institutional-grade',
  'exclusive information',
  'beat the market',
  'democratize finance',
]

test.describe('Hero', () => {
  test('states what/why/how within the hero, with a visible trust note', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero h1')).toHaveText('Where retail shareholders get answers.')
    await expect(page.locator('.hero-copy > p').first()).toContainText('submit, rank, and support')
    await expect(page.locator('.hero-trust-note')).toContainText('Management participation is voluntary and responses are never guaranteed.')
    // No metrics/cards/charts crammed into the hero itself.
    await expect(page.locator('.hero .company-grid')).toHaveCount(0)
  })

  test('primary CTA "Find a company" navigates to Discover', async ({ page }) => {
    await page.goto('/')
    await page.click('.hero-actions >> text=Find a company')
    await expect(page).toHaveURL(/\/discover$/)
  })

  test('secondary CTA "See how it works" navigates to the full explanation', async ({ page }) => {
    await page.goto('/')
    await page.click('.hero-actions >> text=See how it works')
    await expect(page).toHaveURL(/\/how-it-works$/)
    await expect(page.locator('.page-heading h1')).toContainText('The process, step by step.')
  })
})

test.describe('Homepage search', () => {
  test('exact ticker match routes to the company page', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'AAPL')
    await page.waitForSelector('.search-panel .search-result')
    await page.click('.search-result >> nth=0')
    await expect(page).toHaveURL(/\/company\/AAPL$/)
  })

  test('company-name search works from the homepage', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'Microsoft')
    await page.waitForSelector('.search-panel .search-result')
    await expect(page.locator('.search-result-ticker').first()).toHaveText('MSFT')
  })

  test('former-ticker search resolves to the current company', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'VIAC')
    await page.waitForSelector('.search-panel .search-result')
    await expect(page.locator('.search-result-main b').first()).toContainText('Paramount')
  })

  test('keyboard navigation selects a result with Enter', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'AAPL')
    await page.waitForSelector('.search-panel .search-result')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/company\/AAPL$/)
  })
})

test.describe('How it works section', () => {
  test('shows the real six-step process and links to the full page', async ({ page }) => {
    await page.goto('/')
    const steps = page.locator('.how-section .step h3')
    await expect(steps).toHaveCount(6)
    await expect(steps.nth(4)).toHaveText('Management may choose to participate')
    await page.click('.how-section >> text=Full details')
    await expect(page).toHaveURL(/\/how-it-works$/)
  })
})

test.describe('Live participation', () => {
  test('shows an honest empty state and invites the visitor to be first when there is no real activity', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.live-section')
    await expect(page.locator('.live-section .live-launch')).toContainText('Open Floor is newly launched.')
    await expect(page.locator('.live-section .live-launch')).toContainText('Be among the first shareholders')
    // Never the full company directory dumped here, and no fabricated activity.
    await expect(page.locator('.live-section .company-card')).toHaveCount(0)
  })

  test('shows real campaign content once a campaign actually exists', async ({ page }) => {
    await page.goto('/company/DDOG')
    await page.click('text=Start this campaign')
    await signInDemo(page, `e2e-home-live-${Date.now()}@test.dev`)
    await page.click('text=Start this campaign')
    await page.waitForSelector('.campaign-metrics')

    await page.goto('/')
    await page.waitForSelector('.live-section .company-card')
    await expect(page.locator('.live-section .company-card')).toContainText('DDOG')
    await expect(page.locator('.live-section .live-launch')).toHaveCount(0)
  })
})

test.describe('Illustrative example', () => {
  test('is clearly labelled and attaches to no real company', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.example-section .eyebrow')).toContainText(
      'Illustrative example — not a real company or submitted question',
    )
    // No company monogram/ticker identity is attached to the example.
    await expect(page.locator('.example-card .monogram')).toHaveCount(0)
  })
})

test.describe('Trust principles', () => {
  test('links to Transparency, Community Guidelines, and the Investment Disclaimer', async ({ page }) => {
    await page.goto('/')
    await page.click('.trust-section-links >> text=Transparency')
    await expect(page).toHaveURL(/\/transparency$/)
    await page.goto('/')
    await page.click('.trust-section-links >> text=Community Guidelines')
    await expect(page).toHaveURL(/\/guidelines$/)
    await page.goto('/')
    await page.click('.trust-section-links >> text=Investment Disclaimer')
    await expect(page).toHaveURL(/\/disclaimer$/)
  })
})

test.describe('Visual structure', () => {
  test('sections use distinct structures, not a grid of identical cards', async ({ page }) => {
    await page.goto('/')
    // Problem section is an editorial contrast (labelled sides), not feature cards.
    await expect(page.locator('.problem-contrast .problem-side')).toHaveCount(3)
    // How it works is a numbered sequence.
    await expect(page.locator('.how-section ol.steps .step')).toHaveCount(6)
    // Trust principles are an indexed rule list, not six icon cards.
    await expect(page.locator('.trust-section ol.trust-rules .trust-rule')).toHaveCount(6)
    await expect(page.locator('.trust-rule .trust-rule-index').first()).toHaveText('01')
    // The old bordered trust-principle card grid is gone.
    await expect(page.locator('.trust-principles-grid')).toHaveCount(0)
  })

  test('the illustrative question is non-interactive (no live vote/link)', async ({ page }) => {
    await page.goto('/')
    const example = page.locator('.example-card')
    await expect(example).toHaveAttribute('aria-hidden', 'true')
    await expect(example.locator('a, button')).toHaveCount(0)
  })
})

test.describe('Final CTA', () => {
  test('closes with a direct action to find a company', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.request-band h2')).toHaveText('Find a company you own or follow.')
    await page.click('.request-band button:has-text("Find a company")')
    await expect(page).toHaveURL(/\/discover$/)
  })
})

test.describe('Honesty checks', () => {
  test('the homepage contains no banned overclaiming language', async ({ page }) => {
    await page.goto('/')
    const text = (await page.locator('body').innerText()).toLowerCase()
    for (const phrase of bannedClaims) {
      expect(text).not.toContain(phrase)
    }
  })

  test('the old fabricated preview widget and its fake numbers are gone', async ({ page }) => {
    await page.goto('/')
    const text = await page.locator('body').innerText()
    expect(text).not.toContain('Northstar Grid Systems')
    expect(text).not.toContain('62 of 100 supporters')
    expect(await page.locator('.hero-preview').count()).toBe(0)
  })

  test('no fake metrics appear when there is no real activity', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.live-section')
    await expect(page.locator('.live-section >> text=/\\d+ of \\d+ supporters/')).toHaveCount(0)
  })
})

test.describe('Mobile layout', () => {
  test('no horizontal overflow and every key element remains visible', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(overflow).toBe(false)
    await expect(page.locator('.hero h1')).toBeVisible()
    await expect(page.locator('.hero-search input')).toBeVisible()
    await expect(page.locator('.hero-actions >> text=Find a company')).toBeVisible()
    await page.locator('.request-band').scrollIntoViewIfNeeded()
    await expect(page.locator('.request-band')).toBeVisible()
    await page.locator('.site-footer').scrollIntoViewIfNeeded()
    await expect(page.locator('.site-footer')).toBeVisible()
  })
})

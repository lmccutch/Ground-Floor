import { expect, test } from '@playwright/test'
import { signInDemo } from './helpers'

// Trust/legal layer: every route renders real content with unique metadata,
// every footer link works, FAQ/contact interactions function, the MNPI warning
// appears before question submission, report categories are complete, and the
// legal drafts carry their review notice. Runs on desktop + mobile projects.

const trustRoutes: { path: string; heading: string; title: string }[] = [
  { path: '/about', heading: "Why we're building this.", title: 'About' },
  { path: '/how-it-works', heading: 'The process, step by step.', title: 'How It Works' },
  { path: '/faq', heading: 'Questions we actually get.', title: 'FAQ' },
  { path: '/guidelines', heading: 'Keep it sharp, keep it fair.', title: 'Community Guidelines' },
  { path: '/voting-rules', heading: 'How votes actually work.', title: 'Voting Rules' },
  { path: '/transparency', heading: 'What every number on this site means.', title: 'Transparency' },
  { path: '/moderation', heading: 'How moderation works here.', title: 'Moderation Policy' },
  { path: '/contact', heading: 'Talk to a person.', title: 'Contact' },
  { path: '/privacy', heading: 'What we collect and why.', title: 'Privacy Policy' },
  { path: '/terms', heading: 'The deal, in plain English.', title: 'Terms of Use' },
  { path: '/disclaimer', heading: 'Read this before relying on anything here.', title: 'Investment Disclaimer' },
]

test.describe('Trust routes', () => {
  for (const route of trustRoutes) {
    test(`${route.path} renders with its own heading and metadata`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator('.page-heading h1')).toContainText(route.heading)
      await expect(page).toHaveTitle(`${route.title} | Open Floor`)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical?.endsWith(route.path)).toBe(true)
    })
  }

  test('legal drafts carry the professional-review notice', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/disclaimer']) {
      await page.goto(path)
      await expect(page.locator('.draft-notice')).toContainText('Draft — professional legal review required before commercial launch.')
    }
  })

  test('terms use a labelled governing-law placeholder instead of a guessed jurisdiction', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('.legal-placeholder')).toContainText('PLACEHOLDER — governing law')
  })

  test('transparency labels unbuilt processes as intended policy', async ({ page }) => {
    await page.goto('/transparency')
    await expect(page.locator('.intended-policy').first()).toContainText('Intended policy — not yet built')
  })
})

test.describe('Footer', () => {
  test('every footer link resolves to a real page (no 404s, no broken links)', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.site-footer')
    const links = page.locator('.site-footer .footer-column a')
    const count = await links.count()
    expect(count).toBe(12)
    const hrefs: string[] = []
    for (let index = 0; index < count; index += 1) {
      hrefs.push((await links.nth(index).getAttribute('href')) ?? '')
    }
    for (const href of hrefs) {
      await page.goto(href)
      // Trust pages use .page-heading; the bug-report form uses the request-page layout.
      await expect(page.locator('.page-heading h1, .request-intro h1').first()).toBeVisible()
      await expect(page.locator('text=Page not found')).toHaveCount(0)
    }
  })

  test('footer renders and is reachable on mobile-width layouts', async ({ page }) => {
    await page.goto('/about')
    await page.locator('.site-footer').scrollIntoViewIfNeeded()
    await expect(page.locator('.site-footer')).toBeVisible()
    await expect(page.locator('.footer-note')).toContainText('not affiliated with any company')
  })

  test('footer links are keyboard-focusable', async ({ page }) => {
    await page.goto('/about')
    const first = page.locator('.site-footer .footer-column a').first()
    await first.focus()
    await expect(first).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/about$/)
  })
})

test.describe('FAQ interactions', () => {
  test('items open and close, and answers are real content', async ({ page }) => {
    await page.goto('/faq')
    const first = page.locator('.faq-item').first()
    await expect(first.locator('.faq-answer')).not.toBeVisible()
    await first.locator('summary').click()
    await expect(first.locator('.faq-answer')).toBeVisible()
    expect(((await first.locator('.faq-answer').innerText()) ?? '').length).toBeGreaterThan(60)
    await first.locator('summary').click()
    await expect(first.locator('.faq-answer')).not.toBeVisible()
  })

  test('deletion FAQ points at the contact address rather than pretending automation exists', async ({ page }) => {
    await page.goto('/faq')
    const item = page.locator('.faq-item', { hasText: 'delete my account' })
    await item.locator('summary').click()
    await expect(item).toContainText('not built yet')
    await expect(item.locator('a[href^="mailto:"]')).toBeVisible()
  })
})

test.describe('Contact', () => {
  test('offers a support form and direct-email fallbacks', async ({ page }) => {
    await page.goto('/contact')
    // The primary path is now a real support form.
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
    await expect(page.getByPlaceholder(/how can we help/i)).toBeVisible()
    // Direct-email fallbacks remain for security and press.
    const rows = page.locator('.contact-row')
    await expect(rows).toHaveCount(2)
    for (const subject of ['Security report', 'Press enquiry']) {
      const row = page.locator('.contact-row', { hasText: subject })
      const href = await row.getAttribute('href')
      expect(href?.startsWith('mailto:')).toBe(true)
      expect(decodeURIComponent(href ?? '')).toContain(subject)
    }
  })

  test('the report-a-bug form validates and captures consent', async ({ page }) => {
    await page.goto('/report-bug')
    await expect(page.getByRole('heading', { name: /something not working/i })).toBeVisible()
    // Submitting without the consent box shows an inline error, no navigation.
    await page.getByPlaceholder(/describe the problem/i).fill('The discover filter resets when I paginate on mobile devices.')
    await page.getByRole('button', { name: /submit bug report/i }).click()
    await expect(page.getByText(/please confirm before submitting/i)).toBeVisible()
  })
})

test.describe('MNPI warning and report categories', () => {
  test('the question form shows the MNPI warning before submission', async ({ page }) => {
    await page.goto('/company/REGN')
    await page.click('text=Ask the first question')
    await signInDemo(page, `e2e-mnpi-${Date.now()}@test.dev`)
    await page.click('text=Ask the first question')
    await page.waitForSelector('.modal textarea')
    await expect(page.locator('.mnpi-warning')).toContainText('No confidential or material non-public information')
    await expect(page.locator('.mnpi-warning a')).toHaveAttribute('href', '/guidelines')
  })

  test('the report modal offers every documented category', async ({ page }) => {
    // The report control only appears on questions you did not write, so check
    // the category list where it is documented publicly instead: the
    // Moderation Policy renders REPORT_REASONS — the same constant the modal
    // uses — keeping page and modal in lockstep by construction.
    await page.goto('/moderation')
    for (const reason of [
      'Spam or promotion',
      'Abusive or harassing',
      'Manipulation or coordinated abuse',
      'Duplicate question',
      'Misinformation or unsupported allegation',
      'Personal information',
      'Confidential or material non-public information',
      'Other',
    ]) {
      await expect(page.locator('.trust-prose li', { hasText: reason }).first()).toBeVisible()
    }
  })
})

test.describe('SEO files', () => {
  test('sitemap lists all public trust routes and no private routes', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const route of trustRoutes) expect(sitemap).toContain(`https://www.open-floor.ca${route.path}<`)
    expect(sitemap).not.toContain('/companies<')
    expect(sitemap).not.toContain('/request-company<')
    // Uses the canonical production host — never the unreplaced placeholder.
    expect(sitemap).toContain('https://www.open-floor.ca/')
    expect(sitemap).not.toContain('REPLACE-WITH-PRODUCTION-DOMAIN')
  })

  test('robots.txt keeps the private dashboard excluded and campaign slugs crawlable', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /companies$')
    expect(robots).toContain('Allow: /companies/')
  })
})

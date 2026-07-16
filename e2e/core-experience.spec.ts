import { expect, test } from '@playwright/test'
import { shellSignIn, signInDemo } from './helpers'

// Core-experience flows (demo mode): campaign lifecycle, timeline, question
// sort/filter/edit/delete, vote removal UI, sharing, feedback, recent searches,
// and dashboard activity. Runs on both the desktop and mobile projects.

async function startCampaignSignedIn(page: import('@playwright/test').Page, ticker: string, email: string) {
  await page.goto(`/company/${ticker}`)
  await page.click('text=Start this campaign')
  await signInDemo(page, email)
  await page.click('text=Start this campaign')
  await page.waitForSelector('.campaign-metrics')
}

async function submitQuestion(page: import('@playwright/test').Page, text: string) {
  await page.click('text=Submit a question')
  await page.waitForSelector('.modal textarea')
  await page.fill('.modal textarea', text)
  await page.click('.modal button[type=submit]:has-text("Publish question")')
  await page.waitForSelector(`.question-card >> text=${text}`)
}

test.describe('Campaign lifecycle and timeline', () => {
  test('lifecycle panel shows the current stage, next step, and voluntary-participation disclaimer', async ({ page }) => {
    await startCampaignSignedIn(page, 'DDOG', `e2e-lifecycle-${Date.now()}@test.dev`)
    await expect(page.locator('.lifecycle-panel h2')).toContainText('Gathering shareholder interest')
    // Both stage 1 and 2 are concurrently current while gathering support.
    await expect(page.locator('.lifecycle-step.current')).toHaveCount(2)
    await expect(page.locator('.lifecycle-step.done')).toHaveCount(0)
    await expect(page.locator('.lifecycle-next')).toContainText('does not guarantee an interview')
    await expect(page.locator('.lifecycle-panel .progress-meter')).toContainText('of 100 supporters')
  })

  test('timeline shows the real launch event and no fabricated milestones', async ({ page }) => {
    await startCampaignSignedIn(page, 'IDXX', `e2e-timeline-${Date.now()}@test.dev`)
    const timeline = page.locator('.side-rail .panel', { hasText: 'Campaign timeline' })
    await expect(timeline.locator('.timeline-row', { hasText: 'Campaign started' })).toBeVisible()
    await expect(timeline.locator('.timeline-row')).toHaveCount(2) // launch + upcoming interview-request note
    await expect(timeline).not.toContainText('supporters reached')
  })
})

test.describe('Question experience', () => {
  test('sorting by Top and Newest reorders questions', async ({ page }) => {
    await startCampaignSignedIn(page, 'TEAM', `e2e-sort-${Date.now()}@test.dev`)
    await submitQuestion(page, 'First question about long-term strategy direction?')
    await submitQuestion(page, 'Second question about capital allocation priorities?')
    // Vote for the first (older) question so Top and Newest orders differ.
    await page.locator('.question-card', { hasText: 'First question' }).locator('.vote-btn').click()
    await page.waitForSelector('.vote-btn.voted')

    await page.click('.chip:has-text("Top")')
    await expect(page.locator('.question-card h3').first()).toContainText('First question')
    await page.click('.chip:has-text("Newest")')
    await expect(page.locator('.question-card h3').first()).toContainText('Second question')
  })

  test('author can edit their own question', async ({ page }) => {
    await startCampaignSignedIn(page, 'SYK', `e2e-edit-${Date.now()}@test.dev`)
    await submitQuestion(page, 'How will pricing evolve across the enterprise tier?')
    await page.locator('.question-card').first().locator('button:has-text("Edit")').click()
    await page.waitForSelector('.modal >> text=Edit your question')
    await page.fill('.modal textarea', 'How will pricing evolve across enterprise and mid-market tiers?')
    await page.click('.modal button[type=submit]:has-text("Save changes")')
    await expect(page.locator('.question-card h3').first()).toContainText('mid-market tiers')
  })

  test('author can delete their own question and counters update', async ({ page }) => {
    await startCampaignSignedIn(page, 'BSX', `e2e-delete-${Date.now()}@test.dev`)
    await submitQuestion(page, 'What is the multi-year roadmap for platform consolidation?')
    await page.locator('.question-card').first().locator('button:has-text("Delete")').click()
    await page.waitForSelector('.modal >> text=Delete this question?')
    await page.click('.modal button:has-text("Delete question")')
    await expect(page.locator('.question-card')).toHaveCount(0)
    await expect(page.locator('text=No questions yet')).toBeVisible()
  })

  test('report control is not offered on your own question', async ({ page }) => {
    await startCampaignSignedIn(page, 'MDT', `e2e-report-${Date.now()}@test.dev`)
    await submitQuestion(page, 'What are the biggest execution risks this fiscal year?')
    const card = page.locator('.question-card').first()
    await expect(card.locator('button:has-text("Edit")')).toBeVisible()
    await expect(card.locator('button:has-text("Report")')).toHaveCount(0)
  })

  test('question share menu offers copy, Reddit, X, LinkedIn, and email', async ({ page }) => {
    await startCampaignSignedIn(page, 'BDX', `e2e-share-${Date.now()}@test.dev`)
    await submitQuestion(page, 'How durable is the current net revenue retention rate?')
    const card = page.locator('.question-card').first()
    await card.locator('.share-menu summary').click()
    await expect(card.locator('.share-pop >> text=Copy link')).toBeVisible()
    await expect(card.locator('.share-pop a[href*="reddit.com"]')).toBeVisible()
    await expect(card.locator('.share-pop a[href*="twitter.com"]')).toBeVisible()
    await expect(card.locator('.share-pop a[href*="linkedin.com"]')).toBeVisible()
    await expect(card.locator('.share-pop a[href^="mailto:"]')).toBeVisible()
    // Copy link works and confirms inline.
    await card.locator('.share-pop >> text=Copy link').click()
    await expect(card.locator('.share-menu summary')).toContainText('Link copied')
  })

  test('a direct question URL scrolls to and highlights the question', async ({ page }) => {
    await startCampaignSignedIn(page, 'CRWD', `e2e-direct-${Date.now()}@test.dev`)
    await submitQuestion(page, 'What milestones support the current growth targets?')
    const id = await page.locator('.question-card').first().getAttribute('id')
    await page.goto(`/company/CRWD#${id}`)
    await page.waitForSelector('.question-card')
    await expect(page.locator(`.question-card#${id}`)).toHaveClass(/linked-question/)
  })

  test('duplicate guidance appears when a similar question already exists', async ({ page }) => {
    await startCampaignSignedIn(page, 'ILMN', `e2e-dupe-${Date.now()}@test.dev`)
    await submitQuestion(page, 'What is the plan for improving operating margins next year?')
    await page.click('text=Submit a question')
    await page.waitForSelector('.modal textarea')
    await page.fill('.modal textarea', 'What is the plan for improving operating margins beyond?')
    await expect(page.locator('.similar-questions')).toContainText('Similar questions already exist')
  })
})

test.describe('Feedback', () => {
  test('signed-in user submits feedback and sees the success state', async ({ page }) => {
    await page.goto('/')
    // Sign in via the shell (top nav on desktop, mobile menu on small screens).
    await shellSignIn(page, `e2e-feedback-${Date.now()}@test.dev`)

    await page.click('.feedback-fab')
    await page.waitForSelector('.modal >> text=What should we know?')
    await page.selectOption('.modal select', 'Feature request')
    await page.fill('.modal textarea', 'It would help to filter questions by topic.')
    await page.click('.modal button[type=submit]:has-text("Send feedback")')
    await expect(page.locator('.modal')).toContainText('Thanks — got it.')
    await page.click('.modal button:has-text("Done")')
    await expect(page.locator('.modal')).toHaveCount(0)
  })

  test('feedback with an empty message shows an inline error, not a browser alert', async ({ page }) => {
    await page.goto('/')
    await page.click('.feedback-fab')
    await page.waitForSelector('.modal textarea')
    await page.click('.modal button[type=submit]:has-text("Send feedback")')
    await expect(page.locator('.modal .form-error')).toContainText('a few words')
  })
})

test.describe('Recent searches', () => {
  test('a selected result is remembered, reselectable, and clearable', async ({ page }) => {
    await page.goto('/')
    await page.fill('.hero-search input', 'AAPL')
    await page.waitForSelector('.search-panel .search-result')
    await page.click('.search-result >> nth=0')
    await page.waitForURL(/company\/AAPL/)

    await page.goto('/')
    await page.click('.hero-search input')
    await expect(page.locator('.recent-searches')).toContainText('Recent searches')
    await expect(page.locator('.recent-searches .search-result-ticker')).toContainText('AAPL')

    // Re-selecting navigates back to the company page.
    await page.click('.recent-searches .search-result')
    await page.waitForURL(/company\/AAPL/)

    // Clearing removes the history.
    await page.goto('/')
    await page.click('.hero-search input')
    await page.click('.recent-searches-head button:has-text("Clear")')
    await expect(page.locator('.recent-searches')).toHaveCount(0)
  })
})

test.describe('Dashboard', () => {
  test('activity feed and profile settings work end to end', async ({ page }) => {
    await startCampaignSignedIn(page, 'SNOW', `e2e-dash-${Date.now()}@test.dev`)
    await submitQuestion(page, 'How should investors think about consumption trends?')

    await page.goto('/companies')
    await page.waitForSelector('.dashboard-page')
    await expect(page.locator('text=Recent activity')).toBeVisible()
    await expect(page.locator('.dashboard-page')).toContainText('consumption trends')

    // Profile settings: change display name and save.
    await page.fill('.profile-form input >> nth=0', 'Core Experience Tester')
    await page.click('.profile-form button:has-text("Save profile")')
    await expect(page.locator('.profile-form button')).toContainText('Saved')
  })
})

test.describe('Discover highlights', () => {
  test('a started campaign appears under Newest campaigns; empty sections stay hidden', async ({ page }) => {
    await startCampaignSignedIn(page, 'MDB', `e2e-discover-${Date.now()}@test.dev`)
    await page.goto('/discover')
    await page.waitForSelector('.highlight-section')
    await expect(page.locator('.highlight-section', { hasText: 'Newest campaigns' })).toBeVisible()
    // No supporters or votes exist, so those sections must not render.
    await expect(page.locator('.highlight-section', { hasText: 'Most supported' })).toHaveCount(0)
    await expect(page.locator('.highlight-section', { hasText: 'Most voted questions' })).toHaveCount(0)
  })
})

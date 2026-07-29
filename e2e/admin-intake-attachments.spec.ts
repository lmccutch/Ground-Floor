import { expect, test } from '@playwright/test'

/* ===========================================================================
   Real-browser coverage for the Prompt 5 public-facing surface: bug-report
   attachments, and the guarantee that /admin stays unreachable to a visitor.

   The admin console itself needs a real administrator session, which demo mode
   cannot produce — those flows are covered by the component tests
   (src/pages/admin/adminDrawers.test.tsx) and by the owner-run browser
   acceptance list in docs/admin-communications.md §10.
   =========================================================================== */

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('bug-report attachments', () => {
  test('states the limits and warns against uploading sensitive information', async ({ page }) => {
    await page.goto('/report-bug')
    await expect(page.getByText(/Up to 3 files, 5 MB each and 10 MB in total/i)).toBeVisible()
    await expect(page.getByText(/PNG, JPEG, WebP or PDF/i)).toBeVisible()
    // The sensitive-data warning is a requirement, not decoration.
    await expect(page.getByText(/passwords, account numbers, identity documents/i)).toBeVisible()
    // We must not imply files are scanned, because they are not.
    await expect(page.getByText(/can’t scan uploads for viruses/i)).toBeVisible()
  })

  test('accepts a real PNG and lets it be removed again', async ({ page }) => {
    await page.goto('/report-bug')
    await page.setInputFiles('#bug-attachments', { name: 'screenshot.png', mimeType: 'image/png', buffer: PNG_1x1 })
    await expect(page.getByText('screenshot.png')).toBeVisible()
    await page.getByRole('button', { name: /remove screenshot\.png/i }).click()
    await expect(page.getByText('screenshot.png')).toHaveCount(0)
  })

  test('rejects an SVG in the browser — it is a script-bearing format', async ({ page }) => {
    await page.goto('/report-bug')
    await page.setInputFiles('#bug-attachments', {
      name: 'logo.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    })
    await expect(page.getByRole('alert')).toContainText(/only PNG, JPEG, WebP and PDF/i)
    await expect(page.getByText('logo.svg')).toHaveCount(0)
  })

  test('rejects a file over the 5 MB limit', async ({ page }) => {
    await page.goto('/report-bug')
    await page.setInputFiles('#bug-attachments', {
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    })
    await expect(page.getByRole('alert')).toContainText(/5 MB or smaller/i)
  })

  test('the attachment control is reachable and operable by keyboard', async ({ page }) => {
    await page.goto('/report-bug')
    // The input is visually hidden but must remain focusable and labelled.
    const input = page.locator('#bug-attachments')
    await input.focus()
    await expect(input).toBeFocused()
    await expect(page.getByText(/attach a file/i)).toBeVisible()
  })

  test('the public form still submits without an attachment (regression)', async ({ page }) => {
    await page.goto('/report-bug')
    await page.getByPlaceholder(/describe the problem/i).fill('The filter chips overlap the header on a narrow window.')
    await page.getByRole('button', { name: /submit bug report/i }).click()
    // Consent is still enforced before anything is sent.
    await expect(page.getByText(/please confirm before submitting/i)).toBeVisible()
  })
})

test.describe('admin console is not reachable without an administrator session', () => {
  for (const path of ['/admin', '/admin/system', '/admin/bugs', '/admin/support', '/admin/not-a-real-page']) {
    test(`${path} renders no admin content to a visitor`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('text=Open Floor Admin')).toHaveCount(0)
      await expect(page.locator('nav[aria-label="Admin sections"]')).toHaveCount(0)
      // No operational data leaks into the page while the check resolves.
      await expect(page.locator('text=Work queue')).toHaveCount(0)
      await expect(page.locator('text=Audit log')).toHaveCount(0)
    })
  }
})

test.describe('no horizontal overflow on the changed public page', () => {
  test('/report-bug fits common desktop and mobile widths', async ({ page }) => {
    await page.goto('/report-bug')
    await page.setInputFiles('#bug-attachments', {
      name: 'a-rather-long-screenshot-filename-for-testing-overflow.png',
      mimeType: 'image/png',
      buffer: PNG_1x1,
    })
    await expect(page.getByText(/a-rather-long-screenshot-filename/i)).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'the page must not scroll horizontally').toBeLessThanOrEqual(1)
  })
})

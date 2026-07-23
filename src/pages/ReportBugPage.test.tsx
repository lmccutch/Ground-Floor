import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const submitBugReport = vi.fn(async () => ({ reference: 'BUG-TEST1234' }))
vi.mock('../lib/intake', () => ({
  submitBugReport: (...a: unknown[]) => submitBugReport(...(a as [])),
  newIdempotencyKey: () => 'test-idem-key',
  INTAKE_UNAVAILABLE: 'intake_unavailable',
}))
vi.mock('../lib/analytics', () => ({ track: vi.fn() }))

import { ReportBugPage } from './ReportBugPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/report-bug']}>
      <ReportBugPage />
    </MemoryRouter>,
  )
}

beforeEach(() => submitBugReport.mockClear())

describe('ReportBugPage', () => {
  it('has a hidden honeypot field that is not part of the visible form', () => {
    renderPage()
    const honeypot = screen.getByLabelText(/leave this field empty/i)
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
  })

  it('requires the consent confirmation before it will submit', async () => {
    renderPage()
    fireEvent.input(screen.getByPlaceholderText(/describe the problem/i), { target: { value: 'The pagination resets my filters on mobile.' } })
    fireEvent.click(screen.getByRole('button', { name: /submit bug report/i }))
    expect(await screen.findByText(/please confirm before submitting/i)).toBeInTheDocument()
    expect(submitBugReport).not.toHaveBeenCalled()
  })

  it('submits a valid report and shows the reference confirmation', async () => {
    renderPage()
    fireEvent.input(screen.getByPlaceholderText(/describe the problem/i), { target: { value: 'The pagination resets my filters on mobile.' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /submit bug report/i }))
    await waitFor(() => expect(submitBugReport).toHaveBeenCalledTimes(1))
    expect(submitBugReport.mock.calls[0][0]).toEqual(expect.objectContaining({ description: expect.stringContaining('pagination'), idempotencyKey: 'test-idem-key' }))
    expect(await screen.findByText(/we’ve logged your report/i)).toBeInTheDocument()
    expect(screen.getByText('BUG-TEST1234')).toBeInTheDocument()
  })
})

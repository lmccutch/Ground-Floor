import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const submitBugReport = vi.fn(async (..._args: unknown[]) => ({ reference: 'BUG-TEST1234', attachmentsStored: 0, attachmentsFailed: false }))
// Only the network call is stubbed. The real attachment limits and validator are
// used, so the form's client-side checks are genuinely exercised.
vi.mock('../lib/intake', async importActual => ({
  ...(await importActual<typeof import('../lib/intake')>()),
  submitBugReport: (...a: unknown[]) => submitBugReport(...a),
  newIdempotencyKey: () => 'test-idem-key',
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

/* ===========================================================================
   Attachments (Prompt 5). The browser check is a courtesy — submit-intake
   re-validates count, size and the file's actual magic bytes server-side — but
   it must still refuse obviously-bad selections and, above all, must never
   silently drop a file the reporter thinks they attached.
   =========================================================================== */

function file(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('ReportBugPage attachments', () => {
  const input = () => screen.getByLabelText(/attach a file|attach another/i) as HTMLInputElement

  it('warns against uploading sensitive information and says files are not virus-scanned', () => {
    renderPage()
    expect(screen.getByText(/passwords, account numbers, identity documents/i)).toBeInTheDocument()
    expect(screen.getByText(/can’t scan uploads for viruses/i)).toBeInTheDocument()
  })

  it('states the limits so they are not discovered by failure', () => {
    renderPage()
    expect(screen.getByText(/Up to 3 files, 5 MB each and 10 MB in total/i)).toBeInTheDocument()
    expect(screen.getByText(/PNG, JPEG, WebP or PDF/i)).toBeInTheDocument()
  })

  it('accepts a supported image and lists it for removal', async () => {
    renderPage()
    fireEvent.change(input(), { target: { files: [file('screenshot.png', 'image/png', 2048)] } })
    expect(await screen.findByText('screenshot.png')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /remove screenshot\.png/i }))
    await waitFor(() => expect(screen.queryByText('screenshot.png')).not.toBeInTheDocument())
  })

  it('rejects an unsupported type — including SVG, which is script-bearing', async () => {
    renderPage()
    fireEvent.change(input(), { target: { files: [file('logo.svg', 'image/svg+xml', 512)] } })
    expect(await screen.findByText(/only PNG, JPEG, WebP and PDF/i)).toBeInTheDocument()
    expect(screen.queryByText('logo.svg')).not.toBeInTheDocument()
  })

  it('rejects a file over 5 MB', async () => {
    renderPage()
    fireEvent.change(input(), { target: { files: [file('huge.png', 'image/png', 5 * 1024 * 1024 + 1)] } })
    expect(await screen.findByText(/5 MB or smaller/i)).toBeInTheDocument()
  })

  it('rejects a fourth file', async () => {
    renderPage()
    for (const n of ['a.png', 'b.png', 'c.png']) {
      fireEvent.change(input(), { target: { files: [file(n, 'image/png', 1024)] } })
      await screen.findByText(n)
    }
    fireEvent.change(input(), { target: { files: [file('d.png', 'image/png', 1024)] } })
    // Scoped to the live error, not the static hint that uses similar wording.
    expect(await screen.findByRole('alert')).toHaveTextContent(/up to 3 files/i)
    expect(screen.queryByText('d.png')).not.toBeInTheDocument()
  })

  it('passes the selected files to the submission', async () => {
    renderPage()
    fireEvent.change(input(), { target: { files: [file('shot.png', 'image/png', 1024)] } })
    await screen.findByText('shot.png')
    fireEvent.input(screen.getByPlaceholderText(/describe the problem/i), { target: { value: 'The filter chips overlap the header.' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /submit bug report/i }))
    await waitFor(() => expect(submitBugReport).toHaveBeenCalledTimes(1))
    const sent = submitBugReport.mock.calls[0][0] as { attachments: File[] }
    expect(sent.attachments).toHaveLength(1)
    expect(sent.attachments[0].name).toBe('shot.png')
  })

  it('tells the reporter plainly when the report saved but a file did not', async () => {
    submitBugReport.mockResolvedValueOnce({ reference: 'BUG-TEST1234', attachmentsStored: 0, attachmentsFailed: true })
    renderPage()
    fireEvent.input(screen.getByPlaceholderText(/describe the problem/i), { target: { value: 'The filter chips overlap the header.' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /submit bug report/i }))
    expect(await screen.findByText(/could not store the file you attached/i)).toBeInTheDocument()
    // The report itself is still confirmed — the failure is scoped honestly.
    expect(screen.getByText('BUG-TEST1234')).toBeInTheDocument()
  })

  it('surfaces a server-side attachment rejection against the file field, not the whole report', async () => {
    submitBugReport.mockRejectedValueOnce(new Error('attachment_type_rejected'))
    renderPage()
    fireEvent.input(screen.getByPlaceholderText(/describe the problem/i), { target: { value: 'The filter chips overlap the header.' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /submit bug report/i }))
    expect(await screen.findByText(/only genuine PNG, JPEG, WebP and PDF files/i)).toBeInTheDocument()
    expect(screen.queryByText(/could not submit your report/i)).not.toBeInTheDocument()
  })
})

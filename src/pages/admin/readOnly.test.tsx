import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* ===========================================================================
   Read-only enforcement (Prompt 2). Phase 2 must READ existing operational data
   and never mutate it — no approve/reject/moderate/assign/dismiss/mark-read/etc.
   This is proven two ways: (1) a static audit that the admin data layer performs
   no database writes and calls no mutating RPC, and (2) a render check that no
   forbidden mutation control appears on a representative page or its detail view.
   =========================================================================== */

// Every admin source file (excluding tests) as raw text.
const adminFiles = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const dataLayer = import.meta.glob('../../lib/adminApi.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const isTest = (p: string) => /\.test\.tsx?$/.test(p)

describe('read-only enforcement — static audit', () => {
  it('the admin data layer performs no database writes', () => {
    // .insert/.update/.upsert/.delete on the Supabase client would mutate data.
    // Only adminApi.ts touches the client, so a write anywhere here is a leak.
    const WRITE = /\.(insert|update|upsert|delete)\s*\(/
    const offenders: string[] = []
    for (const [path, content] of Object.entries(dataLayer)) {
      content.split('\n').forEach((line, i) => {
        if (WRITE.test(line)) offenders.push(`${path}:${i + 1}: ${line.trim()}`)
      })
    }
    expect(offenders, `Unexpected write call in the admin data layer:\n${offenders.join('\n')}`).toEqual([])
  })

  it('calls no mutating RPC — every rpc() is a read model', () => {
    const MUTATING_RPC = /\.rpc\(\s*['"][^'"]*(update|approve|reject|moderate|resolve|dismiss|assign|suspend|create|delete|insert|mark_)[^'"]*['"]/i
    const offenders: string[] = []
    for (const [path, content] of Object.entries({ ...adminFiles, ...dataLayer })) {
      if (isTest(path)) continue
      content.split('\n').forEach((line, i) => {
        if (MUTATING_RPC.test(line)) offenders.push(`${path}:${i + 1}: ${line.trim()}`)
      })
    }
    expect(offenders, `Mutating RPC call found:\n${offenders.join('\n')}`).toEqual([])
  })

  it('exports only read (getX) accessors from the data layer', () => {
    const src = Object.values(dataLayer)[0]
    const exportedFns = [...src.matchAll(/export async function (\w+)/g)].map(m => m[1])
    expect(exportedFns.length).toBeGreaterThan(0)
    const nonRead = exportedFns.filter(name => !/^get/.test(name))
    expect(nonRead, `Non-read exports in adminApi:\n${nonRead.join('\n')}`).toEqual([])
  })
})

/* --------------------------- render enforcement ---------------------------- */

const notifications = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'question_reported',
    title: 'A question was reported',
    message: 'Reported for off-topic content.',
    severity: 'high',
    entityType: 'question',
    entityId: 'q1',
    actionPath: '/admin/reports',
    readAt: undefined,
    dismissedAt: undefined,
    createdAt: new Date().toISOString(),
  },
]

vi.mock('../../lib/adminApi', () => ({
  getNotifications: vi.fn(async () => ({ rows: notifications, total: notifications.length })),
}))

// Any control that would change state is forbidden in this read-only phase.
const FORBIDDEN_CONTROL = /\b(approve|reject|moderate|resolve|dismiss|assign|suspend|delete|remove|hide|restore|archive|ban|warn|mark as read|mark read|publish|close)\b/i

function forbiddenButtons(root: HTMLElement) {
  return Array.from(root.querySelectorAll('button, a[role="button"]'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(text => FORBIDDEN_CONTROL.test(text))
}

describe('read-only enforcement — rendered page', () => {
  beforeEach(async () => {
    const { NotificationsPage } = await import('./pages/NotificationsPage')
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <NotificationsPage />
      </MemoryRouter>,
    )
  })

  it('renders notification data and no mutation controls', async () => {
    await waitFor(() => expect(screen.getByText('A question was reported')).toBeInTheDocument())
    expect(forbiddenButtons(document.body)).toEqual([])
  })

  it('opening a record shows a read-only detail drawer with no mutation controls', async () => {
    const row = await screen.findByText('A question was reported')
    fireEvent.click(row)
    const dialog = await screen.findByRole('dialog')
    // The message is visible in the drawer…
    expect(within(dialog).getByText(/off-topic content/i)).toBeInTheDocument()
    // …and the only controls are the read-only Close + copy-id, never a mutation.
    expect(forbiddenButtons(dialog)).toEqual([])
  })
})

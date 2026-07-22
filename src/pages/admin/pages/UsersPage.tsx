import { getUsers, type AdminUser } from '../../../lib/adminApi'
import { formatDateTime, humanize, timeAgo } from '../../../lib/adminFormat'
import { AdminListPage, type Column } from '../components/AdminListPage'
import { Chip, CopyId, Field } from '../components/adminUi'

const columns: Column<AdminUser>[] = [
  {
    header: 'User',
    render: u => (
      <span>
        <b>{u.username ?? u.displayName ?? 'Unnamed'}</b>
        {u.displayName && u.username && <span className="admin-sub"> · {u.displayName}</span>}
      </span>
    ),
  },
  { header: 'Verified', render: u => (u.emailConfirmed ? <Chip tone="success">Verified</Chip> : <Chip tone="high">Unverified</Chip>) },
  { header: 'Questions', render: u => u.questionsCount },
  { header: 'Supported', render: u => u.supportedCount },
  { header: 'Joined', render: u => timeAgo(u.createdAt) },
]

export function UsersPage() {
  return (
    <AdminListPage<AdminUser>
      title="Users"
      description="Accounts and their public activity. Email addresses are never displayed here; you can still search by email. No passwords or credentials are ever exposed."
      searchPlaceholder="Username, display name, or email"
      columns={columns}
      gridTemplate="1.8fr 1fr 0.8fr 0.8fr 0.7fr"
      getRowKey={u => u.id}
      fetchPage={({ search, offset, limit }) => getUsers({ search, offset, limit }).then(rows => ({ rows, total: rows[0]?.totalCount ?? rows.length }))}
      emptyTitle="No users found"
      emptyMessage="No accounts match your search."
      detailTitle={u => u.username ?? u.displayName ?? 'User'}
      renderDetail={u => (
        <div className="admin-detail">
          <div className="admin-detail-chips">
            {u.emailConfirmed ? <Chip tone="success">Verified</Chip> : <Chip tone="high">Unverified</Chip>}
            {u.investorType && <Chip tone="muted">{humanize(u.investorType)}</Chip>}
          </div>
          <Field label="Username">{u.username ?? '—'}</Field>
          <Field label="Display name">{u.displayName ?? '—'}</Field>
          <Field label="Investor type">{humanize(u.investorType)}</Field>
          <Field label="Joined">{formatDateTime(u.createdAt)}</Field>
          <Field label="Last sign-in">{formatDateTime(u.lastSignInAt)}</Field>
          <div className="admin-user-stats">
            <Field label="Questions">{u.questionsCount}</Field>
            <Field label="Votes">{u.votesCount}</Field>
            <Field label="Supported">{u.supportedCount}</Field>
            <Field label="Requests">{u.requestsCount}</Field>
            <Field label="Reports filed">{u.reportsSubmitted}</Field>
            <Field label="Bug reports">{u.bugReportsCount}</Field>
            <Field label="Support tickets">{u.supportTicketsCount}</Field>
          </div>
          <Field label="User ID">
            <CopyId id={u.id} />
          </Field>
        </div>
      )}
    />
  )
}

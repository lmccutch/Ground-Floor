import { Link, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './RequireAdmin'
import { AdminLayout } from './AdminLayout'
import { AdminRefreshProvider } from './components/refresh'
import { OverviewPage } from './pages/OverviewPage'
import { QueuePage } from './pages/QueuePage'
import { CompanyRequestsPage } from './pages/CompanyRequestsPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { QuestionsPage } from './pages/QuestionsPage'
import { ReportsPage } from './pages/ReportsPage'
import { BugsPage } from './pages/BugsPage'
import { SupportPage } from './pages/SupportPage'
import { UsersPage } from './pages/UsersPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { SystemPage } from './pages/SystemPage'
import './admin.css'

function AdminNotFound() {
  return (
    <div className="admin-empty">
      <p className="admin-empty-title">Page not found</p>
      <p>That admin page doesn’t exist.</p>
      <Link className="btn secondary small" to="/admin">
        Back to overview
      </Link>
    </div>
  )
}

/**
 * The whole admin application, mounted lazily behind `/admin/*` so none of it
 * ships in the public bundle. RequireAdmin wraps every route — a direct URL to
 * any nested page is authorized independently (server-side is_admin() is still
 * the real boundary; this only decides what to render, without flashing content).
 */
export function AdminApp() {
  return (
    <AdminRefreshProvider>
    <Routes>
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="company-requests" element={<CompanyRequestsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="bugs" element={<BugsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Route>
    </Routes>
    </AdminRefreshProvider>
  )
}

export default AdminApp

import { getSystemInfo } from '../../../lib/adminApi'
import { formatDateTime, humanize } from '../../../lib/adminFormat'
import { useAdminQuery } from '../../../hooks/useAdminQuery'
import { AdminError, AdminPageHeader, CheckLine, Field, Loading } from '../components/adminUi'

// Build-time environment facts. These are the only "version" signals the app
// reliably exposes; nothing is invented. import.meta.env.MODE is set by Vite.
const ENVIRONMENT = import.meta.env.MODE
const COMMIT = (import.meta.env.VITE_COMMIT_SHA as string | undefined)?.slice(0, 8)

const NOT_RECORDED = 'Health status is not currently recorded.'

export function SystemPage() {
  const query = useAdminQuery(() => getSystemInfo(), [])

  return (
    <div className="admin-overview">
      <AdminPageHeader
        title="System"
        description="Operational facts the backend actually records. Where reliable health data does not exist, this page says so rather than implying an integration is working."
      />

      {query.error ? (
        <AdminError onRetry={query.reload} />
      ) : query.loading && !query.data ? (
        <Loading />
      ) : (
        query.data && (
          <div className="admin-two-col">
            <section className="admin-panel" aria-labelledby="sys-config">
              <div className="admin-panel-head">
                <h2 id="sys-config">Configuration</h2>
              </div>
              <div className="admin-detail">
                <Field label="Environment">{humanize(ENVIRONMENT)}</Field>
                <Field label="Frontend commit">{COMMIT ?? 'Not recorded at build time'}</Field>
                <Field label="Configured supporter threshold">
                  {query.data.defaultSupporterThreshold != null ? `${query.data.defaultSupporterThreshold} supporters` : 'Unknown'}
                </Field>
              </div>
            </section>

            <section className="admin-panel" aria-labelledby="sys-tables">
              <div className="admin-panel-head">
                <h2 id="sys-tables">Operational data sources</h2>
              </div>
              <p className="admin-panel-note">Each source is probed with a read the administrator is authorized to make. Reachable means the admin read path is working.</p>
              <div className="admin-check-list">
                {query.data.tables.map(t => (
                  <CheckLine key={t.name} ok={t.reachable}>
                    {humanize(t.name)} — {t.reachable ? 'Reachable' : 'Unavailable'}
                  </CheckLine>
                ))}
              </div>
            </section>

            <section className="admin-panel" aria-labelledby="sys-health">
              <div className="admin-panel-head">
                <h2 id="sys-health">Operational events</h2>
              </div>
              <p className="admin-panel-note">
                These reflect failure events the backend has recorded as admin notifications. An absent value means no such event has been recorded — not that the channel is
                confirmed healthy.
              </p>
              <div className="admin-detail">
                <Field label="Last recorded email failure">{query.data.lastEmailFailure ? formatDateTime(query.data.lastEmailFailure) : NOT_RECORDED}</Field>
                <Field label="Last recorded webhook failure">{query.data.lastWebhookFailure ? formatDateTime(query.data.lastWebhookFailure) : NOT_RECORDED}</Field>
                <Field label="Last recorded security alert">{query.data.lastSecurityAlert ? formatDateTime(query.data.lastSecurityAlert) : NOT_RECORDED}</Field>
              </div>
            </section>

            <section className="admin-panel" aria-labelledby="sys-integrations">
              <div className="admin-panel-head">
                <h2 id="sys-integrations">Integration status</h2>
              </div>
              <div className="admin-check-list">
                <CheckLine ok={false}>Public bug-report form — not connected (bug reports stay empty until one is added)</CheckLine>
                <CheckLine ok={false}>Contact → support-ticket bridge — not connected (support stays empty until wired)</CheckLine>
              </div>
            </section>
          </div>
        )
      )}
    </div>
  )
}

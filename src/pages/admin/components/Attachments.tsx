import { useState } from 'react'
import { AlertTriangle, Download, Eye, FileText, ImageIcon, Loader2 } from 'lucide-react'
import { getAttachmentUrl, type RecordAttachment } from '../../../lib/adminApi'
import { Empty } from './adminUi'

/* ===========================================================================
   Admin attachment viewer.

   Files live in a PRIVATE storage bucket. Nothing here holds a durable URL: each
   view or download mints a fresh 60-second signed URL through an Edge Function
   that verifies is_admin() and audits the access. A URL is never stored in state
   beyond the current preview, and never rendered into the DOM as a persistent
   link.

   Handling decisions, made deliberately:
     * IMAGES are previewed inline. They are already restricted to PNG/JPEG/WebP
       and verified by magic bytes at upload, so they cannot carry script.
     * PDFs are NEVER embedded. An untrusted PDF in an <iframe> or <embed> runs
       in the admin's origin context; opening it in a fresh tab from a signed URL
       keeps it in the browser's own sandboxed viewer instead.
   =========================================================================== */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (mime: string) => mime.startsWith('image/')

function AttachmentRow({ attachment }: { attachment: RecordAttachment }) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function open(intent: 'view' | 'download') {
    setBusy(intent)
    setError(null)
    try {
      const signed = await getAttachmentUrl({ attachmentId: attachment.id, intent })
      if (intent === 'view' && isImage(attachment.mimeType)) {
        setPreview(signed.url)
      } else {
        // PDFs and downloads open in a new, unprivileged tab — never embedded in
        // the admin document. noopener/noreferrer stops the opened page reaching
        // back into the console or leaking the signed URL as a referrer.
        window.open(signed.url, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      setError((e as Error)?.message ?? 'That attachment could not be opened.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="admin-attachment">
      <div className="admin-attachment-head">
        <span className="admin-attachment-icon" aria-hidden="true">
          {isImage(attachment.mimeType) ? <ImageIcon size={15} /> : <FileText size={15} />}
        </span>
        <span className="admin-attachment-name">{attachment.filename}</span>
        <span className="admin-attachment-meta">
          {attachment.mimeType.replace('application/', '').replace('image/', '').toUpperCase()} · {formatSize(attachment.sizeBytes)}
        </span>
      </div>

      <div className="admin-attachment-actions">
        <button className="btn ghost small" onClick={() => void open('view')} disabled={busy != null} aria-busy={busy === 'view'}>
          {busy === 'view' ? <Loader2 className="spin" size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}{' '}
          {isImage(attachment.mimeType) ? 'Preview' : 'Open in new tab'}
        </button>
        <button className="btn ghost small" onClick={() => void open('download')} disabled={busy != null} aria-busy={busy === 'download'}>
          {busy === 'download' ? <Loader2 className="spin" size={13} aria-hidden="true" /> : <Download size={13} aria-hidden="true" />} Download
        </button>
      </div>

      {error && (
        <p className="admin-action-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}

      {preview && (
        <div className="admin-attachment-preview">
          <img src={preview} alt={`Attachment: ${attachment.filename}`} />
          <button className="btn ghost small" onClick={() => setPreview(null)}>
            Close preview
          </button>
        </div>
      )}
    </li>
  )
}

export function Attachments({ attachments }: { attachments: RecordAttachment[] }) {
  if (attachments.length === 0) {
    return <Empty title="No attachments" message="Nothing was attached to this report." />
  }
  return (
    <>
      <p className="admin-inline-note">
        These files were uploaded by a member of the public and are <strong>not scanned for malware</strong>. Only PNG,
        JPEG, WebP and PDF are accepted, and the type is verified from the file's own contents at upload. Each view is
        recorded in the audit log.
      </p>
      <ul className="admin-attachment-list">
        {attachments.map(a => (
          <AttachmentRow key={a.id} attachment={a} />
        ))}
      </ul>
    </>
  )
}

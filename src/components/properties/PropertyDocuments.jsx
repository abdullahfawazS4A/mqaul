import { useEffect, useRef, useState } from 'react'
import Card, { CardHeader } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Modal from '../ui/Modal.jsx'
import { ErrorMessage } from '../ui/Field.jsx'
import { getFile } from '../../data/files.js'
import { formatDate } from '../../utils/format.js'

const ACCEPT = 'image/*,application/pdf'
const MAX_BYTES = 25 * 1024 * 1024 // حدٌّ عمليّ يمنع إغراق خزانة المتصفح

export function formatBytes(n) {
  const b = Number(n) || 0
  if (b < 1024) return `${b} بايت`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} كيلوبايت`
  return `${(b / 1024 / 1024).toFixed(1)} ميغابايت`
}

const isImage = (doc) => (doc.mime || '').startsWith('image/')
const isPdf = (doc) => (doc.mime || '') === 'application/pdf'

/** صورة مصغّرة تُقرأ من خزانة الملفات عند الحاجة فقط. */
function Thumb({ doc }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!isImage(doc)) return
    let revoked = false
    let objectUrl = ''
    getFile(doc.id)
      .then((blob) => {
        if (!blob || revoked) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc.id])

  if (isImage(doc) && url) {
    return (
      <img
        src={url}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
      />
    )
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500">
      {isPdf(doc) ? 'PDF' : 'ملف'}
    </div>
  )
}

/** معاينة المستند بحجمه الكامل. */
function Preview({ doc, onClose }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl = ''
    let gone = false
    getFile(doc.id)
      .then((blob) => {
        if (gone) return
        if (!blob) {
          setFailed(true)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => setFailed(true))
    return () => {
      gone = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc.id])

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Modal
      open
      title={doc.name}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{formatBytes(doc.size)}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
            <Button variant="primary" onClick={download} disabled={!url}>
              <Icon name="arrowDown" className="h-4 w-4" />
              تنزيل
            </Button>
          </div>
        </div>
      }
    >
      {failed ? (
        <ErrorMessage>الملف غير موجود في هذا المتصفح.</ErrorMessage>
      ) : !url ? (
        <p className="py-8 text-center text-sm text-slate-400">جارٍ الفتح…</p>
      ) : isImage(doc) ? (
        <img src={url} alt={doc.name} className="mx-auto max-h-[70vh] rounded-lg" />
      ) : isPdf(doc) ? (
        <object data={url} type="application/pdf" className="h-[70vh] w-full rounded-lg">
          <p className="py-8 text-center text-sm text-slate-500">
            المتصفح لا يعرض PDF هنا — استخدم زر التنزيل.
          </p>
        </object>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          لا يمكن معاينة هذا النوع — استخدم زر التنزيل.
        </p>
      )}
    </Modal>
  )
}

/**
 * مستندات العقار: رفع صور وملفات PDF، معاينتها، تنزيلها وحذفها.
 * الملفات تُحفظ في IndexedDB لا في localStorage — انظر data/files.js.
 */
export default function PropertyDocuments({ documents, onUpload, onDelete }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const pick = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = '' // حتى يعمل اختيار نفس الملف مرة أخرى
    if (files.length === 0) return

    const tooBig = files.find((f) => f.size > MAX_BYTES)
    if (tooBig) {
      setError(`«${tooBig.name}» أكبر من ${formatBytes(MAX_BYTES)} — اختر ملفًا أصغر.`)
      return
    }

    setError('')
    setBusy(true)
    for (const file of files) {
      const res = await onUpload(file)
      if (res?.ok === false) {
        setError(res.error)
        break
      }
    }
    setBusy(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="مستندات العقار"
        subtitle={
          documents.length > 0
            ? `${documents.length} مستند — صور وملفات PDF`
            : 'صور وملفات PDF — الطابو، العقود، الصور'
        }
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Icon name="plus" className="h-4 w-4" />
            {busy ? 'جارٍ الرفع…' : 'رفع مستند'}
          </Button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={pick}
        className="hidden"
      />

      {error && (
        <div className="px-4 pt-3">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState text="لا توجد مستندات بعد." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setPreview(doc)}
                className="flex min-w-0 flex-1 items-center gap-3 text-right"
              >
                <Thumb doc={doc} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {doc.name}
                  </span>
                  <span className="num block text-xs text-slate-400">
                    {formatBytes(doc.size)} · {formatDate(doc.addedAt)}
                  </span>
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(doc)}
                aria-label="حذف المستند"
                className="shrink-0 print:hidden"
              >
                <Icon name="trash" className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {preview && <Preview doc={preview} onClose={() => setPreview(null)} />}
    </Card>
  )
}

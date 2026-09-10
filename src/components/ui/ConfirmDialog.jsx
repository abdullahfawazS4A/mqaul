import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { Input } from './Field.jsx'

/**
 * تأكيد الحذف — خطوة مقصودة حتى لا يتم المسح بضغطة واحدة.
 * إذا مُرِّر confirmPhrase وجب كتابته حرفيًا لتفعيل زر الحذف.
 */
export default function ConfirmDialog({
  open,
  title = 'تأكيد الحذف',
  message,
  details,
  confirmPhrase,
  confirmLabel = 'حذف نهائي',
  onConfirm,
  onClose,
}) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  if (!open) return null

  const ready = !confirmPhrase || typed.trim() === confirmPhrase.trim()

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-sm font-medium text-red-800">{message}</p>
          {details && <p className="mt-1 text-xs text-red-700">{details}</p>}
          <p className="mt-1 text-xs text-red-700">لا يمكن التراجع عن هذه العملية.</p>
        </div>

        {confirmPhrase && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              للتأكيد اكتب: <span className="font-semibold text-slate-800">{confirmPhrase}</span>
            </span>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            disabled={!ready}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

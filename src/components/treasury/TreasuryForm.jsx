import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field, { ErrorMessage, Input, NumberInput, Textarea } from '../ui/Field.jsx'
import { todayISO } from '../../utils/format.js'

/**
 * نموذج إضافة/تعديل عملية صيرفة — إيداع (in) أو استلام/سحب (out).
 * onSubmit تُعيد { ok, error } — يُعرض الخطأ داخل النموذج دون إغلاقه.
 */
export default function TreasuryForm({ open, type, initial, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isDeposit = type === 'in'
  const isEdit = Boolean(initial)

  useEffect(() => {
    if (!open) return
    setAmount(initial ? String(initial.amount) : '')
    setDate(initial?.date || todayISO())
    setNote(initial?.note || '')
    setError('')
  }, [open, type, initial])

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    const res = onSubmit({ type, amount: value, date, note })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  const title = isEdit
    ? `تعديل ${isDeposit ? 'إيداع' : 'استلام / سحب'}`
    : isDeposit
      ? 'إضافة إيداع'
      : 'إضافة استلام / سحب'

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label="المبلغ">
          <NumberInput
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </Field>

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="ملاحظة / السبب">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: دفعة من مشروع ..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant={isDeposit ? 'success' : 'primary'}>
            حفظ
          </Button>
        </div>
      </form>
    </Modal>
  )
}

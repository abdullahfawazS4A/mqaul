import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field, { ErrorMessage, Input, NumberInput, Textarea } from '../ui/Field.jsx'
import { CURRENCY, formatMoney, todayISO } from '../../utils/format.js'

/**
 * نموذج إضافة دين أو سند قبض لشخص معيّن.
 * onSubmit تُعيد { ok, error } — يُعرض الخطأ داخل النموذج دون إغلاقه.
 */
export default function DebtEntryForm({ open, kind, person, limit, onClose, onSubmit }) {
  const isDebt = kind === 'debt'
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setDate(todayISO())
      setNote('')
      setError('')
    }
  }, [open, kind, person?.id])

  if (!person) return null

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    const result = onSubmit({ personId: person.id, amount: value, date, note })
    if (result?.ok) {
      onClose()
    } else {
      setError(result?.error || 'تعذّر حفظ العملية.')
    }
  }

  return (
    <Modal
      open={open}
      title={`${isDebt ? 'إضافة دين' : 'إضافة سند قبض'} — ${person.name}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {isDebt ? 'الرصيد الكلي المتاح: ' : 'دين الشخص الحالي: '}
          <span className="num font-semibold text-slate-800">{formatMoney(limit)}</span> {CURRENCY}
        </div>

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

        <Field label="ملاحظة (اختياري)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant={isDebt ? 'primary' : 'success'}>
            حفظ
          </Button>
        </div>
      </form>
    </Modal>
  )
}

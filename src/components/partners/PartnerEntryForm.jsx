import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput, Textarea } from '../ui/Field.jsx'
import { PARTNER_NAMES } from '../../data/mockData.js'
import { todayISO } from '../../utils/format.js'

/**
 * قيد بين الشريكين.
 * «من» هو من دفع، و«إلى» هو من استلم — فيزيد ما يطلبه الدافع من المستلم.
 */
export default function PartnerEntryForm({ open, initial, onClose, onSubmit }) {
  const [from, setFrom] = useState(PARTNER_NAMES[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFrom(initial?.from || PARTNER_NAMES[0])
    setAmount(initial ? String(initial.amount) : '')
    setDate(initial?.date || todayISO())
    setNote(initial?.note || '')
    setError('')
  }, [open, initial])

  if (!open) return null

  const to = PARTNER_NAMES.find((n) => n !== from) || PARTNER_NAMES[1]

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    const res = onSubmit({ from, to, amount: value, date, note })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'تعديل القيد' : 'قيد جديد'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">اتجاه القيد</span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm">
              {from}
            </span>
            <Icon name="back" className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm">
              {to}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => setFrom(to)}
              aria-label="عكس الاتجاه"
            >
              عكس
            </Button>
          </div>
          <span className="mt-1 block text-xs text-slate-400">
            {from} دفع إلى {to} — فيزيد ما يطلبه {from} من {to}.
          </span>
        </div>

        <Field label="المبلغ">
          <MoneyInput value={amount} onChange={setAmount} placeholder="0" autoFocus />
        </Field>

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="ملاحظة / السبب">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: دفعة نقدية عن مشروع ..."
          />
        </Field>

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit">حفظ</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

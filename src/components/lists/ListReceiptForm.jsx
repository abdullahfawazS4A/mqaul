import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput, Textarea } from '../ui/Field.jsx'
import { CURRENCY, formatMoney, todayISO } from '../../utils/format.js'

/**
 * سند قبض على دين القوائم.
 * لا يمسّ الصيرفة ولا رأس المال ولا رصيد الشخص النقدي — ينقص دين القوائم فقط.
 */
export default function ListReceiptForm({ open, person, debt = 0, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount('')
    setDate(todayISO())
    setNote('')
    setError('')
  }, [open, person])

  if (!open || !person) return null

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    const res = onSubmit({ personId: person.id, amount: value, date, note })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} title={`سند قبض — ${person.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-500">دين القوائم الحالي</p>
          <p className="num mt-0.5 text-lg font-semibold text-slate-800">
            {formatMoney(debt)} <span className="text-xs font-normal text-slate-400">{CURRENCY}</span>
          </p>
        </div>

        <Field label="المبلغ المقبوض" hint="يُنقِص دين القوائم فقط — بلا أثر على الصيرفة أو رأس المال">
          <MoneyInput value={amount} onChange={setAmount} placeholder="0" autoFocus />
        </Field>

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="ملاحظة">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: دفعة من ربح قائمة رقم ..."
          />
        </Field>

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="success">
            حفظ السند
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

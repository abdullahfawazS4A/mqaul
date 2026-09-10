import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field, { ErrorMessage, Input, NumberInput, Textarea } from '../ui/Field.jsx'
import { todayISO } from '../../utils/format.js'

/** نموذج إضافة عملية صيرفة — إيداع (in) أو استلام/سحب (out). */
export default function TreasuryForm({ open, type, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isDeposit = type === 'in'

  const reset = () => {
    setAmount('')
    setDate(todayISO())
    setNote('')
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    onSubmit({ type, amount: value, date, note })
    close()
  }

  return (
    <Modal open={open} title={isDeposit ? 'إضافة إيداع' : 'إضافة استلام / سحب'} onClose={close}>
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
          <Button variant="secondary" onClick={close}>
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

import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field, { ErrorMessage, Input, NumberInput, Select, Textarea } from '../ui/Field.jsx'

const EMPTY = {
  personName: '',
  listNumber: '',
  notes: '',
  value: '',
  profit: '',
  status: 'unpaid',
}

/** نموذج إضافة/تعديل قائمة — أرقام للعرض فقط، بلا أثر حسابي. */
export default function ListForm({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            personName: initial.personName,
            listNumber: initial.listNumber,
            notes: initial.notes,
            value: String(initial.value),
            profit: String(initial.profit),
            status: initial.status,
          }
        : EMPTY,
    )
    setError('')
  }, [open, initial])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.personName.trim()) {
      setError('اسم الشخص مطلوب.')
      return
    }
    if (!form.listNumber.trim()) {
      setError('رقم القائمة مطلوب.')
      return
    }
    onSubmit({ ...form, value: Number(form.value) || 0, profit: Number(form.profit) || 0 })
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'تعديل قائمة' : 'إضافة قائمة'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="اسم الشخص">
            <Input value={form.personName} onChange={set('personName')} autoFocus />
          </Field>

          <Field label="رقم القائمة">
            <Input value={form.listNumber} onChange={set('listNumber')} className="num text-right" />
          </Field>

          <Field label="قيمة القائمة" hint="للعرض فقط — بلا أثر على الصيرفة أو الديون">
            <NumberInput value={form.value} onChange={set('value')} placeholder="0" />
          </Field>

          <Field label="ربح القائمة">
            <NumberInput value={form.profit} onChange={set('profit')} placeholder="0" />
          </Field>
        </div>

        <Field label="حالة الربح">
          <Select value={form.status} onChange={set('status')}>
            <option value="paid">واصل (مقبوض)</option>
            <option value="unpaid">دين (غير مقبوض)</option>
          </Select>
        </Field>

        <Field label="ملاحظات">
          <Textarea value={form.notes} onChange={set('notes')} />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit">حفظ</Button>
        </div>
      </form>
    </Modal>
  )
}

import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput, Select, Textarea } from '../ui/Field.jsx'
import Combobox from '../ui/Combobox.jsx'
import { todayISO } from '../../utils/format.js'

const EMPTY = {
  personId: '',
  listNumber: '',
  date: '',
  notes: '',
  value: '',
  profit: '',
  status: 'unpaid',
}

/**
 * نموذج إضافة/تعديل قائمة.
 * الشخص يُختار من الأشخاص المسجّلين في الديون فقط — لا كتابة اسم حر.
 */
export default function ListForm({ open, initial, people, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            personId: initial.personId,
            listNumber: initial.listNumber,
            date: initial.date || todayISO(),
            notes: initial.notes,
            value: String(initial.value),
            profit: String(initial.profit),
            status: initial.status,
          }
        : { ...EMPTY, date: todayISO() },
    )
    setError('')
  }, [open, initial])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // حقول المبالغ تُمرّر النص الخام مباشرةً بدل حدث الإدخال
  const setField = (key) => (raw) => setForm((f) => ({ ...f, [key]: raw }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.personId) {
      setError('اختر الشخص من قائمة الأشخاص المسجّلين في الديون.')
      return
    }
    if (!form.listNumber.trim()) {
      setError('رقم القائمة مطلوب.')
      return
    }
    const res = onSubmit({
      ...form,
      value: Number(form.value) || 0,
      profit: Number(form.profit) || 0,
    })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  const personOptions = useMemo(
    () => people.map((p) => ({ id: p.id, label: p.name, hint: p.phone || '' })),
    [people],
  )

  const noPeople = people.length === 0

  return (
    <Modal open={open} title={initial ? 'تعديل قائمة' : 'إضافة قائمة'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        {noPeople && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            لا يوجد أشخاص مسجّلون — أضف مستخدمًا من صفحة «الديون» أولًا.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="اسم الشخص" hint="اكتب للبحث ثم اختر من النتائج">
            <Combobox
              value={form.personId}
              onChange={(id) => setForm((f) => ({ ...f, personId: id }))}
              options={personOptions}
              placeholder="اكتب اسم الشخص…"
              emptyText="لا يوجد شخص بهذا الاسم."
              disabled={noPeople}
              autoFocus
            />
          </Field>

          <Field label="رقم القائمة">
            <Input value={form.listNumber} onChange={set('listNumber')} className="num text-right" />
          </Field>

          <Field label="تاريخ القائمة">
            <Input type="date" value={form.date} onChange={set('date')} />
          </Field>

          <Field label="قيمة القائمة" hint="للعرض فقط — بلا أثر على الصيرفة أو رأس المال">
            <MoneyInput value={form.value} onChange={setField('value')} placeholder="0" />
          </Field>

          <Field label="ربح القائمة" hint="غير المقبوض منه يُحتسب دينًا على الشخص">
            <MoneyInput value={form.profit} onChange={setField('profit')} placeholder="0" />
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

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={noPeople}>
            حفظ
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

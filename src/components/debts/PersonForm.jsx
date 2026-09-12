import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, Textarea } from '../ui/Field.jsx'

/** إضافة/تعديل مستخدم (شخص). نفس الشخص يُستخدم في الديون وفي القوائم. */
export default function PersonForm({ open, initial, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name || '')
    setPhone(initial?.phone || '')
    setNotes(initial?.notes || '')
    setError('')
  }, [open, initial])

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('الاسم مطلوب.')
      return
    }
    onSubmit({ name: name.trim(), phone: phone.trim(), notes: notes.trim() })
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label="الاسم">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>

        <Field label="رقم الهاتف (اختياري)">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            className="num text-right"
          />
        </Field>

        <Field label="ملاحظات (اختياري)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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

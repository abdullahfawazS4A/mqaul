import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field, { ErrorMessage, Input, Textarea } from '../ui/Field.jsx'

/** إضافة مستخدم (شخص له دين). */
export default function PersonForm({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const close = () => {
    setName('')
    setPhone('')
    setNotes('')
    setError('')
    onClose()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('الاسم مطلوب.')
      return
    }
    onSubmit({ name, phone, notes })
    close()
  }

  return (
    <Modal open={open} title="إضافة مستخدم" onClose={close}>
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

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={close}>
            إلغاء
          </Button>
          <Button type="submit">حفظ</Button>
        </div>
      </form>
    </Modal>
  )
}

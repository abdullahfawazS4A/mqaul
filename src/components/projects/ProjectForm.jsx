import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import Field, { ErrorMessage, Input, NumberInput } from '../ui/Field.jsx'

/** نموذج إضافة/تعديل مشروع، مع قائمة شركاء ديناميكية. */
export default function ProjectForm({ open, initial, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [company, setCompany] = useState('')
  const [partners, setPartners] = useState([''])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name || '')
    setValue(initial ? String(initial.value) : '')
    setCompany(initial?.company || '')
    setPartners(initial?.partners?.length ? [...initial.partners] : [''])
    setError('')
  }, [open, initial])

  const setPartner = (index, val) =>
    setPartners((prev) => prev.map((p, i) => (i === index ? val : p)))

  const removePartner = (index) =>
    setPartners((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)))

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('اسم المشروع مطلوب.')
      return
    }
    onSubmit({
      name,
      value: Number(value) || 0,
      company,
      partners: partners.filter((p) => p.trim()),
    })
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'تعديل المشروع' : 'إضافة مشروع جديد'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label="اسم المشروع">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="القيمة المالية">
            <NumberInput value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </Field>

          <Field label="الشركة المنفذة">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">الشركاء</span>
          <div className="space-y-2">
            {partners.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={p}
                  onChange={(e) => setPartner(i, e.target.value)}
                  placeholder={`اسم الشريك ${i + 1}`}
                />
                <Button variant="ghost" onClick={() => removePartner(i)} aria-label="حذف الشريك">
                  <Icon name="trash" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => setPartners((prev) => [...prev, ''])}
          >
            <Icon name="plus" className="h-4 w-4" />
            إضافة شريك
          </Button>
        </div>

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

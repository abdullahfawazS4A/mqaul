import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput, Select, Textarea } from '../ui/Field.jsx'
import { PROPERTY_TYPES } from '../../data/mockData.js'
import { todayISO } from '../../utils/format.js'

const EMPTY = {
  name: '',
  type: PROPERTY_TYPES[0],
  purchasePrice: '',
  purchaseDate: '',
  salePrice: '',
  saleDate: '',
  status: 'owned',
  notes: '',
}

/** نموذج إضافة/تعديل عقار. سعر البيع لا يظهر إلا عند تحديد «تم البيع». */
export default function PropertyForm({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [partners, setPartners] = useState([])
  const [partnerDraft, setPartnerDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            name: initial.name,
            type: initial.type || PROPERTY_TYPES[0],
            purchasePrice: String(initial.purchasePrice || ''),
            purchaseDate: initial.purchaseDate || todayISO(),
            salePrice: String(initial.salePrice || ''),
            saleDate: initial.saleDate || '',
            status: initial.status || 'owned',
            notes: initial.notes || '',
          }
        : { ...EMPTY, purchaseDate: todayISO() },
    )
    setPartners(initial?.partners ? [...initial.partners] : [])
    setPartnerDraft('')
    setError('')
  }, [open, initial])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setField = (key) => (raw) => setForm((f) => ({ ...f, [key]: raw }))

  const addPartner = () => {
    const name = partnerDraft.trim()
    if (!name) return
    if (partners.some((p) => p === name)) {
      setPartnerDraft('')
      return
    }
    setPartners((prev) => [...prev, name])
    setPartnerDraft('')
  }

  const sold = form.status === 'sold'

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('اسم العقار مطلوب.')
      return
    }
    if (sold && !(Number(form.salePrice) > 0)) {
      setError('أدخل سعر البيع، أو أزل علامة «تم البيع».')
      return
    }
    const res = onSubmit({
      ...form,
      partners,
      purchasePrice: Number(form.purchasePrice) || 0,
      salePrice: Number(form.salePrice) || 0,
    })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'تعديل عقار' : 'إضافة عقار'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="اسم العقار">
            <Input
              value={form.name}
              onChange={set('name')}
              placeholder="مثال: قطعة أرض الجادرية"
              autoFocus
            />
          </Field>

          <Field label="نوع العقار">
            <Select value={form.type} onChange={set('type')}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="سعر الشراء">
            <MoneyInput
              value={form.purchasePrice}
              onChange={setField('purchasePrice')}
              placeholder="0"
            />
          </Field>

          <Field label="تاريخ الشراء">
            <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
          </Field>
        </div>

        <Field label="الشركاء" hint="اكتب الاسم ثم اضغط «إضافة» — اتركه فارغًا إن كان العقار بلا شركاء">
          <div className="flex gap-2">
            <Input
              value={partnerDraft}
              onChange={(e) => setPartnerDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addPartner()
                }
              }}
              placeholder="اسم الشريك…"
            />
            <Button variant="secondary" onClick={addPartner} className="shrink-0">
              <Icon name="plus" className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </Field>

        {partners.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {partners.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                {p}
                <button
                  type="button"
                  onClick={() => setPartners((prev) => prev.filter((x) => x !== p))}
                  className="text-slate-400 hover:text-red-600"
                  aria-label={`إزالة ${p}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={sold}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.checked ? 'sold' : 'owned',
                saleDate: e.target.checked ? f.saleDate || todayISO() : '',
              }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">تم البيع</span>
        </label>

        {sold && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="سعر البيع">
              <MoneyInput
                value={form.salePrice}
                onChange={setField('salePrice')}
                placeholder="0"
              />
            </Field>
            <Field label="تاريخ البيع">
              <Input type="date" value={form.saleDate} onChange={set('saleDate')} />
            </Field>
          </div>
        )}

        <Field label="ملاحظات">
          <Textarea value={form.notes} onChange={set('notes')} />
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

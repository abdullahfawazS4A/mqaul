import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput } from '../ui/Field.jsx'
import { CURRENCY, formatMoney, todayISO } from '../../utils/format.js'

/**
 * تسجيل بيع عقار بخطوة واحدة — سعر وتاريخ فقط، دون فتح نموذج التعديل كاملًا.
 * يعرض الربح المتوقّع أثناء الكتابة حتى يتبيّن أثر السعر قبل الحفظ.
 */
export default function PropertySaleForm({ open, property, onClose, onSubmit }) {
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setPrice(property?.salePrice ? String(property.salePrice) : '')
    setDate(property?.saleDate || todayISO())
    setError('')
  }, [open, property])

  if (!open || !property) return null

  const value = Number(price) || 0
  const profit = value - Number(property.purchasePrice || 0)

  const submit = (e) => {
    e.preventDefault()
    if (!(value > 0)) {
      setError('أدخل سعر البيع.')
      return
    }
    const res = onSubmit({ status: 'sold', salePrice: value, saleDate: date })
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} title={`تسجيل بيع — ${property.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-500">سعر الشراء</p>
          <p className="num mt-0.5 text-lg font-semibold text-slate-800">
            {formatMoney(property.purchasePrice)}{' '}
            <span className="text-xs font-normal text-slate-400">{CURRENCY}</span>
          </p>
        </div>

        <Field label="سعر البيع">
          <MoneyInput value={price} onChange={setPrice} placeholder="0" autoFocus />
        </Field>

        <Field label="تاريخ البيع">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {value > 0 && (
          <div
            className={`rounded-lg px-3 py-2.5 ${profit < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}
          >
            <p className={`text-xs ${profit < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {profit < 0 ? 'الخسارة' : 'الربح'}
            </p>
            <p
              className={`num mt-0.5 text-lg font-semibold ${
                profit < 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {formatMoney(Math.abs(profit))}{' '}
              <span className="text-xs font-normal">{CURRENCY}</span>
            </p>
          </div>
        )}

        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="success">
            تأكيد البيع
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

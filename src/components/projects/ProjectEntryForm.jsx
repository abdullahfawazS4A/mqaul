import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FormActions from '../ui/FormActions.jsx'
import Field, { ErrorMessage, Input, MoneyInput, Select } from '../ui/Field.jsx'
import { todayISO } from '../../utils/format.js'

const CONFIG = {
  deposits: { add: 'إضافة إيداع شريك', edit: 'تعديل إيداع شريك' },
  expenses: { add: 'إضافة مصروف', edit: 'تعديل مصروف' },
  advances: { add: 'إضافة سلفة مستلمة', edit: 'تعديل سلفة مستلمة' },
}

/**
 * نموذج موحّد لإضافة/تعديل إيداع شريك أو مصروف أو سلفة داخل مشروع.
 * onSubmit تُعيد { ok, error } — يُعرض الخطأ داخل النموذج دون إغلاقه.
 */
export default function ProjectEntryForm({
  open,
  kind,
  initial,
  partners = [],
  onClose,
  onSubmit,
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [partner, setPartner] = useState('')
  const [description, setDescription] = useState('')
  const [spender, setSpender] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(initial ? String(initial.amount) : '')
    setDate(initial?.date || todayISO())
    setPartner(initial?.partner ?? partners[0] ?? '')
    setDescription(initial?.description || '')
    setSpender(initial?.spender || '')
    setSource(initial?.source || '')
    setError('')
  }, [open, kind, initial])

  if (!kind) return null

  const submit = (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر.')
      return
    }
    if (kind === 'deposits' && !partner.trim()) {
      setError('اسم الشريك مطلوب.')
      return
    }
    if (kind === 'expenses' && !description.trim()) {
      setError('وصف المصروف مطلوب.')
      return
    }
    if (kind === 'expenses' && !spender.trim()) {
      setError('اسم من قام بالصرف مطلوب.')
      return
    }
    if (kind === 'advances' && !source.trim()) {
      setError('الجهة/الشخص مطلوب.')
      return
    }

    const payload = { amount: value, date }
    if (kind === 'deposits') payload.partner = partner.trim()
    if (kind === 'expenses') {
      payload.description = description.trim()
      payload.spender = spender.trim()
    }
    if (kind === 'advances') payload.source = source.trim()

    const res = onSubmit(kind, payload)
    if (res && res.ok === false) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} title={CONFIG[kind][initial ? 'edit' : 'add']} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMessage>{error}</ErrorMessage>

        <Field label="المبلغ">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            placeholder="0"
            autoFocus
          />
        </Field>

        {kind === 'deposits' &&
          (partners.length > 0 ? (
            <Field label="الشريك">
              <Select value={partner} onChange={(e) => setPartner(e.target.value)}>
                {partners.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                {partner && !partners.includes(partner) && <option value={partner}>{partner}</option>}
              </Select>
            </Field>
          ) : (
            <Field label="اسم الشريك" hint="لا يوجد شركاء مسجّلون في المشروع — اكتب الاسم يدويًا">
              <Input value={partner} onChange={(e) => setPartner(e.target.value)} />
            </Field>
          ))}

        {kind === 'expenses' && (
          <>
            <Field label="وصف / سبب المصروف">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="من قام بالصرف">
              <Input value={spender} onChange={(e) => setSpender(e.target.value)} />
            </Field>
          </>
        )}

        {kind === 'advances' && (
          <Field label="من جهة / شخص">
            <Input value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        )}

        <Field label="التاريخ">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

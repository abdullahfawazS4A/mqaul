import { useLayoutEffect, useRef } from 'react'
import { groupAmount, sanitizeAmount } from '../../utils/format.js'

const base =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'

export default function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`${base} ${className}`} {...props} />
}

/**
 * حقل المبالغ: يعرض فارزة كل ٣ أرقام أثناء الكتابة ويُعيد القيمة نظيفة (أرقام فقط).
 * onChange تستلم النص الخام مباشرةً — لا e.target.value.
 * لوحة المفاتيح الرقمية تظهر على الموبايل عبر inputMode، مع إبقاء النوع نصًّا
 * لأن type="number" لا يقبل الفوارز.
 */
export function MoneyInput({ value, onChange, className = '', ...props }) {
  const ref = useRef(null)
  const caret = useRef(null)

  // بعد إعادة الرسم: أعِد المؤشر إلى موضعه المنطقي بدل قفزه إلى النهاية
  useLayoutEffect(() => {
    if (caret.current == null || !ref.current) return
    const pos = caret.current
    caret.current = null
    ref.current.setSelectionRange(pos, pos)
  })

  const handleChange = (e) => {
    const el = e.target
    const typed = el.value
    const selection = el.selectionStart ?? typed.length
    // عدد المحارف ذات المعنى قبل المؤشر — الفوارز لا تُحسب
    const meaningful = typed.slice(0, selection).replace(/[^\d.]/g, '').length

    const clean = sanitizeAmount(typed)
    const shown = groupAmount(clean)

    let pos = 0
    let seen = 0
    while (pos < shown.length && seen < meaningful) {
      if (shown[pos] !== ',') seen++
      pos++
    }
    caret.current = pos

    onChange(clean)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={groupAmount(value)}
      onChange={handleChange}
      className={`num text-right ${base} ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea rows={2} className={`${base} ${className}`} {...props} />
}

export function Select({ className = '', ...props }) {
  return <select className={`${base} ${className}`} {...props} />
}

export function ErrorMessage({ children }) {
  if (!children) return null
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
      {children}
    </p>
  )
}

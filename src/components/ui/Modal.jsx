import { useEffect } from 'react'
import useVisualViewport from '../../hooks/useVisualViewport.js'

export default function Modal({ open, title, onClose, children, footer }) {
  const viewport = useVisualViewport(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // عند ظهور لوحة المفاتيح: مرِّر الحقل الذي يكتب فيه المستخدم إلى داخل المساحة المتبقية
  useEffect(() => {
    if (!open || !viewport) return
    const el = document.activeElement
    if (!el || !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
    const id = setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50)
    return () => clearTimeout(id)
  }, [open, viewport?.height])

  if (!open) return null

  // نثبّت الغلاف على المنطقة المرئية فعليًا بدل الشاشة كاملة، فيرتفع المحتوى
  // تلقائيًا فوق لوحة المفاتيح بدل أن يختفي خلفها.
  const shellStyle = viewport
    ? { height: `${viewport.height}px`, top: `${viewport.offsetTop}px` }
    : undefined

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      style={shellStyle}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-full w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[92%] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

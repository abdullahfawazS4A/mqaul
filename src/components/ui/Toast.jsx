import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-700',
}

/** إشعار قصير أسفل الشاشة يؤكّد نجاح العملية أو يعرض خطأها. */
function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3200)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto w-full rounded-xl border px-4 py-2.5 text-right text-sm font-medium shadow-lg transition-opacity hover:opacity-90 ${
        TONES[toast.tone] || TONES.info
      }`}
    >
      {toast.text}
    </button>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback((text, tone = 'success') => {
    if (!text) return
    setToasts((prev) => [...prev, { id: `${Date.now()}_${Math.random()}`, text, tone }])
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 print:hidden lg:bottom-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** notify(text, 'success' | 'error' | 'info') */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast يجب أن يُستخدم داخل <ToastProvider>')
  return ctx
}

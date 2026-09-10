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

export function NumberInput({ className = '', ...props }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      inputMode="decimal"
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

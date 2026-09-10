export default function EmptyState({ text = 'لا توجد بيانات بعد.', children }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      {children}
    </div>
  )
}

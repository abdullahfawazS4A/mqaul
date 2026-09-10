export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-slate-800 sm:text-xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

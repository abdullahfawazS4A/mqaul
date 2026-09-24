import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatDate, formatMoney } from '../../utils/format.js'

function StatusBadge({ status, onClick }) {
  const paid = status === 'paid'
  return (
    <button
      type="button"
      onClick={onClick}
      title="اضغط لتبديل الحالة"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
        paid
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      {paid ? 'واصل (مقبوض)' : 'دين (غير مقبوض)'}
    </button>
  )
}

export default function ListsTable({ lists, onOpen, onEdit, onDelete, onToggleStatus }) {
  if (lists.length === 0) return <EmptyState text="لا توجد قوائم مطابقة." />

  // فتح التفاصيل بالنقر على السطر — مع منع الأزرار من تشغيله.
  const openProps = (l) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => onOpen?.(l),
    onKeyDown: (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        onOpen?.(l)
      }
    },
  })
  const stop = {
    onClick: (ev) => ev.stopPropagation(),
    onKeyDown: (ev) => ev.stopPropagation(),
  }

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {lists.map((l) => (
          <li
            key={l.id}
            {...openProps(l)}
            className="cursor-pointer px-4 py-3 transition-colors active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {l.name || l.personName}
                </p>
                {l.name && (
                  <p className="truncate text-xs text-slate-500">{l.personName}</p>
                )}
                <p className="num text-xs text-slate-400">
                  قائمة رقم {l.listNumber} · {formatDate(l.date)}
                </p>
                {l.notes && <p className="mt-0.5 truncate text-xs text-slate-500">{l.notes}</p>}
              </div>
              <span {...stop}>
                <StatusBadge status={l.status} onClick={() => onToggleStatus(l.id)} />
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-4 text-xs">
                <span className="text-slate-500">
                  القيمة: <span className="num font-semibold text-slate-700">{formatMoney(l.value)}</span>
                </span>
                <span className="text-slate-500">
                  الربح: <span className="num font-semibold text-slate-700">{formatMoney(l.profit)}</span>
                </span>
              </div>
              <div className="flex gap-1" {...stop}>
                <Button variant="ghost" size="sm" onClick={() => onEdit(l)} aria-label="تعديل">
                  <Icon name="edit" className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(l)} aria-label="حذف">
                  <Icon name="trash" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* شاشات أكبر */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">اسم القائمة</th>
              <th className="px-4 py-2.5 font-medium">اسم الشخص</th>
              <th className="px-4 py-2.5 font-medium">رقم القائمة</th>
              <th className="px-4 py-2.5 font-medium">التاريخ</th>
              <th className="px-4 py-2.5 font-medium">القيمة</th>
              <th className="px-4 py-2.5 font-medium">الربح</th>
              <th className="px-4 py-2.5 font-medium">الحالة</th>
              <th className="px-4 py-2.5 font-medium">ملاحظات</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lists.map((l) => (
              <tr key={l.id} {...openProps(l)} className="cursor-pointer hover:bg-slate-50/70">
                <td className="max-w-[12rem] truncate px-4 py-2.5 font-medium text-slate-800">
                  {l.name || '—'}
                </td>
                <td className="px-4 py-2.5 text-slate-700">{l.personName}</td>
                <td className="num px-4 py-2.5 text-slate-500">{l.listNumber}</td>
                <td className="num px-4 py-2.5 text-slate-500">{formatDate(l.date)}</td>
                <td className="num px-4 py-2.5 text-slate-700">{formatMoney(l.value)}</td>
                <td className="num px-4 py-2.5 text-slate-700">{formatMoney(l.profit)}</td>
                <td className="px-4 py-2.5" {...stop}>
                  <StatusBadge status={l.status} onClick={() => onToggleStatus(l.id)} />
                </td>
                <td className="max-w-[12rem] truncate px-4 py-2.5 text-slate-500">
                  {l.notes || '—'}
                </td>
                <td className="px-4 py-2.5 text-left" {...stop}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(l)} aria-label="تعديل">
                      <Icon name="edit" className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(l)} aria-label="حذف">
                      <Icon name="trash" className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

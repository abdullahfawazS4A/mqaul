import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatDate, formatMoney } from '../../utils/format.js'

function TypeBadge({ type }) {
  const isIn = type === 'in'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      <Icon name={isIn ? 'arrowDown' : 'arrowUp'} className="h-3 w-3" />
      {isIn ? 'إيداع' : 'استلام'}
    </span>
  )
}

export default function TreasuryTable({ entries, onOpen, onEdit, onDelete, emptyText }) {
  if (entries.length === 0)
    return <EmptyState text={emptyText || 'لا توجد عمليات مسجّلة بعد.'} />

  // فتح التفاصيل بالنقر على السطر — مع منع الأزرار من تشغيله.
  const openProps = (e) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => onOpen?.(e),
    onKeyDown: (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        onOpen?.(e)
      }
    },
  })

  const actions = (e) => (
    <div
      className="flex justify-end gap-1 print:hidden"
      onClick={(ev) => ev.stopPropagation()}
      onKeyDown={(ev) => ev.stopPropagation()}
    >
      <Button variant="ghost" size="sm" onClick={() => onEdit(e)} aria-label="تعديل">
        <Icon name="edit" className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(e)} aria-label="حذف">
        <Icon name="trash" className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <>
      {/* موبايل: بطاقات */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            {...openProps(e)}
            className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors active:bg-slate-50"
          >
            <div className="min-w-0">
              <TypeBadge type={e.type} />
              <p className="mt-1 truncate text-sm text-slate-700">{e.note || '—'}</p>
              <p className="num mt-0.5 text-xs text-slate-400">{formatDate(e.date)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`num text-sm font-semibold ${
                  e.type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {e.type === 'in' ? '+' : '−'}
                {formatMoney(e.amount)}
              </span>
              {actions(e)}
            </div>
          </li>
        ))}
      </ul>

      {/* شاشات أكبر: جدول */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">النوع</th>
              <th className="px-4 py-2.5 font-medium">المبلغ</th>
              <th className="px-4 py-2.5 font-medium">التاريخ</th>
              <th className="px-4 py-2.5 font-medium">الملاحظة</th>
              <th className="px-4 py-2.5 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id} {...openProps(e)} className="cursor-pointer hover:bg-slate-50/70">
                <td className="px-4 py-2.5">
                  <TypeBadge type={e.type} />
                </td>
                <td
                  className={`num px-4 py-2.5 font-semibold ${
                    e.type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {e.type === 'in' ? '+' : '−'}
                  {formatMoney(e.amount)}
                </td>
                <td className="num px-4 py-2.5 text-slate-500">{formatDate(e.date)}</td>
                <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">{e.note || '—'}</td>
                <td className="px-4 py-2.5 text-left print:hidden">{actions(e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

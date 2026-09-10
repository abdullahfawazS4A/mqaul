import Card, { CardHeader } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatDate, formatMoney } from '../../utils/format.js'

/**
 * قسم داخل صفحة المشروع (إيداعات / مصاريف / سلف).
 * columns: [{ key, label }] — الأعمدة النصية بعد المبلغ.
 */
export default function ProjectSection({
  title,
  subtitle,
  items,
  columns,
  amountTone = 'text-slate-800',
  emptyText,
  onAdd,
  onEdit,
  onDelete,
}) {
  const actions = (item) => (
    <div className="flex justify-end gap-1 print:hidden">
      <Button variant="ghost" size="sm" onClick={() => onEdit(item)} aria-label="تعديل">
        <Icon name="edit" className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(item)} aria-label="حذف">
        <Icon name="trash" className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <>
          {/* موبايل */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  {columns.map((c) => (
                    <p key={c.key} className="truncate text-xs text-slate-600">
                      <span className="text-slate-400">{c.label}: </span>
                      {item[c.key] || '—'}
                    </p>
                  ))}
                  <p className="num mt-0.5 text-xs text-slate-400">{formatDate(item.date)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className={`num text-sm font-semibold ${amountTone}`}>
                    {formatMoney(item.amount)}
                  </span>
                  {actions(item)}
                </div>
              </li>
            ))}
          </ul>

          {/* شاشات أكبر */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">المبلغ</th>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-2.5 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">التاريخ</th>
                  <th className="px-4 py-2.5 print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className={`num px-4 py-2.5 font-semibold ${amountTone}`}>
                      {formatMoney(item.amount)}
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className="max-w-[14rem] truncate px-4 py-2.5 text-slate-600">
                        {item[c.key] || '—'}
                      </td>
                    ))}
                    <td className="num px-4 py-2.5 text-slate-500">{formatDate(item.date)}</td>
                    <td className="px-4 py-2.5 text-left print:hidden">{actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}

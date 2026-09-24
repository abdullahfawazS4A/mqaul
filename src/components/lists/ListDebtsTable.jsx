import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatMoney } from '../../utils/format.js'

/**
 * ديون القوائم لكل شخص.
 * الدين = أرباح القوائم غير المقبوضة − سندات قبض القوائم.
 */
export default function ListDebtsTable({ rows, onShowLists }) {
  if (rows.length === 0)
    return <EmptyState text="لا توجد قوائم مسجّلة لأي شخص بعد." />

  // فتح سجل القوائم بالنقر على السطر — مع منع الأزرار من تشغيله.
  const openProps = (r) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => onShowLists(r),
    onKeyDown: (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        onShowLists(r)
      }
    },
  })

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            {...openProps(r)}
            className="cursor-pointer px-4 py-3 transition-colors active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                <p className="num text-xs text-slate-400">
                  {r.listsCount} قائمة — منها {r.unpaidCount} غير مقبوضة
                </p>
              </div>
              <span
                className={`num shrink-0 text-sm font-semibold ${
                  r.debt > 0 ? 'text-red-600' : 'text-slate-400'
                }`}
              >
                {formatMoney(r.debt)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                سندات القبض:{' '}
                <span className="num font-semibold text-emerald-600">{formatMoney(r.receipts)}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => onShowLists(r)}>
                سجله
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* شاشات أكبر */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">اسم الشخص</th>
              <th className="px-4 py-2.5 font-medium">الهاتف</th>
              <th className="px-4 py-2.5 font-medium">عدد القوائم</th>
              <th className="px-4 py-2.5 font-medium">قوائم غير مقبوضة</th>
              <th className="px-4 py-2.5 font-medium">قيمة القوائم</th>
              <th className="px-4 py-2.5 font-medium">سندات القبض</th>
              <th className="px-4 py-2.5 font-medium">دين القوائم</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} {...openProps(r)} className="cursor-pointer hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.phone || '—'}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.listsCount}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.unpaidCount}</td>
                <td className="num px-4 py-2.5 text-slate-700">{formatMoney(r.listsValue)}</td>
                <td className="num px-4 py-2.5 font-medium text-emerald-600">
                  {formatMoney(r.receipts)}
                </td>
                <td
                  className={`num px-4 py-2.5 font-semibold ${
                    r.debt > 0 ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {formatMoney(r.debt)}
                </td>
                <td
                  className="px-4 py-2.5 text-left"
                  onClick={(ev) => ev.stopPropagation()}
                  onKeyDown={(ev) => ev.stopPropagation()}
                >
                  <Button size="sm" variant="ghost" onClick={() => onShowLists(r)}>
                    سجله
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

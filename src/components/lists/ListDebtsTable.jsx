import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatMoney } from '../../utils/format.js'

/**
 * ديون القوائم لكل شخص.
 * الدين = مجموع أرباح القوائم غير المقبوضة لذلك الشخص.
 */
export default function ListDebtsTable({ rows, onShowLists }) {
  if (rows.length === 0)
    return <EmptyState text="لا توجد قوائم مسجّلة لأي شخص بعد." />

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3">
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
                المقبوض: <span className="num font-semibold text-emerald-600">{formatMoney(r.collected)}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => onShowLists(r)}>
                قوائمه
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
              <th className="px-4 py-2.5 font-medium">الربح المقبوض</th>
              <th className="px-4 py-2.5 font-medium">دين القوائم</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.phone || '—'}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.listsCount}</td>
                <td className="num px-4 py-2.5 text-slate-500">{r.unpaidCount}</td>
                <td className="num px-4 py-2.5 text-slate-700">{formatMoney(r.listsValue)}</td>
                <td className="num px-4 py-2.5 font-medium text-emerald-600">
                  {formatMoney(r.collected)}
                </td>
                <td
                  className={`num px-4 py-2.5 font-semibold ${
                    r.debt > 0 ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {formatMoney(r.debt)}
                </td>
                <td className="px-4 py-2.5 text-left">
                  <Button size="sm" variant="ghost" onClick={() => onShowLists(r)}>
                    قوائمه
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

import { Link } from 'react-router-dom'
import EmptyState from '../ui/EmptyState.jsx'
import { formatDate, formatMoney } from '../../utils/format.js'

/** أعطيت = دين خرج للشخص، أخذت = مبلغ استُلم منه. */
const KIND = {
  debt: { label: 'أعطيت', sign: '−', cls: 'text-red-600', chip: 'bg-red-50 text-red-700' },
  receipt: {
    label: 'أخذت',
    sign: '+',
    cls: 'text-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700',
  },
}

function Chip({ type }) {
  const k = KIND[type] || KIND.debt
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${k.chip}`}>{k.label}</span>
  )
}

function Amount({ entry }) {
  const k = KIND[entry.type] || KIND.debt
  return (
    <span className={`num font-semibold ${k.cls}`}>
      {k.sign}
      {formatMoney(entry.amount)}
    </span>
  )
}

/** سجل موحّد لكل حركات الديون عبر كل الأشخاص. */
export default function DebtLogTable({ entries, emptyText = 'لا توجد حركات بعد.' }) {
  if (entries.length === 0) return <EmptyState text={emptyText} />

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {entries.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/debts/${e.personId}`}
                  className="truncate text-sm font-medium text-slate-800 hover:text-slate-600"
                >
                  {e.personName}
                </Link>
                <p className="num mt-0.5 text-xs text-slate-400">{formatDate(e.date)}</p>
                {e.note && <p className="mt-0.5 truncate text-xs text-slate-500">{e.note}</p>}
              </div>
              <div className="shrink-0 text-left">
                <Amount entry={e} />
                <div className="mt-1">
                  <Chip type={e.type} />
                </div>
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
              <th className="px-4 py-2.5 font-medium">الاسم</th>
              <th className="px-4 py-2.5 font-medium">الحركة</th>
              <th className="px-4 py-2.5 font-medium">المبلغ</th>
              <th className="px-4 py-2.5 font-medium">التاريخ</th>
              <th className="px-4 py-2.5 font-medium">ملاحظة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <Link to={`/debts/${e.personId}`} className="hover:text-slate-600">
                    {e.personName}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Chip type={e.type} />
                </td>
                <td className="px-4 py-2.5">
                  <Amount entry={e} />
                </td>
                <td className="num px-4 py-2.5 text-slate-500">{formatDate(e.date)}</td>
                <td className="max-w-[16rem] truncate px-4 py-2.5 text-slate-500">
                  {e.note || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

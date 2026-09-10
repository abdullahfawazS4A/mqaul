import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatMoney } from '../../utils/format.js'

/**
 * لون ونص الرصيد:
 * موجب = عليه دين لنا، سالب = له مبلغ لدينا (قبضنا أكثر من دينه)، صفر = مسدَّد.
 */
function balanceClass(balance) {
  if (balance > 0) return 'text-red-600'
  if (balance < 0) return 'text-blue-600'
  return 'text-slate-400'
}

function BalanceHint({ balance }) {
  if (balance > 0) return <span className="text-[11px] text-slate-400">عليه</span>
  if (balance < 0) return <span className="text-[11px] text-blue-500">له</span>
  return <span className="text-[11px] text-slate-400">مسدَّد</span>
}

function Actions({ person, onAddDebt, onAddReceipt, onDelete, size = 'sm' }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size={size} variant="secondary" onClick={() => onAddDebt(person)}>
        إضافة دين
      </Button>
      <Button size={size} variant="success" onClick={() => onAddReceipt(person)}>
        سند قبض
      </Button>
      <Link to={`/debts/${person.id}`}>
        <Button size={size} variant="ghost">
          السجل
        </Button>
      </Link>
      <Button size={size} variant="ghost" onClick={() => onDelete(person)} aria-label="حذف">
        <Icon name="trash" className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function PeopleTable(props) {
  const { people, emptyText = 'لا يوجد أشخاص بعد — أضف مستخدمًا للبدء.' } = props

  if (people.length === 0) return <EmptyState text={emptyText} />

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {people.map((p) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/debts/${p.id}`}
                  className="truncate text-sm font-medium text-slate-800 hover:text-slate-600"
                >
                  {p.name}
                </Link>
                {p.phone && <p className="num text-xs text-slate-400">{p.phone}</p>}
                {p.notes && <p className="mt-0.5 truncate text-xs text-slate-500">{p.notes}</p>}
              </div>
              <div className="shrink-0 text-left">
                <span className={`num block text-sm font-semibold ${balanceClass(p.balance)}`}>
                  {formatMoney(Math.abs(p.balance))}
                </span>
                <BalanceHint balance={p.balance} />
              </div>
            </div>
            <div className="mt-2.5">
              <Actions person={p} {...props} />
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
              <th className="px-4 py-2.5 font-medium">الهاتف</th>
              <th className="px-4 py-2.5 font-medium">ملاحظات</th>
              <th className="px-4 py-2.5 font-medium">رصيد الدين</th>
              <th className="px-4 py-2.5 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {people.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <Link to={`/debts/${p.id}`} className="hover:text-slate-600">
                    {p.name}
                  </Link>
                </td>
                <td className="num px-4 py-2.5 text-slate-500">{p.phone || '—'}</td>
                <td className="max-w-[14rem] truncate px-4 py-2.5 text-slate-500">
                  {p.notes || '—'}
                </td>
                <td className={`num px-4 py-2.5 font-semibold ${balanceClass(p.balance)}`}>
                  {formatMoney(Math.abs(p.balance))}{' '}
                  <BalanceHint balance={p.balance} />
                </td>
                <td className="px-4 py-2.5">
                  <Actions person={p} {...props} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

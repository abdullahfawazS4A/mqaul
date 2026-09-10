import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { formatMoney } from '../../utils/format.js'

function Actions({ person, onAddDebt, onAddReceipt, onShowHistory, onDelete, size = 'sm' }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size={size} variant="secondary" onClick={() => onAddDebt(person)}>
        إضافة دين
      </Button>
      <Button
        size={size}
        variant="success"
        onClick={() => onAddReceipt(person)}
        disabled={person.balance <= 0}
      >
        سند قبض
      </Button>
      <Button size={size} variant="ghost" onClick={() => onShowHistory(person)}>
        السجل
      </Button>
      <Button size={size} variant="ghost" onClick={() => onDelete(person)} aria-label="حذف">
        <Icon name="trash" className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function PeopleTable(props) {
  const { people } = props

  if (people.length === 0)
    return <EmptyState text="لا يوجد أشخاص بعد — أضف مستخدمًا للبدء." />

  return (
    <>
      {/* موبايل */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {people.map((p) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                {p.phone && <p className="num text-xs text-slate-400">{p.phone}</p>}
                {p.notes && <p className="mt-0.5 truncate text-xs text-slate-500">{p.notes}</p>}
              </div>
              <span
                className={`num shrink-0 text-sm font-semibold ${
                  p.balance > 0 ? 'text-red-600' : 'text-slate-400'
                }`}
              >
                {formatMoney(p.balance)}
              </span>
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
                <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                <td className="num px-4 py-2.5 text-slate-500">{p.phone || '—'}</td>
                <td className="max-w-[14rem] truncate px-4 py-2.5 text-slate-500">
                  {p.notes || '—'}
                </td>
                <td
                  className={`num px-4 py-2.5 font-semibold ${
                    p.balance > 0 ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {formatMoney(p.balance)}
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

import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { CURRENCY, formatMoney } from '../../utils/format.js'

/** تفاصيل قوائم شخص واحد — مصدر دين القوائم عليه. */
export default function PersonListsModal({ open, person, lists, onClose, onToggleStatus }) {
  if (!open || !person) return null

  const debt = lists
    .filter((l) => l.status === 'unpaid')
    .reduce((s, l) => s + Number(l.profit || 0), 0)

  return (
    <Modal open={open} title={`قوائم — ${person.name}`} onClose={onClose}>
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">دين القوائم (أرباح غير مقبوضة)</p>
        <p className={`num mt-0.5 text-xl font-semibold ${debt > 0 ? 'text-red-600' : 'text-slate-400'}`}>
          {formatMoney(debt)}
          <span className="mr-1 text-xs font-normal text-slate-400">{CURRENCY}</span>
        </p>
      </div>

      {lists.length === 0 ? (
        <EmptyState text="لا توجد قوائم لهذا الشخص." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {lists.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="num text-sm font-medium text-slate-800">قائمة رقم {l.listNumber}</p>
                <p className="text-xs text-slate-500">
                  القيمة: <span className="num">{formatMoney(l.value)}</span> — الربح:{' '}
                  <span className="num">{formatMoney(l.profit)}</span>
                </p>
                {l.notes && <p className="mt-0.5 truncate text-xs text-slate-400">{l.notes}</p>}
              </div>
              <Button
                size="sm"
                variant={l.status === 'paid' ? 'secondary' : 'success'}
                onClick={() => onToggleStatus(l.id)}
              >
                {l.status === 'paid' ? 'واصل (مقبوض)' : 'تسجيل كمقبوض'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </Modal>
  )
}

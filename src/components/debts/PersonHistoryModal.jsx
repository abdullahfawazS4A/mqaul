import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { CURRENCY, formatDate, formatMoney } from '../../utils/format.js'

/** سجل حركات شخص واحد: دين / سند قبض. */
export default function PersonHistoryModal({ open, person, entries, onClose, onDelete }) {
  if (!person) return null

  return (
    <Modal open={open} title={`سجل الحركات — ${person.name}`} onClose={onClose}>
      <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        رصيد الدين الحالي:{' '}
        <span className="num font-semibold text-slate-800">{formatMoney(person.balance)}</span>{' '}
        {CURRENCY}
      </div>

      {entries.length === 0 ? (
        <EmptyState text="لا توجد حركات لهذا الشخص." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    e.type === 'debt' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {e.type === 'debt' ? 'دين' : 'سند قبض'}
                </span>
                <p className="mt-1 truncate text-sm text-slate-700">{e.note || '—'}</p>
                <p className="num mt-0.5 text-xs text-slate-400">{formatDate(e.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`num text-sm font-semibold ${
                    e.type === 'debt' ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {e.type === 'debt' ? '+' : '−'}
                  {formatMoney(e.amount)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => onDelete(e.id)} aria-label="حذف">
                  <Icon name="trash" className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

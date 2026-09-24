import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import { CURRENCY, formatDate, formatMoney } from '../../utils/format.js'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <div className="min-w-0 text-left">{children}</div>
    </div>
  )
}

/** تفاصيل حركة في سجل شخص — يعرض الملاحظة كاملة مهما طالت. */
export default function DebtEntryDetails({ entry, personName, onClose, onEdit, onDelete }) {
  if (!entry) return null

  const isDebt = entry.type === 'debt'

  return (
    <Modal
      open
      title={isDebt ? 'تفاصيل الدين' : 'تفاصيل سند القبض'}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => onDelete(entry)}>
            <Icon name="trash" className="h-4 w-4" />
            حذف
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
            <Button variant="primary" onClick={() => onEdit(entry)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`rounded-xl px-4 py-3 ${isDebt ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isDebt ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            <Icon name={isDebt ? 'arrowUp' : 'arrowDown'} className="h-3 w-3" />
            {isDebt ? 'دين' : 'سند قبض'}
          </span>
          <p
            className={`num mt-1 text-2xl font-semibold ${
              isDebt ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {isDebt ? '+' : '−'}
            {formatMoney(entry.amount)} <span className="text-sm font-normal">{CURRENCY}</span>
          </p>
        </div>

        <div>
          {personName && (
            <Row label="الشخص">
              <span className="text-sm text-slate-700">{personName}</span>
            </Row>
          )}
          <Row label="التاريخ">
            <span className="num text-sm text-slate-700">{formatDate(entry.date)}</span>
          </Row>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-500">الملاحظة</span>
          {entry.note ? (
            <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              {entry.note}
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400">
              لا توجد ملاحظة.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

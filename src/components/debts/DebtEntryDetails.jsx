import DetailsModal from '../ui/DetailsModal.jsx'
import { formatDate } from '../../utils/format.js'

/** تفاصيل حركة في سجل شخص — يعرض الملاحظة كاملة مهما طالت. */
export default function DebtEntryDetails({ entry, personName, onClose, onEdit, onDelete }) {
  if (!entry) return null

  const isDebt = entry.type === 'debt'

  return (
    <DetailsModal
      title={isDebt ? 'تفاصيل الدين' : 'تفاصيل سند القبض'}
      tone={isDebt ? 'red' : 'emerald'}
      badge={isDebt ? 'دين' : 'سند قبض'}
      badgeIcon={isDebt ? 'arrowUp' : 'arrowDown'}
      amount={entry.amount}
      sign={isDebt ? '+' : '−'}
      rows={[
        ...(personName ? [{ label: 'الشخص', value: personName }] : []),
        { label: 'التاريخ', value: formatDate(entry.date), num: true },
      ]}
      note={entry.note}
      onClose={onClose}
      onEdit={onEdit ? () => onEdit(entry) : undefined}
      onDelete={onDelete ? () => onDelete(entry) : undefined}
    />
  )
}

import DetailsModal from '../ui/DetailsModal.jsx'
import { formatDate } from '../../utils/format.js'

/** تفاصيل عملية صيرفة — يعرض الملاحظة كاملة مهما طالت. */
export default function TreasuryDetails({ entry, onClose, onEdit, onDelete }) {
  if (!entry) return null

  const isIn = entry.type === 'in'

  return (
    <DetailsModal
      title={isIn ? 'تفاصيل الإيداع' : 'تفاصيل الاستلام / السحب'}
      tone={isIn ? 'emerald' : 'amber'}
      badge={isIn ? 'إيداع' : 'استلام / سحب'}
      badgeIcon={isIn ? 'arrowDown' : 'arrowUp'}
      amount={entry.amount}
      sign={isIn ? '+' : '−'}
      rows={[{ label: 'التاريخ', value: formatDate(entry.date), num: true }]}
      note={entry.note}
      onClose={onClose}
      onEdit={onEdit ? () => onEdit(entry) : undefined}
      onDelete={onDelete ? () => onDelete(entry) : undefined}
    />
  )
}

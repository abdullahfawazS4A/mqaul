import DetailsModal from '../ui/DetailsModal.jsx'
import { formatDate } from '../../utils/format.js'
import { usePrint } from '../print/PrintProvider.jsx'
import { treasuryVoucher } from '../print/vouchers.js'

/** تفاصيل عملية صيرفة — يعرض الملاحظة كاملة مهما طالت. */
export default function TreasuryDetails({ entry, onClose, onEdit, onDelete }) {
  const { printVoucher } = usePrint()
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
      onPrint={() => printVoucher(treasuryVoucher(entry))}
      onEdit={onEdit ? () => onEdit(entry) : undefined}
      onDelete={onDelete ? () => onDelete(entry) : undefined}
    />
  )
}

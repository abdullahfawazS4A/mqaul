import DetailsModal from '../ui/DetailsModal.jsx'
import { CURRENCY, formatDate, formatMoney } from '../../utils/format.js'

/** تفاصيل قائمة — يعرض الملاحظة كاملة مهما طالت. */
export default function ListDetails({ item, onClose, onEdit, onDelete, onToggleStatus }) {
  if (!item) return null

  const paid = item.status === 'paid'

  return (
    <DetailsModal
      title={`قائمة رقم ${item.listNumber}`}
      tone={paid ? 'emerald' : 'amber'}
      badge={paid ? 'واصل (مقبوض)' : 'دين (غير مقبوض)'}
      amount={item.profit}
      amountSuffix={`${CURRENCY} ربحًا`}
      rows={[
        ...(item.personName ? [{ label: 'الشخص', value: item.personName }] : []),
        { label: 'التاريخ', value: formatDate(item.date), num: true },
        { label: 'قيمة القائمة', value: `${formatMoney(item.value)} ${CURRENCY}`, num: true },
      ]}
      note={item.notes}
      onClose={onClose}
      onEdit={onEdit ? () => onEdit(item) : undefined}
      onDelete={onDelete ? () => onDelete(item) : undefined}
    />
  )
}

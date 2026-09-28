import DetailsModal from '../ui/DetailsModal.jsx'
import { formatDate } from '../../utils/format.js'
import { usePrint } from '../print/PrintProvider.jsx'
import { projectVoucher } from '../print/vouchers.js'

/**
 * تفاصيل حركة مشروع (إيداع / مصروف / سلفة / تسليم).
 * الأعمدة تختلف بين الأقسام، فتُمرَّر كما هي؛ والحقل الحرّ الطويل
 * (وصف المصروف) يُعرض كاملًا في خانة الملاحظة.
 */
export default function ProjectEntryDetails({ entry, kind, project, meta, onClose, onEdit, onDelete }) {
  const { printVoucher } = usePrint()
  if (!entry || !meta) return null

  const { label, tone, columns = [], noteKey, noteLabel } = meta

  return (
    <DetailsModal
      title={`تفاصيل ${label}`}
      tone={tone}
      badge={label}
      amount={entry.amount}
      rows={[
        ...columns
          .filter((c) => c.key !== noteKey)
          .map((c) => ({ label: c.label, value: entry[c.key] })),
        { label: 'التاريخ', value: formatDate(entry.date), num: true },
      ]}
      note={noteKey ? entry[noteKey] : ''}
      noteLabel={noteLabel || 'الوصف'}
      emptyNoteText="لا يوجد وصف."
      onClose={onClose}
      onPrint={() => printVoucher(projectVoucher(entry, kind, project))}
      onEdit={() => onEdit(entry)}
      onDelete={() => onDelete(entry)}
    />
  )
}

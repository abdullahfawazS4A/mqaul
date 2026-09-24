import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import { CURRENCY, formatMoney } from '../../utils/format.js'

const TONES = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  red: { bg: 'bg-red-50', text: 'text-red-700' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700' },
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <div className="min-w-0 text-left">{children}</div>
    </div>
  )
}

/**
 * نافذة تفاصيل موحّدة لأي حركة في التطبيق.
 * سبب وجودها: الملاحظات تُقصّ في الجداول، وهذه النافذة تعرضها كاملة
 * بأسطرها وفراغاتها — بشكل واحد في كل الشاشات.
 *
 * rows: [{ label, value }] — القيم النصية أسفل المبلغ.
 * note: تُعرض كاملة؛ إن كانت فارغة يظهر بديل واضح.
 */
export default function DetailsModal({
  open = true,
  title,
  tone = 'slate',
  badge,
  badgeIcon,
  amount,
  sign = '',
  amountSuffix = CURRENCY,
  rows = [],
  note,
  noteLabel = 'الملاحظة',
  emptyNoteText = 'لا توجد ملاحظة.',
  onClose,
  onEdit,
  onDelete,
  editLabel = 'تعديل',
  deleteLabel = 'حذف',
}) {
  if (!open) return null

  const t = TONES[tone] || TONES.slate
  const hasActions = Boolean(onEdit || onDelete)

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {onDelete ? (
            <Button variant="ghost" onClick={onDelete}>
              <Icon name="trash" className="h-4 w-4" />
              {deleteLabel}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant={hasActions ? 'secondary' : 'primary'} onClick={onClose}>
              إغلاق
            </Button>
            {onEdit && (
              <Button variant="primary" onClick={onEdit}>
                <Icon name="edit" className="h-4 w-4" />
                {editLabel}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {(badge || amount !== undefined) && (
          <div className={`rounded-xl px-4 py-3 ${t.bg}`}>
            {badge && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${t.text}`}>
                {badgeIcon && <Icon name={badgeIcon} className="h-3 w-3" />}
                {badge}
              </span>
            )}
            {amount !== undefined && (
              <p className={`num mt-1 text-2xl font-semibold ${t.text}`}>
                {sign}
                {formatMoney(amount)}{' '}
                {amountSuffix && <span className="text-sm font-normal">{amountSuffix}</span>}
              </p>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <div>
            {rows.map((r) => (
              <Row key={r.label} label={r.label}>
                <span className={`text-sm text-slate-700 ${r.num ? 'num' : ''}`}>
                  {r.value || '—'}
                </span>
              </Row>
            ))}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-500">{noteLabel}</span>
          {note ? (
            <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              {note}
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400">
              {emptyNoteText}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

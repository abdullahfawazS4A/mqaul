/**
 * بناء السند المطبوع من أي حركة — مكان واحد لعناوين السندات وتفاصيلها.
 * اسما المسلِّم والمستلِم لا يُحفظان في التطبيق: يُكتبان باليد على الورقة.
 */
import { formatDate } from '../../utils/format.js'
import { KIND_META } from '../projects/kinds.js'

const STATEMENT =
  'يُقرّ المُستلِم باستلام المبلغ المذكور أعلاه كاملًا من المُسلِّم، ويُقرّ الطرفان بصحة ما ورد في هذا السند.'

const reference = (id) => (id ? String(id).toUpperCase() : '')

/** دين أو سند قبض في الديون النقدية. */
export function debtVoucher(entry, personName) {
  const isDebt = entry.type === 'debt'
  return {
    title: isDebt ? 'سند صرف — دين' : 'سند قبض',
    section: 'الديون النقدية',
    reference: reference(entry.id),
    date: entry.date,
    amount: entry.amount,
    rows: [
      { label: 'نوع الحركة', value: isDebt ? 'دين (مبلغ مُعطى)' : 'سند قبض (مبلغ مُستلَم)' },
      { label: isDebt ? 'المدين' : 'المُسدِّد', value: personName },
      { label: 'تاريخ الحركة', value: formatDate(entry.date), num: true },
    ],
    note: entry.note,
    statement: STATEMENT,
  }
}

/** إيداع أو استلام/سحب في الصيرفة. */
export function treasuryVoucher(entry) {
  const isIn = entry.type === 'in'
  return {
    title: isIn ? 'سند إيداع' : 'سند استلام / سحب',
    section: 'الصيرفة',
    reference: reference(entry.id),
    date: entry.date,
    amount: entry.amount,
    rows: [
      { label: 'نوع العملية', value: isIn ? 'إيداع في الصيرفة' : 'استلام / سحب من الصيرفة' },
      { label: 'تاريخ العملية', value: formatDate(entry.date), num: true },
    ],
    note: entry.note,
    noteLabel: 'الملاحظة / السبب',
    statement: STATEMENT,
  }
}

/** سند قبض على دين القوائم. */
export function listReceiptVoucher(entry, personName) {
  return {
    title: 'سند قبض — القوائم',
    section: 'مكاتب — ديون القوائم',
    reference: reference(entry.id),
    date: entry.date,
    amount: entry.amount,
    rows: [
      { label: 'المُسدِّد', value: personName },
      { label: 'تاريخ القبض', value: formatDate(entry.date), num: true },
    ],
    note: entry.note,
    statement: STATEMENT,
  }
}

const PROJECT_TITLES = {
  deposits: 'سند إيداع شريك',
  expenses: 'سند صرف — مصروف مشروع',
  advances: 'سند قبض — سلفة مستلمة',
  payouts: 'سند تسليم مبلغ لشريك',
}

/** إيداع / مصروف / سلفة / تسليم داخل مشروع. */
export function projectVoucher(entry, kind, project) {
  const meta = KIND_META[kind]
  const columns = meta.columns.filter((c) => c.key !== meta.noteKey)
  return {
    title: PROJECT_TITLES[kind],
    section: `المشاريع — ${project.name}`,
    reference: reference(entry.id),
    date: entry.date,
    amount: entry.amount,
    rows: [
      { label: 'المشروع', value: project.name },
      ...(project.company ? [{ label: 'الشركة', value: project.company }] : []),
      { label: 'نوع الحركة', value: meta.label },
      ...columns.map((c) => ({ label: c.label, value: entry[c.key] })),
      { label: 'تاريخ الحركة', value: formatDate(entry.date), num: true },
    ],
    note: meta.noteKey ? entry[meta.noteKey] : entry.note,
    noteLabel: meta.noteLabel || 'الملاحظة / البيان',
    statement: STATEMENT,
  }
}

/** تنسيق المبالغ والتواريخ — مكان واحد لتغيير العملة أو صيغة التاريخ. */

export const CURRENCY = 'د.ع'

export function formatMoney(value) {
  const n = Number(value) || 0
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB') // dd/mm/yyyy
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

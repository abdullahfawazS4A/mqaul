/** تنسيق المبالغ والتواريخ — مكان واحد لتغيير العملة أو صيغة التاريخ. */

export const CURRENCY = 'د.ع'

export function formatMoney(value) {
  const n = Number(value) || 0
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** يُبقي الأرقام ونقطة عشرية واحدة فقط — ما يُخزَّن في الحالة. */
export function sanitizeAmount(input) {
  const s = String(input ?? '').replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  if (i === -1) return s
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
}

/** يضيف فارزة كل ٣ أرقام مع الحفاظ على ما يكتبه المستخدم (نقطة أخيرة، أصفار لاحقة). */
export function groupAmount(input) {
  const s = sanitizeAmount(input)
  if (!s) return ''
  const [whole, fraction] = s.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return s.includes('.') ? `${grouped}.${fraction ?? ''}` : grouped
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB') // dd/mm/yyyy
}

/** تاريخ اليوم بالتوقيت المحلي (وليس UTC) بصيغة YYYY-MM-DD. */
export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

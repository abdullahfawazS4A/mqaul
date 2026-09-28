/**
 * التفقيط: كتابة المبلغ بالحروف كما يُكتب في السندات
 * («فقط خمسة وثلاثون مليون دينار عراقي لا غير») — حتى لا يُزوَّر الرقم بإضافة خانة.
 * يغطي الأعداد الصحيحة حتى ما دون ألف مليار؛ الكسور لا تُفقَّط.
 */

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
const TEENS = [
  'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر',
  'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
]
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
const HUNDREDS = [
  '', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة',
  'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة',
]

// [مفرد، مثنى، جمع (٣–١٠)، تمييز (١١ فأكثر)]
const SCALES = [
  { value: 1e9, forms: ['مليار', 'ملياران', 'مليارات', 'مليار'] },
  { value: 1e6, forms: ['مليون', 'مليونان', 'ملايين', 'مليون'] },
  { value: 1e3, forms: ['ألف', 'ألفان', 'آلاف', 'ألف'] },
]

/** ما دون الألف. */
function below1000(n) {
  const parts = []
  const h = Math.floor(n / 100)
  const rest = n % 100
  if (h) parts.push(HUNDREDS[h])
  if (rest) {
    if (rest < 10) parts.push(ONES[rest])
    else if (rest < 20) parts.push(TEENS[rest - 10])
    else {
      const o = rest % 10
      const t = TENS[Math.floor(rest / 10)]
      parts.push(o ? `${ONES[o]} و${t}` : t)
    }
  }
  return parts.join(' و')
}

function scaleWords(count, [one, two, few, many]) {
  if (count === 1) return one
  if (count === 2) return two
  const rest = count % 100
  if (rest >= 3 && rest <= 10) return `${below1000(count)} ${few}`
  return `${below1000(count)} ${many}`
}

export function numberToArabicWords(value) {
  let n = Math.floor(Math.abs(Number(value) || 0))
  if (n === 0) return 'صفر'
  if (n >= 1e12) return ''

  const parts = []
  for (const { value: v, forms } of SCALES) {
    const count = Math.floor(n / v)
    if (count) parts.push(scaleWords(count, forms))
    n %= v
  }
  if (n) parts.push(below1000(n))
  return parts.join(' و')
}

/** نص التفقيط الكامل للسند، أو '' إن تعذّر (كسر أو رقم خارج المدى). */
export function amountInWords(value, currency = 'دينار عراقي') {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return ''
  const words = numberToArabicWords(n)
  return words ? `فقط ${words} ${currency} لا غير` : ''
}

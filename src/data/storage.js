/**
 * تخزين محلي (localStorage) — يحفظ حالة التطبيق بين الجلسات.
 * عند ربط Backend لاحقًا: احذف استدعاءات هذا الملف من DataContext فقط.
 */

const KEY = 'mqaul-accounting:v1'

/** يقرأ الحالة المحفوظة، ويُعيد null إذا لم توجد أو كانت تالفة. */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** يحفظ الحالة — يتجاهل الأخطاء (وضع التصفح الخاص، أو امتلاء المساحة). */
export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/** يمسح النسخة المحفوظة (يعود التطبيق للبيانات الأولية عند إعادة التحميل). */
export function clearState() {
  try {
    localStorage.removeItem(KEY)
    return true
  } catch {
    return false
  }
}

export const STORAGE_KEY = KEY

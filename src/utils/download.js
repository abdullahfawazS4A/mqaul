/** تنزيل الملفات من المتصفح: نسخة احتياطية JSON أو جدول Excel. */

import { buildXLSX } from './xlsx.js'

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadJSON(data, filename) {
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
    filename,
  )
}

/**
 * تصدير جدول إلى ملف Excel (.xlsx).
 * columns: [{ key, label, width? }] — والقيم تُقرأ عبر row[key] أو دالة key(row).
 * اخترنا xlsx بدل CSV لأن الجوال لا يملك عارضًا لملفات csv، بينما xlsx
 * يفتحه Excel أو Google Sheets مباشرة.
 */
export function downloadXLSX(rows, columns, filename, sheetName, footer) {
  triggerDownload(buildXLSX(rows, columns, sheetName, footer), filename)
}

/** اسم ملف بتاريخ اليوم: mqaul-debts-2026-09-11.xlsx */
export function stampedName(base, ext) {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`
}

/** تنزيل الملفات من المتصفح: نسخة احتياطية JSON أو جدول CSV. */

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
 * تصدير جدول إلى CSV.
 * columns: [{ key, label }] — والقيم تُقرأ عبر row[key] أو دالة key(row).
 * يُضاف BOM ليفتح Excel العربية بترميز صحيح.
 */
export function downloadCSV(rows, columns, filename) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => escape(typeof c.key === 'function' ? c.key(row) : row[c.key]))
        .join(','),
    )
    .join('\n')
  triggerDownload(
    new Blob([`﻿${header}\n${body}`], { type: 'text/csv;charset=utf-8' }),
    filename,
  )
}

/** اسم ملف بتاريخ اليوم: mqaul-debts-2026-09-11.csv */
export function stampedName(base, ext) {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`
}

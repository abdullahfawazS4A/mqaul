/**
 * مولّد ملفات Excel (.xlsx) بدون مكتبات خارجية.
 *
 * ملف xlsx هو أرشيف ZIP يحوي عدة ملفات XML. نكتب الأرشيف بطريقة "التخزين"
 * (بلا ضغط) — أبسط بكثير وExcel يقبلها، وحجم كشوفنا صغير أصلًا.
 */

/* ------------------------------ أدوات ZIP ------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const utf8 = (s) => new TextEncoder().encode(s)

/** يبني Blob لأرشيف ZIP من [{ name, data: Uint8Array }]. */
function zip(files) {
  // ختم زمني بصيغة MS-DOS — Excel لا يعتمد عليه لكن الحقل إلزامي.
  const now = new Date()
  const time =
    (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2) & 0x1f)
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()

  const locals = []
  const centrals = []
  let offset = 0

  for (const file of files) {
    const name = utf8(file.name)
    const crc = crc32(file.data)
    const size = file.data.length

    const local = new Uint8Array(30 + name.length + size)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true) // توقيع
    lv.setUint16(4, 20, true) // النسخة المطلوبة
    lv.setUint16(6, 0x0800, true) // الأسماء بترميز UTF-8
    lv.setUint16(8, 0, true) // بلا ضغط (store)
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, size, true)
    lv.setUint32(22, size, true)
    lv.setUint16(26, name.length, true)
    lv.setUint16(28, 0, true)
    local.set(name, 30)
    local.set(file.data, 30 + name.length)
    locals.push(local)

    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    central.set(name, 46)
    centrals.push(central)

    offset += local.length
  }

  const cdSize = centrals.reduce((s, c) => s + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)

  return new Blob([...locals, ...centrals, end], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/* ----------------------------- أدوات الورقة ----------------------------- */

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Excel يرفض محارف التحكّم داخل XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

/** 0 → A، 25 → Z، 26 → AA … */
function colName(index) {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function cell(ref, value, styleIndex) {
  const s = styleIndex ? ` s="${styleIndex}"` : ''
  if (typeof value === 'number' && Number.isFinite(value))
    return `<c r="${ref}"${s}><v>${value}</v></c>`
  const text = value === null || value === undefined ? '' : String(value)
  if (!text) return `<c r="${ref}"${s}/>`
  // xml:space يحافظ على الفراغات في بداية/نهاية الملاحظات
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>`
}

/* ------------------------------- التصدير ------------------------------- */

/**
 * أنماط الخلايا المتاحة لصفوف الذيل — الأرقام هي فهارس cellXfs في styles.xml.
 * LINE يرسم خطًّا سفليًّا: الخانة تصبح سطرًا يُكتب أو يُوقَّع عليه.
 */
export const S = { HEADER: 1, BOLD: 2, LINE: 3, LABEL: 4 }

/**
 * يبني Blob لملف xlsx من صفوف وأعمدة.
 * columns: [{ key, label, width? }] — القيمة تُقرأ عبر row[key] أو key(row).
 * الأرقام تُكتب كخلايا رقمية فتقبل الجمع داخل Excel.
 *
 * footer: صفوف حرّة تُكتب بعد الجدول (خانات توقيع، إقرارات…). كل صف مصفوفة
 * خلايا — القيمة مباشرة أو { v, s } للنمط — أو { cells, height } لضبط الارتفاع.
 */
export function buildXLSX(rows, columns, sheetName = 'كشف', footer = []) {
  const header = columns.map((c, i) => cell(`${colName(i)}1`, c.label, 1)).join('')

  const body = rows
    .map((row, r) => {
      const n = r + 2
      const cells = columns
        .map((c, i) => {
          const raw = typeof c.key === 'function' ? c.key(row) : row[c.key]
          return cell(`${colName(i)}${n}`, raw)
        })
        .join('')
      return `<row r="${n}">${cells}</row>`
    })
    .join('')

  // الذيل يبدأ بعد سطر فارغ يفصله عن الجدول
  const footerStart = rows.length + 3
  let footerWidth = 0

  const footerXml = footer
    .map((entry, r) => {
      const { cells, height } = Array.isArray(entry) ? { cells: entry } : entry
      footerWidth = Math.max(footerWidth, cells.length)
      const n = footerStart + r
      const body = cells
        .map((c, i) => {
          if (c === null || c === undefined) return ''
          const { v, s } = typeof c === 'object' ? c : { v: c, s: 0 }
          return cell(`${colName(i)}${n}`, v, s)
        })
        .join('')
      const ht = height ? ` ht="${height}" customHeight="1"` : ''
      return `<row r="${n}"${ht}>${body}</row>`
    })
    .join('')

  const cols = columns
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 18}" customWidth="1"/>`)
    .join('')

  const lastCol = colName(Math.max(columns.length - 1, 0))
  const lastRow = rows.length + 1
  // أبعاد الورقة تشمل الذيل، بينما تبقى التصفية على الجدول وحده
  const endCol = colName(Math.max(columns.length, footerWidth) - 1)
  const endRow = footer.length ? footerStart + footer.length - 1 : lastRow

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="A1:${endCol}${endRow}"/>` +
    // rightToLeft: الورقة تُفتح من اليمين لليسار كبقية التطبيق
    `<sheetViews><sheetView rightToLeft="1" tabSelected="1" workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData><row r="1">${header}</row>${body}${footerXml}</sheetData>` +
    // تصفية تلقائية على صف العناوين
    `<autoFilter ref="A1:${lastCol}${lastRow}"/>` +
    `</worksheet>`

  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="3">` +
    `<font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/></font>` +
    `<font><sz val="11"/><color rgb="FF475569"/><name val="Calibri"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="2">` +
    `<border><left/><right/><top/><bottom/><diagonal/></border>` +
    // خط التوقيع: حدّ سفلي رفيع فقط
    `<border><left/><right/><top/><bottom style="thin"><color rgb="FF94A3B8"/></bottom><diagonal/></border>` +
    `</borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="5">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>` +
    `<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `</cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`

  // اسم الورقة: Excel يمنع بعض المحارف ويحدّ الطول بـ 31
  const safeSheet = esc(String(sheetName).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'كشف')

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`

  const bookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`

  return zip([
    { name: '[Content_Types].xml', data: utf8(contentTypes) },
    { name: '_rels/.rels', data: utf8(rootRels) },
    { name: 'xl/workbook.xml', data: utf8(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: utf8(bookRels) },
    { name: 'xl/styles.xml', data: utf8(styles) },
    { name: 'xl/worksheets/sheet1.xml', data: utf8(sheet) },
  ])
}

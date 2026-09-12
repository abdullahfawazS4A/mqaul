import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'

/**
 * منتقي مدى تاريخي بتقويم واحد: الضغطة الأولى تحدّد "من" والثانية تحدّد "إلى".
 * القيم بصيغة YYYY-MM-DD لتبقى المقارنة النصّية صالحة في بقية التطبيق.
 */

const MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
]
const WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const isoOf = (date) => iso(date.getFullYear(), date.getMonth(), date.getDate())
const pretty = (s) => (s ? s.split('-').reverse().join('/') : '')

function parseISO(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** خلايا الشهر مع فراغات البداية حتى يبدأ الأسبوع من الأحد. */
function monthCells(year, month) {
  const lead = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function buildPresets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const today = isoOf(now)
  return [
    { label: 'اليوم', from: today, to: today },
    { label: 'آخر ٧ أيام', from: isoOf(new Date(y, m, d - 6)), to: today },
    { label: 'آخر ٣٠ يومًا', from: isoOf(new Date(y, m, d - 29)), to: today },
    { label: 'هذا الشهر', from: iso(y, m, 1), to: isoOf(new Date(y, m + 1, 0)) },
    { label: 'الشهر الماضي', from: isoOf(new Date(y, m - 1, 1)), to: isoOf(new Date(y, m, 0)) },
    { label: 'هذه السنة', from: iso(y, 0, 1), to: iso(y, 11, 31) },
  ]
}

export default function DateRangePicker({ from, to, onChange, label = 'التاريخ' }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null) // بداية مدى قيد التحديد
  const [hover, setHover] = useState(null)
  const [view, setView] = useState(() => {
    const base = parseISO(from) || new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  })
  const boxRef = useRef(null)

  // إغلاق عند الضغط خارج الصندوق أو بمفتاح Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // عند الفتح: ابدأ العرض من شهر "من" المحدّد، وألغِ أي تحديد نصف مكتمل
  useEffect(() => {
    if (!open) return
    setAnchor(null)
    setHover(null)
    const base = parseISO(from) || new Date()
    setView({ year: base.getFullYear(), month: base.getMonth() })
  }, [open])

  const presets = useMemo(buildPresets, [])
  const cells = useMemo(() => monthCells(view.year, view.month), [view])
  const today = isoOf(new Date())

  // المدى المعروض أثناء التحديد: من المرساة حتى اليوم الذي يمرّ عليه المؤشر
  const edgeA = anchor || ''
  const edgeB = anchor ? hover || anchor : ''
  const range = anchor
    ? { start: edgeA < edgeB ? edgeA : edgeB, end: edgeA < edgeB ? edgeB : edgeA }
    : { start: from, end: to }

  const pick = (value) => {
    if (!anchor) {
      setAnchor(value)
      setHover(value)
      onChange({ from: value, to: '' })
      return
    }
    const start = value < anchor ? value : anchor
    const end = value < anchor ? anchor : value
    setAnchor(null)
    setHover(null)
    onChange({ from: start, to: end })
    setOpen(false)
  }

  const applyPreset = (p) => {
    setAnchor(null)
    setHover(null)
    onChange({ from: p.from, to: p.to })
    setOpen(false)
  }

  const clear = () => {
    setAnchor(null)
    setHover(null)
    onChange({ from: '', to: '' })
    setOpen(false)
  }

  const shiftMonth = (step) => {
    const d = new Date(view.year, view.month + step, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const summary =
    from && to
      ? `${pretty(from)} — ${pretty(to)}`
      : from
        ? `من ${pretty(from)}`
        : to
          ? `حتى ${pretty(to)}`
          : 'كل التواريخ'

  return (
    <div className="relative" ref={boxRef}>
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full min-w-[13rem] items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors ${
          from || to
            ? 'border-slate-400 text-slate-800'
            : 'border-slate-300 text-slate-400 hover:bg-slate-50'
        }`}
      >
        <span className={from || to ? 'num font-medium' : ''}>{summary}</span>
        <Icon name="calendar" className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute top-full right-0 z-40 mt-2 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="الشهر السابق"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <Icon name="back" className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-700">
              {MONTHS[view.month]} <span className="num">{view.year}</span>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="الشهر التالي"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <Icon name="back" className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[10px] font-medium text-slate-400">
                {w}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-0.5"
            onMouseLeave={() => anchor && setHover(anchor)}
          >
            {cells.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />
              const value = iso(view.year, view.month, day)
              const isEdge = value === range.start || value === range.end
              const inRange =
                range.start && range.end && value > range.start && value < range.end

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => pick(value)}
                  onMouseEnter={() => anchor && setHover(value)}
                  className={`num h-9 rounded-lg text-xs transition-colors ${
                    isEdge
                      ? 'bg-slate-800 font-semibold text-white'
                      : inRange
                        ? 'bg-slate-100 text-slate-700'
                        : 'text-slate-600 hover:bg-slate-100'
                  } ${
                    !isEdge && value === today
                      ? 'font-semibold text-emerald-600 ring-1 ring-emerald-300'
                      : ''
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] text-slate-500">
              {anchor ? 'اختر تاريخ النهاية…' : 'اضغط تاريخ البداية ثم النهاية'}
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={!from && !to && !anchor}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              مسح
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

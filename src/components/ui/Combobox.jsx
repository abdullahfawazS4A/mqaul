import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'

const base =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'

/**
 * حقل بحث واختيار في آنٍ واحد: يكتب المستخدم فتُفلتر الخيارات مباشرةً،
 * ويختار بالضغط أو بمفاتيح الأسهم + Enter.
 * options: [{ id, label, hint }] — و value هو id الخيار المختار.
 */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'اكتب للبحث…',
  emptyText = 'لا نتائج مطابقة.',
  disabled = false,
  autoFocus = false,
}) {
  // query = null يعني "لا يكتب المستخدم الآن" فيُعرض اسم الخيار المختار.
  // بهذا لا يعتمد نص الحقل على حالة الفتح أو التركيز، فلا يفرغ الحقل عند الاختيار.
  const [query, setQuery] = useState(null)
  const [open, setOpen] = useState(Boolean(autoFocus)) // يفتح مباشرةً مع النموذج
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value])

  const matches = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => `${o.label} ${o.hint || ''}`.toLowerCase().includes(q))
  }, [options, query])

  // إغلاق عند الضغط خارج الحقل
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false)
        setQuery(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // أبقِ الخيار النشط داخل مجال الرؤية أثناء التنقّل بالأسهم
  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  useEffect(() => setActive(0), [query])

  const choose = (option) => {
    onChange(option.id)
    setQuery(null) // ارجع لعرض اسم الخيار المختار
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (matches.length ? (i + step + matches.length) % matches.length : 0))
      return
    }
    if (e.key === 'Enter') {
      if (open && matches[active]) {
        e.preventDefault() // لا تُرسل النموذج، اختر الخيار فقط
        choose(matches[active])
      }
      return
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
      setQuery(null)
    }
  }

  const clear = () => {
    onChange('')
    setQuery(null)
    setOpen(true)
    inputRef.current?.focus()
  }

  // نص الحقل: ما يكتبه المستخدم، وإلا اسم الخيار المختار
  const shown = query !== null ? query : selected?.label || ''

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          autoFocus={autoFocus}
          value={shown}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (value) onChange('') // الكتابة تُلغي الاختيار السابق حتى يُعاد اختياره
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${base} pl-8 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault() // كما في الخيارات: امنع تفعيل الـ label الحاوي
            if (selected && !open) return clear()
            setOpen((v) => !v)
            inputRef.current?.focus()
          }}
          aria-label={selected && !open ? 'مسح الاختيار' : 'فتح القائمة'}
          className="absolute inset-y-0 left-0 flex w-8 items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          {selected && !open ? (
            <span className="text-base leading-none">×</span>
          ) : (
            <Icon name="back" className="h-4 w-4 rotate-90" />
          )}
        </button>
      </div>

      {open && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">{emptyText}</li>}
          {matches.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} // لا تفقد التركيز قبل الاختيار
              onClick={(e) => {
                e.preventDefault() // لا تدع <label> الحاوي يُعيد الضغطة إلى الحقل فيُعاد الفتح
                choose(o)
              }}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                i === active ? 'bg-slate-100' : ''
              } ${o.id === value ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
            >
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="num shrink-0 text-xs text-slate-400">{o.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

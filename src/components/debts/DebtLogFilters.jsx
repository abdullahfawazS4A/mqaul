import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import { Input, MoneyInput } from '../ui/Field.jsx'

const KINDS = [
  { key: 'all', label: 'الكل' },
  { key: 'debt', label: 'أعطيت' },
  { key: 'receipt', label: 'أخذت' },
]

export const EMPTY_FILTERS = {
  q: '',
  kind: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
}

/** هل يختلف المرشِّح الحالي عن الحالة الفارغة؟ */
export const isFiltered = (f) =>
  Object.keys(EMPTY_FILTERS).some((k) => f[k] !== EMPTY_FILTERS[k])

/** تطبيق المرشِّح على حركات السجل. */
export function applyFilters(entries, f) {
  const q = f.q.trim().toLowerCase()
  const min = f.amountMin === '' ? null : Number(f.amountMin)
  const max = f.amountMax === '' ? null : Number(f.amountMax)

  return entries.filter((e) => {
    if (q && !`${e.personName} ${e.note}`.toLowerCase().includes(q)) return false
    if (f.kind !== 'all' && e.type !== f.kind) return false
    if (f.dateFrom && e.date < f.dateFrom) return false
    if (f.dateTo && e.date > f.dateTo) return false
    if (min !== null && e.amount < min) return false
    if (max !== null && e.amount > max) return false
    return true
  })
}

function Group({ label, children }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </div>
  )
}

/** مرشِّح كامل لسجل الديون: نص، نوع الحركة، مدى التاريخ، ومدى المبلغ. */
export default function DebtLogFilters({ value, onChange, onReset }) {
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 print:hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Group label="بحث">
          <Input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="بالاسم أو الملاحظة…"
          />
        </Group>

        <Group label="نوع الحركة">
          <div className="flex gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => set({ kind: k.key })}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  value.kind === k.key
                    ? 'bg-slate-800 text-white'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </Group>

        <Group label="التاريخ">
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={value.dateFrom}
              onChange={(e) => set({ dateFrom: e.target.value })}
              aria-label="من تاريخ"
            />
            <span className="shrink-0 text-xs text-slate-400">إلى</span>
            <Input
              type="date"
              value={value.dateTo}
              onChange={(e) => set({ dateTo: e.target.value })}
              aria-label="إلى تاريخ"
            />
          </div>
        </Group>

        <Group label="المبلغ">
          <div className="flex items-center gap-1.5">
            <MoneyInput
              value={value.amountMin}
              onChange={(v) => set({ amountMin: v })}
              placeholder="من"
              aria-label="أقل مبلغ"
            />
            <span className="shrink-0 text-xs text-slate-400">إلى</span>
            <MoneyInput
              value={value.amountMax}
              onChange={(v) => set({ amountMax: v })}
              placeholder="إلى"
              aria-label="أعلى مبلغ"
            />
          </div>
        </Group>
      </div>

      {isFiltered(value) && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <Icon name="close" className="h-4 w-4" />
            مسح المرشِّح
          </Button>
        </div>
      )}
    </div>
  )
}

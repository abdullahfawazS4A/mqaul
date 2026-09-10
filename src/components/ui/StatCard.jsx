import { CURRENCY, formatMoney } from '../../utils/format.js'

const TONES = {
  neutral: 'text-slate-800',
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  muted: 'text-slate-500',
}

export default function StatCard({ label, value, tone = 'neutral', hint, money = true }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`num mt-1 text-xl font-semibold sm:text-2xl ${TONES[tone]}`}>
        {money ? formatMoney(value) : value}
        {money && <span className="mr-1 text-xs font-normal text-slate-400">{CURRENCY}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

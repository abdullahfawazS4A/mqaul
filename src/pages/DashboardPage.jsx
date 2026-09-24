import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import TreasuryDetails from '../components/treasury/TreasuryDetails.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'

function SectionLink({ to, icon, title, lines }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
            <Icon name={icon} className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        <Icon name="back" className="h-4 w-4 shrink-0 rotate-180 text-slate-300" />
      </div>
      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center justify-between gap-2 text-xs">
            <dt className="text-slate-500">{l.label}</dt>
            <dd className={`num font-semibold ${l.tone || 'text-slate-700'}`}>
              {l.money === false ? l.value : formatMoney(l.value)}
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  )
}

/** لوحة المعلومات — نظرة واحدة على كل الأقسام. */
export default function DashboardPage() {
  const [details, setDetails] = useState(null)
  const {
    treasuryBalance,
    treasuryTotals,
    treasury,
    capital,
    availableCapital,
    totalOutstandingDebt,
    people,
    debtEntries,
    listsTotals,
    lists,
    projects,
    projectsTotals,
  } = useData()

  const peopleInDebt = people.filter((p) => p.balance > 0).length
  const peopleInCredit = people.filter((p) => p.balance < 0).length

  const recent = [...treasury]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5)

  const unpaidLists = lists.filter((l) => l.status === 'unpaid').length

  return (
    <div>
      <PageHeader
        title="لوحة المعلومات"
        description="ملخّص كل الأقسام — الصيرفة، الديون النقدية، ديون القوائم، والمشاريع."
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="رصيد الصيرفة"
          value={treasuryBalance}
          tone={treasuryBalance < 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="الرصيد المتاح للديون"
          value={availableCapital}
          tone={availableCapital < 0 ? 'negative' : 'positive'}
          hint="رأس المال − الديون القائمة"
        />
        <StatCard
          label="ديون نقدية قائمة"
          value={totalOutstandingDebt}
          tone="negative"
          hint={`${peopleInDebt} شخص`}
        />
        <StatCard
          label="ديون القوائم"
          value={listsTotals.debt}
          tone="negative"
          hint="أرباح غير مقبوضة — معزولة عن رأس المال"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SectionLink
          to="/treasury"
          icon="wallet"
          title="الصيرفة"
          lines={[
            { label: 'الإيداعات', value: treasuryTotals.cashIn, tone: 'text-emerald-600' },
            { label: 'الاستلامات', value: treasuryTotals.cashOut, tone: 'text-amber-600' },
            { label: 'عدد العمليات', value: treasury.length, money: false },
          ]}
        />
        <SectionLink
          to="/debts"
          icon="users"
          title="الديون"
          lines={[
            { label: 'رأس المال', value: capital },
            { label: 'عدد الأشخاص', value: people.length, money: false },
            { label: 'عدد الحركات', value: debtEntries.length, money: false },
            ...(peopleInCredit > 0
              ? [{ label: 'لهم رصيد لدينا', value: peopleInCredit, money: false, tone: 'text-blue-600' }]
              : []),
          ]}
        />
        <SectionLink
          to="/lists"
          icon="list"
          title="القوائم"
          lines={[
            { label: 'عدد القوائم', value: lists.length, money: false },
            { label: 'غير مقبوضة', value: unpaidLists, money: false, tone: 'text-amber-600' },
            { label: 'أرباح مقبوضة', value: listsTotals.collected, tone: 'text-emerald-600' },
          ]}
        />
        <SectionLink
          to="/projects"
          icon="building"
          title="المشاريع"
          lines={[
            { label: 'عدد المشاريع', value: projects.length, money: false },
            { label: 'مجموع القيم', value: projectsTotals.value },
            { label: 'المصاريف', value: projectsTotals.expenses, tone: 'text-red-600' },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="آخر حركات الصيرفة"
          subtitle="أحدث 5 عمليات — اضغط على أي حركة لعرض تفاصيلها"
        />
        {recent.length === 0 ? (
          <EmptyState text="لا توجد عمليات بعد." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((e) => (
              <li
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetails(e)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setDetails(e)
                  }
                }}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/70 active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">{e.note || '—'}</p>
                  <p className="num text-xs text-slate-400">{formatDate(e.date)}</p>
                </div>
                <span
                  className={`num shrink-0 text-sm font-semibold ${
                    e.type === 'in' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {e.type === 'in' ? '+' : '−'}
                  {formatMoney(e.amount)}
                  <span className="mr-1 text-[11px] font-normal text-slate-400">{CURRENCY}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* عرض فقط — التعديل والحذف من صفحة الصيرفة */}
      <TreasuryDetails entry={details} onClose={() => setDetails(null)} />
    </div>
  )
}

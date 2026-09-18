import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Input } from '../components/ui/Field.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadCSV, stampedName } from '../utils/download.js'

const KINDS = {
  deposits: { label: 'إيداع', badge: 'bg-emerald-50 text-emerald-700', tone: 'text-emerald-600' },
  expenses: { label: 'مصروف', badge: 'bg-red-50 text-red-700', tone: 'text-red-600' },
  advances: { label: 'سلفة', badge: 'bg-amber-50 text-amber-700', tone: 'text-amber-600' },
}

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'deposits', label: 'إيداعات' },
  { key: 'expenses', label: 'مصاريف' },
  { key: 'advances', label: 'سلف' },
]

function KindBadge({ kind }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${KINDS[kind].badge}`}
    >
      {KINDS[kind].label}
    </span>
  )
}

/**
 * سجل شريك واحد — كل حركاته (إيداعات، مصاريف، سلف) عبر كل المشاريع.
 * الاسم يأتي من الرابط، والمطابقة تتم في طبقة البيانات على اسم مُطبَّع.
 */
export default function PartnerLedgerPage() {
  const { partnerName } = useParams()
  const { partnerLedger } = useProjects()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const ledger = partnerLedger(partnerName)

  const visible = useMemo(() => {
    if (!ledger) return []
    const q = search.trim().toLowerCase()
    return ledger.movements
      .filter((m) => (filter === 'all' ? true : m.kind === filter))
      .filter((m) =>
        q ? `${m.projectName} ${m.note} ${m.amount} ${m.date}`.toLowerCase().includes(q) : true,
      )
  }, [ledger, filter, search])

  if (!ledger) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text="لا يوجد شريك بهذا الاسم في أي مشروع.">
          <Link to="/projects">
            <Button variant="secondary">العودة إلى المشاريع</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  const exportCSV = () =>
    downloadCSV(
      ledger.movements,
      [
        { key: (m) => KINDS[m.kind].label, label: 'النوع' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'projectName', label: 'المشروع' },
        { key: 'note', label: 'الوصف' },
        { key: (m) => formatDate(m.date), label: 'التاريخ' },
      ],
      stampedName(`mqaul-partner-${ledger.name}`, 'csv'),
    )

  return (
    <div>
      <PageHeader
        title={ledger.name}
        description={`كل الحركات عبر ${ledger.projectsCount} مشروع — ${ledger.movements.length} حركة.`}
        action={
          <>
            <Button variant="secondary" onClick={exportCSV}>
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير CSV
            </Button>
            <Link to="/projects">
              <Button variant="secondary">
                <Icon name="back" className="h-4 w-4" />
                المشاريع
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="مجموع إيداعاته" value={ledger.deposits} tone="positive" />
        <StatCard label="مجموع ما صرفه" value={ledger.expenses} tone="negative" />
        <StatCard label="سلف عن طريقه" value={ledger.advances} />
        <StatCard
          label="الصافي"
          value={ledger.net}
          tone={ledger.net < 0 ? 'negative' : 'neutral'}
          hint="الإيداعات + السلف − المصاريف"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="الحركات"
          subtitle="مرتّبة من الأحدث إلى الأقدم."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      filter === f.key
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث…"
                className="w-full sm:w-44"
              />
            </div>
          }
        />

        {visible.length === 0 ? (
          <EmptyState text="لا توجد حركات مطابقة." />
        ) : (
          <>
            {/* موبايل */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {visible.map((m) => (
                <li
                  key={`${m.kind}-${m.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <KindBadge kind={m.kind} />
                    <Link
                      to={`/projects/${m.projectId}`}
                      className="mt-1 block truncate text-xs font-medium text-slate-700 hover:underline"
                    >
                      {m.projectName}
                    </Link>
                    {m.note && <p className="truncate text-xs text-slate-500">{m.note}</p>}
                    <p className="num mt-0.5 text-xs text-slate-400">{formatDate(m.date)}</p>
                  </div>
                  <span className={`num shrink-0 text-sm font-semibold ${KINDS[m.kind].tone}`}>
                    {formatMoney(m.amount)}
                  </span>
                </li>
              ))}
            </ul>

            {/* شاشات أكبر */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">النوع</th>
                    <th className="px-4 py-2.5 font-medium">المبلغ</th>
                    <th className="px-4 py-2.5 font-medium">المشروع</th>
                    <th className="px-4 py-2.5 font-medium">الوصف</th>
                    <th className="px-4 py-2.5 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((m) => (
                    <tr key={`${m.kind}-${m.id}`} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5">
                        <KindBadge kind={m.kind} />
                      </td>
                      <td className={`num px-4 py-2.5 font-semibold ${KINDS[m.kind].tone}`}>
                        {formatMoney(m.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/projects/${m.projectId}`}
                          className="text-slate-700 hover:underline"
                        >
                          {m.projectName}
                        </Link>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-2.5 text-slate-600">
                        {m.note || '—'}
                      </td>
                      <td className="num px-4 py-2.5 text-slate-500">{formatDate(m.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <p className="mt-3 text-xs text-slate-400">
        المبالغ بالـ{CURRENCY}. التعديل والحذف يتمّان من صفحة المشروع نفسه.
      </p>
    </div>
  )
}

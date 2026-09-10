import { useMemo, useState } from 'react'
import { useTreasury } from '../hooks/useTreasury.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Input } from '../components/ui/Field.jsx'
import TreasuryForm from '../components/treasury/TreasuryForm.jsx'
import TreasuryTable from '../components/treasury/TreasuryTable.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadCSV, stampedName } from '../utils/download.js'

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'in', label: 'إيداع' },
  { key: 'out', label: 'استلام' },
]

export default function TreasuryPage() {
  const { entries, balance, totals, addTreasuryEntry, updateTreasuryEntry, deleteTreasuryEntry } =
    useTreasury()
  const { notify } = useToast()

  const [form, setForm] = useState(null) // { type, initial? }
  const [confirmEntry, setConfirmEntry] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => (filter === 'all' ? true : e.type === filter))
      .filter((e) => (from ? e.date >= from : true))
      .filter((e) => (to ? e.date <= to : true))
      .filter((e) => (q ? `${e.note} ${e.amount} ${e.date}`.toLowerCase().includes(q) : true))
  }, [entries, filter, from, to, search])

  const filtered = useMemo(() => {
    const cashIn = visible.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0)
    const cashOut = visible.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0)
    return { cashIn, cashOut, net: cashIn - cashOut }
  }, [visible])

  const isFiltered = Boolean(search.trim() || filter !== 'all' || from || to)

  const clearFilters = () => {
    setSearch('')
    setFilter('all')
    setFrom('')
    setTo('')
  }

  const submit = (data) => {
    const res = form?.initial
      ? updateTreasuryEntry(form.initial.id, data)
      : addTreasuryEntry(data)
    if (res?.ok) notify(form?.initial ? 'تم تعديل العملية.' : 'تمت إضافة العملية.')
    return res
  }

  const exportCSV = () =>
    downloadCSV(
      visible,
      [
        { key: (e) => (e.type === 'in' ? 'إيداع' : 'استلام'), label: 'النوع' },
        { key: 'amount', label: 'المبلغ' },
        { key: (e) => formatDate(e.date), label: 'التاريخ' },
        { key: 'note', label: 'الملاحظة' },
      ],
      stampedName('mqaul-treasury', 'csv'),
    )

  return (
    <div>
      <PageHeader
        title="الصيرفة"
        description="حركة الإيداع والاستلام من الصندوق الرئيسي."
        action={
          <>
            <Button variant="success" onClick={() => setForm({ type: 'in' })}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة إيداع
            </Button>
            <Button variant="secondary" onClick={() => setForm({ type: 'out' })}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة استلام
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="رصيد الصيرفة الحالي"
          value={balance}
          tone={balance < 0 ? 'negative' : 'neutral'}
          hint="يُحسب تلقائيًا من مجموع العمليات"
        />
        <StatCard label="مجموع الإيداعات" value={totals.cashIn} tone="positive" />
        <StatCard label="مجموع الاستلامات" value={totals.cashOut} tone="muted" />
      </div>

      <Card className="mb-4 p-3 sm:p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-600">بحث</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ملاحظة أو مبلغ أو تاريخ…"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">من تاريخ</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">إلى تاريخ</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-slate-800 text-white'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <Button variant="ghost" onClick={clearFilters}>
              إلغاء التصفية
            </Button>
          )}
        </div>

        {isFiltered && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            نتيجة التصفية: إيداعات{' '}
            <span className="num font-semibold text-emerald-600">{formatMoney(filtered.cashIn)}</span>{' '}
            — استلامات{' '}
            <span className="num font-semibold text-amber-600">{formatMoney(filtered.cashOut)}</span>{' '}
            — الصافي{' '}
            <span
              className={`num font-semibold ${
                filtered.net < 0 ? 'text-red-600' : 'text-slate-800'
              }`}
            >
              {formatMoney(filtered.net)}
            </span>{' '}
            {CURRENCY}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="العمليات"
          subtitle={
            isFiltered
              ? `${visible.length} من ${entries.length} عملية`
              : 'مرتّبة من الأحدث إلى الأقدم'
          }
          action={
            <Button variant="secondary" size="sm" onClick={exportCSV} disabled={visible.length === 0}>
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير CSV
            </Button>
          }
        />
        <TreasuryTable
          entries={visible}
          emptyText={isFiltered ? 'لا توجد عمليات مطابقة.' : undefined}
          onEdit={(entry) => setForm({ type: entry.type, initial: entry })}
          onDelete={setConfirmEntry}
        />
      </Card>

      <TreasuryForm
        open={form !== null}
        type={form?.type}
        initial={form?.initial}
        onClose={() => setForm(null)}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={confirmEntry !== null}
        message={`حذف ${confirmEntry?.type === 'in' ? 'إيداع' : 'استلام'} بمبلغ ${formatMoney(
          confirmEntry?.amount || 0,
        )} ${CURRENCY}`}
        details="سيتغيّر رصيد الصيرفة بعد الحذف."
        confirmLabel="حذف العملية"
        onConfirm={() => {
          deleteTreasuryEntry(confirmEntry.id)
          notify('تم حذف العملية.')
        }}
        onClose={() => setConfirmEntry(null)}
      />
    </div>
  )
}

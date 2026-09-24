import { useMemo, useState } from 'react'
import { usePartnerLedger } from '../hooks/usePartnerLedger.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import DetailsModal from '../components/ui/DetailsModal.jsx'
import { Input } from '../components/ui/Field.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import PartnerEntryForm from '../components/partners/PartnerEntryForm.jsx'
import { PARTNER_NAMES } from '../data/mockData.js'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'
import { S } from '../utils/xlsx.js'

export default function PartnersPage() {
  const { entries, addPartnerEntry, updatePartnerEntry, deletePartnerEntry, totals } =
    usePartnerLedger()
  const { notify } = useToast()

  const [form, setForm] = useState(null) // { initial? }
  const [details, setDetails] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | اسم الدافع

  const FILTERS = [{ key: 'all', label: 'الكل' }, ...PARTNER_NAMES.map((n) => ({ key: n, label: `من ${n}` }))]

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => (filter === 'all' ? true : e.from === filter))
      .filter((e) =>
        q ? `${e.from} ${e.to} ${e.note} ${e.amount} ${formatMoney(e.amount)} ${e.date}`.toLowerCase().includes(q) : true,
      )
  }, [entries, filter, search])

  const isFiltered = Boolean(search.trim() || filter !== 'all')
  const visibleTotal = visible.reduce((s, e) => s + Number(e.amount || 0), 0)

  const exportXLSX = () =>
    downloadXLSX(
      visible,
      [
        { key: 'from', label: 'من (الدافع)' },
        { key: 'to', label: 'إلى (المستلم)' },
        { key: 'amount', label: 'المبلغ' },
        { key: (e) => formatDate(e.date), label: 'التاريخ' },
        { key: 'note', label: 'ملاحظة', width: 36 },
      ],
      stampedName('mqaul-partners', 'xlsx'),
      `حساب ${totals.a} و${totals.b}`,
      [
        [{ v: 'الملخّص', s: S.BOLD }],
        [{ v: `دفع ${totals.a}`, s: S.LABEL }, totals.paidByA, { v: CURRENCY, s: S.LABEL }],
        [{ v: `دفع ${totals.b}`, s: S.LABEL }, totals.paidByB, { v: CURRENCY, s: S.LABEL }],
        [
          {
            v: totals.creditor ? `${totals.creditor} يطلب ${totals.debtor}` : 'الحساب مسوّى',
            s: S.BOLD,
          },
          { v: totals.amount, s: S.BOLD },
          { v: CURRENCY, s: S.LABEL },
        ],
        [],
        [{ v: totals.a, s: S.BOLD }, null, { v: totals.b, s: S.BOLD }],
        {
          cells: [
            { v: 'التوقيع', s: S.LABEL },
            { v: '', s: S.LINE },
            { v: 'التوقيع', s: S.LABEL },
            { v: '', s: S.LINE },
          ],
          height: 34,
        },
      ],
    )

  return (
    <div>
      <PageHeader
        title={`حساب ${totals.a} و${totals.b}`}
        description="قيود متبادلة بين الشريكين — لا تؤثر على الصيرفة أو رأس المال أو صفحة الديون."
        action={
          <>
            <Button onClick={() => setForm({})}>
              <Icon name="plus" className="h-4 w-4" />
              قيد جديد
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportXLSX}
              disabled={visible.length === 0}
            >
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="print" className="h-4 w-4" />
              طباعة
            </Button>
          </>
        }
      />

      <div
        className={`mb-5 rounded-xl border px-5 py-5 text-center ${
          totals.creditor
            ? 'border-slate-200 bg-white'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        {totals.creditor ? (
          <>
            <p className="text-xs text-slate-500">الرصيد بين الشريكين</p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-900">{totals.creditor}</span> يطلب{' '}
              <span className="font-bold text-slate-900">{totals.debtor}</span>
            </p>
            <p className="num mt-1 text-3xl font-bold text-slate-900">
              {formatMoney(totals.amount)}{' '}
              <span className="text-sm font-normal text-slate-400">{CURRENCY}</span>
            </p>
          </>
        ) : (
          <>
            <p className="num text-2xl font-bold text-emerald-700">الحساب مسوّى</p>
            <p className="mt-1 text-xs text-emerald-600">لا أحد يطلب الآخر شيئًا.</p>
          </>
        )}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={`دفع ${totals.a}`} value={totals.paidByA} tone="neutral" />
        <StatCard label={`دفع ${totals.b}`} value={totals.paidByB} tone="neutral" />
        <StatCard label="عدد القيود" value={totals.count} money={false} tone="muted" />
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
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              إلغاء التصفية
            </Button>
          )}
        </div>

        {isFiltered && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            نتيجة التصفية: <span className="num font-semibold">{visible.length}</span> من{' '}
            <span className="num">{entries.length}</span> — المجموع{' '}
            <span className="num font-semibold text-slate-800">{formatMoney(visibleTotal)}</span>{' '}
            {CURRENCY}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="القيود"
          subtitle={
            isFiltered
              ? `${visible.length} من ${entries.length} قيد`
              : `${entries.length} قيد — اضغط على أي قيد لعرض تفاصيله`
          }
        />

        {visible.length === 0 ? (
          <EmptyState text={isFiltered ? 'لا يوجد قيد مطابق.' : 'لا توجد قيود بعد.'} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((e) => (
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
                className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    {e.from}
                    <Icon name="back" className="h-3.5 w-3.5 text-slate-400" />
                    {e.to}
                  </p>
                  {e.note && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{e.note}</p>
                  )}
                  <p className="num mt-0.5 text-xs text-slate-400">{formatDate(e.date)}</p>
                </div>
                <span className="num shrink-0 text-sm font-semibold text-slate-800">
                  {formatMoney(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <DetailsModal
        open={details !== null}
        title="تفاصيل القيد"
        tone="slate"
        badge={details ? `${details.from} ← ${details.to}` : ''}
        amount={details?.amount}
        rows={[
          { label: 'من (الدافع)', value: details?.from },
          { label: 'إلى (المستلم)', value: details?.to },
          { label: 'التاريخ', value: formatDate(details?.date), num: true },
        ]}
        note={details?.note}
        onClose={() => setDetails(null)}
        onEdit={() => {
          const e = details
          setDetails(null)
          setForm({ initial: e })
        }}
        onDelete={() => {
          const e = details
          setDetails(null)
          setConfirm(e)
        }}
      />

      <PartnerEntryForm
        open={form !== null}
        initial={form?.initial}
        onClose={() => setForm(null)}
        onSubmit={(data) => {
          const res = form?.initial
            ? updatePartnerEntry(form.initial.id, data)
            : addPartnerEntry(data)
          if (res?.ok) notify(form?.initial ? 'تم تعديل القيد.' : 'تم تسجيل القيد.')
          return res
        }}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="حذف القيد"
        message={`حذف قيد بمبلغ ${formatMoney(confirm?.amount || 0)} ${CURRENCY} من ${
          confirm?.from
        } إلى ${confirm?.to}.`}
        details="سيتغيّر الرصيد بين الشريكين بعد الحذف."
        confirmLabel="حذف القيد"
        onConfirm={() => {
          deletePartnerEntry(confirm.id)
          notify('تم حذف القيد.')
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

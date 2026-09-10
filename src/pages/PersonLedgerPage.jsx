import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDebts } from '../hooks/useDebts.js'
import { useData } from '../data/DataContext.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { ErrorMessage, Input } from '../components/ui/Field.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import PersonForm from '../components/debts/PersonForm.jsx'
import DebtEntryForm from '../components/debts/DebtEntryForm.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadCSV, stampedName } from '../utils/download.js'

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'debt', label: 'ديون' },
  { key: 'receipt', label: 'سندات قبض' },
]

function TypeBadge({ type }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
        type === 'debt' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {type === 'debt' ? 'دين' : 'سند قبض'}
    </span>
  )
}

/** صفحة سجل شخص واحد — كل حركاته النقدية مع تعديل وحذف بتأكيد. */
export default function PersonLedgerPage() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const {
    getPerson,
    availableCapital,
    entriesOfPerson,
    addDebt,
    addReceipt,
    updateDebtEntry,
    deleteDebtEntry,
    updatePerson,
    deletePerson,
  } = useDebts()
  const { listsOfPerson } = useData()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [entryForm, setEntryForm] = useState(null) // { kind, initial? }
  const [editPersonOpen, setEditPersonOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'entry' | 'person', entry? }
  const [error, setError] = useState('')

  const person = getPerson(personId)
  const entries = person ? entriesOfPerson(person.id) : []

  const totals = useMemo(() => {
    const given = entries
      .filter((e) => e.type === 'debt')
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    const received = entries
      .filter((e) => e.type === 'receipt')
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    return { given, received }
  }, [entries])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter((e) => (filter === 'all' ? true : e.type === filter))
      .filter((e) => (q ? `${e.note} ${e.amount} ${e.date}`.toLowerCase().includes(q) : true))
  }, [entries, filter, search])

  if (!person) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text="الشخص غير موجود.">
          <Link to="/debts">
            <Button variant="secondary">العودة إلى الديون</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  const personListsCount = listsOfPerson(person.id).length

  const submitEntry = (data) => {
    const isEdit = Boolean(entryForm?.initial)
    const res = isEdit
      ? updateDebtEntry(entryForm.initial.id, data)
      : entryForm?.kind === 'debt'
        ? addDebt(data)
        : addReceipt(data)
    if (res?.ok) {
      notify(
        isEdit
          ? 'تم تعديل الحركة.'
          : entryForm?.kind === 'debt'
            ? 'تمت إضافة الدين.'
            : 'تم تسجيل سند القبض.',
      )
    }
    return res
  }

  const exportCSV = () =>
    downloadCSV(
      entries,
      [
        { key: (e) => (e.type === 'debt' ? 'دين' : 'سند قبض'), label: 'النوع' },
        { key: (e) => formatDate(e.date), label: 'التاريخ' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'note', label: 'ملاحظة' },
      ],
      stampedName(`mqaul-ledger-${person.name}`, 'csv'),
    )

  const removePerson = () => {
    const res = deletePerson(person.id)
    if (res?.ok === false) {
      setError(res.error)
      notify(res.error, 'error')
    } else {
      notify('تم حذف المستخدم.')
      navigate('/debts')
    }
  }

  const rowActions = (e) => (
    <div className="flex justify-end gap-1 print:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEntryForm({ kind: e.type, initial: e })}
        aria-label="تعديل"
      >
        <Icon name="edit" className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirm({ kind: 'entry', entry: e })}
        aria-label="حذف"
      >
        <Icon name="trash" className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div>
      <Link
        to="/debts"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 print:hidden"
      >
        <Icon name="back" className="h-4 w-4" />
        الديون
      </Link>

      <PageHeader
        title={person.name}
        description={person.phone || 'بدون رقم هاتف'}
        action={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={entries.length === 0}
            >
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="print" className="h-4 w-4" />
              طباعة كشف الحساب
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditPersonOpen(true)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل البيانات
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'person' })}>
              <Icon name="trash" className="h-4 w-4" />
              حذف المستخدم
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      {person.notes && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          {person.notes}
        </p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={person.balance < 0 ? 'رصيد له لدينا' : person.balance > 0 ? 'دين عليه' : 'الرصيد'}
          value={Math.abs(person.balance)}
          tone={person.balance > 0 ? 'negative' : person.balance < 0 ? 'neutral' : 'muted'}
          hint={
            person.balance < 0
              ? 'استلمنا منه أكثر من دينه'
              : person.balance > 0
                ? 'المبلغ المتبقي عليه'
                : 'مسدَّد بالكامل'
          }
        />
        <StatCard label="مجموع ما أُعطي" value={totals.given} tone="neutral" hint="كل الديون" />
        <StatCard
          label="مجموع ما استُلم"
          value={totals.received}
          tone="positive"
          hint="كل سندات القبض"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setEntryForm({ kind: 'debt' })}>
          <Icon name="plus" className="h-4 w-4" />
          إضافة دين
        </Button>
        <Button size="sm" variant="success" onClick={() => setEntryForm({ kind: 'receipt' })}>
          <Icon name="plus" className="h-4 w-4" />
          سند قبض
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="سجل الحركات"
          subtitle={`${visible.length} من ${entries.length} حركة`}
          action={
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الملاحظات أو المبلغ…"
                className="w-52"
              />
              <div className="flex gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === f.key
                        ? 'bg-slate-800 text-white'
                        : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {visible.length === 0 ? (
          <EmptyState text="لا توجد حركات مطابقة." />
        ) : (
          <>
            {/* موبايل */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {visible.map((e) => (
                <li key={e.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <TypeBadge type={e.type} />
                      <p className="mt-1 truncate text-sm text-slate-700">{e.note || '—'}</p>
                      <p className="num mt-0.5 text-xs text-slate-400">{formatDate(e.date)}</p>
                    </div>
                    <span
                      className={`num shrink-0 text-sm font-semibold ${
                        e.type === 'debt' ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {e.type === 'debt' ? '+' : '−'}
                      {formatMoney(e.amount)}
                    </span>
                  </div>
                  <div className="mt-2">{rowActions(e)}</div>
                </li>
              ))}
            </ul>

            {/* شاشات أكبر */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">النوع</th>
                    <th className="px-4 py-2.5 font-medium">التاريخ</th>
                    <th className="px-4 py-2.5 font-medium">المبلغ</th>
                    <th className="px-4 py-2.5 font-medium">ملاحظة</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5">
                        <TypeBadge type={e.type} />
                      </td>
                      <td className="num px-4 py-2.5 text-slate-500">{formatDate(e.date)}</td>
                      <td
                        className={`num px-4 py-2.5 font-semibold ${
                          e.type === 'debt' ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {e.type === 'debt' ? '+' : '−'}
                        {formatMoney(e.amount)}
                      </td>
                      <td className="max-w-[18rem] truncate px-4 py-2.5 text-slate-500">
                        {e.note || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-left">{rowActions(e)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <DebtEntryForm
        open={entryForm !== null}
        kind={entryForm?.kind}
        person={person}
        initial={entryForm?.initial}
        limit={entryForm?.kind === 'debt' ? availableCapital : person.balance}
        onClose={() => setEntryForm(null)}
        onSubmit={submitEntry}
      />

      <PersonForm
        open={editPersonOpen}
        initial={person}
        onClose={() => setEditPersonOpen(false)}
        onSubmit={(data) => {
          updatePerson(person.id, data)
          notify('تم تعديل بيانات المستخدم.')
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === 'entry'}
        message={`حذف ${confirm?.entry?.type === 'debt' ? 'دين' : 'سند قبض'} بمبلغ ${formatMoney(
          confirm?.entry?.amount || 0,
        )} ${CURRENCY}`}
        details="سيتغيّر رصيد الشخص والرصيد الكلي المتاح بعد الحذف."
        confirmLabel="حذف الحركة"
        onConfirm={() => {
          deleteDebtEntry(confirm.entry.id)
          notify('تم حذف الحركة.')
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.kind === 'person'}
        title="حذف المستخدم"
        message={`حذف «${person.name}» وكل حركاته النقدية (${entries.length} حركة).`}
        details={
          personListsCount > 0
            ? `مرتبط بـ ${personListsCount} قائمة — سيُرفض الحذف حتى تحذف قوائمه أولًا.`
            : undefined
        }
        confirmPhrase={person.name}
        confirmLabel="حذف المستخدم"
        onConfirm={removePerson}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

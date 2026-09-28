import { useMemo, useState } from 'react'
import { useDebts } from '../hooks/useDebts.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import DetailsModal from '../components/ui/DetailsModal.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { usePrint } from '../components/print/PrintProvider.jsx'
import { debtVoucher } from '../components/print/vouchers.js'
import { ErrorMessage, Input } from '../components/ui/Field.jsx'
import PeopleTable from '../components/debts/PeopleTable.jsx'
import DebtLogTable from '../components/debts/DebtLogTable.jsx'
import DebtLogFilters, {
  EMPTY_FILTERS,
  applyFilters,
  isFiltered,
} from '../components/debts/DebtLogFilters.jsx'
import PersonForm from '../components/debts/PersonForm.jsx'
import DebtEntryForm from '../components/debts/DebtEntryForm.jsx'
import { downloadXLSX, stampedName } from '../utils/download.js'

const SORTS = [
  { key: 'debt', label: 'الأكثر دينًا' },
  { key: 'name', label: 'الاسم' },
]

const TABS = [
  { key: 'people', label: 'الأشخاص' },
  { key: 'log', label: 'السجل' },
]

export default function DebtsPage() {
  const {
    outstandingOwed,
    outstandingCredit,
    totalDebtGiven,
    totalDebtReceived,
    debtLog,
    people,
    addPerson,
    deletePerson,
    addDebt,
    addReceipt,
  } = useDebts()
  const { notify } = useToast()
  const { offerPrint } = usePrint()

  const [tab, setTab] = useState('people')
  const [search, setSearch] = useState('')
  const [logFilters, setLogFilters] = useState(EMPTY_FILTERS)
  const [personDetails, setPersonDetails] = useState(null)
  const [sort, setSort] = useState('debt')
  const [personFormOpen, setPersonFormOpen] = useState(false)
  const [entryForm, setEntryForm] = useState(null) // { kind, person }
  const [confirmPerson, setConfirmPerson] = useState(null)
  const [error, setError] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = q
      ? people.filter((p) => `${p.name} ${p.phone} ${p.notes}`.toLowerCase().includes(q))
      : [...people]
    return rows.sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name, 'ar') : b.balance - a.balance,
    )
  }, [people, search, sort])

  const visibleLog = useMemo(() => applyFilters(debtLog, logFilters), [debtLog, logFilters])

  const logFiltered = isFiltered(logFilters)

  /**
   * مجاميع السجل تتبع المرشِّح — بلا مرشِّح هي مجاميع كل الحركات.
   * الرصيد = الأعطيت − الأخذت؛ موجب أي ما زال لنا عند الأشخاص.
   */
  const logTotals = useMemo(() => {
    if (!logFiltered) return { given: totalDebtGiven, received: totalDebtReceived }
    return visibleLog.reduce(
      (acc, e) =>
        e.type === 'debt'
          ? { ...acc, given: acc.given + e.amount }
          : { ...acc, received: acc.received + e.amount },
      { given: 0, received: 0 },
    )
  }, [logFiltered, visibleLog, totalDebtGiven, totalDebtReceived])

  const logBalance = logTotals.given - logTotals.received

  // الحذف يمرّ بنافذة تأكيد، ويُرفض إذا كان الشخص مرتبطًا بقوائم
  const removePerson = (person) => {
    const res = deletePerson(person.id)
    if (res?.ok === false) {
      setError(res.error)
      notify(res.error, 'error')
    } else {
      setError('')
      notify('تم حذف المستخدم.')
    }
  }

  const submitEntry = (data) => {
    const res = entryForm?.kind === 'debt' ? addDebt(data) : addReceipt(data)
    if (res?.ok) {
      notify(entryForm?.kind === 'debt' ? 'تمت إضافة الدين.' : 'تم تسجيل سند القبض.')
      offerPrint(debtVoucher(res.entry, entryForm.person.name))
    }
    return res
  }

  const exportPeople = () =>
    downloadXLSX(
      visible,
      [
        { key: 'name', label: 'الاسم' },
        { key: 'phone', label: 'الهاتف' },
        { key: (p) => (p.balance >= 0 ? p.balance : 0), label: 'دين عليه' },
        { key: (p) => (p.balance < 0 ? -p.balance : 0), label: 'له لدينا' },
        { key: 'notes', label: 'ملاحظات' },
      ],
      stampedName('mqaul-debts', 'xlsx'),
      'الديون',
    )

  const exportLog = () =>
    downloadXLSX(
      visibleLog,
      [
        { key: 'personName', label: 'الاسم' },
        { key: (e) => (e.type === 'debt' ? 'أعطيت' : 'أخذت'), label: 'الحركة' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'date', label: 'التاريخ' },
        { key: 'note', label: 'ملاحظة' },
      ],
      stampedName('mqaul-debts-log', 'xlsx'),
      'سجل الديون',
    )

  return (
    <div>
      <PageHeader
        title="الديون"
        description="الأشخاص الذين لهم دين مستحق — معزول تمامًا عن ديون القوائم."
        action={
          <Button onClick={() => setPersonFormOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة مستخدم
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      <div className="mb-4 flex gap-1.5 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-slate-800 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'people' ? (
        <>
          {/* المتبقي على الطرفين — لا مجاميع الحركات */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              label="مجموع الأعطيت"
              value={outstandingOwed}
              tone="negative"
              hint="المتبقي على الأشخاص"
            />
            <StatCard
              label="مجموع الأخذت"
              value={outstandingCredit}
              tone="positive"
              hint="ما لهم لدينا"
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="الأشخاص"
              subtitle={
                search.trim()
                  ? `${visible.length} من ${people.length} مستخدم`
                  : `${people.length} مستخدم`
              }
              action={
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث بالاسم أو الهاتف أو الملاحظات…"
                    className="w-full sm:w-64"
                  />
                  <div className="flex gap-1.5">
                    {SORTS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSort(s.key)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          sort === s.key
                            ? 'bg-slate-800 text-white'
                            : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportPeople}
                    disabled={visible.length === 0}
                  >
                    <Icon name="arrowDown" className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                </div>
              }
            />
            <PeopleTable
              people={visible}
              onOpen={setPersonDetails}
              emptyText={
                search.trim()
                  ? 'لا يوجد شخص مطابق للبحث.'
                  : 'لا يوجد أشخاص بعد — أضف مستخدمًا للبدء.'
              }
              onAddDebt={(person) => setEntryForm({ kind: 'debt', person })}
              onAddReceipt={(person) => setEntryForm({ kind: 'receipt', person })}
              onDelete={setConfirmPerson}
            />
          </Card>
        </>
      ) : (
        <>
          {/* مجاميع الحركات المعروضة، والرصيد = الفرق بينهما */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="مجموع الأعطيت"
              value={logTotals.given}
              tone="negative"
              hint={logFiltered ? 'ضمن المرشِّح' : 'كل ما أُعطي للأشخاص'}
            />
            <StatCard
              label="مجموع الأخذت"
              value={logTotals.received}
              tone="positive"
              hint={logFiltered ? 'ضمن المرشِّح' : 'كل ما اُستُلم منهم'}
            />
            <StatCard
              label="الرصيد"
              value={Math.abs(logBalance)}
              tone={logBalance > 0 ? 'negative' : logBalance < 0 ? 'positive' : 'muted'}
              hint={
                logBalance > 0
                  ? 'الأعطيت − الأخذت (لنا عندهم)'
                  : logBalance < 0
                    ? 'الأخذت − الأعطيت (لهم عندنا)'
                    : 'متساويان'
              }
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="سجل الحركات"
              subtitle={
                logFiltered
                  ? `${visibleLog.length} من ${debtLog.length} حركة`
                  : `${debtLog.length} حركة`
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportLog}
                  disabled={visibleLog.length === 0}
                >
                  <Icon name="arrowDown" className="h-4 w-4" />
                  تصدير Excel
                </Button>
              }
            />
            <DebtLogFilters
              value={logFilters}
              onChange={setLogFilters}
              onReset={() => setLogFilters(EMPTY_FILTERS)}
            />
            <DebtLogTable
              entries={visibleLog}
              emptyText={
                logFiltered ? 'لا توجد حركة مطابقة للمرشِّح.' : 'لا توجد حركات بعد.'
              }
            />
          </Card>
        </>
      )}

      <DetailsModal
        open={personDetails !== null}
        title={personDetails?.name}
        tone={personDetails?.balance > 0 ? 'red' : personDetails?.balance < 0 ? 'emerald' : 'slate'}
        badge={
          personDetails?.balance > 0
            ? 'دين عليه'
            : personDetails?.balance < 0
              ? 'رصيد له لدينا'
              : 'مسدَّد بالكامل'
        }
        amount={Math.abs(personDetails?.balance || 0)}
        rows={[{ label: 'الهاتف', value: personDetails?.phone, num: true }]}
        note={personDetails?.notes}
        noteLabel="ملاحظات"
        emptyNoteText="لا توجد ملاحظات."
        onClose={() => setPersonDetails(null)}
      />

      <PersonForm
        open={personFormOpen}
        onClose={() => setPersonFormOpen(false)}
        onSubmit={(data) => {
          addPerson(data)
          notify('تمت إضافة المستخدم.')
        }}
      />

      <DebtEntryForm
        open={entryForm !== null}
        kind={entryForm?.kind}
        person={entryForm?.person}
        balance={people.find((p) => p.id === entryForm?.person?.id)?.balance ?? 0}
        onClose={() => setEntryForm(null)}
        onSubmit={submitEntry}
      />

      <ConfirmDialog
        open={confirmPerson !== null}
        title="حذف المستخدم"
        message={`حذف «${confirmPerson?.name}» وكل حركاته النقدية.`}
        confirmPhrase={confirmPerson?.name}
        confirmLabel="حذف المستخدم"
        onConfirm={() => removePerson(confirmPerson)}
        onClose={() => setConfirmPerson(null)}
      />
    </div>
  )
}

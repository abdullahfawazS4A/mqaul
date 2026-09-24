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
import { ErrorMessage, Input } from '../components/ui/Field.jsx'
import CapitalCard from '../components/debts/CapitalCard.jsx'
import PeopleTable from '../components/debts/PeopleTable.jsx'
import PersonForm from '../components/debts/PersonForm.jsx'
import DebtEntryForm from '../components/debts/DebtEntryForm.jsx'
import { downloadXLSX, stampedName } from '../utils/download.js'

const SORTS = [
  { key: 'debt', label: 'الأكثر دينًا' },
  { key: 'name', label: 'الاسم' },
]

export default function DebtsPage() {
  const {
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
    people,
    addPerson,
    deletePerson,
    addDebt,
    addReceipt,
  } = useDebts()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
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

  const peopleInCredit = people.filter((p) => p.balance < 0).length

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
    if (res?.ok) notify(entryForm?.kind === 'debt' ? 'تمت إضافة الدين.' : 'تم تسجيل سند القبض.')
    return res
  }

  const exportXLSX = () =>
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

  return (
    <div>
      <PageHeader
        title="الديون"
        description="الأشخاص الذين لهم دين مستحق من رأس المال — معزول تمامًا عن ديون القوائم."
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CapitalCard capital={capital} onSave={updateCapital} />
        <StatCard
          label="الرصيد الكلي المتاح"
          value={availableCapital}
          tone={availableCapital < 0 ? 'negative' : 'positive'}
          hint="رأس المال − الديون القائمة"
        />
        <StatCard
          label="مجموع الديون القائمة"
          value={totalOutstandingDebt}
          tone="negative"
          hint={peopleInCredit > 0 ? `${peopleInCredit} شخص له رصيد لدينا` : undefined}
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
                onClick={exportXLSX}
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
        limit={
          entryForm?.kind === 'debt'
            ? availableCapital
            : (people.find((p) => p.id === entryForm?.person?.id)?.balance ?? 0)
        }
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

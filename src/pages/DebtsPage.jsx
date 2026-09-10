import { useState } from 'react'
import { useDebts } from '../hooks/useDebts.js'
import { useData } from '../data/DataContext.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import CapitalCard from '../components/debts/CapitalCard.jsx'
import PeopleTable from '../components/debts/PeopleTable.jsx'
import PersonForm from '../components/debts/PersonForm.jsx'
import DebtEntryForm from '../components/debts/DebtEntryForm.jsx'
import PersonHistoryModal from '../components/debts/PersonHistoryModal.jsx'

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
    entriesOfPerson,
  } = useDebts()
  const { deleteDebtEntry } = useData()

  const [personFormOpen, setPersonFormOpen] = useState(false)
  const [entryForm, setEntryForm] = useState(null) // { kind, person }
  const [historyPerson, setHistoryPerson] = useState(null)

  // نُبقي مرجع الشخص محدّثًا بعد كل عملية
  const currentHistoryPerson = historyPerson
    ? people.find((p) => p.id === historyPerson.id) || null
    : null

  return (
    <div>
      <PageHeader
        title="الديون"
        description="الأشخاص الذين لهم دين مستحق من رأس المال."
        action={
          <Button onClick={() => setPersonFormOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة مستخدم
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CapitalCard capital={capital} onSave={updateCapital} />
        <StatCard
          label="الرصيد الكلي المتاح"
          value={availableCapital}
          tone={availableCapital < 0 ? 'negative' : 'positive'}
          hint="رأس المال − الديون القائمة"
        />
        <StatCard label="مجموع الديون القائمة" value={totalOutstandingDebt} tone="negative" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="الأشخاص" subtitle={`${people.length} مستخدم`} />
        <PeopleTable
          people={people}
          onAddDebt={(person) => setEntryForm({ kind: 'debt', person })}
          onAddReceipt={(person) => setEntryForm({ kind: 'receipt', person })}
          onShowHistory={(person) => setHistoryPerson(person)}
          onDelete={(person) => deletePerson(person.id)}
        />
      </Card>

      <PersonForm
        open={personFormOpen}
        onClose={() => setPersonFormOpen(false)}
        onSubmit={addPerson}
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
        onSubmit={entryForm?.kind === 'debt' ? addDebt : addReceipt}
      />

      <PersonHistoryModal
        open={currentHistoryPerson !== null}
        person={currentHistoryPerson}
        entries={currentHistoryPerson ? entriesOfPerson(currentHistoryPerson.id) : []}
        onClose={() => setHistoryPerson(null)}
        onDelete={deleteDebtEntry}
      />
    </div>
  )
}

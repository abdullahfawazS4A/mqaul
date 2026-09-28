import { useData } from '../data/DataContext.jsx'

/** واجهة الديون النقدية — معزولة تمامًا عن ديون القوائم. */
export function useDebts() {
  const {
    totalDebtGiven,
    totalDebtReceived,
    outstandingOwed,
    outstandingCredit,
    debtLog,
    people,
    getPerson,
    addPerson,
    updatePerson,
    deletePerson,
    addDebt,
    addReceipt,
    updateDebtEntry,
    deleteDebtEntry,
    entriesOfPerson,
  } = useData()

  return {
    totalDebtGiven,
    totalDebtReceived,
    outstandingOwed,
    outstandingCredit,
    debtLog,
    people,
    getPerson,
    addPerson,
    updatePerson,
    deletePerson,
    addDebt,
    addReceipt,
    updateDebtEntry,
    deleteDebtEntry,
    entriesOfPerson,
  }
}

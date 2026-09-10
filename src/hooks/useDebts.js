import { useData } from '../data/DataContext.jsx'

/** واجهة الديون النقدية (رأس المال) — معزولة تمامًا عن ديون القوائم. */
export function useDebts() {
  const {
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
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
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
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

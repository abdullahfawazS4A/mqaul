import { useData } from '../data/DataContext.jsx'

/** واجهة الديون. */
export function useDebts() {
  const {
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
    people,
    addPerson,
    updatePerson,
    deletePerson,
    addDebt,
    addReceipt,
    deleteDebtEntry,
    entriesOfPerson,
  } = useData()

  return {
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
    people,
    addPerson,
    updatePerson,
    deletePerson,
    addDebt,
    addReceipt,
    deleteDebtEntry,
    entriesOfPerson,
  }
}

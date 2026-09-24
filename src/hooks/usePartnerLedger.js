import { useData } from '../data/DataContext.jsx'

/**
 * حساب الشريكين — قيود متبادلة بينهما فقط.
 * معزول عن الصيرفة ورأس المال وصفحة الديون؛ لا يدخل في أي مجموع آخر.
 */
export function usePartnerLedger() {
  const {
    partnerEntries,
    addPartnerEntry,
    updatePartnerEntry,
    deletePartnerEntry,
    partnerTotals,
  } = useData()

  const entries = [...partnerEntries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  )

  return {
    entries,
    addPartnerEntry,
    updatePartnerEntry,
    deletePartnerEntry,
    totals: partnerTotals,
  }
}

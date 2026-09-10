import { useData } from '../data/DataContext.jsx'

/** واجهة الصيرفة — كل ما تحتاجه شاشة الصيرفة فقط. */
export function useTreasury() {
  const { treasury, treasuryBalance, treasuryTotals, addTreasuryEntry, deleteTreasuryEntry } =
    useData()

  const entries = [...treasury].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return { entries, balance: treasuryBalance, totals: treasuryTotals, addTreasuryEntry, deleteTreasuryEntry }
}

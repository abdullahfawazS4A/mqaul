import { useData } from '../data/DataContext.jsx'

/** واجهة القوائم — عرض/تسجيل فقط، بلا أي أثر حسابي على الصيرفة أو الديون. */
export function useLists() {
  const { lists, addList, updateList, deleteList, toggleListStatus } = useData()
  return { lists, addList, updateList, deleteList, toggleListStatus }
}

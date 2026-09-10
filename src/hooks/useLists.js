import { useData } from '../data/DataContext.jsx'

/**
 * واجهة القوائم — عرض/تسجيل فقط، بلا أي أثر حسابي على الصيرفة أو رأس المال.
 * كل قائمة مرتبطة بشخص موجود في صفحة الديون (people)، ودين القوائم
 * على الشخص = مجموع أرباح قوائمه غير المقبوضة.
 */
export function useLists() {
  const {
    lists,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    people,
    listsOfPerson,
    listsDebtByPerson,
    listsTotals,
  } = useData()

  return {
    lists,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    people,
    listsOfPerson,
    listsDebtByPerson,
    listsTotals,
  }
}

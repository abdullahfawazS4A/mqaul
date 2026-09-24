import { useData } from '../data/DataContext.jsx'

/**
 * واجهة القوائم — عرض/تسجيل فقط، بلا أي أثر حسابي على الصيرفة أو رأس المال.
 * كل قائمة مرتبطة بشخص موجود في صفحة الديون (people)، ودين القوائم عليه =
 * أرباح قوائمه غير المقبوضة − سندات قبض قوائمه. هذا الدين منفصل تمامًا
 * عن دينه النقدي في صفحة الديون؛ المشترك بينهما اسم الشخص فقط.
 */
export function useLists() {
  const {
    lists,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    addListReceipt,
    deleteListReceipt,
    listReceiptsOfPerson,
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
    addListReceipt,
    deleteListReceipt,
    listReceiptsOfPerson,
    people,
    listsOfPerson,
    listsDebtByPerson,
    listsTotals,
  }
}

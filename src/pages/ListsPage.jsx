import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLists } from '../hooks/useLists.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Input } from '../components/ui/Field.jsx'
import ListForm from '../components/lists/ListForm.jsx'
import ListsTable from '../components/lists/ListsTable.jsx'
import ListDebtsTable from '../components/lists/ListDebtsTable.jsx'
import { CURRENCY, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'

const TABS = [
  { key: 'lists', label: 'القوائم' },
  { key: 'debts', label: 'ديون الأشخاص' },
]

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'paid', label: 'واصل' },
  { key: 'unpaid', label: 'دين' },
]

export default function ListsPage() {
  const {
    lists,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    people,
    listsDebtByPerson,
    listsTotals,
  } = useLists()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('lists')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmList, setConfirmList] = useState(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lists
      .filter((l) => (filter === 'all' ? true : l.status === filter))
      .filter((l) =>
        q ? `${l.personName} ${l.listNumber} ${l.date} ${l.notes}`.toLowerCase().includes(q) : true,
      )
  }, [lists, filter, search])

  const visibleTotals = useMemo(
    () => ({
      value: visible.reduce((s, l) => s + Number(l.value || 0), 0),
      profit: visible.reduce((s, l) => s + Number(l.profit || 0), 0),
    }),
    [visible],
  )

  const debtRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? listsDebtByPerson.filter((r) => `${r.name} ${r.phone}`.toLowerCase().includes(q))
      : listsDebtByPerson
  }, [listsDebtByPerson, search])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormOpen(true)
  }

  // يُعيد نتيجة الحفظ للنموذج ليعرض الخطأ بدل الإغلاق
  const submit = (data) => {
    const res = editing ? updateList(editing.id, data) : addList(data)
    if (res?.ok) notify(editing ? 'تم تعديل القائمة.' : 'تمت إضافة القائمة.')
    return res
  }

  const exportLists = () =>
    downloadXLSX(
      visible,
      [
        { key: 'personName', label: 'اسم الشخص' },
        { key: 'listNumber', label: 'رقم القائمة' },
        { key: 'date', label: 'التاريخ' },
        { key: 'value', label: 'القيمة' },
        { key: 'profit', label: 'الربح' },
        { key: (l) => (l.status === 'paid' ? 'واصل' : 'دين'), label: 'الحالة' },
        { key: 'notes', label: 'ملاحظات' },
      ],
      stampedName('mqaul-lists', 'xlsx'),
      'القوائم',
    )

  const exportDebts = () =>
    downloadXLSX(
      debtRows,
      [
        { key: 'name', label: 'اسم الشخص' },
        { key: 'phone', label: 'الهاتف' },
        { key: 'listsCount', label: 'عدد القوائم' },
        { key: 'unpaidCount', label: 'غير مقبوضة' },
        { key: 'listsValue', label: 'قيمة القوائم' },
        { key: 'collected', label: 'الربح المقبوض' },
        { key: 'receipts', label: 'سندات القبض' },
        { key: 'debt', label: 'دين القوائم' },
      ],
      stampedName('mqaul-list-debts', 'xlsx'),
      'ديون القوائم',
    )

  return (
    <div>
      <PageHeader
        title="القوائم"
        description="سجل القوائم — لا يؤثر على الصيرفة أو رأس المال. كل قائمة باسم شخص مسجّل في الديون."
        action={
          <Button onClick={openAdd}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة قائمة
          </Button>
        }
      />

      <div className="mb-4 flex gap-1.5 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lists' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو رقم القائمة أو الملاحظات…"
              className="w-full sm:w-72"
            />
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="جميع القوائم"
              subtitle={
                <>
                  {visible.length} قائمة — القيمة{' '}
                  <span className="num">{formatMoney(visibleTotals.value)}</span>، الربح{' '}
                  <span className="num">{formatMoney(visibleTotals.profit)}</span> {CURRENCY}
                </>
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportLists}
                  disabled={visible.length === 0}
                >
                  <Icon name="arrowDown" className="h-4 w-4" />
                  تصدير Excel
                </Button>
              }
            />
            <ListsTable
              lists={visible}
              onEdit={openEdit}
              onDelete={setConfirmList}
              onToggleStatus={toggleListStatus}
            />
          </Card>
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="مجموع ديون القوائم"
              value={listsTotals.debt}
              tone="negative"
              hint="أرباح القوائم غير المقبوضة"
            />
            <StatCard
              label="الأرباح المقبوضة"
              value={listsTotals.collected}
              tone="positive"
              hint="قوائم واصلة + سندات القبض"
            />
            <StatCard
              label="أشخاص عليهم دين قوائم"
              value={listsTotals.peopleInDebt}
              money={false}
              tone="neutral"
            />
          </div>

          <div className="mb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم الشخص أو هاتفه…"
              className="w-full sm:w-72"
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="ديون القوائم حسب الشخص"
              subtitle={`${debtRows.length} شخص — اضغط على أي شخص لعرض سجل قوائمه`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportDebts}
                  disabled={debtRows.length === 0}
                >
                  <Icon name="arrowDown" className="h-4 w-4" />
                  تصدير Excel
                </Button>
              }
            />
            <ListDebtsTable rows={debtRows} onShowLists={(r) => navigate(`/lists/${r.id}`)} />
          </Card>
        </>
      )}

      <ListForm
        open={formOpen}
        initial={editing}
        people={people}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={confirmList !== null}
        message={`حذف القائمة رقم ${confirmList?.listNumber} باسم «${confirmList?.personName}».`}
        details={`القيمة ${formatMoney(confirmList?.value || 0)} — الربح ${formatMoney(
          confirmList?.profit || 0,
        )} ${CURRENCY}`}
        confirmLabel="حذف القائمة"
        onConfirm={() => {
          deleteList(confirmList.id)
          notify('تم حذف القائمة.')
        }}
        onClose={() => setConfirmList(null)}
      />
    </div>
  )
}

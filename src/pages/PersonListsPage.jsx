import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLists } from '../hooks/useLists.js'
import { useData } from '../data/DataContext.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import DetailsModal from '../components/ui/DetailsModal.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ListReceiptForm from '../components/lists/ListReceiptForm.jsx'
import ListDetails from '../components/lists/ListDetails.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'
import { S } from '../utils/xlsx.js'

function StatusBadge({ status, onClick }) {
  const paid = status === 'paid'
  return (
    <button
      type="button"
      onClick={onClick}
      title="اضغط لتبديل الحالة"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors print:hidden ${
        paid
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      {paid ? 'واصل' : 'دين'}
    </button>
  )
}

/**
 * سجل قوائم شخص واحد — نظير صفحة سجل الديون، لكن لديون القوائم.
 * دين القوائم = أرباح القوائم غير المقبوضة − سندات قبض القوائم،
 * وهو منفصل تمامًا عن دين الشخص النقدي في صفحة الديون.
 */
export default function PersonListsPage() {
  const { personId } = useParams()
  const {
    listsOfPerson,
    listReceiptsOfPerson,
    toggleListStatus,
    addListReceipt,
    deleteListReceipt,
  } = useLists()
  const { getPerson } = useData()
  const { notify } = useToast()

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [confirmReceipt, setConfirmReceipt] = useState(null)
  const [listDetails, setListDetails] = useState(null)
  const [receiptDetails, setReceiptDetails] = useState(null)

  const person = getPerson(personId)
  const lists = person ? listsOfPerson(person.id) : []
  const receipts = person ? listReceiptsOfPerson(person.id) : []

  const totals = useMemo(() => {
    const unpaidProfit = lists
      .filter((l) => l.status === 'unpaid')
      .reduce((s, l) => s + Number(l.profit || 0), 0)
    const received = receipts.reduce((s, r) => s + Number(r.amount || 0), 0)
    const net = unpaidProfit - received
    return {
      unpaidProfit,
      received,
      debt: Math.max(net, 0),
      overpaid: Math.max(-net, 0),
      listsValue: lists.reduce((s, l) => s + Number(l.value || 0), 0),
    }
  }, [lists, receipts])

  if (!person) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text="الشخص غير موجود.">
          <Link to="/lists">
            <Button variant="secondary">العودة إلى مكاتب</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  // فتح التفاصيل بالنقر — مع منع الأزرار من تشغيله.
  const openProps = (fn, item) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => fn(item),
    onKeyDown: (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        fn(item)
      }
    },
  })
  const stop = {
    onClick: (ev) => ev.stopPropagation(),
    onKeyDown: (ev) => ev.stopPropagation(),
  }

  const exportXLSX = () => {
    const rows = [
      ...lists.map((l) => ({
        kind: 'قائمة',
        name: l.name || '',
        ref: l.listNumber,
        date: formatDate(l.date),
        value: l.value,
        amount: l.profit,
        status: l.status === 'paid' ? 'واصل' : 'دين',
        note: l.notes,
      })),
      ...receipts.map((r) => ({
        kind: 'سند قبض',
        name: '',
        ref: '',
        date: formatDate(r.date),
        value: '',
        amount: r.amount,
        status: '',
        note: r.note,
      })),
    ]
    const label = (t) => ({ v: t, s: S.LABEL })
    const line = { v: '', s: S.LINE }
    downloadXLSX(
      rows,
      [
        { key: 'kind', label: 'النوع' },
        { key: 'name', label: 'اسم القائمة', width: 26 },
        { key: 'ref', label: 'رقم القائمة' },
        { key: 'date', label: 'التاريخ' },
        { key: 'value', label: 'قيمة القائمة' },
        { key: 'amount', label: 'الربح / المقبوض' },
        { key: 'status', label: 'الحالة' },
        { key: 'note', label: 'ملاحظة', width: 40 },
      ],
      stampedName(`mqaul-lists-${person.name}`, 'xlsx'),
      `قوائم ${person.name}`,
      [
        [{ v: 'الملخّص', s: S.BOLD }],
        ['أرباح غير مقبوضة', totals.unpaidProfit, label(CURRENCY)],
        ['سندات القبض', totals.received, label(CURRENCY)],
        [
          { v: totals.overpaid > 0 ? 'قبض زائد' : 'دين القوائم', s: S.BOLD },
          { v: totals.overpaid > 0 ? totals.overpaid : totals.debt, s: S.BOLD },
          label(CURRENCY),
        ],
        [],
        [label('دين القوائم منفصل عن الدين النقدي في صفحة الديون.')],
        [],
        [{ v: 'المُسلِّم', s: S.BOLD }, null, { v: 'المُستلِم', s: S.BOLD }],
        { cells: [label('الاسم'), line, label('الاسم'), line], height: 26 },
        { cells: [label('التوقيع'), line, label('التوقيع'), line], height: 34 },
        { cells: [label('التاريخ'), line, label('التاريخ'), line], height: 26 },
      ],
    )
  }

  return (
    <div>
      <Link
        to="/lists"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 print:hidden"
      >
        <Icon name="back" className="h-4 w-4" />
        مكاتب
      </Link>

      <PageHeader
        title={person.name}
        description={person.phone || 'بدون رقم هاتف'}
        action={
          <>
            <Button variant="success" size="sm" onClick={() => setReceiptOpen(true)}>
              <Icon name="plus" className="h-4 w-4" />
              سند قبض
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportXLSX}
              disabled={lists.length === 0 && receipts.length === 0}
            >
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="print" className="h-4 w-4" />
              طباعة الكشف
            </Button>
          </>
        }
      />

      <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={totals.overpaid > 0 ? 'قبض زائد' : 'دين القوائم'}
          value={totals.overpaid > 0 ? totals.overpaid : totals.debt}
          tone={totals.overpaid > 0 ? 'positive' : totals.debt > 0 ? 'negative' : 'muted'}
          hint="أرباح غير مقبوضة − سندات القبض"
        />
        <StatCard
          label="أرباح غير مقبوضة"
          value={totals.unpaidProfit}
          tone="neutral"
          hint="قوائم بحالة دين"
        />
        <StatCard
          label="سندات القبض"
          value={totals.received}
          tone="positive"
          hint={`${receipts.length} سند`}
        />
      </div>

      <p className="mb-5 text-xs text-slate-400">
        دين القوائم منفصل عن دين هذا الشخص النقدي في صفحة الديون — لا يجمعان ولا يؤثر أحدهما على
        الآخر.
      </p>

      <Card className="mb-4 overflow-hidden">
        <CardHeader
          title="القوائم"
          subtitle={`${lists.length} قائمة — قيمتها ${formatMoney(totals.listsValue)} ${CURRENCY}`}
        />
        {lists.length === 0 ? (
          <EmptyState text="لا توجد قوائم لهذا الشخص." />
        ) : (
          <>
            {/* موبايل */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {lists.map((l) => (
                <li
                  key={l.id}
                  {...openProps(setListDetails, l)}
                  className="cursor-pointer px-4 py-3 transition-colors active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {l.name || `قائمة رقم ${l.listNumber}`}
                      </p>
                      {l.name && (
                        <p className="num text-xs text-slate-500">قائمة رقم {l.listNumber}</p>
                      )}
                      <p className="num text-xs text-slate-400">{formatDate(l.date)}</p>
                      {l.notes && (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-slate-500">
                          {l.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-sm font-semibold text-slate-800">
                        {formatMoney(l.profit)}
                      </span>
                      <span {...stop}>
                        <StatusBadge status={l.status} onClick={() => toggleListStatus(l.id)} />
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* شاشات أكبر */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">اسم القائمة</th>
                    <th className="px-4 py-2.5 font-medium">رقم القائمة</th>
                    <th className="px-4 py-2.5 font-medium">التاريخ</th>
                    <th className="px-4 py-2.5 font-medium">القيمة</th>
                    <th className="px-4 py-2.5 font-medium">الربح</th>
                    <th className="px-4 py-2.5 font-medium">الحالة</th>
                    <th className="px-4 py-2.5 font-medium">ملاحظة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lists.map((l) => (
                    <tr
                      key={l.id}
                      {...openProps(setListDetails, l)}
                      className="cursor-pointer hover:bg-slate-50/70"
                    >
                      <td className="max-w-[12rem] truncate px-4 py-2.5 font-medium text-slate-800">
                        {l.name || '—'}
                      </td>
                      <td className="num px-4 py-2.5 text-slate-500">{l.listNumber}</td>
                      <td className="num px-4 py-2.5 text-slate-500">{formatDate(l.date)}</td>
                      <td className="num px-4 py-2.5 text-slate-700">{formatMoney(l.value)}</td>
                      <td className="num px-4 py-2.5 font-semibold text-slate-800">
                        {formatMoney(l.profit)}
                      </td>
                      <td className="px-4 py-2.5" {...stop}>
                        <StatusBadge status={l.status} onClick={() => toggleListStatus(l.id)} />
                      </td>
                      <td className="max-w-[18rem] px-4 py-2.5 text-slate-500">
                        <span className="block truncate">{l.notes || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="سندات القبض"
          subtitle={`${receipts.length} سند — مجموعها ${formatMoney(totals.received)} ${CURRENCY}`}
          action={
            <Button variant="success" size="sm" onClick={() => setReceiptOpen(true)}>
              <Icon name="plus" className="h-4 w-4" />
              سند قبض
            </Button>
          }
        />
        {receipts.length === 0 ? (
          <EmptyState text="لا توجد سندات قبض بعد." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {receipts.map((r) => (
              <li
                key={r.id}
                {...openProps(setReceiptDetails, r)}
                className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors active:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="num text-sm font-semibold text-emerald-600">
                    {formatMoney(r.amount)}{' '}
                    <span className="text-xs font-normal text-slate-400">{CURRENCY}</span>
                  </p>
                  <p className="num text-xs text-slate-400">{formatDate(r.date)}</p>
                  {r.note && (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-slate-500">
                      {r.note}
                    </p>
                  )}
                </div>
                <span {...stop}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmReceipt(r)}
                    aria-label="حذف السند"
                    className="print:hidden"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ListDetails
        item={listDetails}
        onClose={() => setListDetails(null)}
      />

      <DetailsModal
        open={receiptDetails !== null}
        title="تفاصيل سند القبض"
        tone="emerald"
        badge="سند قبض"
        badgeIcon="arrowDown"
        amount={receiptDetails?.amount}
        rows={[{ label: 'التاريخ', value: formatDate(receiptDetails?.date), num: true }]}
        note={receiptDetails?.note}
        onClose={() => setReceiptDetails(null)}
        onDelete={() => {
          const r = receiptDetails
          setReceiptDetails(null)
          setConfirmReceipt(r)
        }}
        deleteLabel="حذف السند"
      />

      <ListReceiptForm
        open={receiptOpen}
        person={person}
        debt={totals.debt}
        onClose={() => setReceiptOpen(false)}
        onSubmit={(data) => {
          const res = addListReceipt(data)
          if (res?.ok) notify('تم تسجيل سند القبض.')
          return res
        }}
      />

      <ConfirmDialog
        open={confirmReceipt !== null}
        title="حذف سند القبض"
        message={`حذف سند قبض بمبلغ ${formatMoney(confirmReceipt?.amount || 0)} ${CURRENCY}`}
        details="سيرتفع دين القوائم بعد الحذف."
        confirmLabel="حذف السند"
        onConfirm={() => {
          deleteListReceipt(confirmReceipt.id)
          notify('تم حذف سند القبض.')
        }}
        onClose={() => setConfirmReceipt(null)}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProperties } from '../hooks/useProperties.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { Input } from '../components/ui/Field.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import PropertyForm from '../components/properties/PropertyForm.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'owned', label: 'بالملكية' },
  { key: 'sold', label: 'مُباعة' },
]

function StatusBadge({ status }) {
  const sold = status === 'sold'
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        sold ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {sold ? 'مُباع' : 'بالملكية'}
    </span>
  )
}

export default function PropertiesPage() {
  const { properties, addProperty, deleteProperty, propertiesTotals } = useProperties()
  const { notify } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return properties
      .filter((p) => (filter === 'all' ? true : filter === 'sold' ? p.status === 'sold' : p.status !== 'sold'))
      .filter((p) =>
        q
          ? `${p.name} ${p.type} ${p.partners.join(' ')} ${p.notes}`.toLowerCase().includes(q)
          : true,
      )
  }, [properties, filter, search])

  const isFiltered = Boolean(search.trim() || filter !== 'all')

  const exportXLSX = () =>
    downloadXLSX(
      visible,
      [
        { key: 'name', label: 'اسم العقار', width: 28 },
        { key: 'type', label: 'النوع' },
        { key: (p) => p.partners.join('، '), label: 'الشركاء', width: 28 },
        { key: 'purchasePrice', label: 'سعر الشراء' },
        { key: (p) => formatDate(p.purchaseDate), label: 'تاريخ الشراء' },
        { key: (p) => (p.status === 'sold' ? p.salePrice : ''), label: 'سعر البيع' },
        { key: (p) => (p.status === 'sold' ? formatDate(p.saleDate) : ''), label: 'تاريخ البيع' },
        {
          key: (p) => (p.status === 'sold' ? p.salePrice - p.purchasePrice : ''),
          label: 'الربح',
        },
        { key: (p) => (p.status === 'sold' ? 'مُباع' : 'بالملكية'), label: 'الحالة' },
        { key: (p) => p.documents.length, label: 'عدد المستندات' },
        { key: 'notes', label: 'ملاحظات', width: 34 },
      ],
      stampedName('mqaul-properties', 'xlsx'),
      'العقارات',
    )

  return (
    <div>
      <PageHeader
        title="العقار"
        description="سجل العقارات — الشراء والبيع والشركاء والمستندات."
        action={
          <>
            <Button onClick={() => setFormOpen(true)}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة عقار
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportXLSX}
              disabled={visible.length === 0}
            >
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير Excel
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="قيمة العقارات بالملكية"
          value={propertiesTotals.heldValue}
          tone="neutral"
          hint={`${propertiesTotals.ownedCount} عقار لم يُبَع`}
        />
        <StatCard
          label="مجموع المبيعات"
          value={propertiesTotals.saleTotal}
          tone="positive"
          hint={`${propertiesTotals.soldCount} عقار مُباع`}
        />
        <StatCard
          label="ربح العقارات المباعة"
          value={propertiesTotals.profit}
          tone={propertiesTotals.profit < 0 ? 'negative' : 'positive'}
          hint="سعر البيع − سعر الشراء"
        />
      </div>

      <Card className="mb-4 p-3 sm:p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-600">بحث</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم العقار أو نوعه أو شريك أو ملاحظة…"
            />
          </label>

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

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              إلغاء التصفية
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="العقارات"
          subtitle={
            isFiltered
              ? `${visible.length} من ${properties.length} عقار`
              : `${properties.length} عقار — اضغط على أي عقار لفتح صفحته`
          }
        />

        {visible.length === 0 ? (
          <EmptyState
            text={isFiltered ? 'لا يوجد عقار مطابق.' : 'لا توجد عقارات بعد — أضف عقارًا للبدء.'}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((p) => {
              const profit = p.status === 'sold' ? p.salePrice - p.purchasePrice : null
              return (
                <li key={p.id}>
                  <Link
                    to={`/properties/${p.id}`}
                    className="group flex items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                        {p.name}
                        <StatusBadge status={p.status} />
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.type || '—'}
                        {p.partners.length > 0 && ` · ${p.partners.join('، ')}`}
                      </p>
                      <p className="num mt-0.5 text-xs text-slate-400">
                        شراء {formatMoney(p.purchasePrice)} · {formatDate(p.purchaseDate)}
                        {p.documents.length > 0 && ` · ${p.documents.length} مستند`}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      {p.status === 'sold' ? (
                        <>
                          <span className="num block text-sm font-semibold text-emerald-600">
                            {formatMoney(p.salePrice)}
                          </span>
                          <span
                            className={`num block text-xs ${
                              profit < 0 ? 'text-red-600' : 'text-slate-400'
                            }`}
                          >
                            {profit < 0 ? 'خسارة ' : 'ربح '}
                            {formatMoney(Math.abs(profit))}
                          </span>
                        </>
                      ) : (
                        <span className="num block text-sm font-semibold text-slate-700">
                          {formatMoney(p.purchasePrice)}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <PropertyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          const res = addProperty(data)
          if (res?.ok) notify('تمت إضافة العقار.')
          return res
        }}
      />

      <ConfirmDialog
        open={confirm !== null}
        title="حذف العقار"
        message={`حذف «${confirm?.name}» وكل مستنداته.`}
        details={`${confirm?.documents?.length || 0} مستند سيُحذف من المتصفح.`}
        confirmLabel="حذف العقار"
        onConfirm={() => {
          deleteProperty(confirm.id)
          notify('تم حذف العقار.')
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

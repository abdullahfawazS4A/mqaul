import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProperties } from '../hooks/useProperties.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import PropertyForm from '../components/properties/PropertyForm.jsx'
import PropertyDocuments from '../components/properties/PropertyDocuments.jsx'
import PropertySaleForm from '../components/properties/PropertySaleForm.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <div className="min-w-0 text-left text-sm text-slate-700">{children}</div>
    </div>
  )
}

/** صفحة عقار واحد — بياناته وشركاؤه ومستنداته. */
export default function PropertyDetailsPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const {
    getProperty,
    updateProperty,
    deleteProperty,
    addPropertyDocument,
    deletePropertyDocument,
  } = useProperties()
  const { notify } = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmProperty, setConfirmProperty] = useState(false)
  const [confirmDoc, setConfirmDoc] = useState(null)
  const [saleOpen, setSaleOpen] = useState(false)
  const [confirmUnsell, setConfirmUnsell] = useState(false)

  const property = getProperty(propertyId)

  if (!property) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text="العقار غير موجود.">
          <Link to="/properties">
            <Button variant="secondary">العودة إلى العقار</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  const sold = property.status === 'sold'
  const profit = sold ? property.salePrice - property.purchasePrice : 0

  return (
    <div>
      <Link
        to="/properties"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 print:hidden"
      >
        <Icon name="back" className="h-4 w-4" />
        العقار
      </Link>

      <PageHeader
        title={property.name}
        description={property.type || 'بدون نوع محدّد'}
        action={
          <>
            {sold ? (
              <Button variant="secondary" size="sm" onClick={() => setConfirmUnsell(true)}>
                <Icon name="back" className="h-4 w-4" />
                إلغاء البيع
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setSaleOpen(true)}>
                <Icon name="arrowUp" className="h-4 w-4" />
                تم البيع
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="print" className="h-4 w-4" />
              طباعة
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmProperty(true)}>
              <Icon name="trash" className="h-4 w-4" />
              حذف العقار
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="سعر الشراء" value={property.purchasePrice} tone="neutral" />
        {sold ? (
          <>
            <StatCard label="سعر البيع" value={property.salePrice} tone="positive" />
            <StatCard
              label={profit < 0 ? 'الخسارة' : 'الربح'}
              value={Math.abs(profit)}
              tone={profit < 0 ? 'negative' : 'positive'}
              hint="سعر البيع − سعر الشراء"
            />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSaleOpen(true)}
              className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-right transition-colors hover:border-emerald-400 hover:bg-emerald-50 print:hidden"
            >
              <p className="text-xs text-slate-500">الحالة</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-700">بالملكية</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Icon name="plus" className="h-3 w-3" />
                اضغط لتسجيل البيع
              </p>
            </button>
            {/* الحالة بيانات، فتظهر في الورقة بلا دعوة للضغط */}
            <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 print:block">
              <p className="text-xs text-slate-500">الحالة</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-700">بالملكية</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader title="بيانات العقار" />
          <div className="mt-2">
            <Row label="النوع">{property.type || '—'}</Row>
            <Row label="تاريخ الشراء">
              <span className="num">{formatDate(property.purchaseDate)}</span>
            </Row>
            {sold && (
              <Row label="تاريخ البيع">
                <span className="num">{formatDate(property.saleDate)}</span>
              </Row>
            )}
            <Row label="الشركاء">
              {property.partners.length === 0 ? (
                '—'
              ) : (
                <span className="flex flex-wrap justify-end gap-1">
                  {property.partners.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                    >
                      {p}
                    </span>
                  ))}
                </span>
              )}
            </Row>
            <Row label="المستندات">
              <span className="num">{property.documents.length}</span>
            </Row>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">ملاحظات</span>
            {property.notes ? (
              <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                {property.notes}
              </p>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400">
                لا توجد ملاحظات.
              </p>
            )}
          </div>
        </Card>

        <PropertyDocuments
          documents={property.documents}
          onUpload={(file) => addPropertyDocument(property.id, file)}
          onDelete={setConfirmDoc}
        />
      </div>

      <PropertySaleForm
        open={saleOpen}
        property={property}
        onClose={() => setSaleOpen(false)}
        onSubmit={(data) => {
          const res = updateProperty(property.id, data)
          if (res?.ok) notify('تم تسجيل البيع.')
          return res
        }}
      />

      <ConfirmDialog
        open={confirmUnsell}
        title="إلغاء البيع"
        message={`إرجاع «${property.name}» إلى حالة «بالملكية».`}
        details={`سيُمسح سعر البيع (${formatMoney(property.salePrice)} ${CURRENCY}) وتاريخه.`}
        confirmLabel="إلغاء البيع"
        onConfirm={() => {
          updateProperty(property.id, { status: 'owned' })
          notify('تم إرجاع العقار إلى حالة بالملكية.')
        }}
        onClose={() => setConfirmUnsell(false)}
      />

      <PropertyForm
        open={editOpen}
        initial={property}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => {
          const res = updateProperty(property.id, data)
          if (res?.ok) notify('تم تعديل العقار.')
          return res
        }}
      />

      <ConfirmDialog
        open={confirmProperty}
        title="حذف العقار"
        message={`حذف «${property.name}» وكل مستنداته.`}
        details={`${property.documents.length} مستند سيُحذف من المتصفح.`}
        confirmPhrase={property.name}
        confirmLabel="حذف العقار"
        onConfirm={() => {
          deleteProperty(property.id)
          notify('تم حذف العقار.')
          navigate('/properties')
        }}
        onClose={() => setConfirmProperty(false)}
      />

      <ConfirmDialog
        open={confirmDoc !== null}
        title="حذف المستند"
        message={`حذف «${confirmDoc?.name}».`}
        details="سيُحذف الملف من هذا المتصفح نهائيًا."
        confirmLabel="حذف المستند"
        onConfirm={() => {
          deletePropertyDocument(property.id, confirmDoc.id)
          notify('تم حذف المستند.')
        }}
        onClose={() => setConfirmDoc(null)}
      />
    </div>
  )
}

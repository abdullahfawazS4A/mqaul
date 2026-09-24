import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Combobox from '../components/ui/Combobox.jsx'
import Card from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Field.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ProjectSection from '../components/projects/ProjectSection.jsx'
import ProjectEntryDetails from '../components/projects/ProjectEntryDetails.jsx'
import ProjectEntryForm from '../components/projects/ProjectEntryForm.jsx'
import { KIND_META } from '../components/projects/kinds.js'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'
import { S } from '../utils/xlsx.js'

/** حركات قسم واحد من المشروع (إيداعات / مصاريف / سلف / تسليمات). */
export default function ProjectEntriesPage() {
  const { projectId, kind } = useParams()
  const [params, setParams] = useSearchParams()
  const {
    getProject,
    addProjectItem,
    updateProjectItem,
    deleteProjectItem,
    projectPartnerOptions,
    partnerInProject,
  } = useProjects()
  const { notify } = useToast()

  const [entryForm, setEntryForm] = useState(null) // { initial? }
  const [details, setDetails] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')

  const project = getProject(projectId)
  const meta = KIND_META[kind]
  const partnerKey = params.get('partner') || ''

  const partnerOptions = useMemo(
    () =>
      projectPartnerOptions(project).map((p) => ({
        id: p.key,
        label: p.name,
        hint: p.count > 0 ? `${p.count} حركة` : 'بلا حركات',
      })),
    [project],
  )

  if (!project || !meta) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text={project ? 'القسم غير موجود.' : 'المشروع غير موجود.'}>
          <Link to={project ? `/projects/${project.id}` : '/projects'}>
            <Button variant="secondary">رجوع</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  // السلف خارج نطاق الشريك، فلا يُطبَّق عليها الحصر
  const partner = meta.partnerScoped && partnerKey ? partnerInProject(project, partnerKey) : null
  // العناصر من المشروع نفسه، فيظل التعديل والحذف يعملان
  const items = (partner || project)[kind] || []
  const total = items.reduce((s, i) => s + Number(i.amount || 0), 0)

  // البحث يشمل أعمدة القسم والمبلغ والتاريخ — بصيغته المعروضة وصيغته المخزّنة
  const q = search.trim().toLowerCase()
  const visible = q
    ? items.filter((i) =>
        [
          ...meta.columns.map((c) => i[c.key]),
          i.amount,
          formatMoney(i.amount),
          i.date,
          formatDate(i.date),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : items
  const visibleTotal = visible.reduce((s, i) => s + Number(i.amount || 0), 0)

  const isFiltered = Boolean(q || partnerKey)

  const clearFilters = () => {
    setSearch('')
    setParams({})
  }

  const setPartner = (key) => {
    if (key) setParams({ partner: key })
    else setParams({})
  }

  const submitEntry = (_kind, data) => {
    const res = entryForm?.initial
      ? updateProjectItem(project.id, kind, entryForm.initial.id, data)
      : addProjectItem(project.id, kind, data)
    if (res?.ok) notify(entryForm?.initial ? 'تم تعديل الحركة.' : 'تمت إضافة الحركة.')
    return res
  }

  const exportXLSX = () => {
    const label = (t) => ({ v: t, s: S.LABEL })
    downloadXLSX(
      visible,
      [
        { key: 'amount', label: 'المبلغ' },
        ...meta.columns.map((c) => ({ key: c.key, label: c.label, width: 30 })),
        { key: (i) => formatDate(i.date), label: 'التاريخ' },
      ],
      stampedName(`mqaul-${project.name}-${meta.plural}`, 'xlsx'),
      meta.title,
      [
        [{ v: 'الملخّص', s: S.BOLD }],
        [label('المشروع'), project.name],
        ...(partner ? [[label('الشريك'), partner.name]] : []),
        ...(q ? [[label('بحث'), search.trim()]] : []),
        [{ v: meta.totalLabel, s: S.BOLD }, { v: visibleTotal, s: S.BOLD }, label(CURRENCY)],
      ],
    )
  }

  return (
    <div>
      <Link
        to={`/projects/${project.id}`}
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 print:hidden"
      >
        <Icon name="back" className="h-4 w-4" />
        {project.name}
      </Link>

      <PageHeader
        title={meta.title}
        description={partner ? `${project.name} — ${partner.name}` : project.name}
        action={
          <>
            <Button size="sm" onClick={() => setEntryForm({})}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة
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
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="print" className="h-4 w-4" />
              طباعة
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label={meta.totalLabel}
          value={total}
          tone={meta.cardTone}
          hint={partner ? `لـ${partner.name}` : 'كل الحركات في هذا القسم'}
        />
        <StatCard
          label="عدد الحركات"
          value={items.length}
          money={false}
          tone="muted"
        />
      </div>

      <Card className="mb-4 p-3 sm:p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-600">بحث</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${meta.columns.map((c) => c.label).join(' أو ')} أو مبلغ أو تاريخ…`}
            />
          </label>

          {meta.partnerScoped && partnerOptions.length > 0 && (
            <label className="block w-full sm:w-64">
              <span className="mb-1 block text-xs font-medium text-slate-600">الشريك</span>
              <Combobox
                value={partnerKey}
                onChange={setPartner}
                options={partnerOptions}
                placeholder="كل الحركات — اختر شريكًا…"
                emptyText="لا يوجد اسم مطابق."
              />
            </label>
          )}

          {isFiltered && (
            <Button variant="ghost" onClick={clearFilters}>
              إلغاء التصفية
            </Button>
          )}
        </div>

        {q && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            نتيجة البحث: <span className="num font-semibold">{visible.length}</span> من{' '}
            <span className="num">{items.length}</span> — المجموع{' '}
            <span className="num font-semibold text-slate-800">{formatMoney(visibleTotal)}</span>{' '}
            {CURRENCY}
          </p>
        )}
      </Card>

      <ProjectSection
        title="الحركات"
        subtitle={
          q
            ? `${visible.length} من ${items.length} ${meta.word}`
            : partner
              ? `${items.length} ${meta.word} لـ${partner.name}`
              : `${items.length} ${meta.word}`
        }
        items={visible}
        columns={meta.columns}
        amountTone={meta.amountTone}
        emptyText={
          q
            ? 'لا توجد حركات مطابقة للبحث.'
            : partner
              ? `لا توجد ${meta.plural} لهذا الشريك.`
              : `لا توجد ${meta.plural} بعد.`
        }
        onAdd={() => setEntryForm({})}
        onOpen={setDetails}
        onEdit={(item) => setEntryForm({ initial: item })}
        onDelete={setConfirm}
      />

      <ProjectEntryDetails
        entry={details}
        meta={meta}
        onClose={() => setDetails(null)}
        onEdit={(item) => {
          setDetails(null)
          setEntryForm({ initial: item })
        }}
        onDelete={(item) => {
          setDetails(null)
          setConfirm(item)
        }}
      />

      <ProjectEntryForm
        open={entryForm !== null}
        kind={kind}
        initial={entryForm?.initial}
        partners={project.partners}
        onClose={() => setEntryForm(null)}
        onSubmit={submitEntry}
      />

      <ConfirmDialog
        open={confirm !== null}
        message={`حذف ${meta.label} بمبلغ ${formatMoney(confirm?.amount || 0)} ${CURRENCY}`}
        details="ستتغيّر مجاميع المشروع بعد الحذف."
        confirmLabel="حذف الحركة"
        onConfirm={() => {
          deleteProjectItem(project.id, kind, confirm.id)
          notify('تم حذف الحركة.')
        }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

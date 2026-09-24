import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import Combobox from '../components/ui/Combobox.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ProjectForm from '../components/projects/ProjectForm.jsx'
import { KIND_META, KIND_ORDER } from '../components/projects/kinds.js'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadXLSX, stampedName } from '../utils/download.js'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    getProject,
    projectTotals,
    updateProject,
    deleteProject,
    projectPartnerOptions,
    partnerInProject,
  } = useProjects()
  const { notify } = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [partnerKey, setPartnerKey] = useState('') // '' = كل الحركات

  const project = getProject(projectId)

  const partnerOptions = useMemo(
    () =>
      projectPartnerOptions(project).map((p) => ({
        id: p.key,
        label: p.name,
        hint: p.count > 0 ? `${p.count} حركة` : 'بلا حركات',
      })),
    [project],
  )

  // العناصر المعروضة هي عناصر المشروع نفسها، فيظل التعديل والحذف يعملان
  const partner = partnerKey ? partnerInProject(project, partnerKey) : null

  if (!project) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState text="المشروع غير موجود.">
          <Link to="/projects">
            <Button variant="secondary">العودة إلى المشاريع</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  const totals = projectTotals(project)

  const removeProject = () => {
    deleteProject(project.id)
    navigate('/projects')
  }

  const exportProject = () => {
    const rows = [
      ...project.deposits.map((i) => ({ ...i, kind: 'إيداع شريك', who: i.partner, note: '' })),
      ...project.expenses.map((i) => ({
        ...i,
        kind: 'مصروف',
        who: i.spender,
        note: i.description,
      })),
      ...project.advances.map((i) => ({ ...i, kind: 'سلفة مستلمة', who: i.source, note: '' })),
      ...project.payouts.map((i) => ({ ...i, kind: 'تسليم لشريك', who: i.partner, note: '' })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    downloadXLSX(
      rows,
      [
        { key: 'kind', label: 'النوع' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'who', label: 'الشريك / الجهة' },
        { key: 'note', label: 'الوصف' },
        { key: (r) => formatDate(r.date), label: 'التاريخ' },
      ],
      stampedName(`mqaul-project-${project.name}`, 'xlsx'),
      project.name,
    )
  }

  const shown = partner || project

  return (
    <div>
      <Link
        to="/projects"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 print:hidden"
      >
        <Icon name="back" className="h-4 w-4" />
        المشاريع
      </Link>

      <PageHeader
        title={project.name}
        description={project.company || 'بدون شركة منفذة'}
        action={
          <>
            <Button variant="secondary" size="sm" onClick={exportProject}>
              <Icon name="arrowDown" className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              طباعة
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" className="h-4 w-4" />
              حذف المشروع
            </Button>
          </>
        }
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">القيمة المالية للمشروع</p>
            <p className="num mt-0.5 text-xl font-semibold text-slate-800 sm:text-2xl">
              {formatMoney(project.value)}
              <span className="mr-1 text-xs font-normal text-slate-400">{CURRENCY}</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs text-slate-500">الشركاء</p>
            <div className="flex flex-wrap gap-1">
              {project.partners.length === 0 ? (
                <span className="text-xs text-slate-400">—</span>
              ) : (
                project.partners.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {partnerOptions.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700">حركات شريك معيّن</p>
              <p className="mt-0.5 text-xs text-slate-500">
                اختر اسمًا لتُفلتر الإيداعات والمصاريف والسلف والتسليمات عليه.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Combobox
                value={partnerKey}
                onChange={setPartnerKey}
                options={partnerOptions}
                placeholder="كل الحركات — اختر شريكًا…"
                emptyText="لا يوجد اسم مطابق."
              />
            </div>
          </div>

          {partner && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center sm:grid-cols-5">
              <div>
                <p className="text-[11px] text-slate-400">أودع</p>
                <p className="num text-sm font-semibold text-emerald-600">
                  {formatMoney(partner.totals.deposits)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">صرف</p>
                <p className="num text-sm font-semibold text-red-600">
                  {formatMoney(partner.totals.expenses)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">سلف عن طريقه</p>
                <p className="num text-sm font-semibold text-slate-700">
                  {formatMoney(partner.totals.advances)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">استلم</p>
                <p className="num text-sm font-semibold text-amber-600">
                  {formatMoney(partner.totals.payouts)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">الصافي</p>
                <p
                  className={`num text-sm font-semibold ${
                    partner.totals.net < 0 ? 'text-red-600' : 'text-slate-800'
                  }`}
                >
                  {formatMoney(partner.totals.net)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KIND_ORDER.map((k) => {
          const meta = KIND_META[k]
          const items = shown[k] || []
          const sum = items.reduce((acc, i) => acc + Number(i.amount || 0), 0)
          return (
            <Link
              key={k}
              to={`/projects/${project.id}/${k}${partnerKey ? `?partner=${encodeURIComponent(partnerKey)}` : ''}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                  <Icon name={meta.icon} className={`h-4 w-4 ${meta.amountTone}`} />
                  {meta.title}
                </p>
                <p className="num mt-1 text-xs text-slate-400">
                  {items.length} {meta.word}
                  {partner ? ` لـ${partner.name}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`num text-base font-semibold ${meta.amountTone}`}>
                  {formatMoney(sum)}
                </span>
                <Icon
                  name="back"
                  className="h-4 w-4 rotate-180 text-slate-300 group-hover:text-slate-500"
                />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mb-5">
        <StatCard
          label="المتبقي تحت اليد"
          value={totals.available}
          tone={totals.available < 0 ? 'negative' : 'positive'}
          hint="(إيداعات + سلف) − (مصاريف + تسليمات)"
        />
      </div>

      <ProjectForm
        open={editOpen}
        initial={project}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => {
          updateProject(project.id, data)
          notify('تم تعديل بيانات المشروع.')
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="حذف المشروع"
        message={`حذف «${project.name}» وكل إيداعاته ومصاريفه وسلفه وتسليماته.`}
        details={`${project.deposits.length} إيداع، ${project.expenses.length} مصروف، ${project.advances.length} سلفة، ${project.payouts.length} تسليم.`}
        confirmPhrase={project.name}
        confirmLabel="حذف المشروع"
        onConfirm={removeProject}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}

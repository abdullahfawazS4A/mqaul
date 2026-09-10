import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ProjectSection from '../components/projects/ProjectSection.jsx'
import ProjectEntryForm from '../components/projects/ProjectEntryForm.jsx'
import ProjectForm from '../components/projects/ProjectForm.jsx'
import { CURRENCY, formatDate, formatMoney } from '../utils/format.js'
import { downloadCSV, stampedName } from '../utils/download.js'

const KIND_LABELS = {
  deposits: 'إيداع الشريك',
  expenses: 'المصروف',
  advances: 'السلفة',
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    getProject,
    projectTotals,
    addProjectItem,
    updateProjectItem,
    deleteProjectItem,
    updateProject,
    deleteProject,
  } = useProjects()
  const { notify } = useToast()

  const [entryForm, setEntryForm] = useState(null) // { kind, initial? }
  const [editOpen, setEditOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'item'|'project', itemKind?, item? }

  const project = getProject(projectId)

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

  const submitEntry = (kind, data) => {
    const res = entryForm?.initial
      ? updateProjectItem(project.id, kind, entryForm.initial.id, data)
      : addProjectItem(project.id, kind, data)
    if (res?.ok) notify(entryForm?.initial ? 'تم تعديل الحركة.' : 'تمت إضافة الحركة.')
    return res
  }

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
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    downloadCSV(
      rows,
      [
        { key: 'kind', label: 'النوع' },
        { key: 'amount', label: 'المبلغ' },
        { key: 'who', label: 'الشريك / الجهة' },
        { key: 'note', label: 'الوصف' },
        { key: (r) => formatDate(r.date), label: 'التاريخ' },
      ],
      stampedName(`mqaul-project-${project.name}`, 'csv'),
    )
  }

  const sectionProps = (kind) => ({
    onAdd: () => setEntryForm({ kind }),
    onEdit: (item) => setEntryForm({ kind, initial: item }),
    onDelete: (item) => setConfirm({ kind: 'item', itemKind: kind, item }),
  })

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
              تصدير CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              طباعة
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'project' })}>
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="مجموع الإيداعات" value={totals.deposits} tone="positive" />
        <StatCard label="مجموع المصاريف" value={totals.expenses} tone="negative" />
        <StatCard label="مجموع السلف" value={totals.advances} tone="neutral" />
        <StatCard
          label="المتبقي تحت اليد"
          value={totals.available}
          tone={totals.available < 0 ? 'negative' : 'positive'}
          hint="(إيداعات + سلف) − مصاريف"
        />
      </div>

      <div className="space-y-4">
        <ProjectSection
          title="إيداعات الشركاء"
          subtitle={`${project.deposits.length} إيداع`}
          items={project.deposits}
          columns={[{ key: 'partner', label: 'الشريك' }]}
          amountTone="text-emerald-600"
          emptyText="لا توجد إيداعات بعد."
          {...sectionProps('deposits')}
        />

        <ProjectSection
          title="المصاريف"
          subtitle={`${project.expenses.length} مصروف`}
          items={project.expenses}
          columns={[
            { key: 'description', label: 'الوصف / السبب' },
            { key: 'spender', label: 'من قام بالصرف' },
          ]}
          amountTone="text-red-600"
          emptyText="لا توجد مصاريف بعد."
          {...sectionProps('expenses')}
        />

        <ProjectSection
          title="السلف المستلمة"
          subtitle={`${project.advances.length} سلفة`}
          items={project.advances}
          columns={[{ key: 'source', label: 'من جهة / شخص' }]}
          amountTone="text-slate-800"
          emptyText="لا توجد سلف مستلمة بعد."
          {...sectionProps('advances')}
        />
      </div>

      <ProjectEntryForm
        open={entryForm !== null}
        kind={entryForm?.kind}
        initial={entryForm?.initial}
        partners={project.partners}
        onClose={() => setEntryForm(null)}
        onSubmit={submitEntry}
      />

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
        open={confirm?.kind === 'item'}
        message={`حذف ${KIND_LABELS[confirm?.itemKind] || 'الحركة'} بمبلغ ${formatMoney(
          confirm?.item?.amount || 0,
        )} ${CURRENCY}`}
        details="ستتغيّر مجاميع المشروع بعد الحذف."
        confirmLabel="حذف الحركة"
        onConfirm={() => {
          deleteProjectItem(project.id, confirm.itemKind, confirm.item.id)
          notify('تم حذف الحركة.')
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.kind === 'project'}
        title="حذف المشروع"
        message={`حذف «${project.name}» وكل إيداعاته ومصاريفه وسلفه.`}
        details={`${project.deposits.length} إيداع، ${project.expenses.length} مصروف، ${project.advances.length} سلفة.`}
        confirmPhrase={project.name}
        confirmLabel="حذف المشروع"
        onConfirm={removeProject}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

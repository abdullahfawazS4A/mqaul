import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ProjectSection from '../components/projects/ProjectSection.jsx'
import ProjectEntryForm from '../components/projects/ProjectEntryForm.jsx'
import ProjectForm from '../components/projects/ProjectForm.jsx'
import { CURRENCY, formatMoney } from '../utils/format.js'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { getProject, projectTotals, addProjectItem, deleteProjectItem, updateProject, deleteProject } =
    useProjects()

  const [entryKind, setEntryKind] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

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

  const removeProject = () => {
    deleteProject(project.id)
    navigate('/projects')
  }

  return (
    <div>
      <Link
        to="/projects"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        <Icon name="back" className="h-4 w-4" />
        المشاريع
      </Link>

      <PageHeader
        title={project.name}
        description={project.company || 'بدون شركة منفذة'}
        action={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Icon name="edit" className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="danger" size="sm" onClick={removeProject}>
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="مجموع الإيداعات" value={totals.deposits} tone="positive" />
        <StatCard label="مجموع المصاريف" value={totals.expenses} tone="negative" />
        <StatCard label="مجموع السلف" value={totals.advances} tone="neutral" />
      </div>

      <div className="space-y-4">
        <ProjectSection
          title="إيداعات الشركاء"
          subtitle={`${project.deposits.length} إيداع`}
          items={project.deposits}
          columns={[{ key: 'partner', label: 'الشريك' }]}
          amountTone="text-emerald-600"
          emptyText="لا توجد إيداعات بعد."
          onAdd={() => setEntryKind('deposits')}
          onDelete={(id) => deleteProjectItem(project.id, 'deposits', id)}
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
          onAdd={() => setEntryKind('expenses')}
          onDelete={(id) => deleteProjectItem(project.id, 'expenses', id)}
        />

        <ProjectSection
          title="السلف المستلمة"
          subtitle={`${project.advances.length} سلفة`}
          items={project.advances}
          columns={[{ key: 'source', label: 'من جهة / شخص' }]}
          amountTone="text-slate-800"
          emptyText="لا توجد سلف مستلمة بعد."
          onAdd={() => setEntryKind('advances')}
          onDelete={(id) => deleteProjectItem(project.id, 'advances', id)}
        />
      </div>

      <ProjectEntryForm
        open={entryKind !== null}
        kind={entryKind}
        partners={project.partners}
        onClose={() => setEntryKind(null)}
        onSubmit={(kind, data) => addProjectItem(project.id, kind, data)}
      />

      <ProjectForm
        open={editOpen}
        initial={project}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => updateProject(project.id, data)}
      />
    </div>
  )
}

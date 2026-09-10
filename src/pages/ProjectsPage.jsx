import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ProjectForm from '../components/projects/ProjectForm.jsx'
import { CURRENCY, formatMoney } from '../utils/format.js'

export default function ProjectsPage() {
  const { projects, addProject, projectTotals } = useProjects()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="المشاريع"
        description="كل المشاريع مع ملخص سريع لحركاتها المالية."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة مشروع جديد
          </Button>
        }
      />

      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState text="لا توجد مشاريع بعد.">
            <Button onClick={() => setFormOpen(true)}>إضافة مشروع جديد</Button>
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => {
            const totals = projectTotals(project)
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-800">{project.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {project.company || 'بدون شركة منفذة'}
                    </p>
                  </div>
                  <Icon name="back" className="h-4 w-4 shrink-0 rotate-180 text-slate-300" />
                </div>

                <p className="num mt-3 text-lg font-semibold text-slate-800">
                  {formatMoney(project.value)}
                  <span className="mr-1 text-xs font-normal text-slate-400">{CURRENCY}</span>
                </p>

                {project.partners.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.partners.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-[11px]">
                  <div>
                    <p className="text-slate-400">إيداعات</p>
                    <p className="num font-semibold text-emerald-600">
                      {formatMoney(totals.deposits)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">مصاريف</p>
                    <p className="num font-semibold text-red-600">{formatMoney(totals.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">سلف</p>
                    <p className="num font-semibold text-slate-700">{formatMoney(totals.advances)}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addProject} />
    </div>
  )
}

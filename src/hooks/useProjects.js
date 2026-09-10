import { useData } from '../data/DataContext.jsx'

/** واجهة المشاريع. */
export function useProjects() {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    addProjectItem,
    updateProjectItem,
    deleteProjectItem,
    projectTotals,
    projectsTotals,
  } = useData()

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    addProjectItem,
    updateProjectItem,
    deleteProjectItem,
    projectTotals,
    projectsTotals,
  }
}

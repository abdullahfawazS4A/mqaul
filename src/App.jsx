import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import TreasuryPage from './pages/TreasuryPage.jsx'
import DebtsPage from './pages/DebtsPage.jsx'
import ListsPage from './pages/ListsPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/treasury" replace />} />
        <Route path="/treasury" element={<TreasuryPage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="*" element={<Navigate to="/treasury" replace />} />
      </Routes>
    </Layout>
  )
}

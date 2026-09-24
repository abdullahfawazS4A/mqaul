import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TreasuryPage from './pages/TreasuryPage.jsx'
import DebtsPage from './pages/DebtsPage.jsx'
import PersonLedgerPage from './pages/PersonLedgerPage.jsx'
import ListsPage from './pages/ListsPage.jsx'
import PersonListsPage from './pages/PersonListsPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx'
import ProjectEntriesPage from './pages/ProjectEntriesPage.jsx'
import PropertiesPage from './pages/PropertiesPage.jsx'
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx'
import PartnersPage from './pages/PartnersPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/treasury" element={<TreasuryPage />} />
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/debts/:personId" element={<PersonLedgerPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:personId" element={<PersonListsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/projects/:projectId/:kind" element={<ProjectEntriesPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

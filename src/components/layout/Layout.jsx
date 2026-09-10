import { Link } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import Icon from '../ui/Icon.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 print:hidden lg:hidden">
          <Link to="/" className="text-sm font-bold text-slate-800">
            محاسبة المقاولات
          </Link>
          <Link
            to="/settings"
            aria-label="النسخ الاحتياطي"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon name="settings" className="h-5 w-5" />
          </Link>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

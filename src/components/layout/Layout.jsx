import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <h1 className="text-sm font-bold text-slate-800">محاسبة المقاولات</h1>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:pb-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

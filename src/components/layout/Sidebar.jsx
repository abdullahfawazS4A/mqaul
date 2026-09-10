import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS } from './navItems.js'
import Icon from '../ui/Icon.jsx'

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <h1 className="text-base font-bold text-slate-800">محاسبة المقاولات</h1>
        <p className="mt-0.5 text-xs text-slate-400">إدارة الصيرفة والديون والمشاريع</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-slate-800 font-medium text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <p className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-400">
        بيانات تجريبية — بدون حفظ دائم
      </p>
    </aside>
  )
}

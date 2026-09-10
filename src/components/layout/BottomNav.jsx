import { NavLink } from 'react-router-dom'
import { MOBILE_NAV } from './navItems.js'
import Icon from '../ui/Icon.jsx'

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur print:hidden lg:hidden">
      <ul className="mx-auto flex max-w-lg">
        {MOBILE_NAV.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  isActive ? 'font-semibold text-slate-800' : 'text-slate-400'
                }`
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

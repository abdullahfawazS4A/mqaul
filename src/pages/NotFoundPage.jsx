import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

export default function NotFoundPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <EmptyState text="الصفحة غير موجودة.">
        <Link to="/">
          <Button variant="secondary">العودة إلى لوحة المعلومات</Button>
        </Link>
      </EmptyState>
    </div>
  )
}

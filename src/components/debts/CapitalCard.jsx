import { useState } from 'react'
import Button from '../ui/Button.jsx'
import { MoneyInput } from '../ui/Field.jsx'
import { CURRENCY, formatMoney } from '../../utils/format.js'

/** رأس المال — إدخال أولي يدوي قابل للتعديل. */
export default function CapitalCard({ capital, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(capital))

  const start = () => {
    setDraft(String(capital))
    setEditing(true)
  }

  const save = () => {
    onSave(Number(draft) || 0)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">رأس المال</p>

      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <MoneyInput
            value={draft}
            onChange={setDraft}
            autoFocus
            className="max-w-40"
          />
          <Button size="sm" onClick={save}>
            حفظ
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            إلغاء
          </Button>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <p className="num text-xl font-semibold text-slate-800 sm:text-2xl">
            {formatMoney(capital)}
            <span className="mr-1 text-xs font-normal text-slate-400">{CURRENCY}</span>
          </p>
          <Button size="sm" variant="ghost" onClick={start}>
            تعديل
          </Button>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useLists } from '../hooks/useLists.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import ListForm from '../components/lists/ListForm.jsx'
import ListsTable from '../components/lists/ListsTable.jsx'

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'paid', label: 'واصل' },
  { key: 'unpaid', label: 'دين' },
]

export default function ListsPage() {
  const { lists, addList, updateList, deleteList, toggleListStatus } = useLists()
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const visible = useMemo(
    () => (filter === 'all' ? lists : lists.filter((l) => l.status === filter)),
    [lists, filter],
  )

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormOpen(true)
  }

  const submit = (data) => {
    if (editing) updateList(editing.id, data)
    else addList(data)
  }

  return (
    <div>
      <PageHeader
        title="القوائم"
        description="سجل شكلي للقوائم — لا يؤثر على الصيرفة أو الديون."
        action={
          <Button onClick={openAdd}>
            <Icon name="plus" className="h-4 w-4" />
            إضافة قائمة
          </Button>
        }
      />

      <div className="mb-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-slate-800 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="جميع القوائم" subtitle={`${visible.length} قائمة`} />
        <ListsTable
          lists={visible}
          onEdit={openEdit}
          onDelete={deleteList}
          onToggleStatus={toggleListStatus}
        />
      </Card>

      <ListForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      />
    </div>
  )
}

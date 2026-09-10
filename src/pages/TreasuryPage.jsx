import { useState } from 'react'
import { useTreasury } from '../hooks/useTreasury.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import TreasuryForm from '../components/treasury/TreasuryForm.jsx'
import TreasuryTable from '../components/treasury/TreasuryTable.jsx'

export default function TreasuryPage() {
  const { entries, balance, totals, addTreasuryEntry, deleteTreasuryEntry } = useTreasury()
  const [formType, setFormType] = useState(null) // 'in' | 'out' | null

  return (
    <div>
      <PageHeader
        title="الصيرفة"
        description="حركة الإيداع والاستلام من الصندوق الرئيسي."
        action={
          <>
            <Button variant="success" onClick={() => setFormType('in')}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة إيداع
            </Button>
            <Button variant="secondary" onClick={() => setFormType('out')}>
              <Icon name="plus" className="h-4 w-4" />
              إضافة استلام
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="رصيد الصيرفة الحالي"
          value={balance}
          tone={balance < 0 ? 'negative' : 'neutral'}
          hint="يُحسب تلقائيًا من مجموع العمليات"
        />
        <StatCard label="مجموع الإيداعات" value={totals.cashIn} tone="positive" />
        <StatCard label="مجموع الاستلامات" value={totals.cashOut} tone="muted" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="العمليات" subtitle="مرتّبة من الأحدث إلى الأقدم" />
        <TreasuryTable entries={entries} onDelete={deleteTreasuryEntry} />
      </Card>

      <TreasuryForm
        open={formType !== null}
        type={formType}
        onClose={() => setFormType(null)}
        onSubmit={addTreasuryEntry}
      />
    </div>
  )
}

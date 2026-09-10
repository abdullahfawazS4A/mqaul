import { useRef, useState } from 'react'
import { useData } from '../data/DataContext.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Card, { CardHeader } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { downloadJSON, stampedName } from '../utils/download.js'

const COUNT_LABELS = {
  treasury: 'عمليات الصيرفة',
  people: 'الأشخاص',
  debtEntries: 'حركات الديون',
  lists: 'القوائم',
  projects: 'المشاريع',
}

/** النسخ الاحتياطي وإدارة البيانات المحفوظة في المتصفح. */
export default function SettingsPage() {
  const { exportSnapshot, importSnapshot, resetAll, clearAll, dataCounts } = useData()
  const { notify } = useToast()
  const fileRef = useRef(null)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'clear' | { snapshot }

  const doExport = () => {
    downloadJSON(exportSnapshot(), stampedName('mqaul-backup', 'json'))
    notify('تم تنزيل النسخة الاحتياطية.')
  }

  const pickFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setConfirm({ snapshot: JSON.parse(String(reader.result)), fileName: file.name })
      } catch {
        notify('تعذّر قراءة الملف — تأكد أنه ملف نسخة احتياطية بصيغة JSON.', 'error')
      }
    }
    reader.onerror = () => notify('تعذّر قراءة الملف.', 'error')
    reader.readAsText(file)
  }

  const applyImport = () => {
    const res = importSnapshot(confirm.snapshot)
    notify(res.ok ? 'تم استيراد النسخة بنجاح.' : res.error, res.ok ? 'success' : 'error')
  }

  return (
    <div>
      <PageHeader
        title="البيانات والنسخ الاحتياطي"
        description="بياناتك محفوظة في هذا المتصفح تلقائيًا. صدّرها بانتظام لتأمينها."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(COUNT_LABELS).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="num text-lg font-semibold text-slate-800">{dataCounts[key]}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="تصدير نسخة احتياطية"
            subtitle="ملف JSON يحتوي كل البيانات — احفظه في مكان آمن."
          />
          <div className="px-4 py-4 sm:px-5">
            <Button onClick={doExport}>
              <Icon name="arrowDown" className="h-4 w-4" />
              تنزيل النسخة الاحتياطية
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="استيراد نسخة"
            subtitle="يستبدل كل البيانات الحالية ببيانات الملف — بعد تأكيدك."
          />
          <div className="px-4 py-4 sm:px-5">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={pickFile}
              className="hidden"
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="arrowUp" className="h-4 w-4" />
              اختيار ملف نسخة احتياطية
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="إعادة التعيين"
            subtitle="عمليات لا يمكن التراجع عنها — صدّر نسخة احتياطية أولًا."
          />
          <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
            <Button variant="secondary" onClick={() => setConfirm('reset')}>
              العودة للبيانات النموذجية
            </Button>
            <Button variant="danger" onClick={() => setConfirm('clear')}>
              <Icon name="trash" className="h-4 w-4" />
              مسح كل البيانات
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        title="العودة للبيانات النموذجية"
        message="سيتم استبدال كل بياناتك بالبيانات النموذجية الأولية."
        confirmPhrase="إعادة"
        confirmLabel="إعادة التعيين"
        onConfirm={() => {
          resetAll()
          notify('تمت العودة إلى البيانات النموذجية.')
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'clear'}
        title="مسح كل البيانات"
        message="سيتم حذف كل العمليات والأشخاص والقوائم والمشاريع نهائيًا."
        confirmPhrase="مسح"
        confirmLabel="مسح كل شيء"
        onConfirm={() => {
          clearAll()
          notify('تم مسح كل البيانات.')
        }}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={typeof confirm === 'object' && confirm !== null}
        title="استيراد نسخة احتياطية"
        message={`استبدال كل البيانات الحالية بمحتوى «${confirm?.fileName || ''}».`}
        confirmPhrase="استيراد"
        confirmLabel="استيراد واستبدال"
        onConfirm={applyImport}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

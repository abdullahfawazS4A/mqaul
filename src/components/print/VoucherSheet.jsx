import { CURRENCY, formatDate, formatMoney } from '../../utils/format.js'
import { amountInWords } from '../../utils/tafqit.js'

function Party({ title }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-400 px-4 py-3">
      <p className="mb-3 text-center text-sm font-bold text-slate-900">{title}</p>
      <div className="flex items-end gap-2 text-sm">
        <span className="shrink-0 text-slate-600">الاسم:</span>
        <span className="h-8 flex-1 border-b border-dotted border-slate-500" />
      </div>
      <div className="mt-6 flex items-end gap-2 text-sm">
        <span className="shrink-0 text-slate-600">التوقيع:</span>
        <span className="h-14 flex-1 border-b border-slate-500" />
      </div>
      <div className="mt-4 flex items-end gap-2 text-sm">
        <span className="shrink-0 text-slate-600">التاريخ:</span>
        <span className="min-h-6 flex-1 border-b border-dotted border-slate-500" />
      </div>
    </div>
  )
}

/**
 * ورقة السند المطبوعة (A4) — لا تظهر على الشاشة أبدًا، فقط أثناء طباعة سند.
 * مصمّمة بالأبيض والأسود لتُطبع واضحة على أي طابعة.
 */
export default function VoucherSheet({ voucher }) {
  const {
    title,
    section,
    reference,
    date,
    amount,
    rows = [],
    note,
    noteLabel = 'الملاحظة / البيان',
    statement,
    printedAt,
  } = voucher
  const words = amountInWords(amount)

  return (
    <div className="voucher-sheet bg-white text-slate-900">
      <div className="flex min-h-[265mm] flex-col">
        {/* الترويسة */}
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-4">
          <div>
            <p className="text-xl font-bold">محاسبة المقاولات</p>
            {section && <p className="mt-1 text-sm text-slate-600">{section}</p>}
          </div>
          <div className="space-y-1 text-left text-sm">
            {reference && (
              <p>
                <span className="text-slate-600">رقم السند: </span>
                <span className="num font-semibold">{reference}</span>
              </p>
            )}
            <p>
              <span className="text-slate-600">التاريخ: </span>
              <span className="num font-semibold">{formatDate(date)}</span>
            </p>
          </div>
        </header>

        <h1 className="mt-6 text-center text-2xl font-bold">
          <span className="inline-block border-y-2 border-slate-900 px-10 py-1.5">{title}</span>
        </h1>

        {/* المبلغ */}
        <div className="mt-7 rounded-lg border-2 border-slate-900 px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-slate-600">المبلغ</span>
            <span className="num text-3xl font-bold">
              {formatMoney(amount)} <span className="text-base font-medium">{CURRENCY}</span>
            </span>
          </div>
          {words && (
            <p className="mt-3 border-t border-slate-300 pt-3 text-sm font-medium">{words}</p>
          )}
        </div>

        {/* التفاصيل */}
        {rows.length > 0 && (
          <table className="mt-6 w-full border-collapse text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th className="w-40 border border-slate-400 bg-slate-100 px-3 py-2 text-right font-medium text-slate-700">
                    {r.label}
                  </th>
                  <td className={`border border-slate-400 px-3 py-2 ${r.num ? 'num text-right' : ''}`}>
                    {r.value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-5">
          <p className="mb-1.5 text-sm font-medium text-slate-600">{noteLabel}</p>
          <p className="min-h-16 whitespace-pre-wrap break-words rounded-lg border border-slate-400 px-3 py-2.5 text-sm leading-relaxed">
            {note || ''}
          </p>
        </div>

        {statement && (
          <p className="mt-6 text-sm leading-relaxed text-slate-700">{statement}</p>
        )}

        {/* المسلِّم والمستلِم */}
        <div className="mt-auto grid grid-cols-2 gap-6 pt-8">
          <Party title="المُسلِّم" />
          <Party title="المُستلِم" />
        </div>

        <footer className="mt-6 flex justify-between border-t border-slate-300 pt-2 text-[11px] text-slate-500">
          <span>
            طُبع في <span className="num">{printedAt.toLocaleString('en-GB')}</span>
          </span>
          <span>يُعدّ هذا السند نافذًا بعد توقيع الطرفين</span>
        </footer>
      </div>
    </div>
  )
}

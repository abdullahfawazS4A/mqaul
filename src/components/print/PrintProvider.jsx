import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import VoucherSheet from './VoucherSheet.jsx'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import { CURRENCY, formatMoney } from '../../utils/format.js'

const PrintContext = createContext(null)

/** أقصى انتظار لتحميل الخط قبل الطباعة — بعدها نطبع بالخط الاحتياطي. */
const FONT_WAIT_MS = 1500
/** شبكة أمان حين لا يُطلق المتصفح حدث afterprint. */
const CLEANUP_MS = 60000

/**
 * طباعة سند واحد على ورقة A4 مستقلة.
 * السند يُرسم خارج #root، وأثناء طباعته يحمل body الصنف printing-voucher
 * فتُخفي قواعد الطباعة التطبيقَ كلّه ولا يظهر على الورقة إلا السند.
 * الطباعة العادية للصفحات (كشف الحساب…) لا تتأثر لأن الصنف غائب عندها.
 */
export function PrintProvider({ children }) {
  const [voucher, setVoucher] = useState(null)
  // سند محفوظ للتو ينتظر جواب «طباعة أم لا»
  const [offer, setOffer] = useState(null)

  useEffect(() => {
    if (!voucher) return
    const body = document.body
    body.classList.add('printing-voucher')

    let cleanupTimer = null

    const finish = () => {
      clearTimeout(cleanupTimer)
      body.classList.remove('printing-voucher')
      setVoucher(null)
    }
    window.addEventListener('afterprint', finish)

    /**
     * ننتظر رسم السند وتحميل الخط قبل فتح نافذة الطباعة — بمهلة قصوى.
     * بعض الشبكات تحجب خطوط Google فلا يُحسم fonts.ready أبدًا؛ بلا هذه المهلة
     * لا تُستدعى window.print() ولا يحدث شيء إطلاقًا.
     */
    const fontsReady = () =>
      Promise.race([
        Promise.resolve(document.fonts?.ready).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
      ])

    let cancelled = false
    const timer = setTimeout(async () => {
      await fontsReady()
      if (cancelled) return
      try {
        window.print()
      } catch {
        /* متصفح بلا دعم طباعة — ننظّف بدل البقاء معلّقين */
        finish()
        return
      }
      // afterprint لا يُطلق على بعض متصفحات الجوال — ننظّف احتياطًا
      cleanupTimer = setTimeout(finish, CLEANUP_MS)
    }, 80)

    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(cleanupTimer)
      window.removeEventListener('afterprint', finish)
      body.classList.remove('printing-voucher')
    }
  }, [voucher])

  const printVoucher = useCallback((v) => {
    if (v) setVoucher({ ...v, printedAt: new Date() })
  }, [])

  const offerPrint = useCallback((v) => {
    if (v) setOffer(v)
  }, [])

  return (
    <PrintContext.Provider value={{ printVoucher, offerPrint }}>
      {children}
      <Modal
        open={offer !== null}
        title="تم الحفظ"
        onClose={() => setOffer(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOffer(null)}>
              لا
            </Button>
            <Button
              autoFocus
              onClick={() => {
                printVoucher(offer)
                setOffer(null)
              }}
            >
              <Icon name="print" className="h-4 w-4" />
              طباعة
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          هل تريد طباعة {offer?.title}
          {offer && (
            <>
              {' '}بمبلغ <span className="num font-semibold">{formatMoney(offer.amount)}</span> {CURRENCY}
            </>
          )}
          ؟
        </p>
        <p className="mt-1 text-xs text-slate-400">
          يمكنك طباعته لاحقًا أيضًا من تفاصيل الحركة أو زر الطباعة بجانبها.
        </p>
      </Modal>
      {voucher && createPortal(<VoucherSheet voucher={voucher} />, document.body)}
    </PrintContext.Provider>
  )
}

/**
 * printVoucher(voucher): طباعة مباشرة (إعادة طباعة حركة قديمة).
 * offerPrint(voucher): بعد الحفظ — يسأل المستخدم «طباعة أم لا».
 * انظر vouchers.js لبناء السند من أي حركة.
 */
export function usePrint() {
  const ctx = useContext(PrintContext)
  if (!ctx) throw new Error('usePrint يجب أن يُستخدم داخل <PrintProvider>')
  return ctx
}

import { useEffect, useState } from 'react'

/**
 * ارتفاع المنطقة المرئية فعليًا وإزاحتها — تتقلّص عند ظهور لوحة مفاتيح الموبايل،
 * بينما تبقى وحدات vh على ارتفاع الشاشة كاملًا. نستعملها لتحجيم النوافذ المنبثقة
 * حتى يبقى زرّ الحفظ فوق لوحة المفاتيح دون أن يضطر المستخدم للرجوع.
 */
export default function useVisualViewport(active = true) {
  const [box, setBox] = useState(null)

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!active || !vv) {
      setBox(null)
      return
    }

    const read = () => setBox({ height: vv.height, offsetTop: vv.offsetTop })

    read()
    vv.addEventListener('resize', read)
    vv.addEventListener('scroll', read)
    return () => {
      vv.removeEventListener('resize', read)
      vv.removeEventListener('scroll', read)
    }
  }, [active])

  return box
}

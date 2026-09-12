/**
 * شريط أزرار النموذج — ملتصق بأسفل منطقة التمرير داخل النافذة.
 * يبقى ظاهرًا مهما طال النموذج أو ارتفعت لوحة المفاتيح، فلا حاجة للتمرير
 * أو إغلاق الكيبورد للوصول إلى زر الحفظ.
 */
export default function FormActions({ children }) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
      {children}
    </div>
  )
}

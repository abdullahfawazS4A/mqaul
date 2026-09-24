/**
 * تعريف أقسام المشروع في مكان واحد — تستخدمه صفحة المشروع (البطاقات)
 * وصفحة الحركات (الجدول) ونافذة التفاصيل، فلا تتكرّر الأعمدة والألوان.
 */

export const KIND_ORDER = ['deposits', 'expenses', 'advances', 'payouts']

export const KIND_META = {
  deposits: {
    title: 'إيداعات الشركاء',
    label: 'إيداع الشريك',
    word: 'إيداع',
    plural: 'إيداعات',
    totalLabel: 'مجموع الإيداعات',
    icon: 'arrowDown',
    tone: 'emerald',
    amountTone: 'text-emerald-600',
    cardTone: 'positive',
    columns: [{ key: 'partner', label: 'الشريك' }],
  },
  expenses: {
    title: 'المصاريف',
    label: 'المصروف',
    word: 'مصروف',
    plural: 'مصاريف',
    totalLabel: 'مجموع المصاريف',
    icon: 'arrowUp',
    tone: 'red',
    amountTone: 'text-red-600',
    cardTone: 'negative',
    columns: [
      { key: 'description', label: 'الوصف / السبب' },
      { key: 'spender', label: 'من قام بالصرف' },
    ],
    noteKey: 'description',
    noteLabel: 'الوصف / السبب',
  },
  advances: {
    title: 'السلف المستلمة',
    label: 'السلفة',
    word: 'سلفة',
    plural: 'سلف مستلمة',
    totalLabel: 'مجموع السلف',
    icon: 'arrowDown',
    tone: 'slate',
    amountTone: 'text-slate-800',
    cardTone: 'neutral',
    columns: [{ key: 'source', label: 'من جهة / شخص' }],
  },
  payouts: {
    title: 'التسليمات للشركاء',
    label: 'التسليم للشريك',
    word: 'تسليم',
    plural: 'تسليمات',
    totalLabel: 'المسلَّم للشركاء',
    icon: 'arrowUp',
    tone: 'amber',
    amountTone: 'text-amber-600',
    cardTone: 'negative',
    columns: [{ key: 'partner', label: 'الشريك' }],
  },
}

/** للرسائل المختصرة (تأكيد الحذف مثلًا). */
export const KIND_LABELS = Object.fromEntries(
  KIND_ORDER.map((k) => [k, KIND_META[k].label]),
)

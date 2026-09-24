/** مصدر واحد لعناصر التنقل — يستخدمه الـ Sidebar وشريط الموبايل. */
export const NAV_SECTIONS = [
  {
    title: 'عام',
    items: [{ to: '/', label: 'لوحة المعلومات', icon: 'home', end: true }],
  },
  {
    title: 'الحسابات',
    items: [
      { to: '/treasury', label: 'الصيرفة', icon: 'wallet' },
      { to: '/debts', label: 'الديون', icon: 'users' },
      { to: '/lists', label: 'مكاتب', icon: 'list' },
      { to: '/partners', label: 'حساب الشريكين', icon: 'users' },
    ],
  },
  {
    title: 'المشاريع',
    items: [
      { to: '/projects', label: 'المشاريع', icon: 'building' },
      { to: '/properties', label: 'العقار', icon: 'home' },
    ],
  },
  {
    title: 'البيانات',
    items: [{ to: '/settings', label: 'النسخ الاحتياطي', icon: 'settings' }],
  },
]

export const FLAT_NAV = NAV_SECTIONS.flatMap((s) => s.items)

/** شريط الموبايل يعرض الأقسام الأساسية فقط. */
export const MOBILE_NAV = [
  { to: '/', label: 'الرئيسية', icon: 'home', end: true },
  { to: '/treasury', label: 'الصيرفة', icon: 'wallet' },
  { to: '/debts', label: 'الديون', icon: 'users' },
  { to: '/lists', label: 'مكاتب', icon: 'list' },
  { to: '/projects', label: 'المشاريع', icon: 'building' },
  { to: '/properties', label: 'العقار', icon: 'home' },
]

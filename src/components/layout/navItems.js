/** مصدر واحد لعناصر التنقل — يستخدمه الـ Sidebar وشريط الموبايل. */
export const NAV_SECTIONS = [
  {
    title: 'الحسابات',
    items: [
      { to: '/treasury', label: 'الصيرفة', icon: 'wallet' },
      { to: '/debts', label: 'الديون', icon: 'users' },
      { to: '/lists', label: 'القوائم', icon: 'list' },
    ],
  },
  {
    title: 'المشاريع',
    items: [{ to: '/projects', label: 'المشاريع', icon: 'building' }],
  },
]

export const FLAT_NAV = NAV_SECTIONS.flatMap((s) => s.items)

/**
 * بيانات وهمية أولية (Seed) — تُستبدل لاحقًا بنداءات API حقيقية.
 * المبالغ بالدينار العراقي (د.ع).
 * لا يعتمد عليها أي مكوّن بشكل مباشر؛ كل الوصول يتم عبر DataContext.
 */

export const seedTreasury = [
  { id: 't1', type: 'in', amount: 200000000, date: '2026-08-01', note: 'رأس مال ابتدائي' },
  { id: 't2', type: 'out', amount: 28500000, date: '2026-08-06', note: 'شراء مواد بناء' },
  { id: 't3', type: 'in', amount: 65000000, date: '2026-08-14', note: 'دفعة من مشروع فيلا الياسمين' },
  { id: 't4', type: 'out', amount: 12750000, date: '2026-08-22', note: 'أجور عمال' },
]

export const seedCapital = 250000000

export const seedPeople = [
  { id: 'p1', name: 'أحمد المصري', phone: '07701234567', notes: 'مقاول باطن — أعمال البلاط' },
  { id: 'p2', name: 'سالم الحديدي', phone: '07812345678', notes: 'مورد حديد' },
  { id: 'p3', name: 'خالد النجار', phone: '', notes: '' },
]

export const seedDebtEntries = [
  { id: 'd1', personId: 'p1', type: 'debt', amount: 35000000, date: '2026-08-03', note: 'سلفة على أعمال البلاط' },
  { id: 'd2', personId: 'p1', type: 'receipt', amount: 15000000, date: '2026-08-20', note: 'تسديد جزئي' },
  { id: 'd3', personId: 'p2', type: 'debt', amount: 50000000, date: '2026-08-10', note: 'دفعة حديد تسليح' },
]

// كل قائمة مرتبطة بشخص موجود في seedPeople عبر personId — لا أسماء حرة.
export const seedLists = [
  { id: 'l1', personId: 'p1', name: 'قائمة البلاط', listNumber: '1024', date: '2026-08-04', notes: 'قائمة أعمال البلاط', value: 42000000, profit: 5500000, status: 'paid' },
  { id: 'l2', personId: 'p2', name: 'قائمة الحديد', listNumber: '1025', date: '2026-08-11', notes: 'حديد تسليح 12 مم', value: 78000000, profit: 9250000, status: 'unpaid' },
  { id: 'l3', personId: 'p3', name: '', listNumber: '1026', date: '2026-08-19', notes: '', value: 16500000, profit: 2100000, status: 'unpaid' },
  { id: 'l4', personId: 'p1', name: 'قائمة السيراميك', listNumber: '1027', date: '2026-08-27', notes: 'قائمة سيراميك', value: 23000000, profit: 3100000, status: 'unpaid' },
]

// سندات قبض القوائم — تُنقِص دين القوائم، بلا أي أثر على الصيرفة أو رأس المال
export const seedListReceipts = [
  { id: 'lr1', personId: 'p2', amount: 2000000, date: '2026-09-02', note: 'دفعة أولى من ربح قائمة الحديد' },
]

export const seedProjects = [
  {
    id: 'pr1',
    name: 'فيلا الياسمين',
    value: 480000000,
    company: 'شركة البناء الحديث',
    partners: ['أبو محمد', 'أبو ليث'],
    deposits: [
      { id: 'dp1', partner: 'أبو محمد', amount: 150000000, date: '2026-07-15' },
      { id: 'dp2', partner: 'أبو ليث', amount: 100000000, date: '2026-07-28' },
    ],
    expenses: [
      { id: 'ex1', amount: 62000000, description: 'أعمال الحفر والأساسات', spender: 'أحمد المصري', date: '2026-08-02' },
      { id: 'ex2', amount: 24500000, description: 'إسمنت ورمل', spender: 'خالد النجار', date: '2026-08-11' },
    ],
    advances: [
      { id: 'ad1', amount: 80000000, source: 'المالك — أبو سيف', date: '2026-08-05' },
    ],
    payouts: [
      { id: 'py1', partner: 'أبو ليث', amount: 20000000, date: '2026-08-25' },
    ],
  },
  {
    id: 'pr2',
    name: 'عمارة النخيل التجارية',
    value: 1750000000,
    company: 'مؤسسة الإعمار',
    partners: ['أبو محمد'],
    deposits: [
      { id: 'dp3', partner: 'أبو محمد', amount: 300000000, date: '2026-08-18' },
    ],
    expenses: [],
    advances: [],
    payouts: [],
  },
]

/** أنواع العقارات المتاحة في النموذج. */
export const PROPERTY_TYPES = ['أرض', 'دار', 'شقة', 'عمارة', 'محل', 'مزرعة', 'أخرى']

export const seedProperties = [
  {
    id: 'rp1',
    name: 'قطعة أرض الجادرية',
    type: 'أرض',
    partners: ['أبو محمد', 'أبو ليث'],
    purchasePrice: 180000000,
    purchaseDate: '2026-05-12',
    salePrice: 0,
    saleDate: '',
    status: 'owned',
    notes: 'مساحة 300 م² — واجهة 12 م',
    documents: [],
  },
  {
    id: 'rp2',
    name: 'دار حي الجامعة',
    type: 'دار',
    partners: ['أبو سيف'],
    purchasePrice: 95000000,
    purchaseDate: '2026-03-02',
    salePrice: 132000000,
    saleDate: '2026-08-20',
    status: 'sold',
    notes: '',
    documents: [],
  },
]

/** طرفا الحساب المتبادل داخل الشركة. */
export const PARTNER_NAMES = ['وعد', 'حسين']

/**
 * قيود الحساب بين الشريكين.
 * القيد «من A إلى B» يعني أن A دفع أو أعطى B، فيزيد ما يطلبه A من B.
 */
export const seedPartnerEntries = [
  { id: 'pe1', from: 'وعد', to: 'حسين', amount: 5000000, date: '2026-08-05', note: 'دفعة نقدية' },
  { id: 'pe2', from: 'حسين', to: 'وعد', amount: 1750000, date: '2026-08-21', note: 'تسديد جزئي' },
]

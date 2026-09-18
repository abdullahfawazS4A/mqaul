/**
 * طبقة البيانات المعزولة.
 * ------------------------------------------------------------------
 * كل الحالة (State) محفوظة هنا فقط، مع نسخة في localStorage لتبقى بعد التحديث.
 * عند ربط Backend لاحقًا: استبدل جسم الدوال أدناه بنداءات fetch/axios
 * دون الحاجة لتعديل أي مكوّن واجهة — التواقيع (signatures) تبقى كما هي.
 *
 * قاعدة أساسية: الديون النقدية (رأس المال) وديون القوائم نظامان معزولان
 * تمامًا؛ المشترك بينهما هو سجل الأشخاص فقط.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  seedTreasury,
  seedCapital,
  seedPeople,
  seedDebtEntries,
  seedLists,
  seedProjects,
} from './mockData.js'
import { clearState, loadState, saveState } from './storage.js'
import { todayISO } from '../utils/format.js'

const DataContext = createContext(null)

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
const today = todayISO // التوقيت المحلي — لا UTC
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)

const SEED = {
  treasury: seedTreasury,
  capital: seedCapital,
  people: seedPeople,
  debtEntries: seedDebtEntries,
  lists: seedLists,
  projects: seedProjects,
}

/** يضمن وجود كل مصفوفات الحركات — لمشاريع حُفظت قبل إضافة نوع جديد. */
const withKinds = (p) => ({
  ...p,
  deposits: p.deposits || [],
  expenses: p.expenses || [],
  advances: p.advances || [],
  payouts: p.payouts || [],
})

/** الحالة المحفوظة إن وُجدت، وإلا البيانات الأولية. */
const initial = (key) => {
  const saved = loadState()
  return saved && saved[key] !== undefined ? saved[key] : SEED[key]
}

export function DataProvider({ children }) {
  const [treasury, setTreasury] = useState(() => initial('treasury'))
  const [capital, setCapital] = useState(() => initial('capital'))
  const [people, setPeople] = useState(() => initial('people'))
  const [debtEntries, setDebtEntries] = useState(() => initial('debtEntries'))
  const [lists, setLists] = useState(() => initial('lists'))
  const [projects, setProjects] = useState(() => initial('projects').map(withKinds))

  /* --------------------------- الحفظ التلقائي --------------------------- */

  useEffect(() => {
    saveState({ treasury, capital, people, debtEntries, lists, projects })
  }, [treasury, capital, people, debtEntries, lists, projects])

  /* ------------------------------ الصيرفة ------------------------------ */

  const treasuryBalance = useMemo(
    () =>
      treasury.reduce(
        (sum, t) => (t.type === 'in' ? sum + num(t.amount) : sum - num(t.amount)),
        0,
      ),
    [treasury],
  )

  const treasuryTotals = useMemo(() => {
    const cashIn = treasury
      .filter((t) => t.type === 'in')
      .reduce((s, t) => s + num(t.amount), 0)
    const cashOut = treasury
      .filter((t) => t.type === 'out')
      .reduce((s, t) => s + num(t.amount), 0)
    return { cashIn, cashOut }
  }, [treasury])

  /** @returns {{ok: boolean, error?: string}} */
  const addTreasuryEntry = ({ type, amount, date, note }) => {
    const value = num(amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    const entry = {
      id: uid('t'),
      type: type === 'out' ? 'out' : 'in',
      amount: value,
      date: date || today(),
      note: note?.trim() || '',
    }
    setTreasury((prev) => [entry, ...prev])
    return { ok: true, entry }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updateTreasuryEntry = (id, patch) => {
    const value = patch.amount === undefined ? undefined : num(patch.amount)
    if (value !== undefined && value <= 0)
      return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setTreasury((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              type: patch.type === undefined ? t.type : patch.type === 'out' ? 'out' : 'in',
              amount: value === undefined ? t.amount : value,
              date: patch.date || t.date,
              note: patch.note === undefined ? t.note : patch.note.trim(),
            }
          : t,
      ),
    )
    return { ok: true }
  }

  const deleteTreasuryEntry = (id) => setTreasury((prev) => prev.filter((t) => t.id !== id))

  /* ------------------------------- الديون ------------------------------- */

  const balanceOfPerson = (personId) =>
    debtEntries
      .filter((e) => e.personId === personId)
      .reduce((s, e) => (e.type === 'debt' ? s + num(e.amount) : s - num(e.amount)), 0)

  const totalOutstandingDebt = useMemo(
    () =>
      debtEntries.reduce(
        (s, e) => (e.type === 'debt' ? s + num(e.amount) : s - num(e.amount)),
        0,
      ),
    [debtEntries],
  )

  // الرصيد المتاح للإقراض = رأس المال - مجموع الديون القائمة
  const availableCapital = capital - totalOutstandingDebt

  const peopleWithBalance = useMemo(
    () =>
      people.map((p) => ({
        ...p,
        balance: debtEntries
          .filter((e) => e.personId === p.id)
          .reduce(
            (s, e) => (e.type === 'debt' ? s + num(e.amount) : s - num(e.amount)),
            0,
          ),
      })),
    [people, debtEntries],
  )

  const addPerson = ({ name, phone, notes }) => {
    const person = {
      id: uid('p'),
      name: name.trim(),
      phone: phone?.trim() || '',
      notes: notes?.trim() || '',
    }
    setPeople((prev) => [...prev, person])
    return person
  }

  const updatePerson = (id, patch) =>
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  /**
   * حذف شخص — يمنع الحذف إذا كانت له قوائم مسجّلة (القوائم مرتبطة بالأشخاص).
   * @returns {{ok: boolean, error?: string}}
   */
  const deletePerson = (id) => {
    const personLists = lists.filter((l) => l.personId === id)
    if (personLists.length > 0) {
      return {
        ok: false,
        error: `لا يمكن حذف الشخص — مرتبط بـ ${personLists.length} قائمة. احذف قوائمه أولًا.`,
      }
    }
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setDebtEntries((prev) => prev.filter((e) => e.personId !== id))
    return { ok: true }
  }

  /**
   * إضافة دين — يمنع تجاوز الرصيد الكلي المتاح.
   * @returns {{ok: boolean, error?: string}}
   */
  const addDebt = ({ personId, amount, date, note }) => {
    const value = num(amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    if (value > availableCapital) {
      return {
        ok: false,
        error: `المبلغ المطلوب أكبر من الرصيد الكلي المتاح (${availableCapital.toLocaleString('en-US')}).`,
      }
    }
    setDebtEntries((prev) => [
      {
        id: uid('d'),
        personId,
        type: 'debt',
        amount: value,
        date: date || today(),
        note: note?.trim() || '',
      },
      ...prev,
    ])
    return { ok: true }
  }

  /**
   * سند قبض (استلام مبلغ من الشخص).
   * مسموح أن يتجاوز دين الشخص — عندها يصبح رصيده سالبًا أي له مبلغ لدينا.
   * @returns {{ok: boolean, error?: string}}
   */
  const addReceipt = ({ personId, amount, date, note }) => {
    const value = num(amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setDebtEntries((prev) => [
      {
        id: uid('d'),
        personId,
        type: 'receipt',
        amount: value,
        date: date || today(),
        note: note?.trim() || '',
      },
      ...prev,
    ])
    return { ok: true }
  }

  const deleteDebtEntry = (id) => setDebtEntries((prev) => prev.filter((e) => e.id !== id))

  /**
   * تعديل حركة (دين أو سند قبض).
   * الدين وحده مقيّد بالرصيد الكلي المتاح؛ سند القبض بلا سقف.
   * @returns {{ok: boolean, error?: string}}
   */
  const updateDebtEntry = (id, patch) => {
    const entry = debtEntries.find((e) => e.id === id)
    if (!entry) return { ok: false, error: 'الحركة غير موجودة.' }

    const value = patch.amount === undefined ? num(entry.amount) : num(patch.amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }

    if (entry.type === 'debt') {
      // السقف = المتاح حاليًا + المبلغ القديم (لأنه سيُستبدل)
      const ceiling = availableCapital + num(entry.amount)
      if (value > ceiling) {
        return {
          ok: false,
          error: `المبلغ أكبر من الرصيد الكلي المتاح (${ceiling.toLocaleString('en-US')}).`,
        }
      }
    }

    setDebtEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              amount: value,
              date: patch.date || e.date,
              note: patch.note === undefined ? e.note : patch.note.trim(),
            }
          : e,
      ),
    )
    return { ok: true }
  }

  const entriesOfPerson = (personId) =>
    debtEntries.filter((e) => e.personId === personId).slice().sort(byDateDesc)

  /** شخص واحد مع رصيده — للاستخدام في صفحة السجل. */
  const getPerson = (id) => peopleWithBalance.find((p) => p.id === id) || null

  const updateCapital = (value) => setCapital(num(value))

  /* ------------------------------- القوائم ------------------------------ */
  /**
   * كل قائمة مرتبطة بشخص موجود في الديون عبر personId — لا أسماء حرة.
   * دين القوائم على الشخص = مجموع أرباح قوائمه غير المقبوضة (status: 'unpaid').
   */

  // القوائم معروضة مع اسم الشخص المشتق من سجل الأشخاص
  const listsWithPerson = useMemo(
    () =>
      lists.map((l) => {
        const person = people.find((p) => p.id === l.personId) || null
        return {
          ...l,
          date: l.date || '', // قوائم محفوظة قبل إضافة حقل التاريخ
          personName: person?.name || 'شخص محذوف',
          personPhone: person?.phone || '',
        }
      }),
    [lists, people],
  )

  /** @returns {{ok: boolean, error?: string, item?: object}} */
  const addList = (data) => {
    const person = people.find((p) => p.id === data.personId)
    if (!person) return { ok: false, error: 'يجب اختيار شخص موجود في صفحة الديون.' }
    if (!data.listNumber?.trim()) return { ok: false, error: 'رقم القائمة مطلوب.' }
    const item = {
      id: uid('l'),
      personId: person.id,
      listNumber: data.listNumber.trim(),
      date: data.date || todayISO(),
      notes: data.notes?.trim() || '',
      value: num(data.value),
      profit: num(data.profit),
      status: data.status === 'paid' ? 'paid' : 'unpaid',
    }
    setLists((prev) => [item, ...prev])
    return { ok: true, item }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updateList = (id, patch) => {
    if (patch.personId !== undefined && !people.some((p) => p.id === patch.personId)) {
      return { ok: false, error: 'يجب اختيار شخص موجود في صفحة الديون.' }
    }
    if (patch.listNumber !== undefined && !patch.listNumber.trim()) {
      return { ok: false, error: 'رقم القائمة مطلوب.' }
    }
    setLists((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              ...patch,
              listNumber: (patch.listNumber ?? l.listNumber).trim(),
              value: num(patch.value ?? l.value),
              profit: num(patch.profit ?? l.profit),
            }
          : l,
      ),
    )
    return { ok: true }
  }

  const deleteList = (id) => setLists((prev) => prev.filter((l) => l.id !== id))

  const toggleListStatus = (id) =>
    setLists((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: l.status === 'paid' ? 'unpaid' : 'paid' } : l,
      ),
    )

  /* --------------------------- ديون القوائم ---------------------------- */

  /** قوائم شخص واحد. */
  const listsOfPerson = (personId) => listsWithPerson.filter((l) => l.personId === personId)

  /**
   * ملخّص لكل شخص له قوائم:
   * debt = مجموع أرباح القوائم غير المقبوضة، collected = مجموع أرباح المقبوضة.
   */
  const listsDebtByPerson = useMemo(() => {
    const rows = people.map((person) => {
      const personLists = lists.filter((l) => l.personId === person.id)
      const unpaid = personLists.filter((l) => l.status === 'unpaid')
      return {
        id: person.id,
        name: person.name,
        phone: person.phone,
        listsCount: personLists.length,
        unpaidCount: unpaid.length,
        listsValue: personLists.reduce((s, l) => s + num(l.value), 0),
        debt: unpaid.reduce((s, l) => s + num(l.profit), 0),
        collected: personLists
          .filter((l) => l.status === 'paid')
          .reduce((s, l) => s + num(l.profit), 0),
      }
    })
    return rows.filter((r) => r.listsCount > 0).sort((a, b) => b.debt - a.debt)
  }, [people, lists])

  const listsTotals = useMemo(() => {
    const debt = listsDebtByPerson.reduce((s, r) => s + r.debt, 0)
    const collected = listsDebtByPerson.reduce((s, r) => s + r.collected, 0)
    return { debt, collected, peopleInDebt: listsDebtByPerson.filter((r) => r.debt > 0).length }
  }, [listsDebtByPerson])

  /* ------------------------------- المشاريع ----------------------------- */

  const addProject = ({ name, value, company, partners }) => {
    const project = {
      id: uid('pr'),
      name: name.trim(),
      value: num(value),
      company: company?.trim() || '',
      partners: (partners || []).map((p) => p.trim()).filter(Boolean),
      deposits: [],
      expenses: [],
      advances: [],
      payouts: [],
    }
    setProjects((prev) => [...prev, project])
    return project
  }

  const updateProject = (id, patch) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const deleteProject = (id) => setProjects((prev) => prev.filter((p) => p.id !== id))

  const getProject = (id) => projects.find((p) => p.id === id) || null

  /**
   * kind: 'deposits' | 'expenses' | 'advances'
   * @returns {{ok: boolean, error?: string}}
   */
  const addProjectItem = (projectId, kind, data) => {
    const value = num(data.amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    const item = { id: uid(kind.slice(0, 2)), ...data, amount: value, date: data.date || today() }
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, [kind]: [item, ...p[kind]] } : p)),
    )
    return { ok: true, item }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updateProjectItem = (projectId, kind, itemId, data) => {
    const value = num(data.amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              [kind]: p[kind].map((i) =>
                i.id === itemId ? { ...i, ...data, amount: value, date: data.date || i.date } : i,
              ),
            }
          : p,
      ),
    )
    return { ok: true }
  }

  const deleteProjectItem = (projectId, kind, itemId) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, [kind]: p[kind].filter((i) => i.id !== itemId) } : p,
      ),
    )

  /**
   * مجاميع المشروع.
   * available = (الإيداعات + السلف) − (المصاريف + المسلَّم للشركاء)
   *           — المتبقي تحت اليد في المشروع.
   */
  const projectTotals = (project) => {
    if (!project) return { deposits: 0, expenses: 0, advances: 0, payouts: 0, available: 0 }
    const sum = (arr) => (arr || []).reduce((s, i) => s + num(i.amount), 0)
    const deposits = sum(project.deposits)
    const expenses = sum(project.expenses)
    const advances = sum(project.advances)
    const payouts = sum(project.payouts)
    return {
      deposits,
      expenses,
      advances,
      payouts,
      available: deposits + advances - expenses - payouts,
    }
  }

  const projectsTotals = useMemo(() => {
    const sum = (arr) => (arr || []).reduce((s, i) => s + num(i.amount), 0)
    return projects.reduce(
      (acc, p) => ({
        value: acc.value + num(p.value),
        deposits: acc.deposits + sum(p.deposits),
        expenses: acc.expenses + sum(p.expenses),
        advances: acc.advances + sum(p.advances),
        payouts: acc.payouts + sum(p.payouts),
      }),
      { value: 0, deposits: 0, expenses: 0, advances: 0, payouts: 0 },
    )
  }, [projects])

  /* --------------------- الشريك داخل المشروع --------------------- */
  /**
   * الشريك اسم نصي حر (وليس personId)، ويظهر في ثلاثة حقول مختلفة:
   * deposits.partner و expenses.spender و advances.source.
   * لذلك تتم المطابقة على اسم مُطبَّع: بلا تشكيل ولا تطويل، ومع توحيد
   * الهمزات والألف المقصورة والتاء المربوطة — حتى يُطابق «أبو محمد» «ابو محمد».
   */
  const normalizeName = (v) =>
    String(v ?? '')
      .replace(/[ـً-ْ]/g, '') // تطويل وتشكيل
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

  /**
   * شركاء هذا المشروع المسجّلون في بياناته فقط — مع عدد حركات كل شريك.
   * الأسماء التي تظهر في الحركات دون أن تكون شريكًا مسجّلًا (مثل من قام
   * بالصرف أو مصدر السلفة) لا تُدرج هنا؛ تُضاف الأسماء من «تعديل المشروع».
   */
  const projectPartnerOptions = (project) => {
    if (!project) return []
    const map = new Map()
    ;(project.partners || []).forEach((raw) => {
      const name = String(raw || '').trim()
      const key = normalizeName(name)
      if (!key || map.has(key)) return
      map.set(key, { key, name, count: 0 })
    })
    const bump = (raw) => {
      const row = map.get(normalizeName(raw))
      if (row) row.count += 1
    }
    project.deposits.forEach((i) => bump(i.partner))
    project.expenses.forEach((i) => bump(i.spender))
    project.advances.forEach((i) => bump(i.source))
    ;(project.payouts || []).forEach((i) => bump(i.partner))
    return [...map.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'),
    )
  }

  /**
   * حركات شريك واحد داخل مشروع واحد — العناصر نفسها (لا نسخ) حتى يظل
   * التعديل والحذف يعملان عليها مباشرةً.
   * @returns {null | {name, deposits, expenses, advances, count, totals}}
   */
  const partnerInProject = (project, name) => {
    const key = normalizeName(name)
    if (!project || !key) return null
    const pick = (arr, field) => (arr || []).filter((i) => normalizeName(i[field]) === key)
    const deposits = pick(project.deposits, 'partner')
    const expenses = pick(project.expenses, 'spender')
    const advances = pick(project.advances, 'source')
    const payouts = pick(project.payouts, 'partner')
    const sum = (arr) => arr.reduce((s, i) => s + num(i.amount), 0)
    const t = {
      deposits: sum(deposits),
      expenses: sum(expenses),
      advances: sum(advances),
      payouts: sum(payouts),
    }
    const display = projectPartnerOptions(project).find((p) => p.key === key)
    return {
      name: display?.name || String(name).trim(),
      deposits,
      expenses,
      advances,
      payouts,
      count: deposits.length + expenses.length + advances.length + payouts.length,
      totals: { ...t, net: t.deposits + t.advances - t.expenses - t.payouts },
    }
  }

  /* ------------------------- النسخ الاحتياطي ---------------------------- */

  /** كل البيانات ككائن واحد — للتصدير. */
  const exportSnapshot = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { treasury, capital, people, debtEntries, lists, projects },
  })

  /**
   * استيراد نسخة سابقة — يستبدل كل البيانات الحالية.
   * @returns {{ok: boolean, error?: string}}
   */
  const importSnapshot = (snapshot) => {
    const d = snapshot?.data ?? snapshot
    if (!d || typeof d !== 'object') return { ok: false, error: 'الملف غير صالح.' }
    const required = ['treasury', 'people', 'debtEntries', 'lists', 'projects']
    const missing = required.filter((k) => !Array.isArray(d[k]))
    if (missing.length) {
      return { ok: false, error: `الملف ناقص أو تالف (${missing.join('، ')}).` }
    }
    setTreasury(d.treasury)
    setCapital(num(d.capital))
    setPeople(d.people)
    setDebtEntries(d.debtEntries)
    setLists(d.lists)
    setProjects(d.projects.map(withKinds))
    return { ok: true }
  }

  /** إعادة كل شيء إلى البيانات الأولية (النموذجية). */
  const resetAll = () => {
    clearState()
    setTreasury(SEED.treasury)
    setCapital(SEED.capital)
    setPeople(SEED.people)
    setDebtEntries(SEED.debtEntries)
    setLists(SEED.lists)
    setProjects(SEED.projects)
    return { ok: true }
  }

  /** مسح كل البيانات والبدء من الصفر. */
  const clearAll = () => {
    setTreasury([])
    setCapital(0)
    setPeople([])
    setDebtEntries([])
    setLists([])
    setProjects([])
    return { ok: true }
  }

  const dataCounts = {
    treasury: treasury.length,
    people: people.length,
    debtEntries: debtEntries.length,
    lists: lists.length,
    projects: projects.length,
  }

  const value = {
    // الصيرفة
    treasury,
    treasuryBalance,
    treasuryTotals,
    addTreasuryEntry,
    updateTreasuryEntry,
    deleteTreasuryEntry,
    // الديون
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
    people: peopleWithBalance,
    getPerson,
    addPerson,
    updatePerson,
    deletePerson,
    debtEntries,
    addDebt,
    addReceipt,
    updateDebtEntry,
    deleteDebtEntry,
    entriesOfPerson,
    balanceOfPerson,
    // القوائم
    lists: listsWithPerson,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    listsOfPerson,
    listsDebtByPerson,
    listsTotals,
    // المشاريع
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    addProjectItem,
    updateProjectItem,
    deleteProjectItem,
    projectTotals,
    projectsTotals,
    projectPartnerOptions,
    partnerInProject,
    // النسخ الاحتياطي
    exportSnapshot,
    importSnapshot,
    resetAll,
    clearAll,
    dataCounts,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData يجب أن يُستخدم داخل <DataProvider>')
  return ctx
}

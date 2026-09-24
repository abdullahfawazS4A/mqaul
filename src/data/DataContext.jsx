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
  seedListReceipts,
  seedProjects,
  seedProperties,
  seedPartnerEntries,
  PARTNER_NAMES,
} from './mockData.js'
import { clearState, loadState, saveState } from './storage.js'
import { deleteFile, deleteFiles, pruneFiles, putFile } from './files.js'
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
  listReceipts: seedListReceipts,
  projects: seedProjects,
  properties: seedProperties,
  partnerEntries: seedPartnerEntries,
}

/** يضمن وجود مصفوفة المستندات — لعقارات حُفظت قبل إضافتها. */
const withDocs = (p) => ({ ...p, partners: p.partners || [], documents: p.documents || [] })

/** يضمن وجود كل مصفوفات الحركات — لمشاريع حُفظت قبل إضافة نوع جديد. */
const withKinds = (p) => ({
  ...p,
  deposits: p.deposits || [],
  expenses: p.expenses || [],
  advances: p.advances || [],
  payouts: p.payouts || [],
})

/**
 * الحالة المحفوظة إن وُجدت، وإلا البيانات الأولية.
 * مفتاح غائب عن نسخة محفوظة يعني كيانًا أُضيف بعد حفظها، فيبدأ فارغًا —
 * لا ببيانات نموذجية تُحقن في بيانات المستخدم الحقيقية فتغيّر أرقامه.
 */
const initial = (key) => {
  const saved = loadState()
  if (!saved) return SEED[key]
  if (saved[key] !== undefined) return saved[key]
  return Array.isArray(SEED[key]) ? [] : SEED[key]
}

export function DataProvider({ children }) {
  const [treasury, setTreasury] = useState(() => initial('treasury'))
  const [capital, setCapital] = useState(() => initial('capital'))
  const [people, setPeople] = useState(() => initial('people'))
  const [debtEntries, setDebtEntries] = useState(() => initial('debtEntries'))
  const [lists, setLists] = useState(() => initial('lists'))
  // سندات قبض القوائم — معزولة عن سندات قبض الديون النقدية
  const [listReceipts, setListReceipts] = useState(() => initial('listReceipts'))
  const [projects, setProjects] = useState(() => initial('projects').map(withKinds))
  // العقارات — مستنداتها الوصفية هنا، ومحتوى الملفات في IndexedDB
  const [properties, setProperties] = useState(() => initial('properties').map(withDocs))
  // حساب وعد وحسين — معزول عن الصيرفة ورأس المال وصفحة الديون
  const [partnerEntries, setPartnerEntries] = useState(() => initial('partnerEntries'))

  /* --------------------------- الحفظ التلقائي --------------------------- */

  useEffect(() => {
    saveState({
      treasury,
      capital,
      people,
      debtEntries,
      lists,
      listReceipts,
      projects,
      properties,
      partnerEntries,
    })
  }, [treasury, capital, people, debtEntries, lists, listReceipts, projects, properties, partnerEntries])

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
      name: data.name?.trim() || '',
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
              name: patch.name === undefined ? l.name : patch.name.trim(),
              listNumber: (patch.listNumber ?? l.listNumber).trim(),
              // تاريخ فارغ في التعديل لا يمحو التاريخ المحفوظ
              date: patch.date || l.date,
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

  /* ----------------------- سندات قبض القوائم ---------------------------- */

  /**
   * سند قبض على دين القوائم. معزول تمامًا عن سندات قبض الديون النقدية:
   * لا يمسّ الصيرفة ولا رأس المال ولا رصيد الشخص في صفحة الديون.
   * @returns {{ok: boolean, error?: string}}
   */
  const addListReceipt = ({ personId, amount, date, note }) => {
    const value = num(amount)
    if (!personId) return { ok: false, error: 'اختر الشخص أولًا.' }
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setListReceipts((prev) => [
      { id: uid('lr'), personId, amount: value, date: date || today(), note: note?.trim() || '' },
      ...prev,
    ])
    return { ok: true }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updateListReceipt = (id, patch) => {
    const value = patch.amount === undefined ? undefined : num(patch.amount)
    if (value !== undefined && value <= 0)
      return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setListReceipts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              amount: value === undefined ? r.amount : value,
              note: patch.note === undefined ? r.note : patch.note.trim(),
            }
          : r,
      ),
    )
    return { ok: true }
  }

  const deleteListReceipt = (id) => setListReceipts((prev) => prev.filter((r) => r.id !== id))

  /** سندات قبض قوائم شخص واحد — الأحدث أولًا. */
  const listReceiptsOfPerson = (personId) =>
    listReceipts.filter((r) => r.personId === personId).sort(byDateDesc)

  /* --------------------------- ديون القوائم ---------------------------- */

  /** قوائم شخص واحد. */
  const listsOfPerson = (personId) => listsWithPerson.filter((l) => l.personId === personId)

  /**
   * ملخّص لكل شخص له قوائم:
   *   دين القوائم = أرباح القوائم غير المقبوضة − مجموع سندات قبض القوائم.
   * سند القبض هو آلية التسديد؛ زر «واصل» يبقى لتعليم قائمة بكاملها.
   * الدين لا ينزل تحت الصفر — الفائض يظهر في overpaid.
   */
  const listsDebtByPerson = useMemo(() => {
    const rows = people.map((person) => {
      const personLists = lists.filter((l) => l.personId === person.id)
      const unpaid = personLists.filter((l) => l.status === 'unpaid')
      const unpaidProfit = unpaid.reduce((s, l) => s + num(l.profit), 0)
      const receipts = listReceipts
        .filter((r) => r.personId === person.id)
        .reduce((s, r) => s + num(r.amount), 0)
      const net = unpaidProfit - receipts
      return {
        id: person.id,
        name: person.name,
        phone: person.phone,
        listsCount: personLists.length,
        unpaidCount: unpaid.length,
        listsValue: personLists.reduce((s, l) => s + num(l.value), 0),
        unpaidProfit,
        receipts,
        debt: Math.max(net, 0),
        overpaid: Math.max(-net, 0),
        collected:
          personLists
            .filter((l) => l.status === 'paid')
            .reduce((s, l) => s + num(l.profit), 0) + receipts,
      }
    })
    return rows.filter((r) => r.listsCount > 0 || r.receipts > 0).sort((a, b) => b.debt - a.debt)
  }, [people, lists, listReceipts])

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
   * الشريك اسم نصي حر (وليس personId)، ويظهر في حقول مختلفة:
   * deposits.partner و expenses.spender و payouts.partner.
   * السلف خارج نطاق الشريك: الشركة هي من يستلمها، و advances.source هو
   * الجهة المُقرِضة لا شريكًا في المشروع.
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
    ;(project.payouts || []).forEach((i) => bump(i.partner))
    return [...map.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'),
    )
  }

  /**
   * حركات شريك واحد داخل مشروع واحد — العناصر نفسها (لا نسخ) حتى يظل
   * التعديل والحذف يعملان عليها مباشرةً.
   * @returns {null | {name, deposits, expenses, payouts, count, totals}}
   */
  const partnerInProject = (project, name) => {
    const key = normalizeName(name)
    if (!project || !key) return null
    const pick = (arr, field) => (arr || []).filter((i) => normalizeName(i[field]) === key)
    const deposits = pick(project.deposits, 'partner')
    const expenses = pick(project.expenses, 'spender')
    const payouts = pick(project.payouts, 'partner')
    // السلف لا تُنسب لشريك — الشركة تستلمها، فتبقى خارج حساب الشريك
    const advances = []
    const sum = (arr) => arr.reduce((s, i) => s + num(i.amount), 0)
    const t = {
      deposits: sum(deposits),
      expenses: sum(expenses),
      payouts: sum(payouts),
    }
    const display = projectPartnerOptions(project).find((p) => p.key === key)
    return {
      name: display?.name || String(name).trim(),
      deposits,
      expenses,
      advances,
      payouts,
      count: deposits.length + expenses.length + payouts.length,
      totals: { ...t, net: t.deposits - t.expenses - t.payouts },
    }
  }

  /* ------------------------------ العقارات ----------------------------- */

  const getProperty = (id) => properties.find((p) => p.id === id) || null

  /** @returns {{ok: boolean, error?: string, item?: object}} */
  const addProperty = (data) => {
    if (!data.name?.trim()) return { ok: false, error: 'اسم العقار مطلوب.' }
    const sold = data.status === 'sold'
    const item = {
      id: uid('rp'),
      name: data.name.trim(),
      type: data.type?.trim() || '',
      partners: (data.partners || []).map((x) => String(x).trim()).filter(Boolean),
      purchasePrice: num(data.purchasePrice),
      purchaseDate: data.purchaseDate || today(),
      salePrice: sold ? num(data.salePrice) : 0,
      saleDate: sold ? data.saleDate || today() : '',
      status: sold ? 'sold' : 'owned',
      notes: data.notes?.trim() || '',
      documents: [],
    }
    setProperties((prev) => [item, ...prev])
    return { ok: true, item }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updateProperty = (id, patch) => {
    if (patch.name !== undefined && !patch.name.trim())
      return { ok: false, error: 'اسم العقار مطلوب.' }
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const status = patch.status === undefined ? p.status : patch.status
        const sold = status === 'sold'
        return {
          ...p,
          ...patch,
          name: (patch.name ?? p.name).trim(),
          partners:
            patch.partners === undefined
              ? p.partners
              : patch.partners.map((x) => String(x).trim()).filter(Boolean),
          purchasePrice: num(patch.purchasePrice ?? p.purchasePrice),
          purchaseDate: patch.purchaseDate || p.purchaseDate,
          // بيع مُلغى يمسح سعر البيع وتاريخه حتى لا يبقى رقم معلّق
          salePrice: sold ? num(patch.salePrice ?? p.salePrice) : 0,
          saleDate: sold ? patch.saleDate || p.saleDate || today() : '',
          status: sold ? 'sold' : 'owned',
          documents: p.documents,
        }
      }),
    )
    return { ok: true }
  }

  /** حذف عقار ومستنداته من خزانة الملفات معًا. */
  const deleteProperty = (id) => {
    const target = properties.find((p) => p.id === id)
    setProperties((prev) => prev.filter((p) => p.id !== id))
    if (target) deleteFiles(target.documents.map((d) => d.id)).catch(() => {})
    return { ok: true }
  }

  /**
   * تسجيل مستند: الملف يُحفظ في IndexedDB، وبياناته الوصفية مع العقار.
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const addPropertyDocument = async (propertyId, file) => {
    if (!file) return { ok: false, error: 'لم يُختَر ملف.' }
    const docId = uid('doc')
    try {
      await putFile(docId, file)
    } catch {
      return { ok: false, error: 'تعذّر حفظ الملف في هذا المتصفح.' }
    }
    const meta = {
      id: docId,
      name: file.name || 'مستند',
      mime: file.type || '',
      size: file.size || 0,
      addedAt: new Date().toISOString(),
    }
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, documents: [...p.documents, meta] } : p)),
    )
    return { ok: true, document: meta }
  }

  const deletePropertyDocument = (propertyId, docId) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, documents: p.documents.filter((d) => d.id !== docId) } : p,
      ),
    )
    deleteFile(docId).catch(() => {})
    return { ok: true }
  }

  const propertiesTotals = useMemo(() => {
    const owned = properties.filter((p) => p.status !== 'sold')
    const sold = properties.filter((p) => p.status === 'sold')
    const purchaseOwned = owned.reduce((s, p) => s + num(p.purchasePrice), 0)
    const purchaseSold = sold.reduce((s, p) => s + num(p.purchasePrice), 0)
    const saleTotal = sold.reduce((s, p) => s + num(p.salePrice), 0)
    return {
      count: properties.length,
      ownedCount: owned.length,
      soldCount: sold.length,
      // رأس المال المرتبط بعقارات لم تُبَع بعد
      heldValue: purchaseOwned,
      saleTotal,
      profit: saleTotal - purchaseSold,
      documentsCount: properties.reduce((s, p) => s + p.documents.length, 0),
    }
  }, [properties])

  /* -------------------- حساب الشريكين (وعد وحسين) ---------------------- */

  /**
   * قيد بين الشريكين: «من» دفع و«إلى» استلم، فيزيد ما يطلبه الدافع.
   * معزول تمامًا: لا يمسّ الصيرفة ولا رأس المال ولا أرصدة صفحة الديون.
   * @returns {{ok: boolean, error?: string}}
   */
  const addPartnerEntry = ({ from, to, amount, date, note }) => {
    const value = num(amount)
    if (!PARTNER_NAMES.includes(from) || !PARTNER_NAMES.includes(to))
      return { ok: false, error: 'اختر الطرفين.' }
    if (from === to) return { ok: false, error: 'لا يمكن أن يكون الطرفان نفس الشخص.' }
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    setPartnerEntries((prev) => [
      { id: uid('pe'), from, to, amount: value, date: date || today(), note: note?.trim() || '' },
      ...prev,
    ])
    return { ok: true }
  }

  /** @returns {{ok: boolean, error?: string}} */
  const updatePartnerEntry = (id, patch) => {
    const value = patch.amount === undefined ? undefined : num(patch.amount)
    if (value !== undefined && value <= 0)
      return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    if (patch.from && patch.to && patch.from === patch.to)
      return { ok: false, error: 'لا يمكن أن يكون الطرفان نفس الشخص.' }
    setPartnerEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              amount: value === undefined ? e.amount : value,
              date: patch.date || e.date,
              note: patch.note === undefined ? e.note : patch.note.trim(),
            }
          : e,
      ),
    )
    return { ok: true }
  }

  const deletePartnerEntry = (id) =>
    setPartnerEntries((prev) => prev.filter((e) => e.id !== id))

  /**
   * الرصيد بين الشريكين.
   * net موجب ⇒ PARTNER_NAMES[0] يطلب الثاني، وسالب ⇒ العكس.
   */
  const partnerTotals = useMemo(() => {
    const [a, b] = PARTNER_NAMES
    const paidByA = partnerEntries
      .filter((e) => e.from === a)
      .reduce((s, e) => s + num(e.amount), 0)
    const paidByB = partnerEntries
      .filter((e) => e.from === b)
      .reduce((s, e) => s + num(e.amount), 0)
    const net = paidByA - paidByB
    return {
      a,
      b,
      paidByA,
      paidByB,
      net,
      creditor: net > 0 ? a : net < 0 ? b : null,
      debtor: net > 0 ? b : net < 0 ? a : null,
      amount: Math.abs(net),
      count: partnerEntries.length,
    }
  }, [partnerEntries])

  /* ------------------------- النسخ الاحتياطي ---------------------------- */

  /** كل البيانات ككائن واحد — للتصدير. */
  const exportSnapshot = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      treasury,
      capital,
      people,
      debtEntries,
      lists,
      listReceipts,
      projects,
      properties,
      partnerEntries,
    },
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
    // النسخ المحفوظة قبل إضافة سندات القوائم لا تحتوي المفتاح
    setListReceipts(Array.isArray(d.listReceipts) ? d.listReceipts : [])
    setProjects(d.projects.map(withKinds))
    // العقارات اختيارية — نسخ محفوظة قبل إضافتها
    setPartnerEntries(Array.isArray(d.partnerEntries) ? d.partnerEntries : [])
    const imported = Array.isArray(d.properties) ? d.properties.map(withDocs) : []
    setProperties(imported)
    // ملفات العقارات القديمة لم تعد مرتبطة بشيء بعد الاستبدال
    pruneFiles(imported.flatMap((p) => p.documents.map((doc) => doc.id))).catch(() => {})
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
    setListReceipts(SEED.listReceipts)
    setProjects(SEED.projects)
    setProperties(SEED.properties)
    setPartnerEntries(SEED.partnerEntries)
    pruneFiles(SEED.properties.flatMap((p) => p.documents.map((d) => d.id))).catch(() => {})
    return { ok: true }
  }

  /** مسح كل البيانات والبدء من الصفر. */
  const clearAll = () => {
    setTreasury([])
    setCapital(0)
    setPeople([])
    setDebtEntries([])
    setLists([])
    setListReceipts([])
    setProjects([])
    setProperties([])
    setPartnerEntries([])
    pruneFiles([]).catch(() => {})
    return { ok: true }
  }

  const dataCounts = {
    treasury: treasury.length,
    people: people.length,
    debtEntries: debtEntries.length,
    lists: lists.length,
    listReceipts: listReceipts.length,
    projects: projects.length,
    properties: properties.length,
    partnerEntries: partnerEntries.length,
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
    listReceipts,
    addListReceipt,
    updateListReceipt,
    deleteListReceipt,
    listReceiptsOfPerson,
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
    // العقارات
    properties,
    getProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyDocument,
    deletePropertyDocument,
    propertiesTotals,
    // حساب الشريكين
    partnerEntries,
    addPartnerEntry,
    updatePartnerEntry,
    deletePartnerEntry,
    partnerTotals,
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

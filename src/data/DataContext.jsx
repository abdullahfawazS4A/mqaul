/**
 * طبقة البيانات المعزولة.
 * ------------------------------------------------------------------
 * كل الحالة (State) محفوظة هنا فقط في ذاكرة التطبيق (React state).
 * عند ربط Backend لاحقًا: استبدل جسم الدوال أدناه بنداءات fetch/axios
 * دون الحاجة لتعديل أي مكوّن واجهة — التواقيع (signatures) تبقى كما هي.
 */
import { createContext, useContext, useMemo, useState } from 'react'
import {
  seedTreasury,
  seedCapital,
  seedPeople,
  seedDebtEntries,
  seedLists,
  seedProjects,
} from './mockData.js'

const DataContext = createContext(null)

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
const today = () => new Date().toISOString().slice(0, 10)
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export function DataProvider({ children }) {
  const [treasury, setTreasury] = useState(seedTreasury)
  const [capital, setCapital] = useState(seedCapital)
  const [people, setPeople] = useState(seedPeople)
  const [debtEntries, setDebtEntries] = useState(seedDebtEntries)
  const [lists, setLists] = useState(seedLists)
  const [projects, setProjects] = useState(seedProjects)

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

  const addTreasuryEntry = ({ type, amount, date, note }) => {
    const entry = {
      id: uid('t'),
      type: type === 'out' ? 'out' : 'in',
      amount: num(amount),
      date: date || today(),
      note: note?.trim() || '',
    }
    setTreasury((prev) => [entry, ...prev])
    return entry
  }

  const deleteTreasuryEntry = (id) =>
    setTreasury((prev) => prev.filter((t) => t.id !== id))

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

  const deletePerson = (id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setDebtEntries((prev) => prev.filter((e) => e.personId !== id))
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
   * سند قبض (تسديد) — يمنع التسديد بأكثر من رصيد دين الشخص.
   * @returns {{ok: boolean, error?: string}}
   */
  const addReceipt = ({ personId, amount, date, note }) => {
    const value = num(amount)
    if (value <= 0) return { ok: false, error: 'المبلغ يجب أن يكون أكبر من صفر.' }
    const personBalance = balanceOfPerson(personId)
    if (value > personBalance) {
      return {
        ok: false,
        error: `المبلغ أكبر من دين الشخص الحالي (${personBalance.toLocaleString('en-US')}).`,
      }
    }
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

  const deleteDebtEntry = (id) =>
    setDebtEntries((prev) => prev.filter((e) => e.id !== id))

  const entriesOfPerson = (personId) =>
    debtEntries
      .filter((e) => e.personId === personId)
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))

  const updateCapital = (value) => setCapital(num(value))

  /* ------------------------------- القوائم ------------------------------ */

  const addList = (data) => {
    const item = {
      id: uid('l'),
      personName: data.personName.trim(),
      listNumber: data.listNumber.trim(),
      notes: data.notes?.trim() || '',
      value: num(data.value),
      profit: num(data.profit),
      status: data.status === 'paid' ? 'paid' : 'unpaid',
    }
    setLists((prev) => [item, ...prev])
    return item
  }

  const updateList = (id, patch) =>
    setLists((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              ...patch,
              value: num(patch.value ?? l.value),
              profit: num(patch.profit ?? l.profit),
            }
          : l,
      ),
    )

  const deleteList = (id) => setLists((prev) => prev.filter((l) => l.id !== id))

  const toggleListStatus = (id) =>
    setLists((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: l.status === 'paid' ? 'unpaid' : 'paid' } : l,
      ),
    )

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
    }
    setProjects((prev) => [...prev, project])
    return project
  }

  const updateProject = (id, patch) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const deleteProject = (id) => setProjects((prev) => prev.filter((p) => p.id !== id))

  const getProject = (id) => projects.find((p) => p.id === id) || null

  /** kind: 'deposits' | 'expenses' | 'advances' */
  const addProjectItem = (projectId, kind, data) => {
    const item = {
      id: uid(kind.slice(0, 2)),
      ...data,
      amount: num(data.amount),
      date: data.date || today(),
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, [kind]: [item, ...p[kind]] } : p)),
    )
    return item
  }

  const deleteProjectItem = (projectId, kind, itemId) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, [kind]: p[kind].filter((i) => i.id !== itemId) } : p,
      ),
    )

  const projectTotals = (project) => {
    if (!project) return { deposits: 0, expenses: 0, advances: 0 }
    const sum = (arr) => arr.reduce((s, i) => s + num(i.amount), 0)
    return {
      deposits: sum(project.deposits),
      expenses: sum(project.expenses),
      advances: sum(project.advances),
    }
  }

  const value = {
    // الصيرفة
    treasury,
    treasuryBalance,
    treasuryTotals,
    addTreasuryEntry,
    deleteTreasuryEntry,
    // الديون
    capital,
    updateCapital,
    availableCapital,
    totalOutstandingDebt,
    people: peopleWithBalance,
    addPerson,
    updatePerson,
    deletePerson,
    debtEntries,
    addDebt,
    addReceipt,
    deleteDebtEntry,
    entriesOfPerson,
    balanceOfPerson,
    // القوائم
    lists,
    addList,
    updateList,
    deleteList,
    toggleListStatus,
    // المشاريع
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    addProjectItem,
    deleteProjectItem,
    projectTotals,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData يجب أن يُستخدم داخل <DataProvider>')
  return ctx
}

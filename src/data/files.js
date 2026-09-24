/**
 * خزانة الملفات (IndexedDB) — مستندات العقارات: صور وملفات PDF.
 *
 * لماذا ليست في localStorage مثل بقية البيانات؟ سعة localStorage نحو 5MB
 * وتقبل النصوص فقط، فصورة جوال واحدة تستهلكها كاملة. IndexedDB يخزّن
 * الملف كما هو (Blob) وسعته مئات الميغابايتات.
 *
 * بيانات المستند الوصفية (الاسم والنوع والحجم) تبقى مع العقار في
 * localStorage، وهنا يُحفظ محتوى الملف وحده مفهرسًا بمعرّف المستند.
 */

const DB_NAME = 'mqaul-files'
const DB_VERSION = 1
const STORE = 'documents'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('المتصفح لا يدعم تخزين الملفات.'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('تعذّر فتح خزانة الملفات.'))
  })
  // لا نُبقي وعدًا فاشلًا في الذاكرة، حتى تُعاد المحاولة لاحقًا
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function run(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.onabort = () => reject(tx.error || new Error('فشلت العملية على الملفات.'))
        if (req) {
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        } else {
          tx.oncomplete = () => resolve()
        }
      }),
  )
}

/** يحفظ محتوى ملف بمعرّف المستند. */
export const putFile = (id, blob) => run('readwrite', (store) => store.put(blob, id))

/** يُعيد Blob الملف أو undefined إن لم يوجد. */
export const getFile = (id) => run('readonly', (store) => store.get(id))

export const deleteFile = (id) => run('readwrite', (store) => store.delete(id))

/** حذف عدة ملفات دفعة واحدة — عند حذف عقار بمستنداته. */
export async function deleteFiles(ids) {
  for (const id of ids) {
    try {
      await deleteFile(id)
    } catch {
      // ملف مفقود أصلًا: لا يمنع حذف البقية
    }
  }
}

export const listFileIds = () => run('readonly', (store) => store.getAllKeys())

/** مجموع أحجام الملفات المخزّنة فعليًا — لعرضه في صفحة النسخ الاحتياطي. */
export async function usedBytes() {
  const ids = await listFileIds()
  let total = 0
  for (const id of ids) {
    const blob = await getFile(id)
    if (blob) total += blob.size
  }
  return total
}

/**
 * يحذف الملفات التي لم يعد يشير إليها أي مستند — بعد حذف عقار مثلًا.
 * @param {string[]} keepIds معرّفات المستندات التي ما زالت مسجّلة
 */
export async function pruneFiles(keepIds) {
  const keep = new Set(keepIds)
  const ids = await listFileIds()
  const orphans = ids.filter((id) => !keep.has(id))
  await deleteFiles(orphans)
  return orphans.length
}

/**
 * Service Worker — شرط لازم ليعرض المتصفح خيار «تثبيت التطبيق»،
 * ويجعل التطبيق يفتح بلا إنترنت.
 *
 * البيانات نفسها في localStorage ولا تمرّ من هنا إطلاقًا؛ هذا الملف
 * يخزّن ملفات الواجهة فقط (HTML/JS/CSS/الأيقونات).
 *
 * عند كل إصدار جديد غيّر VERSION ليُمسح المخزون القديم.
 */
const VERSION = 'v1'
const CACHE = `mqaul-${VERSION}`
const OFFLINE_URL = '/index.html'

// ملفات الإقلاع الأساسية؛ بقية الملفات (assets المُبصَّمة) تُخزَّن عند أول طلب
const CORE = ['/', OFFLINE_URL, '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // الخطوط وغيرها: يتكفّل بها المتصفح

  // التنقّل بين الصفحات: الشبكة أولًا ليصل أي تحديث، ثم النسخة المخزّنة عند انقطاعها.
  // الرجوع إلى index.html يجعل المسارات الداخلية تعمل بلا إنترنت (تطبيق صفحة واحدة).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(OFFLINE_URL, copy))
          return res
        })
        .catch(() => caches.match(OFFLINE_URL)),
    )
    return
  }

  // بقية الملفات: المخزون أولًا — أسماؤها مبصومة فلا تتغيّر محتوياتها
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        }),
    ),
  )
})

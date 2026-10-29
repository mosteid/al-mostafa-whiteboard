/* Offline-first: أول زيارة تُخزّن كل شيء (الصفحة، pdf.js، الخطوط…) ثم تعمل بدون إنترنت */
const CACHE = 'mostafa-board-v3';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !/^https?:/.test(req.url)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { net.catch(() => {}); return hit; }          // الكاش أولًا (سريع) والتحديث في الخلفية
    return (await net) || (await cache.match('./index.html')) || new Response('offline', { status: 503 });
  })());
});

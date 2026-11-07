// 토닥토닥 대장간 · build mw6lky0i
// Keeps nothing: every visit gets the newest game. A new build takes over at once, clears what the old
// worker cached, and reloads a page that was still showing the old game.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.clients.claim();
  if (keys.length) {
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
  }
})()));
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() =>
      new Response('<meta charset="utf-8"><p style="font:16px sans-serif;padding:24px">인터넷에 연결되면 토닥토닥 대장간이 켜져요.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
  }
});

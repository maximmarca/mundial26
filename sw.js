const C = "wc26-v2";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.json"]).catch(() => {})));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    // app shell: cache-first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); return resp;
    }).catch(() => caches.match("./index.html"))));
  } else {
    // datos/banderas/fotos: red primero, cache de respaldo
    e.respondWith(fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); return resp;
    }).catch(() => caches.match(e.request)));
  }
});

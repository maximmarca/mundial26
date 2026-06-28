const C = "wc26-v3";
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
  const esDoc = e.request.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("index.html");
  if (u.origin === location.origin && esDoc) {
    // documento de la app: RED PRIMERO (recibe actualizaciones), cache de respaldo offline
    e.respondWith(fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
  } else if (u.origin === location.origin) {
    // estaticos del shell (manifest, iconos): cache-first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); return resp;
    })));
  } else {
    // datos/banderas/fotos (ESPN, openfootball, flagcdn): red primero, cache de respaldo
    e.respondWith(fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(C).then(c => c.put(e.request, cp)); return resp;
    }).catch(() => caches.match(e.request)));
  }
});

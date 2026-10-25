/* 华脉 app service worker: always tries the network first so content stays fresh,
   and falls back to the last saved copy when the phone is offline. */
const CACHE = "hualin-v2";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // posts, images, fonts: straight to the network
  e.respondWith(fetch(req, req.mode === "navigate" ? { cache: "no-cache" } : {}).then(res => {
    if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: url.pathname.endsWith(".js") || url.pathname.endsWith(".css") }).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});

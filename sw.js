// Service worker de MR Gas: permite instalar la app y abrirla sin conexión.
// Los datos (carpeta api/) nunca se guardan en caché: siempre van al servidor.
// Al cambiar archivos del sitio, suba el número de versión para renovar la copia guardada.
const VERSION = "mrgas-v23";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/badge-72.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("mrgas-v") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const guardarCopia = (req, res) => {
  if (res && res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.includes("/api/")) return; // datos: siempre al servidor
  if (url.origin === location.origin) {
    if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
      // Página: primero internet; sin conexión, la copia guardada
      e.respondWith(fetch(req).then((r) => guardarCopia(req, r)).catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
    } else {
      // Íconos, mapa de calles: la copia guardada y se renueva por detrás
      e.respondWith(caches.match(req).then((r) => r || fetch(req).then((x) => guardarCopia(req, x))));
    }
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((x) => guardarCopia(req, x))));
  }
});

// Al tocar un aviso, abrir el sistema
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((ws) => (ws[0] ? ws[0].focus() : self.clients.openWindow("./#panel"))));
});

// Service worker de MR Gas: permite instalar la app y abrirla sin conexión.
// Los datos (carpeta api/) nunca se guardan en caché: siempre van al servidor.
// Al cambiar archivos del sitio, suba el número de versión para renovar la copia guardada.
const VERSION = "mrgas-v144";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/badge-72.png",
  "app/01-base.js", "app/02-iconos.js", "app/03-sistema.js", "app/04-vistas.js", "app/05-acciones.js", "app/06-sectorizar.js", "app/07-mayorista.js", "app/08-config.js", "app/09-choferes.js", "app/10-bodega-config.js", "app/11-mejoras.js", "app/12-facturas.js", "app/13-usuarios-respaldos.js", "app/14-apariencia.js", "app/arranque.js", "app/estilos-base.css", "app/estilos-login.css", "app/estilos-portal.css", "app/estilos-tema.css"];

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
    if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.includes("/app/") || url.pathname.includes("/local/") || url.pathname.endsWith("/marca.js")) {
      // Página y su código (app/): primero internet; sin conexión, la copia guardada
      e.respondWith(fetch(req).then((r) => guardarCopia(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
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

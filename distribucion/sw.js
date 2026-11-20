// App distribución desactivada: este service worker borra su caché y se quita solo
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("mrgas-dist")).map(k=>caches.delete(k))))
  .then(()=>self.registration.unregister()).then(()=>self.clients.matchAll()).then(l=>l.forEach(c=>c.navigate(c.url))))});

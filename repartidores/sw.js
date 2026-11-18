// MR Gas Repartidores: guarda la app para abrirla rápido; los pedidos (api/) nunca se guardan
const VERSION="mrgas-rep-v2";
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(["./","./index.html"])).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("mrgas-rep")&&k!==VERSION).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.pathname.includes("/api/")||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});

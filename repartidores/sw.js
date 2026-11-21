// MR Gas Repartidores: guarda la app para abrirla rápido; los pedidos (api/) nunca se guardan
const VERSION="mrgas-rep-v12";
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(["./","./index.html","./app.js","../marca.js"])).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("mrgas-rep")&&k!==VERSION).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.pathname.includes("/api/")||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});

// Aviso que llega del servidor aunque la app esté cerrada o la pantalla bloqueada
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={cuerpo:e.data?e.data.text():""}}
  e.waitUntil(self.registration.showNotification(d.titulo||"MR Gas",{body:d.cuerpo||"Tiene un aviso nuevo",tag:d.tag||"mrgas",renotify:true,requireInteraction:true,
    vibrate:[400,150,400,150,800],icon:"../icons/icon-192.png",badge:"../icons/icon-192.png",lang:"es",data:{url:"./"}}))});

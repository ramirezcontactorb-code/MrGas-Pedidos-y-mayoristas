if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(l=>l.forEach(r=>{if(r.scope.includes("/distribucion/"))r.unregister()}));
if(window.caches)caches.keys().then(k=>k.filter(x=>x.startsWith("mrgas-dist")).forEach(x=>caches.delete(x)));

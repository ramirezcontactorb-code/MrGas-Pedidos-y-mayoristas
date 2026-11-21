import sys
src='/root/.claude/projects/-home-user/f7786a09-bfda-5635-a706-cc7e0d2dbb10/tool-results/artifact-c217abc3-1794995747-4be7.html'
s=open(src,encoding='utf-8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:90]);s=s.replace(a,b)
rep("</head>","<script src=\"../marca.js\" defer></script></head>")
rep("<title>MR Gas</title>","<title>Venta Local · MR Gas</title><style id=\"mg-oculto\">#app{visibility:hidden}body::after{content:\"Cargando Venta Local…\";position:fixed;inset:0;display:grid;place-items:center;font:600 16px system-ui,sans-serif;color:#667085;background:#f2f4f7}html.mg-app body::after{content:\"\";background:#f2f4f7}</style><script>if(/[?&]app=1/.test(location.search))document.documentElement.classList.add('mg-app')</script>")
rep("const API_CANDS=['/api/docs','api/docs','api/docs.php'];","const API_CANDS=['api/docs.php'];")
rep("<span>MR · Sistema Local</span>","<span>MR · Sistema Local · Desarrollado por MrGas</span>",2)
rep("fetch(API_DOCS+(since?'?since='+encodeURIComponent(since):''),{cache:'no-store'})","fetch(mgUrl(since),{cache:'no-store',credentials:'same-origin'})")
rep("for(const u of API_CANDS){try{const r=await fetch(u,{cache:'no-store'});if(!r.ok)continue;const j=await r.json();if(j&&Array.isArray(j.rows)){first=j;API_DOCS=u;break;}}catch(e){}}",
    "for(const u of API_CANDS){try{const j=await mgPrimera();if(j&&Array.isArray(j.rows)){first=j;API_DOCS=u;break;}}catch(e){}}")
rep("  take(first.rows);\n","  take(first.rows);if(first.since&&(!since||first.since>since))since=first.since;mgCacheProg(cache,()=>since);\n")
# Puerta: hay que haber iniciado sesión en el Panel General
rep("async function boot(){\n","""/* ===== Venta Local dentro del Panel General: misma base de datos de MR Gas, login propio ===== */
let MGU=null,MG_LOGIN=false;
const MG_API='api/docs.php';
function mgPantalla(t,d){document.body.innerHTML=`<div class="login-wrap"><div class="login"><div class="lbrand"><div class="sq">MR</div><div><b>Venta Local</b><small>MR Gas</small></div></div>
  <h2>${t}</h2><p class="hint">${d}</p><button class="btn primary" onclick="location.reload()">Reintentar</button></div></div>`;}
/* sucursales configuradas en el Panel General (cuántas hay, cuáles están activas y cuáles tienen precios propios) */
/* sucursales con bodega propia (independientes): tienen su menú (venta, mayorista y bodega) */
const MG_BODP=[];
function mgSucs(l){if(!Array.isArray(l)||!l.length)return;
  MG_BODP.splice(0,MG_BODP.length,...l.filter(x=>x.bodega!=null&&+x.bodega<0).map(x=>x.nombre));
  SUCS_TODAS.splice(0,SUCS_TODAS.length,...l.map(x=>x.nombre));
  SUCS_OFF.splice(0,SUCS_OFF.length,...l.filter(x=>x.activa===false).map(x=>x.nombre));
  SUCS.splice(0,SUCS.length,...SUCS_TODAS.filter(s=>!SUCS_OFF.includes(s)));
  INDEP.splice(0,INDEP.length,...l.filter(x=>x.indep).map(x=>x.nombre));
  try{const u=JSON.parse(sessionStorage.getItem('gl_user'));if(u&&!SUCS.includes(u.suc)){sessionStorage.removeItem('gl_user');S.user=null;S.view='login';}}catch(e){}}
function mgVer(){const x=document.getElementById('mg-oculto');if(x)x.remove();}
/* ===== Carga rápida: copia de los datos en este navegador (IndexedDB); del servidor solo se pide lo nuevo ===== */
const MG_IDB='mrgas-local';
function mgIdb(){return new Promise((ok,no)=>{try{const q=indexedDB.open(MG_IDB,1);q.onupgradeneeded=()=>q.result.createObjectStore('c');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);}catch(e){no(e);}});}
let MG_SUC=null;const mgKey=()=>'docs-'+(MG_SUC?slug(MG_SUC):'todas');
function mgUrl(s){const q=[];if(MG_SUC)q.push('suc='+encodeURIComponent(slug(MG_SUC)));if(s)q.push('since='+encodeURIComponent(s));return MG_API+(q.length?'?'+q.join('&'):'');}
async function mgCacheLeer(){try{const d=await mgIdb();return await new Promise(ok=>{const q=d.transaction('c').objectStore('c').get(mgKey());q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null);});}catch(e){return null;}}
async function mgCacheGuardar(v){try{const d=await mgIdb();d.transaction('c','readwrite').objectStore('c').put(v,mgKey());}catch(e){}}
function mgCacheBorrar(){try{indexedDB.deleteDatabase(MG_IDB);}catch(e){}}
function mgCacheProg(cache,getSince){let ult=null;const g=()=>{const s=getSince();if(!s||s===ult)return;ult=s;const o=Object.fromEntries(cache);delete o['app/users'];mgCacheGuardar({since:s,rows:o});};
  setTimeout(g,1500);setInterval(g,8000);addEventListener('pagehide',g);document.addEventListener('visibilitychange',()=>{if(document.hidden)g();});}
let MG_PRIMERA=null;
function mgPrimera(){if(MG_PRIMERA)return MG_PRIMERA;
  MG_PRIMERA=(async()=>{const get=async s=>{const r=await fetch(mgUrl(s),{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error('http '+r.status);return r.json();};
    const c=await mgCacheLeer();
    if(c&&c.since&&c.rows){try{const j=await get(c.since),mp=new Map(Object.entries(c.rows));mp.delete('app/users');let s=c.since;
      (j.rows||[]).forEach(r=>{mp.set(r.path,r.data);if(r.updated_at>s)s=r.updated_at;});
      if(j.n!=null&&j.n===mp.size)return {rows:[...mp].map(([path,data])=>({path,data,updated_at:''})),since:s};}catch(e){}}
    const j=await get(null);return j;})();
  MG_PRIMERA.catch(()=>{MG_PRIMERA=null;});return MG_PRIMERA;}
async function mgGate(){
  if(!/^https?:$/.test(location.protocol)){mgVer();return true;} /* vista previa sin servidor */
  let j=null;try{const r=await fetch(MG_API+'?a=estado',{credentials:'same-origin',cache:'no-store'});j=await r.json();}catch(e){}
  if(!j||j.error){mgPantalla('Sin conexión','No se pudo conectar con el servidor. Revise internet y vuelva a intentar.');return false;}
  mgSucs(j.sucursales);
  if(j.quien){MGU={modo:j.quien.modo,user:j.quien.perfil.user,permisos:j.quien.perfil.permisos||[]};USERS=[mgUsuario(j.quien.perfil)];setTimeout(mgVer,8000);
    /* se cargan solo los datos de la sucursal en uso (el informe de todas las sucursales carga todo) */
    try{if(!/[?&]solo=inf\\b/.test(location.search)){const mias=userSucs(USERS[0]);let g=null;try{g=JSON.parse(sessionStorage.getItem('gl_user'));}catch(e){}
      /* la sucursal elegida se guarda aparte (mg_suc): el código antiguo la revisa antes de recibir la lista del servidor y descarta las nuevas */
      let w=null;try{w=sessionStorage.getItem('mg_suc');}catch(e){}
      const okS=x=>!!x&&SUCS.includes(x)&&(mias.includes(x)||USERS[0].rol==='admin'||(MGU.permisos||[]).includes('lsuc.'+slug(x)));
      const mismo=g&&String(g.u).toLowerCase()===String(MGU.user).toLowerCase();
      MG_SUC=okS(w)?w:(mismo&&okS(g.suc))?g.suc:(mias[0]||null);
      if(MG_SUC&&!S.user&&mismo){S.user={...g,suc:MG_SUC};S.view='home';}
      if(MG_SUC&&S.user&&S.user.suc!==MG_SUC)S.user.suc=MG_SUC;
      if(MG_SUC&&S.user){try{db=load(MG_SUC);sessionStorage.setItem('gl_user',JSON.stringify(S.user));}catch(e){}}}}catch(e){MG_SUC=null;}
    mgPrimera().catch(()=>{});return true;}
  /* sin sesión: se entra con el usuario y clave del Panel General */
  try{sessionStorage.removeItem('gl_user');}catch(e){}
  location.replace('../?volver=local#acceso');return false;
}
async function mgServerLogin(){
  const u=$('#lu').value.trim().toLowerCase(),p=$('#lp').value;if(!u||!p)return toast('Completa usuario y contraseña','err');
  let r,j={};try{r=await fetch(MG_API+'?a=login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:u,pass:p})});j=await r.json();}
  catch(e){return toast('No hay conexión con el servidor.','err');}
  if(!r.ok)return toast(j.error||'Usuario o contraseña incorrectos','err');
  location.reload();
}
{const d0=doLogin;doLogin=function(e){if(!MG_LOGIN)return d0(e);e.preventDefault();mgServerLogin();};}
{const o0=logout;logout=async function(){mgCacheBorrar();try{await fetch('../api/index.php?a=salir',{credentials:'same-origin',cache:'no-store'});}catch(e){}
  try{o0();}catch(e){}try{sessionStorage.removeItem('gl_user');}catch(e){}location.replace('../');};}
/* usuario de Venta Local armado con los permisos dados en el Panel General */
function mgUsuario(p){const per=Array.isArray(p.permisos)?p.permisos:[];
  if(p.rol==='admin')return {u:p.user,nombre:p.nombre,rol:'admin',verInf:true,mvmig:1,ctamig:1,p:''};
  const lp=per.filter(c=>c.startsWith('loc.')).map(c=>c.slice(4));
  const sucs=SUCS.filter(x=>per.includes('lsuc.'+slug(x))),loc=lp.filter(k=>!GLOBALP.includes(k)),ps={};sucs.forEach(x=>ps[x]=loc.slice());
  return {u:p.user,nombre:p.nombre,rol:'vendedor',perms:lp.filter(k=>GLOBALP.includes(k)&&k!=='users'),ps,verInf:lp.includes('inf'),mvmig:1,ctamig:1,p:''};}
/* Venta Local queda solo con Venta Local, su Rendición e Informes (salvo sucursales con bodega propia, ver abajo) */
const MG_OCULTOS=['mayor','mcta','bodega','bmov','bvmov','bedit','precios','com','phist','theme','users'];
/* sucursales con bodega propia: además tienen su Venta Mayorista (clientes propios) y su Control de bodega */
const MG_BODP_OK=['mayor','mcta','bodega','bmov','bvmov','bedit'];
{const c0=can;can=function(k){if(MGU&&MG_OCULTOS.includes(k)&&!(MG_BODP_OK.includes(k)&&S.user&&MG_BODP.includes(S.user.suc)))return false;return c0(k);};}
/* Una sola bodega: si la sucursal está unida a la bodega de la matriz, el stock es el de la matriz
   y cada venta del local descuenta (o devuelve) allá. */
let MGB=null;
const mgSnap=()=>({stock:Object.fromEntries(db.products.map(p=>[p.id,+p.stock||0])),vacios:{...(db.vacios||{})},prestados:{...(db.prestados||{})}});
function mgAplicarBodega(){if(!MGB||!db||!S.user||MGB.suc!==S.user.suc)return;
  db.products.forEach(p=>{if(MGB.base.stock[p.id]!=null)p.stock=MGB.base.stock[p.id]});
  db.vacios={...db.vacios,...MGB.base.vacios};db.prestados={...db.prestados,...MGB.base.prestados};}
async function mgLeerBodega(){if(!MGU||!S.user||!READY)return;const suc=S.user.suc;
  try{const r=await fetch(MG_API+'?a=bodega&suc='+encodeURIComponent(slug(suc)),{credentials:'same-origin',cache:'no-store'});const j=await r.json();
    if(!r.ok||j.bodega==null){if(MGB&&MGB.suc===suc)MGB=null;return;}
    const nuevo={stock:j.stock,vacios:j.vacios,prestados:j.prestados},cambio=!MGB||MGB.suc!==suc||JSON.stringify(MGB.base)!==JSON.stringify(nuevo);
    MGB={suc,bodega:j.bodega,nombre:j.nombre,base:nuevo};if(cambio&&S.user&&S.user.suc===suc&&db){mgAplicarBodega();onRemote();}}catch(e){}}
setInterval(()=>{if(!document.hidden)mgLeerBodega();},6000);
{const s0=save;save=function(){
  if(MGB&&db&&S.user&&MGB.suc===S.user.suc){const now=mgSnap(),d={stock:{},vacios:{},prestados:{}};let hay=false;
    ['stock','vacios','prestados'].forEach(k=>{const ids=new Set([...Object.keys(now[k]),...Object.keys(MGB.base[k]||{})]);
      ids.forEach(id=>{const v=(+now[k][id]||0)-(+(MGB.base[k]||{})[id]||0);if(v){d[k][id]=v;hay=true;}});});
    if(hay){MGB.base=now;const suc=MGB.suc;
      fetch(MG_API+'?a=bodega&suc='+encodeURIComponent(slug(suc)),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
        .then(r=>r.json()).then(j=>{if(j&&j.bodega!=null&&MGB&&MGB.suc===suc){MGB.base={stock:j.stock,vacios:j.vacios,prestados:j.prestados};mgAplicarBodega();}})
        .catch(()=>toast('No se pudo descontar el stock en la bodega de la matriz. Revise la conexión.','err'));}}
  return s0.apply(this,arguments);};}
/* totales de la rendición del día para el informe Resumen del Panel General */
{const p0=partsOf;partsOf=function(suc,d){const out=p0.apply(this,arguments),sl=slug(suc);
  try{withDb(d,()=>{for(const f in d.rend){const k=`suc/${sl}/rend/${f}`;if(!out[k])continue;const c=calcDia(f);out[k]={...d.rend[f],_r:Math.round(c.rendido+c.com),_c:Math.round(c.cargos)};}});}catch(e){}
  return out;};}
{const r0=rebuild;rebuild=function(suc,st){const x=r0.apply(this,arguments);if(MGB&&MGB.suc===suc&&S.user&&S.user.suc===suc){mgAplicarBodega();}return x;};}
/* usuarios, permisos y claves se manejan en el Panel General */
{const f0=fixUsers;fixUsers=function(l){return MGU?l:f0(l);};}
{const g0=go;go=function(v){if(v==='users'&&MGU)return toast('Los usuarios y permisos se manejan en Panel General → Configuraciones → Usuarios.');return g0(v);};}
{const a0=abrirInf;abrirInf=function(){if(!MGU)return a0();if(can('inf'))return go('inf');toast('No tienes permiso de Informes. Pídelo al administrador.','err');};}
{const c0=chMyPass;chMyPass=function(){if(!MGU)return c0();ask('Cambiar contraseña',async v=>{if(!v.cn)return toast('Escribe la nueva clave','err');
  try{const r=await fetch(MG_API+'?a=clave',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({actual:v.ca,nueva:v.cn})});const j=await r.json();
    if(!r.ok)return toast(j.error||'No se pudo cambiar','err');toast('Clave cambiada ✔');}catch(e){toast('Sin conexión','err');}},
  [{id:'ca',label:'Clave actual',type:'password'},{id:'cn',label:'Nueva clave',type:'password'}]);};}
/* entra directo con el usuario de la sesión */
function mgAutoLogin(){
  if(!MGU)return;
  if(S.user&&String(S.user.u).toLowerCase()===String(MGU.user).toLowerCase())return;
  S.user=null;
  const us=USERS.find(x=>String(x.u).toLowerCase()===String(MGU.user).toLowerCase());if(!us)return;
  const mias=userSucs(us);if(!mias.length)return toast('Tu usuario no tiene ninguna sucursal asignada. Pídelo a un administrador.','err');
  S.user={u:us.u,nombre:us.nombre,suc:mias[0]};S.view='home';
  try{sessionStorage.setItem('gl_user',JSON.stringify(S.user));}catch(e){}
  db=load(S.user.suc);setTimeout(()=>{try{presPing();}catch(e){}},0);
}
{const o0=onReady;onReady=function(){const x=o0.apply(this,arguments);setTimeout(mgLeerBodega,0);return x;};}
{const c1=cambioSuc;cambioSuc=function(){MGB=null;const x=c1.apply(this,arguments);setTimeout(mgLeerBodega,600);return x;};}
async function boot(){
  if(!(await mgGate()))return;
""")
rep("  if(READY)return;READY=true;setTimeout(()=>{if(S.user)presPing();},0);\n  if(S.user)db=load(S.user.suc);",
    "  if(READY)return;READY=true;setTimeout(()=>{if(S.user)presPing();},0);\n  mgAutoLogin();\n  if(S.user)db=load(S.user.suc);")
# botón para volver al Panel General
rep("function render(){","""function mgVolver(){if(!/^https?:$/.test(location.protocol))return;const ab=document.querySelector('.ab-right');
  if(ab&&MGU&&MGU.modo==='matriz'&&!document.getElementById('mg-volver'))ab.insertAdjacentHTML('afterbegin','<a class="hb" id="mg-volver" href="../#panel" style="text-decoration:none">← Panel General</a>');
  const lg=document.querySelector('.login');if(lg&&!document.getElementById('mg-volver2'))lg.insertAdjacentHTML('beforeend','<a id="mg-volver2" class="hint" href="../" style="text-align:center">← Volver al inicio</a>');}
{const r0=render;render=function(){const x=r0.apply(this,arguments);try{mgVolver();}catch(e){}return x;};}
function render(){""")
rep("function render(){","""/* Venta Local es una sola sucursal: entra directo a Venta Local, sin menú propio.
   Su informe se ve en Panel General → Informes → Venta Local (esta misma página con ?solo=inf). */
const MG_EMB=/[?&]solo=inf\\b/.test(location.search),MG_APP=/[?&]app=1\\b/.test(location.search);
if(MG_EMB)document.documentElement.classList.add('mg-emb');
{const r1=render;render=function(){
  if(MG_SUC&&S.user&&S.user.suc&&S.user.suc!==MG_SUC&&!MG_EMB){try{sessionStorage.setItem('gl_user',JSON.stringify(S.user));sessionStorage.setItem('mg_suc',S.user.suc);}catch(e){}document.body.style.visibility='hidden';location.reload();return;}
  if(MGU&&S.user&&db&&READY){
    if(MG_EMB)S.view='inf';
    else if(S.view==='inf'||!VIEWS[S.view]||(S.view==='home'&&!(MG_APP&&MG_BODP.includes(S.user.suc))))S.view=canView('venta')?'venta':canView('rend')?'rend':S.view;}
  const x=r1.apply(this,arguments);
  try{document.documentElement.dataset.vista=S.view||'';}catch(e){}
  if(MGU&&S.user&&db&&READY)mgVer();
  try{if(MGU&&S.user&&!MG_EMB){
    document.querySelectorAll('.ab-right .hb').forEach(b=>{if(b.id!=='mg-volver'&&/Volver/.test(b.textContent))b.remove();});
    const br=document.querySelector('.appbar .brand');if(br){br.removeAttribute('onclick');br.style.cursor='default';}
    const sy=document.getElementById('sync');if(sy&&!document.getElementById('mg-con')){sy.insertAdjacentHTML('beforebegin','<span class="mg-con" id="mg-con"><i></i>Conectado al servidor</span>');sy.style.display='none';mgConPintar();}
    const ab=document.querySelector('.ab-right'),u=USERS[0];
    if(MG_APP){const ph=document.querySelector('.phead');if(ph&&!document.getElementById('mg-acc')){const mc=document.getElementById('mg-con');
      ph.insertAdjacentHTML('beforeend','<div class="mg-acc" id="mg-acc"><span class="pill">'+esc(S.user.suc)+'</span>'+(u&&userSucs(u).length>1?'<button class="btn sm" onclick="cambioSuc()">Cambiar sucursal</button>':'')+'</div>');
      if(mc)document.getElementById('mg-acc').appendChild(mc);
      /* sucursal con bodega propia: volver a su menú */
      if(MG_BODP.includes(S.user.suc)&&S.view!=='home'){const bm=document.createElement('button');bm.className='btn sm';bm.id='mg-menu';bm.textContent='← Menú de '+S.user.suc;bm.onclick=()=>go('home');document.getElementById('mg-acc').prepend(bm);}}}
    /* en su menú: solo Venta Local, Venta Mayorista y Control de bodega (Configuración e Informes están en el Panel General) */
    if(MG_APP&&S.view==='home')document.querySelectorAll('.mcard').forEach(b=>{if([...b.attributes].some(a=>/^data-h\\d+a0$/.test(a.name)&&(a.value==='config'||a.value==='inf')))b.remove();});
    if(ab&&u&&userSucs(u).length>1&&!document.getElementById('mg-suc'))ab.insertAdjacentHTML('afterbegin','<button class="hb" id="mg-suc" onclick="cambioSuc()">Cambiar sucursal</button>');}}catch(e){}
  return x;};}
presPill=function(){return '';};
const mgCss2=document.createElement('style');mgCss2.textContent='@media (min-width:900px){'+'.mg-app .frame{padding:12px 24px 16px!important;max-width:none!important;margin:0!important}.mg-app .phead{margin:0 0 10px!important;padding:0!important;align-items:center!important;min-height:0!important}.mg-app .phead h1,.mg-app .phead .sub{display:none!important}.mg-app .phead .eyebrow{margin:0!important}.mg-app .pbody:not(.noside){gap:14px!important;grid-template-columns:178px minmax(0,1fr)!important;align-items:start}.mg-app .pside{padding:8px!important;margin-top:0!important;top:0!important;position:static!important}.mg-app .pside button{padding:9px 10px!important;font-size:14px!important}.mg-app .panel{border-radius:14px!important}.mg-app .pcont{padding:14px!important}html.mg-app[data-vista=venta] .pcont input[type=number]{font-size:18px!important;height:41px!important;min-width:84px}html.mg-app[data-vista=rend] .frame{padding-top:8px!important}html.mg-app[data-vista=rend] .pcont{padding:10px 12px!important}html.mg-app[data-vista=rend] .rbox{margin-bottom:5px!important}html.mg-app[data-vista=rend] .rbox-b{padding:4px 8px!important}html.mg-app[data-vista=rend] .rbox-b input,html.mg-app[data-vista=rend] .rbox-b select{height:28px!important;font-size:12.5px!important;padding:3px 7px!important}html.mg-app[data-vista=rend] .rbox-b .btn{padding:4px 10px!important;min-height:0!important;font-size:12.5px!important}html.mg-app[data-vista=venta] .pcont .btn{padding:11px 22px!important;font-size:13.5px!important;min-height:42px}.mg-app .pcont .btn.sm{padding:6px 12px!important;min-height:0;font-size:12.5px!important}'+'}'+'.mg-app .phead h1,.mg-app .phead .sub{display:none!important}';document.head.appendChild(mgCss2);
/* conexión con el servidor: verde si las consultas responden, rojo si se cortan */
let MG_CON=navigator.onLine!==false;
function mgConPintar(){const e=document.getElementById('mg-con');if(!e)return;e.classList.toggle('off',!MG_CON);e.lastChild.textContent=MG_CON?'Conectado al servidor':'No conectado al servidor';}
function mgCon(ok){if(MG_CON===ok)return;MG_CON=ok;mgConPintar();}
{const f0=window.fetch.bind(window);window.fetch=function(u,o){const p=f0(u,o);if(String(u).includes('api/'))p.then(()=>mgCon(true),()=>mgCon(false));return p;};}
addEventListener('offline',()=>mgCon(false));addEventListener('online',()=>mgCon(true));
const mgCss=document.createElement('style');mgCss.textContent='.mg-con{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#fff;background:#12b76a;border-radius:999px;padding:4px 11px;white-space:nowrap}.mg-con i{width:8px;height:8px;border-radius:50%;background:#fff}.mg-con.off{background:#d92d20}'+'.mg-emb .appbar,.mg-emb .foot,.mg-emb .phead{display:none!important}.mg-app .appbar,.mg-app .foot{display:none!important}.mg-app .frame{padding-top:14px}.mg-app .phead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.mg-acc{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.mg-emb body{background:transparent}.mg-emb .frame{margin:0;max-width:none;padding:0}';document.head.appendChild(mgCss);
function render(){""")
rep("(MODE==='shared'?'Conectado a la base compartida'","(MODE!=='local'?'Conectado a la base compartida'")
rep("const loc=readLS('mr_users');","const loc=MGU?null:readLS('mr_users');")
rep("${MY?secAbonos():''}","")
import re as _re
s=_re.sub(r'<link rel="icon"[^>]*>','<link rel="icon" type="image/png" sizes="192x192" href="../icons/icon-192.png">',s,count=1)
s=_re.sub(r'<link rel="apple-touch-icon"[^>]*>','<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">',s,count=1)
# sin código dentro del HTML (protección fuerte del navegador)
_x='onclick="${v===\'inf\'?\'abrirInf()\':`go(\'${v}\')`}"'
assert s.count(_x)==1,'boton inf'
s=s.replace(_x,'onclick="\'${v}\'===\'inf\'?abrirInf():go(\'${v}\')"')
import os as _os
sys.path.insert(0,_os.path.dirname(_os.path.abspath(__file__)))
from sincodigo import sin_codigo
s,_nh=sin_codigo(s,_os.path.dirname(_os.path.abspath(sys.argv[1])))
open(sys.argv[1],'w',encoding='utf-8').write(s);print('ok',len(s),'| acciones',_nh)

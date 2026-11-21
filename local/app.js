/* ================= SUPABASE (base de datos en la nube) =================
   Pega aquí los datos de tu proyecto: Supabase → Project Settings → API.
   Si quedan vacíos, la app guarda en el navegador como antes. */
const SUPABASE_URL='';
const SUPABASE_KEY='';
const SUPA_TABLE='mr_docs';
function supaStore(){
  if(!SUPABASE_URL||!SUPABASE_KEY||!window.supabase)return null;
  const cli=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const cache=new Map(),dl=new Map(),cl=new Map();let loaded=false;
  const parentOf=pth=>pth.split('/').slice(0,-1).join('/');
  const snapDoc=pth=>{const d=cache.get(pth);return {id:pth.split('/').pop(),exists:d!==undefined,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}};};
  const snapCol=c=>{const docs=[...cache.keys()].filter(k=>parentOf(k)===c).sort().map(k=>({id:k.split('/').pop(),data:()=>cache.get(k)}));
    return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}};};
  const notify=pth=>{if(!loaded)return;(dl.get(pth)||[]).forEach(f=>f(snapDoc(pth)));const c=parentOf(pth);(cl.get(c)||[]).forEach(f=>f(snapCol(c)));};
  const errOf=e=>{const m=String(e&&e.message||e||'');const o=new Error(m);o.code=/permission|policy|denied|JWT|401|403/i.test(m)?'invalid_argument':/fetch|network|Failed/i.test(m)?'unavailable':'unknown';return o;};
  const ready=(async()=>{
    for(let from=0;;from+=1000){
      const {data,error}=await cli.from(SUPA_TABLE).select('path,data').order('path').range(from,from+999);
      if(error)throw errOf(error);
      data.forEach(r=>cache.set(r.path,r.data));if(data.length<1000)break;}
    loaded=true;
    cli.channel('mr-docs').on('postgres_changes',{event:'*',schema:'public',table:SUPA_TABLE},pl=>{
      const r=pl.new&&pl.new.path?pl.new:pl.old;if(!r||!r.path)return;
      if(pl.eventType==='DELETE')cache.delete(r.path);else cache.set(r.path,pl.new.data);
      notify(r.path);}).subscribe();
  })();
  const on=(map,key,fn,snap,err)=>{(map.get(key)||map.set(key,[]).get(key)).push(fn);
    ready.then(()=>fn(snap(key))).catch(e=>err&&err(e));
    return ()=>{const a=map.get(key)||[];const i=a.indexOf(fn);if(i>=0)a.splice(i,1);};};
  return {
    doc:pth=>({path:pth,id:pth.split('/').pop(),
      get:async()=>{await ready;return snapDoc(pth);},
      set:async body=>{const {error}=await cli.from(SUPA_TABLE).upsert({path:pth,parent:parentOf(pth),data:body,updated_at:new Date().toISOString()});
        if(error)throw errOf(error);cache.set(pth,body);notify(pth);},
      onSnapshot:(next,err)=>on(dl,pth,next,snapDoc,err)}),
    prime:(pth,body)=>cache.set(pth,body),
    collection:c=>({path:c,doc:id=>null,onSnapshot:(next,err)=>on(cl,c,next,snapCol,err)})
  };
}
/* ================= NUBE: Vercel + Neon  o  Hostinger + MySQL =================
   En Vercel la página guarda en Neon a través de /api/docs (archivo api/docs.js).
   En Hostinger guarda en MySQL a través de api/docs.php (se prueba primero /api/docs y luego api/docs.php).
   Además, siempre queda una copia en el navegador. */
let API_DOCS='/api/docs';
const API_CANDS=['api/docs.php'];
async function apiStore(){
  if(!/^https?:$/.test(location.protocol))return null;
  let first;
  for(const u of API_CANDS){try{const j=await mgPrimera();if(j&&Array.isArray(j.rows)){first=j;API_DOCS=u;break;}}catch(e){}}
  if(!first)return null;
  const cache=new Map(),dl=new Map(),cl=new Map();let since=null;
  const parentOf=pth=>pth.split('/').slice(0,-1).join('/');
  const snapDoc=pth=>{const d=cache.get(pth);return {id:pth.split('/').pop(),exists:d!==undefined,data:()=>d,metadata:{fromCache:false,hasPendingWrites:false}};};
  const snapCol=c=>{const docs=[...cache.keys()].filter(k=>parentOf(k)===c).sort().map(k=>({id:k.split('/').pop(),data:()=>cache.get(k)}));
    return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false,hasPendingWrites:false}};};
  const notify=pth=>{(dl.get(pth)||[]).forEach(f=>f(snapDoc(pth)));const c=parentOf(pth);(cl.get(c)||[]).forEach(f=>f(snapCol(c)));};
  const take=rows=>{const ch=[];rows.forEach(r=>{if(!since||r.updated_at>since)since=r.updated_at;const j=JSON.stringify(r.data);if(JSON.stringify(cache.get(r.path))!==j){cache.set(r.path,r.data);ch.push(r.path);}});return ch;};
  take(first.rows);if(first.since&&(!since||first.since>since))since=first.since;mgCacheProg(cache,()=>since);
  const poll=async()=>{if(document.hidden)return;try{const r=await fetch(mgUrl(since),{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)return;const j=await r.json();take(j.rows||[]).forEach(notify);}catch(e){}};
  setInterval(poll,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
  const on=(map,key,fn,snap)=>{(map.get(key)||map.set(key,[]).get(key)).push(fn);setTimeout(()=>fn(snap(key)),0);
    return ()=>{const a=map.get(key)||[];const i=a.indexOf(fn);if(i>=0)a.splice(i,1);};};
  const errOf=(m,st)=>{const o=new Error(m);o.code=st===401||st===403?'invalid_argument':st===413?'quota_exceeded':'unavailable';return o;};
  return {
    doc:pth=>({path:pth,id:pth.split('/').pop(),
      get:async()=>snapDoc(pth),
      set:async body=>{let r;try{r=await fetch(API_DOCS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:pth,data:body})});}
        catch(e){throw errOf(String(e),0);}
        if(!r.ok){let m='';try{m=(await r.json()).error;}catch(e){}throw errOf(m||('Error '+r.status),r.status);}
        cache.set(pth,body);notify(pth);},
      onSnapshot:(next)=>on(dl,pth,next,snapDoc)}),
    prime:(pth,body)=>cache.set(pth,body),
    collection:c=>({path:c,doc:id=>null,onSnapshot:(next)=>on(cl,c,next,snapCol)})
  };
}
/* ================= ICONOS ================= */
const ICONS={
  receipt:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  clip:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
  house:'<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/>',
  swap:'<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/>',
  alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  check:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 13l1.5 1.5L12 12M14 8h2M14 13h2M8 18h8"/>',
  search:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="11.5" cy="11.5" r="3"/><path d="M16 16l-2.3-2.3"/>',
  out:'<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  back:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  print:'<path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="8" rx="2"/><path d="M6 14h12v8H6z"/>',
  tag:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6"/>',
  gauge:'<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  cyl:'<path d="M9 2h6v3H9z"/><path d="M7 5h10a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z"/><path d="M15 12a3 3 0 1 1-1-2.2"/><path d="M15 8.5v2h-2"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  calc:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8v4H8z"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18 5l2 2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M1 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/><path d="M17 4a4 4 0 0 1 0 8M23 21v-1a6 6 0 0 0-4-5.6"/>',
  palette:'<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 10c0-4.4-4.5-8-10-8z"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-8"/>',
  doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
};
const ic=n=>`<svg class="i" viewBox="0 0 24 24">${ICONS[n]||''}</svg>`;

/* ================= DATOS ================= */
const KEY='gaslocal_v1';
const PRODS=[
  {id:'5',  label:'5 kg', kg:5, tipo:'n', venta:12900, envase:28000, stock:0},
  {id:'11', label:'11 kg',kg:11,tipo:'n', venta:22600, envase:51000, stock:0},
  {id:'15', label:'15 kg',kg:15,tipo:'n', venta:30400, envase:40000, stock:0},
  {id:'45', label:'45 kg',kg:45,tipo:'n', venta:90500, envase:98000, stock:0},
  {id:'H15A',label:'H15', sub:'Aluminio', kg:15,tipo:'h', venta:27000, envase:0, stock:0},
];
const GROUPS=['5','11','15','45','H15A'];
const VSIZES=['5','11','15','45','H'];
const BANCOS=['Banco de Chile','BancoEstado','Santander','BCI','Scotiabank','Itaú','BICE','Security','Falabella','Ripley','Otro'];
const RKEYS=['efectivo','vuelto','vales','valesCil','cheques','transf','descuentos','qr','gastos','transbank','cargos','petroleo'];
const QRS=['11','15'];
const qrPrecio=s=>((db&&db.qr)||{})[s]||0;

const SUCS_TODAS=['Cervantes','El Tranque','Maipo','Padre Damián','Olivos','Jr Coyhaique','Jr Parcelas','Chillán'];
/* Sucursales deshabilitadas por ahora: no aparecen en ningún lado, pero sus datos quedan guardados.
   Para volver a activarlas, bórralas de esta lista. */
const SUCS_OFF=[];
const SUCS=SUCS_TODAS.filter(s=>!SUCS_OFF.includes(s));
/* Sucursales de otra región: precios base, comisión de vales y descuento QR propios (no se comparten) */
const INDEP=['Chillán'];
const indep=s=>INDEP.includes(s);
const sucKey=n=>'mr_suc_'+n.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,'_');
function readLS(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function fresh(){return {products:JSON.parse(JSON.stringify(PRODS)),ventas:[],movs:[],rend:{},seq:1};}
/* usuarios: compartidos por todas las sucursales */
/* Precio base mayorista y comisión de vales: iguales para todas las sucursales (documento app/global) */
let GLOBAL=(()=>{const g=readLS('mr_global');return g&&typeof g==='object'?g:{mayor:{},comision:null,hist:[]};})();
function applyGlobal(d,suc){if(!d||!GLOBAL||(suc&&indep(suc)))return d;
  const m=GLOBAL.mayor||{};if(d.products&&Object.keys(m).length)d.products.forEach(p=>{if(m[p.id]!=null)p.mayor=m[p.id];});
  if(GLOBAL.comision)d.comision=JSON.parse(JSON.stringify(GLOBAL.comision));if(GLOBAL.qr)d.qr=JSON.parse(JSON.stringify(GLOBAL.qr));return d;}
function saveGlobal(){
  GLOBAL.t=Date.now();GLOBAL.hist=(GLOBAL.hist||[]).slice(-500);
  try{localStorage.setItem('mr_global',JSON.stringify(GLOBAL));}catch(e){}
  SUCS.forEach(x=>{if(DBS[x])applyGlobal(DBS[x],x);});
  if(!STORE){SUCS.forEach(x=>{if(S.user&&x===S.user.suc)return;const d=loadLocal(x);if(d){applyGlobal(d,x);try{localStorage.setItem(sucKey(x),JSON.stringify(d));}catch(e){}}});return;}
  writeParts({'app/global':JSON.parse(JSON.stringify(GLOBAL))});
}
let USERS=readLS('mr_users');
if(!Array.isArray(USERS)||!USERS.length){const old=readLS(KEY);USERS=(old&&Array.isArray(old.users)&&old.users.length)?old.users:[{u:'matias',p:'1234',nombre:'MATIAS'}];}
if(!USERS.some(u=>u.rol==='admin')){(USERS.find(u=>u.u==='matias')||USERS[0]).rol='admin';}
USERS.forEach(u=>{if(!u.rol)u.rol='vendedor';});
/* datos: independientes por sucursal. Se guardan en la base compartida de la página
   (todos los usuarios ven lo mismo). Si no hay base compartida (archivo abierto en el
   computador), se guardan en el navegador como antes. */
const slug=suc=>sucKey(suc).replace('mr_suc_','');
function norm(d,suc){
  if(!d||!d.products)d=Object.assign(fresh(),d||{});
  d.products=PRODS.map(x=>Object.assign(JSON.parse(JSON.stringify(x)),(d.products||[]).find(p=>p.id===x.id)||{}));
  d.vacios=d.vacios||{};d.prestados=d.prestados||{};d.min=d.min||{};d.choferes=d.choferes||[];d.bmovs=d.bmovs||[];
  d.phist=d.phist||[];d.comision=d.comision||{};d.ventas=d.ventas||[];d.movs=d.movs||[];d.rend=d.rend||{};d.seq=d.seq||1;d.mayor=d.mayor||{};d.mayor.ventas=d.mayor.ventas||[];d.mayor.abonos=d.mayor.abonos||[];d.mayor.seq=d.mayor.seq||1;d.mayor.clientes=d.mayor.clientes||[];d.mayor.rend=d.mayor.rend||{};d.mayor.rendc=d.mayor.rendc||{};if(!d.mayor.listas)d.mayor.listas=[15,30,40].map((x,i)=>({id:i+1,nombre:'Mayorista '+x,dto:x}));return applyGlobal(d,suc);}
function loadLocal(suc){let d=readLS(sucKey(suc));
  if((!d||!d.products)&&suc==='Cervantes'){const old=readLS(KEY);if(old&&old.products){d=old;delete d.users;}}
  return (d&&d.products)?norm(d,suc):null;}
let STORE=null,READY=false,MODE='local';
const DBS={},LAST={},GOT=new Set(),PEND={};
function load(suc){
  if(!STORE)return loadLocal(suc)||norm(fresh(),suc);
  return DBS[suc]||(DBS[suc]=norm(fresh(),suc));
}
const CORE_SKIP=['ventas','rend','bmovs','movs'];
function coreOf(d){const o={};for(const k in d)if(!CORE_SKIP.includes(k))o[k]=d[k];return o;}
const rendEmpty=R=>!R||(!R.obs&&RKEYS.every(k=>!(R[k]||[]).length));
function partsOf(suc,d){
  const sl=slug(suc),out={};
  out['suc/'+sl]=coreOf(d);
  const vg={};d.ventas.forEach(v=>(vg[v.fecha]=vg[v.fecha]||[]).push(v));
  for(const f in vg)out[`suc/${sl}/ventas/${f}`]={list:vg[f]};
  for(const f in d.rend)if(!rendEmpty(d.rend[f])||LAST[`suc/${sl}/rend/${f}`])out[`suc/${sl}/rend/${f}`]=d.rend[f];
  const bg={};d.bmovs.forEach(m=>{const k=(m.fecha||today()).slice(0,7);(bg[k]=bg[k]||[]).push(m);});
  for(const k in bg)out[`suc/${sl}/bmovs/${k}`]={list:bg[k]};
  return out;
}
const sucLoaded=suc=>['','/ventas','/rend','/bmovs'].every(x=>GOT.has('suc/'+slug(suc)+x));
let QUEUE=Promise.resolve(),RO=false;
function writeParts(parts){
  const w=[];
  for(const k in parts){const j=JSON.stringify(parts[k]);if(LAST[k]!==j){LAST[k]=j;w.push([k,JSON.parse(j)]);}}
  if(!w.length)return QUEUE;
  /* se aplica al instante en la copia local, así lo recién ingresado no desaparece mientras se guarda */
  w.forEach(([k,body])=>{try{if(STORE.prime)STORE.prime(k,body);}catch(e){}
    const m=k.match(/^suc\/([^/]+)(?:\/(ventas|rend|bmovs)\/(.+))?$/);if(!m)return;
    const suc=SUCS.find(x=>slug(x)===m[1]);const st=suc&&ST[suc];if(!st)return;
    if(m[2])st[m[2]][m[3]]=clone(body);else st.core=clone(body);});
  setSync('Guardando…');
  QUEUE=QUEUE.then(()=>Promise.all(w.map(async([k,body])=>{
    {
      let ok=false;
      for(let t=0;t<2&&!ok;t++){
        try{await STORE.doc(k).set(body);ok=true;}
        catch(e){const c=e&&e.code;
          if(c==='unavailable'&&t===0){await new Promise(r=>setTimeout(r,600+Math.random()*800));continue;}
          delete LAST[k];
          if(c==='invalid_argument'){RO=true;toast('No tienes permiso para guardar. Pide acceso de Colaborador o Editor en el menú Compartir.','err');}
          else if(c==='quota_exceeded')toast('La base de datos está llena: no se pudo guardar.','err');
          else toast('No se pudo guardar en la nube. Revisa tu conexión.','err');
          break;}
      }
    }
  }))).then(()=>setSync(RO?'Solo lectura':'Guardado en la nube'));
  return QUEUE;
}
function save(){
  try{localStorage.setItem('mr_users',JSON.stringify(USERS));if(db&&S.user)localStorage.setItem(sucKey(S.user.suc),JSON.stringify(db));}catch(e){}
  if(!STORE)return;
  const parts={'app/users':{list:USERS}};
  if(db&&S.user){
    if(!sucLoaded(S.user.suc)){toast('Todavía se están cargando los datos de la sucursal. Intenta de nuevo en unos segundos.','err');return;}
    Object.assign(parts,partsOf(S.user.suc,db));
  }
  writeParts(parts);
}
function setSync(t){const e=$('#sync');if(e)e.textContent=t;}
/* ---- usuarios conectados (cada uno avisa cada 30 s que sigue conectado) ---- */
let PRES={};const PRES_TTL=120000;
const presKey=u=>'pres/'+slug(String(u||'').toLowerCase());
function presPing(off){if(!STORE||!S.user)return;const k=presKey(S.user.u),b={u:S.user.u,nombre:S.user.nombre,suc:S.user.suc,t:off?0:Date.now()};
  PRES[String(S.user.u).toLowerCase()]=b;try{if(STORE.prime)STORE.prime(k,b);const r=STORE.doc(k).set(b);if(r&&r.catch)r.catch(()=>{});}catch(e){}updPres();}
function presList(){const now=Date.now();return Object.values(PRES).filter(x=>x&&x.t&&now-x.t<PRES_TTL).sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre)));}
function presPill(){if(MODE!=='shared')return '';const n=presList().length;const adm=can('*admin');return `<button class="pres${adm?'':' ro'}" id="pres" ${adm?'onclick="presVer(event)" title="Ver quiénes están conectados"':'title="Usuarios conectados en todas las sucursales"'}><i></i><b>${n}</b><span>conectado${n===1?'':'s'}</span></button>`;}
function presHtml(){const l=presList();
  const g=SUCS.map(su=>[su,l.filter(x=>x.suc===su)]);const otros=l.filter(x=>!SUCS.includes(x.suc));if(otros.length)g.push(['Otra',otros]);
  return `<div class="presd-h">${l.length} conectado${l.length===1?'':'s'} en total</div>`+g.map(([su,xs])=>`<div class="presd-s${xs.length?'':' off'}"><span>${esc(su)}</span><em>${xs.length}</em></div>`
    +xs.map(x=>`<div class="presd-i"><i></i><b>${esc(x.nombre)}</b></div>`).join('')).join('');}
function updPres(){const el=$('#pres');if(el){const n=presList().length;el.querySelector('b').textContent=n;el.querySelector('span').textContent='conectado'+(n===1?'':'s');}const d=$('#presd');if(d)d.innerHTML=presHtml();}
function presVer(e){e.stopPropagation();if(!can('*admin'))return;let d=$('#presd');if(d){d.remove();return;}d=document.createElement('div');d.id='presd';d.className='presd';d.innerHTML=presHtml();
  const r=e.currentTarget.getBoundingClientRect();d.style.top=(r.bottom+6)+'px';d.style.left=Math.max(8,Math.min(innerWidth-248,r.left))+'px';document.body.appendChild(d);
  setTimeout(()=>document.addEventListener('click',()=>d.remove(),{once:true}),0);}
setInterval(()=>{if(S.user&&!document.hidden)presPing();},30000);
setInterval(updPres,10000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.user)presPing();});
let rrT=null,rrPend=false;
function onRemote(){
  if(!READY)return;
  clearTimeout(rrT);
  rrT=setTimeout(()=>{const a=document.activeElement;
    if(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&a.closest('#app')){rrPend=true;return;}
    if(!document.querySelector('.modal'))render();},200);
}
document.addEventListener('focusout',()=>{if(!rrPend)return;setTimeout(()=>{const a=document.activeElement;
  if(!(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName))){rrPend=false;onRemote();}},80);});
function clone(o){return JSON.parse(JSON.stringify(o));}
function rebuild(suc,st){
  const d=norm(Object.assign(fresh(),st.core?clone(st.core):{}),suc);
  d.ventas=Object.keys(st.ventas).sort().flatMap(k=>clone(st.ventas[k].list||[]));
  d.rend={};for(const k in st.rend)d.rend[k]=clone(st.rend[k]);
  d.bmovs=Object.keys(st.bmovs).sort().flatMap(k=>clone(st.bmovs[k].list||[]));
  DBS[suc]=d;if(S.user&&S.user.suc===suc&&READY)db=d;
  onRemote();
}
const ST={};
function markGot(k){GOT.add(k);if(!READY&&GOT.size>=1+SUCS.length*4)onReady();}
function subscribeAll(){
  const fail=e=>{if(e&&e.code==='revoked'){RO=true;setSync('Sin acceso');}};
  STORE.doc('app/users').onSnapshot(sn=>{
    if(sn.exists){const l=(sn.data()||{}).list;if(Array.isArray(l)&&l.length){LAST['app/users']=JSON.stringify({list:l});USERS=fixUsers(clone(l));}}
    if(!sn.metadata.fromCache)markGot('app/users');onRemote();},fail);
  STORE.collection('pres').onSnapshot(q=>{const m={};q.docs.forEach(d=>{const b=d.data();if(b&&b.u)m[String(b.u).toLowerCase()]=b;});PRES=m;updPres();},fail);
  STORE.doc('app/global').onSnapshot(sn=>{
    if(sn.exists){const g=sn.data()||{};LAST['app/global']=JSON.stringify(g);GLOBAL={mayor:g.mayor||{},comision:g.comision||null,qr:g.qr||null,hist:g.hist||[],t:g.t||0};
      try{localStorage.setItem('mr_global',JSON.stringify(GLOBAL));}catch(e){}
      SUCS.forEach(x=>{if(DBS[x])applyGlobal(DBS[x],x);});if(db&&S.user)applyGlobal(db,S.user.suc);}
    onRemote();},fail);
  SUCS.forEach(suc=>{
    const sl=slug(suc),st=ST[suc]={core:null,ventas:{},rend:{},bmovs:{}};
    STORE.doc('suc/'+sl).onSnapshot(sn=>{st.core=sn.exists?clone(sn.data()):null;if(sn.exists)LAST['suc/'+sl]=JSON.stringify(sn.data());
      rebuild(suc,st);if(!sn.metadata.fromCache)markGot('suc/'+sl);},fail);
    ['ventas','rend','bmovs'].forEach(c=>STORE.collection(`suc/${sl}/${c}`).onSnapshot(q=>{
      const m={};q.docs.forEach(d=>{const b=d.data();m[d.id]=clone(b);LAST[`suc/${sl}/${c}/${d.id}`]=JSON.stringify(b);});
      st[c]=m;rebuild(suc,st);if(!q.metadata.fromCache)markGot(`suc/${sl}/${c}`);},fail));
  });
}
function fixUsers(l){
  if(!l.some(u=>u.rol==='admin')){(l.find(u=>u.u==='matias')||l[0]).rol='admin';}
  l.forEach(u=>{if(!u.rol)u.rol='vendedor';if(u.rol!=='admin'&&!Array.isArray(u.perms))u.perms=PRESETS_P.vendedor.p.slice();
    if(!u.mvmig){const add=a=>{if(Array.isArray(a)&&a.includes('bmov')&&!a.includes('bvmov'))a.push('bvmov');};add(u.perms);if(u.ps&&typeof u.ps==='object')Object.values(u.ps).forEach(add);u.mvmig=1;}
    if(!u.ctamig){const add=a=>{if(Array.isArray(a)&&a.includes('mayor')&&!a.includes('mcta'))a.push('mcta');};add(u.perms);if(u.ps&&typeof u.ps==='object')Object.values(u.ps).forEach(add);u.ctamig=1;}
    if(u.verInf===undefined)u.verInf=u.verGan===true||ganInicial(u);});return l;
}
/* une los datos que quedaron guardados solo en este navegador con los de la nube */
function migrarLocal(){
  if(!STORE)return;
  let chg=false;
  const loc=MGU?null:readLS('mr_users');
  if(Array.isArray(loc))loc.forEach(u=>{if(u&&u.u&&!USERS.some(x=>x.u.toLowerCase()===u.u.toLowerCase())){USERS.push(u);chg=true;}});
  const parts={};
  SUCS.forEach(suc=>{
    const flag='mr_mig2_'+slug(suc);
    if(readLS(flag))return;
    const L=loadLocal(suc);if(!L){try{localStorage.setItem(flag,'1');}catch(e){}return;}
    const D=DBS[suc];
    const ids=new Set(D.ventas.map(v=>v.id));L.ventas.forEach(v=>{if(!ids.has(v.id))D.ventas.push(v);});
    const bid=new Set(D.bmovs.map(v=>v.id));L.bmovs.forEach(v=>{if(!bid.has(v.id))D.bmovs.push(v);});
    for(const f in L.rend){const lr=L.rend[f];if(rendEmpty(lr))continue;
      if(!D.rend[f]){D.rend[f]=lr;continue;}
      const dr=D.rend[f];RKEYS.forEach(k=>{const has=new Set((dr[k]||[]).map(e=>e.id));(lr[k]||[]).forEach(e=>{if(!has.has(e.id))(dr[k]=dr[k]||[]).push(e);});});
      if(!dr.obs&&lr.obs)dr.obs=lr.obs;}
    D.seq=Math.max(D.seq||1,L.seq||1,...D.ventas.map(v=>(v.num||0)+1));
    if(!ST[suc].core){Object.assign(D,coreOf(L),{seq:D.seq});}
    else if(JSON.stringify(L.products.map(p=>p.stock))!==JSON.stringify(D.products.map(p=>p.stock))||JSON.stringify(L.vacios)!==JSON.stringify(D.vacios)){PEND[suc]=coreOf(L);}
    Object.assign(parts,partsOf(suc,D));
    try{localStorage.setItem(flag,'1');}catch(e){}
  });
  if(chg||!LAST['app/users'])parts['app/users']={list:USERS};
  writeParts(parts);
}
function usarStockLocal(suc){
  const L=PEND[suc];if(!L)return;
  ask('¿Reemplazar el stock de la nube de '+suc+' por el que estaba guardado en este navegador?',()=>{
    const D=DBS[suc];['products','vacios','prestados','min','choferes','comision'].forEach(k=>{if(L[k])D[k]=clone(L[k]);});
    delete PEND[suc];writeParts(partsOf(suc,D));toast('Stock actualizado ✔');render();});
}
function descartarLocal(suc){delete PEND[suc];render();}
function onReady(){
  if(READY)return;READY=true;setTimeout(()=>{if(S.user)presPing();},0);
  mgAutoLogin();
  if(S.user)db=load(S.user.suc);
  migrarLocal();
  render();
}
let db=null;
/* ===== Venta Local dentro del Panel General: misma base de datos de MR Gas, login propio ===== */
let MGU=null,MG_LOGIN=false;
const MG_API='api/docs.php';
function mgPantalla(t,d){document.body.innerHTML=`<div class="login-wrap"><div class="login"><div class="lbrand"><div class="sq">MR</div><div><b>Venta Local</b><small>MR Gas</small></div></div>
  <h2>${t}</h2><p class="hint">${d}</p><button class="btn primary" data-h0="click">Reintentar</button></div></div>`;}
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
    try{if(!/[?&]solo=inf\b/.test(location.search)){const mias=userSucs(USERS[0]);let g=null;try{g=JSON.parse(sessionStorage.getItem('gl_user'));}catch(e){}
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
  fixUsers(USERS);
  let st=null;
  try{if(window.claude&&typeof window.claude.use==='function')st=await window.claude.use('db');}catch(e){st=null;}
  if(!st){try{st=supaStore();}catch(e){st=null;}}
  if(!st){try{st=await apiStore();}catch(e){st=null;}}
  if(!st){MODE='local';READY=true;if(S.user)db=load(S.user.suc);render();return;}
  STORE=st;MODE='shared';subscribeAll();render();
  setTimeout(()=>{if(!READY)toast('La conexión está lenta. Los datos pueden tardar en aparecer.','err');},10000);
}

/* ================= UTILIDADES ================= */
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const money=n=>(n<0?'-':'')+'$ '+Math.abs(Math.round(n||0)).toLocaleString('es-CL');
const num=v=>Math.max(0,parseInt(String(v??'').replace(/[^\d]/g,''))||0);
const P=id=>db.products.find(p=>p.id===id);
const grp=id=>id.replace(/C$/,'');
const colLbl=p=>p.tipo==='n'?p.id+'N':p.id;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const dmy=s=>s?String(s).slice(0,10).split('-').reverse().join('-'):'';
const hora=()=>new Date().toTimeString().slice(0,8);
let tt;function toast(m,t){const e=$('#toast');e.textContent=m;e.className=t||'';e.style.display='block';clearTimeout(tt);tt=setTimeout(()=>e.style.display='none',2600);}
const carga=id=>0; /* sin choferes: solo venta local */
const llenosTot=id=>P(id).stock+carga(id);
const lowList=()=>db.products.filter(p=>(db.min[p.id]||0)>0&&p.stock<db.min[p.id]);
const thP=()=>db.products.map(p=>`<th class="${p.tipo==='c'?'cat':''}">${colLbl(p)}</th>`).join('');

/* ================= ESTADO ================= */
const S={view:'login',user:null,f1:today(),f2:'',fu:'',fl:'',rfecha:today(),rfecha2:'',mfecha:today(),mfecha2:'',lista:'venta',cart:null,last:null,
  bi1:today(),bi2:'',btipo:'compra',bch:'',bm1:today(),bm2:'',bprod:'',tclase:'vacios'};
try{const u=JSON.parse(sessionStorage.getItem('gl_user'));if(u&&u.suc&&SUCS.includes(u.suc)){S.user=u;S.view=location.hash==='#informes'?'inf':'home';}}catch(e){}
function newCart(){return {items:{},env:{},desc:0,pago:'Efectivo',recibe:0};}
S.cart=newCart();
/* ================= PERMISOS POR USUARIO ================= */
const PERMS=[
  {g:'Ventas',items:[['venta','Venta Local'],['anular','Anular ventas'],['rend','Rendición'],['mayor','Venta mayorista y su rendición'],['mcta','Ver Cuenta Clientes (mayorista)']]},
  {g:'Bodega',items:[['bodega','Ver resumen de bodega'],['bmov','Ingreso de carga'],['bvmov','Ver movimientos de bodega'],['bedit','Modificar stock']]},
  {g:'Configuración',items:[['precios','Cambiar precios'],['com','Comisión de vales'],['phist','Historial de precios'],['users','Usuarios y permisos (solo admin)'],['theme','Theme']]},
  {g:'Informes',items:[['inf','Informes de todas las sucursales']]},
];
const ALLP=PERMS.flatMap(g=>g.items.map(x=>x[0]));
const OLDP=['binv','btrans','bmin'];
const PRESETS_P={
  vendedor:{n:'Vendedor',p:['venta','rend','bodega']},
  bodeguero:{n:'Bodeguero',p:['bodega','bmov','bvmov','bedit']},
  encargado:{n:'Encargado de local',p:['venta','anular','rend','mayor','mcta','bodega','bmov','bvmov','bedit','precios','com','phist']},
};
const VIEWP={venta:'venta',caja:'venta',rend:'rend',bres:'bodega',bmov:'bvmov',bcarga:'bmov',may:'mayor',mrend:'mayor',mcta:'mcta',binv:'binv',brec:'binv',btrans:'btrans',bmin:'bmin',bedit:'bedit',config:'precios',penv:'precios',clientes:'precios',pmay:'precios',com:'com',qrc:'precios',phist:'phist',users:'users',colores:'theme',inf:'inf'};
const curUser=()=>S.user?USERS.find(u=>u.u.toLowerCase()===String(S.user.u).toLowerCase()):null;
const GLOBALP=['users','theme','inf'];
const LOCALP=()=>ALLP.filter(k=>!GLOBALP.includes(k));
function psOf(u){
  if(u.ps&&typeof u.ps==='object')return u.ps;
  const base=(u.perms||PRESETS_P.vendedor.p).filter(k=>!GLOBALP.includes(k));
  const sucs=(Array.isArray(u.sucs)&&u.sucs.length)?u.sucs:SUCS;
  const o={};sucs.forEach(x=>o[x]=base.slice());return o;
}
function can(k){const u=curUser();if(!u)return false;if(k==='inf')return u.verInf===true||S.infOk===true;if((k==='mayor'||k==='mcta')&&S.user&&indep(S.user.suc))return false;if(u.rol==='admin')return true;if(k==='*admin')return false;if(k==='users')return false;if(k==='inf'&&S.infOk)return true;
  if(GLOBALP.includes(k))return (u.perms||[]).includes(k);
  return ((psOf(u)[S.user.suc])||[]).includes(k);}
const canView=v=>!VIEWP[v]||can(VIEWP[v]);
const userSucs=u=>(!u||u.rol==='admin')?SUCS:SUCS.filter(x=>(psOf(u)[x]||[]).length);
const firstConf=()=>['config','penv','clientes','qrc','pmay','com','phist','users','colores'].find(v=>canView(v));
function go(v){if(v==='config'&&!canView('config'))v=firstConf()||'home';if(!canView(v)){toast('No tienes permiso para esta sección. Pídelo a un administrador.','err');return;}S.view=v;render();window.scrollTo(0,0);}

/* ================= LOGIN ================= */
function doLogin(e){
  e.preventDefault();
  if(!READY)return toast('Conectando con la base de datos, espera un momento…','err');
  const u=$('#lu').value.trim().toLowerCase(),p=$('#lp').value;
  const us=USERS.find(x=>x.u.toLowerCase()===u&&x.p===p);
  if(!us)return toast('Usuario o contraseña incorrectos','err');
  /* cada usuario entra directo a su sucursal; si tiene varias, elige solo entre las suyas */
  const mias=userSucs(us),sw=$('#lsucw'),sl=$('#lsuc');
  if(!mias.length)return toast('Tu usuario no tiene ninguna sucursal asignada. Pídelo a un administrador.','err');
  let suc=mias.length===1?mias[0]:'';
  if(!suc){
    if(sw.hidden||!mias.includes(sl.value)){
      sl.innerHTML=`<option value="">Selecciona tu sucursal</option>`+mias.map(x=>`<option>${esc(x)}</option>`).join('');
      sw.hidden=false;sl.focus();return toast('Elige con qué sucursal vas a trabajar');}
    suc=sl.value;}
  S.user={u:us.u,nombre:us.nombre,suc};db=load(suc);presPing();
  try{sessionStorage.setItem('gl_user',JSON.stringify(S.user));}catch(e){}
  go(location.hash==='#informes'?'inf':'home');
}
function loginReset(){const w=$('#lsucw');if(w&&!w.hidden){w.hidden=true;$('#lsuc').innerHTML='';}}
function logout(){presPing(true);S.user=null;db=null;S.infOk=false;S.infBy='';try{sessionStorage.removeItem('gl_user');}catch(e){}go('login');}
function cambioSuc(){
  ask('Cambio de sucursal',v=>{const x=v.nsuc;if(!SUCS.includes(x)||x===S.user.suc)return;save();S.user.suc=x;db=load(x);presPing();
    try{sessionStorage.setItem('gl_user',JSON.stringify(S.user));}catch(e){}S.cart=newCart();S.last=null;toast('Ahora estás en '+x);go('home');},
    [{id:'nsuc',label:'Sucursal',type:'select',opts:userSucs(curUser()).filter(x=>x!==S.user.suc)}]);
}
function chMyPass(){const u=USERS.find(x=>x.u===S.user.u);if(!u)return;ask('Cambiar contraseña',v=>{if(v.ca!==u.p)return toast('Clave actual incorrecta','err');if(!v.cn)return toast('Escribe la nueva clave','err');u.p=v.cn;save();toast('Clave cambiada ✔');},[{id:'ca',label:'Clave actual',type:'password'},{id:'cn',label:'Nueva clave',type:'password'}]);}
function vLogin(){
  return `<div class="login-wrap"><div class="lshell"><aside class="lside">
    <div class="lbrand"><span class="sq">MR</span><div><b>MR</b><small>Sistema Local</small></div></div>
    <h1>Cada cilindro, <em>cada peso</em>, en su lugar.</h1>
    <p>Venta local, rendición diaria y control de bodega para todas las sucursales, en un solo sistema.</p>
  </aside><form class="login" data-h1="submit">
    <div><h2>Iniciar sesión</h2><p class="hint" style="margin-top:4px">Ingresa tu usuario y contraseña.</p></div>
    <label>Usuario<input id="lu" autocomplete="username" required autofocus data-h2="input"></label>
    <label>Contraseña<input id="lp" type="password" autocomplete="current-password" required data-h3="input"></label>
    <label id="lsucw" hidden>Sucursal<select id="lsuc"></select></label>
    <button class="btn primary">Ingresar</button>
    <p class="hint" style="text-align:center">${READY?(MODE!=='local'?'Conectado a la base compartida':'Modo local: datos solo en este navegador'):'Conectando con la base de datos…'}</p>
  </form></div></div>`;
}

/* ================= MARCO ================= */
function appbar(back,extra=''){
  return `<header class="appbar no-print"><div class="ab-in">
    <div class="brand" data-h4="click"><span class="sq">MR</span><div><b>MR</b><small>Sistema Local</small></div></div>
    <div class="ab-right">
      <span class="pill">${ic('pin')}${esc(S.user.suc)}</span>
      <span class="who">${ic('user')}${esc(S.user.nombre)}</span>
      <span class="clock" id="clock">${hora()}</span>
      ${presPill()}<span class="sync" id="sync" title="Estado de guardado">${MODE==='shared'?(RO?'Solo lectura':'Guardado en la nube'):'Guardado en este navegador'}</span>
      ${extra}
      ${back?`<button class="hb" data-h5="click" data-h5a0="${back}">${ic('back')}Volver</button>`:''}
      <button class="hb red" data-h6="click">${ic('out')}Salir</button>
    </div></div></header>`;
}
function sideB(list){return list.filter(([v])=>canView(v)).map(([v,i,t])=>`<button class="${S.view===v?'on':''}" data-h7="click" data-h7a0="${v}">${ic(i)}<span>${t}</span></button>`).join('');}
function frame(title,back,side,content,wide,actions=''){
  return appbar(back)+`<div class="frame ${wide?'wide':''}">
    <div class="phead"><div><div class="eyebrow">${title==='Informes'?'Todas las sucursales':'Sucursal '+esc(S.user.suc)}</div><h1>${title}</h1><p class="sub">${title==='Informes'?'Vista de administrador · ':''}${fechaLarga()}</p></div>${actions?`<div class="no-print">${actions}</div>`:''}</div>
    <div class="pbody ${side?'':'noside'}">${side?`<nav class="pside no-print">${sideB(side)}</nav>`:''}<section class="panel"><div class="pcont">${content}</div></section></div>
    <div class="foot"><span>MR · Sistema Local · Desarrollado por MrGas</span><span>${SUCS.length} sucursales</span></div></div>`;
}
function fechaLarga(){const t=new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});return t.charAt(0).toUpperCase()+t.slice(1);}

/* En Chillán la venta local se llama solo "Venta" y no hay venta mayorista */
const VLOC=()=>S.user&&indep(S.user.suc)?'Venta':'Venta Local';
const caja=c=>frame(S.view==='rend'?'Rendición':VLOC(),'home',[['venta','receipt',VLOC()],['rend','clip','Rendición']],c);
const BOD_SIDE=[['bres','house','Resumen'],['bcarga','swap','Ingreso de carga'],['bmov','list','Movimientos'],['bedit','edit','Modificar Stock']];
const bod=c=>frame('Control de bodega',(S.view==='bres'||!can('bodega'))?'home':'bres',BOD_SIDE,c,false,`<button class="btn" data-h8="click">${ic('print')}Imprimir</button>`);

/* ================= MENÚ PRINCIPAL ================= */
function vHome(){
  const low=lowList(),hoy=db.ventas.filter(v=>v.fecha===today()&&!v.anulada);
  const vt=hoy.reduce((a,v)=>a+v.total,0),ll=db.products.reduce((a,p)=>a+p.stock,0),va=GROUPS.reduce((a,g)=>a+(db.vacios[g]||0),0);
  const card=(v,i,t,d)=>`<button class="mcard" data-h9="click" data-h9a0="${v}" data-h9a1="${v}"><span class="mi">${ic(i)}</span><span class="mt">${t}</span><span class="md">${d}</span><span class="mgo">Abrir ${ic('arrow')}</span></button>`;
  const nom=S.user.nombre.charAt(0)+S.user.nombre.slice(1).toLowerCase();
  return appbar('',`<button class="hb" data-h10="click">${ic('swap')}Cambiar sucursal</button><button class="hb" data-h11="click">${ic('key')}Contraseña</button>`)+`<div class="frame">
    <div class="phead"><div><div class="eyebrow">Sucursal ${esc(S.user.suc)}</div><h1>Hola, ${esc(nom)}</h1><p class="sub">${fechaLarga()}</p></div></div>
    ${PEND[S.user.suc]?`<div class="alert">${ic('alert')}<span style="flex:1">Este navegador tenía stock de ${esc(S.user.suc)} guardado antes, distinto al de la nube.</span><button class="btn sm primary" data-h12="click" data-h12a0="${S.user.suc}">Usar el de este navegador</button><button class="btn sm" data-h13="click" data-h13a0="${S.user.suc}">Mantener el de la nube</button></div>`:''}
    ${false&&low.length?`<div class="alert">${ic('alert')}Bajo stock mínimo: ${low.map(p=>colLbl(p)).join(', ')}</div>`:''}
    <div class="menu">
      ${can('venta')||can('rend')?card(can('venta')?'venta':'rend','receipt',VLOC(),(VLOC()==='Venta'?'Venta':'Venta del local')+' y su rendición diaria.'):''}
      ${can('mayor')?card('may','users','Venta Mayorista','Ventas a mayoristas y su rendición con abonos.'):''}
      ${can('bodega')||['bmov','bvmov','bedit'].some(can)?card(can('bodega')?'bres':['bcarga','bmov','bedit'].find(v=>canView(v)),'house','Control de bodega','Llenos, vacíos y movimientos.'):''}
      ${firstConf()?card('config','gear','Configuración','Precios, comisión de vales, usuarios y theme.'):''}
      ${card('inf','chart','Informes','Ventas, rendición y stock por sucursal y en total.')}
    </div>
    <p class="stitle">Resumen de hoy</p>
    <div class="stats">
      <div class="stat"><div class="k">Ventas de hoy</div><div class="v">${money(vt)}</div></div>
      <div class="stat"><div class="k">Ventas registradas</div><div class="v">${hoy.length}</div></div>
      <div class="stat"><div class="k">Llenos en bodega</div><div class="v">${ll}</div></div>
      <div class="stat"><div class="k">Vacíos en bodega</div><div class="v">${va}</div></div>
    </div>
    <div class="foot"><span>MR · Sistema Local · Desarrollado por MrGas</span><span>${SUCS.length} sucursales</span></div></div>`;
}

/* ================= CAJA: PANTALLA PRINCIPAL ================= */
function vCaja(){
  const f1=S.f1,f2=S.f2||S.f1,ps=db.products;
  const vs=db.ventas.filter(v=>v.fecha>=f1&&v.fecha<=f2&&(!S.fu||v.usuario===S.fu));
  const ms=[];
  const tq={};ps.forEach(p=>tq[p.id]=0);
  let ing=0;
  vs.filter(v=>!v.anulada).forEach(v=>{for(const id in v.items)tq[id]+=v.items[id];ing+=v.total;});
  const ab=ms.filter(m=>m.tipo==='Abono').reduce((a,m)=>a+m.monto,0),re=ms.filter(m=>m.tipo==='Retiro').reduce((a,m)=>a+m.monto,0);
  const users=[...new Set(db.ventas.map(v=>v.usuario).concat(USERS.map(u=>u.nombre)))];
  const rows=[...vs.map(v=>({t:v.fecha+v.hora,h:`<tr class="${v.anulada?'anul':''}">
      <td><button class="ib" title="Imprimir" data-h14="click" data-h14a0="${v.id}">${ic('print')}</button></td>
      <td>${v.anulada?'':pastLock(v.fecha)?'🔒':`<button class="ib red" title="Anular" data-h15="click" data-h15a0="${v.id}">${ic('x')}</button>`}</td>
      <td>${v.num}</td><td>${v.hora}</td><td>${esc(v.usuario)}</td><td>Local</td>
      ${ps.map(p=>`<td class="${p.tipo==='c'?'cat':''}">${v.items[p.id]||''}</td>`).join('')}<td class="r"><b>${money(v.total)}</b></td><td>-</td></tr>`})),
    ...ms.map(m=>({t:m.fecha+m.hora,h:`<tr><td></td><td></td><td>-</td><td>${m.hora}</td><td>${esc(m.usuario)}</td><td><span class="badge ${m.tipo==='Retiro'?'red':'ok'}">${m.tipo}</span></td>
      <td colspan="${ps.length}" class="l hint">${esc(m.det)}</td><td class="r">${m.tipo==='Abono'?money(m.monto):'-'}</td><td class="r">${m.tipo==='Retiro'?money(m.monto):'-'}</td></tr>`}))]
    .sort((a,b)=>a.t.localeCompare(b.t)).map(r=>r.h).join('');
  return caja(`<div class="frow">Filtrar por:
      <select data-h16="change"><option value="">Usuario...</option>${users.map(u=>`<option ${S.fu===u?'selected':''}>${esc(u)}</option>`).join('')}</select>
      
      <input type="date" id="cf1" value="${S.f1}"><input type="date" id="cf2" value="${S.f2}">
      <button class="btn" data-h17="click">Ver</button></div>
    <div class="tw"><table>
      <tr><th></th><th></th><th>NÚMERO</th><th>HORA</th><th>USUARIO</th><th>LISTA</th>${ps.map(p=>`<th class="${p.tipo==='c'?'cat':''}">${p.id}</th>`).join('')}<th>INGRESO</th><th>EGRESO</th></tr>
      ${rows||`<tr><td colspan="${ps.length+8}" class="empty">No hay movimientos en esta fecha</td></tr>`}
      <tr class="tot"><td colspan="6" class="r">TOTALES</td>${ps.map(p=>`<td>${tq[p.id]||''}</td>`).join('')}<td class="r">${money(ing)}</td><td>-</td></tr>
    </table></div>`);
}
function anular(id,ok){
  if(!can('anular'))return toast('No tienes permiso para anular ventas.','err');
  const v=db.ventas.find(x=>x.id===id);if(!v||v.anulada)return;if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  if(!ok)return ask('¿Anular la venta N° '+v.num+'? El stock se devolverá.',()=>anular(id,1));
  for(const k in v.items){const p=P(k);if(p)p.stock+=v.items[k];}
  for(const g in (v.vac||{}))db.vacios[g]=Math.max(0,(db.vacios[g]||0)-v.vac[g]);
  v.anulada=true;save();toast('Venta anulada');render();
}

/* ================= VENTA LOCAL ================= */
const precio=p=>p.venta;
function cyl(p){
  const H={5:80,11:94,15:102,45:118}[p.kg]||102,al=p.tipo==='h',g='cg'+p.id,kg=String(p.kg);
  const w0=al?'#f3f5f8':'#ffffff',w1=al?'#c9cfd8':'#eef0f3',w2=al?'#8e98a6':'#d3d8df',ln=al?'#8e98a6':'#cfd5dd';
  return `<div class="cyl ${p.tipo}" title="${esc(p.label+(p.sub?' '+p.sub:''))}"><svg viewBox="0 0 80 112" height="${H}" width="${Math.round(H*80/112)}" aria-hidden="true">
    <defs><linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${w1}"/><stop offset=".35" stop-color="${w0}"/><stop offset=".7" stop-color="${w0}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
    <linearGradient id="${g}v" x1="0" x2="1"><stop offset="0" stop-color="#1f7a3c"/><stop offset=".45" stop-color="#43b866"/><stop offset="1" stop-color="#16602e"/></linearGradient>
    <radialGradient id="${g}s"><stop offset="0" stop-color="#0c1424" stop-opacity=".28"/><stop offset="1" stop-color="#0c1424" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="40" cy="108" rx="30" ry="3.6" fill="url(#${g}s)"/>
    <rect x="26" y="9" width="28" height="26" rx="2" fill="${w1}" stroke="${ln}" stroke-width=".7"/>
    <rect x="35" y="13" width="10" height="17" rx="3.2" fill="url(#${g}v)"/>
    <path d="M36 17.5h8M36 21.5h8M36 25.5h8" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>
    <path d="M20 36V8.5c0-2 1.4-3.5 3.4-3.5h6c2 0 3.4 1.5 3.4 3.5V36z" fill="url(#${g})" stroke="${ln}" stroke-width=".8"/>
    <path d="M47.2 36V8.5c0-2 1.4-3.5 3.4-3.5h6c2 0 3.4 1.5 3.4 3.5V36z" fill="url(#${g})" stroke="${ln}" stroke-width=".8"/>
    <path d="M8 54c0-15 12-21 32-21s32 6 32 21v31c0 5-3 8-8 8H16c-5 0-8-3-8-8z" fill="url(#${g})" stroke="${ln}" stroke-width=".8"/>
    <path d="M8.4 66h63.2" stroke="${ln}" stroke-width=".7" opacity=".8"/>
    <path d="M14 48c2-6 8-9 16-10" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="M14 93h52v11a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z" fill="url(#${g})" stroke="${ln}" stroke-width=".8"/>
    <path d="M14 95.5h52" stroke="${ln}" stroke-width=".6"/>
    <circle cx="21" cy="100" r="1.5" fill="#1d2433"/><circle cx="40" cy="101" r="1.7" fill="#1d2433"/><circle cx="59" cy="100" r="1.5" fill="#1d2433"/>
    <text x="40" y="${al?55:57}" text-anchor="middle" style="font:800 ${kg.length>1?15:16}px var(--f-ui);fill:var(--b7);letter-spacing:-.5px">${kg}<tspan style="font:700 8px var(--f-ui)" dx="1.5">kg</tspan></text>
    ${al?`<text x="40" y="62.5" text-anchor="middle" style="font:700 5.4px var(--f-ui);letter-spacing:.6px;fill:#475467">ALUMINIO</text>`:''}
  </svg><span class="cl">${esc(p.label.replace(' kg',''))}<small>${p.sub?esc(p.sub):'kg'}</small></span></div>`;}
function calcCart(){
  const c=S.cart;let sub=0;
  for(const id in c.items)sub+=c.items[id]*precio(P(id),S.lista);
  for(const id in c.env)sub+=c.env[id]*P(id).envase;
  const total=Math.max(0,sub-c.desc);
  return {sub,total,vuelto:Math.max(0,c.recibe-total)};
}
function setQ(kind,id,val,el){const n=num(val);if(n)S.cart[kind][id]=n;else delete S.cart[kind][id];el.classList.toggle('has',n>0);upd();}
function upd(){const t=calcCart();$('#vtotal').textContent=money(t.total);$('#vsub').textContent=money(t.sub);$('#vvuelto').textContent=money(t.vuelto);$('#vtotal2').textContent=money(t.total);}
function vmStep(b,kind,id,d){const i=b.parentNode.querySelector('input');i.value=Math.max(0,num(i.value)+d)||'';setQ(kind,id,i.value,i);vmMark();}
function vmMark(){$$('.vm-c').forEach(c=>c.classList.toggle('on',[...c.querySelectorAll('input')].some(i=>num(i.value)>0)));}
function vVentaMob(){
  const c=S.cart,t=calcCart(),ps=db.products;
  const st=(kind,p,sm)=>`<div class="pm"><button type="button" data-h18="click" data-h18a0="${kind}" data-h18a1="${p.id}">−</button><input class="q ${c[kind][p.id]?'has':''}" type="number" min="0" inputmode="numeric" placeholder="0" value="${c[kind][p.id]||''}" data-h19="input" data-h19a0="${kind}" data-h19a1="${p.id}"><button type="button" data-h20="click" data-h20a0="${kind}" data-h20a1="${p.id}">+</button></div>`;
  return caja(`<div class="vm-g">${ps.map(p=>`<div class="vm-c ${(c.items[p.id]||c.env[p.id])?'on':''}"><div class="t">${colLbl(p)}</div><div class="pr">${money(p.venta)}</div>
      ${st('items',p)}<div class="stk ${p.stock<=0?'out':''}">Stock: ${p.stock}</div>
      ${p.envase?`<div class="env"><span>Envase <b>${money(p.envase)}</b></span>${st('env',p)}</div>`:''}</div>`).join('')}</div>
    <div class="vm-tot"><div class="r1"><span>TOTAL</span><b id="vtotal">${money(t.total)}</b></div>
      <div class="r2"><span>Descuento $</span><input type="number" inputmode="numeric" placeholder="0" value="${c.desc||''}" data-h21="input"></div></div>
  <div class="pago ${S.showPago?'':'hide'}" id="pago">
    <span>Subtotal: <b id="vsub">${money(t.sub)}</b></span><span>Total: <b id="vtotal2">${money(t.total)}</b></span>
    <label>Medio de pago<select data-h22="change">${['Efectivo','Débito','Crédito','Transferencia','Vale'].map(x=>`<option ${c.pago===x?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Recibe $<input type="number" inputmode="numeric" placeholder="0" value="${c.recibe||''}" data-h23="input"></label>
    <span>Vuelto: <b id="vvuelto">${money(t.vuelto)}</b></span></div>
  <div class="vbtns">
    <button class="btn primary" data-h24="click">Grabar venta</button>
    <button class="btn" data-h25="click">Ingresar pago</button>
    <button class="btn" data-h26="click">Nueva venta</button>
    <button class="btn" data-h27="click">Imprimir</button>
    <button class="btn danger" data-h28="click">Anular</button>
  </div>
  ${S.last?`<p class="hint" style="text-align:center;margin-top:8px">Última venta grabada: N° ${db.ventas.find(v=>v.id===S.last)?.num??''}</p>`:''}
  ${ventasHoyMob()}`);
}
function ventasHoyMob(){
  const vs=db.ventas.filter(v=>v.fecha===today()).slice().reverse().slice(0,30);
  const q=v=>Object.keys(v.items).map(id=>`<span class="chip">${v.items[id]} × ${colLbl(P(id))}</span>`).join('')+Object.keys(v.env||{}).filter(id=>v.env[id]).map(id=>`<span class="chip">${v.env[id]} env ${colLbl(P(id))}</span>`).join('');
  return `<p class="stitle" style="margin-top:22px">Ventas de hoy</p>
  ${vs.length?vs.map(v=>`<div class="vm-v ${v.anulada?'anul':''}"><div class="h"><b>N° ${v.num}</b><span class="hint">${v.hora.slice(0,5)} · ${esc(v.usuario)}</span><span class="sp"></span><b>${money(v.total)}</b>
    ${v.anulada?'<span class="badge red">Anulada</span>':pastLock(v.fecha)?LOCKI:`<button class="btn sm danger" title="Anular venta" data-h29="click" data-h29a0="${v.id}">${ic('x')}Anular</button>`}</div>
    <div style="margin-top:6px">${q(v)}${v.editada?' <span class="hint">· editada</span>':''}</div></div>`).join('')
    :'<p class="empty" style="text-align:center;padding:14px">Aún no hay ventas hoy</p>'}`;
}
function vVenta(){
  _mob=MOB();if(_mob)return vVentaMob();
  const c=S.cart,t=calcCart(),ps=db.products;
  const qin=(kind,p)=>`<input class="q ${c[kind][p.id]?'has':''}" type="number" min="0" inputmode="numeric" placeholder="0" value="${c[kind][p.id]||''}" data-h30="input" data-h30a0="${kind}" data-h30a1="${p.id}">`;
  return caja(`<div class="vbox"><div class="tw"><table class="vt">
    <tr><td class="lc"><span class="rl">Precio venta local</span></td>${ps.map(p=>`<td class="pr on">${money(p.venta)}</td>`).join('')}</tr>
    <tr><td class="lc" rowspan="2"><div class="calc-ico">${ic('calc')}</div><div class="tl">TOTAL</div><div class="tv" id="vtotal">${money(t.total)}</div>
      <div class="tl">DESCUENTO</div><div class="min">$<input type="number" inputmode="numeric" placeholder="0" value="${c.desc||''}" data-h31="input"></div></td>
      ${ps.map(p=>`<td>${cyl(p)}</td>`).join('')}</tr>
    <tr>${ps.map(p=>`<td>${qin('items',p)}<div class="stk ${p.stock<=0?'out':''}">Stock: ${p.stock}</div></td>`).join('')}</tr>
    <tr><td colspan="${ps.length+1}" class="band">VENTA DE ENVASES</td></tr>
    <tr><td class="lc"></td>${ps.map(p=>`<td class="pr on">${p.envase?money(p.envase):''}</td>`).join('')}</tr>
    <tr><td class="lc"></td>${ps.map(p=>`<td>${p.envase?qin('env',p):''}</td>`).join('')}</tr>
  </table></div></div>
  <div class="pago ${S.showPago?'':'hide'}" id="pago">
    <span>Subtotal: <b id="vsub">${money(t.sub)}</b></span><span>Total: <b id="vtotal2">${money(t.total)}</b></span>
    <label>Medio de pago<select data-h32="change">${['Efectivo','Débito','Crédito','Transferencia','Vale'].map(x=>`<option ${c.pago===x?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Recibe $<input type="number" inputmode="numeric" placeholder="0" value="${c.recibe||''}" data-h33="input"></label>
    <span>Vuelto: <b id="vvuelto">${money(t.vuelto)}</b></span></div>
  <div class="vbtns">
    <button class="btn primary" data-h34="click">Grabar venta</button>
    <button class="btn" data-h35="click">Ingresar pago</button>
    <button class="btn" data-h36="click">Imprimir</button>
    <button class="btn danger" data-h37="click">Anular</button>
    <button class="btn" data-h38="click">Volver</button><span class="sp"></span>
    <button class="btn" data-h39="click">Nueva venta</button>
  </div>
  ${S.last?`<p class="hint" style="text-align:center;margin-top:8px">Última venta grabada: N° ${db.ventas.find(v=>v.id===S.last)?.num??''}</p>`:''}
  ${ventasHoyTbl()}`);
}
function ventasHoyTbl(){
  const ps=db.products,vs=db.ventas.filter(v=>v.fecha===today()).slice().reverse().slice(0,30);
  const qi=(attr,id,val)=>`<input class="ei" style="width:56px;text-align:center" type="number" min="0" inputmode="numeric" placeholder="0" ${attr}="${id}" value="${val||''}">`;
  return `<p class="stitle" style="margin-top:24px">Ventas de hoy <span class="hint" style="text-transform:none;letter-spacing:0">· si hay un error, anula la venta y vuelve a ingresarla</span></p>
  <div class="tw"><table><tr><th>N°</th><th>HORA</th><th>USUARIO</th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>TOTAL</th><th class="no-print"></th></tr>
  ${vs.length?vs.map(v=>{const ed=S.vedit===v.id&&!v.anulada;
    return `<tr class="${v.anulada?'anul':''}"><td>${v.num}</td><td>${v.hora}</td><td>${esc(v.usuario)}</td>
    ${ps.map(p=>ed?`<td>${qi('data-ei',p.id,v.items[p.id])}${p.envase?`<div class="hint" style="margin-top:4px">Env ${qi('data-ee',p.id,(v.env||{})[p.id])}</div>`:''}</td>`
      :`<td>${v.items[p.id]||''}${(v.env||{})[p.id]?`<div class="hint">+${v.env[p.id]} env</div>`:''}</td>`).join('')}
    <td class="r"><b>${money(v.total)}</b>${v.editada?`<div class="hint">editada</div>`:''}</td>
    <td class="no-print" style="white-space:nowrap">${v.anulada?'<span class="badge red">Anulada</span>':ed
      ?`<button class="btn primary sm" data-h40="click" data-h40a0="${v.id}">${ic('check')}Guardar</button> <button class="btn sm" data-h41="click">Cancelar</button>`
      :pastLock(v.fecha)?LOCKI:`<button class="btn sm danger" title="Anular venta" data-h42="click" data-h42a0="${v.id}">${ic('x')}Anular</button>`}</td></tr>`;}).join('')
    :`<tr><td colspan="${ps.length+5}" class="empty">Aún no hay ventas hoy</td></tr>`}
  </table></div>`;
}
/* ---- Editor de venta en ventana (local 'l' / mayorista 'm') ---- */
function closeEdM(){const m=document.querySelector('.modal.edm');if(m)m.remove();}
function delVentaM(k,id){
  if(!can('anular'))return toast('No tienes permiso para anular ventas.','err');
  const v=(k==='l'?db.ventas:db.mayor.ventas).find(x=>x.id===id);if(!v||v.anulada)return;
  if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  ask(`¿Anular la venta N° ${v.num}${v.cliente?' de '+v.cliente:''}? Quedará marcada como ANULADA y los cilindros vuelven a bodega.`,()=>{closeEdM();
    if(k==='l')anular(id,1);else anularMay(id,1);});
}
function editVentaM(k,id){
  const L=k==='l',v=(L?db.ventas:db.mayor.ventas).find(x=>x.id===id);if(!v||v.anulada)return;
  if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  const ps=db.products,c=L?null:findCli(v.cliente);
  const pr=pid=>v.precios[pid]!=null?v.precios[pid]:(L?precio(P(pid)):(c?precioCli(c,pid):precioBase(P(pid))));
  const pe=pid=>(v.penv||{})[pid]!=null?v.penv[pid]:P(pid).envase;
  const card=(attr,pid,val,label,sub)=>`<div class="edc"><div class="t">${label}</div>
    <div class="pm"><button type="button" data-h43="click">−</button><input class="ei" type="number" min="0" inputmode="numeric" placeholder="0" ${attr}="${pid}" value="${val||''}" data-h44="input"><button type="button" data-h45="click">+</button></div>
    <div class="sub">${sub}</div></div>`;
  const m=document.createElement('div');m.className='modal edm';
  m.innerHTML=`<div class="mbox ed"><p>Editar venta N° ${v.num}${L?'':' · '+esc(v.cliente)} <span class="hint" style="font-weight:500">${dmy(v.fecha)} ${v.hora}</span></p>
    <div class="edg">${ps.map(p=>card(L?'data-ei':'data-mei',p.id,v.items[p.id],'Cilindro '+colLbl(p),`Bodega: ${p.stock+(v.items[p.id]||0)}`)).join('')}</div>
    ${L&&ps.some(p=>p.envase)?`<div class="hint" style="font-weight:600">Venta de envases</div><div class="edg">${ps.filter(p=>p.envase).map(p=>card('data-ee',p.id,(v.env||{})[p.id],'Envase '+colLbl(p),money(pe(p.id)))).join('')}</div>`:''}
    <div class="edtot"><span>Total</span><span id="edtot"></span></div>
    <div class="mbtns"><button class="btn danger" data-h46="click" data-h46a0="${k}" data-h46a1="${v.id}">${ic('trash')}Eliminar venta</button><span style="flex:1"></span>
      <button class="btn" data-h47="click">Cancelar</button><button class="btn primary" data-h48="click" data-h48a0="${L?'saveEditVenta':'saveEditMay'}" data-h48a1="${v.id}">${ic('check')}Guardar cambios</button></div></div>`;
  document.body.appendChild(m);
  window.edTot=()=>{let t=0;m.querySelectorAll('[data-ei],[data-mei]').forEach(el=>t+=num(el.value)*pr(el.dataset.ei||el.dataset.mei));
    m.querySelectorAll('[data-ee]').forEach(el=>t+=num(el.value)*pe(el.dataset.ee));if(L)t=Math.max(0,t-(v.desc||0));
    m.querySelector('#edtot').textContent=money(t)+(L&&v.desc?` (desc. ${money(v.desc)})`:'');};
  m.addEventListener('click',e=>{if(e.target===m)closeEdM();});
  edTot();const fi=m.querySelector('input');if(fi)fi.focus();
}
function edStep(b,d){const i=b.parentNode.querySelector('input');i.value=Math.max(0,num(i.value)+d)||'';edTot();}
function saveEditVenta(id){
  const v=db.ventas.find(x=>x.id===id);if(!v||v.anulada)return;if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  const ni={},ne={};$$('[data-ei]').forEach(el=>{const n=num(el.value);if(n)ni[el.dataset.ei]=n;});$$('[data-ee]').forEach(el=>{const n=num(el.value);if(n)ne[el.dataset.ee]=n;});
  if(!Object.keys(ni).length&&!Object.keys(ne).length)return toast('La venta debe tener al menos una cantidad. Si no corresponde, anúlala.','err');
  for(const p of db.products){const d=(ni[p.id]||0)-(v.items[p.id]||0);if(d>p.stock)return toast(`Stock insuficiente de ${colLbl(p)} (hay ${p.stock})`,'err');}
  for(const k in v.items){const p=P(k);if(p)p.stock+=v.items[k];}
  for(const g in (v.vac||{}))db.vacios[g]=Math.max(0,(db.vacios[g]||0)-v.vac[g]);
  const vac={};let sub=0;
  for(const k in ni){P(k).stock-=ni[k];if(v.precios[k]==null)v.precios[k]=precio(P(k));sub+=ni[k]*v.precios[k];const r=ni[k]-(ne[k]||0);if(r>0)vac[grp(k)]=(vac[grp(k)]||0)+r;}
  v.penv=v.penv||{};for(const k in ne){if(v.penv[k]==null)v.penv[k]=P(k).envase;sub+=ne[k]*v.penv[k];}
  for(const g in vac)db.vacios[g]=(db.vacios[g]||0)+vac[g];
  v.items=ni;v.env=ne;v.vac=vac;v.total=Math.max(0,sub-(v.desc||0));v.editada={usuario:S.user.nombre,fecha:today(),hora:hora()};
  S.vedit=null;closeEdM();save();toast('Venta N° '+v.num+' corregida ✔');render();
}
function grabar(){
  const c=S.cart;
  if(!Object.keys(c.items).length&&!Object.keys(c.env).length)return toast('Ingresa al menos una cantidad','err');
  for(const id in c.items){const p=P(id);if(c.items[id]>p.stock)return toast(`Stock insuficiente de ${colLbl(p)} (hay ${p.stock})`,'err');}
  const t=calcCart(),precios={},penv={},vac={};
  for(const id in c.items){precios[id]=precio(P(id),S.lista);const r=c.items[id]-(c.env[id]||0);if(r>0)vac[grp(id)]=(vac[grp(id)]||0)+r;}
  for(const id in c.env)penv[id]=P(id).envase;
  const v={id:Date.now(),num:db.seq++,fecha:today(),hora:hora(),usuario:S.user.nombre,lista:'venta',
    items:{...c.items},env:{...c.env},precios,penv,vac,desc:c.desc,total:t.total,pago:c.pago,recibe:c.recibe,anulada:false};
  for(const id in c.items)P(id).stock-=c.items[id];
  for(const g in vac)db.vacios[g]=(db.vacios[g]||0)+vac[g];
  db.ventas.push(v);save();
  S.last=v.id;S.cart=newCart();toast('Venta N° '+v.num+' grabada ✔');render();
}
function printVenta(id){
  const v=db.ventas.find(x=>x.id===id);if(!v)return;
  let l=`<pre>           MR\n  Venta N° ${v.num}\n  ${dmy(v.fecha)} ${v.hora}\n  Vendedor: ${esc(v.usuario)}\n------------------------------\n`;
  for(const k in v.items)l+=`${String(v.items[k]).padStart(3)} x ${k.padEnd(5)} ${money(v.items[k]*v.precios[k]).padStart(16)}\n`;
  for(const k in v.env)l+=`${String(v.env[k]).padStart(3)} x Env ${k.padEnd(4)}${money(v.env[k]*v.penv[k]).padStart(15)}\n`;
  if(v.desc)l+=`Descuento ${('-'+money(v.desc)).padStart(20)}\n`;
  l+=`------------------------------\nTOTAL ${money(v.total).padStart(24)}\nPago: ${v.pago}${v.anulada?'\n*** ANULADA ***':''}\n</pre>`;
  $('#print').innerHTML=l;document.body.classList.add('receipt');doPrint();document.body.classList.remove('receipt');
}

/* ================= RETIRO / ABONOS ================= */
function vMovs(){
  const mf1=S.mfecha,mf2=S.mfecha2||S.mfecha;
  const ms=db.movs.filter(m=>m.fecha>=mf1&&m.fecha<=mf2).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  const ab=ms.filter(m=>m.tipo==='Abono').reduce((a,m)=>a+m.monto,0),re=ms.filter(m=>m.tipo==='Retiro').reduce((a,m)=>a+m.monto,0);
  return caja(`<div class="sect">RETIRO / ABONOS</div>
    <div class="tw blk"><table><tr><th>FECHA</th><th>TIPO</th><th>MONTO</th><th>DETALLE</th><th></th></tr>
    <tr><td><input type="date" id="mfe" value="${today()}"></td><td><select id="mt"><option>Retiro</option><option>Abono</option></select></td>
      <td>$ <input id="mm" type="number" inputmode="numeric" placeholder="0" style="width:120px"></td>
      <td><input id="md" placeholder="Ej: depósito banco, sencillo..." style="width:100%"></td>
      <td><button class="btn primary" data-h49="click">Graba</button></td></tr></table></div>
    <div class="frow">Desde <input type="date" id="mf1" value="${S.mfecha}"> Hasta <input type="date" id="mf2" value="${S.mfecha2||''}">
      <button class="btn" data-h50="click">Ver</button></div>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th>TIPO</th><th class="l">DETALLE</th><th>USUARIO</th><th>ABONOS</th><th>RETIROS</th><th></th></tr>
    ${ms.length?ms.map(m=>`<tr><td>${dmy(m.fecha)}</td><td>${m.hora}</td><td><span class="badge ${m.tipo==='Retiro'?'red':'ok'}">${m.tipo}</span></td><td class="l">${esc(m.det)}</td><td>${esc(m.usuario)}</td>
      <td class="r">${m.tipo==='Abono'?money(m.monto):'-'}</td><td class="r">${m.tipo==='Retiro'?money(m.monto):'-'}</td><td><button class="ib red" data-h51="click" data-h51a0="${m.id}">${ic('x')}</button></td></tr>`).join('')
      :`<tr><td colspan="8" class="empty">Sin movimientos</td></tr>`}
    <tr class="tot"><td colspan="5" class="r">TOTALES</td><td class="r">${money(ab)}</td><td class="r">${money(re)}</td><td></td></tr></table></div>`);
}
function addMov(){
  const monto=num($('#mm').value);if(!monto)return toast('Ingresa un monto','err');
  db.movs.push({id:Date.now(),fecha:$('#mfe').value||today(),hora:hora(),tipo:$('#mt').value,monto,det:$('#md').value.trim(),usuario:S.user.nombre});
  save();toast('Movimiento grabado ✔');render();
}
function delMov(id,ok){if(!ok)return ask('¿Eliminar este movimiento?',()=>delMov(id,1));db.movs=db.movs.filter(m=>m.id!==id);save();render();}

/* ================= RENDICIÓN ================= */
const isM=()=>S.view==='mrend';
// Rendición mayorista: una cuadratura independiente por cliente (S.mrcli). '*' = rendiciones antiguas sin cliente.
const MLEG='*';
const mrOk=c=>(x)=>c===MLEG||normCli(x)===normCli(c);
const cliFijos=()=>[...new Set(db.mayor.clientes.map(c=>normCli(c.nombre)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const RR=()=>{if(!isM())return db.rend;const c=S.mrcli||'';if(c===MLEG)return db.mayor.rend;return db.mayor.rendc[c]||(db.mayor.rendc[c]={});};
// Cada venta de un cliente tiene su propia rendición: clave "fecha#N°venta". La clave "fecha" sola = pagos sin venta.
const MKEY=()=>isM()&&!!S.mrcli&&S.mrcli!==MLEG;
const rkV=v=>MKEY()?v.fecha+'#'+String(v.num).padStart(5,'0'):v.fecha;
const rkA=a=>MKEY()&&a.rk?a.rk:a.fecha;
const rng=(k,f1,f2)=>!f2||f2===f1?k===f1:(k>=f1&&k<=(f2.length===10?f2+'~':f2));
const RV=()=>isM()?db.mayor.ventas.filter(v=>mrOk(S.mrcli||'')(v.cliente)).map(v=>({...v,env:{},penv:{},rk:rkV(v)})):db.ventas;
const RM=()=>isM()?db.mayor.abonos.filter(a=>!a.anulado&&mrOk(S.mrcli||'')(a.cliente)).map(a=>({fecha:rkA(a)})):db.movs;
const abonosR=(f1,f2)=>db.mayor.abonos.filter(a=>!a.anulado&&mrOk(S.mrcli||'')(a.cliente)&&rng(rkA(a),f1,f2||f1));
function mrAuto(){if(!MKEY()||S.rfecha2)return;const d=String(S.rfecha).slice(0,10);
  const ks=db.mayor.ventas.filter(v=>!v.anulada&&v.fecha===d&&mrOk(S.mrcli)(v.cliente)).map(rkV).sort();S.rfecha=ks.length?ks[ks.length-1]:d;}
function mrVentaSel(){
  const d=String(S.rfecha).slice(0,10),vs=db.mayor.ventas.filter(v=>v.fecha===d&&mrOk(S.mrcli)(v.cliente)&&!v.anulada).sort((a,b)=>a.num-b.num);
  return `${vs.map((v,i)=>{const k=rkV(v),n=Object.values(v.items).reduce((a,x)=>a+x,0);
      return `<button class="vch ${S.rfecha===k?'on':''}" title="Venta N° ${v.num}" data-h52="click" data-h52a0="${k}">${i+1}° compra<small>${v.hora.slice(0,5)} · ${n} cil.</small></button>`;}).join('')}
    ${vs.length?'':'<span class="hint" style="font-size:12px">Sin compras este día</span>'}`;
}
const mrCli=()=>S.mrcli&&S.mrcli!==MLEG?findCli(S.mrcli):null;
const mrPrecio=p=>{const c=mrCli();return c?precioCli(c,p.id):precioBase(p);};
function mrClientesSel(){
  const names=cliFijos();
  const opts=names.map(n=>({n}));
  const leg=Object.keys(db.mayor.rend||{}).length;
  return `<select class="big" data-h53="change">
    <option value="">Elige un cliente...</option>
    ${opts.map(o=>`<option value="${esc(o.n)}" ${S.mrcli===o.n?'selected':''}>${esc(o.n)}</option>`).join('')}
    ${leg?`<option value="${MLEG}" ${S.mrcli===MLEG?'selected':''}>Rendiciones anteriores (todos juntos)</option>`:''}</select>`;
}
function getRend(f){if(!RR()[f]){const o={obs:''};RKEYS.forEach(k=>o[k]=[]);RR()[f]=o;}return RR()[f];}
const vprice=s=>s==='H'?P('H15A').venta:P(s).venta;
const vcil=s=>s==='H'?0:P(s).envase;
function val(k,e){
  if(k==='qr')return QRS.reduce((a,s)=>a+(e['q'+s]||0)*(e.pr&&e.pr[s]!=null?e.pr[s]:qrPrecio(s)),0);
  if(k==='vales')return VSIZES.reduce((a,s)=>a+(e['q'+s]||0)*(e.pr&&e.pr[s]!=null?e.pr[s]:vprice(s)),0);
  if(k==='valesCil')return VSIZES.reduce((a,s)=>a+(e['q'+s]||0)*vcil(s),0);
  return e.monto||0;
}
function desc(k,e){
  const q=()=>VSIZES.filter(s=>e['q'+s]).map(s=>`${s}×${e['q'+s]}`).join(' ');
  switch(k){
    case 'vales':return `${e.cliente?`<b>${esc(e.cliente)}</b> · `:''}${esc(e.tipo)}: ${q()}`;
    case 'valesCil':return q();
    case 'qr':return QRS.filter(s=>e['q'+s]).map(s=>`${s} kg × ${e['q'+s]}`).join(' · ');
    case 'cheques':return `N° ${esc(e.nro)} ${esc(e.banco)}`;
    case 'transf':return `${esc(e.banco)} ${dmy(e.fecha)} ${esc(e.det)}`;
    case 'descuentos':case 'gastos':return `${esc(e.tipo)} ${esc(e.det)}`;
    case 'transbank':return `${esc(e.tipo)} N° ${esc(e.nro)}`;
    case 'cargos':return `N° ${esc(e.nro)}`;
    case 'petroleo':return `${e.litros||0} L`;
    default:return '';
  }
}
function sumK(R,k){return (R[k]||[]).reduce((a,e)=>a+val(k,e),0);}
function calcDia(f){
  const R=RR()[f]||{};const g=k=>R[k]?sumK(R,k):0;
  const vs=RV().filter(v=>(v.rk||v.fecha)===f&&!v.anulada);
  const venta=vs.reduce((a,v)=>a+v.total,0);
  const ms=[];
  const abonos=ms.filter(m=>m.tipo==='Abono').reduce((a,m)=>a+m.monto,0);
  const retiros=ms.filter(m=>m.tipo==='Retiro').reduce((a,m)=>a+m.monto,0);
  const cargos=g('cargos');
  const deber=venta+cargos+abonos-retiros;
  const abo=isM()?abonosR(f).reduce((a,x)=>a+x.monto,0):0;
  const rendido=abo+g('efectivo')-g('vuelto')+g('vales')+g('valesCil')+g('cheques')+g('transf')+g('descuentos')+g('gastos')+g('transbank')+g('petroleo')+g('qr');
  const com=isM()?(R.vales||[]).reduce((a,e)=>a+comVale(e),0):0;
  return {vs,venta,abonos,retiros,cargos,deber,rendido,com,saldo:deber-rendido-com};
}
function saldoAntes(f){
  const fechas=new Set([...RV().map(v=>v.rk||v.fecha),...RM().map(m=>m.fecha),...Object.keys(RR())]);
  let s=0;fechas.forEach(d=>{if(d<f)s+=calcDia(d).saldo;});return s;
}
/* Deudas de días (o compras) anteriores que siguen sin pagarse.
   Lo que sobra un día (saldo a favor) paga primero la deuda más antigua. */
function deudasPend(f,f2){
  const fechas=[...new Set([...RV().map(v=>v.rk||v.fecha),...RM().map(m=>m.fecha),...Object.keys(RR())])].filter(d=>d<=f2).sort();
  const q=[];let favor=0;
  fechas.forEach(d=>{let sd=calcDia(d).saldo;
    if(sd>0){if(favor>0){const u=Math.min(favor,sd);favor-=u;sd-=u;}if(sd>0)q.push({k:d,orig:calcDia(d).saldo,pend:sd});}
    else if(sd<0){let x=-sd;for(const e of q){if(!x)break;const u=Math.min(x,e.pend);e.pend-=u;x-=u;}favor+=x;}});
  return {list:q.filter(e=>e.pend>0&&e.k<f),favor};
}
const dLbl=k=>{const d=dmy(String(k).slice(0,10)).slice(0,5);if(!String(k).includes('#'))return d;const n=+String(k).split('#')[1];return d+' · N° '+n;};
function saldoHist(f){
  const fechas=new Set([...RV().map(v=>v.rk||v.fecha),...RM().map(m=>m.fecha),...Object.keys(RR())]);
  let s=0;fechas.forEach(d=>{if(d<=f)s+=calcDia(d).saldo;});return s;
}
const inp=(k,f,ph,w,type='number')=>`<input data-k="${k}" data-f="${f}" type="${type}" ${type==='number'?'inputmode="numeric"':''} placeholder="${ph}" ${w?'class="w"':''} ${type==='date'?`value="${String(S.rfecha).slice(0,10)}"`:''}>`;
const sel=(k,f,opts)=>`<select data-k="${k}" data-f="${f}">${opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
const RADSHORT={'De la compañía':'Compañía','Otras compañías':'Otras','Vale Digital':'Digital','Digital Otras compañías':'Digital otras'};
const rad=(k,f,opts)=>`<div class="radios">${opts.map((o,i)=>`<label title="${o}"><input type="radio" name="r_${k}" data-k="${k}" data-f="${f}" value="${o}" ${i?'':'checked'}> ${k==='vales'?(RADSHORT[o]||o):o}</label>`).join('')}</div>`;
const vq=k=>`<div class="vq">${VSIZES.map(s=>`<label>${s}<input data-k="${k}" data-f="q${s}" type="number" inputmode="numeric" placeholder="0"></label>`).join('')}</div>`;
const RCAT={qr:'res',efectivo:'ing',vuelto:'ing',vales:'val',valesCil:'val',cheques:'ban',transf:'ban',transbank:'ban',descuentos:'res',gastos:'res',petroleo:'res',cargos:'car'};
const multiR=()=>!!S.rfecha2&&S.rfecha2!==S.rfecha;
const pastLock=f=>!!S.user&&!can('*admin')&&String(f||'').slice(0,10)<today();
const rLock=()=>pastLock(S.rfecha);
const LOCKI=`<span class="badge" title="Día cerrado: solo un administrador puede modificar">🔒 Cerrado</span>`;
function rDates(){const f1=S.rfecha,f2=S.rfecha2||f1;return Object.keys(RR()).filter(d=>rng(d,f1,f2)).sort();}
function calcRange(f1,f2){
  const fechas=new Set([...RV().map(v=>v.rk||v.fecha),...RM().map(m=>m.fecha),...Object.keys(RR())]);
  const r={vs:[],venta:0,abonos:0,retiros:0,cargos:0,deber:0,rendido:0,com:0,saldo:0};
  fechas.forEach(d=>{if(rng(d,f1,f2)){const c=calcDia(d);r.vs.push(...c.vs);['venta','abonos','retiros','cargos','deber','rendido','com','saldo'].forEach(k=>r[k]+=c[k]);}});
  return r;
}
function sec(k,title,fields,btn='Agregar'){
  const it=[],m=multiR();rDates().forEach(f=>(RR()[f][k]||[]).forEach(e=>it.push({e,f})));
  const tot=it.reduce((a,x)=>a+val(k,x.e),0);
  return `<div class="rbox k-${RCAT[k]||'otro'}"><div class="rbox-h">${title}<span class="tot">TOTAL: ${money(tot)}</span></div>
    ${m||rLock()?'':`<div class="rbox-b no-print">${fields}<button class="btn sm" data-h54="click" data-h54a0="${k}">${btn}</button></div>`}
    ${it.length?`<div class="chips">${it.map(x=>`<span class="chip">${m?`<b>${dmy(x.f).slice(0,5)}</b> `:''}${desc(k,x.e)} <b>${money(val(k,x.e))}</b>${pastLock(x.f)?'':`<button class="no-print" data-h55="click" data-h55a0="${k}" data-h55a1="${x.e.id}" data-h55a2="${x.f}">✕</button>`}</span>`).join('')}</div>`:''}</div>`;
}
function secAbonos(){
  const m=multiR(),it=abonosR(S.rfecha,S.rfecha2||S.rfecha),tot=it.reduce((a,x)=>a+x.monto,0);
  const cl=[...new Set([...db.mayor.clientes.map(c=>c.nombre),...mClientes().map(c=>c.cliente)])].sort();
  return `<div class="rbox k-ing"><div class="rbox-h">${S.mrcli&&S.mrcli!==MLEG?'ABONOS DEL CLIENTE':'ABONOS DE CLIENTES'}<span class="tot">TOTAL: ${money(tot)}</span></div>
    ${m||S.mrcli===MLEG||rLock()?'':`<div class="rbox-b no-print">
      <input id="rab-mo" type="number" inputmode="numeric" placeholder="Monto $"><select id="rab-me">${MEDIOS.map(x=>`<option>${x}</option>`).join('')}</select>
      <input id="rab-det" class="w" placeholder="Detalle"><button class="btn sm" data-h56="click">Agregar</button></div>`}
    ${it.length?`<div class="chips">${it.map(a=>`<span class="chip">${m?`<b>${dmy(a.fecha).slice(0,5)}</b> `:''}${esc(a.cliente)} · ${esc(a.medio)}${a.det?' '+esc(a.det):''} <b>${money(a.monto)}</b>${pastLock(a.fecha)?'':`<button class="no-print" data-h57="click" data-h57a0="${a.id}">✕</button>`}</span>`).join('')}</div>`:''}</div>`;
}
function addAbonoR(){
  if(rLock())return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  const cli=normCli(S.mrcli===MLEG?'':S.mrcli),mo=num($('#rab-mo').value);
  if(!cli)return toast('Elige el cliente','err');if(!mo)return toast('Ingresa un monto','err');
  db.mayor.abonos.push({id:Date.now(),fecha:String(S.rfecha).slice(0,10),rk:S.rfecha,hora:hora(),usuario:S.user.nombre,cliente:cli,monto:mo,medio:$('#rab-me').value,det:$('#rab-det').value.trim(),anulado:false});
  save();toast('Abono agregado ✔');render();
}
function addR(k){
  if(rLock())return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  const o={};
  $$(`[data-k="${k}"]`).forEach(el=>{
    if(el.type==='radio'){if(el.checked)o[el.dataset.f]=el.value;}
    else o[el.dataset.f]=el.type==='number'?num(el.value):el.value.trim();
  });
  if(k==='qr'){if(!QRS.some(s=>o['q'+s]))return toast('Ingresa cuántos descuentos QR hubo','err');if(!QRS.some(s=>o['q'+s]&&qrPrecio(s)))return toast('Falta configurar el valor del descuento QR en Configuración','err');o.pr={};QRS.forEach(s=>o.pr[s]=qrPrecio(s));}
  else if(k==='vales'||k==='valesCil'){if(!VSIZES.some(s=>o['q'+s]))return toast('Ingresa una cantidad','err');}
  else if(!o.monto)return toast('Ingresa un monto','err');
  if(k==='vales'&&isM()){o.pr={};VSIZES.forEach(s=>{if(o['q'+s])o.pr[s]=mrPrecio(P(s==='H'?'H15A':s));});}
  if(k==='vales'){o.com=isM()?comVale({...o,com:undefined}):0;}
  getRend(S.rfecha)[k].push({...o,id:Date.now()});save();toast('Agregado ✔');render();
}
function delR(k,id,f){if(pastLock(f||S.rfecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');const R=getRend(f||S.rfecha);R[k]=R[k].filter(e=>e.id!==id);save();render();}
function saveObs(){if(rLock())return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');getRend(S.rfecha).obs=$('#robs').value;save();toast('Observaciones guardadas ✔');}
function vRend(){
  if(!MKEY()&&String(S.rfecha).includes('#'))S.rfecha=String(S.rfecha).slice(0,10);
  if(MKEY()&&!S.rfecha2&&!db.mayor.ventas.some(v=>!v.anulada&&rkV(v)===S.rfecha)){S.rfecha=String(S.rfecha).slice(0,10);mrAuto();}
  if(isM()&&!S.mrcli)return frame('Rendición Mayorista','may',null,`
    <div class="rtop" style="flex-wrap:wrap"><span class="rtt">Rendición Mayorista · ${esc(S.user.suc)}</span>${canView('mcta')?`<button class="btn sm no-print" data-h58="click">Cuenta Clientes</button>`:''}</div>
    <div class="mrbar no-print"><div class="row"><span class="lbl">CLIENTE</span>${mrClientesSel()}</div></div>
    <p class="empty" style="padding:50px 20px;text-align:center">Cada cliente mayorista tiene su propia cuadratura.<br><b>Elige un cliente</b> arriba para ver o hacer su rendición.</p>
    <div class="rfoot no-print"><button class="btn" data-h59="click">Volver</button></div>`,true);
  const f=S.rfecha,f2=S.rfecha2||f,m=multiR(),R=getRend(f),d=calcRange(f,f2),ps=db.products;
  const q={},en={},tot={};ps.forEach(p=>{q[p.id]=0;en[p.id]=0;tot[p.id]=0;});
  d.vs.forEach(v=>{
    for(const id in v.items){q[id]+=v.items[id];tot[id]+=v.items[id]*(v.precios[id]||0);}
    for(const id in v.env){en[id]+=v.env[id];tot[id]+=v.env[id]*(v.penv[id]||0);}
  });
  const kilos=ps.reduce((a,p)=>a+q[p.id]*p.kg,0),tarros=ps.reduce((a,p)=>a+q[p.id],0),hist=saldoHist(f2),ant=saldoAntes(f);
  const row=(t,fn,cls='')=>`<tr class="${cls}"><td class="l"><b>${t}</b></td>${ps.map(p=>`<td class="${p.tipo==='c'?'cat':''}">${fn(p)}</td>`).join('')}</tr>`;
  const MY=isM();
  return frame(MY?'Rendición Mayorista':'Rendición',MY?'may':'home',null,`
    <div class="rtop" style="flex-wrap:wrap"><span class="rtt">${MY?'Rendición Mayorista':'Rendición'} · ${esc(S.user.suc)}</span>${MY?`<span class="rtt mr-pcli" style="display:none">· ${esc(S.mrcli===MLEG?'Anteriores':S.mrcli)}${String(f).includes('#')?' · Venta N° '+Number(String(f).split('#')[1]):''}</span>`:''}${MY?`${canView('mcta')?`<button class="btn sm no-print" data-h60="click">Cuenta Clientes</button>`:''}`:''}FECHA MOVIMIENTO &nbsp; Desde <input type="date" id="rf" value="${String(f).slice(0,10)}"> Hasta <input type="date" id="rf2" value="${S.rfecha2||''}">
      <button class="btn sm" data-h61="click">Ver</button>
      ${m?`<button class="btn sm" data-h62="click">Solo un día</button>`:''}</div>
    ${MY?`<div class="mrbar no-print"><div class="row"><span class="lbl">CLIENTE</span>${mrClientesSel()}</div>
      ${MKEY()&&!m?`<div class="row"><span class="lbl">COMPRAS DEL DÍA</span>${mrVentaSel()}</div>`:''}</div>`:''}
    ${(()=>{const dp=deudasPend(String(f),String(f2));const tot=dp.list.reduce((a,x)=>a+x.pend,0);
      if(!dp.list.length&&!dp.favor)return '';
      return `<div class="dpend">${dp.list.length?`<span class="lbl">${ic('alert')}DEUDAS PENDIENTES</span>${dp.list.map(x=>`<button class="dch" title="Ir a ${dLbl(x.k)}" data-h63="click" data-h63a0="${x.k}">${dLbl(x.k)} <b>${money(x.pend)}</b>${x.pend<x.orig?`<small>de ${money(x.orig)}</small>`:''}</button>`).join('')}<span class="dtot">Total adeudado: <b>${money(tot)}</b></span>`:''}
        ${dp.favor?`<span class="dfav">Saldo a favor: <b>${money(dp.favor)}</b></span>`:''}</div>`;})()}
    <div class="rgrid rc"><div class="rc-izq">
      <div class="rc-venta"><div class="mgrp res">④ DETALLE DE LA VENTA <small>Solo para revisar</small></div>
      <div class="tw"><table>
        <tr><th class="l"></th>${ps.map(p=>`<th class="${p.tipo==='c'?'cat':''}">${p.id}</th>`).join('')}</tr>
        ${MY?row(S.mrcli===MLEG?'PRECIO BASE MAY.':'PRECIO CLIENTE',p=>money(mrPrecio(p))):row('VENTA LOCAL',p=>money(p.venta))}
        ${row('VENTA (Cantidad)',p=>`<b style="color:var(--num);font-size:16px">${q[p.id]}</b>`)}
        ${MY?'':row('VENTA CON ENVASE',p=>p.envase?en[p.id]:'-')}
        ${row('TOTAL',p=>money(tot[p.id]),'tot')}
      </table></div></div>
      <div class="rleft2">
        <div class="rc-cargos"><div class="mgrp car">③ CARGOS <small>Se SUMAN a lo que se debe</small></div>
          ${sec('cargos','CARGOS',inp('cargos','monto','Monto $')+inp('cargos','nro','N°',0,'text'))}
          <div class="rbox k-obs"><div class="rbox-h">OBSERVACIONES</div><div class="rbox-b">${m?(rDates().filter(x=>RR()[x].obs).map(x=>`<div style="width:100%;font-weight:500"><b>${dmy(x)}:</b> ${esc(RR()[x].obs)}</div>`).join('')||'<span class="hint">Sin observaciones</span>'):rLock()?(R.obs?`<div style="width:100%;font-weight:500">${esc(R.obs)}</div>`:'<span class="hint">Sin observaciones</span>'):`<textarea id="robs">${esc(R.obs)}</textarea><button class="btn sm no-print" data-h64="click">Guardar</button>`}</div></div>
        </div>
        <div class="rc-tot"><div class="mgrp res">① TOTALES Y SALDO</div><table class="tbox">
          <tr><th>TOTAL ($)</th><th>TOTAL (Kilos)</th><th>TOTAL (Tarros)</th></tr>
          <tr><td class="bigv">${money(d.venta)}</td><td class="bigv">${kilos.toLocaleString('es-CL')} Kilos</td><td class="bigv">${tarros} Un.</td></tr>
          <tr><th>RENDICIÓN:</th><th>SALDO ${m?'PERÍODO':'DEL DÍA'}:</th><th>SALDO PENDIENTE TOTAL</th></tr>
          <tr><td class="bigv">${money(d.rendido+(d.com||0))}</td><td class="bigv saldo ${d.saldo>0?'falta':d.saldo<0?'sobra':'ok'}">${money(d.saldo)}</td><td class="bigv saldo ${hist>0?'falta':hist<0?'sobra':'ok'}">${money(hist)}</td></tr>
        </table>
        <table class="tbox" style="margin-top:10px">
          <tr><td class="l">Saldo anterior pendiente</td><td class="r">${money(ant)}</td></tr>
          <tr><td class="l">+ ${m?'Venta del período':(MKEY()?'Venta':'Venta del día')}</td><td class="r">${money(d.venta)}</td></tr>
          <tr><td class="l">+ Cargos</td><td class="r">${money(d.cargos)}</td></tr>
          <tr><td class="l">− Rendido</td><td class="r">${money(d.rendido+(d.com||0))}</td></tr>
          <tr class="tot"><td class="l">= SALDO PENDIENTE</td><td class="r">${money(ant+d.saldo)}</td></tr>
        </table></div>
      </div>
    </div>
    <div class="rc-pagos"><div class="mgrp pay">② LO QUE SE RINDE <small>Efectivo, vales, transferencias, tarjetas y descuentos · se RESTAN del saldo</small></div>
      <div class="rleg"><span class="lg ing">Efectivo</span><span class="lg val">Vales</span><span class="lg ban">Banco / tarjeta</span><span class="lg res">Descuentos y gastos</span></div>
      
      <div class="r2c">${sec('efectivo','EFECTIVO',inp('efectivo','monto','Monto $',1),'Guardar')}
      ${sec('vuelto','VUELTO',inp('vuelto','monto','Monto $',1),'Guardar')}</div>
      ${sec('vales','VALES (Recarga) '+(multiR()?'':rad('vales','tipo',VTIPOS)),vq('vales'),'Guardar')}
      ${sec('valesCil','VALES (Sólo Cilindro)',vq('valesCil'),'Guardar')}
      ${sec('cheques','CHEQUE',inp('cheques','monto','Monto $')+inp('cheques','nro','N° cheque',0,'text')+sel('cheques','banco',['Banco...',...BANCOS]))}
      ${sec('transf','TRANSFERENCIA ELECTRÓNICA',inp('transf','monto','Monto $')+sel('transf','banco',['Banco...',...BANCOS])+inp('transf','fecha','',0,'date')+inp('transf','det','Detalle',1,'text'))}
      ${MY?'':sec('qr','DESCUENTO QR',`<div class="vq">${QRS.map(s=>`<label>${s} kg<input data-k="qr" data-f="q${s}" type="number" inputmode="numeric" placeholder="0"></label>`).join('')}</div><span class="hint" style="white-space:nowrap">${QRS.map(s=>`${s} kg: ${money(qrPrecio(s))}`).join(' · ')} c/u</span>`,'Agregar')}
      ${sec('descuentos','DESCUENTOS',sel('descuentos','tipo',['Tipo...','QR','Convenio','Promoción','Cliente frecuente','Otro'])+inp('descuentos','monto','Monto $')+inp('descuentos','det','Detalle',1,'text'))}
      ${sec('gastos','GASTOS',sel('gastos','tipo',['Tipo...','Combustible','Alimentación','Mantención','Peaje','Otro'])+inp('gastos','monto','Monto $')+inp('gastos','det','Detalle',1,'text'))}
      ${sec('transbank','TRANSBANK',rad('transbank','tipo',['Débito','Crédito'])+inp('transbank','monto','Monto $')+inp('transbank','nro','N° voucher',0,'text')+inp('transbank','fecha','',0,'date'))}
    </div></div>
    <div class="rfoot no-print"><button class="btn" data-h65="click">Volver</button><button class="btn primary" data-h66="click">Imprimir rendición</button></div>`,true);
}

/* ================= PRECIOS Y USUARIOS ================= */
/* ================= COLORES (tema) ================= */
const PRESETS=[
  {n:'Azul',base:'#1250b0',num:'#1d4ed8',bg:'#f4f6f9'},
  {n:'Verde',base:'#1f7a3a',num:'#15803d',bg:'#f4f6f9'},
  {n:'Rojo',base:'#b91c1c',num:'#b91c1c',bg:'#f4f6f9'},
  {n:'Naranjo',base:'#c2410c',num:'#c2410c',bg:'#fffaf5'},
  {n:'Morado',base:'#6d28d9',num:'#6d28d9',bg:'#f4f6f9'},
  {n:'Turquesa',base:'#0f766e',num:'#0f766e',bg:'#f4f6f9'},
  {n:'Gris',base:'#374151',num:'#1f2937',bg:'#f4f6f9'},
];
let THEME=readLS('mr_theme')||{...PRESETS[0]};
function mix(hex,to,t){const h=hex.replace('#','');const c=[0,2,4].map(i=>parseInt(h.substr(i,2),16));const d=to==='w'?255:0;
  return '#'+c.map(v=>Math.round(v+(d-v)*t).toString(16).padStart(2,'0')).join('');}
function applyTheme(t){
  const r=document.documentElement.style,b=t.base;
  const set={'--b9':mix(b,'k',.55),'--b8':mix(b,'k',.28),'--b7':b,'--b6':mix(b,'w',.14),'--b5':mix(b,'w',.32),'--b3':mix(b,'w',.62),
    '--b2':mix(b,'w',.82),'--b1':mix(b,'w',.91),'--b0':mix(b,'w',.955),'--bd':mix(b,'w',.72),'--num':t.num,'--page':t.bg};
  for(const k in set)r.setProperty(k,set[k]);
}
function setThemeField(k,v){THEME={...THEME,[k]:v,n:'Personalizado'};applyTheme(THEME);}
function usePreset(i){THEME={...PRESETS[i]};applyTheme(THEME);render();}
function saveTheme(){try{localStorage.setItem('mr_theme',JSON.stringify(THEME));}catch(e){}toast('Theme guardado ✔');render();}
function resetTheme(){THEME={...PRESETS[0]};applyTheme(THEME);saveTheme();}
function vColores(){
  return conf(`<div class="sect">THEME DEL SISTEMA</div>
    <p class="hint" style="margin:8px 0 14px;text-align:center">Elige un tema o ajusta cada color. Los cambios se ven al instante; presiona Guardar theme para dejarlo fijo.</p>
    <div class="tw blk"><table><tr class="cap"><td colspan="2">TEMAS LISTOS</td></tr><tr><td colspan="2"><div class="swatches">
      ${PRESETS.map((t,i)=>`<button class="sw ${THEME.base===t.base&&THEME.num===t.num&&THEME.bg===t.bg?'on':''}" data-h67="click" data-h67a0="${i}"><span style="background:${t.base}"></span>${t.n}</button>`).join('')}
    </div></td></tr>
    <tr class="cap"><td colspan="2">AJUSTE PERSONALIZADO</td></tr>
    <tr><td class="l"><b>Color principal</b><div class="hint">Barras, botones, títulos e íconos</div></td><td><input type="color" id="th-base" value="${THEME.base}" data-h68="input"></td></tr>
    <tr><td class="l"><b>Color de números</b><div class="hint">Cantidades y stock en las tablas</div></td><td><input type="color" id="th-num" value="${THEME.num}" data-h69="input"></td></tr>
    <tr><td class="l"><b>Fondo de la página</b><div class="hint">Color detrás de los paneles</div></td><td><input type="color" id="th-bg" value="${THEME.bg}" data-h70="input"></td></tr>
    </table></div>
    <div class="sect">VISTA PREVIA</div>
    <div class="tw blk"><table><tr><th class="l"></th><th>5N</th><th>11N</th><th>15N</th></tr>
      <tr class="sec"><td class="l">BODEGA</td><td class="n big">50</td><td class="n big">106</td><td class="n big">100</td></tr></table></div>
    <div style="text-align:center;display:flex;gap:10px;justify-content:center"><button class="btn primary" style="padding:10px 26px" data-h71="click">Guardar theme</button><button class="btn" data-h72="click">Restablecer theme original</button></div>`);
}
const CONF_SIDE=[['config','tag','Precio Local'],['penv','cyl','Precio Envases'],['clientes','users','Clientes'],['qrc','tag','Descuento QR'],['pmay','tag','Precios Mayoristas'],['com','cash','Comisión Vales'],['phist','list','Historial de Precios'],['users','users','Usuarios'],['colores','palette','Theme']];
const conf=c=>frame('Configuración','home',CONF_SIDE,(S.user&&indep(S.user.suc)?`<div class="indep-b">${ic('tag')}<span><b>${esc(S.user.suc)}</b> tiene precios propios: lo que cambies aquí (precio base, comisión de vales, descuento QR) <b>no afecta</b> a las otras sucursales.</span></div>`:'')+c);
function vConfig(){
  return conf(`<div class="sect">PRECIO LOCAL</div>
    <p class="hint" style="margin:8px 0 12px;text-align:center">Escribe el precio nuevo y presiona Guardar precios. Cada cambio queda en el Historial de Precios.</p>
    <div class="tw blk"><table>
      <tr><th class="l">PRODUCTO</th><th>PRECIO VENTA LOCAL</th></tr>
      ${db.products.map(p=>`<tr><td class="l"><b>${colLbl(p)}</b> <span class="hint">${p.sub||''}</span></td>
        ${['venta'].map(k=>`<td>$ <input type="number" inputmode="numeric" id="pr-${k}-${p.id}" data-s="${k}" data-id="${p.id}" value="${p[k]}" style="width:110px;text-align:right" data-h73="input" data-h73a0="${p[k]}"></td>`).join('')}</tr>`).join('')}
    </table></div>
    <div style="text-align:center"><button class="btn primary" style="padding:10px 26px" data-h74="click">Guardar precios</button></div>`);
}
function vPEnv(){
  return conf(`<div class="sect">PRECIO DE ENVASES</div>
    <p class="hint" style="margin:8px 0 12px;text-align:center">Es lo que se cobra cuando el cliente se lleva el cilindro sin entregar un vacío. Si dejas un precio en 0, ese envase no se puede vender. Cada cambio queda en el Historial de Precios.</p>
    <div class="tw blk"><table>
      <tr><th class="l">ENVASE</th><th>PRECIO ACTUAL</th><th>PRECIO NUEVO</th></tr>
      ${db.products.map(p=>`<tr><td class="l"><b>Envase ${colLbl(p)}</b> <span class="hint">${p.sub||''}</span></td><td class="n">${p.envase?money(p.envase):'<span class="hint">No se vende</span>'}</td>
        <td>$ <input type="number" min="0" inputmode="numeric" data-s="envase" data-id="${p.id}" value="${p.envase}" style="width:110px;text-align:right" data-h75="input" data-h75a0="${p.envase}"></td></tr>`).join('')}
    </table></div>
    <div style="text-align:center"><button class="btn primary" style="padding:10px 26px" data-h76="click">Guardar precios de envases</button></div>`);
}
const CAMPO={mayor:'Mayorista general',venta:'Venta local',movil:'Precio móvil (eliminado)',envase:'Precio envase'};
function vPHist(){
  const h=[...db.phist,...((indep(S.user.suc)?[]:GLOBAL.hist||[]).filter(x=>x.suc!==S.user.suc&&!indep(x.suc)).map(x=>({...x,usuario:x.usuario+' ('+x.suc+')'})))].sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora)).reverse();
  return conf(`<div class="sect">HISTORIAL DE PRECIOS</div>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th>USUARIO</th><th class="l">PRODUCTO</th><th class="l">PRECIO</th><th>ANTES</th><th>AHORA</th></tr>
    ${h.length?h.map(x=>`<tr><td>${dmy(x.fecha)}</td><td>${x.hora}</td><td>${esc(x.usuario)}</td><td class="l"><b>${esc(x.prod)}</b></td><td class="l">${CAMPO[x.campo]||x.campo}</td>
      <td class="r">${money(x.antes)}</td><td class="r"><b style="color:${x.despues>x.antes?'var(--red)':'var(--ok)'}">${money(x.despues)}</b></td></tr>`).join('')
      :'<tr><td colspan="7" class="empty">Aún no hay cambios de precio</td></tr>'}
    </table></div>`);
}
const VTIPOS=['De la compañía','Otras compañías','Vale Digital','Digital Otras compañías'];
function comVale(e){if(typeof e.com==='number')return e.com;const c=db.comision[e.tipo]||{};return VSIZES.reduce((a,s)=>a+(e['q'+s]||0)*(c[s]||0),0);}
function comRango(){if(!isM())return 0;let t=0;rDates().forEach(f=>(RR()[f].vales||[]).forEach(e=>t+=comVale(e)));return t;}
function vQr(){
  const q=db.qr||{};
  return conf(`<div class="sect">DESCUENTO QR</div>
    <p class="hint" style="margin:8px 0 12px;text-align:center">Escribe cuánto se descuenta por cada venta pagada con QR, según el cilindro. En la <b>Rendición local</b> solo se ingresa cuántos descuentos hubo y el monto se calcula solo. ${indep(S.user.suc)?'Solo para <b>'+S.user.suc+'</b> (sucursal con precios propios).':'Es igual para todas las sucursales (excepto '+INDEP.join(', ')+', que tiene precios propios).'}</p>
    <div class="tw blk"><table><tr><th class="l">CILINDRO</th><th>DESCUENTO POR UNIDAD</th></tr>
      ${QRS.map(s=>`<tr><td class="l"><b>Cilindro ${s} kg</b></td><td>$ <input class="ei" style="width:110px;text-align:right" type="number" min="0" inputmode="numeric" data-qr="${s}" value="${q[s]||''}" placeholder="0"></td></tr>`).join('')}
    </table></div>
    <div style="text-align:center"><button class="btn primary" style="padding:10px 26px" data-h77="click">Guardar descuento QR</button></div>
    <p class="hint" style="margin-top:14px;text-align:center">Ejemplo: si el descuento QR del 15 kg es $2.000 y hubo 3, en la rendición se descuentan $6.000.</p>`);
}
function saveQr(){
  let n=0;const q=db.qr=db.qr||{};
  $$('[data-qr]').forEach(el=>{const sz=el.dataset.qr,v=num(el.value);
    if((q[sz]||0)!==v){const h={fecha:today(),hora:hora(),usuario:S.user.nombre,prod:sz+' kg',campo:'Descuento QR',antes:q[sz]||0,despues:v};db.phist.push(h);if(!indep(S.user.suc))(GLOBAL.hist=GLOBAL.hist||[]).push({...h,suc:S.user.suc});q[sz]=v;n++;}});
  if(!n)return toast('No hay cambios','err');
  if(indep(S.user.suc)){save();toast('Descuento QR guardado solo en '+S.user.suc+' ✔');return render();}
  GLOBAL.qr=JSON.parse(JSON.stringify(q));
  save();saveGlobal();toast('Descuento QR guardado en todas las sucursales ✔');render();
}
function vCom(){
  return conf(`<div class="sect">COMISIÓN DE VALES</div>
    <p class="hint" style="margin:8px 0 12px;text-align:center">Escribe cuánto se le abona al cliente por cada vale, según el tipo de vale y el cilindro. Solo se aplica en la <b>Rendición Mayorista</b>: es un beneficio para el cliente. Se calcula sola al grabar un vale y se descuenta de su saldo (queda a favor en su cuenta). En la rendición local no hay comisión.</p>
    <div class="tw blk"><table>
      <tr><th class="l">TIPO DE VALE</th>${VSIZES.map(s=>`<th>${s==='H'?'H15':s+' kg'}</th>`).join('')}</tr>
      ${VTIPOS.map((t,i)=>`<tr><td class="l"><b>${t}</b></td>${VSIZES.map(s=>`<td>$ <input class="ei" style="width:80px" type="number" inputmode="numeric" id="cm-${i}-${s}" data-cm="${i}|${s}" value="${(db.comision[t]||{})[s]||''}" placeholder="0"></td>`).join('')}</tr>`).join('')}
    </table></div>
    <div style="text-align:center"><button class="btn primary" style="padding:10px 26px" data-h78="click">Guardar comisión</button></div>
    <p class="hint" style="margin-top:14px;text-align:center">Ejemplo: si un vale de 15 kg de la compañía deja $1.000 y te entregan 3, la comisión es $3.000.</p>`);
}
function saveCom(){
  let n=0;
  $$('[data-cm]').forEach(el=>{const [i,sz]=el.dataset.cm.split('|'),t=VTIPOS[i],v=num(el.value),c=db.comision[t]=db.comision[t]||{};
    if((c[sz]||0)!==v){const h={fecha:today(),hora:hora(),usuario:S.user.nombre,prod:sz==='H'?'H15':sz+' kg',campo:'Comisión '+t,antes:c[sz]||0,despues:v};db.phist.push(h);if(!indep(S.user.suc))(GLOBAL.hist=GLOBAL.hist||[]).push({...h,suc:S.user.suc});c[sz]=v;n++;}});
  if(!n)return toast('No hay cambios','err');
  if(indep(S.user.suc)){save();toast('Comisión guardada solo en '+S.user.suc+' ✔');return render();}
  GLOBAL.comision=JSON.parse(JSON.stringify(db.comision));
  save();saveGlobal();toast('Comisión guardada en todas las sucursales ✔');render();
}
function vUsers(){
  const me=curUser(),meAdmin=me&&me.rol==='admin';
  const ed=S.editU!=null?USERS[S.editU]:null;
  const nperm=u=>(u.verInf?'📊 Informes · ':'')+(u.rol==='admin'?'Todos':SUCS.filter(x=>(psOf(u)[x]||[]).length).map(x=>x+': '+psOf(u)[x].filter(k=>ALLP.includes(k)).length).join(' · ')||'Ninguno');
  const nsuc=u=>u.rol==='admin'?'Todas':(userSucs(u).length===SUCS.length?'Todas':userSucs(u).join(', ')||'Ninguna');
  let panel='';
  if(ed){
    const adm=ed.rol==='admin',PS=psOf(ed),G0=new Set(ed.perms||[]);
    const lbl=Object.fromEntries(PERMS.flatMap(g=>g.items));
    const dis=adm?'disabled':'';
    panel=`<div class="perm-panel" id="perm-panel">
      <div class="pp-head"><div><b>Permisos de ${esc(ed.nombre)}</b> <span class="hint">usuario: ${esc(ed.u)}</span></div></div>
      <label class="chk" style="margin:4px 0 12px"><input type="checkbox" id="pp-admin" ${adm?'checked':''} ${meAdmin?'':'disabled'} data-h79="change"> <b>Administrador</b> <span class="hint">— tiene todos los permisos en todas las sucursales</span></label>
      <p class="hint" style="margin:0 0 8px">Marca qué puede hacer en <b>cada sucursal</b>. Una sucursal sin ninguna casilla marcada queda sin acceso.</p>
      <div class="tw blk"><table class="pm">
        <tr><th class="l">Permiso</th>${SUCS.map(x=>`<th>${x}</th>`).join('')}</tr>
        <tr class="pm-pre"><td class="l"><span class="hint">Perfil rápido por sucursal</span></td>${SUCS.map(x=>`<td><select class="pp-col" ${dis} data-h80="change" data-h80a0="${x}"><option value="">Elegir…</option>${Object.entries(PRESETS_P).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('')}<option value="todo">Todo</option><option value="nada">Sin acceso</option></select></td>`).join('')}</tr>
        ${PERMS.filter(g=>g.items.some(([k])=>!GLOBALP.includes(k))).map(g=>`<tr class="pm-g"><td class="l" colspan="${SUCS.length+1}">${g.g}</td></tr>
          ${g.items.filter(([k])=>!GLOBALP.includes(k)).map(([k,t])=>`<tr><td class="l"><label class="chk" style="cursor:pointer" title="Marcar o desmarcar en todas las sucursales" data-h81="click" data-h81a0="${k}">${t}</label></td>${SUCS.map(x=>`<td><input type="checkbox" data-m="${k}|${x}" ${adm||(PS[x]||[]).includes(k)?'checked':''} ${dis}></td>`).join('')}</tr>`).join('')}`).join('')}
        <tr class="pm-acc"><td class="l"><b>Acceso a la sucursal</b></td>${SUCS.map(x=>`<td id="acc-${slug(x)}">${adm||(PS[x]||[]).length?'<span class="badge ok">Sí</span>':'<span class="badge red">No</span>'}</td>`).join('')}</tr>
      </table></div>
      <div class="pp-g" style="max-width:520px"><div class="pp-gt">Permisos generales (para todas las sucursales)</div>
        ${GLOBALP.filter(k=>k!=='users'&&k!=='inf').map(k=>`<label class="chk"><input type="checkbox" data-g="${k}" ${adm||G0.has(k)?'checked':''} ${dis}> ${lbl[k]}</label>`).join('')}</div>
      <div class="pp-g" style="max-width:520px"><div class="pp-gt">Informes</div>
        <label class="chk"><input type="checkbox" id="pp-inf" ${ed.verInf?'checked':''} ${meAdmin?'':'disabled'}> Ver <b>Informes</b> (todo el apartado)</label>
        <p class="hint" style="margin:4px 0 0">Ventas, ganancias, stock, ventas mayoristas y respaldo de todas las sucursales. Se marca aparte: <b>aunque sea administrador</b>, solo entra a Informes si esta casilla está marcada.</p></div>
      <div class="pp-foot"><button class="btn" data-h82="click">Cancelar</button><button class="btn primary" data-h83="click">Guardar permisos</button></div>
    </div>`;
  }
  return conf(`<div class="sect">USUARIOS Y PERMISOS</div>
    <div class="tw blk"><table><tr><th class="l">Usuario</th><th class="l">Nombre</th><th>Perfil</th><th class="l">Sucursales</th><th class="l">Permisos por sucursal</th><th></th></tr>
    ${USERS.map((u,i)=>`<tr class="${S.editU===i?'sel':''}"><td class="l"><b>${esc(u.u)}</b></td><td class="l">${esc(u.nombre)}</td>
      <td><span class="badge ${u.rol==='admin'?'':'ok'}">${u.rol==='admin'?'Administrador':'Usuario'}</span></td>
      <td class="l" style="white-space:normal">${esc(nsuc(u))}</td><td class="l" style="white-space:normal;font-size:12px;color:var(--tx2)">${nperm(u)}</td>
      <td class="r"><button class="btn sm primary" data-h84="click" data-h84a0="${i}">Permisos</button> <button class="btn sm" data-h85="click" data-h85a0="${i}">Clave</button>
      ${USERS.length>1?`<button class="btn sm danger" data-h86="click" data-h86a0="${i}">Eliminar</button>`:''}</td></tr>`).join('')}
    </table></div>
    ${panel}
    <div class="sect" style="margin-top:8px">AGREGAR USUARIO</div>
    <div class="frm"><label>Usuario<input id="nu" placeholder="ej: alex"></label><label>Nombre<input id="nn" placeholder="Nombre y apellido"></label>
      <label>Clave<input id="np" type="password"></label>
      <label>Perfil inicial (todas las sucursales)<select id="nr">${Object.entries(PRESETS_P).map(([k,x])=>`<option value="${k}">${x.n}</option>`).join('')}${meAdmin?'<option value="admin">Administrador</option>':''}</select></label>
      <button class="btn primary" data-h87="click">${ic('plus')}Agregar</button></div>
    <p class="hint">Después de agregarlo, presiona “Permisos” para ajustar cada sección y las sucursales.</p>`);
}
function editPerms(i){
  const me=curUser();
  if(USERS[i].rol==='admin'&&!(me&&me.rol==='admin'))return toast('Solo un administrador puede cambiar a otro administrador.','err');
  S.editU=i;render();setTimeout(()=>{const e=$('#perm-panel');if(e)e.scrollIntoView({behavior:'smooth',block:'start'});},50);
}
function updAcc(){SUCS.forEach(x=>{const c=$('#acc-'+slug(x));if(!c)return;const on=[...$$('[data-m$="|'+x+'"]')].some(i=>i.checked);c.innerHTML=on?'<span class="badge ok">Sí</span>':'<span class="badge red">No</span>';});}
function colPreset(suc,k){
  if(!k)return;const set=new Set(k==='todo'?LOCALP():k==='nada'?[]:PRESETS_P[k].p);
  $$('[data-m$="|'+suc+'"]').forEach(c=>c.checked=set.has(c.dataset.m.split('|')[0]));updAcc();
}
function rowToggle(k){const cs=[...$$('[data-m^="'+k+'|"]')];if(!cs.length||cs[0].disabled)return;const v=!cs.every(c=>c.checked);cs.forEach(c=>c.checked=v);updAcc();}
document.addEventListener('change',e=>{if(e.target&&e.target.dataset&&e.target.dataset.m)updAcc();});
function savePerms(){
  if(!isAdm())return toast('Solo el administrador puede dar permisos','err');
  const u=USERS[S.editU];if(!u)return;
  const adm=$('#pp-admin').checked;
  if(!adm&&u.rol==='admin'&&USERS.filter(x=>x.rol==='admin').length<2)return toast('Debe quedar al menos un administrador.','err');
  const ps={};SUCS_OFF.forEach(x=>{if(u.ps&&Array.isArray(u.ps[x]))ps[x]=u.ps[x].slice();});SUCS.forEach(x=>ps[x]=[]);
  $$('[data-m]').forEach(c=>{if(c.checked){const [k,x]=c.dataset.m.split('|');ps[x].push(k);}});
  if(!adm&&!SUCS.some(x=>ps[x].length))return toast('Dale acceso al menos a una sucursal.','err');
  const g=[...$$('[data-g]')].filter(c=>c.checked).map(c=>c.dataset.g);
  u.rol=adm?'admin':'vendedor';
  if(adm){u.perms=ALLP.slice();u.ps=null;delete u.ps;}else{u.perms=g;u.ps=ps;}
  const ik=$('#pp-inf');if(ik&&!ik.disabled)u.verInf=ik.checked;
  delete u.sucs;
  S.editU=null;save();toast('Permisos de '+u.nombre+' guardados ✔');
  if(S.user&&curUser()===u&&!userSucs(u).includes(S.user.suc)){toast('Ya no tienes acceso a '+S.user.suc+'.','err');return logout();}
  if(!canView(S.view))go('home');else render();
}
function savePrecios(){
  let n=0;
  $$('[data-s]').forEach(el=>{const p=P(el.dataset.id),k=el.dataset.s,v=num(el.value);
    if(p[k]!==v){db.phist.push({fecha:today(),hora:hora(),usuario:S.user.nombre,prod:colLbl(p),campo:k,antes:p[k],despues:v});p[k]=v;n++;}});
  if(!n)return toast('No hay cambios de precio','err');
  save();toast(n+' precio(s) actualizado(s) ✔');render();
}
const isAdm=()=>(curUser()||{}).rol==='admin';
function addUser(){
  if(!isAdm())return toast('Solo el administrador puede crear usuarios','err');
  const u=$('#nu').value.trim(),n=$('#nn').value.trim()||u,p=$('#np').value;
  if(!u||!p)return toast('Completa usuario y clave','err');
  if(USERS.some(x=>x.u.toLowerCase()===u.toLowerCase()))return toast('Ese usuario ya existe','err');
  const pr=$('#nr').value;
  USERS.push(pr==='admin'?{u,p,nombre:n.toUpperCase(),rol:'admin',perms:ALLP.slice(),sucs:[]}:{u,p,nombre:n.toUpperCase(),rol:'vendedor',perms:[],ps:Object.fromEntries(SUCS.map(x=>[x,PRESETS_P[pr].p.slice()]))});
  save();toast('Usuario agregado ✔');S.editU=USERS.length-1;render();
}
function setRol(i,r){if(!isAdm())return toast('Solo el administrador puede cambiar perfiles','err');if(r!=='admin'&&USERS[i].rol==='admin'&&USERS.filter(u=>u.rol==='admin').length<2){toast('Debe quedar al menos un administrador','err');return render();}USERS[i].rol=r;save();toast('Perfil actualizado ✔');render();}
function chPass(i){ask('Nueva clave para '+USERS[i].u,v=>{if(!v.np2)return toast('Escribe la nueva clave','err');USERS[i].p=v.np2;save();toast('Clave cambiada ✔');},[{id:'np2',label:'Nueva clave',type:'password'}]);}
function delUser(i){if(!isAdm())return toast('Solo el administrador puede eliminar usuarios','err');if(USERS[i].rol==='admin'&&USERS.filter(u=>u.rol==='admin').length<2)return toast('No puedes eliminar al único administrador','err');ask('¿Eliminar usuario '+USERS[i].u+'?',()=>{USERS.splice(i,1);S.editU=null;save();render();});}

/* ================= VENTA MAYORISTA ================= */
const MAY_SIDE=[['may','receipt','Venta Mayorista'],['mrend','clip','Rendición Mayorista'],['mcta','users','Cuenta Clientes']];
const MOB=()=>matchMedia('(max-width:600px)').matches;
let _mob=null;addEventListener('resize',()=>{const m=MOB();if(_mob!==null&&m!==_mob&&S.user){_mob=m;const a=document.activeElement;if(!a||!/INPUT|TEXTAREA|SELECT/.test(a.tagName))render();}else _mob=m;});
function mqStep(b,d){const i=b.parentNode.querySelector('input');i.value=Math.max(0,num(i.value)+d)||'';mqTot();}
function mqTot(){const e=$('#mqtot');if(!e)return;const c=findCli(($('#mcli')||{}).value);let t=0,n=0;
  $$('[data-mq]').forEach(el=>{const q=num(el.value);el.closest('.edc')&&el.closest('.edc').classList.toggle('on',q>0);if(!q)return;n+=q;t+=q*(c?precioCli(c,el.dataset.mq):precioBase(P(el.dataset.mq)));});
  e.textContent=c?money(t):'Elige cliente';const k=$('#mqn');if(k)k.textContent=n+' cilindro'+(n===1?'':'s');}
function mayMob(ps,CL,fv,ult){
  const card=p=>`<div class="edc ${p.stock<=0?'sin':''}"><div class="t">${colLbl(p)}</div>
    <div class="pm"><button type="button" data-h88="click">−</button><input class="ei" type="number" min="0" inputmode="numeric" placeholder="0" data-mq="${p.id}" data-h89="input"><button type="button" data-h90="click">+</button></div>
    <div class="sub">Bodega: <b>${p.stock}</b></div></div>`;
  const vc=v=>`<div class="mm-v ${v.anulada?'anul':''}"><div class="h"><b>N° ${v.num}</b><span class="hint">${v.hora.slice(0,5)}</span><b>${esc(v.cliente)}</b><span class="sp"></span>
    ${v.anulada?'<span class="badge red">Anulada</span>':pastLock(v.fecha)?LOCKI:`<button class="btn sm danger" title="Anular venta" data-h91="click" data-h91a0="${v.id}">${ic('x')}Anular</button>`}</div>
    <div class="q">${qtyTxt(v)}${v.editada?' <span class="hint">· editada</span>':''}</div>${v.obs?`<div class="hint">${esc(v.obs)}</div>`:''}</div>`;
  return `<div class="mm"><div class="sect">NUEVA VENTA MAYORISTA</div>
    <label class="mm-l" for="mcli">Cliente</label><select id="mcli" data-h92="change"><option value="">Selecciona un cliente</option>${CL.slice().sort((x,y)=>x.nombre.localeCompare(y.nombre)).map(c=>`<option>${esc(c.nombre)}</option>`).join('')}</select>
    <div class="mm-row"><div style="flex:1;min-width:0"><label class="mm-l" for="mfe">Fecha</label><input id="mfe" type="date" value="${fv}"></div>
      <button class="btn" data-h93="click">${ic('search')}Ver</button></div>
    <span class="mm-l">Cantidades</span>
    <div class="mm-g">${ps.map(card).join('')}</div>
    <div class="mm-tot"><span>Total · <span id="mqn">0 cilindros</span></span><b id="mqtot">Elige cliente</b></div>
    <label class="chk"><input type="checkbox" id="mvac" checked> El cliente entrega vacíos a cambio</label>
    <span class="mm-l">Observación</span><input id="mobs" placeholder="Ej: guía N° 1234">
    <button class="btn primary mm-go" data-h94="click">Grabar venta mayorista</button>
    <p class="stitle" style="margin-top:24px">${fv===today()?'Ventas mayoristas de hoy':'Ventas mayoristas del '+dmy(fv)}${fv!==today()?` <button class="btn sm no-print" style="margin-left:8px" data-h95="click">Volver a hoy</button>`:''}</p>
    ${ult.length?ult.map(vc).join(''):`<p class="empty" style="text-align:center;padding:16px">${fv===today()?'Hoy aún no hay ventas mayoristas.':'No hay ventas mayoristas ese día.'}</p>`}</div>`;
}
const mayf=c=>frame(S.view==='mcta'?'Cuenta Clientes':'Venta Mayorista','home',MAY_SIDE,c);
const MEDIOS=['Efectivo','Transferencia','Cheque','Transbank','Otro'];
const normCli=x=>String(x||'').trim().replace(/\s+/g,' ').toUpperCase();
function mClientes(){const m={};
  db.mayor.ventas.filter(v=>!v.anulada).forEach(v=>{const k=normCli(v.cliente),c=m[k]=m[k]||{cliente:k,comp:0,abo:0,ult:''};c.comp+=v.total;if(v.fecha>c.ult)c.ult=v.fecha;});
  db.mayor.abonos.filter(a=>!a.anulado).forEach(a=>{const k=normCli(a.cliente),c=m[k]=m[k]||{cliente:k,comp:0,abo:0,ult:''};c.abo+=a.monto;});
  Object.entries(db.mayor.rendc||{}).forEach(([n,RRc])=>{let t=0,pg=0,cg=0;Object.values(RRc).forEach(Rd=>{(Rd.vales||[]).forEach(e=>t+=comVale(e));
      ['efectivo','vales','valesCil','cheques','transf','descuentos','gastos','transbank','petroleo'].forEach(x=>pg+=sumK(Rd,x));pg-=sumK(Rd,'vuelto');cg+=sumK(Rd,'cargos');});
    if(!t&&!pg&&!cg)return;const k=normCli(n),c=m[k]=m[k]||{cliente:k,comp:0,abo:0,ult:''};c.abo+=t+pg;c.comp+=cg;c.com=(c.com||0)+t;});
  return Object.values(m).sort((a,b)=>(b.comp-b.abo)-(a.comp-a.abo)||a.cliente.localeCompare(b.cliente));}
const cliList=()=>`<datalist id="mclis">${cliFijos().map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`;
const itemsTxt=v=>Object.keys(v.items).map(id=>`<span class="chip">${v.items[id]} × ${colLbl(P(id))} <span class="hint">${money(v.precios[id])}</span></span>`).join('');
const precioBase=p=>p.mayor||p.venta;
const listaDe=c=>c&&db.mayor.listas.find(l=>l.id===c.lista);
const precioLista=(l,p)=>Math.max(0,precioBase(p)-(l?l.dto*p.kg:0));
const esEsp=c=>!!c&&c.lista==='esp';
const precioCli=(c,id)=>esEsp(c)?((c.esp&&c.esp[id])||precioBase(P(id))):precioLista(listaDe(c),P(id));
const findCli=n=>db.mayor.clientes.find(c=>c.nombre===normCli(n));
const qtyTxt=v=>Object.keys(v.items).map(id=>`<span class="chip">${v.items[id]} × ${colLbl(P(id))}</span>`).join('');
function vMay(){
  const ps=db.products,fv=S.mver||today(),ult=db.mayor.ventas.filter(v=>v.fecha===fv).reverse(),CL=db.mayor.clientes;
  if(!CL.length)return mayf(`<div class="sect">NUEVA VENTA MAYORISTA</div><p class="empty" style="padding:30px;text-align:center">Aún no hay clientes mayoristas.<br>Créalos en <b>Configuración → Clientes</b>.<br><br>${canView('clientes')?`<button class="btn primary" data-h96="click">Ir a Clientes</button>`:'Pídele a un administrador que los cree.'}</p>`);
  _mob=MOB();if(_mob)return mayf(mayMob(ps,CL,fv,ult));
  return mayf(`<div class="sect">NUEVA VENTA MAYORISTA</div>
    <div class="frm" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      <label style="flex:1;min-width:220px">Cliente<select id="mcli"><option value="">Selecciona un cliente</option>${CL.slice().sort((x,y)=>x.nombre.localeCompare(y.nombre)).map(c=>`<option>${esc(c.nombre)}</option>`).join('')}</select></label>
      <label>Fecha<input id="mfe" type="date" value="${S.mver||today()}"></label>
      <button class="btn" style="align-self:flex-end" data-h97="click">${ic('search')}Ver</button></div>
    <div class="tw blk"><table>
      <tr><th class="l"></th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}</tr>
      <tr class="sec"><td class="l"><b>CANTIDAD</b></td>${ps.map(p=>`<td><input class="ei" type="number" min="0" inputmode="numeric" placeholder="0" data-mq="${p.id}"></td>`).join('')}</tr>
      <tr><td class="l">En bodega</td>${ps.map(p=>`<td class="n ${p.stock<=0?'low':''}">${p.stock}</td>`).join('')}</tr>
    </table></div>
    <div class="frow" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
      <label class="chk"><input type="checkbox" id="mvac" checked> El cliente entrega vacíos a cambio</label>
      <label style="flex:1;min-width:200px;display:flex;gap:8px;align-items:center">Observación<input id="mobs" style="flex:1" placeholder="Ej: guía N° 1234"></label>
      <button class="btn primary" style="padding:10px 24px" data-h98="click">Grabar venta mayorista</button></div>
    <p class="hint">El precio se aplica solo según el cliente y se ve en la Rendición Mayorista.</p>
    <p class="stitle" style="margin-top:24px">${fv===today()?"Ventas mayoristas de hoy":"Ventas mayoristas del "+dmy(fv)}${fv!==today()?` <button class="btn sm no-print" style="margin-left:8px" data-h99="click">Volver a hoy</button>`:""}</p>
    <div class="tw"><table><tr><th>N°</th><th>FECHA</th><th>HORA</th><th class="l">CLIENTE</th><th class="l">CILINDROS</th><th>USUARIO</th><th class="no-print"></th></tr>
    ${ult.length?ult.map(v=>{const ed=S.medit===v.id&&!v.anulada;return `<tr class="${v.anulada?'anul':''}"><td>${v.num}</td><td>${dmy(v.fecha)}</td><td>${v.hora}</td><td class="l"><b>${esc(v.cliente)}</b>${v.obs?`<div class="hint">${esc(v.obs)}</div>`:''}</td>
      <td class="l" style="white-space:normal">${ed?ps.map(p=>`<label style="display:inline-flex;align-items:center;gap:4px;margin:2px 8px 2px 0"><b>${colLbl(p)}</b><input class="ei" style="width:56px;text-align:center" type="number" min="0" inputmode="numeric" placeholder="0" data-mei="${p.id}" value="${v.items[p.id]||''}"></label>`).join(''):qtyTxt(v)}${v.editada&&!ed?' <span class="hint">· editada</span>':''}</td><td>${esc(v.usuario)}</td>
      <td class="no-print" style="white-space:nowrap">${v.anulada?'<span class="badge red">Anulada</span>':ed
        ?`<button class="btn primary sm" data-h100="click" data-h100a0="${v.id}">${ic('check')}Guardar</button> <button class="btn sm" data-h101="click">Cancelar</button>`
        :pastLock(v.fecha)?LOCKI:`<button class="btn sm danger" title="Anular venta" data-h102="click" data-h102a0="${v.id}">${ic('x')}Anular</button>`}</td></tr>`;}).join('')
      :'<tr><td colspan="7" class="empty">'+(fv===today()?'Hoy aún no hay ventas mayoristas.':'No hay ventas mayoristas ese día.')+' Elige otra fecha y presiona <b>Ver</b>.</td></tr>'}
    </table></div>`);
}
function saveEditMay(id){
  const v=db.mayor.ventas.find(x=>x.id===id);if(!v||v.anulada)return;if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  const ni={};$$('[data-mei]').forEach(el=>{const n=num(el.value);if(n)ni[el.dataset.mei]=n;});
  if(!Object.keys(ni).length)return toast('La venta debe tener al menos una cantidad. Si no corresponde, anúlala.','err');
  for(const p of db.products){const d=(ni[p.id]||0)-(v.items[p.id]||0);if(d>p.stock)return toast(`No hay suficientes ${colLbl(p)} en bodega (hay ${p.stock})`,'err');}
  for(const k in v.items){P(k).stock+=v.items[k];if(v.canje)db.vacios[grp(k)]=Math.max(0,(db.vacios[grp(k)]||0)-v.items[k]);}
  const c=findCli(v.cliente);let total=0;
  for(const k in ni){P(k).stock-=ni[k];if(v.canje)db.vacios[grp(k)]=(db.vacios[grp(k)]||0)+ni[k];if(v.precios[k]==null)v.precios[k]=c?precioCli(c,k):precioBase(P(k));total+=ni[k]*v.precios[k];}
  v.items=ni;v.total=total;v.editada={usuario:S.user.nombre,fecha:today(),hora:hora()};
  S.medit=null;closeEdM();save();toast('Venta mayorista N° '+v.num+' corregida ✔');render();
}
function grabarMay(){
  if(pastLock($('#mfe').value))return toast('Solo un administrador puede grabar ventas con fecha de días anteriores.','err');
  const c=findCli($('#mcli').value);if(!c)return toast('Selecciona el cliente','err');
  const items={},precios={};let total=0;
  for(const p of db.products){const q=num($(`[data-mq="${p.id}"]`).value);if(!q)continue;
    if(q>p.stock)return toast(`No hay suficientes ${colLbl(p)} en bodega (hay ${p.stock})`,'err');
    const pr=precioCli(c,p.id);items[p.id]=q;precios[p.id]=pr;total+=q*pr;}
  if(!Object.keys(items).length)return toast('Ingresa al menos una cantidad','err');
  const canje=$('#mvac').checked,M=db.mayor;
  for(const id in items){P(id).stock-=items[id];if(canje)db.vacios[grp(id)]=(db.vacios[grp(id)]||0)+items[id];}
  M.ventas.push({id:Date.now(),num:M.seq++,fecha:$('#mfe').value||today(),hora:hora(),usuario:S.user.nombre,cliente:c.nombre,items,precios,canje,total,obs:$('#mobs').value.trim(),anulada:false});
  save();toast('Venta mayorista N° '+(M.seq-1)+' grabada ✔');render();
}
/* ---- Configuración: precios mayoristas (precio base + listas con descuento por kilo + clientes) ---- */
function vClientes(){
  const ps=db.products,L=db.mayor.listas.slice().sort((x,y)=>x.dto-y.dto),CL=db.mayor.clientes.slice().sort((x,y)=>x.nombre.localeCompare(y.nombre));
  const lsel=(id,cur,on)=>`<select id="${id}" ${on||''}><option value="">Precio base (sin descuento)</option>${L.map(l=>`<option value="${l.id}" ${cur===l.id?'selected':''}>${esc(l.nombre)} · −$${l.dto}/kg</option>`).join('')}<option value="esp" ${cur==='esp'?'selected':''}>Precio especial</option></select>`;
  return conf(`<div class="sect">CLIENTES MAYORISTAS</div>
    <div class="frm"><label style="flex:1;min-width:200px">Nuevo cliente<input id="ncli" placeholder="Nombre del cliente o empresa"></label>
      <label>Lista de precios${lsel('nlis','')}</label>
      <label>RUT <span class="hint">(opcional)</span><input id="nrut" placeholder="12.345.678-9" style="width:140px"></label>
      <label>Teléfono <span class="hint">(opcional)</span><input id="ntel" placeholder="+56 9 ..." style="width:140px"></label>
      <button class="btn primary" data-h103="click">${ic('plus')}Agregar cliente</button></div>
    <div class="tw blk"><table>
      <tr><th class="l">CLIENTE</th><th class="l">LISTA DE PRECIOS</th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th class="no-print"></th></tr>
      ${CL.length?CL.map(c=>`<tr><td class="l"><b>${esc(c.nombre)}</b>${c.rut||c.tel?`<div class="hint">${esc([c.rut,c.tel].filter(Boolean).join(' · '))}</div>`:''}</td>
        <td class="l">${lsel('cl-'+c.id,c.lista,`onchange="setCliLista(${c.id},this.value)"`)}</td>
        ${ps.map(p=>`<td class="n">${money(precioCli(c,p.id))}</td>`).join('')}
        <td class="no-print"><button class="ib red" title="Eliminar cliente" data-h104="click" data-h104a0="${c.id}">${ic('x')}</button></td></tr>`).join('')
        :`<tr><td colspan="${ps.length+3}" class="empty">Aún no hay clientes. Agrega el primero arriba.</td></tr>`}
    </table></div>
    <p class="hint" style="margin:6px 0 12px">Los precios de cada cliente salen de su lista. Si eliges <b>Precio especial</b>, escribes el precio de cada cilindro y no cambia con el precio base. Para cambiar listas o el precio base, ve a ${canView('pmay')?`<a href="#" style="color:var(--b6);font-weight:600" data-h105="click">Precios Mayoristas</a>`:'Precios Mayoristas'}.</p>`);
}
function vPMay(){
  const ps=db.products,L=db.mayor.listas.slice().sort((x,y)=>x.dto-y.dto),CL=db.mayor.clientes;
  return conf(`<div class="sect">LISTAS DE PRECIOS</div>
    <p class="hint" style="margin:6px 0 12px">Los clientes se asignan a una lista en ${canView('clientes')?`<a href="#" style="color:var(--b6);font-weight:600" data-h106="click">Clientes</a>`:'Clientes'}. Cada lista descuenta pesos por kilo al precio base. Ejemplo: Mayorista 40 en un 15 kg descuenta 40 × 15 = $600.</p>
    <div class="frm"><label style="flex:1;min-width:180px">Nombre de la lista<input id="lnom" placeholder="Ej: Mayorista 25"></label>
      <label>Descuento $ por kilo<input id="ldto" type="number" min="0" inputmode="numeric" placeholder="25" style="width:120px"></label>
      <button class="btn primary" data-h107="click">${ic('plus')}Agregar lista</button></div>
    <div class="tw blk"><table>
      <tr><th class="l">LISTA</th><th>DESCUENTO</th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>CLIENTES</th><th class="no-print"></th></tr>
      <tr class="tot"><td class="l">Precio base</td><td>—</td>${ps.map(p=>`<td>${money(precioBase(p))}</td>`).join('')}<td>${CL.filter(c=>!listaDe(c)&&!esEsp(c)).length}</td><td class="no-print"></td></tr>
      ${L.map(l=>`<tr><td class="l"><b>${esc(l.nombre)}</b></td><td>−$${l.dto} / kg</td>${ps.map(p=>`<td class="n">${money(precioLista(l,p))}</td>`).join('')}
        <td>${CL.filter(c=>c.lista===l.id).length}</td><td class="no-print"><button class="ib red" title="Eliminar lista" data-h108="click" data-h108a0="${l.id}">${ic('x')}</button></td></tr>`).join('')}
    </table></div>

    <div class="sect" style="margin-top:8px">ACTUALIZA PRECIO BASE MAYORISTA</div>
    <p class="hint" style="margin:6px 0 12px">Escribe el precio base nuevo de cada cilindro. Todas las listas y clientes se calculan desde este precio.</p>
    <div class="tw blk" style="max-width:560px;margin-left:auto;margin-right:auto"><table>
      <tr><th class="l">CILINDRO</th><th>PRECIO BASE ACTUAL</th><th>PRECIO NUEVO</th></tr>
      ${ps.map(p=>`<tr><td class="l"><b>Cilindro ${colLbl(p)}</b> <span class="hint">${p.sub||p.kg+' kilos'}</span></td><td class="n">${money(precioBase(p))}</td>
        <td>$ <input class="ei" style="width:110px;text-align:right" type="number" min="0" inputmode="numeric" data-pd="${p.id}" value="${precioBase(p)}" data-h109="input" data-h109a0="${precioBase(p)}"></td></tr>`).join('')}
    </table></div>
    <div style="text-align:center;margin:-6px 0 28px"><button class="btn primary" style="padding:10px 26px" data-h110="click">Actualizar precio base</button></div>

    <div class="sect" style="margin-top:8px">PRECIO ESPECIAL</div>
    <p class="hint" style="margin:6px 0 12px">Para clientes con un precio distinto a las listas. Escribe el precio de cada cilindro; no cambia cuando actualizas el precio base.</p>
    ${(()=>{const E=CL.filter(esEsp).sort((x,y)=>x.nombre.localeCompare(y.nombre)),O=CL.filter(c=>!esEsp(c)).sort((x,y)=>x.nombre.localeCompare(y.nombre));
      return `<div class="frm"><label style="flex:1;min-width:220px">Cliente<select id="espcli"><option value="">Elige un cliente...</option>${O.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
      <button class="btn primary" data-h111="click">${ic('plus')}Dar precio especial</button></div>
    <div class="tw blk"><table>
      <tr><th class="l">CLIENTE</th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th class="no-print"></th></tr>
      ${E.length?E.map(c=>`<tr><td class="l"><b>${esc(c.nombre)}</b></td>
        ${ps.map(p=>S.espEdit===c.id?`<td>$ <input class="ei" style="width:76px;text-align:right" type="number" min="0" inputmode="numeric" value="${precioCli(c,p.id)}" title="Precio especial ${colLbl(p)}" data-esp="${p.id}"></td>`:`<td class="n">${money(precioCli(c,p.id))}</td>`).join('')}
        <td class="no-print" style="white-space:nowrap">${S.espEdit===c.id
          ?`<button class="btn primary" style="padding:6px 12px" title="Guardar precios" data-h112="click" data-h112a0="${c.id}">${ic('check')}Guardar</button> <button class="btn" style="padding:6px 10px" title="Cancelar" data-h113="click">Cancelar</button>`
          :`<button class="ib" title="Modificar precios" data-h114="click" data-h114a0="${c.id}">${ic('edit')}</button> <button class="ib red" title="Quitar precio especial" data-h115="click" data-h115a0="${c.id}">${ic('x')}</button>`}</td></tr>`).join('')
        :`<tr><td colspan="${ps.length+2}" class="empty">Ningún cliente tiene precio especial.</td></tr>`}
    </table></div>`;})()}`);
}
function pbDirecto(){
  let n=0;$$('[data-pd]').forEach(el=>{const p=P(el.dataset.pd),v=num(el.value),a=precioBase(p);if(!v||v===a)return;
    const h={fecha:today(),hora:hora(),usuario:S.user.nombre,prod:colLbl(p),campo:'mayor',antes:a,despues:v};db.phist.push(h);if(!indep(S.user.suc))(GLOBAL.hist=GLOBAL.hist||[]).push({...h,suc:S.user.suc});p.mayor=v;n++;});
  if(!n)return toast('No hay cambios de precio','err');
  if(indep(S.user.suc)){save();toast(n+' precio(s) base actualizado(s) solo en '+S.user.suc+' ✔');return render();}
  GLOBAL.mayor={};db.products.forEach(p=>GLOBAL.mayor[p.id]=precioBase(p));
  save();saveGlobal();toast(n+' precio(s) base actualizado(s) en todas las sucursales ✔');render();
}
function addLista(){
  const n=$('#lnom').value.trim(),d=num($('#ldto').value);if(!n)return toast('Escribe el nombre de la lista','err');if(!d)return toast('Escribe el descuento en pesos por kilo','err');
  db.mayor.listas.push({id:Date.now(),nombre:n,dto:d});save();toast('Lista agregada ✔');render();
}
function delLista(id,ok){
  const l=db.mayor.listas.find(x=>x.id===id);if(!l)return;const k=db.mayor.clientes.filter(c=>c.lista===id).length;
  if(!ok)return ask(`¿Eliminar la lista ${l.nombre}?${k?` ${k} cliente(s) quedarán con el precio base.`:''}`,()=>delLista(id,1));
  db.mayor.listas=db.mayor.listas.filter(x=>x.id!==id);db.mayor.clientes.forEach(c=>{if(c.lista===id)c.lista=null;});save();toast('Lista eliminada');render();
}
function setCliLista(id,v){const c=db.mayor.clientes.find(x=>x.id===id);if(!c)return;
  if(v==='esp'){const e={};db.products.forEach(p=>e[p.id]=precioCli(c,p.id));c.esp=Object.assign(e,c.esp||{});c.lista='esp';S.espEdit=c.id;save();toast('Escribe los precios especiales de '+c.nombre+' y aprieta Guardar');if(S.view!=='pmay'&&canView('pmay'))go('pmay');else render();return;}
  c.lista=v?Number(v):null;save();toast(v?'Lista de '+c.nombre+' actualizada ✔':c.nombre+' quedó con precio base ✔');render();}
function saveEsp(cid){const c=db.mayor.clientes.find(x=>x.id===cid);if(!c)return;
  const ins=[...$$('[data-esp]')];if(ins.some(el=>!num(el.value)))return toast('Escribe un precio válido en todos los cilindros','err');
  let n=0;c.esp=c.esp||{};ins.forEach(el=>{const pid=el.dataset.esp,v=num(el.value),a=precioCli(c,pid);if(v===a)return;
    db.phist.push({fecha:today(),hora:hora(),usuario:S.user.nombre,prod:colLbl(P(pid))+' · '+c.nombre,campo:'mayor',antes:a,despues:v});c.esp[pid]=v;n++;});
  S.espEdit=null;save();toast(n?'Precio especial de '+c.nombre+' guardado ✔':'Sin cambios. Precios bloqueados');render();}
function setEsp(cid,pid,v){const c=db.mayor.clientes.find(x=>x.id===cid);if(!c)return;const n=num(v);if(!n)return toast('Escribe un precio válido','err');
  const a=precioCli(c,pid);if(n===a)return;c.esp=c.esp||{};c.esp[pid]=n;
  db.phist.push({fecha:today(),hora:hora(),usuario:S.user.nombre,prod:colLbl(P(pid))+' · '+c.nombre,campo:'mayor',antes:a,despues:n});
  save();toast('Precio especial de '+c.nombre+' ('+colLbl(P(pid))+') guardado ✔');}
function addCli(){
  const n=normCli($('#ncli').value);if(!n)return toast('Escribe el nombre del cliente','err');
  if(findCli(n))return toast('Ese cliente ya existe','err');
  const lv=$('#nlis').value,c={id:Date.now(),nombre:n,rut:$('#nrut').value.trim(),tel:$('#ntel').value.trim(),lista:lv==='esp'?'esp':lv?Number(lv):null};
  if(c.lista==='esp'){c.esp={};db.products.forEach(p=>c.esp[p.id]=precioBase(p));}
  db.mayor.clientes.push(c);
  save();toast('Cliente agregado ✔');render();
}
function delCli(id,ok){
  const c=db.mayor.clientes.find(x=>x.id===id);if(!c)return;
  if(!ok)return ask(`¿Eliminar al cliente ${c.nombre}? Sus ventas y abonos anteriores se mantienen en la Rendición Mayorista.`,()=>delCli(id,1));
  db.mayor.clientes=db.mayor.clientes.filter(x=>x.id!==id);save();toast('Cliente eliminado');render();
}
function anularMay(id,ok){
  const v=db.mayor.ventas.find(x=>x.id===id);if(!v||v.anulada)return;if(pastLock(v.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  if(!ok)return ask(`¿Anular la venta mayorista N° ${v.num} de ${v.cliente}? Los cilindros vuelven a bodega.`,()=>anularMay(id,1));
  for(const id2 in v.items){P(id2).stock+=v.items[id2];if(v.canje)db.vacios[grp(id2)]=Math.max(0,(db.vacios[grp(id2)]||0)-v.items[id2]);}
  v.anulada=true;save();toast('Venta mayorista anulada');render();
}
function vMRend(){
  const cl=mClientes(),T=cl.reduce((a,c)=>({comp:a.comp+c.comp,abo:a.abo+c.abo}),{comp:0,abo:0});
  const f1=S.mr1||'',f2=S.mr2||'',fc=S.mfc||'',inR=f=>(!f1||f>=f1)&&(!f2||f<=f2)&&true;
  const mov=[...db.mayor.ventas.map(v=>({t:'v',x:v,f:v.fecha,h:v.hora,c:v.cliente})),...db.mayor.abonos.map(a=>({t:'a',x:a,f:a.fecha,h:a.hora,c:a.cliente}))]
    .filter(m=>inR(m.f)&&(!fc||normCli(m.c)===normCli(fc))).sort((a,b)=>(b.f+b.h).localeCompare(a.f+a.h));
  const pv=mov.filter(m=>m.t==='v'&&!m.x.anulada).reduce((a,m)=>a+m.x.total,0),pa=mov.filter(m=>m.t==='a'&&!m.x.anulado).reduce((a,m)=>a+m.x.monto,0);
  const deben=cl.filter(c=>c.comp-c.abo>0);
  return mayf(`<p class="stitle">Cuenta mayorista · independiente de la rendición local</p>
    <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:20px">
      <div class="stat"><div class="k">Total vendido</div><div class="v">${money(T.comp)}</div></div>
      <div class="stat"><div class="k">Total pagado</div><div class="v">${money(T.abo)}</div></div>
      <div class="stat"><div class="k">Saldo por cobrar</div><div class="v" style="color:${T.comp-T.abo>0?'var(--red)':T.comp-T.abo<0?'var(--b7)':'var(--tx)'}">${money(T.comp-T.abo)}</div></div>
    </div>
    <div class="sect">REGISTRAR ABONO</div>
    <div class="frm" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:22px">
      <label style="flex:1;min-width:200px">Cliente<input id="acli" list="mclis" placeholder="Cliente que paga" autocomplete="off" data-h116="input"></label>${cliList()}
      <label>Fecha<input id="afe" type="date" value="${today()}"></label>
      <label>Monto $<input id="amo" type="number" min="0" inputmode="numeric" placeholder="0" style="width:120px"></label>
      <label>Medio de pago<select id="ame">${MEDIOS.map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label style="flex:1;min-width:160px">Detalle<input id="adet" placeholder="Ej: N° cheque o transferencia"></label>
      <button class="btn primary" data-h117="click">Registrar abono</button>
      <span class="hint" id="asal" style="width:100%"></span></div>
    <div class="sect">SALDO POR CLIENTE</div>
    <div class="tw blk"><table><tr><th class="l">CLIENTE</th><th>COMPRADO</th><th>PAGADO</th><th>SALDO</th><th>ÚLTIMA COMPRA</th><th class="no-print"></th></tr>
    ${cl.length?cl.map(c=>{const sd=c.comp-c.abo;return `<tr><td class="l"><b>${esc(c.cliente)}</b></td><td class="n">${money(c.comp)}</td><td class="n">${money(c.abo)}</td>
      <td class="n" style="color:${sd>0?'var(--red)':sd<0?'var(--b7)':'var(--tx)'}"><b>${money(sd)}</b> ${sd===0?'<span class="badge">Al día</span>':sd<0?'<span class="badge">A favor</span>':''}</td><td>${c.ult?dmy(c.ult):'-'}</td>
      <td class="no-print"><button class="btn sm" data-h118="click" data-h118a0="${esc(JSON.stringify(c.cliente))}">Ver movimientos</button></td></tr>`;}).join('')
      :'<tr><td colspan="6" class="empty">Aún no hay clientes mayoristas</td></tr>'}
    ${cl.length?`<tr class="tot"><td class="l">TOTAL (${deben.length} con saldo)</td><td>${money(T.comp)}</td><td>${money(T.abo)}</td><td>${money(T.comp-T.abo)}</td><td></td><td class="no-print"></td></tr>`:''}
    </table></div>
    <div class="sect">MOVIMIENTOS</div>
    <div class="frow" style="flex-wrap:wrap">Cliente <select id="mfc" data-h119="change"><option value="">Todos</option>${cliFijos().map(n=>`<option ${normCli(fc)===n?'selected':''}>${esc(n)}</option>`).join('')}</select>
      Desde <input type="date" id="mr1" value="${f1}"> Hasta <input type="date" id="mr2" value="${f2}">
      <button class="btn" data-h120="click">Buscar</button>
      <span class="hint">Período: vendido <b>${money(pv)}</b> · abonado <b>${money(pa)}</b></span></div>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th class="l">TIPO</th><th class="l">CLIENTE</th><th class="l">DETALLE</th><th>CARGO</th><th>ABONO</th><th>USUARIO</th><th class="no-print"></th></tr>
    ${mov.length?mov.map(m=>{const x=m.x,an=m.t==='v'?x.anulada:x.anulado;return `<tr class="${an?'anul':''}"><td>${dmy(m.f)}</td><td>${m.h}</td>
      <td class="l"><b>${m.t==='v'?'Venta N° '+x.num:'Abono · '+esc(x.medio)}</b></td><td class="l">${esc(m.c)}</td>
      <td class="l" style="white-space:normal">${m.t==='v'?itemsTxt(x):esc(x.det||'')}</td>
      <td class="n">${m.t==='v'?money(x.total):''}</td><td class="n" style="color:var(--ok)">${m.t==='a'?money(x.monto):''}</td><td>${esc(x.usuario)}</td>
      <td class="no-print">${an?'<span class="badge red">Anulado</span>':m.t==='a'?`<button class="btn sm danger" data-h121="click" data-h121a0="${x.id}">Anular</button>`:''}</td></tr>`;}).join('')
      :'<tr><td colspan="9" class="empty">Sin movimientos en este período</td></tr>'}
    </table></div>`);
}
function abSaldo(){const c=mClientes().find(x=>x.cliente===normCli($('#acli').value));$('#asal').textContent=c?`Saldo actual de ${c.cliente}: ${money(c.comp-c.abo)}`:'';}
function grabarAbono(){
  const cli=normCli($('#acli').value),m=num($('#amo').value);
  if(!cli)return toast('Escribe el cliente que paga','err');if(!m)return toast('Escribe el monto del abono','err');
  db.mayor.abonos.push({id:Date.now(),fecha:$('#afe').value||today(),hora:hora(),usuario:S.user.nombre,cliente:cli,monto:m,medio:$('#ame').value,det:$('#adet').value.trim(),anulado:false});
  save();toast('Abono registrado ✔ · '+money(m));render();
}
function anularAbono(id,ok){
  const a=db.mayor.abonos.find(x=>x.id===id);if(!a||a.anulado)return;
  if(pastLock(a.fecha))return toast('Día cerrado: solo un administrador puede modificar ventas o rendiciones de días anteriores.','err');
  if(!ok)return ask(`¿Anular el abono de ${money(a.monto)} de ${a.cliente}?`,()=>anularAbono(id,1));
  a.anulado=true;save();toast('Abono anulado');render();
}

/* ================= BODEGA: MOTOR ================= */
const TIPOS={
  compra:  {t:'Ingreso de llenos (compra a planta)',k:'llenos',canje:true},
  devplanta:{t:'Devolución de llenos a planta',k:'llenos'},
  ingvac:  {t:'Ingreso de vacíos',k:'vacios'},
  bajavac: {t:'Baja de vacíos (dañados)',k:'vacios'},
  prestamo:{t:'Préstamo de envase',k:'vacios'},
  devprest:{t:'Devolución de préstamo',k:'vacios'},
};
const nd=()=>({stock:{},vac:{},pres:{},carga:{},chofer:null});
const addTo=(o,k,v)=>{if(v)o[k]=(o[k]||0)+v;};
function buildD(tipo,q,ch,canje){
  const d=nd();d.chofer=ch||null;
  for(const id in q){const n=q[id];switch(tipo){
    case 'compra':addTo(d.stock,id,n);if(canje)addTo(d.vac,grp(id),-n);break;
    case 'devplanta':addTo(d.stock,id,-n);break;
    case 'carga':addTo(d.stock,id,-n);addTo(d.carga,id,n);break;
    case 'retorno':addTo(d.stock,id,n);addTo(d.carga,id,-n);break;
    case 'vchofer':addTo(d.carga,id,-n);addTo(d.vac,grp(id),n);break;
    case 'ingvac':addTo(d.vac,id,n);break;
    case 'bajavac':addTo(d.vac,id,-n);break;
    case 'prestamo':addTo(d.vac,id,-n);addTo(d.pres,id,n);break;
    case 'devprest':addTo(d.vac,id,n);addTo(d.pres,id,-n);break;
  }}
  return d;
}
function applyD(d,sg){
  const ch=d.chofer?db.choferes.find(c=>c.id===d.chofer):null;
  for(const id in d.stock)if(P(id).stock+sg*d.stock[id]<0)return `No hay suficientes llenos ${colLbl(P(id))} en bodega (hay ${P(id).stock})`;
  for(const g in d.vac)if((db.vacios[g]||0)+sg*d.vac[g]<0)return `No hay suficientes vacíos de ${g} (hay ${db.vacios[g]||0})`;
  for(const g in d.pres)if((db.prestados[g]||0)+sg*d.pres[g]<0)return `No hay préstamos de ${g} por devolver`;
  if(Object.keys(d.carga).length&&!ch)return 'Selecciona un chofer';
  for(const id in d.carga)if((ch.carga[id]||0)+sg*d.carga[id]<0)return `${ch.nombre} no tiene suficientes ${colLbl(P(id))} (tiene ${ch.carga[id]||0})`;
  for(const id in d.stock)P(id).stock+=sg*d.stock[id];
  for(const g in d.vac)db.vacios[g]=(db.vacios[g]||0)+sg*d.vac[g];
  for(const g in d.pres)db.prestados[g]=(db.prestados[g]||0)+sg*d.pres[g];
  for(const id in d.carga)ch.carga[id]=(ch.carga[id]||0)+sg*d.carga[id];
  return null;
}
function logB(label,d,extra={}){
  const ch=d&&d.chofer?db.choferes.find(c=>c.id===d.chofer):null;
  db.bmovs.push({id:Date.now(),fecha:today(),hora:hora(),usuario:S.user.nombre,label,d,chofer:ch?ch.nombre:'',anulado:false,...extra});
}
function dChips(d){
  if(!d)return '';
  const sg={};for(const id in d.stock){const g=grp(id);sg[g]=(sg[g]||0)+d.stock[id];}
  const canje=g=>d.vac&&d.vac[g]!=null&&sg[g]&&d.vac[g]===-sg[g];
  const L={inC:[],outC:[],in:[],out:[],vin:[],vout:[],cin:[],cout:[],pin:[],pout:[]};
  const ch=(n,t)=>`<span class="chip">${Math.abs(n)} × ${t}</span>`;
  for(const id in d.stock){const n=d.stock[id];if(!n)continue;const c=canje(grp(id));
    (n>0?(c?L.inC:L.in):(c?L.outC:L.out)).push(ch(n,colLbl(P(id))));}
  for(const g in d.vac){const n=d.vac[g];if(!n||canje(g))continue;(n>0?L.vin:L.vout).push(ch(n,g));}
  for(const id in d.carga){const n=d.carga[id];if(n)(n>0?L.cin:L.cout).push(ch(n,colLbl(P(id))));}
  for(const g in d.pres){const n=d.pres[g];if(n)(n>0?L.pin:L.pout).push(ch(n,g));}
  const row=(arr,cls,t)=>arr.length?`<div class="mvd"><span class="mvt ${cls}">${t}</span>${arr.join('')}</div>`:'';
  return row(L.inC,'in','▲ Entran llenos')+row(L.outC,'out','▼ Salen llenos')
    +row(L.in,'in','▲ Entran llenos')+row(L.out,'out','▼ Salen llenos')
    +row(L.vin,'in','▲ Entran vacíos')+row(L.vout,'out','▼ Salen vacíos')
    +row(L.cin,'in','▲ Chofer recibe')+row(L.cout,'out','▼ Chofer devuelve')
    +row(L.pin,'in','▲ Prestados')+row(L.pout,'out','▼ Devueltos');
}
function stockMsg(){return '';const l=lowList();return l.length?`<div class="alert">${ic('alert')}Bajo stock mínimo: ${l.map(p=>`${colLbl(p)} (${p.stock}/${db.min[p.id]})`).join(', ')}</div>`:'';}

/* ================= BODEGA: PANTALLA PRINCIPAL ================= */
function vBRes(){
  const ps=db.products,f1=S.bi1,f2=S.bi2||'9999';
  const aj=db.bmovs.filter(m=>m.kind==='ajuste'&&m.fecha>=f1&&m.fecha<=f2).slice().reverse();
  const low=p=>(db.min[p.id]||0)>0&&llenosTot(p.id)<db.min[p.id];
  const gl=g=>ps.filter(p=>grp(p.id)===g).reduce((a,p)=>a+llenosTot(p.id),0);
  const cc=p=>p.tipo==='c'?'cat':'';
  const docN=(n)=>`<span class="doc" title="Modificar stock" data-h122="click">${ic('doc')}${n}</span>`;
  const lle=p=>p.stock,vac=p=>db.vacios[grp(p.id)]||0,stt=p=>lle(p)+vac(p);
  const sum=f=>PRODS.reduce((a,x)=>a+f(P(x.id)),0);
  const resumen=`<p class="stitle">Resumen de stock</p>
    <div class="stats" style="margin-bottom:12px;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="stat"><div class="k">Stock total</div><div class="v">${sum(stt)}</div><div class="hint">Llenos + vacíos</div></div>
      <div class="stat"><div class="k">Llenos en bodega</div><div class="v">${sum(lle)}</div><div class="hint">Listos para vender</div></div>
      <div class="stat"><div class="k">Vacíos en bodega</div><div class="v">${sum(vac)}</div><div class="hint">Para recargar</div></div>
    </div>
    <div class="tw blk"><table>
      <tr><th class="l">Cilindro</th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>Total</th></tr>
      <tr><td class="l">Llenos</td>${ps.map(p=>`<td class="n">${lle(p)}</td>`).join('')}<td class="n"><b>${sum(lle)}</b></td></tr>
      <tr><td class="l">Vacíos</td>${ps.map(p=>`<td class="n">${vac(p)}</td>`).join('')}<td class="n"><b>${sum(vac)}</b></td></tr>
      <tr class="tot"><td class="l">Stock total</td>${ps.map(p=>`<td>${stt(p)}</td>`).join('')}<td>${sum(stt)}</td></tr>
    </table></div>`;
  return bod(stockMsg()+resumen);
}

/* ================= BODEGA: MODIFICAR STOCK ================= */
function vBEdit(){
  const ps=db.products,cc=p=>p.tipo==='c'?'cat':'';
  const ei=(key,v)=>`<input class="ei" type="number" inputmode="numeric" data-e="${key}" value="${v}">`;
  return bod(`<div class="alert" style="background:var(--b1);border-color:var(--b2);color:var(--b8)">${ic('edit')}Escribe la cantidad real de cada casilla y presiona Guardar cambios. El sistema guarda el ajuste en el historial.</div>
    <div class="tw blk"><table>
      <tr class="cap"><td colspan="${ps.length+1}">STOCK CILINDROS LLENOS</td></tr>
      <tr><th class="l"></th>${thP()}</tr>
      <tr class="sec"><td class="l">BODEGA</td>${ps.map(p=>`<td class="${cc(p)}">${ei('s:'+p.id,p.stock)}</td>`).join('')}</tr>
    </table></div>
    <div class="tw blk"><table>
      <tr class="cap"><td colspan="${GROUPS.length+1}">STOCK CILINDROS VACÍOS</td></tr>
      <tr><th class="l"></th>${GROUPS.map(g=>`<th>${g}</th>`).join('')}</tr>
      <tr class="sec"><td class="l">TOTAL VACÍOS</td>${GROUPS.map(g=>`<td>${ei('v:'+g,db.vacios[g]||0)}</td>`).join('')}</tr>
      <tr class="sec"><td class="l">ENVASES PRESTADOS</td>${GROUPS.map(g=>`<td>${ei('p:'+g,db.prestados[g]||0)}</td>`).join('')}</tr>
    </table></div>
    <div style="text-align:center"><button class="btn primary" style="padding:10px 26px" data-h123="click">Guardar cambios</button> <button class="btn" data-h124="click">Volver</button></div>`);
}
function saveEdit(){
  const d=nd(),notes=[];let n=0;
  $$('[data-e]').forEach(el=>{
    const [k,id]=el.dataset.e.split(':'),v=num(el.value);let df=0;
    if(k==='s'){df=v-P(id).stock;if(df){d.stock[id]=df;P(id).stock=v;}}
    else if(k==='v'){df=v-(db.vacios[id]||0);if(df){d.vac[id]=df;db.vacios[id]=v;}}
    else if(k==='p'){df=v-(db.prestados[id]||0);if(df){d.pres[id]=df;db.prestados[id]=v;}}
    else{const ch=db.choferes.find(c=>'c'+c.id===k);df=v-(ch.carga[id]||0);if(df){ch.carga[id]=v;notes.push(`${ch.nombre} ${colLbl(P(id))} ${df>0?'+':''}${df}`);}}
    if(df)n++;
  });
  if(!n)return toast('No hay cambios','err');
  logB('Ajuste manual de stock',d,{kind:'ajuste',nota:notes.join(' · ')});
  save();toast('Stock actualizado ✔');go('bres');
}
function addChof(){const n=$('#cn').value.trim().toUpperCase();if(!n)return toast('Escribe un nombre','err');db.choferes.push({id:Date.now(),nombre:n,carga:{}});save();toast('Chofer agregado ✔');render();}
function delChof(id){
  const c=db.choferes.find(x=>x.id===id);
  if(Object.values(c.carga).some(v=>v>0))return toast('El chofer aún tiene cilindros cargados (déjalo en 0 primero)','err');
  ask('¿Eliminar a '+c.nombre+'?',()=>{db.choferes=db.choferes.filter(x=>x.id!==id);save();render();});
}

/* ================= BODEGA: INGRESO DE CARGA ================= */
function vBCarga(){
  const ps=db.products,vac=p=>db.vacios[grp(p.id)]||0;
  const cargas=db.bmovs.filter(m=>m.tipo==='carga').slice().reverse().slice(0,15);
  const tot=m=>Object.values(m.d.stock||{}).reduce((a,n)=>a+n,0);
  return bod(`<div class="alert" style="background:var(--b1);border-color:var(--b2);color:var(--b8)">${ic('swap')}Cuando llega el camión: escribe cuántos llenos entran. Los vacíos bajan en la misma cantidad, porque salen en el camión.</div>
    <div class="tw blk"><table>
      <tr class="cap"><td colspan="${ps.length+1}">INGRESO DE CARGA</td></tr>
      <tr><th class="l"></th>${ps.map(p=>`<th>${colLbl(p)}</th>`).join('')}</tr>
      <tr class="sec"><td class="l"><b>LLENOS QUE ENTRAN</b></td>${ps.map(p=>`<td><input class="ei" data-cg="${p.id}" type="number" min="0" inputmode="numeric" placeholder="0" data-h125="input"></td>`).join('')}</tr>
      <tr><td class="l">Llenos ahora → después</td>${ps.map(p=>`<td class="n" id="cgl-${p.id}">${p.stock}</td>`).join('')}</tr>
      <tr><td class="l">Vacíos ahora → después</td>${ps.map(p=>`<td class="n" id="cgv-${p.id}">${vac(p)}</td>`).join('')}</tr>
    </table></div>
    <div class="frow" style="justify-content:center">Guía / observación <input id="cgobs" placeholder="Ej: guía N° 1234" style="min-width:220px">
      <button class="btn primary" style="padding:9px 24px" data-h126="click">Ingresar carga</button></div>
    <p class="stitle" style="margin-top:22px">Últimas cargas</p>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th>USUARIO</th><th class="l">GUÍA / OBS.</th><th class="l">DETALLE</th><th>TOTAL</th><th class="no-print"></th></tr>
    ${cargas.length?cargas.map(m=>`<tr class="${m.anulado?'anul':''}"><td>${dmy(m.fecha)}</td><td>${m.hora}</td><td>${esc(m.usuario)}</td><td class="l">${esc(m.obs||'')}</td>
      <td class="l" style="white-space:normal">${dChips(m.d)}</td><td class="n"><b>${tot(m)}</b></td>
      <td class="no-print">${m.anulado?'<span class="badge red">Anulada</span>':`<button class="btn sm danger" data-h127="click" data-h127a0="${m.id}">Anular</button>`}</td></tr>`).join('')
      :`<tr><td colspan="7" class="empty">Aún no hay cargas ingresadas</td></tr>`}
    </table></div>`);
}
function cargaPrev(){
  const add={};$$('[data-cg]').forEach(el=>{add[el.dataset.cg]=Math.max(0,num(el.value));});
  const usa={};for(const id in add)usa[grp(id)]=(usa[grp(id)]||0)+add[id];
  db.products.forEach(p=>{const n=add[p.id]||0,v=db.vacios[grp(p.id)]||0,vd=v-(usa[grp(p.id)]||0);
    $('#cgl-'+p.id).innerHTML=n?`${p.stock} → <b style="color:var(--ok)">${p.stock+n}</b>`:p.stock;
    $('#cgv-'+p.id).innerHTML=n?`${v} → <b style="color:${vd<0?'var(--red)':'var(--b7)'}">${vd}</b>`:v;});
}
function grabarCarga(){
  const q={};$$('[data-cg]').forEach(el=>{const n=num(el.value);if(n>0)q[el.dataset.cg]=n;});
  if(!Object.keys(q).length)return toast('Escribe cuántos llenos entran','err');
  const d=buildD('compra',q,null,true);
  const err=applyD(d,1);if(err)return toast(err+'. Revisa los vacíos en Modificar Stock.','err');
  logB('Ingreso de carga',d,{tipo:'carga',obs:$('#cgobs').value.trim()});
  save();toast('Carga ingresada ✔');render();
}

/* ================= BODEGA: MOVIMIENTOS ================= */
function vBMov(){
  if(!TIPOS[S.btipo])S.btipo='compra';
  const T=TIPOS[S.btipo],f1=S.bm1,f2=S.bm2||S.bm1;
  let rows=db.bmovs.filter(m=>!m.kind&&m.fecha>=f1&&m.fecha<=f2).map(m=>({...m,src:'b'}));
  db.ventas.filter(v=>v.fecha>=f1&&v.fecha<=f2&&!v.anulada).forEach(v=>{
    const d=nd();for(const id in v.items)d.stock[id]=-v.items[id];for(const g in (v.vac||{}))d.vac[g]=v.vac[g];
    rows.push({id:v.id,fecha:v.fecha,hora:v.hora,usuario:v.usuario,label:'Venta local N° '+v.num,d,chofer:'',src:'v'});
  });
  db.mayor.ventas.filter(v=>v.fecha>=f1&&v.fecha<=f2&&!v.anulada).forEach(v=>{
    const d=nd();for(const id in v.items){d.stock[id]=-v.items[id];if(v.canje)d.vac[grp(id)]=(d.vac[grp(id)]||0)+v.items[id];}
    rows.push({id:v.id,fecha:v.fecha,hora:v.hora,usuario:v.usuario,label:'Venta mayorista N° '+v.num+' · '+v.cliente,d,chofer:'',src:'v'});
  });
  if(S.bprod)rows=rows.filter(m=>m.d&&(m.d.stock[S.bprod]||m.d.carga[S.bprod]||m.d.vac[grp(S.bprod)]));
  rows.sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora));
  const cols=T.k==='llenos'?db.products.map(p=>({id:p.id,l:colLbl(p),s:p.stock,c:p.tipo==='c'})):GROUPS.map(g=>({id:g,l:g,s:db.vacios[g]||0}));
  return bod(`<div class="sect">MOVIMIENTOS CILINDROS ${T.k==='llenos'?'LLENOS':'VACÍOS'}</div>
    <div class="tw blk"><table>
      <tr><td colspan="${cols.length+1}" class="l" style="background:var(--b0)"><div class="frm" style="margin:4px 0">
        <label>Tipo de movimiento<select data-h128="change">${Object.entries(TIPOS).map(([k,t])=>`<option value="${k}" ${S.btipo===k?'selected':''}>${t.t}</option>`).join('')}</select></label>
        ${T.canje?`<label class="chk" style="padding-bottom:7px"><input type="checkbox" id="bcanje" checked> Entregar vacíos a cambio</label>`:''}
        <label style="flex:1;min-width:150px">Observación<input id="bobs" placeholder="Ej: guía N° 1234"></label></div></td></tr>
      <tr><th class="l"></th>${cols.map(c=>`<th class="${c.c?'cat':''}">${c.l}</th>`).join('')}</tr>
      <tr><td class="l"><b>${T.k==='llenos'?'EN BODEGA':'VACÍOS'}</b></td>${cols.map(c=>`<td class="n">${c.s}</td>`).join('')}</tr>
      <tr><td class="l"><b>CANTIDAD</b></td>${cols.map(c=>`<td><input class="ei" data-q="${c.id}" type="number" inputmode="numeric" placeholder="0"></td>`).join('')}</tr>
    </table></div>
    <div style="text-align:center;margin:-10px 0 22px"><button class="btn primary" data-h129="click">Grabar movimiento</button></div>
    <div class="frow">Producto <select data-h130="change"><option value="">Todos</option>${db.products.map(p=>`<option value="${p.id}" ${S.bprod===p.id?'selected':''}>${colLbl(p)}</option>`).join('')}</select>
      Inicio <input type="date" id="bm1" value="${S.bm1}"> Final <input type="date" id="bm2" value="${S.bm2}">
      <button class="btn" data-h131="click">Buscar</button></div>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th class="l">TIPO</th><th>USUARIO</th><th class="l">DETALLE</th><th class="no-print"></th></tr>
    ${rows.length?rows.map(m=>`<tr class="${m.anulado?'anul':''}"><td>${dmy(m.fecha)}</td><td>${m.hora}</td><td class="l"><b>${esc(m.label)}</b>${m.obs?`<div class="hint">${esc(m.obs)}</div>`:''}</td><td>${esc(m.usuario)}</td>
      <td class="l" style="white-space:normal">${dChips(m.d)}</td><td class="no-print">${m.src==='b'&&!m.anulado?`<button class="btn sm danger" data-h132="click" data-h132a0="${m.id}">Anular</button>`:m.anulado?'<span class="badge red">Anulado</span>':'<span class="badge">Caja</span>'}</td></tr>`).join('')
      :`<tr><td colspan="6" class="empty">Sin movimientos en este período</td></tr>`}
    </table></div>`);
}
function grabarB(){
  const T=TIPOS[S.btipo],q={};
  $$('[data-q]').forEach(el=>{const n=num(el.value);if(n)q[el.dataset.q]=n;});
  if(!Object.keys(q).length)return toast('Ingresa al menos una cantidad','err');
  const ch=T.ch?Number($('#bch')?.value)||null:null;
  const d=buildD(S.btipo,q,ch,T.canje&&$('#bcanje').checked);
  const err=applyD(d,1);if(err)return toast(err,'err');
  logB(T.t,d,{obs:$('#bobs').value.trim()});S.bch=ch||S.bch;save();toast('Movimiento grabado ✔');render();
}
function anularB(id,ok){
  const m=db.bmovs.find(x=>x.id===id);if(!m||m.anulado)return;
  if(!ok)return ask('¿Anular este movimiento? Se revertirán las cantidades.',()=>anularB(id,1));
  const err=applyD(m.d,-1);if(err)return toast('No se puede anular: '+err,'err');
  m.anulado=true;save();toast('Movimiento anulado');render();
}

/* ================= BODEGA: INVENTARIO / RECUENTO ================= */
function vBInv(mode){
  const inv=mode==='inv';
  const t=(title,cols,key)=>`<div class="tw blk"><table>
    <tr class="cap"><td colspan="${cols.length+1}">${title}</td></tr>
    <tr><th class="l"></th>${cols.map(c=>`<th class="${c.c?'cat':''}">${c.l}</th>`).join('')}</tr>
    <tr><td class="l"><b>SISTEMA</b></td>${cols.map(c=>`<td class="n">${c.s}</td>`).join('')}</tr>
    <tr><td class="l"><b>FÍSICO (contado)</b></td>${cols.map(c=>`<td><input class="ei" data-inv="${key}:${c.id}" data-sys="${c.s}" type="number" inputmode="numeric" placeholder="-" data-h133="input"></td>`).join('')}</tr>
    <tr><td class="l"><b>DIFERENCIA</b></td>${cols.map(c=>`<td id="dif-${key}-${c.id}" class="n">-</td>`).join('')}</tr></table></div>`;
  return bod(`<div class="sect">${inv?'INVENTARIO FÍSICO':'RECUENTO BODEGA'}</div>
    <p class="hint" style="margin:8px 0 14px;text-align:center">${inv?'Cuenta los cilindros y graba: el stock del sistema queda igual a lo contado.':'Cuenta los cilindros y compara con el sistema. No cambia el stock.'} Deja en blanco lo que no contaste.</p>
    ${t('CILINDROS LLENOS EN BODEGA',db.products.map(p=>({id:p.id,l:colLbl(p),s:p.stock,c:p.tipo==='c'})),'s')}
    ${t('CILINDROS VACÍOS',GROUPS.map(g=>({id:g,l:g,s:db.vacios[g]||0})),'v')}
    <div style="text-align:center"><button class="btn primary" data-h134="click" data-h134a0="${mode}">${inv?'Grabar inventario':'Guardar recuento'}</button></div>`);
}
function difInv(el){
  const [k,id]=el.dataset.inv.split(':'),c=$(`#dif-${k}-${id}`);
  if(el.value===''){c.textContent='-';c.style.color='';return;}
  const d=num(el.value)-Number(el.dataset.sys);
  c.textContent=(d>0?'+':'')+d;c.style.color=d<0?'var(--red)':d>0?'var(--ok)':'';
}
function grabarInv(mode){
  const d=nd();let n=0;
  $$('[data-inv]').forEach(el=>{
    if(el.value==='')return;n++;
    const [k,id]=el.dataset.inv.split(':'),df=num(el.value)-Number(el.dataset.sys);
    if(df)(k==='s'?d.stock:d.vac)[id]=df;
  });
  if(!n)return toast('Ingresa al menos un conteo','err');
  if(mode==='inv'){const err=applyD(d,1);if(err)return toast(err,'err');}
  logB(mode==='inv'?'Inventario físico':'Recuento bodega',d,{kind:'ajuste',nota:(!Object.keys(d.stock).length&&!Object.keys(d.vac).length)?'Sin diferencias':''});
  save();toast(mode==='inv'?'Inventario grabado ✔':'Recuento guardado ✔');go('bres');
}

/* ================= BODEGA: TRANSFORMACIÓN ================= */
function vBTrans(){
  const ll=S.tclase==='llenos',opts=ll?db.products.map(p=>[p.id,colLbl(p)+' (hay '+p.stock+')']):GROUPS.map(g=>[g,g+' (hay '+(db.vacios[g]||0)+')']);
  const o=opts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
  const hist=db.bmovs.filter(m=>m.label==='Transformación envases').slice(-15).reverse();
  return bod(`<div class="sect">TRANSFORMACIÓN DE ENVASES</div>
    <div class="tw blk"><table><tr><th>CLASE</th><th>DESDE</th><th>HACIA</th><th>CANTIDAD</th><th></th></tr>
    <tr><td><select data-h135="change"><option value="vacios" ${!ll?'selected':''}>Vacíos</option><option value="llenos" ${ll?'selected':''}>Llenos en bodega</option></select></td>
      <td><select id="tde">${o}</select></td><td><select id="tha">${o}</select></td>
      <td><input id="tq" class="ei" type="number" inputmode="numeric" placeholder="0"></td>
      <td><button class="btn primary" data-h136="click">Guardar</button></td></tr></table></div>
    <div class="tw"><table><tr><th>FECHA</th><th>HORA</th><th>USUARIO</th><th class="l">DETALLE</th></tr>
    ${hist.length?hist.map(m=>`<tr><td>${dmy(m.fecha)}</td><td>${m.hora}</td><td>${esc(m.usuario)}</td><td class="l">${dChips(m.d)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Sin transformaciones</td></tr>'}
    </table></div>`);
}
function grabarTrans(){
  const de=$('#tde').value,ha=$('#tha').value,q=num($('#tq').value);
  if(de===ha)return toast('Elige tipos distintos','err');
  if(!q)return toast('Ingresa una cantidad','err');
  const d=nd(),o=S.tclase==='llenos'?d.stock:d.vac;o[de]=-q;o[ha]=q;
  const err=applyD(d,1);if(err)return toast(err,'err');
  logB('Transformación envases',d,{kind:'ajuste'});save();toast('Transformación grabada ✔');render();
}

/* ================= BODEGA: STOCK MÍNIMO ================= */
function vBMin(){
  const ps=db.products;
  return bod(`${stockMsg()}<div class="sect">STOCK MÍNIMO</div>
    <div class="tw blk"><table>
      <tr><th class="l"></th>${thP()}</tr>
      <tr><td class="l"><b>STOCK BODEGA</b></td>${ps.map(p=>`<td class="n">${p.stock}</td>`).join('')}</tr>
      <tr><td class="l"><b>STOCK MÍNIMO</b></td>${ps.map(p=>`<td><input class="ei" data-min="${p.id}" type="number" inputmode="numeric" value="${db.min[p.id]||''}" placeholder="0"></td>`).join('')}</tr>
      <tr><td class="l"><b>ESTADO</b></td>${ps.map(p=>{const m=db.min[p.id]||0;return `<td>${m?`<span class="badge ${p.stock<m?'red':'ok'}">${p.stock<m?'Bajo':'OK'}</span>`:'-'}</td>`;}).join('')}</tr>
    </table></div>
    <div style="text-align:center"><button class="btn primary" data-h137="click">Grabar venta</button></div>`);
}
function saveMin(){$$('[data-min]').forEach(el=>db.min[el.dataset.min]=num(el.value));save();toast('Stock mínimo guardado ✔');render();}

/* ================= DIÁLOGOS / IMPRESIÓN ================= */
let EMB=false;try{EMB=window.self!==window.top;}catch(e){EMB=true;}
function doPrint(){if(EMB)return toast('Para imprimir, abre el archivo descargado en tu computador','err');window.print();}
function ask(msg,onOk,fields){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="mbox"><p>${esc(msg)}</p>${(fields||[]).map(f=>`<label>${f.label}${f.type==='select'?`<select id="${f.id}">${f.opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input id="${f.id}" type="${f.type||'text'}">`}</label>`).join('')}<div class="mbtns"><button class="btn" data-x="no">Cancelar</button><button class="btn primary" data-x="ok">Aceptar</button></div></div>`;
  document.body.appendChild(m);
  m.querySelector('[data-x=no]').onclick=()=>m.remove();
  m.querySelector('[data-x=ok]').onclick=()=>{const v={};(fields||[]).forEach(f=>v[f.id]=m.querySelector('#'+f.id).value);m.remove();onOk(v);};
  const fi=m.querySelector('input,select');if(fi)fi.focus();
}

/* ================= INFORMES (admin) ================= */
const isAdmin=()=>can('inf');
/* Ganancias: solo estos administradores */
/* Tabla de ganancia mayorista en Informes: desactivada por ahora (cambiar a true para mostrarla) */
const VER_GAN_MAY=false;
const GAN_USERS=['matias','gina','alex','miguel'];
/* Ganancias: lo decide la casilla "Ver Ganancias" de cada usuario (Configuración → Usuarios) */
function ganInicial(x){const n=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return GAN_USERS.includes(n(x.u))||GAN_USERS.includes(n(x.nombre).split(/\s+/)[0]);}
const verGan=()=>isAdmin();
function abrirInf(){
  if(isAdmin())return go('inf');
  ask('No tienes permiso para Informes. Ingresa los datos de alguien que sí tenga permiso.',v=>{
    const a=USERS.find(u=>u.u.toLowerCase()===String(v.au||'').trim().toLowerCase()&&u.p===v.ap&&u.verInf===true);
    if(!a)return toast('Usuario o clave incorrectos, o ese usuario no tiene permiso de Informes','err');S.infOk=true;S.infBy=a.u;go('inf');},
    [{id:'au',label:'Usuario con permiso de Informes'},{id:'ap',label:'Clave',type:'password'}]);
}
function withDb(d,fn){const o=db;db=d;try{return fn();}finally{db=o;}}
function repSuc(suc,f1,f2){
  const d=suc===S.user.suc?db:load(suc);
  return withDb(d,()=>{
    const r=calcRange(f1,f2),units={},monto={};
    db.products.forEach(p=>{units[p.id]=0;monto[p.id]=0;});
    let desc=0,env=0;
    r.vs.forEach(v=>{for(const id in v.items){units[id]=(units[id]||0)+v.items[id];monto[id]=(monto[id]||0)+v.items[id]*((v.precios||{})[id]||0);}
      for(const id in v.env)env+=v.env[id];desc+=v.desc||0;});
    const g={};RKEYS.forEach(k=>g[k]=0);let com=0;
    Object.keys(db.rend).filter(x=>x>=f1&&x<=f2).forEach(f=>{const R=db.rend[f];RKEYS.forEach(k=>g[k]+=sumK(R,k));});
    [((db.mayor&&db.mayor.rend)||{}),...Object.values((db.mayor&&db.mayor.rendc)||{})].forEach(RRc=>Object.keys(RRc).filter(x=>x>=f1&&x<=f2).forEach(f=>(RRc[f].vales||[]).forEach(e=>com+=comVale(e))));
    const stock={};db.products.forEach(p=>stock[p.id]=llenosTot(p.id));
    const baseAt=(p,f)=>{const h=[...(db.phist||[]),...((!indep(suc)&&GLOBAL&&GLOBAL.hist)||[]).filter(x=>x.suc!==suc&&!indep(x.suc))].filter(x=>x.campo==='mayor'&&x.prod===colLbl(p)&&x.fecha>f).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));return h.length?(h[0].antes||p.venta):precioBase(p);};
    const gan={},ganV={},ganB={};let gdesc=0;db.products.forEach(p=>{gan[p.id]=0;ganV[p.id]=0;ganB[p.id]=0;});
    r.vs.forEach(v=>{for(const id in v.items){const p=P(id);if(!p)continue;const q=v.items[id],pv=v.precios[id]||0,b=baseAt(p,v.fecha);
      ganV[id]+=q*pv;ganB[id]+=q*b;gan[id]+=q*(pv-b);}gdesc+=v.desc||0;});
    const mv=((db.mayor&&db.mayor.ventas)||[]).filter(v=>!v.anulada&&v.fecha>=f1&&v.fecha<=f2).map(v=>({...v,suc}));
    let mganV=0;const mun={},mganB={},mgan={};
    mv.forEach(v=>{for(const id in (v.items||{})){const p=P(id);if(!p)continue;const q=v.items[id]||0,pv=(v.precios||{})[id]||0,b=baseAt(p,v.fecha);
      mun[id]=(mun[id]||0)+q;mganV+=q*pv;mganB[id]=(mganB[id]||0)+q*b;mgan[id]=(mgan[id]||0)+q*(pv-b);}});
    const byDay={};r.vs.forEach(v=>byDay[v.fecha]=(byDay[v.fecha]||0)+v.total);
    return {suc,mv,gan,ganV,ganB,gdesc,mganV,mun,mganB,mgan,vs:r.vs,byDay,venta:r.venta,n:r.vs.length,units,monto,desc,env,g,com,rendido:r.rendido,saldo:r.saldo,
      kilos:db.products.reduce((a,p)=>a+(units[p.id]||0)*p.kg,0),tarros:Object.values(units).reduce((a,b)=>a+b,0),
      stock,vacG:Object.fromEntries(GROUPS.map(x=>[x,db.vacios[x]||0])),min:{...(db.min||{})},llenos:Object.values(stock).reduce((a,b)=>a+b,0),vac:GROUPS.reduce((a,x)=>a+(db.vacios[x]||0),0)};
  });
}
function infRango(k){const d=new Date(),f=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  if(k==='hoy'){S.if1=today();S.if2='';}
  if(k==='7'){const a=new Date(d);a.setDate(a.getDate()-6);S.if1=f(a);S.if2=today();}
  if(k==='mes'){S.if1=f(new Date(d.getFullYear(),d.getMonth(),1));S.if2=today();}
  if(k==='mesant'){S.if1=f(new Date(d.getFullYear(),d.getMonth()-1,1));S.if2=f(new Date(d.getFullYear(),d.getMonth(),0));}
  render();
}
function copyTable(id){
  const txt=[...document.querySelectorAll('#'+id+' tr')].map(tr=>[...tr.children].map(td=>td.innerText.trim().replace(/\n/g,' ')).join('\t')).join('\n');
  const fail=()=>{const r=document.createRange();r.selectNodeContents($('#'+id));const sl=getSelection();sl.removeAllRanges();sl.addRange(r);toast('Tabla seleccionada: usa Ctrl+C / Cmd+C','err');};
  try{navigator.clipboard.writeText(txt).then(()=>toast('Tabla copiada. Pégala en Excel ✔'),fail);}catch(e){fail();}
}
/* ---------- utilidades de informe ---------- */
const SUCCOL={'Cervantes':'#2a78d6','El Tranque':'#eb6834','Maipo':'#1baf7a','Padre Damián':'#eda100','Olivos':'#e87ba4','Jr Coyhaique':'#008300','Jr Parcelas':'#6250d6','Chillán':'#0e7490'};
function addDays(f,n){const d=new Date(f+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function nDays(f1,f2){return Math.round((new Date(f2+'T12:00:00')-new Date(f1+'T12:00:00'))/864e5)+1;}
function daysOf(f1,f2){const o=[];for(let d=f1;d<=f2&&o.length<400;d=addDays(d,1))o.push(d);return o;}
const mshort=v=>v>=1e6?'$ '+(v/1e6).toLocaleString('es-CL',{maximumFractionDigits:1})+' M':v>=1e3?'$ '+Math.round(v/1e3).toLocaleString('es-CL')+' mil':'$ '+Math.round(v);
function niceMax(v){if(v<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(v))),m=v/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
function delta(cur,prev){
  if(!prev&&!cur)return '<span class="dl">Sin cambios</span>';
  if(!prev)return '<span class="dl up">▲ Nuevo</span>';
  const d=(cur-prev)/prev*100,t=Math.abs(d)<0.05?'0%':(d>0?'+':'')+d.toLocaleString('es-CL',{maximumFractionDigits:1})+'%';
  return `<span class="dl ${d>0.05?'up':d<-0.05?'down':''}">${d>0.05?'▲':d<-0.05?'▼':'='} ${t}</span>`;
}
let TIPS=[];
function tipMove(e){const t=$('#vtip');const el=e.target.closest&&e.target.closest('[data-ti]');
  if(!el){t.hidden=true;return;}t.innerHTML=TIPS[+el.dataset.ti]||'';t.hidden=false;
  const W=t.offsetWidth,H=t.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+W>innerWidth-8)x=e.clientX-W-14;if(y+H>innerHeight-8)y=e.clientY-H-14;t.style.left=x+'px';t.style.top=y+'px';}
document.addEventListener('mousemove',tipMove);
function chartDias(list,days){
  const W=760,H=240,L=62,R=10,T=12,B=28,iw=W-L-R,ih=H-T-B;
  const tot=days.map(d=>list.reduce((a,r)=>a+(r.byDay[d]||0),0));
  const max=niceMax(Math.max(...tot,0)),slot=iw/days.length,bw=Math.max(2,Math.min(38,slot*0.68));
  const y=v=>T+ih-(v/max)*ih;
  let g='';
  for(let i=0;i<=4;i++){const v=max*i/4,yy=y(v);g+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" class="gl"/><text x="${L-8}" y="${yy+4}" class="ax" text-anchor="end">${mshort(v)}</text>`;}
  const step=Math.ceil(days.length/10);
  days.forEach((d,i)=>{
    const x=L+slot*i+(slot-bw)/2;let base=0;const segs=list.filter(r=>r.byDay[d]);
    segs.forEach((r,k)=>{const v=r.byDay[d],y0=y(base),y1=y(base+v),h=Math.max(0,y0-y1-(k<segs.length-1||base>0?0:0));
      const top=k===segs.length-1,hh=Math.max(1,y0-y1-(base>0?2:0));
      if(top&&hh>4){const rr=Math.min(4,bw/2);g+=`<path d="M${x},${y1+hh} V${y1+rr} Q${x},${y1} ${x+rr},${y1} H${x+bw-rr} Q${x+bw},${y1} ${x+bw},${y1+rr} V${y1+hh} Z" fill="${SUCCOL[r.suc]}"/>`;}
      else g+=`<rect x="${x}" y="${y1}" width="${bw}" height="${hh}" fill="${SUCCOL[r.suc]}"/>`;
      base+=v;});
    if(i%step===0||i===days.length-1&&days.length<=10)g+=`<text x="${L+slot*i+slot/2}" y="${H-10}" class="ax" text-anchor="middle">${d.slice(8,10)}/${d.slice(5,7)}</text>`;
    const ti=TIPS.push(`<b>${dmy(d)}</b>${list.map(r=>`<div class="tr"><i style="background:${SUCCOL[r.suc]}"></i>${r.suc}<span>${money(r.byDay[d]||0)}</span></div>`).join('')}${list.length>1?`<div class="tr tt">Total<span>${money(tot[i])}</span></div>`:''}`)-1;
    g+=`<rect x="${L+slot*i}" y="${T}" width="${slot}" height="${ih}" fill="transparent" data-ti="${ti}" class="hit"/>`;
  });
  g+=`<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" class="bl"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Ventas por día">${g}</svg>`;
}
function chartSuc(list,prev){
  const rowH=34,W=540,L=104,R=118,H=list.length*rowH+8,iw=W-L-R;
  const max=niceMax(Math.max(...list.map(r=>r.venta),0));
  let g='';
  list.forEach((r,i)=>{const y0=8+i*rowH,w=r.venta/max*iw;
    g+=`<text x="${L-10}" y="${y0+15}" class="lb" text-anchor="end">${r.suc}</text>`;
    g+=`<rect x="${L}" y="${y0+2}" width="${Math.max(w,r.venta?2:0)}" height="16" rx="4" fill="${SUCCOL[r.suc]}"/>`;
    g+=`<text x="${L+w+8}" y="${y0+15}" class="vl">${money(r.venta)}</text>`;
    const ti=TIPS.push(`<b>${r.suc}</b><div class="tr">Ventas<span>${money(r.venta)}</span></div>`)-1;
    g+=`<rect x="0" y="${y0}" width="${W}" height="${rowH-6}" fill="transparent" data-ti="${ti}" class="hit"/>`;});
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Ventas por sucursal">${g}</svg>`;
}
/* ---------- exportar a Excel ---------- */
function loadXLSX(){return new Promise((ok,ko)=>{if(window.XLSX)return ok(window.XLSX);const sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';sc.onload=()=>ok(window.XLSX);sc.onerror=()=>ko(new Error('xlsx'));document.head.appendChild(sc);});}
async function exportExcel(){
  const R=INFDATA;if(!R)return;
  toast('Preparando el archivo Excel…');
  let X;try{X=await loadXLSX();}catch(e){return toast('No se pudo cargar el generador de Excel. Revisa tu conexión.','err');}
  const wb=X.utils.book_new(),add=(name,rows)=>{const ws=X.utils.aoa_to_sheet(rows);ws['!cols']=rows[0].map((_,i)=>({wch:Math.min(28,Math.max(10,...rows.map(r=>String(r[i]??'').length+2)))}));X.utils.book_append_sheet(wb,ws,name);};
  const {list,prev,T,days,f1,f2,pf1,pf2}=R;
  add('Resumen',[['Informe MR · Sistema Local'],['Período',dmy(f1)+' al '+dmy(f2)],[],
    ['Sucursal','Ventas $','Cilindros','Kilos','Rendido $','Saldo $'],
    ...list.map((r,i)=>[r.suc,r.venta,r.tarros,r.kilos,r.rendido,r.saldo]),
    ['TOTAL',T.venta,T.tarros,T.kilos,T.rendido,T.saldo]]);
  add('Ventas por día',[['Fecha',...list.map(r=>r.suc),'Total'],...days.map(d=>[dmy(d),...list.map(r=>r.byDay[d]||0),list.reduce((a,r)=>a+(r.byDay[d]||0),0)])]);
  add('Cilindros por producto',[['Sucursal',...PRODS.map(colLbl),'Total'],...list.map(r=>[r.suc,...PRODS.map(p=>r.units[p.id]||0),r.tarros]),['TOTAL',...PRODS.map(p=>T.units[p.id]||0),T.tarros]]);
  add('Stock actual',[['Sucursal',...PRODS.flatMap(p=>[colLbl(p)+' llenos',colLbl(p)+' vacíos']),'Total llenos','Total vacíos'],...list.slice().sort((a,b)=>a.llenos-b.llenos).map(r=>[r.suc,...PRODS.flatMap(p=>[r.stock[p.id]||0,(r.vacG||{})[grp(p.id)]||0]),r.llenos,r.vac])]);
  add('Detalle de ventas',[['Sucursal','Fecha','Hora','N° venta','Usuario',...PRODS.map(p=>colLbl(p)),'Envases','Descuento $','Total $','Medio de pago'],
    ...list.flatMap(r=>r.vs.map(v=>[r.suc,dmy(v.fecha),v.hora,v.num,v.usuario,...PRODS.map(p=>v.items[p.id]||0),Object.values(v.env||{}).reduce((a,b)=>a+b,0),v.desc||0,v.total,v.pago]))]);
  const buf=X.write(wb,{bookType:'xlsx',type:'array'});
  const name=`Informe MR ${dmy(f1)}${f2!==f1?' al '+dmy(f2):''}.xlsx`;
  const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  let dl=null;try{if(window.claude&&window.claude.use)dl=await window.claude.use('downloads');}catch(e){}
  if(dl){try{await dl.save({filename:name,data:blob});toast('Excel descargado ✔');}
    catch(e){const c=e&&e.code;if(c==='declined')toast('Descarga cancelada.');else if(c==='rate_limited')toast('Ya hay una descarga pendiente de confirmar.','err');else toast('No se pudo descargar el archivo aquí.','err');}
    return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);toast('Excel descargado ✔');
}
/* ---- Descarga de la base de datos completa (solo administradores, con contraseña especial) ---- */
const DBPASS_H='504d4137a6b43a0150d1f966630e9eed0d0d205ba4e111e44c7e9d0e62db8e9d';
async function sha256(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function dlBlob(name,blob,okMsg){
  let dl=null;try{if(window.claude&&window.claude.use)dl=await window.claude.use('downloads');}catch(e){}
  if(dl){try{await dl.save({filename:name,data:blob});toast(okMsg);}
    catch(e){const c=e&&e.code;if(c==='declined')toast('Descarga cancelada.');else if(c==='rate_limited')toast('Ya hay una descarga pendiente de confirmar.','err');else toast('No se pudo descargar el archivo aquí.','err');}
    return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);toast(okMsg);
}
function pedirClaveDB(){
  if(!(can('*admin')||S.infOk))return toast('Solo un administrador puede descargar la base de datos.','err');
  const m=document.createElement('div');m.className='modal dbm';
  m.innerHTML=`<div class="mbox"><p>Descargar base de datos</p>
    <p class="hint" style="font-weight:500;margin:-4px 0 10px">Escribe la contraseña especial de respaldo.</p>
    <input id="dbpw" type="password" autocomplete="off" placeholder="Contraseña especial" style="width:100%;height:42px">
    <div class="mbtns" style="margin-top:14px"><span style="flex:1"></span><button class="btn" data-h138="click">Cancelar</button>
      <button class="btn primary" data-h139="click">${ic('doc')}Descargar</button></div></div>`;
  m.addEventListener('click',e=>{if(e.target===m)m.remove();});
  document.body.appendChild(m);const i=m.querySelector('#dbpw');i.focus();i.addEventListener('keydown',e=>{if(e.key==='Enter')descargarDB();});
}
async function descargarDB(){
  const i=$('#dbpw');if(!i)return;
  let h='';try{h=await sha256(i.value);}catch(e){}
  if(h!==DBPASS_H){i.value='';i.focus();return toast('Contraseña especial incorrecta.','err');}
  document.querySelector('.modal.dbm')?.remove();
  const suc={};SUCS.forEach(x=>{suc[x]=x===S.user.suc?db:load(x);});
  const data={app:'MR Sistema Local',tipo:'respaldo-completo',version:1,generado:today()+' '+hora(),por:S.user.nombre,usuarios:USERS,sucursales:suc};
  const blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});
  await dlBlob(`MR base de datos ${dmy(today())}.json`,blob,'Base de datos descargada ✔');
}
let INFDATA=null;
function vInf(){
  if(!isAdmin())return frame('Informes','home',null,`<div style="padding:24px" class="empty">No tienes permiso para ver Informes. <button class="btn sm primary" data-h140="click">Ingresar como administrador</button></div>`);
  if(!S.if1){S.if1=addDays(today(),-6);S.if2=today();}
  const f1=S.if1,f2=S.if2&&S.if2>=f1?S.if2:f1,sel=S.isuc||'';
  const nd=nDays(f1,f2),pf2=addDays(f1,-1),pf1=addDays(f1,-nd);
  const sucs=(sel?[sel]:SUCS);
  const list=sucs.map(x=>repSuc(x,f1,f2)),prev=sucs.map(x=>repSuc(x,pf1,pf2));
  const T={venta:0,n:0,tarros:0,kilos:0,desc:0,rendido:0,saldo:0,com:0,llenos:0,vac:0,units:{},stock:{},g:{}};
  const PV={venta:0,n:0,tarros:0,kilos:0,com:0};
  RKEYS.forEach(k=>T.g[k]=0);
  list.forEach(r=>{['venta','n','tarros','kilos','desc','rendido','saldo','com','llenos','vac'].forEach(k=>T[k]+=r[k]);
    PRODS.forEach(p=>{T.units[p.id]=(T.units[p.id]||0)+(r.units[p.id]||0);T.stock[p.id]=(T.stock[p.id]||0)+(r.stock[p.id]||0);});RKEYS.forEach(k=>T.g[k]+=r.g[k]);});
  prev.forEach(r=>['venta','n','tarros','kilos','com'].forEach(k=>PV[k]+=r[k]));
  const days=daysOf(f1,f2);
  INFDATA={list,prev,T,PT:PV.venta,days,f1,f2,pf1,pf2};TIPS=[];
  const pct=v=>T.venta?Math.round(v/T.venta*1000)/10+'%':'0%';
  const tcap=(t,id,sub)=>`<div class="tcap2"><div><b>${t}</b>${sub?`<span class="hint"> · ${sub}</span>`:''}</div><button class="btn sm no-print" data-h141="click" data-h141a0="${id}">${ic('doc')}Copiar tabla</button></div>`;
  const tot=list.length>1;
  const per=f2===f1?dmy(f1):`${dmy(f1)} al ${dmy(f2)}`,pper=pf2===pf1?dmy(pf1):`${dmy(pf1)} al ${dmy(pf2)}`;
  const kpi=(k,v,c,p,fmt)=>`<div class="stat"><div class="k">${k}</div><div class="v">${fmt(v)}</div></div>`;
  const legend=list.length>1?`<div class="leg">${list.map(r=>`<span><i style="background:${SUCCOL[r.suc]}"></i>${r.suc}</span>`).join('')}</div>`:'';
  return frame('Informes','home',null,`
    <div class="rtop" style="flex-wrap:wrap">Período
      <input type="date" id="if1" value="${f1}"> a <input type="date" id="if2" value="${f2}">
      <select id="isuc"><option value="">Todas las sucursales</option>${SUCS.map(x=>`<option ${sel===x?'selected':''}>${x}</option>`).join('')}</select>
      <button class="btn sm primary" data-h142="click">Ver informe</button>
      <span style="flex:1"></span>
      <button class="btn sm" data-h143="click">Hoy</button><button class="btn sm" data-h144="click">Últimos 7 días</button>
      <button class="btn sm" data-h145="click">Este mes</button><button class="btn sm" data-h146="click">Mes anterior</button>
    </div>
    <div style="padding:18px">
    <div class="tcap2"><p class="stitle" style="margin:0">${sel?'Sucursal '+esc(sel):'Total de sucursales'} · ${per}</p>
      <button class="btn primary no-print" data-h147="click">${ic('doc')}Exportar a Excel</button></div>
    <div class="stats" style="margin-bottom:22px;grid-template-columns:repeat(3,minmax(0,1fr))">
      ${kpi('Ventas',T.venta,0,PV.venta,money)}
      ${kpi('Cilindros vendidos',T.tarros,0,PV.tarros,v=>v)}
      ${kpi('Kilos vendidos',T.kilos,0,PV.kilos,v=>v.toLocaleString('es-CL'))}
    </div>

    <div class="cgrid">
      <div class="cbox"><div class="tcap2"><div><b>Ventas por día</b><span class="hint"> · ${per}</span></div>${legend}</div>
        ${days.length>1?chartDias(list,days):`<p class="empty">Elige un período de varios días (por ejemplo “Últimos 7 días”) para ver el gráfico por día.</p>`}</div>
      <div class="cbox"><div class="tcap2"><div><b>Ventas por sucursal</b><span class="hint"> · ${per}</span></div></div>
        ${chartSuc(list,prev)}</div>
    </div>

    ${tcap('Resumen por sucursal','t-res',per)}
    <div class="tw blk"><table id="t-res"><tr><th class="l">Sucursal</th><th>Ventas $</th><th>Cilindros</th><th>Kilos</th><th>Rendido</th><th>Saldo</th></tr>
      ${list.map((r,i)=>`<tr><td class="l"><b><i class="sw2" style="background:${SUCCOL[r.suc]}"></i>${r.suc}</b></td><td class="n r">${money(r.venta)}</td><td class="n">${r.tarros}</td><td class="n">${r.kilos.toLocaleString('es-CL')}</td><td class="r">${money(r.rendido)}</td><td class="r" style="color:${r.saldo>0?'var(--red)':'inherit'}">${money(r.saldo)}</td></tr>`).join('')}
      ${tot?`<tr class="tot"><td class="l">TOTAL</td><td class="r">${money(T.venta)}</td><td>${T.tarros}</td><td>${T.kilos.toLocaleString('es-CL')}</td><td class="r">${money(T.rendido)}</td><td class="r">${money(T.saldo)}</td></tr>`:''}
    </table></div>

    ${verGan()?(()=>{const G={},GV={},GB={};let gd=0;PRODS.forEach(p=>{G[p.id]=0;GV[p.id]=0;GB[p.id]=0;});
      list.forEach(r=>{PRODS.forEach(p=>{G[p.id]+=(r.gan||{})[p.id]||0;GV[p.id]+=(r.ganV||{})[p.id]||0;GB[p.id]+=(r.ganB||{})[p.id]||0;});gd+=r.gdesc||0;});
      const sm=o=>Object.values(o||{}).reduce((a,b)=>a+b,0),gt=sm(G);
      const qn=(r,id)=>(r.units||{})[id]||0,QT=id=>list.reduce((a,r)=>a+qn(r,id),0),qr=r=>PRODS.reduce((a,p)=>a+qn(r,p.id),0);
      const mq=(r,id)=>(r.mun||{})[id]||0,MQT=id=>list.reduce((a,r)=>a+mq(r,id),0),mqr=r=>PRODS.reduce((a,p)=>a+mq(r,p.id),0);
      const MV=list.reduce((a,r)=>a+(r.mganV||0),0),MB=list.reduce((a,r)=>a+sm(r.mganB),0),MG=list.reduce((a,r)=>a+sm(r.mgan),0);
      const col=x=>x<0?'var(--red)':'var(--ok)';
      const cq=n=>`<td class="n"${n?'':' style="color:#b6bdc9"'}>${n}</td>`;
      return tcap('Ganancias · venta local sobre precio base','t-gan',per+' · solo administradores')+`<p class="hint" style="margin:-4px 0 8px">Ganancia = (precio de venta local − precio base mayorista de ese día) × cilindros vendidos. Los formatos muestran la cantidad vendida en el local. Descuentos = rebajas hechas en la venta. No incluye ventas anuladas.</p>
      <div class="tw blk"><table id="t-gan"><tr><th class="l">Sucursal</th>${PRODS.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>Total cil.</th><th>Venta local</th><th>A precio base</th><th>Ganancia</th><th>Descuentos</th><th>Ganancia neta</th></tr>
      ${list.map(r=>{const g=sm(r.gan);return `<tr><td class="l"><b>${r.suc}</b></td>${PRODS.map(p=>cq(qn(r,p.id))).join('')}<td class="n"><b>${qr(r)}</b></td><td class="r">${money(sm(r.ganV))}</td><td class="r">${money(sm(r.ganB))}</td><td class="r"><b>${money(g)}</b></td><td class="r">${money(r.gdesc||0)}</td><td class="r"><b style="color:var(--ok)">${money(g-(r.gdesc||0))}</b></td></tr>`;}).join('')}
      ${tot?`<tr class="tot"><td class="l">TOTAL</td>${PRODS.map(p=>`<td>${QT(p.id)}</td>`).join('')}<td>${PRODS.reduce((a,p)=>a+QT(p.id),0)}</td><td class="r">${money(sm(GV))}</td><td class="r">${money(sm(GB))}</td><td class="r">${money(gt)}</td><td class="r">${money(gd)}</td><td class="r">${money(gt-gd)}</td></tr>`:''}
    </table></div>`
    +(!VER_GAN_MAY?'':tcap('Ganancias · venta mayorista sobre precio base','t-ganm',per+' · solo administradores')+`<p class="hint" style="margin:-4px 0 8px">Ganancia = (precio de venta mayorista − precio base mayorista de ese día) × cilindros vendidos. Los formatos muestran la cantidad vendida a mayoristas. No incluye ventas anuladas.</p>
      <div class="tw blk"><table id="t-ganm"><tr><th class="l">Sucursal</th>${PRODS.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>Total cil.</th><th>Venta mayorista</th><th>A precio base</th><th>Ganancia</th></tr>
      ${list.map(r=>{const g=sm(r.mgan);return `<tr><td class="l"><b>${r.suc}</b></td>${PRODS.map(p=>cq(mq(r,p.id))).join('')}<td class="n"><b>${mqr(r)}</b></td><td class="r">${money(r.mganV||0)}</td><td class="r">${money(sm(r.mganB))}</td><td class="r"><b style="color:${col(g)}">${money(g)}</b></td></tr>`;}).join('')}
      ${tot?`<tr class="tot"><td class="l">TOTAL</td>${PRODS.map(p=>`<td>${MQT(p.id)}</td>`).join('')}<td>${PRODS.reduce((a,p)=>a+MQT(p.id),0)}</td><td class="r">${money(MV)}</td><td class="r">${money(MB)}</td><td class="r">${money(MG)}</td></tr>`:''}
    </table></div>`);})():''}

    ${verGan()?'':tcap('Cilindros vendidos por producto','t-prod',per)+`<div class="tw blk"><table id="t-prod"><tr><th class="l">Sucursal</th>${PRODS.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>Total</th></tr>
      ${list.map(r=>`<tr><td class="l"><b>${r.suc}</b></td>${PRODS.map(p=>`<td class="n">${r.units[p.id]||0}</td>`).join('')}<td class="n"><b>${r.tarros}</b></td></tr>`).join('')}
      ${tot?`<tr class="tot"><td class="l">TOTAL</td>${PRODS.map(p=>`<td>${T.units[p.id]||0}</td>`).join('')}<td>${T.tarros}</td></tr>`:''}
    </table></div>`}

    ${(()=>{const mv=list.flatMap(r=>r.mv||[]).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
      return tcap('Ventas mayoristas','t-may',per+' · '+mv.length+' venta'+(mv.length===1?'':'s'))+`<div class="tw blk"><table id="t-may"><tr><th>FECHA</th><th>HORA</th>${tot?'<th class="l">SUCURSAL</th>':''}<th>N°</th><th class="l">CLIENTE</th>${PRODS.map(p=>`<th>${colLbl(p)}</th>`).join('')}<th>TOTAL</th><th>USUARIO</th></tr>
      ${mv.length?mv.map(v=>`<tr><td>${dmy(v.fecha)}</td><td>${v.hora}</td>${tot?`<td class="l">${v.suc}</td>`:''}<td>${v.num}</td><td class="l"><b>${esc(v.cliente)}</b>${v.obs?`<div class="hint">${esc(v.obs)}</div>`:''}</td>${PRODS.map(p=>{const q=(v.items||{})[p.id]||0;return `<td class="n"${q?'':' style="color:#b6bdc9"'}>${q}</td>`;}).join('')}<td class="r">${money(v.total)}</td><td>${esc(v.usuario)}</td></tr>`).join('')
        +`<tr class="tot"><td class="l" colspan="${tot?5:4}">TOTAL</td>${PRODS.map(p=>`<td>${mv.reduce((a,v)=>a+((v.items||{})[p.id]||0),0)}</td>`).join('')}<td class="r">${money(mv.reduce((a,v)=>a+v.total,0))}</td><td></td></tr>`
        :`<tr><td colspan="${(tot?7:6)+PRODS.length}" class="empty">No hay ventas mayoristas en este período</td></tr>`}</table></div>`;})()}

    <div class="tcap2"><div><b>Stock actual</b><span class="hint"> · a hoy · arriba las que tienen menos llenos</span></div></div>
    ${(()=>{const srt=list.slice().sort((a,b)=>a.llenos-b.llenos||b.vac-a.vac);
      const low=r=>PRODS.some(p=>{const m=(r.min||{})[p.id]||0;return m>0&&(r.stock[p.id]||0)<m;});
      const est=r=>!r.llenos?['red','Sin llenos']:(low(r)||r.vac>r.llenos)?['warn','Necesita carga']:['ok','OK'];
      return `<div class="skc">${srt.map(r=>{const [c,t]=est(r);return `<div class="skc-i ${c}">
        <div class="skc-h"><b>${esc(r.suc)}</b><span class="skc-b ${c}">${t}</span></div>
        <div class="skc-n"><div><small>Llenos</small><span>${r.llenos}</span></div><div class="v"><small>Vacíos</small><span>${r.vac}</span></div></div>
        <table class="skc-t"><tr><th></th><th>Llenos</th><th>Vacíos</th></tr>${PRODS.map(p=>{const l=r.stock[p.id]||0,v=(r.vacG||{})[grp(p.id)]||0,m=(r.min||{})[p.id]||0;return `<tr class="${!l&&!v?'z':''}"><td>${colLbl(p)}</td><td class="${m>0&&l<m?'lo':''}">${l}</td><td>${v}</td></tr>`;}).join('')}</table>
      </div>`;}).join('')}</div>
      <p class="hint" style="margin:6px 0 18px">Total: <b>${T.llenos}</b> llenos · <b>${T.vac}</b> vacíos. En rojo: bajo el stock mínimo.</p>`;})()}
    ${can('*admin')||S.infOk?`<div class="dbbox no-print"><div><b>Respaldo de la base de datos</b><div class="hint">Descarga todos los datos de las ${SUCS.length} sucursales (ventas, rendiciones, clientes, bodega, precios y usuarios) en un archivo. Solo administradores. Pide una contraseña especial.</div></div>
      <button class="btn primary" data-h148="click">${ic('doc')}Descargar base de datos</button></div>`:''}
    </div>`,true,`<button class="btn" data-h149="click">${ic('print')}Imprimir</button>`);
}

/* ================= RENDER ================= */
const VIEWS={qrc:vQr,login:vLogin,home:vHome,caja:vCaja,venta:vVenta,rend:vRend,may:vMay,mrend:vRend,mcta:vMRend,config:vConfig,com:vCom,colores:vColores,inf:vInf,phist:vPHist,users:vUsers,
  penv:vPEnv,clientes:vClientes,pmay:vPMay,bres:vBRes,bcarga:vBCarga,bmov:vBMov,bedit:vBEdit};
function mgVolver(){if(!/^https?:$/.test(location.protocol))return;const ab=document.querySelector('.ab-right');
  if(ab&&MGU&&MGU.modo==='matriz'&&!document.getElementById('mg-volver'))ab.insertAdjacentHTML('afterbegin','<a class="hb" id="mg-volver" href="../#panel" style="text-decoration:none">← Panel General</a>');
  const lg=document.querySelector('.login');if(lg&&!document.getElementById('mg-volver2'))lg.insertAdjacentHTML('beforeend','<a id="mg-volver2" class="hint" href="../" style="text-align:center">← Volver al inicio</a>');}
{const r0=render;render=function(){const x=r0.apply(this,arguments);try{mgVolver();}catch(e){}return x;};}
/* Venta Local es una sola sucursal: entra directo a Venta Local, sin menú propio.
   Su informe se ve en Panel General → Informes → Venta Local (esta misma página con ?solo=inf). */
const MG_EMB=/[?&]solo=inf\b/.test(location.search),MG_APP=/[?&]app=1\b/.test(location.search);
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
    const br=document.querySelector('.appbar .brand');if(br){[...br.attributes].forEach(a=>{if(/^data-h\d+$/.test(a.name))br.removeAttribute(a.name)});br.style.cursor='default';}
    const sy=document.getElementById('sync');if(sy&&!document.getElementById('mg-con')){sy.insertAdjacentHTML('beforebegin','<span class="mg-con" id="mg-con"><i></i>Conectado al servidor</span>');sy.style.display='none';mgConPintar();}
    const ab=document.querySelector('.ab-right'),u=USERS[0];
    if(MG_APP){const ph=document.querySelector('.phead');if(ph&&!document.getElementById('mg-acc')){const mc=document.getElementById('mg-con');
      ph.insertAdjacentHTML('beforeend','<div class="mg-acc" id="mg-acc"><span class="pill">'+esc(S.user.suc)+'</span>'+(u&&userSucs(u).length>1?'<button class="btn sm" data-h150="click">Cambiar sucursal</button>':'')+'</div>');
      if(mc)document.getElementById('mg-acc').appendChild(mc);
      /* sucursal con bodega propia: volver a su menú */
      if(MG_BODP.includes(S.user.suc)&&S.view!=='home'){const bm=document.createElement('button');bm.className='btn sm';bm.id='mg-menu';bm.textContent='← Menú de '+S.user.suc;bm.onclick=()=>go('home');document.getElementById('mg-acc').prepend(bm);}}}
    /* en su menú: solo Venta Local, Venta Mayorista y Control de bodega (Configuración e Informes están en el Panel General) */
    if(MG_APP&&S.view==='home')document.querySelectorAll('.mcard').forEach(b=>{if([...b.attributes].some(a=>/^data-h\d+a0$/.test(a.name)&&(a.value==='config'||a.value==='inf')))b.remove();});
    if(ab&&u&&userSucs(u).length>1&&!document.getElementById('mg-suc'))ab.insertAdjacentHTML('afterbegin','<button class="hb" id="mg-suc" data-h151="click">Cambiar sucursal</button>');}}catch(e){}
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
function render(){
  if(S.user&&!READY){$('#app').innerHTML=`<div class="login-wrap"><div class="login" style="text-align:center"><div class="lbrand" style="justify-content:center"><span class="sq">MR</span><div style="text-align:left"><b>MR</b><small>Sistema Local</small></div></div><p>Cargando datos compartidos…</p></div></div>`;return;}
  if((!S.user||!db)&&S.view!=='login')S.view='login';
  if(S.user&&db&&!canView(S.view))S.view='home';
  $('#app').innerHTML=(VIEWS[S.view]||vHome)();
  try{mobT();}catch(e){}
}
/* En celular, las tablas de ingreso por cilindro se muestran giradas: un cilindro por fila */
function mobT(){
  if(!MOB()||['inf','clientes','pmay'].includes(S.view))return;
  const labs=new Set();db&&db.products.forEach(p=>{labs.add(colLbl(p));labs.add(p.id);});GROUPS.forEach(g=>labs.add(g));
  document.querySelectorAll('.tw.blk > table').forEach(t=>{
    const rows=[...t.rows];
    const hi=rows.findIndex(r=>r.cells.length>2&&[...r.cells].slice(1).every(c=>c.tagName==='TH'));
    if(hi<0)return;const H=rows[hi],n=H.cells.length;
    const hits=[...H.cells].slice(1).filter(c=>labs.has(c.textContent.trim())).length;if(hits<(n-1)*0.6)return;
    const body=rows.filter((r,i)=>i!==hi&&r.cells.length===n&&![...r.cells].some(c=>c.colSpan>1||c.rowSpan>1));
    const caps=rows.filter((r,i)=>i!==hi&&!body.includes(r));
    if(!body.length||body.length>4)return;
    const nt=document.createElement('table');nt.className=(t.className+' mt').trim();if(t.id)nt.id=t.id;
    const tb=document.createElement('tbody');nt.appendChild(tb);
    caps.forEach(r=>{if([...r.cells].length===1){r.cells[0].colSpan=body.length+1;tb.appendChild(r);}});
    const hr=document.createElement('tr');const c0=document.createElement('th');c0.innerHTML=H.cells[0].innerHTML;hr.appendChild(c0);
    body.forEach(r=>{const th=document.createElement('th');th.innerHTML=r.cells[0].innerHTML;th.className=r.className;hr.appendChild(th);});tb.appendChild(hr);
    const cols=body.map(r=>[...r.cells]);const hc=[...H.cells];
    for(let j=1;j<n;j++){const tr=document.createElement('tr');const th=document.createElement('th');th.className='mh '+(hc[j].className||'');th.innerHTML=hc[j].innerHTML;tr.appendChild(th);
      cols.forEach((cs,i)=>{const td=cs[j];if(body[i].classList.contains('tot'))td.style.fontWeight='700';tr.appendChild(td);});tb.appendChild(tr);}
    t.replaceWith(nt);
  });
}
setInterval(()=>{const c=$('#clock');if(c)c.textContent=hora();},1000);
applyTheme(THEME);
render();
boot();

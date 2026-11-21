/* ===================== Datos fijos ===================== */
const API_URL="../api/index.php";
const FORM_DOM={c5:"5 kg",c11:"11 kg",c15:"15 kg",c45:"45 kg",h15a:"H15"};
const FORMATOS=[["c5","5 kg",5],["c11","11 kg",11],["c15","15 kg",15],["c45","45 kg",45],["c15a","15 kg Al",15]];
const ETIQ=Object.fromEntries(FORMATOS.map(f=>[f[0],f[1]])),KG=Object.fromEntries(FORMATOS.map(f=>[f[0],f[2]]));
const ESTADOS=["Pendiente","En ruta","En cliente","Entregado","Cancelado"];
const MAY_EST={"Pendiente":"pendiente","En ruta":"ruta","En cliente":"ruta","Entregado":"entregado","Cancelado":"anulado"};
const MEDIOS={efectivo:"Efectivo",debito:"Débito",credito:"Crédito",transferencia:"Transferencia"};
const ORIGENES={fono:"Teléfono",telefono:"Teléfono",whatsapp:"WhatsApp",app:"App",web:"Sitio web",instagram:"Instagram",pedidosya:"Pedidos Ya",mercadolibre:"Mercado Libre"};
const PROMESA_MIN=120;

/* ===================== Utilidades ===================== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dos=n=>String(n).padStart(2,"0");
const ahora=()=>{const d=new Date();return `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}`};
const isoLocal=d=>`${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`;
const clp=n=>"$"+Math.round(n||0).toLocaleString("es-CL");
const kgTxt=n=>(n||0).toLocaleString("es-CL")+" kg";
const leer=(k,d)=>{try{const v=localStorage.getItem("mrr_"+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const grabar=(k,v)=>{try{localStorage.setItem("mrr_"+k,JSON.stringify(v))}catch(e){}};
const cls=e=>"s-"+String(e||"").replace(/\s/g,"");
const fmtFecha=s=>{const d=new Date(String(s||"").replace(" ","T"));return isNaN(d)?"":d.toLocaleDateString("es-CL",{day:"2-digit",month:"short"})+" "+d.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})};
const fecha=s=>new Date(String(s||"").replace(" ","T"));
const esHoy=s=>{const d=s instanceof Date?s:fecha(s);return !isNaN(d)&&d.toDateString()===new Date().toDateString()};

/* ===================== Conexión con MR Gas (misma base de datos) ===================== */
async function api(a,body,q=""){
  const r=await fetch(`${API_URL}?a=${a}${q}`,{method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
    headers:body?{"Content-Type":"application/json","X-MRGas":"1"}:{},body:body?JSON.stringify(body):undefined});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok||!j){const e=new Error((j&&j.error)||"No hay conexión con el servidor.");e.status=r.status;throw e}
  return j}
const S={yo:null,ver:0,col:{pedidos:new Map(),reparto:new Map(),camiones:new Map(),choferes:new Map()},est:{},vista:"bandeja",
  estado:"pendiente",tipo:"todos",filtro:"Activos",abierto:null,confirmar:false,cvTab:"pend",periodo:"dia",listo:false,timer:null,mios:new Set()};
const lista=c=>[...S.col[c].values()];
const choferes=()=>lista("choferes").filter(c=>c&&c.nombre&&c.activo!==false).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));
const camiones=()=>lista("camiones").sort((a,b)=>(a.patente||"").localeCompare(b.patente||""));
const clientes=()=>(S.est.mayoristas||[]).slice().sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"","es"));
const reparto=()=>lista("reparto");
const nomChofer=id=>{const c=S.col.choferes.get(String(id));return c?c.nombre:""};
const esAdmin=()=>S.yo&&S.yo.rol==="admin";
const puedeEditar=()=>S.yo&&S.yo.rol!=="chofer";

function aplicar(docs,inicial){
  let cambio=false;
  docs.forEach(d=>{
    if(d.col==="estado"){if(!d.borrado&&d.data)S.est[d.id]=d.data.v;cambio=true;return}
    const m=S.col[d.col];if(!m)return;cambio=true;
    if(d.borrado){m.delete(d.id);return}
    const prev=m.get(d.id),nuevo=!prev;m.set(d.id,d.data);
    if(!inicial&&S.listo&&!S.mios.has(d.col+"|"+d.id)){
      if(nuevo&&S.yo.rol!=="chofer"){
        if(d.col==="pedidos"&&d.data.estado==="pendiente")llego(vistaDe(d.data,"dom"));
        if(d.col==="reparto"&&d.data.estado==="Pendiente")llego(vistaDe(d.data,"may"));}
      if(S.yo.rol==="chofer"&&esMio(d.col,d.data)&&!(prev&&esMio(d.col,prev)))alarma(d.col,d.data);
    }
  });
  if(cambio)render();
}
async function sondear(){
  try{const j=await api("cambios",null,"&desde="+S.ver);if(j.docs.length)aplicar(j.docs,false);S.ver=j.ver;conexion(true)}
  catch(e){if(e.status===401){salir("Su sesión venció. Vuelva a entrar.");return}conexion(false)}
  clearTimeout(S.timer);S.timer=setTimeout(sondear,document.hidden?15000:4000);
}
async function guardarDoc(col,id,data){
  id=String(id);const M=S.col[col]||new Map(),ant=col==="estado"?S.est[id]:M.get(id);
  if(col==="estado")S.est[id]=data.v;else if(data===null)M.delete(id);else M.set(id,data);
  S.mios.add(col+"|"+id);render();
  try{const r=await api("lote",{docs:[{col,id,data}]});const x=r.res&&r.res[0];
    if(!x||!x.ok){if(col==="estado")S.est[id]=ant;else if(ant)M.set(id,ant);else M.delete(id);render();
      aviso("No se pudo guardar",x&&x.error==="sin permiso"?"Su usuario no tiene permiso para este cambio.":"Intente otra vez.",false);return false}
    return true}
  catch(e){if(col==="estado")S.est[id]=ant;else if(ant)M.set(id,ant);else M.delete(id);render();aviso("Sin conexión","El cambio no se guardó. Revise la señal e intente otra vez.",false);return false}
}
function conexion(ok){const c=$("#con");c.classList.toggle("off",!ok);c.querySelector("span").textContent=ok?"Conectado al servidor":"No conectado al servidor"}
addEventListener("online",()=>sondear());addEventListener("offline",()=>conexion(false));
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&S.yo){clearTimeout(S.timer);sondear()}});

/* ===================== Stock: igual que MR Gas al entregar ===================== */
const itemsDom=p=>p.items||[{formato:p.formato,cant:p.cant,precio:p.precio}];
async function moverStock(p,signo){ // signo -1 al entregar, +1 al deshacer
  const ch=signo<0?p.chofer:p.descCh;
  if(ch!=null){const k="stk-"+ch,s=JSON.parse(JSON.stringify(S.est[k]||{carga:{},vacios:{}}));s.carga=s.carga||{};s.vacios=s.vacios||{};
    itemsDom(p).forEach(i=>{s.carga[i.formato]=(s.carga[i.formato]||0)+signo*i.cant;s.vacios[i.formato]=(s.vacios[i.formato]||0)-signo*(i.cant-(i.env||0))});
    await guardarDoc("estado",k,{v:s});return ch}
  const lk="loc-"+(p.local||1),l=S.est[lk];
  if(l&&l.stock){const n=JSON.parse(JSON.stringify(l));itemsDom(p).forEach(i=>n.stock[i.formato]=(n.stock[i.formato]||0)+signo*i.cant);await guardarDoc("estado",lk,{v:n})}
  return null}
async function cambiarDom(p,e,chofer,extra){
  const n=JSON.parse(JSON.stringify(p));if(extra)Object.assign(n,extra);
  if(n.desc&&e!=="entregado"){await moverStock(n,1);n.desc=false;n.entregado=null;n.descCh=null}
  if(e==="ruta"){n.chofer=chofer;if(!n.despacho)n.despacho=ahora()}
  if(e==="entregado"&&!n.desc){n.descCh=await moverStock(n,-1);n.desc=true;n.entregado=ahora()}
  if(e==="pendiente")n.chofer=null;
  n.estado=e;
  const ok=await guardarDoc("pedidos",n.id,n);
  if(ok)guardarDoc("bitacora","r"+Date.now(),{id:Date.now()+Math.random(),fecha:ahora(),user:S.yo.nombre||S.yo.user,local:n.local||1,area:"pedidos",
    accion:{ruta:"Pedido despachado",entregado:"Pedido entregado",pendiente:"Pedido devuelto a por despachar",anulado:"Pedido anulado"}[e]||"Pedido actualizado",
    detalle:`Pedido N° ${n.id}${n.chofer?" · "+nomChofer(n.chofer):""}${e==="anulado"&&n.motivoAnula?" · Causa: "+n.motivoAnula:""} · desde App repartidores`,chofer:n.chofer||null,pedido:n.id});
  return ok}
async function cambiarRep(p,cambios){
  const n={...p,...cambios,actualizado:new Date().toISOString()};
  if(cambios.chofer!==undefined)n.chofer=cambios.chofer===""||cambios.chofer==null?null:+cambios.chofer;
  return guardarDoc("reparto",n.id,n)}

/* ===================== Anular pedido con su causa ===================== */
const MOTIVOS_ANULA=["Casa cerrada / no hay nadie","Compró a otro distribuidor","Cliente ya no lo necesita","Cliente no contesta","Dirección incorrecta o no existe","No tenía el dinero","Pedido repetido","Otro motivo"];
function leerMotivo(z){const s=z.querySelector("[data-motivo]"),d=z.querySelector("[data-motivo-det]"),er=z.querySelector(".mot-err");
  const m=s?s.value:"",det=d?d.value.trim():"";if(!m||(m==="Otro motivo"&&!det)){if(er){er.textContent=m?"Escriba el detalle del motivo.":"Elija una causa.";er.hidden=false}(m?d:s).focus();return null}
  return {motivoAnula:m+(det?" · "+det:""),anuladoPor:S.yo.nombre||S.yo.user,anuladoEn:ahora()}}
document.addEventListener("input",e=>{if(e.target.matches("[data-motivo],[data-motivo-det]")){const er=e.target.closest(".confirma");const x=er&&er.querySelector(".mot-err");if(x)x.hidden=true}});
function abrirAnular(t,p){const v=vistaDe(p,t);let dl=$("#h-anular");if(!dl){dl=document.createElement("dialog");dl.className="hoja";dl.id="h-anular";document.body.appendChild(dl)}
  dl.innerHTML=`<div class="asa"></div><div class="hoja-in"><div class="hoja-cab"><div><p class="note">Anular pedido</p><h2>${esc(v.nombre)}</h2></div><button type="button" class="cerrar" data-cerrar aria-label="Cerrar">×</button></div>
    <div class="confirma"><span>¿Por qué no se entregó? El pedido quedará anulado.</span><label class="motivo-l">Causa<select data-motivo><option value="">Elija la causa…</option>${MOTIVOS_ANULA.map(m=>`<option>${m}</option>`).join("")}</select></label><input data-motivo-det placeholder="Detalle (opcional)" maxlength="120"><p class="mot-err" hidden>Elija una causa.</p>
    <div class="fila2"><button class="btn sec" type="button" data-cerrar>No, volver</button><button class="btn bad" type="button" data-ok>Sí, anular</button></div></div></div>`;
  dl.onclick=async e=>{if(e.target===dl||e.target.closest("[data-cerrar]")){dl.close();return}const b=e.target.closest("[data-ok]");if(!b)return;
    const ex=leerMotivo(dl);if(!ex)return;b.disabled=true;
    const ok=t==="dom"?await cambiarDom(p,"anulado",p.chofer,ex):await cambiarRep(p,{estado:"Cancelado",...ex});
    if(ok){dl.close();aviso("Pedido anulado",v.nombre+" · "+ex.motivoAnula,false);render()}else{b.disabled=false;aviso("Sin conexión","No se pudo anular. Intente otra vez.",false)}};
  dl.showModal()}

/* ===================== Modelo común de pedido (bandeja) ===================== */
const totalDom=p=>Math.max(0,itemsDom(p).reduce((s,i)=>s+(i.precio||0)*(i.cant||0)+(i.env||0)*(i.precioEnv||0),0)-(p.dcto||0));
const totalCil=p=>FORMATOS.reduce((a,[k])=>a+(+p[k]||0),0);
const kgDe=p=>FORMATOS.reduce((a,[k])=>a+(+p[k]||0)*KG[k],0);
function vistaDe(p,tipo){
  if(tipo==="dom")return {key:"d"+p.id,tipo,p,num:"N° "+p.id,nombre:(p.nombre||"").replace(/^Ejemplo: /,"")||"Cliente "+(p.fono||""),fono:p.fono||"",
    dir:p.dir||"",comuna:p.comuna||"",items:itemsDom(p).filter(i=>i.cant>0).map(i=>({et:FORM_DOM[i.formato]||i.formato,cant:i.cant})),
    total:totalDom(p),estado:p.estado,fecha:fecha(p.fecha),origen:ORIGENES[p.origen]||"",chofer:p.chofer?nomChofer(p.chofer):"",hecho:p.entregado?fecha(p.entregado):null};
  return {key:"m"+p.id,tipo,p,num:"",nombre:p.cliente||"Cliente mayorista",fono:p.telefono||"",dir:p.direccion||"",comuna:"",
    items:FORMATOS.filter(([k])=>+p[k]>0).map(([k])=>({et:ETIQ[k],cant:+p[k]})),total:null,kg:kgDe(p),estado:MAY_EST[p.estado]||"pendiente",estadoTxt:p.estado,
    fecha:new Date(p.creado),origen:"Reparto",chofer:p.chofer?nomChofer(p.chofer):"",hecho:p.estado==="Entregado"&&p.actualizado?new Date(p.actualizado):null};
}
const todas=()=>[...lista("pedidos").map(p=>vistaDe(p,"dom")),...reparto().map(p=>vistaDe(p,"may"))];
const resumenDoc=(col,p)=>{const v=vistaDe(p,col==="pedidos"?"dom":"may");return `${v.items.map(i=>i.cant+"×"+i.et).join(", ")} · ${v.nombre} · ${v.dir}`};

/* ===================== Navegación ===================== */
const IC={bandeja:'<path d="M4 13l2.5-8h11L20 13v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>',reparto:'<path d="M9 4h6l1 2h3v14H5V6h3z"/><path d="M9 11h6M9 15h4"/>',
  camiones:'<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',choferes:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  clientes:'<path d="M4 20V9l8-5 8 5v11z"/><path d="M9 20v-6h6v6"/>',informes:'<path d="M4 20h16M7 16V10M12 16V5M17 16v-4"/>',
  ajustes:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',chofer:'<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'};
const TABS_EQUIPO=[["bandeja","Pedidos"],["reparto","Reparto mayorista"],["camiones","Camiones"],["choferes","Choferes"],["clientes","Clientes"],["informes","Informes"],["ajustes","Ajustes"]];
const TABS_CHOFER=[["chofer","Mis entregas"],["ajustes","Ajustes"]];
function pintarTabs(){
  const T=S.yo.rol==="chofer"?TABS_CHOFER:TABS_EQUIPO,pend=todas().filter(v=>v.estado==="pendiente").length;
  $("#tabs-in").innerHTML=T.map(([k,t])=>`<button class="tab" data-v="${k}" aria-current="${S.vista===k}"><svg class="i" viewBox="0 0 24 24">${IC[k]}</svg>${t}${k==="bandeja"&&pend?`<b>${pend}</b>`:""}</button>`).join("");
  $$("#tabs-in .tab").forEach(b=>b.onclick=()=>ir(b.dataset.v));
}
function ir(v){S.vista=v;grabar("vista",v);["bandeja","reparto","camiones","choferes","clientes","informes","ajustes","chofer"].forEach(x=>$("#v-"+x).hidden=x!==v);
  $("#top-tit").textContent={bandeja:"Pedidos",reparto:"Reparto mayorista",camiones:"Camiones",choferes:"Choferes",clientes:"Clientes",informes:"Informes",ajustes:"Ajustes",chofer:"Mis entregas"}[v];
  render();scrollTo(0,0)}

/* ===================== Render ===================== */
function render(){
  if(!S.yo)return;pintarTabs();
  if(S.vista==="bandeja")renderBandeja();
  else if(S.vista==="reparto")renderReparto();
  else if(S.vista==="camiones")renderCamiones();
  else if(S.vista==="choferes")renderChoferes();
  else if(S.vista==="clientes")renderClientes();
  else if(S.vista==="informes")renderInforme();
  else if(S.vista==="chofer")renderChofer();
  if($("#h-detalle").open)pintarDetalle();
}

/* ---------- Bandeja (MR Gas Pedidos) ---------- */
function reloj(v){
  const R=21,C=2*Math.PI*R;
  if(v.estado==="entregado")return `<div class="reloj v"><svg viewBox="0 0 52 52"><circle class="base" cx="26" cy="26" r="${R}"/><circle class="val" cx="26" cy="26" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b>✓</b></div>`;
  const min=Math.max(0,Math.round((Date.now()-v.fecha)/60000)),frac=Math.min(1,min/PROMESA_MIN),c=min>=100?"r":min>=60?"a":"v";
  const txt=isNaN(min)?"–":min<60?min+"′":min<600?Math.floor(min/60)+"h"+dos(min%60):"+10h";
  return `<div class="reloj ${c}" title="${isNaN(min)?"":min+" minutos esperando"}"><svg viewBox="0 0 52 52"><circle class="base" cx="26" cy="26" r="${R}"/><circle class="val" cx="26" cy="26" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}"/></svg><b>${txt}</b></div>`;
}
const recien=new Set();
function renderBandeja(){
  const all=todas(),pasa=v=>S.tipo==="todos"||v.tipo===S.tipo,cuenta={pendiente:0,ruta:0,entregado:0};
  all.filter(pasa).forEach(v=>{if(v.estado==="pendiente")cuenta.pendiente++;else if(v.estado==="ruta")cuenta.ruta++;else if(v.estado==="entregado"&&esHoy(v.hecho||v.fecha))cuenta.entregado++});
  Object.entries(cuenta).forEach(([k,n])=>$("#n-"+k).textContent=n);
  const L=all.filter(v=>pasa(v)&&v.estado===S.estado&&(S.estado!=="entregado"||esHoy(v.hecho||v.fecha)))
    .sort((a,b)=>S.estado==="entregado"?(b.hecho||b.fecha)-(a.hecho||a.fecha):a.fecha-b.fecha);
  if(!L.length){const t={pendiente:["No hay pedidos por despachar","Los pedidos que se graben en MR Gas o en Reparto mayorista llegan aquí al instante, con sonido."],
    ruta:["No hay pedidos en ruta","Despache un pedido desde «Por despachar» para verlo aquí."],entregado:["Aún no hay entregas hoy","Los pedidos entregados hoy aparecen aquí."]}[S.estado];
    $("#lista").innerHTML=`<div class="vacio"><b>${t[0]}</b><span>${t[1]}</span></div>`;return}
  $("#lista").innerHTML=L.map(v=>`<button class="ped${recien.has(v.key)?" nuevo":""}" data-key="${v.key}">${reloj(v)}
    <div style="min-width:0"><div class="ped-cab"><h3>${esc(v.nombre)}</h3>${v.num?`<span class="num">${esc(v.num)}</span>`:""}</div>
      <p class="ped-dir">${esc([v.dir,v.comuna].filter(Boolean).join(", "))||"Sin dirección"}</p>
      <div class="ped-pie">${v.items.map(i=>`<span class="cil"><b>${i.cant}</b>× ${esc(i.et)}</span>`).join("")}
        ${v.tipo==="may"?'<span class="tag may">Mayorista</span>':v.origen?`<span class="tag">${esc(v.origen)}</span>`:""}
        ${v.estado==="ruta"&&v.chofer?`<span class="tag ruta">${esc(v.chofer)}</span>`:""}
        <span class="total">${v.total!=null?clp(v.total):kgTxt(v.kg)}</span></div></div></button>`).join("");
  recien.clear();
}
$$(".est").forEach(b=>b.onclick=()=>{S.estado=b.dataset.est;$$(".est").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
$$(".chip[data-tipo]").forEach(b=>b.onclick=()=>{S.tipo=b.dataset.tipo;$$(".chip[data-tipo]").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
$("#lista").addEventListener("click",e=>{const b=e.target.closest("[data-key]");if(b)abrir(b.dataset.key)});
setInterval(()=>{if(S.yo&&S.vista==="bandeja")renderBandeja()},30000);

const ICO={fono:'<svg class="i" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  wsp:'<svg class="i" viewBox="0 0 24 24"><path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/></svg>',mapa:'<svg class="i" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'};
const buscar=k=>todas().find(v=>v.key===k);
function abrir(k){S.abierto=k;S.confirmar=false;pintarDetalle();const d=$("#h-detalle");if(!d.open)d.showModal()}
/* número para WhatsApp: celular chileno de 9 dígitos con 56 adelante */
function waNum(t){const f=String(t||"").replace(/\D/g,"").slice(-9);return f.length===9?"56"+f:f}
function pintarDetalle(){
  const v=buscar(S.abierto),el=$("#det-in");if(!v){$("#h-detalle").close();return}
  const f=String(v.fono||"").replace(/\D/g,"").slice(-9),wsp=f?(f.length===9?"56"+f:f):"";
  const mapa="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent([v.dir,v.comuna,"Chile"].filter(Boolean).join(", "));
  const estTxt=v.tipo==="may"?v.estadoTxt:{pendiente:"Por despachar",ruta:"En ruta",entregado:"Entregado",anulado:"Anulado"}[v.estado];
  const hora=d=>isNaN(d)?"":d.toLocaleString("es-CL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  const cam=v.tipo==="may"&&v.p.camionId?(S.col.camiones.get(String(v.p.camionId))||{}).patente:"";
  const filas=[["Estado",estTxt],["Recibido",hora(v.fecha)],["Teléfono",v.fono],["Dirección",[v.dir,v.comuna].filter(Boolean).join(", ")],["Cilindros",v.items.map(i=>`${i.cant} × ${i.et}`).join(", ")],
    v.tipo==="dom"?["Total",clp(v.total)+(v.p.medio?" · "+(MEDIOS[v.p.medio]||v.p.medio):"")]:["Kilos",kgTxt(v.kg)],cam?["Camión",cam]:null,
    v.p.obs||v.p.ref?["Observación",[v.p.ref,v.p.obs].filter(Boolean).join(" · ")]:null,v.chofer?["Chofer",v.chofer]:null,v.p.usuario?["Grabado por",v.p.usuario]:null].filter(x=>x&&x[1]);
  const ed=puedeEditar(),selCh=sel=>`<label>Chofer o móvil<select id="det-chofer"><option value="">Elija el chofer</option>${choferes().map(c=>`<option value="${c.id}" ${String(c.id)===String(sel)?"selected":""}>${esc(c.nombre)}${c.patente?" · "+esc(c.patente):""}</option>`).join("")}</select></label><p class="err" id="det-err" hidden>Elija el chofer antes de despachar.</p>`;
  let acc="";
  if(ed){
    if(v.estado==="pendiente")acc=selCh(v.p.chofer)+`<button class="btn full" data-acc="despachar">Despachar pedido</button><button class="btn ok full" data-acc="entregar">Marcar entregado</button>`;
    else if(v.estado==="ruta")acc=`<button class="btn ok full" data-acc="entregar">Marcar entregado</button><button class="btn sec full" data-acc="volver">Devolver a por despachar</button>`;
    else if(v.estado==="entregado")acc=`<button class="btn sec full" data-acc="volver">Reabrir pedido</button>`;
    if(v.estado!=="anulado"&&v.estado!=="entregado")acc+=S.confirmar?`<div class="confirma"><span>¿Anular este pedido? Indique la causa.</span><label class="motivo-l">Causa<select data-motivo><option value="">Elija la causa…</option>${MOTIVOS_ANULA.map(m=>`<option>${m}</option>`).join("")}</select></label><input data-motivo-det placeholder="Detalle (opcional)" maxlength="120"><p class="mot-err" hidden>Elija una causa.</p><div class="fila2"><button class="btn sec" data-acc="no">No, volver</button><button class="btn bad" data-acc="anular">Sí, anular</button></div></div>`
      :`<button class="btn sec full" data-acc="preguntar" style="color:var(--red)">Anular pedido</button>`;
  }
  el.innerHTML=`<div class="hoja-cab"><div><p class="note">${esc(v.tipo==="may"?"Pedido mayorista":v.num)}</p><h2 id="det-titulo">${esc(v.nombre)}</h2></div><button type="button" class="cerrar" data-cerrar aria-label="Cerrar">×</button></div>
    <div class="contacto"><a href="${f?"tel:+"+wsp:"#"}">${ICO.fono}Llamar</a><a href="${wsp?"https://wa.me/"+wsp:"#"}" target="_blank" rel="noopener">${ICO.wsp}WhatsApp</a><a href="${mapa}" target="_blank" rel="noopener">${ICO.mapa}Mapa</a></div>
    <div class="datos">${filas.map(([k,x])=>`<div class="dato"><span>${k}</span><b>${esc(x)}</b></div>`).join("")}</div><div class="acciones">${acc}</div>`;
}
$("#h-detalle").addEventListener("click",async e=>{
  if(e.target===e.currentTarget||e.target.closest("[data-cerrar]")){$("#h-detalle").close();return}
  const b=e.target.closest("[data-acc]");if(!b)return;const v=buscar(S.abierto);if(!v)return;const a=b.dataset.acc;
  if(a==="preguntar"){S.confirmar=true;pintarDetalle();return}if(a==="no"){S.confirmar=false;pintarDetalle();return}
  const sel=$("#det-chofer"),ch=sel&&sel.value?+sel.value:null;
  if(a==="despachar"&&!ch){$("#det-err").hidden=false;sel.focus();return}
  let ex={};if(a==="anular"){ex=leerMotivo($("#det-in"));if(!ex)return}
  b.disabled=true;let ok;
  if(v.tipo==="dom")ok=await cambiarDom(v.p,{despachar:"ruta",entregar:"entregado",volver:"pendiente",anular:"anulado"}[a],ch,ex);
  else ok=await cambiarRep(v.p,{estado:{despachar:"En ruta",entregar:"Entregado",volver:"Pendiente",anular:"Cancelado"}[a],...(a==="despachar"?{chofer:ch}:{}),...ex});
  if(ok){aviso({despachar:"Pedido despachado",entregar:"Pedido entregado",volver:"Pedido devuelto",anular:"Pedido anulado"}[a],v.nombre,false);$("#h-detalle").close()}else b.disabled=false;
});

/* ---------- Reparto mayorista (Reparto Gas Licuado) ---------- */
const activo=p=>p.estado!=="Entregado"&&p.estado!=="Cancelado";
const camOpts=sel=>`<option value="">Sin asignar</option>`+camiones().map(c=>`<option value="${esc(c.id)}"${String(c.id)===String(sel)?" selected":""}>${esc(c.patente)}</option>`).join("");
const chOpts=sel=>`<option value="">Sin chofer</option>`+choferes().map(c=>`<option value="${c.id}"${String(c.id)===String(sel)?" selected":""}>${esc(c.nombre)}</option>`).join("");
$("#p-cyl").innerHTML=FORMATOS.map(([k,t])=>`<label${k==="c15a"?' title="Aluminio, para grúa horquilla"':""}>${t}<input id="p-${k}" type="number" min="0" value="0" inputmode="numeric"><small id="s-${k}">0 kg</small></label>`).join("");
function renderReparto(){
  const P=reparto(),hoy=new Date().toDateString(),dis=puedeEditar()?"":" disabled";
  $("#k-pend").textContent=P.filter(p=>p.estado==="Pendiente").length;
  $("#k-ruta").textContent=new Set(P.filter(p=>(p.estado==="En ruta"||p.estado==="En cliente")&&p.camionId).map(p=>p.camionId)).size;
  $("#k-ent").textContent=P.filter(p=>p.estado==="Entregado"&&p.actualizado&&new Date(p.actualizado).toDateString()===hoy).length;
  $("#filtros").innerHTML=["Activos",...ESTADOS,"Todos"].map(o=>`<button type="button" class="chip" aria-pressed="${o===S.filtro}" data-f="${o}">${o}</button>`).join("");
  $$("#filtros .chip").forEach(b=>b.onclick=()=>{S.filtro=b.dataset.f;render()});
  let L=P.slice().sort((a,b)=>(b.creado||"").localeCompare(a.creado||""));
  if(S.filtro==="Activos")L=L.filter(activo);else if(S.filtro!=="Todos")L=L.filter(p=>p.estado===S.filtro);
  const selEst=p=>`<select data-id="${esc(p.id)}" data-k="estado" aria-label="Estado" class="pill ${cls(p.estado)}"${dis}>${ESTADOS.map(e=>`<option${e===p.estado?" selected":""}>${e}</option>`).join("")}</select>`;
  $("#tb-reparto").innerHTML=L.map(p=>`<tr><td class="cli" title="${esc(p.direccion)}"><b>${esc(p.cliente)}</b><small>${esc(p.direccion)}</small></td>
    ${FORMATOS.map(([k])=>{const n=+p[k]||0;return `<td class="q${n?"":" cero"}">${n||"–"}</td>`}).join("")}<td class="tot">${kgTxt(kgDe(p))}</td>
    <td><select data-id="${esc(p.id)}" data-k="camionId" aria-label="Camión"${dis}>${camOpts(p.camionId)}</select></td>
    <td><select data-id="${esc(p.id)}" data-k="chofer" aria-label="Chofer"${dis}>${chOpts(p.chofer)}</select></td><td>${selEst(p)}</td>
    <td class="num note">${fmtFecha(p.creado)}</td><td>${esAdmin()?`<button class="btn sec chico" data-del="${esc(p.id)}" type="button">Borrar</button>`:""}</td></tr>`).join("");
  const em=$("#empty-reparto");em.hidden=L.length>0;em.textContent=P.length?`No hay pedidos con el estado «${S.filtro}».`:"Aún no hay pedidos. Crea el primero en «Nuevo pedido mayorista».";
  $("#cards-reparto").innerHTML=L.map(p=>`<article class="pcard"><div class="h"><div><b>${esc(p.cliente)}</b><small>${esc(p.direccion)}</small></div><span class="kgtag">${kgTxt(kgDe(p))}</span></div>
    <div class="qchips">${FORMATOS.filter(([k])=>+p[k]>0).map(([k])=>`<span class="qchip"><b>${+p[k]}</b>× ${ETIQ[k]}</span>`).join("")}</div>
    <div class="sel"><label>Camión<select data-id="${esc(p.id)}" data-k="camionId"${dis}>${camOpts(p.camionId)}</select></label><label>Chofer<select data-id="${esc(p.id)}" data-k="chofer"${dis}>${chOpts(p.chofer)}</select></label></div>
    <div class="pie">${selEst(p)}<span class="note">${fmtFecha(p.creado)}</span>${esAdmin()?`<button class="btn sec chico" data-del="${esc(p.id)}" type="button">Borrar</button>`:""}</div></article>`).join("");
  $$("#v-reparto select[data-id]").forEach(s=>s.onchange=()=>{const p=S.col.reparto.get(s.dataset.id);if(p)cambiarRep(p,{[s.dataset.k]:s.value})});
  $$("#v-reparto [data-del]").forEach(b=>b.onclick=()=>dosClics(b,()=>guardarDoc("reparto",b.dataset.del,null)));
  $("#f-pedido").hidden=!puedeEditar();
  const cc=$("#p-camion").value;$("#p-camion").innerHTML=camOpts(cc);const ch=$("#p-chofer").value;$("#p-chofer").innerHTML=chOpts(ch);
  const cl=$("#p-cliente").value,C=clientes();
  $("#p-cliente").innerHTML=`<option value="">${C.length?"Selecciona un cliente":"Primero registra un cliente"}</option>`+C.map(c=>`<option value="${c.id}"${String(c.id)===cl?" selected":""}>${esc(c.nombre)}${c.comuna?" — "+esc(c.comuna):""}</option>`).join("");
  infoCliente();
}
function dosClics(b,fn){if(b.dataset.armed!=="1"){const t=b.textContent;b.dataset.armed="1";b.textContent="¿Seguro?";setTimeout(()=>{if(b.isConnected){b.dataset.armed="";b.textContent=t}},3000);return}fn()}
const dirCompleta=c=>[c.direccion,c.comuna].filter(Boolean).join(", ");
function infoCliente(){const c=clientes().find(x=>String(x.id)===$("#p-cliente").value);
  $("#p-cli-info").textContent=c?`${dirCompleta(c)||"Sin dirección"}${c.fono?" · "+c.fono:""}${c.contacto?" · Recibe: "+c.contacto:""}`:"Elige un cliente para ver su dirección."}
$("#p-cliente").onchange=infoCliente;
function suma(){const p={};FORMATOS.forEach(([k])=>p[k]=Math.max(0,parseInt($("#p-"+k).value)||0));FORMATOS.forEach(([k])=>$("#s-"+k).textContent=kgTxt(p[k]*KG[k]));$("#sum-kg").textContent=kgTxt(kgDe(p))}
FORMATOS.forEach(([k])=>$("#p-"+k).addEventListener("input",suma));
$("#f-pedido").addEventListener("submit",async e=>{e.preventDefault();
  const c=clientes().find(x=>String(x.id)===$("#p-cliente").value);if(!c){$("#p-msg").textContent="Elige un cliente de la lista, o regístralo en Clientes.";return}
  const iso=new Date().toISOString(),cam=$("#p-camion").value,ch=$("#p-chofer").value;
  const p={id:"r"+Date.now()+Math.floor(Math.random()*100),clienteId:c.id,cliente:c.nombre,direccion:dirCompleta(c),telefono:c.fono||"",camionId:cam,chofer:ch?+ch:null,
    estado:cam||ch?"En ruta":"Pendiente",creado:iso,actualizado:iso,fecha:ahora(),local:1,usuario:S.yo.nombre||S.yo.user};
  FORMATOS.forEach(([k])=>p[k]=Math.max(0,parseInt($("#p-"+k).value)||0));
  if(!totalCil(p)){$("#p-msg").textContent="Indica al menos un cilindro.";return}
  if(await guardarDoc("reparto",p.id,p)){$("#f-pedido").reset();suma();$("#p-msg").textContent=`Pedido agregado: ${kgTxt(kgDe(p))}.`}});

/* ---------- Camiones ---------- */
function renderCamiones(){
  const P=reparto(),dis=esAdmin();
  $("#trucks").innerHTML=camiones().map(c=>{const suyos=P.filter(p=>String(p.camionId)===String(c.id)&&activo(p)),enCli=suyos.find(p=>p.estado==="En cliente"),enR=suyos.find(p=>p.estado==="En ruta");
    const est=enCli?"En cliente":enR?"En ruta":suyos.length?"Pendiente":"Libre",ah=enCli||enR,p0=ah||suyos[0];
    return `<article class="truck"><div class="tp"><span class="plate">${esc(c.patente)}</span><span class="pill ${cls(est)}">${est==="Pendiente"?"Con pedidos":est}</span></div>
      <div style="font-weight:700;font-size:16px">${esc(c.marca)||'<span class="note">Sin marca</span>'}</div>
      <dl class="kv"><dt>Chofer</dt><dd>${p0&&p0.chofer?"<b>"+esc(nomChofer(p0.chofer))+"</b>":'<span class="note">Sin chofer asignado</span>'}</dd>
        <dt>${enCli?"En cliente":"Destino"}</dt><dd>${ah?esc(ah.cliente)+'<br><span class="note">'+esc(ah.direccion)+"</span>":'<span class="note">—</span>'}</dd><dt>Pedidos</dt><dd>${suyos.length} activos</dd></dl>
      <div class="toolbar" style="justify-content:space-between"><span class="note">Carga asignada</span><b class="num">${kgTxt(suyos.reduce((a,p)=>a+kgDe(p),0))}</b></div>
      ${dis?`<div><button class="btn sec chico" type="button" data-delc="${esc(c.id)}">Quitar camión</button></div>`:""}</article>`}).join("");
  $("#empty-camiones").hidden=camiones().length>0;$("#f-camion").hidden=!puedeEditar();
  $$("[data-delc]").forEach(b=>b.onclick=()=>dosClics(b,()=>guardarDoc("camiones",b.dataset.delc,null)));
}
$("#f-camion").addEventListener("submit",async e=>{e.preventDefault();const pat=$("#c-pat").value.trim().toUpperCase();
  if(camiones().some(x=>x.patente===pat)){$("#c-msg").textContent="Ya existe un camión con esa patente.";return}
  const c={id:"cam"+Date.now(),patente:pat,marca:$("#c-marca").value.trim()};
  if(await guardarDoc("camiones",c.id,c)){$("#f-camion").reset();$("#c-msg").textContent="Camión agregado."}});

/* ---------- Choferes ---------- */
function renderChoferes(){
  const P=reparto(),D=lista("pedidos"),hoy=new Date().toDateString();
  $("#tb-choferes").innerHTML=choferes().map(ch=>{
    const suyos=P.filter(p=>+p.chofer===+ch.id&&activo(p)),ah=suyos.find(p=>p.estado==="En cliente")||suyos.find(p=>p.estado==="En ruta"),dom=D.filter(p=>+p.chofer===+ch.id&&p.estado==="ruta");
    const est=ah||dom.length?"En ruta":suyos.length?"Pendiente":"Libre";
    const ent=P.filter(p=>+p.chofer===+ch.id&&p.estado==="Entregado"&&p.actualizado&&new Date(p.actualizado).toDateString()===hoy).length+D.filter(p=>+p.chofer===+ch.id&&p.estado==="entregado"&&esHoy(p.entregado)).length;
    return `<tr><td class="cli"><b>${esc(ch.nombre)}</b>${ch.patente?`<small>${esc(ch.patente)}</small>`:""}</td><td class="num">${esc(ch.rut)||"—"}</td><td class="num">${esc(ch.fono||ch.telefono)||"—"}</td><td>${esc(ch.licencia)||"—"}</td>
      <td><span class="pill ${cls(est)}">${est==="Pendiente"?"Con pedidos":est}</span>${ah?`<small class="note" style="display:block">${esc(ah.cliente)}</small>`:dom.length?`<small class="note" style="display:block">${dom.length} pedido(s) a domicilio</small>`:""}</td><td class="q">${ent}</td></tr>`}).join("")||'<tr><td colspan="6" class="empty">Aún no hay choferes.</td></tr>';
  $("#f-chofer").hidden=!esAdmin();
}
$("#f-chofer").addEventListener("submit",async e=>{e.preventDefault();const nom=$("#ch-nombre").value.trim();if(!nom)return;
  const ids=choferes().map(c=>+c.id||0),c={id:Math.max(0,...ids)+1,nombre:nom,rut:$("#ch-rut").value.trim(),licencia:$("#ch-lic").value,fono:$("#ch-tel").value.trim(),patente:"",local:1,activo:true};
  if(await guardarDoc("choferes",c.id,c)){$("#f-chofer").reset();$("#ch-msg").textContent="Chofer registrado."}});

/* ---------- Clientes ---------- */
function renderClientes(){
  const q=$("#cl-buscar").value.trim().toLowerCase(),C=clientes().filter(c=>!q||[c.nombre,c.rut,c.comuna,c.direccion].some(v=>String(v||"").toLowerCase().includes(q))),P=reparto();
  $("#tb-clientes").innerHTML=C.map(c=>`<tr><td class="cli"><b>${esc(c.nombre)}</b></td><td class="num">${esc(c.rut)||"—"}</td><td class="cli">${esc(c.direccion)||"—"}<small>${esc(c.comuna)}</small></td>
    <td class="cli">${esc(c.contacto)||"—"}<small>${esc(c.fono)}</small></td><td class="q">${P.filter(p=>String(p.clienteId)===String(c.id)&&activo(p)).length} activos</td></tr>`).join("");
  const em=$("#empty-clientes");em.hidden=C.length>0;em.textContent=clientes().length?"Ningún cliente coincide con la búsqueda.":"Aún no hay clientes. Registra el primero.";
  $("#f-cliente").hidden=!puedeEditar();
}
$("#cl-buscar").oninput=()=>renderClientes();
$("#f-cliente").addEventListener("submit",async e=>{e.preventDefault();
  const arr=JSON.parse(JSON.stringify(S.est.mayoristas||[])),nom=$("#cl-nombre").value.trim().replace(/\s+/g," "),rut=$("#cl-rut").value.trim();
  if(arr.some(x=>String(x.nombre||"").toLowerCase()===nom.toLowerCase())){$("#cl-msg").textContent="Ya existe un cliente con ese nombre.";return}
  if(rut&&arr.some(x=>String(x.rut||"").replace(/\W/g,"").toUpperCase()===rut.replace(/\W/g,"").toUpperCase())){$("#cl-msg").textContent="Ya existe un cliente con ese RUT.";return}
  const c={id:Math.max(0,...arr.map(x=>+x.id||0))+1,nombre:nom,rut,direccion:$("#cl-dir").value.trim(),comuna:$("#cl-comuna").value.trim(),fono:$("#cl-tel").value.trim(),contacto:$("#cl-contacto").value.trim(),local:1,lista:null};
  arr.push(c);if(await guardarDoc("estado","mayoristas",{v:arr})){$("#f-cliente").reset();$("#cl-msg").textContent="Cliente registrado. Ya puedes elegirlo en un pedido."}});

/* ---------- Informes ---------- */
$("#inf-fecha").value=isoLocal(new Date());
function rango(){const [y,m,d]=($("#inf-fecha").value||isoLocal(new Date())).split("-").map(Number);let ini,fin,nombre;
  if(S.periodo==="dia"){ini=new Date(y,m-1,d);fin=new Date(y,m-1,d+1);nombre="Diario "+isoLocal(ini)}
  else if(S.periodo==="semana"){const b=new Date(y,m-1,d),w=(b.getDay()+6)%7;ini=new Date(y,m-1,d-w);fin=new Date(y,m-1,d-w+7);nombre="Semanal "+isoLocal(ini)}
  else if(S.periodo==="mes"){ini=new Date(y,m-1,1);fin=new Date(y,m,1);nombre=`Mensual ${y}-${dos(m)}`}
  else{ini=new Date(y,0,1);fin=new Date(y+1,0,1);nombre="Anual "+y}
  return {ini,fin,nombre}}
const fLarga=d=>d.toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
function datosInf(){const {ini,fin,nombre}=rango(),L=reparto().filter(p=>{const t=new Date(p.creado);return t>=ini&&t<fin}).sort((a,b)=>(a.creado||"").localeCompare(b.creado||"")),V=L.filter(p=>p.estado!=="Cancelado");
  const cam=Object.fromEntries(camiones().map(c=>[c.id,c.patente]));
  const ag=fn=>{const m={};L.forEach(p=>{const k=fn(p)||"Sin asignar",g=m[k]||(m[k]={nombre:k,pedidos:0,entregados:0,cancelados:0,cil:0,kg:0});g.pedidos++;if(p.estado==="Entregado")g.entregados++;if(p.estado==="Cancelado")g.cancelados++;else{g.cil+=totalCil(p);g.kg+=kgDe(p)}});return Object.values(m).sort((a,b)=>b.kg-a.kg)};
  return {ini,fin,nombre,L,V,porEst:Object.fromEntries(ESTADOS.map(e=>[e,L.filter(p=>p.estado===e).length])),fmt:FORMATOS.map(([k,t])=>{const c=V.reduce((a,p)=>a+(+p[k]||0),0);return {formato:t,cil:c,kg:c*KG[k]}}),
    porCli:ag(p=>p.cliente),porCho:ag(p=>nomChofer(p.chofer)),porCam:ag(p=>cam[p.camionId]),cam}}
function renderInforme(){const r=datosInf();
  $("#inf-rango").textContent=S.periodo==="dia"?"Periodo: "+fLarga(r.ini):`Periodo: ${fLarga(r.ini)} al ${fLarga(new Date(r.fin-1))}`;
  $("#inf-kpis").innerHTML=[["Pedidos",r.L.length],["Entregados",r.porEst.Entregado],["Cancelados",r.porEst.Cancelado],["Cilindros",r.V.reduce((a,p)=>a+totalCil(p),0)],["Kg de gas",r.V.reduce((a,p)=>a+kgDe(p),0).toLocaleString("es-CL")]].map(([t,v])=>`<div class="kpi"><small>${t}</small><b>${v}</b></div>`).join("");
  const vac=n=>`<tr><td colspan="${n}" class="note">Sin pedidos en este periodo.</td></tr>`;
  $("#inf-cli").innerHTML=r.porCli.map(g=>`<tr><td>${esc(g.nombre)}</td><td class="q">${g.pedidos}</td><td class="q">${g.cil}</td><td class="q">${g.kg.toLocaleString("es-CL")}</td></tr>`).join("")||vac(4);
  $("#inf-cho").innerHTML=r.porCho.map(g=>`<tr><td>${esc(g.nombre)}</td><td class="q">${g.pedidos}</td><td class="q">${g.entregados}</td><td class="q">${g.kg.toLocaleString("es-CL")}</td></tr>`).join("")||vac(4);
  $("#inf-cam").innerHTML=r.porCam.map(g=>`<tr><td>${g.nombre==="Sin asignar"?esc(g.nombre):'<span class="plate">'+esc(g.nombre)+"</span>"}</td><td class="q">${g.pedidos}</td><td class="q">${g.entregados}</td><td class="q">${g.kg.toLocaleString("es-CL")}</td></tr>`).join("")||vac(4);
  $("#inf-fmt").innerHTML=r.fmt.map(f=>`<tr><td>${f.formato}</td><td class="q">${f.cil}</td><td class="q">${f.kg.toLocaleString("es-CL")}</td></tr>`).join("")}
$$("#inf-periodos .chip").forEach(b=>b.onclick=()=>{S.periodo=b.dataset.p;$$("#inf-periodos .chip").forEach(x=>x.setAttribute("aria-pressed",x===b));renderInforme()});
$("#inf-fecha").onchange=renderInforme;
$("#inf-btn").onclick=()=>{const msg=$("#inf-msg");if(!window.XLSX){msg.textContent="No se pudo cargar el generador de Excel. Recargue la página.";return}
  const r=datosInf(),fF=s=>{const d=new Date(s);return isNaN(d)?"":d.toLocaleString("es-CL",{dateStyle:"short",timeStyle:"short"})};
  const res=[["Informe de reparto a mayoristas — MR Gas"],["Periodo",r.nombre],["Desde",fLarga(r.ini)],["Hasta",fLarga(new Date(r.fin-1))],["Generado",new Date().toLocaleString("es-CL")],[],["Total pedidos",r.L.length],...ESTADOS.map(e=>[e,r.porEst[e]]),[],["Formato","Cilindros","Kg"],...r.fmt.map(f=>[f.formato,f.cil,f.kg])];
  const det=r.L.map(p=>({"Fecha":fF(p.creado),"Cliente":p.cliente,"Dirección":p.direccion,"Teléfono":p.telefono||"","Camión":r.cam[p.camionId]||"","Chofer":nomChofer(p.chofer),"5 kg":+p.c5||0,"11 kg":+p.c11||0,"15 kg":+p.c15||0,"45 kg":+p.c45||0,"15 kg Al":+p.c15a||0,"Total cilindros":totalCil(p),"Kg":kgDe(p),"Estado":p.estado}));
  const gr=(a,c)=>a.map(g=>({[c]:g.nombre,"Pedidos":g.pedidos,"Entregados":g.entregados,"Cancelados":g.cancelados,"Cilindros":g.cil,"Kg":g.kg}));
  const wb=XLSX.utils.book_new(),add=(ws,n)=>XLSX.utils.book_append_sheet(wb,ws,n);
  add(XLSX.utils.aoa_to_sheet(res),"Resumen");add(det.length?XLSX.utils.json_to_sheet(det):XLSX.utils.aoa_to_sheet([["Sin pedidos en este periodo"]]),"Pedidos");
  add(XLSX.utils.json_to_sheet(gr(r.porCli,"Cliente")),"Por cliente");add(XLSX.utils.json_to_sheet(gr(r.porCho,"Chofer")),"Por chofer");add(XLSX.utils.json_to_sheet(gr(r.porCam,"Camión")),"Por camión");
  XLSX.writeFile(wb,`Informe ${r.nombre}.xlsx`);msg.textContent="Informe descargado."};

/* ---------- Vista del chofer: domicilio + mayoristas ---------- */
const SIG={"Pendiente":["En ruta","Iniciar viaje"],"En ruta":["En cliente","Llegué al cliente"],"En cliente":["Entregado","Confirmar entrega"]};
function misPedidos(){
  const yo=S.yo.chofer,OD=leer("ordenDom",{}),dom=lista("pedidos").filter(p=>+p.chofer===+yo).map(p=>({t:"dom",p,orden:OD[p.id]??fecha(p.despacho||p.fecha).getTime(),pend:p.estado==="ruta",ent:p.estado==="entregado"&&esHoy(p.entregado)}));
  const may=reparto().filter(p=>+p.chofer===+yo).map(p=>({t:"may",p,orden:typeof p.orden==="number"?p.orden:Date.parse(p.creado||0),pend:activo(p),ent:p.estado==="Entregado"&&esHoy(p.actualizado)}));
  return [...dom,...may]}
function renderChofer(){
  const ch=S.col.choferes.get(String(S.yo.chofer)),nombre=(ch&&ch.nombre)||S.yo.nombre||S.yo.user;
  $("#cv-hola").textContent="Hola, "+String(nombre).split(" ")[0];const f=new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"});$("#cv-fecha").textContent=f.charAt(0).toUpperCase()+f.slice(1);
  if(S.yo.chofer==null){$("#cv-lista").innerHTML='<div class="vacio"><b>Tu cuenta no tiene chofer asignado</b>Pide al administrador que la conecte con tu nombre en MR Gas.</div>';return}
  const M=misPedidos(),pend=M.filter(x=>x.pend).sort((a,b)=>a.orden-b.orden),ent=M.filter(x=>x.ent);
  const cil=x=>x.t==="dom"?itemsDom(x.p).reduce((a,i)=>a+(i.cant||0),0):totalCil(x.p);
  $("#cv-k-pend").textContent=pend.length;$("#cv-k-cil").textContent=pend.reduce((a,x)=>a+cil(x),0);$("#cv-k-ent").textContent=ent.length;
  $("#cv-tab-pend").setAttribute("aria-pressed",S.cvTab==="pend");$("#cv-tab-ent").setAttribute("aria-pressed",S.cvTab==="ent");
  const L=S.cvTab==="pend"?pend:ent;
  if(!L.length){$("#cv-lista").innerHTML=S.cvTab==="pend"?'<div class="vacio"><b>No tienes pedidos pendientes</b>Cuando te asignen uno, aparecerá aquí con sonido.</div>':'<div class="vacio"><b>Aún no entregas pedidos hoy</b>Los pedidos que entregues aparecerán aquí.</div>';return}
  $("#cv-lista").innerHTML=L.map((x,i)=>{const p=x.p,v=vistaDe(p,x.t),sig=S.cvTab==="pend"&&i===0,tel=v.fono,maps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((v.dir||"")+", Chile");
    const accion=x.t==="may"?SIG[p.estado]:["entregado","Confirmar entrega"],key=x.t+"|"+p.id;
    const cam=x.t==="may"&&p.camionId?(S.col.camiones.get(String(p.camionId))||{}).patente:"";
    return `<article class="pc${sig?" sig":""}${S.cvTab==="ent"?" hecho":""}"><div class="tp"><span class="n">${S.cvTab==="pend"?i+1:"✓"}</span>
      <div class="cl">${sig?"<small>Siguiente entrega</small>":""}<b>${esc(v.nombre)}</b></div><span class="tag ${x.t==="may"?"may":"ruta"}">${x.t==="may"?esc(p.estado):"Domicilio"}</span></div>
      <div class="body"><div class="dir"><p>${esc(v.dir)||"Sin dirección"}${tel?`<small>Tel: ${esc(tel)}</small>`:""}${p.obs?`<small>${esc(p.obs)}</small>`:""}</p>${v.dir?`<a class="maps" href="${maps}" target="_blank" rel="noopener">${ICO.mapa}Mapa</a>`:""}</div>
        <div class="qchips">${v.items.map(it=>`<span class="qchip"><b>${it.cant}</b>× ${esc(it.et)}</span>`).join("")}</div>
        <div class="kgline"><span>${x.t==="may"?(cam?'Camión <span class="plate">'+esc(cam)+"</span>":"Sin camión"):(MEDIOS[p.medio]||"")}</span><span class="kgtag">${x.t==="may"?kgTxt(v.kg):clp(v.total)}</span></div></div>
      <div class="acts">${S.cvTab==="pend"&&accion?`<button type="button" class="btn go${accion[0].toLowerCase()==="entregado"?" ok":""}" data-go="${key}" data-to="${accion[0]}">${accion[1]}</button>`:""}
        ${S.cvTab==="pend"?`<div class="mini"><button type="button" data-mv="${key}" data-d="-1"${i===0?" disabled":""}>▲ Subir</button><button type="button" data-mv="${key}" data-d="1"${i===L.length-1?" disabled":""}>▼ Bajar</button><button type="button" class="anu" data-anu="${key}">Anular</button>${tel?`<a href="tel:${esc(String(tel).replace(/[^\d+]/g,""))}">Llamar</a>`:""}</div>`
          :`<div class="mini"><button type="button" data-undo="${key}">Deshacer entrega</button></div>`}</div></article>`}).join("");
  const get=k=>{const [t,id]=k.split("|");return {t,p:S.col[t==="dom"?"pedidos":"reparto"].get(id)}};
  $$("#cv-lista [data-go]").forEach(b=>b.onclick=async()=>{const fin=b.dataset.to.toLowerCase()==="entregado";
    if(fin&&b.dataset.armed!=="1"){b.dataset.armed="1";b.classList.add("armed");b.textContent="Toca otra vez para confirmar";setTimeout(()=>{if(b.isConnected){b.dataset.armed="";b.classList.remove("armed");b.textContent="Confirmar entrega"}},4000);return}
    b.disabled=true;const {t,p}=get(b.dataset.go);if(!p)return;const ok=t==="dom"?await cambiarDom(p,"entregado"):await cambiarRep(p,{estado:b.dataset.to});
    $("#cv-msg").textContent=ok?(fin?"Entrega registrada.":"Estado actualizado: "+b.dataset.to+"."):"No se pudo guardar.";if(!ok)b.disabled=false});
  $$("#cv-lista [data-mv]").forEach(b=>b.onclick=async()=>{const arr=pend.slice(),i=arr.findIndex(x=>x.t+"|"+x.p.id===b.dataset.mv),j=i+(+b.dataset.d);if(i<0||j<0||j>=arr.length)return;
    [arr[i],arr[j]]=[arr[j],arr[i]];$("#cv-msg").textContent="Guardando orden…";
    for(let k=0;k<arr.length;k++){const x=arr[k];if(x.t==="may")await cambiarRep(x.p,{orden:k});else{const OD=leer("ordenDom",{});OD[x.p.id]=k;grabar("ordenDom",OD)}}
    $("#cv-msg").textContent="Orden guardado.";render()});
  $$("#cv-lista [data-anu]").forEach(b=>b.onclick=()=>{const {t,p}=get(b.dataset.anu);if(p)abrirAnular(t,p)});
  $$("#cv-lista [data-undo]").forEach(b=>b.onclick=async()=>{b.disabled=true;const {t,p}=get(b.dataset.undo);if(!p)return;const ok=t==="dom"?await cambiarDom(p,"ruta",p.chofer):await cambiarRep(p,{estado:"En cliente"});$("#cv-msg").textContent=ok?"Entrega deshecha.":"No se pudo guardar."});
}
$("#cv-tab-pend").onclick=()=>{S.cvTab="pend";renderChofer()};$("#cv-tab-ent").onclick=()=>{S.cvTab="ent";renderChofer()};

/* ===================== Avisos: pantalla, sonido, vibración y notificación ===================== */
let audio=null;
function desbloquear(){try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A()}if(audio&&audio.state==="suspended")audio.resume()}catch(e){}}
document.addEventListener("pointerdown",desbloquear,{passive:true});
function sonarSuave(){if(!leer("sonido",true)||!audio)return;try{const t=audio.currentTime;[[880,0],[1175,.18],[880,.36]].forEach(([f,d])=>{const o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.value=f;
  g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.35,t+d+.02);g.gain.exponentialRampToValueAtTime(.001,t+d+.16);o.connect(g).connect(audio.destination);o.start(t+d);o.stop(t+d+.18)})}catch(e){}}
/* ---------- Alarma de pedido asignado: suena pedido a pedido hasta que el chofer toca «Ver pedido» ---------- */
const esMio=(col,x)=>S.yo&&S.yo.chofer!=null&&+x.chofer===+S.yo.chofer&&(col==="pedidos"?x.estado==="ruta":!["entregado","anulado"].includes(MAY_EST[x.estado]||""));
// timbre generado (WAV) para el respaldo con <audio>, que algunos celulares reproducen mejor
const TIMBRE=(()=>{const sr=22050,dur=1.3,n=Math.floor(sr*dur),b=new DataView(new ArrayBuffer(44+n*2)),w=(o,t)=>[...t].forEach((c,i)=>b.setUint8(o+i,c.charCodeAt(0)));
  w(0,"RIFF");b.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,sr,true);b.setUint32(28,sr*2,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,"data");b.setUint32(40,n*2,true);
  const notas=[[988,0,.22],[1319,.25,.22],[988,.5,.22],[1319,.75,.45]];
  for(let i=0;i<n;i++){const t=i/sr;let v=0;for(const [f,a,d] of notas)if(t>=a&&t<a+d){const e=Math.min(1,(t-a)/.01,(a+d-t)/.03);v+=Math.sin(2*Math.PI*f*t)*e*.9+Math.sin(4*Math.PI*f*t)*e*.15}
    b.setInt16(44+i*2,Math.max(-1,Math.min(1,v))*32000,true)}
  return URL.createObjectURL(new Blob([b],{type:"audio/wav"}))})();
const audioEl=new Audio(TIMBRE);audioEl.preload="auto";
let audioListo=false;
function desbloquearTodo(){desbloquear();if(!audioListo){audioEl.muted=true;audioEl.play().then(()=>{audioEl.pause();audioEl.currentTime=0;audioEl.muted=false;audioListo=true;pintarSonido()}).catch(()=>{})}pintarSonido()}
document.addEventListener("pointerdown",desbloquearTodo,{passive:true});document.addEventListener("keydown",desbloquearTodo);
function sonidoBloqueado(){return !(audioListo||(audio&&audio.state==="running"))}
function pintarSonido(){const b=document.getElementById("sonido-bloq");if(b)b.hidden=!(S.yo&&leer("sonido",true)&&sonidoBloqueado())}
function sonar(){if(!leer("sonido",true))return;
  if(audioListo){try{audioEl.currentTime=0;audioEl.volume=1;audioEl.play().catch(()=>sonarSuave())}catch(e){sonarSuave()}}else sonarSuave()}
const ALARMA={cola:[],timer:null,hasta:0};
function alarma(col,x){const key=(col==="pedidos"?"d":"m")+x.id;if(ALARMA.cola.some(a=>a.key===key))return;
  ALARMA.cola.push({key,col,x});
  if(document.hidden&&window.Notification&&Notification.permission==="granted"&&navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification("Nuevo pedido asignado",{body:resumenDoc(col,x),icon:"../icons/icon-192.png",tag:col+"-"+x.id,renotify:true,requireInteraction:true,vibrate:[400,150,400,150,800]})).catch(()=>{});
  pintarAlarma()}
function pintarAlarma(){const dl=$("#alarma");const a=ALARMA.cola[0];
  if(!a){dl.hidden=true;clearInterval(ALARMA.timer);ALARMA.timer=null;document.title="MR Gas Repartidores";return}
  const v=vistaDe(a.x,a.col==="pedidos"?"dom":"may");
  $("#al-num").textContent=ALARMA.cola.length>1?`Pedido 1 de ${ALARMA.cola.length}`:(v.num||"Pedido mayorista");
  $("#al-cli").textContent=v.nombre;$("#al-dir").textContent=[v.dir,v.comuna].filter(Boolean).join(", ")||"Sin dirección";
  $("#al-items").innerHTML=v.items.map(i=>`<span class="qchip"><b>${i.cant}</b>× ${esc(i.et)}</span>`).join("");
  $("#al-ok").textContent=ALARMA.cola.length>1?"Ver pedido · siguiente →":"Ver pedido";
  dl.hidden=false;document.title="🔔 Nuevo pedido · MR Gas";
  if(!ALARMA.timer){ALARMA.hasta=Date.now()+3*60000;const tic=()=>{if(Date.now()>ALARMA.hasta){clearInterval(ALARMA.timer);ALARMA.timer=null;return}
      sonar();if(leer("vibrar",true)&&navigator.vibrate)try{navigator.vibrate([400,150,400,150,800])}catch(e){}};
    tic();ALARMA.timer=setInterval(tic,3000)}}
function verAlarma(){desbloquearTodo();const a=ALARMA.cola.shift();if(navigator.vibrate)try{navigator.vibrate(0)}catch(e){}
  clearInterval(ALARMA.timer);ALARMA.timer=null;
  if(a){S.cvTab="pend";if(S.vista!=="chofer")ir("chofer");else renderChofer();
    setTimeout(()=>{const el=document.querySelector(`[data-go="${a.col==="pedidos"?"dom":"may"}|${a.x.id}"]`);const art=el&&el.closest("article");if(art){art.scrollIntoView({block:"center",behavior:"smooth"});art.classList.add("resalta");setTimeout(()=>art.classList.remove("resalta"),2500)}},150)}
  pintarAlarma()}
let ultSon=0;function sonarEnCola(){const t=Math.max(Date.now(),ultSon+2200);ultSon=t;setTimeout(sonar,t-Date.now())} // varios pedidos juntos: un sonido por pedido
let toastT,toastKey=null;
function aviso(t,c,alerta,key){const z=$("#toast");z.querySelector("b").textContent=t;z.querySelector("span").textContent=c||"";toastKey=key||null;z.classList.add("ver");clearTimeout(toastT);toastT=setTimeout(()=>z.classList.remove("ver"),alerta?8000:3500);
  if(alerta){sonarEnCola();if(leer("vibrar",true)&&navigator.vibrate)try{navigator.vibrate([200,100,200])}catch(e){}
    if(document.hidden&&window.Notification&&Notification.permission==="granted"&&navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:c,icon:"../icons/icon-192.png",tag:key||"mrgas"})).catch(()=>{})}}
$("#al-ok").onclick=verAlarma;$("#sonido-bloq").onclick=()=>{desbloquearTodo();sonar()};
// mantener la pantalla encendida mientras el chofer tiene la app abierta (si el celular lo permite)
let wakeLock=null;async function pedirPantalla(){try{if(S.yo&&S.yo.rol==="chofer"&&leer("pantalla",true)&&"wakeLock" in navigator&&!document.hidden&&!wakeLock){wakeLock=await navigator.wakeLock.request("screen");wakeLock.addEventListener("release",()=>wakeLock=null)}}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){pedirPantalla();pintarSonido();if(ALARMA.cola.length)pintarAlarma()}});
$("#toast").onclick=()=>{$("#toast").classList.remove("ver");if(toastKey&&buscar(toastKey)&&S.yo.rol!=="chofer"){ir("bandeja");abrir(toastKey)}};
function llego(v){recien.add(v.key);aviso(v.tipo==="dom"?`Nuevo pedido ${v.num}`:"Nuevo pedido mayorista",`${v.items.map(i=>i.cant+"×"+i.et).join(", ")} · ${v.nombre} · ${v.dir}`,true,v.key)}

/* ===================== Sesión ===================== */
async function entrar(perfil){
  if(perfil.rol!=="admin"&&Array.isArray(perfil.permisos)&&perfil.permisos.includes("_v2")&&!perfil.permisos.includes("app.repartidores")){
    $("#v-app").hidden=true;$("#v-login").hidden=false;const e=$("#lg-err");e.textContent="Su usuario no tiene permiso para la App repartidores. Pídalo al administrador en Panel General → Configuraciones → Usuarios y permisos.";e.hidden=false;return}
  S.yo=perfil;$("#v-login").hidden=true;$("#v-app").hidden=false;
  $("#top-sub").textContent=`${perfil.nombre||perfil.user} · ${perfil.rol==="chofer"?"Repartidor":perfil.rol==="admin"?"Administrador":"Encargado"}`;
  $("#aj-yo").textContent=`${perfil.nombre||perfil.user} (${perfil.rol==="chofer"?"Repartidor":perfil.rol==="admin"?"Administrador":"Encargado"})`;
  try{const j=await api("cambios",null,"&desde=0");aplicar(j.docs,true);S.ver=j.ver}catch(e){aviso("Sin conexión","No se pudieron cargar los pedidos. Reintentando…",false)}
  activarPush(false).then(pintarBannerPush);pintarSonido();pedirPantalla();
  S.listo=true;const v=leer("vista",null),ok=(perfil.rol==="chofer"?TABS_CHOFER:TABS_EQUIPO).some(t=>t[0]===v);
  ir(ok?v:perfil.rol==="chofer"?"chofer":"bandeja");clearTimeout(S.timer);S.timer=setTimeout(sondear,4000);
}
function salir(msg){clearTimeout(S.timer);ALARMA.cola=[];clearInterval(ALARMA.timer);ALARMA.timer=null;$("#alarma").hidden=true;bajaPush().finally(()=>api("salir",{}).catch(()=>{}));S.yo=null;S.listo=false;S.ver=0;Object.values(S.col).forEach(m=>m.clear());S.est={};
  $("#v-app").hidden=true;$("#v-login").hidden=false;const e=$("#lg-err");e.textContent=msg||"";e.hidden=!msg}
$("#b-salir").onclick=()=>salir();
$("#f-login").addEventListener("submit",async e=>{e.preventDefault();desbloquear();const err=$("#lg-err"),btn=$("#lg-btn");err.hidden=true;btn.disabled=true;btn.textContent="Ingresando…";
  try{const u=$("#lg-user").value.trim().toLowerCase(),j=await api("login",{user:u,pass:$("#lg-pass").value,app:"repartidores"});grabar("usuario",u);$("#f-login").reset();$("#lg-user").value=u;await entrar(j.perfil)}
  catch(x){err.textContent=x.status===401||x.status===403?x.message:"No hay conexión con el servidor. Revise la señal y vuelva a intentar.";err.hidden=false}
  finally{btn.disabled=false;btn.textContent="Ingresar"}});

/* ajustes */
$("#aj-sonido").checked=leer("sonido",true);$("#aj-sonido").onchange=e=>grabar("sonido",e.target.checked);
$("#aj-vibrar").checked=leer("vibrar",true);$("#aj-vibrar").onchange=e=>grabar("vibrar",e.target.checked);
$("#aj-pantalla").checked=leer("pantalla",true);$("#aj-pantalla").onchange=e=>{grabar("pantalla",e.target.checked);if(!e.target.checked&&wakeLock){wakeLock.release();wakeLock=null}else pedirPantalla()};
$("#aj-probar").onclick=()=>{desbloquearTodo();if(S.yo&&S.yo.rol==="chofer")alarma("pedidos",{id:"prueba",num:"Prueba",nombre:"Pedido de prueba",dir:"Así suena un pedido asignado",items:[{formato:"c15",cant:1}],estado:"ruta",chofer:S.yo.chofer});else aviso("Así suena un pedido nuevo","Este aviso aparece cada vez que llega un pedido.",true)};

/* ===================== Avisos con la app cerrada o la pantalla bloqueada (push) ===================== */
const PUSH_APP="repartidores";
const pushSoportado=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window&&location.protocol==="https:";
const esIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const instalada=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const bytesDe=b=>{const s=atob(b.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((b.length+3)%4));return Uint8Array.from(s,c=>c.charCodeAt(0))};
async function activarPush(pedir){
  if(!pushSoportado())return esIOS()&&!instalada()?"ios":"no";
  if(Notification.permission==="denied")return "bloq";
  if(Notification.permission!=="granted"){if(!pedir)return "falta";if(await Notification.requestPermission()!=="granted")return "bloq"}
  try{const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
    const {clave}=await api("push_clave"),kb=bytesDe(clave);
    if(sub&&sub.options&&sub.options.applicationServerKey){const a=new Uint8Array(sub.options.applicationServerKey);if(a.length!==kb.length||a.some((x,i)=>x!==kb[i])){await sub.unsubscribe().catch(()=>{});sub=null}}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:kb});
    await api("push_alta",{...sub.toJSON(),app:PUSH_APP});return "ok"}
  catch(e){return "error"}}
async function bajaPush(){try{if(!pushSoportado())return;const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();
  if(sub)await api("push_baja",{endpoint:sub.endpoint})}catch(e){}}
const PUSH_TXT={ok:"Listo: este celular avisará cada pedido aunque la app esté cerrada o la pantalla bloqueada.",
  ios:"En iPhone primero instale la app: en Safari toque Compartir → «Agregar a pantalla de inicio», ábrala desde ese ícono y active los avisos.",
  no:"Este navegador no permite avisos con la app cerrada. Use Chrome en Android o Safari en iPhone (app instalada).",
  bloq:"Los avisos están bloqueados. Actívelos en Ajustes del celular → Notificaciones → navegador o app MR Gas.",
  error:"No se pudo activar. Revise la señal e intente otra vez.",falta:""};
function pintarBannerPush(){const b=document.getElementById("push-banner");if(!b)return;
  const ver=pushSoportado()?Notification.permission==="default":esIOS()&&!instalada();
  b.hidden=!ver;b.querySelector("span").textContent=pushSoportado()?"Active los avisos para enterarse de cada pedido con el celular bloqueado.":PUSH_TXT.ios;
  b.querySelector("button").hidden=!pushSoportado()}
$("#aj-push").onclick=async()=>{desbloquear();const m=$("#aj-push-msg");m.textContent="Activando…";const r=await activarPush(true);m.textContent=PUSH_TXT[r]||"";pintarBannerPush()};
$("#push-activar").onclick=async()=>{desbloquear();const r=await activarPush(true);pintarBannerPush();aviso(r==="ok"?"Avisos activados":"Avisos",PUSH_TXT[r]||"",false)};
$("#aj-push-prueba").onclick=async()=>{const m=$("#aj-push-msg");m.textContent="Activando…";const r=await activarPush(true);if(r!=="ok"){m.textContent=PUSH_TXT[r]||"No se pudo activar.";return}
  try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();await api("push_prueba",{endpoint:sub?sub.endpoint:"",espera:10});
    m.textContent="Listo. BLOQUEE LA PANTALLA AHORA: en 10 segundos debería llegar «Prueba de aviso» con sonido. Si no llega, toque «Revisar avisos paso a paso».";if(navigator.vibrate)navigator.vibrate(100)}catch(e){m.textContent=e.message}};
async function diagnostico(){const out=$("#aj-diag-out");out.hidden=false;out.innerHTML="";
  const paso=(ok,t,ayuda)=>{out.insertAdjacentHTML("beforeend",`<li class="${ok===true?"ok":ok===false?"mal":"aviso"}"><b>${ok===true?"✓":ok===false?"✗":"!"}</b> ${t}${ayuda?`<small>${ayuda}</small>`:""}</li>`);return ok};
  const ua=navigator.userAgent,ios=esIOS(),and=/android/i.test(ua);
  paso(true,`Celular: ${ios?"iPhone/iPad":and?"Android":"computador"} · ${/CriOS|Chrome/i.test(ua)?"Chrome":/Safari/i.test(ua)?"Safari":/Firefox/i.test(ua)?"Firefox":"otro navegador"}${instalada()?" · app instalada":" · abierta en el navegador"}`);
  if(location.protocol!=="https:")return paso(false,"El sitio no está en https","Active el candado SSL en Hostinger (hPanel → Seguridad → SSL) y abra la app con https://.");
  if(ios&&!instalada())return paso(false,"En iPhone la app debe estar instalada","Safari → Compartir → «Agregar a pantalla de inicio». Luego ábrala SOLO desde ese ícono y vuelva a revisar. Requiere iOS 16.4 o más nuevo.");
  if(!pushSoportado())return paso(false,"Este navegador no recibe avisos con la app cerrada",and?"Use Google Chrome.":"Use Chrome en Android o Safari en iPhone (app instalada).");
  paso(true,"El navegador permite avisos");
  const perm=Notification.permission;
  if(perm==="denied")return paso(false,"Las notificaciones están BLOQUEADAS para este sitio",and?"Mantenga presionado el ícono de la app (o en Chrome: ⋮ → Configuración → Configuración de sitios → Notificaciones) y permita las notificaciones de este sitio. Luego vuelva a revisar.":"Ajustes del iPhone → Notificaciones → MR Gas → Permitir notificaciones.");
  if(perm!=="granted"){paso(null,"Falta dar permiso de notificaciones","Toque «Activar avisos con la pantalla bloqueada» y acepte.");return}
  paso(true,"Permiso de notificaciones concedido");
  let reg=null;try{reg=await Promise.race([navigator.serviceWorker.ready,new Promise(r=>setTimeout(()=>r(null),5000))])}catch(e){}
  if(!reg)return paso(false,"El servicio de avisos de la app no está activo","Cierre la app por completo y ábrala de nuevo. Si sigue, borre los datos del sitio y vuelva a entrar.");
  paso(true,"Servicio de avisos de la app activo");
  const r=await activarPush(true);let sub=await reg.pushManager.getSubscription();
  if(r!=="ok"||!sub)return paso(false,"No se pudo registrar este celular",PUSH_TXT[r]||"Intente otra vez con buena señal.");
  paso(true,"Celular registrado para avisos",`Servicio: ${new URL(sub.endpoint).host}`);
  let d=null;try{d=await api("push_diag",{endpoint:sub.endpoint})}catch(e){return paso(false,"No hay conexión con el servidor",e.message)}
  paso(d.https?true:null,d.https?"Servidor con https":"El servidor no informa https","Revise que el candado SSL esté activo.");
  if(!d.openssl)return paso(false,"El servidor no puede cifrar los avisos (OpenSSL)",(d.openssl_error||"")+" · En Hostinger: hPanel → Avanzado → Configuración de PHP → active las extensiones openssl y curl, PHP 8.1 o más nuevo.");
  if(!d.curl)return paso(false,"El servidor no puede enviar avisos (cURL desactivado)","En Hostinger: hPanel → Avanzado → Configuración de PHP → active la extensión curl.");
  paso(true,"El servidor puede cifrar y enviar avisos");
  paso(d.este_registrado,d.este_registrado?"Este celular está guardado en el servidor":"Este celular NO quedó guardado en el servidor","Toque de nuevo «Activar avisos».");
  try{const j=await api("push_prueba",{endpoint:sub.endpoint});const x=(j.detalle||[])[0]||{};
    if(j.enviados)paso(true,`El servidor envió un aviso de prueba (respuesta ${x.code||"OK"})`,"Debió aparecer «Prueba de aviso». Si llegó con la app abierta pero NO con la pantalla bloqueada, revise abajo.");
    else paso(false,`El servicio de avisos rechazó el envío (código ${x.code||"?"})`,(x.error||"")+(x.code===403||x.code===401?" · La llave cambió: toque «Activar avisos» otra vez.":x.code===0?" · Hostinger no pudo conectarse al servicio de avisos.":""))}
  catch(e){paso(false,"Falló la prueba",e.message)}
  paso(null,"Si con la pantalla bloqueada sigue sin sonar, revise el celular:",and?"1) Ajustes → Apps → Chrome (o MR Gas) → Notificaciones: activadas, con sonido y «Prioridad alta / Emergente». 2) Ajustes → Batería → Chrome/MR Gas: «Sin restricciones». 3) Que no esté en modo No molestar ni en silencio.":"1) Ajustes → Notificaciones → MR Gas: Permitir, Sonidos y Pantalla bloqueada activados. 2) Que no esté en modo Concentración/No molestar ni con el interruptor de silencio.")}
$("#aj-diag").onclick=()=>{desbloquearTodo();diagnostico()};
let instEv=null;addEventListener("beforeinstallprompt",e=>{e.preventDefault();instEv=e;$("#aj-instalar").hidden=false});
$("#aj-instalar").onclick=async()=>{if(!instEv)return;instEv.prompt();await instEv.userChoice.catch(()=>{});instEv=null;$("#aj-instalar").hidden=true};
try{if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{})}catch(e){}

/* recuerda el usuario: el chofer solo escribe la clave del día */
{const u=leer("usuario","");if(u&&$("#lg-user")){$("#lg-user").value=u}}
/* inicio: si ya hay sesión de MR Gas en este navegador, entra solo */
(async()=>{if(!location.protocol.startsWith("http"))return;try{const j=await api("yo");if(j.perfil)entrar(j.perfil)}catch(e){}})();

/* ===================== UBICACIÓN EN VIVO (solo repartidores) =====================
   Mientras la app está abierta, el teléfono del repartidor manda su posición cada ~30 segundos
   para que la oficina vea los camiones en el mapa (Panel General → Asigna Ruta → Mapa en vivo).
   Con la app cerrada o la pantalla bloqueada, el teléfono no la manda. */
const UBI={watch:null,enviado:0,ult:null,estado:"off"};
{const st=document.createElement("style");st.textContent=".ubi{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#fff;background:#1a66d6;border-radius:999px;padding:4px 11px;white-space:nowrap;border:0;cursor:pointer;font-family:inherit}.ubi em{font-style:normal;font-size:13px;line-height:1}.ubi.esp{background:#667085}.ubi.neg,.ubi.off{background:#b54708}.ubi.neg em,.ubi.off em{filter:grayscale(1)}@media (max-width:520px){.ubi span{display:none}.ubi{padding:5px 8px}}";document.head.appendChild(st)}
function ubiPintar(){let e=document.getElementById("ubi");
  if(!e){const c=document.getElementById("con");if(!c)return;c.insertAdjacentHTML("afterend",'<button type="button" class="ubi" id="ubi" aria-live="polite"><em>📍</em><span></span></button>');e=document.getElementById("ubi");e.onclick=ubiAyuda}
  const t={on:"Ubicación activa",off:"Ubicación apagada",neg:"Ubicación bloqueada",esp:"Buscando GPS…"}[UBI.estado];
  e.className="ubi "+UBI.estado;e.lastChild.textContent=t;e.title=t;e.hidden=!(S.yo&&S.yo.rol==="chofer")}
function ubiAyuda(){
  if(UBI.estado==="neg")alert("La ubicación está bloqueada para esta app.\n\nPara activarla: en el teléfono abra Ajustes → Ubicación (y en el navegador, el candado junto a la dirección → Permisos → Ubicación → Permitir). Después recargue la app.\n\nSe usa solo mientras la app está abierta, para que la oficina vea dónde va el camión.");
  else if(UBI.estado==="on")alert("Su ubicación se comparte con la oficina mientras la app está abierta, para coordinar el reparto.\nAl cerrar la app o salir, deja de compartirse.");
  else ubiIniciar()}
function ubiEnviar(p,forzar){const c=p.coords,ahora=Date.now();
  const d=UBI.ult?Math.hypot((c.latitude-UBI.ult[0])*111000,(c.longitude-UBI.ult[1])*93000):1e9;
  if(!forzar&&ahora-UBI.enviado<30000&&d<80)return;
  UBI.enviado=ahora;UBI.ult=[c.latitude,c.longitude];
  api("ubicacion",{lat:c.latitude,lon:c.longitude,prec:Math.round(c.accuracy||0),vel:c.speed!=null?Math.round(c.speed*3.6):null}).catch(()=>{})}
function ubiIniciar(){if(!S.yo||S.yo.rol!=="chofer"||UBI.watch!=null)return;
  if(!("geolocation" in navigator)){UBI.estado="neg";return ubiPintar()}
  UBI.estado="esp";ubiPintar();
  UBI.watch=navigator.geolocation.watchPosition(p=>{UBI.estado="on";ubiPintar();ubiEnviar(p)},
    er=>{UBI.estado=er.code===1?"neg":"esp";ubiPintar();if(er.code===1){navigator.geolocation.clearWatch(UBI.watch);UBI.watch=null}},
    {enableHighAccuracy:true,maximumAge:15000,timeout:30000})}
function ubiParar(){if(UBI.watch!=null)navigator.geolocation.clearWatch(UBI.watch);UBI.watch=null;UBI.estado="off";UBI.ult=null;ubiPintar()}
setInterval(()=>{if(S.yo&&S.yo.rol==="chofer"){if(UBI.watch==null&&UBI.estado!=="neg")ubiIniciar()}else if(UBI.watch!=null||UBI.estado!=="off")ubiParar()},3000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&UBI.watch!=null)navigator.geolocation.getCurrentPosition(p=>ubiEnviar(p,true),()=>{},{enableHighAccuracy:true,maximumAge:10000,timeout:20000})});

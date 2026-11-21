/* MR Gas · Panel General · 01-base */
/* ======================================================================
   MR Gas · sitio público + sistema de distribución
   Los datos se guardan en el navegador (localStorage). Ver GUIA.md.
   ====================================================================== */
const FORMATOS=[
  {id:"c5",kg:5,et:"5 kg",tipo:"n",pub:true,uso:"Camping y cocinas pequeñas"},
  {id:"c11",kg:11,et:"11 kg",tipo:"n",pub:true,uso:"Departamentos"},
  {id:"c15",kg:15,et:"15 kg",tipo:"n",pub:true,top:true,uso:"Casas con cocina y calefón"},
  {id:"c45",kg:45,et:"45 kg",tipo:"n",pub:true,uso:"Comercios y restaurantes"},
  {id:"h15a",kg:15,et:"H15",tipo:"h",nom:"H15 grúa aluminio"}
];
FORMATOS.forEach(f=>f.col=f.tipo==="c"?"#2E9B4F":f.tipo==="h"?"#7C8698":"#0A3F94");
const cilSVG=f=>{const lab=f.tipo==="h"?"H15":String(f.kg),sub=f.tipo==="c"?"CAT":f.tipo==="h"?(f.id==="h15a"?"ALU":"FIE"):"";
  return `<svg viewBox="0 0 60 80" aria-hidden="true" style="color:${f.col}"><rect x="20" y="2" width="20" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><rect x="6" y="10" width="48" height="64" rx="16" fill="currentColor"/><text x="30" y="${sub?43:47}" text-anchor="middle" font-size="${lab.length>2?13:15}" font-weight="700" fill="#fff" font-family="Archivo,sans-serif">${lab}</text>${sub?`<text x="30" y="57" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" opacity=".85" font-family="Archivo,sans-serif">${sub}</text>`:""}</svg>`};
const COMUNAS=["Santiago","Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Vitacura","Puente Alto","Pirque","San José de Maipo","Colina","Lampa","Tiltil","San Bernardo","Buin","Calera de Tango","Paine","Melipilla","Talagante","Peñaflor","Padre Hurtado","El Monte","Isla de Maipo","Curacaví","María Pinto","Alhué","San Pedro"];
const CLAVE_INICIAL="GasCentral2026";
const KEY="gascentral_datos_v5";
const st=(...v)=>Object.fromEntries(FORMATOS.map((f,i)=>[f.id,v[i]||0]));
const ESTADOS={pendiente:"Pendiente",ruta:"En ruta",entregado:"Entregado",anulado:"Anulado"};
const MEDIOS={efectivo:"Efectivo",debito:"Débito",credito:"Crédito",transferencia:"Transferencia"};
const PR={c5:13990,c11:23990,c15:31990,c45:94990,h15a:29950};
const BASE={
  empresa:{razon:"MR Gas SpA",rut:"",giro:"Distribución de gas licuado",dir:"",fono:"600 600 7799",correo:""},
  precios:{...PR,fecha:"2026-11-06",minimo:15},
  locales:[
    {id:1,nombre:"Casa Matriz",dir:"Av. Libertador B. O'Higgins 1234",comuna:"Santiago",fono:"+56 2 2000 0001",encargado:"Por asignar",horario:"Lun a Dom 8:00 a 22:00",abierto:true,stock:st(40,120,180,30),vacios:st(80,200,150,30),prestados:st(10,25,20,4)}
  ],
  choferes:["Cristian","Erick","Francisco","Jesús","Jorge","Kevin","Koki","Miguel","Morales","Patrik","Richard","Rodríguez","Zapata"].map((n,i)=>{
    const CG={Cristian:[6,12,12,2],Erick:[6,16,16,2],Francisco:[6,10,10,2],Kevin:[6,14,14,3],Morales:[6,18,22,4],Richard:[4,10,10,2],"Rodríguez":[6,16,16,2]};
    return {id:i+1,nombre:n,patente:"",fono:"",local:1,carga:st(...(CG[n]||[0,0,0,0])),vacios:st(0,0,0,0)}}),
  bitacora:[],recuentos:[],
  mayoristas:[{id:1,nombre:"Cervantes",rut:"",fono:"",local:1}],
  preciosMayor:{c5:10927,c11:20771,c15:27831,c45:85912,h15a:24928},
  preciosEnvase:{c5:28000,c11:51000,c15:40000,c45:98000,h15a:205000},
  preciosConvenio:{c5:12990,c11:22990,c15:30990,c45:92990,h15a:28950},
  listas:{base:"Precio base",convenio:"Precio convenio"},
  sectores:[{id:1,nombre:"Centro",comunas:["Santiago","Estación Central","Independencia","Recoleta"]},
    {id:2,nombre:"Poniente",comunas:["Maipú","Cerrillos","Pudahuel","Lo Prado","Quinta Normal","Cerro Navia"]},
    {id:3,nombre:"Sur",comunas:["La Florida","Puente Alto","La Cisterna","San Miguel","La Granja","San Bernardo","El Bosque","La Pintana","San Ramón","Lo Espejo","Pedro Aguirre Cerda","San Joaquín"]},
    {id:4,nombre:"Oriente",comunas:["Ñuñoa","Providencia","Las Condes","La Reina","Peñalolén","Macul","Vitacura","Lo Barnechea"]},
    {id:5,nombre:"Norte",comunas:["Quilicura","Conchalí","Huechuraba","Renca","Colina","Lampa"]}],
  petroleo:[],
  rendiciones:[],
  pedidos:[
    {id:1001,fecha:"2026-11-06 09:12",nombre:"Ejemplo: Ana Pérez",fono:"+56 9 1111 2222",dir:"Los Aromos 45",formato:"c15",cant:1,precio:PR.c15,local:2,estado:"pendiente",chofer:null,medio:"efectivo",origen:"web"},
    {id:1002,fecha:"2026-11-06 08:40",nombre:"Ejemplo: Jorge Díaz",fono:"+56 9 3333 4444",dir:"San Diego 1500",formato:"c11",cant:2,precio:PR.c11,local:1,estado:"ruta",chofer:1,medio:"debito",origen:"telefono"},
    {id:1003,fecha:"2026-11-06 08:05",nombre:"Ejemplo: Rosa Vega",fono:"+56 9 5555 6666",dir:"Santa Rosa 880",formato:"c45",cant:1,precio:PR.c45,local:1,estado:"entregado",chofer:2,medio:"transferencia",origen:"telefono",desc:true,entregado:"2026-11-06 09:30"},
    {id:1004,fecha:"2026-11-06 07:50",nombre:"Ejemplo: Luis Mora",fono:"+56 9 7777 8888",dir:"Arturo Prat 300",formato:"c15",cant:2,precio:PR.c15,local:1,estado:"pendiente",chofer:null,medio:"efectivo",origen:"telefono"}
  ],
  ventas:[{id:1,fecha:"2026-11-06 10:02",local:1,formato:"c11",cant:1,precio:PR.c11,medio:"efectivo"}],
  movimientos:[],
  gastos:[],
  usuarios:[]
};
let D;
function cargar(){try{D=JSON.parse(localStorage.getItem(KEY))}catch(e){D=null} if(!D) D=structuredClone(BASE);normalizar()}
// Completa con ceros los cilindros nuevos en datos guardados antes (así nada queda vacío).
function normalizar(){
  if(!(D.migraciones&&D.migraciones.soloMatriz)){
    const base=D.locales.find(l=>l.id===1)||D.locales[0];
    if(base){D.locales=[base];const id=base.id;
      ["pedidos","ventas","gastos","rendiciones","cargas","cargasDist","anticipos","petroleo","movimientos","recuentos","peonetas","mayoristas","choferes"].forEach(c=>(D[c]||[]).forEach(o=>{if(o&&o.local!=null&&o.local!==id)o.local=id}));
      (D.usuarios||[]).forEach(u=>{if(u.local!=null)u.local=id;if(Array.isArray(u.sucursales)&&u.sucursales.length)u.sucursales=[id]});
      if(D.ultimaSuc&&D.ultimaSuc!==id)D.ultimaSuc=id}
    D.migraciones={...(D.migraciones||{}),soloMatriz:true}}
  const ok=new Set(FORMATOS.map(f=>f.id)),limpia=o=>{if(o&&typeof o==="object")Object.keys(o).forEach(k=>{if(/^(c\d+c|h15f)$/.test(k)&&!ok.has(k))delete o[k]})};
  [D.precios,D.preciosMayor,D.preciosEnvase,D.preciosConvenio,...(D.comisiones?[D.comisiones.chofer,D.comisiones.peoneta]:[])].forEach(limpia);
  D.locales.forEach(l=>[l.stock,l.vacios,l.prestados,l.comodato].forEach(limpia));D.choferes.forEach(c=>[c.carga,c.vacios].forEach(limpia));
  (D.programados||[]).forEach(x=>limpia(x.precios));
  const fill=(o,def)=>{if(!o)return;FORMATOS.forEach(f=>{if(o[f.id]==null)o[f.id]=def&&typeof def==="object"?(def[f.id]??0):0})};
  fill(D.precios,BASE.precios);
  ["preciosMayor","preciosEnvase","preciosConvenio"].forEach(k=>{D[k]=D[k]||{};fill(D[k],BASE[k])});
  D.listas=D.listas||{...BASE.listas};D.sectores=D.sectores||structuredClone(BASE.sectores);D.petroleo=D.petroleo||[];
  ["cargas","cargasDist","anticipos","peonetas"].forEach(k=>D[k]=D[k]||[]);
  if(!D.clientes){D.clientes=[];(D.pedidos||[]).slice().sort((a,b)=>(a.fecha||"").localeCompare(b.fecha||"")).forEach(p=>{if(p.estado!=="anulado")guardarCliente(p)})}
  D.comisiones=D.comisiones||{chofer:{c5:300,c11:500,c15:600,c45:1500,h15a:600},peoneta:{c5:150,c11:250,c15:300,c45:700,h15a:300}};
  fill(D.comisiones.chofer);fill(D.comisiones.peoneta);
  D.historico=D.historico||{desde:"2021-11-01",usuarios:[]};
  D.locales.forEach(l=>{l.comodato=l.comodato||{};fill(l.comodato)});
  D.locales.forEach(l=>{fill(l.stock);if(l.vacios)fill(l.vacios);if(l.prestados)fill(l.prestados)});
  D.choferes.forEach(c=>{if(c.carga)fill(c.carga);if(c.vacios)fill(c.vacios)});
  (D.rendiciones||[]).forEach(r=>{fill(r.ventas);fill(r.precios,r.tipo==="mayorista"?D.preciosMayor:D.precios);if(r.envases)fill(r.envases);if(r.precioEnv)fill(r.precioEnv,D.preciosEnvase)});
  (D.historialPrecios||[]).forEach(h=>{fill(h.ant,h.nuevos);fill(h.nuevos)});
  (D.programados||[]).forEach(x=>fill(x.precios,D.precios));
}
function guardarLocal(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
function guardar(){guardarLocal();if(typeof NUBE!=="undefined"&&NUBE.listo)programarEnvio()}
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const clp=n=>(n<0?"−$":"$")+Math.round(Math.abs(n)).toLocaleString("es-CL");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dos=n=>String(n).padStart(2,"0");
const ahora=()=>{const d=new Date();return `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}`};
const hoyStr=()=>ahora().slice(0,10);
const fechaISO=d=>`${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`;
const fechaLarga=s=>new Date(s.slice(0,10)+"T12:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const difPrecio=(a,b)=>{const d=b-a;return d===0?'<span class="dif igual">sin cambio</span>':`<span class="dif ${d>0?"sube":"baja"}">${d>0?"▲":"▼"} ${clp(Math.abs(d))}</span>`};
function registrarPrecios(nuevos,user,motivo,desde){
  const ant={};FORMATOS.forEach(f=>{ant[f.id]=D.precios[f.id];D.precios[f.id]=nuevos[f.id]});
  D.precios.fecha=desde;(D.historialPrecios=D.historialPrecios||[]).unshift({desde,cuando:ahora(),user,motivo,ant,nuevos});
  log("precios","Cambio de precios",FORMATOS.map(f=>`${f.et} ${clp(ant[f.id])} → ${clp(nuevos[f.id])}`).join(" · ")+(motivo?" · "+motivo:""),{local:suc||1});
}
function aplicarProgramados(){
  const hoy=hoyStr(),listos=(D.programados||[]).filter(x=>x.desde<=hoy).sort((a,b)=>a.desde.localeCompare(b.desde));
  if(!listos.length)return;
  listos.forEach(x=>registrarPrecios(x.precios,x.user+" (programado)",x.motivo,x.desde));
  D.programados=D.programados.filter(x=>x.desde>hoy);guardar();pintarPublico();
}
const nuevoId=arr=>Math.max(0,...arr.map(x=>x.id))+1;
const fmt=id=>FORMATOS.find(f=>f.id===id)||{id,kg:+(String(id).match(/\d+/)||[0])[0],et:String(id),tipo:"x",col:"#7C8698"};
const loc=id=>D.locales.find(l=>l.id===id);
const nomLocal=id=>(loc(id)||{}).nombre||"Sin local";
const nomChofer=id=>(D.choferes.find(c=>c.id===id)||{}).nombre||"—";
const opcFormatos=(sel)=>FORMATOS.filter(f=>f.pub).map(f=>`<option value="${f.id}" ${f.id===sel?"selected":""}>${f.et} · ${clp(D.precios[f.id])}</option>`).join("");
const opcMedios=()=>Object.entries(MEDIOS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");

async function hash(txt){
  try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("gascentral:"+txt));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
  catch(e){let h=0;for(const c of "gascentral:"+txt)h=(h*31+c.charCodeAt(0))|0;return "x"+h}
}
async function asegurarAdmin(){
  if(!D.usuarios.length){D.usuarios.push({user:"admin",nombre:"Administrador",rol:"admin",local:null,chofer:null,hash:await hash(CLAVE_INICIAL),cambiar:true});guardar()}
  // Usuario de pruebas pedido por el dueño: matias / 1234 (cambiar antes de usar con datos reales)
  if(!D.usuarios.some(u=>u.user==="matias")){D.usuarios.push({user:"matias",nombre:"Matías",rol:"admin",local:null,chofer:null,hash:await hash("1234"),cambiar:false,activo:true});guardar()}
  if(D.empresa&&D.empresa.razon==="Gas Central SpA"){D.empresa.razon="MR Gas SpA";guardar()}
}

/* ===================== SITIO PÚBLICO ===================== */
function pintarPublico(){
  const p=D.precios;
  $("#lista-precios").innerHTML=FORMATOS.filter(f=>f.pub).map(f=>`<article class="precio">
    <span class="marca">${f.top?"Más vendido":""}</span>
    <div class="kg num">${f.kg}<small> kg</small></div>
    <p class="uso">${f.uso}</p>
    <div class="valor num">${clp(p[f.id])}</div>
    <a class="btn linea chico" href="#pedido" data-pedir="${f.id}">Pedir</a></article>`).join("");
  $("#fecha-precios").textContent="Precios vigentes desde el "+new Date(p.fecha+"T12:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"})+".";
  $("#pd-formato").innerHTML=opcFormatos("c15");
  $("#pd-local").innerHTML=D.locales.filter(l=>l.abierto).map(l=>`<option value="${l.id}">${esc(l.nombre)} (${esc(l.comuna)})</option>`).join("");
  $("#lista-locales").innerHTML=D.locales.map(l=>`<article class="local">
    <span class="estado ${l.abierto?"abierto":"cerrado"}">${l.abierto?"Abierto":"Cerrado temporalmente"}</span>
    <h3>${esc(l.nombre)}</h3><p class="dir">${esc(l.dir)}, ${esc(l.comuna)}</p>
    <div class="pie"><span>${esc(l.horario)}</span></div><p class="num" style="color:var(--muted);font-size:.92rem">${esc(l.fono)}</p></article>`).join("");
  $("#sello-locales").textContent=D.locales.length;
  totalPedido();
}
function totalPedido(){$("#pd-total").textContent=clp((D.precios[$("#pd-formato").value]||0)*(+$("#pd-cant").value||1))}
["pd-formato","pd-cant"].forEach(id=>document.getElementById(id).addEventListener("input",totalPedido));
document.addEventListener("click",e=>{const b=e.target.closest("[data-pedir]");if(b){$("#pd-formato").value=b.dataset.pedir;totalPedido()}});
$("#form-pedido").addEventListener("submit",e=>{
  e.preventDefault();const f=$("#pd-formato").value;
  D.pedidos.unshift({id:idPedidoWeb(),fecha:ahora(),nombre:$("#pd-nombre").value.trim(),fono:$("#pd-fono").value.trim(),dir:$("#pd-dir").value.trim(),
    formato:f,cant:+$("#pd-cant").value||1,precio:D.precios[f],local:+$("#pd-local").value,estado:"pendiente",chofer:null,medio:"efectivo",origen:"web"});
  {const q=D.pedidos[0];log("pedidos","Pedido web recibido",`Pedido N° ${q.id} · ${resumenP(q)} · ${nomCli(q)} · ${q.dir}`,{local:q.local,pedido:q.id});nubePedido(q)}
  guardar();e.target.reset();$("#pd-formato").value="c15";totalPedido();$("#pd-ok").hidden=false;setTimeout(()=>$("#pd-ok").hidden=true,6000);
});

/* ===================== SERVIDOR PROPIO (Hostinger: PHP + MySQL) =====================
   Si la página está publicada junto a la carpeta api/, todos los PC comparten los datos:
   cada cambio se envía al servidor y cada 4 segundos se reciben los cambios de los demás.
   Sin servidor (por ejemplo, abriendo el archivo o en la vista previa) funciona solo en este navegador. */
const API_URL="api/index.php";
var NUBE={activo:false,instalado:true,listo:false,usuarios:[],ver:0,timer:null,cache:new Map(),enviando:false,otraVez:false,desdeCargado:null,cargandoHist:false,enLinea:true};
const limpio=o=>JSON.parse(JSON.stringify(o));
async function api(a,body,q=""){
  const r=await fetch(`${API_URL}?a=${a}${q}`,{method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
    headers:body?{"Content-Type":"application/json","X-MRGas":"1"}:{},body:body?JSON.stringify(body):undefined});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok||!j){const e=new Error((j&&j.error)||"No hay conexión con el servidor.");e.status=r.status;if(r.status===402&&j&&j.pausado&&typeof licUI==="function")licUI({estado:"pausado",mensaje:j.error});throw e}
  return j}
async function iniciarNube(){
  if(!/^https?:$/.test(location.protocol))return;
  try{const j=await api("ping");if(j&&j.ok){NUBE.activo=true;NUBE.instalado=j.instalado;
    if(!j.instalado){const er=$("#lg-error");er.innerHTML='Falta instalar el sistema: abra <b>api/instalar.php</b> en este sitio.';er.hidden=false}}}
  catch(e){if(e.status>=500){NUBE.activo=true;const er=$("#lg-error");er.textContent=e.message;er.hidden=false}}
  addEventListener("online",()=>{estadoNube(true);if(NUBE.listo){sondear();programarEnvio()}});addEventListener("offline",()=>estadoNube(false));estadoNube(true)}
function estadoNube(ok){if(ok!==undefined)NUBE.enLinea=ok&&navigator.onLine;const e=document.getElementById("nube-estado");if(!e)return;e.hidden=!NUBE.activo;
  e.textContent=NUBE.enLinea?"Conectado al servidor":"No conectado al servidor";e.classList.toggle("off",!NUBE.enLinea)}

/* ---- qué se comparte ---- */
const CLAVE={cargas:x=>`c${x.local}-${x.k}`,cargasDist:x=>`d${x.local}-${x.k}`,anticipos:x=>`a${x.local}-${x.k}`,peonetas:x=>`pe${x.id}`,clientes:x=>`cl${x.fono}`,petroleo:x=>`p${x.local}-${x.k}`,rendiciones:r=>`${r.tipo}-${r.ref}-${r.fecha}-${r.local}${r.venta!=null?"-v"+r.venta:""}`,ventas:v=>`v${v.local}-${v.grupo||v.id}-${v.formato}`,gastos:g=>`g${g.local}-${g.k||g.id}`};
const idDoc=(col,o)=>CLAVE[col](o).replace(/[^\w-]/g,"_");
const limpiaId=s=>String(s).replace(/[^\w-]/g,"_");
const SYNC=[
  {col:"pedidos",key:p=>String(p.id),noBorrar:true},
  {col:"bitacora",key:b=>limpiaId(b.id),noBorrar:true},
  ...["ventas","gastos","rendiciones","cargas","cargasDist","anticipos","petroleo","peonetas"].map(c=>({col:c,key:o=>idDoc(c,o)})),
  {col:"clientes",key:o=>idDoc("clientes",o),noBorrar:true},
  {col:"movimientos",key:m=>limpiaId(`m${m.local}-${m.k||m.id}`)},
  {col:"recuentos",key:r=>limpiaId(`r${r.local}-${r.id}`)},
  {col:"historialPrecios",key:h=>limpiaId(`h${h.cuando}`),noBorrar:true},
  {col:"ventasAnuladas",key:v=>limpiaId(`va${v.local}-${v.grupo||v.id}-${v.formato}-${v.anulada}`),noBorrar:true},
  {col:"programados",key:x=>limpiaId(`pg${x.id}`)},
  {col:"facturas",key:x=>limpiaId(`f${x.id}`)},
  {col:"empresas",key:x=>limpiaId(`e${x.id}`),noBorrar:false},
  {col:"choferes",key:c=>String(c.id),dato:c=>{const {carga,vacios,sector,apoyo,...b}=c;return b}}];
const ESTADO_GLOBAL=["migraciones","precios","preciosMayor","preciosEnvase","preciosConvenio","listas","empresa","comisiones","historico","mayoristas","presetHoy","autoDesp","listasMay","comisionVale","descQR"];
const ESTADO_SOLO_ADMIN=["precios","preciosMayor","preciosEnvase","preciosConvenio","listas","empresa","comisiones","historico","listasMay","comisionVale","descQR"];
const estable=v=>v&&typeof v==="object"?(Array.isArray(v)?"["+v.map(estable).join(",")+"]":"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+estable(v[k])).join(",")+"}"):JSON.stringify(v??null);
function itemsEstado(){const out=[];
  ESTADO_GLOBAL.forEach(k=>{if(D[k]!==undefined)out.push([k,D[k]])});
  if(D.presets){const k=D.presetCargado||"diario";out.push(["presets",{...D.presets,[k]:capturarPreset()}])}
  (D.locales||[]).forEach(l=>out.push(["loc-"+l.id,l]));
  (D.choferes||[]).forEach(c=>out.push(["stk-"+c.id,{carga:c.carga||null,vacios:c.vacios||null}]));
  return out}
function puedeSubir(col,id){if(!yo)return false;if(esAdmin())return true;
  if(yo.rol==="chofer")return col==="pedidos"||col==="bitacora"||(col==="estado"&&id==="stk-"+yo.chofer);
  if(col==="estado"){if(ESTADO_SOLO_ADMIN.includes(id))return ESTADO_PRECIOS.includes(id)&&tieneExtra("cfg.precios");if(id.startsWith("loc-"))return misSucs().includes(+id.slice(4));return true}
  return true}
function piezas(){const out=[];
  for(const d of SYNC)for(const o of (D[d.col]||[])){const id=d.key(o);if(puedeSubir(d.col,id))out.push({col:d.col,id,data:d.dato?d.dato(o):o})}
  for(const [id,v] of itemsEstado())if(puedeSubir("estado",id))out.push({col:"estado",id,data:{v}});
  return out}
const firma=(col,data)=>col==="estado"?estable(data):JSON.stringify(data);
function revertirEstado(){if(!yo||esAdmin())return;const srv=NUBE.estadoSrv||{};
  for(const [id,v] of itemsEstado())if(!puedeSubir("estado",id)&&srv[id]&&estable(JSON.parse(srv[id]))!==estable(v))aplicarEstado(id,JSON.parse(srv[id]))}
function detectar(){revertirEstado();const cambios=[],vistos=new Set();
  for(const x of piezas()){const k=x.col+"|"+x.id;vistos.add(k);const f=firma(x.col,x.data);if(NUBE.cache.get(k)!==f)cambios.push({...x,f})}
  for(const k of NUBE.cache.keys()){if(vistos.has(k))continue;const i=k.indexOf("|"),col=k.slice(0,i),id=k.slice(i+1),def=SYNC.find(d=>d.col===col);
    if(col==="estado"){if(id.startsWith("loc-")&&esAdmin())cambios.push({col,id,data:null,f:null});continue}
    if(!def||def.noBorrar||!puedeSubir(col,id))continue;cambios.push({col,id,data:null,f:null})}
  return cambios}

/* ---- enviar cambios ---- */
let tEnvio=null;
function programarEnvio(){if(!NUBE.listo)return;clearTimeout(tEnvio);tEnvio=setTimeout(enviar,300)}
const COLA="mrgas_cola";
async function enviar(){
  if(!NUBE.listo)return;if(NUBE.enviando){NUBE.otraVez=true;return}NUBE.enviando=true;
  try{const c=detectar();try{localStorage.setItem(COLA,JSON.stringify(c.map(({col,id,data})=>({col,id,data}))))}catch(e){}
    for(let i=0;i<c.length;i+=150){const parte=c.slice(i,i+150);
      const r=await api("lote",{docs:parte.map(({col,id,data})=>({col,id,data}))});
      r.res.forEach((s,j)=>{const x=parte[j],k=x.col+"|"+x.id;
        if(s.ok){if(x.data===null)NUBE.cache.delete(k);else NUBE.cache.set(k,x.f)}
        else{ // sin permiso: se vuelve a la versión del servidor
          if(s.actual){NUBE.cache.delete(k);aplicarDoc(x.col,x.id,s.actual,false);NUBE.revertido=true}else{NUBE.cache.set(k,x.f)}}})}
    try{localStorage.removeItem(COLA)}catch(e){}
    if(NUBE.revertido){NUBE.revertido=false;guardarLocal();pintarSistema();aviso("Sin permiso","Su usuario no puede cambiar eso. Se dejó como estaba.")}
    estadoNube(true)}
  catch(e){estadoNube(false);if(e.status===401)sesionVencida()}
  finally{NUBE.enviando=false;if(NUBE.otraVez){NUBE.otraVez=false;programarEnvio()}}}

/* ---- recibir cambios ---- */
function aplicarEstado(id,v){
  if(id.startsWith("loc-")){const n=+id.slice(4),i=D.locales.findIndex(l=>l.id===n);if(i>=0)D.locales[i]=v;else{D.locales.push(v);D.locales.sort((a,b)=>a.id-b.id)}return}
  if(id.startsWith("stk-")){const c=D.choferes.find(x=>x.id===+id.slice(4));if(c){if(v.carga)c.carga=v.carga;if(v.vacios)c.vacios=v.vacios}else (NUBE.stk=NUBE.stk||{})[id]=v;return}
  if(id==="presets"){D.presets=v;const k=D.presetCargado||"diario",p=v[k]||v.diario;if(p&&!p.nuevo){D.sectores=p.sectores||[];D.zonas=p.zonas;D.reglasCalle=p.reglasCalle||[];
    D.choferes.forEach(c=>{c.sector=p.asign&&c.id in p.asign?p.asign[c.id]:null;c.apoyo=p.apoyo&&p.apoyo[c.id]?p.apoyo[c.id]:[]});D.topeCamion=p.tope||3;D.radioCerca=p.cerca??1}return}
  D[id]=v}
function aplicarDoc(col,id,data,borrado){
  const k=col+"|"+id,def=SYNC.find(d=>d.col===col);
  if(borrado){NUBE.cache.delete(k);if(col==="estado"&&id.startsWith("loc-")&&D.locales.length>1){D.locales=D.locales.filter(l=>l.id!==+id.slice(4));return true}if(def){const a=D[col]||[],i=a.findIndex(o=>def.key(o)===id);if(i>=0){a.splice(i,1);return true}}return false}
  const f=firma(col,col==="estado"?data:data);if(NUBE.cache.get(k)===f)return false;NUBE.cache.set(k,f);
  if(col==="estado"){(NUBE.estadoSrv=NUBE.estadoSrv||{})[id]=JSON.stringify(data.v);aplicarEstado(id,data.v);return true}
  if(!def)return false;const a=D[col]=D[col]||[],i=a.findIndex(o=>def.key(o)===id);
  if(col==="choferes"){if(i>=0)Object.assign(a[i],data);else{const c=ensureCh({...data});a.push(c);const s=NUBE.stk&&NUBE.stk["stk-"+c.id];if(s){if(s.carga)c.carga=s.carga;if(s.vacios)c.vacios=s.vacios}}return true}
  if(i>=0){const t=a[i];Object.keys(t).forEach(x=>{if(!(x in data))delete t[x]});Object.assign(t,data)}else a.push(data);
  return true}
function aplicarLote(docs){
  let n=0;const nuevos=[];
  const orden=d=>d.col==="choferes"?0:d.col==="estado"?(d.id.startsWith("stk-")?3:d.id==="presets"?2:1):1;
  docs.slice().sort((a,b)=>orden(a)-orden(b)).forEach(d=>{
    const antes=d.col==="pedidos"?(D.pedidos.find(p=>String(p.id)===d.id)||null):null,ant=antes&&{estado:antes.estado,chofer:antes.chofer};
    if(aplicarDoc(d.col,d.id,d.data,d.borrado)){n++;
      if(d.col==="pedidos"&&!d.borrado&&d.data.estado==="ruta"&&(!ant||ant.estado!=="ruta"||ant.chofer!==d.data.chofer))nuevos.push(d.data)}});
  if(n){["pedidos","bitacora","ventas","gastos","cargas","cargasDist","anticipos","petroleo","movimientos"].forEach(c=>{const a=D[c];if(a&&a.length)a.sort((x,y)=>String(y.fecha||"").localeCompare(String(x.fecha||"")))})}
  return {n,nuevos}}
async function sondear(){
  if(!NUBE.listo||NUBE.sondeando)return;NUBE.sondeando=true;
  try{const r=await api("cambios",null,`&desde=${NUBE.ver}`);
    if(r.perfil&&yo){const p=r.perfil;if(p.rol!==yo.rol||JSON.stringify(p.sucursales)!==JSON.stringify(yo.sucursales)||JSON.stringify(p.permisos)!==JSON.stringify(yo.permisos)){Object.assign(yo,p)}}
    const {n,nuevos}=aplicarLote(r.docs);NUBE.ver=r.ver;estadoNube(true);
    if(n){guardarLocal();
      if(yo&&yo.rol==="chofer")nuevos.filter(p=>p.chofer===yo.chofer).forEach(p=>aviso(`Nuevo pedido N° ${p.id}`,`${resumenP(p)} · ${p.dir}`,p.id));
      refrescarVista(false)}}
  catch(e){estadoNube(false);if(e.status===401)sesionVencida()}
  finally{NUBE.sondeando=false}}
function ciclo(){clearTimeout(NUBE.timer);if(!NUBE.listo)return;NUBE.timer=setTimeout(async()=>{await sondear();ciclo()},document.hidden?15000:4000)}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&NUBE.listo){sondear();ciclo()}});
function detenerEscuchas(){NUBE.listo=false;clearTimeout(NUBE.timer);clearTimeout(tEnvio)}
function sesionVencida(){if(!yo)return;detenerEscuchas();yo=null;aviso("Sesión vencida","Vuelva a entrar con su usuario y clave.");location.hash="acceso"}

/* ---- carga inicial al entrar ---- */
const TRANSAC=["pedidos","bitacora","ventas","gastos","rendiciones","cargas","cargasDist","anticipos","petroleo","clientes","movimientos","recuentos","ventasAnuladas","historialPrecios","programados","peonetas"];
async function iniciarEscuchas(){
  detenerEscuchas();if(!NUBE.activo||!yo)return;
  let cola=[];try{cola=JSON.parse(localStorage.getItem(COLA)||"[]")}catch(e){}
  const r=await api("cambios",null,"&desde=0");
  const locAntes=D.locales.slice(),chAntes=D.choferes.slice();
  TRANSAC.forEach(c=>D[c]=[]);NUBE.cache.clear();
  if(!r.vacio){D.locales=[];D.choferes=[];aplicarLote(r.docs);if(!D.locales.length)D.locales=locAntes;if(!D.choferes.length)D.choferes=chAntes}
  if(!r.docs.some(d=>d.col==="estado"&&d.id==="migraciones"))D.migraciones={}; // el servidor aún no tiene la migración: se aplica y se comparte
  // cambios hechos sin conexión que no alcanzaron a llegar al servidor
  cola.forEach(x=>{if(x.data===null)return;const k=x.col+"|"+x.id;aplicarDoc(x.col,x.id,x.data,false);NUBE.cache.delete(k)});
  NUBE.ver=r.ver;NUBE.desdeCargado=fechaISO(new Date(Date.now()-7*864e5));NUBE.desdeBit=fechaISO(new Date(Date.now()-2*864e5));NUBE.listo=true;
  normalizar();guardar();enviar();ciclo();
  if(esAdmin())cargarUsuarios();
}
async function cargarUsuarios(){try{const r=await api("usuarios");NUBE.usuarios=r.usuarios.map(u=>({...u,uid:String(u.uid)}));if(mod==="usuarios"||mod==="cuadratura")refrescarVista(false)}catch(e){}}
// Informes o fechas antiguas: se piden al servidor solo cuando se necesitan
async function asegurarHistoria(desde){
  const conBit=mod==="informes"||mod==="chofer";
  if(!NUBE.listo||!desde||NUBE.cargandoHist||yo.rol==="chofer")return;
  const pide=[];if(desde<NUBE.desdeCargado)pide.push(["pedidos,ventas,gastos,rendiciones,cargas,cargasDist,anticipos,petroleo,movimientos,recuentos,ventasAnuladas","desdeCargado"]);
  if(conBit&&desde<NUBE.desdeBit)pide.push(["bitacora","desdeBit"]);if(!pide.length)return;
  NUBE.cargandoHist=true;
  try{for(const [cols,campo] of pide){const r=await api("rango",null,`&cols=${cols}&desde=${desde}&hasta=${NUBE[campo]}`);aplicarLote(r.docs);NUBE[campo]=desde}
    guardarLocal();refrescarVista(false)}
  catch(e){aviso("No se pudo traer la historia",e.message)}
  finally{NUBE.cargandoHist=false}}
function fechaMasAntigua(){
  const por={informes:[repDesde,infMes&&infMes+"-01"],cuadratura:[fechaCuad,liqDesde],compras:[compDesde],bodega:[bIni,bvIni],chofer:[chFecha],ruta:[],pedidos:[]};
  const f=(por[mod]||[]).filter(x=>typeof x==="string"&&/^\d{4}-\d\d/.test(x));
  if(mod==="informes"&&periodoInf){if(periodoInf==="todo")f.push("2000-01-01");else{const d=new Date();d.setDate(d.getDate()-(+periodoInf));f.push(fechaISO(d))}}
  return f.sort()[0]}

/* ---- sesión con el servidor ---- */
async function loginNube(){
  const err=$("#lg-error"),btn=$("#form-login button[type=submit]");err.hidden=true;btn.disabled=true;
  try{const r=await api("login",{user:$("#lg-user").value.trim().toLowerCase(),pass:$("#lg-pass").value,app:"erp"});if(r.licencia&&typeof licUI==="function")setTimeout(()=>licUI(r.licencia),50);
    $("#form-login").reset();await entrarComo(r.perfil)}
  catch(e){err.textContent=e.status===401||e.status===403||e.status===429?e.message:"No hay conexión con el servidor. Revise internet y vuelva a intentar.";err.hidden=false}
  finally{btn.disabled=false}}
async function entrarComo(p){
  if(p.rol!=="admin"&&Array.isArray(p.permisos)&&p.permisos.includes("app.local")&&p.permisos.every(c=>/^(_v2|app\.|loc\.|lsuc\.|clave\.)/.test(c))){location.href="local/";return}
  yo={...p,uid:String(p.uid)};
  if(esAdmin()){suc=loc(D.ultimaSuc)?D.ultimaSuc:D.locales[0].id;mod="menu"}else{suc=(p.sucursales&&p.sucursales[0])||p.local||D.locales[0].id;mod=p.rol==="chofer"?"chofer":"menu"}
  guardarSesion();
  try{await iniciarEscuchas()}catch(e){aviso("Sin conexión con el servidor",e.message)}
  if(!loc(suc))suc=(D.locales[0]||{}).id;
  log("sistema","Ingreso al sistema","",{local:p.local});guardar();
  if(/[?&]volver=local\b/.test(location.search)){location.href="local/";return}
  location.hash="panel";if(location.hash==="#panel")pintarSistema()}
async function sesionNube(){
  try{const r=await api("yo");if(r.perfil&&typeof licUI==="function")licUI(r.licencia);if(r.perfil){yo={...r.perfil,uid:String(r.perfil.uid)};
    try{const s=JSON.parse(sessionStorage.getItem("gdm_sesion")||"null");if(s&&s.suc)suc=s.suc}catch(e){}
    if(!suc)suc=(yo.sucursales&&yo.sucursales[0])||yo.local||(loc(D.ultimaSuc)?D.ultimaSuc:D.locales[0].id);if(yo.rol==="chofer")mod="chofer";
    await iniciarEscuchas()}}
  catch(e){console.warn(e)}}
async function salirNube(){try{await api("salir",{})}catch(e){}}
async function claveNube(err){
  if($("#ck-nueva").value!==$("#ck-rep").value){err.textContent="Las claves nuevas no coinciden.";err.hidden=false;return}
  try{await api("clave",{actual:$("#ck-actual").value,nueva:$("#ck-nueva").value});$("#f-clave").reset();$("#ck-ok").hidden=false;log("sistema","Cambio de clave","");guardar()}
  catch(x){err.textContent=x.message;err.hidden=false}}

/* ---- compatibilidad con el resto del sistema ---- */
let renderPend=false;
function refrescarVista(soloLocal){
  if(soloLocal||location.hash.slice(1)!=="panel"||!yo)return;
  if(!autoRefresco&&mod==="ruta")return;
  const a=document.activeElement;
  if(a&&a.closest&&a.closest("#sis-main")&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)){renderPend=true;return}
  if(mod==="sectorizar"&&(szModo==="dibujar"||szModo==="editar"||szModo==="ubicar")){renderPend=true;return}
  renderPend=false;pintarSistema()}
document.addEventListener("focusout",()=>{if(renderPend)setTimeout(()=>{const a=document.activeElement;if(!(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName)))refrescarVista(false)},400)});
// Estas funciones se llaman al cambiar datos; con el servidor basta con «guardar()», que detecta y envía los cambios.
function nubeGuardar(){} function nubeQuitar(){} function nubeLog(){} function nubeChofer(){} function nubeBorrarChofer(){}
function nubePedido(p){ // pedido del sitio público (sin usuario): va directo al servidor
  if(!NUBE.activo||yo||!p||p.origen!=="web")return;
  api("pedido_web",{nombre:p.nombre,fono:p.fono,dir:p.dir,formato:p.formato,cant:p.cant,precio:p.precio,local:p.local})
    .then(r=>{p.id=r.id;D.pedidos=D.pedidos.filter(x=>x!==p);D.bitacora=D.bitacora.filter(b=>b.pedido!==p.id);guardar()}).catch(()=>{})}
async function idPedido(){
  const local=Math.max(1000,...D.pedidos.map(p=>p.id))+1;
  if(!NUBE.listo)return local;
  try{return (await api("contador",{minimo:local})).n}catch(e){return Number(String(Date.now()).slice(-7))}}
const idPedidoWeb=()=>Math.max(1000,...D.pedidos.map(p=>p.id))+1;

/* ---- Avisos en pantalla ---- */
function aviso(titulo,cuerpo,pedido){
  let z=document.getElementById("toast");
  if(!z){z=document.createElement("div");z.id="toast";z.className="toast";z.setAttribute("role","status");document.body.appendChild(z)}
  z.innerHTML=`<b>${esc(titulo)}</b><span>${esc(cuerpo)}</span>`;z.classList.add("ver");clearTimeout(z._t);z._t=setTimeout(()=>z.classList.remove("ver"),7000);
  if(document.hidden&&window.Notification&&Notification.permission==="granted"&&navigator.serviceWorker)
    navigator.serviceWorker.ready.then(r=>r.showNotification(titulo,{body:cuerpo,icon:"icons/icon-192.png",badge:"icons/badge-72.png",tag:pedido?"pedido-"+pedido:"mrgas",data:{url:"./#panel"}})).catch(()=>{});
}
function bannerPush(){
  if(!NUBE.activo||!yo||yo.rol!=="chofer"||!window.Notification||Notification.permission!=="default")return "";
  return `<div class="aviso-push"><div><b>Active los avisos de pedidos</b><span>Con la app abierta (aunque esté en segundo plano) le llegará un aviso cada vez que le asignen un pedido.</span></div><button type="button" class="btn" id="btn-push">Activar avisos</button></div>`;
}
async function activarPush(silencioso){
  if(!window.Notification){if(!silencioso)aviso("Avisos no disponibles","Este navegador no permite notificaciones.");return}
  const perm=await Notification.requestPermission();
  if(!silencioso)aviso(perm==="granted"?"Avisos activados":"Avisos desactivados",perm==="granted"?"Le llegará un aviso cuando le asignen un pedido.":"Puede activarlos después en los ajustes del navegador.");
  pintarSistema()}

/* ---- App instalable ---- */
let eventoInstalar=null;
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(e=>console.warn("SW",e)));
addEventListener("beforeinstallprompt",e=>{e.preventDefault();eventoInstalar=e;const b=document.getElementById("btn-instalar");if(b)b.hidden=false});
addEventListener("appinstalled",()=>{const b=document.getElementById("btn-instalar");if(b)b.hidden=true});
document.addEventListener("click",async e=>{const b=e.target.closest("#btn-instalar");if(!b||!eventoInstalar)return;eventoInstalar.prompt();await eventoInstalar.userChoice;eventoInstalar=null;b.hidden=true});
if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!(matchMedia("(display-mode: standalone)").matches||navigator.standalone)){const n=document.getElementById("ios-instalar");if(n)n.hidden=false}

/* ===================== SESIÓN ===================== */
let yo=null,suc=null,mod="menu";
const esAdmin=()=>yo&&yo.rol==="admin";
function guardarSesion(){try{sessionStorage.setItem("gdm_sesion",JSON.stringify({u:yo&&yo.user,suc}))}catch(e){}}
function leerSesion(){try{const s=JSON.parse(sessionStorage.getItem("gdm_sesion")||"null");if(s){yo=D.usuarios.find(x=>x.user===s.u)||null;suc=s.suc}}catch(e){}}
$("#form-login").addEventListener("submit",async e=>{
  e.preventDefault();
  if(NUBE.activo)return loginNube();
  const u=$("#lg-user").value.trim().toLowerCase(),h=await hash($("#lg-pass").value);
  const usr=D.usuarios.find(x=>x.user===u&&x.hash===h&&x.activo!==false);
  if(!usr){$("#lg-error").hidden=false;return}
  yo=usr;$("#lg-error").hidden=true;e.target.reset();log("sistema","Ingreso al sistema","",{local:usr.local});guardar();
  if(esAdmin()){suc=loc(D.ultimaSuc)?D.ultimaSuc:D.locales[0].id;mod="menu"}else{suc=(usr.sucursales&&usr.sucursales[0])||usr.local;mod=usr.rol==="chofer"?"chofer":"menu"}
  guardarSesion();location.hash="panel";
});
function salir(){infPor=null;respOk=false;if(yo){log("sistema","Salida del sistema","");guardar()}if(NUBE.activo){const fin=()=>{detenerEscuchas();salirNube();TRANSAC.forEach(c=>D[c]=[]);NUBE.cache.clear();guardarLocal()};if(NUBE.listo)enviar().finally(fin);else fin()}yo=null;suc=null;try{sessionStorage.removeItem("gdm_sesion")}catch(e){};location.hash="acceso"}


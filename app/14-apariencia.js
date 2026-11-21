/* MR Gas · Panel General · 14-apariencia */
/* ===================== APARIENCIA: marca, colores, logo, impresión, modo oscuro, letra, densidad, menú y aviso ===================== */
ESTADO_GLOBAL.push("apariencia");ESTADO_SOLO_ADMIN.push("apariencia");
IC.apariencia=IC.config;
const APAR_DEF={nombre:"MR Gas",sub:"Sistema de distribución",color:"#1a66d6",fondo:"",fondoImg:"",logo:"",aviso:"",menuOrden:[],menuOcultos:[]};
const MENU_TODOS=[["pedidos","Pedidos de Gas"],["ruta","Asigna Ruta"],["mayorista","Venta Mayorista"],["ventachofer","Venta Choferes"],["local","Venta Local"],["choferes","Choferes"],["bodega","Control de Bodega"],["facturas","Facturas"],["informes","Informes"],["config","Configuraciones"]];
let APAR_PUB=null;
const apar=()=>({...APAR_DEF,...(APAR_PUB||{}),...((typeof D!=="undefined"&&D&&D.apariencia)||{})});
function aparOrden(base){const o=(apar().menuOrden||[]).filter(x=>base.includes(x));return [...o,...base.filter(x=>!o.includes(x))]}
function aparOcultos(){return (apar().menuOcultos||[]).filter(x=>x!=="config")}
/* paleta a partir de un color */
function hexRgb(h){h=String(h||"").replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");const n=parseInt(h,16);return isNaN(n)?[26,102,214]:[n>>16&255,n>>8&255,n&255]}
function mezcla(c,o,t){const a=hexRgb(c),b=hexRgb(o);return "#"+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,"0")).join("")}
function paleta(c){return {b0:mezcla(c,"#ffffff",.95),b1:mezcla(c,"#ffffff",.9),b2:mezcla(c,"#ffffff",.78),b3:mezcla(c,"#ffffff",.55),b6:c,b7:mezcla(c,"#000000",.18),b8:mezcla(c,"#000000",.38),b9:mezcla(c,"#000000",.6)}}
function cssApariencia(a){const p=paleta(a.color||APAR_DEF.color),v=Object.entries(p).map(([k,x])=>`--${k}:${x}!important`).join(";");
  const fondo=a.fondoImg?`url(${a.fondoImg}) center/cover no-repeat,${p.b9}`:(a.fondo||p.b9);
  return `:root,.sis{${v};--grad:linear-gradient(135deg,${p.b6} 0%,${p.b7} 55%,${p.b9} 100%)!important;--tinte:${p.b0}!important;--azul-suave:${p.b1}!important}
  .portal{background:${fondo}!important}.pt-sello,.il-sello{color:${p.b9}!important}.pt-ico{color:${p.b8}!important;background:${p.b1}!important;border-color:${p.b2}!important}
  .sis .btn:not(.linea):not(.rojo):not(.chico.linea){background:var(--grad)!important}.sis .res-k.tot b,.sis .vc-top select.vc-chsel{color:${p.b9}!important}
  .il-marca,.vista-login .il-marca{background:${fondo}!important}`}
function logoHTML(a,txt){return a.logo?`<img src="${a.logo}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">`:txt}
function aplicarApariencia(){const a=apar();
  let st=document.getElementById("apar-css");if(!st){st=document.createElement("style");st.id="apar-css";document.head.appendChild(st)}st.textContent=cssApariencia(a);
  const set=(sel,fn)=>document.querySelectorAll(sel).forEach(fn);
  set(".sis-logo .nombre",e=>{e.innerHTML=`${esc(a.nombre)}<small>${esc(a.sub||"")}</small>`});
  set(".pt-marca b",e=>{e.textContent=a.nombre});set(".portal h1 em",e=>{e.textContent=a.nombre});set(".il-marca h1",e=>{e.textContent=a.nombre});
  set(".sello,.pt-sello,.il-sello",e=>{const ini=(a.nombre||"MR").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();e.innerHTML=logoHTML(a,esc(ini));if(a.logo)e.style.padding="3px";else e.style.padding=""});
  set(".foot-mr>span:first-child",e=>{e.textContent=`${a.nombre} · ${a.sub||"Sistema de distribución"}`});
  if(document.title.includes("·"))document.title=a.nombre+" · Panel General";
  if(a.logo){let l=document.querySelector('link[rel="icon"]');if(l)l.href=a.logo}}
/* preferencias de este equipo: modo oscuro, tamaño de letra y densidad */
function prefUI(){try{return JSON.parse(localStorage.getItem("mr_ui"))||{}}catch(e){return {}}}
function aplicarPrefUI(){const u=prefUI(),h=document.documentElement;h.classList.toggle("ui-oscuro",!!u.oscuro);h.classList.toggle("ui-amplio",u.densidad==="amplio");h.classList.toggle("ui-compacto",u.densidad==="compacto");
  document.body.style.zoom=({grande:"1.1",muygrande:"1.22"})[u.letra]||""}
aplicarPrefUI();
/* la marca se ve también antes de iniciar sesión */
fetch((typeof API_URL!=="undefined"?API_URL:"api/index.php")+"?a=apariencia",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.apariencia){APAR_PUB=j.apariencia;aplicarApariencia()}}).catch(()=>{});
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{aplicarApariencia()}catch(e){}return r}}
aplicarApariencia();
/* aviso para todos en el menú principal */
{const vm=V.menu;V.menu=function(){let h=vm.apply(this,arguments);const a=apar();if(a.aviso)h=h.replace('<div class="modulos">',`<div class="aviso-gral">📢 ${esc(a.aviso)}</div><div class="modulos">`);return h}}
/* imágenes: se achican antes de guardarlas */
function achicarImagen(file,max,tipo,cal){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=()=>no(new Error("No se pudo leer la imagen."));r.onload=()=>{const im=new Image();im.onerror=()=>no(new Error("El archivo no es una imagen."));
  im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL(tipo,cal))};im.src=r.result};r.readAsDataURL(file)})}
let aparBorr=null;
CFG_MAY.apariencia={v(){const a=apar(),e=D.empresa||{},u=prefUI(),COL=["#1a66d6","#0f8a5f","#c2410c","#b42318","#6941c6","#475467","#0e7490"];
  const orden=aparOrden(MENU_TODOS.map(x=>x[0])),oc=a.menuOcultos||[];
  return `<section class="cfgp apar" id="s-apar" style="max-width:920px"><h3>Apariencia</h3>
   <div class="ap-sec"><h4>1 · Marca</h4><div class="ap-g"><label>Nombre de la empresa<input id="ap-nombre" maxlength="40" value="${esc(a.nombre)}"></label><label>Texto bajo el nombre<input id="ap-sub" maxlength="50" value="${esc(a.sub)}"></label></div>
     <div class="ap-logo"><div class="ap-prev">${a.logo?`<img src="${a.logo}" alt="Logo">`:'<span>Sin logo</span>'}</div><label class="btn linea">Subir logo<input type="file" id="ap-logo" accept="image/*" hidden></label>${a.logo?'<button class="btn linea" type="button" id="ap-logo-q">Quitar logo</button>':""}<span class="nota" style="margin:0">PNG o JPG cuadrado. Se usa en el encabezado, el inicio y el ícono de la pestaña.</span></div></div>
   <div class="ap-sec"><h4>2 · Color principal</h4><div class="ap-cols">${COL.map(c=>`<button type="button" class="ap-c ${a.color===c?"on":""}" data-apcol="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join("")}<label class="ap-pick">Otro<input type="color" id="ap-color" value="${esc(a.color)}"></label></div></div>
   <div class="ap-sec"><h4>3 · Datos para imprimir</h4><div class="ap-g"><label>Razón social<input id="ap-razon" value="${esc(e.razon||"")}"></label><label>RUT<input id="ap-rut" value="${esc(e.rut||"")}" placeholder="76.000.000-0"></label><label>Giro<input id="ap-giro" value="${esc(e.giro||"")}"></label>
     <label>Dirección<input id="ap-dir" value="${esc(e.dir||"")}"></label><label>Teléfono<input id="ap-fono" value="${esc(e.fono||"")}"></label><label>Correo<input id="ap-correo" type="email" value="${esc(e.correo||"")}"></label></div></div>
   <div class="ap-sec"><h4>4 · Fondo del inicio y de la pantalla de ingreso</h4><div class="ap-logo"><label class="ap-pick">Color<input type="color" id="ap-fondo" value="${esc(a.fondo||paleta(a.color).b9)}"></label>
     <label class="btn linea">Subir imagen<input type="file" id="ap-fimg" accept="image/*" hidden></label>${a.fondoImg||a.fondo?'<button class="btn linea" type="button" id="ap-fondo-q">Usar el color principal</button>':""}${a.fondoImg?'<span class="nota" style="margin:0">Con imagen propia.</span>':""}</div></div>
   <div class="ap-sec"><h4>5 · Menú principal</h4><p class="nota" style="margin:0 0 6px">Ordene con las flechas. Desmarque lo que no usan para ocultarlo (Configuraciones siempre se ve).</p>
     <div class="ap-menu">${orden.map((id,i)=>`<div class="ap-mi"><label class="radio"><input type="checkbox" data-apver="${id}" ${oc.includes(id)?"":"checked"} ${id==="config"?"disabled":""}> ${esc((MENU_TODOS.find(x=>x[0]===id)||[])[1]||id)}</label><span><button class="btn chico linea" type="button" data-apmv="${id}|-1" ${i?"":"disabled"} aria-label="Subir">▲</button><button class="btn chico linea" type="button" data-apmv="${id}|1" ${i===orden.length-1?"disabled":""} aria-label="Bajar">▼</button></span></div>`).join("")}</div></div>
   <div class="ap-sec"><h4>6 · Aviso para todos</h4><label>Se muestra arriba del menú principal (déjelo vacío para no mostrar nada)<input id="ap-aviso" maxlength="160" value="${esc(a.aviso||"")}" placeholder="Ej: Hoy cerramos a las 18:00"></label></div>
   <div class="cfgp-btn"><button class="btn" type="button" id="ap-guardar">Guardar apariencia</button><button class="btn linea" type="button" id="ap-reset">Volver al diseño original</button></div>
   <div class="ap-sec ap-equipo"><h4>En este equipo (cada persona elige)</h4><div class="ap-g">
     <label>Modo<select id="ap-modo"><option value="">Claro</option><option value="1" ${u.oscuro?"selected":""}>Oscuro</option></select></label>
     <label>Tamaño de letra<select id="ap-letra"><option value="">Normal</option><option value="grande" ${u.letra==="grande"?"selected":""}>Grande</option><option value="muygrande" ${u.letra==="muygrande"?"selected":""}>Muy grande</option></select></label>
     <label>Densidad<select id="ap-dens"><option value="">Normal</option><option value="compacto" ${u.densidad==="compacto"?"selected":""}>Compacto (entra más)</option><option value="amplio" ${u.densidad==="amplio"?"selected":""}>Amplio (botones grandes)</option></select></label></div>
     <p class="nota" style="margin:6px 0 0">Esto se guarda solo en este computador o celular y se aplica al instante.</p></div></section>`},
  l(){const z=$("#s-apar");if(!z)return;D.apariencia=D.apariencia||{};
    const borr=aparBorr||(aparBorr={...apar()});const prev=()=>{const bk=D.apariencia;D.apariencia=borr;aplicarApariencia();D.apariencia=bk};
    const lee=()=>{borr.nombre=$("#ap-nombre").value.trim()||"MR Gas";borr.sub=$("#ap-sub").value.trim();borr.aviso=$("#ap-aviso").value.trim()};
    ["#ap-nombre","#ap-sub"].forEach(s=>$(s).oninput=()=>{lee();prev()});
    $$("[data-apcol]").forEach(b=>b.onclick=()=>{borr.color=b.dataset.apcol;$$("[data-apcol]").forEach(x=>x.classList.toggle("on",x===b));$("#ap-color").value=borr.color;prev()});
    $("#ap-color").oninput=e=>{borr.color=e.target.value;$$("[data-apcol]").forEach(x=>x.classList.remove("on"));prev()};
    $("#ap-fondo").oninput=e=>{borr.fondo=e.target.value;borr.fondoImg="";prev()};
    const fq=$("#ap-fondo-q");if(fq)fq.onclick=()=>{borr.fondo="";borr.fondoImg="";lee();D.apariencia={...borr};guardar();pintarSistema()};
    $("#ap-logo").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{borr.logo=await achicarImagen(f,256,"image/png");lee();D.apariencia={...borr};guardar();pintarSistema()}catch(x){aviso("Logo",x.message)}};
    const lq=$("#ap-logo-q");if(lq)lq.onclick=()=>{borr.logo="";lee();D.apariencia={...borr};guardar();pintarSistema()};
    $("#ap-fimg").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{borr.fondoImg=await achicarImagen(f,1600,"image/jpeg",.72);lee();D.apariencia={...borr};guardar();pintarSistema()}catch(x){aviso("Fondo",x.message)}};
    const orden=()=>[...z.querySelectorAll("[data-apver]")].map(i=>i.dataset.apver);
    $$("[data-apmv]").forEach(b=>b.onclick=()=>{const [id,d]=b.dataset.apmv.split("|"),o=orden(),i=o.indexOf(id),j=i+(+d);if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];
      borr.menuOrden=o;borr.menuOcultos=[...z.querySelectorAll("[data-apver]")].filter(x=>!x.checked).map(x=>x.dataset.apver);lee();D.apariencia={...borr};guardar();pintarSistema()});
    $("#ap-guardar").onclick=()=>{lee();borr.menuOrden=orden();borr.menuOcultos=[...z.querySelectorAll("[data-apver]")].filter(x=>!x.checked).map(x=>x.dataset.apver);
      D.apariencia={...borr};D.empresa={...(D.empresa||{}),nombre:borr.nombre,razon:$("#ap-razon").value.trim(),rut:$("#ap-rut").value.trim(),giro:$("#ap-giro").value.trim(),dir:$("#ap-dir").value.trim(),fono:$("#ap-fono").value.trim(),correo:$("#ap-correo").value.trim()};
      log("sistema","Apariencia cambiada",`${borr.nombre} · color ${borr.color}`);aparBorr=null;guardar();pintarSistema();aviso("Apariencia guardada","Se aplica en el Panel General, Venta Local y la App repartidores.")};
    $("#ap-reset").onclick=()=>confirmar($("#ap-reset"),()=>{D.apariencia={};aparBorr=null;guardar();pintarSistema();aviso("Diseño original","Se volvió al diseño de MR Gas.")});
    const pu=()=>{const u={oscuro:!!$("#ap-modo").value,letra:$("#ap-letra").value,densidad:$("#ap-dens").value};try{localStorage.setItem("mr_ui",JSON.stringify(u))}catch(e){}aplicarPrefUI()};
    ["#ap-modo","#ap-letra","#ap-dens"].forEach(s=>$(s).onchange=pu)}};

/* ===================== INFORMES → COMPARAR MESES (este mes contra el anterior) ===================== */
let cmpMes=null,cmpLocal=null,cmpKey="",cmpCargando=false;
function cmpRangos(){const h=hoyStr();if(!cmpMes||cmpMes>h.slice(0,7))cmpMes=h.slice(0,7);
  const [y,m]=cmpMes.split("-").map(Number),fin=fechaISO(new Date(y,m,0,12)),actual=cmpMes===h.slice(0,7),hasta=actual?h:fin,dia=+hasta.slice(8,10);
  const pUlt=new Date(y,m-1,0,12).getDate(),pIni=fechaISO(new Date(y,m-2,1,12)),pFin=fechaISO(new Date(y,m-2,actual?Math.min(dia,pUlt):pUlt,12));
  return {A:[pIni,pFin],B:[cmpMes+"-01",hasta],actual,dia}}
async function cargarCmpLocal(){const R=cmpRangos(),k=R.A[0]+"|"+R.B[1];if(cmpCargando||cmpKey===k||!NUBE.activo)return;cmpCargando=true;cmpLocal=null;
  try{const r=await fetch(`local/api/docs.php?a=resumen&desde=${R.A[0]}&hasta=${R.B[1]}`,{credentials:"same-origin",cache:"no-store"});const j=await r.json();
    cmpLocal=r.ok?j.dias||{}:{error:j.error||"sin acceso"};if(r.ok&&j.sucs)resSucs=j.sucs}catch(e){cmpLocal={error:"sin conexión"}}
  cmpKey=k;cmpCargando=false;if(mod==="informes"&&infTab==="comparar")pintarSistema()}
/* usa el mismo cálculo del Resumen, para un período dado */
function cmpDatos(d1,d2){const g=[resD1,resD2,resLocal];resD1=d1;resD2=d2;resLocal=cmpLocal&&!cmpLocal.error?cmpLocal:null;try{return datosResumen2()}finally{resD1=g[0];resD2=g[1];resLocal=g[2]}}
const cmpVar=(a,b)=>{if(!a&&!b)return "–";if(!a)return "▲ nuevo";const p=Math.round((b-a)/Math.abs(a)*100);return (p>=0?"▲ ":"▼ ")+Math.abs(p)+"%"};
function vistaComparar(){cargarCmpLocal();const R=cmpRangos(),A=cmpDatos(R.A[0],R.A[1]),B=cmpDatos(R.B[0],R.B[1]);
  const mesN=s=>{const x=new Date(s+"T12:00").toLocaleDateString("es-CL",{month:"long",year:"numeric"});return x.charAt(0).toUpperCase()+x.slice(1)};
  const la=mesN(R.A[0]),lb=mesN(R.B[0]),canales=["local","chofer",...(D.precios&&D.precios.sinMayorista?[]:["may"])];
  const tot=(X,k)=>canales.reduce((s,c)=>s+X.C[c][k],0),n=v=>Number(v).toLocaleString("es-CL");
  const cols=(x,ty)=>[[x,"t"],[la,ty],[lb,ty],["Diferencia",ty],["Variación","t"]];
  const fila=(x,a,b)=>[x,a,b,b-a,cmpVar(a,b)];
  const sumar=f=>fila("TOTAL",f.reduce((s,x)=>s+x[1],0),f.reduce((s,x)=>s+x[2],0));
  const unir=(xa,xb)=>{const m=new Map();xa.forEach(o=>m.set(o.n,[o.venta,0]));xb.forEach(o=>{const x=m.get(o.n)||[0,0];x[1]=o.venta;m.set(o.n,x)});
    return [...m].sort((p,q)=>q[1][1]-p[1][1]||q[1][0]-p[1][0]).map(([x,[a,b]])=>fila(x,a,b))};
  const fCanal=canales.map(k=>fila(RES_TXT[k],A.C[k].venta,B.C[k].venta)),fSuc=unir(A.sl,B.sl),fCho=unir(A.ch,B.ch);
  const fForm=FORMATOS.map(f=>fila(f.tipo==="h"?"H15":f.kg+" kg",canales.reduce((s,k)=>s+(A.C[k].f[f.id]||0),0),canales.reduce((s,k)=>s+(B.C[k].f[f.id]||0),0))).filter(x=>x[1]||x[2]);
  const per=R.actual?`del 1 al ${R.dia} de cada mes`:"meses completos";
  const kpi=(x,a,b,fm)=>`<div><span>${x}</span><b class="num">${fm(b)}</b><small class="cmp-v ${b>=a?"sube":"baja"}">${cmpVar(a,b)} · ${la.split(" ")[0]}: ${fm(a)}</small></div>`;
  const aviso=cmpLocal&&cmpLocal.error?`<p class="nota" style="margin:0 0 8px">No se pudo leer la venta de Venta Local (${esc(cmpLocal.error)}).</p>`:(!cmpLocal&&NUBE.activo?'<p class="nota" style="margin:0 0 8px">Cargando venta de Venta Local…</p>':"");
  return cabeza("Informes",`<button class="btn chico linea" type="button" data-imprimir>Imprimir</button>`)+tabsInf()+
  `<div class="res-top"><span class="res-et">Mes</span><input type="month" id="cmp-mes" value="${cmpMes}" max="${hoyStr().slice(0,7)}"><span class="nota" style="margin:0">comparado con <b>${la}</b> · ${per}${R.actual?" (mismos días, para que sea justo)":""}</span></div>`+aviso+
  `<div class="res-kpi">${kpi("Ventas",tot(A,"venta"),tot(B,"venta"),clp)}${kpi("Cilindros vendidos",tot(A,"cil"),tot(B,"cil"),n)}${kpi("Kilos vendidos",tot(A,"kg"),tot(B,"kg"),n)}</div>`+
  resTabla("c-canal","Ventas por canal",per,cols("Canal","$"),fCanal,sumar(fCanal))+
  (fSuc.length?resTabla("c-suc","Ventas por sucursal",per,cols("Sucursal","$"),fSuc,sumar(fSuc)):"")+
  resTabla("c-cho","Ventas por chofer",per,cols("Chofer","$"),fCho,sumar(fCho))+
  resTabla("c-form","Cilindros vendidos por formato",per,cols("Formato","n"),fForm,sumar(fForm))+
  `<p class="nota" style="margin:4px 0 0">▲ subió · ▼ bajó, respecto de ${la}. No incluye ventas anuladas.</p>`}
{const v0=V.informes;V.informes=function(){if(infTab==="comparar")return vistaComparar();return v0.apply(this,arguments)}}
{const l0=L.informes;L.informes=function(){const r=l0?l0.apply(this,arguments):undefined;
  if(infTab==="comparar"){const mi=$("#cmp-mes");if(mi)mi.onchange=()=>{if(mi.value){cmpMes=mi.value;pintarSistema()}};
    document.querySelectorAll(".res-t td").forEach(td=>{const x=td.textContent;if(x.startsWith("▲"))td.classList.add("verde");else if(x.startsWith("▼"))td.classList.add("rojo")});
    document.querySelectorAll("[data-copiar]").forEach(b=>b.onclick=()=>{const tb=RES_TABLAS[b.dataset.copiar];if(!tb)return;
      const txt=[tb.cols.map(c=>c[0]),...tb.filas,...(tb.total&&tb.filas.length>1?[tb.total]:[])].map(f=>f.join("\t")).join("\n");
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>aviso("Tabla copiada","Péguela en Excel."),()=>aviso("No se pudo copiar","Seleccione la tabla y cópiela."))})}
  return r}}

/* ===================== RESPALDOS → COPIA EN GOOGLE DRIVE ===================== */
async function pintarDrive(){const z=document.getElementById("rb-drive");if(!z)return;let j;
  try{j=await api("drive_estado")}catch(e){z.innerHTML=`<b>Copia en Google Drive</b><p class="error">${esc(e.message)}</p>`;return}
  const est=j.conectado?`<span class="gd-est ok">● Conectado${j.cuenta?" a "+esc(j.cuenta):""}</span>`:j.configurado?'<span class="gd-est">● Falta dar el permiso en Google</span>':'<span class="gd-est">● No conectado</span>';
  z.innerHTML=`<div class="gd-h"><b>Copia en Google Drive</b>${est}</div>
  <p class="nota" style="margin:2px 0 8px">Cada respaldo automático se copia también a la carpeta «MR Gas respaldos» de su Google Drive. Si el hosting falla, los datos siguen a salvo. El sistema solo puede ver los archivos que él mismo sube.</p>
  ${j.conectado?`<div class="rb-fila"><button class="btn" type="button" id="gd-subir">☁ Subir respaldo ahora</button><button class="btn linea" type="button" id="gd-quitar">Desconectar</button></div>
    <p class="nota" style="margin:6px 0 0">Última copia: <b>${j.ultimo?esc(j.ultimo):"todavía ninguna"}</b></p>`:""}
  ${j.error?`<p class="error" style="margin:6px 0 0">Último error: ${esc(j.error)}</p>`:""}
  ${j.conectado?"":`<details class="rb-cron" ${j.configurado?"":"open"}><summary>Cómo conectarlo (una sola vez)</summary><ol>
    <li>Entre a <b>console.cloud.google.com</b> con la cuenta de Google donde quiere guardar los respaldos y cree un proyecto nuevo (por ejemplo «MR Gas respaldos»).</li>
    <li>En <b>APIs y servicios → Biblioteca</b> busque <b>Google Drive API</b> y presione <b>Habilitar</b>.</li>
    <li>En <b>Pantalla de consentimiento</b> (Google Auth Platform): tipo <b>Externo</b>, ponga un nombre y su correo. Luego en <b>Público</b> presione <b>Publicar app</b> (si queda «en prueba», el permiso vence a los 7 días).</li>
    <li>En <b>Clientes</b> (o Credenciales) cree un <b>ID de cliente de OAuth</b> tipo <b>Aplicación web</b>. En «URI de redireccionamiento autorizados» pegue:<br><code id="gd-uri">${esc(j.vuelta)}</code> <button class="btn chico linea" type="button" id="gd-copiar">⧉ Copiar</button></li>
    <li>Google le muestra el <b>ID de cliente</b> y el <b>Secreto del cliente</b>. Péguelos aquí abajo, presione <b>Guardar datos</b> y después <b>Conectar con Google</b>.</li></ol></details>
  <div class="rb-g gd-g"><label>ID de cliente<input id="gd-cliente" autocomplete="off" spellcheck="false" placeholder="…apps.googleusercontent.com"></label><label>Secreto del cliente<input id="gd-secreto" type="password" autocomplete="new-password"></label></div>
  <div class="rb-fila"><button class="btn linea" type="button" id="gd-guardar">Guardar datos</button><button class="btn" type="button" id="gd-conectar" ${j.configurado?"":"disabled"}>Conectar con Google</button>${j.configurado?`<span class="nota" style="margin:0">Datos guardados (${esc(j.cliente||"")})</span>`:""}</div>`}`;
  const cp=$("#gd-copiar");if(cp)cp.onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(j.vuelta):Promise.reject()).then(()=>aviso("Dirección copiada","Péguela en Google, en «URI de redireccionamiento autorizados»."),()=>{})};
  const gg=$("#gd-guardar");if(gg)gg.onclick=async()=>{try{await api("drive_config",{cliente:$("#gd-cliente").value,secreto:$("#gd-secreto").value});aviso("Datos guardados","Ahora presione «Conectar con Google».");pintarDrive()}catch(e){aviso("No se pudo guardar",e.message)}};
  const gc=$("#gd-conectar");if(gc)gc.onclick=async()=>{try{const r=await api("drive_conectar");location.href=r.url}catch(e){aviso("No se pudo conectar",e.message)}};
  const gs=$("#gd-subir");if(gs)gs.onclick=async()=>{gs.disabled=true;gs.textContent="Subiendo…";try{const r=await api("drive_subir",{});aviso("Respaldo subido a Google Drive",r.archivo+(r.borrados?` · se borraron ${r.borrados} copias antiguas`:""));pintarRespBD()}catch(e){aviso("No se pudo subir",e.message);pintarDrive()}};
  const gq=$("#gd-quitar");if(gq)gq.onclick=()=>confirmar(gq,async()=>{try{await api("drive_quitar",{});aviso("Google Drive desconectado","Los respaldos que ya subió siguen en su Drive.");pintarDrive()}catch(e){aviso("No se pudo",e.message)}})}
{const p0=pintarRespBD;pintarRespBD=async function(){if(NUBE.activo&&!respCfg)return;let r;try{r=await p0.apply(this,arguments)}catch(e){}const z=document.getElementById("resp-bd");
  if(z&&!document.getElementById("rb-drive")){const c=z.querySelector(".rb-cron"),h='<div class="rb-drive" id="rb-drive"><b>Copia en Google Drive</b><p class="nota">Cargando…</p></div>';
    if(c)c.insertAdjacentHTML("afterend",h);else z.insertAdjacentHTML("beforeend",h);pintarDrive()}return r}}
/* sin servidor (vista de prueba): se explica dónde aparece */
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(mod==="config"&&cfgTab==="respaldos"&&esAdmin()&&!NUBE.activo&&!document.getElementById("rb-sin")){const z=document.querySelector(".cfg-main");
    if(z)z.insertAdjacentHTML("afterbegin",'<section class="caja rb-caja" id="rb-sin"><h3>Respaldo de la base de datos y copia en Google Drive</h3><p class="nota" style="margin:0">Estas opciones aparecen cuando el sistema está instalado en su servidor (Hostinger). Esta es una vista de prueba sin servidor.</p></section>')}}catch(e){}
  return r}}
/* al volver desde Google con el permiso */
{const q=new URLSearchParams(location.search).get("drive");if(q){let n=0;const t0=setInterval(()=>{if(++n>40){clearInterval(t0);return}if(!yo||!NUBE.activo)return;clearInterval(t0);
  history.replaceState(null,"",location.pathname+"#panel");cfgTab="respaldos";ir("config");
  const m={ok:["Google Drive conectado","Desde ahora cada respaldo automático se copia también a su Drive."],cancelado:["Conexión cancelada","No se dio el permiso en Google."],error:["No se pudo conectar Google Drive","Revise el ID, el secreto y la dirección de regreso en Google."],sesion:["Sesión vencida","Entre de nuevo y vuelva a conectar."]}[q]||["Google Drive",""];
  aviso(m[0],m[1])},300)}}

/* ===================== LICENCIA (clientes que arriendan el sistema) ===================== */
let licInfo=null;
function licUI(l){licInfo=l||null;const v=document.getElementById("lic-pausa");
  if(l&&l.estado==="pausado"){if(v)return;document.body.insertAdjacentHTML("beforeend",`<div class="lic-pausa" id="lic-pausa" role="alertdialog" aria-modal="true"><div><div class="lic-ico">⏸</div><h2>Servicio pausado</h2><p>${esc((l.mensaje||"").replace(/^Servicio pausado\.\s*/,"")||"Comuníquese con su proveedor.")}</p><p class="nota">Sus datos están guardados y seguros. Apenas se reactive el servicio, todo vuelve a funcionar igual.</p><button class="btn" type="button" id="lic-rev">Volver a revisar</button></div></div>`);
    document.getElementById("lic-rev").onclick=()=>location.reload();return}
  if(v)v.remove();pintarAvisoLic()}
function pintarAvisoLic(){const l=licInfo;const b=document.getElementById("lic-aviso");if(b)b.remove();
  if(!l||!l.pago_hasta||!yo||!esAdmin())return;const dias=Math.round((new Date(l.pago_hasta+"T12:00")-new Date(hoyStr()+"T12:00"))/864e5);if(dias>5)return;
  try{if(sessionStorage.getItem("lic_cerrado")===l.pago_hasta)return}catch(e){}
  const m=dias<0?`El pago del servicio venció el ${fF(l.pago_hasta)}. Regularícelo para evitar que se pause.`:dias===0?"El pago del servicio vence hoy.":`El pago del servicio vence el ${fF(l.pago_hasta)} (en ${dias} día${dias===1?"":"s"}).`;
  const main=document.querySelector(".sis main, main");if(!main)return;
  main.insertAdjacentHTML("afterbegin",`<div class="lic-aviso ${dias<0?"vencido":""}" id="lic-aviso"><span>${m}</span><button type="button" class="x" aria-label="Cerrar aviso" id="lic-cerrar">✕</button></div>`);
  document.getElementById("lic-cerrar").onclick=()=>{try{sessionStorage.setItem("lic_cerrado",l.pago_hasta)}catch(e){}document.getElementById("lic-aviso").remove()}}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{pintarAvisoLic()}catch(e){}return r}}

/* ===================== RESPALDOS Y RESET: pide la contraseña del administrador ===================== */
let respCfg=false,respCfgRevisado=false;
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(mod==="config"&&cfgTab==="respaldos"&&yo){const z=document.querySelector(".cfg-main");
    if(z&&!respCfg){
      if(NUBE.activo&&!respCfgRevisado){respCfgRevisado=true;api("resp_estado").then(j=>{if(j.abierto){respCfg=true;pintarSistema()}}).catch(()=>{})}
      z.innerHTML=`<section class="caja rl-caja"><div class="rl-ico" aria-hidden="true">🔒</div><h3>Respaldos y reset</h3>
        <p class="nota">Por seguridad, esta sección pide su contraseña de administrador. Queda abierta 30 minutos.</p>
        <form id="rl-form" class="rl-form"><label>Contraseña de ${esc(yo.nombre||yo.usuario||"administrador")}<input type="password" id="rl-pass" autocomplete="current-password" required></label>
        <p class="error" id="rl-err" hidden></p><button class="btn" type="submit" id="rl-btn">Entrar</button></form></section>`;
      setTimeout(()=>{const i=$("#rl-pass");if(i)i.focus()},50);
      $("#rl-form").onsubmit=async e=>{e.preventDefault();const er=$("#rl-err"),bt=$("#rl-btn");er.hidden=true;bt.disabled=true;
        try{if(NUBE.activo)await api("resp_entrar",{pass:$("#rl-pass").value});
          else{const h=await hash($("#rl-pass").value);if((yo.hash||"")!==h)throw new Error("La contraseña no es correcta.")}
          respCfg=true;log("sistema","Entró a Respaldos y reset","");guardar();pintarSistema()}
        catch(x){er.textContent=x.message;er.hidden=false;bt.disabled=false;$("#rl-pass").value="";$("#rl-pass").focus()}}}
    else if(z&&respCfg&&!document.getElementById("rl-cerrar")){z.insertAdjacentHTML("afterbegin",'<div class="rl-barra"><span>🔓 Respaldos y reset abierto</span><button class="btn chico linea" type="button" id="rl-cerrar">Cerrar con llave</button></div>');
      $("#rl-cerrar").onclick=async()=>{respCfg=false;respCfgRevisado=true;try{if(NUBE.activo)await api("resp_cerrar",{})}catch(e){}pintarSistema()}}}}catch(e){console.error(e)}
  return r}}

/* ===================== MAPA EN VIVO: dónde va cada camión ===================== */
let mapaCentrado=false,mapaLF=null,mapaCapa=null,mapaDatos=null,mapaRastro=false,mapaTimer=null,mapaSel=null,leafletCargando=null;
const puedeMapa=()=>!!yo&&(esAdmin()||(yo.rol==="encargado"&&(!Array.isArray(yo.permisos)||["ruta","ruta:ver","choferes","choferes:ver","pedidos"].some(x=>yo.permisos.includes(x)))));
function cargarLeaflet(){if(window.L&&window.L.map)return Promise.resolve(window.L);if(leafletCargando)return leafletCargando;
  leafletCargando=new Promise((ok,mal)=>{const c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(c);
    const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.onload=()=>ok(window.L);s.onerror=()=>{leafletCargando=null;mal(new Error("No se pudo cargar el mapa. Revise internet."))};document.head.appendChild(s)});
  return leafletCargando}
const haceTxt=s=>s<60?"recién":s<3600?`hace ${Math.round(s/60)} min`:`hace ${Math.floor(s/3600)} h ${Math.round(s%3600/60)} min`;
const frescura=s=>s<180?"ok":s<900?"ojo":"viejo";
V.mapa=function(){
  if(!puedeMapa())return cabeza("Mapa en vivo")+'<p class="nota">No tiene permiso para ver el mapa.</p>';
  if(!NUBE.activo)return cabeza("Mapa en vivo")+'<section class="caja"><p class="nota" style="margin:0">El mapa en vivo funciona con el sistema instalado en el servidor (Hostinger) y los repartidores usando la App repartidores.</p></section>';
  return cabeza("Mapa en vivo",`<label class="mp-ras"><input type="checkbox" id="mp-ras" ${mapaRastro?"checked":""}> Ver recorrido de hoy</label>`)+
  `<div class="mp-g"><aside class="caja mp-lista" id="mp-lista"><p class="nota">Cargando…</p></aside><div class="caja mp-mapa"><div id="mp-mapa"></div></div></div>
  <p class="nota" style="margin:6px 0 0">Se actualiza solo cada 20 segundos. Cada repartidor aparece mientras tiene abierta la App repartidores con la ubicación activada. ● verde: hace menos de 3 min · ● amarillo: menos de 15 min · ● gris: más.</p>`};
L.mapa=function(){if(!puedeMapa()||!NUBE.activo)return;
  const r=$("#mp-ras");if(r)r.onchange=()=>{mapaRastro=r.checked;mapaCargar()};
  mapaLF=null;mapaCentrado=false;cargarLeaflet().then(LF=>{const el=document.getElementById("mp-mapa");if(!el)return;
    mapaLF=LF.map(el,{zoomControl:true}).setView([-33.45,-70.66],11);
    LF.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(mapaLF);
    mapaCapa=LF.layerGroup().addTo(mapaLF);mapaPintar(true)}).catch(e=>{const el=document.getElementById("mp-mapa");if(el)el.innerHTML=`<p class="error" style="padding:16px">${esc(e.message)}</p>`});
  mapaCargar();clearInterval(mapaTimer);mapaTimer=setInterval(()=>{if(mod!=="mapa"){clearInterval(mapaTimer);mapaTimer=null;return}if(!document.hidden)mapaCargar()},20000)};
async function mapaCargar(){try{mapaDatos=await api("ubicaciones",null,mapaRastro?"&rastro=1":"")}catch(e){const l=$("#mp-lista");if(l)l.innerHTML=`<p class="error">${esc(e.message)}</p>`;return}mapaPintar(false)}
function mapaPintar(centrar){const lista=$("#mp-lista");if(!lista||!mapaDatos)return;const U=mapaDatos.ubicaciones||{};
  const chs=chOrden().filter(c=>c.activo!==false),con=chs.filter(c=>U[c.id]),sin=chs.filter(c=>!U[c.id]);
  const enRuta=id=>(D.pedidos||[]).filter(p=>p.estado==="ruta"&&String(p.chofer)===String(id)).length;
  lista.innerHTML=`<h3>Camiones (${con.length} de ${chs.length})</h3>`+(con.length?con.sort((a,b)=>U[a.id].hace-U[b.id].hace).map(c=>{const u=U[c.id];
    return `<button type="button" class="mp-ch ${String(mapaSel)===String(c.id)?"sel":""}" data-mpch="${esc(c.id)}"><i class="mp-dot ${frescura(u.hace)}"></i><span><b>${esc(c.nombre)}</b><small>${haceTxt(u.hace)}${u.vel!=null?` · ${Math.round(u.vel)} km/h`:""} · ${enRuta(c.id)} en ruta</small></span></button>`}).join(""):'<p class="nota">Ningún repartidor está compartiendo su ubicación ahora.</p>')+
    (sin.length?`<details class="mp-sin"><summary>Sin ubicación (${sin.length})</summary><p class="nota">${sin.map(c=>esc(c.nombre)).join(", ")}</p><p class="nota">Para aparecer, el repartidor debe abrir la App repartidores y permitir la ubicación.</p></details>`:"");
  $$("[data-mpch]").forEach(b=>b.onclick=()=>{mapaSel=b.dataset.mpch;const u=U[mapaSel];if(mapaLF&&u)mapaLF.setView([u.lat,u.lon],15);mapaPintar(false)});
  if(!mapaLF||!mapaCapa)return;const LF=window.L;mapaCapa.clearLayers();const pts=[];
  con.forEach((c,i)=>{const u=U[c.id],col=["#1a66d6","#12b76a","#f79009","#7a5af8","#e31b54","#0ba5ec","#66c61c","#dd2590"][i%8];
    if(mapaRastro&&u.rastro&&u.rastro.length>1)LF.polyline(u.rastro,{color:col,weight:4,opacity:.7}).addTo(mapaCapa);
    (D.pedidos||[]).filter(p=>p.estado==="ruta"&&String(p.chofer)===String(c.id)).forEach(p=>{const g=typeof ubicar==="function"?ubicar(p):null;if(g&&g.lat)LF.circleMarker([g.lat,g.lon],{radius:6,color:col,weight:2,fillColor:"#fff",fillOpacity:1}).bindTooltip(`Pedido N° ${esc(p.id)} · ${esc(p.dir||"")}`).addTo(mapaCapa)});
    const ic=LF.divIcon({className:"mp-pin",html:`<div class="mp-pin-in ${frescura(u.hace)}" style="--c:${col}"><span>🚚</span><b>${esc(c.nombre.split(" ")[0])}</b></div>`,iconSize:null,iconAnchor:[18,36]});
    LF.marker([u.lat,u.lon],{icon:ic,zIndexOffset:String(mapaSel)===String(c.id)?1000:0}).bindPopup(`<b>${esc(c.nombre)}</b><br>${haceTxt(u.hace)}${u.prec?` · precisión ±${u.prec} m`:""}<br>${enRuta(c.id)} pedidos en ruta`).addTo(mapaCapa);pts.push([u.lat,u.lon])});
  mapaLF.invalidateSize();
  if((centrar||!mapaCentrado)&&pts.length){mapaCentrado=true;mapaLF.fitBounds(pts,{padding:[60,60],maxZoom:15})}}
/* botón en Asigna Ruta */
{const l0=L.ruta;L.ruta=function(){const r=l0?l0.apply(this,arguments):undefined;
  try{if(puedeMapa()&&!document.getElementById("b-mapa")){const c=document.querySelector(".cab-mod");if(c){c.insertAdjacentHTML("beforeend",'<button class="btn" type="button" id="b-mapa">🗺 Mapa en vivo</button>');$("#b-mapa").onclick=()=>ir("mapa")}}}catch(e){}return r}}

/* ===================== TÉRMINOS DE USO Y PRIVACIDAD: el administrador los acepta una vez (y de nuevo si cambian) ===================== */
let termRevisado=false;
function termModal(v){if(document.getElementById("term-dl"))return;
  document.body.insertAdjacentHTML("beforeend",`<div class="lic-pausa" id="term-dl" role="dialog" aria-modal="true" aria-labelledby="term-tit"><div class="term-caja">
    <h2 id="term-tit">Términos de uso y privacidad</h2>
    <p>Antes de seguir, lea los <b>Términos de uso</b> y la <b>Política de privacidad</b> del sistema. Explican qué datos se guardan (incluida la ubicación de los repartidores), para qué se usan y quién es responsable.</p>
    <p><a class="btn linea" href="terminos/" target="_blank" rel="noopener">Leer términos y privacidad ↗</a></p>
    <label class="term-ok"><input type="checkbox" id="term-chk"> Leí y acepto los Términos de uso y la Política de privacidad en nombre de la empresa.</label>
    <p class="error" id="term-err" hidden></p>
    <button class="btn" type="button" id="term-btn" disabled>Aceptar y continuar</button></div></div>`);
  const ch=$("#term-chk"),bt=$("#term-btn");ch.onchange=()=>bt.disabled=!ch.checked;
  bt.onclick=async()=>{bt.disabled=true;try{await api("terminos_aceptar",{version:v});log("sistema","Aceptó términos de uso y privacidad","versión "+v);guardar();document.getElementById("term-dl").remove()}
    catch(e){const er=$("#term-err");er.textContent=e.message;er.hidden=false;bt.disabled=false}}}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(yo&&esAdmin()&&NUBE.activo&&!termRevisado){termRevisado=true;api("terminos").then(j=>{if(!j.aceptado&&yo&&esAdmin())termModal(j.version)}).catch(()=>{termRevisado=false})}}catch(e){}
  return r}}
{const s0=salir;salir=function(){termRevisado=false;const d=document.getElementById("term-dl");if(d)d.remove();return s0.apply(this,arguments)}}
/* enlace en la pantalla de ingreso */
{const fl=document.getElementById("form-login");if(fl&&!document.getElementById("lg-term"))fl.insertAdjacentHTML("afterend",'<p class="lg-dev" id="lg-term"><a href="terminos/" target="_blank" rel="noopener">Términos de uso y privacidad</a></p>')}

/* ===================== RESPALDOS → IMPORTAR DATOS DE OTRO VENTA LOCAL ===================== */
let impRes=null;
async function impEnviar(ver,mapa){const f=$("#imp-arch").files[0];if(!f)throw new Error("Elija el archivo .json.");
  let arch=f;
  // se comprime antes de subir (un año de ventas pesa ~5 MB; comprimido ~0,5 MB)
  if(window.CompressionStream&&!/\.gz$/i.test(f.name)){try{arch=new File([await new Response(f.stream().pipeThrough(new CompressionStream("gzip"))).blob()],f.name+".gz",{type:"application/gzip"})}catch(e){arch=f}}
  const fd=new FormData();fd.append("archivo",arch);if(mapa)fd.append("mapa",JSON.stringify(mapa));
  const r=await fetch("local/api/docs.php?a=importar"+(ver?"&ver=1":""),{method:"POST",credentials:"same-origin",headers:{"X-MRGas":"1"},body:fd});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok||!j){if(r.status===423){respCfg=false;setTimeout(pintarSistema,0)}throw new Error((j&&j.error)||"No se pudo leer el archivo (puede ser muy grande o no ser el correcto).")}
  return j}
function pintarImp(){const z=$("#imp-cuerpo");if(!z)return;
  if(!impRes){z.innerHTML=`<p class="nota" style="margin:0 0 8px">Sirve cualquiera de estos dos archivos:<br>• <b>Venta Local antiguo:</b> Informes → Descargar base de datos (archivo <b>.json</b>).<br>• <b>Otro MR Gas:</b> Configuraciones → Respaldos y reset → Descargar respaldo (archivo <b>.json.gz</b>). Se toma solo su Venta Local.</p>
    <div class="rb-fila"><input type="file" id="imp-arch" accept=".json,.gz,application/json"><button class="btn linea" type="button" id="imp-ver">Revisar archivo</button></div><p class="error" id="imp-err" hidden></p>`;
    $("#imp-ver").onclick=async()=>{const b=$("#imp-ver"),er=$("#imp-err");er.hidden=true;b.disabled=true;b.textContent="Revisando…";
      try{impRes=await impEnviar(true);impRes.archivoNombre=$("#imp-arch").files[0].name;impRes.file=$("#imp-arch").files[0];pintarImp()}catch(e){er.textContent=e.message;er.hidden=false}b.disabled=false;b.textContent="Revisar archivo"};return}
  const R=impRes,fF2=f=>f?fF(f):"—";
  z.innerHTML=`<p class="nota" style="margin:0 0 8px">Archivo <b>${esc(R.archivoNombre)}</b>${R.fecha?" · descargado el "+esc(R.fecha):""}. Elija qué sucursales traer y con qué nombre quedan aquí.</p>
  <div class="tabla-wrap"><table class="imp-t"><thead><tr><th></th><th>Sucursal en el archivo</th><th class="der">Ventas</th><th>Desde – hasta</th><th class="der">Rendiciones</th><th>Queda aquí como</th></tr></thead><tbody>
  ${R.sucursales.map((s,i)=>`<tr><td><input type="checkbox" data-impchk="${i}" ${s.ventas||s.rend?"checked":""} aria-label="Importar ${esc(s.archivo)}"></td><td><b>${esc(s.archivo)}</b></td><td class="der num">${s.ventas.toLocaleString("es-CL")}</td><td class="num">${fF2(s.desde)} – ${fF2(s.hasta)}</td><td class="der num">${s.rend}</td>
    <td><input class="imp-nom" data-impnom="${i}" value="${esc(s.destino)}" maxlength="40">${s.conDatos?`<small class="imp-av">Ya existe «${esc(s.archivo)}» con datos aquí: se importa con otro nombre para no mezclar.</small>`:s.existe?'<small class="imp-ok">Se llena la sucursal que ya existe (está vacía).</small>':'<small class="imp-ok">Sucursal nueva, con su propia bodega.</small>'}</td></tr>`).join("")}
  </tbody></table></div>
  ${R.usuarios.length?`<details class="rb-cron"><summary>Usuarios del Venta Local antiguo (${R.usuarios.length}) — se crean aparte</summary><p class="nota">Las claves antiguas no se pueden traer. Créelos en <b>Configuraciones → Usuarios</b> con permiso de Venta Local y sus sucursales:</p><ul>${R.usuarios.map(u=>`<li><b>${esc(u.nombre||u.usuario)}</b> (${esc(u.usuario)}) · ${esc(u.rol||"vendedor")} · ${u.sucursales.map(esc).join(", ")}</li>`).join("")}</ul></details>`:""}
  <p class="nota" style="margin:8px 0">Antes de importar se guarda solo un respaldo de cómo está todo ahora. Los datos que ya tiene no se modifican.</p>
  <div class="rb-fila"><button class="btn" type="button" id="imp-ok">Importar sucursales marcadas</button><button class="btn linea" type="button" id="imp-otro">Elegir otro archivo</button></div><p class="error" id="imp-err" hidden></p>`;
  $("#imp-otro").onclick=()=>{impRes=null;pintarImp()};
  $("#imp-ok").onclick=async()=>{const b=$("#imp-ok"),er=$("#imp-err");er.hidden=true;const mapa={};
    R.sucursales.forEach((s,i)=>{if($(`[data-impchk="${i}"]`).checked)mapa[s.archivo]=$(`[data-impnom="${i}"]`).value.trim()});
    if(!Object.keys(mapa).length){er.textContent="Marque al menos una sucursal.";er.hidden=false;return}
    b.disabled=true;b.textContent="Importando…";
    try{const dt=new DataTransfer();dt.items.add(R.file);const inp=document.createElement("input");inp.type="file";inp.id="imp-arch";inp.hidden=true;inp.files=dt.files;z.appendChild(inp);
      const j=await impEnviar(false,mapa);inp.remove();log("sistema","Importó datos de otro Venta Local",j.importadas.join(", ")+` · ${j.ventas} ventas`);guardar();
      impRes=null;pintarImp();aviso("Importación lista",`${j.importadas.join(", ")} · ${j.ventas.toLocaleString("es-CL")} ventas. Respaldo previo: ${j.respaldo}`);
      try{const f=document.querySelector("#vl-capa iframe");if(f)f.contentWindow.location.reload()}catch(e){}if(typeof pintarRespBD==="function")pintarRespBD()}
    catch(e){const x=$("#imp-arch");if(x&&x.hidden)x.remove();er.textContent=e.message;er.hidden=false;b.disabled=false;b.textContent="Importar sucursales marcadas"}}}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(mod==="config"&&cfgTab==="respaldos"&&respCfg&&NUBE.activo&&esAdmin()&&!document.getElementById("imp-vl")){const z=document.querySelector(".cfg-main");
    if(z){const rb=document.getElementById("resp-bd"),h='<section class="caja rb-caja" id="imp-vl"><h3>Importar datos de otro Venta Local</h3><div id="imp-cuerpo"></div></section>';
      if(rb)rb.insertAdjacentHTML("afterend",h);else z.insertAdjacentHTML("beforeend",h);pintarImp()}}}catch(e){console.error(e)}
  return r}}
/* botones de imprimir (sin código en el HTML, para la protección del navegador) */
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-imprimir]"))window.print()});

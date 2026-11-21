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
/* botones de imprimir (sin código en el HTML, para la protección del navegador) */
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-imprimir]"))window.print()});

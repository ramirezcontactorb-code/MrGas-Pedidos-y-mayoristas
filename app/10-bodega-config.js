/* MR Gas · Panel General · 10-bodega-config */
/* ===================== CONTROL DE BODEGA rediseñado: bodega (llenos / vacíos) y carga de cada camión ===================== */
{const v0=V.bodega,l0=L.bodega;
V.bodega=function(){
  const TABS=[["stock","Stock","bodega"],["cargas","Carga camión","ruta"],...(puede("compras")||puede("bodega")?[["ingreso","Ingreso de carga","compras"]]:[])];
  if(!TABS.some(t=>t[0]===bTab))bTab="stock";
  const side=`<aside class="vc-side caja">${TABS.map(([k,t,ic])=>`<button type="button" class="vc-t${k==="stock"||k==="cargas"||k==="ingreso"?"":" chico"}" data-btab="${k}" aria-selected="${bTab===k}">${k==="stock"||k==="cargas"||k==="ingreso"?svg(ic):""}<span>${t}</span></button>`).join("")}</aside>`;
  let main;
  if(bTab==="stock")main=vistaStockBodega();
  else if(bTab==="ingreso")main=V.compras().replace(">Compras y Devoluciones<",">Ingreso de carga<");
  else main=v0().replace(/<div class="tabs" role="tablist">[\s\S]*?<\/div>/,"");
  return `<div class="vc-lay">${side}<div class="vc-main">${main}</div></div>`};
function vistaStockBodega(){
  const l=ensureLoc(loc(suc)),min=D.precios.minimo||0,hoy=hoyStr();
  const chs=D.choferes.filter(c=>c.local===suc).map(ensureCh).sort((a,b)=>((b.activo!==false)-(a.activo!==false))||a.nombre.localeCompare(b.nombre));
  const sum=(arr,k)=>{const o=st();arr.forEach(c=>FORMATOS.forEach(f=>o[f.id]+=(c[k]||{})[f.id]||0));return o};
  const tot=o=>FORMATOS.reduce((s,f)=>s+(o[f.id]||0),0);
  const enCam=sum(chs,"carga"),vacCam=sum(chs,"vacios"),bajos=FORMATOS.filter(f=>(l.stock[f.id]||0)<min);
  const n=v=>`<b class="num ${v<0?"neg":""}">${v}</b>`;
  const tarjeta=c=>{const tl=tot(c.carga),tv=tot(c.vacios),hoyC=cargadoDe(c.id,hoy),on=c.activo!==false;
    return `<article class="bd-cam ${tl?"":"vacio"} ${on?"":"off"}"><div class="bd-cam-h"><div><b>${esc(c.nombre)}</b><small>${esc(c.patente||"Sin patente")}</small></div>
      <span class="bd-cam-tot"><b class="num">${tl}</b><small>llenos</small></span></div>
      <table class="bd-mini"><thead><tr><th></th>${FORMATOS.map(f=>`<th>${f.tipo==="h"?"H15":f.kg}</th>`).join("")}</tr></thead><tbody>
        <tr><td>Llenos</td>${FORMATOS.map(f=>`<td class="num ${(c.carga[f.id]||0)<0?"neg":(c.carga[f.id]||0)?"":"cero"}">${c.carga[f.id]||0}</td>`).join("")}</tr>
</tbody></table>
      <div class="bd-cam-p"><span>${tot(hoyC)?`Cargado hoy: <b>${esc(resumenQ(hoyC))}</b>`:"Hoy sin carga registrada"}${on?"":" · <b>No activo</b>"}</span>
        <button class="btn chico linea" type="button" data-bcargar="${c.id}">Editar carga</button></div></article>`};
  return cabeza("Control de Bodega",`<span class="nota" style="margin:0">${fechaLarga(hoy)}</span>`)+
  (bajos.length?`<div class="banner" style="background:#fef3f2;color:#b42318">Stock bajo en bodega: ${bajos.map(f=>`${f.et} (${l.stock[f.id]||0})`).join(", ")}. Mínimo: ${min}.</div>`:"")+`
  <div class="kpis bd-kpis"><div class="kpi"><span>Llenos en bodega</span><b class="num" id="bd-k-ll">${tot(l.stock)}</b></div><div class="kpi"><span>Vacíos en bodega</span><b class="num" id="bd-k-va">${tot(l.vacios)}</b></div>
    <div class="kpi"><span>Llenos en camiones</span><b class="num">${tot(enCam)}</b></div><div class="kpi"><span>Prestados a clientes</span><b class="num" id="bd-k-pe">${tot(l.prestados)}</b></div><div class="kpi bd-kt"><span>Stock total</span><b class="num" id="bd-kt-n">${tot(l.stock)+tot(l.vacios)+tot(l.prestados)}</b></div></div>
  <div class="bd-dos"><section class="caja bd-bod"><h3>Stock de bodega</h3><div class="vc-card"><div class="vc-g bd-g" style="--n:${FORMATOS.length}">
    <div class="vc-izq bd-leyenda"><span class="bd-l ll">Llenos</span><span class="bd-l va">Vacíos</span><span class="bd-l pr">Prestados</span><span class="bd-l ca">En camiones</span><span class="bd-l tt">Stock total</span></div>
    ${FORMATOS.map(f=>`<div class="vc-col"><div class="vc-img">${cilBlanco(f)}</div><span class="vc-et"><b>${f.tipo==="h"?"H15":f.kg}</b> ${f.tipo==="h"?"Aluminio":"kg"}</span>
      <span class="bd-v ll ${(l.stock[f.id]||0)<min?"bajo":""}" data-bl="${f.id}">${n(l.stock[f.id]||0)}</span><span class="bd-v va" data-bv="${f.id}">${n(l.vacios[f.id]||0)}</span><span class="bd-v pr" data-bp="${f.id}">${n(l.prestados[f.id]||0)}</span><span class="bd-v ca">${n(enCam[f.id]||0)}</span><span class="bd-v tt" data-tt="${f.id}">${n((l.stock[f.id]||0)+(l.vacios[f.id]||0)+(l.prestados[f.id]||0))}</span></div>`).join("")}
  </div></div>
  <div class="bd-univ"><span id="bd-univ-t">Stock total = bodega (llenos + vacíos + prestados): <b class="num">${tot(l.stock)+tot(l.vacios)+tot(l.prestados)}</b>. Los camiones van aparte.</span>
</div></section>
  <div class="bd-der"><section class="bd-cams-h"><h3>Carga de los camiones</h3><span class="nota" style="margin:0">Lo que lleva cada camión ahora. Las entregas y ventas se descuentan de su carga.</span></section>
  <div class="bd-cams">${chs.map(tarjeta).join("")||'<div class="caja"><p>Esta sucursal no tiene camiones. Agréguelos en Configuraciones → Choferes.</p></div>'}</div></div></div>
  ${D.locales.filter(x=>misSucs().includes(x.id)).length>1?`<section class="caja" style="margin-top:12px"><h3>Bodega de ${esAdmin()?"todas las sucursales":"sus sucursales"}</h3><div class="tabla-wrap"><table><thead><tr><th>Sucursal</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th class="der">Total llenos</th><th class="der">Vacíos</th></tr></thead><tbody>
    ${D.locales.filter(x=>misSucs().includes(x.id)).map(x=>{ensureLoc(x);return `<tr><td>${esc(x.nombre)}</td>${FORMATOS.map(f=>`<td class="der num">${(x.stock[f.id]||0)<min?`<span class="pill bajo">${x.stock[f.id]||0}</span>`:x.stock[f.id]||0}</td>`).join("")}<td class="der num"><b>${tot(x.stock)}</b></td><td class="der num">${tot(x.vacios)}</td></tr>`}).join("")}</tbody></table></div></section>`:""}`;
}
L.bodega=function(){l0();
  {const c=document.querySelector(".bd-cams");if(c&&innerWidth>900){const h=innerHeight-c.getBoundingClientRect().top-14;if(h>160&&c.scrollHeight>h){c.style.maxHeight=h+"px";c.style.overflow="auto"}}}
  $$("[data-bcargar]").forEach(b=>b.onclick=()=>{bChofer=+b.dataset.bcargar;bTab="cargas";pintarSistema();window.scrollTo(0,0)});};
}

/* ===================== CONFIGURACIONES con el formato de Venta Local ===================== */
const CFG_IC={sucLocal:"sucursal",precioBase:"precios",preciosLocal:"precios",precios:"precios",envases:"precios",clientesMay:"usuarios",descQR:"precios",preciosMay:"precios",comVale:"cuadratura",histPrecios:"manual",histCambios:"manual",usuarios:"usuarios",choferes:"choferes",sectorizar:"ruta",sucursal:"sucursal",general:"bodega",respaldos:"config"};
// Precio del Gas
CFG_MAY.precios={v(){const p=D.precios,prog=(D.programados||[]).slice().sort((a,b)=>a.desde.localeCompare(b.desde));
  return `<div style="max-width:900px"><form class="cfgp" id="f-pr"><h3>Precio domicilio</h3>
    <p class="cfgp-nota">Es el precio de cada cilindro para pedidos a domicilio y venta de choferes${D.locales.length>1?` en las ${D.locales.length} sucursales`:""}. Vigente desde el ${fechaLarga(p.fecha)}. Cada cambio queda en el Historial de Precios.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Cilindro</th><th class="c">Precio actual</th><th class="c">Precio nuevo</th><th class="c">Cambio</th></tr></thead><tbody>
    ${FORMATOS.map(f=>`<tr><td><b>Cilindro ${f.tipo==="h"?"H15A":f.kg+"N"}</b> <span class="gris">${f.tipo==="h"?"Aluminio":f.kg+" kilos"}</span></td><td class="c azul">${clp(p[f.id])}</td><td class="pn"><span>$</span><input type="number" min="0" step="1" id="pn-${f.id}" value="${p[f.id]}" aria-label="Precio nuevo ${f.et}"></td><td class="c" id="dif-${f.id}"></td></tr>`).join("")}
    </tbody></table></div>
    <div class="cfgp-opc"><label>Subir o bajar todos en<input id="aj-monto" type="number" min="0" step="10" value="500"></label><label>Tipo<select id="aj-tipo"><option value="pesos">Pesos</option><option value="pct">Porcentaje</option></select></label>
      <div class="acc"><button type="button" class="btn chico linea" data-aj="1">▲ Subir</button><button type="button" class="btn chico linea" data-aj="-1">▼ Bajar</button></div>
      <label>Rige desde<input type="date" id="pn-desde" value="${hoyStr()}"></label><div class="acc"><button type="button" class="btn chico linea" id="pn-hoy">Desde hoy</button><button type="button" class="btn chico linea" id="pn-jueves">Próximo jueves</button></div>
      <label class="g2">Motivo (opcional)<input id="pn-motivo" placeholder="Ej: alza semanal del proveedor"></label></div>
    <div class="cfgp-btn"><button class="btn" type="submit">Guardar precios</button></div>
    <p class="error" id="pn-error" hidden style="text-align:center"></p><p class="aviso ok" id="pn-ok" hidden></p>
    ${prog.length?`<h3 class="sub">Cambios programados</h3><div class="tabla-wrap cfgt"><table><thead><tr><th>Rige desde</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("")}<th></th></tr></thead><tbody>
      ${prog.map(x=>`<tr><td>${fechaLarga(x.desde)}</td>${FORMATOS.map(f=>`<td class="c azul">${clp(x.precios[f.id])}</td>`).join("")}<td class="c"><button class="x-rojo" data-cancelar="${x.id}" type="button" aria-label="Cancelar cambio">✕</button></td></tr>`).join("")}</tbody></table></div>`:""}</form>
</div>`},
  l(){L.precios()}};
// Precio de envases
CFG_MAY.envases={v(){const PE=D.preciosEnvase||{};return `<form class="cfgp" id="f-env"><h3>Precio de envases</h3>
    <p class="cfgp-nota">Es lo que se cobra cuando el cliente se lleva el cilindro sin entregar un vacío. Si dejas un precio en 0, ese envase no se puede vender. Cada cambio queda en el Historial de Precios.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Envase</th><th class="c">Precio actual</th><th class="c">Precio nuevo</th></tr></thead><tbody>
    ${FORMATOS.map(f=>`<tr><td><b>Envase ${f.tipo==="h"?"H15A":f.kg+"N"}</b>${f.tipo==="h"?' <span class="gris">Aluminio</span>':""}</td><td class="c ${PE[f.id]?"azul":"gris mono"}">${PE[f.id]?clp(PE[f.id]):"No se vende"}</td><td class="pn"><span>$</span><input type="number" min="0" data-penv="${f.id}" value="${PE[f.id]||0}" aria-label="Precio envase ${f.et}"></td></tr>`).join("")}
    </tbody></table></div><div class="cfgp-btn"><button class="btn" type="submit">Guardar precios de envases</button></div></form>`},
  l(){const f=$("#f-env");if(!f)return;f.onsubmit=e=>{e.preventDefault();D.preciosEnvase=D.preciosEnvase||{};let n=0;
    $$("[data-penv]").forEach(i=>{const k=i.dataset.penv,v=Math.max(0,Math.round(+i.value||0)),a=D.preciosEnvase[k]||0;if(v!==a){histMay("Precio envase",k,a,v);D.preciosEnvase[k]=v;n++}});
    if(!n){aviso("Sin cambios","No cambió ningún precio.");return}guardar();pintarSistema();aviso("Precios de envases guardados",`${n} precio(s) actualizado(s).`);envALocal()}}};
// Historiales
const histFila=x=>`<tr><td class="num">${esc(fF(x.fecha))} <span class="gris">${esc((x.fecha||"").slice(11,16))}</span></td><td>${esc(x.user||"")}</td><td><b>${esc(x.accion||"")}</b></td><td>${esc(x.detalle||"")}</td></tr>`;
CFG_MAY.histPrecios={v(){const H=D.historialPrecios||[],B=(D.bitacora||[]).filter(x=>x.area==="precios").slice(0,200);
  return `<section class="cfgp"><h3>Historial de precios del gas</h3>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Rige desde</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("")}<th>Hecho por</th></tr></thead><tbody>
    ${H.length?H.map(h=>`<tr><td class="num">${esc(h.desde.split("-").reverse().join("-"))}</td>${FORMATOS.map(f=>`<td class="c"><span class="azul">${clp(h.nuevos[f.id])}</span><br>${difPrecio(h.ant[f.id],h.nuevos[f.id])}</td>`).join("")}<td>${esc(h.user)}${h.motivo?`<br><small class="gris">${esc(h.motivo)}</small>`:""}</td></tr>`).join(""):`<tr><td colspan="${FORMATOS.length+2}" class="vacio">Todavía no hay cambios de precio.</td></tr>`}
    </tbody></table></div>
    <h3 class="sub">Otros precios (mayoristas, envases, vales y QR)</h3>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Cambio</th><th>Detalle</th></tr></thead><tbody>${B.map(histFila).join("")||'<tr><td colspan="4" class="vacio">Sin cambios registrados.</td></tr>'}</tbody></table></div></section>`},l(){}};
CFG_MAY.histCambios={v(){const B=(D.bitacora||[]).filter(x=>["sistema","precios"].includes(x.area)).slice(0,300);
  return `<section class="cfgp"><h3>Historial de cambios</h3><p class="cfgp-nota izq">Cambios en la configuración: usuarios, choferes, precios, accesos y sucursales.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Cambio</th><th>Detalle</th></tr></thead><tbody>${B.map(histFila).join("")||'<tr><td colspan="4" class="vacio">Sin cambios registrados.</td></tr>'}</tbody></table></div></section>`},l(){}};
// menú lateral
{const vc=V.config;V.config=function(){const h=vc.apply(this,arguments),k="<!--CFGTABS-->",i=h.indexOf(k);if(i<0)return h;
  const T=cfgTabsLista(),sep=["usuarios","choferes"];
  const side=`<aside class="cfg-side caja">${T.map(([id,t],j)=>`${id==="choferes"&&j?'<hr>':""}<button type="button" class="vc-t" data-cfgtab="${id}" aria-selected="${cfgTab===id}">${svg(CFG_IC[id]||"config")}<span>${t}</span></button>`).join("")}</aside>`;
  return h.slice(0,i)+`<div class="cfg-lay">${side}<div class="cfg-main">${h.slice(i+k.length)}</div></div>`}}
{const lc=L.config;L.config=function(){lc.apply(this,arguments);$$(".cfgp [data-cfgtab]").forEach(a=>a.onclick=e=>{e.preventDefault();cfgTab=a.dataset.cfgtab;cfgCh=null;pintarSistema()})}}

/* ===== Seguridad como en Venta Local ===== */
function dlSeg(html,onok){
  let dl=document.getElementById("dl-seg");if(!dl){dl=document.createElement("dialog");dl.id="dl-seg";dl.className="dl-estado";document.body.appendChild(dl)}
  dl.innerHTML=html;dl.showModal();
  const f=dl.querySelector("form"),er=dl.querySelector(".error");dl.querySelector("[data-cerrar]").onclick=()=>dl.close();
  f.onsubmit=async e=>{e.preventDefault();er.hidden=true;const b=f.querySelector("button[type=submit]");b.disabled=true;
    try{await onok(f);dl.close()}catch(x){er.textContent=x.message||"No se pudo.";er.hidden=false}finally{b.disabled=false}};
  setTimeout(()=>{const i=f.querySelector("input");if(i)i.focus()},30)}
function pedirAutorizacionInformes(){
  dlSeg(`<form><h3 style="margin:0 0 6px">Informes</h3><p class="nota" style="margin:0 0 12px">No tiene permiso para Informes. Ingrese los datos de alguien que sí tenga permiso.</p>
    <label>Usuario con permiso de Informes<input id="au-user" autocomplete="off" required></label>
    <label style="margin-top:8px">Clave<input id="au-pass" type="password" autocomplete="off" required></label>
    <p class="error" hidden></p>
    <div class="acc" style="margin-top:14px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn" type="submit">Abrir Informes</button></div></form>`,
  async f=>{const u=$("#au-user").value.trim().toLowerCase(),p=$("#au-pass").value;
    if(NUBE.activo){const r=await api("autorizar",{user:u,pass:p});infPor=r.por}
    else{const h=await hash(p),x=D.usuarios.find(z=>z.user===u&&z.hash===h&&z.activo!==false);
      const okp=x&&(x.rol==="admin"||(x.rol==="encargado"&&(!Array.isArray(x.permisos)||x.permisos.includes("informes")||x.permisos.includes("informes:ver"))));
      if(!okp)throw new Error("Usuario o clave incorrectos, o ese usuario no tiene permiso de Informes.");infPor=x.nombre}
    log("sistema","Informes autorizado","Por "+infPor);guardar();ir("informes")})}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{$$("[data-infaut]").forEach(b=>b.onclick=pedirAutorizacionInformes);
    if(mod==="informes"&&infPor&&yo&&yo.rol==="encargado"&&!$("#inf-por")){const h=$("#sis-main .cab-mod")||$("#sis-main h2");
      if(h)h.insertAdjacentHTML("afterend",`<p class="nota" id="inf-por" style="margin:0 0 10px">Autorizado por ${esc(infPor)} · se cierra al salir del sistema.</p>`)}}catch(e){}
  return r}}

/* Respaldos con contraseña especial */
async function respEstado(){if(NUBE.activo)return api("respaldo_estado");return {tiene:!!D.respaldoHash,abierto:false}}
function cajaResp(tiene){
  return tiene?`<form class="caja" id="f-rsl" style="max-width:460px"><h3>Respaldos protegidos</h3><p class="nota" style="margin:0 0 12px">Escriba la contraseña especial de respaldo.</p>
      <label>Contraseña especial<input id="rsl-pass" type="password" autocomplete="off" required></label><p class="error" id="rsl-err" hidden></p>
      <div class="acc" style="margin-top:12px"><button class="btn" type="submit">Abrir respaldos</button></div></form>`
    :`<form class="caja" id="f-rsn" style="max-width:520px"><h3>Crear contraseña especial</h3><p class="nota" style="margin:0 0 12px">Los respaldos tienen todos los datos del sistema. Cree una contraseña especial, distinta a la de su usuario. Se pedirá cada vez que entre aquí.</p>
      <label>Su clave de usuario<input id="rsn-mia" type="password" autocomplete="current-password" required></label>
      <div class="fila" style="margin-top:8px"><label>Contraseña especial (mín. 8)<input id="rsn-n1" type="password" autocomplete="new-password" minlength="8" required></label><label>Repetir<input id="rsn-n2" type="password" autocomplete="new-password" required></label></div>
      <p class="error" id="rsn-err" hidden></p><div class="acc" style="margin-top:12px"><button class="btn" type="submit">Guardar y abrir</button></div></form>`}
{const v0=V.respaldos;V.respaldos=function(){if(!respOk)return cabeza("Respaldos")+`<div id="rs-lock"><p class="nota">Revisando…</p></div>`;
  return v0.apply(this,arguments).replace(`<div class="grid dos" style="gap:24px">`,`<div class="acc" style="margin:-6px 0 14px"><button class="btn chico linea" id="rs-cambiar" type="button">Cambiar contraseña especial</button><button class="btn chico linea" id="rs-cerrar" type="button">Cerrar respaldos</button></div><div class="grid dos" style="gap:24px">`)}}
{const l0=L.respaldos;L.respaldos=async function(){
  if(respOk){l0.apply(this,arguments);const c=$("#rs-cerrar");if(c)c.onclick=()=>{respOk=false;pintarSistema()};const k=$("#rs-cambiar");if(k)k.onclick=cambiarClaveResp;return}
  let e;try{e=await respEstado()}catch(x){const z=$("#rs-lock");if(z)z.innerHTML=`<p class="error">${esc(x.message)}</p>`;return}
  if(e.abierto){respOk=true;return pintarSistema()}
  const z=$("#rs-lock");if(!z)return;z.innerHTML=cajaResp(e.tiene);
  const fl=$("#f-rsl");if(fl){$("#rsl-pass").focus();fl.onsubmit=async ev=>{ev.preventDefault();const er=$("#rsl-err");er.hidden=true;
    try{const p=$("#rsl-pass").value;if(NUBE.activo)await api("respaldo_abrir",{pass:p});else if(await hash(p)!==D.respaldoHash)throw new Error("Contraseña especial incorrecta.");
      respOk=true;log("sistema","Respaldos abiertos","");guardar();pintarSistema()}catch(x){er.textContent=x.message;er.hidden=false;$("#rsl-pass").value=""}}}
  const fn=$("#f-rsn");if(fn)fn.onsubmit=async ev=>{ev.preventDefault();const er=$("#rsn-err");er.hidden=true;
    try{const n=$("#rsn-n1").value;if(n!==$("#rsn-n2").value)throw new Error("Las dos contraseñas no son iguales.");if(n.length<8)throw new Error("Debe tener al menos 8 caracteres.");
      if(NUBE.activo)await api("respaldo_fijar",{mia:$("#rsn-mia").value,nueva:n});else{if(await hash($("#rsn-mia").value)!==yo.hash)throw new Error("Su clave de usuario no es correcta.");D.respaldoHash=await hash(n)}
      respOk=true;log("sistema","Contraseña de respaldos creada","");guardar();pintarSistema()}catch(x){er.textContent=x.message;er.hidden=false}}}}
function cambiarClaveResp(){
  dlSeg(`<form><h3 style="margin:0 0 10px">Cambiar contraseña especial</h3>
    <label>Su clave de usuario<input id="cr-mia" type="password" required></label>
    <label style="margin-top:8px">Contraseña especial actual<input id="cr-ant" type="password" required></label>
    <label style="margin-top:8px">Nueva contraseña especial (mín. 8)<input id="cr-n1" type="password" minlength="8" required></label>
    <label style="margin-top:8px">Repetir nueva<input id="cr-n2" type="password" required></label><p class="error" hidden></p>
    <div class="acc" style="margin-top:14px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn" type="submit">Cambiar</button></div></form>`,
  async()=>{const n=$("#cr-n1").value;if(n!==$("#cr-n2").value)throw new Error("Las dos contraseñas nuevas no son iguales.");if(n.length<8)throw new Error("Debe tener al menos 8 caracteres.");
    if(NUBE.activo)await api("respaldo_fijar",{mia:$("#cr-mia").value,anterior:$("#cr-ant").value,nueva:n});
    else{if(await hash($("#cr-mia").value)!==yo.hash||await hash($("#cr-ant").value)!==D.respaldoHash)throw new Error("Alguna clave no es correcta.");D.respaldoHash=await hash(n)}
    log("sistema","Contraseña de respaldos cambiada","");guardar();aviso("Listo","La contraseña especial de respaldos fue cambiada.")})}

/* Conectados ahora (Configuraciones → Usuarios) */
var conTimer=null;
async function pintarConectados(){
  const z=$("#con-ahora");if(!z){clearInterval(conTimer);conTimer=null;return}
  let l=[];if(NUBE.activo){try{l=(await api("conectados")).conectados}catch(e){z.querySelector(".con-l").innerHTML=`<span class="nota">${esc(e.message)}</span>`;return}}
  else l=yo?[{nombre:yo.nombre,user:yo.user,rol:yo.rol,app:"erp",hace:0}]:[];
  const APP={erp:"Panel General",repartidores:"App repartidores",distribucion:"App distribución","":"Panel General"};
  z.querySelector(".con-n").textContent=l.length;
  z.querySelector(".con-l").innerHTML=l.length?l.map(c=>`<span class="con-c"><i></i><b>${esc(c.nombre)}</b><small>${esc(APP[c.app]||c.app)}${c.ip?" · "+esc(c.ip):""}</small></span>`).join(""):'<span class="nota">Nadie conectado ahora.</span>'}
{const l0=L.usuarios;L.usuarios=function(){const r=l0.apply(this,arguments);
  try{const f=$("#f-usr");if(f&&esAdmin()&&!$("#con-ahora")){f.insertAdjacentHTML("beforebegin",`<div class="caja" id="con-ahora"><div class="con-h"><b>Conectados ahora</b><span class="con-n">0</span><small>Se actualiza cada 30 segundos</small></div><div class="con-l"><span class="nota">Cargando…</span></div></div>`);
    pintarConectados();clearInterval(conTimer);conTimer=setInterval(()=>{if(!document.hidden)pintarConectados()},30000)}}catch(e){}
  return r}}

/* Quién agregó cada pago o cargo de una rendición (solo lo ve el administrador) */
function porMi(){return yo?(yo.nombre||yo.user||""):""}
function porTag(o){return esAdmin()&&o&&o.por?`<small class="por-tag" title="Agregado por ${esc(o.por)}${o.hora?" · "+esc(String(o.hora).slice(0,16)):""}">${esc(o.por)}</small>`:""}

/* ===== Permisos de Venta Local (se dan aquí, en el Panel General) ===== */
let LOCAL_SUCS=['Cervantes','El Tranque','Maipo','Padre Damián','Olivos','Jr Coyhaique','Jr Parcelas','Chillán'],LOCAL_CFG=null;
const lslug=n=>n.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,'_');
const LOCAL_PERMS=[["Ventas",[["venta","Venta Local"],["anular","Anular ventas"],["rend","Rendición del local"],["mayor","Venta mayorista y su rendición"],["mcta","Ver cuenta clientes mayoristas"]]],
  ["Bodega",[["bodega","Ver resumen de bodega"],["bmov","Ingreso de carga"],["bvmov","Ver movimientos de bodega"],["bedit","Modificar stock"]]],
  ["Configuración",[["precios","Cambiar precios"],["com","Comisión de vales"],["phist","Historial de precios"],["theme","Colores (theme)"]]],
  ["Informes",[["inf","Informes de todas las sucursales"]]]];
const LOCAL_PLANT=[["Vendedor",["venta","rend","bodega"]],["Bodeguero",["bodega","bmov","bvmov","bedit"]],["Encargado de local",["venta","anular","rend","mayor","mcta","bodega","bmov","bvmov","bedit","precios","com","phist"]]];
const soloLocalP=p=>Array.isArray(p)&&p.includes("app.local")&&p.every(c=>/^(_v2|app\.|loc\.|lsuc\.|clave\.)/.test(c));
function camposLocal(p){const t=c=>!!(p&&p.includes(c));
  return `<fieldset class="acceso" id="us-local" ${t("app.local")?"":"hidden"}><legend>Venta Local</legend>
    <p class="perm-tit" style="margin:0 0 4px">Sucursales de Venta Local</p>
    <div class="checks-grid">${LOCAL_SUCS.map(x=>`<label class="radio"><input type="checkbox" name="us-lsuc" value="lsuc.${lslug(x)}" ${t("lsuc."+lslug(x))?"checked":""}>${esc(x)}</label>`).join("")}</div>
    <div class="pl-bar" style="margin-top:10px"><span>Plantilla rápida:</span>${LOCAL_PLANT.map(([n],i)=>`<button type="button" class="btn chico linea" data-lplant="${i}">${n}</button>`).join("")}<button type="button" class="btn chico linea" data-lplant="-1">Nada</button></div>
    <div class="loc-perm">${LOCAL_PERMS.map(([g,l])=>`<div class="loc-g"><p class="perm-tit">${g}</p>${l.map(([c,n])=>`<label class="radio"><input type="checkbox" name="us-lperm" value="loc.${c}" ${t("loc."+c)?"checked":""}>${n}</label>`).join("")}</div>`).join("")}</div>
    <p class="nota" style="margin:6px 0 0">Los mismos permisos valen para todas las sucursales marcadas. Si el usuario no tiene ningún cuadro del Panel General, solo puede entrar a Venta Local (no a la matriz). Los administradores pueden todo.</p></fieldset>`}
const leerAcceso=()=>{const a=leerAcceso0();if(a.permisos.includes("app.local"))a.permisos.push(...[...$$('input[name="us-lsuc"]:checked'),...$$('input[name="us-lperm"]:checked')].map(i=>i.value));return a};
function resumenLocal(p){if(!Array.isArray(p)||!p.includes("app.local"))return "";
  const ss=LOCAL_SUCS.filter(x=>p.includes("lsuc."+lslug(x))),ps=LOCAL_PERMS.flatMap(([,l])=>l).filter(([c])=>p.includes("loc."+c)).map(([,n])=>n);
  return `Venta Local${soloLocalP(p)?" (solo Venta Local)":""}: ${ss.length?ss.join(", "):"sin sucursal"} · ${ps.length?ps.join(", "):"sin permisos"}`}
{const l0=L.usuarios;L.usuarios=function(){const r=l0.apply(this,arguments);
  try{const fs=$("#us-local"),rol=$("#us-rol"),ck=$('input[name="us-app"][value="app.local"]');
    const upd=()=>{if(fs)fs.hidden=!(ck&&ck.checked&&rol&&rol.value==="encargado")};if(ck)ck.addEventListener("change",upd);if(rol)rol.addEventListener("change",upd);upd();
    $$("[data-lplant]").forEach(b=>b.onclick=()=>{const i=+b.dataset.lplant,set=i<0?[]:LOCAL_PLANT[i][1];$$('input[name="us-lperm"]').forEach(x=>x.checked=set.includes(x.value.slice(4)))})}catch(e){}
  return r}}

/* ===== Precio base (uno solo para todo) y precios de Venta Local ===== */
const LID={c5:"5",c11:"11",c15:"15",c45:"45",h15a:"H15A"};
const LOC_DEF={"5":{venta:12900,envase:28000},"11":{venta:22600,envase:51000},"15":{venta:30400,envase:40000},"45":{venta:90500,envase:98000},"H15A":{venta:27000,envase:0}};
let LOC_INDEP=["Chillán"];
const locCompartidas=()=>LOCAL_SUCS.filter(x=>!LOC_INDEP.includes(x));
const VTIPOS_L=["De la compañía","Otras compañías","Vale Digital","Digital Otras compañías"],VSIZES_L=["5","11","15","45","H"],QRS_L=["11","15"];
async function locLeer(paths){const r=await fetch("local/api/docs.php?a=leer&paths="+encodeURIComponent(paths.join(",")),{credentials:"same-origin",cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error||"No se pudo leer Venta Local");return j.docs}
async function locPrecios(body){const r=await fetch("local/api/docs.php?a=precios",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"No se pudo guardar en Venta Local")}
const etC=f=>f.tipo==="h"?"H15A":f.kg+"N";
CFG_MAY.precioBase={v(){const p=D.precios;
  return `<form class="cfgp" id="f-pbase" style="max-width:820px"><h3>Precio base</h3>
    <p class="cfgp-nota">Un solo precio por cilindro para todo el sistema. Al guardarlo se actualiza en: <b>Precio Domicilio</b> (pedidos a domicilio y venta de choferes), <b>precio base mayorista</b>, y en el <b>Venta Local</b> la venta local y el precio base mayorista de ${locCompartidas().length} sucursales (${LOC_INDEP.join(", ")} tiene precios propios, en «Precio Local»). Cada cambio queda en el Historial de Precios.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Cilindro</th><th class="c">Precio actual</th><th class="c">Precio base nuevo</th><th class="c">Cambio</th></tr></thead><tbody>
    ${FORMATOS.map(f=>`<tr><td><b>Cilindro ${etC(f)}</b> <span class="gris">${f.tipo==="h"?"Aluminio":f.kg+" kilos"}</span></td><td class="c azul">${clp(p[f.id])}</td><td class="pn"><span>$</span><input type="number" min="0" step="1" data-pb="${f.id}" value="${p[f.id]}" aria-label="Precio base ${f.et}"></td><td class="c" data-pbd="${f.id}"></td></tr>`).join("")}
    </tbody></table></div>
    <div class="cfgp-fila"><label class="g2">Motivo (opcional)<input id="pb-motivo" placeholder="Ej: alza semanal del proveedor"></label></div>
    <div class="cfgp-btn"><button class="btn" type="submit">Guardar precio base en todo el sistema</button></div>
    <p class="error" id="pb-err" hidden style="text-align:center"></p></form>`},
  l(){const f=$("#f-pbase");if(!f)return;
    const dif=()=>$$("[data-pb]").forEach(i=>{const d=$(`[data-pbd="${i.dataset.pb}"]`);if(d)d.innerHTML=difPrecio(D.precios[i.dataset.pb],Math.round(+i.value||0))});
    $$("[data-pb]").forEach(i=>i.oninput=dif);dif();
    f.onsubmit=async e=>{e.preventDefault();const er=$("#pb-err");er.hidden=true;const nuevos={};let mal=false;
      $$("[data-pb]").forEach(i=>{const v=Math.round(+i.value||0);if(v<=0)mal=true;nuevos[i.dataset.pb]=v});
      if(mal){er.textContent="Todos los precios deben ser mayores que cero.";er.hidden=false;return}
      const cambia=FORMATOS.some(x=>nuevos[x.id]!==D.precios[x.id]||nuevos[x.id]!==(D.preciosMayor||{})[x.id]);
      const b=f.querySelector("button[type=submit]");b.disabled=true;
      try{let local="";
        if(NUBE.activo){const venta={},mayor={};FORMATOS.forEach(x=>{venta[LID[x.id]]=nuevos[x.id];mayor[LID[x.id]]=nuevos[x.id]});
          const sucs={};locCompartidas().forEach(x=>sucs[lslug(x)]={venta});await locPrecios({global:{mayor},sucs});local=` y en ${locCompartidas().length} sucursales de Venta Local`}
        if(cambia){registrarPrecios(nuevos,yo.nombre,($("#pb-motivo").value.trim()||"Precio base"),hoyStr());D.preciosMayor=D.preciosMayor||{};
          FORMATOS.forEach(x=>{const a=D.preciosMayor[x.id]||0;if(a!==nuevos[x.id]){histMay("Precio base mayorista",x.id,a,nuevos[x.id]);D.preciosMayor[x.id]=nuevos[x.id]}});guardar()}
        pintarSistema();aviso("Precio base guardado",`Se actualizó en el Panel General${local}.`)}
      catch(x){er.textContent=x.message;er.hidden=false}finally{b.disabled=false}}}};

let locGrupo="comp",locDocs=null;
CFG_MAY.preciosLocal={v(){
  return `<section class="cfgp" id="s-ploc"><h3>Precio local (Venta Local)</h3>
    <div class="cfgp-fila"><label>Sucursales<select id="pl-grupo"><option value="comp" ${locGrupo==="comp"?"selected":""}>${esc(locCompartidas().join(", "))}</option>${LOC_INDEP.map(x=>`<option value="${esc(x)}" ${locGrupo===x?"selected":""}>${esc(x)} (precios propios)</option>`).join("")}</select></label></div>
    <div id="pl-cuerpo"><p class="nota">Cargando precios de Venta Local…</p></div></section>`},
  async l(){const sel=$("#pl-grupo");if(!sel)return;sel.onchange=()=>{locGrupo=sel.value;pintarSistema()};
    const z=$("#pl-cuerpo");
    if(!NUBE.activo){z.innerHTML='<p class="nota">Los precios de Venta Local se manejan cuando el sistema está publicado en el servidor.</p>';return}
    const comp=locGrupo==="comp",ref=comp?lslug(locCompartidas()[0]):lslug(locGrupo);
    try{locDocs=await locLeer(["app/global","suc/"+ref])}catch(x){z.innerHTML=`<p class="error">${esc(x.message)}</p>`;return}
    if(!$("#pl-cuerpo"))return;
    const g=locDocs["app/global"]||{},d=locDocs["suc/"+ref]||{},prods=d.products||[];
    const pv=(id,k)=>{const p=prods.find(x=>x.id===id);return p&&p[k]!=null?p[k]:(LOC_DEF[id]||{})[k]||0};
    const may=id=>comp?((g.mayor||{})[id]??pv(id,"mayor")):pv(id,"mayor");
    const com=(comp?g.comision:d.comision)||d.comision||{},qr=(comp?g.qr:d.qr)||d.qr||{};
    const fila=(f,campo,ro)=>{const id=LID[f.id],v=campo==="mayor"?may(id):pv(id,campo);return `<td class="pn"><span>$</span><input type="number" min="0" data-lc="${campo}|${id}" value="${v||0}" ${ro?"disabled":""}></td>`};
    z.innerHTML=`<div style="max-width:760px"><div>
      <h3 class="sub" style="margin-top:4px">Precio de venta al público</h3>
      <div class="tabla-wrap cfgt"><table><thead><tr><th>Cilindro</th><th class="c">Venta al público</th></tr></thead><tbody>
      ${FORMATOS.map(f=>`<tr><td><b>${etC(f)}</b></td>${fila(f,"venta",false)}</tr>`).join("")}</tbody></table></div>
      <p class="cfgp-nota" style="margin-top:6px">${comp?"La venta al público se guarda en todas estas sucursales. Al guardar el <b>Precio Base</b>, vuelve a quedar igual al precio base. El precio de envases es uno para todos y se cambia en «Precio Envases».":esc(locGrupo)+" tiene precio de venta propio. El precio de envases es uno para todos y se cambia en «Precio Envases»."}</p>
      <h3 class="sub">Descuento QR (por unidad)</h3>
      <div class="tabla-wrap cfgt angosta"><table><tbody>${QRS_L.map(x=>`<tr><td><b>Cilindro ${x} kg</b></td><td class="pn"><span>$</span><input type="number" min="0" data-lq="${x}" value="${qr[x]||0}"></td></tr>`).join("")}</tbody></table></div></div>
</div>
      <div class="cfgp-btn"><button class="btn" type="button" id="pl-guardar">Guardar precio local</button></div><p class="error" id="pl-err" hidden style="text-align:center"></p>`;
    $("#pl-guardar").onclick=async()=>{const er=$("#pl-err");er.hidden=true;const b=$("#pl-guardar");b.disabled=true;
      const venta={},envase={},mayor={};$$("[data-lc]").forEach(i=>{if(i.disabled)return;const [c,id]=i.dataset.lc.split("|"),v=Math.max(0,Math.round(+i.value||0));({venta,envase,mayor})[c][id]=v});
      const qrN={};$$("[data-lq]").forEach(i=>qrN[i.dataset.lq]=Math.max(0,Math.round(+i.value||0)));
      Object.assign(envase,envLocal());
      try{if(comp){const sucs={};locCompartidas().forEach(x=>sucs[lslug(x)]={venta,envase});await locPrecios({global:{qr:qrN},sucs})}
        else await locPrecios({sucs:{[lslug(locGrupo)]:{venta,envase,qr:qrN}}});
        log("precios","Precios de Venta Local",comp?"Sucursales: "+locCompartidas().join(", "):locGrupo);guardar();
        aviso("Precios guardados",`Se actualizaron en Venta Local (${comp?locCompartidas().length+" sucursales":locGrupo}).`);pintarSistema()}
      catch(x){er.textContent=x.message;er.hidden=false}finally{b.disabled=false}}}};

/* ===== Sucursales de Venta Local (cuántas, activas y con precios propios) ===== */
let sucLocCargando=false,sucLocNueva=[],sucLocBorrar=new Set();
function aplicarSucLocal(l){if(!Array.isArray(l)||!l.length)return;LOCAL_CFG=l.map(x=>({nombre:x.nombre,indep:!!x.indep,activa:x.activa!==false,bodega:x.bodega??null}));
  LOCAL_SUCS=LOCAL_CFG.map(x=>x.nombre);LOC_INDEP=LOCAL_CFG.filter(x=>x.indep).map(x=>x.nombre)}
async function cargarSucLocal(){if(sucLocCargando||LOCAL_CFG||!NUBE.activo||!yo||!esAdmin())return;sucLocCargando=true;
  try{const r=await fetch("local/api/docs.php?a=sucursales",{credentials:"same-origin",cache:"no-store"});const j=await r.json();if(r.ok){aplicarSucLocal(j.list);if(mod==="config")pintarSistema()}}catch(e){}finally{sucLocCargando=false}}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{cargarSucLocal()}catch(e){}return r}}
CFG_MAY.sucLocal={v(){const L=(LOCAL_CFG||LOCAL_SUCS.map(n=>({nombre:n,indep:LOC_INDEP.includes(n),activa:true}))).concat(sucLocNueva);
  return `<section class="cfgp" id="s-sucl" style="max-width:860px"><h3>Sucursales de Venta Local</h3>
    <p class="cfgp-nota">Aquí decides cuántas sucursales tiene Venta Local. <b>Precios iguales</b>: usa el Precio Base y los precios de «Precio Local» de todas. <b>Precios propios</b>: se cambian aparte (como Chillán). <b>Bodega</b>: «Misma que Casa Matriz» si es el mismo lugar; sus ventas descuentan de esa bodega y el stock no se suma dos veces (al unirla, su stock actual se pasa a la matriz). <b>Desactivar</b> la oculta y guarda sus datos. <b>Eliminar</b> (✕) la quita del todo; si tiene ventas o stock, se pide confirmar y esos datos se borran.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Sucursal</th><th class="c">Precios</th><th class="c">Bodega</th><th class="c">Activa</th><th class="c">Eliminar</th></tr></thead><tbody>
    ${L.map((x,i)=>`<tr class="${x.activa?"":"apagada"} ${sucLocBorrar.has(x.nombre)?"borrar":""}"><td><b>${esc(x.nombre)}</b>${i>=L.length-sucLocNueva.length?' <span class="pill">nueva</span>':""}${sucLocBorrar.has(x.nombre)?' <span class="pill rojo">se eliminará</span>':""}</td>
      <td class="c"><select data-sli="${i}"><option value="0" ${x.indep?"":"selected"}>Iguales a las demás</option><option value="1" ${x.indep?"selected":""}>Propios (independientes)</option></select></td>
      <td class="c"><select data-slb="${i}" title="La venta local descuenta del stock de esa bodega de la matriz">${D.locales.map((l,j)=>`<option value="${l.id}" ${x.bodega===l.id||(x.bodega==null&&j===0)?"selected":""}>Misma que ${esc(l.nombre)}</option>`).join("")}<option value="-1" ${x.bodega===-1?"selected":""}>Propia (aparte)</option></select></td>
      <td class="c"><input type="checkbox" data-sla="${i}" ${x.activa?"checked":""} aria-label="Activa ${esc(x.nombre)}"></td>
      <td class="c">${sucLocBorrar.has(x.nombre)?`<button class="btn chico linea" type="button" data-sld="${i}">Deshacer</button>`:`<button class="x-rojo" type="button" data-sld="${i}" aria-label="Eliminar ${esc(x.nombre)}">✕</button>`}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="cfgp-fila" style="margin-top:12px"><label class="g2">Nueva sucursal<input id="sl-nom" maxlength="40" placeholder="Ej: Rancagua"></label><button class="btn linea" type="button" id="sl-add">＋ Agregar</button></div>
    <div class="cfgp-btn"><button class="btn" type="button" id="sl-guardar">Guardar sucursales</button></div><p class="error" id="sl-err" hidden style="text-align:center"></p>
    ${NUBE.activo?"":'<p class="nota">Se guarda cuando el sistema está publicado en el servidor.</p>'}</section>`},
  l(){const z=$("#s-sucl");if(!z)return;
    const leer=()=>{const L=(LOCAL_CFG||LOCAL_SUCS.map(n=>({nombre:n,indep:LOC_INDEP.includes(n),activa:true}))).concat(sucLocNueva);
      return L.map((x,i)=>({nombre:x.nombre,indep:$(`[data-sli="${i}"]`).value==="1",activa:$(`[data-sla="${i}"]`).checked,bodega:($(`[data-slb="${i}"]`)||{}).value?+$(`[data-slb="${i}"]`).value:null}))};
    const fijar=()=>{const t=leer(),n=sucLocNueva.length;LOCAL_CFG=t.slice(0,t.length-n);sucLocNueva=t.slice(t.length-n)};
    $$("[data-sld]").forEach(b=>b.onclick=()=>{fijar();const L=LOCAL_CFG.concat(sucLocNueva),x=L[+b.dataset.sld];if(!x)return;
      const nueva=sucLocNueva.includes(x);if(nueva){sucLocNueva=sucLocNueva.filter(y=>y!==x)}else if(sucLocBorrar.has(x.nombre))sucLocBorrar.delete(x.nombre);else sucLocBorrar.add(x.nombre);pintarSistema()});
    $("#sl-add").onclick=()=>{const n=$("#sl-nom").value.trim().replace(/\s+/g," "),er=$("#sl-err");er.hidden=true;if(!n)return;
      if(!/^[\p{L}\p{N} -]+$/u.test(n)){er.textContent="Use solo letras, números, espacios o guion.";er.hidden=false;return}
      const todas=leer();if(todas.some(x=>lslug(x.nombre)===lslug(n))){er.textContent="Esa sucursal ya existe.";er.hidden=false;return}
      const prev=todas;LOCAL_CFG=prev.slice(0,prev.length-sucLocNueva.length);sucLocNueva=prev.slice(prev.length-sucLocNueva.length).concat([{nombre:n,indep:false,activa:true}]);pintarSistema()};
    $("#sl-guardar").onclick=async()=>{const er=$("#sl-err");er.hidden=true;const list=leer().filter(x=>!sucLocBorrar.has(x.nombre));const b=$("#sl-guardar");b.disabled=true;
      const enviar=async borrar=>{const r=await fetch("local/api/docs.php?a=sucursales",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({list,borrar})});const j=await r.json().catch(()=>({}));return {r,j}};
      try{let borrar=[],{r,j}=await enviar(borrar);
        while(r.status===409&&j.confirmar){const nom=j.confirmar;b.disabled=false;
          const ok=await new Promise(res=>{dlSeg(`<form><h3 style="margin:0 0 8px">Eliminar «${esc(nom)}»</h3><p class="nota" style="margin:0 0 10px">Esta sucursal tiene <b>ventas, rendiciones o stock</b> guardados. Si la elimina, <b>esos datos se borran y no se pueden recuperar</b>. Si solo quiere ocultarla, mejor desactívela.</p>
            <label>Escriba <b>${esc(nom)}</b> para confirmar<input id="sl-conf" autocomplete="off" required></label><p class="error" hidden></p>
            <div class="acc" style="margin-top:14px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn rojo" type="submit">Eliminar con sus datos</button></div></form>`,
            async()=>{if($("#sl-conf").value.trim().toLowerCase()!==nom.toLowerCase())throw new Error("El nombre no coincide.");res(true)});
            document.getElementById("dl-seg").addEventListener("close",()=>res(false),{once:true})});
          if(!ok)return;borrar.push(nom);b.disabled=true;({r,j}=await enviar(borrar))}
        if(!r.ok)throw new Error(j.error||"No se pudo guardar");sucLocNueva=[];sucLocBorrar=new Set();aplicarSucLocal(j.list);
        log("sistema","Sucursales de Venta Local",j.list.map(x=>x.nombre+(x.indep?" (precios propios)":"")+(x.activa?"":" (inactiva)")).join(", ")+((j.borradas||[]).length?" · eliminadas: "+j.borradas.join(", "):""));guardar();
        pintarSistema();aviso("Sucursales guardadas","Venta Local ya usa esta lista. Los usuarios que lo tengan abierto la verán al recargar la página.")}
      catch(x){er.textContent=x.message;er.hidden=false}finally{b.disabled=false}}}};

/* Pedidos de Gas compacto: Fuente al lado del teléfono */
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(mod==="pedidos"){const fu=document.querySelector(".ped-main>.fuente"),fi=fu&&fu.nextElementSibling;
    if(fu&&fi&&fi.classList.contains("fila")){fi.classList.add("fila-tel");fi.appendChild(fu)}}}catch(e){}
  return r}}

/* Pedido: botones − y + de cilindros y envases */
document.addEventListener("click",e=>{const b=e.target.closest(".np-step button");if(!b)return;e.preventDefault();
  const i=b.parentElement.querySelector("input");if(!i)return;const v=Math.max(0,(parseInt(i.value,10)||0)+(+b.dataset.paso));
  if(String(v)===i.value)return;i.value=v;i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}))});


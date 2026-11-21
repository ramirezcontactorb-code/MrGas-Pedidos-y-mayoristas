/* MR Gas · Panel General · 09-choferes */
/* ===================== CHOFERES: acceso a la App repartidores con clave del día ===================== */
const CHA={datos:null,cargando:false,error:"",msg:""};
async function cargarCHA(){if(CHA.cargando)return;CHA.cargando=true;
  try{CHA.datos=await api("choferes_acceso");CHA.error=""}catch(e){CHA.error=e.message;CHA.datos=null}
  CHA.cargando=false;if(mod==="choferes")pintarSistema()}
const usuarioSugerido=n=>String(n||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim().split(/\s+/).slice(0,2).join(".").replace(/[^a-z0-9._-]/g,"");
const urlRep=()=>location.origin+location.pathname.replace(/[^/]*$/,"")+"repartidores/";
function textoClave(u,c){const ch=D.choferes.find(x=>x.id===u.chofer),nom=(ch&&ch.nombre||u.nombre||"").split(" ")[0];
  return `Hola ${nom}, tu clave de hoy (${fF(CHA.datos.fecha).slice(0,5)}) para la App repartidores MR Gas es: ${c}\nUsuario: ${u.user}\nEntra en: ${urlRep()}`}
V.choferes=function(){
  const top=cabeza("Choferes");
  if(!NUBE.activo)return top+'<div class="caja"><p>Este cuadro funciona con el sistema conectado al servidor (Hostinger).</p></div>';
  if(CHA.error)return top+`<div class="caja"><p class="error">${esc(CHA.error)}</p><button class="btn" id="cha-recargar" type="button">Reintentar</button></div>`;
  if(!CHA.datos)return top+'<div class="caja"><p class="nota">Cargando choferes…</p></div>';
  const ver=soloVer("choferes"),hoy=CHA.datos.fecha,U=CHA.datos.usuarios,con=new Set(U.filter(u=>u.activo).map(u=>u.chofer));
  const libres=D.choferes.filter(c=>c.activo!==false&&!con.has(c.id)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const accDe=c=>U.filter(u=>u.chofer===c.id).sort((a,b)=>b.activo-a.activo)[0]||null;
  const fila=c=>{const u=accDe(c),fono=String(c.fono||"").replace(/\D/g,""),on=c.activo!==false;
    const wa=u&&fono?`https://wa.me/${fono.length===9?"56"+fono:fono}?text=${encodeURIComponent(textoClave(u,u.codigo||""))}`:"";
    return `<tr class="${on?"":"cha-off"}"><td><b>${esc(c.nombre)}</b><small class="nota" style="display:block;margin:0">${esc(c.patente||"Sin patente")}${D.locales.length>1?" · "+esc(nomLocal(c.local)):""}</small></td>
      <td><label class="cha-sw" title="${on?"Recibe pedidos en Asigna Ruta":"No aparece en Asigna Ruta"}"><input type="checkbox" data-chon="${c.id}" ${on?"checked":""} ${ver?"disabled":""}><span></span><b>${on?"Activo":"No activo"}</b></label></td>
      <td class="num">${u?esc(u.user):'<span class="nota" style="margin:0">Sin acceso</span>'}</td>
      <td>${!u?"":!u.activo?'<span class="pill anulado">Acceso quitado</span>':u.diaria?`<span class="cha-cod num">${u.codigo}</span>`:'<span class="nota" style="margin:0">Clave propia</span>'}</td>
      <td><div class="acc">${u&&u.activo&&u.diaria?(wa?`<a class="btn chico" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>`:"")+`<button class="btn chico linea" type="button" data-chacopiar="${u.uid}">Copiar mensaje</button>`:""}
        ${ver||!u?"":u.activo&&!u.diaria?`<button class="btn chico linea" type="button" data-chadiaria="${u.uid}">Usar clave del día</button>`:""}
        ${ver||!u?"":`<button class="btn chico linea" type="button" data-chaact="${u.uid}" data-v="${u.activo?0:1}">${u.activo?"Quitar acceso":"Dar acceso"}</button>`}</div></td></tr>`};
  const lista=chOrden(),nAct=lista.filter(c=>c.activo!==false).length;
  return top+`<p class="nota" style="margin:-8px 0 12px">Cada chofer entra a la <b>App repartidores</b> con su usuario y una <b>clave de 5 dígitos que cambia sola todos los días</b> a las 00:00. La clave no se guarda en ninguna parte: se calcula. Entréguesela cada mañana por WhatsApp o en persona.</p>
  <div class="cha-grid"><div>
    <div class="cha-hoy"><span>Claves del</span><b>${fechaLarga(hoy)}</b><button class="btn chico linea" id="cha-recargar" type="button">Actualizar</button></div>
    <div class="tabla-wrap"><table><thead><tr><th>Chofer</th><th>Activo <span class="nota" style="margin:0;text-transform:none;letter-spacing:0">(${nAct} de ${lista.length})</span></th><th>Usuario</th><th>Clave de hoy</th><th></th></tr></thead><tbody>
    ${lista.length?lista.slice().sort((a,b)=>((b.activo!==false)-(a.activo!==false))||a.nombre.localeCompare(b.nombre)).map(fila).join(""):'<tr><td colspan="5" class="nota">No hay choferes. Agréguelos en Configuraciones → Choferes.</td></tr>'}
    </tbody></table></div>
    <p class="nota" style="margin:6px 0 0"><b>Activo</b>: el móvil aparece en Asigna Ruta y en las apps para recibir pedidos. <b>No activo</b>: no aparece (por ejemplo, si hoy no trabaja). Sus pedidos y cuadraturas anteriores se conservan.</p><p class="nota" id="cha-msg" style="min-height:1em">${esc(CHA.msg)}</p></div>
    ${ver?'<div class="caja"><p class="nota">Solo puede ver este cuadro.</p></div>':`<form class="caja" id="f-cha"><h3>Dar acceso a un chofer</h3>
      <label>Chofer<select id="cha-ch">${libres.length?libres.map(c=>`<option value="${c.id}" data-nom="${esc(c.nombre)}" data-local="${c.local||""}">${esc(c.nombre)}${c.patente?" · "+esc(c.patente):""}</option>`).join(""):'<option value="">Todos los choferes ya tienen acceso</option>'}</select></label>
      <label>Usuario para entrar<input id="cha-user" autocomplete="off" placeholder="ej: cristian" value="${libres[0]?esc(usuarioSugerido(libres[0].nombre)):""}"></label>
      <p class="nota" style="margin:0">No necesita clave: el sistema le da una nueva cada día. Entra solo a la App repartidores y ve sus propios pedidos.</p>
      <button class="btn" type="submit" ${libres.length?"":"disabled"}>Crear acceso</button><p class="error" id="cha-err" hidden></p></form>`}
  </div>`};
L.choferes=function(){
  if(NUBE.activo&&!CHA.cargando&&(!CHA.datos||CHA.datos.fecha!==hoyStr())&&!CHA.error)cargarCHA();
  const r=$("#cha-recargar");if(r)r.onclick=()=>{CHA.error="";CHA.msg="";cargarCHA()};
  const sel=$("#cha-ch");if(sel)sel.onchange=()=>{const o=sel.selectedOptions[0];$("#cha-user").value=usuarioSugerido(o&&o.dataset.nom)};
  const f=$("#f-cha");if(f)f.onsubmit=async e=>{e.preventDefault();const o=sel.selectedOptions[0],er=$("#cha-err");er.hidden=true;
    try{await api("chofer_acceso",{chofer:+sel.value,user:$("#cha-user").value.trim().toLowerCase(),nombre:o.dataset.nom,local:+o.dataset.local||null});
      CHA.msg=`Listo: ${o.dataset.nom} ya puede entrar a la App repartidores con la clave de hoy.`;log("sistema","Acceso de chofer creado",o.dataset.nom);guardar();await cargarCHA()}
    catch(x){er.textContent=x.message;er.hidden=false}};
  $$("[data-chaact]").forEach(b=>b.onclick=()=>confirmar(b,async()=>{try{await api("chofer_acceso",{uid:+b.dataset.chaact,activo:b.dataset.v==="1"});CHA.msg=b.dataset.v==="1"?"Acceso activado.":"Acceso quitado: ese chofer ya no puede entrar.";await cargarCHA()}catch(x){CHA.msg=x.message;pintarSistema()}}));
  $$("[data-chadiaria]").forEach(b=>b.onclick=()=>confirmar(b,async()=>{try{await api("chofer_acceso",{uid:+b.dataset.chadiaria,diaria:true});CHA.msg="Ahora entra con la clave del día. Su clave anterior ya no sirve.";await cargarCHA()}catch(x){CHA.msg=x.message;pintarSistema()}}));
  $$("[data-chon]").forEach(i=>i.onchange=()=>{const c=D.choferes.find(x=>x.id===+i.dataset.chon);if(!c)return;c.activo=i.checked;nubeChofer(c);
    log("sistema",i.checked?"Móvil activado":"Móvil desactivado",c.nombre);CHA.msg=`${c.nombre}: ${i.checked?"activo, ya aparece en Asigna Ruta":"no activo, ya no aparece en Asigna Ruta"}.`;guardar();pintarSistema()});
  $$("[data-chacopiar]").forEach(b=>b.onclick=async()=>{const u=CHA.datos.usuarios.find(x=>x.uid===+b.dataset.chacopiar);
    try{await navigator.clipboard.writeText(textoClave(u,u.codigo));b.textContent="Copiado ✓"}catch(e){prompt("Copie el mensaje:",textoClave(u,u.codigo))}});
};
// a medianoche la lista se actualiza sola si está abierta
setInterval(()=>{if(mod==="choferes"&&CHA.datos&&CHA.datos.fecha!==hoyStr()){CHA.datos=null;pintarSistema()}},60000);

/* ===================== ASIGNA RUTA: corregir estado con el lápiz ===================== */
const EST_EDIT=[["pendiente","Por despachar","Vuelve a la lista para despachar (sin móvil)."],["ruta","En ruta","Lo lleva el móvil elegido."],["entregado","Entregado","Se descuenta de la carga del móvil elegido."],["anulado","Anulado","No se entrega. Si estaba entregado, vuelve el stock."]];
function corregirEstado(id){
  const p=D.pedidos.find(x=>x.id===+id);if(!p)return;
  let dl=document.getElementById("dl-estado");if(!dl){dl=document.createElement("dialog");dl.id="dl-estado";dl.className="dl-estado";document.body.appendChild(dl)}
  const chs=chOrden().filter(c=>c.activo!==false||c.id===p.chofer);
  dl.innerHTML=`<form method="dialog" id="f-est"><h3>Corregir estado · Pedido N° ${p.id}</h3>
    <p class="nota" style="margin:0 0 10px">${esc(resumenP(p))} · ${esc(p.dir||"")}<br>Estado actual: <b>${esc(ESTADOS[p.estado]||p.estado)}</b>${p.chofer?" · "+esc(nomChofer(p.chofer)):""}</p>
    <div class="est-ops">${EST_EDIT.map(([k,t,d])=>`<label class="est-op"><input type="radio" name="est-n" value="${k}" ${k===p.estado?"checked":""}><span><b>${t}</b><small>${d}</small></span></label>`).join("")}</div>
    <label id="est-ch-l">Móvil<select id="est-ch"><option value="">Elija el móvil…</option>${chs.map(c=>`<option value="${c.id}" ${c.id===p.chofer?"selected":""}>${esc(c.nombre)}${c.activo===false?" (no activo)":""}</option>`).join("")}</select></label>
    <label>Motivo (opcional)<input id="est-mot" maxlength="120" placeholder="Ej: el chofer lo marcó entregado por error"></label>
    <p class="error" id="est-err" hidden></p>
    <div class="acc" style="justify-content:flex-end;margin-top:6px"><button class="btn linea" value="cancel" type="button" id="est-cancel">Cancelar</button><button class="btn" type="submit" id="est-ok">Guardar cambio</button></div></form>`;
  const sel=()=>(dl.querySelector('input[name="est-n"]:checked')||{}).value;
  const upd=()=>{const v=sel();dl.querySelector("#est-ch-l").hidden=!(v==="ruta"||v==="entregado")};
  dl.querySelectorAll('input[name="est-n"]').forEach(r=>r.onchange=upd);upd();
  dl.querySelector("#est-cancel").onclick=()=>dl.close();
  dl.querySelector("#f-est").onsubmit=e=>{e.preventDefault();const v=sel(),chv=+dl.querySelector("#est-ch").value||null,er=dl.querySelector("#est-err"),mot=dl.querySelector("#est-mot").value.trim();
    if((v==="ruta"||v==="entregado")&&!chv){er.textContent="Elija el móvil.";er.hidden=false;return}
    if(v===p.estado&&(chv==null||chv===p.chofer)){dl.close();return}
    const antes=`${ESTADOS[p.estado]||p.estado}${p.chofer?" ("+nomChofer(p.chofer)+")":""}`;
    if(p.desc)setEstado(p,"ruta");            // primero devuelve el stock si estaba entregado
    if(v==="ruta"||v==="entregado")p.chofer=chv;
    if(v==="ruta"&&p.estado==="ruta"){nubePedido(p)}else setEstado(p,v);
    log("pedidos","Estado corregido",`Pedido N° ${p.id} · ${antes} → ${ESTADOS[v]||v}${p.chofer&&(v==="ruta"||v==="entregado")?" ("+nomChofer(p.chofer)+")":""}${mot?" · Motivo: "+mot:""}`,{local:p.local,chofer:p.chofer||null,pedido:p.id});
    guardar();dl.close();pintarSistema();aviso("Estado corregido",`Pedido N° ${p.id}: ${antes} → ${ESTADOS[v]||v}.`)};
  dl.showModal();
}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{if(mod==="ruta")$$("[data-editest]").forEach(b=>b.onclick=()=>corregirEstado(b.dataset.editest))}catch(e){}return r}}

/* ===================== VENTA DE REPARTIDOR: varias ventas al día que se suman, y «Rendir día» ===================== */
let vrCh=null;
const sumaVueltas=r=>{const v=st(),e=st();(r.vueltas||[]).filter(x=>!x.anulada).forEach(x=>FORMATOS.forEach(f=>{v[f.id]+=+(x.ventas||{})[f.id]||0;e[f.id]+=+(x.env||{})[f.id]||0}));return {v,e}};
function aplicarVueltas(r){const {v,e}=sumaVueltas(r);r.ventas=v;r.envases=e;
  const d=(r.vueltas||[]).filter(x=>!x.anulada).reduce((s,x)=>s+(+x.dcto||0),0);r.pagos=r.pagos.filter(p=>p.auto!=="vc");
  if(d>0)r.pagos.push({id:(r.pagos.reduce((m,p)=>Math.max(m,+p.id||0),0))+1,tipo:"descuento",monto:d,detalle:"Descuentos dados en Venta Choferes",hora:ahora(),auto:"vc"})}
const montoVuelta=(r,x)=>FORMATOS.reduce((s,f)=>s+(+(x.ventas||{})[f.id]||0)*(r.precios[f.id]||0)+(+(x.env||{})[f.id]||0)*((r.precioEnv||{})[f.id]||0),0)-(+x.dcto||0);
const resumenQ=o=>FORMATOS.filter(f=>+o[f.id]>0).map(f=>`${o[f.id]}×${f.tipo==="h"?"H15":f.kg+" kg"}`).join(", ");
hubCuad=function(fechaSel){
  const H=D.historico,lista=NUBE.activo?NUBE.usuarios:D.usuarios,key=u=>NUBE.activo?u.uid:u.user;
  const nombres=lista.filter(u=>u.rol==="admin"||H.usuarios.includes(key(u))).map(u=>u.nombre);
  const ed=puedeEditarFecha(fechaCuad),chs=chOrden().filter(c=>c.local===suc&&(c.activo!==false||getRend("movil",c.id,fechaCuad,false)));
  if(!chs.some(c=>c.id===vrCh))vrCh=(chs.find(c=>c.activo!==false)||chs[0]||{}).id??null;
  const filas=chs.map(c=>{const r=getRend("movil",c.id,fechaCuad,false),k=r?calcRend(r):null;return {c,r,k,vs:r&&r.vueltas||[]}});
  const tot=f=>filas.reduce((s,o)=>s+(o.k?f(o.k,o):0),0);
  const estado=o=>!o.r||!(o.k.tarros||o.vs.length)?'<span class="pill pendiente">Sin venta</span>':!o.r.guardada?'<span class="pill ruta">Por rendir</span>':Math.round(o.k.saldo)===0?'<span class="pill entregado">Rendido</span>':o.k.saldo>0?`<span class="pill bajo">Debe ${clp(o.k.saldo)}</span>`:`<span class="pill ruta">A favor ${clp(-o.k.saldo)}</span>`;
  const rSel=vrCh!=null?getRend("movil",vrCh,fechaCuad,false):null,nV=(rSel&&rSel.vueltas||[]).length,P=rSel?rSel.precios:D.precios,PE=rSel?rSel.precioEnv||{}:D.preciosEnvase||{};
  const ent=vrCh!=null?entregasDe(vrCh,fechaCuad):null;
  const tile=(ctab,t,sub,ic)=>`<button type="button" class="rep hub-t" data-ctab="${ctab}"><span class="ico">${svg(ic)}</span><span><b>${t}</b><br><span class="nota" style="margin:0">${sub}</span></span></button>`;
  return cabeza("Venta de Repartidor",fechaSel)+(ed?"":`<div class="banner">Este día ya pasó y está bloqueado. Para editarlo, el administrador debe darle acceso a históricos.</div>`)+`
  <div class="kpis vr-kpis"><div class="kpi"><span>Vendido</span><b class="num">${clp(tot(k=>k.venta))}</b></div><div class="kpi"><span>Rendido</span><b class="num">${clp(tot(k=>k.pagado))}</b></div>
    <div class="kpi"><span>Por rendir</span><b class="num">${clp(tot((k,o)=>o.r.guardada?0:k.venta))}</b></div><div class="kpi"><span>Choferes rendidos</span><b class="num">${filas.filter(o=>o.r&&o.r.guardada).length} / ${filas.filter(o=>o.r&&(o.k.tarros||o.vs.length)).length}</b></div></div>
  <div class="vr-grid">
   <form class="caja vr-form" id="f-vr"><h3>Ingresar venta</h3>
    <label>Chofer<select id="vr-ch" ${ed?"":"disabled"}>${chs.map(c=>`<option value="${c.id}" ${c.id===vrCh?"selected":""}>${esc(c.nombre)}${c.patente?" · "+esc(c.patente):""}</option>`).join("")}</select></label>
    <p class="nota" style="margin:0">${nV?`Esta será la <b>venta N° ${nV+1}</b> de hoy. Se suma ${nV===1?"a la anterior":"a las "+nV+" anteriores"}.`:"Primera venta del día de este chofer."}${ent&&ent.tarros?` · Pedidos del sistema entregados hoy: <b>${resumenVentas(ent.ventas)}</b>`:""}</p>
    <div class="tabla-wrap"><table class="vr-q"><thead><tr><th></th>${FORMATOS.map(f=>`<th>${f.tipo==="h"?"H15":f.kg+" kg"}</th>`).join("")}</tr></thead><tbody>
      <tr><td class="l">Vendidos</td>${FORMATOS.map(f=>`<td><input type="number" min="0" inputmode="numeric" data-vrq="${f.id}" placeholder="0" ${ed?"":"disabled"}></td>`).join("")}</tr>
      <tr><td class="l">Con envase</td>${FORMATOS.map(f=>`<td><input type="number" min="0" inputmode="numeric" data-vre="${f.id}" placeholder="0" ${ed?"":"disabled"}></td>`).join("")}</tr>
      <tr class="pr"><td class="l">Precio</td>${FORMATOS.map(f=>`<td class="num">${clp(P[f.id]||0)}</td>`).join("")}</tr></tbody></table></div>
    <div class="vr-tot"><span>Total de esta venta</span><b class="num" id="vr-total">${clp(0)}</b></div>
    <div class="acc"><button class="btn" type="submit" ${ed&&vrCh!=null?"":"disabled"}>Agregar venta</button>${ent&&ent.tarros&&ed?'<button class="btn linea" type="button" id="vr-usar">Usar pedidos entregados</button>':""}</div>
    <p class="error" id="vr-err" hidden></p></form>
   <div style="min-width:0">
    <div class="tabla-wrap"><table class="vr-lista"><thead><tr><th>Chofer</th><th>Ventas del día</th><th class="der">Cilindros</th><th class="der">Total vendido</th><th>Estado</th><th></th></tr></thead><tbody>
    ${filas.map(o=>`<tr class="${o.c.id===vrCh?"vr-on":""}"><td><button type="button" class="vr-nom" data-vrsel="${o.c.id}"><b>${esc(o.c.nombre)}</b></button><br><span class="nota" style="margin:0">${esc(o.c.patente||"Sin patente")}</span></td>
      <td>${o.vs.length?o.vs.map((x,i)=>`<span class="vr-v" title="${esc(resumenQ(x.ventas||{}))}"><b>${i+1}</b> ${esc((x.hora||"").slice(11,16))} · ${clp(montoVuelta(o.r,x))}${ed&&!o.r.guardada?`<button type="button" data-vrdel="${o.c.id}|${x.id}" aria-label="Quitar venta ${i+1}">✕</button>`:""}</span>`).join(""):o.k&&o.k.tarros?'<span class="nota" style="margin:0">Ingresada en la rendición</span>':'<span class="nota" style="margin:0">—</span>'}</td>
      <td class="der num">${o.k?o.k.tarros:0}</td><td class="der num"><b>${o.k?clp(o.k.venta):"—"}</b></td><td>${estado(o)}</td>
      <td>${o.r&&(o.k.tarros||o.vs.length)?`<button class="btn chico ${o.r.guardada?"linea":""}" type="button" data-cuadrar="${o.c.id}" data-vrrend="1">${o.r.guardada?"Ver rendición":"Rendir día"}</button>`:""}</td></tr>`).join("")||'<tr><td colspan="6">No hay choferes activos en esta sucursal.</td></tr>'}
    </tbody></table></div>
    <p class="nota" style="margin:6px 0 0">Si el chofer vuelve más de una vez, ingrese cada venta: se suman en su total del día. Al final toque <b>Rendir día</b> para registrar efectivo, vales y demás pagos.</p>
   </div></div>
  <details class="caja vr-otros"><summary>Más opciones: cargas, distribuidores y liquidaciones</summary><div class="rep-grid" style="margin-top:10px">
    ${tile("carga","Carga inicial","Con qué sale cada móvil","ruta")}${tile("recarga","Recarga de cilindros","Cargas durante el día","compras")}${tile("movil","Rendiciones chofer","Lista de todas las rendiciones","cuadratura")}
    ${tile("venta-dist","Venta recargas","Carga y préstamos de envases","ruta")}${tile("mayorista","Rendición distribuidor","Pagos y saldo del distribuidor","cuadratura")}
    ${tile("liq-chofer","Liquidación chofer","Comisiones y anticipos","usuarios")}${tile("liq-peoneta","Liquidación peoneta","Comisiones de ayudantes","usuarios")}</div>
    <div class="hist" style="margin-top:12px"><p>Acceso a históricos (editar días anteriores) desde <b>${fF(H.desde)}</b> para: <b>${nombres.map(esc).join(", ")||"solo administradores"}</b>.</p>
      ${esAdmin()?`<form id="f-hist" class="grid" style="gap:12px;margin-top:8px"><label style="max-width:220px">Desde<input type="date" id="hs-desde" value="${H.desde}"></label>
        <div class="checks-grid">${lista.filter(u=>u.rol==="encargado").map(u=>`<label class="radio"><input type="checkbox" name="hs-u" value="${esc(key(u))}" ${H.usuarios.includes(key(u))?"checked":""}>${esc(u.nombre)}</label>`).join("")||'<span class="nota" style="margin:0">Todavía no hay encargados.</span>'}</div>
        <div><button class="btn chico" type="submit">Guardar acceso</button></div></form>`:""}</div></details>`;
};
function enlazarVR(){
  const f=$("#f-vr");if(!f)return;
  const P=()=>{const r=vrCh!=null?getRend("movil",vrCh,fechaCuad,false):null;return {P:r?r.precios:D.precios,PE:r?r.precioEnv||{}:D.preciosEnvase||{}}};
  const leerQ=a=>{const o=st();$$(`[data-${a}]`).forEach(i=>o[i.dataset[a]]=Math.max(0,Math.round(+i.value||0)));return o};
  const calc=()=>{const {P:p,PE:pe}=P(),q=leerQ("vrq"),e=leerQ("vre");$("#vr-total").textContent=clp(FORMATOS.reduce((s,x)=>s+q[x.id]*(p[x.id]||0)+e[x.id]*(pe[x.id]||0),0))};
  $$("[data-vrq],[data-vre]").forEach(i=>i.oninput=calc);
  const sel=$("#vr-ch");if(sel)sel.onchange=()=>{vrCh=+sel.value;pintarSistema()};
  $$("[data-vrsel]").forEach(b=>b.onclick=()=>{vrCh=+b.dataset.vrsel;pintarSistema()});
  const us=$("#vr-usar");if(us)us.onclick=()=>{const en=entregasDe(vrCh,fechaCuad);FORMATOS.forEach(x=>{const a=$(`[data-vrq="${x.id}"]`),b=$(`[data-vre="${x.id}"]`);if(a)a.value=en.ventas[x.id]||"";if(b)b.value=(en.env||{})[x.id]||""});calc()};
  f.onsubmit=e=>{e.preventDefault();const er=$("#vr-err");er.hidden=true;
    const q=leerQ("vrq"),en=leerQ("vre");if(!FORMATOS.some(x=>q[x.id]||en[x.id])){er.textContent="Escriba al menos una cantidad.";er.hidden=false;return}
    if(FORMATOS.some(x=>en[x.id]>q[x.id])){er.textContent="«Con envase» no puede ser mayor que los vendidos de ese formato.";er.hidden=false;return}
    const existia=!!getRend("movil",vrCh,fechaCuad,false),r=getRend("movil",vrCh,fechaCuad,true);r.vueltas=r.vueltas||[];
    if(existia&&!r.vueltas.length&&FORMATOS.some(x=>(r.ventas[x.id]||0)||((r.envases||{})[x.id]||0)))r.vueltas.push({id:1,hora:r.creada||ahora(),ventas:{...r.ventas},env:{...(r.envases||st())},user:r.usuario||"",previa:true});
    const x={id:(r.vueltas.reduce((m,v)=>Math.max(m,v.id),0))+1,hora:ahora(),ventas:q,env:en,user:yo.nombre};r.vueltas.push(x);
    if(r.guardada){r.guardada=null}            // hay venta nueva: hay que volver a rendir
    aplicarVueltas(r);nubeGuardar("rendiciones",r);
    log("cuadratura","Venta de repartidor",`${nomChofer(vrCh)} (${fechaCuad}) · venta N° ${r.vueltas.length}: ${resumenQ(q)} · ${clp(montoVuelta(r,x))}`,{chofer:vrCh});
    guardar();pintarSistema();aviso("Venta agregada",`${nomChofer(vrCh)}: venta N° ${r.vueltas.length} por ${clp(montoVuelta(r,x))}. Total del día: ${clp(calcRend(r).venta)}.`)};
  $$("[data-vrdel]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const [c,id]=b.dataset.vrdel.split("|").map(Number),r=getRend("movil",c,fechaCuad,false);if(!r)return;
    const x=r.vueltas.find(v=>v.id===id);r.vueltas=r.vueltas.filter(v=>v.id!==id);aplicarVueltas(r);nubeGuardar("rendiciones",r);
    log("cuadratura","Venta de repartidor quitada",`${nomChofer(c)} (${fechaCuad}) · ${x?resumenQ(x.ventas||{}):""}`,{chofer:c});guardar();pintarSistema()}));
  // desde aquí «Rendir día» abre la rendición del chofer
  $$("[data-vrrend]").forEach(b=>b.onclick=()=>{cuadTab="movil";cuadSel=+b.dataset.cuadrar;pintarSistema();window.scrollTo(0,0)});
}
// En la rendición: si el chofer tiene varias ventas, las cantidades son la suma (se cambian en Venta de Repartidor)
{const v0=vistaRendERP;vistaRendERP=function(r,f){let h=v0(r,f);
  if(r.tipo!=="movil"||!(r.vueltas&&r.vueltas.some(x=>!x.anulada)))return h;
  h=h.replace(/ data-(rcant|renv)=/g,' disabled data-$1=');
  h=h.replace(/<button class="btn chico linea" id="rd-usar"[^>]*>[^<]*<\/button>/,"");
  const lista=r.vueltas.filter(x=>!x.anulada).map((x,i)=>`<span class="vr-v"><b>${i+1}</b> ${esc((x.hora||"").slice(11,16))} · ${esc(resumenQ(x.ventas||{}))} · ${clp(montoVuelta(r,x))}</span>`).join("");
  return h.replace('<fieldset class="bloqueo"',`<div class="vr-sum"><span>Venta del día = suma de <b>${r.vueltas.filter(x=>!x.anulada).length}</b> venta${r.vueltas.filter(x=>!x.anulada).length>1?"s":""}:</span>${lista}<button type="button" class="btn chico linea" data-ctab="menu">Agregar o quitar ventas</button></div><fieldset class="bloqueo"`)}}
{const lc=L.cuadratura;L.cuadratura=function(){lc.call(this);if(cuadTab==="menu")enlazarVR();
  if(cuadTab==="movil"&&cuadSel!=null){const b=$("#cu-lista");if(b){b.textContent="← Volver a Venta Choferes";b.onclick=()=>{cuadTab="menu";cuadSel=null;pintarSistema()}}
    $$(".vr-sum [data-ctab]").forEach(x=>x.onclick=()=>{vrCh=cuadSel;cuadTab="menu";cuadSel=null;pintarSistema()})}}}

/* ===================== VENTA CHOFERES (igual a Venta Local de Venta Local, pero por chofer) ===================== */
let vcTab="venta",vcCh=null,vcUlt=null;
const cilBlanco=f=>{const lab=f.tipo==="h"?"15":String(f.kg),alu=f.tipo==="h",h=f.kg>=45?96:f.kg>=15?86:f.kg>=11?78:68,w=f.kg>=45?58:f.kg>=15?52:f.kg>=11?48:42,x=(64-w)/2,y=112-h;
  return `<svg viewBox="0 0 64 116" class="cilb" aria-hidden="true"><defs><linearGradient id="gb${f.id}" x1="0" x2="1"><stop offset="0" stop-color="#e9edf2"/><stop offset=".35" stop-color="#fff"/><stop offset="1" stop-color="#d5dbe3"/></linearGradient></defs>
    <rect x="${32-w*.22}" y="${y-14}" width="${w*.44}" height="18" rx="3" fill="url(#gb${f.id})" stroke="#c3cad4"/><rect x="${32-4}" y="${y-11}" width="8" height="12" rx="2" fill="#2e9b4f"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w*.32}" fill="url(#gb${f.id})" stroke="#c3cad4"/>
    <text x="32" y="${y+h*.36}" text-anchor="middle" font-size="${f.kg>=45?17:14}" font-weight="800" fill="#0d3a85" font-family="Plus Jakarta Sans,sans-serif">${lab}<tspan font-size="7" dx="1">kg</tspan></text>
    ${alu?`<text x="32" y="${y+h*.36+9}" text-anchor="middle" font-size="5.5" font-weight="700" fill="#0d3a85">ALUMINIO</text>`:""}
    <rect x="${x+3}" y="${y+h-7}" width="${w-6}" height="7" rx="3" fill="#dfe4ea"/>${[0,1,2].map(i=>`<circle cx="${x+w*(.25+.25*i)}" cy="${y+h-3.5}" r="1.3" fill="#333"/>`).join("")}</svg>`};
const fmtEnv=()=>FORMATOS.filter(f=>f.tipo!=="h"||((D.preciosEnvase||{})[f.id]||0)>0);
function vcFilas(){return chOrden().filter(c=>c.local===suc&&(c.activo!==false||getRend("movil",c.id,fechaCuad,false)))}
V.ventachofer=function(){
  if(!["venta","rend"].includes(vcTab))vcTab="venta";
  const chs=vcFilas();if(!chs.some(c=>c.id===vcCh))vcCh=(chs.find(c=>c.activo!==false)||chs[0]||{}).id??null;
  const side=`<aside class="vc-side caja">${[["venta","Venta Chofer","factura"],["rend","Rendición","cuadratura"]].map(([k,t,ic])=>`<button type="button" class="vc-t" data-vctab="${k}" aria-selected="${vcTab===k}">${svg(ic)}<span>${t}</span></button>`).join("")}
</aside>`;
  const fechaSel=`<label>Fecha<input type="date" id="f-cuad" value="${fechaCuad}"></label>`;
  let main="";
  if(vcTab==="rend"){
    if(vcCh==null)main=cabeza("Rendición")+'<div class="caja"><p>No hay choferes en esta sucursal.</p></div>';
    else{cuadTab="movil";cuadSel=vcCh;main=vistaRend(getRend("movil",vcCh,fechaCuad,true),fechaSel)}}
  else if(vcTab==="carga"||vcTab==="recarga"){cuadTab=vcTab;cuadSel=null;main=vistaCarga(vcTab==="carga"?"inicial":"recarga",fechaSel)}
  else if(vcTab==="liq-chofer"||vcTab==="liq-peoneta"){cuadTab=vcTab;cuadSel=null;main=vistaLiq(vcTab==="liq-chofer"?"chofer":"peoneta")}
  else main=vistaVentaChofer(chs,fechaSel);
  return `<div class="vc-lay">${side}<div class="vc-main">${main}</div></div>`};
function vistaVentaChofer(chs,fechaSel){
  const ed=puedeEditarFecha(fechaCuad)&&!soloVer("ventachofer"),ch=D.choferes.find(c=>c.id===vcCh),r=vcCh!=null?getRend("movil",vcCh,fechaCuad,false):null;
  const P=r?r.precios:D.precios,PE=r?r.precioEnv||{}:D.preciosEnvase||{},vs=(r&&r.vueltas)||[],act=vs.filter(x=>!x.anulada);
  const ent=vcCh!=null?entregasDe(vcCh,fechaCuad):null,carga=ch?ch.carga||{}:{},FE=fmtEnv();
  const k=r?calcRend(r):null,totDia=act.reduce((s,x)=>s+montoVuelta(r,x),0);
  const sel=`<label>Chofer<select id="vc-ch" class="vc-chsel">${chs.map(c=>`<option value="${c.id}" ${c.id===vcCh?"selected":""}>${esc(c.nombre)}${c.patente?" · "+esc(c.patente):""}</option>`).join("")}</select></label>`;
  return cabeza("Venta Chofer","")+`<div class="vc-top">${sel}${fechaSel}</div>`+(ed?"":`<div class="banner">${soloVer("ventachofer")?"Solo puede ver este cuadro.":"Este día ya pasó y está bloqueado. Para editarlo, el administrador debe darle acceso a históricos."}</div>`)+`
  <form class="caja vc-caja" id="f-vc" autocomplete="off"><div class="vc-card">
   <div class="vc-g" style="--n:${FORMATOS.length}">
    <div class="vc-izq"><span class="vc-plab">Precio chofer</span>
      <div class="vc-tot"><span>TOTAL</span><b class="num" id="vc-total">${clp(0)}</b></div>
      <label class="vc-dc"><span>DESCUENTO</span><span class="vc-pesos">$ <input id="vc-dcto" type="number" min="0" inputmode="numeric" placeholder="0" ${ed?"":"disabled"}></span></label></div>
    ${FORMATOS.map(f=>`<div class="vc-col"><span class="vc-pr num">${clp(P[f.id]||0)}</span><div class="vc-img">${cilBlanco(f)}</div>
      <span class="vc-et"><b>${f.tipo==="h"?"H15":f.kg}</b> ${f.tipo==="h"?"Aluminio":"kg"}</span>
      <input class="vc-in" type="number" min="0" inputmode="numeric" data-vcq="${f.id}" placeholder="0" aria-label="Cantidad ${f.et}" ${ed?"":"disabled"}>
      <span class="vc-stock ${(carga[f.id]||0)>0?"":"cero"}">En camión: ${carga[f.id]||0}</span></div>`).join("")}
   </div>
   <div class="vc-envh">VENTA DE ENVASES</div>
   <div class="vc-g env" style="--n:${FORMATOS.length}"><div></div>
    ${FORMATOS.map(f=>FE.includes(f)?`<div class="vc-col"><span class="vc-pr num">${clp(PE[f.id]||0)}</span><input class="vc-in" type="number" min="0" inputmode="numeric" data-vce="${f.id}" placeholder="0" aria-label="Envases ${f.et}" ${ed?"":"disabled"}></div>`:"<div></div>").join("")}
   </div></div>
   <div class="vc-acc"><button class="btn" type="submit" ${ed&&vcCh!=null?"":"disabled"}>Grabar venta</button><button class="btn linea" type="button" id="vc-pago" ${vcCh!=null?"":"disabled"}>Ingresar pago</button>
     <button class="btn linea" type="button" id="vc-imp" ${act.length?"":"disabled"}>Imprimir</button><button class="btn linea rojo" type="button" id="vc-anular" ${ed&&act.length?"":"disabled"}>Anular</button>
     <button class="btn linea" type="button" id="vc-volver">Volver</button><span style="flex:1"></span>${ent&&ent.tarros&&ed?'<button class="btn linea" type="button" id="vc-usar" title="Llena las cantidades con los pedidos del sistema que este chofer entregó hoy">Usar pedidos entregados</button>':""}<button class="btn linea" type="reset" id="vc-nueva">Nueva venta</button></div>
   <p class="error" id="vc-err" hidden></p></form>
  <h4 class="vc-h4">VENTAS DE HOY <span>· si hay un error, anula la venta y vuelve a ingresarla</span></h4>
  <div class="tabla-wrap"><table class="vc-tab"><thead><tr><th>N°</th><th>Hora</th><th>Usuario</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("")}<th class="c">Envases</th><th class="der">Desc.</th><th class="der">Total</th><th></th></tr></thead><tbody>
   ${vs.length?vs.map((x,i)=>`<tr class="${x.anulada?"anul":""}"><td class="num">${i+1}</td><td class="num">${esc((x.hora||"").slice(11,16))}</td><td>${esc(x.user||"")}</td>
     ${FORMATOS.map(f=>`<td class="c num">${+(x.ventas||{})[f.id]||"–"}</td>`).join("")}<td class="c num">${FORMATOS.reduce((s,f)=>s+(+(x.env||{})[f.id]||0),0)||"–"}</td>
     <td class="der num">${x.dcto?clp(x.dcto):"–"}</td><td class="der num"><b>${clp(montoVuelta(r,x))}</b></td>
     <td>${x.anulada?'<span class="pill anulado">Anulada</span>':`<div class="acc"><button class="btn chico linea" type="button" data-vcimp="${x.id}" title="Imprimir">🖨</button>${ed?`<button class="btn chico linea rojo" type="button" data-vcanular="${x.id}">Anular</button>`:""}</div>`}</td></tr>`).join("")
     :`<tr><td colspan="${FORMATOS.length+7}" class="vc-vacio">Aún no hay ventas hoy</td></tr>`}
   ${act.length?`<tr class="fila-tot"><td colspan="3"><b>Total del día (${act.length} venta${act.length>1?"s":""})</b></td>${FORMATOS.map(f=>`<td class="c num"><b>${act.reduce((s,x)=>s+(+(x.ventas||{})[f.id]||0),0)||"–"}</b></td>`).join("")}<td class="c num">${act.reduce((s,x)=>s+FORMATOS.reduce((a,f)=>a+(+(x.env||{})[f.id]||0),0),0)||"–"}</td><td class="der num">${clp(act.reduce((s,x)=>s+(+x.dcto||0),0))}</td><td class="der num"><b>${clp(totDia)}</b></td>
     <td>${r.guardada?(Math.round(k.saldo)===0?'<span class="pill entregado">Rendido</span>':`<span class="pill bajo">Debe ${clp(k.saldo)}</span>`):'<span class="pill ruta">Por rendir</span>'}</td></tr>`:""}
  </tbody></table></div>
  ${ent&&ent.tarros?`<p class="nota" style="margin:6px 0 0">Pedidos del sistema entregados hoy por este chofer: <b>${resumenVentas(ent.ventas)}</b>. Si los cobró, inclúyalos en una venta (botón «Usar pedidos entregados»).</p>`:""}`;
}
function imprimirVentaChofer(r,x){const ch=D.choferes.find(c=>c.id===r.ref),emp=D.empresa||{},w=window.open("","_blank","width=380,height=600");if(!w)return aviso("Imprimir","El navegador bloqueó la ventana. Permita ventanas emergentes.");
  const filas=FORMATOS.filter(f=>+(x.ventas||{})[f.id]>0).map(f=>`<tr><td>${x.ventas[f.id]} × ${f.tipo==="h"?"H15 Alum.":f.kg+" kg"}</td><td style="text-align:right">${clp(x.ventas[f.id]*(r.precios[f.id]||0))}</td></tr>`).join("")
    +FORMATOS.filter(f=>+(x.env||{})[f.id]>0).map(f=>`<tr><td>${x.env[f.id]} × envase ${f.kg} kg</td><td style="text-align:right">${clp(x.env[f.id]*((r.precioEnv||{})[f.id]||0))}</td></tr>`).join("");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Venta chofer</title><body style="font:13px monospace;padding:10px;max-width:300px"><h3 style="margin:0">${esc(emp.nombre||"MR Gas")}</h3><p style="margin:4px 0">Venta chofer · ${esc(ch?ch.nombre:"")}<br>${esc(x.hora||"")} · venta N° ${(r.vueltas||[]).indexOf(x)+1}</p><hr><table style="width:100%">${filas}${x.dcto?`<tr><td>Descuento</td><td style="text-align:right">-${clp(x.dcto)}</td></tr>`:""}</table><hr><b style="font-size:15px">TOTAL ${clp(montoVuelta(r,x))}</b><p style="margin-top:8px">Atendido por: ${esc(x.user||"")}</p><script>print()<\/script></body>`);w.document.close()}
L.ventachofer=function(){
  $$("[data-vctab]").forEach(b=>b.onclick=()=>{vcTab=b.dataset.vctab;pintarSistema();window.scrollTo(0,0)});
  const fc=$("#f-cuad");if(fc)fc.onchange=e=>{fechaCuad=e.target.value||hoyStr();pintarSistema()};
  if(vcTab!=="venta"){L.cuadratura();
    $$("[data-ctab]").forEach(b=>b.onclick=()=>{vcTab="venta";pintarSistema()});
    const cl=$("#cu-lista");if(cl){cl.textContent="← Volver a Venta Chofer";cl.onclick=()=>{vcTab="venta";pintarSistema()}}
    const rs=$("#rd-sel");if(rs)rs.onchange=()=>{vcCh=+rs.value;pintarSistema()};
    $$(".vr-sum [data-ctab]").forEach(x=>x.onclick=()=>{vcTab="venta";pintarSistema()});
    {const fc2=$("#f-cuad");if(fc2)fc2.onchange=e=>{fechaCuad=e.target.value||hoyStr();pintarSistema()}}
    return}
  const sel=$("#vc-ch");if(sel)sel.onchange=()=>{vcCh=+sel.value;pintarSistema()};
  const r0=()=>vcCh!=null?getRend("movil",vcCh,fechaCuad,false):null;
  const leer=a=>{const o=st();$$(`[data-${a}]`).forEach(i=>o[i.dataset[a]]=Math.max(0,Math.round(+i.value||0)));return o};
  const calc=()=>{const r=r0(),P=r?r.precios:D.precios,PE=r?r.precioEnv||{}:D.preciosEnvase||{},q=leer("vcq"),e=leer("vce"),d=Math.max(0,+($("#vc-dcto")||{}).value||0);
    $("#vc-total").textContent=clp(Math.max(0,FORMATOS.reduce((s,f)=>s+q[f.id]*(P[f.id]||0)+e[f.id]*(PE[f.id]||0),0)-d))};
  $$("[data-vcq],[data-vce],#vc-dcto").forEach(i=>i.oninput=calc);
  const f=$("#f-vc");if(!f)return;
  f.onreset=()=>setTimeout(()=>{calc();$("#vc-err").hidden=true},0);
  f.onsubmit=e=>{e.preventDefault();const er=$("#vc-err");er.hidden=true;
    const q=leer("vcq"),en=leer("vce"),dcto=Math.max(0,Math.round(+$("#vc-dcto").value||0));
    if(!FORMATOS.some(x=>q[x.id]||en[x.id])){er.textContent="Escriba al menos una cantidad.";er.hidden=false;return}
    const existia=!!r0(),r=getRend("movil",vcCh,fechaCuad,true);r.vueltas=r.vueltas||[];
    if(existia&&!r.vueltas.length&&FORMATOS.some(x=>(r.ventas[x.id]||0)||((r.envases||{})[x.id]||0)))r.vueltas.push({id:1,hora:r.creada||ahora(),ventas:{...r.ventas},env:{...(r.envases||st())},dcto:0,user:r.usuario||"",previa:true});
    const bruto=FORMATOS.reduce((s,x)=>s+q[x.id]*(r.precios[x.id]||0)+en[x.id]*((r.precioEnv||{})[x.id]||0),0);
    if(dcto>bruto){er.textContent="El descuento no puede ser mayor que la venta.";er.hidden=false;return}
    const x={id:(r.vueltas.reduce((m,v)=>Math.max(m,v.id),0))+1,hora:ahora(),ventas:q,env:en,dcto,user:yo.nombre};r.vueltas.push(x);
    r.guardada=null;aplicarVueltas(r);nubeGuardar("rendiciones",r);vcUlt=x.id;
    log("cuadratura","Venta chofer",`${nomChofer(vcCh)} (${fechaCuad}) · venta N° ${r.vueltas.length}: ${resumenQ(q)}${dcto?" · desc. "+clp(dcto):""} · ${clp(montoVuelta(r,x))}`,{chofer:vcCh});
    guardar();pintarSistema();aviso("Venta grabada",`${nomChofer(vcCh)}: ${clp(montoVuelta(r,x))}. Total del día: ${clp(r.vueltas.filter(v=>!v.anulada).reduce((s,v)=>s+montoVuelta(r,v),0))}.`)};
  const anular=id=>{const r=r0();if(!r)return;const x=r.vueltas.find(v=>v.id===id);if(!x||x.anulada)return;x.anulada=ahora();x.anuladaPor=yo.nombre;r.guardada=null;aplicarVueltas(r);nubeGuardar("rendiciones",r);
    log("cuadratura","Venta chofer anulada",`${nomChofer(vcCh)} (${fechaCuad}) · ${resumenQ(x.ventas||{})} · ${clp(montoVuelta(r,x))}`,{chofer:vcCh});guardar();pintarSistema()};
  $$("[data-vcanular]").forEach(b=>b.onclick=()=>confirmar(b,()=>anular(+b.dataset.vcanular)));
  const an=$("#vc-anular");if(an)an.onclick=()=>confirmar(an,()=>{const r=r0(),v=r&&r.vueltas.filter(x=>!x.anulada);if(v&&v.length)anular((v.find(x=>x.id===vcUlt)||v[v.length-1]).id)});
  $$("[data-vcimp]").forEach(b=>b.onclick=()=>{const r=r0();imprimirVentaChofer(r,r.vueltas.find(x=>x.id===+b.dataset.vcimp))});
  const im=$("#vc-imp");if(im)im.onclick=()=>{const r=r0(),v=r&&r.vueltas.filter(x=>!x.anulada);if(v&&v.length)imprimirVentaChofer(r,v.find(x=>x.id===vcUlt)||v[v.length-1])};
  $("#vc-pago").onclick=()=>{vcTab="rend";pintarSistema();window.scrollTo(0,0)};
  $("#vc-volver").onclick=()=>ir("menu");
  const us=$("#vc-usar");if(us)us.onclick=()=>{const en=entregasDe(vcCh,fechaCuad);FORMATOS.forEach(x=>{const a=$(`[data-vcq="${x.id}"]`),b=$(`[data-vce="${x.id}"]`);if(a)a.value=en.ventas[x.id]||"";if(b)b.value=(en.env||{})[x.id]||""});calc()};
};
// «Cuadratura» ya no está en el menú: sus pantallas de inicio llevan a Venta Choferes (o a Venta Mayorista si venía de ahí)
{const lc=L.cuadratura;L.cuadratura=function(){lc.call(this);if(mod!=="cuadratura")return;
  $$("[data-ctab='menu']").forEach(b=>b.onclick=()=>{if(cuadTab==="mayorista"||cuadTab==="venta-dist")ir("mayorista");else{vcTab="venta";ir("ventachofer")}})}}

/* ===================== VENTA MAYORISTA con la misma interfaz que Venta Choferes ===================== */
{const v0=V.mayorista,l0=L.mayorista;
V.mayorista=function(){
  asegMay();if(!["venta","rend"].includes(mayTab))mayTab="venta";
  const mays=(D.mayoristas||[]).filter(m=>(m.local??1)===suc).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!mays.some(m=>m.id===mayCli))mayCli=(mays[0]||{}).id??null;mayFecha=fechaCuad;
  const side=`<aside class="vc-side caja">${[["venta","Venta Mayorista","factura"],["rend","Rendición","cuadratura"]].map(([k,t,ic])=>`<button type="button" class="vc-t" data-mytab="${k}" aria-selected="${mayTab===k}">${svg(ic)}<span>${t}</span></button>`).join("")}
</aside>`;
  const fechaSel=`<label>Fecha<input type="date" id="f-cuad" value="${fechaCuad}"></label>`;
  let main;
  if(!mays.length&&mayTab!=="cuenta")main=v0().replace(/<div class="tabs" role="tablist">[\s\S]*?<\/div>/,"");
  else if(mayTab==="cuenta")main=v0().replace(/<div class="tabs" role="tablist">[\s\S]*?<\/div>/,"");
  else if(mayTab==="rend"&&!ventasDiaMay().length&&!((getRendMayV(mayCli,fechaCuad,null,false)||{}).ventas&&calcRend(getRendMayV(mayCli,fechaCuad,null,false)).tarros>0)){cuadTab="mayorista";cuadSel=mayCli;main=sinVentasMay(fechaSel)}
  else if(mayTab==="rend"){cuadTab="mayorista";cuadSel=mayCli;elegirVentaMay();const r=getRend("mayorista",mayCli,fechaCuad,true);syncRendMayV(r);{const h=vistaRend(r,fechaSel),bar=barraVentasMay();main=h.includes('<div class="vr-sum"')?h.replace('<div class="vr-sum"',bar+'<div class="vr-sum"'):h.replace('<fieldset class="bloqueo"',bar+'<fieldset class="bloqueo"')}}
  else main=vistaVentaMay(mays,fechaSel);
  return `<div class="vc-lay">${side}<div class="vc-main">${main}</div></div>`};
function vistaVentaMay(mays,fechaSel){
  const ed=puedeEditarFecha(fechaCuad)&&!soloVer("mayorista"),c=cliMay(mayCli),l=ensureLoc(loc(suc)),PE=D.preciosEnvase||{},FE=fmtEnv();
  const vs=(D.cargasDist||[]).filter(x=>x.mayorista===mayCli&&x.fecha===fechaCuad).sort((a,b)=>(+a.k||0)-(+b.k||0)),act=vs.filter(x=>!x.anulada);
  const r=getRend("mayorista",mayCli,fechaCuad,false),k=r?calcRend(r):null;
  const sel=`<label>Cliente<select id="my-cli2" class="vc-chsel">${mays.map(m=>`<option value="${m.id}" ${m.id===mayCli?"selected":""}>${esc(m.nombre)}</option>`).join("")}</select></label>`;
  return cabeza("Venta Mayorista","")+`<div class="vc-top">${sel}${fechaSel}</div>`+(ed?"":`<div class="banner">${soloVer("mayorista")?"Solo puede ver este cuadro.":"Este día ya pasó y está bloqueado. Para editarlo, el administrador debe darle acceso a históricos."}</div>`)+`
  <form class="caja vc-caja" id="f-vm" autocomplete="off"><div class="vc-card">
   <div class="vc-g" style="--n:${FORMATOS.length}">
    <div class="vc-izq"><span class="vc-plab">Precio cliente</span>
      <div class="vc-tot"><span>TOTAL</span><b class="num" id="vm-total">${clp(0)}</b></div>
      <label class="vc-dc"><span>DESCUENTO</span><span class="vc-pesos">$ <input id="vm-dcto" type="number" min="0" inputmode="numeric" placeholder="0" ${ed?"":"disabled"}></span></label></div>
    ${FORMATOS.map(f=>`<div class="vc-col"><span class="vc-pr num">${clp(c?precioCliMay(c,f.id):0)}</span><div class="vc-img">${cilBlanco(f)}</div>
      <span class="vc-et"><b>${f.tipo==="h"?"H15":f.kg}</b> ${f.tipo==="h"?"Aluminio":"kg"}</span>
      <input class="vc-in" type="number" min="0" inputmode="numeric" data-vmq="${f.id}" placeholder="0" aria-label="Cantidad ${f.et}" ${ed?"":"disabled"}>
      <span class="vc-stock ${(l.stock[f.id]||0)>0?"":"cero"}">Stock: ${l.stock[f.id]||0}</span></div>`).join("")}
   </div>
   <div class="vc-envh">VENTA DE ENVASES</div>
   <div class="vc-g env" style="--n:${FORMATOS.length}"><div class="vm-extra">
      <label class="radio"><input type="checkbox" id="vm-canje" checked ${ed?"":"disabled"}> Entrega vacíos a cambio</label>
      <input id="vm-obs" placeholder="Observación / N° guía" ${ed?"":"disabled"}></div>
    ${FORMATOS.map(f=>FE.includes(f)?`<div class="vc-col"><span class="vc-pr num">${clp(PE[f.id]||0)}</span><input class="vc-in" type="number" min="0" inputmode="numeric" data-vme="${f.id}" placeholder="0" aria-label="Envases ${f.et}" ${ed?"":"disabled"}></div>`:"<div></div>").join("")}
   </div></div>
   <div class="vc-acc"><button class="btn" type="submit" ${ed&&c?"":"disabled"}>Grabar venta</button><button class="btn linea" type="button" id="vm-pago" ${c?"":"disabled"}>Ingresar pago</button>
     <button class="btn linea" type="button" id="vm-imp" ${act.length?"":"disabled"}>Imprimir</button><button class="btn linea rojo" type="button" id="vm-anular" ${ed&&act.length?"":"disabled"}>Anular</button>
     <button class="btn linea" type="button" id="vm-volver">Volver</button><span style="flex:1"></span><button class="btn linea" type="reset">Nueva venta</button></div>
   <p class="error" id="vm-err" hidden></p></form>
  <h4 class="vc-h4">VENTAS DE HOY <span>· si hay un error, anula la venta y vuelve a ingresarla</span></h4>
  <div class="tabla-wrap"><table class="vc-tab"><thead><tr><th>N°</th><th>Hora</th><th>Usuario</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("")}<th class="c">Envases</th><th>Obs.</th><th class="der">Desc.</th><th class="der">Total</th><th></th></tr></thead><tbody>
   ${vs.length?vs.map((x,i)=>`<tr class="${x.anulada?"anul":""}"><td class="num">${i+1}</td><td class="num">${esc(String(x.hora||"").slice(0,5))}</td><td>${esc(x.user||"")}</td>
     ${FORMATOS.map(f=>`<td class="c num">${+x.venta[f.id]||"–"}</td>`).join("")}<td class="c num">${FORMATOS.reduce((a,f)=>a+((x.env||{})[f.id]||0),0)||"–"}</td>
     <td>${esc(x.guia||"")}${x.canje===false?'<br><span class="nota" style="margin:0">envases prestados</span>':""}</td><td class="der num">${x.dcto?clp(x.dcto):"–"}</td><td class="der num"><b>${clp(valorDist(x))}</b></td>
     <td>${x.anulada?'<span class="pill anulado">Anulada</span>':`<div class="acc">${estadoVentaMay(x)}<button class="btn chico linea" type="button" data-vmrend="${x.k}">Rendir</button><button class="btn chico linea" type="button" data-vmimp="${x.k}" title="Imprimir">🖨</button>${ed?`<button class="btn chico linea rojo" type="button" data-anmay="${x.k}">Anular</button>`:""}</div>`}</td></tr>`).join("")
     :`<tr><td colspan="${FORMATOS.length+8}" class="vc-vacio">Aún no hay ventas hoy</td></tr>`}
   ${act.length?`<tr class="fila-tot"><td colspan="3"><b>Total del día (${act.length} venta${act.length>1?"s":""})</b></td>${FORMATOS.map(f=>`<td class="c num"><b>${act.reduce((a,x)=>a+(+x.venta[f.id]||0),0)||"–"}</b></td>`).join("")}<td class="c num">${act.reduce((a,x)=>a+FORMATOS.reduce((b,f)=>b+((x.env||{})[f.id]||0),0),0)||"–"}</td><td></td><td class="der num">${clp(act.reduce((a,x)=>a+(+x.dcto||0),0))}</td><td class="der num"><b>${clp(act.reduce((a,x)=>a+valorDist(x),0))}</b></td>
     <td>${(()=>{const S=saldosMay(mayCli),d=act.reduce((s,x)=>{const rv=rendDeVenta(x);return s+(rv?(S.ef.get(rv)??0):valorDist(x))},0);return Math.round(d)<=0?'<span class="pill entregado">Todo pagado</span>':`<span class="pill bajo">Debe ${clp(d)}</span>`})()}</td></tr>`:""}
  </tbody></table></div>`;
}
function imprimirVentaMay(x){const c=cliMay(x.mayorista),emp=D.empresa||{},w=window.open("","_blank","width=380,height=600");if(!w)return aviso("Imprimir","El navegador bloqueó la ventana. Permita ventanas emergentes.");
  const filas=FORMATOS.filter(f=>+x.venta[f.id]>0).map(f=>`<tr><td>${x.venta[f.id]} × ${f.tipo==="h"?"H15 Alum.":f.kg+" kg"}</td><td style="text-align:right">${clp(x.venta[f.id]*((x.precios||{})[f.id]??precioCliMay(c,f.id)))}</td></tr>`).join("")
    +FORMATOS.filter(f=>+(x.env||{})[f.id]>0).map(f=>`<tr><td>${x.env[f.id]} × envase ${f.kg} kg</td><td style="text-align:right">${clp(x.env[f.id]*((x.precioEnv||{})[f.id]||0))}</td></tr>`).join("");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Venta mayorista</title><body style="font:13px monospace;padding:10px;max-width:300px"><h3 style="margin:0">${esc(emp.nombre||"MR Gas")}</h3><p style="margin:4px 0">Venta mayorista · ${esc(c?c.nombre:"")}<br>${esc(x.fecha)} ${esc(String(x.hora||"").slice(0,5))}${x.guia?"<br>"+esc(x.guia):""}</p><hr><table style="width:100%">${filas}${x.dcto?`<tr><td>Descuento</td><td style="text-align:right">-${clp(x.dcto)}</td></tr>`:""}</table><hr><b style="font-size:15px">TOTAL ${clp(valorDist(x))}</b>${x.canje===false?"<p>Envases prestados</p>":""}<p style="margin-top:8px">Atendido por: ${esc(x.user||"")}</p><script>print()<\/script></body>`);w.document.close()}
L.mayorista=function(){
  $$("[data-mytab]").forEach(b=>b.onclick=()=>{mayTab=b.dataset.mytab;pintarSistema();window.scrollTo(0,0)});
  const fc=$("#f-cuad");if(fc)fc.onchange=e=>{fechaCuad=e.target.value||hoyStr();pintarSistema()};
  if(mayTab==="cuenta"){l0();$$("[data-mytab]").forEach(b=>b.onclick=()=>{mayTab=b.dataset.mytab;pintarSistema();window.scrollTo(0,0)});return}
  if(mayTab==="rend"){L.cuadratura();
    $$("[data-ctab]").forEach(b=>b.onclick=()=>{mayTab="venta";pintarSistema()});
    const cl=$("#cu-lista");if(cl){cl.textContent="← Volver a Venta Mayorista";cl.onclick=()=>{mayTab="venta";pintarSistema()}}
    const rs=$("#rd-sel");if(rs)rs.onchange=()=>{mayCli=+rs.value;pintarSistema()};
    $$(".vr-sum [data-ctab]").forEach(x=>x.onclick=()=>{mayTab="venta";pintarSistema()});
    {const fc2=$("#f-cuad");if(fc2)fc2.onchange=e=>{fechaCuad=e.target.value||hoyStr();pintarSistema()}}
    return}
  $$("[data-ircfg]").forEach(b=>b.onclick=()=>{cfgTab=b.dataset.ircfg;ir("config")});
  const f=$("#f-vm");if(!f)return;
  const sel=$("#my-cli2");if(sel)sel.onchange=()=>{mayCli=+sel.value;pintarSistema()};
  const leer=a=>{const o=st();$$(`[data-${a}]`).forEach(i=>o[i.dataset[a]]=Math.max(0,Math.round(+i.value||0)));return o};
  const calc=()=>{const c=cliMay(mayCli),PE=D.preciosEnvase||{},q=leer("vmq"),e=leer("vme"),d=Math.max(0,+$("#vm-dcto").value||0);
    $("#vm-total").textContent=clp(Math.max(0,FORMATOS.reduce((s,x)=>s+q[x.id]*(c?precioCliMay(c,x.id):0)+e[x.id]*(PE[x.id]||0),0)-d))};
  $$("[data-vmq],[data-vme],#vm-dcto").forEach(i=>i.oninput=calc);
  f.onreset=()=>setTimeout(()=>{calc();$("#vm-err").hidden=true},0);
  f.onsubmit=e=>{e.preventDefault();const er=$("#vm-err");er.hidden=true;const c=cliMay(mayCli);if(!c)return;
    if(!puedeEditarFecha(fechaCuad)){er.textContent="Día cerrado: solo un administrador puede grabar en días anteriores.";er.hidden=false;return}
    const venta=leer("vmq"),env=leer("vme"),dcto=Math.max(0,Math.round(+$("#vm-dcto").value||0));
    if(!FORMATOS.some(x=>venta[x.id])){er.textContent="Escriba al menos una cantidad de cilindros.";er.hidden=false;return}
    if(FORMATOS.some(x=>env[x.id]>venta[x.id])){er.textContent="Los envases vendidos no pueden ser más que los cilindros de ese formato.";er.hidden=false;return}
    const canje=$("#vm-canje").checked,precios={},precioEnv={};FORMATOS.forEach(x=>{if(venta[x.id])precios[x.id]=precioCliMay(c,x.id);if(env[x.id])precioEnv[x.id]=(D.preciosEnvase||{})[x.id]||0});
    const bruto=FORMATOS.reduce((s,x)=>s+venta[x.id]*(precios[x.id]||0)+env[x.id]*(precioEnv[x.id]||0),0);
    if(dcto>bruto){er.textContent="El descuento no puede ser mayor que la venta.";er.hidden=false;return}
    const prestamo=st();if(!canje)FORMATOS.forEach(x=>prestamo[x.id]=venta[x.id]-env[x.id]);
    const x={k:Date.now(),local:suc,fecha:fechaCuad,hora:ahora().slice(11),mayorista:c.id,guia:$("#vm-obs").value.trim(),tb:"",chofer:null,
      venta,env,precioEnv,dcto,prestamo,devolucion:st(),precios,canje,user:yo.nombre};
    D.cargasDist=D.cargasDist||[];D.cargasDist.unshift(x);aplicarDist(x,1);nubeGuardar("cargasDist",x);
    getRendMayV(c.id,fechaCuad,x.k,true);
    log("bodega","Venta mayorista",`${c.nombre} · ${cilTxt(venta)}${dcto?" · desc. "+clp(dcto):""} · ${clp(valorDist(x))}`);guardar();pintarSistema();
    aviso("Venta grabada",`${c.nombre}: ${clp(valorDist(x))}. Total del día: ${clp((D.cargasDist||[]).filter(y=>y.mayorista===c.id&&y.fecha===fechaCuad&&!y.anulada).reduce((s,y)=>s+valorDist(y),0))}.`)};
  const anular=k=>{const x=D.cargasDist.find(y=>String(y.k)===String(k));if(!x||x.anulada)return;x.anulada=true;aplicarDist(x,-1);nubeGuardar("cargasDist",x);
    syncRendMay(x.mayorista,x.fecha);
    log("bodega","Venta mayorista anulada",`${(cliMay(x.mayorista)||{}).nombre||""} · ${cilTxt(x.venta)} (los cilindros vuelven a bodega)`);guardar();pintarSistema()};
  $$("[data-anmay]").forEach(b=>b.onclick=()=>confirmar(b,()=>anular(b.dataset.anmay)));
  const ultima=()=>(D.cargasDist||[]).filter(y=>y.mayorista===mayCli&&y.fecha===fechaCuad&&!y.anulada).sort((a,b)=>b.k-a.k)[0];
  const an=$("#vm-anular");if(an)an.onclick=()=>confirmar(an,()=>{const u=ultima();if(u)anular(u.k)});
  $$("[data-vmimp]").forEach(b=>b.onclick=()=>imprimirVentaMay(D.cargasDist.find(y=>String(y.k)===b.dataset.vmimp)));
  const im=$("#vm-imp");if(im)im.onclick=()=>{const u=ultima();if(u)imprimirVentaMay(u)};
  $("#vm-pago").onclick=()=>{const u=ultima();mayVenta=u?u.k:null;mayVentaFija=true;mayTab="rend";pintarSistema();window.scrollTo(0,0)};
  $$("[data-vmrend]").forEach(b=>b.onclick=()=>{mayVenta=+b.dataset.vmrend;mayVentaFija=true;mayTab="rend";pintarSistema();window.scrollTo(0,0)});
  $("#vm-volver").onclick=()=>ir("menu");
};}
// Rendición mayorista: si el cliente tiene ventas, las cantidades vienen de ellas (se cambian en Venta Mayorista)
{const v0=vistaRendERP;vistaRendERP=function(r,f){let h=v0(r,f);if(r.tipo!=="mayorista")return h;
  const todas=(D.cargasDist||[]).filter(x=>x.mayorista===r.ref&&x.fecha===r.fecha&&!x.anulada).sort((a,b)=>(+a.k||0)-(+b.k||0));
  const vs=todas.filter(x=>r.venta!=null?String(x.k)===String(r.venta):!rendDeVenta(x));
  h=h.replace(/<div class="aviso entregas">[\s\S]*?<\/div>/,"");if(!vs.length)return h;
  h=h.replace(/ data-(rcant|renv)=/g,' disabled data-$1=').replace(/<button class="btn chico linea" id="rd-usar"[^>]*>[^<]*<\/button>/,"");
  const lista=vs.map(x=>`<span class="vr-v"><b>${todas.indexOf(x)+1}</b> ${esc(String(x.hora||"").slice(0,5))} · ${esc(cilTxt(x.venta))} · ${clp(valorDist(x))}</span>`).join("");
  return h.replace('<fieldset class="bloqueo"',`<div class="vr-sum"><span>${r.venta!=null?"Esta rendición es solo de la venta":`Ventas sin rendición propia (${vs.length})`}:</span>${lista}<button type="button" class="btn chico linea" data-ctab="menu">Agregar o quitar ventas</button></div><fieldset class="bloqueo"`)}}


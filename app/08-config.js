/* MR Gas · Panel General · 08-config */
/* ===================== CONFIGURACIONES: clientes, precios mayoristas y comisión por vale ===================== */
let espEdit=null;
const selListaMay=(id,cur)=>`<select id="${id}" ${id.startsWith("cl-")?`data-cllista="${id.slice(3)}"`:""}><option value="">Precio base (sin descuento)</option>${(D.listasMay||[]).slice().sort((a,b)=>a.dto-b.dto).map(l=>`<option value="${l.id}" ${cur===l.id?"selected":""}>${esc(l.nombre)} · −$${l.dto}/kg</option>`).join("")}<option value="esp" ${cur==="esp"?"selected":""}>Precio especial</option></select>`;
const histMay=(campo,f,antes,despues)=>log("precios",campo,`${fmt(f).et}: ${clp(antes)} → ${clp(despues)}`);
function setListaCli(c,v){
  if(v==="esp"){const e={};FORMATOS.forEach(f=>e[f.id]=precioCliMay(c,f.id));c.esp=Object.assign(e,c.esp||{});c.lista="esp";espEdit=c.id;cfgTab="preciosMay"}
  else c.lista=v?+v:null;
  log("precios","Lista de cliente mayorista",`${c.nombre} → ${nomListaMay(c)}`);guardar();pintarSistema()}
const CFG_MAY={
  clientesMay:{v(){asegMay();const CL=(D.mayoristas||[]).slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
    return `<section class="cfgp"><h3>Clientes mayoristas</h3>
      <form id="f-cli-may" class="cfgp-fila"><label class="g2">Nuevo cliente<input id="cm-nombre" placeholder="Nombre del cliente o empresa" required></label><label class="g2">Lista de precios${selListaMay("cm-lista","")}</label>
        <label>RUT <small>(opcional)</small><input id="cm-rut" placeholder="12.345.678-9"></label><label>Teléfono <small>(opcional)</small><input id="cm-fono" placeholder="+56 9 ..."></label>
        <button class="btn" type="submit">＋ Agregar cliente</button></form>
      <div class="tabla-wrap cfgt"><table><thead><tr><th>Cliente</th><th>Lista de precios</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("")}<th></th></tr></thead><tbody>
      ${CL.map(c=>`<tr><td><b>${esc(c.nombre)}</b>${c.rut||c.fono?`<br><small class="gris">${esc([c.rut,c.fono].filter(Boolean).join(" · "))}</small>`:""}</td><td>${selListaMay("cl-"+c.id,c.lista??"")}</td>
        ${FORMATOS.map(f=>`<td class="c azul">${clp(precioCliMay(c,f.id))}</td>`).join("")}<td class="c"><button class="x-rojo" type="button" data-delcli="${c.id}" aria-label="Eliminar ${esc(c.nombre)}">✕</button></td></tr>`).join("")||`<tr><td colspan="${FORMATOS.length+3}" class="vacio">Aún no hay clientes. Agregue el primero arriba.</td></tr>`}
      </tbody></table></div>
      <p class="cfgp-nota izq">Los precios de cada cliente salen de su lista. Si eliges <b>Precio especial</b>, escribes el precio de cada cilindro y no cambia con el precio base. Para cambiar listas o el precio base, ve a <a href="#" data-cfgtab="preciosMay">Precios Mayoristas</a>.</p></section>`},
    l(){const f=$("#f-cli-may");if(!f)return;
      f.onsubmit=e=>{e.preventDefault();const n=$("#cm-nombre").value.trim().replace(/\s+/g," ");if(!n)return;
        if((D.mayoristas||[]).some(m=>m.nombre.toLowerCase()===n.toLowerCase())){aviso("Ya existe","Ese cliente ya está creado.");return}
        const lv=$("#cm-lista").value,c={id:nuevoId(D.mayoristas),nombre:n,rut:$("#cm-rut").value.trim(),fono:$("#cm-fono").value.trim(),local:suc,lista:lv==="esp"?"esp":lv?+lv:null};
        if(c.lista==="esp"){c.esp={};FORMATOS.forEach(x=>c.esp[x.id]=precioBaseMay(x.id))}
        D.mayoristas.push(c);log("precios","Cliente mayorista creado",`${c.nombre} · ${nomListaMay(c)}`);guardar();pintarSistema();aviso("Cliente agregado",c.nombre)};
      $$("[data-cllista]").forEach(s=>s.onchange=()=>{const c=cliMay(+s.dataset.cllista);if(c)setListaCli(c,s.value)});
      $$("[data-delcli]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const c=cliMay(+b.dataset.delcli);D.mayoristas=D.mayoristas.filter(m=>m!==c);log("precios","Cliente mayorista eliminado",c.nombre+" (sus ventas y rendiciones se conservan)");guardar();pintarSistema()}))}},
  preciosMay:{v(){asegMay();const L=D.listasMay.slice().sort((a,b)=>a.dto-b.dto),CL=D.mayoristas,E=CL.filter(esEspMay).sort((a,b)=>a.nombre.localeCompare(b.nombre)),O=CL.filter(c=>!esEspMay(c)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
    const TH=FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15A":f.kg+"N"}</th>`).join("");
    return `<section class="cfgp"><h3>Listas de precios mayoristas</h3>
      <p class="cfgp-nota izq">Cada lista descuenta pesos por kilo al precio base. Ejemplo: Mayorista 40 en un 15 kg descuenta 40 × 15 = $600. Los clientes se asignan a una lista en <a href="#" data-cfgtab="clientesMay">Clientes</a>.</p>
      <form id="f-lista-may" class="cfgp-fila"><label class="g3">Nombre de la lista<input id="lm-nombre" placeholder="Ej: Mayorista 25" required></label><label>Descuento $ por kilo<input id="lm-dto" type="number" min="1" placeholder="25" required></label><button class="btn" type="submit">＋ Agregar lista</button></form>
      <div class="tabla-wrap cfgt"><table><thead><tr><th>Lista</th><th class="c">Descuento</th>${TH}<th class="c">Clientes</th><th></th></tr></thead><tbody>
        <tr class="base"><td><b>Precio base</b></td><td class="c">—</td>${FORMATOS.map(f=>`<td class="c"><b>${clp(precioBaseMay(f.id))}</b></td>`).join("")}<td class="c">${CL.filter(c=>!listaMay(c)&&!esEspMay(c)).length}</td><td></td></tr>
        ${L.map(l=>`<tr><td><b>${esc(l.nombre)}</b></td><td class="c">−$${l.dto} / kg</td>${FORMATOS.map(f=>`<td class="c azul">${clp(precioListaMay(l,f.id))}</td>`).join("")}<td class="c">${CL.filter(c=>c.lista===l.id).length}</td><td class="c"><button class="x-rojo" type="button" data-dellm="${l.id}" aria-label="Eliminar ${esc(l.nombre)}">✕</button></td></tr>`).join("")}
      </tbody></table></div>
      <p class="cfgp-nota izq" style="margin-top:6px">El <b>precio base mayorista</b> se cambia en la pestaña <a href="#" data-ir-pbase>Precio Base</a>: es el mismo precio de todo el sistema. Las listas y clientes se calculan desde ese precio.</p>
      <div class="cfg-dos abajo solo"><div style="display:none"></div>
      <div><h3 class="sub">Precio especial</h3>
      <p class="cfgp-nota izq">Para clientes con un precio distinto a las listas. Escribe el precio de cada cilindro; no cambia cuando actualizas el precio base.</p>
      <div class="cfgp-fila"><label class="g4">Cliente<select id="esp-cli"><option value="">Elige un cliente...</option>${O.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></label><button class="btn" type="button" id="esp-dar">＋ Dar precio especial</button></div>
      <div class="tabla-wrap cfgt"><table><thead><tr><th>Cliente</th>${TH}<th></th></tr></thead><tbody>
      ${E.map(c=>`<tr><td><b>${esc(c.nombre)}</b></td>${FORMATOS.map(f=>espEdit===c.id?`<td class="pn"><span>$</span><input type="number" min="1" class="azul" data-esp="${f.id}" value="${precioCliMay(c,f.id)}" aria-label="Precio especial ${f.et}"></td>`:`<td class="c azul">${clp(precioCliMay(c,f.id))}</td>`).join("")}
        <td class="c" style="white-space:nowrap">${espEdit===c.id?`<button class="btn chico" type="button" data-espok="${c.id}">Guardar</button> <button class="btn chico linea" type="button" data-espno="1">Cancelar</button>`:`<button class="btn chico linea" type="button" data-espedit="${c.id}">Modificar</button> <button class="x-rojo" type="button" data-espquitar="${c.id}" aria-label="Quitar precio especial">✕</button>`}</td></tr>`).join("")||`<tr><td colspan="${FORMATOS.length+2}" class="vacio">Ningún cliente tiene precio especial.</td></tr>`}
      </tbody></table></div></div></div></section>`},
    l(){const fl=$("#f-lista-may");if(!fl)return;
      fl.onsubmit=e=>{e.preventDefault();const n=$("#lm-nombre").value.trim(),d=Math.round(+$("#lm-dto").value||0);if(!n||d<=0)return;
        D.listasMay.push({id:Date.now(),nombre:n,dto:d});log("precios","Lista mayorista creada",`${n} · −$${d}/kg`);guardar();pintarSistema()};
      $$("[data-dellm]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const id=+b.dataset.dellm,l=D.listasMay.find(x=>x.id===id);D.listasMay=D.listasMay.filter(x=>x!==l);
        D.mayoristas.forEach(c=>{if(c.lista===id)c.lista=null});log("precios","Lista mayorista eliminada",l?l.nombre:"");guardar();pintarSistema()}));
      $$("[data-ir-pbase]").forEach(x=>x.onclick=e=>{e.preventDefault();cfgTab="precioBase";pintarSistema()});
      if($("#f-base-may"))$("#f-base-may").onsubmit=e=>{e.preventDefault();let n=0;D.preciosMayor=D.preciosMayor||{};
        $$("[data-pbm]").forEach(i=>{const f=i.dataset.pbm,v=Math.round(+i.value||0),a=precioBaseMay(f);if(v>0&&v!==a){histMay("Precio base mayorista",f,a,v);D.preciosMayor[f]=v;n++}});
        if(!n){aviso("Sin cambios","No cambió ningún precio.");return}
        log("precios","Precio base mayorista actualizado",`${n} cilindro(s)`);guardar();pintarSistema();aviso("Precio base actualizado",`${n} precio(s). Las listas y clientes ya usan el precio nuevo.`)};
      $("#esp-dar").onclick=()=>{const c=cliMay(+$("#esp-cli").value);if(!c){aviso("Falta el cliente","Elija un cliente.");return}setListaCli(c,"esp")};
      $$("[data-espedit]").forEach(b=>b.onclick=()=>{espEdit=+b.dataset.espedit;pintarSistema()});
      $$("[data-espno]").forEach(b=>b.onclick=()=>{espEdit=null;pintarSistema()});
      $$("[data-espquitar]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const c=cliMay(+b.dataset.espquitar);if(c){espEdit=null;setListaCli(c,"")}}));
      $$("[data-espok]").forEach(b=>b.onclick=()=>{const c=cliMay(+b.dataset.espok);if(!c)return;const ins=[...$$("[data-esp]")];
        if(ins.some(i=>!(+i.value>0))){aviso("Precio inválido","Escriba un precio en todos los cilindros.");return}
        c.esp=c.esp||{};ins.forEach(i=>{const f=i.dataset.esp,v=Math.round(+i.value),a=precioCliMay(c,f);if(v!==a){histMay("Precio especial "+c.nombre,f,a,v);c.esp[f]=v}});
        espEdit=null;log("precios","Precio especial guardado",c.nombre);guardar();pintarSistema()})}},
  comVale:{v(){asegMay();return `<form class="cfgp" id="f-comvale"><h3>Comisión de vales</h3>
      <p class="cfgp-nota">Escribe cuánto se le abona al cliente por cada vale, según el tipo de vale y el cilindro. Solo se aplica en la <b>Rendición Mayorista</b>: es un beneficio para el cliente. Se calcula sola al grabar un vale y se descuenta de su saldo (queda a favor en su cuenta). En la rendición local no hay comisión. <b>Vale para el Panel General y para todas las sucursales de Venta Local.</b></p>
      <div class="tabla-wrap cfgt"><table><thead><tr><th>Tipo de vale</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15":f.kg+" kg"}</th>`).join("")}</tr></thead><tbody>
      ${Object.entries(VALES).map(([k,t])=>`<tr><td><b>${t}</b></td>${FORMATOS.map(f=>`<td class="pn c"><span>$</span><input type="number" min="0" class="azul" data-cv="${k}|${f.id}" value="${D.comisionVale[k][f.id]||0}" aria-label="Comisión ${t} ${f.et}"></td>`).join("")}</tr>`).join("")}
      </tbody></table></div><div class="cfgp-btn"><button class="btn" type="submit">Guardar comisión</button></div>
      <p class="cfgp-nota">Ejemplo: si un vale de 15 kg de la compañía deja $1.000 y te entregan 3, la comisión es $3.000.</p></form>`},
    l(){const f=$("#f-comvale");if(!f)return;f.onsubmit=async e=>{e.preventDefault();let n=0;
      $$("[data-cv]").forEach(i=>{const [k,fo]=i.dataset.cv.split("|"),v=Math.max(0,Math.round(+i.value||0)),a=D.comisionVale[k][fo]||0;if(v!==a){histMay("Comisión "+VALES[k],fo,a,v);D.comisionVale[k][fo]=v;n++}});
      let local="";
      if(NUBE.activo&&esAdmin()){const VMAP={compania:"De la compañía",otras:"Otras compañías",digital:"Vale Digital",digotras:"Digital Otras compañías"},FMAP={c5:"5",c11:"11",c15:"15",c45:"45",h15a:"H"},com={};
        Object.keys(VMAP).forEach(k=>{com[VMAP[k]]={};FORMATOS.forEach(f=>com[VMAP[k]][FMAP[f.id]]=(D.comisionVale[k]||{})[f.id]||0)});
        const sucs={};LOC_INDEP.forEach(x=>sucs[lslug(x)]={comision:com});
        try{await locPrecios({global:{comision:com},sucs});local=" También quedó en todas las sucursales de Venta Local."}catch(x){local=" No se pudo guardar en Venta Local: "+x.message}}
      if(!n&&!local){aviso("Sin cambios","No cambió ninguna comisión.");return}
      if(n){log("precios","Comisión por vale actualizada",`${n} valor(es)`);guardar()}pintarSistema();aviso("Comisión guardada","Se aplica a los vales que se graben desde ahora en la Rendición mayorista."+local)}}}
};
{const vc=V.config,lc=L.config;
  V.config=function(){if(CFG_MAY[cfgTab]){if(!esAdmin()&&!cfgTabsLista().some(t=>t[0]===cfgTab)){cfgTab=(cfgTabsLista()[0]||["choferes"])[0];if(!CFG_MAY[cfgTab])return vc.call(this)}return cabeza("Configuraciones")+cfgTabsHtml(cfgTab)+CFG_MAY[cfgTab].v()}return vc.call(this)};
  L.config=function(){if(CFG_MAY[cfgTab]){enlazarCfgTabs();CFG_MAY[cfgTab].l();return}return lc.call(this)}}

/* ===================== RENDICIÓN MÓVIL Y MAYORISTA CON FORMATO ERP LOCAL =====================
   Izquierda: detalle de la venta, cargos, observaciones y totales. Derecha: cajas de lo que se rinde. */
TIPOS_PAGO.valecil="Vales (sólo cilindro)";TIPOS_PAGO.qr="Descuento QR";
const QR_F=["c11","c15"];
const qrPrecio=f=>+(((D.descQR||{})[f])||0);
const DESC_T=["QR","Convenio","Promoción","Cliente frecuente","Cilindro con falla","Otro"];
const GASTO_T=["Combustible","Alimentación","Mantención","Peaje","Estacionamiento","Otro"];
const CAJA_K={efectivo:"ing",vale:"val",valecil:"val",cheque:"ban",transferencia:"ban",transbank:"ban",deposito:"ban",qr:"res",descuento:"res",gasto:"res",petroleo:"res",credito:"res",creditodoc:"res"};

function vistaRendERP(r,fechaSel){
  const c=calcRend(r),ant=r.tipo==="mayorista"?saldoAntMay(r):saldoAnterior(r.tipo,r.ref,r.fecha),ed=puedeEditarFecha(r.fecha),MY=r.tipo==="mayorista",adm=esAdmin();
  const ent=r.tipo==="movil"?entregasDe(r.ref,r.fecha):cargaDistDe(r.ref,r.fecha);
  const pe=r.precioEnv||{},en=r.envases||st();
  const totF=f=>(r.ventas[f.id]||0)*(r.precios[f.id]||0)+(en[f.id]||0)*(pe[f.id]||0);
  const fila=(t,fn,cls="")=>`<tr class="${cls}"><td class="l">${t}</td>${FORMATOS.map(f=>`<td>${fn(f)}</td>`).join("")}</tr>`;
  const ninp=(a,f,v,lbl)=>`<input class="ei" type="number" min="0" inputmode="numeric" data-${a}="${f.id}" value="${v||0}" aria-label="${lbl} ${f.et}">`;
  const caja=(t,titulo,campos,btn="Agregar")=>{const ps=r.pagos.filter(p=>p.tipo===t),tot=ps.reduce((a,p)=>a+p.monto,0);
    return `<div class="rbox k-${CAJA_K[t]||"res"}"><div class="rbox-h"><span>${titulo}</span><span class="tot">TOTAL: ${clp(tot)}</span></div>
      ${campos!=null&&ed?`<form class="rbox-b" data-rk="${t}">${campos}<button class="btn chico" type="submit">${btn}</button></form>`:""}
      ${ps.length?`<div class="chips">${ps.map(p=>`<span class="chip">${esc(p.detalle||TIPOS_PAGO[t])} <b>${clp(p.monto)}</b>${porTag(p)}${ed?`<button type="button" data-delpago="${p.id}" aria-label="Quitar">✕</button>`:""}</span>`).join("")}</div>`:""}</div>`};
  const I=(f,ph,w,type="number")=>`<input data-f="${f}" type="${type}" ${type==="number"?'inputmode="numeric" min="0"':""} placeholder="${ph}" ${w?'class="w"':""} ${type==="date"?`value="${r.fecha}"`:""}>`;
  const S=(f,ops,ph)=>`<select data-f="${f}">${ph?`<option value="">${ph}</option>`:""}${ops.map(o=>Array.isArray(o)?`<option value="${o[0]}">${o[1]}</option>`:`<option>${o}</option>`).join("")}</select>`;
  const R=(f,ops)=>{const nm="r_"+f+"_"+Math.random().toString(36).slice(2,7);return `<div class="radios">${ops.map(([v,t],i)=>`<label><input type="radio" name="${nm}" data-f="${f}" value="${v}" ${i?"":"checked"}> ${t}</label>`).join("")}</div>`};
  const VQ=pref=>`<div class="vq">${FORMATOS.map(f=>`<label>${f.tipo==="h"?"H":f.kg}<input data-f="${pref}${f.id}" type="number" inputmode="numeric" min="0" placeholder="0"></label>`).join("")}</div>`;
  const otros=r.pagos.filter(p=>!["efectivo","vale","valecil","cheque","transferencia","qr","descuento","gasto","transbank"].includes(p.tipo));
  const sc=v=>Math.round(v)>0?"falta":Math.round(v)<0?"sobra":"ok";
  return cabeza(`Rendición ${MY?"Mayorista":"Móvil"}`,`<div class="acc" style="align-items:end">${fechaSel}<button class="btn linea" id="cu-lista" type="button">← Volver a la lista</button></div>`)+`
  ${ed?"":`<div class="banner">Esta rendición es de un día anterior y está bloqueada. Para editarla, el administrador debe darle acceso a históricos.</div>`}
  ${(()=>{const lista=MY?(D.mayoristas||[]).filter(m=>(m.local??1)===suc).sort((a,b)=>a.nombre.localeCompare(b.nombre)):chOrden().filter(c=>c.local===suc);
    const dp=deudasRend(r);
    return `<div class="mrbar"><div class="row"><span class="lbl">${MY?"CLIENTE":"CHOFER"}</span><select id="rd-sel" class="big">${lista.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></div>
      ${dp.list.length?`<div class="row dpend"><span class="lbl">DEUDAS PENDIENTES</span>${dp.list.map(x=>`<button type="button" class="dch" data-irfecha="${x.f}" title="Ir a la rendición del ${fF(x.f)}">${fF(x.f).slice(0,5)} <b>${clp(x.pend)}</b>${x.pend<x.orig?`<small>de ${clp(x.orig)}</small>`:""}</button>`).join("")}<span class="dtot">Total adeudado: <b>${clp(dp.list.reduce((a,x)=>a+x.pend,0))}</b></span></div>`:""}
      ${dp.favor?`<div class="row"><span class="dfav">Saldo a favor: <b>${clp(dp.favor)}</b></span></div>`:""}</div>`})()}
  <div class="rtop-erp"><span class="rtt">${esc(nomRef(r))}</span><span class="nota" style="margin:0">${fechaLarga(r.fecha)} · abierta por ${esc(r.usuario)}${r.guardada?` · guardada ${esc(r.guardada.slice(11,16))}`:""}</span>
    <label class="guia">N° guía<input id="rd-guia" value="${esc(r.guia||"")}" ${ed?"":"disabled"}></label></div>
  ${ent&&ent.tarros?`<div class="aviso entregas"><span>${MY?"Ventas mayoristas grabadas":"Pedidos telefónicos entregados"}: <b>${resumenVentas(ent.ventas)}${ent.envTot?" · con envase: "+resumenVentas(ent.env):""}</b></span>${ed?'<button class="btn chico linea" id="rd-usar" type="button">Usar estas cantidades</button>':""}</div>`:""}
  <fieldset class="bloqueo" ${ed?"":"disabled"}><div class="rerp">
   <div class="rc-izq">
    <div class="tabla-wrap"><table class="rv">
      <thead><tr><th class="l"></th>${FORMATOS.map(f=>`<th>${f.tipo==="h"?"H15":f.kg}</th>`).join("")}</tr></thead><tbody>
      ${fila(MY?"PRECIO CLIENTE":"PRECIO CHOFER",f=>adm&&r.tipo!=="movil"?`<input class="ei pr" type="number" min="0" data-rprecio="${f.id}" value="${r.precios[f.id]||0}" aria-label="Precio ${f.et}">`:clp(r.precios[f.id]||0))}
      ${fila("VENTA (Cantidad)",f=>ninp("rcant",f,r.ventas[f.id],"Cantidad"),"cant")}
      ${r.envases?fila("VENTA CON ENVASE",f=>ninp("renv",f,en[f.id],"Con envase")):""}
      ${r.envases&&r.tipo==="movil"?fila("PRECIO ENVASE",f=>clp(pe[f.id]||0)):""}
      ${r.envases&&adm&&r.tipo!=="movil"?fila("PRECIO ENVASE",f=>`<input class="ei pr" type="number" min="0" data-renvp="${f.id}" value="${pe[f.id]||0}" aria-label="Precio envase ${f.et}">`):""}
      ${fila("TOTAL",f=>clp(totF(f)),"tot")}
    </tbody></table></div>
    <div class="rleft2">
     <div>
      <div class="rbox k-car"><div class="rbox-h"><span>CARGOS</span><span class="tot">TOTAL: ${clp(c.cargos)}</span></div>
        ${ed?`<form class="rbox-b" id="f-cargo"><input id="cg-monto" type="number" min="1" inputmode="numeric" placeholder="Monto $"><input id="cg-det" placeholder="N° o detalle" class="w"><button class="btn chico" type="submit">Agregar</button></form>`:`<form id="f-cargo" hidden></form>`}
        ${r.cargos.length||r.vuelto?`<div class="chips">${r.cargos.map(x=>`<span class="chip">${esc(x.detalle||"Cargo")} <b>${clp(x.monto)}</b>${porTag(x)}${ed?`<button type="button" data-delcargo="${x.id}" aria-label="Quitar">✕</button>`:""}</span>`).join("")}${r.vuelto?`<span class="chip">Vuelto <b>${clp(r.vuelto)}</b></span>`:""}</div>`:""}
        ${(()=>{if(MY)return "";const pend=(D.rendiciones||[]).filter(x=>x.local===r.local&&x!==r).flatMap(x=>x.pagos.filter(p=>p.tipo==="credito"&&!p.cobrado).map(p=>({x,p})));
          return pend.length&&ed?`<div class="chips"><span class="nota" style="margin:0;width:100%">Créditos por cobrar:</span>${pend.map(({x,p})=>`<span class="chip">${esc(p.detalle||"Crédito")} · ${fF(x.fecha)} <b>${clp(p.monto)}</b><button type="button" data-cobrar="${idDoc("rendiciones",x)}|${p.id}" style="color:var(--b7)">Cobrar</button></span>`).join("")}</div>`:""})()}</div>
      <div class="rbox k-obs"><div class="rbox-h"><span>OBSERVACIONES</span></div><div class="rbox-b"><textarea id="rd-obs" placeholder="Ej: el cliente paga la diferencia el lunes">${esc(r.obs||"")}</textarea></div></div>
     </div>
     <div>
      <table class="tbox"><tr><th>TOTAL ($)</th><th>TOTAL (KILOS)</th><th>TOTAL (TARROS)</th></tr>
        <tr><td class="bigv">${clp(c.venta)}</td><td class="bigv">${c.kilos.toLocaleString("es-CL")} Kilos</td><td class="bigv">${c.tarros} Un.</td></tr>
        <tr><th>RENDICIÓN:</th><th>SALDO DEL DÍA:</th><th>SALDO PENDIENTE TOTAL</th></tr>
        <tr><td class="bigv">${clp(c.pagado+c.com)}</td><td class="bigv saldo ${sc(c.saldo)}">${clp(c.saldo)}</td><td class="bigv saldo ${sc(ant+c.saldo)}">${clp(ant+c.saldo)}</td></tr></table>
      <table class="tbox lista" style="margin-top:10px">
        <tr><td class="l">Saldo anterior pendiente</td><td class="r">${clp(ant)}</td></tr>
        <tr><td class="l">+ Venta del día</td><td class="r">${clp(c.venta)}</td></tr>
        <tr><td class="l">+ Cargos</td><td class="r">${clp(c.cargos)}</td></tr>
        <tr><td class="l">− Rendido</td><td class="r">${clp(c.pagado+(MY?c.com:0))}</td></tr>
        <tr class="tt"><td class="l">= SALDO PENDIENTE</td><td class="r">${clp(ant+c.saldo)}</td></tr></table>
      <div class="acc" style="margin-top:10px"><button class="btn" id="rd-guardar" type="button">Guardar rendición</button><span class="aviso ok" id="rd-ok" hidden style="margin:0">Rendición guardada.</span></div>
     </div>
    </div>
   </div>
   <div class="rc-pagos">
    <div class="r2c">${caja("efectivo","EFECTIVO",I("monto","Monto $",1),"Guardar")}
      <div class="rbox k-ing"><div class="rbox-h"><span>VUELTO</span><span class="tot">TOTAL: ${clp(r.vuelto||0)}</span></div>${ed?`<form class="rbox-b" id="f-vuelto"><input id="rd-vuelto2" type="number" min="0" inputmode="numeric" placeholder="Monto $" class="w" value="${r.vuelto||""}"><button class="btn chico" type="submit">Guardar</button></form>`:""}</div></div>
    ${caja("vale",`VALES (RECARGA) ${ed?R("vale",Object.entries(VALES).map(([k,t])=>[k,{compania:"Compañía",otras:"Otras",digital:"Digital",digotras:"Digital otras"}[k]||t])):""}`,VQ("q"),"Guardar")}
    ${caja("valecil","VALES (SÓLO CILINDRO)",VQ("q"),"Guardar")}
    ${caja("cheque","CHEQUE",I("monto","Monto $")+I("num","N° cheque",0,"text")+S("banco",BANCOS,"Banco..."))}
    ${caja("transferencia","TRANSFERENCIA ELECTRÓNICA",I("monto","Monto $")+S("banco",BANCOS,"Banco...")+I("fecha","",0,"date")+I("det","Detalle",1,"text"))}
    ${caja("qr","DESCUENTO QR",`<div class="vq qr">${QR_F.map(f=>`<label>${fmt(f).kg} kg<input data-f="q${f}" type="number" inputmode="numeric" min="0" placeholder="0"></label>`).join("")}</div><span class="nota" style="margin:0;white-space:nowrap">${QR_F.map(f=>`${fmt(f).kg} kg: ${clp(qrPrecio(f))}`).join(" · ")} c/u</span>`)}
    ${caja("descuento","DESCUENTOS",S("motivo",DESC_T,"Tipo...")+I("monto","Monto $")+I("det","Detalle",1,"text"))}
    ${caja("gasto","GASTOS",S("motivo",GASTO_T,"Tipo...")+I("monto","Monto $")+I("det","Detalle",1,"text"))}
    ${caja("transbank","TRANSBANK",R("tarjeta",[["debito","Débito"],["credito","Crédito"]])+I("monto","Monto $")+I("num","N° voucher",0,"text")+I("fecha","",0,"date"))}
    ${otros.length?`<div class="rbox k-ban"><div class="rbox-h"><span>OTROS PAGOS</span><span class="tot">TOTAL: ${clp(otros.reduce((a,p)=>a+p.monto,0))}</span></div><div class="chips">${otros.map(p=>`<span class="chip">${esc(TIPOS_PAGO[p.tipo]||p.tipo)} · ${esc(p.detalle||"")} <b>${clp(p.monto)}</b>${porTag(p)}${ed?`<button type="button" data-delpago="${p.id}" aria-label="Quitar">✕</button>`:""}</span>`).join("")}</div></div>`:""}
   </div>
  </div></fieldset>`;
}
{const vr0=vistaRend;vistaRend=function(r,f){return r.tipo==="movil"||r.tipo==="mayorista"?vistaRendERP(r,f):vr0(r,f)}}

function enlazarRendERP(){
  const r=getRend(cuadTab,cuadSel,fechaCuad,false);if(!r)return;
  const re=()=>{nubeGuardar("rendiciones",r);guardar();pintarSistema()};
  const lg=(t,monto,det)=>log("cuadratura","Pago agregado",`${nomRef(r)} (${r.fecha}) · ${TIPOS_PAGO[t]} ${clp(monto)}${det?" · "+det:""}`,{chofer:r.tipo==="movil"?r.ref:null});
  const fv=$("#f-vuelto");if(fv)fv.onsubmit=e=>{e.preventDefault();r.vuelto=Math.max(0,Math.round(+$("#rd-vuelto2").value||0));re()};
  const fc=$("#f-cargo");if(fc)fc.onsubmit=e=>{e.preventDefault();const m=Math.round(+$("#cg-monto").value||0);if(m<=0)return;const d=$("#cg-det").value.trim();
    r.cargos.push({por:porMi(),id:nuevoId(r.cargos),monto:m,detalle:d?(/^\d+$/.test(d)?"N° "+d:d):"Cargo"});re()};
  $$("[data-rk]").forEach(f=>f.onsubmit=e=>{e.preventDefault();const t=f.dataset.rk,q=k=>f.querySelector(`[data-f="${k}"]`),g=k=>{const el=q(k);return el?String(el.value).trim():""};
    const rad=k=>{const el=f.closest(".rbox").querySelector(`[data-f="${k}"]:checked`);return el?el.value:""};
    const fe=g("fecha"),fe2=fe?fe.split("-").reverse().join("-"):"",add=(monto,detalle,campos={})=>{const p={id:nuevoId(r.pagos),tipo:t,monto:Math.round(monto),detalle,hora:ahora(),campos,por:porMi()};r.pagos.push(p);return p};
    if(t==="vale"||t==="valecil"){const vk=rad("vale")||"compania";let n=0;
      FORMATOS.forEach(fo=>{const k=+g("q"+fo.id)||0;if(!k)return;n++;
        if(t==="vale"){const p=add(k*(r.precios[fo.id]||0),`${k} × ${fo.et} · ${VALES[vk]}`,{vale:vk,valeTxt:VALES[vk],formato:fo.id,cant:k});
          if(r.tipo==="mayorista"){p.com=comVale(p.campos);if(p.com)p.detalle+=" · comisión cliente "+clp(p.com)}lg(t,p.monto,p.detalle)}
        else{const pr=(r.precioEnv||D.preciosEnvase||{})[fo.id]||0,p=add(k*pr,`${k} × ${fo.et} (sólo cilindro)`,{formato:fo.id,cant:k});lg(t,p.monto,p.detalle)}});
      if(!n){aviso("Faltan cantidades","Escribe cuántos vales hay de cada cilindro.");return}re();return}
    if(t==="qr"){const qs=QR_F.map(fo=>[fo,+g("q"+fo)||0]).filter(x=>x[1]);if(!qs.length){aviso("Faltan cantidades","Escribe cuántos descuentos QR hubo.");return}
      if(qs.some(([fo])=>!qrPrecio(fo))){aviso("Falta configurar","Escribe el valor del descuento QR en Configuraciones → Descuento QR.");return}
      const p=add(qs.reduce((a,[fo,k])=>a+k*qrPrecio(fo),0),qs.map(([fo,k])=>`${fmt(fo).kg} kg × ${k}`).join(" · "),{qr:Object.fromEntries(qs)});lg(t,p.monto,p.detalle);re();return}
    const monto=Math.round(+g("monto")||0);if(monto<=0){aviso("Falta el monto","Escribe un monto mayor a $0.");return}
    let det="";const campos={banco:g("banco"),num:g("num"),fecha:fe,motivo:g("motivo"),tdoc:g("tdoc"),litros:+g("litros")||0,tarjeta:rad("tarjeta")};
    if(t==="cheque"||t==="transferencia")det=[g("banco"),g("num")&&"N° "+g("num"),fe2,g("det")].filter(Boolean).join(" · ");
    else if(t==="transbank")det=[rad("tarjeta")==="credito"?"Crédito":"Débito",g("num")&&"voucher N° "+g("num"),fe2].filter(Boolean).join(" · ");
    else if(t==="descuento"||t==="gasto")det=[g("motivo"),g("det")].filter(Boolean).join(" · ");
    else if(t==="petroleo")det=g("litros")?g("litros")+" litros":"";
    else if(t==="credito")det=[g("det"),{boleta:"Boleta",factura:"Factura",guia:"Guía"}[g("tdoc")],g("num")&&"N° "+g("num")].filter(Boolean).join(" · ");
    const p=add(monto,det,campos);lg(t,monto,det);re()});
}
{const lc=L.cuadratura;L.cuadratura=function(){lc.call(this);if(cuadSel!=null&&(cuadTab==="movil"||cuadTab==="mayorista"))enlazarRendERP()}}

/* Configuraciones → Descuento QR */
CFG_MAY.descQR={v(){D.descQR=D.descQR||{};return `<form class="cfgp" id="f-qr"><h3>Descuento QR</h3>
    <p class="cfgp-nota">Es lo que se descuenta por cada venta pagada con QR, según el cilindro. En la rendición solo se escribe cuántos descuentos hubo y el monto se calcula solo.</p>
    <div class="tabla-wrap cfgt angosta"><table><thead><tr><th>Cilindro</th><th class="c">Descuento actual</th><th class="c">Descuento nuevo</th></tr></thead><tbody>
    ${QR_F.map(f=>`<tr><td><b>Cilindro ${fmt(f).kg}N</b> <span class="gris">${fmt(f).kg} kilos</span></td><td class="c azul">${D.descQR[f]?clp(D.descQR[f]):'<span class="gris">Sin descuento</span>'}</td><td class="pn"><span>$</span><input type="number" min="0" data-qr="${f}" value="${D.descQR[f]||0}" aria-label="Descuento QR ${fmt(f).kg} kg"></td></tr>`).join("")}
    </tbody></table></div><div class="cfgp-btn"><button class="btn" type="submit">Guardar descuento QR</button></div>
    <p class="cfgp-nota">Ejemplo: si el descuento QR del 15 kg es $4.400 y hubo 3, en la rendición se descuentan $13.200.</p></form>`},
  l(){const f=$("#f-qr");if(!f)return;f.onsubmit=e=>{e.preventDefault();D.descQR=D.descQR||{};let n=0;
    $$("[data-qr]").forEach(i=>{const k=i.dataset.qr,v=Math.max(0,Math.round(+i.value||0)),a=D.descQR[k]||0;if(v!==a){histMay("Descuento QR",k,a,v);D.descQR[k]=v;n++}});
    if(!n){aviso("Sin cambios","No cambió ningún valor.");return}guardar();pintarSistema();aviso("Descuento QR guardado","Se usa en las rendiciones desde ahora.")}}};

/* ===================== PANTALLA COMPACTA: una sola barra superior ===================== */
{const t=document.querySelector('.sis-top .wrap'),n=document.getElementById('sis-acciones'),box=document.createElement('div');box.className='top-info';
  ['sis-sucursal','nube-estado','sis-yo','sis-reloj'].forEach(id=>{const e=document.getElementById(id);if(e)box.appendChild(e)});
  if(t&&n){t.insertBefore(box,n);const b=document.querySelector('.sis-banda');if(b)b.style.display='none'}}

/* ===================== AJUSTE AUTOMÁTICO A LA PANTALLA =====================
   Si la pantalla no cabe, la tabla más larga se achica y se desplaza dentro de su cuadro. */
function ajustarPantalla(){const main=document.getElementById("sis-main");if(!main)return;
  main.querySelectorAll(".tabla-wrap[data-fit]").forEach(t=>{t.style.maxHeight="";t.removeAttribute("data-fit")});
  if(innerWidth<900||innerHeight<500||main.querySelector(".cfgp,.res-ks,.res-kpi"))return;
  for(let i=0;i<5;i++){const over=document.documentElement.scrollHeight-innerHeight;if(over<=2)break;
    const ts=[...main.querySelectorAll(".tabla-wrap")].filter(t=>!t.dataset.fit&&t.offsetHeight>190&&t.offsetParent).sort((a,b)=>b.offsetHeight-a.offsetHeight);if(!ts.length)break;
    const t=ts[0],h=Math.max(170,t.offsetHeight-over-4);t.style.maxHeight=h+"px";t.style.overflow="auto";t.dataset.fit=1}}
{const ps0=pintarSistema;pintarSistema=function(){const r=ps0.apply(this,arguments);try{ajustarPantalla()}catch(e){}return r}}
addEventListener("resize",()=>{clearTimeout(window.__ajT);window.__ajT=setTimeout(()=>{try{ajustarPantalla()}catch(e){}},120)});

/* Sectorizar en una pantalla: mapa a la izquierda, todo lo demás en una columna con su propio desplazamiento */
function reorgSz(){const main=document.getElementById("sis-main"),sz=main&&main.querySelector(".sz2,.sz");if(!sz||innerWidth<1080)return;
  const lado=sz.querySelector(".sz-lado"),der=document.createElement("div");der.className="sz-der";
  if(lado)der.appendChild(lado);
  let n=sz.nextElementSibling;while(n){const nx=n.nextElementSibling;if(!n.classList.contains("foot-mr"))der.appendChild(n);n=nx}
  sz.appendChild(der)}
{const l2=L.sectorizar;L.sectorizar=function(){reorgSz();return l2.apply(this,arguments)}}

/* Deudas de días anteriores sin pagar (lo que sobra un día paga primero la deuda más antigua) */
function deudasRend(r){const rs=(D.rendiciones||[]).filter(x=>x.tipo===r.tipo&&x.ref===r.ref&&x.fecha<r.fecha).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const q=[];let favor=0;
  rs.forEach(x=>{let sd=Math.round(calcRend(x).saldo);
    if(sd>0){if(favor>0){const u=Math.min(favor,sd);favor-=u;sd-=u}if(sd>0)q.push({f:x.fecha,orig:Math.round(calcRend(x).saldo),pend:sd})}
    else if(sd<0){let y=-sd;for(const e of q){if(!y)break;const u=Math.min(y,e.pend);e.pend-=u;y-=u}favor+=y}});
  return {list:q.filter(e=>e.pend>0),favor}}
{const e0=enlazarRendERP;enlazarRendERP=function(){e0();
  const sl=$("#rd-sel");if(sl)sl.onchange=()=>{cuadSel=+sl.value;pintarSistema()};
  $$("[data-irfecha]").forEach(b=>b.onclick=()=>{fechaCuad=b.dataset.irfecha;pintarSistema();window.scrollTo(0,0)})}}

/* ===================== PORTAL: menú de 4 botones antes de iniciar sesión ===================== */
{const r0=ruta;ruta=function(){const h=location.hash.slice(1),pt=document.getElementById("vista-portal");
  if(pt&&(h===""||PUBLICO.includes(h))&&!yo){if(h)history.replaceState(null,"",location.pathname+location.search);document.body.classList.remove("arrancando");["vista-publica","vista-login","vista-panel"].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true});pt.hidden=false;window.scrollTo(0,0);return}
  if(yo&&PUBLICO.includes(h)){location.hash="panel";return}
  if(pt)pt.hidden=true;return r0.apply(this,arguments)}}
{const s=document.querySelector(".il-sitio");if(s&&!document.querySelector(".il-portal")){const a=document.createElement("a");a.href="#";a.className="il-portal";a.textContent="← Volver al menú de inicio";s.insertAdjacentElement("afterend",a);s.remove()}}

/* ===================== PERMISOS DETALLADOS ===================== */
function aplicarPermisosUI(){const main=document.getElementById("sis-main");if(!main||!yo||esAdmin())return;
  if(!tieneExtra("pedidos.anular"))main.querySelectorAll("[data-anular]").forEach(b=>b.remove());
  if(mod!=="menu"&&soloVer(mod)){
    if(!main.querySelector(".aviso-ver"))main.insertAdjacentHTML("afterbegin",'<div class="aviso-ver"><b>Solo lectura.</b> Puede ver este cuadro, pero sus cambios no se guardan. Pida permiso al administrador si necesita trabajar aquí.</div>');
    main.querySelectorAll('form button[type=submit],form button:not([type]),[data-asignar],[data-entregar],[data-devolver],[data-anular],[data-reclamo]').forEach(b=>{b.disabled=true;b.title="Solo lectura"})}}
function enlazarPlantillas(){
  $$("[data-plantilla]").forEach(b=>b.onclick=()=>{const i=+b.dataset.plantilla,p=i<0?[]:PLANTILLAS[i][1];
    MOD_PERM.forEach(id=>{const v=p.includes(id)?"usar":p.includes(id+":ver")?"ver":"";const r=$(`input[name="pm-${id}"][value="${v}"]`);if(r)r.checked=true});
    $$('input[name="us-perm"],input[name="us-app"]').forEach(c=>c.checked=p.includes(c.value));
    $$("[data-plantilla]").forEach(x=>x.classList.toggle("activo",x===b))})}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{aplicarPermisosUI();enlazarPlantillas()}catch(e){}return r}}


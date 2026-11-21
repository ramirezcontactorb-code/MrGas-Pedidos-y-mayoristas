/* MR Gas · Panel General · 03-sistema */
/* ===================== PINTAR SISTEMA ===================== */
function pintarSistema(){
  normalizar();
  if(NUBE.listo)setTimeout(()=>{const f=fechaMasAntigua();if(f)asegurarHistoria(f)},0);
  if(yo)usarPreset(mod==="sectorizar"&&szPreset?szPreset:presetDelDia());
  if(yo&&!esAdmin()&&misSucs().length&&!misSucs().includes(suc))suc=misSucs()[0];
  if(!puede(mod))mod=yo.rol==="chofer"?"chofer":"menu";
  if(!suc&&mod!=="sucursal")mod="sucursal";
  registrarNav();
  $("#sis-acciones").innerHTML=ACCIONES.filter(a=>puede(a.id)&&!["manual","empresa"].includes(a.id)).map(a=>`<button class="accion ${a.id==="salir"?"salir":""}" data-accion="${a.id}" type="button">${svg(a.id)}<span>${a.t.replace("<br>"," ")}</span></button>`).join("");
  const l=loc(suc);
  $("#sis-sucursal").innerHTML=l?`<small>Sucursal:</small>${esc(l.nombre)}`:`<small>Sucursal:</small>sin elegir`;
  $("#sis-yo").textContent=yo.nombre+" · "+({admin:"Administrador",encargado:"Encargado",chofer:"Chofer"})[yo.rol];
  const banner=yo.cambiar?`<div class="banner">Está usando la clave inicial. Cámbiela en "Cambiar Contraseña".</div>`:"";
  $("#sis-main").innerHTML=banner+(V[mod]||V.menu)()+`<div class="foot-mr"><span>MR Gas · Sistema de distribución</span><span class="dev-por">Desarrollado por MrGas · versión 145 · <a href="terminos/" target="_blank" rel="noopener">Términos y privacidad</a></span><span>${D.locales.length===1?esc(D.locales[0].nombre):D.locales.length+" sucursales"}</span></div>`;
  $$("[data-accion]").forEach(b=>b.onclick=()=>{if(b.dataset.accion==="salir")return salir();ir(b.dataset.accion)});
  $$("[data-modulo]").forEach(b=>b.onclick=()=>ir(b.dataset.modulo));
  const v=$("#volver");if(v)v.onclick=()=>ir(yo.rol==="chofer"?"chofer":"menu");
  const at=$("#atras");if(at)at.onclick=volverAtras;
  (L[mod]||(()=>{}))();
}
function ir(m){if(m!==mod){rutaVista="pend";rutaChofer=null;cuadSel=null;infDia=null;infRep=null;cuadTab="menu"}mod=m;guardarSesion();pintarSistema();window.scrollTo(0,0)}
$("#ir-menu").onclick=()=>{if(suc)ir(yo.rol==="chofer"?"chofer":"menu")};
const cabeza=(t,extra="")=>`<div class="cab-mod"><div>${yo.rol==="chofer"&&mod==="chofer"?"":`<div class="nav-volver"><button class="btn-atras" id="atras" type="button" aria-label="Volver a la pantalla anterior">← Volver</button><button class="volver" id="volver" type="button">Menú principal</button></div>`}<div class="eyebrow-mr">Sucursal ${esc(nomLocal(suc))}</div><h2>${t}</h2><p class="sub">${fechaLarga(hoyStr())}</p></div>${extra}</div>`;
const confirmar=(b,accion)=>{if(b.dataset.ok){accion()}else{b.dataset.ok=1;b.textContent="¿Seguro? Clic otra vez"}};
const pedidosSuc=()=>D.pedidos.filter(p=>p.local===suc);
const chOrden=()=>[...D.choferes.filter(c=>!yo||esAdmin()||misSucs().includes(c.local))].sort((a,b)=>((b.local===suc)-(a.local===suc))||a.nombre.localeCompare(b.nombre));
const BANCOS=["BancoEstado","Banco de Chile","Santander","BCI","Scotiabank","Itaú","BICE","Security","Falabella","Ripley","Consorcio","Internacional","Otro"];
const TIPOS_PAGO={efectivo:"Efectivo",transbank:"Transbank",transferencia:"Transferencia",cheque:"Cheque",vale:"Vales",deposito:"Depósito",credito:"Crédito a cliente",creditodoc:"Crédito documento (empresa)",descuento:"Descuento",gasto:"Gasto",petroleo:"Petróleo"};
const VALES={compania:"De la compañía",otras:"Otras compañías",digital:"Vale digital",digotras:"Digital otras compañías"};
function entregasDe(chId,fecha){
  const ps=D.pedidos.filter(p=>p.chofer===chId&&p.estado==="entregado"&&(p.entregado||"").startsWith(fecha));
  const ventas=st(),env=st();ps.forEach(p=>items(p).forEach(i=>{ventas[i.formato]+=i.cant;env[i.formato]+=i.env||0}));
  return {ventas,env,tarros:Object.values(ventas).reduce((a,b)=>a+b,0),envTot:Object.values(env).reduce((a,b)=>a+b,0),total:ps.reduce((s,p)=>s+totalP(p),0)};
}
const cargadoDe=(ch,fecha)=>{const o=st();(D.cargas||[]).filter(x=>x.chofer===ch&&x.fecha===fecha).forEach(x=>FORMATOS.forEach(f=>o[f.id]+=x.cant[f.id]||0));return o};
function cargaDistDe(mid,fecha){const o=st(),e=st();let dcto=0;(D.cargasDist||[]).filter(x=>x.mayorista===mid&&x.fecha===fecha&&!x.anulada).forEach(x=>{dcto+=+x.dcto||0;FORMATOS.forEach(f=>{o[f.id]+=x.venta[f.id]||0;e[f.id]+=(x.env||{})[f.id]||0})});
  return {ventas:o,env:e,dcto,tarros:Object.values(o).reduce((a,b)=>a+b,0),envTot:Object.values(e).reduce((a,b)=>a+b,0)}}
const prestamoPend=(mid,fid)=>(D.cargasDist||[]).filter(x=>x.mayorista===mid&&!x.anulada).reduce((s,x)=>s+(x.prestamo[fid]||0)-(x.devolucion[fid]||0),0);
const comisionDe=(kind,v)=>FORMATOS.reduce((s,f)=>s+(v[f.id]||0)*((((D.comisiones||{})[kind]||{})[f.id])||0),0);
const puedeEditarFecha=f=>esAdmin()||f>=hoyStr()||tieneExtra("rend.historico")||(((D.historico||{}).usuarios||[]).includes(yo.uid||yo.user)&&f>=((D.historico||{}).desde||"9999"));
function infoMovil(r){if(r.tipo!=="movil")return "";
  const cg=cargadoDe(r.ref,r.fecha),pe=entregasDe(r.ref,r.fecha),fila=(t,o)=>`<tr class="fila-info"><td>${t}</td>${FORMATOS.map(f=>`<td class="der num">${o[f.id]||0}</td>`).join("")}</tr>`;
  return fila("Cargado hoy (inicial + recargas)",cg)+fila("Pedidos telefónicos entregados",pe.ventas)+fila("Pedidos con venta de envase",pe.env)}
function devolverMovil(r){if(r.tipo!=="movil")return "";const cg=cargadoDe(r.ref,r.fecha);
  return `<tr class="fila-info"><td>Llenos que debe devolver</td>${FORMATOS.map(f=>{const d=(cg[f.id]||0)-(r.ventas[f.id]||0);return `<td class="der num ${d<0?"saldo-pos":""}">${d}</td>`}).join("")}</tr>`}
const montoV=v=>v.precio*v.cant+(v.env||0)*(v.precioEnv||0)-(v.dcto||0);
const resumenGrupo=ls=>ls.map(v=>`${v.cant}×${fmt(v.formato).et}${v.env?` (${v.env} con envase)`:""}`).join(", ");
function ventasLocalDe(localId,fecha){
  const vs=D.ventas.filter(v=>v.local===localId&&v.fecha.startsWith(fecha)),ventas={},env={};
  FORMATOS.forEach(f=>{ventas[f.id]=0;env[f.id]=0});
  vs.forEach(v=>{ventas[v.formato]+=v.cant;env[v.formato]+=v.env||0});
  return {ventas,env,tarros:Object.values(ventas).reduce((a,b)=>a+b,0),envTot:Object.values(env).reduce((a,b)=>a+b,0),dcto:vs.reduce((s,v)=>s+(v.dcto||0),0),total:vs.reduce((s,v)=>s+montoV(v),0)};
}
const resumenVentas=v=>FORMATOS.filter(f=>v[f.id]).map(f=>`${v[f.id]}×${f.et}`).join(", ");
function getRend(tipo,ref,fecha,crear){
  D.rendiciones=D.rendiciones||[];
  let r=D.rendiciones.find(x=>x.tipo===tipo&&x.ref===ref&&x.fecha===fecha);
  if(!r&&crear){
    const base=tipo==="mayorista"?preciosCliMay(ref):D.precios,precios={},ventas={};
    FORMATOS.forEach(f=>{precios[f.id]=base[f.id];ventas[f.id]=0});
    const quien=tipo==="movil"?D.choferes.find(c=>c.id===ref):tipo==="local"?loc(ref):(D.mayoristas||[]).find(m=>m.id===ref);
    r={id:nuevoId(D.rendiciones),tipo,ref,nombre:quien?quien.nombre:"",fecha,local:tipo==="local"?ref:suc,guia:"",precios,ventas,cargos:[],pagos:[],obs:"",usuario:yo.nombre,creada:ahora()};
    if(tipo==="movil")Object.assign(ventas,entregasDe(ref,fecha).ventas);
    if(tipo!=="local"){r.envases=st();r.precioEnv={...(D.preciosEnvase||{})};if(tipo==="movil")Object.assign(r.envases,entregasDe(ref,fecha).env);if(tipo==="mayorista")Object.assign(ventas,cargaDistDe(ref,fecha).ventas)}
    if(tipo==="local"){const vl=ventasLocalDe(ref,fecha);Object.assign(ventas,vl.ventas);r.envases={...vl.env};r.precioEnv={...(D.preciosEnvase||{})};
      if(vl.dcto>0)r.pagos.push({id:1,tipo:"descuento",monto:vl.dcto,detalle:"Descuentos dados en Venta Local",hora:ahora()})}
    D.rendiciones.push(r);nubeGuardar("rendiciones",r);guardar();
  }
  return r;
}
function calcRend(r){
  const env=r.envases?FORMATOS.reduce((s,f)=>s+(r.envases[f.id]||0)*((r.precioEnv||{})[f.id]||0),0):0;
  const venta=env+FORMATOS.reduce((s,f)=>s+(r.ventas[f.id]||0)*(r.precios[f.id]||0),0);
  const kilos=FORMATOS.reduce((s,f)=>s+(r.ventas[f.id]||0)*f.kg,0),tarros=FORMATOS.reduce((s,f)=>s+(r.ventas[f.id]||0),0);
  const cargos=r.cargos.reduce((s,c)=>s+c.monto,0)+(r.vuelto||0),pagado=r.pagos.reduce((s,p)=>s+p.monto,0);
  return {venta,env,kilos,tarros,cargos,pagado,saldo:venta+cargos-pagado};
}
const saldoAnterior=(tipo,ref,fecha)=>(D.rendiciones||[]).filter(x=>x.tipo===tipo&&x.ref===ref&&x.fecha<fecha).reduce((s,x)=>s+calcRend(x).saldo,0);
const nomRef=r=>r.nombre||(r.tipo==="movil"?nomChofer(r.ref):"Mayorista");
const sCls=v=>Math.round(v)===0?"saldo-cero":v>0?"saldo-pos":"saldo-neg";

function formPago(t,r){
  const monto=`<label>Monto (CLP)<input data-f="monto" type="number" min="1" class="num"></label>`;
  const banco=`<label>Banco<select data-f="banco">${BANCOS.map(b=>`<option>${b}</option>`).join("")}</select></label>`;
  const fecha=l=>`<label>${l}<input data-f="fecha" type="date" value="${r.fecha}"></label>`;
  const num=l=>`<label>${l}<input data-f="num"></label>`;
  const det=`<label>Detalle<input data-f="det"></label>`;
  const sel=(k,l,obj)=>`<label>${l}<select data-f="${k}">${Object.entries(obj).map(([a,b])=>`<option value="${a}">${b}</option>`).join("")}</select></label>`;
  return {
    efectivo:`${monto}`,
    transbank:`<div class="fila">${sel("tarjeta","Tarjeta",{debito:"Débito",credito:"Crédito"})}${monto}</div><div class="fila">${num("N° voucher")}${fecha("Fecha")}</div>`,
    transferencia:`<div class="fila">${monto}${banco}</div><div class="fila">${num("N° operación")}${fecha("Fecha")}</div>`,
    cheque:`<div class="fila">${monto}${banco}</div><div class="fila">${num("N° cheque")}${fecha("Fecha de cobro")}</div>`,
    vale:`<div class="fila">${sel("vale","Tipo de vale",VALES)}${sel("formato","Cilindro",Object.fromEntries(FORMATOS.map(f=>[f.id,f.et])))}</div>
      <div class="fila"><label>Cantidad<input data-f="cant" type="number" min="1" value="1" class="num"></label><div class="vale-total"><span>Valor</span><b class="num" data-f="vtotal"></b></div></div>`,
    deposito:`<div class="fila">${monto}${banco}</div><div class="fila">${num("N° depósito")}${fecha("Fecha")}</div>`,
    descuento:`<div class="fila">${monto}${sel("motivo","Motivo",{cliente:"Descuento a cliente",falla:"Cilindro con falla",promo:"Promoción",otro:"Otro"})}</div>${det}`,
    gasto:`<div class="fila">${monto}${sel("motivo","Tipo",{peaje:"Peaje",colacion:"Colación",mantencion:"Mantención",estacionamiento:"Estacionamiento",otro:"Otro"})}</div>${det}`,
    credito:`<div class="fila">${monto}<label>Cliente<input data-f="det" placeholder="Nombre o dirección"></label></div><div class="fila">${sel("tdoc","Documento",{boleta:"Boleta",factura:"Factura",guia:"Guía"})}${num("N° documento")}</div><p class="nota" style="margin:0">El cliente quedó debiendo. Cuando pague, cóbrelo en "Cargos" de la cuadratura de ese día.</p>`,
    creditodoc:`<div class="fila">${monto}<label>Empresa<input data-f="det"></label></div><div class="fila">${sel("tdoc","Documento",{factura:"Factura",guia:"Guía de despacho",oc:"Orden de compra"})}${num("N° documento")}</div>`,
    petroleo:`<div class="fila">${monto}<label>Litros<input data-f="litros" type="number" min="0" step="0.1" class="num"></label></div>`
  }[t];
}

function vistaRend(r,fechaSel){
  const c=calcRend(r),ant=saldoAnterior(r.tipo,r.ref,r.fecha),ent=r.tipo==="movil"?entregasDe(r.ref,r.fecha):r.tipo==="local"?ventasLocalDe(r.ref,r.fecha):cargaDistDe(r.ref,r.fecha),ed=puedeEditarFecha(r.fecha);
  const porTipo=Object.keys(TIPOS_PAGO).map(k=>[k,r.pagos.filter(p=>p.tipo===k).reduce((s,p)=>s+p.monto,0)]).filter(x=>x[1]);
  return cabeza(`Cuadratura · ${esc(nomRef(r))}`,`<div class="acc" style="align-items:end">${fechaSel}<button class="btn linea" id="cu-lista" type="button">← Volver a la lista</button></div>`)+`
  <p class="nota" style="margin:-12px 0 20px">${({movil:"Móvil",mayorista:"Mayorista",local:"Local"})[r.tipo]} · ${fechaLarga(r.fecha)} · abierta por ${esc(r.usuario)}${r.guardada?` · guardada a las ${esc(r.guardada.slice(11))}`:""}</p>
  ${ed?"":`<div class="banner">Esta cuadratura es de un día anterior y está bloqueada. Para editarla, el administrador debe darle acceso a históricos.</div>`}<fieldset class="bloqueo" ${ed?"":"disabled"}><div class="rend"><div class="grid" style="gap:20px;min-width:0">
    <section class="caja">
      <div class="barra" style="margin:0"><h3>1. Lo vendido</h3><label class="guia">N° guía física<input id="rd-guia" value="${esc(r.guia)}"></label></div>
      ${ent?`<div class="aviso entregas"><span>${({local:"Ventas grabadas en Venta Local",mayorista:"Cargas grabadas en Venta Recargas",movil:"Pedidos telefónicos entregados"})[r.tipo]}: <b>${ent.tarros?resumenVentas(ent.ventas)+(ent.envTot?" · con envase: "+resumenVentas(ent.env):""):"ninguna"}</b></span>${ent.tarros?'<button class="btn chico linea" id="rd-usar" type="button">Usar estas cantidades</button>':""}</div>`:""}
      <div class="tabla-wrap"><table class="vt"><thead><tr><th></th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}</tr></thead><tbody>
        ${infoMovil(r)}<tr><td>${({mayorista:"Precio distribuidor",movil:"Precio chofer",local:"Precio"})[r.tipo]}</td>${FORMATOS.map(f=>`<td class="der"><input class="num" type="number" min="0" data-rprecio="${f.id}" value="${r.precios[f.id]}" aria-label="Precio ${f.et}" ${r.tipo==="movil"?"disabled title=\"Sale de Configuraciones\"":""}></td>`).join("")}</tr>
        <tr><td>Cantidad vendida</td>${FORMATOS.map(f=>`<td class="der"><input class="num" type="number" min="0" data-rcant="${f.id}" value="${r.ventas[f.id]}" aria-label="Cantidad ${f.et}"></td>`).join("")}</tr>
        ${r.envases?`<tr><td>Precio envase</td>${FORMATOS.map(f=>`<td class="der"><input class="num" type="number" min="0" data-renvp="${f.id}" value="${(r.precioEnv||{})[f.id]||0}" aria-label="Precio envase ${f.et}" ${r.tipo==="movil"?"disabled title=\"Sale de Configuraciones\"":""}></td>`).join("")}</tr>
        <tr><td>Venta con envase</td>${FORMATOS.map(f=>`<td class="der"><input class="num" type="number" min="0" data-renv="${f.id}" value="${r.envases[f.id]||0}" aria-label="Con envase ${f.et}"></td>`).join("")}</tr>`:""}
        <tr><td><b>Total</b></td>${FORMATOS.map(f=>`<td class="der num"><b>${clp(r.ventas[f.id]*r.precios[f.id]+(r.envases?(r.envases[f.id]||0)*((r.precioEnv||{})[f.id]||0):0))}</b></td>`).join("")}</tr>
      ${devolverMovil(r)}</tbody></table></div>
      <div class="tot-strip"><div><span>Total ($)</span><b class="num">${clp(c.venta)}</b></div><div><span>Total kilos</span><b class="num">${c.kilos.toLocaleString("es-CL")} kg</b></div><div><span>Total cilindros</span><b class="num">${c.tarros} un.</b></div></div>
    </section>
    <section>
      <div class="barra" style="margin:8px 0 14px"><h3>2. Pagos y rebajas</h3><span>Total rendido <b class="num" style="font-size:1.15rem;margin-left:6px">${clp(c.pagado)}</b></span></div>
      <div class="pagos-grid">${Object.entries(TIPOS_PAGO).map(([t,v])=>{const ps=r.pagos.filter(p=>p.tipo===t),sub=ps.reduce((a,p)=>a+p.monto,0);
        return `<form class="caja pago-card" data-pform="${t}"><div class="pago-cab"><h4>${v}</h4><b class="num ${sub?"":"cero"}">${clp(sub)}</b></div>
          ${formPago(t,r)}
          <div class="acc"><button class="btn chico" type="submit">Agregar</button><span class="error" data-perr hidden>Ingrese un monto mayor a $0.</span></div>
          ${ps.length?`<ul class="pago-lista">${ps.map(p=>`<li><span>${esc(p.detalle||v)}${porTag(p)}</span><b class="num">${clp(p.monto)}</b><button class="quitar" data-delpago="${p.id}" type="button" aria-label="Quitar ${v} de ${clp(p.monto)}">×</button></li>`).join("")}</ul>`:""}
        </form>`}).join("")}</div>
    </section>
    <div class="grid dos" style="gap:20px">
      <section class="caja"><h3>3. Cargos</h3>
        ${r.tipo!=="mayorista"?`<label style="max-width:320px">Fondo de vuelto entregado (sencillo)<input id="rd-vuelto" type="number" min="0" class="num" value="${r.vuelto||0}"></label>`:""}
        ${(()=>{const k=idDoc("rendiciones",r),pend=(D.rendiciones||[]).filter(x=>x.local===r.local&&x!==r).flatMap(x=>x.pagos.filter(p=>p.tipo==="credito"&&!p.cobrado).map(p=>({x,p})));
          return pend.length?`<div class="cred-pend"><span class="eyebrow">Créditos de clientes por cobrar</span>${pend.map(({x,p})=>`<div class="cred-fila"><span>${esc(p.detalle||"Crédito")}<br><span class="nota" style="margin:0">${fF(x.fecha)} · ${esc(nomRef(x))}</span></span><b class="num">${clp(p.monto)}</b><button type="button" class="btn chico linea" data-cobrar="${idDoc("rendiciones",x)}|${p.id}">Cobrar</button></div>`).join("")}</div>`:""})()}<p class="nota" style="margin:0">Se suman a lo que debe rendir, por ejemplo un faltante anterior.</p>
        <form id="f-cargo" class="grid" style="gap:12px"><div class="fila"><label>Monto (CLP)<input id="cg-monto" type="number" min="1" class="num"></label><label>Detalle<input id="cg-det"></label></div><div><button class="btn chico" type="submit">Agregar cargo</button></div></form>
        ${r.cargos.length?`<div class="tabla-wrap"><table><tbody>${r.cargos.map(x=>`<tr><td>${esc(x.detalle||"Cargo")}${porTag(x)}</td><td class="der num">${clp(x.monto)}</td><td class="der"><button class="btn chico linea" data-delcargo="${x.id}" type="button">Quitar</button></td></tr>`).join("")}</tbody></table></div>`:""}
      </section>
      <section class="caja"><h3>4. Observaciones</h3><textarea id="rd-obs" style="min-height:120px;font-family:var(--f-body);font-size:1rem" placeholder="Ej: el cliente paga la diferencia el lunes">${esc(r.obs)}</textarea></section>
    </div>
  </div>
  <aside class="caja rend-resumen"><h3>Resumen</h3>
    <div class="res-lin"><span>Venta del día</span><b class="num">${clp(c.venta)}</b></div>
    <div class="res-lin"><span>+ Cargos</span><b class="num">${clp(c.cargos)}</b></div>
    ${porTipo.map(([k,v])=>`<div class="res-lin sub"><span>− ${TIPOS_PAGO[k]}</span><span class="num">${clp(v)}</span></div>`).join("")}
    <div class="res-lin"><span>− Total rendido</span><b class="num">${clp(c.pagado)}</b></div>
    <div class="res-saldo ${sCls(c.saldo)}"><span>Saldo del día</span><b class="num">${clp(c.saldo)}</b><small>${Math.round(c.saldo)===0?"Cuadrado":c.saldo>0?"Falta por rendir":"Rindió de más"}</small></div>
    <div class="res-lin"><span>Saldo anterior</span><b class="num ${sCls(ant)}">${clp(ant)}</b></div>
    <div class="res-lin total"><span>Saldo total</span><b class="num ${sCls(ant+c.saldo)}">${clp(ant+c.saldo)}</b></div>
    ${r.tipo==="movil"?`<div class="res-lin"><span>Comisión chofer del día</span><b class="num">${clp(comisionDe("chofer",r.ventas))}</b></div>`:""}<button class="btn" id="rd-guardar" type="button">Guardar cuadratura</button>
    <p class="aviso ok" id="rd-ok" hidden>Cuadratura guardada.</p>
  </aside></div></fieldset>`;
}

function tabsInf(){return `<div class="tabs" role="tablist">${[["resumen","Resumen"],["comparar","Comparar meses"],["catalogo","Informes"],...(esAdmin()&&NUBE.activo?[["vlocal","Informe Venta Local"]]:[]),["diario","Registro diario del mes"]].map(([k,v])=>`<button type="button" role="tab" data-itab="${k}" aria-selected="${infTab===k}">${v}</button>`).join("")}</div>`}
const Gr=(arr,k)=>arr.reduce((m,x)=>{const key=k(x);(m[key]=m[key]||[]).push(x);return m},{});
const itsDe=ps=>ps.flatMap(items);
const uniDe=its=>its.reduce((s,i)=>s+(i.cant||0),0);
const kgDe=its=>its.reduce((s,i)=>s+(i.cant||0)*fmt(i.formato).kg,0);
const porF=its=>FORMATOS.map(f=>its.filter(i=>i.formato===f.id).reduce((s,i)=>s+(i.cant||0),0));
const fF=f=>(f||"").slice(0,10).split("-").reverse().join("-");
const colsF=()=>FORMATOS.map(f=>[f.et,"n"]);
const TIPO_R={movil:"Móvil",mayorista:"Mayorista",local:"Local"};
const pagosDe=(rs,t)=>rs.flatMap(r=>r.pagos.filter(p=>!t||p.tipo===t).map(p=>({...p,r})));
const sumP=(r,t)=>r.pagos.filter(p=>p.tipo===t).reduce((s,p)=>s+p.monto,0);
const ventasRend=r=>FORMATOS.filter(f=>r.ventas[f.id]).map(f=>({formato:f.id,cant:r.ventas[f.id],precio:r.precios[f.id]}));
const montoIt=its=>its.reduce((s,i)=>s+(i.precio||0)*(i.cant||0)+(i.env||0)*(i.precioEnv||0),0);
const filaRend=r=>{const k=calcRend(r),ef=sumP(r,"efectivo"),tb=sumP(r,"transbank"),tr=sumP(r,"transferencia"),chq=sumP(r,"cheque"),va=sumP(r,"vale");
  return [fF(r.fecha),nomRef(r),k.venta,ef,tb,tr,chq,va,k.pagado-ef-tb-tr-chq-va,k.saldo]};
const COLS_REND=[["Fecha","t"],["Nombre","t"],["Vendido","$"],["Efectivo","$"],["Transbank","$"],["Transferencia","$"],["Cheque","$"],["Vales","$"],["Otros","$"],["Saldo","$"]];
/* informes que se muestran (los demás quedan guardados pero ocultos) */
const REP_IMP=["p-detalle","p-movil","p-comuna","p-resumen-mes",
  "r-resumen","r-saldos","r-ventas-dia","r-unidades","r-rend-chofer","r-cuentamay","r-vales","r-transbank-rev","r-cargos-desc","r-prestamos",
  "b-historial"];
const REPORTES=[
 {g:"r",id:"r-cuentamay",t:"Cuenta clientes mayoristas",ic:"tabla",fn:c=>{const M=(D.mayoristas||[]).filter(m=>c.ids.includes(m.local??1)).map(cuentaMay).sort((a,b)=>b.saldo-a.saldo);
   return {cols:[["Cliente","t"],["RUT","t"],["Lista","t"],["Comprado","$"],["Pagado","$"],["Comisión vales","$"],["Saldo","$"],["Última compra","t"]],
     filas:M.map(x=>[x.m.nombre,x.m.rut||"",nomListaMay(x.m),x.comp,x.pag-x.com,x.com,x.saldo,x.ult?fF(x.ult):""]),nota:"Saldo de toda la historia de cada cliente (no depende de las fechas). Saldo positivo = el cliente debe; negativo = tiene saldo a favor."}}},
 {g:"r",id:"r-movmay",t:"Movimientos clientes mayoristas",ic:"tabla",fn:c=>{const en=f=>f>=c.desde&&f<=c.hasta,F=[];
   (D.cargasDist||[]).filter(x=>c.ids.includes(x.local)&&en(x.fecha)).forEach(x=>F.push([fF(x.fecha),String(x.hora||"").slice(0,5),x.anulada?"Venta (anulada)":"Venta",(cliMay(x.mayorista)||{}).nombre||"",cilTxt(x.venta)+(x.guia?" · "+x.guia:""),x.anulada?0:valorDist(x),0,x.user||"",x.fecha+String(x.hora||"")]));
   (D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&c.ids.includes(r.local)&&en(r.fecha)).forEach(r=>r.pagos.filter(p=>!p.auto).forEach(p=>F.push([fF(r.fecha),String(p.hora||"").slice(11,16),(p.abono?"Abono · ":"Pago · ")+(TIPOS_PAGO[p.tipo]||p.tipo),nomRef(r),p.detalle||"",0,p.monto+(+p.com||0),r.usuario||"",r.fecha+String(p.hora||"").slice(11)])));
   F.sort((a,b)=>b[8].localeCompare(a[8]));
   return {cols:[["Fecha","t"],["Hora","t"],["Tipo","t"],["Cliente","t"],["Detalle","t"],["Cargo","$"],["Abono","$"],["Usuario","t"]],filas:F.map(f=>f.slice(0,8))}}},
 {g:"b",id:"b-ventas",t:"Ventas por fecha",ic:"tabla",fn:c=>{const F=[];let tot={},Tkg=0,Tm=0;FORMATOS.forEach(f=>tot[f.id]=0);
   const dias=[];{const d=new Date(c.desde+"T12:00"),fin=new Date(c.hasta+"T12:00");while(d<=fin&&dias.length<400){dias.push(fechaISO(d));d.setDate(d.getDate()+1)}}
   dias.reverse().forEach(d=>{const o={};FORMATOS.forEach(f=>o[f.id]=0);let monto=0;
     D.pedidos.filter(p=>c.ids.includes(p.local)&&p.estado==="entregado"&&(p.entregado||p.fecha).startsWith(d)).forEach(p=>{items(p).forEach(i=>o[i.formato]=(o[i.formato]||0)+i.cant);monto+=totalP(p)});
     D.ventas.filter(v=>c.ids.includes(v.local)&&v.fecha.startsWith(d)).forEach(v=>{o[v.formato]=(o[v.formato]||0)+v.cant;monto+=montoV(v)});
     (D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&c.ids.includes(r.local)&&r.fecha===d).forEach(r=>{FORMATOS.forEach(f=>o[f.id]+=r.ventas[f.id]||0);monto+=calcRend(r).venta});
     const cil=FORMATOS.reduce((s,f)=>s+o[f.id],0),kg=FORMATOS.reduce((s,f)=>s+o[f.id]*f.kg,0);FORMATOS.forEach(f=>tot[f.id]+=o[f.id]);Tkg+=kg;Tm+=monto;
     F.push([fF(d),...FORMATOS.map(f=>o[f.id]),cil,kg,monto])});
   F.push(["Total",...FORMATOS.map(f=>tot[f.id]),FORMATOS.reduce((s,f)=>s+tot[f.id],0),Tkg,Tm]);
   return {cols:[["Fecha","t"],...FORMATOS.map(f=>[f.et,"n"]),["Cilindros","n"],["Kilos","kg"],["Monto","$"]],filas:F,nota:"Incluye entregas de los móviles, ventas en mesón y ventas a mayoristas."}}},
 {g:"b",id:"b-historial",t:"Historial de bodega",ic:"tabla",fn:c=>{const ev=(D.bitacora||[]).filter(b=>c.ids.includes(b.local)&&["bodega","ventas"].includes(b.area)&&b.fecha.slice(0,10)>=c.desde&&b.fecha.slice(0,10)<=c.hasta);
   return {cols:[["Fecha y hora","t"],["Movimiento","t"],["Detalle","t"],["Hecho por","t"]],filas:ev.map(b=>[b.fecha,b.accion,b.detalle,b.user])}}},
 {g:"p",id:"p-detalle",t:"Historial de pedidos",ic:"tabla",fn:c=>({cols:[["N°","t"],["Fecha","t"],["Hora","t"],["Teléfono","t"],["Cliente","t"],["Dirección","t"],["Comuna","t"],["Cilindros","t"],["Total","$"],["Pago","t"],["Fuente","t"],["Sector","t"],["Móvil","t"],["Estado","t"],["Entregado","t"],["Ingresó","t"]],
   filas:c.peds.map(p=>[p.id,fF(p.fecha),p.fecha.slice(11),p.fono,p.nombre,p.dir,p.comuna||"",resumenP(p),totalP(p),MEDIOS[p.medio]||"",FUENTES[p.origen]||"",nomSector(sectorDe(p)),p.chofer?nomChofer(p.chofer):"",ESTADOS[p.estado],(p.entregado||"").slice(11,16),p.usuario||""])})},
 {g:"p",id:"p-simple",t:"Informe pedidos simplificado",ic:"tabla",fn:c=>({cols:[["N°","t"],["Fecha","t"],["Cliente","t"],["Cilindros","t"],["Total","$"],["Estado","t"]],filas:c.peds.map(p=>[p.id,fF(p.fecha)+" "+p.fecha.slice(11),p.nombre,resumenP(p),totalP(p),ESTADOS[p.estado]])})},
 {g:"p",id:"p-movil",t:"Pedidos por móvil",ic:"grafico",fn:c=>({cols:[["Móvil","t"],["Pedidos","n"],["Entregados","n"],["Cilindros","n"],["Kilos","kg"],["Monto entregado","$"]],
   filas:Object.entries(Gr(c.peds.filter(p=>p.chofer!=null),p=>p.chofer)).map(([id,ps])=>{const e=ps.filter(p=>p.estado==="entregado"),it=itsDe(e);return [nomChofer(+id),ps.length,e.length,uniDe(it),kgDe(it),e.reduce((s,p)=>s+totalP(p),0)]}).sort((a,b)=>b[1]-a[1])})},
 {g:"p",id:"p-sector",t:"Pedidos por sector",ic:"grafico",fn:c=>({cols:[["Sector","t"],["Pedidos","n"],["Entregados","n"],["Cilindros","n"],["Monto","$"]],
   filas:Object.entries(Gr(c.peds,p=>nomSector(sectorDe(p)))).map(([k,ps])=>{const e=ps.filter(p=>p.estado==="entregado");return [k,ps.length,e.length,uniDe(itsDe(e)),e.reduce((s,p)=>s+totalP(p),0)]}).sort((a,b)=>b[1]-a[1])})},
 {g:"p",id:"p-mensual",t:"Detalle mensual de pedidos",ic:"tabla",fn:c=>({cols:[["Día","t"],["Pedidos","n"],["Entregados","n"],["Anulados","n"],["Cilindros","n"],["Kilos","kg"],["Monto","$"]],
   filas:c.dias.map(d=>{const ps=c.peds.filter(p=>p.fecha.startsWith(d)),e=c.ent.filter(p=>(p.entregado||p.fecha).startsWith(d)),it=itsDe(e);return [fF(d),ps.length,e.length,ps.filter(p=>p.estado==="anulado").length,uniDe(it),kgDe(it),e.reduce((s,p)=>s+totalP(p),0)]})})},
 {g:"p",id:"p-resumen-mes",t:"Cuadro resumen mensual",ic:"tabla",fn:c=>({cols:[["Mes","t"],...colsF(),["Cilindros","n"],["Kilos","kg"],["Monto","$"]],
   filas:Object.entries(Gr(c.ent,p=>(p.entregado||p.fecha).slice(0,7))).sort().map(([m,ps])=>{const it=itsDe(ps);return [m.split("-").reverse().join("-"),...porF(it),uniDe(it),kgDe(it),ps.reduce((s,p)=>s+totalP(p),0)]}),nota:"Pedidos entregados, agrupados por mes."})},
 {g:"p",id:"p-canal",t:"Informe diario por canal",ic:"tabla",fn:c=>({cols:[["Día","t"],...Object.values(FUENTES).map(v=>[v,"n"]),["Total","n"]],
   filas:c.dias.map(d=>{const ps=c.peds.filter(p=>p.fecha.startsWith(d));return [fF(d),...Object.keys(FUENTES).map(k=>ps.filter(p=>p.origen===k).length),ps.length]}),nota:"Cantidad de pedidos por fuente: fono, WhatsApp, apps, sitio web."})},
 {g:"p",id:"p-usuarios",t:"Pedidos por usuarios",ic:"grafico",fn:c=>({cols:[["Usuario","t"],["Pedidos","n"],["Anulados","n"],["Monto","$"]],
   filas:Object.entries(Gr(c.peds,p=>p.usuario||(p.origen==="web"?"Sitio web":"Sin registro"))).map(([k,ps])=>[k,ps.length,ps.filter(p=>p.estado==="anulado").length,ps.reduce((s,p)=>s+totalP(p),0)]).sort((a,b)=>b[1]-a[1])})},
 {g:"p",id:"p-periodicidad",t:"Informe periodicidad",ic:"tabla",fn:c=>({cols:[["Cliente","t"],["Teléfono","t"],["Pedidos","n"],["Primer pedido","t"],["Último pedido","t"],["Pide cada (días)","n"],["Próximo estimado","t"]],sinTotal:true,
   nota:"Cada cuántos días pide cada cliente, según todo su historial. Sirve para llamar antes de que se le acabe el gas.",
   filas:Object.keys(Gr(c.peds.filter(p=>p.fono&&!/sin/i.test(p.fono)),p=>p.fono.replace(/\D/g,""))).map(t=>{const h=D.pedidos.filter(p=>(p.fono||"").replace(/\D/g,"")===t&&p.estado!=="anulado").sort((a,b)=>a.fecha.localeCompare(b.fecha));
     const ds=h.map(p=>new Date(p.fecha.slice(0,10)+"T12:00").getTime()),gaps=ds.slice(1).map((x,i)=>(x-ds[i])/864e5).filter(x=>x>0),prom=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):0;
     const ult=h[h.length-1];return [ult.nombre,ult.fono,h.length,fF(h[0].fecha),fF(ult.fecha),prom,prom?fF(fechaISO(new Date(ds[ds.length-1]+prom*864e5))):"—"]}).sort((a,b)=>b[2]-a[2])})},
 {g:"p",id:"p-lista",t:"Pedidos por lista de precios",ic:"grafico",fn:c=>({cols:[["Lista","t"],["Pedidos","n"],["Cilindros","n"],["Monto","$"]],
   filas:Object.entries(Gr(c.peds,p=>nomLista(p.lista||"base"))).map(([k,ps])=>[k,ps.length,uniDe(itsDe(ps)),ps.reduce((s,p)=>s+totalP(p),0)])})},
 {g:"p",id:"p-kilos-chofer",t:"Pedidos/kilos entregados por chofer",ic:"tabla",fn:c=>({cols:[["Chofer","t"],["Pedidos","n"],...colsF(),["Cilindros","n"],["Kilos","kg"]],
   filas:Object.entries(Gr(c.ent.filter(p=>p.chofer!=null),p=>p.chofer)).map(([id,ps])=>{const it=itsDe(ps);return [nomChofer(+id),ps.length,...porF(it),uniDe(it),kgDe(it)]})})},
 {g:"p",id:"p-comuna",t:"Pedidos por comuna",ic:"grafico",fn:c=>({cols:[["Comuna","t"],["Pedidos","n"],["Cilindros","n"],["Monto","$"]],
   filas:Object.entries(Gr(c.peds,p=>p.comuna||"Sin comuna")).map(([k,ps])=>[k,ps.length,uniDe(itsDe(ps)),ps.reduce((s,p)=>s+totalP(p),0)]).sort((a,b)=>b[1]-a[1])})},
 {g:"r",id:"r-resumen",t:"Resumen rendiciones",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["Tipo","t"],["Nombre","t"],["Vendido","$"],["Cargos","$"],["Rendido","$"],["Saldo","$"]],
   filas:c.rends.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(r=>{const k=calcRend(r);return [fF(r.fecha),TIPO_R[r.tipo],nomRef(r),k.venta,k.cargos,k.pagado,k.saldo]})})},
 {g:"r",id:"r-efectivo",t:"Detalle efectivo",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["Origen","t"],["Nombre","t"],["Efectivo","$"]],
   filas:[...c.rends.filter(r=>sumP(r,"efectivo")).map(r=>[fF(r.fecha),"Rendición "+TIPO_R[r.tipo].toLowerCase(),nomRef(r),sumP(r,"efectivo")]),
     ...Object.entries(Gr(c.ven.filter(v=>v.medio==="efectivo"),v=>v.fecha.slice(0,10)+"|"+v.local)).map(([k,vs])=>[fF(k),"Venta en mesón",nomLocal(+k.split("|")[1]),vs.reduce((s,v)=>s+montoV(v),0)])].sort((a,b)=>a[0].split("-").reverse().join().localeCompare(b[0].split("-").reverse().join()))})},
 {g:"r",id:"r-saldos",t:"Saldos rendiciones diarias",ic:"tabla",fn:c=>({cols:[["Día","t"],["Rendiciones","n"],["Vendido","$"],["Rendido","$"],["Saldo","$"]],
   filas:c.dias.map(d=>{const k=c.rends.filter(r=>r.fecha===d).map(calcRend);return [fF(d),k.length,k.reduce((s,x)=>s+x.venta,0),k.reduce((s,x)=>s+x.pagado,0),k.reduce((s,x)=>s+x.saldo,0)]})})},
 {g:"r",id:"r-cargos",t:"Anticipos y cargos diarios",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["Nombre","t"],["Detalle","t"],["Monto","$"]],filas:c.rends.flatMap(r=>r.cargos.map(x=>[fF(r.fecha),nomRef(r),x.detalle||"Cargo",x.monto]))})},
 {g:"r",id:"r-ventas-dia",t:"Ventas por día",ic:"grafico",fn:c=>({cols:[["Día","t"],["Despacho","$"],["Mesón","$"],["Mayoristas","$"],["Total","$"]],
   filas:c.dias.map(d=>{const a=c.ent.filter(p=>(p.entregado||p.fecha).startsWith(d)).reduce((s,p)=>s+totalP(p),0),b=c.ven.filter(v=>v.fecha.startsWith(d)).reduce((s,v)=>s+montoV(v),0),m=c.rends.filter(r=>r.tipo==="mayorista"&&r.fecha===d).reduce((s,r)=>s+calcRend(r).venta,0);return [fF(d),a,b,m,a+b+m]})})},
 {g:"r",id:"r-unidades",t:"Total unidades y kilos vendidos",ic:"tabla",fn:c=>{const it=[...itsDe(c.ent),...c.ven.map(v=>({formato:v.formato,cant:v.cant,precio:v.precio,env:v.env,precioEnv:v.precioEnv})),...c.rends.filter(r=>r.tipo==="mayorista").flatMap(ventasRend)];
   return {cols:[["Cilindro","t"],["Unidades","n"],["Kilos","kg"],["Monto","$"]],filas:FORMATOS.map(f=>{const x=it.filter(i=>i.formato===f.id);return [f.nom||f.et,uniDe(x),kgDe(x),montoIt(x)]}),nota:"Incluye despachos, ventas en mesón y mayoristas."}}},
 {g:"r",id:"r-transbank-rev",t:"Revisión vouchers Transbank",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["Nombre","t"],["Tarjeta","t"],["N° voucher","t"],["Monto","$"]],
   filas:pagosDe(c.rends,"transbank").map(p=>[fF(p.r.fecha),nomRef(p.r),(p.campos&&p.campos.tarjeta==="credito")||/^Crédito/.test(p.detalle||"")?"Crédito":"Débito",(p.campos&&p.campos.num)||"",p.monto])})},
 {g:"r",id:"r-vales",t:"Total vales recibidos",ic:"tabla",fn:c=>({cols:[["Tipo de vale","t"],["Cilindro","t"],["Cantidad","n"],["Monto","$"]],
   filas:Object.entries(Gr(pagosDe(c.rends,"vale"),p=>((p.campos&&p.campos.valeTxt)||(p.detalle||"").split(" · ").pop()||"Vale")+"|"+((p.campos&&p.campos.formato&&fmt(p.campos.formato))?fmt(p.campos.formato).et:"—"))).map(([k,ps])=>[...k.split("|"),ps.reduce((s,p)=>s+((p.campos&&p.campos.cant)||0),0),ps.reduce((s,p)=>s+p.monto,0)])})},
 {g:"r",id:"r-transbank-dia",t:"Totales por día Transbank",ic:"tabla",fn:c=>({cols:[["Día","t"],["Débito","$"],["Crédito","$"],["Total","$"]],
   filas:c.dias.map(d=>{const ps=pagosDe(c.rends.filter(r=>r.fecha===d),"transbank"),cr=ps.filter(p=>(p.campos&&p.campos.tarjeta==="credito")||/^Crédito/.test(p.detalle||"")).reduce((s,p)=>s+p.monto,0),t=ps.reduce((s,p)=>s+p.monto,0);return [fF(d),t-cr,cr,t]})})},
 {g:"r",id:"r-cargos-desc",t:"Informe de cargos y descuentos",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["Nombre","t"],["Tipo","t"],["Detalle","t"],["Monto","$"]],sinTotal:true,
   filas:[...c.rends.flatMap(r=>r.cargos.map(x=>[fF(r.fecha),nomRef(r),"Cargo",x.detalle||"",x.monto])),...pagosDe(c.rends,"descuento").map(p=>[fF(p.r.fecha),nomRef(p.r),"Descuento",p.detalle||"",p.monto]),
     ...c.peds.filter(p=>p.dcto).map(p=>[fF(p.fecha),p.nombre,"Descuento en pedido","Pedido N° "+p.id,p.dcto]),...c.ven.filter(v=>v.dcto).map(v=>[fF(v.fecha),nomLocal(v.local),"Descuento venta local",resumenGrupo([v]),v.dcto])]})},
 {g:"r",id:"r-consolidado-desc",t:"Consolidado descuentos",ic:"tabla",fn:c=>{const xs=[...pagosDe(c.rends,"descuento").map(p=>({k:(p.campos&&p.campos.motivo)||(p.detalle||"Descuento").split(" · ")[0],m:p.monto})),...c.peds.filter(p=>p.dcto).map(p=>({k:"Descuento en pedido",m:p.dcto})),...c.ven.filter(v=>v.dcto).map(v=>({k:"Descuento venta local",m:v.dcto}))];
   return {cols:[["Motivo","t"],["Cantidad","n"],["Monto","$"]],filas:Object.entries(Gr(xs,x=>x.k)).map(([k,v])=>[k,v.length,v.reduce((s,x)=>s+x.m,0)])}}},
 {g:"r",id:"r-unid-distrib",t:"Detalle unidades/kilos vendidos distribuidor",ic:"tabla",fn:c=>({cols:[["Distribuidor","t"],...colsF(),["Cilindros","n"],["Kilos","kg"],["Vendido","$"]],
   filas:Object.entries(Gr(c.rends.filter(r=>r.tipo==="mayorista"),r=>r.ref)).map(([id,rs])=>{const it=rs.flatMap(ventasRend);return [nomRef(rs[0]),...porF(it),uniDe(it),kgDe(it),rs.reduce((s,r)=>s+calcRend(r).venta,0)]})})},
 {g:"r",id:"r-prestamos",t:"Total préstamos envase",ic:"tabla",fn:c=>({cols:[["Sucursal","t"],...colsF(),["Total","n"]],nota:"Envases prestados hoy a clientes (no depende de las fechas).",
   filas:c.ids.map(id=>{const l=ensureLoc(loc(id)),v=FORMATOS.map(f=>l.prestados[f.id]||0);return [l.nombre,...v,v.reduce((a,b)=>a+b,0)]})})},
 {g:"r",id:"r-credito",t:"Detalle crédito empresa",ic:"tabla",fn:c=>({cols:[["Fecha","t"],["N°","t"],["Cliente","t"],["Razón social","t"],["RUT","t"],["Estado","t"],["Monto","$"]],
   filas:c.peds.filter(p=>p.medio==="cuenta").map(p=>[fF(p.fecha),p.id,p.nombre,(p.factura&&p.factura.razon)||"",(p.factura&&p.factura.rut)||"",ESTADOS[p.estado],totalP(p)])})},
 {g:"r",id:"r-ventas-lista",t:"Ventas por lista de precios",ic:"grafico",fn:c=>({cols:[["Lista","t"],["Cilindros","n"],["Monto","$"]],
   filas:[...Object.entries(Gr(c.ent,p=>nomLista(p.lista||"base"))).map(([k,ps])=>[k,uniDe(itsDe(ps)),ps.reduce((s,p)=>s+totalP(p),0)]),["Venta local (mesón)",uniDe(c.ven),c.ven.reduce((s,v)=>s+montoV(v),0)],
     ["Precio mayorista",uniDe(c.rends.filter(r=>r.tipo==="mayorista").flatMap(ventasRend)),c.rends.filter(r=>r.tipo==="mayorista").reduce((s,r)=>s+calcRend(r).venta,0)]]})},
 {g:"r",id:"r-unid-chofer",t:"Detalle unidades/kilos vendidos chofer",ic:"tabla",fn:c=>({cols:[["Chofer","t"],...colsF(),["Cilindros","n"],["Kilos","kg"],["Vendido","$"]],
   filas:Object.entries(Gr(c.rends.filter(r=>r.tipo==="movil"),r=>r.ref)).map(([id,rs])=>{const it=rs.flatMap(ventasRend);return [nomRef(rs[0]),...porF(it),uniDe(it),kgDe(it),rs.reduce((s,r)=>s+calcRend(r).venta,0)]}),nota:"Según lo rendido en Cuadratura Móvil."})},
 {g:"r",id:"r-envase",t:"Total venta envase",ic:"tabla",fn:c=>({cols:[["Cilindro","t"],["Envases vendidos","n"],["Monto","$"]],
   filas:FORMATOS.map(f=>{const a=itsDe(c.ent).filter(i=>i.formato===f.id&&i.env),b=c.ven.filter(v=>v.formato===f.id&&v.env);return [f.nom||f.et,a.reduce((s,i)=>s+i.env,0)+b.reduce((s,v)=>s+v.env,0),a.reduce((s,i)=>s+i.env*(i.precioEnv||0),0)+b.reduce((s,v)=>s+v.env*(v.precioEnv||0),0)]})})},
 {g:"r",id:"r-rend-distrib",t:"Detalle rendiciones distribuidor",ic:"tabla",fn:c=>({cols:COLS_REND,filas:c.rends.filter(r=>r.tipo==="mayorista").map(filaRend)})},
 {g:"r",id:"r-rend-chofer",t:"Detalle rendiciones chofer",ic:"tabla",fn:c=>({cols:COLS_REND,filas:c.rends.filter(r=>r.tipo==="movil").map(filaRend)})},
 {g:"r",id:"r-saldo-distrib",t:"Saldo distribuidores",ic:"tabla",fn:c=>({cols:[["Distribuidor","t"],["Rendiciones","n"],["Vendido","$"],["Rendido","$"],["Saldo acumulado","$"],["Última rendición","t"]],nota:"Saldo de toda la historia (no depende de las fechas).",
   filas:(D.mayoristas||[]).filter(m=>c.ids.includes(m.local??1)).map(m=>{const rs=(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.ref===m.id),k=rs.map(calcRend);return [m.nombre,rs.length,k.reduce((s,x)=>s+x.venta,0),k.reduce((s,x)=>s+x.pagado,0),k.reduce((s,x)=>s+x.saldo,0),rs.length?fF(rs.map(r=>r.fecha).sort().pop()):"—"]})})},
 {g:"r",id:"r-petroleo",t:"Petróleo por móvil",ic:"grafico",fn:c=>{const xs=[...c.pet.map(x=>({ch:x.chofer,l:x.litros,m:x.monto})),...pagosDe(c.rends.filter(r=>r.tipo==="movil"),"petroleo").map(p=>({ch:p.r.ref,l:(p.campos&&p.campos.litros)||0,m:p.monto}))];
   return {cols:[["Móvil","t"],["Cargas","n"],["Litros","n"],["Monto","$"],["Precio por litro","t"]],filas:Object.entries(Gr(xs,x=>x.ch)).map(([id,v])=>{const l=v.reduce((s,x)=>s+x.l,0),m=v.reduce((s,x)=>s+x.m,0);return [nomChofer(+id),v.length,Math.round(l*10)/10,m,l?clp(m/l):"—"]}),nota:"Incluye el cuadro Petróleo y lo rendido como petróleo en las cuadraturas."}}}
];
function ctxRep(){const ids=alcanceInf==="todas"?misSucs():[suc],c={desde:repDesde,hasta:repHasta,ids};
  const dentro=f=>!!f&&f.slice(0,10)>=c.desde&&f.slice(0,10)<=c.hasta;
  c.peds=D.pedidos.filter(p=>ids.includes(p.local)&&dentro(p.fecha));
  c.ent=D.pedidos.filter(p=>ids.includes(p.local)&&p.estado==="entregado"&&dentro(p.entregado||p.fecha));
  c.ven=D.ventas.filter(v=>ids.includes(v.local)&&dentro(v.fecha));
  c.rends=(D.rendiciones||[]).filter(r=>ids.includes(r.local)&&dentro(r.fecha));
  c.pet=(D.petroleo||[]).filter(x=>ids.includes(x.local)&&dentro(x.fecha));
  c.dias=[];{const d=new Date(c.desde+"T12:00"),f=new Date(c.hasta+"T12:00");while(d<=f&&c.dias.length<400){c.dias.push(fechaISO(d));d.setDate(d.getDate()+1)}}
  return c}
{const i=REPORTES.findIndex(r=>r.id==="r-petroleo");if(i>=0)REPORTES.splice(i,1)}
function catalogo(){
  const sec=(g,t)=>`<section class="rep-sec"><h3>${t}</h3><div class="rep-grid">${REPORTES.filter(r=>r.g===g&&REP_IMP.includes(r.id)).sort((x,y)=>REP_IMP.indexOf(x.id)-REP_IMP.indexOf(y.id)).map(r=>`<button type="button" class="rep" data-rep="${r.id}"><span class="ico">${svg(r.ic)}</span><b>${r.t}</b></button>`).join("")}</div></section>`;
  return cabeza("Informes")+tabsInf()+sec("p","Pedidos telefónicos")+sec("r","Rendiciones y ventas")+sec("b","Bodega");
}
const FMT_COL={t:v=>esc(v??""),n:v=>(+v||0).toLocaleString("es-CL"),$:v=>clp(+v||0),kg:v=>(+v||0).toLocaleString("es-CL")+" kg"};
function verReporte(){
  const R=REPORTES.find(r=>r.id===infRep);if(!R){infRep=null;return catalogo()}
  const c=ctxRep(),o=R.fn(c);
  const tot=o.cols.map(col=>col[1]!=="t"&&!o.sinTotal?0:null);
  if(!o.sinTotal)o.filas.forEach(f=>f.forEach((v,i)=>{if(tot[i]!=null)tot[i]+=+v||0}));
  const filtros=`<div class="acc" style="align-items:end"><label>Desde<input type="date" id="rep-desde" value="${c.desde}"></label><label>Hasta<input type="date" id="rep-hasta" value="${c.hasta}"></label>${misSucs().length>1?`<label>Alcance<select id="rep-alc"><option value="suc">Esta sucursal</option><option value="todas">Todas las sucursales</option></select></label>`:""}</div>`;
  return cabeza(R.t,filtros)+`<div class="barra" style="margin:-8px 0 14px"><button class="volver" id="rep-volver" type="button">← Todos los informes</button>
    <div class="acc"><span class="nota" style="margin:0">${o.filas.length} filas · ${esc(c.ids.map(nomLocal).join(", "))}</span>${window.top===window?'<button class="btn chico linea" id="rep-csv" type="button">Descargar Excel (CSV)</button>':""}</div></div>
    ${o.nota?`<p class="nota" style="margin:0 0 12px">${o.nota}</p>`:""}
    <div class="tabla-wrap"><table><thead><tr>${o.cols.map(([t,ty])=>`<th class="${ty!=="t"?"der":""}">${esc(t)}</th>`).join("")}</tr></thead><tbody>
    ${o.filas.length?o.filas.map(f=>`<tr>${f.map((v,i)=>`<td class="${o.cols[i][1]!=="t"?"der num":""}">${FMT_COL[o.cols[i][1]](v)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${o.cols.length}">No hay datos en estas fechas.</td></tr>`}
    </tbody>${o.filas.length&&tot.some(x=>x!=null)?`<tfoot><tr>${tot.map((v,i)=>`<td class="${o.cols[i][1]!=="t"?"der num":""}">${i===0?"Total":v==null?"":FMT_COL[o.cols[i][1]](v)}</td>`).join("")}</tr></tfoot>`:""}</table></div>`;
}
function descargarCSV(){
  const R=REPORTES.find(r=>r.id===infRep);if(!R)return;const o=R.fn(ctxRep()),q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const txt="﻿"+[o.cols.map(c=>q(c[0])).join(";"),...o.filas.map(f=>f.map(q).join(";"))].join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/csv;charset=utf-8"}));a.download=`${R.id}_${repDesde}_${repHasta}.csv`;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function datosDia(d,ids){
  const ped=D.pedidos.filter(p=>ids.includes(p.local)&&p.fecha.startsWith(d));
  const ent=D.pedidos.filter(p=>ids.includes(p.local)&&p.estado==="entregado"&&(p.entregado||p.fecha).startsWith(d));
  const ven=D.ventas.filter(v=>ids.includes(v.local)&&v.fecha.startsWith(d));
  const gas=D.gastos.filter(g=>ids.includes(g.local)&&g.fecha.startsWith(d));
  const mov=D.movimientos.filter(m=>ids.includes(m.local)&&m.fecha.startsWith(d));
  const ren=(D.rendiciones||[]).filter(r=>ids.includes(r.local)&&r.fecha===d),rc=ren.map(calcRend);
  const its=[...ent.flatMap(items),...ven];
  return {ped,ent,ven,gas,mov,ren,anul:ped.filter(p=>p.estado==="anulado").length,
    cil:its.reduce((s,i)=>s+i.cant,0),kg:its.reduce((s,i)=>s+i.cant*fmt(i.formato).kg,0),
    vDesp:ent.reduce((s,p)=>s+totalP(p),0),vMes:ven.reduce((s,v)=>s+montoV(v),0),gastos:gas.reduce((s,g)=>s+g.monto,0),
    rendido:rc.reduce((s,c)=>s+c.pagado,0),saldo:rc.reduce((s,c)=>s+c.saldo,0),
    act:(D.bitacora||[]).filter(b=>ids.includes(b.local)&&b.fecha.startsWith(d)),
    precios:(D.historialPrecios||[]).filter(h=>h.desde===d||(h.cuando||"").startsWith(d))};
}
function registroDiario(){
  const ids=alcanceInf==="todas"?misSucs():[suc];
  const filtros=`<div class="acc"><label>Mes<input type="month" id="inf-mes" value="${infMes}"></label>${misSucs().length>1?`<label>Alcance<select id="inf-alc"><option value="suc">Esta sucursal</option><option value="todas">Todas las sucursales</option></select></label>`:""}</div>`;
  if(infDia)return cabeza("Informes",filtros)+tabsInf()+detalleDia(infDia,ids);
  const [y,m]=infMes.split("-").map(Number),ult=new Date(y,m,0).getDate(),hoy=hoyStr();
  const filas=[];for(let i=1;i<=ult;i++){const d=`${y}-${dos(m)}-${dos(i)}`;filas.push({d,fut:d>hoy,x:d>hoy?null:datosDia(d,ids)})}
  const T={ped:0,ent:0,anul:0,cil:0,kg:0,vDesp:0,vMes:0,gastos:0,rendido:0,saldo:0};
  filas.filter(f=>f.x).forEach(({x})=>{T.ped+=x.ped.length;T.ent+=x.ent.length;for(const k of ["anul","cil","kg","vDesp","vMes","gastos","rendido","saldo"])T[k]+=x[k]});
  const nombreMes=new Date(y,m-1,15).toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  const offset=(new Date(y,m-1,1).getDay()+6)%7;
  const cal=`<div class="cal">${["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(n=>`<div class="cal-cab">${n}</div>`).join("")}${'<div class="cal-vacio"></div>'.repeat(offset)}
    ${filas.map(({d,fut,x})=>{const n=+d.slice(8),v=x?x.vDesp+x.vMes:0;
      return fut?`<div class="cal-dia futuro"><span class="cal-n">${n}</span></div>`
      :`<button type="button" class="cal-dia ${d===hoy?"hoy":""} ${v?"":"sin"}" data-dia="${d}" aria-label="Ver ${fechaLarga(d)}"><span class="cal-n">${n}</span>${v?`<b class="num">${clp(v)}</b><span class="num">${x.cil} cil. · ${x.kg.toLocaleString("es-CL")} kg</span>`:'<span>Sin ventas</span>'}${Math.round(x.saldo)?`<span class="num ${sCls(x.saldo)}">Saldo ${clp(x.saldo)}</span>`:""}</button>`}).join("")}</div>`;
  const celdas=o=>`<td class="der num">${o.ped}</td><td class="der num">${o.ent}</td><td class="der num">${o.anul}</td><td class="der num">${o.cil}</td><td class="der num">${o.kg.toLocaleString("es-CL")}</td><td class="der num">${clp(o.vDesp)}</td><td class="der num">${clp(o.vMes)}</td><td class="der num">${clp(o.gastos)}</td><td class="der num">${clp(o.rendido)}</td>`;
  return cabeza("Informes",filtros)+tabsInf()+`<div class="kpis">
    <div class="kpi"><span>Venta del mes</span><b class="num">${clp(T.vDesp+T.vMes)}</b></div><div class="kpi"><span>Cilindros</span><b class="num">${T.cil}</b></div>
    <div class="kpi"><span>Kilos</span><b class="num">${T.kg.toLocaleString("es-CL")} kg</b></div><div class="kpi"><span>Pedidos</span><b class="num">${T.ped}</b></div></div>
  <h3 class="mes-tit">${nombreMes}</h3>${cal}
  <p class="nota" style="margin:12px 0 28px">Haga clic en un día para ver todo lo que pasó: cada pedido, venta, gasto, cuadratura y movimiento.</p>
  <h3 style="margin-bottom:12px">Día por día</h3>
  <div class="tabla-wrap"><table><thead><tr><th>Día</th><th class="der">Pedidos</th><th class="der">Entregados</th><th class="der">Anulados</th><th class="der">Cilindros</th><th class="der">Kilos</th><th class="der">Venta despacho</th><th class="der">Venta mesón</th><th class="der">Gastos caja</th><th class="der">Rendido</th><th class="der">Saldo cuadratura</th><th></th></tr></thead><tbody>
  ${filas.map(({d,fut,x})=>{const nom=new Date(d+"T12:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric"});
    return fut?`<tr class="futuro"><td>${nom}</td>${'<td class="der">—</td>'.repeat(10)}<td></td></tr>`
    :`<tr class="clic ${d===hoy?"hoy":""}" data-dia="${d}"><td><b>${nom}</b></td>${celdas({...x,ped:x.ped.length,ent:x.ent.length})}<td class="der num"><span class="${sCls(x.saldo)}">${clp(x.saldo)}</span></td><td><button class="btn chico linea" type="button">Ver día</button></td></tr>`}).join("")}
  </tbody><tfoot><tr><td>Total del mes</td>${celdas(T)}<td class="der num">${clp(T.saldo)}</td><td></td></tr></tfoot></table></div>`;
}
function detalleDia(d,ids){
  const x=datosDia(d,ids);
  const tabla=(titulo,cab,filas,vacio)=>`<div class="bloque"><h3>${titulo} <span class="num" style="color:var(--muted);font-weight:500">(${filas.length})</span></h3><div class="tabla-wrap"><table><thead><tr>${cab.map(c=>`<th${c.startsWith(">")?' class="der"':""}>${c.replace(/^>/,"")}</th>`).join("")}</tr></thead><tbody>${filas.length?filas.join(""):`<tr><td colspan="${cab.length}">${vacio}</td></tr>`}</tbody></table></div></div>`;
  const TM={compra:"Compra a proveedor",devprov:"Devolución a proveedor",devcli:"Devolución de cliente"};
  return `<div class="barra"><div><button class="volver" id="inf-volver-mes" type="button">← Volver al mes</button><h2 style="margin-top:6px">${fechaLarga(d)}</h2></div></div>
  <div class="kpis"><div class="kpi"><span>Venta total</span><b class="num">${clp(x.vDesp+x.vMes)}</b></div><div class="kpi"><span>Cilindros vendidos</span><b class="num">${x.cil}</b></div><div class="kpi"><span>Pedidos</span><b class="num">${x.ped.length}</b></div><div class="kpi"><span>Saldo cuadratura</span><b class="num">${clp(x.saldo)}</b></div></div>
  ${tabla("Pedidos",["N°","Hora","Cliente","Dirección","Cilindros",">Total","Pago","Móvil","Estado"],x.ped.map(p=>`<tr><td class="num">${p.id}</td><td class="num">${esc(p.fecha.slice(11))}</td><td>${p.nombre?esc(p.nombre)+"<br>":""}<span class="num" ${p.nombre?'style="color:var(--muted)"':""}>${esc(p.fono)}</span></td><td>${esc(p.dir)}</td><td class="num">${resumenP(p)}</td><td class="der num">${clp(totalP(p))}</td><td>${MEDIOS[p.medio]||""}</td><td>${esc(nomChofer(p.chofer))}</td><td><span class="pill ${p.estado}">${ESTADOS[p.estado]}</span>${p.estado==="anulado"&&p.motivoAnula?`<br><span style="color:var(--muted);font-size:.82rem">${esc(p.motivoAnula)}${p.anuladoPor?" · "+esc(p.anuladoPor):""}</span>`:""}${p.estado==="entregado"&&p.entregado?`<br><span class="num" style="color:var(--muted);font-size:.82rem">${esc(p.entregado.slice(11))}</span>`:""}</td></tr>`),"No hubo pedidos este día.")}
  ${tabla("Cuadraturas",["Nombre","Tipo",">Vendido",">Rendido",">Saldo","Hecha por"],x.ren.map(r=>{const c=calcRend(r);return `<tr><td>${esc(nomRef(r))}</td><td>${({movil:"Móvil",mayorista:"Mayorista",local:"Local"})[r.tipo]}</td><td class="der num">${clp(c.venta)}</td><td class="der num">${clp(c.pagado)}</td><td class="der num"><span class="${sCls(c.saldo)}">${clp(c.saldo)}</span></td><td>${esc(r.usuario)}</td></tr>`}),"No hubo cuadraturas este día.")}
  ${tabla("Ventas en mesón",["Hora","Cilindros","Pago",">Monto"],x.ven.map(v=>`<tr><td class="num">${esc(v.fecha.slice(11))}</td><td>${v.cant} × ${fmt(v.formato).et}</td><td>${MEDIOS[v.medio]||""}</td><td class="der num">${clp(montoV(v))}</td></tr>`),"No hubo ventas en mesón.")}
  ${tabla("Gastos de caja chica",["Hora","Detalle",">Monto"],x.gas.map(g=>`<tr><td class="num">${esc(g.fecha.slice(11))}</td><td>${esc(g.det)}</td><td class="der num">${clp(g.monto)}</td></tr>`),"No hubo gastos.")}
  ${tabla("Compras y devoluciones",["Hora","Documento","Cilindros",">Total","Detalle"],x.mov.map(m=>`<tr><td class="num">${esc(m.fecha.slice(11))}</td><td>${esc((TIPOS_DOC[m.tipo]||{}).t||m.tipo)} ${m.num?"N° "+esc(m.num):""}</td><td>${resumenVentas(movCant(m))}</td><td class="der num">${clp(m.total||0)}</td><td>${esc(m.det||"")}</td></tr>`),"No hubo movimientos de bodega.")}
  ${tabla("Registro de actividad",["Hora","Área","Movimiento","Detalle","Hecho por"],x.act.map(b=>`<tr><td class="num">${esc(b.fecha.slice(11))}</td><td>${AREAS[b.area]||esc(b.area)}</td><td><b>${esc(b.accion)}</b></td><td>${esc(b.detalle)}</td><td>${esc(b.user)}</td></tr>`),"No hay actividad registrada.")}
  ${x.precios.length?tabla("Cambios de precio",["Hecho por",...FORMATOS.map(f=>">"+f.et)],x.precios.map(h=>`<tr><td>${esc(h.user)}</td>${FORMATOS.map(f=>`<td class="der num">${clp(h.nuevos[f.id])}<br>${difPrecio(h.ant[f.id],h.nuevos[f.id])}</td>`).join("")}</tr>`),""):""}`;
}
const nomSector=id=>((D.sectores||[]).find(x=>x.id===id)||{}).nombre||"Sin sector";
const nomLista=k=>(D.listas||{})[k]||(k==="convenio"?"Precio convenio":"Precio base");
function sectorDeTexto(p){if(p.sector!=null)return p.sector;const c=(p.comuna||p.dir||"").toLowerCase();
  const x=(D.sectores||[]).find(z=>z.comunas.some(cm=>cm&&c.includes(cm.toLowerCase())));return x?x.id:null}

/* ===================== CUADRATURA: menú, cargas, distribuidores, liquidaciones ===================== */
function hubCuad(fechaSel){
  const H=D.historico,lista=NUBE.activo?NUBE.usuarios:D.usuarios,key=u=>NUBE.activo?u.uid:u.user;
  const nombres=lista.filter(u=>u.rol==="admin"||H.usuarios.includes(key(u))).map(u=>u.nombre);
  const tile=(ctab,t,sub,ic)=>`<button type="button" class="rep hub-t" data-ctab="${ctab}"><span class="ico">${svg(ic)}</span><span><b>${t}</b><br><span class="nota" style="margin:0">${sub}</span></span></button>`;
  return cabeza("Cuadratura Móvil",fechaSel)+`<div class="hub"><div class="hub-main">
    <div class="caja hist"><p>Acceso a históricos (editar días anteriores) habilitado desde <b>${fF(H.desde)}</b> para: <b>${nombres.map(esc).join(", ")||"solo administradores"}</b>. Los demás solo editan las cuadraturas de hoy.</p>
      ${esAdmin()?`<details><summary>Cambiar acceso a históricos</summary><form id="f-hist" class="grid" style="gap:12px;margin-top:12px"><label style="max-width:220px">Desde<input type="date" id="hs-desde" value="${H.desde}"></label>
        <div class="checks-grid">${lista.filter(u=>u.rol==="encargado").map(u=>`<label class="radio"><input type="checkbox" name="hs-u" value="${esc(key(u))}" ${H.usuarios.includes(key(u))?"checked":""}>${esc(u.nombre)}</label>`).join("")||'<span class="nota" style="margin:0">Todavía no hay encargados. Créelos en Permisos Usuarios.</span>'}</div>
        <div><button class="btn chico" type="submit">Guardar acceso</button></div></form></details>`:""}</div>
    <section class="hub-sec"><h3>Cuadratura chofer</h3><div class="rep-grid">${tile("carga","Carga inicial","Con qué sale cada móvil","ruta")}${tile("recarga","Recarga de cilindros","Cargas durante el día","compras")}${tile("movil","Rendición chofer","Lo vendido y cómo se pagó","cuadratura")}</div></section>
    <section class="hub-sec"><h3>Cuadratura distribuidor</h3><div class="rep-grid">${tile("venta-dist","Venta recargas","Carga y préstamos de envases","ruta")}${tile("mayorista","Rendición distribuidor","Pagos y saldo del distribuidor","cuadratura")}</div></section>

  </div><aside class="hub-lado caja"><h3>Liquidaciones</h3>${tile("liq-chofer","Liquidación chofer","Comisiones y anticipos","usuarios")}${tile("liq-peoneta","Liquidación peoneta","Comisiones de ayudantes","usuarios")}</aside></div>`;
}
const volverHub=`<button class="volver" type="button" data-ctab="menu" style="margin:-10px 0 16px">← Volver</button>`;
const bloqueo=f=>puedeEditarFecha(f)?"":`<div class="banner">Este día ya pasó y está bloqueado. Para editarlo, el administrador debe darle acceso a históricos.</div>`;
function vistaCarga(tipo,fechaSel){
  const chs=chOrden().filter(c=>c.local===suc&&c.activo!==false);
  if(!chs.some(c=>c.id===cargaCh))cargaCh=chs[0]?.id??null;
  const ch=D.choferes.find(c=>c.id===cargaCh),del=(D.cargas||[]).filter(x=>x.local===suc&&x.fecha===fechaCuad);
  const ini=tipo==="inicial"?del.find(x=>x.tipo==="inicial"&&x.chofer===cargaCh):null,pes=(D.peonetas||[]).filter(p=>p.local===suc&&p.activo!==false);
  const vals=ini?ini.cant:st(),ed=puedeEditarFecha(fechaCuad);
  const lista=del.filter(x=>x.tipo===tipo);
  const resumen=chs.map(c=>({c,o:cargadoDe(c.id,fechaCuad)})).filter(x=>Object.values(x.o).some(Boolean));
  return cabeza(tipo==="inicial"?"Carga inicial por chofer":"Recarga de cilindros",fechaSel)+volverHub+bloqueo(fechaCuad)+`<fieldset class="bloqueo" ${ed?"":"disabled"}><div class="dos-col" style="grid-template-columns:minmax(0,520px) minmax(0,1fr)">
    <form class="caja" id="f-carga"><h3>${tipo==="inicial"?(ini?"Editar carga inicial":"Nueva carga inicial"):"Nueva recarga"}</h3>
      <div class="fila"><label>Chofer<select id="cg-chofer">${chs.map(c=>`<option value="${c.id}" ${c.id===cargaCh?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label><label>Móvil (patente)<input value="${esc(ch?ch.patente||"Sin patente":"")}" readonly></label></div>
      ${tipo==="inicial"?`<label>Peoneta<span class="tel-sn"><select id="cg-peoneta"><option value="">Sin peoneta</option>${pes.map(p=>`<option value="${p.id}" ${ini&&ini.peoneta===p.id?"selected":""}>${esc(p.nombre)}</option>`).join("")}</select><input id="cg-nuevopeo" placeholder="Agregar peoneta"><button class="btn chico linea" type="button" id="cg-addpeo">Agregar</button></span></label>`:""}
      <span class="eyebrow">Cilindros ${tipo==="inicial"?"con que sale":"que se cargan"}</span>
      <div class="cil-ins">${FORMATOS.map(f=>`<label class="${f.tipo==="c"?"cat":""}">${f.nom||f.et}<input type="number" min="0" class="num" data-cg="${f.id}" value="${vals[f.id]||0}"></label>`).join("")}</div>
      <div class="acc"><button class="btn" type="submit">${tipo==="inicial"?"Grabar carga inicial":"Grabar recarga"}</button>${ini?'<button class="btn rojo" type="button" id="cg-eliminar">Eliminar carga inicial de este chofer</button>':""}</div>
      <p class="nota" style="margin:0">Los cilindros salen de la bodega de ${esc(nomLocal(suc))} y quedan cargados en el móvil. Se usan en la rendición del chofer para saber cuántos debe devolver.</p>
      ${chs.length?"":'<p class="error">No hay móviles activos en esta sucursal. Agréguelos en Asigna Ruta.</p>'}</form>
    <div style="min-width:0">
      <h3 style="margin-bottom:12px">${tipo==="inicial"?"Cargas iniciales":"Recargas"} del ${fF(fechaCuad)}</h3>
      <div class="tabla-wrap" style="margin-bottom:22px"><table><thead><tr><th>Chofer</th>${tipo==="inicial"?"<th>Peoneta</th>":""}${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th class="der">Total</th><th>Hora</th><th></th></tr></thead><tbody>
      ${lista.map(x=>`<tr><td>${esc(nomChofer(x.chofer))}</td>${tipo==="inicial"?`<td>${esc(((D.peonetas||[]).find(p=>p.id===x.peoneta)||{}).nombre||"—")}</td>`:""}${FORMATOS.map(f=>`<td class="der num">${x.cant[f.id]||0}</td>`).join("")}<td class="der num"><b>${Object.values(x.cant).reduce((a,b)=>a+(b||0),0)}</b></td><td class="num">${esc(x.hora||"")}<br><span class="nota" style="margin:0">${esc(x.user||"")}</span></td>
        <td>${tipo==="inicial"?`<button class="btn chico linea" type="button" data-editcg="${x.chofer}">Editar</button>`:`<button class="btn chico linea" type="button" data-delcg="${x.k}">Eliminar</button>`}</td></tr>`).join("")||`<tr><td colspan="${FORMATOS.length+5}">Todavía no hay ${tipo==="inicial"?"cargas iniciales":"recargas"} este día.</td></tr>`}
      </tbody></table></div>
      <h3 style="margin-bottom:12px">Total cargado por móvil hoy</h3>
      <div class="tabla-wrap"><table><thead><tr><th>Chofer</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th class="der">Total</th></tr></thead><tbody>
      ${resumen.map(({c,o})=>`<tr><td>${esc(c.nombre)}</td>${FORMATOS.map(f=>`<td class="der num">${o[f.id]}</td>`).join("")}<td class="der num"><b>${Object.values(o).reduce((a,b)=>a+b,0)}</b></td></tr>`).join("")||`<tr><td colspan="${FORMATOS.length+2}">Sin cargas.</td></tr>`}
      </tbody></table></div></div></div></fieldset>`;
}
function vistaVentaDist(fechaSel){
  const mays=(D.mayoristas||[]).filter(m=>(m.local??1)===suc);
  if(!mays.some(m=>m.id===distSel))distSel=mays[0]?.id??null;
  const chs=chOrden().filter(c=>c.local===suc),del=(D.cargasDist||[]).filter(x=>x.local===suc&&x.fecha===fechaCuad),ed=puedeEditarFecha(fechaCuad);
  const sinPrest=f=>f.tipo==="c";
  const txt=o=>FORMATOS.filter(f=>o[f.id]).map(f=>`${o[f.id]}×${f.et}`).join(", ")||"—";
  return cabeza("Venta recargas (carga distribuidor)",fechaSel)+volverHub+bloqueo(fechaCuad)+`<fieldset class="bloqueo" ${ed?"":"disabled"}>
    <form class="caja" id="f-vd" style="max-width:980px">
      <div class="fila3"><label>Distribuidor<select id="vd-dist">${mays.map(m=>`<option value="${m.id}" ${m.id===distSel?"selected":""}>${esc(m.nombre)}</option>`).join("")}</select></label>
        <label>N° guía física<input id="vd-guia"></label>
        <label>Transbank<select id="vd-tb"><option value="">No paga con tarjeta</option><option value="debito">Débito</option><option value="credito">Crédito</option></select></label></div>
      <label style="max-width:420px">Chofer que realiza el despacho<select id="vd-chofer"><option value="">El distribuidor retira en la bodega</option>${chs.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></label>
      <div class="tabla-wrap"><table class="vt"><thead><tr><th>Cilindro</th><th class="der">Venta</th><th class="der">Préstamo envase</th><th class="der">Devolución envase</th><th class="der">Pendiente</th></tr></thead><tbody>
      ${FORMATOS.map(f=>`<tr class="${sinPrest(f)?"cat-fila":""}"><td>${f.nom||f.et}</td><td class="der"><input type="number" min="0" class="num" data-vv="${f.id}" value="0" aria-label="Venta ${f.et}"></td>
        ${sinPrest(f)?'<td></td><td></td><td></td>':`<td class="der"><input type="number" min="0" class="num" data-vp="${f.id}" value="0" aria-label="Préstamo ${f.et}"></td><td class="der"><input type="number" min="0" class="num" data-vdv="${f.id}" value="0" aria-label="Devolución ${f.et}"></td><td class="der num"><b>${distSel?prestamoPend(distSel,f.id):0}</b></td>`}</tr>`).join("")}
      </tbody></table></div>
      <div class="acc"><button class="btn" type="submit">Grabar carga</button></div>
      <p class="nota" style="margin:0">Préstamo: envases que se llevó sin dejar vacío. Devolución: envases prestados que devolvió. "Pendiente" es lo que todavía debe en envases.</p>
      ${mays.length?"":'<p class="error">No hay distribuidores en esta sucursal. Agréguelos en Rendición distribuidor.</p>'}</form>
    <h3 style="margin:24px 0 12px">Cargas del ${fF(fechaCuad)}</h3>
    <div class="tabla-wrap"><table><thead><tr><th>Hora</th><th>Usuario</th><th>N° guía</th><th>Distribuidor</th><th>Despacha</th><th>Venta</th><th>Préstamo</th><th>Devolución</th><th class="der">Recaudación</th><th></th></tr></thead><tbody>
    ${del.map(x=>{const pr=D.preciosMayor||{},rec=FORMATOS.reduce((a,f)=>a+(x.venta[f.id]||0)*(pr[f.id]||0),0);return `<tr><td class="num">${esc(x.hora)}</td><td>${esc(x.user)}</td><td>${esc(x.guia||"—")}</td><td>${esc(((D.mayoristas||[]).find(m=>m.id===x.mayorista)||{}).nombre||"")}</td><td>${x.chofer?esc(nomChofer(x.chofer)):"Retira"}</td>
      <td>${txt(x.venta)}</td><td>${txt(x.prestamo)}</td><td>${txt(x.devolucion)}</td><td class="der num">${clp(rec)}${x.tb?`<br><span class="nota" style="margin:0">Transbank ${x.tb}</span>`:""}</td><td><button class="btn chico linea" type="button" data-delvd="${x.k}">Eliminar</button></td></tr>`}).join("")||'<tr><td colspan="10">Sin cargas de distribuidores este día.</td></tr>'}
    </tbody></table></div></fieldset>`;
}
function datosLiq(kind){
  const dentro=f=>f>=liqDesde&&f<=liqHasta,rends=(D.rendiciones||[]).filter(r=>r.tipo==="movil"&&r.local===suc&&dentro(r.fecha));
  const personas=kind==="chofer"?chOrden().filter(c=>c.local===suc):(D.peonetas||[]).filter(p=>p.local===suc);
  return personas.map(p=>{const v=st();let falt=0;
    const rs=kind==="chofer"?rends.filter(r=>r.ref===p.id):rends.filter(r=>(D.cargas||[]).some(c=>c.tipo==="inicial"&&c.peoneta===p.id&&c.chofer===r.ref&&c.fecha===r.fecha));
    rs.forEach(r=>{FORMATOS.forEach(f=>v[f.id]+=r.ventas[f.id]||0);if(kind==="chofer"){const sd=calcRend(r).saldo;if(sd>0)falt+=sd}});
    const ant=(D.anticipos||[]).filter(a=>a.local===suc&&a.tipo===kind&&a.ref===p.id&&dentro(a.fecha)).reduce((s,a)=>s+a.monto,0),com=comisionDe(kind,v);
    return {p,dias:rs.length,uni:FORMATOS.reduce((s,f)=>s+v[f.id],0),kg:FORMATOS.reduce((s,f)=>s+v[f.id]*f.kg,0),com,ant,falt,pagar:com-ant-falt}});
}
function vistaLiq(kind){
  const esCh=kind==="chofer",filas=datosLiq(kind),S=k=>filas.reduce((s,x)=>s+x[k],0),T=D.comisiones[kind];
  const ants=(D.anticipos||[]).filter(a=>a.local===suc&&a.tipo===kind&&a.fecha>=liqDesde&&a.fecha<=liqHasta);
  const nombre=a=>esCh?nomChofer(a.ref):(((D.peonetas||[]).find(p=>p.id===a.ref))||{}).nombre||"";
  const filtros=`<div class="acc" style="align-items:end"><label>Desde<input type="date" id="lq-desde" value="${liqDesde}"></label><label>Hasta<input type="date" id="lq-hasta" value="${liqHasta}"></label></div>`;
  return cabeza(esCh?"Liquidación chofer":"Liquidación peoneta",filtros)+volverHub+`<div class="kpis">
    <div class="kpi"><span>Comisiones</span><b class="num">${clp(S("com"))}</b></div><div class="kpi"><span>Anticipos</span><b class="num">${clp(S("ant"))}</b></div>
    <div class="kpi"><span>${esCh?"Faltantes de cuadratura":"Días trabajados"}</span><b class="num">${esCh?clp(S("falt")):S("dias")}</b></div><div class="kpi"><span>Total a pagar</span><b class="num">${clp(S("pagar"))}</b></div></div>
    <div class="tabla-wrap"><table><thead><tr><th>${esCh?"Chofer":"Peoneta"}</th><th class="der">Días</th><th class="der">Cilindros</th><th class="der">Kilos</th><th class="der">Comisión</th><th class="der">Anticipos</th>${esCh?'<th class="der">Faltantes</th>':""}<th class="der">A pagar</th></tr></thead><tbody>
    ${filas.map(x=>`<tr><td>${esc(x.p.nombre)}</td><td class="der num">${x.dias}</td><td class="der num">${x.uni}</td><td class="der num">${x.kg.toLocaleString("es-CL")} kg</td><td class="der num">${clp(x.com)}</td><td class="der num">${clp(x.ant)}</td>${esCh?`<td class="der num">${clp(x.falt)}</td>`:""}<td class="der num"><b class="${x.pagar<0?"saldo-pos":""}">${clp(x.pagar)}</b></td></tr>`).join("")||`<tr><td colspan="8">${esCh?"No hay choferes en esta sucursal.":"No hay peonetas. Agregue uno abajo o en la Carga inicial."}</td></tr>`}
    </tbody></table></div>
    <p class="nota">${esCh?"Comisión = cilindros rendidos × valor por cilindro. Se descuentan los anticipos y lo que quedó debiendo en las cuadraturas del período.":"La peoneta gana por los cilindros que vendió el chofer con quien salió (según la Carga inicial)."}</p>
    <div class="grid dos" style="gap:20px;margin-top:20px;align-items:start">
      <form class="caja" id="f-ant"><h3>Registrar anticipo</h3>
        <div class="fila"><label>${esCh?"Chofer":"Peoneta"}<select id="an-ref">${filas.map(x=>`<option value="${x.p.id}">${esc(x.p.nombre)}</option>`).join("")}</select></label><label>Fecha<input type="date" id="an-fecha" value="${hoyStr()}"></label></div>
        <div class="fila"><label>Monto (CLP)<input type="number" min="1" id="an-monto" class="num" required></label><label>Detalle<input id="an-det" placeholder="Ej: adelanto de sueldo"></label></div>
        <div><button class="btn" type="submit">Registrar anticipo</button></div>
        <div class="tabla-wrap"><table><tbody>${ants.map(a=>`<tr><td class="num">${fF(a.fecha)}</td><td>${esc(nombre(a))}<br><span class="nota" style="margin:0">${esc(a.det||"")}</span></td><td class="der num">${clp(a.monto)}</td><td class="der"><button class="btn chico linea" type="button" data-delant="${a.k}">Anular</button></td></tr>`).join("")||'<tr><td>Sin anticipos en el período.</td></tr>'}</tbody></table></div></form>
      <div class="grid" style="gap:20px">
        ${esAdmin()?`<form class="caja" id="f-com"><h3>Comisión por cilindro (${esCh?"chofer":"peoneta"})</h3><div class="cil-ins">${FORMATOS.map(f=>`<label>${f.et}<input type="number" min="0" class="num" data-com="${f.id}" value="${T[f.id]||0}"></label>`).join("")}</div><div><button class="btn chico" type="submit">Guardar comisiones</button></div><p class="aviso ok" id="com-ok" hidden>Comisiones guardadas.</p></form>`:""}
        ${esCh?"":`<form class="caja" id="f-peo"><h3>Peonetas de ${esc(nomLocal(suc))}</h3><div class="tel-sn"><input id="pe-nombre" placeholder="Nombre del peoneta" required><button class="btn chico" type="submit">Agregar</button></div>
          <div class="tabla-wrap"><table><tbody>${(D.peonetas||[]).filter(p=>p.local===suc).map(p=>`<tr><td>${esc(p.nombre)}</td><td>${p.activo===false?'<span class="pill anulado">Inactivo</span>':'<span class="pill entregado">Activo</span>'}</td><td class="der"><button class="btn chico linea" type="button" data-togpeo="${p.id}">${p.activo===false?"Activar":"Desactivar"}</button></td></tr>`).join("")||'<tr><td>Sin peonetas.</td></tr>'}</tbody></table></div></form>`}
      </div></div>`;
}
function aplicarCarga(x,sg){const l=ensureLoc(loc(x.local)),c=ensureCh(D.choferes.find(y=>y.id===x.chofer)||{});FORMATOS.forEach(f=>{const n=(x.cant[f.id]||0)*sg;l.stock[f.id]-=n;if(c.carga)c.carga[f.id]+=n})}
function aplicarDist(x,sg){const l=ensureLoc(loc(x.local));FORMATOS.forEach(f=>{const v=x.venta[f.id]||0,p=x.prestamo[f.id]||0,d=x.devolucion[f.id]||0,e=(x.env||{})[f.id]||0;l.stock[f.id]-=sg*v;l.vacios[f.id]+=sg*(v-p-e+d);l.prestados[f.id]+=sg*(p-d)})}
function enlazarCuadExtra(){
  const leer=a=>{const o=st();FORMATOS.forEach(f=>{const i=document.querySelector(`[data-${a}="${f.id}"]`);o[f.id]=i?Math.max(0,+i.value||0):0});return o};
  const fh=$("#f-hist");if(fh)fh.onsubmit=e=>{e.preventDefault();D.historico={desde:$("#hs-desde").value||D.historico.desde,usuarios:[...$$('input[name="hs-u"]:checked')].map(i=>i.value)};
    log("sistema","Acceso a históricos",`Desde ${D.historico.desde} · ${D.historico.usuarios.length} usuario(s)`);guardar();pintarSistema();aviso("Acceso guardado","Los usuarios marcados ya pueden editar días anteriores.")};
  // Carga inicial / recarga
  const fc=$("#f-carga");
  if(fc){const tipo=cuadTab==="carga"?"inicial":"recarga";
    $("#cg-chofer").onchange=e=>{cargaCh=+e.target.value;pintarSistema()};
    const ap=$("#cg-addpeo");if(ap)ap.onclick=()=>{const n=$("#cg-nuevopeo").value.trim();if(!n)return;const p={id:nuevoId(D.peonetas),nombre:n,local:suc,activo:true};D.peonetas.push(p);nubeGuardar("peonetas",p);guardar();pintarSistema()};
    fc.onsubmit=e=>{e.preventDefault();if(cargaCh==null)return;const cant=leer("cg"),hora=ahora().slice(11);
      if(!Object.values(cant).some(Boolean)){aviso("Faltan cantidades","Indique cuántos cilindros carga el móvil.");return}
      let x=tipo==="inicial"?D.cargas.find(y=>y.tipo==="inicial"&&y.local===suc&&y.fecha===fechaCuad&&y.chofer===cargaCh):null;
      if(x)aplicarCarga(x,-1);else{x={k:Date.now(),tipo,local:suc,fecha:fechaCuad,chofer:cargaCh};D.cargas.unshift(x)}
      Object.assign(x,{cant,hora,user:yo.nombre,peoneta:tipo==="inicial"&&$("#cg-peoneta").value?+$("#cg-peoneta").value:null});aplicarCarga(x,1);nubeGuardar("cargas",x);
      log("bodega",tipo==="inicial"?"Carga inicial":"Recarga de cilindros",`${nomChofer(cargaCh)} · ${FORMATOS.filter(f=>cant[f.id]).map(f=>cant[f.id]+"×"+f.et).join(", ")}`,{chofer:cargaCh});
      guardar();pintarSistema();aviso("Carga grabada",`${nomChofer(cargaCh)} quedó cargado.`)};
    const ce=$("#cg-eliminar");if(ce)ce.onclick=()=>confirmar(ce,()=>{const x=D.cargas.find(y=>y.tipo==="inicial"&&y.local===suc&&y.fecha===fechaCuad&&y.chofer===cargaCh);if(!x)return;
      aplicarCarga(x,-1);D.cargas=D.cargas.filter(y=>y!==x);nubeQuitar("cargas",x);log("bodega","Carga inicial eliminada",nomChofer(x.chofer),{chofer:x.chofer});guardar();pintarSistema()});
    $$("[data-editcg]").forEach(b=>b.onclick=()=>{cargaCh=+b.dataset.editcg;pintarSistema();window.scrollTo(0,0)});
    $$("[data-delcg]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=D.cargas.find(y=>String(y.k)===b.dataset.delcg);aplicarCarga(x,-1);D.cargas=D.cargas.filter(y=>y!==x);nubeQuitar("cargas",x);
      log("bodega","Recarga eliminada",nomChofer(x.chofer),{chofer:x.chofer});guardar();pintarSistema()}));
  }
  // Venta recargas
  const fv=$("#f-vd");
  if(fv){$("#vd-dist").onchange=e=>{distSel=+e.target.value;pintarSistema()};
    fv.onsubmit=e=>{e.preventDefault();if(distSel==null)return;const x={k:Date.now(),local:suc,fecha:fechaCuad,hora:ahora().slice(11),mayorista:distSel,guia:$("#vd-guia").value.trim(),tb:$("#vd-tb").value,
        chofer:$("#vd-chofer").value?+$("#vd-chofer").value:null,venta:leer("vv"),prestamo:leer("vp"),devolucion:leer("vdv"),user:yo.nombre};
      if(![x.venta,x.prestamo,x.devolucion].some(o=>Object.values(o).some(Boolean))){aviso("Faltan cantidades","Indique la venta, el préstamo o la devolución.");return}
      D.cargasDist.unshift(x);aplicarDist(x,1);nubeGuardar("cargasDist",x);
      log("bodega","Venta recarga distribuidor",`${((D.mayoristas||[]).find(m=>m.id===distSel)||{}).nombre||""} · guía ${x.guia||"—"}`);guardar();pintarSistema();aviso("Carga grabada","Ya aparece en la rendición del distribuidor de este día.")};
    $$("[data-delvd]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=D.cargasDist.find(y=>String(y.k)===b.dataset.delvd);aplicarDist(x,-1);D.cargasDist=D.cargasDist.filter(y=>y!==x);nubeQuitar("cargasDist",x);guardar();pintarSistema()}));
  }
  // Liquidaciones
  const ld=$("#lq-desde");if(ld){ld.onchange=e=>{liqDesde=e.target.value||liqDesde;pintarSistema()};$("#lq-hasta").onchange=e=>{liqHasta=e.target.value||liqHasta;pintarSistema()}}
  const fa=$("#f-ant");if(fa)fa.onsubmit=e=>{e.preventDefault();const ref=+$("#an-ref").value;if(!ref&&ref!==0)return;
    const a={k:Date.now(),local:suc,tipo:cuadTab==="liq-chofer"?"chofer":"peoneta",ref,fecha:$("#an-fecha").value||hoyStr(),monto:+$("#an-monto").value||0,det:$("#an-det").value.trim(),user:yo.nombre};
    if(a.monto<=0)return;D.anticipos.unshift(a);nubeGuardar("anticipos",a);log("cuadratura","Anticipo",`${a.tipo} · ${clp(a.monto)} · ${a.det}`);guardar();pintarSistema()};
  $$("[data-delant]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const a=D.anticipos.find(y=>String(y.k)===b.dataset.delant);D.anticipos=D.anticipos.filter(y=>y!==a);nubeQuitar("anticipos",a);guardar();pintarSistema()}));
  const fco=$("#f-com");if(fco)fco.onsubmit=e=>{e.preventDefault();const kind=cuadTab==="liq-chofer"?"chofer":"peoneta";Object.assign(D.comisiones[kind],leer("com"));guardar();pintarSistema();$("#com-ok").hidden=false};
  const fp=$("#f-peo");if(fp)fp.onsubmit=e=>{e.preventDefault();const n=$("#pe-nombre").value.trim();if(!n)return;const p={id:nuevoId(D.peonetas),nombre:n,local:suc,activo:true};D.peonetas.push(p);nubeGuardar("peonetas",p);guardar();pintarSistema()};
  $$("[data-togpeo]").forEach(b=>b.onclick=()=>{const p=D.peonetas.find(y=>y.id===+b.dataset.togpeo);p.activo=p.activo===false;nubeGuardar("peonetas",p);guardar();pintarSistema()});
}
const TIPOS_DOC={factura:{t:"Factura compras",ll:1,va:-1},guiavales:{t:"Compra con guía (vales)",ll:1,va:-1},informal:{t:"Compra informal",ll:1,va:-1},
  notacredito:{t:"Nota de crédito (devoluciones)",ll:-1},defectuosos:{t:"Guía despacho (defectuosos)",ll:-1},prestamo:{t:"Préstamo planta (comodato)",ll:1,co:1},devolplanta:{t:"Devolución planta (comodato)",va:-1,co:-1},
  compra:{t:"Compra a proveedor",ll:1},devprov:{t:"Devolución a proveedor",ll:-1},devcli:{t:"Devolución de cliente",ll:1}};
const DOCS_NUEVOS=["factura","informal"]; // guía vales, nota de crédito, guía despacho y comodato desactivados (los documentos antiguos se conservan)
const movCant=m=>m.cant&&typeof m.cant==="object"?m.cant:{[m.formato]:m.cant||0};
function aplicarMov(l,m,sg){const c=movCant(m),e=TIPOS_DOC[m.tipo]||{};ensureLoc(l);l.comodato=l.comodato||st();
  FORMATOS.forEach(f=>{const n=(c[f.id]||0)*sg;l.stock[f.id]+=n*(e.ll||0);l.vacios[f.id]+=n*(e.va||0);l.comodato[f.id]+=n*(e.co||0)})}
const marcasP=p=>`${p.reclamado?' <span class="marca m-r" title="Reclamado por cliente">R</span>':""}${p.cierreFalso?' <span class="marca m-cf" title="Cierre falso">CF</span>':""}`;
const contadores=ps=>{const n=e=>ps.filter(p=>p.estado===e).length;
  return `<div class="contadores"><span>${mod==="ruta"?"Por despachar":"Nuevos"} <b class="num">${n("pendiente")}</b></span><span>En ruta <b class="num">${n("ruta")}</b></span><span>Entregados <b class="num">${n("entregado")}</b></span><span>Anulados <b class="num">${n("anulado")}</b></span><span>Reclamados (activos) <b class="num">${ps.filter(p=>p.reclamado&&["pendiente","ruta"].includes(p.estado)).length}</b></span><span>Total <b class="num">${ps.length}</b></span></div>`};

const nomCli=p=>p.nombre||p.fono||"Sin datos";
const items=p=>p.items||[{formato:p.formato,cant:p.cant,precio:p.precio}];
/* Clientes frecuentes: se guardan por teléfono al grabar cada pedido */
const normFono=t=>{const d=String(t||"").replace(/\D/g,"");return d.length>=8?d.slice(-9):""};
function datosCliente(p){return {fono:normFono(p.fono),fonoTxt:p.fono,nombre:(p.nombre||"").replace(/^Ejemplo: /,""),calle:p.calle||p.dir||"",num:p.num||"",block:p.block||"",depto:p.depto||"",comuna:p.comuna||"",ciudad:p.ciudad||"",ref:p.ref||"",
  lista:p.lista||"base",tipo:p.tipo||"hogar",medio:p.medio||"efectivo",factura:p.factura||null,ultimo:p.fecha,ultimoItems:items(p).map(i=>({formato:i.formato,cant:i.cant,env:i.env||0})),local:p.local}}
function guardarCliente(p){const k=normFono(p.fono);if(!k)return null;D.clientes=D.clientes||[];let c=D.clientes.find(x=>x.fono===k);
  const n=datosCliente(p);if(c){const ped=(c.pedidos||0)+1;Object.assign(c,n,{pedidos:ped})}else{c={...n,pedidos:1,desde:p.fecha};D.clientes.push(c)}return c}
const buscarCliente=t=>{const k=normFono(t);return k?(D.clientes||[]).find(x=>x.fono===k):null};
const totalP=p=>Math.max(0,items(p).reduce((s,i)=>s+i.precio*i.cant+(i.env||0)*(i.precioEnv||0),0)-(p.dcto||0));
const precioLista=(lista,f)=>lista==="convenio"?((D.preciosConvenio||{})[f]??D.precios[f]):D.precios[f];
const resumenP=p=>items(p).map(i=>`${i.cant}×${fmt(i.formato).et}${i.env?` (${i.env} env.)`:""}`).join(", ");
const minutos=f=>Math.round((Date.now()-new Date(f.replace(" ","T")).getTime())/60000);
const AREAS={petroleo:"Petróleo",pedidos:"Pedidos",bodega:"Bodega",ventas:"Ventas",caja:"Caja",precios:"Precios",cuadratura:"Cuadratura",sistema:"Sistema"};
function log(area,accion,detalle,extra={}){
  (D.bitacora=D.bitacora||[]).unshift({id:Date.now()+Math.random(),fecha:ahora(),user:yo?yo.nombre:"Sitio web",local:extra.local??suc,area,accion,detalle:detalle||"",chofer:extra.chofer??null,pedido:extra.pedido??null});nubeLog(D.bitacora[0]);
}
const ensureCh=c=>{c.carga=c.carga||st(0,0,0,0);c.vacios=c.vacios||st(0,0,0,0);return c};
const ensureLoc=l=>{l.vacios=l.vacios||st(0,0,0,0);l.prestados=l.prestados||st(0,0,0,0);return l};
function setEstado(p,e){
  const l=loc(p.local),ant=p.estado,chAntes=p.chofer,ch=p.chofer?D.choferes.find(c=>c.id===p.chofer):null;
  if(p.desc&&e!=="entregado"){
    const dc=p.descCh?D.choferes.find(c=>c.id===p.descCh):null;
    items(p).forEach(i=>{if(dc){ensureCh(dc);dc.carga[i.formato]+=i.cant;dc.vacios[i.formato]-=i.cant-(i.env||0)}else if(l)l.stock[i.formato]+=i.cant});
    p.desc=false;p.entregado=null;p.descCh=null;
  }
  if(e==="entregado"&&!p.desc){
    if(ch){ensureCh(ch);items(p).forEach(i=>{ch.carga[i.formato]-=i.cant;ch.vacios[i.formato]+=i.cant-(i.env||0)});p.descCh=ch.id}
    else if(l)items(p).forEach(i=>l.stock[i.formato]-=i.cant);
    p.desc=true;p.entregado=ahora();
  }
  if(e==="pendiente")p.chofer=null;
  if(e==="ruta"&&!p.despacho)p.despacho=ahora();
  p.estado=e;
  const acc={pendiente:ant==="ruta"?"No entregado":"Vuelto a pendiente",ruta:"Despachado",entregado:"Entregado",anulado:"Anulado"}[e];
  log("pedidos",acc,`Pedido N° ${p.id} · ${resumenP(p)} · ${nomCli(p)} · ${p.dir} · ${ESTADOS[ant]||ant} → ${ESTADOS[e]}`,{local:p.local,chofer:chAntes,pedido:p.id});
  nubePedido(p);
}
const FUENTES={fono:"Fono",whatsapp:"WhatsApp",pedidosya:"Pedidos Ya",instagram:"Instagram",app:"App",mercadolibre:"Mercado Libre",web:"Sitio web"};
const PAGOS_PED={efectivo:"Efectivo",tarjeta:"Tarjeta",transferencia:"Transferencia",vale:"Vale",cheque:"Cheque"};
const PAGOS={cheque:"Cheque",efectivo:"Efectivo",transferencia:"Transferencia",pagorut:"Pago RUT",chequedia:"Cheque al día",chequefecha:"Cheque a fecha",vale:"Vale",tarjeta:"Tarjeta débito/crédito",webpay:"Webpay",oneclick:"One Click",cuenta:"Crédito empresa",valegob:"Vale Gobierno",otros:"Otros"};
Object.assign(MEDIOS,PAGOS);


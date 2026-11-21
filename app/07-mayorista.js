/* MR Gas · Panel General · 07-mayorista */
/* ===================== VENTA MAYORISTA (igual que en Venta Local MR Gas) =====================
   Clientes mayoristas con lista de precios (precio base menos $ por kilo, o precio especial),
   venta que descuenta de bodega, cuenta por cliente con abonos y comisión por vale. */
IC.mayorista='<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4h5v5"/><path d="M21 4l-5 5"/><path d="M17 14h4v6h-4"/>';
const asegMay=()=>{D.listasMay=D.listasMay||[];D.comisionVale=D.comisionVale||{};Object.keys(VALES).forEach(k=>{D.comisionVale[k]=D.comisionVale[k]||{}});D.mayoristas=D.mayoristas||[]};
const precioBaseMay=f=>{const v=(D.preciosMayor||{})[f];return v!=null&&v>0?v:(D.precios[f]||0)};
const listaMay=c=>c&&(D.listasMay||[]).find(l=>l.id===c.lista);
const esEspMay=c=>!!c&&c.lista==="esp";
const precioListaMay=(l,f)=>Math.max(0,precioBaseMay(f)-(l?l.dto*fmt(f).kg:0));
const precioCliMay=(c,f)=>esEspMay(c)?((c.esp&&c.esp[f])||precioBaseMay(f)):precioListaMay(listaMay(c),f);
const cliMay=id=>(D.mayoristas||[]).find(m=>m.id===id);
function preciosCliMay(id){const c=cliMay(id),o={};FORMATOS.forEach(f=>o[f.id]=precioCliMay(c,f.id));return o}
const comVale=cp=>{if(!cp)return 0;const t=((D.comisionVale||{})[cp.vale])||{};return (+cp.cant||0)*(+t[cp.formato]||0)};
const nomListaMay=c=>esEspMay(c)?"Precio especial":listaMay(c)?listaMay(c).nombre:"Precio base";
const valorDist=x=>FORMATOS.reduce((s,f)=>s+(x.venta[f.id]||0)*((x.precios||{})[f.id]??precioCliMay(cliMay(x.mayorista),f.id))+((x.env||{})[f.id]||0)*((x.precioEnv||{})[f.id]||0),0)-(+x.dcto||0);
const cilTxt=o=>FORMATOS.filter(f=>o[f.id]).map(f=>`${o[f.id]}×${f.et}`).join(", ")||"—";

/* la comisión por vale baja el saldo del cliente en la rendición mayorista */
{const cr=calcRend;calcRend=function(r){const c=cr(r);c.com=r.tipo==="mayorista"?r.pagos.reduce((s,p)=>s+(+p.com||0),0):0;c.saldo-=c.com;return c}}
{const vr=vistaRend;vistaRend=function(r,f){let h=vr(r,f);if(r.tipo==="mayorista"){const c=calcRend(r);
  h=h.replace('<div class="res-saldo',`<div class="res-lin"><span>− Comisión vales <small class="nota" style="margin:0">(a favor del cliente)</small></span><b class="num">${clp(c.com)}</b></div><div class="res-saldo`)}return h}}

/* si ya existe la rendición del cliente ese día, se actualiza con las ventas */
function syncRendMay(mid,fecha){const r=(D.rendiciones||[]).find(x=>x.tipo==="mayorista"&&x.ref===mid&&x.fecha===fecha);if(!r)return;
  const cd=cargaDistDe(mid,fecha);Object.assign(r.ventas,st(),cd.ventas);r.envases={...st(),...cd.env};
  r.pagos=r.pagos.filter(p=>p.auto!=="may");if(cd.dcto>0)r.pagos.push({id:(r.pagos.reduce((m,p)=>Math.max(m,+p.id||0),0))+1,tipo:"descuento",monto:cd.dcto,detalle:"Descuentos dados en Venta Mayorista",hora:ahora(),auto:"may"});
  nubeGuardar("rendiciones",r)}

let mayTab="venta",mayFecha=null,mayCli=null,mayFiltro={cli:"",d1:"",d2:""};

/* cuenta corriente de un cliente: cada día con compras o rendición */
function cuentaMay(m){
  const vs=(D.cargasDist||[]).filter(x=>x.mayorista===m.id&&!x.anulada),rs=(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.ref===m.id);
  const dias=new Set([...vs.map(x=>x.fecha),...rs.map(r=>r.fecha)]);let comp=0,pag=0,com=0,ult="";
  dias.forEach(d=>{const r=rs.find(x=>x.fecha===d);
    if(r){const c=calcRend(r);comp+=c.venta+c.cargos;pag+=c.pagado;com+=c.com}else comp+=vs.filter(x=>x.fecha===d).reduce((s,x)=>s+valorDist(x),0)});
  vs.forEach(x=>{if(x.fecha>ult)ult=x.fecha});
  return {m,comp,pag:pag+com,com,saldo:comp-pag-com,ult}}

V.mayorista=function(){
  asegMay();
  const mays=(D.mayoristas||[]).filter(m=>(m.local??1)===suc).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const tabs=`<div class="tabs" role="tablist">${[["venta","Venta mayorista"],["rend","Rendición mayorista"],["cuenta","Cuenta clientes"]].map(([k,t])=>`<button type="button" role="tab" data-maytab="${k}" aria-selected="${mayTab===k}">${t}</button>`).join("")}</div>`;
  const irCfg=esAdmin()?`<button class="btn" type="button" data-ircfg="clientesMay">Ir a Clientes mayoristas</button>`:"Pídale a un administrador que los cree.";
  if(!mays.length)return cabeza("Venta Mayorista")+tabs+`<div class="caja" style="text-align:center;padding:40px"><p>Aún no hay clientes mayoristas.</p><p class="nota">Créelos en <b>Configuraciones → Clientes mayoristas</b>.</p>${irCfg}</div>`;
  if(mayTab==="cuenta"){
    const cs=mays.map(cuentaMay),T=cs.reduce((a,c)=>({comp:a.comp+c.comp,pag:a.pag+c.pag}),{comp:0,pag:0}),sc=v=>Math.round(v)>0?"color:var(--red)":Math.round(v)<0?"color:var(--b7)":"";
    const F=mayFiltro,okF=d=>(!F.d1||d>=F.d1)&&(!F.d2||d<=F.d2),okC=id=>!F.cli||String(id)===F.cli;
    const mov=[...(D.cargasDist||[]).filter(x=>okC(x.mayorista)&&okF(x.fecha)&&mays.some(m=>m.id===x.mayorista)).map(x=>({f:x.fecha,h:x.hora||"",cli:x.mayorista,t:"Venta",det:cilTxt(x.venta)+(x.guia?" · "+x.guia:""),cargo:x.anulada?0:valorDist(x),abono:0,an:x.anulada,u:x.user})),
      ...(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&okC(r.ref)&&okF(r.fecha)&&mays.some(m=>m.id===r.ref)).flatMap(r=>[
        ...r.pagos.map(p=>({f:r.fecha,h:String(p.hora||"").slice(11,16),cli:r.ref,t:(p.abono?"Abono · ":"")+(TIPOS_PAGO[p.tipo]||p.tipo),det:p.detalle||"",cargo:0,abono:p.monto+(+p.com||0),u:r.usuario})),
        ...r.cargos.map(c=>({f:r.fecha,h:"",cli:r.ref,t:"Cargo",det:c.detalle||"",cargo:c.monto,abono:0,u:r.usuario}))])]
      .sort((a,b)=>(b.f+b.h).localeCompare(a.f+a.h)).slice(0,300);
    return cabeza("Venta Mayorista")+tabs+`<div class="kpis"><div class="kpi"><span>Total vendido</span><b class="num">${clp(T.comp)}</b></div><div class="kpi"><span>Total pagado</span><b class="num">${clp(T.pag)}</b></div><div class="kpi"><span>Saldo por cobrar</span><b class="num" style="${sc(T.comp-T.pag)}">${clp(T.comp-T.pag)}</b></div></div>
      <form class="caja" id="f-abono" style="margin-top:18px"><h3>Registrar abono</h3>
        <div class="fila3"><label>Cliente<select id="ab-cli" required><option value="">Elija el cliente...</option>${mays.map(m=>`<option value="${m.id}">${esc(m.nombre)}</option>`).join("")}</select></label>
          <label>Fecha<input id="ab-fecha" type="date" value="${hoyStr()}"></label><label>Monto $<input id="ab-monto" type="number" min="1" class="num" required></label></div>
        <div class="fila3"><label>Medio de pago<select id="ab-medio">${["efectivo","transferencia","cheque","transbank","deposito"].map(k=>`<option value="${k}">${TIPOS_PAGO[k]}</option>`).join("")}</select></label>
          <label style="grid-column:span 2">Detalle<input id="ab-det" placeholder="Ej: N° cheque o transferencia"></label></div>
        <div class="acc"><button class="btn" type="submit">Registrar abono</button><span class="nota" id="ab-saldo" style="margin:0"></span></div>
        <p class="nota" style="margin:0">El abono queda como pago en la Rendición mayorista del cliente de esa fecha.</p></form>
      <h3 style="margin:24px 0 12px">Saldo por cliente</h3>
      <div class="tabla-wrap"><table><thead><tr><th>Cliente</th><th>Lista</th><th class="der">Comprado</th><th class="der">Pagado</th><th class="der">Comisión vales</th><th class="der">Saldo</th><th>Última compra</th><th></th></tr></thead><tbody>
      ${cs.map(c=>`<tr><td><b>${esc(c.m.nombre)}</b></td><td>${esc(nomListaMay(c.m))}</td><td class="der num">${clp(c.comp)}</td><td class="der num">${clp(c.pag)}</td><td class="der num">${clp(c.com)}</td>
        <td class="der num" style="${sc(c.saldo)}"><b>${clp(c.saldo)}</b> ${Math.round(c.saldo)===0?'<span class="nota" style="margin:0">Al día</span>':c.saldo<0?'<span class="nota" style="margin:0">A favor</span>':""}</td><td>${c.ult?fF(c.ult):"—"}</td>
        <td><button class="btn chico linea" type="button" data-vermov="${c.m.id}">Ver movimientos</button></td></tr>`).join("")}
      <tr class="fila-tot"><td colspan="2"><b>Total (${cs.filter(c=>Math.round(c.saldo)>0).length} con saldo)</b></td><td class="der num">${clp(T.comp)}</td><td class="der num">${clp(T.pag)}</td><td></td><td class="der num"><b>${clp(T.comp-T.pag)}</b></td><td></td><td></td></tr>
      </tbody></table></div>
      <h3 style="margin:24px 0 12px">Movimientos</h3>
      <div class="fila3" style="max-width:760px;margin-bottom:12px"><label>Cliente<select id="mv-cli"><option value="">Todos</option>${mays.map(m=>`<option value="${m.id}" ${F.cli===String(m.id)?"selected":""}>${esc(m.nombre)}</option>`).join("")}</select></label>
        <label>Desde<input id="mv-d1" type="date" value="${F.d1}"></label><label>Hasta<input id="mv-d2" type="date" value="${F.d2}"></label></div>
      <div class="tabla-wrap"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Cliente</th><th>Detalle</th><th class="der">Cargo</th><th class="der">Abono</th><th>Usuario</th></tr></thead><tbody>
      ${mov.map(x=>`<tr style="${x.an?"text-decoration:line-through;color:var(--mu)":""}"><td>${fF(x.f)}</td><td class="num">${esc(x.h)}</td><td><b>${esc(x.t)}</b>${x.an?" (anulada)":""}</td><td>${esc((cliMay(x.cli)||{}).nombre||"")}</td><td>${esc(x.det)}</td>
        <td class="der num">${x.cargo?clp(x.cargo):""}</td><td class="der num" style="color:var(--ok)">${x.abono?clp(x.abono):""}</td><td>${esc(x.u||"")}</td></tr>`).join("")||'<tr><td colspan="8">Sin movimientos en este período.</td></tr>'}
      </tbody></table></div>`;
  }
  // venta mayorista
  const fe=mayFecha||hoyStr(),ed=puedeEditarFecha(fe),c=cliMay(mayCli);
  const del=(D.cargasDist||[]).filter(x=>x.local===suc&&x.fecha===fe).sort((a,b)=>String(b.hora).localeCompare(String(a.hora)));
  return cabeza("Venta Mayorista")+tabs+bloqueo(fe)+`<fieldset class="bloqueo" ${ed?"":"disabled"}>
    <form class="caja" id="f-may" style="max-width:980px"><h3>Nueva venta mayorista</h3>
      <div class="fila3"><label>Cliente<select id="my-cli"><option value="">Selecciona un cliente</option>${mays.map(m=>`<option value="${m.id}" ${m.id===mayCli?"selected":""}>${esc(m.nombre)}</option>`).join("")}</select></label>
        <label>Fecha<input id="my-fecha" type="date" value="${fe}"></label></div>
      <div class="tabla-wrap"><table class="may-q"><thead><tr><th class="l">Cilindro</th>${FORMATOS.map(f=>`<th>${f.et}</th>`).join("")}<th>Total</th></tr></thead><tbody>
      <tr><td class="l"><b>Cantidad</b></td>${FORMATOS.map(f=>`<td><input type="number" min="0" class="num" data-mq="${f.id}" value="0" aria-label="Cantidad ${f.et}"></td>`).join("")}<td class="num"><b id="my-n">0 cilindros</b></td></tr>
      </tbody></table></div>
      <label class="radio" style="margin:4px 0"><input type="checkbox" id="my-canje" checked> El cliente entrega vacíos a cambio</label>
      <label>Observación<input id="my-obs" placeholder="Ej: guía N° 1234"></label>
      <div class="acc"><button class="btn" type="submit">Grabar venta mayorista</button></div>
      <p class="nota" style="margin:0">El precio y el total se ven en la Rendición mayorista. Si no entrega vacíos, los envases quedan prestados.</p></form>
    <h3 style="margin:24px 0 12px">${fe===hoyStr()?"Ventas mayoristas de hoy":"Ventas mayoristas del "+fF(fe)}</h3>
    <div class="tabla-wrap"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Cilindros</th><th>Observación</th><th>Usuario</th><th></th></tr></thead><tbody>
    ${del.map(x=>`<tr style="${x.anulada?"text-decoration:line-through;color:var(--mu)":""}"><td class="num">${esc(x.hora||"")}</td><td><b>${esc((cliMay(x.mayorista)||{}).nombre||"")}</b></td><td>${cilTxt(x.venta)}${x.canje===false?' <span class="nota" style="margin:0">· envases prestados</span>':""}</td>
      <td>${esc(x.guia||"")}</td><td>${esc(x.user||"")}</td>
      <td>${x.anulada?"Anulada":`<button class="btn chico linea" type="button" data-anmay="${x.k}">Anular</button>`}</td></tr>`).join("")||`<tr><td colspan="6">${fe===hoyStr()?"Hoy aún no hay ventas mayoristas.":"No hay ventas mayoristas ese día."}</td></tr>`}
    </tbody></table></div></fieldset>`;
};

L.mayorista=function(){
  $$("[data-maytab]").forEach(b=>b.onclick=()=>{const k=b.dataset.maytab;if(k==="rend"){ir("cuadratura");cuadTab="mayorista";cuadSel=null;if(mayFecha)fechaCuad=mayFecha;pintarSistema();return}mayTab=k;pintarSistema()});
  $$("[data-ircfg]").forEach(b=>b.onclick=()=>{cfgTab=b.dataset.ircfg;ir("config")});
  if(mayTab==="cuenta"){
    const fa=$("#f-abono");if(!fa)return;
    const muestra=()=>{const m=cliMay(+$("#ab-cli").value);$("#ab-saldo").textContent=m?`Saldo actual de ${m.nombre}: ${clp(cuentaMay(m).saldo)}`:""};$("#ab-cli").onchange=muestra;
    fa.onsubmit=e=>{e.preventDefault();const id=+$("#ab-cli").value,monto=Math.round(+$("#ab-monto").value||0),fecha=$("#ab-fecha").value||hoyStr(),m=cliMay(id);
      if(!m||monto<=0){aviso("Faltan datos","Elija el cliente y escriba el monto.");return}
      if(!puedeEditarFecha(fecha)){aviso("Día cerrado","Solo un administrador puede registrar abonos en días anteriores.");return}
      const r=getRendMayV(id,fecha,null,true),med=$("#ab-medio").value,det=$("#ab-det").value.trim();
      r.pagos.push({por:porMi(),id:nuevoId(r.pagos),tipo:med,monto,detalle:["Abono",det].filter(Boolean).join(" · "),hora:ahora(),abono:true,campos:{}});
      nubeGuardar("rendiciones",r);log("cuadratura","Abono mayorista",`${m.nombre} · ${TIPOS_PAGO[med]} ${clp(monto)}`);guardar();pintarSistema();aviso("Abono registrado",`${m.nombre}: ${clp(monto)}. Saldo ahora: ${clp(cuentaMay(m).saldo)}.`)};
    $$("[data-vermov]").forEach(b=>b.onclick=()=>{mayFiltro.cli=b.dataset.vermov;pintarSistema();setTimeout(()=>{const t=$("#mv-cli");if(t)t.scrollIntoView({block:"start"})},50)});
    $("#mv-cli").onchange=e=>{mayFiltro.cli=e.target.value;pintarSistema()};
    $("#mv-d1").onchange=e=>{mayFiltro.d1=e.target.value;pintarSistema()};$("#mv-d2").onchange=e=>{mayFiltro.d2=e.target.value;pintarSistema()};
    return}
  const fm=$("#f-may");if(!fm)return;
  const leerQ=()=>{const o=st();FORMATOS.forEach(f=>{const i=$(`[data-mq="${f.id}"]`);o[f.id]=i?Math.max(0,Math.floor(+i.value||0)):0});return o};
  const tot=()=>{const q=leerQ(),n=FORMATOS.reduce((a,f)=>a+q[f.id],0);$("#my-n").textContent=n+" cilindro"+(n===1?"":"s")};
  $$("[data-mq]").forEach(i=>i.oninput=tot);
  $("#my-cli").onchange=e=>{mayCli=+e.target.value||null};
  $("#my-fecha").onchange=e=>{mayFecha=e.target.value||null;pintarSistema()};
  fm.onsubmit=e=>{e.preventDefault();const c=cliMay(+$("#my-cli").value);if(!c){aviso("Falta el cliente","Selecciona el cliente mayorista.");return}
    const fecha=$("#my-fecha").value||hoyStr();if(!puedeEditarFecha(fecha)){aviso("Día cerrado","Solo un administrador puede grabar ventas en días anteriores.");return}
    const venta=leerQ();if(!FORMATOS.some(f=>venta[f.id])){aviso("Faltan cantidades","Ingresa al menos una cantidad.");return}
    const canje=$("#my-canje").checked,precios={};FORMATOS.forEach(f=>{if(venta[f.id])precios[f.id]=precioCliMay(c,f.id)});
    const x={k:Date.now(),local:suc,fecha,hora:ahora().slice(11),mayorista:c.id,guia:$("#my-obs").value.trim(),tb:"",chofer:null,
      venta,prestamo:canje?st():{...venta},devolucion:st(),precios,canje,user:yo.nombre};
    D.cargasDist.unshift(x);aplicarDist(x,1);nubeGuardar("cargasDist",x);syncRendMay(c.id,fecha);
    log("bodega","Venta mayorista",`${c.nombre} · ${cilTxt(venta)} · ${clp(valorDist(x))}`);mayCli=c.id;guardar();pintarSistema();aviso("Venta mayorista grabada",`${c.nombre}: ${cilTxt(venta)}. El precio y total se ven en su Rendición mayorista.`)};
  $$("[data-anmay]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=D.cargasDist.find(y=>String(y.k)===b.dataset.anmay);if(!x||x.anulada)return;
    x.anulada=true;aplicarDist(x,-1);nubeGuardar("cargasDist",x);syncRendMay(x.mayorista,x.fecha);
    log("bodega","Venta mayorista anulada",`${(cliMay(x.mayorista)||{}).nombre||""} · ${cilTxt(x.venta)} (los cilindros vuelven a bodega)`);guardar();pintarSistema()}));
};


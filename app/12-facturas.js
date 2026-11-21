/* MR Gas · Panel General · 12-facturas */
/* ===================== FACTURAS: pedidos donde el cliente pidió factura, y si ya se emitió ===================== */
IC.facturas=IC.factura;
let facTab="pend",facBusca="";
const facEst=p=>p.facturaEst&&p.facturaEst.estado==="emitida"?"emitida":"pendiente";
function facLista(){return (D.pedidos||[]).filter(p=>p.factura&&p.estado!=="anulado"&&misSucs().includes(p.local))
  .sort((a,b)=>String(b.fecha||"").localeCompare(String(a.fecha||"")))}

/* ===================== FACTURAS 2: facturas sin pedido + base de empresas (RUT) ===================== */
const rutLimpio=r=>String(r||"").replace(/[^0-9kK]/g,"").toUpperCase();
function empresaPorRut(r){const k=rutLimpio(r);return k?(D.empresas||[]).find(e=>rutLimpio(e.rut)===k):null}
function guardarEmpresa(o){if(!rutLimpio(o.rut)&&!o.razon)return null;D.empresas=D.empresas||[];let e=empresaPorRut(o.rut);
  if(!e){e={id:Date.now()+Math.floor(Math.random()*1000),rut:o.rut||"",razon:o.razon||"",giro:"",dir:"",comuna:"",email:"",fono:""};D.empresas.push(e)}
  ["rut","razon","giro","dir","comuna","email","fono"].forEach(k=>{if(o[k])e[k]=o[k]});return e}
/* las empresas de pedidos con factura pasan solas a la base */
function empresasDePedidos(){let n=0;(D.pedidos||[]).forEach(p=>{const f=p.factura;if(f&&rutLimpio(f.rut)&&!empresaPorRut(f.rut)){guardarEmpresa({rut:f.rut,razon:f.razon,giro:f.giro,dir:f.dir||p.dir,comuna:f.comuna||p.comuna,fono:p.fono});n++}});return n}
let facMes=null,facHist={k:"",ped:[],man:[]},facCargando=false;
function rangoMes(m){const [y,mm]=m.split("-").map(Number),fin=new Date(y,mm,0,12),ini=new Date(y,mm-1,1,12);ini.setDate(ini.getDate()-90);return [fechaISO(ini),fechaISO(fin)]}
async function cargarFacMes(){if(!NUBE.activo||facCargando||facHist.k===facMes)return;facCargando=true;const [d1,d2]=rangoMes(facMes);
  try{const j=await api("rango",null,`&cols=pedidos,facturas&desde=${d1}&hasta=${d2}`);const ped=[],man=[];(j.docs||[]).forEach(d=>{if(d.col==="pedidos")ped.push(d.data);else if(d.col==="facturas")man.push(d.data)});facHist={k:facMes,ped,man}}catch(e){facHist={k:facMes,ped:[],man:[]}}
  facCargando=false;if(mod==="facturas"&&facTab==="emit")pintarSistema()}
function facItems(){const idsP=new Set((D.pedidos||[]).map(p=>String(p.id))),idsF=new Set((D.facturas||[]).map(x=>String(x.id)));
  const pedH=facHist.ped.filter(p=>p&&p.factura&&p.estado!=="anulado"&&!idsP.has(String(p.id))&&misSucs().includes(p.local)),manH=facHist.man.filter(x=>x&&!idsF.has(String(x.id)));
  const ped=[...facLista(),...pedH].map(p=>({t:"ped",o:p,id:"p"+p.id,fecha:String(p.fecha||""),f:p.factura,total:totalP(p),cli:nomCli(p),det:(typeof resumenP==="function"?resumenP(p):""),ref:"Pedido N° "+p.id}));
  const man=[...(D.facturas||[]),...manH].filter(x=>misSucs().includes(x.local??suc)).map(x=>({t:"man",o:x,id:"m"+x.id,fecha:String(x.fecha||""),f:x,total:+x.total||0,cli:x.razon||"",det:x.detalle||"",ref:"Sin pedido"}));
  return [...ped,...man].sort((a,b)=>b.fecha.localeCompare(a.fecha))}
const facEst2=x=>x.o.facturaEst&&x.o.facturaEst.estado==="emitida"?"emitida":"pendiente";
let empBusca="",empEdit=null;
V.facturas=function(){const ed=!soloVer("facturas");if(ed&&empresasDePedidos())guardar();
  if(!facMes)facMes=hoyStr().slice(0,7);if(facTab==="todas")facTab="emit";if(facTab==="emit")cargarFacMes();
  const L=facItems(),pend=L.filter(x=>facEst2(x)==="pendiente"),emit=L.filter(x=>facEst2(x)==="emitida"),q=facBusca.trim().toLowerCase();
  const tabs=`<div class="tabs" role="tablist">${[["pend",`Por facturar (${pend.length})`],["emit","Facturadas"],["emp",`Empresas (${(D.empresas||[]).length})`]].map(([k,v])=>`<button type="button" role="tab" data-ftab="${k}" aria-selected="${facTab===k}">${v}</button>`).join("")}</div>`;
  const kpis=`<div class="kpis"><div class="kpi"><span>Por facturar</span><b class="num" style="color:${pend.length?"#d92d20":"inherit"}">${pend.length}</b></div><div class="kpi"><span>Monto por facturar</span><b class="num">${clp(pend.reduce((s,x)=>s+x.total,0))}</b></div><div class="kpi"><span>Facturadas</span><b class="num">${emit.length}</b></div></div>`;
  const acc=ed?`<button class="btn" type="button" id="fac-nueva">＋ Nueva factura</button>`:"";
  const busca=`<label class="fac-busca">Buscar<input id="fac-q" value="${esc(facBusca)}" placeholder="RUT, razón social, N° pedido…"></label>`;
  if(facTab==="emp"){
    const E=(D.empresas||[]).filter(e=>!q||[e.rut,e.razon,e.giro,e.comuna].join(" ").toLowerCase().includes(q)).sort((a,b)=>String(a.razon).localeCompare(String(b.razon)));
    const ee=empEdit!=null?(D.empresas||[]).find(e=>e.id===empEdit)||{}:null;
    const form=ed?`<form class="caja emp-form" id="f-emp2"><h3>${ee&&ee.id?"Editar empresa":"Agregar empresa"}</h3>
      <div class="emp-g"><label>RUT<input id="em-rut" required value="${esc((ee||{}).rut||"")}" placeholder="76.123.456-7"></label><label>Razón social<input id="em-razon" required value="${esc((ee||{}).razon||"")}"></label><label>Giro<input id="em-giro" value="${esc((ee||{}).giro||"")}"></label>
      <label>Dirección<input id="em-dir" value="${esc((ee||{}).dir||"")}"></label><label>Comuna<input id="em-comuna" list="lista-comunas2" value="${esc((ee||{}).comuna||"")}"></label><label>Correo<input id="em-email" type="email" value="${esc((ee||{}).email||"")}"></label><label>Teléfono<input id="em-fono" value="${esc((ee||{}).fono||"")}"></label></div>
      <datalist id="lista-comunas2">${(typeof COMUNAS!=="undefined"?COMUNAS:[]).map(c=>`<option value="${c}">`).join("")}</datalist>
      <div class="acc"><button class="btn" type="submit">${ee&&ee.id?"Guardar cambios":"Agregar empresa"}</button>${ee&&ee.id?'<button class="btn linea" type="button" id="em-cancel">Cancelar</button>':""}</div></form>`:"";
    return cabeza("Facturas",busca+acc)+kpis+tabs+form+`<div class="tabla-wrap"><table class="fac-t"><thead><tr><th>RUT</th><th>Razón social</th><th>Giro</th><th>Dirección</th><th>Contacto</th><th></th></tr></thead><tbody>
      ${E.map(e=>`<tr><td class="num"><b>${esc(e.rut)}</b></td><td><b>${esc(e.razon)}</b></td><td>${esc(e.giro||"")}</td><td>${esc([e.dir,e.comuna].filter(Boolean).join(", "))}</td><td>${esc([e.email,e.fono].filter(Boolean).join(" · "))}</td>
        <td class="fac-acc">${e.rut?`<button class="btn chico fac-rut" type="button" data-rutc="${esc(e.rut)}" title="Copiar el RUT para pegarlo en el SII">⧉ Copiar RUT</button>`:""}<button class="btn chico linea" type="button" data-ecopiar="${e.id}">⧉ Copiar</button>${ed?`<button class="btn chico linea" type="button" data-efac="${e.id}">＋ Factura</button><button class="btn chico linea" type="button" data-eedit="${e.id}">Editar</button><button class="x-rojo" type="button" data-edel="${e.id}" aria-label="Eliminar ${esc(e.razon)}">✕</button>`:""}</td></tr>`).join("")||'<tr><td colspan="6" class="vacio">Todavía no hay empresas. Agregue la primera arriba; también se agregan solas al facturar.</td></tr>'}
      </tbody></table></div>`}
  const delMes=emit.filter(x=>String((x.o.facturaEst||{}).fecha||"").slice(0,7)===facMes);
  let ver=facTab==="pend"?pend:delMes;
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],[fy,fm]=facMes.split("-").map(Number);
  const mesBar=facTab==="emit"?`<div class="fac-mes"><button class="btn chico linea" type="button" data-fmes="-1" aria-label="Mes anterior">←</button><b>${MESES[fm-1]} ${fy}</b><button class="btn chico linea" type="button" data-fmes="1" aria-label="Mes siguiente" ${facMes>=hoyStr().slice(0,7)?"disabled":""}>→</button>
    <input type="month" id="fac-mesi" value="${facMes}" max="${hoyStr().slice(0,7)}"><span class="nota" style="margin:0 0 0 auto">${delMes.length} factura${delMes.length===1?"":"s"} · <b>${clp(delMes.reduce((s,x)=>s+x.total,0))}</b>${facCargando?" · cargando…":""}</span></div>`:"";
  if(q)ver=ver.filter(x=>[x.ref,x.cli,x.f.rut,x.f.razon,(x.o.facturaEst||{}).num,x.det].join(" ").toLowerCase().includes(q));
  const fila=x=>{const f=x.f,e=x.o.facturaEst||{},em=facEst2(x)==="emitida";
    return `<tr><td class="num"><b>${esc(x.ref)}</b><br><span class="nota" style="margin:0">${esc(fF(x.fecha.slice(0,10)))}</span></td>
      <td><b>${esc(f.razon||"Sin razón social")}</b><br><span class="nota" style="margin:0">RUT ${esc(f.rut||"—")}${f.giro?" · "+esc(f.giro):""}</span></td>
      <td>${esc(x.det||"")}${x.t==="ped"?`<br><span class="nota" style="margin:0">${esc(x.cli)}</span>`:""}</td>
      <td class="der num">${clp(x.total)}</td>
      <td>${em?`<span class="pill entregado">Facturada</span><br><span class="nota" style="margin:0">N° ${esc(e.num||"—")} · ${esc(fF(String(e.fecha||"").slice(0,10)))}${e.por?" · "+esc(e.por):""}</span>`:'<span class="pill bajo">Por facturar</span>'}</td>
      <td class="fac-acc">${f.rut?`<button class="btn chico fac-rut" type="button" data-rutc="${esc(f.rut)}" title="Copiar el RUT para pegarlo en el SII">⧉ Copiar RUT</button>`:""}<button class="btn chico linea" type="button" data-fcop="${x.id}">⧉ Copiar datos</button>
        ${ed?(em?`<button class="btn chico linea" type="button" data-fdes="${x.id}">Deshacer</button>`:`<button class="btn chico" type="button" data-femi="${x.id}">Marcar facturada</button>`):""}${ed&&x.t==="man"?`<button class="x-rojo" type="button" data-fdel="${x.id}" aria-label="Eliminar factura">✕</button>`:""}</td></tr>`};
  return cabeza("Facturas",busca+acc)+kpis+tabs+mesBar+`<div class="tabla-wrap"><table class="fac-t"><thead><tr><th>Origen</th><th>Datos de facturación</th><th>Detalle</th><th class="der">Total</th><th>Factura</th><th></th></tr></thead><tbody>
    ${ver.map(fila).join("")||`<tr><td colspan="6" class="vacio">${facTab==="pend"?"No hay facturas pendientes. ¡Todo al día!":"No hay facturas emitidas en este mes."}</td></tr>`}</tbody></table></div>
    <p class="nota">Aparecen los pedidos con <b>«Solicita factura»</b> y las facturas agregadas aquí con <b>«Nueva factura»</b>. Las por facturar quedan siempre a la vista hasta marcarlas como facturadas.</p>`};
function dlNuevaFactura(pre){let dl=document.getElementById("dl-nfac");if(!dl){dl=document.createElement("dialog");dl.id="dl-nfac";dl.className="dl-estado";document.body.appendChild(dl)}
  const e=pre||{};
  dl.innerHTML=`<form><h3 style="margin:0 0 4px">Nueva factura</h3><p class="nota" style="margin:0 0 10px">Para ventas que no pasaron por Pedidos. Escriba el RUT o elija una empresa de la base: los datos se completan solos.</p>
    <div class="emp-g"><label>RUT<input id="nf-rut" list="nf-emps" required value="${esc(e.rut||"")}" placeholder="76.123.456-7" autocomplete="off"></label><label>Razón social<input id="nf-razon" required value="${esc(e.razon||"")}"></label><label>Giro<input id="nf-giro" value="${esc(e.giro||"")}"></label>
    <label>Dirección<input id="nf-dir" value="${esc(e.dir||"")}"></label><label>Comuna<input id="nf-comuna" value="${esc(e.comuna||"")}"></label><label>Correo<input id="nf-email" type="email" value="${esc(e.email||"")}"></label>
    <label class="g2">Detalle<input id="nf-det" placeholder="Ej: 4 cilindros 15 kg, venta en local"></label><label>Total (CLP)<input id="nf-total" type="number" min="0" class="num" required></label><label>Fecha<input id="nf-fecha" type="date" value="${hoyStr()}"></label></div>
    <datalist id="nf-emps">${(D.empresas||[]).map(x=>`<option value="${esc(x.rut)}">${esc(x.razon)}</option>`).join("")}</datalist>
    <div class="nf-ya"><label class="radio"><input type="checkbox" id="nf-ya"> Ya está facturada</label><label>N° de factura<input id="nf-num" disabled placeholder="Ej: 1234"></label></div>
    <p class="error" id="nf-err" hidden></p>
    <div class="acc" style="margin-top:12px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar factura</button></div></form>`;
  dl.showModal();dl.querySelector("[data-cerrar]").onclick=()=>dl.close();
  const g=id=>dl.querySelector(id),llenar=()=>{const x=empresaPorRut(g("#nf-rut").value);if(!x)return;[["razon","#nf-razon"],["giro","#nf-giro"],["dir","#nf-dir"],["comuna","#nf-comuna"],["email","#nf-email"]].forEach(([k,s])=>{if(x[k])g(s).value=x[k]});g("#nf-rut").value=x.rut};
  g("#nf-rut").oninput=llenar;g("#nf-rut").onchange=llenar;g("#nf-ya").onchange=()=>{g("#nf-num").disabled=!g("#nf-ya").checked;if(g("#nf-ya").checked)g("#nf-num").focus()};
  setTimeout(()=>g(e.rut?"#nf-det":"#nf-rut").focus(),50);
  dl.querySelector("form").onsubmit=ev=>{ev.preventDefault();const v=id=>g(id).value.trim(),er=g("#nf-err");er.hidden=true;
    if(g("#nf-ya").checked&&!v("#nf-num")){er.textContent="Escriba el N° de la factura.";er.hidden=false;return}
    D.facturas=D.facturas||[];
    const f={id:Date.now(),local:suc,fecha:(v("#nf-fecha")||hoyStr())+" "+ahora().slice(11),rut:v("#nf-rut"),razon:v("#nf-razon"),giro:v("#nf-giro"),dir:v("#nf-dir"),comuna:v("#nf-comuna"),email:v("#nf-email"),
      detalle:v("#nf-det"),total:Math.max(0,Math.round(+v("#nf-total")||0)),por:yo.nombre,facturaEst:g("#nf-ya").checked?{estado:"emitida",num:v("#nf-num"),fecha:ahora(),por:yo.nombre}:null};
    D.facturas.unshift(f);guardarEmpresa(f);
    log("pedidos","Factura agregada",`${f.razon} · RUT ${f.rut} · ${clp(f.total)}${f.facturaEst?" · N° "+f.facturaEst.num:" · por facturar"}`,{local:suc});guardar();dl.close();
    facTab=f.facturaEst?"emit":"pend";pintarSistema();aviso("Factura guardada",`${f.razon}: ${clp(f.total)}.`)}}
L.facturas=function(){
  $$("[data-ftab]").forEach(b=>b.onclick=()=>{facTab=b.dataset.ftab;empEdit=null;pintarSistema()});
  const q=$("#fac-q");if(q){q.oninput=()=>{facBusca=q.value;const pos=q.selectionStart;pintarSistema();const n=$("#fac-q");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}}
  const nb=$("#fac-nueva");if(nb)nb.onclick=()=>dlNuevaFactura();
  $$("[data-fmes]").forEach(b=>b.onclick=()=>{const [y,m]=facMes.split("-").map(Number),d=new Date(y,m-1+(+b.dataset.fmes),1,12);facMes=fechaISO(d).slice(0,7);pintarSistema()});
  const mi=$("#fac-mesi");if(mi)mi.onchange=()=>{if(mi.value){facMes=mi.value;pintarSistema()}};
  const X=id=>facItems().find(x=>x.id===id);
  const copiar=(f,extra)=>{const txt=[`Razón social: ${f.razon||""}`,`RUT: ${f.rut||""}`,`Giro: ${f.giro||""}`,`Dirección: ${[f.dir,f.comuna].filter(Boolean).join(", ")}`,f.email?`Correo: ${f.email}`:"",extra||""].filter(Boolean).join("\n");
    (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>aviso("Datos copiados","Péguelos en el sistema de facturación."),()=>aviso("Datos de la factura",txt.replace(/\n/g," · ")))};
  $$("[data-fcop]").forEach(b=>b.onclick=()=>{const x=X(b.dataset.fcop);if(x)copiar({...x.f,dir:x.f.dir||(x.t==="ped"?x.o.dir:""),comuna:x.f.comuna||(x.t==="ped"?x.o.comuna:"")},`${x.ref}${x.det?" · "+x.det:""} · Total ${clp(x.total)}`)});
  $$("[data-femi]").forEach(b=>b.onclick=()=>{const x=X(b.dataset.femi);if(!x)return;
    let dl=document.getElementById("dl-fac");if(!dl){dl=document.createElement("dialog");dl.id="dl-fac";dl.className="dl-estado";document.body.appendChild(dl)}
    dl.innerHTML=`<form><h3 style="margin:0 0 4px">Marcar como facturada</h3><p class="nota" style="margin:0 0 10px">${esc(x.ref)} · ${esc(x.f.razon||x.cli)} · ${clp(x.total)}</p>
      <label>N° de factura<input id="fac-num" required autocomplete="off" placeholder="Ej: 1234"></label>
      <div class="acc" style="margin-top:12px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar</button></div></form>`;
    dl.showModal();dl.querySelector("[data-cerrar]").onclick=()=>dl.close();setTimeout(()=>{const i=$("#fac-num");if(i)i.focus()},50);
    dl.querySelector("form").onsubmit=e=>{e.preventDefault();const num=$("#fac-num").value.trim();if(!num)return;
      x.o.facturaEst={estado:"emitida",num,fecha:ahora(),por:yo.nombre};guardarEmpresa(x.f);
      log("pedidos","Factura emitida",`${x.ref} · ${x.f.razon||x.cli} · Factura N° ${num}`,{local:x.o.local,pedido:x.t==="ped"?x.o.id:undefined});guardar();dl.close();pintarSistema();aviso("Factura registrada",`${x.ref} quedó facturado (N° ${num}).`)}});
  $$("[data-fdes]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=X(b.dataset.fdes);if(!x)return;const n=(x.o.facturaEst||{}).num;x.o.facturaEst=null;
    log("pedidos","Factura deshecha",`${x.ref} · vuelve a «por facturar»${n?" (era N° "+n+")":""}`,{local:x.o.local});guardar();pintarSistema()}));
  $$("[data-fdel]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=X(b.dataset.fdel);if(!x)return;D.facturas=(D.facturas||[]).filter(y=>y!==x.o);
    log("pedidos","Factura eliminada",`${x.f.razon} · ${clp(x.total)}`,{local:x.o.local});guardar();pintarSistema()}));
  // empresas
  const E=id=>(D.empresas||[]).find(e=>String(e.id)===String(id));
  $$("[data-ecopiar]").forEach(b=>b.onclick=()=>{const e=E(b.dataset.ecopiar);if(e)copiar(e)});
  $$("[data-efac]").forEach(b=>b.onclick=()=>{const e=E(b.dataset.efac);if(e)dlNuevaFactura(e)});
  $$("[data-eedit]").forEach(b=>b.onclick=()=>{empEdit=+b.dataset.eedit;pintarSistema();window.scrollTo(0,0)});
  $$("[data-edel]").forEach(b=>b.onclick=()=>confirmar(b,()=>{D.empresas=(D.empresas||[]).filter(e=>String(e.id)!==b.dataset.edel);guardar();pintarSistema()}));
  const c=$("#em-cancel");if(c)c.onclick=()=>{empEdit=null;pintarSistema()};
  const fe=$("#f-emp2");if(fe)fe.onsubmit=ev=>{ev.preventDefault();const v=id=>$(id).value.trim();
    const o={rut:v("#em-rut"),razon:v("#em-razon"),giro:v("#em-giro"),dir:v("#em-dir"),comuna:v("#em-comuna"),email:v("#em-email"),fono:v("#em-fono")};
    if(empEdit!=null){const e=E(empEdit);if(e)Object.assign(e,o)}else{if(empresaPorRut(o.rut)){aviso("Ya existe","Esa empresa ya está en la base: se actualizaron sus datos.")}guardarEmpresa(o)}
    empEdit=null;guardar();pintarSistema()}};
/* Pedidos de Gas: el RUT de «Solicita factura» se completa desde la base de empresas */
{const lp=L.pedidos;L.pedidos=function(){const r=lp?lp.apply(this,arguments):undefined;
  try{const rut=$("#np-rut");if(rut&&!document.getElementById("np-emps")){rut.setAttribute("list","np-emps");rut.setAttribute("autocomplete","off");
    rut.insertAdjacentHTML("afterend",`<datalist id="np-emps">${(D.empresas||[]).map(x=>`<option value="${esc(x.rut)}">${esc(x.razon)}</option>`).join("")}</datalist>`);
    const llenar=()=>{const x=empresaPorRut(rut.value);if(!x)return;[["razon","#np-razon"],["giro","#np-giro"],["dir","#np-fdir"],["comuna","#np-fcomuna"]].forEach(([k,s])=>{const i=$(s);if(i&&x[k])i.value=x[k]});rut.value=x.rut};
    rut.addEventListener("input",llenar);rut.addEventListener("change",llenar)}}catch(e){}
  return r}}

/* Facturas desactivada: sin «Solicita factura» en Pedidos de Gas */
{const lp=L.pedidos;L.pedidos=function(){const r=lp?lp.apply(this,arguments):undefined;
  try{if(D.precios&&D.precios.sinFacturas){const c=$("#np-factura");if(c){c.checked=false;const l=c.closest("label");if(l)l.hidden=true;const f=$("#np-fact");if(f)f.hidden=true}}}catch(e){}
  return r}}

/* Copiar RUT para el SII (sin puntos y con guion: 76123456-7). Al pegarlo, el SII completa los datos del cliente. */
const rutSii=r=>{const s=String(r||"").replace(/[^0-9kK]/g,"").toUpperCase();return s.length>1?s.slice(0,-1)+"-"+s.slice(-1):s};
document.addEventListener("click",e=>{const b=e.target.closest("[data-rutc]");if(!b)return;const r=rutSii(b.dataset.rutc);
  (navigator.clipboard?navigator.clipboard.writeText(r):Promise.reject()).then(()=>{const t0=b.textContent;b.textContent="✓ Copiado "+r;b.classList.add("ok");setTimeout(()=>{b.textContent=t0;b.classList.remove("ok")},1800)},()=>aviso("RUT",r))});


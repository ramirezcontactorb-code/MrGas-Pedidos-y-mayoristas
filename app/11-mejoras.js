/* MR Gas · Panel General · 11-mejoras */
/* ===== Asigna Ruta: botón «Ver mapa» con los pedidos (se abre solo cuando se necesita) ===== */
let MR={x:0,y:0,s:.05,sel:null,ver:{pendiente:true,ruta:true},puntos:[],sin:0};
function abrirMapaRuta(){
  let dl=document.getElementById("dl-mapa");if(!dl){dl=document.createElement("dialog");dl.id="dl-mapa";document.body.appendChild(dl)}
  dl.innerHTML=`<div class="mr-cab"><b>Mapa de pedidos</b>
    <label class="mr-f"><input type="checkbox" data-mrf="pendiente" ${MR.ver.pendiente?"checked":""}><i class="mr-d pend"></i>Por despachar <span id="mr-np"></span></label>
    <label class="mr-f"><input type="checkbox" data-mrf="ruta" ${MR.ver.ruta?"checked":""}><i class="mr-d ruta"></i>En ruta <span id="mr-nr"></span></label>
    <span class="mr-sin" id="mr-sin"></span><span style="flex:1"></span>
    <button class="btn chico linea" type="button" id="mr-centrar">Ver todos</button><button class="btn chico" type="button" id="mr-cerrar">Cerrar</button></div>
    <div class="mr-cuerpo"><canvas id="mr-cv"></canvas><div class="mr-zoom"><button type="button" data-mrz="1.4" aria-label="Acercar">+</button><button type="button" data-mrz="0.7" aria-label="Alejar">−</button></div>
    <div class="mr-info" id="mr-info" hidden></div><div class="mr-carga" id="mr-carga">Cargando mapa de calles…</div></div>
    <p class="mr-pie">Arrastre para mover · rueda o botones para acercar · clic en un punto para ver el pedido · Calles © OpenStreetMap</p>`;
  dl.showModal();
  dl.querySelector("#mr-cerrar").onclick=()=>dl.close();
  dl.onclick=e=>{if(e.target===dl)dl.close()};
  $$("[data-mrf]").forEach(c=>c.onchange=()=>{MR.ver[c.dataset.mrf]=c.checked;MR.sel=null;dibujarMapaRuta()});
  dl.querySelector("#mr-centrar").onclick=()=>{centrarMapaRuta();dibujarMapaRuta()};
  $$("[data-mrz]").forEach(b=>b.onclick=()=>{MR.s*=+b.dataset.mrz;dibujarMapaRuta()});
  cargarCalles().then(()=>{const c=$("#mr-carga");if(c)c.remove();prepararMapaRuta();centrarMapaRuta();enlazarMapaRuta();dibujarMapaRuta()})
    .catch(()=>{const c=$("#mr-carga");if(c)c.textContent="No se pudo cargar el mapa de calles."})}
function prepararMapaRuta(){
  const ps=pedidosSuc().filter(p=>p.estado==="pendiente"||p.estado==="ruta");let sin=0;
  MR.puntos=ps.map(p=>{const g=ubicar(p);if(!g){sin++;return null}const [x,y]=aMundo(g.lon,g.lat);return {p,x,y,conf:g.conf}}).filter(Boolean);MR.sin=sin}
function centrarMapaRuta(){const cv=$("#mr-cv");if(!cv)return;const P=MR.puntos.filter(q=>MR.ver[q.p.estado]);
  let pts=P.length?P:MR.puntos;if(!pts.length){const l=loc(suc),g=l&&GEO_RM[l.comuna]||[-33.45,-70.66],[x,y]=aMundo(g[1],g[0]);MR.x=x;MR.y=y;MR.s=.06;return}
  const xs=pts.map(q=>q.x),ys=pts.map(q=>q.y),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys);
  MR.x=(a+b)/2;MR.y=(c+d)/2;const W=cv.clientWidth||900,H=cv.clientHeight||500;MR.s=Math.min(.25,Math.min((W-120)/Math.max(400,b-a),(H-120)/Math.max(400,d-c)))}
function dibujarMapaRuta(){const cv=$("#mr-cv");if(!cv||!CALLES)return;const dpr=devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);const g=cv.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);
  const P=(x,y)=>[(x-MR.x)*MR.s+W/2,(y-MR.y)*MR.s+H/2],m=40/MR.s,vx0=MR.x-W/2/MR.s-m,vx1=MR.x+W/2/MR.s+m,vy0=MR.y-H/2/MR.s-m,vy1=MR.y+H/2/MR.s+m;
  const vis=bb=>!(bb[2]<vx0||bb[0]>vx1||bb[3]<vy0||bb[1]>vy1);
  g.fillStyle="#f4f6f9";g.fillRect(0,0,W,H);
  CALLES.comunas.forEach(c=>{if(!vis(c.bb))return;g.beginPath();c.pp.forEach(p=>p.forEach(([x,y],i)=>{const [a,b]=P(x,y);i?g.lineTo(a,b):g.moveTo(a,b)}));g.fillStyle="#fff";g.fill();g.strokeStyle="#c9ced6";g.lineWidth=1.2;g.stroke()});
  const maxCl=MR.s>.12?6:MR.s>.05?5:MR.s>.025?3:2;
  for(const cl of [6,5,4,3,2,1]){if(cl>maxCl)continue;g.beginPath();
    for(const c of CALLES.calles){if(c.cl!==cl||!vis(c.bb))continue;c.pts.forEach(([x,y],i)=>{const [a,b]=P(x,y);i?g.lineTo(a,b):g.moveTo(a,b)})}
    g.strokeStyle=cl<=2?"#f5c26b":cl<=4?"#e3d3a6":"#dfe3ea";g.lineWidth=cl<=2?3:cl<=4?2:1.2;g.stroke()}
  g.font="600 12px system-ui,sans-serif";g.textAlign="center";g.fillStyle="#98a2b3";
  CALLES.comunas.forEach(c=>{if(!vis(c.bb))return;const cx=(c.bb[0]+c.bb[2])/2,cy=(c.bb[1]+c.bb[3])/2,[a,b]=P(cx,cy);if((c.bb[2]-c.bb[0])*MR.s>70)g.fillText(c.n,a,b)});
  const vis2=MR.puntos.filter(q=>MR.ver[q.p.estado]);
  vis2.forEach(q=>{const [a,b]=P(q.x,q.y),r=q===MR.sel?17:14,esp=(Date.now()-new Date(String(q.p.fecha).replace(" ","T")).getTime())/36e5;
    const col=q.p.estado==="ruta"?"#1d4ed8":esp>=3?"#d92d20":"#f79009";
    g.beginPath();g.arc(a,b,r,0,7);g.fillStyle=col;g.fill();g.lineWidth=q===MR.sel?3:2;g.strokeStyle="#fff";g.stroke();
    g.fillStyle="#fff";g.font="700 9px system-ui,sans-serif";g.fillText(String(q.p.id).slice(-4),a,b+3.2)});
  const np=MR.puntos.filter(q=>q.p.estado==="pendiente").length,nr=MR.puntos.filter(q=>q.p.estado==="ruta").length;
  const e1=$("#mr-np"),e2=$("#mr-nr"),e3=$("#mr-sin");if(e1)e1.textContent="("+np+")";if(e2)e2.textContent="("+nr+")";if(e3)e3.textContent=MR.sin?MR.sin+" sin ubicar en el mapa":"";
  const inf=$("#mr-info");if(!inf)return;if(!MR.sel){inf.hidden=true;return}
  const p=MR.sel.p,[a,b]=P(MR.sel.x,MR.sel.y);inf.hidden=false;
  inf.innerHTML=`<b>N° ${esc(p.id)}</b> <span class="mr-est ${p.estado}">${p.estado==="ruta"?"En ruta · "+esc(nomChofer(p.chofer)):"Por despachar"}</span><br>${esc(p.dir||"")}<br><span class="gris">${esc((p.fono||"")+" · "+String(p.fecha||"").slice(11,16))}</span><br>${items(p).map(i=>i.cant+" × "+esc(fmt(i.formato).et)).join(", ")} · <b>${clp(totalP(p))}</b>${MR.sel.conf==="calle"||MR.sel.conf==="comuna"?'<br><span class="gris">Ubicación aproximada (solo por la calle)</span>':""}`;
  inf.style.left=Math.min(W-250,Math.max(8,a+16))+"px";inf.style.top=Math.min(H-120,Math.max(8,b-20))+"px"}
function enlazarMapaRuta(){const cv=$("#mr-cv");if(!cv||cv.dataset.ok)return;cv.dataset.ok=1;let arr=null,mov=false;
  cv.onpointerdown=e=>{arr={x:e.clientX,y:e.clientY,mx:MR.x,my:MR.y};mov=false;cv.setPointerCapture(e.pointerId)};
  cv.onpointermove=e=>{if(!arr)return;const dx=e.clientX-arr.x,dy=e.clientY-arr.y;if(Math.abs(dx)+Math.abs(dy)>4)mov=true;if(mov){MR.x=arr.mx-dx/MR.s;MR.y=arr.my-dy/MR.s;dibujarMapaRuta()}};
  cv.onpointerup=e=>{const r=cv.getBoundingClientRect();if(!mov){const px=e.clientX-r.left,py=e.clientY-r.top,W=cv.clientWidth,H=cv.clientHeight;let best=null,bd=20;
      MR.puntos.filter(q=>MR.ver[q.p.estado]).forEach(q=>{const a=(q.x-MR.x)*MR.s+W/2,b=(q.y-MR.y)*MR.s+H/2,d=Math.hypot(a-px,b-py);if(d<bd){bd=d;best=q}});MR.sel=best;dibujarMapaRuta()}arr=null};
  cv.onwheel=e=>{e.preventDefault();const r=cv.getBoundingClientRect(),W=cv.clientWidth,H=cv.clientHeight,px=e.clientX-r.left-W/2,py=e.clientY-r.top-H/2,f=e.deltaY<0?1.2:1/1.2;
    const wx=MR.x+px/MR.s,wy=MR.y+py/MR.s;MR.s=Math.max(.004,Math.min(1.5,MR.s*f));MR.x=wx-px/MR.s;MR.y=wy-py/MR.s;dibujarMapaRuta()};
  addEventListener("resize",()=>{if(document.getElementById("dl-mapa")?.open)dibujarMapaRuta()})}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);
  try{if(mod==="ruta"&&!$("#rt-mapa")){const s=$("#rt-sectorizar");if(s)s.insertAdjacentHTML("afterend",' <button class="btn chico linea" id="rt-mapa" type="button">🗺 Ver mapa</button>');const b=$("#rt-mapa");if(b)b.onclick=abrirMapaRuta}
    const dl=document.getElementById("dl-mapa");if(dl&&dl.open&&CALLES){prepararMapaRuta();dibujarMapaRuta()}}catch(e){}
  return r}}

/* Rendición de choferes: precio chofer = Precio Domicilio y precio envase = Precio Envases (no se editan).
   La rendición de hoy toma siempre los precios vigentes; las de días pasados guardan los de ese día. */
{const g0=getRend;getRend=function(tipo,ref,fecha,crear){const r=g0.apply(this,arguments);
  try{if(r&&r.tipo==="movil"&&r.fecha===hoyStr()){FORMATOS.forEach(f=>{const v=D.precios[f.id];if(v!=null&&r.precios[f.id]!==v)r.precios[f.id]=v});
    if(r.envases){r.precioEnv=r.precioEnv||{};FORMATOS.forEach(f=>{const v=(D.preciosEnvase||{})[f.id]||0;if(r.precioEnv[f.id]!==v)r.precioEnv[f.id]=v})}}}catch(e){}
  return r}}

/* ===== Venta mayorista: cada venta se rinde por separado (como Venta Local) =====
   Una rendición por venta (r.venta = k de la venta). Los abonos y pagos sin venta van a la rendición del día sin venta.
   Las ventas antiguas que no tienen rendición propia siguen en la rendición del día (como antes). */
let mayVenta=null,mayVentaFija=false;
const rendDeVenta=x=>(D.rendiciones||[]).find(r=>r.tipo==="mayorista"&&r.venta!=null&&String(r.venta)===String(x.k));
function getRendMayV(mid,fecha,vk,crear){D.rendiciones=D.rendiciones||[];const key=vk==null?"":String(vk);
  let r=D.rendiciones.find(x=>x.tipo==="mayorista"&&x.ref===mid&&x.fecha===fecha&&String(x.venta??"")===key);
  if(!r&&crear){const base=preciosCliMay(mid),precios={},c=cliMay(mid);FORMATOS.forEach(f=>precios[f.id]=base[f.id]);
    r={id:nuevoId(D.rendiciones),tipo:"mayorista",ref:mid,venta:vk==null?null:vk,nombre:c?c.nombre:"",fecha,local:suc,guia:"",precios,ventas:st(),cargos:[],pagos:[],obs:"",usuario:yo.nombre,creada:ahora(),envases:st(),precioEnv:{...(D.preciosEnvase||{})}};
    D.rendiciones.push(r);syncRendMayV(r);nubeGuardar("rendiciones",r);guardar()}
  return r}
function syncRendMayV(r){if(!r||r.tipo!=="mayorista")return;let vs;
  if(r.venta!=null){const x=(D.cargasDist||[]).find(y=>String(y.k)===String(r.venta));vs=x&&!x.anulada?[x]:[];if(x){r.guia=r.guia||x.guia||"";FORMATOS.forEach(f=>{if((x.precios||{})[f.id]!=null)r.precios[f.id]=x.precios[f.id]});if(x.precioEnv)r.precioEnv={...r.precioEnv,...x.precioEnv}}}
  else vs=(D.cargasDist||[]).filter(x=>x.mayorista===r.ref&&x.fecha===r.fecha&&!x.anulada&&!rendDeVenta(x));
  const o=st(),e=st();let dcto=0;vs.forEach(x=>{dcto+=+x.dcto||0;FORMATOS.forEach(f=>{o[f.id]+=x.venta[f.id]||0;e[f.id]+=(x.env||{})[f.id]||0})});
  r.ventas=o;r.envases=e;r.pagos=r.pagos.filter(p=>p.auto!=="may");
  if(dcto>0)r.pagos.push({id:(r.pagos.reduce((m,p)=>Math.max(m,+p.id||0),0))+1,tipo:"descuento",monto:dcto,detalle:"Descuentos dados en Venta Mayorista",hora:ahora(),auto:"may"});
  nubeGuardar("rendiciones",r)}
syncRendMay=function(mid,fecha){(D.rendiciones||[]).filter(x=>x.tipo==="mayorista"&&x.ref===mid&&x.fecha===fecha).forEach(syncRendMayV)};
{const g0=getRend;getRend=function(tipo,ref,fecha,crear){if(tipo!=="mayorista")return g0.apply(this,arguments);return getRendMayV(ref,fecha,mayVenta,crear)}}
function ventasDiaMay(){return (D.cargasDist||[]).filter(x=>x.mayorista===mayCli&&x.fecha===fechaCuad&&!x.anulada).sort((a,b)=>(+a.k||0)-(+b.k||0))}
function elegirVentaMay(){const vs=ventasDiaMay();
  if(mayVentaFija&&(mayVenta==null||vs.some(x=>String(x.k)===String(mayVenta))))return;mayVentaFija=false;
  vs.forEach(x=>{if(!rendDeVenta(x))getRendMayV(mayCli,fechaCuad,x.k,true)});
  const S=saldosMay(mayCli),deb=vs.find(x=>{const r=rendDeVenta(x);return r&&(S.ef.get(r)||0)>0});mayVenta=deb?deb.k:vs.length?vs[vs.length-1].k:null}
function estadoVentaMay(x){const r=rendDeVenta(x);if(!r)return '<span class="pill ruta">Por rendir</span>';const sd=Math.round(calcRend(r).saldo);
  return sd<=0?'<span class="pill entregado">Pagada</span>':r.pagos.some(p=>!p.auto)?`<span class="pill bajo">Debe ${clp(sd)}</span>`:'<span class="pill ruta">Por rendir</span>'}
function barraVentasMay(){const vs=ventasDiaMay(),gen=getRendMayV(mayCli,fechaCuad,null,false),c=cliMay(mayCli),S=saldosMay(mayCli),cta=c?cuentaMay(c):{saldo:0};
  const pend=(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.ref===mayCli&&r.fecha<fechaCuad&&(S.ef.get(r)||0)>0);
  const chip=(k,t,sub,on,an)=>`<button type="button" class="mv-ch ${on?"on":""}" data-mvsel="${k}">${t}${sub?`<small>${sub}</small>`:""}</button>`;
  return `<div class="mv-bar"><span class="mv-lbl">VENTAS DE ${esc((c||{}).nombre||"").toUpperCase()} · ${fF(fechaCuad)}</span>
    ${vs.map((x,i)=>{const r=rendDeVenta(x),sd=r?(S.ef.get(r)??0):valorDist(x);return chip(x.k,`Rendición ${i+1} · ${esc(String(x.hora||"").slice(0,5))}`,sd<=0?((S.cubierto.get(r)||0)?"pagada con abono":"pagada"):"debe "+clp(sd),String(mayVenta)===String(x.k))}).join("")||'<span class="nota" style="margin:0">Sin ventas este día</span>'}
    ${gen&&(calcRend(gen).tarros>0)?chip("sin","Ventas antiguas del día",clp(calcRend(gen).saldo),mayVenta==null):""}
    <span class="mv-hist ${Math.round(cta.saldo)>0?"debe":Math.round(cta.saldo)<0?"favor":""}">Saldo histórico: <b>${Math.round(cta.saldo)>0?"debe "+clp(cta.saldo):Math.round(cta.saldo)<0?"a favor "+clp(-cta.saldo):"al día"}</b></span></div>
  ${pend.length?`<p class="nota mv-nota">Para pagar una deuda anterior, toque su fecha en «Deudas pendientes» y registre el pago en esa venta.</p>`:""}`}
{const l0=L.mayorista;L.mayorista=function(){l0.apply(this,arguments);if(mayTab!=="rend")return;
  $$("[data-mvsel]").forEach(b=>b.onclick=()=>{mayVenta=b.dataset.mvsel==="sin"?null:+b.dataset.mvsel;mayVentaFija=true;pintarSistema()});
  $$("[data-mvdeuda]").forEach(b=>b.onclick=()=>{const [f,v]=b.dataset.mvdeuda.split("|");fechaCuad=f;mayVenta=v===""?null:+v;mayVentaFija=true;pintarSistema()});
  const rs=$("#rd-sel");if(rs)rs.onchange=()=>{mayCli=+rs.value;mayVentaFija=false;pintarSistema()};
  const fc=$("#f-cuad");if(fc)fc.onchange=e=>{fechaCuad=e.target.value||hoyStr();mayVentaFija=false;pintarSistema()}}}
/* cuenta del cliente: suma de todas sus rendiciones + ventas antiguas sin rendición */
cuentaMay=function(m){const vs=(D.cargasDist||[]).filter(x=>x.mayorista===m.id&&!x.anulada),rs=(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.ref===m.id);
  let comp=0,pag=0,com=0,ult="";rs.forEach(r=>{const c=calcRend(r);comp+=c.venta+c.cargos;pag+=c.pagado;com+=c.com});
  vs.forEach(x=>{if(x.fecha>ult)ult=x.fecha;const cub=rendDeVenta(x)||rs.some(r=>r.venta==null&&r.fecha===x.fecha);if(!cub)comp+=valorDist(x)});
  return {m,comp,pag:pag+com,com,saldo:comp-pag-com,ult}};

/* ===== Mayoristas: la deuda se acumula en el saldo histórico y los abonos la van descontando =====
   Los abonos (y lo pagado de más) forman un crédito que se aplica a las ventas con deuda, de la más antigua a la más nueva. */
function saldosMay(mid){const rs=(D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.ref===mid).sort((a,b)=>(a.fecha+(a.creada||"")).localeCompare(b.fecha+(b.creada||"")));
  const raw=new Map(rs.map(r=>[r,Math.round(calcRend(r).saldo)]));let cred=0;raw.forEach(v=>{if(v<0)cred-=v});const ef=new Map(),cubierto=new Map();
  rs.forEach(r=>{const v=raw.get(r);if(v<=0){ef.set(r,0);return}const usa=Math.min(v,cred);cred-=usa;ef.set(r,v-usa);cubierto.set(r,usa)});
  const deuda=[...ef.values()].reduce((a,b)=>a+b,0);return {ef,cubierto,raw,credito:cred,deuda}}
function saldoEfMay(r){if(!r)return 0;const S=saldosMay(r.ref);return S.ef.has(r)?S.ef.get(r):Math.round(calcRend(r).saldo)}
estadoVentaMay=function(x){const r=rendDeVenta(x);if(!r)return '<span class="pill ruta">Por rendir</span>';const S=saldosMay(r.ref),sd=S.ef.get(r)??0,cub=S.cubierto.get(r)||0;
  if(sd<=0)return cub?'<span class="pill entregado" title="Pagada con abonos">Pagada (abono)</span>':'<span class="pill entregado">Pagada</span>';
  return r.pagos.some(p=>!p.auto)||cub?`<span class="pill bajo">Debe ${clp(sd)}</span>`:`<span class="pill ruta">Por rendir · ${clp(sd)}</span>`};

/* barra «Deudas pendientes» del mayorista: usa los saldos ya descontados con los abonos */
{const d0=deudasRend;deudasRend=function(r){if(r.tipo!=="mayorista")return d0(r);const S=saldosMay(r.ref),list=[];
  S.ef.forEach((v,x)=>{if(v>0&&x!==r&&x.fecha<r.fecha)list.push({f:x.fecha,orig:S.raw.get(x),pend:v})});list.sort((a,b)=>a.f.localeCompare(b.f));return {list,favor:S.credito}}}

/* Mayorista: saldo anterior = deudas no pagadas acumuladas en orden cronológico hasta antes de esta venta
   (días anteriores y ventas anteriores del mismo día, menos abonos). Saldo pendiente total = anterior + esta venta. */
const ordenRend=x=>x.fecha+"|"+(x.venta!=null?String(x.venta).padStart(16,"0"):"9".repeat(16))+"|"+(x.creada||"");
function saldoAntMay(r){const o=ordenRend(r);
  const rs=(D.rendiciones||[]).filter(x=>x.tipo==="mayorista"&&x.ref===r.ref&&x!==r&&ordenRend(x)<o);
  let t=rs.reduce((s,x)=>s+calcRend(x).saldo,0);
  (D.cargasDist||[]).filter(x=>x.mayorista===r.ref&&!x.anulada&&x.fecha<r.fecha&&!rendDeVenta(x)&&!(D.rendiciones||[]).some(y=>y.tipo==="mayorista"&&y.ref===r.ref&&y.venta==null&&y.fecha===x.fecha)).forEach(x=>t+=valorDist(x));
  return Math.round(t)}

function sinVentasMay(fechaSel){const c=cliMay(mayCli),S=saldosMay(mayCli),mays=(D.mayoristas||[]).filter(m=>(m.local??1)===suc).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const pend=[];S.ef.forEach((v,r)=>{if(v>0)pend.push(r)});pend.sort((a,b)=>ordenRend(a).localeCompare(ordenRend(b)));
  return cabeza("Rendición Mayorista",`<div class="acc" style="align-items:end">${fechaSel}<button class="btn linea" type="button" data-mytab="venta">← Volver a Venta Mayorista</button></div>`)+
  `<div class="mrbar"><div class="row"><span class="lbl">CLIENTE</span><select id="rd-sel" class="big">${mays.map(x=>`<option value="${x.id}" ${x.id===mayCli?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></div></div>
  <div class="caja" style="margin-top:10px"><p style="margin:0 0 8px"><b>${esc((c||{}).nombre||"")}</b> no tiene ventas el ${fF(fechaCuad)}.</p>
  ${pend.length?`<p class="nota" style="margin:0 0 6px">Deudas pendientes (toque una para rendirla):</p><div class="mv-bar" style="margin:0">${pend.map(r=>`<button type="button" class="mv-ch" data-mvdeuda="${r.fecha}|${r.venta??""}">${fF(r.fecha)}<small>debe ${clp(S.ef.get(r))}</small></button>`).join("")}</div>`:'<p class="nota" style="margin:0">No tiene deudas pendientes.</p>'}</div>`}

/* ===== Control de Bodega: stock de cada sucursal de Venta Local ===== */
async function stockSucursales(){const z=$("#bd-sucs");if(!z)return;
  try{const r=await fetch("local/api/docs.php?a=sucursales",{credentials:"same-origin",cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error);
    const sucs=j.list.filter(x=>x.activa!==false&&(x.bodega==null)).map(x=>x.nombre);const docs=await locLeer(sucs.map(n=>"suc/"+lslug(n)));if(!$("#bd-sucs"))return;
    const filas=sucs.map(n=>{const d=docs["suc/"+lslug(n)]||{},pr=d.products||[],ll={},va={},pe={};
      FORMATOS.forEach(f=>{const id=LID[f.id],p=pr.find(x=>x.id===id);ll[f.id]=p?(+p.stock||0):0;va[f.id]=+((d.vacios||{})[id]||0);pe[f.id]=+((d.prestados||{})[id]||0)});return {n,ll,va,pe,sin:!docs["suc/"+lslug(n)]}});
    const l=ensureLoc(loc(suc)),mat={n:l.nombre+" (Matriz)",ll:{...l.stock},va:{...l.vacios},pe:{...l.prestados},mz:1};
    const todas=[mat,...filas],tot=o=>FORMATOS.reduce((a,f)=>a+(+o[f.id]||0),0),min=D.precios.minimo||0;
    const suma=k=>{const o={};FORMATOS.forEach(f=>o[f.id]=todas.reduce((a,x)=>a+(+x[k][f.id]||0),0));return o};
    const T={ll:suma("ll"),va:suma("va"),pe:suma("pe")};
    {const gt=tot(T.ll)+tot(T.va)+tot(T.pe),k=$("#bd-kt-n");if(k)k.textContent=gt;
      FORMATOS.forEach(f=>{const c=document.querySelector(`[data-tt="${f.id}"] b`);if(c)c.textContent=(T.ll[f.id]||0)+(T.va[f.id]||0)+(T.pe[f.id]||0);
        [["bl","ll"],["bv","va"],["bp","pe"]].forEach(([a,k])=>{const e=document.querySelector(`[data-${a}="${f.id}"]`);if(!e)return;const v=T[k][f.id]||0,b=e.querySelector("b");if(b){b.textContent=v;b.classList.toggle("neg",v<0)}if(a==="bl")e.classList.toggle("bajo",!!min&&v<min)})});
      [["bd-k-ll","ll"],["bd-k-va","va"],["bd-k-pe","pe"]].forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.textContent=tot(T[k])});
      const tit=document.querySelector(".bd-bod h3");if(tit&&!tit.dataset.suma&&filas.length){tit.dataset.suma=1;tit.insertAdjacentHTML("beforeend",` <small class="nota" style="margin:0;font-weight:500">matriz + ${filas.length} sucursal${filas.length===1?"":"es"}</small>`)}
      const u=$("#bd-univ-t");if(u)u.innerHTML=!filas.length?`Stock total = bodega matriz (llenos + vacíos + prestados): <b class="num">${gt}</b>. Los camiones van aparte.`:`Llenos, vacíos y prestados = bodega matriz + ${filas.length} sucursal${filas.length===1?"":"es"} de Venta Local. Stock total: <b class="num">${gt}</b>. Los camiones van aparte.`}
    z.innerHTML=`<div class="bd-sh"><h3>Stock de cada sucursal</h3><span class="nota" style="margin:0">llenos por cilindro · vacíos y prestados en total</span><button class="btn chico linea" type="button" id="bd-sucs-rec">Actualizar</button></div>
    <div class="tabla-wrap"><table class="bd-st"><thead><tr><th>Sucursal</th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15":f.kg+" kg"}</th>`).join("")}<th class="c">Llenos</th><th class="c">Vacíos</th><th class="c">Prestados</th><th class="c">Total</th></tr></thead><tbody>
    ${todas.map(x=>`<tr class="${x.mz?"mz":""}"><td class="nom"${x.sin?' title="Todavía no tiene datos en Venta Local"':""}><b>${esc(x.n.replace(" (Matriz)",""))}</b>${x.mz?' <small class="nota" style="margin:0">matriz</small>':""}</td>${FORMATOS.map(f=>{const v=+x.ll[f.id]||0;return `<td class="c num ${min&&v<min&&!x.sin?"bajo":""}">${v}</td>`}).join("")}
      <td class="c num"><b>${tot(x.ll)}</b></td><td class="c num">${tot(x.va)}</td><td class="c num">${tot(x.pe)}</td><td class="c num"><b>${tot(x.ll)+tot(x.va)+tot(x.pe)}</b></td></tr>`).join("")}
    <tr class="tt"><td><b>Total empresa</b></td>${FORMATOS.map(f=>`<td class="c num"><b>${T.ll[f.id]}</b></td>`).join("")}<td class="c num"><b>${tot(T.ll)}</b></td><td class="c num"><b>${tot(T.va)}</b></td><td class="c num"><b>${tot(T.pe)}</b></td><td class="c num"><b>${tot(T.ll)+tot(T.va)+tot(T.pe)}</b></td></tr>
    </tbody></table></div>`;
    const b=$("#bd-sucs-rec");if(b)b.onclick=()=>{z.innerHTML='<p class="nota">Actualizando…</p>';stockSucursales()}}
  catch(e){z.innerHTML=`<p class="nota" style="margin:0">No se pudo leer el stock de las sucursales de Venta Local${e&&e.message?": "+esc(e.message):""}.</p>`}}
{const l0=L.bodega;L.bodega=function(){const r=l0.apply(this,arguments);
  try{if(false&&bTab==="stock"&&NUBE.activo&&(esAdmin()||(Array.isArray(yo.permisos)&&yo.permisos.includes("app.local")))&&!$("#bd-sucs")){
    const bod=document.querySelector(".bd-dos>.bd-bod"),ancla=bod||document.querySelector(".bd-dos");if(ancla){ancla.insertAdjacentHTML(bod?"beforeend":"afterend",'<section class="'+(bod?"bd-sucs-in":"caja")+'" id="bd-sucs"><p class="nota" style="margin:0">Cargando stock de las sucursales…</p></section>');stockSucursales()}}}catch(e){}
  return r}}

/* ===== Control de Bodega: editar el stock de la bodega ===== */
function editarStockBodega(){const l=ensureLoc(loc(suc));
  let dl=document.getElementById("dl-stock");if(!dl){dl=document.createElement("dialog");dl.id="dl-stock";dl.className="dl-estado";document.body.appendChild(dl)}
  const fila=(k,t)=>`<tr><td><b>${t}</b></td>${FORMATOS.map(f=>`<td><input type="number" class="num" data-es="${k}|${f.id}" value="${(l[k]||{})[f.id]||0}" aria-label="${t} ${f.et}"></td>`).join("")}</tr>`;
  dl.innerHTML=`<form><h3 style="margin:0 0 4px">Editar stock de bodega</h3><p class="nota" style="margin:0 0 10px">Escriba lo que hay realmente en la bodega. El cambio queda en Informes → Historial de bodega.</p>
    <div class="tabla-wrap"><table class="es-t"><thead><tr><th></th>${FORMATOS.map(f=>`<th class="c">${f.tipo==="h"?"H15":f.kg+" kg"}</th>`).join("")}</tr></thead><tbody>
    ${fila("stock","Llenos")}${fila("vacios","Vacíos")}${fila("prestados","Prestados")}</tbody></table></div>
    <p class="error" hidden></p><div class="acc" style="margin-top:12px;justify-content:flex-end"><button class="btn linea" type="button" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar stock</button></div></form>`;
  dl.showModal();dl.querySelector("[data-cerrar]").onclick=()=>dl.close();
  dl.querySelector("form").onsubmit=e=>{e.preventDefault();const cam=[];
    dl.querySelectorAll("[data-es]").forEach(i=>{const [k,id]=i.dataset.es.split("|"),v=Math.round(+i.value||0),a=(l[k]||{})[id]||0;
      if(v!==a){l[k]=l[k]||{};l[k][id]=v;cam.push(`${({stock:"llenos",vacios:"vacíos",prestados:"prestados"})[k]} ${fmt(id).et} ${a}→${v}`)}});
    if(!cam.length){dl.close();return aviso("Sin cambios","El stock quedó igual.")}
    log("bodega","Stock de bodega editado",cam.join(", "),{local:l.id});guardar();dl.close();pintarSistema();aviso("Stock guardado",`${cam.length} cambio(s) en el stock de bodega.`)}}
{const l0=L.bodega;L.bodega=function(){const r=l0.apply(this,arguments);
  try{if(bTab==="stock"&&!soloVer("bodega")){const h=document.querySelector(".bd-bod h3");if(h&&!document.getElementById("bd-editar")){
    h.insertAdjacentHTML("afterend",'<button class="btn chico linea" type="button" id="bd-editar">✎ Editar stock</button>');document.getElementById("bd-editar").onclick=editarStockBodega}}}catch(e){}
  return r}}

/* ===== Informes → Resumen: cuadros por canal y gráficos de barras ===== */
let resPer="7",resLocal=null,resLocalKey="",resCargando=false;
const LID2={"5":"c5","11":"c11","15":"c15","45":"c45","H15A":"h15a"};
async function cargarResLocal(){const [d1,d2]=rangoRes(),k=d1+"|"+d2;if(resCargando||resLocalKey===k||!NUBE.activo)return;resCargando=true;
  try{const r=await fetch(`local/api/docs.php?a=resumen&desde=${d1}&hasta=${d2}`,{credentials:"same-origin",cache:"no-store"});const j=await r.json();
    resLocal=r.ok?j.dias||{}:{error:j.error||"sin acceso"};}catch(e){resLocal={error:"sin conexión"}}resLocalKey=k;resCargando=false;if(mod==="informes"&&infTab==="resumen")pintarSistema()}
const RES_COL={local:"#1a66d6",chofer:"#12b76a",may:"#f79009"},RES_TXT={local:"Venta local",chofer:"Venta choferes",may:"Venta mayorista"};
function barrasDias(dias,porDia,canales){const W=760,H=230,pl=56,pb=26,pt=10,max=Math.max(1,...dias.map(d=>canales.reduce((s,k)=>s+porDia[d][k],0))),bw=(W-pl-10)/dias.length;
  const paso=Math.pow(10,Math.floor(Math.log10(max))),tope=Math.ceil(max/paso)*paso,y=v=>H-pb-(v/tope)*(H-pb-pt);
  let g="";for(let i=0;i<=4;i++){const v=tope*i/4,yy=y(v);g+=`<line x1="${pl}" x2="${W-6}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl-6}" y="${yy+4}" text-anchor="end" class="ax">${v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?Math.round(v/1e3)+"k":v}</text>`}
  const cada=Math.ceil(dias.length/12);
  dias.forEach((d,i)=>{let acc=0;const x=pl+i*bw+bw*.15,w=bw*.7;
    canales.forEach(k=>{const v=porDia[d][k];if(!v)return;const y1=y(acc+v),y0=y(acc);acc+=v;g+=`<rect x="${x}" y="${y1}" width="${w}" height="${Math.max(0,y0-y1)}" fill="${RES_COL[k]}" rx="2"><title>${fF(d)} · ${RES_TXT[k]}: ${clp(v)}</title></rect>`});
    if(i%cada===0)g+=`<text x="${x+w/2}" y="${H-8}" text-anchor="middle" class="ax">${d.slice(8,10)}/${d.slice(5,7)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" class="res-svg" role="img" aria-label="Ventas por día">${g}</svg>`}
{const v0=V.informes;V.informes=function(){if(infTab==="resumen")return vistaResumenInf();return v0.apply(this,arguments)}}


/* ===== Informes → Resumen (formato del informe de Venta Local, con local, choferes y mayoristas) ===== */
let resD1=null,resD2=null,resSucs={};
function rangoRes(){const h=hoyStr();if(!resD1){const d=new Date(h+"T12:00");d.setDate(d.getDate()-6);resD1=fechaISO(d);resD2=h}
  return [resD1,resD2&&resD2>=resD1?resD2:resD1]}
function resRango(k){const h=hoyStr(),d=new Date(h+"T12:00");
  if(k==="hoy"){resD1=resD2=h}else if(k==="7"){d.setDate(d.getDate()-6);resD1=fechaISO(d);resD2=h}
  else if(k==="mes"){resD1=h.slice(0,8)+"01";resD2=h}
  else{const a=new Date(d.getFullYear(),d.getMonth()-1,1,12),b=new Date(d.getFullYear(),d.getMonth(),0,12);resD1=fechaISO(a);resD2=fechaISO(b)}
  resLocal=null;pintarSistema()}
const kgF=id=>(FORMATOS.find(f=>f.id===id)||{kg:0}).kg;
function datosResumen2(){const [d1,d2]=rangoRes(),ids=misSucs(),dias=[];{const d=new Date(d1+"T12:00"),f=new Date(d2+"T12:00");while(d<=f&&dias.length<93){dias.push(fechaISO(d));d.setDate(d.getDate()+1)}}
  const z=n=>({n,venta:0,cil:0,kg:0,rend:0,carg:0,ops:0,f:Object.fromEntries(FORMATOS.map(f=>[f.id,0]))});
  const C={local:z("Venta local"),chofer:z("Venta choferes"),may:z("Venta mayorista")},porDia=Object.fromEntries(dias.map(d=>[d,{local:0,chofer:0,may:0}]));
  const ch={},my={},sl={},en=f=>f>=d1&&f<=d2;
  const suma=(o,id,q)=>{o.f[id]=(o.f[id]||0)+q;o.cil+=q;o.kg+=q*kgF(id)};
  const ADD=(o,id,q)=>{suma(o,id,q)};
  (D.rendiciones||[]).filter(r=>ids.includes(r.local)&&en(r.fecha)).forEach(r=>{const c=calcRend(r);
    if(r.tipo==="movil"){const o=ch[r.ref]||(ch[r.ref]=z(nomRef(r)));[o,C.chofer].forEach(x=>{x.venta+=c.venta;x.rend+=c.pagado;x.carg+=c.cargos;x.ops++;FORMATOS.forEach(f=>ADD(x,f.id,r.ventas[f.id]||0))});if(porDia[r.fecha])porDia[r.fecha].chofer+=c.venta}
    else if(r.tipo==="mayorista"){const pg=r.pagos.filter(p=>p.auto!=="may").reduce((s,p)=>s+p.monto,0),o=my[r.ref]||(my[r.ref]=z(nomRef(r)));[o,C.may].forEach(x=>{x.rend+=pg;x.carg+=c.cargos})}
    else if(r.tipo==="local"){C.local.rend+=c.pagado;C.local.carg+=c.cargos}});
  (D.cargasDist||[]).filter(x=>!x.anulada&&ids.includes(x.local)&&en(x.fecha)).forEach(x=>{const v=valorDist(x),cm=cliMay(x.mayorista),o=my[x.mayorista]||(my[x.mayorista]=z(cm?cm.nombre:"Mayorista"));
    [o,C.may].forEach(y=>{y.venta+=v;y.ops++;FORMATOS.forEach(f=>ADD(y,f.id,x.venta[f.id]||0))});if(porDia[x.fecha])porDia[x.fecha].may+=v});
  if(D.ventas.some(v=>ids.includes(v.local)&&en(v.fecha.slice(0,10)))){const o=sl._m=z("Casa Matriz");
    D.ventas.filter(v=>ids.includes(v.local)&&en(v.fecha.slice(0,10))).forEach(v=>{const m=montoV(v),d=v.fecha.slice(0,10);[o,C.local].forEach(x=>{x.venta+=m;x.ops++;ADD(x,v.formato,v.cant)});if(porDia[d])porDia[d].local+=m});
    o.rend=C.local.rend;o.carg=C.local.carg}
  if(resLocal&&!resLocal.error)Object.entries(resLocal).forEach(([d,o])=>{if(!en(d))return;C.local.venta+=o.total||0;C.local.ops+=o.n||0;C.local.rend+=o.rend||0;C.local.carg+=o.carg||0;if(porDia[d])porDia[d].local+=o.total||0;
    const keys=new Set([...Object.keys(o.suc||{}),...Object.keys(o.srend||{})]);
    keys.forEach(k=>{const s=sl[k]||(sl[k]=z(resSucs[k]||k));s.venta+=(o.suc||{})[k]||0;s.rend+=(o.srend||{})[k]||0;s.carg+=(o.scarg||{})[k]||0;
      Object.entries((o.scil||{})[k]||{}).forEach(([id,q])=>{const f=LID2[id];if(f)suma(s,f,q)})});
    Object.entries(o.cil||{}).forEach(([id,q])=>{const f=LID2[id];if(f)suma(C.local,f,q)})});
  Object.values({...C,...ch,...my,...sl}).forEach(o=>o.saldo=o.venta+o.carg-o.rend);
  return {dias,C,porDia,d1,d2,ch:Object.values(ch).sort((a,b)=>b.venta-a.venta),my:Object.values(my).sort((a,b)=>b.venta-a.venta),sl:Object.values(sl).sort((a,b)=>b.venta-a.venta)}}
function barrasCanal(C,canales){const rowH=38,W=540,pl=128,pr=112,H=canales.length*rowH+8,iw=W-pl-pr,max=Math.max(1,...canales.map(k=>C[k].venta));let g="";
  canales.forEach((k,i)=>{const y=8+i*rowH,w=C[k].venta/max*iw;g+=`<text x="${pl-10}" y="${y+15}" text-anchor="end" class="lb">${RES_TXT[k]}</text>`;
    g+=`<rect x="${pl}" y="${y+2}" width="${Math.max(w,C[k].venta?2:0)}" height="18" rx="4" fill="${RES_COL[k]}"><title>${RES_TXT[k]}: ${clp(C[k].venta)}</title></rect><text x="${pl+w+8}" y="${y+15}" class="vl">${clp(C[k].venta)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" class="res-svg" role="img" aria-label="Ventas por canal">${g}</svg>`}
const RES_TABLAS={};
function resTabla(id,titulo,sub,cols,filas,total){RES_TABLAS[id]={titulo,cols,filas,total};
  const td=(v,i)=>`<td class="${cols[i][1]==="t"?"":"der num"}${cols[i][2]&&v>0?" rojo":""}">${v==null?"":cols[i][1]==="$"?clp(v):cols[i][1]==="n"?Number(v).toLocaleString("es-CL"):v}</td>`;
  return `<div class="res-cap"><div><b>${titulo}</b><span class="nota"> · ${sub}</span></div><button class="btn chico linea" type="button" data-copiar="${id}">⧉ Copiar tabla</button></div>
  <div class="tabla-wrap res-t"><table><thead><tr>${cols.map(c=>`<th class="${c[1]==="t"?"":"der"}">${c[0]}</th>`).join("")}</tr></thead><tbody>
  ${filas.length?filas.map(f=>`<tr>${f.map(td).join("")}</tr>`).join(""):`<tr><td colspan="${cols.length}" class="nota" style="text-align:center">Sin ventas en este período</td></tr>`}
  ${total&&filas.length>1?`<tr class="tot">${total.map(td).join("")}</tr>`:""}</tbody></table></div>`}
function vistaResumenInf(){cargarResLocal();const R=datosResumen2(),C=R.C,canales=["local","chofer",...(D.precios&&D.precios.sinMayorista?[]:["may"])];
  const T={venta:0,cil:0,kg:0,rend:0,saldo:0};canales.forEach(k=>Object.keys(T).forEach(x=>T[x]+=C[k][x]));
  const per=R.d1===R.d2?fF(R.d1):`${fF(R.d1)} al ${fF(R.d2)}`,kg=v=>Number(v).toLocaleString("es-CL");
  const ley=`<div class="res-ley">${canales.map(k=>`<span><i style="background:${RES_COL[k]}"></i>${RES_TXT[k]}</span>`).join("")}</div>`;
  const aviso=resLocal&&resLocal.error?`<p class="nota" style="margin:0 0 8px">No se pudo leer la venta de Venta Local (${esc(resLocal.error)}).</p>`:(!resLocal&&NUBE.activo?'<p class="nota" style="margin:0 0 8px">Cargando venta de Venta Local…</p>':"");
  const fila=o=>[o.n,o.venta,o.cil,o.kg,o.rend,o.saldo],TOT=["TOTAL",T.venta,T.cil,T.kg,T.rend,T.saldo];
  const colsB=n=>[[n,"t"],["Ventas $","$"],["Cilindros","n"],["Kilos","n"],["Rendido","$"],["Saldo","$",1]];
  const colsF=n=>[[n,"t"],...FORMATOS.map(f=>[f.tipo==="h"?"H15":f.kg+" kg","n"]),["Total cil.","n"],["Kilos","n"]];
  const filaF=o=>[o.n,...FORMATOS.map(f=>o.f[f.id]||0),o.cil,o.kg];
  const sumF=l=>["TOTAL",...FORMATOS.map(f=>l.reduce((s,o)=>s+(o.f[f.id]||0),0)),l.reduce((s,o)=>s+o.cil,0),l.reduce((s,o)=>s+o.kg,0)];
  const sumB=l=>["TOTAL",...["venta","cil","kg","rend","saldo"].map(k=>l.reduce((s,o)=>s+o[k],0))];
  const ctrl=`<div class="res-top"><span class="res-et">Período</span><input type="date" id="res-d1" value="${R.d1}"> a <input type="date" id="res-d2" value="${R.d2}">
    <button class="btn chico" type="button" id="res-ver">Ver informe</button><span style="flex:1"></span>
    ${[["hoy","Hoy"],["7","Últimos 7 días"],["mes","Este mes"],["mesant","Mes anterior"]].map(([k,t])=>`<button class="btn chico linea" type="button" data-rr="${k}">${t}</button>`).join("")}</div>`;
  return cabeza("Informes",`<button class="btn chico linea" type="button" data-imprimir>Imprimir</button>`)+tabsInf()+ctrl+aviso+`
  <div class="res-cap"><p class="res-tit">Total de ventas · ${per}</p><button class="btn chico" type="button" id="res-xls">⬇ Exportar a Excel</button></div>
  <div class="res-kpi"><div><span>Ventas</span><b class="num">${clp(T.venta)}</b></div><div><span>Cilindros vendidos</span><b class="num">${kg(T.cil)}</b></div><div><span>Kilos vendidos</span><b class="num">${kg(T.kg)}</b></div></div>
  <div class="res-g"><section class="caja"><div class="res-h"><div><b>Ventas por día</b><span class="nota"> · ${per}</span></div>${ley}</div>
    ${R.dias.length>1?barrasDias(R.dias,R.porDia,canales):'<p class="nota">Elija un período de varios días (por ejemplo «Últimos 7 días») para ver el gráfico por día.</p>'}</section>
  <section class="caja"><div class="res-h"><div><b>Ventas por canal</b><span class="nota"> · ${per}</span></div></div>${barrasCanal(C,canales)}</section></div>
  ${resTabla("t-canal","Resumen por canal",per,colsB("Canal"),canales.map(k=>fila(C[k])),TOT)}
  ${resTabla("t-form","Cilindros vendidos por formato",per,colsF("Canal"),canales.map(k=>filaF(C[k])),sumF(canales.map(k=>C[k])))}
  ${R.sl.length?resTabla("t-loc","Venta local por sucursal",per,colsB("Sucursal"),R.sl.map(fila),sumB(R.sl)):""}
  ${resTabla("t-cho","Venta por chofer",per,colsB("Chofer"),R.ch.map(fila),sumB(R.ch))}
  ${canales.includes("may")?resTabla("t-may","Venta por mayorista",per,colsB("Mayorista"),R.my.map(fila),sumB(R.my)):""}
  <p class="nota" style="margin:4px 0 0">Rendido = lo pagado en las rendiciones del período. Saldo = ventas + cargos − rendido. No incluye ventas anuladas.</p>`}
function resCSV(){const [d1,d2]=rangoRes(),q=v=>`"${String(v??"").replace(/"/g,'""')}"`,L=[];
  Object.values(RES_TABLAS).forEach(t=>{L.push(q(t.titulo));L.push(t.cols.map(c=>q(c[0])).join(";"));t.filas.forEach(f=>L.push(f.map(q).join(";")));if(t.total&&t.filas.length>1)L.push(t.total.map(q).join(";"));L.push("")});
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+L.join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download=`resumen_${d1}_${d2}.csv`;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
{const c0=cargarResLocal;cargarResLocal=async function(){const [d1,d2]=rangoRes();if(resLocalKey!==d1+"|"+d2&&!resCargando)resLocal=null;
  if(resCargando||resLocalKey===d1+"|"+d2||!NUBE.activo)return;resCargando=true;
  try{const r=await fetch(`local/api/docs.php?a=resumen&desde=${d1}&hasta=${d2}`,{credentials:"same-origin",cache:"no-store"});const j=await r.json();
    resLocal=r.ok?j.dias||{}:{error:j.error||"sin acceso"};if(r.ok&&j.sucs)resSucs=j.sucs}catch(e){resLocal={error:"sin conexión"}}
  resLocalKey=d1+"|"+d2;resCargando=false;if(mod==="informes"&&infTab==="resumen")pintarSistema()}}
{const l0=L.informes;L.informes=function(){const r=l0?l0.apply(this,arguments):undefined;
  if(infTab==="resumen"&&$("#res-ver")){$("#res-ver").onclick=()=>{resD1=$("#res-d1").value||hoyStr();resD2=$("#res-d2").value||resD1;resLocal=null;pintarSistema()};
    document.querySelectorAll("[data-rr]").forEach(b=>b.onclick=()=>resRango(b.dataset.rr));$("#res-xls").onclick=resCSV;
    document.querySelectorAll("[data-copiar]").forEach(b=>b.onclick=()=>{const t=RES_TABLAS[b.dataset.copiar];if(!t)return;
      const txt=[t.cols.map(c=>c[0]),...t.filas,...(t.total&&t.filas.length>1?[t.total]:[])].map(f=>f.join("\t")).join("\n");
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>aviso("Tabla copiada","Péguela en Excel."),()=>aviso("No se pudo copiar","Use Exportar a Excel."))})}
  return r}}

/* ===== Informes → Venta Local: el informe que antes tenía Venta Local ===== */
{const v1=V.informes;V.informes=function(){if(infTab==="vlocal"){if(!esAdmin())infTab="resumen";else return cabeza("Informes",'<span class="nota" style="margin:0">Informe de las sucursales de Venta Local</span>')+tabsInf()+'<iframe id="inf-local" class="inf-local" src="local/?solo=inf" title="Informe de Venta Local"></iframe>'}return v1.apply(this,arguments)}}

/* ===== Configuraciones → Sucursales: matriz y Venta Local en una sola lista ===== */
{const s0=CFG_MAY.sucLocal,v0=s0.v,l0=s0.l;
  s0.v=function(){let h=v0.call(this);
    const a=V.admin(),i=a.indexOf('<form class="caja" id="f-suc"'),j=a.indexOf('<h3 style="margin-bottom:12px">Sucursales</h3>'),form=i>=0&&j>i?a.slice(i,j):"";
    const filas=D.locales.map(x=>`<tr class="suc-mz"><td><b>${esc(x.nombre)}</b> <span class="pill">Matriz</span><small class="suc-d">Pedidos, choferes y bodega</small></td>
      <td class="c nota">Precio Domicilio</td><td class="c nota">Bodega principal</td><td class="c"><span class="estado ${x.abierto?"abierto":"cerrado"}">${x.abierto?"Abierta":"Cerrada"}</span></td>
      <td class="c"><button class="btn chico linea" type="button" data-editsuc="${x.id}">Editar datos</button></td></tr>`).join("");
    h=h.replace("<h3>Sucursales de Venta Local</h3>","<h3>Sucursales</h3>")
     .replace(/<p class="cfgp-nota">Aquí decides cuántas sucursales tiene Venta Local\./,'<p class="cfgp-nota">Todas las sucursales en una sola lista: la <b>Casa Matriz</b> (pedidos, choferes y bodega) y los locales de <b>Venta Local</b>.')
     .replace('<th class="c">Eliminar</th>','<th class="c">Acciones</th>')
     .replace("<tbody>","<tbody>"+filas)
     .replace('<section class="cfgp" id="s-sucl" style="max-width:860px">','<section class="cfgp" id="s-sucl" style="max-width:920px">'+(form?form.replace('<form class="caja" id="f-suc" style="margin-bottom:24px">','<form class="caja" id="f-suc" style="margin-bottom:16px">'):""));
    return h+'<button type="button" id="nueva-suc" hidden></button>'};
  s0.l=function(){const r=l0.apply(this,arguments);try{L.admin()}catch(e){}return r}}
{const vc=V.config;V.config=function(){if((cfgTab==="sucursal"||cfgTab==="sucLocal")&&esAdmin())cfgTab="general";if(cfgTab==="descQR")cfgTab=esAdmin()?"preciosLocal":"precios";return vc.apply(this,arguments)}}

/* Precio de envases: uno solo para la matriz y todas las sucursales de Venta Local */
function envLocal(){const o={};FORMATOS.forEach(f=>{const id=LID[f.id];if(id)o[id]=Math.max(0,Math.round(+((D.preciosEnvase||{})[f.id])||0))});return o}
async function envALocal(){if(!NUBE.activo||!esAdmin())return;const e=envLocal(),sucs={};LOCAL_SUCS.forEach(x=>sucs[lslug(x)]={envase:e});
  try{await locPrecios({sucs})}catch(x){aviso("Envases de Venta Local","No se pudieron actualizar en Venta Local: "+x.message)}}

/* ===== Historial de cambios por fechas (no carga todo de una vez) ===== */
let hcD1=null,hcD2=null;
function hcRango(k){const h=hoyStr(),d=new Date(h+"T12:00");if(k==="hoy"){hcD1=hcD2=h}else if(k==="7"){d.setDate(d.getDate()-6);hcD1=fechaISO(d);hcD2=h}
  else if(k==="mes"){hcD1=h.slice(0,8)+"01";hcD2=h}else{const a=new Date(d.getFullYear(),d.getMonth()-1,1,12),b=new Date(d.getFullYear(),d.getMonth(),0,12);hcD1=fechaISO(a);hcD2=fechaISO(b)}pintarSistema()}
CFG_MAY.histCambios={v(){if(!hcD1){const d=new Date(hoyStr()+"T12:00");d.setDate(d.getDate()-6);hcD1=fechaISO(d);hcD2=hoyStr()}
  const d1=hcD1,d2=hcD2&&hcD2>=hcD1?hcD2:hcD1;
  const T=(D.bitacora||[]).filter(x=>["sistema","precios"].includes(x.area)&&String(x.fecha||"").slice(0,10)>=d1&&String(x.fecha||"").slice(0,10)<=d2),B=T.slice(0,500);
  return `<section class="cfgp"><h3>Historial de cambios</h3><p class="cfgp-nota izq">Cambios en la configuración: usuarios, choferes, precios, accesos y sucursales.</p>
    <div class="res-top"><span class="res-et">Período</span><input type="date" id="hc-d1" value="${d1}"> a <input type="date" id="hc-d2" value="${d2}"><button class="btn chico" type="button" id="hc-ver">Ver</button><span style="flex:1"></span>
    ${[["hoy","Hoy"],["7","Últimos 7 días"],["mes","Este mes"],["mesant","Mes anterior"]].map(([k,x])=>`<button class="btn chico linea" type="button" data-hcr="${k}">${x}</button>`).join("")}</div>
    <p class="nota" id="hc-n" style="margin:0 0 8px">${T.length} cambio${T.length===1?"":"s"} entre el ${fF(d1)} y el ${fF(d2)}${T.length>B.length?` · se muestran los ${B.length} más recientes; acorte el período para ver el resto`:""}.</p>
    <div class="tabla-wrap cfgt"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Cambio</th><th>Detalle</th></tr></thead><tbody>${B.map(histFila).join("")||'<tr><td colspan="4" class="vacio">Sin cambios en este período.</td></tr>'}</tbody></table></div></section>`},
  l(){const v=$("#hc-ver");if(!v)return;v.onclick=()=>{hcD1=$("#hc-d1").value||hoyStr();hcD2=$("#hc-d2").value||hcD1;pintarSistema()};$$("[data-hcr]").forEach(b=>b.onclick=()=>hcRango(b.dataset.hcr))}};

/* ===== Permisos detallados: se aplican en pantalla después de pintar ===== */
function aplicarPermDet(){if(!yo||esAdmin())return;
  if(!tieneExtra("may.anular"))$$("[data-anmay]").forEach(b=>b.remove());
  if(!tieneExtra("may.descuento"))["#vm-dcto"].forEach(s=>{const i=$(s);if(i){i.value="";i.disabled=true;i.title="Sin permiso para dar descuentos"}});
  if(!tieneExtra("vc.anular")){const b=$("#vc-anular");if(b){b.disabled=true;b.title="Sin permiso para anular"}}
  if(!tieneExtra("vc.descuento")){const i=$("#vc-dcto");if(i){i.value="";i.disabled=true;i.title="Sin permiso para dar descuentos"}}
  if(!tieneExtra("bodega.editar")){const b=$("#bd-editar");if(b)b.remove()}}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{aplicarPermDet()}catch(e){}return r}}

/* Venta Local se precarga desde el menú para que abra rápido */
{const l0=L.menu;L.menu=function(){const r=l0?l0.apply(this,arguments):undefined;
  try{if(document.querySelector('a.modulo[href="local/"]')&&!document.getElementById("pre-local")){const k=document.createElement("link");k.id="pre-local";k.rel="prefetch";k.href="local/";document.head.appendChild(k)}}catch(e){}return r}}

/* ===== Venta Local dentro del Panel General: se carga escondida al entrar y se muestra al instante ===== */
function vlPuede(){return !!yo&&NUBE.activo&&(esAdmin()||(yo.rol==="encargado"&&Array.isArray(yo.permisos)&&yo.permisos.includes("app.local")))}
function vlCapa(){let c=document.getElementById("vl-capa");if(c||!vlPuede())return c;
  c=document.createElement("div");c.id="vl-capa";c.className="vl-oculta";
  c.innerHTML='<div class="vl-bar"><button type="button" class="btn chico linea" id="vl-volver">← Menú principal</button><b>Venta Local</b></div><iframe id="vl-frame" src="local/?app=1" title="Venta Local"></iframe>';
  document.body.appendChild(c);document.getElementById("vl-volver").onclick=vlCerrar;return c}
function vlTop(){const h=document.querySelector(".sis-top"),c=document.getElementById("vl-capa");if(h&&c)c.style.top=Math.max(0,h.getBoundingClientRect().bottom)+"px"}
function vlAbrir(){const c=vlCapa();if(!c){location.href="local/";return}vlTop();c.classList.remove("vl-oculta");document.body.classList.add("vl-abierta");
  if(location.hash!=="#venta-local")history.pushState({vl:1},"","#venta-local")}
function vlCerrar(){const c=document.getElementById("vl-capa");if(c)c.classList.add("vl-oculta");document.body.classList.remove("vl-abierta");if(location.hash==="#venta-local")history.back()}
function vlQuitar(){const c=document.getElementById("vl-capa");if(c)c.remove();document.body.classList.remove("vl-abierta")}
addEventListener("popstate",()=>{if(location.hash!=="#venta-local"){const c=document.getElementById("vl-capa");if(c)c.classList.add("vl-oculta");document.body.classList.remove("vl-abierta")}});
addEventListener("resize",vlTop);
document.addEventListener("click",e=>{const a=e.target.closest('a.modulo[href="local/"]');if(!a||!yo)return;if(vlPuede()){e.preventDefault();vlAbrir()}},true);
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{if(yo&&vlPuede())vlCapa();else if(!yo)vlQuitar()}catch(e){}return r}}
{const s0=salirNube;salirNube=async function(){vlQuitar();return s0.apply(this,arguments)}}

/* ===== Rendición chofer y mayorista con el formato de Venta Local ===== */
function compactarRend(){const rr=document.querySelector(".rerp");if(!rr||rr.dataset.cp)return;rr.dataset.cp=1;
  const cont=rr.closest(".sis-main")||document;cont.classList.add("rd-lv");
  // una sola línea arriba: cliente/chofer · ventas · saldo histórico · N° guía
  const bar=cont.querySelector(".mrbar"),lin=document.createElement("div");lin.className="rd-linea";
  if(bar){const r1=bar.querySelector(".row");if(r1)lin.appendChild(r1)}
  const mv=cont.querySelector(".mv-bar");
  if(mv){mv.querySelectorAll(".mv-ch").forEach(x=>lin.appendChild(x));const h=mv.querySelector(".mv-hist");mv.remove();const n=cont.querySelector(".mv-nota");if(n)n.remove();if(h)lin.appendChild(h)}
  const vr=cont.querySelector(".vr-sum");
  if(vr){const btn=vr.querySelector("[data-ctab]");if(mv){if(btn)lin.insertBefore(btn,lin.querySelector(".mv-hist"))}else if(btn)lin.appendChild(btn);vr.remove()}
  const top=cont.querySelector(".rtop-erp");if(top){const g=top.querySelector(".guia");if(g)lin.appendChild(g);top.remove()}
  if(bar){bar.parentNode.insertBefore(lin,bar);if(!bar.querySelector(".row"))bar.remove()}else{rr.closest("fieldset")?.parentNode.insertBefore(lin,rr.closest("fieldset"))}
  // sin Descuento QR (salvo que ya tenga montos guardados)
  rr.querySelectorAll(".rc-pagos .rbox").forEach(b=>{const h=b.querySelector(".rbox-h span");if(h&&h.textContent.trim()==="DESCUENTO QR"&&!b.querySelector(".chips"))b.remove()})}
{const p0=pintarSistema;pintarSistema=function(){const r=p0.apply(this,arguments);try{compactarRend()}catch(e){}return r}}

/* Ingreso de carga (antes Compras y Devoluciones) vive dentro de Control de Bodega */
{const lb=L.bodega;L.bodega=function(){if(bTab==="ingreso"){$$("[data-btab]").forEach(b=>b.onclick=()=>{bTab=b.dataset.btab;pintarSistema()});try{L.compras()}catch(e){}return}return lb.apply(this,arguments)}}
{const i0=ir;ir=function(m){if(m==="compras"){bTab="ingreso";return i0.call(this,"bodega")}return i0.apply(this,arguments)}}

/* Configuraciones → General: incluye la lista de Sucursales (solo administrador) */
{const lc=L.config;L.config=function(){const r=lc.apply(this,arguments);
  try{if(cfgTab==="general"&&esAdmin()&&!document.getElementById("s-sucl")){const z=document.querySelector(".cfg-main");if(z){z.insertAdjacentHTML("beforeend",'<div class="cfg-suc-gen">'+CFG_MAY.sucLocal.v()+'</div>');CFG_MAY.sucLocal.l()}}}catch(e){console.error(e)}
  return r}}

/* ===== Respaldos y reset → Limpiar datos para empezar a usar el sistema (pide la contraseña del administrador) ===== */
function limpiarDatosLocal(){["facturas","pedidos","ventas","gastos","rendiciones","cargas","cargasDist","anticipos","petroleo","peonetas","movimientos","recuentos","ventasAnuladas","programados","bitacora","historialPrecios"].forEach(k=>{if(Array.isArray(D[k]))D[k]=[]});
  const z=()=>Object.fromEntries(FORMATOS.map(f=>[f.id,0]));(D.locales||[]).forEach(l=>{l.stock=z();l.vacios=z();l.prestados=z();if(l.comodato)l.comodato=z()});(D.choferes||[]).forEach(c=>{c.carga=z();c.vacios=z()})}
{const lc=L.config;L.config=function(){const r=lc.apply(this,arguments);
  try{if(cfgTab==="respaldos"&&esAdmin()&&!document.getElementById("f-limpiar")){const z=document.querySelector(".cfg-main");if(z){
    z.insertAdjacentHTML("beforeend",`<form class="caja lim-caja" id="f-limpiar"><h3>Limpiar datos para empezar a usar el sistema</h3>
      <p class="nota" style="margin:0">Borra <b>todos los pedidos, ventas, rendiciones, cargas, compras, movimientos e historial</b> (también los de Venta Local) y deja el <b>stock de bodega y camiones en cero</b>.
      Se mantienen usuarios, precios, sucursales, choferes, clientes, sectores y la configuración. <b>No se puede deshacer</b>: haga antes una copia de seguridad.</p>
      <div class="fila"><label>Contraseña del administrador<input type="password" id="lim-pass" autocomplete="current-password" required></label><label>Escriba LIMPIAR para confirmar<input id="lim-conf" placeholder="LIMPIAR" autocomplete="off" required></label></div>
      <p class="error" id="lim-err" hidden></p><div><button class="btn rojo" type="submit" id="lim-btn">Limpiar datos</button></div></form>`);
    $("#f-limpiar").onsubmit=async e=>{e.preventDefault();const er=$("#lim-err"),b=$("#lim-btn"),pass=$("#lim-pass").value,conf=$("#lim-conf").value.trim().toUpperCase();er.hidden=true;
      if(conf!=="LIMPIAR"){er.textContent="Escriba LIMPIAR para confirmar.";er.hidden=false;return}
      b.disabled=true;b.textContent="Limpiando…";
      try{if(NUBE.activo){const j=await api("limpiar",{pass,confirmar:"LIMPIAR"});
          try{localStorage.removeItem(KEY)}catch(x){}try{indexedDB.deleteDatabase("mrgas-local")}catch(x){}
          aviso("Datos limpios",`Se borraron ${j.borrados} registros${j.local?` y ${j.local} de Venta Local`:""}. El sistema se recarga.`);setTimeout(()=>location.reload(),1800)}
        else{const u=(D.usuarios||[]).find(x=>x.user===yo.user);if(u&&u.pass&&u.pass!==pass){throw new Error("La contraseña del administrador no es correcta.")}
          limpiarDatosLocal();log("sistema","Limpieza de datos","Se borraron los datos de prueba y el stock quedó en cero.");guardar();pintarSistema();aviso("Datos limpios","Ya puede empezar a usar el sistema.")}}
      catch(x){er.textContent=x.message;er.hidden=false;b.disabled=false;b.textContent="Limpiar datos"}}}}}catch(e){console.error(e)}
  return r}}


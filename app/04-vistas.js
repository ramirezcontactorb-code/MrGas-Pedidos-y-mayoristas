/* MR Gas · Panel General · 04-vistas */
/* ===================== VISTAS ===================== */
const V={
  sucursal(){
    return `<div class="cab-mod"><div><h2>Elija una sucursal</h2><p style="color:var(--muted);margin-top:6px">Todo lo que haga en el sistema queda registrado en la sucursal elegida.</p></div></div>
    <div class="sucursales">${D.locales.filter(l=>misSucs().includes(l.id)).map(l=>{const pend=D.pedidos.filter(p=>p.local===l.id&&(p.estado==="pendiente"||p.estado==="ruta")).length;
      const stock=Object.values(l.stock).reduce((a,b)=>a+b,0);
      return `<button class="suc ${l.id===suc?"actual":""}" data-suc="${l.id}" type="button">
      <span class="estado ${l.abierto?"abierto":"cerrado"}">${l.abierto?"Abierto":"Cerrado"}</span>
      <h3>${esc(l.nombre)}</h3><span class="dir">${esc(l.comuna)}</span>
      <span class="num" style="font-size:.92rem">${stock} cilindros · ${pend} ${pend===1?"pedido activo":"pedidos activos"}</span>
      <span class="pie"><span class="entrar">${l.id===suc?"Sucursal actual":"Entrar"} →</span></span></button>`}).join("")}</div>`;
  },
  menu(){
    const h=new Date().getHours(),saludo=h<12?"Buenos días":h<20?"Buenas tardes":"Buenas noches";
    const hoy=hoyStr(),ps=pedidosSuc(),nuevos=ps.filter(p=>p.estado==="pendiente").length,enRuta=ps.filter(p=>p.estado==="ruta").length;
    const vendido=ps.filter(p=>p.estado==="entregado"&&(p.entregado||"").startsWith(hoy)).reduce((a,p)=>a+totalP(p),0)+D.ventas.filter(v=>v.local===suc&&v.fecha.startsWith(hoy)).reduce((a,v)=>a+montoV(v),0);
    const entHoy=ps.filter(p=>p.estado==="entregado"&&(p.entregado||"").startsWith(hoy)).length,nom=String(yo.nombre||"").split(" ")[0];
    const card=(attr,ico,t,d,go="Abrir")=>`<${attr.startsWith("href")?"a":"button"} class="modulo" ${attr}><span class="ico">${svg(ico)}</span><b>${t}</b><span class="sub">${d}</span><span class="mgo">${go}<span aria-hidden="true">→</span></span></${attr.startsWith("href")?"a":"button"}>`;
    return `<div class="phead-mr"><div class="eyebrow-mr">Sucursal ${esc(nomLocal(suc))}</div><h1>${saludo}, ${esc(nom)}</h1><p class="sub">${fechaLarga(hoy)}</p></div>
      <div class="modulos">${(()=>{const ORDEN=aparOrden(["pedidos","ruta","mayorista","ventachofer","local","choferes","bodega","facturas","informes","config"]).filter(x=>!aparOcultos().includes(x)),FUERA=["sectorizar","cuadratura","compras",...aparOcultos()];
        const ids=[...ORDEN,...MODULOS.map(m=>m.id).filter(id=>!ORDEN.includes(id)&&!FUERA.includes(id))];
        return ids.map(id=>{if(id==="local")return esAdmin()||(yo.rol==="encargado"&&Array.isArray(yo.permisos)&&yo.permisos.includes("app.local"))?card('href="local/"',"ventachofer","Venta Local","Venta y rendición de los locales"):"";
          if(id==="erp")return yo.rol!=="chofer"?card('href="https://mrgaslocal.com/" target="_blank" rel="noopener"',"externo","Venta Local Gas","Sistema de venta local y bodega.","Abrir en otra pestaña"):"";
          const m=MODULOS.find(x=>x.id===id);if(m&&id==="informes"&&!puede(id)&&yo.rol==="encargado")return card('data-infaut="1" type="button"',m.id,m.t,"Necesita la autorización de alguien con permiso.","Pedir autorización");
          return m&&puede(m.id)?card(`data-modulo="${m.id}" type="button"`,m.id,m.t,m.s):""}).join("")})()}</div>
      <p class="stitle-mr">Resumen de hoy</p>
      <div class="stats-mr"><div><div class="k">Pedidos nuevos</div><div class="v">${nuevos}</div></div><div><div class="k">En ruta</div><div class="v">${enRuta}</div></div><div><div class="k">Entregados hoy</div><div class="v">${entHoy}</div></div><div><div class="k">Vendido hoy</div><div class="v">${clp(vendido)}</div></div></div>`;
  },
  pedidos(){
    const ps=pedidosSuc();
    const tabs="";
    const radios=(name,obj,sel)=>Object.entries(obj).map(([k,v])=>`<label class="radio"><input type="radio" name="${name}" value="${k}" ${k===sel?"checked":""}>${esc(v)}</label>`).join("");
    const PE=D.preciosEnvase||{};
    return cabeza("Pedidos de Gas")+contadores(ps)+tabs+`<form id="f-ped" class="ped">
      <div class="ped-main caja">
        <div class="buscar"><label>Buscar por teléfono<input id="np-buscar" type="tel" placeholder="9 1234 5678"></label><label>o por dirección<input id="np-bdir" placeholder="Calle y número"></label><button class="btn linea" type="button" id="np-btn-buscar">Buscar</button><span id="np-encontrado" class="nota" style="margin:0"></span></div>
        <div class="fuente"><span class="eyebrow">Fuente</span>${radios("np-fuente",{fono:FUENTES.fono,whatsapp:FUENTES.whatsapp},"fono")}</div>
        <div class="fila"><label>Teléfono<span class="tel-sn"><input id="np-fono" type="tel" required list="lista-fonos" autocomplete="off" placeholder="Escriba el número"><button class="btn chico linea" type="button" id="np-sinnum">Sin número</button></span></label></div>
        <div id="np-cliente" class="cli-card" hidden></div>
        <div class="vc-card np-vc"><div class="vc-g" style="--n:${FORMATOS.length}">
          <div class="vc-izq"><span class="vc-plab">Cilindros</span>
            <div class="vc-tot"><span>TOTAL</span><b class="num" id="np-total">$0</b></div>
            <label class="vc-dc"><span>DESCUENTO</span><span class="vc-pesos">$ <input id="np-dcto" type="number" min="0" inputmode="numeric" value="0" class="num"></span></label></div>
          ${FORMATOS.map(f=>{const sb=((loc(suc)||{}).stock||{})[f.id]||0;return `<div class="vc-col" title="${esc(f.nom||f.et)}"><span class="vc-pr num" data-pr="${f.id}">${clp(precioLista("base",f.id))}</span><div class="vc-img">${cilBlanco(f)}</div>
            <span class="vc-et"><b>${f.tipo==="h"?"H15":f.kg}</b> ${f.tipo==="h"?"Aluminio":"kg"}</span>
            <input class="vc-in np-q" type="number" min="0" inputmode="numeric" data-cant="${f.id}" value="0" aria-label="Cantidad ${f.et}">
            <span class="vc-stock ${sb>0?"":"cero"}">Bodega: ${sb}</span></div>`}).join("")}
        </div>
        <div class="vc-envh">VENTA DE ENVASES</div>
        <div class="vc-g env" style="--n:${FORMATOS.length}"><div></div>
          ${FORMATOS.map(f=>PE[f.id]?`<div class="vc-col"><span class="vc-pr num">${clp(PE[f.id])}</span><input class="vc-in" type="number" min="0" inputmode="numeric" data-env="${f.id}" value="0" aria-label="Envases ${f.et}"></div>`:"<div></div>").join("")}</div></div>
        <div class="dir6"><label class="con-sug">Calle<input id="np-calle" required autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="np-sug" aria-expanded="false" placeholder="Empiece a escribir…"><div class="sug" id="np-sug" role="listbox" hidden></div></label><label>Número<input id="np-num"></label><label>Block<input id="np-block"></label>
        <label>Depto<input id="np-depto"></label><label>Comuna<input id="np-comuna" list="lista-comunas" value="${esc(loc(suc).comuna)}"></label><label>Ciudad<input id="np-ciudad" value="Santiago"></label></div>
        <datalist id="lista-fonos">${(D.clientes||[]).slice().sort((a,b)=>(b.ultimo||"").localeCompare(a.ultimo||"")).slice(0,500).map(c=>`<option value="${esc(c.fonoTxt)}">${esc(c.calle)} ${esc(c.num)}${c.comuna?", "+esc(c.comuna):""}</option>`).join("")}</datalist>
        <datalist id="lista-comunas">${COMUNAS.map(c=>`<option value="${c}">`).join("")}</datalist>
        <div class="dir-asis" id="np-dir" hidden></div>
        <div class="fila3"><label>Punto de referencia<input id="np-ref" placeholder="Ej: frente a la plaza"></label>
        <label>Observaciones<input id="np-obs"></label><label>Entrega<input id="np-entrega" type="datetime-local" value="${ahora().replace(" ","T")}"></label></div>
      </div>
      <aside class="ped-lado caja">
        
        <label class="np-pago-l"><span class="eyebrow">Forma de pago</span><select id="np-pago" aria-label="Forma de pago">${Object.entries(PAGOS_PED).map(([k,t])=>`<option value="${k}">${t}</option>`).join("")}</select></label>
        <label class="radio"><input type="checkbox" id="np-factura"> Solicita factura</label>
        <div id="np-fact" class="grid" style="gap:10px" hidden><label>RUT<input id="np-rut" placeholder="76.000.000-0"></label><label>Razón social<input id="np-razon"></label><label>Giro<input id="np-giro"></label><label>Dirección<input id="np-fdir"></label><label>Comuna<input id="np-fcomuna" list="lista-comunas"></label></div>
                <button class="btn" type="submit">Grabar pedido</button>
        <p class="error" id="np-error" hidden></p>
        <p class="aviso ok" id="np-ok" hidden></p>
      </aside></form>`;
  },
  ruta(){
    const ps=pedidosSuc(),hoy=hoyStr(),pend=ps.filter(p=>p.estado==="pendiente"),enRuta=ps.filter(p=>p.estado==="ruta");
    const entHoy=ps.filter(p=>p.estado==="entregado"&&(p.entregado||"").startsWith(hoy));
    const chAll=chOrden(),activos=chAll.filter(c=>c.activo!==false),ch=activos,SEC=D.sectores||[];
    const carga=id=>D.pedidos.filter(p=>p.chofer===id&&p.estado==="ruta").length;
    const sugerido=(sec,p)=>{if(sec==null)return null;const r=elegirCamion(sec,p);return r?r.c.id:null};
    const opcSec=sel=>`<option value="">Sector…</option>`+SEC.map(x=>`<option value="${x.id}" ${x.id===sel?"selected":""}>${esc(x.nombre)}</option>`).join("");
    const opcCh=sel=>`<option value="">Móvil…</option>`+activos.map(c=>`<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(c.nombre)}${c.sector?" · "+esc(nomSector(c.sector)):""}</option>`).join("");
    const det=p=>`<details class="det"><summary>Detalle</summary><dl>
      <dt>Dirección</dt><dd>${esc(p.dir)}${p.ciudad?", "+esc(p.ciudad):""}${p.ref?`<br><span class="nota" style="margin:0">Ref.: ${esc(p.ref)}</span>`:""}</dd>
      <dt>Entrega</dt><dd>${esc(p.entrega||"Lo antes posible")}</dd>${p.obs?`<dt>Observación</dt><dd>${esc(p.obs)}</dd>`:""}
      <dt>Lista / cliente</dt><dd>${esc(nomLista(p.lista||"base"))} · ${p.tipo==="empresa"?"Empresa":"Domiciliario"}</dd>
      ${p.factura?`<dt>Factura</dt><dd>${esc(p.factura.razon||"")} · RUT ${esc(p.factura.rut||"")}</dd>`:""}
      <dt>Ingresó</dt><dd>${esc(p.usuario||(p.origen==="web"?"Sitio web":"—"))}</dd>
      ${p.reclamado?`<dt>Reclamo</dt><dd>${esc(p.reclamado)}</dd>`:""}${p.cierreFalso?`<dt>Cierre falso</dt><dd>${esc(p.cierreFalso)}</dd>`:""}</dl></details>`;
    const lapiz=p=>soloVer("ruta")?"":`<button class="btn chico linea marca-btn lapiz" data-editest="${p.id}" type="button" title="Corregir estado del pedido N° ${p.id}" aria-label="Corregir estado del pedido N° ${p.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button>`;
    const base=p=>{const min=minutos(p.fecha),tarde=min>30&&["pendiente","ruta"].includes(p.estado);
      return `<td class="num">${p.id}${marcasP(p)}</td><td class="num">${esc(p.fecha.slice(11))}${tarde?`<br><span class="pill bajo">${min>=120?Math.floor(min/60)+" h":min+" min"}</span>`:""}</td>
      <td>${p.nombre?esc(p.nombre)+"<br>":""}<span class="num" ${p.nombre?'style="color:var(--muted)"':""}>${esc(p.fono)}</span></td><td class="num">${resumenP(p)}</td>
      <td class="der num">${clp(totalP(p))}${p.dcto?`<br><span class="desc-txt">Desc. ${clp(p.dcto)}</span>`:""}</td>
      <td>${MEDIOS[p.medio]||""}<br><span style="color:var(--muted)">${FUENTES[p.origen]||""}</span></td><td>${esc(p.dir)}</td>`};
    const filaPend=p=>{const sec=sectorDe(p);return `<tr class="${minutos(p.fecha)>30?"tarde":""}">${base(p)}
      <td><div class="acc asignar"><select data-sec="${p.id}" aria-label="Sector del pedido ${p.id}">${opcSec(sec)}</select><select id="ch-${p.id}" aria-label="Móvil para pedido ${p.id}">${opcCh(sugerido(sec,p))}</select>
        <button class="btn chico" data-asignar="${p.id}" type="button">Despachar</button><button class="btn chico linea marca-btn" data-anular="${p.id}" type="button" title="Anular pedido">A</button>${lapiz(p)}</div></td><td>${det(p)}</td></tr>`};
    const filaRuta=p=>`<tr class="${minutos(p.fecha)>30?"tarde":""}">${base(p)}<td>${esc(nomChofer(p.chofer))}<br><span style="color:var(--muted)">${esc(nomSector(sectorDe(p)))}</span></td>
      <td><div class="acc"><button class="btn chico" data-entregar="${p.id}" type="button">Entregado</button><button class="btn chico linea" data-devolver="${p.id}" type="button">Reasignar</button>
        <button class="btn chico linea marca-btn ${p.reclamado?"on":""}" data-reclamo="${p.id}" type="button" title="Reclamado por cliente">R</button><button class="btn chico linea marca-btn" data-anular="${p.id}" type="button" title="Anular pedido">A</button>${lapiz(p)}</div></td><td>${det(p)}</td></tr>`;
    const filaEnt=p=>`<tr>${base(p)}<td>${esc(nomChofer(p.chofer))}<br><span class="num" style="color:var(--muted)">${esc((p.entregado||"").slice(11))}</span></td>
      <td><div class="acc"><button class="btn chico linea marca-btn" data-cf="${p.id}" type="button" title="Cierre falso: el móvil lo cerró sin entregar">CF</button><button class="btn chico linea marca-btn ${p.reclamado?"on":""}" data-reclamo="${p.id}" type="button" title="Reclamado por cliente">R</button>${lapiz(p)}</div></td><td>${det(p)}</td></tr>`;
    const cab=x=>`<thead><tr><th>N°</th><th>Hora</th><th>Teléfono / cliente</th><th>Cilindros</th><th class="der">Total</th><th>Forma / canal</th><th>Dirección</th>${x}<th></th></tr></thead>`;
    return cabeza("Asigna Ruta")+`<div class="rt-top">`+contadores(ps)+`<div class="ruta-barra">

        <label class="radio"><input type="checkbox" id="rt-auto" ${autoRefresco?"checked":""}> Actualización automática</label>
        <button class="btn chico linea" id="rt-recargar" type="button">Recargar</button>
        <button class="btn chico" id="rt-sectorizar" type="button">Sectorizar pedidos</button>
        <span class="leyenda"><b class="marca m-r">R</b> Reclamado <b class="marca m-a">A</b> Anular <b class="marca m-cf">CF</b> Cierre falso</span></div></div>
      <div class="ruta">
      <aside class="caja moviles" style="padding:18px"><h3>Móviles</h3>
        <table><thead><tr><th>Móvil</th><th class="der" title="Pedidos despachados hoy">Hoy</th><th>Sector</th></tr></thead><tbody>
        ${ch.map(c=>{const n=D.pedidos.filter(p=>p.chofer===c.id&&(p.despacho||"").startsWith(hoy)).length;return `<tr class="${rutaChofer===c.id?"rt-on":""}"><td><button type="button" class="rt-ch" data-vch="${c.id}" title="Ver pedidos de ${esc(c.nombre)}"><span class="punto on"></span>${esc(c.nombre)}</button><br><span style="color:var(--muted);font-size:.82rem">${esc(c.patente||"Sin patente")}${c.local!==suc?" · "+esc(nomLocal(c.local)):""}</span></td><td class="der num">${n}</td>
          <td><select data-chsec="${c.id}" aria-label="Sector de ${esc(c.nombre)}" class="sel-mini">${opcSec(c.sector??null).replace("Sector…","—")}</select></td>
          </tr>`}).join("")||'<tr><td colspan="3">No hay móviles activos. Actívelos en el cuadro Choferes.</td></tr>'}
        </tbody></table></aside>
      <div style="min-width:0">
        ${(()=>{const fch=rutaChofer!=null&&D.choferes.some(c=>c.id===rutaChofer)?rutaChofer:null,deCh=a=>fch==null?a:a.filter(p=>p.chofer===fch);
          const rr=deCh(enRuta),ee=deCh(entHoy),v=fch!=null&&rutaVista==="pend"?"ruta":rutaVista;
          const op=[["pend","Por despachar",pend.length],["ruta","En ruta",rr.length],["ent","Entregados hoy",ee.length]];
          return `<div class="rt-sel"><div class="tabs" role="tablist">${op.map(([k,t,n])=>`<button type="button" role="tab" data-rtvista="${k}" aria-selected="${v===k}">${t} <span class="num">(${n})</span></button>`).join("")}</div>
            ${fch!=null?`<span class="rt-filtro">Pedidos de <b>${esc(nomChofer(fch))}</b><button type="button" id="rt-todos" class="btn chico linea">Ver todos</button></span>`:""}</div>`+
          (v==="pend"?`<div class="tabla-wrap"><table>${cab("<th>Sector y móvil</th>")}<tbody>
        ${pend.length?pend.map(filaPend).join(""):'<tr><td colspan="9">No hay pedidos por despachar.</td></tr>'}</tbody></table></div>`
          :v==="ruta"?`${rr.some(p=>minutos(p.fecha)>30)?'<div class="banner" style="background:#FBE4E2;color:#7E211A">Pedidos con tiempo de demora en la entrega de más de 30 minutos.</div>':""}
        <div class="tabla-wrap"><table>${cab("<th>Móvil</th><th>Opciones</th>")}<tbody>
        ${rr.length?rr.map(filaRuta).join(""):`<tr><td colspan="10">${fch!=null?"Este móvil no tiene pedidos en ruta.":"No hay pedidos en ruta."}</td></tr>`}</tbody></table></div>`
          :`<div class="tabla-wrap"><table>${cab("<th>Móvil / hora</th><th>Opciones</th>")}<tbody>
        ${ee.length?ee.map(filaEnt).join(""):`<tr><td colspan="10">${fch!=null?"Este móvil todavía no tiene entregas hoy.":"Todavía no hay entregas hoy."}</td></tr>`}</tbody></table></div>`)})()}
      </div></div>`;
  },
  chofer(){
    const ch=chOrden();
    if(yo.rol!=="chofer"&&!ch.some(c=>c.id===choferSel))choferSel=ch[0]?.id||null;
    if(yo.rol==="chofer")choferSel=yo.chofer;
    const tabs=`<div class="tabs" role="tablist"><button type="button" role="tab" data-chtab="ruta" aria-selected="${chTab==="ruta"}">Entregas en ruta</button><button type="button" role="tab" data-chtab="registro" aria-selected="${chTab==="registro"}">Registro completo</button></div>`;
    if(chTab==="registro"){
      const filtroCh=yo.rol==="chofer"?String(yo.chofer):chFiltro;
      const ev=(D.bitacora||[]).filter(b=>b.fecha.startsWith(chFecha)&&(b.area==="pedidos"||b.chofer!=null)&&(filtroCh==="todos"||String(b.chofer)===filtroCh));
      const cuenta=a=>ev.filter(b=>b.accion===a).length;
      const filtros=`<div class="acc"><label>Fecha<input type="date" id="ch-fecha" value="${chFecha}"></label>${yo.rol==="chofer"?"":`<label>Móvil<select id="ch-filtro"><option value="todos">Todos los móviles</option>${ch.map(c=>`<option value="${c.id}" ${String(c.id)===chFiltro?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label>`}</div>`;
      return cabeza("Pedidos Chofer",filtros)+tabs+`<div class="kpis">
        <div class="kpi"><span>Despachados</span><b class="num">${cuenta("Despachado")}</b></div><div class="kpi"><span>Entregados</span><b class="num">${cuenta("Entregado")}</b></div>
        <div class="kpi"><span>No entregados</span><b class="num">${cuenta("No entregado")}</b></div><div class="kpi"><span>Anulados</span><b class="num">${cuenta("Anulado")}</b></div></div>
        <div class="tabla-wrap"><table><thead><tr><th>Hora</th><th>Movimiento</th><th>Detalle</th><th>Móvil</th><th>Hecho por</th></tr></thead><tbody>
        ${ev.length?ev.map(b=>`<tr><td class="num">${esc(b.fecha.slice(11))}</td><td><b>${esc(b.accion)}</b></td><td>${esc(b.detalle)}</td><td>${b.chofer?esc(nomChofer(b.chofer)):"—"}</td><td>${esc(b.user)}</td></tr>`).join(""):'<tr><td colspan="5">No hay movimientos registrados para este día.</td></tr>'}
        </tbody></table></div><p class="nota">Cada pedido ingresado, despacho, entrega, devolución, anulación, carga de móvil y pago de cuadratura queda guardado con la hora y quién lo hizo. Este registro no se puede borrar.</p>`;
    }
    const ps=D.pedidos.filter(p=>p.chofer===choferSel&&p.estado==="ruta");
    const sel=yo.rol==="chofer"?"":`<label style="min-width:240px">Chofer<select id="sel-chofer">${ch.map(c=>`<option value="${c.id}" ${c.id===choferSel?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label>`;
    return cabeza("Pedidos Chofer",sel)+tabs+bannerPush()+`<div class="tabla-wrap"><table><thead><tr><th>N°</th><th>Cliente</th><th>Dirección</th><th>Pedido</th><th>Cobrar</th><th></th></tr></thead><tbody>
      ${ps.length?ps.map(p=>`<tr><td class="num">${p.id}</td><td>${p.nombre?esc(p.nombre)+"<br>":""}<span class="num" ${p.nombre?'style="color:var(--muted)"':""}>${esc(p.fono)}</span></td><td>${esc(p.dir)}</td><td class="num">${resumenP(p)}</td>
        <td class="num">${clp(totalP(p))}<br><span style="color:var(--muted)">${MEDIOS[p.medio]||""}</span></td><td><div class="acc"><button class="btn chico" data-entregar="${p.id}" type="button">Entregado</button><button class="btn chico linea" data-devolver="${p.id}" type="button">No entregado</button></div></td></tr>`).join(""):'<tr><td colspan="6">No hay pedidos en ruta para este chofer.</td></tr>'}
      </tbody></table></div><p class="nota">"No entregado" devuelve el pedido a pendientes para reasignarlo. Todo queda en "Registro completo".</p>`;
  },
  cuadratura(){
    const fechaSel=`<label>Fecha<input type="date" id="f-cuad" value="${fechaCuad}"></label>`;
    if(cuadTab==="menu")return hubCuad(fechaSel);
    if(cuadTab==="carga"||cuadTab==="recarga")return vistaCarga(cuadTab==="carga"?"inicial":"recarga",fechaSel);
    if(cuadTab==="venta-dist")return vistaVentaDist(fechaSel);
    if(cuadTab==="liq-chofer"||cuadTab==="liq-peoneta")return vistaLiq(cuadTab==="liq-chofer"?"chofer":"peoneta");
    if(cuadSel!=null){const r=getRend(cuadTab,cuadSel,fechaCuad,true);if(r)return vistaRend(r,fechaSel)}
    const T=cuadTab,NOM={movil:"Móvil",mayorista:"Mayorista",local:"Local"},PLU={movil:"Móviles",mayorista:"Mayoristas",local:"Locales"};
    const lista=T==="movil"?chOrden().filter(c=>c.local===suc):T==="local"?D.locales.filter(l=>misSucs().includes(l.id)):(D.mayoristas||[]).filter(m=>(m.local??1)===suc);
    const rows=lista.map(x=>{const r=getRend(T,x.id,fechaCuad,false);return {x,r,c:r?calcRend(r):null,ent:T==="movil"?entregasDe(x.id,fechaCuad):T==="local"?ventasLocalDe(x.id,fechaCuad):null}});
    const tot=k=>rows.reduce((s,o)=>s+(o.c?o.c[k]:0),0);
    const tabs=`<button class="volver" type="button" data-ctab="menu" style="margin:-10px 0 16px">← Volver</button>`;
    const estado=o=>!o.r?'<span class="pill pendiente">Sin cuadrar</span>':Math.round(o.c.saldo)===0?'<span class="pill entregado">Cuadrado</span>':o.c.saldo>0?`<span class="pill bajo">Debe ${clp(o.c.saldo)}</span>`:`<span class="pill ruta">A favor ${clp(-o.c.saldo)}</span>`;
    const col2=T==="movil"?"Entregas en sistema":T==="local"?"Ventas en Venta Local":"RUT";
    const sub=x=>T==="movil"?esc(x.patente||"Sin patente")+" · "+esc(nomLocal(x.local)):T==="local"?esc(x.comuna):esc(x.fono||"Sin teléfono");
    const cel2=o=>T==="mayorista"?esc(o.x.rut||"—"):(o.ent.tarros?resumenVentas(o.ent.ventas):`<span style="color:var(--muted)">${T==="local"?"Sin ventas":"Sin entregas"}</span>`);
    return cabeza(({movil:"Rendición chofer",mayorista:"Rendición distribuidor",local:"Rendición local"})[T],fechaSel)+tabs+`<div class="kpis">
      <div class="kpi"><span>Vendido</span><b class="num">${clp(tot("venta"))}</b></div>
      <div class="kpi"><span>Rendido</span><b class="num">${clp(tot("pagado"))}</b></div>
      <div class="kpi"><span>Saldo del día</span><b class="num">${clp(tot("saldo"))}</b></div>
      <div class="kpi"><span>${PLU[T]} cuadrados</span><b class="num">${rows.filter(o=>o.r&&Math.round(o.c.saldo)===0).length} / ${rows.length}</b></div></div>
      <div class="tabla-wrap"><table><thead><tr><th>${NOM[T]}</th><th>${col2}</th><th class="der">Vendido</th><th class="der">Rendido</th><th class="der">Saldo anterior</th><th>Estado</th><th></th></tr></thead><tbody>
      ${rows.map(o=>{const sa=saldoAnterior(T,o.x.id,fechaCuad);return `<tr><td><b>${esc(o.x.nombre)}</b><br><span style="color:var(--muted);font-size:.85rem">${sub(o.x)}</span></td>
        <td class="num">${cel2(o)}</td><td class="der num">${o.c?clp(o.c.venta):"—"}</td><td class="der num">${o.c?clp(o.c.pagado):"—"}</td><td class="der num"><span class="${sCls(sa)}">${clp(sa)}</span></td><td>${estado(o)}</td>
        <td><button class="btn chico ${o.r?"linea":""}" data-cuadrar="${o.x.id}" type="button">${o.r?"Ver / editar":"Cuadrar"}</button></td></tr>`}).join("")||`<tr><td colspan="7">${T==="movil"?"No hay móviles. Agréguelos en Asigna Ruta.":"No hay mayoristas. Agregue uno abajo."}</td></tr>`}
      </tbody></table></div>
      ${T==="local"?'<p class="nota">La rendición de cada local toma lo grabado en Venta Local del día. Ábrala al cierre para ingresar cómo se pagó.</p>':""}
      ${T==="mayorista"?`<form class="caja" id="f-mayorista" style="margin-top:20px;max-width:760px"><h3>Agregar mayorista</h3><div class="fila3"><label>Nombre<input id="my-nombre" required></label><label>RUT<input id="my-rut" placeholder="76.000.000-0"></label><label>Teléfono<input id="my-fono" type="tel"></label></div><div><button class="btn" type="submit">Agregar mayorista</button></div></form>`:""}`;
  },
  compras(){
    const l=ensureLoc(loc(suc)),TD=TIPOS_DOC,e=TD[compTipo];
    const ms=D.movimientos.filter(m=>m.local===suc&&(m.fecha||"").slice(0,10)>=compDesde&&(m.fecha||"").slice(0,10)<=compHasta&&(!compFiltro||m.tipo===compFiltro));
    const efecto=[e.ll>0?"suma llenos":e.ll<0?"resta llenos":"",e.va<0?"resta vacíos (se entregan a la planta)":"",e.co>0?"suma envases en comodato":e.co<0?"resta envases en comodato":""].filter(Boolean).join(" · ");
    if(!DOCS_NUEVOS.includes(compTipo))compTipo="factura";
    const filtros=`<div class="acc" style="align-items:end"><label>Tipo de documento<select id="cp-ftipo"><option value="">Todos</option>${DOCS_NUEVOS.map(k=>`<option value="${k}" ${compFiltro===k?"selected":""}>${TD[k].t}</option>`).join("")}</select></label><label>Desde<input type="date" id="cp-desde" value="${compDesde}"></label><label>Hasta<input type="date" id="cp-hasta" value="${compHasta}"></label></div>`;
    const tot=st();ms.forEach(m=>{const c=movCant(m);FORMATOS.forEach(f=>tot[f.id]+=c[f.id]||0)});
    return cabeza("Compras y Devoluciones",filtros)+`<div class="compras">
      <aside class="caja docs"><h3>Ingresar documento</h3>${DOCS_NUEVOS.map(k=>`<button type="button" class="doc-btn ${k===compTipo?"on":""}" data-ctipo="${k}">${TD[k].t}</button>`).join("")}
        <p class="nota" style="margin:8px 0 0">Envases en comodato (préstamo de planta): <b class="num">${Object.values(l.comodato||{}).reduce((a,b)=>a+b,0)}</b></p></aside>
      <div class="grid" style="gap:20px;min-width:0">
      <form class="caja" id="f-mov"><h3>${e.t}</h3><p class="nota" style="margin:0">En la bodega: ${efecto}.</p>
        <div class="fila3"><label>N° documento<input id="mv-num"></label><label>Fecha del documento<input type="date" id="mv-fdoc" value="${hoyStr()}"></label><label>Total (CLP)<input type="number" min="0" id="mv-total" class="num" value="0"></label></div>
        <label>Proveedor o detalle<input id="mv-det" placeholder="Ej: planta, distribuidora mayorista"></label>
        <div class="cil-ins">${FORMATOS.map(f=>`<label class="${f.tipo==="c"?"cat":""}">${f.et}<input type="number" min="0" class="num" data-mc="${f.id}" value="0"></label>`).join("")}</div>
        <div><button class="btn" type="submit">Grabar documento</button></div></form>
      <div class="tabla-wrap"><table><thead><tr><th>N°</th><th>Tipo</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th>Fecha ingreso</th><th>Fecha documento</th><th class="der">Total</th><th></th></tr></thead><tbody>
      ${ms.map(m=>{const c=movCant(m);return `<tr><td>${esc(m.num||"—")}</td><td>${esc((TD[m.tipo]||{}).t||m.tipo)}${m.det?`<br><span class="nota" style="margin:0">${esc(m.det)}</span>`:""}</td>${FORMATOS.map(f=>`<td class="der num">${c[f.id]||""}</td>`).join("")}<td class="num">${esc(fF(m.fecha))}</td><td class="num">${esc(m.fdoc?fF(m.fdoc):"—")}</td><td class="der num">${clp(m.total||0)}</td><td>${m.k?`<button class="btn chico linea" type="button" data-delmov="${m.k}">Anular</button>`:""}</td></tr>`}).join("")||`<tr><td colspan="${FORMATOS.length+6}">No hay documentos en estas fechas.</td></tr>`}
      </tbody>${ms.length?`<tfoot><tr><td colspan="2">Total</td>${FORMATOS.map(f=>`<td class="der num">${tot[f.id]||""}</td>`).join("")}<td></td><td></td><td class="der num">${clp(ms.reduce((s,m)=>s+(m.total||0),0))}</td><td></td></tr></tfoot>`:""}</table></div>
      </div></div>`;
  },
  bodega(){
    const l=ensureLoc(loc(suc)),min=D.precios.minimo,chs=D.choferes.filter(c=>c.local===suc).map(ensureCh);
    const suma=(...os)=>{const r={};FORMATOS.forEach(f=>r[f.id]=os.reduce((s,o)=>s+(o[f.id]||0),0));return r};
    const cargas=suma(...chs.map(c=>c.carga)),vacCh=suma(...chs.map(c=>c.vacios));
    const tot=o=>FORMATOS.reduce((s,f)=>s+o[f.id],0);
    const fila=(n,o,cls="")=>`<tr class="${cls}"><td>${n}</td>${FORMATOS.map(f=>`<td class="der num ${o[f.id]<0?"saldo-pos":""}">${o[f.id]}</td>`).join("")}<td class="der num"><b>${tot(o)}</b></td></tr>`;
    const cab=t=>`<thead><tr><th>${t}</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th class="der">Total</th></tr></thead>`;
    const tabs=`<div class="tabs" role="tablist">${[["stock","Stock"],["ventas","Ventas por fecha"],["cargas","Cargar y descargar móviles"],["recuento","Cuadratura de stock"],["historial","Historial"]].map(([k,v])=>`<button type="button" role="tab" data-btab="${k}" aria-selected="${bTab===k}">${v}</button>`).join("")}</div>`;
    let html="";
    if(bTab==="stock"){
      const U=suma(l.stock,cargas,l.vacios,vacCh),bajos=FORMATOS.filter(f=>l.stock[f.id]<min);
      html=`${bajos.length?`<div class="banner" style="background:#FBE4E2;color:#7E211A">Stock bajo en bodega: ${bajos.map(f=>`${f.et} (${l.stock[f.id]})`).join(", ")}. Mínimo configurado: ${min}.</div>`:""}
      <div class="grid dos" style="gap:20px;align-items:start">
      <div class="bloque" style="margin-top:0"><h3>Cilindros llenos</h3><div class="tabla-wrap"><table class="bod">${cab("Dónde están")}<tbody>
        ${fila("<b>Bodega</b>",l.stock,"fila-fuerte")}${chs.map(c=>fila(esc(c.nombre),c.carga)).join("")}
        ${fila("<b>Cargas móviles</b>",cargas,"subt")}${fila("<b>Total llenos</b>",suma(l.stock,cargas),"subt")}</tbody></table></div></div>
      <div>
        <div class="bloque" style="margin-top:0"><h3>Cilindros vacíos</h3><div class="tabla-wrap"><table class="bod">${cab("")}<tbody>
          ${fila("Bodega",l.vacios)}${fila("En móviles",vacCh)}${fila("<b>Total vacíos</b>",suma(l.vacios,vacCh),"subt")}${fila("Envases prestados a clientes",l.prestados)}</tbody></table></div></div>
        <div class="bloque"><h3>Universo de cilindros</h3><div class="tabla-wrap"><table class="bod">${cab("")}<tbody>
          ${fila("Total universo<br><span style='color:var(--muted);font-size:.85rem'>llenos + vacíos</span>",U,"subt")}${fila("Total universo con préstamos",suma(U,l.prestados),"subt")}</tbody></table></div></div>
        <div class="bloque"><h3>${esAdmin()?"Bodega de todas las sucursales":"Bodega de sus sucursales"}</h3><div class="tabla-wrap"><table>${cab("Sucursal")}<tbody>
          ${D.locales.filter(x=>misSucs().includes(x.id)).map(x=>`<tr><td>${esc(x.nombre)}</td>${FORMATOS.map(f=>`<td class="der num">${x.stock[f.id]<min?`<span class="pill bajo">${x.stock[f.id]}</span>`:x.stock[f.id]}</td>`).join("")}<td class="der num"><b>${tot(x.stock)}</b></td></tr>`).join("")}</tbody></table></div></div>
      </div></div>
      <p class="nota">Los números en rojo son negativos: revise con una Cuadratura de stock. Las entregas de cada móvil se descuentan de su carga.</p>`;
    }
    if(bTab==="ventas"){
      const dias=[];{const d=new Date(bvIni+"T12:00"),fin=new Date(bvFin+"T12:00");while(d<=fin&&dias.length<400){dias.push(fechaISO(d));d.setDate(d.getDate()+1)}}
      const delDia=d=>{const o={};FORMATOS.forEach(f=>o[f.id]=0);let monto=0;
        D.pedidos.filter(p=>p.local===suc&&p.estado==="entregado"&&(p.entregado||p.fecha).startsWith(d)).forEach(p=>{items(p).forEach(i=>o[i.formato]+=i.cant);monto+=totalP(p)});
        D.ventas.filter(v=>v.local===suc&&v.fecha.startsWith(d)).forEach(v=>{o[v.formato]+=v.cant;monto+=montoV(v)});
        (D.rendiciones||[]).filter(r=>r.tipo==="mayorista"&&r.local===suc&&r.fecha===d).forEach(r=>{FORMATOS.forEach(f=>o[f.id]+=r.ventas[f.id]||0);monto+=calcRend(r).venta});
        return {o,monto,cil:tot(o),kg:FORMATOS.reduce((s,f)=>s+o[f.id]*f.kg,0)}};
      const rows=dias.map(d=>({d,...delDia(d)})).reverse();
      const To=suma(...rows.map(x=>x.o)),Tkg=rows.reduce((s,x)=>s+x.kg,0),Tm=rows.reduce((s,x)=>s+x.monto,0);
      html=`<div class="acc" style="margin-bottom:18px;align-items:end"><label>Desde<input type="date" id="bv-ini" value="${bvIni}"></label><label>Hasta<input type="date" id="bv-fin" value="${bvFin}"></label>
        <button class="btn chico linea" type="button" id="bv-hoy">Hoy</button><button class="btn chico linea" type="button" id="bv-mes">Este mes</button></div>
      <div class="kpis"><div class="kpi"><span>Cilindros vendidos</span><b class="num">${tot(To)}</b></div><div class="kpi"><span>Kilos vendidos</span><b class="num">${Tkg.toLocaleString("es-CL")} kg</b></div>
        <div class="kpi"><span>Monto vendido</span><b class="num">${clp(Tm)}</b></div><div class="kpi"><span>Días con venta</span><b class="num">${rows.filter(x=>x.cil).length} / ${rows.length}</b></div></div>
      <div class="tabla-wrap"><table class="bod"><thead><tr><th>Fecha</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th class="der">Cilindros</th><th class="der">Kilos</th><th class="der">Monto</th></tr></thead><tbody>
      ${rows.map(x=>`<tr class="${x.cil?"":"sin-venta"}"><td>${new Date(x.d+"T12:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}</td>${FORMATOS.map(f=>`<td class="der num">${x.o[f.id]}</td>`).join("")}<td class="der num"><b>${x.cil}</b></td><td class="der num">${x.kg.toLocaleString("es-CL")}</td><td class="der num">${clp(x.monto)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total unidades</td>${FORMATOS.map(f=>`<td class="der num">${To[f.id]}</td>`).join("")}<td class="der num">${tot(To)}</td><td class="der num">${Tkg.toLocaleString("es-CL")}</td><td class="der num">${clp(Tm)}</td></tr>
        <tr><td>Total kilos</td>${FORMATOS.map(f=>`<td class="der num">${(To[f.id]*f.kg).toLocaleString("es-CL")} kg</td>`).join("")}<td></td><td class="der num">${Tkg.toLocaleString("es-CL")} kg</td><td></td></tr></tfoot></table></div>
      <p class="nota">Incluye entregas de los móviles, ventas en mesón y ventas a mayoristas de ${esc(l.nombre)}.</p>`;
    }
    if(bTab==="cargas"){
      if(!chs.length)html='<div class="caja"><p>Esta sucursal no tiene móviles. Agréguelos en Asigna Ruta o en Administración.</p></div>';
      else{
        const c=chs.find(x=>x.id===bChofer)||chs[0];bChofer=c.id;
        const ins=(pref,vals)=>`<div class="cil-ins">${FORMATOS.map(f=>`<label>${f.et}<input type="number" min="0" class="num" data-${pref}="${f.id}" value="${vals?Math.max(0,vals[f.id]):0}"></label>`).join("")}</div>`;
        html=`<label style="max-width:320px;margin-bottom:18px">Móvil<select id="b-chofer">${chs.map(x=>`<option value="${x.id}" ${x.id===c.id?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></label>
        <div class="tabla-wrap" style="margin-bottom:20px"><table class="bod">${cab("Lo que lleva "+esc(c.nombre))}<tbody>${fila("Llenos",c.carga)}</tbody></table></div>
        <form class="caja" id="f-editcarga" style="max-width:900px"><h3>Editar carga de ${esc(c.nombre)}</h3><p class="nota" style="margin:0">Escriba los llenos que lleva el camión ahora (sale a vender solo con llenos). Es solo para corregir la carga: <b>no mueve stock de la bodega</b>. El cambio queda en el Historial.</p>
          <span class="eyebrow">Llenos en el camión</span>${ins("el",c.carga)}
          <div class="acc"><button class="btn" type="submit">Guardar carga</button><button class="btn linea" type="button" id="ec-cero">Dejar en cero</button></div></form>`;
      }
    }
    if(bTab==="recuento"){
      const rows=[["llenos","Llenos en bodega",l.stock],["vacios","Vacíos en bodega",l.vacios],["prestados","Envases prestados",l.prestados]];
      const recs=(D.recuentos||[]).filter(r=>r.local===suc);
      html=`<p class="nota" style="margin:0 0 16px">Cuente los cilindros que hay en la bodega de ${esc(l.nombre)} e ingrese lo que contó. El sistema muestra la diferencia con lo registrado. Al guardar, el stock queda igual a lo contado y la diferencia queda anotada con fecha y usuario.</p>
      <form class="caja" id="f-recuento"><div class="tabla-wrap"><table class="bod"><thead><tr><th></th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}</tr></thead><tbody>
      ${rows.map(([k,n,o])=>`<tr class="subt"><td colspan="${FORMATOS.length+1}"><b>${n}</b></td></tr>
        <tr><td>Según sistema</td>${FORMATOS.map(f=>`<td class="der num">${o[f.id]}</td>`).join("")}</tr>
        <tr><td>Contados</td>${FORMATOS.map(f=>`<td class="der"><input type="number" min="0" class="num" data-rc="${k}:${f.id}" value="${Math.max(0,o[f.id])}" aria-label="${n} ${f.et} contados"></td>`).join("")}</tr>
        <tr><td>Diferencia</td>${FORMATOS.map(f=>`<td class="der num" id="rd-${k}-${f.id}">0</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
      <label>Observación<input id="rc-obs" placeholder="Ej: recuento de cierre del día"></label>
      <div><button class="btn" type="submit">Guardar recuento y ajustar stock</button></div></form>
      <div class="bloque"><h3>Recuentos anteriores</h3><div class="tabla-wrap"><table><thead><tr><th>Fecha</th><th>Hecho por</th>${FORMATOS.map(f=>`<th class="der">Llenos ${f.et}</th>`).join("")}${FORMATOS.map(f=>`<th class="der">Vacíos ${f.et}</th>`).join("")}<th>Observación</th></tr></thead><tbody>
      ${recs.length?recs.map(r=>`<tr><td class="num">${esc(r.fecha)}</td><td>${esc(r.user)}</td>${["llenos","vacios"].map(k=>FORMATOS.map(f=>{const d=r.contado[k][f.id]-r.sistema[k][f.id];return `<td class="der num ${d?(d<0?"saldo-pos":"saldo-neg"):""}">${d>0?"+":""}${d}</td>`}).join("")).join("")}<td>${esc(r.obs)}</td></tr>`).join(""):`<tr><td colspan="${3+FORMATOS.length*2}">Todavía no hay recuentos en esta sucursal.</td></tr>`}
      </tbody></table></div><p class="nota">Las columnas muestran la diferencia: en rojo faltaban cilindros, en azul sobraban.</p></div>`;
    }
    if(bTab==="historial"){
      const ev=(D.bitacora||[]).filter(b=>b.local===suc&&["bodega","ventas"].includes(b.area)&&b.fecha.slice(0,10)>=bIni&&b.fecha.slice(0,10)<=bFin);
      html=`<div class="acc" style="margin-bottom:16px;align-items:end"><label>Desde<input type="date" id="b-ini" value="${bIni}"></label><label>Hasta<input type="date" id="b-fin" value="${bFin}"></label></div>
      <div class="tabla-wrap"><table><thead><tr><th>Fecha y hora</th><th>Movimiento</th><th>Detalle</th><th>Hecho por</th></tr></thead><tbody>
      ${ev.length?ev.map(b=>`<tr><td class="num">${esc(b.fecha)}</td><td><b>${esc(b.accion)}</b></td><td>${esc(b.detalle)}</td><td>${esc(b.user)}</td></tr>`).join(""):'<tr><td colspan="4">No hay movimientos de bodega en estas fechas.</td></tr>'}
      </tbody></table></div>`;
    }
    return cabeza("Control de Bodega")+tabs+html;
  },
  caja(){
    const hoy=hoyStr(),l=ensureLoc(loc(suc)),PE=D.preciosEnvase||{};
    const vs=D.ventas.filter(v=>v.local===suc&&v.fecha.startsWith(hoy)),gs=D.gastos.filter(g=>g.local===suc&&g.fecha.startsWith(hoy));
    const totV=vs.reduce((s,v)=>s+montoV(v),0),ef=vs.filter(v=>v.medio==="efectivo").reduce((s,v)=>s+montoV(v),0);
    const salidas=gs.filter(g=>g.tipo!=="abono").reduce((s,g)=>s+g.monto,0),abonos=gs.filter(g=>g.tipo==="abono").reduce((s,g)=>s+g.monto,0);
    const tabs=`<div class="tabs" role="tablist">${[["venta","Venta local"],["retiros","Retiros y abonos"],["rendicion","Rendición del local →"]].map(([k,v])=>`<button type="button" role="tab" data-cjtab="${k}" aria-selected="${cjTab===k}">${v}</button>`).join("")}</div>`;
    const kpis=`<div class="kpis"><div class="kpi"><span>Ventas de hoy</span><b class="num">${clp(totV)}</b></div><div class="kpi"><span>Cobrado en efectivo</span><b class="num">${clp(ef)}</b></div>
      <div class="kpi"><span>Gastos y retiros</span><b class="num">${clp(salidas)}</b></div><div class="kpi"><span>Efectivo en caja</span><b class="num">${clp(ef-salidas+abonos)}</b></div></div>`;
    let html="";
    if(cjTab==="retiros"){
      const TG={gasto:"Gasto de caja chica",retiro:"Retiro de caja",abono:"Abono a caja"};
      html=`<div class="dos-col"><form class="caja" id="f-gasto"><h3>Registrar movimiento de caja</h3>
        <label>Tipo<select id="gs-tipo">${Object.entries(TG).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>
        <label>Detalle<input id="gs-det" required placeholder="Ej: combustible camión"></label>
        <label>Monto (CLP)<input id="gs-monto" type="number" min="1" required class="num"></label>
        <div><button class="btn" type="submit">Registrar</button></div><p class="nota" style="margin:0">Gastos y retiros restan del efectivo en caja. Los abonos suman.</p></form>
        <div style="min-width:0"><div class="tabla-wrap"><table><thead><tr><th>Hora</th><th>Tipo</th><th>Detalle</th><th class="der">Monto</th></tr></thead><tbody>
        ${gs.length?gs.map(g=>`<tr><td class="num">${esc(g.fecha.slice(11))}</td><td>${TG[g.tipo||"gasto"]}</td><td>${esc(g.det)}</td><td class="der num">${g.tipo==="abono"?"+":"−"}${clp(g.monto)}</td></tr>`).join(""):'<tr><td colspan="4">Sin movimientos de caja hoy.</td></tr>'}
        </tbody></table></div></div></div>`;
    }else{
      const grupos={};vs.forEach(v=>{const g=v.grupo||v.id;(grupos[g]=grupos[g]||[]).push(v)});
      html=`<form class="caja venta-local" id="f-venta">
        <div class="barra" style="margin:0"><h3>Nueva venta en ${esc(l.nombre)}</h3><span class="nota" style="margin:0">Precios vigentes de venta local</span></div>
        <div class="cilindros">${FORMATOS.map(f=>`<div class="cil cil-v">${cilSVG(f)}
          <b>${f.et}</b><span class="num">${clp(D.precios[f.id])}</span>
          <label class="mini">Cantidad<input type="number" min="0" value="0" class="num" data-vc="${f.id}"></label>
          <label class="mini">Con envase <span class="num">+${clp(PE[f.id]||0)}</span><input type="number" min="0" value="0" class="num" data-ve="${f.id}"></label></div>`).join("")}</div>
        <div class="fila3"><label>Descuento (CLP)<input id="vt-dcto" type="number" min="0" value="0" class="num"></label><label>Medio de pago<select id="vt-medio">${opcMedios()}</select></label>
          <div class="vt-total"><span>Total a cobrar</span><b class="num" id="vt-total">$0</b></div></div>
        <div class="acc"><button class="btn" type="submit">Grabar venta</button><button class="btn linea" type="reset">Nueva venta</button><span class="error" id="vt-error" hidden></span></div>
        <p class="nota" style="margin:0">"Con envase" es cuántos de esos cilindros se venden con el envase (el cliente no entrega vacío).</p>
      </form>
      <div class="bloque"><h3>Ventas de hoy <span class="num" style="color:var(--muted);font-weight:500">(${Object.keys(grupos).length})</span></h3><div class="tabla-wrap"><table><thead><tr><th>Hora</th><th>Detalle</th><th>Medio</th><th class="der">Descuento</th><th class="der">Monto</th><th></th></tr></thead><tbody>
      ${Object.entries(grupos).map(([g,ls])=>`<tr><td class="num">${esc(ls[0].fecha.slice(11))}</td><td>${resumenGrupo(ls)}</td><td>${MEDIOS[ls[0].medio]||""}</td><td class="der num">${clp(ls.reduce((s,v)=>s+(v.dcto||0),0))}</td><td class="der num"><b>${clp(ls.reduce((s,v)=>s+montoV(v),0))}</b></td>
        <td class="der"><button class="btn chico linea" data-anularv="${g}" type="button">Anular</button></td></tr>`).join("")||'<tr><td colspan="6">Todavía no hay ventas hoy.</td></tr>'}
      </tbody></table></div></div>`;
    }
    return cabeza("Caja Chica / Venta Local")+tabs+kpis+html;
  },
  informes(){
    if(infTab==="catalogo")return infRep?verReporte():catalogo();
    if(infTab==="diario")return registroDiario();
    const ids=alcanceInf==="todas"?misSucs():[suc];
    const desde=periodoInf==="todo"?"0000":(()=>{const d=new Date();d.setDate(d.getDate()-(+periodoInf));return `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`})();
    const its=[...D.pedidos.filter(p=>p.estado==="entregado"&&ids.includes(p.local)&&(p.entregado||p.fecha)>=desde).flatMap(p=>items(p).map(i=>({...i,local:p.local,canal:"Despacho"}))),
                 ...D.ventas.filter(v=>ids.includes(v.local)&&v.fecha>=desde).map(v=>({...v,canal:"Mesón"}))];
    const dctos=D.pedidos.filter(p=>p.estado==="entregado"&&ids.includes(p.local)&&(p.entregado||p.fecha)>=desde).reduce((s,p)=>s+(p.dcto||0),0);
    const total=-dctos+its.reduce((s,i)=>s+i.precio*i.cant,0),cil=its.reduce((s,i)=>s+i.cant,0),kg=its.reduce((s,i)=>s+i.cant*fmt(i.formato).kg,0);
    const anul=D.pedidos.filter(p=>p.estado==="anulado"&&ids.includes(p.local)&&p.fecha>=desde).length;
    const filtros=`<div class="acc"><label>Período<select id="inf-per"><option value="0">Hoy</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="todo">Todo</option></select></label>
      ${misSucs().length>1?`<label>Alcance<select id="inf-alc"><option value="suc">Esta sucursal</option><option value="todas">Todas las sucursales</option></select></label>`:""}</div>`;
    return cabeza("Informes",filtros)+tabsInf()+`<div class="kpis">
      <div class="kpi"><span>Total vendido</span><b class="num">${clp(total)}</b></div>
      <div class="kpi"><span>Cilindros vendidos</span><b class="num">${cil}</b></div>
      <div class="kpi"><span>Kilos de gas</span><b class="num">${kg.toLocaleString("es-CL")} kg</b></div>
      <div class="kpi"><span>Pedidos anulados</span><b class="num">${anul}</b></div></div>
      <div class="bloque" style="margin-top:0"><h3>Ventas por cilindro</h3><div class="tabla-wrap"><table><thead><tr><th>Cilindro</th><th class="der">Despacho</th><th class="der">Mesón</th><th class="der">Unidades</th><th class="der">Monto</th></tr></thead><tbody>
      ${FORMATOS.map(f=>{const it=its.filter(i=>i.formato===f.id);return `<tr><td>${f.et}</td><td class="der num">${it.filter(i=>i.canal==="Despacho").reduce((s,i)=>s+i.cant,0)}</td><td class="der num">${it.filter(i=>i.canal==="Mesón").reduce((s,i)=>s+i.cant,0)}</td><td class="der num">${it.reduce((s,i)=>s+i.cant,0)}</td><td class="der num">${clp(it.reduce((s,i)=>s+i.precio*i.cant,0))}</td></tr>`}).join("")}
      </tbody></table></div></div>
      ${ids.length>1?`<div class="bloque"><h3>Ventas por sucursal</h3><div class="tabla-wrap"><table><thead><tr><th>Sucursal</th><th class="der">Cilindros</th><th class="der">Monto</th></tr></thead><tbody>
      ${D.locales.filter(l=>ids.includes(l.id)).map(l=>{const it=its.filter(i=>i.local===l.id);return `<tr><td>${esc(l.nombre)}</td><td class="der num">${it.reduce((s,i)=>s+i.cant,0)}</td><td class="der num">${clp(it.reduce((s,i)=>s+i.precio*i.cant,0))}</td></tr>`}).join("")}
      </tbody></table></div></div>`:""}`;
  },
  precios(){
    const p=D.precios,hist=D.historialPrecios||[],prog=(D.programados||[]).slice().sort((a,b)=>a.desde.localeCompare(b.desde));
    return cabeza("Precio Domicilio")+`<div class="grid kpis">${FORMATOS.map(f=>`<div class="kpi"><span>Cilindro ${f.et}</span><b class="num">${clp(p[f.id])}</b><span class="num">${clp(p[f.id]/f.kg)} por kg</span></div>`).join("")}</div>
      <p class="nota" style="margin:0 0 10px">Precios vigentes desde el ${fechaLarga(p.fecha)}. Se muestran en el sitio web y se usan en todos los pedidos y ventas nuevos${D.locales.length>1?` de las ${D.locales.length} sucursales`:""}.</p>
      <div class="precios-col">
      <form class="caja" id="f-pr">
        <h3>Cambiar precios</h3>
        <div class="ajuste">
          <label>Subir o bajar todos en<input id="aj-monto" type="number" min="0" step="10" value="500" class="num"></label>
          <label>Tipo<select id="aj-tipo"><option value="pesos">Pesos</option><option value="pct">Porcentaje</option></select></label>
          <div class="acc"><button type="button" class="btn chico linea" data-aj="1">▲ Subir</button><button type="button" class="btn chico linea" data-aj="-1">▼ Bajar</button></div>
        </div>
        <div class="fila">${FORMATOS.map(f=>`<label>Cilindro ${f.et}<input class="num" type="number" min="0" step="1" id="pn-${f.id}" value="${p[f.id]}"><span id="dif-${f.id}"></span></label>`).join("")}</div>
        <label>Rige desde<input type="date" id="pn-desde" value="${hoyStr()}"></label>
        <div class="acc"><button type="button" class="btn chico linea" id="pn-hoy">Desde hoy</button><button type="button" class="btn chico linea" id="pn-jueves">Próximo jueves</button></div>
        <label>Motivo (opcional)<input id="pn-motivo" placeholder="Ej: alza semanal del proveedor"></label>
        <button class="btn" type="submit">Guardar precios</button>
        <p class="error" id="pn-error" hidden></p>
        <p class="nota" style="margin:0">Si elige una fecha futura, el cambio queda programado y se aplica solo ese día.</p>
      </form>
      <div style="min-width:0">
        <p class="aviso ok" id="pn-ok" hidden style="margin-bottom:18px"></p>
        ${prog.length?`<h3 style="margin-bottom:12px">Cambios programados</h3><div class="tabla-wrap" style="margin-bottom:28px"><table><thead><tr><th>Rige desde</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th></th></tr></thead><tbody>
          ${prog.map(x=>`<tr><td>${fechaLarga(x.desde)}</td>${FORMATOS.map(f=>`<td class="der num">${clp(x.precios[f.id])}</td>`).join("")}<td><button class="btn chico linea" data-cancelar="${x.id}" type="button">Cancelar</button></td></tr>`).join("")}</tbody></table></div>`:""}
        <h3 style="margin-bottom:12px">Historial de cambios</h3>
        <div class="tabla-wrap"><table><thead><tr><th>Rige desde</th>${FORMATOS.map(f=>`<th class="der">${f.et}</th>`).join("")}<th>Hecho por</th></tr></thead><tbody>
        ${hist.length?hist.map(h=>`<tr><td class="num">${esc(h.desde.split("-").reverse().join("-"))}</td>${FORMATOS.map(f=>`<td class="der num">${clp(h.nuevos[f.id])}<br>${difPrecio(h.ant[f.id],h.nuevos[f.id])}</td>`).join("")}<td>${esc(h.user)}${h.motivo?`<br><span style="color:var(--muted)">${esc(h.motivo)}</span>`:""}</td></tr>`).join(""):'<tr><td colspan="6">Todavía no hay cambios. Cada vez que guarde precios nuevos quedará anotado aquí.</td></tr>'}
        </tbody></table></div>

      </div></div>`;
  },
  petroleo(){
    const chs=chOrden().filter(c=>c.local===suc),regs=(D.petroleo||[]).filter(x=>x.local===suc&&x.fecha.startsWith(petMes)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const L=regs.reduce((s,x)=>s+x.litros,0),M=regs.reduce((s,x)=>s+x.monto,0),PAGO={caja:"Efectivo de caja",tarjeta:"Tarjeta de la empresa",chofer:"Lo pagó el chofer"};
    const porMovil=Object.entries(Gr(regs,x=>x.chofer)).map(([id,v])=>{const conKm=v.filter(x=>x.km).sort((a,b)=>a.km-b.km),l=v.reduce((s,x)=>s+x.litros,0),m=v.reduce((s,x)=>s+x.monto,0);
      const rec=conKm.length>1?conKm[conKm.length-1].km-conKm[0].km:0,lRec=conKm.length>1?conKm.slice(1).reduce((s,x)=>s+x.litros,0):0;
      return `<tr><td>${esc(nomChofer(+id))}</td><td class="der num">${v.length}</td><td class="der num">${(Math.round(l*10)/10).toLocaleString("es-CL")}</td><td class="der num">${clp(m)}</td><td class="der num">${rec?rec.toLocaleString("es-CL")+" km":"—"}</td><td class="der num">${rec&&lRec?(Math.round(rec/lRec*10)/10).toLocaleString("es-CL")+" km/l":"—"}</td></tr>`}).join("");
    return cabeza("Petróleo",`<label>Mes<input type="month" id="pt-mes" value="${petMes}"></label>`)+`<div class="kpis">
      <div class="kpi"><span>Litros del mes</span><b class="num">${(Math.round(L*10)/10).toLocaleString("es-CL")}</b></div><div class="kpi"><span>Gasto del mes</span><b class="num">${clp(M)}</b></div>
      <div class="kpi"><span>Precio promedio</span><b class="num">${L?clp(M/L):"—"}</b></div><div class="kpi"><span>Cargas</span><b class="num">${regs.length}</b></div></div>
      <div class="dos-col">
      <form class="caja" id="f-pet"><h3>Registrar carga de combustible</h3>
        <label>Fecha y hora<input type="datetime-local" id="pt-fecha" value="${ahora().replace(" ","T")}"></label>
        <label>Móvil<select id="pt-chofer" required>${chs.map(c=>`<option value="${c.id}">${esc(c.nombre)}${c.patente?" · "+esc(c.patente):""}</option>`).join("")}</select></label>
        <div class="fila"><label>Litros<input id="pt-litros" type="number" min="0.1" step="0.1" required class="num"></label><label>Monto (CLP)<input id="pt-monto" type="number" min="1" required class="num"></label></div>
        <div class="fila"><label>Kilometraje (odómetro)<input id="pt-km" type="number" min="0" class="num" placeholder="Opcional"></label><label>N° boleta<input id="pt-boleta"></label></div>
        <label>Estación de servicio<input id="pt-estacion" placeholder="Ej: Copec Av. Matta"></label>
        <label>Pagado con<select id="pt-pago">${Object.entries(PAGO).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>
        <div><button class="btn" type="submit">Registrar carga</button></div>
        <p class="nota" style="margin:0">Si se paga con efectivo de caja, se descuenta solo como gasto en Caja Chica. Con el kilometraje se calcula el rendimiento (km por litro).</p>
        ${chs.length?"":'<p class="error">Esta sucursal no tiene móviles. Agréguelos en Asigna Ruta.</p>'}</form>
      <div style="min-width:0">
        <h3 style="margin-bottom:12px">Resumen por móvil</h3>
        <div class="tabla-wrap" style="margin-bottom:24px"><table><thead><tr><th>Móvil</th><th class="der">Cargas</th><th class="der">Litros</th><th class="der">Gasto</th><th class="der">Recorrido</th><th class="der">Rendimiento</th></tr></thead><tbody>${porMovil||'<tr><td colspan="6">Sin cargas este mes.</td></tr>'}</tbody></table></div>
        <h3 style="margin-bottom:12px">Cargas del mes</h3>
        <div class="tabla-wrap"><table><thead><tr><th>Fecha</th><th>Móvil</th><th class="der">Litros</th><th class="der">Monto</th><th class="der">$ / litro</th><th class="der">Km</th><th>Estación / boleta</th><th>Pago</th><th></th></tr></thead><tbody>
        ${regs.map(x=>`<tr><td class="num">${esc(fF(x.fecha))} ${esc(x.fecha.slice(11))}</td><td>${esc(nomChofer(x.chofer))}</td><td class="der num">${x.litros.toLocaleString("es-CL")}</td><td class="der num">${clp(x.monto)}</td><td class="der num">${clp(x.monto/x.litros)}</td><td class="der num">${x.km?x.km.toLocaleString("es-CL"):"—"}</td>
          <td>${esc(x.estacion||"")}${x.boleta?`<br><span class="nota" style="margin:0">Boleta ${esc(x.boleta)}</span>`:""}</td><td>${PAGO[x.pago]||""}<br><span class="nota" style="margin:0">${esc(x.user||"")}</span></td><td><button class="btn chico linea" data-delpet="${x.k}" type="button">Anular</button></td></tr>`).join("")||'<tr><td colspan="9">Sin cargas este mes.</td></tr>'}
        </tbody></table></div></div></div>`;
  },
  manual(){
    const TX={sectorizar:"En «Mapa de calles» dibuje cada zona sobre las calles reales (Santiago, Estación Central, Recoleta, Independencia, Conchalí, Quinta Normal, Cerrillos, Padre Hurtado y Peñaflor): elija «Dibujar zona», el sector, y haga clic en cada esquina del borde. Para calles que cruzan dos sectores agregue una regla por número (ej: San Pablo del 1 al 2999). El pedido se ubica por calle y número; si no se encuentra, use «Marcar en mapa». En la pestaña «Región Metropolitana» vea qué comunas tiene cada sector y qué camiones lo atienden. Para cambiar un sector, elíjalo y haga clic en las comunas. Con «Despachar pendientes» cada pedido se envía al camión de su sector con menos pedidos en ruta; si el sector no tiene camión, va al sector más cercano. Active «Enviar solo cada pedido nuevo» para que se despache al grabarlo.",pedidos:"Ingrese los pedidos que llegan por teléfono, WhatsApp o apps. Al escribir la calle, el sistema sugiere las calles reales y revisa que el número exista y que la dirección quede dentro de las zonas de reparto; si queda fuera, avisa antes de grabar. Al escribir el teléfono de un cliente que ya pidió antes, sus datos (dirección, lista, pago y factura) se completan solos; con «Repetir último pedido» también se cargan los cilindros. Elija los cilindros (normales o H15), la venta de envase si corresponde, la lista de precios y la forma de pago.",
      ruta:"Asigne cada pedido a un móvil. \"Sectorizar\" pone el sector según la comuna y sugiere el móvil de ese sector. Use R si el cliente reclama, A para anular y CF si el móvil cerró un pedido sin entregarlo (vuelve a En ruta).",
      precios:"Cambie los precios de todos los cilindros juntos o uno por uno, ahora o programado para un día (por ejemplo, el próximo jueves). También se editan los precios mayoristas.",
      informes:"Todos los informes de pedidos y rendiciones. Elija las fechas y la sucursal, y descargue a Excel si lo necesita.",
      petroleo:"Registre cada carga de combustible de los móviles: litros, monto, kilometraje y boleta. Calcula el gasto del mes y el rendimiento de cada móvil.",
      mayorista:"Elija el cliente, escriba los cilindros y grabe. El precio sale solo según la lista del cliente (Configuraciones → Precios mayoristas). En «Cuenta clientes» ve cuánto debe cada uno y registra abonos. Los vales recibidos en la Rendición mayorista dan comisión al cliente.",
      cuadratura:"Cuadre a cada móvil, mayorista o local: ingrese lo vendido y cada pago (efectivo, Transbank, vales, cheques, etc.). El saldo se calcula solo.",
      compras:"Registre las compras al proveedor y las devoluciones. El stock de la bodega se actualiza solo.",
      chofer:"El repartidor ve sus pedidos en ruta y marca Entregado o No entregado. En Registro completo queda todo lo que pasó, con la hora.",
      bodega:"Stock de llenos y vacíos de la bodega y de cada móvil, cargas y descargas, cuadratura de stock (recuento) y ventas por fecha con kilos.",
      caja:"Ventas en mesón, gastos, retiros y abonos de caja, y la rendición del local al cierre del día.",
      config:"Stock mínimo, precio de envases y sectores de reparto (qué comunas tiene cada sector).",
      admin:"Sucursales y choferes de la empresa.",respaldos:"Copie todos los datos en un texto para guardarlo, restaure una copia o vuelva a los datos de ejemplo.",
      usuarios:"Cree usuarios, elija a qué sucursales entran y qué cuadros pueden usar. Desactive a quien ya no trabaja.",
      sucursal:"Cambie a otra de sus sucursales. Todo lo que haga queda en la sucursal elegida.",clave:"Cambie su clave de ingreso."};
    const items=[...MODULOS,...ACCIONES].filter(m=>TX[m.id]&&puede(m.id));
    return cabeza("Manual de Usuario")+`<p class="nota" style="margin:-8px 0 18px">Toque cada sección para ver cómo se usa. Solo aparecen las partes a las que usted tiene acceso.</p>
      <div class="manual">${items.map((m,i)=>`<details class="caja" ${i===0?"open":""}><summary><span class="ico">${svg(m.id in IC?m.id:"manual")}</span><b>${m.t.replace(/<br>/g," ")}</b></summary><p>${TX[m.id]}</p></details>`).join("")}</div>
      <p class="nota">Emergencias de gas: 600 600 7799.</p>`;
  },
  config(){
    if(!cfgTabsLista().some(t=>t[0]===cfgTab)||cfgTab==="sectorizar")cfgTab=(cfgTabsLista().find(t=>t[0]!=="sectorizar")||["choferes"])[0];
    const tabs=cfgTabsHtml(cfgTab);
    if(cfgTab==="precios")return cabeza("Configuraciones")+tabs+V.precios().replace(cabeza("Precio Domicilio"),"");
    if(cfgTab==="usuarios")return cabeza("Configuraciones")+tabs+V.usuarios().replace(cabeza("Permisos Usuarios"),"");
    if(cfgTab==="respaldos")return cabeza("Configuraciones")+tabs+V.respaldos().replace(cabeza("Respaldos"),"");
    if(cfgTab==="sucursal"){if(D.locales.length===1&&editSuc==null)editSuc=D.locales[0].id;
      return cabeza("Configuraciones")+tabs+V.admin().replace(cabeza("Administración",'<button class="btn chico" id="nueva-suc" type="button">Agregar sucursal</button>'),`<p class="nota" style="margin:0 0 16px">Datos de la sucursal que aparecen en el sitio para clientes. <button type="button" class="enlace" id="nueva-suc">Agregar otra sucursal</button></p>`)}
    if(cfgTab==="choferes"){const ed=D.choferes.find(c=>c.id===cfgCh),multi=D.locales.length>1;
      const fila=c=>`<tr class="${c.activo===false?"inactivo":""}"><td><b>${esc(c.nombre)}</b></td><td class="num">${esc(c.patente||"—")}</td><td class="num">${esc(c.fono||"—")}</td>${multi?`<td>${esc(nomLocal(c.local))}</td>`:""}
        <td>${c.activo===false?'<span class="pill anulado">Inactivo</span>':'<span class="pill entregado">Activo</span>'}</td>
        <td class="der"><div class="acc" style="justify-content:flex-end"><button class="btn chico linea" type="button" data-cfedit="${c.id}">Editar</button><button class="btn chico linea" type="button" data-cfact="${c.id}">${c.activo===false?"Activar":"Desactivar"}</button><button class="btn chico rojo" type="button" data-delchofer="${c.id}">Eliminar</button></div></td></tr>`;
      return cabeza("Configuraciones")+tabs+`<div class="cfg-ch">
        <form class="caja" id="f-chofer"><h3>${ed?"Editar a "+esc(ed.nombre):"Agregar chofer"}</h3>
          <label>Nombre<input id="cf-nombre" required value="${ed?esc(ed.nombre):""}" placeholder="Ej: Juan Pérez"></label>
          <div class="fila"><label>Patente del camión<input id="cf-pat" value="${ed?esc(ed.patente||""):""}" placeholder="AB-CD-12"></label><label>Teléfono<input id="cf-fono" type="tel" value="${ed?esc(ed.fono||""):""}" placeholder="+56 9 …"></label></div>
          ${multi?`<label>Sucursal<select id="cf-local">${D.locales.map(x=>`<option value="${x.id}" ${x.id===(ed?ed.local:suc)?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></label>`:""}
          <div class="acc"><button class="btn" type="submit">${ed?"Guardar cambios":"Agregar chofer"}</button>${ed?'<button class="btn linea" type="button" id="cf-cancelar">Cancelar</button>':""}</div>
          <p class="nota" style="margin:0">El sector de cada chofer se elige en Sectorizar. Para que entre a la app, créele un usuario «Repartidor» en Permisos Usuarios.</p></form>
        <div style="min-width:0"><div class="tabla-wrap"><table><thead><tr><th>Chofer</th><th>Patente</th><th>Teléfono</th>${multi?"<th>Sucursal</th>":""}<th>Estado</th><th></th></tr></thead><tbody>
          ${D.choferes.slice().sort((a,b)=>(a.activo===false)-(b.activo===false)||a.nombre.localeCompare(b.nombre)).map(fila).join("")||'<tr><td colspan="6">Todavía no hay choferes. Agregue el primero.</td></tr>'}</tbody></table></div>
          <p class="nota">${D.choferes.filter(c=>c.activo!==false).length} activos de ${D.choferes.length}. Un chofer desactivado no recibe pedidos, pero se mantiene su historial.</p></div></div>`}
    return cabeza("Configuraciones")+tabs+(esAdmin()?`<form class="caja" id="f-mods" style="max-width:520px;margin-bottom:16px"><h3>Módulos</h3>
      <label class="radio"><input type="checkbox" id="md-may" ${D.precios.sinMayorista?"":"checked"}> <b>Venta Mayorista</b> activa</label>
      <p class="nota" style="margin:4px 0 0">Si la desactiva, «Venta Mayorista» desaparece del menú para todos, junto con Clientes, Precios Mayoristas y Comisión Vales en Configuraciones. Los datos no se borran: al activarla de nuevo vuelve todo como estaba.</p>
      <label class="radio" style="margin-top:12px"><input type="checkbox" id="md-fac" ${D.precios.sinFacturas?"":"checked"}> <b>Facturas</b> activa</label>
      <p class="nota" style="margin:4px 0 0">Si la desactiva, «Facturas» desaparece del menú y en Pedidos de Gas no se muestra «Solicita factura». Los datos no se borran.</p>
      <p class="aviso ok" id="md-ok" hidden></p></form>`:"")+`<form class="caja" id="f-config" style="max-width:520px"><h3>Alertas de stock</h3>
      <label>Stock mínimo por formato<input class="num" type="number" min="0" id="pr-minimo" value="${D.precios.minimo}"></label>
      <p class="nota" style="margin:0">Cuando la bodega tenga menos cilindros que este número, se marca en rojo en Control de Bodega. Los precios de envases se cambian en la pestaña «Precio Envases».</p>
      <button class="btn" type="submit">Guardar</button><p class="aviso ok" id="pr-ok" hidden>Configuración guardada.</p></form>
      <form class="caja" id="f-sectores" style="max-width:900px;margin-top:20px"><h3>Sectores de reparto</h3>
        <p class="nota" style="margin:0">Cada sector agrupa comunas. En Asigna Ruta, "Sectorizar pedidos" usa esta lista para poner el sector y sugerir el móvil.</p>
        ${(D.sectores||[]).map(x=>`<div class="sector-fila"><label>Sector<input data-sn="${x.id}" value="${esc(x.nombre)}"></label><label>Comunas (separadas por coma)<input data-sc="${x.id}" value="${esc(x.comunas.join(", "))}"></label><button class="btn chico linea" type="button" data-delsec="${x.id}">Quitar</button></div>`).join("")}
        <div class="acc"><button class="btn chico linea" type="button" id="sec-nuevo">Agregar sector</button><button class="btn" type="submit">Guardar sectores</button></div>
        <p class="aviso ok" id="sec-ok" hidden>Sectores guardados.</p></form>`;
  },
  admin(){
    const l=editSuc?loc(editSuc):null;
    return cabeza("Administración",'<button class="btn chico" id="nueva-suc" type="button">Agregar sucursal</button>')+
    (l?`<form class="caja" id="f-suc" style="margin-bottom:24px"><h3>Editar: ${esc(l.nombre)}</h3>
      <div class="fila"><label>Nombre<input id="sc-nombre" required value="${esc(l.nombre)}"></label><label>Comuna<input id="sc-comuna" value="${esc(l.comuna)}"></label></div>
      <label>Dirección<input id="sc-dir" value="${esc(l.dir)}"></label>
      <div class="fila3"><label>Teléfono<input id="sc-fono" value="${esc(l.fono)}"></label><label>Encargado<input id="sc-enc" value="${esc(l.encargado)}"></label><label>Horario<input id="sc-hor" value="${esc(l.horario)}"></label></div>
      <label style="max-width:240px">Estado<select id="sc-abierto"><option value="1" ${l.abierto?"selected":""}>Abierto</option><option value="0" ${!l.abierto?"selected":""}>Cerrado</option></select></label>
      <div class="acc"><button class="btn" type="submit">Guardar</button><button class="btn linea" type="button" id="sc-cancelar">Cancelar</button>${D.locales.length>1?'<button class="btn rojo" type="button" id="sc-borrar">Eliminar sucursal</button>':""}</div></form>`:"")+
    `<h3 style="margin-bottom:12px">Sucursales</h3><div class="tabla-wrap"><table><thead><tr><th>Sucursal</th><th>Dirección</th><th>Encargado</th><th>Estado</th><th></th></tr></thead><tbody>
      ${D.locales.map(x=>`<tr><td><b>${esc(x.nombre)}</b></td><td>${esc(x.dir)}, ${esc(x.comuna)}</td><td>${esc(x.encargado)}</td><td><span class="estado ${x.abierto?"abierto":"cerrado"}">${x.abierto?"Abierto":"Cerrado"}</span></td><td><button class="btn chico linea" data-editsuc="${x.id}" type="button">Editar</button></td></tr>`).join("")}
      </tbody></table></div>
    <p class="nota" style="margin-top:16px">Los choferes se agregan en <b>Configuraciones → Choferes</b>.</p>`;
  },
  respaldos(){
    return cabeza("Respaldos")+`<div class="grid dos" style="gap:24px">
      <div class="caja"><h3>Copia de seguridad</h3><p style="color:var(--muted)">Copie este texto y guárdelo en un archivo o correo. Contiene todos los datos del sistema.</p>
        <textarea id="rs-out" readonly aria-label="Respaldo">${esc(JSON.stringify(D))}</textarea>
        <div class="acc"><button class="btn" id="rs-copiar" type="button">Copiar respaldo</button><span id="rs-copiado" class="nota" style="margin:0" hidden>Copiado.</span></div></div>
      <div class="caja"><h3>Restaurar</h3><p style="color:var(--muted)">Pegue un respaldo anterior. Reemplaza todos los datos actuales.</p>
        <textarea id="rs-in" aria-label="Pegar respaldo"></textarea>
        <div class="acc"><button class="btn" id="rs-restaurar" type="button">Restaurar respaldo</button><button class="btn rojo" id="rs-reset" type="button">Volver a datos de ejemplo</button></div>
        <p class="error" id="rs-error" hidden>El texto pegado no es un respaldo válido.</p></div></div>`;
  },
  empresa(){
    const e=D.empresa;
    return cabeza("Datos Empresa")+`<form class="caja" id="f-emp" style="max-width:640px">
      <div class="fila"><label>Razón social<input id="em-razon" value="${esc(e.razon)}"></label><label>RUT<input id="em-rut" value="${esc(e.rut)}" placeholder="76.000.000-0"></label></div>
      <label>Giro<input id="em-giro" value="${esc(e.giro)}"></label>
      <label>Dirección casa matriz<input id="em-dir" value="${esc(e.dir)}"></label>
      <div class="fila"><label>Teléfono<input id="em-fono" value="${esc(e.fono)}"></label><label>Correo<input id="em-correo" type="email" value="${esc(e.correo)}"></label></div>
      <button class="btn" type="submit">Guardar</button><p class="aviso ok" id="em-ok" hidden>Datos guardados.</p></form>`;
  },
  usuarios(){
    const nube=NUBE.activo,lista=(nube?NUBE.usuarios:D.usuarios).slice().sort((a,b)=>((a.activo===false)-(b.activo===false))||(a.nombre||"").localeCompare(b.nombre||""));
    const keyOf=u=>nube?u.uid:u.user,ed=editUser!=null?lista.find(u=>keyOf(u)===editUser):null,yoKey=nube?yo.uid:yo.user;
    const ROL={admin:"Administrador",encargado:"Encargado",chofer:"Repartidor"},rolSel=ed?ed.rol:"encargado";
    const acceso=u=>u.rol==="admin"?"Todo"+(Array.isArray(u.permisos)&&!u.permisos.includes("respaldos")?' <span class="nota" style="margin:0">· sin respaldos</span>':" · con respaldos"):u.rol==="chofer"?"Móvil "+esc(nomChofer(u.chofer))+'<br><span class="nota" style="margin:0">'+appsTxt(u.permisos)+"</span>"
      :`${((u.sucursales&&u.sucursales.length?u.sucursales:(u.local?[u.local]:[])).map(nomLocal).map(esc).join(", "))||"—"}<br><span class="nota" style="margin:0">${resumenPerm(u.permisos)}</span>`;
    return cabeza("Permisos Usuarios")+`<p class="nota" style="margin:-8px 0 18px">${nube?"Los usuarios se guardan en el servidor. ":""}Elija a qué sucursales entra cada persona y qué cuadros puede usar. Cada sucursal ve solo sus propios pedidos, ventas, cuadraturas y bodega.</p>
    <form class="caja" id="f-usr" style="max-width:900px;margin-bottom:22px"><h3>${ed?"Editar a "+esc(ed.nombre):"Agregar usuario"}</h3>
      <div class="fila"><label>Nombre<input id="us-nombre" required value="${ed?esc(ed.nombre):""}"></label><label>Usuario<input id="us-user" required autocomplete="off" value="${ed?esc(ed.user):""}" ${ed?"readonly":""} placeholder="Ej: maria.maipu"></label></div>
      <div class="fila">${`<label>${ed?"Clave nueva (deje vacío para no cambiarla)":"Clave (mínimo 8, con letras y números)"}<input id="us-pass" type="password" minlength="8" ${ed?"":"required"} autocomplete="new-password"></label>`}
        <label>Tipo de usuario<select id="us-rol"><option value="encargado" ${rolSel==="encargado"?"selected":""}>Encargado o cajero de sucursal</option><option value="chofer" ${rolSel==="chofer"?"selected":""}>Repartidor</option><option value="admin" ${rolSel==="admin"?"selected":""}>Administrador (todo)</option></select></label></div>
      ${camposAcceso(ed)}
      <label class="radio" id="us-resp-l" ${puede("respaldos")?"":'style="display:none"'}><input type="checkbox" id="us-resp" ${ed?(ed.permisos==null?"checked":Array.isArray(ed.permisos)&&ed.permisos.includes("respaldos")?"checked":""):""}> Puede usar <b>Respaldos y reset</b> (copia de seguridad y borrar datos)</label>
      <label id="us-chofer-l">Móvil del repartidor<select id="us-chofer">${[...D.choferes].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(c=>`<option value="${c.id}" ${ed&&ed.chofer===c.id?"selected":""}>${esc(c.nombre)} · ${esc(nomLocal(c.local))}</option>`).join("")}</select></label>
      <div class="acc"><button class="btn" type="submit">${ed?"Guardar cambios":"Crear usuario"}</button>${ed?'<button class="btn linea" type="button" id="us-cancelar">Cancelar</button>':""}<p class="error" id="us-error" hidden></p></div></form>
    <div class="tabla-wrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Tipo</th><th>Acceso</th><th>Estado</th><th></th></tr></thead><tbody>
    ${lista.map(u=>{const k=keyOf(u);return `<tr><td>${esc(u.nombre)}</td><td class="num">${esc(u.user)}</td><td>${ROL[u.rol]||esc(u.rol)}</td><td>${acceso(u)}</td>
      <td>${u.activo===false?'<span class="pill anulado">Desactivado</span>':'<span class="pill entregado">Activo</span>'}</td>
      <td><div class="acc">${k!==yoKey&&!(u.rol==="admin"&&(u.permisos==null||(u.permisos||[]).includes("respaldos"))&&!puede("respaldos"))?`<button class="btn chico linea" data-edituser="${esc(k)}" type="button">Editar</button><button class="btn chico linea" data-toggleuser="${esc(k)}" type="button">${u.activo===false?"Activar":"Desactivar"}</button>${esAdmin()?`<button class="btn chico linea us-del" data-deluser="${esc(k)}" type="button">Eliminar</button>`:""}`:'<span class="nota" style="margin:0">Usted</span>'}</div></td></tr>`}).join("")||`<tr><td colspan="7">${nube?"Cargando usuarios…":"Sin usuarios."}</td></tr>`}
    </tbody></table></div>`;
  },
  clave(){
    return cabeza("Cambiar Contraseña")+`<form class="caja" id="f-clave" style="max-width:420px">
      <label>Clave actual<input id="ck-actual" type="password" required autocomplete="current-password"></label>
      <label>Clave nueva (mínimo 8 caracteres)<input id="ck-nueva" type="password" minlength="8" required autocomplete="new-password"></label>
      <label>Repita la clave nueva<input id="ck-rep" type="password" minlength="8" required autocomplete="new-password"></label>
      <button class="btn" type="submit">Cambiar clave</button><p class="error" id="ck-error" hidden></p><p class="aviso ok" id="ck-ok" hidden>Clave cambiada.</p></form>`;
  }
};
let bvIni=null,bvFin=null;
let chTab="ruta",chFecha=null,chFiltro="todos",bTab="stock",bIni=null,bFin=null,bChofer=null;
let cjTab="venta";
let cargaCh=null,distSel=null,liqDesde=null,liqHasta=null,compTipo="factura",compDesde=null,compHasta=null,compFiltro="";
let cfgTab="choferes",cfgCh=null,cuadTab="menu",cuadSel=null,pagoTipo="efectivo",infTab="resumen",infMes=null,infDia=null;
let editUser=null,infRep=null,repDesde=null,repHasta=null,petMes=null,ocultarMovil=false,autoRefresco=true;
let rutaVista="pend",rutaChofer=null,pTab="nuevo",choferSel=null,fechaCuad=null,periodoInf="0",alcanceInf="suc",editSuc=null;


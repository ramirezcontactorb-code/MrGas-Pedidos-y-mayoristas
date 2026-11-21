/* MR Gas · Panel General · 05-acciones */
/* ===================== ACCIONES DE CADA VISTA ===================== */
const L={
  sucursal(){$$("[data-suc]").forEach(b=>b.onclick=()=>{suc=+b.dataset.suc;D.ultimaSuc=suc;guardar();ir("menu")})},
  pedidos(){
    $$("[data-modulo-ir]").forEach(b=>b.onclick=()=>{ir(b.dataset.moduloIr);infTab="catalogo";infRep="p-detalle";pintarSistema()});
    $$("[data-estado]").forEach(s=>s.onchange=()=>{setEstado(D.pedidos.find(p=>p.id===+s.dataset.estado),s.value);guardar();pintarSistema()});
    const f=$("#f-ped");if(!f)return;
    const val=n=>(document.querySelector(`input[name="${n}"]:checked`)||{}).value,PE=D.preciosEnvase||{},lista=()=>val("np-lista")||"base";
    const num=sel=>{const el=$(sel);return el?Math.max(0,+el.value||0):0};
    const its=()=>FORMATOS.map(x=>({formato:x.id,cant:num(`[data-cant="${x.id}"]`),precio:precioLista(lista(),x.id),env:num(`[data-env="${x.id}"]`),precioEnv:PE[x.id]||0})).filter(i=>i.cant>0||i.env>0);
    const tot=()=>{FORMATOS.forEach(x=>{const e=$(`[data-pr="${x.id}"]`);if(e)e.textContent=clp(precioLista(lista(),x.id))});
      $("#np-total").textContent=clp(Math.max(0,its().reduce((s,i)=>s+i.precio*i.cant+i.env*i.precioEnv,0)-num("#np-dcto")))};
    f.addEventListener("input",tot);f.addEventListener("change",tot);tot();
    $("#np-factura").onchange=e=>$("#np-fact").hidden=!e.target.checked;
    let pinManual=null,forzarDir=false,ultRev=null,sugSel=-1,tmr=null;
    const caja=$("#np-dir"),sug=$("#np-sug"),inC=$("#np-calle");
    const pintarAsis=()=>{if(!inC.isConnected||!$("#np-num"))return;const r=ultRev=revisarDir(inC.value,$("#np-num").value,$("#np-comuna").value,pinManual);
      if(!r){caja.hidden=true;return}
      const fila=(x,extra="")=>x?`<div class="dir-f ${x.st}"><i aria-hidden="true">${x.st==="ok"?"✓":x.st==="av"?"!":"✕"}</i><span>${x.txt}</span>${extra}</div>`:"";
      caja.innerHTML=`<div class="dir-filas">${fila(r.calle,r.calle.sug?`<button type="button" class="btn chico linea" data-dirfix="${esc(r.calle.sug)}">Usar «${esc(r.calle.sug)}»</button>`:r.calle.com?`<button type="button" class="btn chico linea" data-dircom="${esc(r.calle.com)}">Cambiar a ${esc(r.calle.com)}</button>`:"")}${fila(r.num)}${fila(r.zona)}</div>
        ${r.geo&&CALLES?`<div class="dir-mapa"><canvas id="np-mini" aria-label="Ubicación del pedido en el mapa"></canvas><span class="nota" style="margin:0">${pinManual?"Punto corregido a mano. ":""}Haga clic en el mapa para corregir el punto de entrega.</span></div>`:""}`;
      caja.hidden=false;
      caja.querySelectorAll("[data-dirfix]").forEach(b=>b.onclick=()=>{inC.value=b.dataset.dirfix;pinManual=null;forzarDir=false;pintarAsis()});
      caja.querySelectorAll("[data-dircom]").forEach(b=>b.onclick=()=>{$("#np-comuna").value=b.dataset.dircom;pinManual=null;forzarDir=false;pintarAsis()});
      const cv=$("#np-mini");if(cv)miniMapa(cv,r.geo.lon,r.geo.lat,r.tramo,ll=>{pinManual=ll.map(v=>+v.toFixed(6));forzarDir=false;pintarAsis()})};
    asisDir=pintarAsis;
    caja.addEventListener("mousedown",e=>{if(e.target.closest("button,canvas"))e.preventDefault()});
    const cerrarSug=()=>{sug.hidden=true;inC.setAttribute("aria-expanded","false");sugSel=-1};
    const verSug=()=>{if(!CALLES){cerrarSug();return}const cmI=FOCO_RM.findIndex(n=>sinTilde(n)===sinTilde($("#np-comuna").value));const L=sugerirCalles(inC.value,cmI);
      if(!L.length||(L.length===1&&L[0].n===inC.value)){cerrarSug();return}
      sug.innerHTML=L.map((x,i)=>`<button type="button" role="option" data-sn="${esc(x.n)}" data-sc="${esc(FOCO_RM[x.cm])}" class="${i===sugSel?"on":""}"><b>${esc(x.n)}</b><span>${esc(FOCO_RM[x.cm])}</span></button>`).join("");sug.hidden=false;inC.setAttribute("aria-expanded","true");
      [...sug.querySelectorAll("button")].forEach(b=>b.onmousedown=e=>{e.preventDefault();elegir(b)})};
    const elegir=b=>{inC.value=b.dataset.sn;$("#np-comuna").value=b.dataset.sc;cerrarSug();pinManual=null;forzarDir=false;pintarAsis();$("#np-num").focus()};
    inC.addEventListener("input",()=>{pinManual=null;forzarDir=false;sugSel=-1;verSug();clearTimeout(tmr);tmr=setTimeout(pintarAsis,250)});
    inC.addEventListener("keydown",e=>{const bs=[...sug.querySelectorAll("button")];if(sug.hidden||!bs.length)return;
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();sugSel=(sugSel+(e.key==="ArrowDown"?1:-1)+bs.length)%bs.length;bs.forEach((b,i)=>b.classList.toggle("on",i===sugSel))}
      else if(e.key==="Enter"&&sugSel>=0){e.preventDefault();elegir(bs[sugSel])}else if(e.key==="Escape")cerrarSug()});
    inC.addEventListener("blur",()=>setTimeout(cerrarSug,120));
    ["#np-num","#np-comuna"].forEach(id=>{$(id).addEventListener("input",()=>{pinManual=null;forzarDir=false;clearTimeout(tmr);tmr=setTimeout(pintarAsis,300)});$(id).addEventListener("change",pintarAsis)});
    cargarCalles().then(()=>{if(mod==="pedidos"&&$("#np-calle")&&$("#np-calle").value)pintarAsis()}).catch(()=>{});
    $("#np-sinnum").onclick=()=>{$("#np-fono").value="Sin número";$("#np-calle").focus()};
    const set=(id,v)=>{const el=$(id);if(el&&v!=null)el.value=v};
    let llenado="";
    const rellenar=(c,conCil)=>{llenado=c.fono;$("#np-fono").value=c.fonoTxt;
      set("#np-calle",c.calle);set("#np-num",c.num);set("#np-block",c.block);set("#np-depto",c.depto);set("#np-comuna",c.comuna);set("#np-ciudad",c.ciudad||"Santiago");set("#np-ref",c.ref);
      {const sp=$("#np-pago");if(sp&&c.medio&&PAGOS_PED[c.medio])sp.value=c.medio}
      [["np-lista",c.lista],["np-tipo",c.tipo]].forEach(([n,v])=>{const r=document.querySelector(`input[name="${n}"][value="${v}"]`);if(r)r.checked=true});
      $("#np-factura").checked=!!c.factura;$("#np-fact").hidden=!c.factura;
      if(c.factura){set("#np-rut",c.factura.rut);set("#np-razon",c.factura.razon);set("#np-giro",c.factura.giro);set("#np-fdir",c.factura.dir);set("#np-fcomuna",c.factura.comuna)}
      if(conCil){$$("[data-cant],[data-env]").forEach(i=>i.value=0);(c.ultimoItems||[]).forEach(i=>{set(`[data-cant="${i.formato}"]`,i.cant);if(i.env)set(`[data-env="${i.formato}"]`,i.env)})}
      const card=$("#np-cliente"),ult=(c.ultimoItems||[]).filter(i=>i.cant).map(i=>`${i.cant}×${fmt(i.formato).et}`).join(", ");
      card.innerHTML=`<span><b>Cliente frecuente:</b> ${esc([c.calle,c.num].filter(Boolean).join(" "))}${c.depto?" depto "+esc(c.depto):""}${c.comuna?", "+esc(c.comuna):""} · ${c.pedidos||1} pedido${(c.pedidos||1)>1?"s":""} · último ${esc(fF((c.ultimo||"").slice(0,10)))}${ult?" ("+esc(ult)+")":""}</span><span class="cli-btns"><button type="button" class="btn chico" id="np-repetir">Repetir último pedido</button><button type="button" class="btn chico linea" id="np-limpiar">No es este cliente</button></span>`;card.hidden=false;
      $("#np-repetir").onclick=()=>rellenar(c,true);
      $("#np-limpiar").onclick=()=>{["#np-calle","#np-num","#np-block","#np-depto","#np-ref","#np-rut","#np-razon","#np-giro","#np-fdir","#np-fcomuna"].forEach(id=>set(id,""));$("#np-factura").checked=false;$("#np-fact").hidden=true;card.hidden=true;$("#np-calle").focus()};
      $("#np-encontrado").textContent="";tot();if(asisDir)setTimeout(asisDir,0)};
    const auto=()=>{const k=normFono($("#np-fono").value);if(!k){if(llenado){llenado=""}$("#np-cliente").hidden=true;return}if(k===llenado)return;
      const c=buscarCliente(k);if(c)rellenar(c,false);else{llenado="";const card=$("#np-cliente");card.innerHTML="<span>Cliente nuevo: sus datos quedarán guardados al grabar el pedido.</span>";card.hidden=false}};
    $("#np-fono").addEventListener("input",auto);$("#np-fono").addEventListener("change",auto);
    const buscar=()=>{const t=$("#np-buscar").value,dq=$("#np-bdir").value.trim().toLowerCase();if(!normFono(t)&&!dq)return;
      const c=normFono(t)?buscarCliente(t):(D.clientes||[]).slice().sort((a,b)=>(b.ultimo||"").localeCompare(a.ultimo||"")).find(x=>`${x.calle} ${x.num}`.toLowerCase().includes(dq));
      if(!c){$("#np-encontrado").textContent="Cliente nuevo.";if(normFono(t))$("#np-fono").value=t;$("#np-cliente").hidden=true;return}
      rellenar(c,false);$("#np-encontrado").textContent="Cliente encontrado."};
    $("#np-btn-buscar").onclick=buscar;["#np-buscar","#np-bdir"].forEach(id=>$(id).onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();buscar()}});
    f.onsubmit=async e=>{e.preventDefault();const it=its(),err=$("#np-error");err.hidden=true;
      if(!it.some(i=>i.cant>0)){err.textContent="Indique la cantidad de al menos un cilindro.";err.hidden=false;return}
      if(it.some(i=>i.env>i.cant)){err.textContent="Los envases vendidos no pueden ser más que los cilindros del pedido.";err.hidden=false;return}
      if(!ultRev)ultRev=revisarDir($("#np-calle").value,$("#np-num").value,$("#np-comuna").value,pinManual);
      if(ultRev&&!forzarDir&&(ultRev.calle?.st==="mal"||ultRev.zona?.st==="mal")){const m=ultRev.calle?.st==="mal"?ultRev.calle.txt:ultRev.zona.txt;
        err.innerHTML=`<b>Revise la dirección:</b> ${m}. Si está bien, presione «Grabar pedido» otra vez para grabarlo igual.`;err.hidden=false;forzarDir=true;$("#np-dir").scrollIntoView({block:"center"});return}
      const g=id=>$(id).value.trim(),calle=g("#np-calle"),nro=g("#np-num"),block=g("#np-block"),depto=g("#np-depto"),comuna=g("#np-comuna");
      const id=await idPedido();
      D.pedidos.unshift({id,fecha:ahora(),nombre:"",fono:g("#np-fono"),
        dir:[calle+(nro?" "+nro:""),block&&("block "+block),depto&&("depto "+depto),comuna].filter(Boolean).join(", "),calle,num:nro,block,depto,comuna,ciudad:g("#np-ciudad"),ref:g("#np-ref"),obs:g("#np-obs"),
        entrega:$("#np-entrega").value.replace("T"," "),items:it,dcto:num("#np-dcto"),local:suc,estado:"pendiente",chofer:null,sector:null,
        medio:($("#np-pago")||{}).value||"efectivo",origen:val("np-fuente"),tipo:val("np-tipo")||"hogar",lista:lista(),usuario:yo.nombre,
        factura:$("#np-factura").checked?{rut:g("#np-rut"),razon:g("#np-razon"),giro:g("#np-giro"),dir:g("#np-fdir"),comuna:g("#np-fcomuna")}:null});
      if(pinManual)D.pedidos[0].geo=pinManual;
      {const q=D.pedidos[0];{const c=guardarCliente(q);if(c)nubeGuardar("clientes",c)}if(autoActivo(q.local))cargarCalles().catch(()=>{}).then(()=>{const r=autoDespachar([q]);if(r.ok)aviso("Despacho automático",`Pedido N° ${q.id} enviado a ${nomChofer(q.chofer)} (${nomSector(q.sector)}).`);guardar();if(mod==="ruta"||mod==="sectorizar")pintarSistema()});log("pedidos","Pedido ingresado",`Pedido N° ${q.id} · ${resumenP(q)} · ${nomCli(q)} · ${q.dir} · ${MEDIOS[q.medio]||""}`,{pedido:q.id});nubePedido(q)}
      guardar();pintarSistema();const ok=$("#np-ok");ok.textContent=`Pedido N° ${id} grabado. Ya aparece en Asigna Ruta.`;ok.hidden=false};
  },
  ruta(){
    const P=id=>D.pedidos.find(x=>x.id===+id),listo=p=>{nubePedido(p);guardar();pintarSistema()};
    $$("[data-rtvista]").forEach(b=>b.onclick=()=>{rutaVista=b.dataset.rtvista;if(rutaVista==="pend")rutaChofer=null;pintarSistema()});
    $$("[data-vch]").forEach(b=>b.onclick=()=>{const id=+b.dataset.vch;if(rutaChofer===id){rutaChofer=null}else{rutaChofer=id;if(rutaVista==="pend")rutaVista="ruta"}pintarSistema()});
    {const t=$("#rt-todos");if(t)t.onclick=()=>{rutaChofer=null;pintarSistema()}}
    $$("[data-asignar]").forEach(b=>b.onclick=()=>{const p=P(b.dataset.asignar),c=$("#ch-"+p.id),s=$(`[data-sec="${p.id}"]`);
      if(!c||!c.value){aviso("Elija un móvil","Seleccione el móvil antes de despachar el pedido N° "+p.id+".");if(c)c.focus();return}
      if(s&&s.value)p.sector=+s.value;p.chofer=+c.value;setEstado(p,"ruta");guardar();pintarSistema()});
    $$("[data-sec]").forEach(s=>s.onchange=()=>{const p=P(s.dataset.sec);p.sector=s.value?+s.value:null;listo(p)});
    $$("[data-anular]").forEach(b=>b.onclick=()=>confirmar(b,()=>{setEstado(P(b.dataset.anular),"anulado");guardar();pintarSistema()}));
    $$("[data-entregar]").forEach(b=>b.onclick=()=>{setEstado(P(b.dataset.entregar),"entregado");guardar();pintarSistema()});
    $$("[data-devolver]").forEach(b=>b.onclick=()=>{setEstado(P(b.dataset.devolver),"pendiente");guardar();pintarSistema()});
    $$("[data-reclamo]").forEach(b=>b.onclick=()=>{const p=P(b.dataset.reclamo);p.reclamado=p.reclamado?null:ahora();
      log("pedidos",p.reclamado?"Reclamado por cliente":"Reclamo resuelto",`Pedido N° ${p.id} · ${nomCli(p)} · ${p.dir}`,{chofer:p.chofer,pedido:p.id});listo(p)});
    $$("[data-cf]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const p=P(b.dataset.cf);p.cierreFalso=ahora();
      log("pedidos","Cierre falso",`Pedido N° ${p.id} · ${nomChofer(p.chofer)} lo marcó entregado sin entregar`,{chofer:p.chofer,pedido:p.id});setEstado(p,"ruta");guardar();pintarSistema()}));
    $$("[data-activo]").forEach(i=>i.onchange=()=>{{const c=D.choferes.find(c=>c.id===+i.dataset.activo);c.activo=i.checked;nubeChofer(c)}guardar();pintarSistema()});
    $$("[data-chsec]").forEach(s=>s.onchange=()=>{const c=D.choferes.find(x=>x.id===+s.dataset.chsec);c.sector=s.value?+s.value:null;nubeChofer(c);guardar();pintarSistema()});
    {const o=$("#rt-ocultar");if(o)o.onchange=e=>{ocultarMovil=e.target.checked;pintarSistema()}}
    $("#rt-auto").onchange=e=>{autoRefresco=e.target.checked;if(autoRefresco)pintarSistema()};
    $("#rt-recargar").onclick=()=>{pintarSistema();aviso("Lista actualizada",new Date().toLocaleTimeString("es-CL"))};
    if(!CALLES)cargarCalles().then(()=>{if(mod==="ruta")pintarSistema()}).catch(()=>{});
    $("#rt-sectorizar").onclick=()=>{let n=0;pedidosSuc().filter(p=>p.estado==="pendiente"&&p.sector==null).forEach(p=>{const s=sectorDe(p);if(s){p.sector=s;nubePedido(p);n++}});
      guardar();pintarSistema();aviso("Pedidos sectorizados",n?`${n} pedido(s) quedaron con sector y móvil sugerido.`:"No había pedidos nuevos sin sector, o su comuna no está en ningún sector (vea Configuraciones).")};
    {const bc=$("#rt-ir-choferes");if(bc)bc.onclick=()=>{cfgTab="choferes";cfgCh=null;ir("config")}}
  },
  chofer(){
    $$("[data-chtab]").forEach(b=>b.onclick=()=>{chTab=b.dataset.chtab;pintarSistema()});
    const cf=$("#ch-fecha");if(cf)cf.onchange=e=>{chFecha=e.target.value||hoyStr();pintarSistema()};
    const cl=$("#ch-filtro");if(cl)cl.onchange=e=>{chFiltro=e.target.value;pintarSistema()};
    const bp=$("#btn-push");if(bp)bp.onclick=()=>activarPush(false);
    const s=$("#sel-chofer");if(s)s.onchange=()=>{choferSel=+s.value;pintarSistema()};
    $$("[data-entregar]").forEach(b=>b.onclick=()=>{setEstado(D.pedidos.find(p=>p.id===+b.dataset.entregar),"entregado");guardar();pintarSistema()});
    $$("[data-devolver]").forEach(b=>b.onclick=()=>{setEstado(D.pedidos.find(p=>p.id===+b.dataset.devolver),"pendiente");guardar();pintarSistema()});
  },
  cuadratura(){
    {const fcq=$("#f-cuad");if(fcq)fcq.onchange=e=>{fechaCuad=e.target.value||hoyStr();pintarSistema()}}
    $$("[data-ctab]").forEach(b=>b.onclick=()=>{cuadTab=b.dataset.ctab;cuadSel=null;pintarSistema()});
    $$("[data-cuadrar]").forEach(b=>b.onclick=()=>{cuadSel=+b.dataset.cuadrar;pintarSistema();window.scrollTo(0,0)});
    enlazarCuadExtra();
    const fm=$("#f-mayorista");if(fm)fm.onsubmit=e=>{e.preventDefault();D.mayoristas=D.mayoristas||[];D.mayoristas.push({id:nuevoId(D.mayoristas),nombre:$("#my-nombre").value.trim(),rut:$("#my-rut").value.trim(),fono:$("#my-fono").value.trim(),local:suc});guardar();pintarSistema()};
    if(cuadSel==null)return;
    const r=getRend(cuadTab,cuadSel,fechaCuad,false);if(!r)return;
    const re=()=>{nubeGuardar("rendiciones",r);guardar();pintarSistema()};
    $("#cu-lista").onclick=()=>{cuadSel=null;pintarSistema()};
    $("#rd-guia").onchange=e=>{r.guia=e.target.value.trim();nubeGuardar("rendiciones",r);guardar()};
    $("#rd-obs").onchange=e=>{r.obs=e.target.value;nubeGuardar("rendiciones",r);guardar()};
    $$("[data-rprecio]").forEach(i=>i.onchange=()=>{const v=Math.max(0,+i.value||0),f=i.dataset.rprecio;r.precios[f]=v;
      re()});
    $$("[data-rcant]").forEach(i=>i.onchange=()=>{r.ventas[i.dataset.rcant]=Math.max(0,+i.value||0);re()});
    const u=$("#rd-usar");if(u)u.onclick=()=>{if(r.tipo==="local"){const v=ventasLocalDe(r.ref,r.fecha);Object.assign(r.ventas,v.ventas);r.envases={...v.env}}else if(r.tipo==="mayorista")Object.assign(r.ventas,cargaDistDe(r.ref,r.fecha).ventas);else{const v=entregasDe(r.ref,r.fecha);Object.assign(r.ventas,v.ventas);r.envases={...st(),...(r.envases||{}),...v.env}}re()};
    $$("[data-renv]").forEach(i=>i.onchange=()=>{r.envases[i.dataset.renv]=Math.max(0,+i.value||0);re()});
    $$("[data-renvp]").forEach(i=>i.onchange=()=>{r.precioEnv=r.precioEnv||{};r.precioEnv[i.dataset.renvp]=Math.max(0,+i.value||0);re()});
    $$("[data-pform]").forEach(f=>{
      const t=f.dataset.pform,q=k=>f.querySelector(`[data-f="${k}"]`);
      const vt=()=>{const o=q("vtotal");if(o)o.textContent=clp((+q("cant").value||0)*(r.precios[q("formato").value]||0))};
      f.addEventListener("input",vt);vt();
      f.onsubmit=e=>{e.preventDefault();
        const g=k=>{const el=q(k);return el?el.value.trim():""},txt=k=>{const el=q(k);return el?el.selectedOptions[0].text:""};
        const fe=g("fecha"),fF=fe?fe.split("-").reverse().join("-"):"";let monto=+g("monto")||0,detalle="";
        if(t==="vale"){const n=+g("cant")||0,fo=g("formato");monto=n*(r.precios[fo]||0);detalle=`${n} × ${fmt(fo).et} · ${txt("vale")}`}
        else if(t==="transbank")detalle=[txt("tarjeta"),g("num")&&"voucher N° "+g("num"),fF].filter(Boolean).join(" · ");
        else if(t==="transferencia"||t==="cheque"||t==="deposito")detalle=[g("banco"),g("num")&&"N° "+g("num"),fF].filter(Boolean).join(" · ");
        else if(t==="descuento"||t==="gasto")detalle=[txt("motivo"),g("det")].filter(Boolean).join(" · ");
        else if(t==="petroleo")detalle=g("litros")?g("litros")+" litros":"";
        else if(t==="credito"||t==="creditodoc")detalle=[g("det"),txt("tdoc"),g("num")&&"N° "+g("num")].filter(Boolean).join(" · ");
        if(monto<=0){f.querySelector("[data-perr]").hidden=false;return}
        r.pagos.push({por:porMi(),id:nuevoId(r.pagos),tipo:t,monto,detalle,hora:ahora(),campos:{tarjeta:g("tarjeta"),banco:g("banco"),num:g("num"),fecha:g("fecha"),vale:g("vale"),valeTxt:txt("vale"),formato:g("formato"),cant:+g("cant")||0,motivo:txt("motivo"),tdoc:g("tdoc"),litros:+g("litros")||0}});if(t==="vale"&&r.tipo==="mayorista"){const q=r.pagos[r.pagos.length-1];q.com=comVale(q.campos);if(q.com)q.detalle+=" · comisión cliente "+clp(q.com)}
        log("cuadratura","Pago agregado",`${nomRef(r)} (${r.fecha}) · ${TIPOS_PAGO[t]} ${clp(monto)}${detalle?" · "+detalle:""}`,{chofer:r.tipo==="movil"?r.ref:null});re()};
    });
    $$("[data-delpago]").forEach(b=>b.onclick=()=>{const q=r.pagos.find(p=>p.id===+b.dataset.delpago);r.pagos=r.pagos.filter(p=>p!==q);log("cuadratura","Pago quitado",`${nomRef(r)} (${r.fecha}) · ${TIPOS_PAGO[q.tipo]} ${clp(q.monto)}`,{chofer:r.tipo==="movil"?r.ref:null});re()});
    $("#f-cargo").onsubmit=e=>{e.preventDefault();const m=+$("#cg-monto").value||0;if(m<=0)return;r.cargos.push({por:porMi(),id:nuevoId(r.cargos),monto:m,detalle:$("#cg-det").value.trim()});re()};
    $$("[data-delcargo]").forEach(b=>b.onclick=()=>{const cg=r.cargos.find(x=>x.id===+b.dataset.delcargo);
      if(cg&&cg.credito){const o=(D.rendiciones||[]).find(x=>idDoc("rendiciones",x)===cg.credito.rend),p=o&&o.pagos.find(y=>y.id===cg.credito.pago);if(p){delete p.cobrado;nubeGuardar("rendiciones",o)}}
      r.cargos=r.cargos.filter(x=>x!==cg);re()});
    const rv=$("#rd-vuelto");if(rv)rv.onchange=()=>{r.vuelto=Math.max(0,+rv.value||0);re()};
    $$("[data-cobrar]").forEach(b=>b.onclick=()=>{const [k,pid]=b.dataset.cobrar.split("|"),o=(D.rendiciones||[]).find(x=>idDoc("rendiciones",x)===k),p=o&&o.pagos.find(y=>y.id===+pid);if(!p)return;
      p.cobrado={fecha:r.fecha,en:idDoc("rendiciones",r)};r.cargos.push({por:porMi(),id:nuevoId(r.cargos),monto:p.monto,detalle:"Cobro crédito: "+(p.detalle||""),credito:{rend:k,pago:p.id}});
      nubeGuardar("rendiciones",o);log("cuadratura","Crédito cobrado",`${p.detalle||""} · ${clp(p.monto)} · en ${nomRef(r)}`,{chofer:r.tipo==="movil"?r.ref:null});re()});
    $("#rd-guardar").onclick=()=>{r.guardada=ahora();r.usuario=yo.nombre;nubeGuardar("rendiciones",r);{const c=calcRend(r);log("cuadratura","Cuadratura guardada",`${nomRef(r)} (${r.fecha}) · vendido ${clp(c.venta)} · rendido ${clp(c.pagado)} · saldo ${clp(c.saldo)}`,{chofer:r.tipo==="movil"?r.ref:null})}guardar();pintarSistema();$("#rd-ok").hidden=false};
  },
  compras(){
    const l=ensureLoc(loc(suc));
    $$("[data-ctipo]").forEach(b=>b.onclick=()=>{compTipo=b.dataset.ctipo;pintarSistema()});
    $("#cp-ftipo").onchange=e=>{compFiltro=e.target.value;pintarSistema()};
    $("#cp-desde").onchange=e=>{compDesde=e.target.value||compDesde;pintarSistema()};$("#cp-hasta").onchange=e=>{compHasta=e.target.value||compHasta;pintarSistema()};
    $("#f-mov").onsubmit=e=>{e.preventDefault();const cant=st();FORMATOS.forEach(f=>cant[f.id]=Math.max(0,+$(`[data-mc="${f.id}"]`).value||0));
      if(!Object.values(cant).some(Boolean)){aviso("Faltan cantidades","Indique los cilindros del documento.");return}
      const m={id:nuevoId(D.movimientos),k:Date.now(),fecha:ahora(),fdoc:$("#mv-fdoc").value,local:suc,tipo:compTipo,cant,num:$("#mv-num").value.trim(),det:$("#mv-det").value.trim(),total:+$("#mv-total").value||0,user:yo.nombre};
      D.movimientos.unshift(m);aplicarMov(l,m,1);
      log("bodega",TIPOS_DOC[compTipo].t,`N° ${m.num||"—"} · ${FORMATOS.filter(f=>cant[f.id]).map(f=>cant[f.id]+"×"+f.et).join(", ")}${m.total?" · "+clp(m.total):""}`);guardar();pintarSistema();aviso("Documento grabado",TIPOS_DOC[compTipo].t+" ingresado.")};
    $$("[data-delmov]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const m=D.movimientos.find(y=>String(y.k)===b.dataset.delmov);aplicarMov(l,m,-1);D.movimientos=D.movimientos.filter(y=>y!==m);
      log("bodega","Documento anulado",`${(TIPOS_DOC[m.tipo]||{}).t||m.tipo} N° ${m.num||"—"}`);guardar();pintarSistema()}));
  },
  bodega(){
    $$("[data-btab]").forEach(b=>b.onclick=()=>{bTab=b.dataset.btab;pintarSistema()});
    const l=ensureLoc(loc(suc));
    const bc=$("#b-chofer");if(bc)bc.onchange=e=>{bChofer=+e.target.value;pintarSistema()};
    const leer=pref=>{const o={};FORMATOS.forEach(f=>{const i=$(`[data-${pref}="${f.id}"]`);o[f.id]=Math.max(0,i?+i.value||0:0)});return o};
    const txt=o=>FORMATOS.filter(f=>o[f.id]).map(f=>`${o[f.id]}×${f.et}`).join(", ")||"nada";
    const fe=$("#f-editcarga");if(fe){const ec=$("#ec-cero");if(ec)ec.onclick=()=>$$("[data-el]").forEach(i=>i.value=0);
      fe.onsubmit=e=>{e.preventDefault();const c=ensureCh(D.choferes.find(x=>x.id===bChofer)),ll=leer("el"),vv={...c.vacios};
        const dif=k=>(o,n)=>FORMATOS.filter(f=>(o[f.id]||0)!==n[f.id]).map(f=>`${f.et} ${o[f.id]||0}→${n[f.id]}`).join(", ");
        const cl=dif()(c.carga,ll),cv=dif()(c.vacios,vv);if(!cl&&!cv){aviso("Sin cambios","La carga quedó igual.");return}
        FORMATOS.forEach(f=>{c.carga[f.id]=ll[f.id]});
        log("bodega","Carga de camión editada",`${c.nombre}: ${[cl?"llenos "+cl:"",cv?"vacíos "+cv:""].filter(Boolean).join(" · ")}`,{chofer:c.id});guardar();pintarSistema();aviso("Carga guardada",`${c.nombre} lleva ahora ${txt(ll)} llenos.`)}}
    const fc=$("#f-cargar");if(fc)fc.onsubmit=e=>{e.preventDefault();const c=ensureCh(D.choferes.find(x=>x.id===bChofer)),ll=leer("cl"),vv=leer("cv");
      FORMATOS.forEach(f=>{l.stock[f.id]-=ll[f.id];c.carga[f.id]+=ll[f.id];c.vacios[f.id]-=vv[f.id];l.vacios[f.id]+=vv[f.id]});
      log("bodega","Carga de móvil",`${c.nombre}: llenos ${txt(ll)} · vacíos dejados ${txt(vv)}`,{chofer:c.id});guardar();pintarSistema()};
    const fd=$("#f-descargar");if(fd)fd.onsubmit=e=>{e.preventDefault();const c=ensureCh(D.choferes.find(x=>x.id===bChofer)),ll=leer("dl"),vv=leer("dv");
      FORMATOS.forEach(f=>{c.carga[f.id]-=ll[f.id];l.stock[f.id]+=ll[f.id];c.vacios[f.id]-=vv[f.id];l.vacios[f.id]+=vv[f.id]});
      log("bodega","Descarga de móvil",`${c.nombre}: llenos devueltos ${txt(ll)} · vacíos entregados ${txt(vv)}`,{chofer:c.id});guardar();pintarSistema()};
    const fr=$("#f-recuento");
    if(fr){
      const base={llenos:l.stock,vacios:l.vacios,prestados:l.prestados};
      const upd=()=>$$("[data-rc]").forEach(i=>{const[k,f]=i.dataset.rc.split(":"),d=(+i.value||0)-base[k][f],c=$(`#rd-${k}-${f}`);c.textContent=(d>0?"+":"")+d;c.className="der num "+(d?(d<0?"saldo-pos":"saldo-neg"):"")});
      fr.addEventListener("input",upd);upd();
      fr.onsubmit=e=>{e.preventDefault();
        const sistema={llenos:{...l.stock},vacios:{...l.vacios},prestados:{...l.prestados}},contado={llenos:{},vacios:{},prestados:{}};
        $$("[data-rc]").forEach(i=>{const[k,f]=i.dataset.rc.split(":");contado[k][f]=Math.max(0,+i.value||0)});
        Object.assign(l.stock,contado.llenos);Object.assign(l.vacios,contado.vacios);Object.assign(l.prestados,contado.prestados);
        (D.recuentos=D.recuentos||[]).unshift({id:Date.now(),fecha:ahora(),local:suc,user:yo.nombre,sistema,contado,obs:$("#rc-obs").value.trim()});
        const difs=["llenos","vacios"].flatMap(k=>FORMATOS.map(f=>{const d=contado[k][f.id]-sistema[k][f.id];return d?`${k} ${f.et} ${d>0?"+":""}${d}`:""})).filter(Boolean).join(", ");
        log("bodega","Recuento físico",difs?"Diferencias: "+difs:"Sin diferencias");guardar();pintarSistema()};
    }
    const vi=$("#bv-ini");if(vi){vi.onchange=e=>{bvIni=e.target.value||hoyStr();pintarSistema()};$("#bv-fin").onchange=e=>{bvFin=e.target.value||hoyStr();pintarSistema()};
      $("#bv-hoy").onclick=()=>{bvIni=bvFin=hoyStr();pintarSistema()};$("#bv-mes").onclick=()=>{bvFin=hoyStr();bvIni=bvFin.slice(0,8)+"01";pintarSistema()}}
    const bi=$("#b-ini");if(bi){bi.onchange=e=>{bIni=e.target.value||hoyStr();pintarSistema()};$("#b-fin").onchange=e=>{bFin=e.target.value||hoyStr();pintarSistema()}}
  },
  caja(){
    const l=ensureLoc(loc(suc)),PE=D.preciosEnvase||{};
    $$("[data-cjtab]").forEach(b=>b.onclick=()=>{if(b.dataset.cjtab==="rendicion"){mod="cuadratura";cuadTab="local";cuadSel=suc;guardarSesion();pintarSistema();window.scrollTo(0,0);return}cjTab=b.dataset.cjtab;pintarSistema()});
    const fv=$("#f-venta");
    if(fv){
      const leer=a=>{const o={};FORMATOS.forEach(f=>o[f.id]=Math.max(0,+$(`[data-${a}="${f.id}"]`).value||0));return o};
      const tot=()=>{const c=leer("vc"),e=leer("ve");$("#vt-total").textContent=clp(Math.max(0,FORMATOS.reduce((s,f)=>s+c[f.id]*D.precios[f.id]+e[f.id]*(PE[f.id]||0),0)-(+$("#vt-dcto").value||0)))};
      fv.addEventListener("input",tot);fv.addEventListener("reset",()=>setTimeout(tot,0));tot();
      fv.onsubmit=e=>{e.preventDefault();const c=leer("vc"),en=leer("ve"),err=$("#vt-error");
        const fs=FORMATOS.filter(f=>c[f.id]>0);
        if(!fs.length){err.textContent="Indique la cantidad de al menos un cilindro.";err.hidden=false;return}
        if(FORMATOS.some(f=>en[f.id]>c[f.id])){err.textContent="Los cilindros con envase no pueden ser más que la cantidad vendida.";err.hidden=false;return}
        const grupo=Date.now(),medio=$("#vt-medio").value,dcto=Math.max(0,+$("#vt-dcto").value||0),fecha=ahora();let id=nuevoId(D.ventas);
        fs.forEach((f,i)=>{D.ventas.unshift({id:id++,grupo,fecha,local:suc,formato:f.id,cant:c[f.id],precio:D.precios[f.id],env:en[f.id],precioEnv:PE[f.id]||0,dcto:i===0?dcto:0,medio});
          l.stock[f.id]-=c[f.id];l.vacios[f.id]+=c[f.id]-en[f.id]});
        const ls=D.ventas.filter(v=>v.grupo===grupo);ls.forEach(v=>nubeGuardar("ventas",v));
        log("ventas","Venta en mesón",`${resumenGrupo(ls)} · ${clp(ls.reduce((s,v)=>s+montoV(v),0))} · ${MEDIOS[medio]}`);guardar();pintarSistema()};
    }
    $$("[data-anularv]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const g=+b.dataset.anularv,ls=D.ventas.filter(v=>(v.grupo||v.id)===g);
      ls.forEach(v=>{l.stock[v.formato]+=v.cant;l.vacios[v.formato]-=v.cant-(v.env||0)});
      ls.forEach(v=>nubeQuitar("ventas",v));D.ventas=D.ventas.filter(v=>!ls.includes(v));(D.ventasAnuladas=D.ventasAnuladas||[]).push(...ls.map(v=>({...v,anulada:ahora(),por:yo.nombre})));
      log("ventas","Venta anulada",`${resumenGrupo(ls)} · ${clp(ls.reduce((s,v)=>s+montoV(v),0))}`);guardar();pintarSistema()}));
    const fg=$("#f-gasto");if(fg)fg.onsubmit=e=>{e.preventDefault();const tipo=$("#gs-tipo").value;
      D.gastos.unshift({id:nuevoId(D.gastos),fecha:ahora(),local:suc,tipo,k:Date.now(),det:$("#gs-det").value.trim(),monto:+$("#gs-monto").value||0});nubeGuardar("gastos",D.gastos[0]);
      log("caja",{gasto:"Gasto de caja chica",retiro:"Retiro de caja",abono:"Abono a caja"}[tipo],`${D.gastos[0].det} · ${clp(D.gastos[0].monto)}`);guardar();pintarSistema()};
  },
  informes(){
    $$("[data-itab]").forEach(b=>b.onclick=()=>{infTab=b.dataset.itab;infDia=null;infRep=null;pintarSistema()});
    const pe=$("#inf-per");if(pe){pe.value=periodoInf;pe.onchange=e=>{periodoInf=e.target.value;pintarSistema()}}
    const a=$("#inf-alc");if(a){a.value=alcanceInf;a.onchange=e=>{alcanceInf=e.target.value;pintarSistema()}}
    const me=$("#inf-mes");if(me)me.onchange=e=>{infMes=e.target.value||hoyStr().slice(0,7);infDia=null;pintarSistema()};
    $$("[data-dia]").forEach(t=>t.onclick=()=>{infDia=t.dataset.dia;pintarSistema();window.scrollTo(0,0)});
    const v=$("#inf-volver-mes");if(v)v.onclick=()=>{infDia=null;pintarSistema()};
    $$("[data-rep]").forEach(b=>b.onclick=()=>{infRep=b.dataset.rep;pintarSistema();window.scrollTo(0,0)});
    const rv=$("#rep-volver");if(rv)rv.onclick=()=>{infRep=null;pintarSistema()};
    const rd=$("#rep-desde");if(rd){rd.onchange=e=>{repDesde=e.target.value||repDesde;if(repDesde>repHasta)repHasta=repDesde;pintarSistema()};
      $("#rep-hasta").onchange=e=>{repHasta=e.target.value||repHasta;if(repHasta<repDesde)repDesde=repHasta;pintarSistema()}}
    const ra=$("#rep-alc");if(ra){ra.value=alcanceInf;ra.onchange=e=>{alcanceInf=e.target.value;pintarSistema()}}
    const rc=$("#rep-csv");if(rc)rc.onclick=descargarCSV;
  },
  precios(){
    if($("#f-listas"))$("#f-listas").onsubmit=e=>{e.preventDefault();D.listas.convenio=$("#lp-nombre").value.trim()||"Precio convenio";
      FORMATOS.forEach(f=>{D.preciosConvenio[f.id]=Math.max(0,+$(`[data-lc="${f.id}"]`).value||0);0});
      log("precios","Listas de precios actualizadas",D.listas.convenio);guardar();pintarSistema();$("#lp-ok").hidden=false};
    const val=id=>Math.max(0,Math.round(+$("#pn-"+id).value||0));
    const upd=()=>FORMATOS.forEach(f=>$("#dif-"+f.id).innerHTML=difPrecio(D.precios[f.id],val(f.id)));
    $("#f-pr").addEventListener("input",upd);upd();
    $$("[data-aj]").forEach(b=>b.onclick=()=>{const m=+$("#aj-monto").value||0,sg=+b.dataset.aj,pct=$("#aj-tipo").value==="pct";
      FORMATOS.forEach(f=>{const i=$("#pn-"+f.id),v=+i.value||0;i.value=Math.max(0,pct?Math.round(v*(1+sg*m/100)/10)*10:v+sg*m)});upd()});
    $("#pn-hoy").onclick=()=>$("#pn-desde").value=hoyStr();
    $("#pn-jueves").onclick=()=>{const d=new Date();d.setDate(d.getDate()+(((4-d.getDay()+7)%7)||7));$("#pn-desde").value=fechaISO(d)};
    $$("[data-cancelar]").forEach(b=>b.onclick=()=>{D.programados=(D.programados||[]).filter(x=>x.id!==+b.dataset.cancelar);guardar();pintarSistema()});
    $("#f-pr").onsubmit=e=>{e.preventDefault();const err=$("#pn-error");err.hidden=true;
      const nuevos={};FORMATOS.forEach(f=>nuevos[f.id]=val(f.id));
      const desde=$("#pn-desde").value||hoyStr(),motivo=$("#pn-motivo").value.trim();
      if(FORMATOS.some(f=>!nuevos[f.id])){err.textContent="Todos los cilindros deben tener un precio mayor a $0.";err.hidden=false;return}
      let msg;
      if(desde>hoyStr()){(D.programados=D.programados||[]).push({id:Date.now(),desde,precios:nuevos,user:yo.nombre,motivo});
        msg=`Cambio programado. Los precios nuevos se aplicarán solos el ${fechaLarga(desde)}.`}
      else{if(FORMATOS.every(f=>nuevos[f.id]===D.precios[f.id])){err.textContent="No cambió ningún precio.";err.hidden=false;return}
        registrarPrecios(nuevos,yo.nombre,motivo,desde);msg="Precios guardados. Ya se ven en el sitio web y en los pedidos nuevos."}
      guardar();pintarPublico();pintarSistema();const ok=$("#pn-ok");ok.textContent=msg;ok.hidden=false};
  },
  petroleo(){
    $("#pt-mes").onchange=e=>{petMes=e.target.value||hoyStr().slice(0,7);pintarSistema()};
    $("#f-pet").onsubmit=e=>{e.preventDefault();const ch=+$("#pt-chofer").value;if(!ch)return;
      const x={k:Date.now(),fecha:($("#pt-fecha").value||ahora().replace(" ","T")).replace("T"," "),local:suc,chofer:ch,litros:+$("#pt-litros").value||0,monto:+$("#pt-monto").value||0,
        km:+$("#pt-km").value||0,estacion:$("#pt-estacion").value.trim(),boleta:$("#pt-boleta").value.trim(),pago:$("#pt-pago").value,user:yo.nombre};
      (D.petroleo=D.petroleo||[]).unshift(x);nubeGuardar("petroleo",x);
      if(x.pago==="caja"){D.gastos.unshift({id:nuevoId(D.gastos),fecha:ahora(),local:suc,tipo:"gasto",k:x.k,det:`Petróleo ${nomChofer(ch)} (${x.litros} L)`,monto:x.monto});nubeGuardar("gastos",D.gastos[0])}
      log("petroleo","Carga de petróleo",`${nomChofer(ch)} · ${x.litros} L · ${clp(x.monto)}${x.km?" · "+x.km+" km":""}`,{chofer:ch});
      petMes=x.fecha.slice(0,7);guardar();pintarSistema();aviso("Carga registrada",`${nomChofer(ch)}: ${x.litros} litros por ${clp(x.monto)}.`)};
    $$("[data-delpet]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const x=D.petroleo.find(y=>String(y.k)===b.dataset.delpet);
      D.petroleo=D.petroleo.filter(y=>y!==x);nubeQuitar("petroleo",x);log("petroleo","Carga anulada",`${nomChofer(x.chofer)} · ${x.litros} L · ${clp(x.monto)}`,{chofer:x.chofer});guardar();pintarSistema()}));
  },
  manual(){},
  config(){
    enlazarCfgTabs();
    if(cfgTab==="precios"){L.precios();return}
    if(cfgTab==="usuarios"){L.usuarios();return}
    if(cfgTab==="respaldos"){L.respaldos();return}
    if(cfgTab==="sucursal"){L.admin();const f=$("#f-suc");if(f){const g=f.onsubmit;f.onsubmit=e=>{g(e);aviso("Sucursal","Datos guardados.")}}return}
    if(cfgTab==="choferes"){
      $("#f-chofer").onsubmit=e=>{e.preventDefault();const datos={nombre:$("#cf-nombre").value.trim(),patente:$("#cf-pat").value.trim().toUpperCase(),fono:$("#cf-fono").value.trim(),local:$("#cf-local")?+$("#cf-local").value:(D.locales[0]||{}).id};
        if(!datos.nombre)return;
        if(cfgCh!=null){const c=D.choferes.find(x=>x.id===cfgCh);Object.assign(c,datos);log("sistema","Chofer modificado",`${c.nombre} · ${c.patente||"sin patente"}`);nubeChofer(c)}
        else{const c=ensureCh({id:nuevoId(D.choferes),...datos,activo:true});D.choferes.push(c);log("sistema","Chofer agregado",`${c.nombre} · ${c.patente||"sin patente"}`);nubeChofer(c)}
        cfgCh=null;guardar();pintarSistema();aviso("Choferes","Cambios guardados.")};
      const cc=$("#cf-cancelar");if(cc)cc.onclick=()=>{cfgCh=null;pintarSistema()};
      $$("[data-cfedit]").forEach(b=>b.onclick=()=>{cfgCh=+b.dataset.cfedit;pintarSistema();window.scrollTo(0,0)});
      $$("[data-cfact]").forEach(b=>b.onclick=()=>{const c=D.choferes.find(x=>x.id===+b.dataset.cfact);c.activo=c.activo===false;log("sistema",c.activo?"Chofer activado":"Chofer desactivado",c.nombre);nubeChofer(c);guardar();pintarSistema()});
      $$("[data-delchofer]").forEach(b=>b.onclick=()=>confirmar(b,()=>{const id=+b.dataset.delchofer,c=D.choferes.find(x=>x.id===id);
        if(D.pedidos.some(p=>p.chofer===id&&p.estado==="ruta"))return aviso("No se puede eliminar",`${c.nombre} tiene pedidos en ruta. Reasígnelos o desactívelo.`);
        nubeBorrarChofer(id);D.choferes=D.choferes.filter(x=>x.id!==id);log("sistema","Chofer eliminado",c.nombre);guardar();pintarSistema()}));
      return}
    $("#f-sectores").onsubmit=e=>{e.preventDefault();D.sectores.forEach(x=>{x.nombre=$(`[data-sn="${x.id}"]`).value.trim()||x.nombre;x.comunas=$(`[data-sc="${x.id}"]`).value.split(",").map(c=>c.trim()).filter(Boolean)});guardar();$("#sec-ok").hidden=false};
    $("#sec-nuevo").onclick=()=>{D.sectores.push({id:nuevoId(D.sectores),nombre:"Nuevo sector",comunas:[]});guardar();pintarSistema()};
    $$("[data-delsec]").forEach(b=>b.onclick=()=>confirmar(b,()=>{D.sectores=D.sectores.filter(x=>x.id!==+b.dataset.delsec);guardar();pintarSistema()}));
    {const m=$("#md-may");if(m)m.onchange=()=>{if(m.checked)delete D.precios.sinMayorista;else D.precios.sinMayorista=true;
      log("sistema",m.checked?"Venta Mayorista activada":"Venta Mayorista desactivada","");guardar();pintarSistema();const o=$("#md-ok");if(o){o.textContent=m.checked?"Venta Mayorista activada.":"Venta Mayorista desactivada.";o.hidden=false}}}
    {const m=$("#md-fac");if(m)m.onchange=()=>{if(m.checked)delete D.precios.sinFacturas;else D.precios.sinFacturas=true;
      log("sistema",m.checked?"Facturas activadas":"Facturas desactivadas","");guardar();pintarSistema();const o=$("#md-ok");if(o){o.textContent=m.checked?"Facturas activadas.":"Facturas desactivadas.";o.hidden=false}}}
    $("#f-config").onsubmit=e=>{e.preventDefault();D.precios.minimo=Math.max(0,+$("#pr-minimo").value||0);guardar();$("#pr-ok").hidden=false}},
  admin(){
    $("#nueva-suc").onclick=()=>{const id=nuevoId(D.locales);D.locales.push({id,nombre:"Nueva sucursal",dir:"",comuna:"",fono:"",encargado:"Por asignar",horario:"",abierto:false,stock:st(0,0,0,0)});editSuc=id;guardar();pintarPublico();pintarSistema()};
    $$("[data-editsuc]").forEach(b=>b.onclick=()=>{editSuc=+b.dataset.editsuc;pintarSistema();window.scrollTo(0,0)});
    const f=$("#f-suc");
    if(f){const l=loc(editSuc);
      f.onsubmit=e=>{e.preventDefault();Object.assign(l,{nombre:$("#sc-nombre").value.trim(),comuna:$("#sc-comuna").value.trim(),dir:$("#sc-dir").value.trim(),fono:$("#sc-fono").value.trim(),encargado:$("#sc-enc").value.trim(),horario:$("#sc-hor").value.trim(),abierto:$("#sc-abierto").value==="1"});
        editSuc=null;guardar();pintarPublico();pintarSistema()};
      $("#sc-cancelar").onclick=()=>{editSuc=null;pintarSistema()};
      const bb=$("#sc-borrar");if(bb)bb.onclick=()=>confirmar(bb,()=>{D.locales=D.locales.filter(x=>x.id!==l.id);if(suc===l.id)suc=D.locales[0].id;editSuc=null;guardar();guardarSesion();pintarPublico();pintarSistema()});
    }
  },
  respaldos(){
    $("#rs-copiar").onclick=async()=>{const t=$("#rs-out");try{await navigator.clipboard.writeText(t.value);$("#rs-copiado").hidden=false}catch(e){t.focus();t.select()}};
    $("#rs-restaurar").onclick=()=>{try{const n=JSON.parse($("#rs-in").value);if(!n.locales||!n.usuarios||!n.precios)throw 0;D=n;guardar();yo=D.usuarios.find(u=>u.user===yo.user)||D.usuarios[0];suc=D.locales[0].id;guardarSesion();pintarPublico();ir("menu")}catch(e){$("#rs-error").hidden=false}};
    const r=$("#rs-reset");r.onclick=()=>confirmar(r,async()=>{const us=D.usuarios;D=structuredClone(BASE);D.usuarios=us;guardar();suc=1;guardarSesion();pintarPublico();ir("menu")});
  },
  empresa(){$("#f-emp").onsubmit=e=>{e.preventDefault();D.empresa={razon:$("#em-razon").value.trim(),rut:$("#em-rut").value.trim(),giro:$("#em-giro").value.trim(),dir:$("#em-dir").value.trim(),fono:$("#em-fono").value.trim(),correo:$("#em-correo").value.trim()};guardar();$("#em-ok").hidden=false}},
  usuarios(){
    const nube=NUBE.activo,rol=$("#us-rol");
    const upd=()=>{const enc=rol.value==="encargado";$("#us-acceso").hidden=!enc;$("#us-permisos").hidden=!enc;$("#us-apps").hidden=rol.value==="admin";$("#us-chofer-l").hidden=rol.value!=="chofer";$("#us-resp-l").hidden=rol.value!=="admin"};rol.onchange=upd;upd();
    const c=$("#us-cancelar");if(c)c.onclick=()=>{editUser=null;pintarSistema()};
    $$("[data-edituser]").forEach(b=>b.onclick=()=>{editUser=b.dataset.edituser;pintarSistema();window.scrollTo(0,0)});
    $$("[data-toggleuser]").forEach(b=>b.onclick=async()=>{const k=b.dataset.toggleuser;
      if(nube){const u=NUBE.usuarios.find(x=>x.uid===k);
        try{await api("usuario",{uid:+k,activo:u.activo===false});log("sistema",u.activo===false?"Usuario activado":"Usuario desactivado",u.user);guardar();await cargarUsuarios();pintarSistema()}
        catch(x){aviso("No se pudo cambiar el usuario",x.message||"")}}
      else{const u=D.usuarios.find(x=>x.user===k);u.activo=u.activo===false;log("sistema",u.activo?"Usuario activado":"Usuario desactivado",u.user);guardar();pintarSistema()}});
    $("#f-usr").onsubmit=async e=>{e.preventDefault();
      const err=$("#us-error"),btn=e.target.querySelector("button[type=submit]"),falla=t=>{err.textContent=t;err.hidden=false};err.hidden=true;
      const r=rol.value,user=$("#us-user").value.trim().toLowerCase(),acc=leerAcceso(),pass=$("#us-pass")?$("#us-pass").value:"";
      const ch=r==="chofer"?D.choferes.find(x=>x.id===+$("#us-chofer").value):null;
      if(r==="chofer"&&!ch)return falla("Primero agregue el móvil en Asigna Ruta.");
      if(r==="encargado"&&!acc.sucursales.length&&!soloLocalP(acc.permisos))return falla("Marque al menos una sucursal.");
      if(r==="encargado"&&acc.permisos.includes("app.local")&&!acc.permisos.some(c=>c.startsWith("lsuc.")))return falla("Marque al menos una sucursal de Venta Local.");
      if(r==="encargado"&&!acc.permisos.some(x=>MOD_PERM.includes(x.split(":")[0])||x.startsWith("app.")))return falla("Marque al menos un cuadro o una app que pueda usar.");
      const datos={nombre:$("#us-nombre").value.trim(),rol:r,sucursales:r==="admin"?[]:r==="chofer"?[ch.local]:acc.sucursales,permisos:r==="encargado"?acc.permisos:r==="admin"?(puede("respaldos")?($("#us-resp").checked?null:[]):[]):["_v2",...acc.apps],chofer:ch?ch.id:null};
      datos.local=r==="admin"?null:datos.sucursales[0];
      if(editUser!=null){
        if(nube){try{await api("usuario",{uid:+editUser,...datos,pass});await cargarUsuarios()}catch(x){return falla(x.message)}}
        else{if(pass&&(pass.length<8||!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(pass)||!/[0-9]/.test(pass)))return falla("La clave debe tener al menos 8 caracteres, con letras y números.");
          const u=D.usuarios.find(x=>x.user===editUser);Object.assign(u,datos);if(pass){u.hash=await hash(pass);u.cambiar=false}}
        log("sistema","Permisos cambiados",`${user} · ${r}${datos.permisos?" · "+datos.permisos.join(", "):""}`);editUser=null;guardar();pintarSistema();
        aviso("Cambios guardados",`Los permisos de ${user} quedaron actualizados.`);return}
      if(!/^[a-z0-9._-]{3,30}$/.test(user))return falla("El usuario debe tener entre 3 y 30 letras, números, punto o guion, sin espacios.");
      if((nube?NUBE.usuarios:D.usuarios).some(u=>u.user===user))return falla("Ese usuario ya existe. Elija otro.");
      if(nube){btn.disabled=true;btn.textContent="Creando…";
        try{await api("usuario",{user,...datos,pass});await cargarUsuarios()}
        catch(x){btn.disabled=false;btn.textContent="Crear usuario";return falla(x.message)}}
      else D.usuarios.push({user,...datos,hash:await hash(pass),cambiar:false,activo:true});
      log("sistema","Usuario creado",`${user} · ${r}`);guardar();pintarSistema();aviso("Usuario creado",`${user} ya puede entrar con su clave.`);
    };
  },
  clave(){
    $("#f-clave").onsubmit=async e=>{e.preventDefault();const err=$("#ck-error");err.hidden=true;if(yo.uid)return claveNube(err);
      if(await hash($("#ck-actual").value)!==yo.hash){err.textContent="La clave actual no es correcta.";err.hidden=false;return}
      if($("#ck-nueva").value!==$("#ck-rep").value){err.textContent="Las claves nuevas no coinciden.";err.hidden=false;return}
      yo.hash=await hash($("#ck-nueva").value);yo.cambiar=false;guardar();pintarSistema();$("#ck-ok").hidden=false}
  }
};

/* ===================== NAVEGACIÓN ===================== */
const PUBLICO=["sitio","inicio","precios","pedido","seguridad","locales"];
function ruta(){
  document.body.classList.remove("arrancando");
  aplicarProgramados();
  const h=location.hash.slice(1);
  if(!PUBLICO.includes(h)&&yo&&h!=="panel"){location.hash="panel";return}
  const enPanel=h==="panel"&&!!yo,enLogin=!PUBLICO.includes(h)&&!yo;
  if(h==="sitio")setTimeout(()=>window.scrollTo(0,0),0);
  $("#il-sucursales").textContent=D.locales.length;{const ch=$("#il-chips");if(ch)ch.innerHTML=D.locales.map(l=>`<span>${esc(l.nombre)}</span>`).join("")}
  $("#vista-publica").hidden=enPanel||enLogin;
  $("#vista-login").hidden=!enLogin;
  $("#vista-panel").hidden=!(enPanel&&yo);
  if(enPanel&&yo){pintarSistema();window.scrollTo(0,0)}
  if(enLogin){window.scrollTo(0,0);setTimeout(()=>$("#lg-user").focus(),50)}
}
function reloj(){const d=new Date(),t=d.toLocaleTimeString("es-CL");
  for(const id of ["sis-reloj","il-reloj"]){const r=document.getElementById(id);if(r)r.textContent=t}
  const f=document.getElementById("il-fecha");if(f)f.textContent=d.toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})}
reloj();setInterval(reloj,1000);
(async()=>{cargar();await asegurarAdmin();fechaCuad=hoyStr();infMes=fechaCuad.slice(0,7);chFecha=bIni=bFin=bvFin=fechaCuad;bvIni=fechaCuad.slice(0,8)+"01";repHasta=fechaCuad;repDesde=bvIni;liqHasta=compHasta=fechaCuad;liqDesde=compDesde=bvIni;petMes=fechaCuad.slice(0,7);leerSesion();await iniciarNube();if(NUBE.activo){yo=null;await sesionNube()}if(yo&&!suc&&!esAdmin())suc=yo.local;if(yo&&!suc)mod="sucursal";pintarPublico();ruta();addEventListener("hashchange",ruta)})();


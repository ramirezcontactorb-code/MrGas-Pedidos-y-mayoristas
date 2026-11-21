/* MR Gas · Panel General · 06-sectorizar */
/* ===================== SECTORIZAR: mapa de la Región Metropolitana ===================== */
// Ubicación aproximada (centro) de cada comuna de la RM
const GEO_RM={"Santiago":[-33.4489,-70.6593],"Cerrillos":[-33.4931,-70.7166],"Cerro Navia":[-33.4247,-70.7439],"Conchalí":[-33.3843,-70.6747],"El Bosque":[-33.5617,-70.6764],
"Estación Central":[-33.4600,-70.6990],"Huechuraba":[-33.3667,-70.6333],"Independencia":[-33.4167,-70.6650],"La Cisterna":[-33.5300,-70.6640],"La Florida":[-33.5228,-70.5883],
"La Granja":[-33.5370,-70.6250],"La Pintana":[-33.5833,-70.6333],"La Reina":[-33.4500,-70.5333],"Las Condes":[-33.4100,-70.5650],"Lo Barnechea":[-33.3500,-70.5167],
"Lo Espejo":[-33.5217,-70.6900],"Lo Prado":[-33.4447,-70.7253],"Macul":[-33.4890,-70.6000],"Maipú":[-33.5100,-70.7667],"Ñuñoa":[-33.4569,-70.5975],
"Pedro Aguirre Cerda":[-33.4919,-70.6747],"Peñalolén":[-33.4833,-70.5450],"Providencia":[-33.4314,-70.6093],"Pudahuel":[-33.4400,-70.7700],"Quilicura":[-33.3600,-70.7300],
"Quinta Normal":[-33.4333,-70.7000],"Recoleta":[-33.4067,-70.6400],"Renca":[-33.4000,-70.7167],"San Joaquín":[-33.4950,-70.6283],"San Miguel":[-33.4972,-70.6511],
"San Ramón":[-33.5417,-70.6447],"Vitacura":[-33.3833,-70.5767],"Puente Alto":[-33.6117,-70.5758],"Pirque":[-33.6667,-70.5500],"San José de Maipo":[-33.6417,-70.3500],
"Colina":[-33.2000,-70.6833],"Lampa":[-33.2833,-70.8833],"Tiltil":[-33.0833,-70.9333],"San Bernardo":[-33.5925,-70.7000],"Buin":[-33.7333,-70.7433],
"Calera de Tango":[-33.6300,-70.7833],"Paine":[-33.8167,-70.7500],"Melipilla":[-33.6833,-71.2167],"Talagante":[-33.6667,-70.9333],"Peñaflor":[-33.6100,-70.8833],
"Padre Hurtado":[-33.5667,-70.8100],"El Monte":[-33.6833,-71.0167],"Isla de Maipo":[-33.7500,-70.9000],"Curacaví":[-33.4000,-71.1333],"María Pinto":[-33.5167,-71.1167],
"Alhué":[-34.0333,-71.1000],"San Pedro":[-33.9000,-71.4667]};
const COLS_SEC=["#0A3F94","#2E9B4F","#D9731A","#7D3C98","#C0392B","#12878A","#A88A0B","#4B5D73","#D6478B","#5B8C1E"];
const colSector=id=>{const i=(D.sectores||[]).findIndex(x=>x.id===id);return i<0?"#C9CFD9":COLS_SEC[i%COLS_SEC.length]};
const sinTilde=t=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
function comunaDe(p){const c=sinTilde(p.comuna);if(c){const k=Object.keys(GEO_RM).find(n=>sinTilde(n)===c);if(k)return k}
  const d=sinTilde(p.dir);return Object.keys(GEO_RM).sort((a,b)=>b.length-a.length).find(n=>d.includes(sinTilde(n)))||null}
const sectorDeComuna=c=>{const x=(D.sectores||[]).find(z=>z.comunas.some(cm=>sinTilde(cm)===sinTilde(c)));return x?x.id:null};
const autoActivo=l=>!!((D.autoDesp||{})[l]);
let MAPA_RM=null;
function mapaRM(){if(MAPA_RM)return MAPA_RM;
  // proyección con "lupa" en el Gran Santiago para que las comunas urbanas se vean grandes
  const pts=Object.entries(GEO_RM).map(([n,[la,lo]])=>{const x=(lo+70.64)*92.6,y=-(la+33.46)*111,r=Math.hypot(x,y)||1e-6,k=9*Math.pow(r,.42)/r;return {n,x:x*k,y:y*k}});
  const W=1000,H=860,mg=40,xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),sc=Math.min((W-2*mg)/(x1-x0),(H-2*mg)/(y1-y0));
  pts.forEach(p=>{p.x=mg+(p.x-x0)*sc+((W-2*mg)-(x1-x0)*sc)/2;p.y=mg+(p.y-y0)*sc+((H-2*mg)-(y1-y0)*sc)/2});
  const clip=(poly,a,b)=>{const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,nx=b.x-a.x,ny=b.y-a.y,f=q=>(q[0]-mx)*nx+(q[1]-my)*ny,out=[];
    for(let i=0;i<poly.length;i++){const P=poly[i],Q=poly[(i+1)%poly.length],fp=f(P),fq=f(Q);if(fp<=0)out.push(P);if((fp<0)!==(fq<0)&&fp!==fq){const t=fp/(fp-fq);out.push([P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t])}}return out};
  pts.forEach(a=>{const ds=pts.filter(b=>b!==a).map(b=>Math.hypot(b.x-a.x,b.y-a.y)).sort((u,v)=>u-v);a.nn=ds[0];
    const rad=Math.min(ds[0]*1.2+8,ds[1]*1.05+6,95);let poly=Array.from({length:40},(_,i)=>{const t=i/40*Math.PI*2;return [a.x+Math.cos(t)*rad,a.y+Math.sin(t)*rad]});
    pts.forEach(b=>{if(b!==a)poly=clip(poly,a,b)});a.poly=poly;
    let cx=0,cy=0,A=0;poly.forEach((P,i)=>{const Q=poly[(i+1)%poly.length],cr=P[0]*Q[1]-Q[0]*P[1];A+=cr;cx+=(P[0]+Q[0])*cr;cy+=(P[1]+Q[1])*cr});a.cx=A?cx/(3*A):a.x;a.cy=A?cy/(3*A):a.y;a.area=Math.abs(A/2)});
  MAPA_RM={W,H,pts,por:Object.fromEntries(pts.map(p=>[p.n,p]))};return MAPA_RM}
// Algoritmo: comuna → sector → camión del sector con menos pedidos en ruta; si el sector no tiene camión, el sector más cercano que sí tenga.
function autoDespachar(lista){const M=mapaRM(),res={ok:0,sinComuna:[],sinMovil:[]};
  const act=chOrden().filter(c=>c.activo!==false&&c.local===suc),carga=id=>D.pedidos.filter(p=>p.chofer===id&&p.estado==="ruta").length;
  const centro=id=>{const cs=((D.sectores||[]).find(x=>x.id===id)||{comunas:[]}).comunas.map(c=>M.por[c]).filter(Boolean);return cs.length?{x:cs.reduce((a,c)=>a+c.cx,0)/cs.length,y:cs.reduce((a,c)=>a+c.cy,0)/cs.length}:null};
  lista.filter(p=>p.estado==="pendiente").forEach(p=>{const cm=comunaDe(p),sec=sectorDe(p);
    if(sec==null){res.sinComuna.push(p);return}
    const el=elegirCamion(sec,p);if(!el){res.sinMovil.push(p);return}const ch=el.c;p.asigMotivo=el.motivo;if(el.junto!=null){p.asigJunto=el.junto;p.asigDist=Math.round(el.dist*1000)}else{delete p.asigJunto;delete p.asigDist}res.motivos=res.motivos||{};res.motivos[el.motivo]=(res.motivos[el.motivo]||0)+1;
    p.sector=sec;p.chofer=ch.id;setEstado(p,"ruta");res.ok++});
  if(res.ok)log("pedidos","Despacho automático",`${res.ok} pedido(s) enviados por sector · tope ${topeCamion()} por camión`+(res.motivos?" · "+Object.entries(res.motivos).map(([k,n])=>`${n} ${MOTIVO_CAM[k].toLowerCase()}`).join(", "):""),{local:suc});
  return res}
let pintaSec="ver";
function vistaSector(){const M=mapaRM(),ps=pedidosSuc(),pend=ps.filter(p=>p.estado==="pendiente"),ruta=ps.filter(p=>p.estado==="ruta"),SEC=D.sectores||[];
  const act=chOrden().filter(c=>c.local===suc);
  const porCom={};[...pend,...ruta].forEach(p=>{const c=comunaDe(p);if(c)(porCom[c]=porCom[c]||[]).push(p)});
  const hash=t=>{let h=7;for(const ch of String(t))h=(h*31+ch.charCodeAt(0))%9973;return h};
  const celdas=M.pts.map(c=>{const sec=sectorDeComuna(c.n),n=(porCom[c.n]||[]).length,fs=Math.max(7.5,Math.min(13,Math.sqrt(c.area)/7));
    const nom=c.n.replace("Pedro Aguirre Cerda","P. Aguirre Cerda").replace("San José de Maipo","S. José de Maipo").replace("Estación Central","Est. Central");
    return `<g class="cm ${sec==null?"sin":""}" data-cm="${esc(c.n)}"><path d="M${c.poly.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join("L")}Z" fill="${colSector(sec)}" fill-opacity="${sec==null?.45:.78}"><title>${esc(c.n)} · ${esc(nomSector(sec))}${n?` · ${n} pedido(s)`:""}</title></path>
      <text x="${c.cx.toFixed(1)}" y="${(c.cy+fs*.35).toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="middle">${esc(nom)}</text></g>`}).join("");
  const puntos=[...pend,...ruta].map(p=>{const c=M.por[comunaDe(p)];if(!c)return "";const h=hash(p.id),a=h%360*Math.PI/180,r=(h%7+3)/10*Math.min(c.nn*.33,26);
    const fs=Math.max(7.5,Math.min(13,Math.sqrt(c.area)/7)),x=c.cx+Math.cos(a)*r,y=c.cy+fs+7+Math.abs(Math.sin(a))*r*.5;return `<circle class="pt ${p.estado}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"><title>Pedido N° ${p.id} · ${esc(p.dir)} · ${p.estado==="ruta"?"En ruta con "+esc(nomChofer(p.chofer)):"Pendiente"}</title></circle>`}).join("");
  const camiones=SEC.map(x=>{const cs=x.comunas.map(c=>M.por[c]).filter(Boolean),ms=act.filter(c=>c.sector===x.id&&c.activo!==false);if(!cs.length||!ms.length)return "";
    const cx=cs.reduce((a,c)=>a+c.cx,0)/cs.length,cy=cs.reduce((a,c)=>a+c.cy,0)/cs.length,t=ms.map(c=>c.nombre.split(" ")[0]).join(", "),w=t.length*6.6+34;
    return `<g class="camion" transform="translate(${(cx-w/2).toFixed(1)},${(cy-34).toFixed(1)})"><rect width="${w.toFixed(0)}" height="22" rx="11" fill="${colSector(x.id)}"/><g transform="translate(7,4) scale(.6)" fill="none" stroke="#fff" stroke-width="2.2">${IC.ruta}</g><text x="26" y="15" fill="#fff" font-size="11" font-weight="700">${esc(t)}</text></g>`}).join("");
  const sinSec=pend.filter(p=>sectorDe(p)==null);
  const filaSec=x=>{const ms=act.filter(c=>c.sector===x.id),np=pend.filter(p=>sectorDe(p)===x.id).length;
    return `<div class="sz-sec"><label class="radio sz-pint"><input type="radio" name="sz-pinta" value="${x.id}" ${pintaSec===String(x.id)?"checked":""}><span class="sw" style="background:${colSector(x.id)}"></span><b>${esc(x.nombre)}</b></label>
      <span class="nota" style="margin:0">${x.comunas.length} comunas · <b>${np}</b> pendiente(s)</span>
      <span class="sz-movs">${ms.map(c=>`<span class="chip ${c.activo===false?"off":""}">${esc(c.nombre)}</span>`).join("")||'<span class="nota" style="margin:0">Sin camión</span>'}</span></div>`};
  return cabeza("Sectorizar pedidos")+`<p class="nota" style="margin:-12px 0 18px">Cada comuna de la Región Metropolitana pertenece a un sector y cada sector tiene sus camiones. El sistema envía cada pedido al camión de su sector que tenga menos pedidos en ruta.</p>
  <div class="sz">
    <div class="caja sz-mapa"><div class="barra" style="margin:0 0 8px"><span class="eyebrow">Región Metropolitana</span><span class="nota" style="margin:0" id="sz-info">${pintaSec==="ver"?"Pase el cursor por una comuna para ver su sector.":"Modo pintar: haga clic en las comunas para pasarlas al sector elegido."}</span></div>
      <svg viewBox="0 0 ${M.W} ${M.H}" class="mapa-rm ${pintaSec!=="ver"?"pintando":""}" role="img" aria-label="Mapa de sectores de la Región Metropolitana">${celdas}${puntos}${camiones}</svg>
      <div class="sz-ley"><span><i class="pt pendiente"></i> Pedido pendiente</span><span><i class="pt ruta"></i> Pedido en ruta</span><span><i class="sw" style="background:#C9CFD9"></i> Comuna sin sector</span></div></div>
    <aside class="sz-lado">
      <div class="caja"><span class="eyebrow">Despacho automático</span>
        <div class="sz-kpi"><div><b class="num">${pend.length}</b><span>Pendientes</span></div><div><b class="num">${ruta.length}</b><span>En ruta</span></div><div><b class="num">${act.filter(c=>c.activo!==false).length}</b><span>Camiones activos</span></div></div>
        <button class="btn" id="sz-desp" type="button" ${pend.length?"":"disabled"}>Despachar ${pend.length} pendiente(s) ahora</button>
        <label class="radio"><input type="checkbox" id="sz-auto" ${autoActivo(suc)?"checked":""}> Enviar solo cada pedido nuevo al grabarlo</label>
        ${sinSec.length?`<p class="aviso" style="margin:0">${sinSec.length} pedido(s) sin sector: falta la comuna o la comuna no está en ningún sector.</p>`:""}</div>
      <div class="caja"><div class="barra" style="margin:0"><span class="eyebrow">Sectores</span><label class="radio sz-pint"><input type="radio" name="sz-pinta" value="ver" ${pintaSec==="ver"?"checked":""}>Solo ver</label></div>
        <p class="nota" style="margin:0">Elija un sector y haga clic en el mapa para agregarle comunas.</p>
        ${SEC.map(filaSec).join("")}
        <div class="sz-sec"><label class="radio sz-pint"><input type="radio" name="sz-pinta" value="" ${pintaSec===""?"checked":""}><span class="sw" style="background:#C9CFD9"></span><b>Quitar de su sector</b></label></div>
        <div class="acc"><button class="btn chico linea" id="sz-nuevo" type="button">Agregar sector</button></div></div>
      <div class="caja"><span class="eyebrow">Camiones por sector</span>
        <div class="tabla-wrap"><table><thead><tr><th>Camión</th><th>Sector</th><th class="der">En ruta</th></tr></thead><tbody>
        ${act.map(c=>`<tr class="${c.activo===false?"inactivo":""}"><td>${esc(c.nombre)}${c.activo===false?' <span class="pill anulado">Inactivo</span>':""}</td><td><select data-szch="${c.id}" class="sel-mini" aria-label="Sector de ${esc(c.nombre)}"><option value="">—</option>${SEC.map(x=>`<option value="${x.id}" ${x.id===c.sector?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></td><td class="der num">${D.pedidos.filter(p=>p.chofer===c.id&&p.estado==="ruta").length}</td></tr>`).join("")||'<tr><td colspan="3">No hay camiones en esta sucursal.</td></tr>'}</tbody></table></div></div>
    </aside></div>
  <div class="caja" style="margin-top:20px"><span class="eyebrow">Pedidos pendientes y a quién irían</span>
    <div class="tabla-wrap"><table><thead><tr><th>N°</th><th>Dirección</th><th>Comuna</th><th>Sector</th><th>Camión sugerido</th></tr></thead><tbody>
    ${pend.map(p=>{const c=comunaDe(p),sec=sectorDe(p),el=sec==null?null:elegirCamion(sec,p),ms=el?[el.c]:[];
      return `<tr><td class="num">${p.id}</td><td>${esc(p.dir)}</td><td>${esc(c||"—")}</td><td><span class="sw" style="background:${colSector(sec)}"></span> ${esc(nomSector(sec))}</td><td>${ms[0]?esc(ms[0].nombre):sec!=null?'<span class="nota" style="margin:0">Sector sin camión: irá al sector más cercano</span>':(c?'<span class="nota" style="margin:0">Comuna sin sector: píntela en el mapa</span>':'<span class="nota" style="margin:0">Falta la comuna: asígnelo en Asigna Ruta</span>')}</td></tr>`}).join("")||'<tr><td colspan="5">No hay pedidos pendientes.</td></tr>'}</tbody></table></div></div>`}
function enlazarSector(){
  $$('input[name="sz-pinta"]').forEach(r=>r.onchange=()=>{pintaSec=r.value;pintarSistema()});
  const info=$("#sz-info");
  $$(".mapa-rm .cm").forEach(g=>{g.onmouseenter=()=>{if(pintaSec==="ver")info.textContent=`${g.dataset.cm} · ${nomSector(sectorDeComuna(g.dataset.cm))}`};
    g.onclick=()=>{if(pintaSec==="ver")return;const cm=g.dataset.cm,dest=pintaSec===""?null:+pintaSec;
      D.sectores.forEach(x=>x.comunas=x.comunas.filter(c=>sinTilde(c)!==sinTilde(cm)));const x=D.sectores.find(z=>z.id===dest);if(x)x.comunas.push(cm);
      log("pedidos","Sector modificado",`${cm} → ${nomSector(dest)}`,{local:suc});guardar();pintarSistema()}});
  $$("[data-szch]").forEach(s=>s.onchange=()=>{const c=D.choferes.find(x=>x.id===+s.dataset.szch);c.sector=s.value?+s.value:null;nubeChofer(c);guardar();pintarSistema()});
  $("#sz-auto").onchange=e=>{D.autoDesp=D.autoDesp||{};D.autoDesp[suc]=e.target.checked;guardar();aviso("Despacho automático",e.target.checked?"Cada pedido nuevo se enviará solo al camión de su sector.":"Los pedidos nuevos quedarán pendientes en Asigna Ruta.")};
  $("#sz-nuevo").onclick=()=>{const id=nuevoId(D.sectores);D.sectores.push({id,nombre:"Sector "+id,comunas:[]});pintaSec=String(id);guardar();pintarSistema()};
  $("#sz-desp").onclick=()=>{const r=autoDespachar(pedidosSuc());guardar();pintarSistema();
    aviso("Despacho automático",`${r.ok} pedido(s) enviados a los camiones.`+(r.motivos&&(r.motivos.apoyo||r.motivos.cercano||r.motivos.sobretope)?` ${(r.motivos.apoyo||0)+(r.motivos.cercano||0)} se repartieron a otro camión por el tope de ${topeCamion()}.`+(r.motivos.sobretope?` ${r.motivos.sobretope} quedaron sobre el tope: todos estaban llenos.`:""):"")+(r.sinComuna.length?` ${r.sinComuna.length} sin sector.`:"")+(r.sinMovil.length?` ${r.sinMovil.length} sin camión activo.`:""))};
}
V.sectorizar=vistaSector;L.sectorizar=enlazarSector;

/* ===================== SECTORIZAR POR CALLES (mapa detallado, datos OpenStreetMap) ===================== */
const FOCO_RM=["Santiago","Estación Central","Recoleta","Independencia","Conchalí","Quinta Normal","Cerrillos","Padre Hurtado","Peñaflor","Alhué","Buin","Calera de Tango","Cerro Navia","Colina","Curacaví","El Bosque","El Monte","Huechuraba","Isla de Maipo","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Lampa","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","María Pinto","Melipilla","Ñuñoa","Paine","Pedro Aguirre Cerda","Peñalolén","Pirque","Providencia","Pudahuel","Puente Alto","Quilicura","Renca","San Bernardo","San Joaquín","San José de Maipo","San Miguel","San Pedro","San Ramón","Talagante","Tiltil","Vitacura"]; // mismo orden que calles-rm.json (52 comunas de la RM)
let CALLES=null,CALLES_CARGANDO=null,szTab="calles";
const LON0=-70.70,LAT0=-33.48,KX=Math.cos(33.48*Math.PI/180)*111320,KY=110540;
const aMundo=(lon,lat)=>[(lon-LON0)*KX,-(lat-LAT0)*KY],aLonLat=(x,y)=>[x/KX+LON0,-y/KY+LAT0];
const decRM=a=>{const o=[];let x=0,y=0;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];o.push([x/1e5,y/1e5])}return o};
const ABREV={sn:"san",stgo:"santiago",avd:"",ave:"",prof:"profesor",ing:"ingeniero",mons:"monseñor",pob:"",villa:"",gral:"general",pdte:"presidente",sta:"santa",sto:"santo",tte:"teniente",cap:"capitan",cmdte:"comandante",dr:"doctor",avda:"",av:"",avenida:"",calle:"",pasaje:"",pje:"",psje:"",ptje:""};
function normCalle(t){const w=sinTilde(t).replace(/[’'´`]/g,"").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(Boolean).map(x=>ABREV[x]??x).filter(Boolean);
  const r=w.join(" ");return r==="alameda"||r==="alameda libertador bernardo ohiggins"?"libertador bernardo ohiggins":r}
function cargarCalles(){if(CALLES)return Promise.resolve(CALLES);if(CALLES_CARGANDO)return CALLES_CARGANDO;
  const porScript=()=>new Promise((ok,ko)=>{const s=document.createElement("script");s.src="calles-rm.js?v=rm52";s.onload=()=>window.CALLES_RM?ok(window.CALLES_RM):ko(new Error("sin datos"));s.onerror=()=>ko(new Error("sin datos"));document.head.appendChild(s)});
  const fuente=window.CALLES_RM?Promise.resolve(window.CALLES_RM):fetch("calles-rm.json?v=rm52").then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).catch(porScript);
  CALLES_CARGANDO=fuente.then(d=>{CALLES=prepCalles(d);
    if(!D.zonas){D.zonas=(d.zonasEjemplo||[]).map((z,i)=>({id:i+1,nombre:z.nombre,sector:z.sector,pts:z.pts}));guardar()}
    geoCache.clear();return CALLES}).catch(e=>{CALLES_CARGANDO=null;throw e});
  return CALLES_CARGANDO}
function prepCalles(d){
  /* formato compacto (toda la RM): calles y direcciones agrupadas por nombre */
  if(d.cg&&!d.calles){d.calles=[];d.cg.forEach(([n,l])=>l.forEach(([cl,cm,a])=>d.calles.push([n,cl,cm,a])))}
  if(d.dg&&!d.dirs){d.dirs=[];d.dg.forEach(([s,v])=>{let x=0,y=0;for(let i=0;i<v.length;i+=4){x+=v[i+2];y+=v[i+3];d.dirs.push([s,v[i],v[i+1],x,y])}})}
  const bb=pts=>{let a=1e9,b=1e9,c=-1e9,e=-1e9;pts.forEach(([x,y])=>{if(x<a)a=x;if(y<b)b=y;if(x>c)c=x;if(y>e)e=y});return [a,b,c,e]};
  const calles=d.calles.map(([n,cl,cm,a])=>{const ll=decRM(a),pts=ll.map(q=>aMundo(q[0],q[1]));return {n,cl,cm,ll,pts,bb:bb(pts),k:normCalle(n)}});
  const comunas=d.comunas.map(([n,polys])=>{const pp=polys.map(p=>decRM(p).map(q=>aMundo(q[0],q[1])));return {n,pp,bb:bb(pp.flat())}});
  const porCalle={};calles.forEach((c,i)=>{(porCalle[c.k]=porCalle[c.k]||[]).push(i)});
  const dirs={};d.dirs.forEach(([s,num,cm,x,y])=>{const n=parseInt(num,10);if(!n)return;const k=normCalle(s);(dirs[k]=dirs[k]||[]).push({n,cm,lon:x/1e5,lat:y/1e5})});
  Object.values(dirs).forEach(a=>a.sort((p,q)=>p.n-q.n));
  const G=60,grid=new Map();calles.forEach((c,i)=>c.pts.forEach(p=>{const k=Math.floor(p[0]/G)+","+Math.floor(p[1]/G);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push([p[0],p[1],i])}));
  const nombres=[...new Set(calles.filter(c=>c.cm>=0).map(c=>c.n))].sort((a,b)=>a.localeCompare(b,"es"));
  return {calles,comunas,porCalle,dirs,grid,G,nombres,keys:Object.keys(porCalle),fuente:d.fuente}}
const calleCache=new Map();
function buscarCalle(nombre,cm){const k=normCalle(nombre);if(!k||!CALLES)return null;
  const enCm=key=>cm<0||CALLES.porCalle[key].some(j=>CALLES.calles[j].cm===cm);
  if(CALLES.porCalle[k]&&enCm(k))return k;
  const ck=k+"|"+cm;if(calleCache.has(ck))return calleCache.get(ck);
  const A=k.split(" ");let mejor=null,ms=0,mejorCm=null,msCm=0;
  const lev1=(a,b)=>{if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return d+(a.length-i)+(b.length-j)<=1};
  const igual=(a,b)=>a===b||(a.length>=3&&b.startsWith(a))||(b.length>=3&&a.startsWith(b))||(a.length>=3&&b.length>=3&&lev1(a,b));
  for(const key of CALLES.keys){const B=key.split(" ");let i=0;A.forEach(t=>{if(B.some(u=>igual(t,u)))i++});if(!i)continue;
    let sc=2*i/(A.length+B.length);if((" "+key+" ").includes(" "+k+" ")||(" "+k+" ").includes(" "+key+" "))sc+=.25;
    if(sc>ms){ms=sc;mejor=key}if(enCm(key)&&sc>msCm){msCm=sc;mejorCm=key}}
  const r=mejorCm&&msCm>=.55?mejorCm:CALLES.porCalle[k]?k:ms>=.7?mejor:null;calleCache.set(ck,r);return r}
const partesDir=p=>{const d0=(p.dir||"").split(",")[0]||"",calle=(p.calle||d0.replace(/\s+\d.*$/,"")).trim(),num=parseInt(p.num||(d0.match(/\s(\d+)\b/)||[])[1]||"",10)||0;
  let cm=FOCO_RM.findIndex(n=>sinTilde(n)===sinTilde(p.comuna));if(cm<0){const c=comunaDe(p);cm=FOCO_RM.indexOf(c)}return {calle,num,cm}};
const geoCache=new Map();
function ubicar(p){if(p.geo)return {lon:p.geo[0],lat:p.geo[1],conf:"manual"};if(!CALLES)return null;
  const {calle,num,cm}=partesDir(p);if(cm<0||!calle)return null;const key=`${calle}|${num}|${cm}`;if(geoCache.has(key))return geoCache.get(key);
  const k=buscarCalle(calle,cm);let r=null;
  if(k){let ds=(CALLES.dirs[k]||[]).filter(x=>x.cm===cm);if(!ds.length)ds=CALLES.dirs[k]||[];
    if(num&&ds.length){const par=ds.filter(x=>x.n%2===num%2),L=par.length>=2?par:ds,ex=L.find(x=>x.n===num);
      if(ex)r={lon:ex.lon,lat:ex.lat,conf:"exacta"};
      else{let lo=null,hi=null;for(const x of L){if(x.n<num)lo=x;else if(x.n>num){hi=x;break}}
        if(lo&&hi&&hi.n-lo.n<=600){const t=(num-lo.n)/(hi.n-lo.n);r={lon:lo.lon+(hi.lon-lo.lon)*t,lat:lo.lat+(hi.lat-lo.lat)*t,conf:"aprox"}}
        else{const q=!lo?hi:!hi?lo:(num-lo.n<hi.n-num?lo:hi);if(Math.abs(q.n-num)<=250)r={lon:q.lon,lat:q.lat,conf:"aprox"}}}}
    if(!r){let cs=CALLES.porCalle[k].map(i=>CALLES.calles[i]).filter(c=>c.cm===cm);if(!cs.length)cs=CALLES.porCalle[k].map(i=>CALLES.calles[i]);
      const all=cs.flatMap(c=>c.ll);if(all.length){const m=all[Math.floor(all.length/2)];r={lon:m[0],lat:m[1],conf:"calle",todos:all}}}
    if(r)r.calle=CALLES.calles[CALLES.porCalle[k][0]].n}
  geoCache.set(key,r);return r}
function dentroPoli(pts,lon,lat){let d=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>lat)!==(yj>lat))&&lon<(xj-xi)*(lat-yi)/(yj-yi)+xi)d=!d}return d}
const zonaDe=(lon,lat)=>{const zs=D.zonas||[];for(let i=zs.length-1;i>=0;i--)if(dentroPoli(zs[i].pts,lon,lat))return zs[i];return null};
function reglaDe(p){const {calle,num}=partesDir(p),k=normCalle(calle);if(!k)return null;
  return (D.reglasCalle||[]).find(r=>normCalle(r.calle)===k&&(!r.comuna||sinTilde(r.comuna)===sinTilde(p.comuna||comunaDe(p)||""))&&(!num?!r.desde&&!r.hasta:(num>=(r.desde||0)&&num<=(r.hasta||1e9)&&(r.par==="pares"?num%2===0:r.par==="impares"?num%2===1:true))))||null}
const METODO={manual:"Elegido a mano",regla:"Regla de calle",exacta:"N° exacto en el mapa",aprox:"N° aproximado",calle:"Solo por la calle",pin:"Marcado en el mapa",comuna:"Por comuna",ninguno:"Sin ubicar"};
function sectorDetalle(p){
  if(p.sector!=null)return {sector:p.sector,metodo:"manual"};
  const rg=reglaDe(p);if(rg)return {sector:rg.sector,metodo:"regla",regla:rg};
  const g=ubicar(p);
  if(g){let z=null;
    if(g.conf==="calle"&&g.todos){const ss=new Set(g.todos.map(q=>(zonaDe(q[0],q[1])||{}).id));if(ss.size===1&&!ss.has(undefined))z=(D.zonas||[]).find(x=>x.id===[...ss][0])}
    else z=zonaDe(g.lon,g.lat);
    if(z)return {sector:z.sector,metodo:g.conf==="manual"?"pin":g.conf,zona:z,geo:g}}
  const cm=comunaDe(p),s=cm?sectorDeComuna(cm):sectorDeTexto(p);
  return {sector:s,metodo:g&&g.conf==="manual"?"pin":s!=null?"comuna":"ninguno",geo:g}}
function sectorDe(p){return sectorDetalle(p).sector}

/* ---------- vista ---------- */
let szDibNom="",MV={cx:null,cy:null,z:null},szModo="ver",szSel=null,szDib=[],szDibSec=null,szUbicar=null,szRO=null;
function tabsSz(){return `<div class="tabs" role="tablist" style="margin-bottom:18px">${[["calles","Mapa de calles"],["rm","Región Metropolitana"]].map(([k,t])=>`<button type="button" role="tab" data-sztab="${k}" aria-selected="${szTab===k}">${t}</button>`).join("")}</div>`}
function cajaDespacho(pend,ruta,act){return `<div class="caja"><span class="eyebrow">Despacho automático</span>
  <div class="sz-kpi"><div><b class="num">${pend.length}</b><span>Pendientes</span></div><div><b class="num">${ruta.length}</b><span>En ruta</span></div><div><b class="num">${act.filter(c=>c.activo!==false).length}</b><span>Camiones activos</span></div></div>
  <button class="btn" id="sz-desp" type="button" ${pend.length?"":"disabled"}>Despachar ${pend.length} pendiente(s) ahora</button>
  <label class="radio"><input type="checkbox" id="sz-auto" ${autoActivo(suc)?"checked":""}> Enviar solo cada pedido nuevo al grabarlo</label>
  <label class="tope-cam">Tope por camión<span><input id="sz-tope" type="number" min="1" max="30" class="num" value="${topeCamion()}"> pedidos en ruta</span></label>
  <label class="tope-cam">Juntar pedidos cercanos<span><input id="sz-cerca" type="number" min="0" max="5" step="0.5" class="num" value="${radioCerca()}"> km a la redonda</span></label>
  <p class="nota" style="margin:0">Primero: si el pedido queda a menos de esa distancia de otro que un camión ya lleva en ruta, se lo da a ese camión (pasa por ahí). 0 = no juntar.<br>Al llegar al tope, el siguiente pedido va al camión de apoyo del sector; si también está lleno, al sector vecino con espacio.</p></div>`}
function tablaCamiones(act,SEC){const T=topeCamion();return `<div class="caja"><span class="eyebrow">Camiones por sector</span><p class="nota" style="margin:0">«También cubre»: sectores donde el camión ayuda cuando el de ese sector llega al tope.</p><div class="tabla-wrap"><table><thead><tr><th>Camión</th><th>Sector</th><th>También cubre</th><th class="der">En ruta</th></tr></thead><tbody>
  ${act.map(c=>{const n=cargaCam(c.id),ap=(c.apoyo||[]).filter(id=>SEC.some(x=>x.id===id)&&id!==c.sector);return `<tr><td>${esc(c.nombre)}${c.activo===false?' <span class="pill anulado">Inactivo</span>':""}</td><td><select data-szch="${c.id}" class="sel-mini" aria-label="Sector de ${esc(c.nombre)}"><option value="">—</option>${SEC.map(x=>`<option value="${x.id}" ${x.id===c.sector?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></td>
    <td><details class="apoyo-sel"><summary>${ap.length?ap.map(id=>esc(nomSector(id))).join(", "):"—"}</summary><div>${SEC.filter(x=>x.id!==c.sector).map(x=>`<label class="radio"><input type="checkbox" data-apoyo="${c.id}" value="${x.id}" ${ap.includes(x.id)?"checked":""}><span class="sw" style="background:${colSector(x.id)}"></span>${esc(x.nombre)}</label>`).join("")||'<span class="nota">No hay otros sectores.</span>'}</div></details></td>
    <td class="der"><span class="carga ${n>=T?"llena":n>=T-1?"casi":""} num">${n}/${T}</span></td></tr>`}).join("")||'<tr><td colspan="4">No hay camiones en esta sucursal.</td></tr>'}</tbody></table></div></div>`}
function vistaCalles(){
  if(!CALLES)return `<div class="caja sz-cargando" id="sz-carga"><b>Cargando el mapa de calles…</b><span class="nota" style="margin:0">Región Metropolitana · ${FOCO_RM.length} comunas</span></div>`;
  const ps=pedidosSuc(),pend=ps.filter(p=>p.estado==="pendiente"),ruta=ps.filter(p=>p.estado==="ruta"),SEC=D.sectores||[],act=chOrden().filter(c=>c.local===suc),zs=D.zonas||[];
  const opSec=(sel,vacio)=>(vacio?`<option value="">${vacio}</option>`:"")+SEC.map(x=>`<option value="${x.id}" ${x.id===sel?"selected":""}>${esc(x.nombre)}</option>`).join("");
  const zsel=zs.find(z=>z.id===szSel);
  const ayuda={ver:"Arrastre para mover y use la rueda o los botones para acercar. Haga clic en un punto para ver la calle y su sector.",
    dibujar:"Haga clic en cada esquina del borde del sector. Los puntos se pegan a la esquina más cercana. Para cerrar, haga clic en el primer punto o en «Terminar zona».",
    editar:"Haga clic en una zona para elegirla. Arrastre sus puntos para moverlos; arrastre los puntos chicos del medio para agregar una esquina.",
    ubicar:"Haga clic en el lugar exacto de la entrega."}[szModo];
  const panel=szModo==="dibujar"?`<div class="caja sz-panel"><span class="eyebrow">Nueva zona</span>
      <label>Sector<select id="sz-dsec">${opSec(szDibSec??SEC[0]?.id)}</select></label>
      <label>Nombre de la zona<input id="sz-dnom" value="${esc(szDibNom)}" placeholder="Ej: Barrio Yungay (Matucana a Brasil)"></label>
      <p class="nota" style="margin:0"><b class="num">${szDib.length}</b> punto(s) marcados</p>
      <div class="acc"><button class="btn chico" id="sz-dfin" type="button" ${szDib.length>=3?"":"disabled"}>Terminar zona</button><button class="btn chico linea" id="sz-dundo" type="button" ${szDib.length?"":"disabled"}>Deshacer punto</button><button class="btn chico linea" id="sz-dcan" type="button">Cancelar</button></div></div>`
    :szModo==="editar"?`<div class="caja sz-panel"><span class="eyebrow">Editar zona</span>${zsel?`
      <label>Nombre<input id="sz-enom" value="${esc(zsel.nombre||"")}"></label><label>Sector<select id="sz-esec">${opSec(zsel.sector)}</select></label>
      <p class="nota" style="margin:0">${zsel.pts.length} esquinas</p>
      <div class="acc"><button class="btn chico" id="sz-eok" type="button">Guardar cambios</button><button class="btn chico linea" id="sz-edel" type="button">Eliminar zona</button></div>`:'<p class="nota" style="margin:0">Haga clic en una zona del mapa.</p>'}</div>`
    :szModo==="ubicar"?`<div class="caja sz-panel"><span class="eyebrow">Ubicar pedido N° ${szUbicar}</span><p class="nota" style="margin:0">${esc((D.pedidos.find(p=>p.id===szUbicar)||{}).dir||"")}</p><div class="acc"><button class="btn chico linea" id="sz-ucan" type="button">Cancelar</button></div></div>`:"";
  const zonasSec=SEC.map(x=>{const zz=zs.filter(z=>z.sector===x.id),ms=act.filter(c=>c.sector===x.id),ap=act.filter(c=>c.sector!==x.id&&(c.apoyo||[]).includes(x.id));
    return `<div class="sz-sec"><div class="sz-pint"><span class="sw" style="background:${colSector(x.id)}"></span><b>${esc(x.nombre)}</b><span class="nota" style="margin:0 0 0 auto">${zz.length} zona(s)</span></div>
      ${zz.length?`<div class="sz-zonas">${zz.map(z=>`<button type="button" class="chip-z" data-zver="${z.id}">${esc(z.nombre||"Zona "+z.id)}</button>`).join("")}</div>`:""}
      <span class="sz-movs">${ms.map(c=>`<span class="chip ${c.activo===false?"off":""}">${esc(c.nombre)} <span class="num">${cargaCam(c.id)}/${topeCamion()}</span></span>`).join("")}${ap.map(c=>`<span class="chip apoyo">+ ${esc(c.nombre)} (apoyo)</span>`).join("")}${ms.length||ap.length?"":'<span class="nota" style="margin:0">Sin camión</span>'}</span></div>`}).join("");
  const reglas=D.reglasCalle||[];
  const filaPed=p=>{const s=sectorDetalle(p),el=s.sector==null?null:elegirCamion(s.sector,p),ms=el?[el.c]:[];
    const ok={exacta:"ok",pin:"ok",regla:"ok",manual:"ok",aprox:"med",calle:"med",comuna:"baja",ninguno:"mal"}[s.metodo];
    return `<tr><td class="num">${p.id}</td><td>${esc(p.dir)}</td><td><span class="ub ${ok}">${METODO[s.metodo]}</span>${s.zona?`<br><span class="nota" style="margin:0">${esc(s.zona.nombre||"")}</span>`:""}</td>
      <td><span class="sw" style="background:${colSector(s.sector)}"></span> ${esc(nomSector(s.sector))}</td><td>${ms[0]?`${esc(ms[0].nombre)} <span class="num nota" style="margin:0">(${cargaCam(ms[0].id)}/${topeCamion()})</span>${el.motivo!=="sector"?`<br><span class="ub ${el.motivo==="sobretope"?"mal":"med"}">${MOTIVO_CAM[el.motivo]}</span>`:""}`:s.sector!=null?'<span class="nota" style="margin:0">Sector sin camión</span>':"—"}</td>
      <td class="der"><div class="acc" style="justify-content:flex-end">${s.geo?`<button type="button" class="btn chico linea" data-pver="${p.id}">Ver</button>`:""}<button type="button" class="btn chico linea" data-pubic="${p.id}">Marcar en mapa</button></div></td></tr>`};
  return `<div class="sz2">
    <div class="caja sz-mapa2">
      <div class="sz-bar"><input id="sz-q" list="sz-lcalles" placeholder="Buscar calle…" autocomplete="off" aria-label="Buscar calle"><datalist id="sz-lcalles"></datalist>
        <select id="sz-com" aria-label="Ir a comuna"><option value="">Ir a comuna…</option>${CALLES.comunas.map((c,i)=>`<option value="${i}">${esc(c.n)}</option>`).join("")}</select>
        <div class="sz-modos" role="group" aria-label="Modo del mapa">${[["ver","Mover"],["dibujar","Dibujar zona"],["editar","Editar zonas"]].map(([k,t])=>`<button type="button" class="btn chico ${szModo===k?"":"linea"}" data-szmodo="${k}">${t}</button>`).join("")}</div></div>
      <div class="sz-lienzo ${szModo}" id="sz-lienzo"><canvas id="sz-cv" aria-label="Mapa de calles con los sectores"></canvas>
        <div class="sz-zoom"><button type="button" id="sz-mas" aria-label="Acercar">+</button><button type="button" id="sz-menos" aria-label="Alejar">−</button></div>
        <div class="sz-tip" id="sz-tip" hidden></div></div>
      <div class="barra" style="margin:8px 0 0"><span class="nota" style="margin:0">${ayuda}</span><span class="nota" style="margin:0">Calles © colaboradores de OpenStreetMap</span></div></div>
    <aside class="sz-lado">${panel}${cajaDespacho(pend,ruta,act)}
      <div class="caja"><div class="barra" style="margin:0"><span class="eyebrow">Sectores y zonas</span><button class="btn chico linea" id="sz-nuevo" type="button">Agregar sector</button></div>${zonasSec}
        <p class="nota" style="margin:0">Fuera de las zonas dibujadas se usa el sector de la comuna (pestaña Región Metropolitana).</p></div>
    </aside></div>
  <div class="sz-bajo">
    <div class="caja"><span class="eyebrow">Reglas por calle y número</span><p class="nota" style="margin:0">Para calles que cruzan dos sectores. La regla manda sobre el mapa.</p>
      <div class="tabla-wrap"><table><thead><tr><th>Calle</th><th>Comuna</th><th class="der">Desde N°</th><th class="der">Hasta N°</th><th>Numeración</th><th>Sector</th><th></th></tr></thead><tbody>
      ${reglas.map((r,i)=>`<tr><td>${esc(r.calle)}</td><td>${esc(r.comuna||"Todas")}</td><td class="der num">${r.desde||"—"}</td><td class="der num">${r.hasta||"—"}</td><td>${({todos:"Todos",pares:"Pares",impares:"Impares"})[r.par||"todos"]}</td><td><span class="sw" style="background:${colSector(r.sector)}"></span> ${esc(nomSector(r.sector))}</td><td class="der"><button class="btn chico linea" type="button" data-rdel="${i}">Quitar</button></td></tr>`).join("")||'<tr><td colspan="7">Sin reglas. Ejemplo: San Pablo del 1 al 2999 → Centro.</td></tr>'}</tbody></table></div>
      <form id="f-regla" class="sz-regla"><label>Calle<input id="rg-calle" list="sz-lcalles" required autocomplete="off"></label><label>Comuna<select id="rg-com"><option value="">Todas</option>${FOCO_RM.map(c=>`<option>${esc(c)}</option>`).join("")}</select></label>
        <label>Desde N°<input id="rg-desde" type="number" min="0" class="num"></label><label>Hasta N°<input id="rg-hasta" type="number" min="0" class="num"></label>
        <label>Numeración<select id="rg-par"><option value="todos">Todos</option><option value="pares">Pares</option><option value="impares">Impares</option></select></label>
        <label>Sector<select id="rg-sec">${opSec(null)}</select></label><button class="btn" type="submit">Agregar regla</button></form></div>
    ${tablaCamiones(act,SEC)}</div>
  <div class="caja" style="margin-top:20px"><span class="eyebrow">Pedidos pendientes: dónde caen y a quién irían</span>
    <div class="tabla-wrap"><table><thead><tr><th>N°</th><th>Dirección</th><th>Cómo se ubicó</th><th>Sector</th><th>Camión sugerido</th><th></th></tr></thead><tbody>
    ${pend.map(filaPed).join("")||'<tr><td colspan="6">No hay pedidos pendientes.</td></tr>'}</tbody></table></div></div>`}

/* ---------- dibujo del mapa ---------- */
function mapaCalles(){
  const cv=$("#sz-cv"),box=$("#sz-lienzo");if(!cv||!CALLES)return;const C=CALLES,ctx=cv.getContext("2d");let W=0,H=0,dpr=1,cursor=null,snap=null,arrV=null,tips=[];
  const aP=(x,y)=>[(x-MV.cx)*MV.z+W/2,(y-MV.cy)*MV.z+H/2],aM=(sx,sy)=>[(sx-W/2)/MV.z+MV.cx,(sy-H/2)/MV.z+MV.cy];
  const enfocar=b=>{MV.cx=(b[0]+b[2])/2;MV.cy=(b[1]+b[3])/2;MV.z=Math.min(4,Math.max(.012,Math.min((W||800)/(b[2]-b[0]+1)*.9,(H||600)/(b[3]-b[1]+1)*.9)))};
  const zonaW=z=>z.pts.map(q=>aMundo(q[0],q[1]));
  function tam(){dpr=Math.min(2,devicePixelRatio||1);W=box.clientWidth;H=box.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);if(MV.z==null)enfocar(C.comunas[0].bb);dibujar()}
  const ANCHO=[0,22,18,14,11,7,5];
  function dibujar(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle="#E4E9F0";ctx.fillRect(0,0,W,H);
    const [vx0,vy0]=aM(-40,-40),[vx1,vy1]=aM(W+40,H+40),z=MV.z,vis=b=>b[2]>=vx0&&b[0]<=vx1&&b[3]>=vy0&&b[1]<=vy1;
    // comunas
    C.comunas.forEach(c=>{if(!vis(c.bb))return;ctx.beginPath();c.pp.forEach(p=>p.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)}));ctx.closePath();ctx.fillStyle="#FAFBFD";ctx.fill()});
    // zonas
    (D.zonas||[]).forEach(zn=>{const pw=zonaW(zn);ctx.beginPath();pw.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.closePath();
      ctx.globalAlpha=zn.id===szSel?.32:.2;ctx.fillStyle=colSector(zn.sector);ctx.fill();ctx.globalAlpha=1});
    // calles
    const maxCl=z<.05?2:z<.11?3:z<.22?4:6;
    for(const pasada of [0,1])for(let cl=maxCl;cl>=1;cl--){ctx.beginPath();let n=0;
      for(const c of C.calles){if(c.cl!==cl||!vis(c.bb))continue;n++;c.pts.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)})}
      if(!n)continue;const w=Math.max(cl<=2?2.2:cl<=4?1.4:.8,ANCHO[cl]*z);ctx.lineCap="round";ctx.lineJoin="round";
      if(pasada===0){ctx.strokeStyle=cl<=2?"#D9B44A":"#C3CCD8";ctx.lineWidth=w+(w>3?2:1);ctx.stroke()}else{ctx.strokeStyle=cl<=2?"#FCE7A6":"#FFFFFF";ctx.lineWidth=w;ctx.stroke()}}
    // bordes de comuna
    ctx.setLineDash([6,5]);ctx.lineWidth=1.4;ctx.strokeStyle="#7D8AA0";C.comunas.forEach(c=>{if(!vis(c.bb))return;c.pp.forEach(p=>{ctx.beginPath();p.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.closePath();ctx.stroke()})});ctx.setLineDash([]);
    // bordes de zonas
    (D.zonas||[]).forEach(zn=>{const pw=zonaW(zn);ctx.beginPath();pw.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.closePath();ctx.strokeStyle=colSector(zn.sector);ctx.lineWidth=zn.id===szSel?3.5:2.2;ctx.stroke()});
    // nombres de calles
    const ocup=[],vistos={};ctx.font='600 11.5px "Source Sans 3",system-ui,sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";
    if(z>=.22){const lista=C.calles.filter(c=>vis(c.bb)&&(c.cl<=4||z>=.5)).sort((a,b)=>a.cl-b.cl);
      for(const c of lista){let best=null,bl=0;for(let i=1;i<c.pts.length;i++){const [a,b]=aP(...c.pts[i-1]),[d,e]=aP(...c.pts[i]);const l=Math.hypot(d-a,e-b);if(l>bl&&a>-50&&a<W+50&&b>-50&&b<H+50){bl=l;best=[a,b,d,e]}}
        if(!best)continue;const tw=ctx.measureText(c.n).width;if(bl<tw+14)continue;const mx=(best[0]+best[2])/2,my=(best[1]+best[3])/2;
        if(ocup.some(o=>Math.abs(o[0]-mx)<(o[2]+tw)/2+6&&Math.abs(o[1]-my)<16))continue;if((vistos[c.n]||[]).some(o=>Math.hypot(o[0]-mx,o[1]-my)<320))continue;
        ocup.push([mx,my,tw]);(vistos[c.n]=vistos[c.n]||[]).push([mx,my]);let ang=Math.atan2(best[3]-best[1],best[2]-best[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
        ctx.save();ctx.translate(mx,my);ctx.rotate(ang);ctx.lineWidth=3.5;ctx.strokeStyle="rgba(255,255,255,.95)";ctx.strokeText(c.n,0,0);ctx.fillStyle="#2E3A4E";ctx.fillText(c.n,0,0);ctx.restore()}}
    // nombres de comunas y zonas
    if(z<.3){ctx.font='700 14px "Archivo",system-ui,sans-serif';C.comunas.forEach(c=>{if(!vis(c.bb))return;const [a,b]=aP((c.bb[0]+c.bb[2])/2,(c.bb[1]+c.bb[3])/2);ctx.lineWidth=4;ctx.strokeStyle="#fff";ctx.strokeText(c.n,a,b);ctx.fillStyle="#3B4658";ctx.fillText(c.n,a,b)})}
    // camiones por zona (en la zona más grande de cada sector)
    const act=chOrden().filter(c=>c.local===suc&&c.activo!==false),hecho=new Set();ctx.font='700 11px "Source Sans 3",system-ui,sans-serif';ctx.textAlign="left";
    [...(D.zonas||[])].sort((a,b)=>b.pts.length-a.pts.length).forEach(zn=>{if(hecho.has(zn.sector))return;const ms=act.filter(c=>c.sector===zn.sector);if(!ms.length)return;hecho.add(zn.sector);
      const pw=zonaW(zn),cx=pw.reduce((s,q)=>s+q[0],0)/pw.length,cy=pw.reduce((s,q)=>s+q[1],0)/pw.length,[a,b]=aP(cx,cy);if(a<-80||a>W+80||b<-30||b>H+30)return;
      const t=ms.map(c=>c.nombre.split(" ")[0]).join(", "),w=ctx.measureText(t).width+30;ctx.fillStyle=colSector(zn.sector);ctx.beginPath();ctx.roundRect(a-w/2,b-30,w,22,11);ctx.fill();
      ctx.fillStyle="#fff";ctx.fillText("▸ "+t,a-w/2+10,b-19)});
    // pedidos
    tips=[];const ps=pedidosSuc().filter(p=>p.estado==="pendiente"||p.estado==="ruta");
    ps.forEach(p=>{const g=ubicar(p);if(!g)return;const [x,y]=aMundo(g.lon,g.lat),[a,b]=aP(x,y);if(a<-20||a>W+20||b<-20||b>H+20)return;
      ctx.beginPath();ctx.arc(a,b-14,8,Math.PI*.85,Math.PI*.15);ctx.lineTo(a,b);ctx.closePath();ctx.fillStyle=p.estado==="ruta"?"#0B1F3F":"#F2A007";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle="#fff";ctx.stroke();
      ctx.beginPath();ctx.arc(a,b-14,3,0,7);ctx.fillStyle="#fff";ctx.fill();tips.push({a,b:b-12,p,g})});
    // edición
    const zsel=(D.zonas||[]).find(x=>x.id===szSel);
    if(szModo==="editar"&&zsel){const pw=zonaW(zsel).map(q=>aP(...q));pw.forEach(([a,b],i)=>{const [c,d]=pw[(i+1)%pw.length];ctx.beginPath();ctx.arc((a+c)/2,(b+d)/2,3.5,0,7);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle=colSector(zsel.sector);ctx.lineWidth=1.5;ctx.stroke()});
      pw.forEach(([a,b])=>{ctx.beginPath();ctx.arc(a,b,5.5,0,7);ctx.fillStyle=colSector(zsel.sector);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke()})}
    if(szModo==="dibujar"){const col=colSector(szDibSec??(D.sectores||[])[0]?.id);const pw=szDib.map(q=>aP(...aMundo(q[0],q[1])));
      ctx.beginPath();pw.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));if(cursor&&pw.length){const c=snap||cursor;ctx.lineTo(c[0],c[1])}ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash([7,4]);ctx.stroke();ctx.setLineDash([]);
      pw.forEach(([a,b],i)=>{ctx.beginPath();ctx.arc(a,b,i===0?7:5,0,7);ctx.fillStyle=i===0?"#fff":col;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke()})}
    if(snap&&(szModo==="dibujar"||arrV)){ctx.beginPath();ctx.arc(snap[0],snap[1],9,0,7);ctx.strokeStyle="#D9731A";ctx.lineWidth=2;ctx.stroke()}
    // escala
    const m=[50,100,200,500,1000,2000,5000].find(v=>v*z>=70)||5000,lw=m*z;ctx.fillStyle="rgba(255,255,255,.85)";ctx.fillRect(10,H-30,lw+16,22);ctx.fillStyle="#3B4658";ctx.fillRect(18,H-14,lw,3);
    ctx.font='600 11px "IBM Plex Mono",monospace';ctx.textAlign="left";ctx.fillText(m>=1000?m/1000+" km":m+" m",18,H-22)}
  // esquina más cercana (vértice de calle) a un punto de pantalla
  function ajustar(sx,sy){const [x,y]=aM(sx,sy),r=14/MV.z,G=C.G;let best=null,bd=r;
    for(let i=Math.floor((x-r)/G);i<=Math.floor((x+r)/G);i++)for(let j=Math.floor((y-r)/G);j<=Math.floor((y+r)/G);j++){const a=C.grid.get(i+","+j);if(a)for(const p of a){const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=p}}}
    return best}
  function calleCerca(sx,sy){const [x,y]=aM(sx,sy),G=C.G,r=Math.max(40,25/MV.z);let best=null,bd=1e9;
    for(let i=Math.floor((x-r)/G);i<=Math.floor((x+r)/G);i++)for(let j=Math.floor((y-r)/G);j<=Math.floor((y+r)/G);j++){const a=C.grid.get(i+","+j);if(a)for(const p of a){const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=p}}}
    return best?C.calles[best[2]]:null}
  const tip=$("#sz-tip");const verTip=(sx,sy,html)=>{tip.innerHTML=html;tip.hidden=false;tip.style.left=Math.min(W-230,Math.max(6,sx+12))+"px";tip.style.top=Math.max(6,sy-10)+"px"};
  function clic(sx,sy){const [x,y]=aM(sx,sy),[lon,lat]=aLonLat(x,y);
    if(szModo==="ubicar"){const p=D.pedidos.find(q=>q.id===szUbicar);if(p){const s=ajustar(sx,sy)||[x,y];p.geo=aLonLat(s[0],s[1]).map(v=>+v.toFixed(6));p.sector=null;
      log("pedidos","Ubicado en mapa",`Pedido N° ${p.id} · ${p.dir} · ${nomSector(sectorDe(p))}`,{local:suc,pedido:p.id});nubePedido(p);guardar()}szModo="ver";szUbicar=null;pintarSistema();return}
    if(szModo==="dibujar"){if(szDib.length>=3){const [a,b]=aP(...aMundo(...szDib[0]));if(Math.hypot(a-sx,b-sy)<12){terminarZona();return}}
      const s=ajustar(sx,sy)||[x,y];szDib.push(aLonLat(s[0],s[1]).map(v=>+v.toFixed(6)));pintarSistema();return}
    if(szModo==="editar"){const z=zonaDe(lon,lat);szSel=z?z.id:null;pintarSistema();return}
    const t=tips.find(o=>Math.hypot(o.a-sx,o.b-sy)<12);
    if(t){const s=sectorDetalle(t.p);verTip(sx,sy,`<b>Pedido N° ${t.p.id}</b><br>${esc(t.p.dir)}<br>${esc(nomSector(s.sector))} · ${METODO[s.metodo]}${t.p.chofer?`<br>En ruta con ${esc(nomChofer(t.p.chofer))}`:""}`);return}
    const c=calleCerca(sx,sy),z=zonaDe(lon,lat);verTip(sx,sy,`<b>${esc(c?c.n:"Sin calle cerca")}</b>${c&&c.cm>=0?" · "+esc(FOCO_RM[c.cm]):""}<br>${z?`<span class="sw" style="background:${colSector(z.sector)}"></span> ${esc(nomSector(z.sector))} · ${esc(z.nombre||"")}`:"Fuera de las zonas dibujadas"}`)}
  // punteros: mover, zoom con rueda y con dos dedos
  const pts=new Map();let ini=null,movio=false,pinch=null;
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.offsetX,e.offsetY]);movio=false;tip.hidden=true;
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:MV.z};return}
    ini={x:e.offsetX,y:e.offsetY,cx:MV.cx,cy:MV.cy};arrV=null;
    const zsel=(D.zonas||[]).find(x=>x.id===szSel);
    if(szModo==="editar"&&zsel){const pw=zonaW(zsel).map(q=>aP(...q));let i=pw.findIndex(([a,b])=>Math.hypot(a-e.offsetX,b-e.offsetY)<9);
      if(i<0){const m=pw.findIndex(([a,b],k)=>{const [c,d]=pw[(k+1)%pw.length];return Math.hypot((a+c)/2-e.offsetX,(b+d)/2-e.offsetY)<8});if(m>=0){zsel.pts.splice(m+1,0,aLonLat(...aM(e.offsetX,e.offsetY)));i=m+1}}
      if(i>=0)arrV={z:zsel,i}}};
  cv.onpointermove=e=>{const p=pts.get(e.pointerId);cursor=[e.offsetX,e.offsetY];
    if(pinch&&pts.size===2){pts.set(e.pointerId,[e.offsetX,e.offsetY]);const [a,b]=[...pts.values()];MV.z=Math.min(4,Math.max(.012,pinch.z*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d));movio=true;dibujar();return}
    if(p&&ini){if(Math.hypot(e.offsetX-ini.x,e.offsetY-ini.y)>4)movio=true;
      if(arrV){const s=ajustar(e.offsetX,e.offsetY);snap=s?aP(s[0],s[1]):null;arrV.z.pts[arrV.i]=aLonLat(...(s||aM(e.offsetX,e.offsetY))).map(v=>+v.toFixed(6));dibujar();return}
      if(movio){MV.cx=ini.cx-(e.offsetX-ini.x)/MV.z;MV.cy=ini.cy-(e.offsetY-ini.y)/MV.z;dibujar()}return}
    if(szModo==="dibujar"){const s=ajustar(e.offsetX,e.offsetY);snap=s?aP(s[0],s[1]):null;dibujar()}};
  cv.onpointerup=cv.onpointercancel=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;
    if(arrV){const z=arrV.z;arrV=null;snap=null;log("pedidos","Zona modificada",`${z.nombre||"Zona "+z.id} · ${nomSector(z.sector)}`,{local:suc});guardar();pintarSistema();return}
    if(ini&&!movio&&e.type==="pointerup")clic(e.offsetX,e.offsetY);ini=null};
  cv.onpointerleave=()=>{cursor=null;if(szModo==="dibujar"){snap=null;dibujar()}};
  const zoomEn=(f,sx,sy)=>{const [x,y]=aM(sx,sy);MV.z=Math.min(4,Math.max(.012,MV.z*f));MV.cx=x-(sx-W/2)/MV.z;MV.cy=y-(sy-H/2)/MV.z;dibujar()};
  cv.onwheel=e=>{e.preventDefault();zoomEn(Math.exp(-e.deltaY*.0015),e.offsetX,e.offsetY)};
  $("#sz-mas").onclick=()=>zoomEn(1.6,W/2,H/2);$("#sz-menos").onclick=()=>zoomEn(1/1.6,W/2,H/2);
  $("#sz-com").onchange=e=>{const c=C.comunas[+e.target.value];if(c){enfocar(c.bb);dibujar()}};
  const q=$("#sz-q");q.onfocus=()=>{const dl=$("#sz-lcalles");if(!dl.options.length)dl.innerHTML=C.nombres.map(n=>`<option value="${esc(n)}">`).join("")};
  q.onchange=()=>{const k=buscarCalle(q.value,-1);if(!k)return aviso("Calle no encontrada","Revise el nombre o elija una de la lista.");const pp=CALLES.porCalle[k].flatMap(i=>CALLES.calles[i].pts);
    let b=[1e9,1e9,-1e9,-1e9];pp.forEach(([x,y])=>{b=[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)]});enfocar([b[0]-150,b[1]-150,b[2]+150,b[3]+150]);dibujar()};
  MV.enfocarPedido=g=>{const [x,y]=aMundo(g.lon,g.lat);MV.cx=x;MV.cy=y;MV.z=Math.max(MV.z,.9);dibujar()};
  if(szRO)szRO.disconnect();szRO=new ResizeObserver(()=>tam());szRO.observe(box);tam()}
function terminarZona(){if(szDib.length<3)return;const sec=+($("#sz-dsec")||{}).value||szDibSec||(D.sectores||[])[0]?.id,nom=((($("#sz-dnom")||{}).value||szDibNom)||"").trim();szDibNom="";
  D.zonas=D.zonas||[];const z={id:nuevoId(D.zonas),nombre:nom||"Zona "+(D.zonas.length+1),sector:sec,pts:szDib};D.zonas.push(z);
  log("pedidos","Zona creada",`${z.nombre} · ${nomSector(sec)} · ${z.pts.length} esquinas`,{local:suc});szDib=[];szModo="editar";szSel=z.id;guardar();pintarSistema()}
function enlazarComunSz(){
  $$("[data-sztab]").forEach(b=>b.onclick=()=>{szTab=b.dataset.sztab;pintarSistema()});
  $$("[data-preset]").forEach(b=>b.onclick=()=>{szPreset=b.dataset.preset;szSel=null;szDib=[];szModo="ver";pintarSistema()});
  const ph=$("#pr-hoy");if(ph)ph.onchange=()=>{D.presetHoy=ph.value;log("pedidos","Distribución del día",ph.options[ph.selectedIndex].text,{local:suc});guardar();pintarSistema()};
  const pc=$("#pr-copiar");if(pc)pc.onclick=()=>confirmar(pc,()=>{const k=D.presetCargado,o=D.presets[k==="domingo"?"diario":"domingo"];if(o.nuevo)return;const c=structuredClone(o);
    D.sectores=c.sectores||[];D.zonas=c.zonas;D.reglasCalle=c.reglasCalle||[];D.choferes.forEach(ch=>{ch.sector=c.asign&&ch.id in c.asign?c.asign[ch.id]:null;ch.apoyo=c.apoyo&&c.apoyo[ch.id]?c.apoyo[ch.id]:[]});D.topeCamion=c.tope||3;D.radioCerca=c.cerca??1;
    log("pedidos","Distribución copiada",`${PRESETS[k==="domingo"?"diario":"domingo"]} → ${PRESETS[k]}`,{local:suc});guardar();pintarSistema()});
  $$("[data-szch]").forEach(s=>s.onchange=()=>{const c=D.choferes.find(x=>x.id===+s.dataset.szch);c.sector=s.value?+s.value:null;nubeChofer(c);guardar();pintarSistema()});
  {const zc=$("#sz-cerca");if(zc)zc.onchange=()=>{const v=Math.max(0,Math.min(5,+zc.value||0));D.radioCerca=v;log("pedidos","Juntar pedidos cercanos",v?`${v} km`:"desactivado",{local:suc});guardar();pintarSistema()}}
  const tp=$("#sz-tope");if(tp)tp.onchange=()=>{const v=Math.max(1,Math.min(30,+tp.value||3));D.topeCamion=v;log("pedidos","Tope por camión",`${v} pedidos en ruta`,{local:suc});guardar();pintarSistema()};
  $$("[data-apoyo]").forEach(i=>i.onchange=()=>{const c=D.choferes.find(x=>x.id===+i.dataset.apoyo),v=+i.value;c.apoyo=(c.apoyo||[]).filter(x=>x!==v);if(i.checked)c.apoyo.push(v);
    log("pedidos","Camión de apoyo",`${c.nombre} ${i.checked?"cubre también":"ya no cubre"} ${nomSector(v)}`,{local:suc});guardar();pintarSistema()});
  const au=$("#sz-auto");if(au)au.onchange=e=>{D.autoDesp=D.autoDesp||{};D.autoDesp[suc]=e.target.checked;guardar();aviso("Despacho automático",e.target.checked?"Cada pedido nuevo se enviará solo al camión de su sector.":"Los pedidos nuevos quedarán pendientes en Asigna Ruta.")};
  const nv=$("#sz-nuevo");if(nv)nv.onclick=()=>{const id=nuevoId(D.sectores);D.sectores.push({id,nombre:"Sector "+id,comunas:[]});if(typeof pintaSec!=="undefined")pintaSec=String(id);szDibSec=id;guardar();pintarSistema()};
  const dp=$("#sz-desp");if(dp)dp.onclick=()=>{const r=conPreset(presetDelDia(),()=>autoDespachar(pedidosSuc()));guardar();pintarSistema();
    aviso("Despacho automático",`${r.ok} pedido(s) enviados a los camiones.`+(r.motivos&&(r.motivos.apoyo||r.motivos.cercano||r.motivos.sobretope)?` ${(r.motivos.apoyo||0)+(r.motivos.cercano||0)} se repartieron a otro camión por el tope de ${topeCamion()}.`+(r.motivos.sobretope?` ${r.motivos.sobretope} quedaron sobre el tope: todos estaban llenos.`:""):"")+(r.sinComuna.length?` ${r.sinComuna.length} sin sector.`:"")+(r.sinMovil.length?` ${r.sinMovil.length} sin camión activo.`:""))}}
function enlazarCalles(){
  if(!CALLES){cargarCalles().then(()=>{if(mod==="sectorizar")pintarSistema()}).catch(()=>{const c=$("#sz-carga");if(c)c.innerHTML='<b>No se pudo cargar el mapa de calles.</b><span class="nota" style="margin:0">Falta el archivo calles-rm.json junto a la página. Revise que esté subido al hosting.</span>'});return}
  mapaCalles();
  $$("[data-szmodo]").forEach(b=>b.onclick=()=>{szModo=b.dataset.szmodo;szDib=[];if(szModo!=="editar")szSel=null;pintarSistema()});
  const ds=$("#sz-dsec");if(ds)ds.onchange=()=>{szDibSec=+ds.value;pintarSistema()};const dn=$("#sz-dnom");if(dn)dn.oninput=()=>{szDibNom=dn.value};
  const fin=$("#sz-dfin");if(fin)fin.onclick=terminarZona;
  const un=$("#sz-dundo");if(un)un.onclick=()=>{szDib.pop();pintarSistema()};
  const ca=$("#sz-dcan");if(ca)ca.onclick=()=>{szDib=[];szModo="ver";pintarSistema()};
  const z=(D.zonas||[]).find(x=>x.id===szSel);
  const eok=$("#sz-eok");if(eok)eok.onclick=()=>{z.nombre=$("#sz-enom").value.trim()||z.nombre;z.sector=+$("#sz-esec").value;log("pedidos","Zona modificada",`${z.nombre} → ${nomSector(z.sector)}`,{local:suc});guardar();pintarSistema()};
  const edel=$("#sz-edel");if(edel)edel.onclick=()=>confirmar(edel,()=>{D.zonas=D.zonas.filter(x=>x!==z);log("pedidos","Zona eliminada",z.nombre||"",{local:suc});szSel=null;guardar();pintarSistema()});
  const uc=$("#sz-ucan");if(uc)uc.onclick=()=>{szModo="ver";szUbicar=null;pintarSistema()};
  $$("[data-zver]").forEach(b=>b.onclick=()=>{szSel=+b.dataset.zver;szModo="editar";const zz=D.zonas.find(x=>x.id===szSel),pw=zz.pts.map(q=>aMundo(q[0],q[1]));
    MV.cx=(Math.min(...pw.map(q=>q[0]))+Math.max(...pw.map(q=>q[0])))/2;MV.cy=(Math.min(...pw.map(q=>q[1]))+Math.max(...pw.map(q=>q[1])))/2;
    MV.z=Math.min(4,.85*Math.min(($("#sz-lienzo").clientWidth)/(Math.max(...pw.map(q=>q[0]))-Math.min(...pw.map(q=>q[0]))+1),($("#sz-lienzo").clientHeight)/(Math.max(...pw.map(q=>q[1]))-Math.min(...pw.map(q=>q[1]))+1)));pintarSistema()});
  $$("[data-pubic]").forEach(b=>b.onclick=()=>{szUbicar=+b.dataset.pubic;szModo="ubicar";const g=ubicar(D.pedidos.find(p=>p.id===szUbicar));if(g){const [x,y]=aMundo(g.lon,g.lat);MV.cx=x;MV.cy=y;MV.z=Math.max(MV.z,.9)}pintarSistema();setTimeout(()=>{const l=$("#sz-lienzo");if(l)l.scrollIntoView({block:"center"})},80)});
  $$("[data-pver]").forEach(b=>b.onclick=()=>{const g=ubicar(D.pedidos.find(p=>p.id===+b.dataset.pver));if(g&&MV.enfocarPedido){MV.enfocarPedido(g);setTimeout(()=>{const l=$("#sz-lienzo");if(l)l.scrollIntoView({block:"center"})},80)}});
  $$("[data-rdel]").forEach(b=>b.onclick=()=>{const r=D.reglasCalle.splice(+b.dataset.rdel,1)[0];log("pedidos","Regla de calle quitada",`${r.calle} ${r.desde||""}-${r.hasta||""}`,{local:suc});guardar();pintarSistema()});
  $("#rg-calle").onfocus=()=>{const dl=$("#sz-lcalles");if(!dl.options.length)dl.innerHTML=CALLES.nombres.map(n=>`<option value="${esc(n)}">`).join("")};
  $("#f-regla").onsubmit=e=>{e.preventDefault();const r={calle:$("#rg-calle").value.trim(),comuna:$("#rg-com").value,desde:+$("#rg-desde").value||0,hasta:+$("#rg-hasta").value||0,par:$("#rg-par").value,sector:+$("#rg-sec").value};
    if(r.desde&&r.hasta&&r.hasta<r.desde)return aviso("Revise los números","«Hasta» debe ser mayor que «Desde».");
    D.reglasCalle=D.reglasCalle||[];D.reglasCalle.push(r);log("pedidos","Regla de calle",`${r.calle} ${r.desde||"inicio"} a ${r.hasta||"final"} (${r.par}) → ${nomSector(r.sector)}`,{local:suc});guardar();pintarSistema()};
}
V.sectorizar=()=>szTab==="calles"?cabeza("Sectorizar pedidos")+barraPreset()+tabsSz()+vistaCalles():vistaSector().replace('<p class="nota" style="margin:-12px 0 18px">',barraPreset()+tabsSz()+'<p class="nota" style="margin:0 0 18px">');
L.sectorizar=()=>{enlazarComunSz();if(szTab==="calles")enlazarCalles();else enlazarSector()};

/* ===================== ASISTENTE DE DIRECCIÓN (Pedidos) ===================== */
let asisDir=null;
function paresCalles(){if(CALLES.pares)return CALLES.pares;const m=new Map();CALLES.calles.forEach(c=>{if(c.cm<0)return;const key=c.k+"|"+c.cm;if(!m.has(key))m.set(key,{n:c.n,cm:c.cm,k:c.k})});return CALLES.pares=[...m.values()]}
function sugerirCalles(q,cmPref){const k=normCalle(q);if(k.length<2)return [];const tk=k.split(" "),res=[];
  for(const p of paresCalles()){let sc=0;const ws=p.k.split(" ");
    if(p.k.startsWith(k))sc=4;else if(ws.some(w=>w.startsWith(tk[0]))&&tk.every(t=>ws.some(w=>w.startsWith(t))))sc=3;else if(tk.every(t=>p.k.includes(t)))sc=1;
    if(!sc)continue;if(p.cm===cmPref)sc+=2;res.push([sc,p])}
  return res.sort((a,b)=>b[0]-a[0]||a[1].n.length-b[1].n.length||a[1].n.localeCompare(b[1].n)).slice(0,8).map(x=>x[1])}
function revisarDir(calle,num,comuna,geoManual){calle=(calle||"").trim();if(!calle)return null;
  const n=parseInt(String(num||"").replace(/\D/g,""),10)||0,cmI=FOCO_RM.findIndex(x=>sinTilde(x)===sinTilde(comuna)),cmKey=comunaDe({comuna,dir:""});
  const act=chOrden().filter(c=>c.local===suc&&c.activo!==false),camion=sec=>{const r=elegirCamion(sec,null);return r?` · camión <b>${esc(r.c.nombre)}</b>${r.motivo!=="sector"?` <span class="nota" style="margin:0">(${MOTIVO_CAM[r.motivo].toLowerCase()})</span>`:""}`:" · sin camión"};
  const r={calle:null,num:null,zona:null,geo:null,tramo:null};
  if(!CALLES)return {calle:{st:"av",txt:"Cargando el mapa de calles…"},num:null,zona:null};
  const k0=normCalle(calle),dondeEsta=k=>[...new Set((CALLES.porCalle[k]||[]).map(i=>CALLES.calles[i].cm).filter(c=>c>=0))];
  if(cmI<0){const sec=cmKey?sectorDeComuna(cmKey):null,otras=dondeEsta(k0);
    if(!comuna.trim()){r.calle=otras.length?{st:"av",txt:"Falta la comuna",com:FOCO_RM[otras[0]]}:{st:"mal",txt:"Falta la comuna"};return r}
    r.calle={st:"av",txt:`No tenemos el mapa de calles de <b>${esc(comuna)}</b>; se asigna por comuna`};if(otras.length&&!cmKey)r.calle.com=FOCO_RM[otras[0]];
    r.zona=sec!=null?{st:"ok",txt:`${esc(cmKey)} la atiende el sector <b>${esc(nomSector(sec))}</b>${camion(sec)}`}:{st:"mal",txt:`${esc(cmKey||comuna)} está fuera de las zonas de reparto`};return r}
  let k=null,nombre=null;
  if(dondeEsta(k0).includes(cmI)){k=k0;nombre=CALLES.calles[CALLES.porCalle[k0].find(i=>CALLES.calles[i].cm===cmI)].n;r.calle={st:"ok",txt:`<b>${esc(nombre)}</b> existe en ${esc(FOCO_RM[cmI])}`}}
  else{const f=buscarCalle(calle,cmI),fEn=f&&dondeEsta(f).includes(cmI);
    if(fEn){k=f;nombre=CALLES.calles[CALLES.porCalle[f].find(i=>CALLES.calles[i].cm===cmI)].n;r.calle={st:"av",txt:`¿Quiso decir <b>${esc(nombre)}</b>?`,sug:nombre}}
    else{const otras=dondeEsta(k0).concat(f?dondeEsta(f):[]);
      r.calle=otras.length?{st:"av",txt:`Esta calle no está en ${esc(FOCO_RM[cmI])}; sí está en <b>${esc(FOCO_RM[otras[0]])}</b>`,com:FOCO_RM[otras[0]]}:{st:"mal",txt:`No encontramos «${esc(calle)}» en ${esc(FOCO_RM[cmI])}`}}}
  if(k){r.tramo=k;const ds=(CALLES.dirs[k]||[]).filter(d=>d.cm===cmI),rg=ds.length?[ds[0].n,ds[ds.length-1].n]:null,g=ubicar({calle:nombre,num:n,comuna:FOCO_RM[cmI],dir:""});
    if(!n)r.num={st:"av",txt:"Falta el número de la casa"+(rg?` (esta calle va del ${rg[0]} al ${rg[1]})`:"")};
    else if(rg&&(n<rg[0]-60||n>rg[1]+60))r.num={st:"av",txt:`El N° ${n} parece fuera de la calle: en ${esc(FOCO_RM[cmI])} va del ${rg[0]} al ${rg[1]}`};
    else if(g&&g.conf==="exacta")r.num={st:"ok",txt:`N° ${n} encontrado en el mapa`};
    else if(g&&g.conf==="aprox")r.num={st:"ok",txt:`N° ${n} ubicado entre las casas conocidas`};
    else r.num={st:"av",txt:`No tenemos el N° ${n} registrado; revise el punto en el mapa`};
    r.geo=geoManual?{lon:geoManual[0],lat:geoManual[1]}:g}
  else if(geoManual)r.geo={lon:geoManual[0],lat:geoManual[1]};
  if(r.geo){const z=zonaDe(r.geo.lon,r.geo.lat),rg=reglaDe({calle:nombre||calle,num:n,comuna:FOCO_RM[cmI],dir:""});
    if(rg)r.zona={st:"ok",txt:`Regla de calle: sector <b>${esc(nomSector(rg.sector))}</b>${camion(rg.sector)}`};
    else if(z)r.zona={st:"ok",txt:`Dentro de <b>${esc(z.nombre||"zona")}</b> · sector <b>${esc(nomSector(z.sector))}</b>${camion(z.sector)}`};
    else{const sec=sectorDeComuna(FOCO_RM[cmI]);r.zona=sec!=null?{st:"av",txt:`Fuera de las zonas dibujadas; se usará el sector de la comuna (<b>${esc(nomSector(sec))}</b>)`}:{st:"mal",txt:"El punto queda fuera de las zonas donde repartimos"}}}
  else if(!r.zona){const sec=sectorDeComuna(FOCO_RM[cmI]);r.zona=sec!=null?{st:"av",txt:`Sin punto exacto; se usará el sector de la comuna (<b>${esc(nomSector(sec))}</b>)`}:{st:"mal",txt:"No se pudo ubicar y la comuna no tiene sector"}}
  return r}
function miniMapa(cv,lon,lat,kHi,alClic){const C=CALLES,W=cv.clientWidth,H=cv.clientHeight,dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);const [cx,cy]=aMundo(lon,lat),z=.75,aP=(x,y)=>[(x-cx)*z+W/2,(y-cy)*z+H/2];
  const vx0=cx-W/2/z-40,vx1=cx+W/2/z+40,vy0=cy-H/2/z-40,vy1=cy+H/2/z+40,vis=b=>b[2]>=vx0&&b[0]<=vx1&&b[3]>=vy0&&b[1]<=vy1;
  ctx.fillStyle="#EEF2F7";ctx.fillRect(0,0,W,H);
  (D.zonas||[]).forEach(zn=>{const pw=zn.pts.map(q=>aP(...aMundo(q[0],q[1])));ctx.beginPath();pw.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.globalAlpha=.18;ctx.fillStyle=colSector(zn.sector);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=colSector(zn.sector);ctx.lineWidth=2;ctx.stroke()});
  const vs=C.calles.filter(c=>vis(c.bb)),ANCHO=[0,22,18,14,11,7,5];ctx.lineCap="round";ctx.lineJoin="round";
  for(const pas of [0,1])for(let cl=6;cl>=1;cl--){ctx.beginPath();let n=0;vs.forEach(c=>{if(c.cl!==cl)return;n++;c.pts.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)})});if(!n)continue;
    const w=Math.max(1.2,ANCHO[cl]*z);ctx.lineWidth=pas?w:w+1.5;ctx.strokeStyle=pas?(cl<=2?"#FCE7A6":"#fff"):(cl<=2?"#D9B44A":"#C3CCD8");ctx.stroke()}
  if(kHi){ctx.beginPath();vs.forEach(c=>{if(c.k!==kHi)return;c.pts.forEach(([x,y],i)=>{const [a,b]=aP(x,y);i?ctx.lineTo(a,b):ctx.moveTo(a,b)})});ctx.strokeStyle="rgba(47,111,224,.55)";ctx.lineWidth=7;ctx.stroke()}
  ctx.font='600 11px "Source Sans 3",system-ui,sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";const oc=[],vistos=new Set();
  vs.sort((a,b)=>(b.k===kHi)-(a.k===kHi)||a.cl-b.cl).forEach(c=>{if(vistos.has(c.n))return;let best=null,bl=0;for(let i=1;i<c.pts.length;i++){const [a,b]=aP(...c.pts[i-1]),[d,e]=aP(...c.pts[i]),l=Math.hypot(d-a,e-b);if(l>bl&&a>0&&a<W&&b>0&&b<H){bl=l;best=[a,b,d,e]}}
    if(!best)return;const tw=ctx.measureText(c.n).width;if(bl<tw+10)return;const mx=(best[0]+best[2])/2,my=(best[1]+best[3])/2;if(oc.some(o=>Math.abs(o[0]-mx)<(o[2]+tw)/2+4&&Math.abs(o[1]-my)<15))return;
    oc.push([mx,my,tw]);vistos.add(c.n);let an=Math.atan2(best[3]-best[1],best[2]-best[0]);if(an>Math.PI/2)an-=Math.PI;if(an<-Math.PI/2)an+=Math.PI;
    ctx.save();ctx.translate(mx,my);ctx.rotate(an);ctx.lineWidth=3;ctx.strokeStyle="#fff";ctx.strokeText(c.n,0,0);ctx.fillStyle=c.k===kHi?"#0A3F94":"#3A4659";ctx.fillText(c.n,0,0);ctx.restore()});
  const a=W/2,b=H/2;ctx.beginPath();ctx.arc(a,b-16,10,Math.PI*.85,Math.PI*.15);ctx.lineTo(a,b);ctx.closePath();ctx.fillStyle="#D62E2E";ctx.fill();ctx.lineWidth=2;ctx.strokeStyle="#fff";ctx.stroke();ctx.beginPath();ctx.arc(a,b-16,3.5,0,7);ctx.fillStyle="#fff";ctx.fill();
  cv.onclick=e=>{const rc=cv.getBoundingClientRect();alClic(aLonLat((e.clientX-rc.left-W/2)/z+cx,(e.clientY-rc.top-H/2)/z+cy))}}

/* ===================== DISTRIBUCIONES (presets): Todos los días / Domingo ===================== */
var PRESETS={diario:"Todos los días",domingo:"Domingo"},szPreset=null;
function presetDelDia(){const h=D.presetHoy||"auto";if(h!=="auto"&&PRESETS[h])return h;return new Date().getDay()===0?"domingo":"diario"}
function capturarPreset(){return {sectores:D.sectores||[],zonas:D.zonas,reglasCalle:D.reglasCalle||[],asign:Object.fromEntries(D.choferes.map(c=>[c.id,c.sector??null])),apoyo:Object.fromEntries(D.choferes.map(c=>[c.id,c.apoyo||[]])),tope:D.topeCamion||3,cerca:D.radioCerca??1}}
function iniciarPresets(){if(D.presets&&D.presets.diario&&D.presets.domingo)return;D.presets={diario:capturarPreset(),domingo:{nuevo:true}};D.presetCargado="diario"}
function usarPreset(k){iniciarPresets();if(!D.presets[k])return;const cur=D.presetCargado||"diario";if(cur===k)return;
  D.presets[cur]=capturarPreset();if(D.presets[k].nuevo){D.presets[k]=structuredClone(D.presets[cur])}const p=D.presets[k];D.sectores=p.sectores||[];D.zonas=p.zonas;D.reglasCalle=p.reglasCalle||[];
  D.choferes.forEach(c=>{c.sector=p.asign&&c.id in p.asign?p.asign[c.id]:null;c.apoyo=p.apoyo&&p.apoyo[c.id]?p.apoyo[c.id]:[]});D.topeCamion=p.tope||3;D.presetCargado=k}
function conPreset(k,fn){const antes=D.presetCargado||"diario";usarPreset(k);try{return fn()}finally{usarPreset(antes)}}
function barraPreset(){const k=D.presetCargado||"diario",hoy=presetDelDia(),h=D.presetHoy||"auto";
  const cuenta=id=>{const p=id===k?capturarPreset():D.presets[id];if(p.nuevo)return "Copia de Todos los días";return `${(p.zonas||[]).length} zonas · ${Object.values(p.asign||{}).filter(v=>v!=null).length} camiones`};
  return `<div class="preset-bar"><div class="preset-sel" role="group" aria-label="Distribución que está editando">${Object.entries(PRESETS).map(([id,t])=>`<button type="button" class="preset ${k===id?"on":""}" data-preset="${id}" aria-pressed="${k===id}"><b>${t}</b><span>${cuenta(id)}</span>${id===hoy?'<em>En uso hoy</em>':""}</button>`).join("")}</div>
    <div class="preset-info"><label>Distribución que se usa hoy<select id="pr-hoy"><option value="auto" ${h==="auto"?"selected":""}>Automática (domingo usa «Domingo»)</option><option value="diario" ${h==="diario"?"selected":""}>Todos los días</option><option value="domingo" ${h==="domingo"?"selected":""}>Domingo (sirve para feriados)</option></select></label>
      <button type="button" class="btn chico linea" id="pr-copiar">Copiar desde «${PRESETS[k==="domingo"?"diario":"domingo"]}»</button></div>
    <p class="nota" style="margin:0">Está editando <b>${PRESETS[k]}</b>. Cada distribución tiene sus propias zonas, reglas de calle, sectores por comuna y camiones. El despacho siempre usa la distribución de hoy.</p></div>`}

/* ===================== REPARTO EQUILIBRADO: tope por camión + camiones de apoyo ===================== */
const topeCamion=()=>Math.max(1,Math.min(30,+(D.topeCamion||3)));
/* km para juntar pedidos cercanos en el mismo camión (0 = no se juntan) */
const radioCerca=()=>Math.max(0,Math.min(5,+(D.radioCerca??1)));
const cargaCam=id=>D.pedidos.filter(p=>p.chofer===id&&p.estado==="ruta").length;
const MOTIVO_CAM={juntar:"Cerca de un pedido que ya lleva",sector:"Camión del sector",apoyo:"Apoyo: el del sector llegó al tope",cercano:"Sector vecino con espacio",sobretope:"Todos llenos: al que tiene menos"};
function centroSector(id){const pts=[];const sx=(D.sectores||[]).find(x=>x.id===id);
  if(sx)sx.comunas.forEach(c=>{const g=GEO_RM[c];if(g)pts.push([g[1],g[0]])});
  (D.zonas||[]).filter(z=>z.sector===id).forEach(z=>{const n=z.pts.length;if(n)pts.push([z.pts.reduce((a,q)=>a+q[0],0)/n,z.pts.reduce((a,q)=>a+q[1],0)/n])});
  return pts.length?[pts.reduce((a,q)=>a+q[0],0)/pts.length,pts.reduce((a,q)=>a+q[1],0)/pts.length]:null}
function puntoPedido(p,sec){if(p){const g=typeof ubicar==="function"?ubicar(p):null;if(g)return [g.lon,g.lat];const c=comunaDe(p);if(c&&GEO_RM[c])return [GEO_RM[c][1],GEO_RM[c][0]]}return sec!=null?centroSector(sec):null}
function elegirCamion(sec,p){
  const act=chOrden().filter(c=>c.activo!==false&&c.local===suc);if(!act.length)return null;
  const T=topeCamion(),menos=l=>l.slice().sort((a,b)=>cargaCam(a.id)-cargaCam(b.id)||a.nombre.localeCompare(b.nombre))[0],libres=l=>l.filter(c=>cargaCam(c.id)<T);
  {const R=radioCerca(),g=R>0&&p&&typeof ubicar==="function"?ubicar(p):null;
    if(g){const kmd=(a,b)=>Math.hypot((a[0]-b[0])*93,(a[1]-b[1])*111);let mejor=null;
      D.pedidos.filter(q=>q!==p&&q.estado==="ruta"&&q.chofer!=null&&(p.local==null||q.local===p.local)).forEach(q=>{const c=act.find(x=>x.id===q.chofer);if(!c)return;const h=ubicar(q);if(!h)return;
        const d=kmd([h.lon,h.lat],[g.lon,g.lat]);if(d<=R&&(!mejor||d<mejor.d))mejor={c,d,q}});
      // va al mismo camión aunque tenga hasta 1 pedido más que el tope: pasa justo por ahí
      if(mejor&&cargaCam(mejor.c.id)<=T)return {c:mejor.c,motivo:"juntar",junto:mejor.q.id,dist:mejor.d}}}
  const prin=sec==null?[]:act.filter(c=>c.sector===sec),apoyo=sec==null?[]:act.filter(c=>c.sector!==sec&&(c.apoyo||[]).includes(sec));
  let l=libres(prin);if(l.length)return {c:menos(l),motivo:"sector"};
  l=libres(apoyo);if(l.length)return {c:menos(l),motivo:"apoyo"};
  // sectores vecinos: camiones con espacio, el más cercano al pedido
  const o=puntoPedido(p,sec),km=(a,b)=>Math.hypot((a[0]-b[0])*93,(a[1]-b[1])*111);
  const otros=act.filter(c=>c.sector!=null&&c.sector!==sec&&!apoyo.includes(c));
  if(o){const cand=libres(otros).map(c=>{const z=centroSector(c.sector);return {c,d:z?km(z,o):1e9}}).sort((a,b)=>a.d-b.d||cargaCam(a.c.id)-cargaCam(b.c.id));
    if(cand.length&&(!prin.length&&!apoyo.length||cand[0].d<=12))return {c:cand[0].c,motivo:"cercano"}}
  const todos=prin.length||apoyo.length?[...prin,...apoyo]:act.filter(c=>c.sector!=null).length?act.filter(c=>c.sector!=null):act;
  return {c:menos(todos),motivo:prin.length||apoyo.length?"sobretope":"cercano"}}

/* ===================== VOLVER A LA PANTALLA ANTERIOR ===================== */
let pilaNav=[],ultNav=null,volviendo=false;
const navEstado=()=>({mod,cfgTab,cuadTab,infTab,infRep,szTab,cuadSel});
function registrarNav(){const e=navEstado(),k=JSON.stringify(e);
  if(ultNav&&ultNav.k!==k&&!volviendo){pilaNav.push(ultNav.e);if(pilaNav.length>40)pilaNav.shift()}
  ultNav={k,e};volviendo=false}
function volverAtras(){
  const e=pilaNav.pop();if(!e){ir(yo&&yo.rol==="chofer"?"chofer":"menu");return}
  volviendo=true;mod=e.mod;cfgTab=e.cfgTab;cuadTab=e.cuadTab;infTab=e.infTab;infRep=e.infRep;szTab=e.szTab;cuadSel=e.cuadSel;
  guardarSesion();pintarSistema();window.scrollTo(0,0)}
document.addEventListener("keydown",e=>{if(e.altKey&&e.key==="ArrowLeft"&&yo&&location.hash==="#panel"){e.preventDefault();volverAtras()}});

/* ===================== PESTAÑAS DE CONFIGURACIONES (Sectorizar vive aquí) ===================== */
const cfgTabsTodas=()=>[...(esAdmin()?[["precioBase","Precio Base"]]:[]),["precios","Precio Domicilio"],["preciosMay","Precios Mayoristas"],...(esAdmin()?[["preciosLocal","Precio Local"]]:[]),["envases","Precio Envases"],["clientesMay","Clientes"],["comVale","Comisión Vales"],["histPrecios","Historial de Precios"],["histCambios","Historial de Cambios"],["usuarios","Usuarios"],["choferes","Choferes"],["sectorizar","Sectorizar"],...(esAdmin()?[]:[["sucursal","Sucursal"]]),["general","General"],...(puede("respaldos")?[["respaldos","Respaldos y reset"],...(esAdmin()?[["apariencia","Apariencia"]]:[])]:[])];
const CFG_MAY_TABS=["clientesMay","preciosMay","comVale"];
const cfgTabsLista=()=>(!yo?[]:esAdmin()?cfgTabsTodas():cfgTabsTodas().filter(([k])=>CFG_PERM[k]&&tieneExtra(CFG_PERM[k]))).filter(([k])=>!(D.precios&&D.precios.sinMayorista&&CFG_MAY_TABS.includes(k)));
const cfgTabsHtml=sel=>`<!--CFGTABS-->`;
function enlazarCfgTabs(){$$("[data-cfgtab]").forEach(b=>b.onclick=()=>{const k=b.dataset.cfgtab;cfgCh=null;
  if(k==="sectorizar"){if(mod!=="sectorizar")ir("sectorizar");return}
  cfgTab=k;if(mod!=="config")ir("config");else pintarSistema()})}
{const vs=V.sectorizar,ls=L.sectorizar;
  V.sectorizar=()=>vs().replace(cabeza("Sectorizar pedidos"),cabeza("Configuraciones")+cfgTabsHtml("sectorizar"));
  L.sectorizar=()=>{enlazarCfgTabs();ls()}}


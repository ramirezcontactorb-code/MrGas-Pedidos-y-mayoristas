/* MR Gas · Panel General · 02-iconos */
/* ===================== ÍCONOS ===================== */
const IC={
  externo:'<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  sectorizar:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  pedidos:'<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/><path d="M19 19c0 2-2 3-5 3"/>',
  ruta:'<rect x="2" y="6" width="12" height="10" rx="1"/><path d="M14 9h4l3 4v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  informes:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6M20 16V5"/>',
  cuadratura:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="m9 13 2 2 4-4"/>',
  compras:'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  ventachofer:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  factura:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  choferes:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5"/><rect x="15" y="9" width="6" height="5" rx="1"/><path d="M16.5 9V7.5a1.5 1.5 0 0 1 3 0V9"/>',
  chofer:'<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  bodega:'<rect x="7" y="6" width="10" height="15" rx="4"/><path d="M10 6V3h4v3M7 13h10"/>',
  caja:'<rect x="3" y="11" width="18" height="9" rx="1"/><rect x="6" y="4" width="12" height="7"/><path d="M7 15h2M11 15h2M15 15h2"/>',
  config:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  admin:'<path d="M4 21V5l8-3v19M12 9h8v12M2 21h20"/><path d="M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
  petroleo:'<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 8h5"/><path d="M15 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  manual:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h8M8 11h6"/>',
  tabla:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
  grafico:'<path d="M4 20h16"/><rect x="5" y="12" width="3.5" height="8" rx="1"/><rect x="10.25" y="8" width="3.5" height="12" rx="1"/><rect x="15.5" y="4" width="3.5" height="16" rx="1"/>',
  respaldos:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  empresa:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 13h18"/>',
  usuarios:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><path d="M17 4a3.5 3.5 0 0 1 0 7M22 20c0-3-1.5-5-4-5.7"/>',
  clave:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  precios:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  sucursal:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  salir:'<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'
};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

const A="admin",E="encargado",C="chofer";
const MODULOS=[
  {id:"pedidos",t:"Pedidos de Gas",s:"Ingreso y estado",r:[A,E]},
  {id:"ruta",t:"Asigna Ruta",s:"Pedidos a choferes",r:[A,E]},
  {id:"choferes",t:"Choferes",s:"Acceso a la app y clave del día",r:[A,E]},
  {id:"sectorizar",t:"Sectorizar",s:"Mapa y despacho automático",r:[A,E]},
  {id:"informes",t:"Informes",s:"Pedidos y rendiciones",r:[A,E]},
  {id:"petroleo",t:"Petróleo",s:"Combustible de móviles",r:[A,E]},
  {id:"cuadratura",t:"Cargas y liquidaciones",s:"Carga de móviles, rendiciones y liquidaciones",r:[A,E]},
  {id:"ventachofer",t:"Venta Choferes",s:"Venta del chofer y rendición del día",r:[A,E]},
  {id:"mayorista",t:"Venta Mayorista",s:"Ventas a clientes y su cuenta",r:[A,E]},
  {id:"compras",t:"Compras y Devoluciones",s:"Entradas y salidas",r:[A,E]},
  {id:"facturas",t:"Facturas",s:"Facturas pedidas por clientes",r:[A,E]},
  {id:"chofer",t:"Pedidos Chofer",s:"Entregas en ruta",r:[A,E,C]},
  {id:"bodega",t:"Control de Bodega",s:"Stock, móviles y recuento",r:[A,E]},
  {id:"config",t:"Configuraciones",s:"Choferes, sectores, precios y usuarios",r:[A]},

];
const ACCIONES=[
  {id:"manual",t:"Manual<br>Usuario",r:[A,E,C]},
  {id:"empresa",t:"Datos<br>Empresa",r:[A]},
  {id:"clave",t:"Cambiar<br>Contraseña",r:[A,E,C]},
  {id:"sucursal",t:"Cambio de<br>Sucursal",r:[A]},
  {id:"salir",t:"Salir del<br>Sistema",r:[A,E,C]}
];
/* La lista de permisos viene de api/permisos.json (la misma que usa el servidor) */
const PERMISOS={"modulos":["pedidos","ruta","choferes","sectorizar","mayorista","ventachofer","cuadratura","bodega","compras","facturas","informes"],"acciones":[["Pedidos",[["pedidos.anular","Anular pedidos"]]],["Venta Choferes",[["vc.anular","Anular ventas del chofer"],["vc.descuento","Dar descuentos"],["rend.historico","Editar rendiciones de días pasados"]]],["Venta Mayorista",[["may.anular","Anular ventas mayoristas"],["may.descuento","Dar descuentos"]]],["Control de Bodega",[["bodega.editar","Editar stock de bodega"]]],["Configuraciones",[["cfg.precios","Precio Domicilio"],["cfg.preciosMay","Precios Mayoristas"],["cfg.envases","Precio Envases"],["cfg.comVale","Comisión Vales"],["cfg.clientes","Clientes mayoristas"],["cfg.choferes","Choferes y móviles"],["cfg.historial","Ver historial de precios y cambios"]]]],"apps":[["app.repartidores","App repartidores (oficina)"],["app.local","Venta Local"]],"antes":{"cfg.preciosMay":"cfg.precios","cfg.envases":"cfg.precios","cfg.comVale":"cfg.precios","cfg.historial":"cfg.precios","vc.anular":"ventachofer","vc.descuento":"ventachofer","may.anular":"mayorista","may.descuento":"mayorista","bodega.editar":"bodega"},"antiguos":["pedidos.anular","vc.anular","vc.descuento","may.anular","may.descuento","bodega.editar"],"colecciones":{"rendiciones":["cuadratura","ventachofer","mayorista"],"cargas":["cuadratura","ventachofer"],"cargasDist":["cuadratura","mayorista"],"anticipos":["cuadratura","ventachofer"],"peonetas":["cuadratura","ventachofer"],"ventas":["caja","cuadratura"],"gastos":["caja","cuadratura"],"ventasAnuladas":["caja","cuadratura"],"movimientos":["compras","bodega"],"recuentos":["bodega"],"pedidos":["pedidos","ruta","chofer","app.repartidores","facturas"],"facturas":["facturas","pedidos"],"empresas":["facturas","pedidos"],"reparto":["mayorista","ruta","pedidos","app.repartidores"],"camiones":["mayorista","ruta"],"clientes":["pedidos","ruta"],"petroleo":["petroleo","cuadratura"]},"precios":["precios","preciosMayor","preciosEnvase","preciosConvenio","listas","historico","listasMay","comisionVale","descQR"],"preciosNecesita":{"preciosMayor":["cfg.preciosMay"],"listasMay":["cfg.preciosMay"],"preciosEnvase":["cfg.envases"],"comisionVale":["cfg.comVale"],"historico":["cfg.precios","cfg.preciosMay","cfg.envases","cfg.comVale"],"*":["cfg.precios"]},"pantallasConfig":{"choferes":"cfg.choferes","clientesMay":"cfg.clientes","precios":"cfg.precios","envases":"cfg.envases","preciosMay":"cfg.preciosMay","comVale":"cfg.comVale","descQR":"cfg.precios","histPrecios":"cfg.historial","histCambios":"cfg.historial"},"plantillas":[["Telefonista",["pedidos","ruta:ver","app.repartidores"]],["Despachador",["pedidos","pedidos.anular","ruta","choferes","sectorizar","informes:ver","app.repartidores"]],["Cajero / cuadratura",["pedidos:ver","ruta:ver","ventachofer","cuadratura","mayorista","informes","vc.anular","vc.descuento","may.anular","may.descuento"]],["Vendedor mayorista",["mayorista","informes:ver","cfg.clientes","may.descuento"]],["Bodeguero",["ruta:ver","bodega","compras","bodega.editar"]],["Supervisor",["pedidos","pedidos.anular","ruta","choferes","sectorizar","mayorista","ventachofer","cuadratura","bodega","compras","informes","cfg.choferes","cfg.clientes","app.repartidores","vc.anular","vc.descuento","may.anular","may.descuento","bodega.editar","cfg.historial"]]]};
const MOD_PERM=PERMISOS.modulos;
/* Permisos detallados (versión 2, marcada con "_v2"):
   "pedidos" = ver y trabajar · "pedidos:ver" = solo ver · acciones y apps aparte */
const PERM_GRUPOS=PERMISOS.acciones;
const PERM_EXTRA=PERM_GRUPOS.flatMap(g=>g[1]);
/* permisos nuevos (versión 3): a quien no los tiene marcados se le respeta lo que podía hacer antes */
const PERM_ANTES=PERMISOS.antes;
function permV3(p,c){if(!Array.isArray(p))return true;if(p.includes(c))return true;if(p.includes("_v3"))return false;return !!PERM_ANTES[c]&&p.includes(PERM_ANTES[c])}
const PERM_APPS=PERMISOS.apps;
const CFG_PERM=PERMISOS.pantallasConfig;
const ESTADO_PRECIOS=PERMISOS.precios;
const PLANTILLAS=PERMISOS.plantillas;
const esV2=p=>Array.isArray(p)&&p.includes("_v2");
// acciones especiales y apps: los usuarios antiguos (sin "_v2") conservan lo que podían hacer antes
const tieneExtra=c=>{if(!yo)return false;if(esAdmin())return true;if(yo.rol!=="encargado")return false;
  if(!esV2(yo.permisos))return c.startsWith("app.")||PERMISOS.antiguos.includes(c);return permV3(yo.permisos,c)};
const soloVer=id=>!!yo&&yo.rol==="encargado"&&Array.isArray(yo.permisos)&&yo.permisos.includes(id+":ver")&&!yo.permisos.includes(id);
const misSucs=()=>!yo?[]:esAdmin()?D.locales.map(l=>l.id):((yo.sucursales&&yo.sucursales.length)?yo.sucursales:[yo.local]).filter(x=>x!=null);
var infPor=null,respOk=false;
const puede=id=>{
  if(id==="mayorista"&&D.precios&&D.precios.sinMayorista)return false; // desactivada en Configuraciones
  if(id==="facturas"&&D.precios&&D.precios.sinFacturas)return false; // desactivada en Configuraciones
  if(id==="informes"&&infPor&&yo&&yo.rol==="encargado")return true;
  if(id==="sucursal")return D.locales.length>1&&(esAdmin()||misSucs().length>1);
  if(id==="sectorizar"&&(!yo||yo.rol!=="encargado"||!esV2(yo.permisos)))return !!yo&&esAdmin();
  if(id==="config")return !!yo&&(esAdmin()||cfgTabsLista().length>0);
  if(id==="ventachofer"&&yo&&yo.rol==="encargado"&&Array.isArray(yo.permisos)&&!esV2(yo.permisos))return yo.permisos.includes("cuadratura");
  if(id==="cuadratura"&&yo&&yo.rol==="encargado"&&Array.isArray(yo.permisos)&&(yo.permisos.includes("ventachofer")||yo.permisos.includes("mayorista")))return true;
  if(id==="precios"||id==="usuarios"||id==="admin")return esAdmin();
  if(id==="respaldos")return esAdmin()&&(yo.permisos==null||(Array.isArray(yo.permisos)&&yo.permisos.includes("respaldos")));
  if(id==="caja"||id==="petroleo")return false; // desactivados (los datos antiguos se conservan)
  if(id==="chofer")return !!yo&&yo.rol==="chofer"; // solo la pantalla del repartidor
  const m=[...MODULOS,...ACCIONES].find(x=>x.id===id);if(!m)return true;if(!m.r.includes(yo.rol))return false;
  if(yo.rol==="encargado"&&Array.isArray(yo.permisos)&&MOD_PERM.includes(id))return yo.permisos.includes(id)||yo.permisos.includes(id+":ver");
  return true};
function camposAcceso(u){
  const sucs=u?(u.sucursales&&u.sucursales.length?u.sucursales:(u.local?[u.local]:[])):[suc];
  const p=u&&Array.isArray(u.permisos)?u.permisos:null,v2=esV2(p);
  const nivel=id=>!p?(u&&id!=="sectorizar"?"usar":""):p.includes(id)?"usar":p.includes(id+":ver")?"ver":"";
  const extra=c=>p?(v2?permV3(p,c):(c.startsWith("app.")||PERMISOS.antiguos.includes(c))):!!u&&(c.startsWith("app.")||PERMISOS.antiguos.includes(c));
  const T=id=>id==="informes"?"Informes":(MODULOS.find(m=>m.id===id)||{}).t;
  const radio=(id,v,t)=>`<label class="pm-op"><input type="radio" name="pm-${id}" value="${v}" ${nivel(id)===v?"checked":""}><span>${t}</span></label>`;
  return `<fieldset class="acceso" id="us-acceso"><legend>Sucursales a las que puede entrar</legend><div class="checks-grid">${D.locales.map(l=>`<label class="radio"><input type="checkbox" name="us-suc" value="${l.id}" ${sucs.includes(l.id)?"checked":""}>${esc(l.nombre)}</label>`).join("")}</div></fieldset>
  <fieldset class="acceso" id="us-permisos"><legend>Qué puede hacer</legend>
    <div class="pl-bar"><span>Plantilla rápida:</span>${PLANTILLAS.map(([t],i)=>`<button type="button" class="btn chico linea" data-plantilla="${i}">${t}</button>`).join("")}<button type="button" class="btn chico linea" data-plantilla="-1">Nada</button></div>
    <div class="perm-cols">
      <table class="perm-t"><thead><tr><th>Cuadro</th><th>No entra</th><th>Solo ver</th><th>Ver y trabajar</th></tr></thead><tbody>
      ${MOD_PERM.map(id=>`<tr><td>${T(id)}</td><td>${radio(id,"","No")}</td><td>${radio(id,"ver","Ver")}</td><td>${radio(id,"usar","Trabajar")}</td></tr>`).join("")}
      </tbody></table>
      <div class="perm-der">
        <p class="perm-tit">Acciones especiales</p>${PERM_GRUPOS.map(([g,l])=>`<p class="perm-g">${g}</p>${l.map(([c,t])=>`<label class="radio"><input type="checkbox" name="us-perm" value="${c}" ${extra(c)?"checked":""}>${t}</label>`).join("")}`).join("")}
      </div>
    </div>
    <p class="nota" style="margin:8px 0 0"><b>Solo ver</b>: entra y mira, pero no puede guardar cambios. Los administradores pueden todo.</p></fieldset>
  <fieldset class="acceso" id="us-apps"><legend>Apps a las que puede entrar</legend><div class="checks-grid">${PERM_APPS.map(([c,t])=>`<label class="radio"><input type="checkbox" name="us-app" value="${c}" ${(c==="app.local"?!!(p&&v2&&p.includes(c)):(p?(v2?p.includes(c):true):true))?"checked":""}>${t.replace(" (oficina)","")}</label>`).join("")}</div>
    <p class="nota" style="margin:6px 0 0">Encargado: trabaja en la app con los cuadros que tenga permitidos. Repartidor: ve sus entregas en la app. Si no la marca, no puede entrar.</p></fieldset>`+camposLocal(p);
}
const leerAcceso0=()=>({sucursales:[...$$('input[name="us-suc"]:checked')].map(i=>+i.value),
  permisos:["_v2","_v3",...MOD_PERM.map(id=>{const r=$(`input[name="pm-${id}"]:checked`);return !r||!r.value?null:r.value==="ver"?id+":ver":id}).filter(Boolean),...[...$$('input[name="us-perm"]:checked')].map(i=>i.value),...[...$$('input[name="us-app"]:checked')].map(i=>i.value)],
  apps:[...$$('input[name="us-app"]:checked')].map(i=>i.value)});
function resumenPerm(p){if(!Array.isArray(p))return "Todos los cuadros";
  const T=id=>id==="informes"?"Informes":(MODULOS.find(m=>m.id===id)||{}).t;
  const tr=MOD_PERM.filter(id=>p.includes(id)).map(T),vr=MOD_PERM.filter(id=>p.includes(id+":ver")&&!p.includes(id)).map(T);
  const ex=esV2(p)?PERM_GRUPOS.map(([g,l])=>{const s=l.filter(([c])=>permV3(p,c)).map(([,t])=>t);return s.length?g+" ("+s.join(", ").toLowerCase()+")":""}).filter(Boolean):[];
  return [tr.length?"Trabaja: "+tr.join(", "):"",vr.length?"Solo ve: "+vr.join(", "):"",ex.length?"Además: "+ex.join(", "):"",appsTxt(p),resumenLocal(p)].filter(Boolean).join("<br>")||"Sin cuadros"}
function appsTxt(p){const l=!esV2(p)?PERM_APPS:PERM_APPS.filter(([c])=>p.includes(c));return l.length?"Apps: "+l.map(([,t])=>t.replace(" (oficina)","")).join(", "):"Sin apps"}


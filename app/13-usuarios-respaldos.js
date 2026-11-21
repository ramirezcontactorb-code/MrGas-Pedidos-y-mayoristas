/* MR Gas · Panel General · 13-usuarios-respaldos */
/* ===== Usuarios: primero la lista (activos arriba), el formulario se abre con un botón; eliminar usuarios ===== */
let usForm=false,usN=null;
{const lc=L.config;L.config=function(){const r=lc.apply(this,arguments);
  try{if(cfgTab==="usuarios"){const f=$("#f-usr");if(f&&!document.getElementById("us-lista-h")){const tw=f.nextElementSibling;
      const n=tw?tw.querySelectorAll("tbody tr").length:0;if(usForm&&usN!=null&&n>usN)usForm=false;usN=n;const abierto=usForm||editUser!=null;
      if(tw&&tw.classList.contains("tabla-wrap")){f.parentNode.insertBefore(tw,f);tw.insertAdjacentHTML("beforebegin",`<div class="us-cab" id="us-lista-h"><h3>Usuarios creados</h3><button class="btn" type="button" id="us-abrir">${abierto?"− Cerrar formulario":"＋ Agregar usuario"}</button></div>`);tw.style.marginBottom="16px"}
      f.hidden=!abierto;
      $("#us-abrir").onclick=()=>{if(editUser!=null){editUser=null;usForm=false;pintarSistema();return}usForm=!usForm;pintarSistema();if(usForm)setTimeout(()=>{const i=$("#us-nombre");if(i){i.scrollIntoView({block:"center"});i.focus()}},50)};
      if(editUser!=null)setTimeout(()=>f.scrollIntoView({block:"start"}),30)}
    $$("[data-deluser]").forEach(b=>b.onclick=()=>confirmar(b,async()=>{const k=b.dataset.deluser;
      if(NUBE.activo){const u=(NUBE.usuarios||[]).find(x=>x.uid===k);
        try{await api("usuario_borrar",{uid:+k});log("sistema","Usuario eliminado",u?u.user:k);guardar();await cargarUsuarios();pintarSistema();aviso("Usuario eliminado",u?u.nombre:"")}
        catch(x){aviso("No se pudo eliminar",x.message||"")}}
      else{const u=D.usuarios.find(x=>x.user===k);D.usuarios=D.usuarios.filter(x=>x.user!==k);log("sistema","Usuario eliminado",k);guardar();pintarSistema();aviso("Usuario eliminado",u?u.nombre:"")}}))}}catch(e){console.error(e)}
  return r}}

/* ===== Respaldos y reset → Respaldo de la base de datos (descargar, automático en Hostinger, restaurar) ===== */
const kb=n=>n>1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";
async function pintarRespBD(){const z=document.getElementById("resp-bd");if(!z)return;
  let j;try{j=await api("respaldo_info",null,"&revisar=1")}catch(e){z.querySelector(".rb-cuerpo").innerHTML=`<p class="error">${esc(e.message)}</p>`;return}
  const ops=[["dia","Cada día"],["semana","Cada semana"],["nunca","Desactivado"]];
  z.querySelector(".rb-cuerpo").innerHTML=`
    <div class="rb-fila"><a class="btn" id="rb-bajar" href="api/index.php?a=respaldo_bajar" download>⬇ Descargar respaldo ahora</a><span class="nota" style="margin:0">Guarda el archivo en su computador (incluye todo: pedidos, ventas, rendiciones, usuarios, Venta Local y configuración).</span></div>
    <div class="rb-auto"><b>Respaldo automático</b>
      <label>Frecuencia<select id="rb-cada">${ops.map(([k,v])=>`<option value="${k}" ${j.cada===k?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Guardar los últimos<input id="rb-guardar" type="number" min="1" max="90" value="${j.guardar}" class="num"></label>
      <button class="btn linea" type="button" id="rb-guardar-cfg">Guardar</button>
      <span class="nota" style="margin:0">Último automático: <b>${j.ultimo?esc(fF(j.ultimo.slice(0,10)))+" "+esc(j.ultimo.slice(11)):"todavía ninguno"}</b>${j.hecho?" · recién creado":""}</span></div>
    <details class="rb-cron"><summary>Cómo activarlo en Hostinger (una sola vez)</summary>
      <ol><li>En Hostinger entre a <b>Avanzado → Cron Jobs</b>.</li><li>Elija <b>Personalizado</b> y pegue este comando:<br><code id="rb-cmd">${esc(j.cron)}</code> <button class="btn chico linea" type="button" id="rb-copiar">⧉ Copiar</button></li>
      <li>Frecuencia: <b>una vez cada hora</b> (el sistema respalda solo cuando corresponde según lo elegido arriba).</li><li>Guarde. Los respaldos quedan en la carpeta <b>mrgas-respaldos</b>, fuera de public_html (nadie los puede abrir desde internet).</li></ol>
      <p class="nota" style="margin:4px 0 0">Si no se configura, igual se crea un respaldo al abrir esta pantalla cuando ya toca.</p></details>
    <h4 class="rb-h">Respaldos guardados en el servidor (${j.lista.length})</h4>
    <div class="tabla-wrap"><table class="rb-t"><thead><tr><th>Fecha</th><th>Tipo</th><th class="der">Tamaño</th><th></th></tr></thead><tbody>
    ${j.lista.map(x=>`<tr><td class="num">${esc(x.fecha)}</td><td>${x.auto?"Automático":"Manual"}</td><td class="der num">${kb(x.tamano)}</td>
      <td class="fac-acc"><a class="btn chico linea" href="api/index.php?a=respaldo_bajar&f=${encodeURIComponent(x.archivo)}" download>⬇ Descargar</a><button class="btn chico linea" type="button" data-rbrest="${esc(x.archivo)}">Restaurar</button><button class="x-rojo" type="button" data-rbdel="${esc(x.archivo)}" aria-label="Borrar respaldo">✕</button></td></tr>`).join("")||'<tr><td colspan="4" class="vacio">Todavía no hay respaldos guardados.</td></tr>'}
    </tbody></table></div>
    <form class="rb-rest" id="rb-rest"><b>Restaurar un respaldo</b><p class="nota" style="margin:2px 0 8px">Reemplaza <b>todos</b> los datos actuales por los del respaldo. Antes se guarda solo una copia de cómo está todo ahora.</p>
      <div class="rb-g"><label>Archivo de respaldo (.json.gz)<input type="file" id="rb-archivo" accept=".gz,.json"></label><label>Contraseña del administrador<input type="password" id="rb-pass" autocomplete="current-password"></label><label>Escriba RESTAURAR<input id="rb-conf" placeholder="RESTAURAR" autocomplete="off"></label></div>
      <input type="hidden" id="rb-f"><p class="nota" id="rb-sel" hidden></p><p class="error" id="rb-err" hidden></p>
      <button class="btn rojo" type="submit" id="rb-btn">Restaurar</button></form>`;
  $("#rb-copiar").onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(j.cron):Promise.reject()).then(()=>aviso("Comando copiado","Péguelo en Hostinger → Cron Jobs."),()=>{})};
  $("#rb-guardar-cfg").onclick=async()=>{try{await api("respaldo_config",{cada:$("#rb-cada").value,guardar:+$("#rb-guardar").value||14});aviso("Respaldo automático guardado",$("#rb-cada").selectedOptions[0].text+".");pintarRespBD()}catch(e){aviso("No se pudo guardar",e.message)}};
  $("#rb-bajar").onclick=()=>{setTimeout(pintarRespBD,4000)};
  $$("[data-rbdel]").forEach(b=>b.onclick=()=>confirmar(b,async()=>{try{await api("respaldo_borrar",{f:b.dataset.rbdel});pintarRespBD()}catch(e){aviso("No se pudo borrar",e.message)}}));
  $$("[data-rbrest]").forEach(b=>b.onclick=()=>{$("#rb-f").value=b.dataset.rbrest;$("#rb-archivo").value="";const s=$("#rb-sel");s.textContent="Se restaurará el respaldo guardado del "+b.closest("tr").cells[0].textContent+".";s.hidden=false;$("#rb-pass").focus()});
  $("#rb-archivo").onchange=()=>{$("#rb-f").value="";$("#rb-sel").hidden=true};
  $("#rb-rest").onsubmit=async e=>{e.preventDefault();const er=$("#rb-err"),bt=$("#rb-btn");er.hidden=true;
    if($("#rb-conf").value.trim().toUpperCase()!=="RESTAURAR"){er.textContent="Escriba RESTAURAR para confirmar.";er.hidden=false;return}
    const fd=new FormData();fd.append("pass",$("#rb-pass").value);fd.append("confirmar","RESTAURAR");
    if($("#rb-f").value)fd.append("f",$("#rb-f").value);else if($("#rb-archivo").files[0])fd.append("archivo",$("#rb-archivo").files[0]);else{er.textContent="Elija un respaldo de la lista o un archivo.";er.hidden=false;return}
    bt.disabled=true;bt.textContent="Restaurando…";
    try{const r=await fetch(`${API_URL}?a=respaldo_restaurar`,{method:"POST",credentials:"same-origin",headers:{"X-MRGas":"1"},body:fd});const k=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(k.error||"No se pudo restaurar.");
      try{localStorage.removeItem(KEY)}catch(x){}try{indexedDB.deleteDatabase("mrgas-local")}catch(x){}
      aviso("Respaldo restaurado",`Se recuperaron ${k.filas} registros del ${k.fecha}. El sistema se recarga.`);setTimeout(()=>location.reload(),2200)}
    catch(x){er.textContent=x.message;er.hidden=false;bt.disabled=false;bt.textContent="Restaurar"}}}
{const lc=L.config;L.config=function(){const r=lc.apply(this,arguments);
  try{if(cfgTab==="respaldos"&&esAdmin()&&NUBE.activo&&!document.getElementById("resp-bd")){const z=document.querySelector(".cfg-main");if(z){
    z.insertAdjacentHTML("afterbegin",`<section class="caja rb-caja" id="resp-bd"><h3>Respaldo de la base de datos</h3><div class="rb-cuerpo"><p class="nota">Cargando respaldos…</p></div></section>`);pintarRespBD()}}}catch(e){console.error(e)}
  return r}}

/* «Desarrollado por MrGas» en el inicio y en la pantalla de ingreso */
{const devPor=()=>{try{
  const pt=document.querySelector(".pt-in");if(pt&&!pt.querySelector(".pt-dev"))pt.insertAdjacentHTML("beforeend",'<p class="pt-dev">Desarrollado por MrGas</p>');
  const fl=document.getElementById("form-login");if(fl&&!document.getElementById("lg-dev"))fl.insertAdjacentHTML("afterend",'<p class="lg-dev" id="lg-dev">Desarrollado por MrGas</p>');}catch(e){}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",devPor);else devPor()}


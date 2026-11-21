/* MR Gas · Panel del dueño: clientes, pagos, estado y versión de cada instalación */
(function () {
  "use strict";
  var API = "../api/central.php";
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var hoy = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var fF = function (f) { return f ? f.slice(8, 10) + "/" + f.slice(5, 7) + "/" + f.slice(0, 4) : "—"; };
  var dias = function (f) { return Math.round((new Date(f.slice(0, 10) + "T12:00") - new Date(hoy() + "T12:00")) / 864e5); };
  var D = { lista: [], version: "", url: "", gracia: 7 }, edit = null;

  function api(a, body) {
    return fetch(API + "?a=" + a, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
      headers: body ? { "Content-Type": "application/json", "X-MRGas": "1" } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok || !j) { var e = new Error((j && j.error) || (r.status === 404 ? "El panel del dueño no está activado en este sitio." : "Sin conexión con el servidor.")); e.status = r.status; throw e; }
        return j; }); });
  }
  function cargar() {
    api("lista").then(function (j) { D = j; pintar(); }).catch(function (e) {
      $("#app").innerHTML = e.status === 401 || e.status === 403
        ? '<div class="caja" style="padding:24px"><h1>Entre primero</h1><p class="nota">Abra el Panel General con su usuario de administrador y vuelva a esta página.</p><a class="btn" href="../#acceso">Entrar al Panel General</a></div>'
        : '<div class="caja" style="padding:24px"><h1>No disponible</h1><p class="error">' + esc(e.message) + '</p><p class="nota">Para activarlo, agregue <code>\'dueno\' =&gt; true,</code> en mrgas-config.php de su sitio.</p></div>';
    });
  }
  function etEstado(x) {
    if (x.real === "pausado") return '<span class="et mal">Pausado' + (x.estado !== "pausado" ? " (pago vencido)" : "") + "</span>";
    if (x.pago_hasta && dias(x.pago_hasta) < 0) return '<span class="et ojo">Activo · pago vencido</span>';
    if (x.pago_hasta && dias(x.pago_hasta) <= 5) return '<span class="et ojo">Activo · vence pronto</span>';
    return '<span class="et ok">Activo</span>';
  }
  function etContacto(x) {
    if (!x.contacto) return '<span class="et gris">Nunca</span>';
    var d = -dias(x.contacto);
    return '<span class="et ' + (d >= 2 ? "mal" : "ok") + '">' + (d <= 0 ? "Hoy" : d === 1 ? "Ayer" : "Hace " + d + " días") + "</span><small>" + esc(x.contacto.slice(11)) + "</small>";
  }
  function etRespaldo(x) {
    if (!x.ultimo_respaldo) return '<span class="et ' + (x.contacto ? "mal" : "gris") + '">Sin respaldo</span>';
    var d = -dias(x.ultimo_respaldo);
    return '<span class="et ' + (d >= 2 ? "mal" : "ok") + '">' + fF(x.ultimo_respaldo.slice(0, 10)) + "</span><small>" + (x.drive == 1 ? "☁ con Google Drive" : "sin Google Drive") + "</small>";
  }
  function pintar() {
    var L = D.lista, act = L.filter(function (x) { return x.real === "activo"; }).length, pau = L.length - act;
    var venc = L.filter(function (x) { return x.pago_hasta && dias(x.pago_hasta) < 0; }).length;
    var mudos = L.filter(function (x) { return !x.contacto || -dias(x.contacto) >= 2; }).length;
    $("#app").innerHTML =
      '<div class="cab"><h1>Clientes (' + L.length + ')</h1><div class="acc"><span class="nota">Versión actual: <b>' + esc(D.version) + '</b></span><button class="btn" type="button" id="b-nuevo">+ Agregar cliente</button></div></div>' +
      '<div class="kpi"><div><span>Activos</span><b>' + act + '</b></div><div><span>Pausados</span><b>' + pau + '</b></div><div><span>Pago vencido</span><b>' + venc + '</b></div><div><span>Sin contacto 2+ días</span><b>' + mudos + "</b></div></div>" +
      '<div class="caja"><table><thead><tr><th>Cliente</th><th>Estado</th><th>Pagado hasta</th><th>Versión</th><th>Último contacto</th><th>Último respaldo</th><th>Usuarios</th><th></th></tr></thead><tbody>' +
      (L.length ? L.map(function (x) {
        var vieja = x.version && x.version !== D.version;
        return "<tr><td><b>" + esc(x.nombre) + "</b><small>" + esc(x.sitio || "todavía no se conecta") + "</small>" + (x.nota ? "<small>📝 " + esc(x.nota) + "</small>" : "") + "</td>" +
          "<td>" + etEstado(x) + "</td><td>" + fF(x.pago_hasta) + "</td>" +
          '<td><span class="et ' + (!x.version ? "gris" : vieja ? "ojo" : "ok") + '">' + esc(x.version || "—") + "</span>" + (vieja ? "<small>desactualizada</small>" : "") + "</td>" +
          "<td>" + etContacto(x) + "</td><td>" + etRespaldo(x) + "</td><td>" + (x.usuarios == null ? "—" : esc(x.usuarios)) + "</td>" +
          '<td><div class="acc"><button class="btn chico linea" type="button" data-pago="' + x.id + '">+1 mes</button>' +
          '<button class="btn chico ' + (x.estado === "pausado" ? "" : "rojo") + '" type="button" data-pausa="' + x.id + '">' + (x.estado === "pausado" ? "Reactivar" : "Pausar") + "</button>" +
          '<button class="btn chico linea" type="button" data-editar="' + x.id + '">Editar</button>' +
          '<button class="btn chico linea" type="button" data-clave="' + x.id + '">Nueva clave</button></div></td></tr>';
      }).join("") : '<tr><td colspan="8" class="vacio">Todavía no hay clientes. Presione «Agregar cliente».</td></tr>') +
      "</tbody></table></div>" +
      '<details class="ayuda"><summary>¿Cómo funciona?</summary><ol>' +
      "<li>Cada cliente tiene su propio Hostinger con MR Gas. Al agregarlo aquí, recibe una clave.</li>" +
      "<li>Esa clave va en el <b>mrgas-config.php</b> del cliente. Desde ahí, su sistema le avisa a este panel cada 6 horas: versión, usuarios y último respaldo.</li>" +
      "<li>Si presiona <b>Pausar</b>, el cliente ve «Servicio pausado» al abrir el sistema (máximo 6 horas después). Sus datos no se borran; al reactivar, todo vuelve igual.</li>" +
      "<li>Si pasan <b>" + esc(D.gracia) + " días</b> desde «Pagado hasta» sin renovar, se pausa solo" + (D.gracia ? "" : " (desactivado)") + ". Los días se cambian con <code>'dueno_gracia'</code> en su mrgas-config.php.</li>" +
      "<li>Si este panel no responde, los clientes siguen funcionando normal: nunca se cortan por una falla suya.</li></ol></details>";
    $("#b-nuevo").onclick = function () { abrir(null); };
    document.querySelectorAll("[data-editar]").forEach(function (b) { b.onclick = function () { abrir(porId(b.dataset.editar)); }; });
    document.querySelectorAll("[data-pausa]").forEach(function (b) { b.onclick = function () {
      var x = porId(b.dataset.pausa), nuevo = x.estado === "pausado" ? "activo" : "pausado";
      if (nuevo === "pausado" && !confirm("¿Pausar el servicio de " + x.nombre + "? Verá «Servicio pausado» al abrir el sistema.")) return;
      guardar(Object.assign({}, x, { estado: nuevo }));
    }; });
    document.querySelectorAll("[data-pago]").forEach(function (b) { b.onclick = function () {
      var x = porId(b.dataset.pago), base = x.pago_hasta && x.pago_hasta > hoy() ? x.pago_hasta : hoy(), d = new Date(base + "T12:00");
      d.setMonth(d.getMonth() + 1);
      var f = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (!confirm("Registrar un mes pagado a " + x.nombre + ": pagado hasta el " + fF(f) + "?")) return;
      guardar(Object.assign({}, x, { pago_hasta: f, estado: x.real === "pausado" ? "activo" : x.estado }));
    }; });
    document.querySelectorAll("[data-clave]").forEach(function (b) { b.onclick = function () {
      var x = porId(b.dataset.clave);
      if (!confirm("¿Crear una clave nueva para " + x.nombre + "? La clave anterior deja de servir: habrá que cambiarla en su mrgas-config.php.")) return;
      api("nueva_clave", { id: x.id }).then(function (j) { mostrarClave(j.clave); cargar(); }).catch(function (e) { alert(e.message); });
    }; });
  }
  function porId(id) { return D.lista.filter(function (x) { return String(x.id) === String(id); })[0]; }
  function guardar(x) { return api("editar", { id: x.id, nombre: x.nombre, estado: x.estado, pago_hasta: x.pago_hasta || "", nota: x.nota || "", mensaje: x.mensaje || "" }).then(cargar).catch(function (e) { alert(e.message); }); }
  function abrir(x) {
    edit = x; $("#dl-tit").textContent = x ? "Editar cliente" : "Agregar cliente";
    $("#c-nombre").value = x ? x.nombre : ""; $("#c-pago").value = x && x.pago_hasta ? x.pago_hasta : "";
    $("#c-estado").value = x ? x.estado : "activo"; $("#l-estado").hidden = !x;
    $("#c-msj").value = x ? x.mensaje || "" : ""; $("#c-nota").value = x ? x.nota || "" : ""; $("#c-err").hidden = true;
    $("#dl-cli").showModal(); $("#c-nombre").focus();
  }
  function mostrarClave(k) {
    $("#k-txt").textContent = "    'licencia_url'   => '" + D.url + "',\n    'licencia_clave' => '" + k + "',";
    $("#dl-clave").showModal();
  }
  $("#c-cancelar").onclick = function () { $("#dl-cli").close(); };
  $("#f-cli").onsubmit = function (e) {
    e.preventDefault();
    var datos = { nombre: $("#c-nombre").value, pago_hasta: $("#c-pago").value, nota: $("#c-nota").value, mensaje: $("#c-msj").value, estado: $("#c-estado").value };
    var p = edit ? api("editar", Object.assign({ id: edit.id }, datos)) : api("crear", datos);
    p.then(function (j) { $("#dl-cli").close(); if (j.clave) mostrarClave(j.clave); cargar(); })
      .catch(function (er) { $("#c-err").textContent = er.message; $("#c-err").hidden = false; });
  };
  $("#k-copiar").onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText($("#k-txt").textContent).then(function () { $("#k-copiar").textContent = "✓ Copiado"; }); };
  $("#k-cerrar").onclick = function () { $("#dl-clave").close(); $("#k-copiar").textContent = "⧉ Copiar"; };
  cargar();
})();

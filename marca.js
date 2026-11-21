/* MR Gas · marca de la empresa (nombre, color y logo elegidos en Panel General → Configuraciones → Apariencia)
   y preferencias de este equipo (modo oscuro y tamaño de letra). La usan Venta Local y la App repartidores. */
(function () {
  "use strict";
  var base = (document.currentScript && document.currentScript.src || "").replace(/marca\.js.*$/, "");
  function rgb(h) { h = String(h || "").replace("#", ""); if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join(""); var n = parseInt(h, 16); return isNaN(n) ? [26, 102, 214] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mezcla(c, o, t) { var a = rgb(c), b = rgb(o); return "#" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0"); }).join(""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // preferencias de este equipo
  try {
    var u = JSON.parse(localStorage.getItem("mr_ui")) || {};
    if (u.oscuro) document.documentElement.classList.add("ui-oscuro");
    var z = { grande: "1.1", muygrande: "1.22" }[u.letra];
    if (z && !/[?&]app=1/.test(location.search)) document.addEventListener("DOMContentLoaded", function () { document.body.style.zoom = z; });
    var css0 = document.createElement("style");
    css0.textContent = "html.ui-oscuro{filter:invert(.9) hue-rotate(180deg);background:#111}html.ui-oscuro img,html.ui-oscuro video,html.ui-oscuro svg image{filter:invert(1) hue-rotate(180deg)}";
    document.head.appendChild(css0);
  } catch (e) {}
  function aplicar(a) {
    if (!a) return;
    var c = a.color || "#1a66d6";
    var p = { b0: mezcla(c, "#ffffff", .95), b1: mezcla(c, "#ffffff", .9), b2: mezcla(c, "#ffffff", .78), b3: mezcla(c, "#ffffff", .55), b5: mezcla(c, "#ffffff", .2), b6: c, b7: mezcla(c, "#000000", .18), b8: mezcla(c, "#000000", .38), b9: mezcla(c, "#000000", .6) };
    var v = Object.keys(p).map(function (k) { return "--" + k + ":" + p[k] + "!important"; }).join(";");
    var st = document.getElementById("marca-css"); if (!st) { st = document.createElement("style"); st.id = "marca-css"; document.head.appendChild(st); }
    st.textContent = ":root{" + v + "}";
    var nombre = a.nombre || "MR Gas", ini = nombre.split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase();
    var marcar = function () {
      document.querySelectorAll(".sq").forEach(function (e) {
        e.innerHTML = a.logo ? '<img src="' + a.logo + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">' : esc(ini);
        var b = e.nextElementSibling && e.nextElementSibling.querySelector("b"); if (b && !b.dataset.mk) { b.textContent = nombre; b.dataset.mk = 1; }
      });
      if (a.logo) { var l = document.querySelector('link[rel="icon"]'); if (l) l.href = a.logo; }
    };
    marcar();
    new MutationObserver(function () { if (document.querySelector(".sq:not(:has(img))") && a.logo) marcar(); else document.querySelectorAll(".sq").forEach(function (e) { var b = e.nextElementSibling && e.nextElementSibling.querySelector("b"); if (b && !b.dataset.mk) marcar(); }); })
      .observe(document.documentElement, { childList: true, subtree: true });
    document.title = document.title.replace(/MR Gas/g, nombre);
  }
  fetch(base + "api/index.php?a=apariencia", { cache: "no-store", credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.apariencia) aplicar(j.apariencia); }).catch(function () {});
})();

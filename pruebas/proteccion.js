// Revisa que con la protección fuerte (CSP, sin código dentro del HTML) todo funcione
const {A, ok, navegador, entrar, fin} = require('./comun');
const fs = require('fs'), path = require('path'), {REPO} = require('./comun');
(async () => {
  // 1) ningún HTML del sitio tiene código escrito adentro
  const html = ['index.html', 'local/index.html', 'repartidores/index.html', 'dueno/index.html', 'distribucion/index.html', 'terminos/index.html'];
  for (const f of html) {
    const s = fs.readFileSync(path.join(REPO, f), 'utf8');
    ok(!/<script>/.test(s) && !/\son[a-z]+="/.test(s), f + ': sin código dentro del HTML');
  }
  ok(!/'unsafe-inline' https:\/\/cdnjs[^"]*; style/.test(fs.readFileSync(path.join(REPO, '.htaccess'), 'utf8').match(/script-src[^;]+/)[0]), '.htaccess: scripts sin unsafe-inline');
  // 2) recorrer con el navegador
  const {b, pagina, errores} = await navegador();
  const p = await pagina(); await entrar(p, A);
  for (const m of ['pedidos', 'ruta', 'mayorista', 'ventachofer', 'bodega', 'facturas', 'informes', 'choferes', 'config']) { await p.evaluate(m => ir(m), m); await p.waitForTimeout(250); }
  await p.evaluate(() => { window.__imp = 0; window.print = () => window.__imp++; infTab = 'resumen'; ir('informes') }); await p.waitForTimeout(500);
  await p.$eval('[data-imprimir]', x => x.click()); ok(await p.evaluate(() => window.__imp) === 1, 'botón Imprimir funciona');
  await p.evaluate(() => { infTab = 'vlocal'; ir('informes') }); await p.waitForTimeout(3000);
  const fi = p.frame({url: /solo=inf/}); ok(!!fi && await fi.evaluate(() => S.view) === 'inf', 'Informe Venta Local abre');
  const r = await pagina(390, 844); await r.goto(A + 'repartidores/'); await r.waitForTimeout(2000);
  ok(await r.evaluate(() => document.body.innerText.length > 20), 'App repartidores abre');
  await fin(b, errores);
})();

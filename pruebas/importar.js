// Importar la «base de datos» de otro Venta Local (formato antiguo) con sus sucursales
const {A, B, ok, navegador, entrar, abrirRespaldos, fin} = require('./comun');
const path = require('path');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(1440, 1000); await entrar(p, A);
  await abrirRespaldos(p);
  ok(!!(await p.$('#imp-vl')), 'Respaldos y reset tiene «Importar datos de otro Venta Local»');
  await p.setInputFiles('#imp-arch', path.join(__dirname, 'venta-local-antiguo.json'));
  await p.click('#imp-ver'); await p.waitForTimeout(2000);
  const filas = await p.$$eval('.imp-t tbody tr', x => x.map(e => e.innerText.replace(/\s+/g, ' ')));
  ok(filas.length === 3, 'muestra las 3 sucursales del archivo');
  const nombres = await p.$$eval('.imp-nom', x => x.map(e => e.value));
  ok(nombres.includes('Talca'), 'una sucursal nueva (Talca) mantiene su nombre');
  ok(/ana/.test(await p.$eval('#imp-vl', e => e.textContent)), 'lista los usuarios antiguos para crearlos aparte');
  await p.click('#imp-ok'); await p.waitForTimeout(4000);
  ok(!(await p.$('.imp-t')) && (await p.$('#imp-arch')), 'importa y vuelve a la pantalla inicial');
  // revisar en el servidor
  const r = await p.evaluate(async () => (await fetch('local/api/docs.php?a=resumen&desde=2000-01-01&hasta=2099-12-31', {credentials: 'same-origin'})).json());
  const sucs = r.sucs || {};
  ok(Object.values(sucs).includes('Talca'), 'Talca quedó como sucursal');
  const tot = Object.values(r.dias || {}).reduce((s, d) => s + (d.n || 0), 0);
  ok(tot > 0, 'las ventas importadas aparecen en el resumen (' + tot + ' ventas)');
  // Venta Local abre la sucursal importada (nueva) con sus ventas
  const v = await pagina(); await entrar(v, A); await v.goto(A + 'local/?app=1'); await v.waitForTimeout(4000);
  await v.evaluate(() => { save(); S.user.suc = 'Talca'; db = load('Talca'); sessionStorage.setItem('gl_user', JSON.stringify(S.user)); go('home'); }); await v.waitForTimeout(6000);
  const vt = await v.evaluate(() => ({suc: S.user && S.user.suc, n: (db.ventas || []).length}));
  ok(vt.suc === 'Talca' && vt.n > 0, 'Venta Local abre Talca con sus ventas (' + vt.n + ')');
  // si se importa de nuevo, no se mezcla: propone otro nombre
  await p.setInputFiles('#imp-arch', path.join(__dirname, 'venta-local-antiguo.json')); await p.click('#imp-ver'); await p.waitForTimeout(2000);
  const n2 = await p.$$eval('.imp-nom', x => x.map(e => e.value));
  ok(n2.includes('Talca 2'), 'al repetir, no pisa lo importado: propone «Talca 2»');
  const lista = await p.evaluate(async () => (await fetch('api/index.php?a=respaldo_info', {credentials: 'same-origin'})).json());
  ok(lista.lista.some(x => !x.auto), 'antes de importar se guardó un respaldo');
  // un respaldo completo de otro MR Gas (sitio A) se importa en el sitio B
  const gz = await p.evaluate(async () => { const r = await fetch('api/index.php?a=respaldo_bajar', {credentials: 'same-origin'}); const u8 = new Uint8Array(await r.arrayBuffer()); let s = ''; u8.forEach(x => s += String.fromCharCode(x)); return btoa(s); });
  const tmp = path.join(require('os').tmpdir(), 'mr-manual-prueba.json.gz'); require('fs').writeFileSync(tmp, Buffer.from(gz, 'base64'));
  const q = await pagina(1440, 1000); await entrar(q, B, 'cliente'); await abrirRespaldos(q);
  await q.setInputFiles('#imp-arch', tmp); await q.click('#imp-ver'); await q.waitForTimeout(2500);
  const nb = await q.$$eval('.imp-nom', x => x.map(e => e.value));
  ok(nb.includes('Talca') && nb.length >= 3, 'un respaldo de otro MR Gas también se puede importar (' + nb.join(', ') + ')');
  await fin(b, errores);
})();

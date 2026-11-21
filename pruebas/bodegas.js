// Control de Bodega: bodegas propias de las sucursales (Talca, importada en la prueba anterior) e ingreso de carga
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(1440, 1000); await entrar(p, A);
  const api = (a, body) => p.evaluate(async ([a, body]) => { const r = await fetch('api/index.php?a=' + a, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-MRGas': '1'}, body: JSON.stringify(body)}); return r.status; }, [a, body]);
  await p.evaluate(() => { bTab = 'stock'; ir('bodega') }); await p.waitForTimeout(2500);
  ok(!!(await p.$('#bd-sp')) && /Talca/.test(await p.$eval('#bd-sp', e => e.innerText)), 'Stock muestra «Bodegas de sucursales» con Talca');
  if (process.env.FOTOS) await (await p.$('#bd-sp')).screenshot({path: process.env.FOTOS + '/bodegas-stock.png'});
  await p.click('[data-bsing="talca"]'); await p.waitForTimeout(1200);
  ok(/Ingreso de carga · Talca/.test(await p.evaluate(() => document.body.innerText)), 'el botón lleva al Ingreso de carga de Talca');
  ok(!!(await p.$('[data-bsel=""]')), 'Ingreso de carga permite elegir la bodega (matriz o sucursal)');
  await p.fill('[data-bsq="11"]', '5');
  if (process.env.FOTOS) await (await p.$('.vc-main')).screenshot({path: process.env.FOTOS + '/bodegas-ingreso.png'});
  await p.click('#bs-ok'); await p.waitForTimeout(2500);
  const j = await p.evaluate(async () => (await fetch('local/api/docs.php?a=bodegas', {credentials: 'same-origin'})).json());
  const t = j.bodegas.find(x => x.slug === 'talca');
  ok(t && t.llenos['11'] === 15 && t.vacios['11'] === 15, 'el ingreso suma 5 llenos de 11 kg y descuenta 5 vacíos (llenos ' + (t && t.llenos['11']) + ', vacíos ' + (t && t.vacios['11']) + ')');
  ok(t && t.ingresos.length && t.ingresos[0].stock['11'] === 5, 'queda en los últimos ingresos de la sucursal');
  // permisos: encargado con bodega y permiso de Talca la ve; sin permiso de Talca, no
  await api('usuario', {user: 'bodtalca', nombre: 'Bod Talca', pass: 'Bodega2026x', rol: 'encargado', sucursales: [1], permisos: ['_v2', '_v3', 'bodega', 'app.local', 'lsuc.talca']});
  await api('usuario', {user: 'bodotra', nombre: 'Bod Otra', pass: 'Bodega2026x', rol: 'encargado', sucursales: [1], permisos: ['_v2', '_v3', 'bodega']});
  const ver = async u => { const q = await pagina(); await entrar(q, A, u, 'Bodega2026x');
    return q.evaluate(async () => { const r = await (await fetch('local/api/docs.php?a=bodegas', {credentials: 'same-origin'})).json();
      const ing = await fetch('local/api/docs.php?a=bodega_ingreso', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-MRGas': '1'}, body: JSON.stringify({suc: 'talca', q: {'5': 1}, canje: false})});
      return {ve: r.bodegas.map(x => x.slug), ing: ing.status}; }); };
  const v1 = await ver('bodtalca'), v2 = await ver('bodotra');
  ok(v1.ve.includes('talca') && v1.ing === 200, 'encargado con permiso de Talca la ve y puede cargarla');
  ok(!v2.ve.includes('talca') && v2.ing === 403, 'encargado sin permiso de Talca no la ve ni puede cargarla');
  // Venta Local: sucursal con bodega propia (Talca) muestra su menú; la unida a la matriz (Cervantes) entra directo a la venta
  const vl = await pagina(1440, 900); await entrar(vl, A); await vl.goto(A + 'local/?app=1'); await vl.waitForTimeout(4000);
  const vista = () => vl.evaluate(() => S.view);
  await vl.evaluate(() => { save(); S.user.suc = 'Cervantes'; db = load('Cervantes'); sessionStorage.setItem('gl_user', JSON.stringify(S.user)); go('home'); }); await vl.waitForTimeout(5000);
  ok(await vista() === 'venta', 'sucursal unida a la matriz: entra directo a ingresar venta');
  await vl.evaluate(() => { save(); S.user.suc = 'Talca'; db = load('Talca'); sessionStorage.setItem('gl_user', JSON.stringify(S.user)); go('home'); }); await vl.waitForTimeout(5000);
  const cards = await vl.$$eval('.mcard .mt', x => x.map(e => e.textContent));
  ok(await vista() === 'home' && cards.length === 3 && cards.some(c => /Mayorista/.test(c)) && cards.some(c => /bodega/i.test(c)), 'sucursal con bodega propia: menú con Venta Local, Venta Mayorista y Control de bodega (' + cards.join(', ') + ')');
  if (process.env.FOTOS) await vl.screenshot({path: process.env.FOTOS + '/menu-sucursal.png'});
  await vl.click('.mcard:has-text("Mayorista")'); await vl.waitForTimeout(800);
  ok(await vista() === 'may' && !!(await vl.$('#mg-menu')), 'Venta Mayorista abre y tiene «← Menú»');
  await vl.click('#mg-menu'); await vl.waitForTimeout(800);
  await vl.click('.mcard:has-text("bodega")'); await vl.waitForTimeout(800);
  ok(/^b/.test(await vista()), 'Control de bodega abre (' + await vista() + ')');
  if (process.env.FOTOS) await vl.screenshot({path: process.env.FOTOS + '/bodega-sucursal.png'});
  await fin(b, errores);
})();

// Informe «Comparar meses»: se ve, tiene sus tablas y cambia de mes
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(); await entrar(p, A);
  await p.evaluate(() => { infTab = 'comparar'; ir('informes') }); await p.waitForTimeout(2500);
  ok((await p.$$('.res-kpi > div')).length === 3, 'muestra ventas, cilindros y kilos');
  const tablas = await p.$$eval('.res-cap b', x => x.map(e => e.textContent));
  ok(tablas.includes('Ventas por canal') && tablas.includes('Ventas por chofer') && tablas.includes('Cilindros vendidos por formato'), 'tablas por canal, chofer y formato');
  await p.fill('#cmp-mes', '2026-03'); await p.dispatchEvent('#cmp-mes', 'change'); await p.waitForTimeout(1500);
  ok(/Febrero de 2026/.test(await p.$eval('.res-top .nota', e => e.textContent)), 'marzo se compara con febrero');
  ok(await p.evaluate(() => cmpVar(100, 110) === '▲ 10%' && cmpVar(100, 80) === '▼ 20%' && cmpVar(0, 0) === '–'), 'cálculo de la variación');
  await fin(b, errores);
})();

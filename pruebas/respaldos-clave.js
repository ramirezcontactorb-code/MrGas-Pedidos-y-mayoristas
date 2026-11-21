// «Respaldos y reset» pide la contraseña del administrador (en pantalla y en el servidor)
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(); await entrar(p, A);
  const api = a => p.evaluate(async a => (await fetch('api/index.php?a=' + a, {credentials: 'same-origin'})).status, a);
  ok(await api('respaldo_info') === 423, 'sin contraseña, el servidor no entrega la lista de respaldos');
  ok(await api('respaldo_bajar') === 423, 'sin contraseña, no se puede descargar un respaldo');
  ok(await api('drive_estado') === 423, 'sin contraseña, no se ve Google Drive');
  await p.evaluate(() => { cfgTab = 'respaldos'; ir('config') }); await p.waitForTimeout(1200);
  ok(!!(await p.$('#rl-pass')) && !(await p.$('#resp-bd')), 'la pantalla pide la contraseña y no muestra nada más');
  await p.fill('#rl-pass', 'mala-clave'); await p.click('#rl-btn'); await p.waitForTimeout(1200);
  ok(/no es correcta/.test(await p.$eval('#rl-err', e => e.textContent)), 'una contraseña mala se rechaza');
  await p.fill('#rl-pass', 'Clave1234'); await p.click('#rl-btn'); await p.waitForTimeout(2500);
  ok(!!(await p.$('#resp-bd')) && !!(await p.$('#rb-drive')), 'con la contraseña correcta aparecen los respaldos y Google Drive');
  ok(await api('respaldo_info') === 200, 'y el servidor ya responde');
  await p.evaluate(() => ir('menu')); await p.waitForTimeout(400); await p.evaluate(() => { cfgTab = 'respaldos'; ir('config') }); await p.waitForTimeout(800);
  ok(!(await p.$('#rl-pass')), 'si sale y vuelve dentro de 30 minutos, no la pide de nuevo');
  await p.click('#rl-cerrar'); await p.waitForTimeout(1200);
  ok(!!(await p.$('#rl-pass')) && await api('respaldo_info') === 423, '«Cerrar con llave» la vuelve a pedir');
  await fin(b, errores);
})();

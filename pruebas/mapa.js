// Mapa en vivo: un repartidor comparte su ubicación desde la App y la oficina lo ve
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const o = await pagina(); await entrar(o, A);
  // crear un usuario repartidor para el primer chofer
  const ch = await o.evaluate(() => { const c = chOrden().filter(x => x.activo !== false)[0]; return {id: c.id, nombre: c.nombre, local: c.local}; });
  const r = await o.evaluate(async c => { const x = await fetch('api/index.php?a=usuario', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-MRGas': '1'},
    body: JSON.stringify({user: 'repmapa', nombre: 'Rep Mapa', pass: 'Ruta2026x', rol: 'chofer', chofer: c.id, sucursales: [c.local]})}); return x.status + ' ' + (await x.text()).slice(0, 80); }, ch);
  ok(/^200/.test(r), 'se crea el usuario del repartidor (' + r + ')');
  // App repartidores con GPS simulado
  const ctx = o.context(); const rp = await (await b.newContext({viewport: {width: 390, height: 844}, geolocation: {latitude: -33.5100, longitude: -70.7570}, permissions: ['geolocation']})).newPage();
  rp.on('pageerror', e => errores.push('app: ' + e.message));
  await rp.goto(A + 'repartidores/'); await rp.waitForTimeout(1500);
  await rp.fill('#lg-user', 'repmapa'); await rp.fill('#lg-pass', 'Ruta2026x'); await rp.click('#form-login button[type=submit], form button[type=submit]'); await rp.waitForTimeout(6000);
  ok(/Ubicación activa/.test(await rp.$eval('#ubi', e => e.textContent).catch(() => '')), 'la App muestra «Ubicación activa»');
  // la oficina ve el camión
  await o.evaluate(() => ir('ruta')); await o.waitForTimeout(800);
  ok(!!(await o.$('#b-mapa')), 'Asigna Ruta tiene el botón «Mapa en vivo»');
  await o.click('#b-mapa'); await o.waitForTimeout(2500);
  const lista = await o.$eval('#mp-lista', e => e.innerText);
  ok(lista.includes(ch.nombre) && /recién|hace/.test(lista), 'el mapa lista al repartidor con su última posición');
  const j = await o.evaluate(async () => (await fetch('api/index.php?a=ubicaciones&rastro=1', {credentials: 'same-origin'})).json());
  const u = j.ubicaciones[String(ch.id)];
  ok(u && Math.abs(u.lat + 33.51) < 0.001 && Math.abs(u.lon + 70.757) < 0.001, 'el servidor guardó la posición correcta');
  // seguridad: un repartidor no puede ver el mapa
  ok(await rp.evaluate(async () => (await fetch('../api/index.php?a=ubicaciones', {credentials: 'same-origin'})).status) === 403, 'un repartidor no puede ver la ubicación de los demás');
  await fin(b, errores);
})();

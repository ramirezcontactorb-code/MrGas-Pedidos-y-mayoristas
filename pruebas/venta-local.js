// Venta Local dentro del Panel General: vender con los botones y navegar (con la protección fuerte)
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(); await entrar(p, A);
  await p.click('a.modulo[href="local/"]'); await p.waitForTimeout(4500);
  const f = p.frame({url: /app=1/}); ok(!!f, 'Venta Local se abre dentro del Panel');
  ok(await f.evaluate(() => S.view) === 'venta', 'entra directo a ingresar venta');
  const antes = await f.evaluate(() => (db.ventas || []).length);
  const campo = await f.evaluateHandle(() => [...document.querySelectorAll('input')].find(x => [...x.attributes].some(a => /^data-h\d+a0$/.test(a.name))));
  await campo.asElement().fill('2'); await p.waitForTimeout(300);
  ok(await f.evaluate(() => Object.values(S.cart.items || {}).reduce((s, n) => s + n, 0)) === 2, 'escribir la cantidad suma al carro');
  await f.click('button:has-text("Grabar venta")'); await p.waitForTimeout(1500);
  ok(await f.evaluate(() => (db.ventas || []).length) === antes + 1, 'botón Grabar venta guarda la venta');
  await f.click('button:has-text("Rendición")'); await p.waitForTimeout(800); ok(await f.evaluate(() => S.view) === 'rend', 'botón Rendición');
  await f.click('button:has-text("Volver")'); await p.waitForTimeout(800); ok(await f.evaluate(() => S.view) === 'venta', 'botón Volver');
  await fin(b, errores);
})();

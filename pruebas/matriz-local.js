// Configuraciones → Módulos: Venta Local en Casa Matriz (activar y desactivar)
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(1440, 1000); await entrar(p, A);
  const lista = () => p.evaluate(async () => (await (await fetch('local/api/docs.php?a=sucursales', {credentials: 'same-origin'})).json()).list);
  const nom = await p.evaluate(() => D.locales[0].nombre), id = await p.evaluate(() => D.locales[0].id);
  await p.evaluate(() => { cfgTab = 'general'; ir('config') }); await p.waitForTimeout(1500);
  ok(!!(await p.$('#md-vlm')) && !(await p.$eval('#md-vlm', e => e.disabled)), 'Módulos tiene «Venta Local en ' + nom + '»');
  ok(!(await p.$eval('#md-vlm', e => e.checked)), 'parte desactivada');
  await p.check('#md-vlm'); await p.waitForTimeout(1500);
  let l = await lista(), x = l.find(s => s.nombre === nom);
  ok(x && x.activa !== false && +x.bodega === +id, 'al activarla, ' + nom + ' queda como sucursal de Venta Local con la bodega de la matriz');
  // Venta Local: la matriz entra directo a la venta (bodega unida)
  const v = await pagina(); await entrar(v, A); await v.goto(A + 'local/?app=1'); await v.waitForTimeout(4000);
  await v.evaluate(n => { save(); S.user.suc = n; db = load(n); sessionStorage.setItem('gl_user', JSON.stringify(S.user)); go('home'); }, nom); await v.waitForTimeout(5000);
  ok(await v.evaluate(() => S.user.suc + '|' + S.view) === nom + '|venta', 'en Venta Local, ' + nom + ' entra directo a ingresar venta');
  await p.uncheck('#md-vlm'); await p.waitForTimeout(1500);
  l = await lista(); x = l.find(s => s.nombre === nom);
  ok(x && x.activa === false, 'al desactivarla deja de aparecer (sus datos se conservan)');
  await p.reload(); await p.waitForTimeout(2500); await p.evaluate(() => { cfgTab = 'general'; ir('config') }); await p.waitForTimeout(1500);
  ok(!(await p.$eval('#md-vlm', e => e.checked)), 'la casilla recuerda el estado');
  await fin(b, errores);
})();

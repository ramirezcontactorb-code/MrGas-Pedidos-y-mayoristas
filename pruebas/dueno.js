// Panel del dueño (sitio A) y un cliente con licencia (sitio B)
const {A, B, DIR, ok, navegador, entrar, fin} = require('./comun');
const fs = require('fs'), path = require('path'), {execFileSync} = require('child_process');
const olvidar = () => execFileSync('php', ['-r', `$x=new PDO("sqlite:${DIR}/b/p.sqlite");$x->exec("DELETE FROM ajustes WHERE k='lic_estado'");`]);
(async () => {
  const {b, pagina, errores} = await navegador();
  const d = await pagina(); d.on('dialog', x => x.accept());
  await d.goto(A + 'dueno/'); await d.waitForTimeout(800);
  ok(/Entre primero/.test(await d.$eval('#app', e => e.innerText)), 'sin sesión pide entrar');
  await entrar(d, A); await d.goto(A + 'dueno/'); await d.waitForTimeout(1000);
  await d.click('#b-nuevo'); await d.fill('#c-nombre', 'Gas Los Andes'); await d.fill('#c-pago', '2099-12-31'); await d.click('#c-ok'); await d.waitForTimeout(1000);
  const clave = (await d.$eval('#k-txt', e => e.textContent)).match(/mrg_[0-9a-f]{40}/)[0]; await d.click('#k-cerrar');
  ok(!!clave, 'al agregar un cliente entrega su clave');
  fs.writeFileSync(path.join(DIR, 'b/mrgas-config.php'), `<?php return ['dsn'=>'sqlite:${DIR}/b/p.sqlite','licencia_url'=>'${A}api/central.php','licencia_clave'=>'${clave}'];`);
  const c = await pagina(); await entrar(c, B, 'cliente');
  await d.reload(); await d.waitForTimeout(1000);
  ok(/127\.0\.0\.1:8129/.test(await d.$eval('tbody tr', e => e.innerText)), 'el cliente se reporta solo al entrar');
  await d.click('[data-pausa]'); await d.waitForTimeout(1000); olvidar();
  await c.reload(); await c.waitForTimeout(2500);
  ok(!!(await c.$('#lic-pausa')), 'al pausar, el cliente ve «Servicio pausado»');
  ok(await c.evaluate(async () => (await fetch('api/index.php?a=cambios&desde=0', {credentials: 'same-origin'})).status) === 402, 'y el servidor del cliente no entrega datos');
  await d.click('[data-pausa]'); await d.waitForTimeout(1000); olvidar();
  await c.reload(); await c.waitForTimeout(2500);
  ok(!(await c.$('#lic-pausa')), 'al reactivar, vuelve a funcionar');
  const r = await fetch(A + 'api/central.php?a=reporte', {method: 'POST', headers: {'X-MRGas': '1', 'X-Licencia': 'mrg_falsa'}, body: '{}'});
  ok(r.status === 401, 'una clave falsa es rechazada');
  await fin(b, errores);
})();

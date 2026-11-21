// Términos de uso y privacidad: el administrador los acepta una vez; los demás no se bloquean
const {A, ok, navegador, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina();
  await p.goto(A + '#acceso'); await p.waitForTimeout(900);
  ok(!!(await p.$('#lg-term a[href="terminos/"]')), 'la pantalla de ingreso tiene el enlace a los términos');
  await p.fill('#lg-user', 'matias'); await p.fill('#lg-pass', 'Clave1234'); await p.click('#form-login button[type=submit]'); await p.waitForTimeout(2500);
  ok(!!(await p.$('#term-dl')), 'el administrador ve el aviso para aceptar los términos');
  ok(await p.$eval('#term-btn', e => e.disabled), 'no se puede aceptar sin marcar «Leí y acepto»');
  await p.check('#term-chk'); await p.click('#term-btn'); await p.waitForTimeout(1000);
  ok(!(await p.$('#term-dl')), 'al aceptar, el aviso se cierra');
  const j = await p.evaluate(async () => (await fetch('api/index.php?a=terminos', {credentials: 'same-origin'})).json());
  ok(j.aceptado && j.info && j.info.por, 'el servidor guarda quién aceptó y cuándo (' + (j.info && j.info.fecha) + ')');
  await p.reload(); await p.waitForTimeout(2500);
  ok(!(await p.$('#term-dl')), 'no lo vuelve a pedir');
  ok(!!(await p.$('.foot-mr a[href="terminos/"]')), 'enlace a términos al pie de las pantallas');
  const t = await pagina(); await t.goto(A + 'terminos/'); await t.waitForTimeout(600);
  ok(/Política de privacidad/.test(await t.evaluate(() => document.body.innerText)) && /Ubicación de los repartidores/.test(await t.evaluate(() => document.body.innerText)), 'la página de términos abre y explica la ubicación');
  await fin(b, errores);
})();

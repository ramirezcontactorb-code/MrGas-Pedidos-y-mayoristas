// Respaldo a Google Drive con un Google simulado (no usa internet)
const {A, DIR, ok, navegador, entrar, abrirRespaldos, fin} = require('./comun');
const fs = require('fs'), path = require('path'), zlib = require('zlib');
(async () => {
  const {b, pagina, errores} = await navegador();
  const p = await pagina(1440, 1000); let url = null;
  await p.route(/accounts\.google\.com/, r => { url = r.request().url(); r.fulfill({status: 200, body: 'google'}) });
  await entrar(p, A);
  await abrirRespaldos(p);
  ok(/No conectado/.test(await p.$eval('#rb-drive', e => e.innerText)), 'aparece la sección Google Drive');
  await p.fill('#gd-cliente', '123-abc.apps.googleusercontent.com'); await p.fill('#gd-secreto', 'GOCSPX-prueba-123'); await p.click('#gd-guardar'); await p.waitForTimeout(1000);
  await p.click('#gd-conectar'); await p.waitForTimeout(1200);
  const q = new URL(url).searchParams;
  ok(q.get('scope').includes('drive.file') && q.get('access_type') === 'offline', 'pide a Google solo el permiso drive.file');
  await p.goto(A + 'api/index.php?a=drive_vuelta&code=CODIGO-OK&state=falso'); await p.waitForTimeout(2500);
  ok(!/Conectado a dueno/.test(await p.evaluate(() => document.body.innerText)), 'rechaza una vuelta falsa (estado distinto)');
  await p.evaluate(() => { cfgTab = 'respaldos'; ir('config') }); await p.waitForTimeout(2000); await p.click('#gd-conectar'); await p.waitForTimeout(1200);
  await p.goto(A + 'api/index.php?a=drive_vuelta&code=CODIGO-OK&state=' + new URL(url).searchParams.get('state')); await p.waitForTimeout(3500);
  ok(/Conectado a dueno@ejemplo\.cl/.test(await p.$eval('#rb-drive', e => e.innerText)), 'queda conectado con la cuenta');
  await p.click('#gd-subir'); await p.waitForTimeout(4000);
  const fj = path.join(DIR, 'gsim/datos/files.json');
  if (!fs.existsSync(fj)) console.log('    pantalla:', (await p.$eval('#rb-drive', e => e.innerText)).replace(/\s+/g, ' ').slice(-300));
  const fl = fs.existsSync(fj) ? JSON.parse(fs.readFileSync(fj, 'utf8')).filter(f => !f.folder) : [];
  ok(fl.length === 1 && fl[0].gz === '1f8b' && fl[0].size > 1000, 'el respaldo llega a Drive comprimido');
  // el respaldo no lleva la conexión con Google adentro
  const resp = fs.readdirSync(path.join(DIR, 'a/mrgas-respaldos')).filter(f => f.endsWith('.gz')).sort().pop();
  const txt = zlib.gunzipSync(fs.readFileSync(path.join(DIR, 'a/mrgas-respaldos', resp))).toString();
  ok(!/"k":"gd_/.test(txt) && !/GOCSPX/.test(txt), 'el archivo de respaldo no incluye las claves de Google');
  await fin(b, errores);
})();

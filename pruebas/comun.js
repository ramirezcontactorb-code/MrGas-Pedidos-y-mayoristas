// MR Gas · ayudas comunes para las pruebas
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const A = 'http://127.0.0.1:8128/', B = 'http://127.0.0.1:8129/';
const DIR = process.env.MRGAS_PRUEBA_DIR || '', REPO = process.env.MRGAS_REPO || path.join(__dirname, '..');
const CSP = fs.readFileSync(path.join(REPO, '.htaccess'), 'utf8').match(/Content-Security-Policy "([^"]+)"/)[1];
let fallas = 0;
function ok(cond, msg) { console.log((cond ? '  ok   ' : '  MAL  ') + msg); if (!cond) fallas++; }
// Navegador con la misma protección (CSP) que manda Hostinger; avisa de errores y bloqueos
async function navegador() {
  const b = await chromium.launch(); const errores = [];
  const pagina = async (w = 1440, h = 900) => {
    const c = await b.newContext({viewport: {width: w, height: h}});
    await c.route('**/*', async r => {
      const u = r.request().url();
      if (!/^http:\/\/127\.0\.0\.1:81(28|29)\//.test(u)) return r.abort();   // nada de internet en las pruebas
      const res = await r.fetch({maxRedirects: 0});   // las redirecciones las sigue el navegador
      return r.fulfill({response: res, headers: {...res.headers(), 'content-security-policy': CSP}});
    });
    const p = await c.newPage();
    p.on('pageerror', e => errores.push(e.message));
    p.on('console', m => { if (/Content Security Policy|Refused to/.test(m.text())) errores.push('CSP: ' + m.text().slice(0, 160)); });
    return p;
  };
  return {b, pagina, errores};
}
async function entrar(p, H, u = 'matias', c = 'Clave1234') {
  await p.goto(H + '#acceso'); await p.waitForTimeout(900);
  await p.fill('#lg-user', u); await p.fill('#lg-pass', c); await p.click('#form-login button[type=submit]'); await p.waitForTimeout(2300);
}
// Abre Configuraciones → Respaldos y reset (pide la contraseña del administrador)
async function abrirRespaldos(p, clave = 'Clave1234') {
  await p.evaluate(() => { cfgTab = 'respaldos'; ir('config') }); await p.waitForTimeout(800);
  if (await p.$('#rl-pass')) { await p.fill('#rl-pass', clave); await p.click('#rl-btn'); await p.waitForTimeout(2500); }
}
function fin(b, errores) {
  ok(!errores.length, 'sin errores de código ni bloqueos' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  return b.close().then(() => process.exit(fallas ? 1 : 0));
}
module.exports = {A, B, DIR, REPO, ok, navegador, entrar, abrirRespaldos, fin};

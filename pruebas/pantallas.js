// Abre todas las pantallas del Panel General en PC y en celular
const {A, ok, navegador, entrar, fin} = require('./comun');
(async () => {
  const {b, pagina, errores} = await navegador();
  for (const [w, h, nom] of [[1440, 900, 'PC'], [390, 844, 'celular']]) {
    const p = await pagina(w, h); await entrar(p, A);
    ok(await p.evaluate(() => !!yo), nom + ': entra con usuario y clave');
    const mods = await p.evaluate(() => Object.keys(V)); const vacias = [];
    for (const m of mods) {
      await p.evaluate(m => ir(m), m).catch(e => errores.push(m + ': ' + e.message)); await p.waitForTimeout(120);
      if (await p.evaluate(() => (document.querySelector('main') || document.body).innerText.length) < 30) vacias.push(m);
    }
    ok(mods.length >= 20 && !vacias.length, `${nom}: ${mods.length} pantallas abren con contenido` + (vacias.length ? ' (vacías: ' + vacias.join(',') + ')' : ''));
    for (const t of ['usuarios', 'apariencia', 'respaldos', 'sucursales', 'precios']) { await p.evaluate(t => { cfgTab = t; ir('config') }, t); await p.waitForTimeout(150); }
    for (const t of ['resumen', 'comparar', 'catalogo', 'diario']) { await p.evaluate(t => { infTab = t; ir('informes') }, t); await p.waitForTimeout(150); }
    if (nom === 'celular') ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'celular: sin scroll hacia el lado en Informes');
  }
  await fin(b, errores);
})();

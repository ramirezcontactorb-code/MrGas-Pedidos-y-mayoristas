<?php
// MR Gas · Venta Local dentro del Panel General.
// Guarda los datos de Venta Local en la misma base de datos MySQL (tabla local_docs).
// Pueden entrar los usuarios del Panel General que son administradores o tienen el permiso «Venta Local».
// Los permisos de cada sección y sucursal de Venta Local se dan en Panel General → Configuraciones → Usuarios.
declare(strict_types=1);
require dirname(__DIR__, 2) . '/api/nucleo.php';
require dirname(__DIR__, 2) . '/api/push.php';
require dirname(__DIR__, 2) . '/api/diaria.php';
require dirname(__DIR__, 2) . '/api/licencia.php';
require dirname(__DIR__, 2) . '/api/respaldo.php';
date_default_timezone_set('America/Santiago');
iniciarSesion();

function tablaLocal(): void {
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS local_docs (path VARCHAR(190) NOT NULL PRIMARY KEY, data MEDIUMTEXT NOT NULL, ver BIGINT NOT NULL)$motor");
    try { db()->exec('CREATE INDEX idx_local_ver ON local_docs (ver)'); } catch (Throwable $e) {}
    db()->exec(esSqlite() ? "INSERT OR IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)" : "INSERT IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)");
    db()->exec("DELETE FROM local_docs WHERE path = 'app/users'");
}
// Los usuarios de Venta Local son los mismos del Panel General (tabla usuarios, claves cifradas).
// Permisos guardados en el usuario: «app.local», «loc.<permiso>» y «lsuc.<sucursal>».
function puedeLocalU(array $p): bool {
    if ($p['rol'] === 'chofer' || !$p['activo']) return false;
    return $p['rol'] === 'admin' || (is_array($p['permisos']) && in_array('app.local', $p['permisos'], true));
}
function quien(): ?array {
    $m = yo();
    if ($m && puedeLocalU($m)) return ['modo' => 'matriz', 'perfil' => $m];
    return null;
}
// Sucursales de Venta Local: se configuran desde el Panel General (documento app/sucursales)
const SUCS_INICIALES = ['Cervantes', 'El Tranque', 'Maipo', 'Padre Damián', 'Olivos', 'Jr Coyhaique', 'Jr Parcelas', 'Chillán'];
function sucursalesLocal(): array {
    $st = db()->prepare("SELECT data FROM local_docs WHERE path = 'app/sucursales'"); $st->execute();
    $d = json_decode((string) $st->fetchColumn(), true);
    if (is_array($d['list'] ?? null) && $d['list']) return $d['list'];
    return array_map(fn($n) => ['nombre' => $n, 'indep' => $n === 'Chillán', 'activa' => true], SUCS_INICIALES);
}
// Una sola bodega: la sucursal de Venta Local usa el stock de la bodega de la matriz (documento estado/loc-N)
const LMAP = ['5' => 'c5', '11' => 'c11', '15' => 'c15', '45' => 'c45', 'H15A' => 'h15a'];
function bodegaDe(string $slug): ?int {
    foreach (sucursalesLocal() as $x) if (slugLocal($x['nombre']) === $slug) {
        $b = isset($x['bodega']) && $x['bodega'] !== null ? (int) $x['bodega'] : 0;
        if ($b < 0) return null;
        return $b > 0 ? $b : bodegaPrincipal();
    }
    return null;
}
function bodegaPrincipal(): ?int {
    $st = db()->prepare("SELECT id FROM docs WHERE col = 'estado' AND id LIKE 'loc-%' AND borrado = 0"); $st->execute();
    $min = null; foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $id) { $n = (int) substr((string) $id, 4); if ($n > 0 && ($min === null || $n < $min)) $min = $n; }
    return $min;
}
function leerLoc(int $id): ?array {
    $st = db()->prepare("SELECT data FROM docs WHERE col = 'estado' AND id = ? AND borrado = 0"); $st->execute(['loc-' . $id]);
    $v = $st->fetchColumn(); if ($v === false) return null;
    return ['obj' => json_decode($v, false), 'arr' => json_decode($v, true)];
}
function sumarLoc(int $id, array $d, ?int $autor): ?object {
    $l = leerLoc($id); if (!$l) return null; $raiz = $l['obj']; $o = isset($raiz->v) && is_object($raiz->v) ? $raiz->v : $raiz;
    foreach (['stock', 'vacios', 'prestados'] as $k) {
        $o->$k = $o->$k ?? new stdClass();
        foreach ((array) ($d[$k] ?? []) as $lid => $v) { $mid = LMAP[(string) $lid] ?? null; if (!$mid || !(int) $v) continue; $o->$k->$mid = (int) ($o->$k->$mid ?? 0) + (int) $v; }
    }
    $json = json_encode($raiz, JSON_UNESCAPED_UNICODE);
    grabarDoc('estado', 'loc-' . $id, json_decode($json, true), $autor, $json);
    return $o;
}
function unirBodega(string $slug, int $id, ?int $autor): void {
    $st = db()->prepare('SELECT data FROM local_docs WHERE path = ?'); $st->execute(['suc/' . $slug]);
    $v = $st->fetchColumn(); if ($v === false) return; $d = json_decode($v, false);
    $suma = ['stock' => [], 'vacios' => (array) ($d->vacios ?? []), 'prestados' => (array) ($d->prestados ?? [])];
    foreach (($d->products ?? []) as $pr) if (isset($pr->id)) { $suma['stock'][$pr->id] = (int) ($pr->stock ?? 0); $pr->stock = 0; }
    if (!sumarLoc($id, $suma, $autor)) return;
    $d->vacios = new stdClass(); $d->prestados = new stdClass();
    $p = db(); $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
    $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
    $p->prepare('UPDATE local_docs SET data = ?, ver = ? WHERE path = ?')->execute([json_encode($d, JSON_UNESCAPED_UNICODE), $ver, 'suc/' . $slug]);
}
// Forma de un archivo (solo nombres de campos, tipos y cantidades; ningún dato) para diagnosticar formatos distintos
function formaArchivo($x, int $prof = 0): string {
    $pad = str_repeat('  ', $prof);
    if (!is_array($x)) return gettype($x) === 'string' ? 'texto' : gettype($x);
    $lista = array_is_list($x);
    if ($lista) { $o = 'lista de ' . count($x); if ($x && $prof < 3) $o .= ', cada uno: ' . formaArchivo($x[0], $prof + 1); return $o; }
    if ($prof >= 3) return 'objeto con ' . count($x) . ' campos';
    $o = "{\n"; $i = 0;
    foreach ($x as $k => $v) {
        $nom = preg_match('/^\d{4}-\d{2}/', (string) $k) ? '[fecha]' : (preg_match('/\d{5,}|@/', (string) $k) ? '[dato]' : (strlen((string) $k) > 30 ? '[clave larga]' : (string) $k));
        if ($i++ >= 25) { $o .= $pad . '  … ' . (count($x) - 25) . " campos más\n"; break; }
        $o .= $pad . '  ' . $nom . ': ' . formaArchivo($v, $prof + 1) . "\n";
    }
    return $o . $pad . '}';
}
// Respaldo del servidor del Venta Local independiente: {app:'MR Sistema Local', tipo:'respaldo-auto|manual', rows:[{path, data}]}
function desdeFilasLocal(array $r): array {
    $filas = []; $us = []; $glob = null;
    foreach ($r['rows'] as $f) {
        if (!is_array($f) || !isset($f['path'])) continue;
        if ($f['path'] === 'app/users') { $us = (array) ($f['data']['list'] ?? []); continue; }
        if ($f['path'] === 'app/global') { $glob = $f['data']; continue; }
        $filas[] = ['path' => (string) $f['path'], 'data' => is_string($f['data'] ?? null) ? $f['data'] : json_encode($f['data'] ?? null, JSON_UNESCAPED_UNICODE)];
    }
    $x = desdeRespaldoMrgas(['tablas' => ['local_docs' => $filas, 'usuarios' => []], 'fecha' => $r['fecha'] ?? null]);
    $x['usuarios'] = array_values(array_filter($us, 'is_array'));
    if (is_array($glob)) $x['global'] = $glob;   // formato antiguo (u, nombre, rol, ps/sucs); la clave no se usa
    return $x;
}
// Convierte un respaldo completo de MR Gas (tablas) al formato de la «base de datos» de Venta Local
function desdeRespaldoMrgas(array $r): array {
    $filas = (array) ($r['tablas']['local_docs'] ?? []); $suc = [];
    $nombres = []; foreach (SUCS_INICIALES as $n) $nombres[slugLocal($n)] = $n; // nombres con tilde si el respaldo no trae la lista
    $glob = null; foreach ($filas as $f) if (($f['path'] ?? '') === 'app/global') $glob = json_decode((string) $f['data'], true);
    foreach ($filas as $f) if (($f['path'] ?? '') === 'app/sucursales') { $d = json_decode((string) $f['data'], true); foreach ((array) ($d['list'] ?? []) as $x) $nombres[slugLocal((string) $x['nombre'])] = (string) $x['nombre']; }
    foreach ($filas as $f) {
        $pth = (string) ($f['path'] ?? ''); if (!preg_match('~^suc/([^/]+)(?:/(ventas|rend|bmovs)/(.+))?$~', $pth, $m)) continue;
        $sl = $m[1]; $nom = $nombres[$sl] ?? ucwords(str_replace('_', ' ', $sl));
        $d = json_decode((string) $f['data'], true); if (!is_array($d)) continue;
        $suc[$nom] = $suc[$nom] ?? ['ventas' => [], 'rend' => [], 'bmovs' => []];
        if (empty($m[2])) $suc[$nom] = array_merge($d, ['ventas' => $suc[$nom]['ventas'], 'rend' => $suc[$nom]['rend'], 'bmovs' => $suc[$nom]['bmovs']]);
        elseif ($m[2] === 'ventas') $suc[$nom]['ventas'] = array_merge($suc[$nom]['ventas'], (array) ($d['list'] ?? []));
        elseif ($m[2] === 'rend') $suc[$nom]['rend'][$m[3]] = $d;
        else $suc[$nom]['bmovs'] = array_merge($suc[$nom]['bmovs'], (array) ($d['list'] ?? []));
    }
    $us = array_map(function ($u) use ($nombres) { $pm = json_decode((string) ($u['permisos'] ?? ''), true);
        $ss = []; foreach ((array) $pm as $k) if (is_string($k) && str_starts_with($k, 'lsuc.')) $ss[] = $nombres[substr($k, 5)] ?? substr($k, 5);
        return ['u' => $u['usuario'] ?? '', 'nombre' => $u['nombre'] ?? '', 'rol' => $u['rol'] ?? '', 'sucs' => $ss]; }, array_filter((array) ($r['tablas']['usuarios'] ?? []), fn($u) => ($u['rol'] ?? '') !== 'chofer'));
    return ['app' => 'MR Sistema Local', 'tipo' => 'respaldo-completo', 'generado' => $r['fecha'] ?? null, 'usuarios' => $us, 'sucursales' => $suc, 'origen' => 'mrgas'] + (is_array($glob) ? ['global' => $glob] : []);
}
function slugLocal(string $s): string {
    $s = strtolower(strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','Á'=>'a','É'=>'e','Í'=>'i','Ó'=>'o','Ú'=>'u','ñ'=>'n','Ñ'=>'n','ü'=>'u','Ü'=>'u']));
    return preg_replace('/\s+/', '_', $s);
}
// Qué documentos puede guardar cada uno (además de lo que la pantalla ya controla)
function puedeGuardar(array $p, string $path): bool {
    if ($p['rol'] === 'admin') return true;
    $per = $p['permisos'] ?? [];
    if (preg_match('~^pres/(.+)$~', $path, $m)) return $m[1] === slugLocal(strtolower($p['user']));
    if (preg_match('~^suc/([^/]+)~', $path, $m)) return in_array('lsuc.' . $m[1], $per, true);
    if ($path === 'app/global') return (bool) array_intersect(['loc.precios', 'loc.com'], $per);
    return false;
}
$marca = fn($v) => str_pad((string) $v, 16, '0', STR_PAD_LEFT); // "updated_at" que se puede comparar como texto

try {
    tablaLocal();
    $a = $_GET['a'] ?? '';
    licExigir(); // servicio pausado por el dueño
    // ---------- Bodegas propias de las sucursales (Control de Bodega del Panel General) ----------
    // Ve una sucursal: el administrador, o quien tenga Control de Bodega y permiso de esa sucursal (lsuc.<sucursal>)
    if ($a === 'bodegas' || $a === 'bodega_ingreso') {
        $u = yo(); if (!$u) salida(['error' => 'Sesión vencida.'], 401);
        $pm = $u['permisos']; $adm = $u['rol'] === 'admin';
        $verBod = $adm || $pm === null || (bool) array_intersect(['bodega', 'bodega:ver', 'compras'], (array) $pm);
        $cargar = $adm || $pm === null || (bool) array_intersect(['bodega', 'compras'], (array) $pm);
        $mia = fn($sl) => $adm || $pm === null || in_array('lsuc.' . $sl, (array) $pm, true);
        $propias = array_values(array_filter(sucursalesLocal(), fn($x) => ($x['activa'] ?? true) !== false && isset($x['bodega']) && $x['bodega'] !== null && (int) $x['bodega'] < 0));
        $LID = ['5' => '5', '11' => '11', '15' => '15', '45' => '45', 'H15A' => 'H'];   // producto → grupo de vacíos
        $leer = function (string $pth) { $st = db()->prepare('SELECT data FROM local_docs WHERE path = ?'); $st->execute([$pth]); $v = $st->fetchColumn(); return $v === false ? null : json_decode((string) $v, true); };
        if ($a === 'bodegas') {
            if (!$verBod) salida(['bodegas' => []]);
            $out = [];
            foreach ($propias as $x) { $sl = slugLocal($x['nombre']); if (!$mia($sl)) continue;
                $d = $leer('suc/' . $sl) ?? []; $ll = []; foreach ((array) ($d['products'] ?? []) as $pr) if (isset($pr['id'])) $ll[(string) $pr['id']] = (int) ($pr['stock'] ?? 0);
                $mv = []; foreach ([date('Y-m'), date('Y-m', strtotime('first day of last month'))] as $mes) foreach ((array) (($leer("suc/$sl/bmovs/$mes") ?? [])['list'] ?? []) as $m)
                    if (is_array($m) && empty($m['anulado']) && ($m['tipo'] ?? '') === 'carga') $mv[] = ['fecha' => $m['fecha'] ?? '', 'hora' => $m['hora'] ?? '', 'usuario' => $m['usuario'] ?? '', 'stock' => $m['d']['stock'] ?? [], 'obs' => $m['obs'] ?? ''];
                usort($mv, fn($p, $q2) => strcmp($q2['fecha'] . $q2['hora'], $p['fecha'] . $p['hora']));
                $out[] = ['nombre' => $x['nombre'], 'slug' => $sl, 'llenos' => (object) $ll, 'vacios' => (object) ($d['vacios'] ?? []), 'prestados' => (object) ($d['prestados'] ?? []),
                    'sinDatos' => !$d, 'ingresos' => array_slice($mv, 0, 8)];
            }
            salida(['bodegas' => $out, 'cargar' => $cargar]);
        }
        // Ingreso de carga en la bodega propia de una sucursal: suma llenos y (si hay canje) descuenta vacíos, como en Venta Local
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') salida(['error' => 'Método no válido.'], 405);
        exigirEncabezado();
        $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $sl = preg_replace('/[^a-z0-9_]/', '', (string) ($b['suc'] ?? ''));
        $x = null; foreach ($propias as $y) if (slugLocal($y['nombre']) === $sl) $x = $y;
        if (!$x) salida(['error' => 'Esa sucursal no tiene bodega propia.'], 400);
        if (!$cargar || !$mia($sl)) salida(['error' => 'No tiene permiso para cargar la bodega de ' . $x['nombre'] . '.'], 403);
        $q2 = []; foreach ((array) ($b['q'] ?? []) as $id => $n) { $n = (int) $n; if ($n > 0 && isset($LID[(string) $id])) $q2[(string) $id] = min($n, 100000); }
        if (!$q2) salida(['error' => 'Escriba cuántos llenos entran.'], 400);
        $canje = !empty($b['canje']); $obs = mb_substr(trim((string) ($b['obs'] ?? '')), 0, 200);
        $p = db(); $p->beginTransaction();
        try {
            $d = $leer('suc/' . $sl);
            if (!$d || empty($d['products'])) { $p->rollBack(); salida(['error' => 'La sucursal todavía no tiene productos. Ábrala una vez en Venta Local.'], 409); }
            $dd = ['stock' => [], 'vac' => [], 'pres' => [], 'carga' => [], 'chofer' => null];
            foreach ($q2 as $id => $n) { $dd['stock'][$id] = $n; if ($canje) $dd['vac'][$LID[$id]] = ($dd['vac'][$LID[$id]] ?? 0) - $n; }
            $d['vacios'] = (array) ($d['vacios'] ?? []);
            foreach ($dd['vac'] as $g => $n) if ((int) ($d['vacios'][$g] ?? 0) + $n < 0) { $p->rollBack(); salida(['error' => 'No hay suficientes vacíos de ' . ($g === 'H' ? 'H15' : $g . ' kg') . ' (hay ' . (int) ($d['vacios'][$g] ?? 0) . '). Desmarque «Entregar vacíos» o corrija el stock en Venta Local.'], 400); }
            foreach ($d['products'] as &$pr) if (isset($dd['stock'][(string) ($pr['id'] ?? '')])) $pr['stock'] = (int) ($pr['stock'] ?? 0) + $dd['stock'][(string) $pr['id']]; unset($pr);
            foreach ($dd['vac'] as $g => $n) $d['vacios'][$g] = (int) ($d['vacios'][$g] ?? 0) + $n;
            $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
            $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
            $put = $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
                : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)');
            $put->execute(['suc/' . $sl, json_encode($d, JSON_UNESCAPED_UNICODE), $ver]);
            $mes = date('Y-m'); $bm = $leer("suc/$sl/bmovs/$mes") ?? ['list' => []];
            $bm['list'][] = ['id' => (int) round(microtime(true) * 1000), 'fecha' => date('Y-m-d'), 'hora' => date('H:i'), 'usuario' => $u['nombre'], 'label' => 'Ingreso de carga', 'd' => $dd,
                'chofer' => '', 'anulado' => false, 'tipo' => 'carga', 'obs' => $obs . ($obs !== '' ? ' · ' : '') . 'desde Panel General'];
            $put->execute(["suc/$sl/bmovs/$mes", json_encode($bm, JSON_UNESCAPED_UNICODE), $ver]);
            $p->commit();
        } catch (Throwable $e) { if ($p->inTransaction()) $p->rollBack(); throw $e; }
        $ll = []; foreach ($d['products'] as $pr) $ll[(string) $pr['id']] = (int) ($pr['stock'] ?? 0);
        salida(['ok' => true, 'llenos' => $ll, 'vacios' => $d['vacios']]);
    }
    if ($a === 'estado') { $q = quien(); salida(['quien' => $q ? ['modo' => $q['modo'], 'perfil' => $q['perfil']] : null, 'sucursales' => sucursalesLocal()]); }
    if ($a === 'clave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $q = quien(); if (!$q) salida(['error' => 'Sesión vencida.'], 401);
        $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $s = db()->prepare('SELECT hash FROM usuarios WHERE uid = ?'); $s->execute([$q['perfil']['uid']]);
        if (!password_verify((string) ($b['actual'] ?? ''), (string) $s->fetchColumn())) salida(['error' => 'Clave actual incorrecta'], 400);
        $n = (string) ($b['nueva'] ?? '');
        if ($e = claveDebil($n)) salida(['error' => $e], 400);
        db()->prepare('UPDATE usuarios SET hash = ? WHERE uid = ?')->execute([hashClave($n), $q['perfil']['uid']]);
        salida(['ok' => true]);
    }

    $q = quien();
    if (!$q) salida(['error' => 'Inicie sesión en el Panel General.'], 401);
    // ---- Precios de Venta Local manejados desde el Panel General (solo administrador) ----
    if ($a === 'leer') { // documentos puntuales: ?paths=app/global,suc/cervantes
        $ps = array_slice(array_filter(explode(',', (string) ($_GET['paths'] ?? ''))), 0, 20);
        $out = [];
        foreach ($ps as $pth) {
            if ($pth === 'app/users') continue;
            $st = db()->prepare('SELECT data FROM local_docs WHERE path = ?'); $st->execute([$pth]);
            $v = $st->fetchColumn(); $out[$pth] = $v === false ? null : json_decode($v);
        }
        salida(['docs' => $out]);
    }
    if ($a === 'sucursales' && $_SERVER['REQUEST_METHOD'] === 'GET') salida(['list' => sucursalesLocal()]);
    if ($a === 'sucursales' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($q['perfil']['rol'] !== 'admin') salida(['error' => 'Solo el administrador puede cambiar las sucursales.'], 403);
        $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $ant = array_column(sucursalesLocal(), null, 'nombre');
        $l = []; $vistos = [];
        foreach ((array) ($b['list'] ?? []) as $x) {
            $n = trim(preg_replace('/\s+/u', ' ', (string) ($x['nombre'] ?? '')));
            if ($n === '' || mb_strlen($n) > 40 || !preg_match('/^[\p{L}\p{N} -]+$/u', $n)) salida(['error' => 'Nombre de sucursal no válido: «' . $n . '». Use solo letras, números, espacios o guion.'], 400);
            $k = slugLocal($n);
            if (isset($vistos[$k])) salida(['error' => 'La sucursal «' . $n . '» está repetida.'], 400);
            $vistos[$k] = 1;
            $l[] = ['nombre' => $n, 'indep' => !empty($x['indep']), 'activa' => !array_key_exists('activa', $x) || !empty($x['activa']), 'bodega' => isset($x['bodega']) && $x['bodega'] !== '' && $x['bodega'] !== null ? (int) $x['bodega'] : null];
        }
        // Sucursales eliminadas: si tienen datos, hay que confirmar escribiendo el nombre (se borran sus ventas, rendiciones y bodega)
        $confirmadas = array_map('slugLocal', (array) ($b['borrar'] ?? []));
        $aBorrar = [];
        foreach ($ant as $n => $x) {
            $k = slugLocal((string) $n); if (isset($vistos[$k])) continue;
            $st = db()->prepare("SELECT COUNT(*) FROM local_docs WHERE path = ? OR path LIKE ?"); $st->execute(['suc/' . $k, 'suc/' . $k . '/%']);
            $hay = (int) $st->fetchColumn();
            if ($hay && !in_array($k, $confirmadas, true)) salida(['error' => '«' . $n . '» tiene datos guardados (ventas, rendiciones o stock). Confirme escribiendo su nombre.', 'confirmar' => $n], 409);
            $aBorrar[] = $k;
        }
        if (!array_filter($l, fn($x) => $x['activa'])) salida(['error' => 'Debe quedar al menos una sucursal activa.'], 400);
        $p = db(); $p->beginTransaction();
        $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
        $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
        $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
            : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)')->execute(['app/sucursales', json_encode(['list' => $l], JSON_UNESCAPED_UNICODE), $ver]);
        foreach ($aBorrar as $k) $p->prepare("DELETE FROM local_docs WHERE path = ? OR path LIKE ?")->execute(['suc/' . $k, 'suc/' . $k . '/%']);
        // al unir una sucursal a la bodega de la matriz, su stock se suma a la matriz (una sola bodega)
        foreach ($l as $x) {
            $antes = $ant[$x['nombre']]['bodega'] ?? null;
            if ($x['bodega'] !== null && $x['bodega'] > 0 && $antes !== null && (int) $antes < 0) unirBodega(slugLocal($x['nombre']), $x['bodega'], (int) $q['perfil']['uid']);
        }
        $p->commit();
        salida(['ok' => true, 'list' => $l, 'borradas' => $aBorrar]);
    }
    // Importar la «base de datos» descargada de otro Venta Local (MR Sistema Local, respaldo-completo .json)
    // ?ver=1 → solo revisa el archivo y muestra qué se importaría. Sin ?ver → importa (antes hace un respaldo).
    if ($a === 'importar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $q0 = quien(); if (!$q0 || $q0['perfil']['rol'] !== 'admin') salida(['error' => 'Solo el administrador puede importar.'], 403);
        $tr = (int) ($_SESSION['resp_cfg'] ?? 0);
        if (!$tr || time() - $tr > 1800) salida(['error' => 'Por seguridad, ingrese su contraseña en Respaldos y reset.', 'bloqueado' => true], 423);
        $_SESSION['resp_cfg'] = time();
        @set_time_limit(600); @ini_set('memory_limit', '512M');
        $fa = $_FILES['archivo'] ?? null;
        if (!$fa || ($fa['error'] ?? 4) !== UPLOAD_ERR_OK) {
            $lim = ini_get('upload_max_filesize');
            salida(['error' => in_array($fa['error'] ?? 0, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || (!$fa && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0)
                ? "El archivo es más grande que lo que acepta el servidor ($lim). En Hostinger → Avanzado → Configuración de PHP, suba «upload_max_filesize» y «post_max_size»."
                : 'No llegó el archivo. Vuelva a elegirlo.'], 400);
        }
        $txt = (string) file_get_contents($fa['tmp_name']);
        $ini = bin2hex(substr($txt, 0, 4)); $gz = strncmp($txt, "\x1f\x8b", 2) === 0;
        if (strncmp($txt, "\x1f\x8b", 2) === 0) $txt = (string) @gzdecode($txt);   // la pantalla lo manda comprimido
        $sinJson = null;
        $j = json_decode($txt, true);
        if ($j === null) $sinJson = 'No es JSON · ' . number_format(strlen($txt)) . ' bytes' . ($gz ? ' · venía comprimido (gz)' : '') . ' · empieza con ' . $ini . ($txt !== '' && ctype_print(substr($txt, 0, 1)) ? ' («' . preg_replace('/[^A-Za-z{}\[\]<":]/', '', substr($txt, 0, 6)) . '»)' : '');
        unset($txt);
        // También sirve un respaldo completo de otra instalación de MR Gas (Respaldos y reset → Descargar): se toma su Venta Local
        if (is_array($j) && ($j['app'] ?? '') === 'mrgas' && is_array($j['tablas'] ?? null)) $j = desdeRespaldoMrgas($j);
        // y el respaldo del servidor del Venta Local independiente (mr-auto / mr-manual: filas path + data)
        if (is_array($j) && ($j['app'] ?? '') === 'MR Sistema Local' && is_array($j['rows'] ?? null)) $j = desdeFilasLocal($j);
        if (!is_array($j) || !is_array($j['sucursales'] ?? null) || ($j['tipo'] ?? '') !== 'respaldo-completo')
            salida(['error' => 'Este archivo no se puede importar. Sirve: (1) la «base de datos» del Venta Local antiguo (Informes → Descargar base de datos, .json), (2) un respaldo del servidor del Venta Local (mr-auto / mr-manual .json.gz) o (3) un respaldo de otro MR Gas (mrgas-… .json.gz).',
                'forma' => $j === null ? $sinJson : formaArchivo($j)], 400);
        if (!$j['sucursales']) salida(['error' => 'El respaldo no trae datos de Venta Local (ninguna sucursal con ventas).'], 400);
        $RK = ['efectivo','vuelto','vales','valesCil','cheques','transf','descuentos','qr','gastos','transbank','cargos','petroleo'];
        $existentes = []; foreach (sucursalesLocal() as $x) $existentes[slugLocal($x['nombre'])] = $x['nombre'];
        $conDatos = function (string $sl) { $st = db()->prepare("SELECT COUNT(*) FROM local_docs WHERE path LIKE ?"); $st->execute(['suc/' . $sl . '/%']); return (int) $st->fetchColumn() > 0; };
        $limpio = fn($n) => trim(mb_substr(preg_replace('/\s+/u', ' ', preg_replace('/[^\p{L}\p{N} -]/u', '', (string) $n)), 0, 40));
        // resumen de cada sucursal del archivo
        $res = [];
        foreach ($j['sucursales'] as $nom => $d) {
            if (!is_array($d)) continue;
            $v = array_values(array_filter((array) ($d['ventas'] ?? []), 'is_array'));
            $fe = array_filter(array_map(fn($x) => (string) ($x['fecha'] ?? ''), $v));
            $nl = $limpio($nom); $sl = slugLocal($nl);
            $choca = isset($existentes[$sl]) && $conDatos($sl);
            $sug = $nl; if ($choca) { $i = 2; while (isset($existentes[slugLocal($nl . ' ' . $i)])) $i++; $sug = $nl . ' ' . $i; }
            $res[] = ['archivo' => (string) $nom, 'ventas' => count($v), 'desde' => $fe ? min($fe) : null, 'hasta' => $fe ? max($fe) : null,
                'rend' => count(array_filter((array) ($d['rend'] ?? []), fn($r) => is_array($r) && (!empty($r['obs']) || array_filter($RK, fn($k) => !empty($r[$k]))))),
                'existe' => isset($existentes[$sl]), 'conDatos' => $choca, 'destino' => $sug];
        }
        $usuarios = array_map(fn($u) => ['nombre' => (string) ($u['nombre'] ?? ''), 'usuario' => (string) ($u['u'] ?? ''), 'rol' => (string) ($u['rol'] ?? ''), 'sucursales' => ($u['rol'] ?? '') === 'admin' ? ['todas'] : (is_array($u['ps'] ?? null) ? array_keys(array_filter($u['ps'], fn($x) => is_array($x) && $x)) : ((array) ($u['sucs'] ?? []) ?: ['todas']))], array_filter((array) ($j['usuarios'] ?? []), 'is_array'));
        if (!empty($_GET['ver'])) salida(['ok' => true, 'sucursales' => $res, 'usuarios' => $usuarios, 'fecha' => $j['generado'] ?? null, 'global' => is_array($j['global'] ?? null)]);
        // importar
        $mapa = json_decode((string) ($_POST['mapa'] ?? '{}'), true) ?: [];
        $plan = [];
        foreach ($res as $r) {
            $dest = $mapa[$r['archivo']] ?? null; if ($dest === null || $dest === '') continue; // omitida
            $dn = $limpio($dest); $ds = slugLocal($dn);
            if ($dn === '') salida(['error' => 'Falta el nombre de destino de «' . $r['archivo'] . '».'], 400);
            if ($conDatos($ds)) salida(['error' => '«' . $dn . '» ya tiene datos. Elija otro nombre para no mezclarlos.', 'choca' => $r['archivo']], 409);
            foreach ($plan as $pp) if ($pp['slug'] === $ds) salida(['error' => 'Dos sucursales van al mismo nombre «' . $dn . '».'], 400);
            $plan[] = ['archivo' => $r['archivo'], 'nombre' => $dn, 'slug' => $ds];
        }
        $conGlobal = !empty($_POST['global']) && is_array($j['global'] ?? null);
        if (!$plan && !$conGlobal) salida(['error' => 'No eligió ninguna sucursal para importar.'], 400);
        $resp = crearRespaldo(dirRespaldos() . '/' . nombreRespaldo('manual'), $q0['perfil']['nombre'] . ' (antes de importar)');
        $p = db(); $p->beginTransaction();
        try {
            $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
            $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
            $put = $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
                : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)');
            $js = fn($x) => json_encode($x, JSON_UNESCAPED_UNICODE);
            $lista = sucursalesLocal(); $tot = ['ventas' => 0, 'docs' => 0];
            foreach ($plan as $pl) {
                $d = $j['sucursales'][$pl['archivo']]; $sl = $pl['slug'];
                $core = $d; foreach (['ventas', 'rend', 'bmovs', 'movs'] as $k) unset($core[$k]);
                $put->execute(['suc/' . $sl, $js((object) $core), $ver]); $tot['docs']++;
                $vg = []; foreach ((array) ($d['ventas'] ?? []) as $v) if (is_array($v) && !empty($v['fecha'])) $vg[(string) $v['fecha']][] = $v;
                foreach ($vg as $f => $l) { $put->execute(["suc/$sl/ventas/$f", $js(['list' => $l]), $ver]); $tot['docs']++; $tot['ventas'] += count($l); }
                foreach ((array) ($d['rend'] ?? []) as $f => $R) if (is_array($R) && (!empty($R['obs']) || array_filter($RK, fn($k) => !empty($R[$k])))) { $put->execute(["suc/$sl/rend/$f", $js($R), $ver]); $tot['docs']++; }
                $bg = []; foreach ((array) ($d['bmovs'] ?? []) as $m) if (is_array($m)) $bg[substr((string) ($m['fecha'] ?? date('Y-m-d')), 0, 7)][] = $m;
                foreach ($bg as $k => $l) { $put->execute(["suc/$sl/bmovs/$k", $js(['list' => $l]), $ver]); $tot['docs']++; }
                $esta = false; foreach ($lista as &$x) if (slugLocal($x['nombre']) === $sl) { $x['activa'] = true; $esta = true; } unset($x);
                if (!$esta) $lista[] = ['nombre' => $pl['nombre'], 'indep' => false, 'activa' => true, 'bodega' => -1]; // con su propia bodega (su stock importado)
            }
            $put->execute(['app/sucursales', $js(['list' => $lista]), $ver]);
            if ($conGlobal) $put->execute(['app/global', $js((object) $j['global']), $ver]); // precios, comisiones, QR y mayoristas
            $p->commit();
        } catch (Throwable $e) { $p->rollBack(); throw $e; }
        salida(['ok' => true, 'global' => $conGlobal, 'importadas' => array_column($plan, 'nombre'), 'ventas' => $tot['ventas'], 'docs' => $tot['docs'], 'respaldo' => $resp['archivo']]);
    }
    // Bodega compartida con la matriz: leer el stock y aplicar los cambios de las ventas del local
    if ($a === 'bodega') {
        $slug = preg_replace('/[^a-z0-9_]/', '', (string) ($_GET['suc'] ?? ''));
        $bid = bodegaDe($slug);
        if ($bid === null) salida(['bodega' => null]);
        if ($q['perfil']['rol'] !== 'admin' && !in_array('lsuc.' . $slug, $q['perfil']['permisos'] ?? [], true)) salida(['error' => 'Sin permiso para esta sucursal.'], 403);
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
            $p = db(); $p->beginTransaction(); $o = sumarLoc($bid, $b, (int) $q['perfil']['uid']); $p->commit();
        } else { $l = leerLoc($bid); $o = $l ? (isset($l['obj']->v) && is_object($l['obj']->v) ? $l['obj']->v : $l['obj']) : null; }
        if (!$o) salida(['error' => 'No se encontró la bodega de la matriz.'], 404);
        $out = ['bodega' => $bid, 'nombre' => $o->nombre ?? '', 'stock' => [], 'vacios' => [], 'prestados' => []];
        foreach (LMAP as $lid => $mid) foreach (['stock', 'vacios', 'prestados'] as $k) $out[$k][$lid] = (int) ($o->$k->$mid ?? 0);
        salida($out);
    }
    // Resumen para Informes del Panel General: ventas del local por día (sin anuladas)
    if ($a === 'resumen') {
        $d1 = preg_replace('/[^0-9-]/', '', (string) ($_GET['desde'] ?? '')); $d2 = preg_replace('/[^0-9-]/', '', (string) ($_GET['hasta'] ?? ''));
        $st = db()->prepare("SELECT path, data FROM local_docs WHERE path LIKE 'suc/%/ventas/%'"); $st->execute();
        $out = [];
        foreach ($st as $r) {
            $f = substr($r['path'], strrpos($r['path'], '/') + 1);
            if ($f < $d1 || $f > $d2) continue;
            $suc = explode('/', $r['path'])[1];
            $d = json_decode($r['data'], true);
            foreach (($d['list'] ?? []) as $v) {
                if (!empty($v['anulada'])) continue;
                $o = &$out[$f]; $o['total'] = ($o['total'] ?? 0) + (int) ($v['total'] ?? 0); $o['n'] = ($o['n'] ?? 0) + 1;
                foreach (($v['items'] ?? []) as $id => $q) { $o['cil'][$id] = ($o['cil'][$id] ?? 0) + (int) $q; $o['mon'][$id] = ($o['mon'][$id] ?? 0) + (int) $q * (int) ($v['precios'][$id] ?? 0); }
                foreach (($v['env'] ?? []) as $id => $q) { $o['env'] = ($o['env'] ?? 0) + (int) $q * (int) ($v['penv'][$id] ?? 0); $o['envn'] = ($o['envn'] ?? 0) + (int) $q; }
                $o['desc'] = ($o['desc'] ?? 0) + (int) ($v['desc'] ?? 0);
                $o['suc'][$suc] = ($o['suc'][$suc] ?? 0) + (int) ($v['total'] ?? 0);
                foreach (($v['items'] ?? []) as $id => $q) $o['scil'][$suc][$id] = ($o['scil'][$suc][$id] ?? 0) + (int) $q; unset($o);
            }
        }
        $st = db()->prepare("SELECT path, data FROM local_docs WHERE path LIKE 'suc/%/rend/%'"); $st->execute();
        foreach ($st as $r) {
            $f = substr(substr($r['path'], strrpos($r['path'], '/') + 1), 0, 10);
            if ($f < $d1 || $f > $d2) continue;
            $suc = explode('/', $r['path'])[1];
            $d = json_decode($r['data'], true);
            $o = &$out[$f]; $o['rend'] = ($o['rend'] ?? 0) + (int) ($d['_r'] ?? 0); $o['carg'] = ($o['carg'] ?? 0) + (int) ($d['_c'] ?? 0);
            $o['srend'][$suc] = ($o['srend'][$suc] ?? 0) + (int) ($d['_r'] ?? 0); $o['scarg'][$suc] = ($o['scarg'][$suc] ?? 0) + (int) ($d['_c'] ?? 0); unset($o);
        }
        $nom = []; foreach (sucursalesLocal() as $x) $nom[slugLocal((string) $x['nombre'])] = $x['nombre'];
        salida(['dias' => $out, 'sucs' => $nom]);
    }
    if ($a === 'precios' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($q['perfil']['rol'] !== 'admin') salida(['error' => 'Solo el administrador puede cambiar precios de Venta Local.'], 403);
        $b = json_decode(file_get_contents('php://input') ?: '{}', false);
        $quien = $q['perfil']['nombre']; $hoy = date('Y-m-d'); $hora = date('H:i:s');
        $p = db(); $p->beginTransaction();
        $leer = function (string $pth) use ($p) { $st = $p->prepare('SELECT data FROM local_docs WHERE path = ?'); $st->execute([$pth]); $v = $st->fetchColumn(); return $v === false ? null : json_decode($v); };
        $grabar = function (string $pth, $data) use ($p) {
            $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
            $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
            $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
                : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)')->execute([$pth, json_encode($data, JSON_UNESCAPED_UNICODE), $ver]);
        };
        $hist = []; // [prod, campo, antes, despues]
        if (isset($b->global) && is_object($b->global)) {
            $g = $leer('app/global') ?? new stdClass();
            foreach (['mayor', 'comision', 'qr'] as $k) if (isset($b->global->$k)) {
                if ($k === 'mayor') { $g->mayor = $g->mayor ?? new stdClass();
                    foreach ($b->global->mayor as $id => $v) { $ant = (int) ($g->mayor->$id ?? 0); if ($ant !== (int) $v) { $hist[] = ['g', $id, 'mayor', $ant, (int) $v]; $g->mayor->$id = (int) $v; } } }
                else $g->$k = $b->global->$k;
            }
            $g->hist = $g->hist ?? [];
            foreach ($hist as $h) $g->hist[] = ['fecha' => $hoy, 'hora' => $hora, 'usuario' => $quien . ' (Matriz)', 'prod' => $h[1] === 'H15A' ? 'H15' : $h[1] . ' kg', 'campo' => $h[2], 'antes' => $h[3], 'despues' => $h[4], 'suc' => 'Matriz'];
            $g->hist = array_slice($g->hist, -500); $g->t = (int) round(microtime(true) * 1000);
            $grabar('app/global', $g);
        }
        foreach ((array) ($b->sucs ?? []) as $slug => $cam) {
            if (!preg_match('/^[a-z0-9_]+$/', (string) $slug)) continue;
            $pth = 'suc/' . $slug; $d = $leer($pth) ?? new stdClass();
            $d->products = $d->products ?? [];
            $d->phist = $d->phist ?? [];
            foreach (['venta', 'envase', 'mayor'] as $campo) foreach ((array) ($cam->$campo ?? []) as $id => $v) {
                $pr = null; foreach ($d->products as $x) if (($x->id ?? '') === (string) $id) $pr = $x;
                if (!$pr) { $pr = (object) ['id' => (string) $id]; $d->products[] = $pr; }
                $ant = (int) ($pr->$campo ?? 0);
                if ($ant !== (int) $v) { $pr->$campo = (int) $v; $d->phist[] = ['fecha' => $hoy, 'hora' => $hora, 'usuario' => $quien . ' (Matriz)', 'prod' => $id === 'H15A' ? 'H15' : $id . ' kg', 'campo' => $campo, 'antes' => $ant, 'despues' => (int) $v]; }
            }
            foreach (['comision', 'qr'] as $k) if (isset($cam->$k)) $d->$k = $cam->$k;
            $grabar($pth, $d);
        }
        $p->commit();
        salida(['ok' => true]);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) salida(['error' => 'Solicitud no válida.'], 400);
        $raw = file_get_contents('php://input') ?: '';
        if (strlen($raw) > 6000000) salida(['error' => 'Documento muy grande.'], 413);
        $b = json_decode($raw, false);
        $path = is_object($b) ? (string) ($b->path ?? '') : '';
        if (!preg_match('~^[a-z0-9_]+(/[a-z0-9_.\-]+){1,3}$~i', $path) || strlen($path) > 190 || !property_exists($b, 'data')) salida(['error' => 'Ruta no válida.'], 400);
        if ($path === 'app/users') salida(['ok' => true]); // los usuarios ahora viven en el Panel General
        if (!puedeGuardar($q['perfil'], $path)) salida(['error' => 'Sin permiso para guardar esto.'], 403);
        $json = json_encode($b->data, JSON_UNESCAPED_UNICODE);
        $p = db(); $p->beginTransaction();
        $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
        $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
        $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
            : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)')->execute([$path, $json, $ver]);
        $p->commit();
        salida(['ok' => true, 'updated_at' => $marca($ver)]);
    }
    $desde = (int) ltrim((string) ($_GET['since'] ?? '0'), '0');
    // ?suc=slug: solo los datos de esa sucursal (más rápido); de las otras va solo su ficha
    $sq = preg_replace('/[^a-z0-9_]/', '', (string) ($_GET['suc'] ?? ''));
    $filtro = $sq !== '' ? " AND (path NOT LIKE 'suc/%' OR path NOT LIKE 'suc/%/%' OR path LIKE ?)" : '';
    $s = db()->prepare("SELECT path, data, ver FROM local_docs WHERE ver > ? AND path <> 'app/users'$filtro ORDER BY ver");
    $s->execute($sq !== '' ? [$desde, 'suc/' . $sq . '/%'] : [$desde]);
    $rows = [];
    foreach ($s as $r) $rows[] = ['path' => $r['path'], 'data' => json_decode($r['data']), 'updated_at' => $marca($r['ver'])];
    $cn = db()->prepare("SELECT COUNT(*) FROM local_docs WHERE path <> 'app/users'$filtro"); $cn->execute($sq !== '' ? ['suc/' . $sq . '/%'] : []);
    $n = (int) $cn->fetchColumn();
    salida(['rows' => $rows, 'n' => $n]);
} catch (Throwable $e) {
    error_log('MR Gas local: ' . $e->getMessage());
    salida(['error' => 'Error del servidor.'], 500);
}

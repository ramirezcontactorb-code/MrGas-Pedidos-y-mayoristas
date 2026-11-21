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

<?php
// MR Gas · ERP Local dentro del ERP Matriz.
// Guarda los datos del ERP Local en la misma base de datos MySQL (tabla local_docs).
// Pueden entrar los usuarios del ERP Matriz que son administradores o tienen el permiso «ERP Local».
// Los permisos de cada sección y sucursal del ERP Local se dan en ERP Matriz → Configuraciones → Usuarios.
declare(strict_types=1);
require dirname(__DIR__, 2) . '/api/nucleo.php';
require dirname(__DIR__, 2) . '/api/push.php';
require dirname(__DIR__, 2) . '/api/diaria.php';
date_default_timezone_set('America/Santiago');
iniciarSesion();

function tablaLocal(): void {
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS local_docs (path VARCHAR(190) NOT NULL PRIMARY KEY, data MEDIUMTEXT NOT NULL, ver BIGINT NOT NULL)$motor");
    try { db()->exec('CREATE INDEX idx_local_ver ON local_docs (ver)'); } catch (Throwable $e) {}
    db()->exec(esSqlite() ? "INSERT OR IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)" : "INSERT IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)");
    db()->exec("DELETE FROM local_docs WHERE path = 'app/users'");
}
// Los usuarios del ERP Local son los mismos del ERP Matriz (tabla usuarios, claves cifradas).
// Permisos guardados en el usuario: «app.local», «loc.<permiso>» y «lsuc.<sucursal>».
function puedeLocalU(array $p): bool {
    if ($p['rol'] === 'chofer' || !$p['activo']) return false;
    return $p['rol'] === 'admin' || (is_array($p['permisos']) && in_array('app.local', $p['permisos'], true));
}
function quien(): ?array {
    $m = yo();
    if ($m && puedeLocalU($m)) return ['modo' => 'matriz', 'perfil' => $m];
    if (!empty($_SESSION['local_uid'])) {
        if (time() - (int) ($_SESSION['local_uso'] ?? time()) > OFICINA_INACTIVA) { unset($_SESSION['local_uid']); return null; }
        $s = db()->prepare('SELECT * FROM usuarios WHERE uid = ?'); $s->execute([(int) $_SESSION['local_uid']]);
        $u = $s->fetch();
        if (!$u || !puedeLocalU(perfilDe($u))) { unset($_SESSION['local_uid']); return null; }
        $_SESSION['local_uso'] = time();
        return ['modo' => 'local', 'perfil' => perfilDe($u)];
    }
    return null;
}
// Sucursales del ERP Local: se configuran desde el ERP Matriz (documento app/sucursales)
const SUCS_INICIALES = ['Cervantes', 'El Tranque', 'Maipo', 'Padre Damián', 'Olivos', 'Jr Coyhaique', 'Jr Parcelas', 'Chillán'];
function sucursalesLocal(): array {
    $st = db()->prepare("SELECT data FROM local_docs WHERE path = 'app/sucursales'"); $st->execute();
    $d = json_decode((string) $st->fetchColumn(), true);
    if (is_array($d['list'] ?? null) && $d['list']) return $d['list'];
    return array_map(fn($n) => ['nombre' => $n, 'indep' => $n === 'Chillán', 'activa' => true], SUCS_INICIALES);
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
    if ($a === 'estado') { $q = quien(); salida(['quien' => $q ? ['modo' => $q['modo'], 'perfil' => $q['perfil']] : null, 'sucursales' => sucursalesLocal()]); }
    if ($a === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        limitar('local', 8, 900);
        $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $usr = strtolower(trim((string) ($b['user'] ?? '')));
        limitarUsuario($usr, 10, 1800);
        $s = db()->prepare('SELECT * FROM usuarios WHERE usuario = ?'); $s->execute([$usr]); $u = $s->fetch();
        $ok = $u && !esDiaria($u) && password_verify((string) ($b['pass'] ?? ''), $u['hash']);
        if (!$ok) { anotarIntento('local'); anotarIntentoUsuario($usr); salida(['error' => 'Usuario o contraseña incorrectos'], 401); }
        if (!puedeLocalU(perfilDe($u))) salida(['error' => $u['activo'] ? 'Su usuario no tiene permiso para el ERP Local. Pídalo al administrador.' : 'Este usuario está desactivado.'], 403);
        session_regenerate_id(true);
        $_SESSION['local_uid'] = (int) $u['uid']; $_SESSION['local_uso'] = time();
        db()->prepare('DELETE FROM intentos WHERE ip = ? AND tipo = ?')->execute([substr('u:' . $usr, 0, 45), 'login-u']);
        salida(['ok' => true]);
    }
    if ($a === 'salir') { unset($_SESSION['local_uid'], $_SESSION['local_uso']); salida(['ok' => true]); }
    if ($a === 'clave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $q = quien(); if (!$q) salida(['error' => 'Sesión vencida.'], 401);
        $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $s = db()->prepare('SELECT hash FROM usuarios WHERE uid = ?'); $s->execute([$q['perfil']['uid']]);
        if (!password_verify((string) ($b['actual'] ?? ''), (string) $s->fetchColumn())) salida(['error' => 'Clave actual incorrecta'], 400);
        $n = (string) ($b['nueva'] ?? '');
        if (strlen($n) < 4) salida(['error' => 'La clave nueva debe tener al menos 4 caracteres'], 400);
        db()->prepare('UPDATE usuarios SET hash = ? WHERE uid = ?')->execute([password_hash($n, PASSWORD_DEFAULT), $q['perfil']['uid']]);
        salida(['ok' => true]);
    }

    $q = quien();
    if (!$q) salida(['error' => 'Inicie sesión en el ERP Local.'], 401);
    // ---- Precios del ERP Local manejados desde el ERP Matriz (solo administrador) ----
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
            $l[] = ['nombre' => $n, 'indep' => !empty($x['indep']), 'activa' => !array_key_exists('activa', $x) || !empty($x['activa'])];
        }
        foreach ($ant as $n => $x) if (!isset($vistos[slugLocal($n)])) salida(['error' => 'No se puede borrar «' . $n . '» porque puede tener datos. Desactívela.'], 400);
        if (!array_filter($l, fn($x) => $x['activa'])) salida(['error' => 'Debe quedar al menos una sucursal activa.'], 400);
        $p = db(); $p->beginTransaction();
        $p->exec("UPDATE contadores SET valor = valor + 1 WHERE nombre = 'local'");
        $ver = (int) $p->query("SELECT valor FROM contadores WHERE nombre = 'local'")->fetchColumn();
        $p->prepare(esSqlite() ? 'INSERT OR REPLACE INTO local_docs (path, data, ver) VALUES (?, ?, ?)'
            : 'INSERT INTO local_docs (path, data, ver) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = VALUES(ver)')->execute(['app/sucursales', json_encode(['list' => $l], JSON_UNESCAPED_UNICODE), $ver]);
        $p->commit();
        salida(['ok' => true, 'list' => $l]);
    }
    if ($a === 'precios' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($q['perfil']['rol'] !== 'admin') salida(['error' => 'Solo el administrador puede cambiar precios del ERP Local.'], 403);
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
        if ($path === 'app/users') salida(['ok' => true]); // los usuarios ahora viven en el ERP Matriz
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
    $s = db()->prepare("SELECT path, data, ver FROM local_docs WHERE ver > ? AND path <> 'app/users' ORDER BY ver");
    $s->execute([$desde]);
    $rows = [];
    foreach ($s as $r) $rows[] = ['path' => $r['path'], 'data' => json_decode($r['data']), 'updated_at' => $marca($r['ver'])];
    salida(['rows' => $rows]);
} catch (Throwable $e) {
    error_log('MR Gas local: ' . $e->getMessage());
    salida(['error' => 'Error del servidor.'], 500);
}

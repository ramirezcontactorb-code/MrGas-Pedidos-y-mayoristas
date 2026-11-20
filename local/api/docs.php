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
function slugLocal(string $s): string {
    $s = strtolower(strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','Á'=>'a','É'=>'e','Í'=>'i','Ó'=>'o','Ú'=>'u','ñ'=>'n','Ñ'=>'n']));
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
    if ($a === 'estado') { $q = quien(); salida(['quien' => $q ? ['modo' => $q['modo'], 'perfil' => $q['perfil']] : null]); }
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

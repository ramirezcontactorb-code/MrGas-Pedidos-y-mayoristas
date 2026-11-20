<?php
// MR Gas · ERP Local dentro del ERP Matriz.
// Guarda los datos del ERP Local en la misma base de datos MySQL (tabla local_docs).
// Solo entra quien inició sesión en MR Gas y es administrador o tiene el permiso «ERP Local».
declare(strict_types=1);
require dirname(__DIR__, 2) . '/api/nucleo.php';
require dirname(__DIR__, 2) . '/api/push.php';
require dirname(__DIR__, 2) . '/api/diaria.php';
date_default_timezone_set('America/Santiago');
iniciarSesion();

function puedeLocal(?array $u): bool {
    if (!$u || $u['rol'] === 'chofer') return false;
    return $u['rol'] === 'admin' || (is_array($u['permisos']) && in_array('app.local', $u['permisos'], true));
}
function tablaLocal(): void {
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS local_docs (path VARCHAR(190) NOT NULL PRIMARY KEY, data MEDIUMTEXT NOT NULL, ver BIGINT NOT NULL)$motor");
    try { db()->exec('CREATE INDEX idx_local_ver ON local_docs (ver)'); } catch (Throwable $e) {}
    db()->exec(esSqlite() ? "INSERT OR IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)" : "INSERT IGNORE INTO contadores (nombre, valor) VALUES ('local', 0)");
}
$marca = fn($v) => str_pad((string) $v, 16, '0', STR_PAD_LEFT); // "updated_at" que se puede comparar como texto

try {
    $u = yo();
    if (!$u) salida(['error' => 'Inicie sesión en el ERP Matriz.'], 401);
    if (!puedeLocal($u)) salida(['error' => 'Su usuario no tiene permiso para el ERP Local.'], 403);
    tablaLocal();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) salida(['error' => 'Solicitud no válida.'], 400);
        $raw = file_get_contents('php://input') ?: '';
        if (strlen($raw) > 6000000) salida(['error' => 'Documento muy grande.'], 413);
        $b = json_decode($raw, false);
        $path = is_object($b) ? (string) ($b->path ?? '') : '';
        if (!preg_match('~^[a-z0-9_]+(/[a-z0-9_.\-]+){1,3}$~i', $path) || strlen($path) > 190 || !property_exists($b, 'data')) salida(['error' => 'Ruta no válida.'], 400);
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
    $s = db()->prepare('SELECT path, data, ver FROM local_docs WHERE ver > ? ORDER BY ver');
    $s->execute([$desde]);
    $rows = [];
    foreach ($s as $r) $rows[] = ['path' => $r['path'], 'data' => json_decode($r['data']), 'updated_at' => $marca($r['ver'])];
    salida(['rows' => $rows]);
} catch (Throwable $e) {
    error_log('MR Gas local: ' . $e->getMessage());
    salida(['error' => 'Error del servidor.'], 500);
}

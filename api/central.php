<?php
// MR Gas · PANEL DEL DUEÑO (solo en la instalación del dueño: mrgas-config.php con 'dueno' => true).
// Guarda los clientes que arriendan el sistema, recibe el aviso de cada instalación
// (versión, usuarios, último respaldo) y le responde si el servicio está activo o pausado.
declare(strict_types=1);
require __DIR__ . '/nucleo.php';
date_default_timezone_set('America/Santiago');
if (empty(cfg()['dueno'])) { http_response_code(404); exit; }
iniciarSesion();

function tablaLicencias(): void {
    $auto = esSqlite() ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS licencias (id $auto, nombre VARCHAR(120) NOT NULL, hash CHAR(64) NOT NULL, estado VARCHAR(10) NOT NULL DEFAULT 'activo',
        pago_hasta VARCHAR(10) NULL, nota TEXT NULL, mensaje VARCHAR(300) NULL, sitio VARCHAR(190) NULL, version VARCHAR(20) NULL, usuarios INT NULL,
        ultimo_respaldo VARCHAR(20) NULL, drive TINYINT NULL, contacto INT NULL, creado INT NOT NULL)$motor");
}
// Días de gracia después de la fecha de pago antes de pausar solo (0 = nunca pausa solo)
function gracia(): int { return max(0, (int) (cfg()['dueno_gracia'] ?? 7)); }
function estadoReal(array $l): string {
    if ($l['estado'] === 'pausado') return 'pausado';
    $g = gracia();
    if ($g > 0 && !empty($l['pago_hasta']) && date('Y-m-d') > date('Y-m-d', strtotime($l['pago_hasta'] . " +$g days"))) return 'pausado';
    return 'activo';
}
function nuevaClave(): string { return 'mrg_' . bin2hex(random_bytes(20)); }
function fecha(?string $f): ?string { $f = trim((string) $f); return preg_match('/^\d{4}-\d{2}-\d{2}$/', $f) ? $f : null; }

$a = $_GET['a'] ?? '';
try {
    tablaLicencias();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') exigirEncabezado();
    switch ($a) {
    // Cada instalación de cliente llama aquí (servidor a servidor)
    case 'reporte': {
        limitar('licencia', 120, 3600);
        $clave = (string) ($_SERVER['HTTP_X_LICENCIA'] ?? '');
        $st = db()->prepare('SELECT * FROM licencias WHERE hash = ?'); $st->execute([hash('sha256', $clave)]); $l = $st->fetch();
        if (!$l || !hash_equals($l['hash'], hash('sha256', $clave))) { anotarIntento('licencia'); salida(['error' => 'Licencia no válida.'], 401); }
        $b = cuerpo();
        db()->prepare('UPDATE licencias SET sitio = ?, version = ?, usuarios = ?, ultimo_respaldo = ?, drive = ?, contacto = ? WHERE id = ?')->execute([
            mb_substr((string) ($b['sitio'] ?? ''), 0, 190), mb_substr((string) ($b['version'] ?? ''), 0, 20), (int) ($b['usuarios'] ?? 0),
            mb_substr((string) ($b['ultimo_respaldo'] ?? ''), 0, 20) ?: null, !empty($b['drive']) ? 1 : 0, time(), $l['id']]);
        $est = estadoReal($l);
        $msj = (string) ($l['mensaje'] ?? '');
        if ($est === 'pausado' && $msj === '') $msj = $l['estado'] === 'pausado' ? 'Comuníquese con su proveedor.' : 'El pago está vencido. Comuníquese con su proveedor.';
        salida(['estado' => $est, 'mensaje' => $msj, 'pago_hasta' => $l['pago_hasta']]);
    }
    // ---------- desde aquí: solo el administrador del dueño ----------
    case 'lista': {
        requiereAdmin();
        $l = db()->query('SELECT id, nombre, estado, pago_hasta, nota, mensaje, sitio, version, usuarios, ultimo_respaldo, drive, contacto, creado FROM licencias ORDER BY nombre')->fetchAll();
        foreach ($l as &$x) { $x['real'] = estadoReal($x); $x['contacto'] = $x['contacto'] ? date('Y-m-d H:i', (int) $x['contacto']) : null; }
        salida(['lista' => $l, 'version' => MRGAS_VERSION, 'gracia' => gracia(), 'url' => (esHttps() ? 'https' : 'http') . '://' . preg_replace('/[^A-Za-z0-9.\-:]/', '', (string) $_SERVER['HTTP_HOST']) . rtrim(dirname((string) $_SERVER['SCRIPT_NAME']), '/') . '/central.php']);
    }
    case 'crear': {
        requiereAdmin(); $b = cuerpo();
        $n = mb_substr(trim((string) ($b['nombre'] ?? '')), 0, 120); if ($n === '') salida(['error' => 'Escriba el nombre del cliente.'], 400);
        $clave = nuevaClave();
        db()->prepare('INSERT INTO licencias (nombre, hash, estado, pago_hasta, nota, creado) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$n, hash('sha256', $clave), 'activo', fecha($b['pago_hasta'] ?? null), mb_substr((string) ($b['nota'] ?? ''), 0, 2000), time()]);
        salida(['ok' => true, 'clave' => $clave]);
    }
    case 'editar': {
        requiereAdmin(); $b = cuerpo(); $id = (int) ($b['id'] ?? 0);
        $est = in_array($b['estado'] ?? '', ['activo', 'pausado'], true) ? $b['estado'] : 'activo';
        db()->prepare('UPDATE licencias SET nombre = ?, estado = ?, pago_hasta = ?, nota = ?, mensaje = ? WHERE id = ?')->execute([
            mb_substr(trim((string) ($b['nombre'] ?? '')), 0, 120) ?: 'Cliente', $est, fecha($b['pago_hasta'] ?? null),
            mb_substr((string) ($b['nota'] ?? ''), 0, 2000), mb_substr((string) ($b['mensaje'] ?? ''), 0, 300), $id]);
        salida(['ok' => true]);
    }
    case 'nueva_clave': {
        requiereAdmin(); $id = (int) (cuerpo()['id'] ?? 0); $clave = nuevaClave();
        db()->prepare('UPDATE licencias SET hash = ? WHERE id = ?')->execute([hash('sha256', $clave), $id]);
        salida(['ok' => true, 'clave' => $clave]);
    }
    case 'borrar': {
        requiereAdmin(); db()->prepare('DELETE FROM licencias WHERE id = ?')->execute([(int) (cuerpo()['id'] ?? 0)]);
        salida(['ok' => true]);
    }
    default:
        salida(['error' => 'Acción desconocida.'], 404);
    }
} catch (Throwable $e) {
    error_log('MR Gas central: ' . $e->getMessage());
    salida(['error' => 'Error del servidor.'], 500);
}

<?php
// MR Gas · funciones comunes del servidor (conexión, sesión, permisos)
declare(strict_types=1);

const COLS_PERMITIDAS = ['pedidos','bitacora','ventas','gastos','rendiciones','cargas','cargasDist','anticipos','petroleo',
    'peonetas','clientes','choferes','movimientos','recuentos','historialPrecios','ventasAnuladas','programados','estado','reparto','camiones'];
// Documentos de "estado" que solo cambia el administrador
const ESTADO_SOLO_ADMIN = ['precios','preciosMayor','preciosEnvase','preciosConvenio','listas','empresa','comisiones','historico','listasMay','comisionVale','descQR'];
// De esos, los precios también los puede cambiar un encargado con el permiso «cfg.precios»
const ESTADO_PRECIOS = ['precios','preciosMayor','preciosEnvase','preciosConvenio','listas','historico','listasMay','comisionVale','descQR'];
// Cuadro (permiso) que necesita un encargado para escribir en cada colección
const PERMISO_COL = [
    'rendiciones' => ['cuadratura','ventachofer','mayorista'], 'cargas' => ['cuadratura','ventachofer'], 'cargasDist' => ['cuadratura','mayorista'], 'anticipos' => ['cuadratura','ventachofer'], 'peonetas' => ['cuadratura','ventachofer'],
    'ventas' => ['caja','cuadratura'], 'gastos' => ['caja','cuadratura'], 'ventasAnuladas' => ['caja','cuadratura'],
    'movimientos' => ['compras','bodega'], 'recuentos' => ['bodega'],
    'pedidos' => ['pedidos','ruta','chofer','app.repartidores'], 'reparto' => ['mayorista','ruta','pedidos','app.repartidores','app.distribucion'], 'camiones' => ['mayorista','ruta','app.distribucion'], 'clientes' => ['pedidos','ruta'], 'petroleo' => ['petroleo','cuadratura'],
];

// Dónde buscar la configuración. Lo recomendado es FUERA de public_html (un nivel arriba),
// porque cada implementación desde GitHub reemplaza public_html y borraría api/config.php.
function rutaConfig(): ?string {
    $publico = dirname(__DIR__);                       // .../public_html
    foreach ([dirname($publico) . '/mrgas-config.php',  // .../dominio/mrgas-config.php  (fuera de public_html)
              __DIR__ . '/config.php'] as $r) {         // api/config.php (antiguo)
        if (is_file($r)) return $r;
    }
    return null;
}

function cfg(): array {
    static $c = null;
    if ($c === null) {
        $r = rutaConfig();
        if (!$r) salida(['error' => 'Falta el archivo mrgas-config.php (fuera de public_html). Cópielo desde api/config.ejemplo.php y ponga los datos de la base.'], 503);
        $c = require $r;
    }
    return $c;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = cfg();
    if (!empty($c['dsn'])) {
        $pdo = new PDO($c['dsn'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    } else {
        if (str_contains($c['db_name'], 'PEGA_AQUI')) salida(['error' => 'Falta configurar la base de datos en mrgas-config.php'], 503);
        $pdo = new PDO("mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4", $c['db_user'], $c['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    }
    return $pdo;
}
function esSqlite(): bool { return db()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'; }

function crearTablas(): void {
    $ai = esSqlite() ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    $q = [
        "CREATE TABLE IF NOT EXISTS usuarios (uid $ai, usuario VARCHAR(40) NOT NULL UNIQUE, hash VARCHAR(255) NOT NULL, nombre VARCHAR(80) NOT NULL,
            rol VARCHAR(12) NOT NULL, local_id INT NULL, sucursales TEXT NULL, permisos TEXT NULL, chofer INT NULL, activo TINYINT NOT NULL DEFAULT 1,
            creado VARCHAR(19) NOT NULL)$motor",
        "CREATE TABLE IF NOT EXISTS docs (col VARCHAR(24) NOT NULL, id VARCHAR(90) NOT NULL, local_id INT NULL, fecha VARCHAR(19) NULL, chofer INT NULL,
            vivo TINYINT NOT NULL DEFAULT 0, data MEDIUMTEXT NOT NULL, ver BIGINT NOT NULL, borrado TINYINT NOT NULL DEFAULT 0, autor INT NULL,
            PRIMARY KEY (col, id))$motor",
        "CREATE INDEX idx_docs_ver ON docs (ver)",
        "CREATE INDEX idx_docs_fecha ON docs (col, fecha)",
        "CREATE TABLE IF NOT EXISTS contadores (nombre VARCHAR(24) NOT NULL PRIMARY KEY, valor BIGINT NOT NULL)$motor",
        "CREATE TABLE IF NOT EXISTS intentos (ip VARCHAR(45) NOT NULL, tipo VARCHAR(12) NOT NULL, t INT NOT NULL)$motor",
        "CREATE INDEX idx_intentos ON intentos (ip, tipo, t)",
        "CREATE TABLE IF NOT EXISTS presencia (uid INT NOT NULL PRIMARY KEY, t INT NOT NULL, app VARCHAR(14) NOT NULL DEFAULT '', ip VARCHAR(45) NOT NULL DEFAULT '')$motor",
    ];
    foreach ($q as $s) { try { db()->exec($s); } catch (PDOException $e) { if (!str_contains($e->getMessage(), 'exist') && !str_contains($e->getMessage(), 'Duplicate')) throw $e; } }
    db()->exec(esSqlite() ? "INSERT OR IGNORE INTO contadores (nombre, valor) VALUES ('ver', 0), ('pedidos', 1000)"
                          : "INSERT IGNORE INTO contadores (nombre, valor) VALUES ('ver', 0), ('pedidos', 1000)");
}
function instalado(): bool {
    try { return (int) db()->query('SELECT COUNT(*) FROM usuarios')->fetchColumn() > 0; } catch (Throwable $e) { return false; }
}

// ---------- respuesta y entrada ----------
function cabecerasSeguras(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: same-origin');
}
function salida($datos, int $codigo = 200): never {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    cabecerasSeguras();
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}
function cuerpo(): array {
    $j = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($j) ? $j : [];
}
function ahora(): string { return date('Y-m-d H:i:s'); }
function ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '0', 0, 45); }

// Límite de intentos (login fallido, pedidos del sitio web)
function limitar(string $tipo, int $max, int $segundos): void {
    db()->prepare('DELETE FROM intentos WHERE t < ?')->execute([time() - 86400]);
    $s = db()->prepare('SELECT COUNT(*) FROM intentos WHERE ip = ? AND tipo = ? AND t > ?');
    $s->execute([ip(), $tipo, time() - $segundos]);
    if ((int) $s->fetchColumn() >= $max) salida(['error' => 'Demasiados intentos. Espere unos minutos y vuelva a intentar.'], 429);
}
function anotarIntento(string $tipo): void { db()->prepare('INSERT INTO intentos (ip, tipo, t) VALUES (?, ?, ?)')->execute([ip(), $tipo, time()]); }
// Límite por usuario (aunque el intruso cambie de IP): se guarda el nombre de usuario en lugar de la IP
function limitarUsuario(string $user, int $max, int $segundos): void {
    $s = db()->prepare('SELECT COUNT(*) FROM intentos WHERE ip = ? AND tipo = ? AND t > ?');
    $s->execute([substr('u:' . $user, 0, 45), 'login-u', time() - $segundos]);
    if ((int) $s->fetchColumn() >= $max) salida(['error' => 'Este usuario quedó bloqueado por muchos intentos fallidos. Espere 30 minutos o pida ayuda al administrador.'], 429);
}
function anotarIntentoUsuario(string $user): void { db()->prepare('INSERT INTO intentos (ip, tipo, t) VALUES (?, ?, ?)')->execute([substr('u:' . $user, 0, 45), 'login-u', time()]); }

// ---------- sesión ----------
// Igual que el ERP Local: en la oficina la sesión se cierra al cerrar el navegador
// (y también tras 10 horas sin uso). En las apps de los choferes dura hasta las 00:00,
// para que no tengan que volver a poner la clave mientras conducen.
function cookieSesion(int $expira): void {
    if (headers_sent()) return;
    $o = ['path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')];
    if ($expira > 0) $o['expires'] = $expira;
    setcookie(session_name(), session_id(), $o);
}
function finDelDia(): int { return max(time() + 300, strtotime('tomorrow')); }
const OFICINA_INACTIVA = 36000; // 10 horas
function iniciarSesion(): void {
    session_name('mrgas');
    ini_set('session.gc_maxlifetime', '86400');
    // carpeta propia para las sesiones, fuera de public_html, para que el hosting no las borre antes
    $dir = dirname(dirname(__DIR__)) . '/mrgas-sesiones';
    if ((is_dir($dir) || @mkdir($dir, 0700, true)) && is_writable($dir)) session_save_path($dir);
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')]);
    session_start();
    if (!empty($_SESSION['uid'])) {
        if (empty($_SESSION['larga']) && time() - (int) ($_SESSION['uso'] ?? time()) > OFICINA_INACTIVA) { $_SESSION = []; return; }
        $_SESSION['uso'] = time();
        // la sesión de las apps de reparto vence siempre a medianoche
        if (!empty($_SESSION['larga'])) cookieSesion(finDelDia());
    }
}
function perfilDe(array $u): array {
    return ['uid' => (int) $u['uid'], 'user' => $u['usuario'], 'nombre' => $u['nombre'], 'rol' => $u['rol'],
        'local' => $u['local_id'] !== null ? (int) $u['local_id'] : null,
        'sucursales' => json_decode($u['sucursales'] ?? '[]', true) ?: [],
        'permisos' => $u['permisos'] !== null ? (json_decode($u['permisos'], true) ?: []) : null,
        'chofer' => $u['chofer'] !== null ? (int) $u['chofer'] : null, 'activo' => (bool) $u['activo']];
}
function yo(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $s = db()->prepare('SELECT * FROM usuarios WHERE uid = ?');
    $s->execute([$_SESSION['uid']]);
    $u = $s->fetch();
    if (!$u || !$u['activo']) { $_SESSION = []; return null; }
    // chofer con clave diaria: la sesión dura solo el día en que entró
    if (function_exists('esDiaria') && esDiaria($u) && ($_SESSION['dia'] ?? '') !== date('Y-m-d')) { $_SESSION = []; return null; }
    // quién está conectado (se anota cada 30 segundos como máximo)
    if (time() - (int) ($_SESSION['pt'] ?? 0) >= 30) {
        $_SESSION['pt'] = time();
        try {
            if (empty($_SESSION['ptab'])) { db()->exec("CREATE TABLE IF NOT EXISTS presencia (uid INT NOT NULL PRIMARY KEY, t INT NOT NULL, app VARCHAR(14) NOT NULL DEFAULT '', ip VARCHAR(45) NOT NULL DEFAULT '')" . (esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')); $_SESSION['ptab'] = 1; }
            $p = [(int) $u['uid'], time(), (string) ($_SESSION['app'] ?? ''), ip()];
            db()->prepare(esSqlite() ? 'INSERT OR REPLACE INTO presencia (uid, t, app, ip) VALUES (?, ?, ?, ?)'
                : 'INSERT INTO presencia (uid, t, app, ip) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE t = VALUES(t), app = VALUES(app), ip = VALUES(ip)')->execute($p);
        } catch (Throwable $e) {}
    }
    return perfilDe($u);
}
function requiereYo(): array { $u = yo(); if (!$u) salida(['error' => 'Sesión vencida. Vuelva a entrar.'], 401); return $u; }
function requiereAdmin(): array { $u = requiereYo(); if ($u['rol'] !== 'admin') salida(['error' => 'Solo el administrador puede hacer esto.'], 403); return $u; }
// Protección simple contra formularios de otros sitios: el sistema siempre envía este encabezado
function exigirEncabezado(): void { if (($_SERVER['HTTP_X_MRGAS'] ?? '') !== '1') salida(['error' => 'Solicitud no válida.'], 400); }

// ---------- permisos ----------
function sucs(array $u): array { return $u['sucursales'] ?: ($u['local'] !== null ? [$u['local']] : []); }
function tienePermiso(array $u, string $col): bool {
    if ($u['rol'] === 'admin') return true;
    if (!isset(PERMISO_COL[$col]) || $u['permisos'] === null) return true;
    return (bool) array_intersect(PERMISO_COL[$col], $u['permisos']);
}
// Datos que se guardan aparte para filtrar rápido
function meta(string $col, string $id, array $d): array {
    $local = isset($d['local']) && $d['local'] !== null && $d['local'] !== '' ? (int) $d['local'] : null;
    $fecha = $d['fecha'] ?? $d['cuando'] ?? null;
    $chofer = isset($d['chofer']) && $d['chofer'] !== null && $d['chofer'] !== '' ? (int) $d['chofer'] : null;
    if ($col === 'estado' || $col === 'choferes' || $col === 'clientes' || $col === 'peonetas') { $local = null; $fecha = null; }
    if ($col === 'estado' && str_starts_with($id, 'stk-')) $chofer = (int) substr($id, 4);
    $vivo = ($col === 'pedidos' && in_array($d['estado'] ?? '', ['pendiente', 'ruta'], true))
        || ($col === 'reparto' && !in_array($d['estado'] ?? '', ['Entregado', 'Cancelado'], true)) ? 1 : 0;
    if ($col === 'camiones') $fecha = null;
    return ['local' => $local, 'fecha' => is_string($fecha) ? substr($fecha, 0, 19) : null, 'chofer' => $chofer, 'vivo' => $vivo];
}
function puedeLeer(array $u, array $fila): bool {
    if ($u['rol'] === 'admin') return true;
    if ($u['rol'] === 'chofer') {
        if ($fila['col'] === 'pedidos' || $fila['col'] === 'reparto') return (int) $fila['chofer'] === (int) $u['chofer'];
        if ($fila['col'] === 'camiones') return true;
        return in_array($fila['col'], ['choferes', 'estado'], true);
    }
    if ($fila['local_id'] !== null && !in_array((int) $fila['local_id'], sucs($u), true)) return false;
    return true;
}
const CAMPOS_CHOFER = ['estado', 'entregado', 'desc', 'descCh', 'chofer', 'despacho'];
function puedeEscribir(array $u, string $col, string $id, array $m, ?array $nuevo, ?array $antes, ?array $metaAntes): bool {
    if ($u['rol'] === 'admin') return true;
    if ($col === 'bitacora') return $antes === null; // solo agregar
    if ($u['rol'] === 'chofer') {
        if ($col === 'estado') return $id === 'stk-' . $u['chofer'];
        if ($col === 'reparto') { // el repartidor solo avanza el estado y ordena sus entregas
            if (!$antes || $nuevo === null || (int) ($antes['chofer'] ?? 0) !== (int) $u['chofer'] || (int) ($nuevo['chofer'] ?? 0) !== (int) $u['chofer']) return false;
            foreach (array_unique(array_merge(array_keys($antes), array_keys($nuevo))) as $k)
                if (!in_array($k, ['estado', 'actualizado', 'orden'], true) && json_encode($antes[$k] ?? null) !== json_encode($nuevo[$k] ?? null)) return false;
            return true;
        }
        if ($col !== 'pedidos' || !$antes || $nuevo === null) return false;
        if ((int) ($antes['chofer'] ?? 0) !== (int) $u['chofer']) return false;
        if (!in_array($nuevo['chofer'] ?? null, [null, $u['chofer']], false)) return false;
        $claves = array_unique(array_merge(array_keys($antes), array_keys($nuevo)));
        foreach ($claves as $k) if (!in_array($k, CAMPOS_CHOFER, true) && json_encode($antes[$k] ?? null) !== json_encode($nuevo[$k] ?? null)) return false;
        return true;
    }
    // encargado
    if ($col === 'estado') {
        if (in_array($id, ESTADO_SOLO_ADMIN, true)) return in_array($id, ESTADO_PRECIOS, true) && is_array($u['permisos']) && in_array('cfg.precios', $u['permisos'], true);
        if (str_starts_with($id, 'loc-')) return in_array((int) substr($id, 4), sucs($u), true);
        return true;
    }
    if ($col === 'pedidos' && $nuevo === null) return false; // borrar pedidos: solo administrador
    if (!tienePermiso($u, $col)) return false;
    foreach ([$m['local'], $metaAntes['local_id'] ?? null] as $l) if ($l !== null && !in_array((int) $l, sucs($u), true)) return false;
    return true;
}

// Responde al navegador y sigue trabajando (para enviar avisos sin hacer esperar a nadie)
function responderYSeguir(array $datos, callable $luego): never {
    ignore_user_abort(true); set_time_limit(30);
    $json = json_encode($datos, JSON_UNESCAPED_UNICODE);
    http_response_code(200); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
    if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
    if (function_exists('litespeed_finish_request')) { echo $json; litespeed_finish_request(); }
    elseif (function_exists('fastcgi_finish_request')) { echo $json; fastcgi_finish_request(); }
    else { header('Content-Length: ' . strlen($json)); header('Connection: close'); echo $json; while (ob_get_level()) ob_end_flush(); flush(); }
    try { $luego(); } catch (Throwable $e) { error_log('MR Gas push: ' . $e->getMessage()); }
    exit;
}

// Siguiente número de un contador (pedidos, versión de cambios)
function siguiente(string $nombre, int $minimo = 0): int {
    $p = db();
    $p->prepare('UPDATE contadores SET valor = CASE WHEN valor < ? THEN ? ELSE valor + 1 END WHERE nombre = ?')->execute([$minimo, $minimo, $nombre]);
    $s = $p->prepare('SELECT valor FROM contadores WHERE nombre = ?');
    $s->execute([$nombre]);
    return (int) $s->fetchColumn();
}

// Guarda (o borra) un documento y devuelve su versión
function grabarDoc(string $col, string $id, ?array $data, ?int $autor, ?string $json = null): int {
    $ver = siguiente('ver');
    if ($data === null) {
        db()->prepare('UPDATE docs SET borrado = 1, ver = ?, autor = ? WHERE col = ? AND id = ?')->execute([$ver, $autor, $col, $id]);
        return $ver;
    }
    $m = meta($col, $id, $data);
    $json = $json ?? json_encode($data, JSON_UNESCAPED_UNICODE);
    $sql = esSqlite()
        ? 'INSERT INTO docs (col,id,local_id,fecha,chofer,vivo,data,ver,borrado,autor) VALUES (?,?,?,?,?,?,?,?,0,?)
           ON CONFLICT(col,id) DO UPDATE SET local_id=excluded.local_id, fecha=excluded.fecha, chofer=excluded.chofer, vivo=excluded.vivo, data=excluded.data, ver=excluded.ver, borrado=0, autor=excluded.autor'
        : 'INSERT INTO docs (col,id,local_id,fecha,chofer,vivo,data,ver,borrado,autor) VALUES (?,?,?,?,?,?,?,?,0,?)
           ON DUPLICATE KEY UPDATE local_id=VALUES(local_id), fecha=VALUES(fecha), chofer=VALUES(chofer), vivo=VALUES(vivo), data=VALUES(data), ver=VALUES(ver), borrado=0, autor=VALUES(autor)';
    db()->prepare($sql)->execute([$col, $id, $m['local'], $m['fecha'], $m['chofer'], $m['vivo'], $json, $ver, $autor]);
    return $ver;
}

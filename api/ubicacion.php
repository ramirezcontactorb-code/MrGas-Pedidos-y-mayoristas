<?php
// MR Gas · ubicación de los camiones en vivo.
// La App repartidores (usuario chofer, con la app abierta) manda su posición cada ~30 segundos.
// Se guarda la última posición de cada chofer y su recorrido de las últimas horas (se borra solo a los 2 días).
declare(strict_types=1);

function tablaUbicaciones(): void {
    static $listo = false; if ($listo) return; $listo = true;
    $auto = esSqlite() ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS ubicaciones (chofer INT NOT NULL PRIMARY KEY, lat DOUBLE NOT NULL, lon DOUBLE NOT NULL, prec INT NULL, vel DOUBLE NULL, t INT NOT NULL)$motor");
    db()->exec("CREATE TABLE IF NOT EXISTS ubic_rastro (id $auto, chofer INT NOT NULL, lat DOUBLE NOT NULL, lon DOUBLE NOT NULL, t INT NOT NULL)$motor");
    try { db()->exec('CREATE INDEX idx_rastro ON ubic_rastro (chofer, t)'); } catch (Throwable $e) {}
}
// Sucursal de cada chofer (para que un encargado vea solo los suyos)
function localesChoferes(): array {
    $m = [];
    foreach (db()->query("SELECT id, data FROM docs WHERE col = 'choferes' AND borrado = 0") as $r) {
        $d = json_decode((string) $r['data'], true); $m[(string) $r['id']] = isset($d['local']) ? (int) $d['local'] : null;
    }
    return $m;
}
function puedeVerMapa(array $u): bool {
    if ($u['rol'] === 'admin') return true;
    if ($u['rol'] !== 'encargado') return false;
    $p = $u['permisos']; if (!is_array($p)) return true;
    return (bool) array_intersect(['ruta', 'ruta:ver', 'choferes', 'choferes:ver', 'pedidos'], $p);
}
function grabarUbicacion(array $u, array $b): array {
    $ch = (int) ($u['chofer'] ?? 0);
    if ($u['rol'] !== 'chofer' || $ch <= 0) return ['ok' => true, 'guardado' => false];
    $lat = (float) ($b['lat'] ?? 0); $lon = (float) ($b['lon'] ?? 0);
    if (abs($lat) > 90 || abs($lon) > 180 || ($lat == 0.0 && $lon == 0.0)) salida(['error' => 'Ubicación no válida.'], 400);
    tablaUbicaciones(); $t = time();
    $s = db()->prepare('SELECT lat, lon, t FROM ubicaciones WHERE chofer = ?'); $s->execute([$ch]); $ant = $s->fetch();
    if ($ant && $t - (int) $ant['t'] < 15) return ['ok' => true, 'guardado' => false]; // muy seguido
    db()->prepare('DELETE FROM ubicaciones WHERE chofer = ?')->execute([$ch]);
    db()->prepare('INSERT INTO ubicaciones (chofer, lat, lon, prec, vel, t) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$ch, $lat, $lon, max(0, min(100000, (int) ($b['prec'] ?? 0))), isset($b['vel']) ? max(0, min(200, (float) $b['vel'])) : null, $t]);
    // recorrido: un punto si se movió más de ~40 m o pasaron 3 minutos
    $mov = $ant ? hypot(($lat - (float) $ant['lat']) * 111000, ($lon - (float) $ant['lon']) * 93000) : 999;
    if (!$ant || $mov > 40 || $t - (int) $ant['t'] > 180) db()->prepare('INSERT INTO ubic_rastro (chofer, lat, lon, t) VALUES (?, ?, ?, ?)')->execute([$ch, $lat, $lon, $t]);
    if (random_int(1, 200) === 1) db()->prepare('DELETE FROM ubic_rastro WHERE t < ?')->execute([$t - 2 * 86400]);
    return ['ok' => true, 'guardado' => true];
}
function listaUbicaciones(array $u, bool $rastro): array {
    tablaUbicaciones();
    $desde = time() - 12 * 3600;
    $loc = localesChoferes(); $mis = $u['rol'] === 'admin' ? null : sucs($u);
    $vale = fn($ch) => $mis === null || in_array($loc[(string) $ch] ?? -1, $mis, true);
    $out = [];
    $s = db()->prepare('SELECT chofer, lat, lon, prec, vel, t FROM ubicaciones WHERE t >= ?'); $s->execute([$desde]);
    foreach ($s->fetchAll() as $r) if ($vale($r['chofer'])) $out[(string) $r['chofer']] = ['lat' => (float) $r['lat'], 'lon' => (float) $r['lon'], 'prec' => $r['prec'] !== null ? (int) $r['prec'] : null,
        'vel' => $r['vel'] !== null ? (float) $r['vel'] : null, 't' => (int) $r['t'], 'hace' => time() - (int) $r['t'], 'rastro' => []];
    if ($rastro && $out) {
        $ini = strtotime('today');
        $s = db()->prepare('SELECT chofer, lat, lon, t FROM ubic_rastro WHERE t >= ? ORDER BY t'); $s->execute([$ini]);
        foreach ($s->fetchAll() as $r) { $k = (string) $r['chofer']; if (isset($out[$k])) $out[$k]['rastro'][] = [round((float) $r['lat'], 6), round((float) $r['lon'], 6)]; }
    }
    return ['ubicaciones' => $out, 'ahora' => time()];
}

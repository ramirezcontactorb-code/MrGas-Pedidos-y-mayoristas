<?php
// MR Gas · respaldos de la base de datos completa (pedidos, ventas, usuarios, Venta Local, configuración).
// Se guardan comprimidos FUERA de public_html, en la carpeta «mrgas-respaldos», para que nadie los pueda descargar por internet.
declare(strict_types=1);

require_once __DIR__ . '/gdrive.php';

const RESP_TABLAS = ['usuarios', 'docs', 'contadores', 'ajustes', 'push_subs', 'local_docs'];

function dirRespaldos(): string {
    $d = dirname(dirname(__DIR__)) . '/mrgas-respaldos';
    if (!is_dir($d)) @mkdir($d, 0700, true);
    return $d;
}
function tablasExistentes(): array {
    $q = esSqlite() ? "SELECT name FROM sqlite_master WHERE type = 'table'" : 'SHOW TABLES';
    return array_map('strval', db()->query($q)->fetchAll(PDO::FETCH_COLUMN));
}
// Escribe el respaldo en $ruta (archivo .json.gz), fila por fila para no gastar memoria
function crearRespaldo(string $ruta, string $quien): array {
    $gz = gzopen($ruta, 'wb6'); if (!$gz) throw new RuntimeException('No se pudo crear el archivo de respaldo.');
    $hay = tablasExistentes(); $filas = 0;
    gzwrite($gz, '{"app":"mrgas","formato":1,"fecha":' . json_encode(date('Y-m-d H:i:s')) . ',"por":' . json_encode($quien, JSON_UNESCAPED_UNICODE) . ',"tablas":{');
    $primera = true;
    foreach (RESP_TABLAS as $t) {
        if (!in_array($t, $hay, true)) continue;
        gzwrite($gz, ($primera ? '' : ',') . json_encode($t) . ':['); $primera = false;
        // la conexión con Google Drive (gd_*) y el estado de la licencia (lic_*) no viajan dentro del respaldo
        $s = db()->query("SELECT * FROM $t" . ($t === 'ajustes' ? " WHERE SUBSTR(k, 1, 3) <> 'gd_' AND SUBSTR(k, 1, 4) <> 'lic_'" : '')); $i = 0;
        while ($r = $s->fetch(PDO::FETCH_ASSOC)) { gzwrite($gz, ($i++ ? ',' : '') . json_encode($r, JSON_UNESCAPED_UNICODE)); $filas++; }
        gzwrite($gz, ']');
    }
    gzwrite($gz, '}}'); gzclose($gz);
    @chmod($ruta, 0600);
    return ['archivo' => basename($ruta), 'filas' => $filas, 'tamano' => filesize($ruta)];
}
function nombreRespaldo(string $tipo): string { return 'mrgas-' . $tipo . '-' . date('Y-m-d_His') . '.json.gz'; }
function listaRespaldos(): array {
    $l = [];
    foreach (glob(dirRespaldos() . '/mrgas-*.json.gz') ?: [] as $f) $l[] = ['archivo' => basename($f), 'tamano' => filesize($f), 'fecha' => date('Y-m-d H:i', filemtime($f)), 'auto' => str_contains(basename($f), '-auto-')];
    usort($l, fn($a, $b) => strcmp($b['archivo'], $a['archivo']));
    return $l;
}
// Deja solo los últimos N respaldos automáticos (los manuales no se borran solos)
function podarRespaldos(int $guardar): void {
    $auto = array_values(array_filter(listaRespaldos(), fn($x) => $x['auto']));
    foreach (array_slice($auto, max(1, $guardar)) as $x) @unlink(dirRespaldos() . '/' . $x['archivo']);
}
function archivoRespaldoValido(string $n): ?string {
    if (!preg_match('/^mrgas-(auto|manual)-\d{4}-\d{2}-\d{2}_\d{6}\.json\.gz$/', $n)) return null;
    $r = dirRespaldos() . '/' . $n; return is_file($r) ? $r : null;
}
// ¿Toca hacer el respaldo automático? (cada: dia | semana | nunca)
function respaldoAutoPendiente(): bool {
    $cada = ajuste('resp_cada') ?? 'dia'; if ($cada === 'nunca') return false;
    $ult = (int) (ajuste('resp_ultimo') ?? 0);
    return time() - $ult >= ($cada === 'semana' ? 7 * 86400 : 86400) - 1800;
}
function hacerRespaldoAuto(string $quien = 'Automático'): array {
    $r = crearRespaldo(dirRespaldos() . '/' . nombreRespaldo('auto'), $quien);
    grabarAjuste('resp_ultimo', (string) time());
    podarRespaldos((int) (ajuste('resp_guardar') ?? 14));
    // copia en Google Drive, si está conectado (si falla, el respaldo local igual queda hecho)
    if (ajuste('gd_refresh')) { try { $r['drive'] = gdSubir(dirRespaldos() . '/' . $r['archivo'], (int) (ajuste('resp_guardar') ?? 14)); } catch (Throwable $e) { $r['drive_error'] = $e->getMessage(); } }
    return $r;
}
// Restaura un respaldo: reemplaza todo el contenido de las tablas que trae
function restaurarRespaldo(string $ruta): array {
    $txt = @gzdecode((string) file_get_contents($ruta));
    if ($txt === false) $txt = (string) file_get_contents($ruta);
    $j = json_decode($txt, true);
    if (!is_array($j) || ($j['app'] ?? '') !== 'mrgas' || !is_array($j['tablas'] ?? null)) throw new RuntimeException('El archivo no es un respaldo de MR Gas.');
    if (empty($j['tablas']['usuarios'])) throw new RuntimeException('El respaldo no tiene usuarios: no se restaura para no dejar el sistema sin acceso.');
    $hay = tablasExistentes(); $p = db(); $n = 0;
    $verAntes = (int) $p->query("SELECT COALESCE(MAX(valor),0) FROM contadores WHERE nombre = 'ver'")->fetchColumn();
    $locAntes = (int) $p->query("SELECT COALESCE(MAX(valor),0) FROM contadores WHERE nombre = 'local'")->fetchColumn();
    $p->beginTransaction();
    try {
        foreach (RESP_TABLAS as $t) {
            if (!isset($j['tablas'][$t]) || !in_array($t, $hay, true)) continue;
            $cols = array_keys((array) ($p->query("SELECT * FROM $t LIMIT 1")->fetch(PDO::FETCH_ASSOC) ?: []));
            if (!$cols && $j['tablas'][$t]) $cols = array_keys($j['tablas'][$t][0]);
            $p->exec("DELETE FROM $t" . ($t === 'ajustes' ? " WHERE SUBSTR(k, 1, 3) <> 'gd_' AND SUBSTR(k, 1, 4) <> 'lic_'" : ''));
            foreach ($j['tablas'][$t] as $fila) {
                if ($t === 'ajustes' && (str_starts_with((string) ($fila['k'] ?? ''), 'gd_') || str_starts_with((string) ($fila['k'] ?? ''), 'lic_'))) continue;
                $f = array_intersect_key($fila, array_flip(array_filter(array_keys($fila), fn($c) => preg_match('/^[a-z_]+$/', (string) $c))));
                if (!$f) continue;
                $ks = array_keys($f);
                $p->prepare("INSERT INTO $t (" . implode(',', $ks) . ') VALUES (' . implode(',', array_fill(0, count($ks), '?')) . ')')->execute(array_values($f));
                $n++;
            }
        }
        // los equipos conectados reciben de nuevo todos los datos (versión más alta que la que ya tenían)
        $p->prepare('UPDATE docs SET ver = ver + ?')->execute([$verAntes + 1]);
        $p->prepare("UPDATE contadores SET valor = valor + ? WHERE nombre = 'ver'")->execute([$verAntes + 1]);
        if (in_array('local_docs', $hay, true)) {
            $p->prepare('UPDATE local_docs SET ver = ver + ?')->execute([$locAntes + 1]);
            $p->prepare("UPDATE contadores SET valor = valor + ? WHERE nombre = 'local'")->execute([$locAntes + 1]);
        }
        $p->commit();
    } catch (Throwable $e) { $p->rollBack(); throw $e; }
    return ['filas' => $n, 'fecha' => $j['fecha'] ?? ''];
}

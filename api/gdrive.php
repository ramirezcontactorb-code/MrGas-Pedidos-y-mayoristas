<?php
// MR Gas · copia de los respaldos en Google Drive (en la cuenta de Google del dueño).
// Usa el permiso «drive.file»: el sistema solo ve los archivos que él mismo sube, nada más del Drive.
// Los datos de conexión se guardan en la tabla «ajustes» con claves gd_* (no van dentro de los respaldos).
declare(strict_types=1);

const GD_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function gdUrlVuelta(): string {
    $host = preg_replace('/[^A-Za-z0-9.\-:]/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $ruta = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'))), '/');
    return (esHttps() ? 'https' : 'http') . '://' . $host . $ruta . '/index.php?a=drive_vuelta';
}
function gdEstado(): array {
    return ['configurado' => (bool) ajuste('gd_cliente'), 'conectado' => (bool) ajuste('gd_refresh'), 'cuenta' => ajuste('gd_cuenta'),
        'ultimo' => ajuste('gd_ultimo'), 'error' => ajuste('gd_error'), 'cliente' => ajuste('gd_cliente') ? substr((string) ajuste('gd_cliente'), 0, 12) . '…' : null];
}
// Llamada HTTP con cURL. $cuerpo: string, array (formulario) o recurso de archivo (PUT)
function gdHttp(string $metodo, string $url, array $cab = [], $cuerpo = null, int $largo = 0): array {
    // solo para las pruebas automáticas (servidor de Google simulado); en Hostinger esta variable no existe
    $prueba = getenv('MRGAS_GD_PRUEBA'); if ($prueba) $url = preg_replace('#^https://[a-z0-9.]+\.(googleapis|google)\.com#', rtrim($prueba, '/'), $url);
    $c = curl_init($url);
    $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_TIMEOUT => 600, CURLOPT_CONNECTTIMEOUT => 20, CURLOPT_HEADER => true, CURLOPT_HTTPHEADER => $cab];
    if (is_resource($cuerpo)) { $o[CURLOPT_UPLOAD] = true; $o[CURLOPT_INFILE] = $cuerpo; $o[CURLOPT_INFILESIZE] = $largo; }
    elseif (is_array($cuerpo)) $o[CURLOPT_POSTFIELDS] = http_build_query($cuerpo);
    elseif ($cuerpo !== null) $o[CURLOPT_POSTFIELDS] = $cuerpo;
    curl_setopt_array($c, $o);
    $r = curl_exec($c);
    if ($r === false) { $e = curl_error($c); curl_close($c); throw new RuntimeException('Sin conexión con Google: ' . $e); }
    $cod = (int) curl_getinfo($c, CURLINFO_RESPONSE_CODE); $hs = (int) curl_getinfo($c, CURLINFO_HEADER_SIZE); curl_close($c);
    $cabs = []; foreach (explode("\r\n", substr($r, 0, $hs)) as $l) if (strpos($l, ':')) { [$k, $v] = explode(':', $l, 2); $cabs[strtolower(trim($k))] = trim($v); }
    return ['cod' => $cod, 'cab' => $cabs, 'json' => json_decode(substr($r, $hs), true)];
}
function gdError(array $r): string {
    $j = $r['json'] ?? []; $m = is_array($j) ? ($j['error_description'] ?? ($j['error']['message'] ?? ($j['error'] ?? ''))) : '';
    return 'Google respondió ' . $r['cod'] . ($m ? ': ' . (is_string($m) ? $m : json_encode($m)) : '');
}
function gdUrlPermiso(): string {
    $estado = bin2hex(random_bytes(16)); $_SESSION['gd_estado'] = $estado;
    return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => ajuste('gd_cliente'), 'redirect_uri' => gdUrlVuelta(), 'response_type' => 'code', 'scope' => GD_SCOPE . ' openid email',
        'access_type' => 'offline', 'prompt' => 'consent', 'state' => $estado]);
}
// Google devuelve al usuario aquí con un código: se cambia por el permiso permanente (refresh token)
function gdRecibirCodigo(string $codigo): void {
    $r = gdHttp('POST', 'https://oauth2.googleapis.com/token', [], ['code' => $codigo, 'client_id' => ajuste('gd_cliente'),
        'client_secret' => ajuste('gd_secreto'), 'redirect_uri' => gdUrlVuelta(), 'grant_type' => 'authorization_code']);
    if ($r['cod'] !== 200 || empty($r['json']['refresh_token'])) throw new RuntimeException(gdError($r));
    grabarAjuste('gd_refresh', (string) $r['json']['refresh_token']);
    $cuenta = '';
    if (!empty($r['json']['id_token'])) { $p = explode('.', (string) $r['json']['id_token']); $d = json_decode((string) base64_decode(strtr($p[1] ?? '', '-_', '+/')), true); $cuenta = (string) ($d['email'] ?? ''); }
    grabarAjuste('gd_cuenta', $cuenta);
    db()->prepare("DELETE FROM ajustes WHERE k IN ('gd_carpeta','gd_error')")->execute();
}
function gdToken(): string {
    $r = gdHttp('POST', 'https://oauth2.googleapis.com/token', [], ['client_id' => ajuste('gd_cliente'), 'client_secret' => ajuste('gd_secreto'),
        'refresh_token' => ajuste('gd_refresh'), 'grant_type' => 'refresh_token']);
    if ($r['cod'] !== 200 || empty($r['json']['access_token'])) {
        if (($r['json']['error'] ?? '') === 'invalid_grant') db()->prepare("DELETE FROM ajustes WHERE k = 'gd_refresh'")->execute();
        throw new RuntimeException(gdError($r) . (($r['json']['error'] ?? '') === 'invalid_grant' ? ' (el permiso fue quitado o venció: vuelva a conectar Google Drive)' : ''));
    }
    return (string) $r['json']['access_token'];
}
// Carpeta «MR Gas respaldos» en el Drive (se crea una vez)
function gdCarpeta(string $tk): string {
    $id = ajuste('gd_carpeta');
    if ($id) { $r = gdHttp('GET', 'https://www.googleapis.com/drive/v3/files/' . rawurlencode($id) . '?fields=id,trashed', ['Authorization: Bearer ' . $tk]);
        if ($r['cod'] === 200 && empty($r['json']['trashed'])) return $id; }
    $r = gdHttp('POST', 'https://www.googleapis.com/drive/v3/files?fields=id', ['Authorization: Bearer ' . $tk, 'Content-Type: application/json'],
        json_encode(['name' => 'MR Gas respaldos', 'mimeType' => 'application/vnd.google-apps.folder']));
    if ($r['cod'] !== 200 || empty($r['json']['id'])) throw new RuntimeException(gdError($r));
    grabarAjuste('gd_carpeta', (string) $r['json']['id']);
    return (string) $r['json']['id'];
}
// Sube un respaldo (subida en un paso «reanudable», sirve para archivos grandes) y deja solo los últimos $guardar
function gdSubir(string $ruta, int $guardar = 30): array {
    if (!ajuste('gd_refresh')) throw new RuntimeException('Google Drive no está conectado.');
    try {
        $tk = gdToken(); $car = gdCarpeta($tk); $tam = filesize($ruta);
        $r = gdHttp('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
            ['Authorization: Bearer ' . $tk, 'Content-Type: application/json; charset=UTF-8', 'X-Upload-Content-Type: application/gzip', 'X-Upload-Content-Length: ' . $tam],
            json_encode(['name' => basename($ruta), 'parents' => [$car]]));
        $dest = $r['cab']['location'] ?? '';
        if ($r['cod'] !== 200 || !$dest) throw new RuntimeException(gdError($r));
        $fh = fopen($ruta, 'rb');
        $r = gdHttp('PUT', $dest, ['Authorization: Bearer ' . $tk, 'Content-Type: application/gzip'], $fh, $tam); fclose($fh);
        if (!in_array($r['cod'], [200, 201], true) || empty($r['json']['id'])) throw new RuntimeException(gdError($r));
        // borrar los más antiguos de la carpeta
        $q = "'" . $car . "' in parents and trashed = false and name contains 'mrgas-'";
        $l = gdHttp('GET', 'https://www.googleapis.com/drive/v3/files?' . http_build_query(['q' => $q, 'orderBy' => 'createdTime desc', 'pageSize' => 200, 'fields' => 'files(id,name)']), ['Authorization: Bearer ' . $tk]);
        $borrados = 0;
        foreach (array_slice((array) ($l['json']['files'] ?? []), max(1, $guardar)) as $f) { gdHttp('DELETE', 'https://www.googleapis.com/drive/v3/files/' . rawurlencode((string) $f['id']), ['Authorization: Bearer ' . $tk]); $borrados++; }
        grabarAjuste('gd_ultimo', date('Y-m-d H:i') . ' · ' . basename($ruta));
        db()->prepare("DELETE FROM ajustes WHERE k = 'gd_error'")->execute();
        return ['ok' => true, 'archivo' => basename($ruta), 'borrados' => $borrados];
    } catch (Throwable $e) {
        grabarAjuste('gd_error', date('Y-m-d H:i') . ' · ' . mb_substr($e->getMessage(), 0, 300));
        throw $e;
    }
}

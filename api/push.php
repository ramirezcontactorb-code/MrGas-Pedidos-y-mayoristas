<?php
// MR Gas · avisos al celular con la app cerrada o la pantalla bloqueada (Web Push, sin librerías externas)
// Usa: claves VAPID guardadas en la base, cifrado aes128gcm (RFC 8291) y firma ES256 (RFC 8292).
declare(strict_types=1);

function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64ud(string $s): string { return (string) base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4)); }

function asegurarPush(): void {
    static $listo = false; if ($listo) return; $listo = true;
    $motor = esSqlite() ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
    db()->exec("CREATE TABLE IF NOT EXISTS ajustes (k VARCHAR(40) NOT NULL PRIMARY KEY, v TEXT NOT NULL)$motor");
    db()->exec("CREATE TABLE IF NOT EXISTS push_subs (id VARCHAR(64) NOT NULL PRIMARY KEY, uid INT NOT NULL, endpoint TEXT NOT NULL,
        p256dh VARCHAR(200) NOT NULL, auth VARCHAR(100) NOT NULL, app VARCHAR(20) NULL, creado VARCHAR(19) NOT NULL)$motor");
}
function ajuste(string $k): ?string { $s = db()->prepare('SELECT v FROM ajustes WHERE k = ?'); $s->execute([$k]); $v = $s->fetchColumn(); return $v === false ? null : (string) $v; }
function grabarAjuste(string $k, string $v): void {
    db()->prepare('DELETE FROM ajustes WHERE k = ?')->execute([$k]);
    db()->prepare('INSERT INTO ajustes (k, v) VALUES (?, ?)')->execute([$k, $v]);
}

function nuevaClaveEC() {
    $k = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$k) throw new RuntimeException('El servidor no pudo crear claves EC (OpenSSL).');
    return $k;
}
function puntoDe($k): string {
    $d = openssl_pkey_get_details($k);
    return "\x04" . str_pad($d['ec']['x'], 32, "\0", STR_PAD_LEFT) . str_pad($d['ec']['y'], 32, "\0", STR_PAD_LEFT);
}
function pemPublico(string $punto): string {
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode(hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $punto), 64, "\n") . "-----END PUBLIC KEY-----\n";
}
// Claves VAPID del sitio: se crean solas la primera vez
function vapid(): array {
    asegurarPush();
    $pem = ajuste('vapid_priv'); $pub = ajuste('vapid_pub');
    if (!$pem || !$pub) {
        $k = nuevaClaveEC(); openssl_pkey_export($k, $pem); $pub = b64u(puntoDe($k));
        grabarAjuste('vapid_priv', $pem); grabarAjuste('vapid_pub', $pub);
    }
    return ['priv' => $pem, 'pub' => $pub];
}
function jwtVapid(string $aud, string $pem): string {
    $sub = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $in = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256'])) . '.' . b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => $sub]));
    openssl_sign($in, $der, openssl_pkey_get_private($pem), OPENSSL_ALGO_SHA256);
    // DER → r||s (64 bytes)
    $p = 2; if (ord($der[1]) & 0x80) $p += ord($der[1]) & 0x7f;
    $lr = ord($der[$p + 1]); $r = substr($der, $p + 2, $lr); $p += 2 + $lr;
    $ls = ord($der[$p + 1]); $s = substr($der, $p + 2, $ls);
    $fix = fn($x) => str_pad(ltrim($x, "\0"), 32, "\0", STR_PAD_LEFT);
    return $in . '.' . b64u($fix($r) . $fix($s));
}
function cifrarPush(string $texto, string $p256dh, string $auth): string {
    $ua = b64ud($p256dh); $authS = b64ud($auth);
    $eph = nuevaClaveEC(); $as = puntoDe($eph);
    $secreto = openssl_pkey_derive(openssl_pkey_get_public(pemPublico($ua)), $eph, 32);
    if ($secreto === false) throw new RuntimeException('ECDH falló');
    $prkKey = hash_hmac('sha256', $secreto, $authS, true);
    $ikm = hash_hmac('sha256', "WebPush: info\0" . $ua . $as . "\x01", $prkKey, true);
    $salt = random_bytes(16);
    $prk = hash_hmac('sha256', $ikm, $salt, true);
    $cek = substr(hash_hmac('sha256', "Content-Encoding: aes128gcm\0\x01", $prk, true), 0, 16);
    $nonce = substr(hash_hmac('sha256', "Content-Encoding: nonce\0\x01", $prk, true), 0, 12);
    $ct = openssl_encrypt($texto . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
    return $salt . pack('N', 4096) . chr(65) . $as . $ct . $tag;
}

// Envía a varias suscripciones a la vez. $envios = [[sub, payloadArray], ...]
// Registro de los últimos envíos (para el diagnóstico en Ajustes)
function anotarPush(array $filas): void {
    try {
        $l = json_decode(ajuste('push_log') ?? '[]', true) ?: [];
        foreach ($filas as $f) array_unshift($l, $f);
        grabarAjuste('push_log', json_encode(array_slice($l, 0, 40), JSON_UNESCAPED_UNICODE));
    } catch (Throwable $e) {}
}
function enviarPush(array $envios): array {
    if (!$envios) return [];
    if (!function_exists('curl_multi_init')) { anotarPush([['t' => ahora(), 'uid' => 0, 'host' => '-', 'code' => 0, 'error' => 'El servidor no tiene cURL activado']]); return []; }
    $v = vapid(); $jwts = []; $mh = curl_multi_init(); $hs = []; $log = []; $res = [];
    foreach ($envios as $i => [$sub, $datos]) {
        try {
            $u = parse_url($sub['endpoint']); $aud = $u['scheme'] . '://' . $u['host'] . (isset($u['port']) ? ':' . $u['port'] : '');
            $jwts[$aud] ??= jwtVapid($aud, $v['priv']);
            $cuerpo = cifrarPush(json_encode($datos, JSON_UNESCAPED_UNICODE), $sub['p256dh'], $sub['auth']);
        } catch (Throwable $e) { error_log('MR Gas push: ' . $e->getMessage()); $res[$sub['id']] = 0;
            $log[] = ['t' => ahora(), 'uid' => (int) $sub['uid'], 'host' => parse_url($sub['endpoint'], PHP_URL_HOST), 'code' => 0, 'error' => 'Cifrado: ' . $e->getMessage()]; continue; }
        $h = curl_init($sub['endpoint']);
        curl_setopt_array($h, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $cuerpo, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_HTTPHEADER => ['Content-Type: application/octet-stream', 'Content-Encoding: aes128gcm', 'TTL: 86400', 'Urgency: high',
                'Authorization: vapid t=' . $jwts[$aud] . ', k=' . $v['pub']]]);
        curl_multi_add_handle($mh, $h); $hs[$i] = [$h, $sub['id'], $sub];
    }
    do { $st = curl_multi_exec($mh, $activos); if ($activos) curl_multi_select($mh, 1.0); } while ($activos && $st === CURLM_OK);
    $res = $res ?? [];
    foreach ($hs as [$h, $id, $sub]) {
        $code = (int) curl_getinfo($h, CURLINFO_RESPONSE_CODE); $res[$id] = $code;
        $err = $code >= 200 && $code < 300 ? '' : trim(curl_error($h) . ' ' . mb_substr((string) curl_multi_getcontent($h), 0, 160));
        $log[] = ['t' => ahora(), 'uid' => (int) $sub['uid'], 'host' => parse_url($sub['endpoint'], PHP_URL_HOST), 'code' => $code, 'error' => $err];
        if ($code === 404 || $code === 410) db()->prepare('DELETE FROM push_subs WHERE id = ?')->execute([$id]); // el celular ya no existe
        curl_multi_remove_handle($mh, $h); curl_close($h);
    }
    curl_multi_close($mh);
    anotarPush($log);
    return $res;
}

// ---------- a quién avisar ----------
function subsDe(string $where, array $args): array {
    asegurarPush();
    $s = db()->prepare("SELECT s.*, u.rol, u.permisos, u.sucursales, u.local_id FROM push_subs s JOIN usuarios u ON u.uid = s.uid WHERE u.activo = 1 AND $where");
    $s->execute($args); return $s->fetchAll();
}
function puedeApp(array $fila, string $app): bool {
    if ($fila['rol'] === 'admin') return true;
    $p = $fila['permisos'] !== null ? (json_decode($fila['permisos'], true) ?: []) : null;
    if (!is_array($p) || !in_array('_v2', $p, true)) return true;
    return in_array($app, $p, true);
}
function itemsTexto(array $d, string $col): string {
    if ($col === 'reparto') {
        $et = ['c5' => '5 kg', 'c11' => '11 kg', 'c15' => '15 kg', 'c45' => '45 kg', 'c15a' => '15 kg Al']; $t = [];
        foreach ($et as $k => $n) if (!empty($d[$k])) $t[] = (int) $d[$k] . '×' . $n;
        return implode(', ', $t);
    }
    $fmt = ['c5' => '5 kg', 'c11' => '11 kg', 'c15' => '15 kg', 'c45' => '45 kg', 'h15' => '15 kg Al', 'h15a' => '15 kg Al']; $t = [];
    foreach (($d['items'] ?? [['formato' => $d['formato'] ?? '', 'cant' => $d['cant'] ?? 0]]) as $i)
        if (!empty($i['cant'])) $t[] = (int) $i['cant'] . '×' . ($fmt[$i['formato']] ?? $i['formato']);
    return implode(', ', $t);
}
// Decide los avisos según lo que acaba de cambiar. $cambios = [[col, id, nuevo, antes], ...]
function avisosDe(array $cambios, int $autor): array {
    $envios = [];
    foreach ($cambios as [$col, $id, $n, $a]) {
        if ($n === null) continue;
        if ($col === 'pedidos') {
            $dir = trim(($n['dir'] ?? '') . (!empty($n['comuna']) ? ', ' . $n['comuna'] : ''));
            $cuerpo = trim(itemsTexto($n, 'pedidos') . ' · ' . $dir, ' ·');
            $esNuevo = !$a && ($n['estado'] ?? '') === 'pendiente';
            $asignado = ($n['estado'] ?? '') === 'ruta' && !empty($n['chofer']) && (!$a || ($a['estado'] ?? '') !== 'ruta' || (int) ($a['chofer'] ?? 0) !== (int) $n['chofer']);
            $local = isset($n['local']) ? (int) $n['local'] : null;
        } elseif ($col === 'reparto') {
            $cuerpo = trim(itemsTexto($n, 'reparto') . ' · ' . ($n['cliente'] ?? '') . ' · ' . ($n['direccion'] ?? ''), ' ·');
            $esNuevo = !$a && ($n['estado'] ?? '') === 'Pendiente';
            $vivo = !in_array($n['estado'] ?? '', ['Entregado', 'Cancelado'], true);
            $asignado = $vivo && !empty($n['chofer']) && (!$a || (int) ($a['chofer'] ?? 0) !== (int) $n['chofer']);
            $local = isset($n['local']) ? (int) $n['local'] : null;
        } else continue;
        $num = $col === 'pedidos' ? 'N° ' . $id : 'mayorista';
        if ($esNuevo) // oficina: administradores y encargados con la App repartidores, de esa sucursal
            foreach (subsDe("u.rol IN ('admin','encargado') AND s.uid <> ?", [$autor]) as $s) {
                if ($s['app'] === 'distribucion' && $col === 'pedidos') continue;
                if (!puedeApp($s, $s['app'] === 'distribucion' ? 'app.distribucion' : 'app.repartidores')) continue;
                $sucs = json_decode($s['sucursales'] ?? '[]', true) ?: ($s['local_id'] !== null ? [(int) $s['local_id']] : []);
                if ($s['rol'] !== 'admin' && $local !== null && $sucs && !in_array($local, array_map('intval', $sucs), true)) continue;
                $envios[] = [$s, ['titulo' => "Nuevo pedido $num", 'cuerpo' => $cuerpo, 'tag' => "$col-$id"]];
            }
        if ($asignado)
            foreach (subsDe("u.rol = 'chofer' AND u.chofer = ? AND s.uid <> ?", [(int) $n['chofer'], $autor]) as $s) {
                if (!puedeApp($s, $s['app'] === 'distribucion' ? 'app.distribucion' : 'app.repartidores')) continue;
                if ($s['app'] === 'distribucion' && $col === 'pedidos') continue;
                $envios[] = [$s, ['titulo' => 'Nuevo pedido asignado', 'cuerpo' => $cuerpo, 'tag' => "$col-$id"]];
            }
    }
    return $envios;
}

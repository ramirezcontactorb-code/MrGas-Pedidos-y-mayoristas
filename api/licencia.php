<?php
// MR Gas · licencia de esta instalación (para clientes que arriendan el sistema).
// Si mrgas-config.php tiene 'licencia_url' y 'licencia_clave', cada cierto tiempo esta instalación
// avisa al panel del dueño (versión, usuarios, último respaldo) y recibe si el servicio está activo o pausado.
// Sin esos datos (instalación propia) no se revisa nada.
// Si el panel del dueño no responde, el sistema SIGUE FUNCIONANDO con el último estado conocido.
declare(strict_types=1);

function licCfg(): ?array {
    $c = cfg(); $u = trim((string) ($c['licencia_url'] ?? '')); $k = trim((string) ($c['licencia_clave'] ?? ''));
    return $u !== '' && $k !== '' ? ['url' => $u, 'clave' => $k] : null;
}
function licEstado(): array {
    if (!licCfg()) return ['estado' => 'propio'];
    asegurarPush();
    $e = json_decode((string) ajuste('lic_estado'), true);
    return is_array($e) ? $e : ['estado' => 'activo'];
}
// Avisa al panel del dueño (como máximo cada 6 horas, salvo $forzar)
function licRevisar(bool $forzar = false): array {
    $c = licCfg(); if (!$c) return ['estado' => 'propio'];
    $e = licEstado();
    $huella = substr(hash('sha256', $c['clave'] . $c['url']), 0, 12); // si cambian la clave o la dirección, se revisa al tiro
    if (!$forzar && ($e['huella'] ?? '') === $huella && time() - (int) ($e['revisado'] ?? 0) < 6 * 3600) return $e;
    $n = (int) db()->query("SELECT COUNT(*) FROM usuarios WHERE rol <> 'chofer'")->fetchColumn();
    $ult = (int) (ajuste('resp_ultimo') ?? 0);
    $datos = ['version' => MRGAS_VERSION, 'sitio' => preg_replace('/[^A-Za-z0-9.\-:]/', '', (string) ($_SERVER['HTTP_HOST'] ?? php_uname('n'))),
        'usuarios' => $n, 'ultimo_respaldo' => $ult ? date('Y-m-d H:i', $ult) : null, 'drive' => (bool) ajuste('gd_refresh')];
    $ch = curl_init($c['url'] . (str_contains($c['url'], '?') ? '&' : '?') . 'a=reporte');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($datos), CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-MRGas: 1', 'X-Licencia: ' . $c['clave']]]);
    $r = curl_exec($ch); $cod = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    $j = is_string($r) ? json_decode($r, true) : null;
    if ($cod === 200 && is_array($j) && in_array($j['estado'] ?? '', ['activo', 'pausado'], true)) {
        $e = ['estado' => $j['estado'], 'mensaje' => mb_substr((string) ($j['mensaje'] ?? ''), 0, 300), 'pago_hasta' => $j['pago_hasta'] ?? null, 'revisado' => time(), 'contacto' => time()];
    } elseif ($cod === 401) {
        $e = ['estado' => 'pausado', 'mensaje' => 'La licencia de esta instalación no es válida.', 'pago_hasta' => null, 'revisado' => time(), 'contacto' => time()];
    } else {
        $e['revisado'] = time() - 5 * 3600; // sin respuesta: se vuelve a intentar en 1 hora, con el último estado conocido
    }
    $e['huella'] = $huella;
    grabarAjuste('lic_estado', json_encode($e, JSON_UNESCAPED_UNICODE));
    return $e;
}
// Lo que ve la pantalla
function licPublica(array $e): array { return ['estado' => $e['estado'] ?? 'activo', 'mensaje' => $e['mensaje'] ?? '', 'pago_hasta' => $e['pago_hasta'] ?? null]; }
// Corta el uso si el dueño pausó el servicio
function licExigir(): void {
    if (!licCfg()) return;
    $e = licEstado();
    if (($e['estado'] ?? '') === 'pausado') salida(['error' => 'Servicio pausado. ' . (($e['mensaje'] ?? '') ?: 'Comuníquese con su proveedor.'), 'pausado' => true], 402);
}

<?php
// MR Gas · clave diaria de 5 dígitos para los choferes.
// La clave NO se guarda: se calcula cada día con una llave secreta del servidor + el usuario + la fecha.
// Cambia sola a las 00:00 (hora de Chile). El chofer la recibe del encargado y entra a la App repartidores.
declare(strict_types=1);

const PERM_DIARIA = 'clave.diaria';

function esDiaria(array $fila): bool {
    if (($fila['rol'] ?? '') !== 'chofer') return false;
    $p = $fila['permisos'] ?? null;
    if (is_string($p)) $p = json_decode($p, true);
    return is_array($p) && in_array(PERM_DIARIA, $p, true);
}
function secretoDiario(): string {
    asegurarPush(); // crea la tabla «ajustes» si falta
    $s = ajuste('clave_diaria_secreto');
    if (!$s) { $s = bin2hex(random_bytes(32)); grabarAjuste('clave_diaria_secreto', $s); }
    return $s;
}
function codigoDiario(int $uid, ?string $fecha = null): string {
    $fecha ??= date('Y-m-d');
    $h = hash_hmac('sha256', "mrgas-diaria|$uid|$fecha", secretoDiario());
    return str_pad((string) (hexdec(substr($h, 0, 12)) % 100000), 5, '0', STR_PAD_LEFT);
}
// Quién puede ver las claves y dar acceso: administrador, o encargado con el cuadro «Choferes» (trabajar)
function puedeChoferes(array $u): bool {
    return $u['rol'] === 'admin' || ($u['rol'] === 'encargado' && ($u['permisos'] === null || in_array('choferes', $u['permisos'], true)));
}

<?php
// MR Gas · respaldo automático. Lo ejecuta el «Cron Job» de Hostinger (no se puede abrir desde internet).
// Hostinger → Avanzado → Cron Jobs → comando:  php /home/USUARIO/domains/SU-DOMINIO/public_html/api/respaldo_auto.php
// Puede correr cada hora: solo respalda cuando corresponde (cada día o cada semana, según Configuraciones).
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/nucleo.php';
require __DIR__ . '/push.php';
require __DIR__ . '/respaldo.php';
date_default_timezone_set('America/Santiago');
try {
    asegurarPush(); // crea la tabla de ajustes si falta
    $forzar = in_array('--ahora', $argv ?? [], true);
    if (!$forzar && !respaldoAutoPendiente()) { echo "Sin respaldo pendiente.\n"; exit(0); }
    $r = hacerRespaldoAuto();
    echo "Respaldo creado: {$r['archivo']} ({$r['filas']} filas, " . round($r['tamano'] / 1024) . " KB)\n";
} catch (Throwable $e) {
    error_log('MR Gas respaldo: ' . $e->getMessage());
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n"); exit(1);
}

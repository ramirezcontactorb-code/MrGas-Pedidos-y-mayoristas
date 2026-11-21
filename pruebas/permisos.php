<?php
// Prueba de la lista única de permisos (api/permisos.json) tal como la usa el servidor
require ($argv[1] ?? getcwd()) . "/api/nucleo.php";
$E = fn($p) => ['rol' => 'encargado', 'permisos' => $p, 'sucursales' => [1], 'local' => 1, 'uid' => 9];
$c = [
 ['antiguo sin _v2 anula pedido', permExtra($E(['pedidos']), 'pedidos.anular'), true],
 ['antiguo sin _v2 cfg.envases', permExtra($E(['pedidos']), 'cfg.envases'), false],
 ['v2 con mayorista -> may.anular (antes)', permExtra($E(['_v2','mayorista']), 'may.anular'), true],
 ['v3 con mayorista -> may.anular', permExtra($E(['_v2','_v3','mayorista']), 'may.anular'), false],
 ['v3 marcado may.anular', permExtra($E(['_v2','_v3','may.anular']), 'may.anular'), true],
 ['col pedidos con ruta', tienePermiso($E(['_v2','ruta']), 'pedidos'), true],
 ['col ventas sin caja', tienePermiso($E(['_v2','ruta']), 'ventas'), false],
 ['anular pedido sin permiso v3', accionesPermitidas($E(['_v2','_v3','pedidos']), 'pedidos', ['estado'=>'anulado'], ['estado'=>'ruta']), false],
 ['anular pedido con permiso', accionesPermitidas($E(['_v2','_v3','pedidos','pedidos.anular']), 'pedidos', ['estado'=>'anulado'], ['estado'=>'ruta']), true],
];
$ok = 0; foreach ($c as [$t, $r, $e]) { echo ($r === $e ? 'OK  ' : 'MAL ') . $t . "\n"; $ok += $r === $e; }
echo "$ok/" . count($c) . "\n";
exit($ok === count($c) ? 0 : 1);

<?php
// MR Gas · API del sistema (Hostinger: PHP + MySQL)
declare(strict_types=1);
require __DIR__ . '/nucleo.php';
require __DIR__ . '/push.php';
require __DIR__ . '/diaria.php';
date_default_timezone_set('America/Santiago');
iniciarSesion();

$a = $_GET['a'] ?? '';
try {
    if ($a !== 'ping' && $_SERVER['REQUEST_METHOD'] === 'POST') exigirEncabezado();
    switch ($a) {

    case 'ping':
        salida(['ok' => true, 'instalado' => instalado(), 'hora' => ahora()]);

    // ---------- sesión ----------
    case 'login': {
        $b = cuerpo();
        limitar('login', 8, 900);
        $usr = strtolower(trim((string) ($b['user'] ?? '')));
        limitarUsuario($usr, 10, 1800);
        $s = db()->prepare('SELECT * FROM usuarios WHERE usuario = ?');
        $s->execute([$usr]);
        $u = $s->fetch();
        $pass = (string) ($b['pass'] ?? '');
        // choferes con clave diaria: la clave es el código de 5 dígitos de HOY
        $okClave = $u && (esDiaria($u) ? hash_equals(codigoDiario((int) $u['uid']), trim($pass)) : password_verify($pass, $u['hash']));
        if (!$okClave) { anotarIntento('login'); anotarIntentoUsuario($usr); salida(['error' => $u && esDiaria($u) ? 'Clave del día incorrecta. Pídale la clave de hoy al encargado.' : 'Usuario o clave incorrectos. Revise mayúsculas y vuelva a intentar.'], 401); }
        if (!$u['activo']) salida(['error' => 'Este usuario está desactivado. Pida al administrador que lo active.'], 403);
        $appL = in_array($b['app'] ?? '', ['repartidores', 'distribucion'], true) ? $b['app'] : 'erp';
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $u['uid'];
        $_SESSION['dia'] = date('Y-m-d');
        $app = in_array($b['app'] ?? '', ['repartidores', 'distribucion'], true) ? $b['app'] : 'erp';
        $_SESSION['app'] = $app; $_SESSION['uso'] = time(); $_SESSION['pt'] = 0;
        // apps de reparto o chofer con clave del día: hasta medianoche. Oficina: hasta cerrar el navegador.
        $_SESSION['larga'] = $app !== 'erp' || $u['rol'] === 'chofer' || esDiaria($u);
        cookieSesion($_SESSION['larga'] ? finDelDia() : 0);
        db()->prepare('DELETE FROM intentos WHERE ip = ? AND tipo = ?')->execute([substr('u:' . $usr, 0, 45), 'login-u']);
        yo();
        salida(['ok' => true, 'perfil' => perfilDe($u)]);
    }
    case 'salir':
        if (!empty($_SESSION['uid'])) try { db()->prepare('DELETE FROM presencia WHERE uid = ?')->execute([(int) $_SESSION['uid']]); } catch (Throwable $e) {}
        $_SESSION = []; session_destroy(); salida(['ok' => true]);

    // ---------- como en el ERP Local ----------
    // Informes: alguien sin permiso puede abrirlos si otra persona con permiso escribe su usuario y clave
    case 'autorizar': {
        $u = requiereYo(); $b = cuerpo();
        limitar('autoriza', 8, 900);
        $s = db()->prepare('SELECT * FROM usuarios WHERE usuario = ?');
        $s->execute([strtolower(trim((string) ($b['user'] ?? '')))]);
        $x = $s->fetch();
        $ok = $x && $x['activo'] && !esDiaria($x) && password_verify((string) ($b['pass'] ?? ''), $x['hash']);
        if ($ok) { $p = perfilDe($x); $per = $p['permisos'];
            $ok = $p['rol'] === 'admin' || ($p['rol'] === 'encargado' && ($per === null || in_array('informes', $per, true) || in_array('informes:ver', $per, true))); }
        if (!$ok) { anotarIntento('autoriza'); salida(['error' => 'Usuario o clave incorrectos, o ese usuario no tiene permiso de Informes.'], 401); }
        $_SESSION['inf_por'] = $x['nombre'];
        salida(['ok' => true, 'por' => $x['nombre']]);
    }
    // Respaldos: piden una contraseña especial (distinta a la del usuario)
    case 'respaldo_estado':
        requiereAdmin(); asegurarPush(); salida(['tiene' => ajuste('respaldo_hash') !== null, 'abierto' => !empty($_SESSION['resp_ok'])]);
    case 'respaldo_fijar': {
        $adm = requiereAdmin(); $b = cuerpo(); asegurarPush();
        limitar('respaldo', 6, 900);
        $s = db()->prepare('SELECT hash FROM usuarios WHERE uid = ?'); $s->execute([$adm['uid']]);
        $actual = ajuste('respaldo_hash');
        $okYo = password_verify((string) ($b['mia'] ?? ''), (string) $s->fetchColumn());
        $okAnt = $actual === null || password_verify((string) ($b['anterior'] ?? ''), $actual);
        if (!$okYo || !$okAnt) { anotarIntento('respaldo'); salida(['error' => !$okYo ? 'Su clave de usuario no es correcta.' : 'La contraseña especial actual no es correcta.'], 400); }
        $n = (string) ($b['nueva'] ?? '');
        if (strlen($n) < 8) salida(['error' => 'La contraseña especial debe tener al menos 8 caracteres.'], 400);
        $h = password_hash($n, PASSWORD_DEFAULT);
        grabarAjuste('respaldo_hash', $h);
        $_SESSION['resp_ok'] = true;
        salida(['ok' => true]);
    }
    case 'respaldo_abrir': {
        requiereAdmin(); $b = cuerpo(); asegurarPush();
        limitar('respaldo', 6, 900);
        $h = ajuste('respaldo_hash');
        if ($h === null || !password_verify((string) ($b['pass'] ?? ''), $h)) { anotarIntento('respaldo'); salida(['error' => 'Contraseña especial incorrecta.'], 401); }
        $_SESSION['resp_ok'] = true;
        salida(['ok' => true]);
    }
    // Quién está conectado ahora (últimos 2 minutos)
    case 'conectados': {
        requiereAdmin();
        $s = db()->prepare('SELECT p.uid, p.t, p.app, p.ip, u.nombre, u.usuario, u.rol FROM presencia p JOIN usuarios u ON u.uid = p.uid WHERE p.t > ? ORDER BY u.nombre');
        $s->execute([time() - 120]);
        salida(['conectados' => array_map(fn($r) => ['uid' => (int) $r['uid'], 'nombre' => $r['nombre'], 'user' => $r['usuario'], 'rol' => $r['rol'],
            'app' => $r['app'], 'ip' => $r['ip'], 'hace' => time() - (int) $r['t']], $s->fetchAll())]);
    }
    case 'yo':
        salida(['perfil' => yo()]);
    case 'clave': {
        $u = requiereYo(); $b = cuerpo();
        if (esDiaria($u)) salida(['error' => 'Su clave cambia sola cada día. Pídale la clave de hoy al encargado.'], 400);
        $s = db()->prepare('SELECT hash FROM usuarios WHERE uid = ?'); $s->execute([$u['uid']]);
        if (!password_verify((string) ($b['actual'] ?? ''), (string) $s->fetchColumn())) salida(['error' => 'La clave actual no es correcta.'], 400);
        $n = (string) ($b['nueva'] ?? '');
        if (strlen($n) < 4) salida(['error' => 'La clave nueva debe tener al menos 4 caracteres.'], 400);
        db()->prepare('UPDATE usuarios SET hash = ? WHERE uid = ?')->execute([password_hash($n, PASSWORD_DEFAULT), $u['uid']]);
        salida(['ok' => true]);
    }

    // ---------- datos ----------
    case 'cambios': {
        // desde=0: carga inicial (solo los últimos días); desde=N: lo que cambió después de la versión N
        $u = requiereYo();
        $desde = (int) ($_GET['desde'] ?? 0);
        $c = cfg();
        if ($desde === 0) {
            $corte = fn(int $d) => date('Y-m-d', strtotime("-$d days"));
            $s = db()->prepare("SELECT col,id,local_id,chofer,data,ver FROM docs WHERE borrado = 0 AND (
                  fecha IS NULL OR vivo = 1
                  OR (col = 'pedidos' AND fecha >= ?) OR (col = 'bitacora' AND fecha >= ?)
                  OR (col NOT IN ('pedidos','bitacora') AND fecha >= ?))");
            $s->execute([$corte($c['dias_pedidos'] ?? 7), $corte($c['dias_bitacora'] ?? 2), $corte($c['dias_otros'] ?? 45)]);
            $ver = (int) db()->query("SELECT valor FROM contadores WHERE nombre = 'ver'")->fetchColumn();
            $vacio = (int) db()->query('SELECT COUNT(*) FROM docs')->fetchColumn() === 0;
        } else {
            $s = db()->prepare('SELECT col,id,local_id,chofer,data,ver,borrado FROM docs WHERE ver > ? ORDER BY ver LIMIT 3000');
            $s->execute([$desde]);
            $ver = $desde; $vacio = false;
        }
        $docs = [];
        foreach ($s as $f) {
            $ver = max($ver, (int) $f['ver']);
            if (!puedeLeer($u, $f)) {
                // al chofer se le avisa que un pedido ya no es suyo (se lo quitaron o lo reasignaron): lo saca de su lista
                if ($desde > 0 && $u['rol'] === 'chofer' && in_array($f['col'], ['pedidos', 'reparto'], true))
                    $docs[] = ['col' => $f['col'], 'id' => $f['id'], 'data' => null, 'borrado' => 1];
                continue;
            }
            $docs[] = ['col' => $f['col'], 'id' => $f['id'], 'data' => json_decode($f['data']), 'borrado' => (int) ($f['borrado'] ?? 0)];
        }
        salida(['ver' => $ver, 'docs' => $docs, 'vacio' => $vacio, 'perfil' => $u]);
    }
    case 'rango': {
        // Historia antigua para Informes
        $u = requiereYo(); if ($u['rol'] === 'chofer') salida(['docs' => []]);
        $cols = array_values(array_intersect(explode(',', (string) ($_GET['cols'] ?? '')), COLS_PERMITIDAS));
        if (!$cols) salida(['docs' => []]);
        $in = implode(',', array_fill(0, count($cols), '?'));
        $s = db()->prepare("SELECT col,id,local_id,chofer,data FROM docs WHERE borrado = 0 AND col IN ($in) AND fecha >= ? AND fecha <= ?");
        $s->execute([...$cols, substr((string) ($_GET['desde'] ?? ''), 0, 10), substr((string) ($_GET['hasta'] ?? ''), 0, 10) . ' 23:59:59']);
        $docs = [];
        foreach ($s as $f) if (puedeLeer($u, $f)) $docs[] = ['col' => $f['col'], 'id' => $f['id'], 'data' => json_decode($f['data'])];
        salida(['docs' => $docs]);
    }
    case 'lote': {
        // Guarda o borra varios documentos: {docs:[{col,id,data|null}]}
        $u = requiereYo(); $raw = file_get_contents('php://input') ?: '{}';
        $b = json_decode($raw, true) ?: []; $bo = json_decode($raw, false);
        $res = []; $cambios = [];
        $p = db(); $p->beginTransaction();
        $leer = $p->prepare('SELECT local_id, data, borrado FROM docs WHERE col = ? AND id = ?');
        foreach (array_slice($b['docs'] ?? [], 0, 500, true) as $i => $d) {
            $col = (string) ($d['col'] ?? ''); $id = substr((string) ($d['id'] ?? ''), 0, 90); $data = $d['data'] ?? null;
            $json = $data !== null ? json_encode($bo->docs[$i]->data, JSON_UNESCAPED_UNICODE) : null;
            if (!in_array($col, COLS_PERMITIDAS, true) || $id === '' || ($data !== null && !is_array($data))) { $res[] = ['ok' => false]; continue; }
            $leer->execute([$col, $id]); $prev = $leer->fetch() ?: null;
            $antes = $prev && !$prev['borrado'] ? json_decode($prev['data'], true) : null;
            $m = $data !== null ? meta($col, $id, $data) : ['local' => null];
            if ($col === 'rendiciones' && $data !== null && !rendicionAbierta($u, (string) ($data['fecha'] ?? ''), (string) ($antes['fecha'] ?? ''), $data, $antes)) { $res[] = ['ok' => false, 'error' => 'día cerrado', 'actual' => $antes]; continue; }
            // Quién agregó cada pago o cargo: lo anota el servidor (no se puede falsificar)
            if ($col === 'rendiciones' && $data !== null) {
                foreach (['pagos', 'cargos'] as $lista) {
                    $ya = array_map(fn($x) => (string) ($x['id'] ?? ''), $antes[$lista] ?? []);
                    foreach (($bo->docs[$i]->data->$lista ?? []) as $k => $x) {
                        if (!is_object($x) || !empty($x->auto) || in_array((string) ($x->id ?? ''), $ya, true)) continue;
                        $x->por = $u['nombre']; $data[$lista][$k]['por'] = $u['nombre'];
                    }
                }
                $json = json_encode($bo->docs[$i]->data, JSON_UNESCAPED_UNICODE);
            }
            if (!puedeEscribir($u, $col, $id, $m, $data, $antes, $prev)) { $res[] = ['ok' => false, 'error' => 'sin permiso', 'actual' => $prev && !$prev['borrado'] ? json_decode($prev['data']) : null]; continue; }
            if ($data === null && !$prev) { $res[] = ['ok' => true]; continue; }
            $res[] = ['ok' => true, 'ver' => grabarDoc($col, $id, $data, $u['uid'], $json)];
            if ($col === 'pedidos' || $col === 'reparto') $cambios[] = [$col, $id, $data, $antes];
        }
        $p->commit();
        $envios = [];
        if ($cambios) { try { $envios = avisosDe($cambios, (int) $u['uid']); } catch (Throwable $e) { error_log('MR Gas push: ' . $e->getMessage()); } }
        if (!$envios) salida(['res' => $res]);
        responderYSeguir(['res' => $res], fn() => enviarPush($envios)); // responde al tiro y después avisa a los celulares
    }
    // ---------- choferes: acceso a la App repartidores con clave diaria ----------
    case 'choferes_acceso': {
        $u = requiereYo(); if (!puedeChoferes($u)) salida(['error' => 'Su usuario no tiene el cuadro Choferes.'], 403);
        $l = db()->query("SELECT * FROM usuarios WHERE rol = 'chofer' ORDER BY nombre")->fetchAll();
        salida(['fecha' => date('Y-m-d'), 'usuarios' => array_map(fn($x) => perfilDe($x) + ['diaria' => esDiaria($x), 'codigo' => esDiaria($x) ? codigoDiario((int) $x['uid']) : null], $l)]);
    }
    case 'chofer_acceso': {
        $u = requiereYo(); if (!puedeChoferes($u)) salida(['error' => 'Su usuario no tiene el cuadro Choferes.'], 403);
        $b = cuerpo(); $permDiaria = json_encode(['_v2', 'app.repartidores', PERM_DIARIA]);
        if (!empty($b['uid'])) { // activar / desactivar o pasar a clave diaria (solo usuarios repartidor)
            $s1 = db()->prepare("SELECT * FROM usuarios WHERE uid = ? AND rol = 'chofer'"); $s1->execute([(int) $b['uid']]); $x = $s1->fetch();
            if (!$x) salida(['error' => 'Ese usuario no es un repartidor.'], 400);
            if (isset($b['activo'])) db()->prepare('UPDATE usuarios SET activo = ? WHERE uid = ?')->execute([$b['activo'] ? 1 : 0, $x['uid']]);
            if (!empty($b['diaria'])) {
                $pp = $x['permisos'] !== null ? (json_decode($x['permisos'], true) ?: []) : [];
                if (!in_array('_v2', $pp, true)) $pp = ['_v2', 'app.repartidores'];
                if (!in_array('app.repartidores', $pp, true)) $pp[] = 'app.repartidores';
                if (!in_array(PERM_DIARIA, $pp, true)) $pp[] = PERM_DIARIA;
                db()->prepare('UPDATE usuarios SET permisos = ?, hash = ? WHERE uid = ?')->execute([json_encode(array_values($pp)), password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT), $x['uid']]);
            }
            salida(['ok' => true]);
        }
        $ch = (int) ($b['chofer'] ?? 0); $user = strtolower(trim((string) ($b['user'] ?? '')));
        if ($ch <= 0) salida(['error' => 'Elija el chofer.'], 400);
        if (!preg_match('/^[a-z0-9._-]{3,30}$/', $user)) salida(['error' => 'El usuario debe tener entre 3 y 30 letras o números, sin espacios ni tildes.'], 400);
        $s1 = db()->prepare('SELECT COUNT(*) FROM usuarios WHERE usuario = ?'); $s1->execute([$user]);
        if ((int) $s1->fetchColumn() > 0) salida(['error' => 'Ese usuario ya existe. Elija otro.'], 400);
        $s1 = db()->prepare("SELECT COUNT(*) FROM usuarios WHERE rol = 'chofer' AND chofer = ? AND activo = 1"); $s1->execute([$ch]);
        if ((int) $s1->fetchColumn() > 0) salida(['error' => 'Ese chofer ya tiene acceso.'], 400);
        $local = isset($b['local']) ? (int) $b['local'] : null; $nombre = mb_substr(trim((string) ($b['nombre'] ?? $user)), 0, 80);
        // la clave guardada es aleatoria e inservible: el chofer entra solo con el código del día
        db()->prepare('INSERT INTO usuarios (usuario, hash, nombre, rol, local_id, sucursales, permisos, chofer, activo, creado) VALUES (?,?,?,?,?,?,?,?,1,?)')
            ->execute([$user, password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT), $nombre ?: $user, 'chofer', $local, json_encode($local ? [$local] : []), $permDiaria, $ch, ahora()]);
        salida(['ok' => true]);
    }
    // ---------- avisos al celular (push) ----------
    case 'push_clave':
        requiereYo(); salida(['clave' => vapid()['pub']]);
    case 'push_alta': {
        $u = requiereYo(); $b = cuerpo(); asegurarPush();
        $ep = (string) ($b['endpoint'] ?? ''); $k = $b['keys'] ?? [];
        if (!preg_match('#^https://#', $ep) || strlen($ep) > 1000 || empty($k['p256dh']) || empty($k['auth'])) salida(['error' => 'Suscripción no válida.'], 400);
        $id = hash('sha256', $ep); $app = in_array($b['app'] ?? '', ['repartidores', 'distribucion'], true) ? $b['app'] : 'repartidores';
        db()->prepare('DELETE FROM push_subs WHERE id = ?')->execute([$id]);
        db()->prepare('INSERT INTO push_subs (id, uid, endpoint, p256dh, auth, app, creado) VALUES (?,?,?,?,?,?,?)')
            ->execute([$id, $u['uid'], $ep, substr((string) $k['p256dh'], 0, 200), substr((string) $k['auth'], 0, 100), $app, ahora()]);
        salida(['ok' => true]);
    }
    case 'push_baja': {
        $b = cuerpo(); asegurarPush();
        db()->prepare('DELETE FROM push_subs WHERE id = ?')->execute([hash('sha256', (string) ($b['endpoint'] ?? ''))]);
        salida(['ok' => true]);
    }
    case 'push_prueba': {
        $u = requiereYo(); $b = cuerpo(); $ep = (string) ($b['endpoint'] ?? '');
        $subs = $ep !== '' ? subsDe('s.uid = ? AND s.id = ?', [$u['uid'], hash('sha256', $ep)]) : subsDe('s.uid = ?', [$u['uid']]);
        if (!$subs) salida(['error' => 'Este celular no está registrado para avisos en el servidor.'], 400);
        $retraso = max(0, min(20, (int) ($b['espera'] ?? 0)));
        $envio = array_map(fn($s) => [$s, ['titulo' => 'Prueba de aviso', 'cuerpo' => 'Así llegará cada pedido, aunque la pantalla esté bloqueada.', 'tag' => 'prueba']], $subs);
        if ($retraso) responderYSeguir(['ok' => true, 'programado' => $retraso], function () use ($envio, $retraso) { sleep($retraso); enviarPush($envio); });
        $r = enviarPush($envio);
        $log = json_decode(ajuste('push_log') ?? '[]', true) ?: [];
        salida(['ok' => true, 'enviados' => count(array_filter($r, fn($c) => $c >= 200 && $c < 300)), 'total' => count($subs), 'detalle' => array_slice($log, 0, count($subs))]);
    }
    case 'push_diag': {
        $u = requiereYo(); $b = cuerpo(); asegurarPush();
        $ec = false; $ecErr = '';
        try { $k = nuevaClaveEC(); $k2 = nuevaClaveEC(); $ec = openssl_pkey_derive(openssl_pkey_get_public(pemPublico(puntoDe($k2))), $k, 32) !== false; } catch (Throwable $e) { $ecErr = $e->getMessage(); }
        $ep = (string) ($b['endpoint'] ?? '');
        $s1 = db()->prepare('SELECT COUNT(*) FROM push_subs WHERE uid = ?'); $s1->execute([$u['uid']]);
        $s2 = db()->prepare('SELECT COUNT(*) FROM push_subs WHERE id = ? AND uid = ?'); $s2->execute([hash('sha256', $ep), $u['uid']]);
        $log = json_decode(ajuste('push_log') ?? '[]', true) ?: [];
        if ($u['rol'] !== 'admin') $log = array_values(array_filter($log, fn($x) => (int) ($x['uid'] ?? 0) === (int) $u['uid']));
        salida(['clave' => vapid()['pub'], 'openssl' => $ec, 'openssl_error' => $ecErr, 'curl' => function_exists('curl_multi_init'),
            'https' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
            'mis_celulares' => (int) $s1->fetchColumn(), 'este_registrado' => (int) $s2->fetchColumn() > 0, 'ultimos' => array_slice($log, 0, 8)]);
    }
    case 'contador': {
        // Número correlativo de pedido, compartido por todos los PC
        requiereYo(); $b = cuerpo();
        $p = db(); $p->beginTransaction();
        $n = siguiente('pedidos', max(0, (int) ($b['minimo'] ?? 0) - 1));
        $p->commit();
        salida(['n' => $n]);
    }
    case 'pedido_web': {
        // Sitio para clientes desactivado: el sistema es solo de control interno
        salida(['error' => 'Los pedidos se ingresan solo desde el sistema interno.'], 403);
        limitar('web', 5, 600); $b = cuerpo();
        $txt = fn($k, $n) => mb_substr(trim((string) ($b[$k] ?? '')), 0, $n);
        if ($txt('fono', 30) === '' || $txt('dir', 160) === '') salida(['error' => 'Faltan el teléfono o la dirección.'], 400);
        $p = db(); $p->beginTransaction();
        $id = siguiente('pedidos');
        $ped = ['id' => $id, 'fecha' => ahora(), 'nombre' => $txt('nombre', 80), 'fono' => $txt('fono', 30), 'dir' => $txt('dir', 160),
            'formato' => $txt('formato', 8), 'cant' => max(1, min(20, (int) ($b['cant'] ?? 1))), 'precio' => max(0, (int) ($b['precio'] ?? 0)),
            'local' => (int) ($b['local'] ?? 1), 'estado' => 'pendiente', 'chofer' => null, 'medio' => 'efectivo', 'origen' => 'web'];
        grabarDoc('pedidos', (string) $id, $ped, null);
        $bit = ['id' => microtime(true), 'fecha' => ahora(), 'user' => 'Sitio web', 'local' => $ped['local'], 'area' => 'pedidos', 'accion' => 'Pedido web recibido',
            'detalle' => "Pedido N° $id · {$ped['cant']}× {$ped['formato']} · {$ped['fono']} · {$ped['dir']}", 'chofer' => null, 'pedido' => $id];
        grabarDoc('bitacora', 'w' . $id, $bit, null);
        $p->commit();
        anotarIntento('web');
        salida(['ok' => true, 'id' => $id]);
    }

    // ---------- usuarios (administrador) ----------
    case 'usuarios': {
        requiereAdmin();
        $l = db()->query('SELECT * FROM usuarios ORDER BY nombre')->fetchAll();
        salida(['usuarios' => array_map('perfilDe', $l)]);
    }
    case 'usuario': {
        $adm = requiereAdmin(); $b = cuerpo();
        // al editar un usuario (por ejemplo, darle clave nueva) se le quita el bloqueo por intentos fallidos
        if (!empty($b['uid'])) { $sq = db()->prepare('SELECT usuario FROM usuarios WHERE uid = ?'); $sq->execute([(int) $b['uid']]);
            if ($nu = $sq->fetchColumn()) db()->prepare('DELETE FROM intentos WHERE ip = ? AND tipo = ?')->execute([substr('u:' . $nu, 0, 45), 'login-u']); }
        // Un administrador sin «Respaldos y reset» no puede dar ese permiso ni cambiar a quien lo tiene
        $total = fn(?array $per) => $per === null || in_array('respaldos', $per, true);
        $soyTotal = $total($adm['permisos']);
        if (!$soyTotal) {
            if (($b['rol'] ?? '') === 'admin') $b['permisos'] = [];
            if (!empty($b['uid'])) {
                $s0 = db()->prepare('SELECT * FROM usuarios WHERE uid = ?'); $s0->execute([(int) $b['uid']]); $obj = $s0->fetch();
                if ($obj && $obj['rol'] === 'admin' && $total($obj['permisos'] !== null ? json_decode($obj['permisos'], true) : null))
                    salida(['error' => 'Solo un administrador con permiso de respaldos puede cambiar a este usuario.'], 403);
            }
        }
        $rol = in_array($b['rol'] ?? '', ['admin', 'encargado', 'chofer'], true) ? $b['rol'] : 'encargado';
        $suc = array_values(array_map('intval', (array) ($b['sucursales'] ?? [])));
        $per = isset($b['permisos']) && is_array($b['permisos']) ? json_encode(array_values($b['permisos'])) : null;
        $local = $rol === 'admin' ? null : ($suc[0] ?? null);
        $chofer = $rol === 'chofer' && isset($b['chofer']) ? (int) $b['chofer'] : null;
        $nombre = mb_substr(trim((string) ($b['nombre'] ?? '')), 0, 80);
        $pass = (string) ($b['pass'] ?? '');
        if (!empty($b['uid'])) {
            $uid = (int) $b['uid'];
            if (isset($b['activo']) && count($b) <= 2) { // activar o desactivar
                if ($uid === $adm['uid'] && !$b['activo']) salida(['error' => 'No puede desactivar su propio usuario.'], 400);
                db()->prepare('UPDATE usuarios SET activo = ? WHERE uid = ?')->execute([$b['activo'] ? 1 : 0, $uid]);
                salida(['ok' => true]);
            }
            $s1 = db()->prepare('SELECT * FROM usuarios WHERE uid = ?'); $s1->execute([$uid]); $ant = $s1->fetch();
            if ($ant && esDiaria($ant) && $rol === 'chofer' && $pass === '') {
                $pp = $per !== null ? (json_decode($per, true) ?: []) : ['_v2', 'app.repartidores'];
                if (!in_array(PERM_DIARIA, $pp, true)) $pp[] = PERM_DIARIA;
                $per = json_encode(array_values($pp));
            }
            db()->prepare('UPDATE usuarios SET nombre = ?, rol = ?, local_id = ?, sucursales = ?, permisos = ?, chofer = ? WHERE uid = ?')
                ->execute([$nombre, $rol, $local, json_encode($suc), $per, $chofer, $uid]);
            if ($pass !== '') {
                if (strlen($pass) < 4) salida(['error' => 'La clave debe tener al menos 4 caracteres.'], 400);
                db()->prepare('UPDATE usuarios SET hash = ? WHERE uid = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $uid]);
            }
            salida(['ok' => true]);
        }
        $user = strtolower(trim((string) ($b['user'] ?? '')));
        if (!preg_match('/^[a-z0-9._-]{3,30}$/', $user)) salida(['error' => 'El usuario debe tener entre 3 y 30 letras, números, punto o guion, sin espacios.'], 400);
        if (strlen($pass) < 4) salida(['error' => 'La clave debe tener al menos 4 caracteres.'], 400);
        $s = db()->prepare('SELECT COUNT(*) FROM usuarios WHERE usuario = ?'); $s->execute([$user]);
        if ((int) $s->fetchColumn() > 0) salida(['error' => 'Ese usuario ya existe. Elija otro.'], 400);
        db()->prepare('INSERT INTO usuarios (usuario, hash, nombre, rol, local_id, sucursales, permisos, chofer, activo, creado) VALUES (?,?,?,?,?,?,?,?,1,?)')
            ->execute([$user, password_hash($pass, PASSWORD_DEFAULT), $nombre ?: $user, $rol, $local, json_encode($suc), $per, $chofer, ahora()]);
        salida(['ok' => true]);
    }

    default:
        salida(['error' => 'Acción desconocida.'], 404);
    }
} catch (Throwable $e) {
    if (isset($p) && $p instanceof PDO && $p->inTransaction()) $p->rollBack();
    error_log('MR Gas API: ' . $e->getMessage());
    salida(['error' => 'Error del servidor. Intente de nuevo en un momento.'], 500);
}

<?php
// MR Gas · instalación en 2 pasos:
//   1) Conectar la base de datos: crea mrgas-config.php UN NIVEL ARRIBA de public_html (GitHub nunca lo borra).
//   2) Crear las tablas y el primer administrador.
// Cuando ya hay configuración y usuarios, esta página se bloquea sola.
declare(strict_types=1);
require __DIR__ . '/nucleo.php';
date_default_timezone_set('America/Santiago');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$destino = dirname(dirname(__DIR__)) . '/mrgas-config.php';   // .../dominio/mrgas-config.php
$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
$paso = rutaConfig() ? 2 : 1;
$msg = ''; $ok = false; $yaEsta = false; $copiar = '';
$f = ['host' => 'localhost', 'name' => '', 'user' => '', 'pass' => ''];

// ---------- Paso 1: datos de la base ----------
if ($paso === 1 && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['paso'] ?? '') === '1') {
    foreach ($f as $k => $v) $f[$k] = trim((string) ($_POST[$k] ?? $v));
    if ($f['host'] === '') $f['host'] = 'localhost';
    if ($f['name'] === '' || $f['user'] === '' || $f['pass'] === '') {
        $msg = 'Complete el nombre de la base, el usuario y la clave.';
    } else {
        try {
            new PDO("mysql:host={$f['host']};dbname={$f['name']};charset=utf8mb4", $f['user'], $f['pass'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
            $contenido = "<?php\n// MR Gas · conexión a la base de datos (creado por instalar.php el " . date('Y-m-d H:i') . ")\n"
                . "// Este archivo está FUERA de public_html para que GitHub no lo borre. No lo suba a GitHub.\n"
                . "return [\n"
                . "    'db_host' => " . var_export($f['host'], true) . ",\n"
                . "    'db_name' => " . var_export($f['name'], true) . ",\n"
                . "    'db_user' => " . var_export($f['user'], true) . ",\n"
                . "    'db_pass' => " . var_export($f['pass'], true) . ",\n"
                . "    'dias_pedidos'  => 7,\n    'dias_bitacora' => 2,\n    'dias_otros'    => 45,\n];\n";
            if (@file_put_contents($destino, $contenido, LOCK_EX) !== false) {
                @chmod($destino, 0600);
                header('Location: instalar.php?conectado=1');
                exit;
            }
            $copiar = $contenido;
            $msg = 'La conexión funciona, pero Hostinger no dejó crear el archivo automáticamente. Créelo a mano (instrucciones abajo).';
        } catch (Throwable $e) {
            $m = $e->getMessage();
            $msg = str_contains($m, 'Access denied') ? 'El usuario o la clave de la base no son correctos. Revíselos en hPanel → Bases de datos.'
                 : (str_contains($m, 'Unknown database') ? 'No existe una base con ese nombre. Cópielo tal cual desde hPanel → Bases de datos (ej: u123456789_mrgas).'
                 : 'No se pudo conectar: ' . $m);
        }
    }
}

// ---------- Paso 2: tablas y administrador ----------
if ($paso === 2) {
    try {
        $yaEsta = instalado();
        if (!$yaEsta && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['paso'] ?? '') === '2') {
            $user = strtolower(trim((string) ($_POST['user'] ?? '')));
            $nombre = trim((string) ($_POST['nombre'] ?? ''));
            $pass = (string) ($_POST['pass'] ?? '');
            if (!preg_match('/^[a-z0-9._-]{3,30}$/', $user)) $msg = 'El usuario debe tener entre 3 y 30 letras o números, sin espacios.';
            elseif (strlen($pass) < 4) $msg = 'La clave debe tener al menos 4 caracteres.';
            else {
                crearTablas();
                db()->prepare('INSERT INTO usuarios (usuario, hash, nombre, rol, local_id, sucursales, permisos, chofer, activo, creado) VALUES (?,?,?,?,NULL,?,NULL,NULL,1,?)')
                    ->execute([$user, password_hash($pass, PASSWORD_DEFAULT), $nombre ?: $user, 'admin', '[]', date('Y-m-d H:i:s')]);
                $ok = true; $yaEsta = true;
            }
        }
    } catch (Throwable $e) {
        $msg = 'El archivo mrgas-config.php existe, pero no conecta con la base. Revise sus datos en el Administrador de archivos (carpeta del dominio, al lado de public_html). Detalle: ' . $h($e->getMessage());
    }
}
?><!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Instalar MR Gas</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f9;font:15px/1.5 system-ui,sans-serif;color:#0c1424;padding:16px}
.c{background:#fff;border:1px solid #e7eaf0;border-radius:14px;padding:28px;max-width:460px;width:100%;box-shadow:0 12px 32px -8px rgba(16,24,40,.12)}
h1{margin:0 0 6px;font-size:22px}p{color:#6b7488;margin:0 0 16px}label{display:grid;gap:4px;font-weight:600;font-size:13px;margin-bottom:12px}
label small{font-weight:400;color:#6b7488}input{padding:10px 12px;border:1px solid #d0d7e2;border-radius:8px;font:inherit}
button{width:100%;padding:11px;border:0;border-radius:8px;background:#0d3a85;color:#fff;font:600 15px system-ui;cursor:pointer}
.e{background:#fef3f2;color:#b42318;padding:10px 12px;border-radius:8px;margin-bottom:14px}.k{background:#ecfdf3;color:#067647;padding:10px 12px;border-radius:8px;margin-bottom:14px}
.pasos{display:flex;gap:8px;margin-bottom:16px;font-size:12.5px;font-weight:600}.pasos span{flex:1;padding:6px 8px;border-radius:8px;background:#f2f4f7;color:#6b7488;text-align:center}
.pasos .on{background:#ecf3fd;color:#0d3a85}.pasos .ok{background:#ecfdf3;color:#067647}
.ayuda{background:#f5f8fd;border:1px solid #d6e4fa;border-radius:8px;padding:10px 12px;font-size:13px;color:#344054;margin-bottom:14px}
pre{background:#0c1424;color:#e7eaf0;padding:12px;border-radius:8px;font-size:12px;overflow:auto;white-space:pre-wrap}a{color:#1250b0}</style></head><body><div class="c">
<div class="pasos"><span class="<?= $paso === 1 ? 'on' : 'ok' ?>">1. Base de datos</span><span class="<?= $paso === 2 ? ($yaEsta ? 'ok' : 'on') : '' ?>">2. Administrador</span></div>

<?php if ($paso === 1): ?>
  <h1>Conectar la base de datos</h1>
  <p>Escriba los datos de su base MySQL de Hostinger. Se guardan en un archivo fuera de <b>public_html</b>, así no se borran al actualizar desde GitHub.</p>
  <div class="ayuda">Los datos están en <b>hPanel → Bases de datos → Bases de datos MySQL</b>. Si no recuerda la clave, ahí mismo puede cambiarla.</div>
  <?php if ($msg): ?><div class="e"><?= $h($msg) ?></div><?php endif; ?>
  <?php if ($copiar): ?>
    <p><b>Créelo a mano:</b> en el Administrador de archivos salga de <b>public_html</b> (suba un nivel), cree el archivo <b>mrgas-config.php</b> y pegue esto. Luego recargue esta página.</p>
    <pre><?= $h($copiar) ?></pre>
  <?php else: ?>
  <form method="post"><input type="hidden" name="paso" value="1">
    <label>Nombre de la base <small>ej: u123456789_mrgas</small><input name="name" value="<?= $h($f['name']) ?>" required autocomplete="off"></label>
    <label>Usuario de la base <small>ej: u123456789_mrgas</small><input name="user" value="<?= $h($f['user']) ?>" required autocomplete="off"></label>
    <label>Clave de la base<input name="pass" type="password" required autocomplete="new-password"></label>
    <label>Servidor <small>déjelo en localhost</small><input name="host" value="<?= $h($f['host']) ?>"></label>
    <button>Probar y guardar</button></form>
  <?php endif; ?>

<?php elseif ($ok): ?>
  <h1>Listo</h1><div class="k">MR Gas quedó instalado. Ya puede entrar con el usuario que creó.</div><p><a href="../">Ir al menú de inicio →</a></p>
<?php elseif ($yaEsta): ?>
  <h1>MR Gas ya está instalado</h1>
  <?php if (isset($_GET['conectado'])): ?><div class="k">Base de datos conectada. Sus datos anteriores siguen ahí.</div><?php endif; ?>
  <p>Por seguridad esta página ya no hace nada. Los usuarios se crean dentro del sistema, en «Configuraciones → Usuarios y permisos».</p><p><a href="../">Ir al menú de inicio →</a></p>
<?php else: ?>
  <h1>Crear el administrador</h1>
  <?php if (isset($_GET['conectado'])): ?><div class="k">Base de datos conectada.</div><?php endif; ?>
  <p>Se crearán las tablas en su base de datos y el primer usuario administrador.</p>
  <?php if ($msg): ?><div class="e"><?= $msg ?></div><?php endif; ?>
  <form method="post"><input type="hidden" name="paso" value="2"><label>Usuario<input name="user" value="matias" required></label><label>Nombre<input name="nombre" value="Matías"></label>
  <label>Clave<input name="pass" type="password" required minlength="4"></label><button>Instalar</button></form>
<?php endif; ?>
</div></body></html>

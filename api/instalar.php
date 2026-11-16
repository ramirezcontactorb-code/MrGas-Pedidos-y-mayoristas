<?php
// MR Gas · instalación (crea las tablas y el primer administrador). Se bloquea sola cuando ya hay usuarios.
declare(strict_types=1);
require __DIR__ . '/nucleo.php';
date_default_timezone_set('America/Santiago');
header('Content-Type: text/html; charset=utf-8');
$msg = ''; $ok = false;
if (!is_file(__DIR__ . '/config.php')) {
    echo '<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:32px;max-width:560px;margin:auto"><h1>Falta un paso</h1><p>En el Administrador de archivos de Hostinger, dentro de <b>public_html/api</b>, copie <b>config.ejemplo.php</b> con el nombre <b>config.php</b> y escriba ahí los datos de su base de datos MySQL. Luego vuelva a abrir esta página.</p></body>';
    exit;
}
try {
    $yaEsta = instalado();
    if (!$yaEsta && $_SERVER['REQUEST_METHOD'] === 'POST') {
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
    $msg = 'No se pudo conectar a la base de datos. Revise los datos en api/config.php. (' . htmlspecialchars($e->getMessage()) . ')';
    $yaEsta = false;
}
?><!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instalar MR Gas</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f9;font:15px/1.5 system-ui,sans-serif;color:#0c1424;padding:16px}
.c{background:#fff;border:1px solid #e7eaf0;border-radius:14px;padding:28px;max-width:420px;width:100%;box-shadow:0 12px 32px -8px rgba(16,24,40,.12)}
h1{margin:0 0 6px;font-size:22px}p{color:#6b7488;margin:0 0 16px}label{display:grid;gap:4px;font-weight:600;font-size:13px;margin-bottom:12px}
input{padding:10px 12px;border:1px solid #d0d7e2;border-radius:8px;font:inherit}button{width:100%;padding:11px;border:0;border-radius:8px;background:#0d3a85;color:#fff;font:600 15px system-ui;cursor:pointer}
.e{background:#fef3f2;color:#b42318;padding:10px 12px;border-radius:8px;margin-bottom:14px}.k{background:#ecfdf3;color:#067647;padding:10px 12px;border-radius:8px}a{color:#1250b0}</style></head><body><div class="c">
<?php if ($ok): ?>
  <h1>Listo</h1><div class="k">MR Gas quedó instalado. Ya puede entrar con el usuario que creó.</div><p style="margin-top:14px"><a href="../#acceso">Ir al sistema →</a></p>
<?php elseif ($yaEsta): ?>
  <h1>MR Gas ya está instalado</h1><p>Por seguridad esta página ya no hace nada. Los usuarios se crean dentro del sistema, en «Configuraciones → Usuarios y permisos».</p><p><a href="../#acceso">Ir al sistema →</a></p>
<?php else: ?>
  <h1>Instalar MR Gas</h1><p>Se crearán las tablas en su base de datos de Hostinger y el primer administrador.</p>
  <?php if ($msg): ?><div class="e"><?= $msg ?></div><?php endif; ?>
  <form method="post"><label>Usuario<input name="user" value="matias" required></label><label>Nombre<input name="nombre" value="Matías"></label>
  <label>Clave<input name="pass" type="password" required minlength="4"></label><button>Instalar</button></form>
<?php endif; ?>
</div></body></html>

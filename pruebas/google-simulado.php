<?php
// Google simulado para pruebas: token, carpeta, subida reanudable, lista y borrado
$u = parse_url($_SERVER['REQUEST_URI']); $p = $u['path']; $m = $_SERVER['REQUEST_METHOD'];
$dir = __DIR__ . '/datos'; @mkdir($dir); // archivos del Drive simulado
$log = fn($x) => file_put_contents($dir . '/log.txt', date('H:i:s') . " $m $p $x\n", FILE_APPEND);
header('Content-Type: application/json');
if ($p === '/token') {
    $log(json_encode($_POST));
    if (($_POST['grant_type'] ?? '') === 'authorization_code') {
        if (($_POST['code'] ?? '') !== 'CODIGO-OK') { http_response_code(400); echo '{"error":"invalid_grant","error_description":"Bad code"}'; exit; }
        $idt = 'x.' . rtrim(strtr(base64_encode('{"email":"dueno@ejemplo.cl"}'), '+/', '-_'), '=') . '.y';
        echo json_encode(['access_token' => 'AT1', 'refresh_token' => 'RT1', 'id_token' => $idt]); exit;
    }
    if (($_POST['refresh_token'] ?? '') === 'RT1') { echo '{"access_token":"AT2"}'; exit; }
    http_response_code(400); echo '{"error":"invalid_grant"}'; exit;
}
if (($_SERVER['HTTP_AUTHORIZATION'] ?? '') !== 'Bearer AT2') { http_response_code(401); echo '{"error":{"message":"no auth"}}'; exit; }
$files = json_decode(@file_get_contents($dir . '/files.json') ?: '[]', true);
function guardarF($d,$f){file_put_contents($d . '/files.json', json_encode($f));}
if ($p === '/drive/v3/files' && $m === 'POST') { $b = json_decode(file_get_contents('php://input'), true); $id = 'F' . count($files) . rand(100, 999); $files[] = ['id' => $id, 'name' => $b['name'], 'folder' => true]; guardarF($dir,$files); $log($b['name']); echo json_encode(['id' => $id]); exit; }
if ($p === '/drive/v3/files' && $m === 'GET') { $l = array_values(array_filter($files, fn($f) => empty($f['folder']))); $l = array_reverse($l); echo json_encode(['files' => $l]); exit; }
if (preg_match('#^/drive/v3/files/(.+)$#', $p, $x)) {
    if ($m === 'DELETE') { $files = array_values(array_filter($files, fn($f) => $f['id'] !== $x[1])); guardarF($dir,$files); $log('borrado ' . $x[1]); http_response_code(204); exit; }
    foreach ($files as $f) if ($f['id'] === $x[1]) { echo json_encode(['id' => $f['id'], 'trashed' => false]); exit; }
    http_response_code(404); echo '{}'; exit;
}
if ($p === '/upload/drive/v3/files' && $m === 'POST') { $b = json_decode(file_get_contents('php://input'), true); file_put_contents($dir . '/pend.json', json_encode($b));
    header('Location: http://' . $_SERVER['HTTP_HOST'] . '/subida/1', true, 200); echo '{}'; exit; }
if ($p === '/subida/1' && $m === 'PUT') { $b = json_decode(file_get_contents($dir . '/pend.json'), true); $data = file_get_contents('php://input');
    $id = 'A' . rand(10000, 99999); $files[] = ['id' => $id, 'name' => $b['name'], 'size' => strlen($data), 'gz' => substr(bin2hex($data), 0, 4)]; guardarF($dir,$files); $log($b['name'] . ' ' . strlen($data));
    http_response_code(200); echo json_encode(['id' => $id]); exit; }
http_response_code(404); echo '{"error":"no existe ' . $p . '"}';

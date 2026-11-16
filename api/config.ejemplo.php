<?php
// ============================================================
//  MR Gas · conexión a la base de datos de Hostinger
//  1) En Hostinger cree el archivo  mrgas-config.php  UN NIVEL ARRIBA de public_html
//     (ej: /home/u123456789/domains/tu-dominio/mrgas-config.php) y pegue este contenido.
//     Ahí GitHub no lo borra al actualizar.
//  2) Ponga los datos de hPanel → Bases de datos → MySQL
//  Este archivo con la clave NUNCA se sube a GitHub.
// ============================================================
return [
    // Datos de la base MySQL creada en Hostinger
    'db_host' => 'localhost',
    'db_name' => 'PEGA_AQUI_NOMBRE_BASE',     // ej: u123456789_mrgas
    'db_user' => 'PEGA_AQUI_USUARIO_BASE',    // ej: u123456789_mrgas
    'db_pass' => 'PEGA_AQUI_CLAVE_BASE',

    // Para pruebas locales sin MySQL se puede usar SQLite:
    // 'dsn' => 'sqlite:' . __DIR__ . '/../datos-prueba.sqlite',

    // Cuántos días de historia carga cada PC al abrir (lo antiguo se pide en Informes)
    'dias_pedidos'  => 7,
    'dias_bitacora' => 2,
    'dias_otros'    => 45,
];

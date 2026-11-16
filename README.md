# MR Gas · sistema de pedidos y reparto

Sistema web para tomar pedidos de gas, asignarlos a los camiones por sectores y controlar choferes,
cuadraturas y bodega. Funciona en Hostinger con PHP y base de datos MySQL.

## Carpetas del repositorio

```
mrgas/
├── index.html            ← el sistema completo (pantallas)
├── sw.js                 ← permite instalar la app en PC y celular
├── manifest.webmanifest  ← nombre e íconos de la app instalada
├── calles-rm.json        ← mapa de calles (OpenStreetMap)
├── calles-rm.js          ← copia del mapa (respaldo)
├── .htaccess             ← candado HTTPS y protección de archivos
├── .gitignore            ← evita subir la clave de la base a GitHub
├── robots.txt, sitemap.xml
├── icons/                ← íconos de la app
└── api/                  ← servidor (PHP)
    ├── index.php         ← recibe y entrega los datos
    ├── nucleo.php        ← conexión, sesión y permisos
    ├── instalar.php      ← crea las tablas y el primer usuario
    ├── config.ejemplo.php← modelo de configuración (sin claves)
    └── .htaccess         ← protege los archivos internos
```

`api/config.php` **no está en GitHub** a propósito: tiene la clave de la base de datos.
Se crea una sola vez en Hostinger (paso 6).

---

## Paso a paso

### Paso 1. Subir la carpeta a GitHub
1. Entra a github.com → botón **New** (nuevo repositorio).
2. Nombre: `mrgas`. Marca **Private** (privado). No marques "Add a README". Presiona **Create repository**.
3. En la página del repositorio vacío, haz clic en **uploading an existing file**.
4. Arrastra **todo el contenido** de la carpeta `mrgas` (no la carpeta en sí, sino lo que está dentro), incluidas las carpetas `api` e `icons`.
   - Revisa que aparezcan `.htaccess` y `.gitignore`. En Mac están ocultos: en el Finder presiona `Cmd + Shift + .` para verlos antes de arrastrar.
5. Abajo presiona **Commit changes**.

> Alternativa más cómoda: **GitHub Desktop** (programa gratis). File → Add local repository → elige la carpeta `mrgas` → Publish repository (marcado como privado).

### Paso 2. Crear la base de datos en Hostinger
1. hPanel → **Bases de datos → Administración (MySQL)**.
2. Crea una base nueva con nombre, usuario y una clave segura.
3. Anota los 3 datos completos que muestra Hostinger (ej: `u123456789_mrgas`).

### Paso 3. Dejar vacía la carpeta del sitio
Hostinger solo conecta GitHub si `public_html` está vacía.
hPanel → **Archivos → Administrador de archivos** → `public_html` → borra lo que traiga Hostinger por defecto (por ejemplo `default.php`).

### Paso 4. Conectar GitHub con Hostinger
1. hPanel → tu sitio → **Avanzado → GIT**.
2. Como el repositorio es privado, Hostinger muestra una **clave SSH** en esa misma página. Cópiala.
3. En GitHub: repositorio `mrgas` → **Settings → Deploy keys → Add deploy key** → pega la clave → **Add key** (sin marcar "Allow write access").
4. De vuelta en Hostinger, en **Crear un nuevo repositorio**:
   - Repositorio: `git@github.com:TU-USUARIO/mrgas.git`
   - Rama: `main`
   - Directorio: déjalo **vacío** (así se instala en `public_html`)
   - Presiona **Crear**.
5. En la lista aparece el repositorio: presiona **Implementar** (Deploy). Los archivos se copian a `public_html`.

### Paso 5. Actualización automática (opcional, recomendado)
1. En Hostinger → **GIT** → en tu repositorio presiona **Implementación automática** y copia la **URL del webhook**.
2. En GitHub → **Settings → Webhooks → Add webhook** → pega la URL en *Payload URL* → **Add webhook**.

Desde ahora, cada cambio que subas a GitHub se publica solo en Hostinger.

### Paso 6. Crear `config.php` (una sola vez, en Hostinger)
1. Administrador de archivos → `public_html/api`.
2. Clic derecho en `config.ejemplo.php` → **Copiar** → nombre: `config.php`.
3. Abre `config.php` y reemplaza los 3 textos `PEGA_AQUI_...` con los datos del paso 2:
   ```php
   'db_name' => 'u123456789_mrgas',
   'db_user' => 'u123456789_mrgas',
   'db_pass' => 'tu-clave',
   ```
4. Guarda. Este archivo queda solo en Hostinger: GitHub no lo toca en las actualizaciones.

### Paso 7. Activar el candado (SSL)
hPanel → **Seguridad → SSL** → instala el certificado gratis para tu dominio.

### Paso 8. Instalar
1. Abre `https://tu-dominio/api/instalar.php`.
2. Usuario `matias`, tu nombre y una clave → **Instalar**. La página se bloquea sola después.

### Paso 9. Entrar
1. `https://tu-dominio/#acceso` con tu usuario.
2. La primera vez se suben las sucursales, choferes y precios de ejemplo: cámbialos en **Administración**, **Precios del Gas** y **Asigna Ruta**.
3. En **Permisos Usuarios** crea a los encargados (con su sucursal) y a los repartidores (con su móvil).

---

## Cómo actualizar el sistema
1. Cambia los archivos en GitHub (o súbelos de nuevo en **Add file → Upload files**).
2. En `sw.js`, sube el número de versión: `mrgas-v3` → `mrgas-v4`. Así cada PC carga la versión nueva.
3. Con la implementación automática, Hostinger lo publica solo. Sin ella: Hostinger → **GIT → Implementar**.

## Respaldos
- Hostinger guarda copias automáticas: hPanel → **Archivos → Copias de seguridad**.
- Copia propia de los datos: hPanel → **Bases de datos → phpMyAdmin** → elige la base → **Exportar**.

## Lo que conviene saber
- Los cambios llegan a los demás PC en unos 3 a 5 segundos.
- Sin internet el PC sigue funcionando y envía lo pendiente al volver la conexión.
- Si dos personas cambian lo mismo en el mismo segundo, queda el último cambio.
- Los avisos al chofer llegan con la app abierta, aunque esté en segundo plano.
- Con 2 o 3 sucursales, 1 GB de base de datos alcanza para varios años.

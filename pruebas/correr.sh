#!/usr/bin/env bash
# MR Gas · pruebas automáticas. Arma dos sitios de prueba (dueño y cliente) con SQLite,
# un Google Drive simulado, y recorre el sistema con un navegador.
# Uso:  bash pruebas/correr.sh        (necesita php con pdo_sqlite y curl, node y playwright)
set -u
R=$(cd "$(dirname "$0")/.." && pwd)
T=$(mktemp -d)
echo "Carpeta de prueba: $T"
for s in a b; do
  mkdir -p "$T/$s"
  rsync -a --exclude .git --exclude pruebas --exclude fuente "$R/" "$T/$s/public_html/"
done
echo "<?php return ['dsn'=>'sqlite:$T/a/p.sqlite','dueno'=>true];" > "$T/a/mrgas-config.php"
echo "<?php return ['dsn'=>'sqlite:$T/b/p.sqlite'];" > "$T/b/mrgas-config.php"
mkdir -p "$T/gsim" && cp "$R/pruebas/google-simulado.php" "$T/gsim/index.php"

PIDS=()
php -S 127.0.0.1:8199 -t "$T/gsim" "$T/gsim/index.php" >/dev/null 2>&1 & PIDS+=($!)
MRGAS_GD_PRUEBA=http://127.0.0.1:8199 php -S 127.0.0.1:8128 -t "$T/a/public_html" >/dev/null 2>&1 & PIDS+=($!)
php -S 127.0.0.1:8129 -t "$T/b/public_html" >/dev/null 2>&1 & PIDS+=($!)
trap 'kill "${PIDS[@]}" 2>/dev/null' EXIT
sleep 1.5
curl -s -o /dev/null -d "paso=2&user=matias&nombre=Matias&pass=Clave1234" http://127.0.0.1:8128/api/instalar.php
curl -s -o /dev/null -d "paso=2&user=cliente&nombre=Cliente&pass=Clave1234" http://127.0.0.1:8129/api/instalar.php

export MRGAS_PRUEBA_DIR="$T" MRGAS_REPO="$R"
FALLAS=0; TOTAL=0
correr() { TOTAL=$((TOTAL+1)); echo; echo "▶ $1"; if "${@:2}"; then echo "  ✔ $1"; else echo "  ✘ FALLÓ: $1"; FALLAS=$((FALLAS+1)); fi; }
correr "Permisos del servidor"            php "$R/pruebas/permisos.php" "$T/a/public_html"
correr "Todas las pantallas (PC y celular)" node "$R/pruebas/pantallas.js"
correr "Protección del navegador (CSP)"   node "$R/pruebas/proteccion.js"
correr "Venta Local: vender y navegar"    node "$R/pruebas/venta-local.js"
correr "Informe comparar meses"           node "$R/pruebas/comparar.js"
correr "Respaldo a Google Drive"          node "$R/pruebas/drive.js"
correr "Panel del dueño y licencias"      node "$R/pruebas/dueno.js"
echo
echo "Resultado: $((TOTAL-FALLAS)) de $TOTAL pruebas bien."
[ "$FALLAS" -eq 0 ]

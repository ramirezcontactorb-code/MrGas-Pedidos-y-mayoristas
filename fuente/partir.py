# Separa el Panel General (un solo HTML) en archivos: app/*.css y app/*.js
# Uso: python3 partir.py <html-completo> <carpeta-del-sitio>
import re, sys, os
src, SITE = sys.argv[1], sys.argv[2]
s = open(src).read()
APP = os.path.join(SITE, "app"); os.makedirs(APP, exist_ok=True)
for f in os.listdir(APP):
    if f.endswith((".js", ".css")): os.remove(os.path.join(APP, f))

# Cada archivo empieza en la primera sección cuyo título empieza así (en orden)
PARTES = [
    ("01-base", None),
    ("02-iconos", "/* ===================== ÍCONOS"),
    ("03-sistema", "/* ===================== PINTAR SISTEMA"),
    ("04-vistas", "/* ===================== VISTAS"),
    ("05-acciones", "/* ===================== ACCIONES DE CADA VISTA"),
    ("06-sectorizar", "/* ===================== SECTORIZAR"),
    ("07-mayorista", "/* ===================== VENTA MAYORISTA (igual"),
    ("08-config", "/* ===================== CONFIGURACIONES"),
    ("09-choferes", "/* ===================== CHOFERES"),
    ("10-bodega-config", "/* ===================== CONTROL DE BODEGA rediseñado"),
    ("11-mejoras", "/* ===== Asigna Ruta"),
    ("12-facturas", "/* ===================== FACTURAS"),
    ("13-usuarios-respaldos", "/* ===== Usuarios"),
    ("14-apariencia", "/* ===================== APARIENCIA"),
]
INI = '<script>\n'; FIN = '</script>\n<style id="tema-erp">'
a = s.index(INI); b = s.index(FIN)
js = s[a + len(INI):b]
cortes = [0]
for nom, m in PARTES[1:]:
    i = js.find("\n" + m, cortes[-1])
    assert i >= 0, nom
    cortes.append(i + 1)
cortes.append(len(js))
tags = []
for k, (nom, _) in enumerate(PARTES):
    open(os.path.join(APP, nom + ".js"), "w").write("/* MR Gas · Panel General · " + nom + " */\n" + js[cortes[k]:cortes[k + 1]])
    tags.append('<script src="app/%s.js"></script>' % nom)
s = s[:a] + "\n".join(tags) + "\n" + s[b + len("</script>\n"):]

# Estilos: cada <style> pasa a un archivo, en el mismo lugar
n = [0]
def css(m):
    nom = ["estilos-base", "estilos-portal", "estilos-login", "estilos-tema"][n[0]] + ".css"; n[0] += 1
    open(os.path.join(APP, nom), "w").write(m.group(2).strip("\n") + "\n")
    return '<link rel="stylesheet" href="app/%s"%s>' % (nom, m.group(1) or "")
s = re.sub(r'<style( id="[^"]*")?>(.*?)</style>', css, s, flags=re.S)

# El único script corto del encabezado
ar = '<script>document.body.classList.add("arrancando");setTimeout(function(){document.body.classList.remove("arrancando")},6000)</script>'
assert s.count(ar) == 1
open(os.path.join(APP, "arranque.js"), "w").write('document.body.classList.add("arrancando");setTimeout(function(){document.body.classList.remove("arrancando")},6000);\n')
s = s.replace(ar, '<script src="app/arranque.js"></script>')

assert "<script>" not in s and " onclick=" not in s, "quedó código en el HTML"
open(os.path.join(SITE, "index.html"), "w").write(s)
print("index", len(s), "| archivos:", len(os.listdir(APP)))

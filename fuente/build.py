import re, sys
SP, SITE = sys.argv[1], sys.argv[2]
import subprocess, os
tail = open(SP + "/tail.html").read()
# permisos: una sola lista (api/permisos.json del repositorio) para servidor y pantalla
import json
PERM = os.environ.get("MRGAS_PERMISOS", "/home/user/mrgas/api/permisos.json")
pj = json.load(open(PERM)); pj.pop("_nota", None)
assert tail.count("/*@PERMISOS@*/") == 1
tail = tail.replace("/*@PERMISOS@*/", "const PERMISOS=" + json.dumps(pj, ensure_ascii=False, separators=(",", ":")) + ";")
full = open(SP + "/cabeza.html").read() + tail   # cabeza.html = encabezado (head + primera parte)
open(SP + "/completo.html", "w").write(full)
subprocess.run([sys.executable, os.path.join(SP, "partir.py"), SP + "/completo.html", SITE], check=True)
head = re.search(r"<head>(.*)</head>", full, re.S).group(1)
body = re.search(r"<body>(.*)</body>", full, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
head = re.sub(r'<script src="(https://www\.gstatic\.com[^"]*|firebase-config\.js)"></script>\s*', '', head)
head = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\s*', '', head)
open(SP + "/novagas.html", "w").write(head + body)
print("ok", len(full))

# Venta Local sin código dentro del HTML (para la protección fuerte del navegador, CSP sin 'unsafe-inline').
# - Cada onclick="…" / oninput="…" pasa a data-hN="evento" y su código a una función en acciones.js
# - Los ${…} dentro del código pasan a atributos data-hNaI y la función los lee de this.dataset
# - Los <script> en línea pasan a archivos
# Uso: from sincodigo import sin_codigo; html = sin_codigo(html, carpeta)
import re, html as H, os

def _interp_fin(s, i):
    """s[i:] empieza con '${'; devuelve el índice justo después del '}' que lo cierra."""
    k = i + 2; prof = 1
    while k < len(s):
        c = s[k]
        if c == '`':                      # plantilla anidada
            k += 1
            while s[k] != '`':
                if s.startswith('${', k): k = _interp_fin(s, k); continue
                if s[k] == '\\': k += 1
                k += 1
        elif c in "'\"":                  # texto entre comillas dentro de la expresión
            q = c; k += 1
            while s[k] != q:
                if s[k] == '\\': k += 1
                k += 1
        elif c == '{': prof += 1
        elif c == '}':
            prof -= 1
            if prof == 0: return k + 1
        k += 1
    raise ValueError('interpolación sin cierre')

def sin_codigo(s, carpeta):
    try: ver = re.search(r"MRGAS_VERSION = '([^']+)'", open(os.path.join(carpeta, '..', 'api', 'nucleo.php')).read()).group(1)
    except Exception: ver = '0'
    funcs = []; n = [0]
    out = []; i = 0
    pat = re.compile(r'(\s)on(click|input|change|submit|keydown|keyup|blur|focus)="')
    while True:
        m = pat.search(s, i)
        if not m: out.append(s[i:]); break
        out.append(s[i:m.start()])
        ev = m.group(2); k = m.end(); partes = []; lit = ''
        while s[k] != '"':
            if s.startswith('${', k):
                e = _interp_fin(s, k); partes.append(('lit', lit)); lit = ''; partes.append(('exp', s[k:e])); k = e
            else:
                lit += s[k]; k += 1
        partes.append(('lit', lit))
        idn = n[0]; n[0] += 1
        # arma el cuerpo: los ${…} dentro de comillas simples se concatenan; fuera, se convierten
        cuerpo = ''; attrs = ''; ai = 0; dentro = False
        for tipo, v in partes:
            if tipo == 'lit':
                v = H.unescape(v)
                for ch in v:
                    if ch == "'": dentro = not dentro
                cuerpo += v
            else:
                nom = 'h%da%d' % (idn, ai); ai += 1
                attrs += ' data-%s="%s"' % (nom, v)
                cuerpo += ("'+this.dataset.%s+'" % nom) if dentro else ('__v(this.dataset.%s)' % nom)
        assert '${' not in cuerpo and '`' not in cuerpo, cuerpo
        funcs.append('%d:function(event){%s}' % (idn, cuerpo))
        out.append('%sdata-h%d="%s"%s' % (m.group(1), idn, ev, attrs))
        i = k + 1
    s = ''.join(out)
    assert not re.search(r'\son[a-z]+="', s), 'quedó un handler en línea'
    # handlers que el código quita a mano
    s = s.replace("br.removeAttribute('onclick')", "[...br.attributes].forEach(a=>{if(/^data-h\\d+$/.test(a.name))br.removeAttribute(a.name)})")
    acc = ('/* Venta Local · acciones de los botones (antes estaban dentro del HTML) */\n'
           '(function(){\n'
           'const __v=x=>x===undefined?undefined:x==="true"?true:x==="false"?false:x==="null"?null:x==="undefined"?undefined:(x!==""&&!isNaN(x)&&String(+x)===x)?+x:x;\n'
           'const A={\n' + ',\n'.join(funcs) + '\n};\n'
           'const EV=["click","input","change","submit","keydown","keyup","blur","focus"];\n'
           'EV.forEach(tipo=>document.addEventListener(tipo,function(e){\n'
           '  let el=e.target;const camino=[];while(el&&el.nodeType===1){camino.push(el);el=el.parentElement}\n'
           '  if(tipo==="blur"||tipo==="focus")camino.length=Math.min(camino.length,1);\n'
           '  for(const x of camino){for(const at of x.attributes){const m=/^data-h(\\d+)$/.exec(at.name);if(!m||at.value!==tipo)continue;\n'
           '    const f=A[m[1]];if(!f)continue;if(f.call(x,e)===false)e.preventDefault()}\n'
           '    if(e.cancelBubble)break}\n'
           '},true));\n'
           '})();\n')
    open(os.path.join(carpeta, 'acciones.js'), 'w', encoding='utf-8').write(acc)
    # <script> en línea → archivos
    nsc = [0]
    def sc(m):
        nsc[0] += 1; nom = ['inicio.js', 'app.js'][nsc[0] - 1]
        open(os.path.join(carpeta, nom), 'w', encoding='utf-8').write(m.group(1).strip('\n') + '\n')
        extra = '\n<script src="acciones.js?v=%s"></script>' % ver if nom == 'app.js' else ''
        return '<script src="%s?v=%s"></script>%s' % (nom, ver, extra)
    s = re.sub(r'<script>(.*?)</script>', sc, s, flags=re.S)
    assert nsc[0] == 2, nsc[0]
    return s, n[0]

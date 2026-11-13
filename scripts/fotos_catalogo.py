"""Recorta pranchas 2x2 em fotos por ângulo e religa os arquivos existentes em produtos.js.
Uso: python3 scripts/fotos_catalogo.py recortar <prancha> <slug> [--sem-principal]
     python3 scripts/fotos_catalogo.py sincronizar"""
import sys, json, re, os
from PIL import Image
BASE = "av2-estatico"
ANG = ["1-inteira", "2-cima", "3-acabamento", "4-ambiente"]

def recortar(prancha, slug, sem_principal=False):
    im = Image.open(prancha).convert("RGB"); w, h = im.size; m = int(w * 0.008)
    import numpy as np
    a = np.asarray(im.convert("L"), dtype=float)
    def costura(eixo, n):
        d = np.abs(np.diff(a, axis=eixo)).mean(axis=1-eixo)
        lo, hi = int(n*0.38), int(n*0.62)
        return lo + 1 + int(np.argmax(d[lo:hi]))
    cx, cy = costura(1, w), costura(0, h)
    caixas = [(0,0,cx,cy),(cx,0,w,cy),(0,cy,cx,h),(cx,cy,w,h)]
    for i,(a0,b,c,d) in enumerate(caixas):
        if sem_principal and i == 0: continue
        q = im.crop((a0+m,b+m,c-m,d-m)); lado = min(q.size)
        q = q.crop(((q.width-lado)//2,(q.height-lado)//2,(q.width-lado)//2+lado,(q.height-lado)//2+lado)).resize((600,600), Image.LANCZOS)
        q.save(f"{BASE}/img/velas/{slug}-{ANG[i]}.jpg", quality=82, optimize=True, progressive=True)

def sincronizar():
    p = f"{BASE}/js/produtos.js"; linhas = open(p, encoding="utf8").read().split("\n"); out = []
    for l in linhas:
        m = re.match(r'^(\s*)(\{"id".*\})(,?)$', l)
        if m:
            o = json.loads(m.group(2)); s = o["slug"]
            todos = [f"img/velas/{s}-{a}.jpg" for a in ANG]
            o["imagem"] = todos[0]
            o["galeria"] = [f for f in todos if os.path.exists(f"{BASE}/{f}")]
            o["galeriaPendente"] = [f for f in todos if f not in o["galeria"]]
            o["fotoPrincipalPronta"] = todos[0] in o["galeria"]
            o["fotosProntas"] = len(o["galeria"]) == 4
            l = m.group(1) + json.dumps(o, ensure_ascii=False) + m.group(3)
        out.append(l)
    open(p, "w", encoding="utf8").write("\n".join(out))

if __name__ == "__main__":
    if sys.argv[1] == "recortar": recortar(sys.argv[2], sys.argv[3], "--sem-principal" in sys.argv)
    else: sincronizar()

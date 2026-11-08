# generar_niveles_base.py
# Genera niveles base (tipo "borrador") en public/niveles/ para editarlos después con el editor.
# Cada nivel sale de una familia de diseño con parámetros al azar (semilla fija: siempre salen los mismos) y se
# verifica que todas las superficies se alcancen con el salto básico, sin movimientos especiales.
#   python tools/generar_niveles_base.py            → genera b-01 a b-60 y los agrega al índice
#   python tools/generar_niveles_base.py --vista ruta.png  → además deja una imagen con todos los niveles juntos
# OJO: volver a correrlo pisa los b-XX, también los que ya se hayan editado.
# Los niveles de tipo "borrador" no salen en el juego: para usarlos, cambiarles el tipo a "normal" en el editor.
import json, os, random, sys, zlib, struct

COLUMNAS, FILAS = 34, 20
VACIO, SOLIDO, PASARELA, TRAMPA, FUEGO = 0, 1, 2, 3, 4
SKIN = {'solido': 4, 'pared_izq': 0, 'pared_der': 1, 'piedra': 74, 'trampa': 90, 'fuego': 91,
        'pasarela_izq': 40, 'pasarela': 41, 'pasarela_der': 42}
SALTO_FILAS = 4      # El salto básico sube unos 4,7 tiles: 4 filas entre superficies es lo máximo cómodo
ALCANCE_SUBIDA = 4   # Columnas que se pueden cruzar subiendo
ALCANCE_BAJADA = 8   # Y bajando
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CARPETA = os.path.join(RAIZ, 'public', 'niveles')

def espejo(c): return COLUMNAS - 1 - c

class Mapa:
    def __init__(self, wrap):
        self.wrap = wrap
        self.l = [[VACIO] * COLUMNAS for _ in range(FILAS)]
        self.huecos = []
        if wrap:
            # Paredes de 2 columnas abiertas abajo a los costados, techo y piso con huecos alineados
            for f in range(FILAS):
                for c in (0, 1, 32, 33): self.l[f][c] = SOLIDO
            for c in range(COLUMNAS): self.l[0][c] = SOLIDO; self.l[19][c] = SOLIDO
        else:
            for f in range(FILAS): self.l[f][1] = SOLIDO; self.l[f][32] = SOLIDO
            for c in range(1, 33): self.l[19][c] = SOLIDO

    def poner(self, f, c, tipo):
        if 0 <= f < FILAS and 2 <= c <= 31: self.l[f][c] = tipo

    def pasarela(self, f, c0, ancho, simetrica=True):
        for c in range(c0, c0 + ancho):
            self.poner(f, c, PASARELA)
            if simetrica: self.poner(f, espejo(c), PASARELA)

    def bloque(self, f0, f1, c0, c1, simetrica=True):
        for f in range(f0, f1 + 1):
            for c in range(c0, c1 + 1):
                self.poner(f, c, SOLIDO)
                if simetrica: self.poner(f, espejo(c), SOLIDO)

    def abrir_wrap(self, rnd):
        # Huecos verticales: los mismos en el piso y en el techo, simétricos
        c = rnd.randint(4, 9); ancho = rnd.choice([2, 3])
        for cc in range(c, c + ancho):
            for col in (cc, espejo(cc)):
                self.l[19][col] = VACIO; self.l[0][col] = VACIO
        self.huecos = [c, ancho]
        # Costados abiertos en una franja: se sale por un lado y se entra por el otro
        f0 = rnd.choice([14, 15]);
        for f in range(f0, 19):
            for col in (0, 1, 32, 33): self.l[f][col] = VACIO
        # Una pasarela cerca de cada costado para poder volver a subir
        self.pasarela(f0, 3, 3)

def superficies(m):
    # Tramos de celdas pisables (sólido, pasarela, trampa o fuego con aire arriba), por fila
    tramos = []
    for f in range(1, FILAS):
        c = 0
        while c < COLUMNAS:
            pisable = m.l[f][c] != VACIO and m.l[f - 1][c] == VACIO and 2 <= c <= 31
            if pisable:
                c0 = c
                while c < COLUMNAS and m.l[f][c] != VACIO and m.l[f - 1][c] == VACIO and c <= 31: c += 1
                tramos.append((f, c0, c - 1))
            else: c += 1
    return tramos

def alcanzables(m):
    tramos = superficies(m)
    piso = [t for t in tramos if t[0] == 19]
    if not piso: piso = [max(tramos, key=lambda t: t[0])]
    vistos = set(piso); pila = list(piso)
    while pila:
        f, a, b = pila.pop()
        for t in tramos:
            if t in vistos: continue
            g, x, y = t
            distancia = max(0, x - b, a - y)
            sube = 0 < f - g <= SALTO_FILAS and distancia <= ALCANCE_SUBIDA
            baja = g >= f and distancia <= ALCANCE_BAJADA
            if sube or baja: vistos.add(t); pila.append(t)
    return len(vistos) == len(tramos), tramos

# --- Familias ---
def capas(m, rnd):
    for f in [15, 11, 7] + ([3] if rnd.random() < 0.5 else []):
        f += rnd.choice([0, 0, -1])
        if rnd.random() < 0.4:
            # Una al centro: la mitad izquierda y su espejo
            mitad = rnd.randint(2, 4)
            m.pasarela(f, 17 - mitad, mitad)
        segmentos = rnd.randint(1, 2)
        x = rnd.randint(3, 6)
        for _ in range(segmentos):
            ancho = rnd.randint(3, 5)
            if x + ancho > 15: break
            m.pasarela(f, x, ancho)
            x += ancho + rnd.randint(2, 4)

def torres(m, rnd):
    for _ in range(rnd.randint(1, 2)):
        c = rnd.randint(6, 13); ancho = rnd.choice([1, 2]); alto = rnd.randint(3, 7)
        m.bloque(19 - alto, 18, c, c + ancho - 1)
    for f in (14, 10, 6):
        x = rnd.randint(3, 8); m.pasarela(f, x, rnd.randint(3, 5))
    if rnd.random() < 0.6: m.pasarela(rnd.choice([12, 8]), 14, 3)

def escalones(m, rnd):
    subida = rnd.choice([True, False])
    f = 16; c = 3 if subida else 12
    while f >= 4:
        m.pasarela(f, c, rnd.randint(2, 4))
        f -= rnd.choice([3, 4]); c += 3 if subida else -3
        c = max(3, min(13, c))
    m.pasarela(rnd.choice([10, 6]), 15, 2)

def colinas(m, rnd):
    for _ in range(rnd.randint(2, 3)):
        c = rnd.randint(3, 13); ancho = rnd.randint(2, 4); alto = rnd.randint(1, 3)
        m.bloque(19 - alto, 18, c, c + ancho - 1)
    for f in (14, 10, 6):
        if rnd.random() < 0.85: m.pasarela(f + rnd.choice([0, 1]), rnd.randint(4, 12), rnd.randint(3, 5))

def islas(m, rnd):
    for f in (16, 12, 8, 4):
        x = rnd.randint(2, 5)
        while x < COLUMNAS - 4:
            ancho = rnd.randint(2, 3)
            if rnd.random() < 0.75: m.pasarela(f + rnd.choice([0, 0, 1]), x, ancho, simetrica=False)
            x += ancho + rnd.randint(2, 5)

def meseta(m, rnd):
    f = rnd.choice([12, 13]); ancho = rnd.randint(3, 6)
    m.bloque(f, f + rnd.choice([0, 1]), 17 - ancho, 16)
    m.pasarela(16, rnd.randint(4, 8), 3)
    m.pasarela(f - 4, rnd.randint(4, 9), rnd.randint(3, 5))
    if rnd.random() < 0.6: m.pasarela(f - 8, 14, 3)

FAMILIAS = [('Capas', capas), ('Torres', torres), ('Escalones', escalones),
            ('Colinas', colinas), ('Islas', islas), ('Meseta', meseta)]

def peligros(m, rnd, trampas, fuegos):
    tramos = [t for t in superficies(m) if t[0] < 19 or not m.wrap]
    def celda_libre():
        for _ in range(200):
            f, a, b = rnd.choice(tramos)
            c = rnd.randint(a, b)
            if m.l[f][c] in (SOLIDO, PASARELA) and 2 <= c <= 31 and not (f == 19 and c in (5, 6, 7, 26, 27, 28)):
                return f, c
        return None
    for _ in range(trampas):
        celda = celda_libre()
        if celda: m.l[celda[0]][celda[1]] = TRAMPA
    for _ in range(fuegos):
        celda = celda_libre()
        if celda: m.l[celda[0]][celda[1]] = FUEGO

def spawns(m):
    # Columnas 6 y 27 (como los niveles hechos a mano); en los niveles con wrap, la fila 1, porque el techo es sólido
    fila = 1 if m.wrap else 0
    resultado = []
    for jugador, c in ((1, 6), (2, 27)):
        # Que no caiga sobre una trampa o un fuego: se corre hasta encontrar una columna segura
        for d in (0, 1, -1, 2, -2, 3, -3):
            col = c + d
            f = fila + 1
            while f < FILAS and m.l[f][col] == VACIO: f += 1
            if f < FILAS and m.l[f][col] in (SOLIDO, PASARELA) and m.l[fila][col] == VACIO: break
        resultado.append({'tipo': 'spawnJugador', 'jugador': jugador, 'col': col, 'fila': fila})
    return resultado

def skin(m):
    s = [[-1] * COLUMNAS for _ in range(FILAS)]
    for f in range(FILAS):
        for c in range(COLUMNAS):
            t = m.l[f][c]
            if t == SOLIDO:
                if m.wrap and (f in (0, 19)): s[f][c] = SKIN['piedra']
                elif not m.wrap and c == 1 and f < 19: s[f][c] = SKIN['pared_izq']
                elif not m.wrap and c == 32 and f < 19: s[f][c] = SKIN['pared_der']
                elif m.wrap and c in (0, 1, 32, 33): s[f][c] = SKIN['pared_izq'] if c < 2 else SKIN['pared_der']
                else: s[f][c] = SKIN['solido']
            elif t == PASARELA:
                izq = c > 0 and m.l[f][c - 1] == PASARELA
                der = c < COLUMNAS - 1 and m.l[f][c + 1] == PASARELA
                s[f][c] = SKIN['pasarela'] if izq == der else (SKIN['pasarela_izq'] if der else SKIN['pasarela_der'])
            elif t == TRAMPA: s[f][c] = SKIN['trampa']
            elif t == FUEGO: s[f][c] = SKIN['fuego']
    return s

def generar(n):
    rnd = random.Random(1000 + n)
    tier = 1 if n <= 20 else (2 if n <= 40 else 3)
    wrap = (tier == 2 and n % 4 == 0) or (tier == 3 and n % 3 == 0)
    nombre_familia, familia = FAMILIAS[(n - 1) % len(FAMILIAS)]
    for intento in range(500):
        m = Mapa(wrap)
        familia(m, rnd)
        if wrap: m.abrir_wrap(rnd)
        if tier >= 2: peligros(m, rnd, trampas=rnd.randint(1, 3) if tier == 2 else rnd.randint(2, 4), fuegos=0 if tier == 2 else rnd.randint(1, 2))
        ok, tramos = alcanzables(m)
        flotantes = [t for t in tramos if t[0] < 19]
        if ok and len(flotantes) >= 3: break
    else:
        raise RuntimeError(f'b-{n:02d}: no salió un nivel alcanzable')
    nivel = {
        'id': f'b-{n:02d}', 'nombre': f'Base {n:02d} · {nombre_familia}' + (' (wrap)' if wrap else ''),
        'tipo': 'borrador', 'tier': tier, 'jefe': None, 'musica': None, 'fondoImagen': 'fondo-cielo', 'tiempo': None,
        'tileset': {'clave': 'MapTileSet', 'columnas': 10},
        'capas': {'fondo': [[-1] * COLUMNAS for _ in range(FILAS)], 'skin': skin(m), 'logica': m.l},
        'objetos': spawns(m)
    }
    if wrap: nivel['wrap'] = True
    return nivel, m

def js(valor):
    # Como JSON.stringify: sin espacios y con los acentos tal cual
    return json.dumps(valor, ensure_ascii=False, separators=(',', ':'))

def guardar(nivel):
    # El mismo formato que tools/editor/formato.js (serializarNivel), para que abrir y guardar no cambie nada
    cabecera = [c for c in ['id', 'nombre', 'tipo', 'tier', 'jefe', 'musica', 'fondoImagen', 'tiempo', 'tileset', 'wrap'] if c in nivel]
    filas = lambda grilla: ',\n'.join(f"      [{','.join(str(v) for v in fila)}]" for fila in grilla)
    texto = '{\n' + '\n'.join(f'  {js(c)}: {js(nivel[c])},' for c in cabecera) + '\n  "capas": {\n'
    texto += f'    "fondo": [\n{filas(nivel["capas"]["fondo"])}\n    ],\n'
    texto += f'    "skin": [\n{filas(nivel["capas"]["skin"])}\n    ],\n'
    texto += f'    "logica": [\n{filas(nivel["capas"]["logica"])}\n    ]\n  }},\n'
    texto += '  "objetos": [\n' + ',\n'.join(f'    {js(o)}' for o in nivel['objetos']) + '\n  ]\n}\n'
    with open(os.path.join(CARPETA, f"{nivel['id']}.json"), 'w', encoding='utf-8', newline='\n') as f: f.write(texto)

def vista(mapas, ruta):
    colores = {VACIO: (30, 41, 59), SOLIDO: (148, 163, 184), PASARELA: (251, 191, 36), TRAMPA: (239, 68, 68), FUEGO: (249, 115, 22)}
    z, por_fila, margen = 4, 6, 6
    ancho = por_fila * (COLUMNAS * z + margen); alto = ((len(mapas) + por_fila - 1) // por_fila) * (FILAS * z + margen)
    pix = [[(15, 23, 42)] * ancho for _ in range(alto)]
    for i, m in enumerate(mapas):
        x0 = (i % por_fila) * (COLUMNAS * z + margen); y0 = (i // por_fila) * (FILAS * z + margen)
        for f in range(FILAS):
            for c in range(COLUMNAS):
                for dy in range(z):
                    for dx in range(z): pix[y0 + f * z + dy][x0 + c * z + dx] = colores[m.l[f][c]]
    crudo = b''.join(b'\x00' + bytes(v for p in fila for v in p) for fila in pix)
    trozo = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    datos = b'\x89PNG\r\n\x1a\n' + trozo(b'IHDR', struct.pack('>IIBBBBB', ancho, alto, 8, 2, 0, 0, 0)) + trozo(b'IDAT', zlib.compress(crudo, 9)) + trozo(b'IEND', b'')
    open(ruta, 'wb').write(datos)

def main():
    mapas = []
    for n in range(1, 61):
        nivel, m = generar(n)
        guardar(nivel); mapas.append(m)
    ruta_indice = os.path.join(CARPETA, 'indice.json')
    indice = json.load(open(ruta_indice, encoding='utf-8'))
    indice['niveles'] = [n for n in indice['niveles'] if not n['id'].startswith('b-')]
    indice['niveles'] += [{'id': f'b-{n:02d}', 'tipo': 'borrador', 'tier': 1 if n <= 20 else (2 if n <= 40 else 3)} for n in range(1, 61)]
    with open(ruta_indice, 'w', encoding='utf-8', newline='\n') as f:
        f.write('{\n  "niveles": [\n' + ',\n'.join('    ' + js(n) for n in indice['niveles']) + '\n  ]\n}\n')
    if '--vista' in sys.argv: vista(mapas, sys.argv[sys.argv.index('--vista') + 1])
    print(f'{len(mapas)} niveles generados')

if __name__ == '__main__':
    main()

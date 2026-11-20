# uso_tiles.py
# Qué tiles de MapTileSet.png usa cada mapa (capas fondo, skin y bordes), y cuáles de esos quedaron vacíos en la hoja.
# Sirve para revisar la hoja: antes, para saber qué no conviene mover; después, para ver qué mapas quedaron con huecos.
#   python tools/uso_tiles.py
import collections
import glob
import json
import os
import struct
import sys
import zlib

sys.stdout.reconfigure(encoding='utf-8')  # Que la consola de Windows muestre las tildes
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
HOJA = os.path.join(RAIZ, 'public', 'assets', 'tiles', 'MapTileSet.png')


def tiles_vacios(ruta):
    """Números de tile sin ningún píxel visible (PNG RGBA de 8 bits)"""
    datos = open(ruta, 'rb').read()
    i, ancho, alto, idat = 8, 0, 0, b''
    while i < len(datos):
        largo = struct.unpack('>I', datos[i:i + 4])[0]
        tipo, cuerpo = datos[i + 4:i + 8], datos[i + 8:i + 8 + largo]
        if tipo == b'IHDR':
            ancho, alto = struct.unpack('>II', cuerpo[:8])
        elif tipo == b'IDAT':
            idat += cuerpo
        i += 12 + largo
    crudo, paso = zlib.decompress(idat), ancho * 4
    pix, previa = [], bytearray(paso)
    for y in range(alto):
        filtro, fila = crudo[y * (paso + 1)], bytearray(crudo[y * (paso + 1) + 1:(y + 1) * (paso + 1)])
        for x in range(paso):
            a = fila[x - 4] if x >= 4 else 0
            b = previa[x]
            c = previa[x - 4] if x >= 4 else 0
            if filtro == 1: fila[x] = (fila[x] + a) & 255
            elif filtro == 2: fila[x] = (fila[x] + b) & 255
            elif filtro == 3: fila[x] = (fila[x] + (a + b) // 2) & 255
            elif filtro == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                fila[x] = (fila[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        pix.append(bytes(fila)); previa = fila
    columnas, vacios = ancho // 16, set()
    for n in range(columnas * (alto // 16)):
        tx, ty = (n % columnas) * 16, (n // columnas) * 16
        if not any(pix[ty + y][(tx + x) * 4 + 3] for y in range(16) for x in range(16)):
            vacios.add(n)
    return vacios


uso = collections.Counter()
mapas = collections.defaultdict(set)
for ruta in sorted(glob.glob(os.path.join(RAIZ, 'public', 'niveles', '*.json'))):
    if ruta.endswith('indice.json'):
        continue
    nivel = json.load(open(ruta, encoding='utf-8'))
    nombre = os.path.basename(ruta)[:-5]
    for capa in ('fondo', 'skin', 'bordes'):
        for fila in nivel['capas'].get(capa, []):
            for tile in fila:
                if tile != -1:
                    uso[tile] += 1
                    mapas[tile].add(nombre)

vacios = tiles_vacios(HOJA)
print(f'Tiles distintos que usan los mapas: {len(uso)}')
print('Usados (número: veces):', ', '.join(f'{t}:{uso[t]}' for t in sorted(uso)))
rotos = sorted(t for t in uso if t in vacios)
if rotos:
    print(f'\nATENCIÓN: {len(rotos)} tiles usados están vacíos en la hoja:')
    for t in rotos:
        print(f'  {t}: en {", ".join(sorted(mapas[t]))}')
else:
    print('\nNingún mapa usa un tile vacío.')

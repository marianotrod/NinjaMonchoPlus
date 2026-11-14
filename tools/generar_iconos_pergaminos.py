# generar_iconos_pergaminos.py
# Íconos provisorios de los pergaminos, de 16x16: uno para las cartas (public/assets/pergaminos/cartas/<id>.png) y otro
# grabado en piedra para las paredes de la sala (public/assets/pergaminos/grabados/<id>.png).
# Solo crea los que faltan: nunca pisa un dibujo que ya esté. Para rehacer uno provisorio, borrar el archivo y correrlo.
#   python tools/generar_iconos_pergaminos.py
import os
import struct
import zlib

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'assets', 'pergaminos')

# id → (siglas de 2 letras, positivo)
PERGAMINOS = {
    'rebotes': ('RB', True), 'dobleSalto': ('2S', True), 'dash': ('DS', True), 'caidaPesada': ('CP', True),
    'wallJump': ('SP', True), 'boulder': ('BO', True), 'vidaExtra': ('+V', True), 'masTiempo': ('+T', True),
    'shuriken': ('SH', True), 'bumeran': ('BU', True), 'bomba': ('BM', True), 'escudo': ('ES', True),
    'furiaTemporal': ('FT', True), 'iman': ('IM', True), 'municionGratis': ('MG', True), 'trampaPiedra': ('TP', True),
    'bombaAlMorir': ('BX', True), 'saltoPisoton': ('PS', True), 'parryRecarga': ('PR', True), 'katanaLarga': ('KL', True),
    'katanaAlta': ('KA', True), 'parry360': ('P0', True), 'parryDevuelve': ('PD', True),
    'proyectilesBuscan': ('TB', True),
    'rebotesEnemigos': ('RE', False), 'menosTiempo': ('-T', False), 'pisarEnfurece': ('PE', False),
    'contagio': ('CO', False), 'primerEnemigoEscudo': ('1E', False), 'fuegoAmigo': ('FA', False),
    'explosionesLanzan': ('XI', False),
    'explotanAlMorir': ('XB', False), 'minas': ('MI', False), 'bombasEspeciales': ('BE', False),
    'ocultarNegativos': ('ON', False), 'cadena': ('CA', False), 'positivosIlegibles': ('PI', False),
    'proyectilDejaBola': ('DB', False), 'trampasAlAzar': ('TA', False), 'llamaBola': ('LB', False),
    'trampaSeExtiende': ('TE', False), 'bolaExtra': ('B+', False), 'fantasmaRapido': ('FR', False),
    'monedasRojas': ('MR', False),
}

LETRAS = {  # 3x5
    'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'], 'C': ['011', '100', '100', '100', '011'],
    'D': ['110', '101', '101', '101', '110'], 'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
    'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'], 'I': ['111', '010', '010', '010', '111'],
    'K': ['101', '101', '110', '101', '101'], 'L': ['100', '100', '100', '100', '111'], 'M': ['101', '111', '111', '101', '101'],
    'N': ['110', '101', '101', '101', '101'], 'O': ['010', '101', '101', '101', '010'], 'P': ['110', '101', '110', '100', '100'],
    'R': ['110', '101', '110', '101', '101'], 'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
    'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'], 'X': ['101', '101', '010', '101', '101'],
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['110', '001', '010', '100', '111'],
    '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
}


def png(ruta, pix):
    crudo = b''.join(b'\x00' + bytes(c for p in fila for c in p) for fila in pix)
    def trozo(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    datos = (b'\x89PNG\r\n\x1a\n' + trozo(b'IHDR', struct.pack('>IIBBBBB', 16, 16, 8, 6, 0, 0, 0))
             + trozo(b'IDAT', zlib.compress(crudo, 9)) + trozo(b'IEND', b''))
    with open(ruta, 'wb') as archivo:
        archivo.write(datos)


def letras(siglas):
    """Puntos (x, y) de las dos letras a escala 2, centradas en 16x16"""
    puntos = []
    for i, letra in enumerate(siglas):
        for y, fila in enumerate(LETRAS[letra]):
            for x, v in enumerate(fila):
                if v == '1':
                    for dy in range(2):
                        for dx in range(2):
                            puntos.append((1 + i * 8 + x * 2 + dx, 3 + y * 2 + dy))
    return puntos


def carta(siglas, positivo):
    fondo, borde = ((22, 163, 74), (20, 83, 45)) if positivo else ((220, 38, 38), (127, 29, 29))
    pix = [[(0, 0, 0, 0)] * 16 for _ in range(16)]
    for y in range(16):
        for x in range(16):
            esquina = (x in (0, 15)) and (y in (0, 15))
            if esquina:
                continue
            pix[y][x] = (*borde, 255) if x in (0, 15) or y in (0, 15) else (*fondo, 255)
    for x, y in letras(siglas):
        pix[y][x] = (255, 255, 255, 255)
    return pix


def grabado(siglas, positivo):
    oscuro, luz = (40, 40, 46, 230), (156, 163, 175, 200)
    pix = [[(0, 0, 0, 0)] * 16 for _ in range(16)]
    for i in range(1, 15):  # Marco tallado: línea oscura con luz por dentro
        for x, y in ((i, 1), (i, 14), (1, i), (14, i)):
            pix[y][x] = oscuro
        for x, y in ((i, 2), (2, i)):
            if 2 <= i <= 13:
                pix[y][x] = luz
    marca = (20, 83, 45, 230) if positivo else (127, 29, 29, 230)  # Un puntito de color: positivo o negativo
    pix[13][13] = marca
    for x, y in letras(siglas):
        if x + 1 < 16 and y + 1 < 16:
            pix[y + 1][x + 1] = luz
    for x, y in letras(siglas):
        pix[y][x] = oscuro
    return pix


def main():
    creados = 0
    for carpeta, dibujar in (('cartas', carta), ('grabados', grabado)):
        destino = os.path.join(RAIZ, carpeta)
        os.makedirs(destino, exist_ok=True)
        for id_, (siglas, positivo) in PERGAMINOS.items():
            ruta = os.path.join(destino, f'{id_}.png')
            if os.path.exists(ruta):
                continue
            png(ruta, dibujar(siglas, positivo))
            creados += 1
    print(f'{creados} íconos nuevos')


if __name__ == '__main__':
    main()

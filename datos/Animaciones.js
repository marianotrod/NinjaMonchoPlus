// Animaciones.js
// Animaciones de los enemigos dibujados en una hoja de cuadros de 16x16. Los cuadros se numeran desde 0, de izquierda a
// derecha y fila por fila (una hoja de 256 px de ancho tiene 16 cuadros por fila: la segunda fila empieza en el 16).
// Para cambiar un dibujo se reemplaza el PNG; si cambian los números de cuadro, se corrige esta tabla, sin tocar código.
//   cuadros: '0-2' (del 0 al 2), '2-0' (al revés), '18' (uno solo) o '4,5,4' (en ese orden)
//   fps:     cuadros por segundo (si no está, 10)
//   loop:    se repite; si no, queda en el último cuadro
// Nombres que usa el juego (el que falte, se reemplaza por el comportamiento de antes):
//   quieto, caminar, preparaSalto, subir, caer, lanzar, aturdido, despertar, risa, muerto,
//   preparaArco y disparar (el arco del samurái), preparaCarga y carga (la embestida del samurái)
export const ANIMACIONES = {
  esqueleto: {
    quieto:       { cuadros: '0-2', fps: 6, loop: true },
    risa:         { cuadros: '4-5', fps: 6, loop: true },  // Cuando mata a un ninja, si está en el piso
    caminar:      { cuadros: '7-12', fps: 10, loop: true },
    lanzar:       { cuadros: '14-16', fps: 8 },            // La cuchilla sale al llegar al último cuadro
    preparaSalto: { cuadros: '18', fps: 7 },               // Lo que dura es lo que se agacha antes de saltar
    subir:        { cuadros: '19' },
    caer:         { cuadros: '21' },                       // Cayendo, o empujado como proyectil
    aturdido:     { cuadros: '23-24', fps: 8 },            // Queda en el último mientras dura el aturdimiento
    despertar:    { cuadros: '26-27', fps: 8 },            // Al final del aturdimiento
    muerto:       { cuadros: '30' }                        // Cae fuera de la pantalla, como Moncho
  },
  samurai: {
    quieto:       { cuadros: '0-2,2-0', fps: 6, loop: true },  // Mira a un lado y vuelve
    risa:         { cuadros: '4-6', fps: 6, loop: true },
    caminar:      { cuadros: '8-13', fps: 10, loop: true },
    preparaArco:  { cuadros: '15', fps: 4 },               // Lo que dura es lo que apunta
    disparar:     { cuadros: '17-19', fps: 10 },           // La flecha sale al llegar al último cuadro
    preparaSalto: { cuadros: '21', fps: 7 },
    subir:        { cuadros: '23' },
    caer:         { cuadros: '25' },
    aturdido:     { cuadros: '27-28', fps: 8 },
    despertar:    { cuadros: '30-31', fps: 8 },
    muerto:       { cuadros: '33-36', fps: 8 },
    // Provisorios hasta que tenga cuadros propios: se agacha y corre con los de caminar, más rápido
    preparaCarga: { cuadros: '21' },
    carga:        { cuadros: '8-13', fps: 20, loop: true }
  }
};

export const claveAnimacion = (textura, nombre) => `${textura}-${nombre}`;

// '0-2,5' → [0, 1, 2, 5]
export function listaDeCuadros(texto) {
  return String(texto).split(',').flatMap(parte => {
    const [desde, hasta = desde] = parte.split('-').map(Number);
    const paso = hasta >= desde ? 1 : -1;
    return Array.from({ length: Math.abs(hasta - desde) + 1 }, (_, i) => desde + i * paso);
  });
}

// Lo que tarda en mostrar todos sus cuadros una vez (ms)
export const duracionAnimacion = (animacion) => listaDeCuadros(animacion.cuadros).length / (animacion.fps ?? 10) * 1000;

// Las crea BootScene una sola vez
export function crearAnimaciones(anims) {
  Object.entries(ANIMACIONES).forEach(([textura, lista]) => {
    Object.entries(lista).forEach(([nombre, animacion]) => {
      anims.create({
        key: claveAnimacion(textura, nombre),
        frames: listaDeCuadros(animacion.cuadros).map(frame => ({ key: textura, frame })),
        frameRate: animacion.fps ?? 10,
        repeat: animacion.loop ? -1 : 0
      });
    });
  });
}

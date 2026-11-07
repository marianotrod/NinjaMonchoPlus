// CargadorNivel.js
// Arma un nivel en la escena a partir de su JSON. Las capas "fondo" y "skin" son solo dibujo (índices del tileset);
// la capa "logica" crea los bloques físicos, que son invisibles. La fila y la columna 0 del archivo están fuera de pantalla.
// La trampa y el fuego son bloques sólidos. Lo que hacen está en NinjaMonchoScene y en mundo/Fuego.js.
import { LOGICA, MUNDO, TILES } from '../config.js';
import { CARAS } from './Fuego.js';

const aX = (col) => (col - MUNDO.columnasOcultas) * MUNDO.tile + MUNDO.tile / 2;
const aY = (fila) => (fila - MUNDO.filasOcultas) * MUNDO.tile + MUNDO.tile / 2;

// Devuelve los dibujos por celda, para poder cambiarlos durante el nivel
function dibujarCapa(scene, grilla, clave) {
  const dibujos = new Map();
  grilla.forEach((fila, f) => fila.forEach((frame, c) => {
    if (frame === TILES.FUEGO) dibujos.set(`${c},${f}`, scene.add.sprite(aX(c), aY(f), clave, frame).play('tile-fuego'));
    else if (frame !== -1) dibujos.set(`${c},${f}`, scene.add.image(aX(c), aY(f), clave, frame));
  }));
  return dibujos;
}

function crearBloque(scene, c, f, tipo) {
  const bloque = scene.bloquesFisicos.create(aX(c), aY(f), 'MapTileSet', 0).setVisible(false);
  bloque.col = c;
  bloque.fila = f;
  bloque.body.updateFromGameObject();
  bloque.esOneWay = tipo === LOGICA.PASARELA;
  bloque.esTrampa = tipo === LOGICA.TRAMPA;
  if (bloque.esOneWay) {
    bloque.body.checkCollision.down = false;
    bloque.body.checkCollision.left = false;
    bloque.body.checkCollision.right = false;
  }
  return bloque;
}

// Cambia un bloque sólido a otro tipo y su dibujo (trampa ↔ piedra)
export function cambiarTile(scene, c, f, tipo, frame) {
  const bloque = scene.bloquesPorCelda.get(`${c},${f}`);
  if (!bloque) return;
  scene.logica[f][c] = tipo;
  bloque.esTrampa = tipo === LOGICA.TRAMPA;
  const clave = `${c},${f}`;
  if (scene.dibujos.has(clave)) scene.dibujos.get(clave).destroy();
  scene.dibujos.set(clave, scene.add.image(aX(c), aY(f), 'MapTileSet', frame));
}

// Doble salto nivel 2: una pasarela temporal en las celdas vacías bajo los pies, alineada a la grilla como cualquier otra
export function crearPlataformaFantasma(scene, x, pies) {
  const { tile, columnasOcultas, filasOcultas } = MUNDO;
  const fila = Math.floor(pies / tile) + filasOcultas;
  const centro = Math.floor(x / tile) + columnasOcultas;
  const desde = centro - Math.floor(scene.anchoPlataforma / 2);
  const piezas = [];
  for (let c = desde; c < desde + scene.anchoPlataforma; c++) {
    if (scene.logica[fila]?.[c] !== LOGICA.VACIO) continue;
    scene.logica[fila][c] = LOGICA.PASARELA;
    const bloque = crearBloque(scene, c, fila, LOGICA.PASARELA);
    const dibujo = scene.add.image(aX(c), aY(fila), 'plataforma-fantasma').setDepth(5);
    piezas.push({ c, bloque, dibujo });
  }
  if (!piezas.length) return;
  const { duracion } = scene;
  scene.time.delayedCall(duracion - 1000, () => {
    piezas.forEach(({ dibujo }) => scene.tweens.add({ targets: dibujo, alpha: 0.2, duration: 120, yoyo: true, repeat: -1 }));
  });
  scene.time.delayedCall(duracion, () => {
    piezas.forEach(({ c, bloque, dibujo }) => {
      if (scene.logica[fila][c] === LOGICA.PASARELA) scene.logica[fila][c] = LOGICA.VACIO;
      bloque.destroy();
      scene.tweens.killTweensOf(dibujo);
      dibujo.destroy();
    });
  });
}

// Un bloque se puede volver trampa si es sólido, está a la vista, no es de las paredes de los costados
// y no tiene nada encima
export function puedeSerTrampa(scene, c, f) {
  const { columnas, filasOcultas } = MUNDO;
  const pared = c <= 1 || c >= columnas - 2;
  return !pared && f >= filasOcultas && scene.logica[f]?.[c] === LOGICA.SOLIDO && scene.logica[f - 1]?.[c] === LOGICA.VACIO;
}

export function trampasAlAzar(scene, cantidad) {
  const candidatos = [];
  scene.logica.forEach((fila, f) => fila.forEach((tipo, c) => { if (puedeSerTrampa(scene, c, f)) candidatos.push([c, f]); }));
  Phaser.Utils.Array.Shuffle(candidatos).slice(0, cantidad).forEach(([c, f]) => cambiarTile(scene, c, f, LOGICA.TRAMPA, TILES.TRAMPA));
}

// Una trampa tocada contagia a un bloque vecino
export function extenderTrampa(scene, bloque) {
  const ahora = scene.time.now;
  if (ahora < (bloque.proximaExtension ?? 0)) return;
  bloque.proximaExtension = ahora + scene.esperaExtension;
  const vecinos = [[-1, 0], [1, 0], [0, 1], [0, -1]].map(([dc, df]) => [bloque.col + dc, bloque.fila + df]);
  const posibles = vecinos.filter(([c, f]) => puedeSerTrampa(scene, c, f));
  if (posibles.length) {
    const [c, f] = Phaser.Utils.Array.GetRandom(posibles);
    cambiarTile(scene, c, f, LOGICA.TRAMPA, TILES.TRAMPA);
  }
}

// Una cara escupe si la celda vecina está libre. Si el tile está rodeado no se registra.
function registrarFuego(scene, grilla, c, f) {
  const libre = ({ col, fila }) => {
    const tipo = grilla[f + fila]?.[c + col];
    return tipo === LOGICA.VACIO || tipo === LOGICA.PASARELA;
  };
  const caras = CARAS.filter(libre);
  if (caras.length > 0) scene.tilesFuego.push({ x: aX(c), y: aY(f), caras });
}

export function construirNivel(scene, nivel) {
  const { clave } = nivel.tileset;
  dibujarCapa(scene, nivel.capas.fondo, clave);
  scene.dibujos = dibujarCapa(scene, nivel.capas.skin, clave);

  // Copia de la lógica: los pergaminos pueden cambiar tiles, y el archivo del nivel se usa de nuevo al recomenzar
  scene.logica = nivel.capas.logica.map(fila => [...fila]);
  scene.bloquesFisicos = scene.physics.add.staticGroup();
  scene.bloquesPorCelda = new Map();
  scene.tilesFuego = [];
  scene.logica.forEach((fila, f) => fila.forEach((tipo, c) => {
    if (tipo !== LOGICA.VACIO) scene.bloquesPorCelda.set(`${c},${f}`, crearBloque(scene, c, f, tipo));
    if (tipo === LOGICA.FUEGO) registrarFuego(scene, scene.logica, c, f);
  }));

  // Cada ninja aparece en la celda de su spawn, columna y fila, y desde ahí cae
  const spawnDe = (jugador) => {
    const { col, fila } = nivel.objetos.find(o => o.tipo === 'spawnJugador' && o.jugador === jugador);
    return { x: aX(col), y: aY(fila) };
  };
  return [spawnDe(1), spawnDe(2)];
}

// CargadorNivel.js
// Arma un nivel en la escena a partir de su JSON. Las capas "fondo" y "skin" son solo dibujo (índices del tileset);
// la capa "logica" crea los bloques físicos, que son invisibles. La fila y la columna 0 del archivo están fuera de pantalla.
// La trampa y el fuego son bloques sólidos. Lo que hacen está en NinjaMonchoScene y en mundo/Fuego.js.
import { LOGICA, MUNDO, TILES } from '../config.js';
import { CARAS } from './Fuego.js';

const aX = (col) => (col - MUNDO.columnasOcultas) * MUNDO.tile + MUNDO.tile / 2;
const aY = (fila) => (fila - MUNDO.filasOcultas) * MUNDO.tile + MUNDO.tile / 2;

function dibujarCapa(scene, grilla, clave) {
  grilla.forEach((fila, f) => fila.forEach((frame, c) => {
    if (frame === TILES.FUEGO) scene.add.sprite(aX(c), aY(f), clave, frame).play('tile-fuego');
    else if (frame !== -1) scene.add.image(aX(c), aY(f), clave, frame);
  }));
}

function crearBloque(scene, x, y, tipo) {
  const bloque = scene.bloquesFisicos.create(x, y, 'MapTileSet', 0).setVisible(false);
  bloque.body.updateFromGameObject();
  bloque.esOneWay = tipo === LOGICA.PASARELA;
  bloque.esTrampa = tipo === LOGICA.TRAMPA;
  if (bloque.esOneWay) {
    bloque.body.checkCollision.down = false;
    bloque.body.checkCollision.left = false;
    bloque.body.checkCollision.right = false;
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
  dibujarCapa(scene, nivel.capas.skin, clave);

  scene.bloquesFisicos = scene.physics.add.staticGroup();
  scene.tilesFuego = [];
  nivel.capas.logica.forEach((fila, f) => fila.forEach((tipo, c) => {
    if (tipo !== LOGICA.VACIO) crearBloque(scene, aX(c), aY(f), tipo);
    if (tipo === LOGICA.FUEGO) registrarFuego(scene, nivel.capas.logica, c, f);
  }));

  const spawnDe = (jugador) => aX(nivel.objetos.find(o => o.tipo === 'spawnJugador' && o.jugador === jugador).col);
  return { spawnMonchoX: spawnDe(1), spawnCoopX: spawnDe(2) };
}

// CargadorNivel.js
// Arma un nivel en la escena a partir de su JSON. Las capas "fondo" y "skin" son solo dibujo (índices del tileset);
// la capa "logica" crea los bloques físicos, que son invisibles. La fila y la columna 0 del archivo están fuera de pantalla.
import { LOGICA, MUNDO } from '../config.js';

const aX = (col) => (col - MUNDO.columnasOcultas) * MUNDO.tile + MUNDO.tile / 2;
const aY = (fila) => (fila - MUNDO.filasOcultas) * MUNDO.tile + MUNDO.tile / 2;

function dibujarCapa(scene, grilla, clave) {
  grilla.forEach((fila, f) => fila.forEach((frame, c) => {
    if (frame !== -1) scene.add.image(aX(c), aY(f), clave, frame);
  }));
}

function crearBloque(scene, x, y, tipo) {
  const bloque = scene.bloquesFisicos.create(x, y, 'MapTileSet', 0).setVisible(false);
  bloque.body.updateFromGameObject();
  bloque.esOneWay = tipo === LOGICA.PASARELA;
  if (bloque.esOneWay) {
    bloque.body.checkCollision.down = false;
    bloque.body.checkCollision.left = false;
    bloque.body.checkCollision.right = false;
  }
}

export function construirNivel(scene, nivel) {
  const { clave } = nivel.tileset;
  dibujarCapa(scene, nivel.capas.fondo, clave);
  dibujarCapa(scene, nivel.capas.skin, clave);

  scene.bloquesFisicos = scene.physics.add.staticGroup();
  nivel.capas.logica.forEach((fila, f) => fila.forEach((tipo, c) => {
    if (tipo !== LOGICA.VACIO) crearBloque(scene, aX(c), aY(f), tipo);
  }));

  const spawnDe = (jugador) => aX(nivel.objetos.find(o => o.tipo === 'spawnJugador' && o.jugador === jugador).col);
  return { spawnMonchoX: spawnDe(1), spawnCoopX: spawnDe(2) };
}

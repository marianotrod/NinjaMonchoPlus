// formato.js
// Cómo se escribe un nivel en disco: legible y con una fila de la grilla por línea, para que git muestre diferencias claras.
import { LOGICA, MUNDO } from '../../config.js';

const CABECERA = ['id', 'nombre', 'tipo', 'tier', 'jefe', 'musica', 'fondoImagen', 'tiempo', 'tileset'];

const grillaVacia = (valor) => Array.from({ length: MUNDO.filas }, () => Array(MUNDO.columnas).fill(valor));
const escribirFilas = (grilla) => grilla.map(fila => `      [${fila.join(',')}]`).join(',\n');

export function serializarNivel(nivel) {
  const cabecera = CABECERA.map(clave => `  ${JSON.stringify(clave)}: ${JSON.stringify(nivel[clave])},`).join('\n');
  const objetos = nivel.objetos.map(objeto => `    ${JSON.stringify(objeto)}`).join(',\n');
  return `{\n${cabecera}\n  "capas": {\n` +
    `    "fondo": [\n${escribirFilas(nivel.capas.fondo)}\n    ],\n` +
    `    "skin": [\n${escribirFilas(nivel.capas.skin)}\n    ],\n` +
    `    "logica": [\n${escribirFilas(nivel.capas.logica)}\n    ]\n  },\n` +
    `  "objetos": [\n${objetos}\n  ]\n}\n`;
}

export function serializarIndice(niveles) {
  return `{\n  "niveles": [\n${niveles.map(nivel => `    ${JSON.stringify(nivel)}`).join(',\n')}\n  ]\n}\n`;
}

export function nivelNuevo(id, columnasTileset) {
  return {
    id, nombre: id, tipo: 'normal', tier: 1, jefe: null, musica: null, fondoImagen: 'fondo-cielo', tiempo: null,
    tileset: { clave: 'MapTileSet', columnas: columnasTileset },
    capas: { fondo: grillaVacia(-1), skin: grillaVacia(-1), logica: grillaVacia(LOGICA.VACIO) },
    objetos: [
      { tipo: 'spawnJugador', jugador: 1, col: 6, fila: 0 },
      { tipo: 'spawnJugador', jugador: 2, col: 19, fila: 0 }
    ]
  };
}

// Agrega el nivel al índice o actualiza sus datos, sin cambiar el orden de los demás
export function indiceConNivel(niveles, { id, tipo, tier }) {
  const entrada = { id, tipo, tier };
  return niveles.some(nivel => nivel.id === id)
    ? niveles.map(nivel => (nivel.id === id ? entrada : nivel))
    : [...niveles, entrada];
}

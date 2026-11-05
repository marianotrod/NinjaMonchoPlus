// Niveles.js
// Los niveles viven en public/niveles/ (uno por archivo) y public/niveles/indice.json los enumera: el navegador
// no puede listar carpetas. BootScene los carga todos una vez y acá quedan disponibles por id.
import { ARRANQUE_DEBUG, MUNDO } from '../config.js';

const RUTA = 'public/niveles/';
// Al probar un nivel desde el editor hay que leer lo recién guardado, no una copia vieja del navegador
const VERSION = ARRANQUE_DEBUG.mapa ? `?v=${Date.now()}` : '';
const niveles = new Map();

export function cargarNiveles(load) {
  load.json('indice-niveles', `${RUTA}indice.json${VERSION}`);
  load.once('filecomplete-json-indice-niveles', (clave, tipo, indice) => {
    indice.niveles.forEach(({ id }) => load.json(`nivel-${id}`, `${RUTA}${id}.json${VERSION}`));
  });
}

// Devuelve la lista de problemas del nivel (vacía si está bien)
export function validarNivel(id, nivel) {
  if (!nivel) return [`${id}: no se pudo cargar`];
  const errores = [];
  ['fondo', 'skin', 'logica'].forEach(capa => {
    const grilla = nivel.capas[capa];
    if (grilla.length !== MUNDO.filas || grilla.some(fila => fila.length !== MUNDO.columnas)) {
      errores.push(`${id}: la capa ${capa} no mide ${MUNDO.columnas}×${MUNDO.filas}`);
    }
  });
  [1, 2].forEach(jugador => {
    if (!nivel.objetos.some(o => o.tipo === 'spawnJugador' && o.jugador === jugador)) {
      errores.push(`${id}: falta el spawn del jugador ${jugador}`);
    }
  });
  return errores;
}

export function registrarNiveles(cache) {
  cache.json.get('indice-niveles').niveles.forEach(({ id }) => {
    const nivel = cache.json.get(`nivel-${id}`);
    validarNivel(id, nivel).forEach(error => console.error(`Nivel inválido: ${error}`));
    niveles.set(id, nivel);
  });
}

export const nivelPorId = (id) => niveles.get(id);
export const todosLosNiveles = () => [...niveles.entries()];
export const idsDeTipo = (tipo) => [...niveles.values()].filter(nivel => nivel.tipo === tipo).map(nivel => nivel.id);

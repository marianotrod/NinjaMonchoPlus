// Partida.js
// Estado de una partida completa (vidas, puntajes, nivel, mapa, pactos). Vive en el registry de Phaser
// para que sobreviva a los reinicios de NinjaMonchoScene y lo puedan leer la UI y la pantalla de pactos.

import { CONFIG } from '../config.js';
import { mapaInicial, mapaAprendizaje, mapaJefe, mapasPool } from './Mapas.js';
import { pactosVacios } from './Pactos.js';

export const JEFES_INTERMEDIOS = ['ogro', 'oni', 'espectro'];

export function nuevaPartida(jugadores, nivel = 1) {
  return {
    jugadores,
    nivel,
    vidas: [CONFIG.VIDAS_INICIALES, CONFIG.VIDAS_INICIALES], // Cada jugador tiene las suyas
    puntajes: [0, 0],
    pool: [...mapasPool],
    mapa: null,
    jefe: null,
    pactos: pactosVacios()
  };
}

export function esNivelJefe(nivel) {
  return nivel % CONFIG.NIVELES_POR_BLOQUE === 0;
}

export function esNivelFinal(nivel) {
  return nivel >= CONFIG.TOTAL_NIVELES;
}

// Niveles 1 y 2: mapas fijos de aprendizaje. Jefes: arena propia. Resto: al azar del pool sin repetir.
export function prepararNivel(partida) {
  if (partida.mapa) return;
  const nivel = partida.nivel;
  partida.jefe = null;

  if (esNivelJefe(nivel)) {
    partida.mapa = mapaJefe;
    partida.jefe = esNivelFinal(nivel) ? 'rey' : (partida.jefeForzado || Phaser.Utils.Array.GetRandom(JEFES_INTERMEDIOS));
  } else if (nivel === 1) {
    partida.mapa = mapaInicial;
  } else if (nivel === 2) {
    partida.mapa = mapaAprendizaje;
  } else {
    if (partida.pool.length === 0) partida.pool = [...mapasPool];
    const indice = Phaser.Math.Between(0, partida.pool.length - 1);
    partida.mapa = partida.pool.splice(indice, 1)[0];
  }
}

export function musicaDelNivel(nivel) {
  if (esNivelJefe(nivel)) return 'musica-jefe';
  if (nivel <= 2) return 'musica-fondo';
  return ['musica-cueva', 'musica-agua', 'musica-fondo'][nivel % 3];
}

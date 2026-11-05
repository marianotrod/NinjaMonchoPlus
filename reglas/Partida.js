// Partida.js
// Estado de una partida completa (vidas, puntajes, nivel, mapa, pactos). Vive en el registry de Phaser
// para que sobreviva a los reinicios de NinjaMonchoScene y lo puedan leer la UI y la pantalla de pactos.

import { CONFIG } from '../config.js';
import { idsDeTipo, nivelPorId } from '../mundo/Niveles.js';
import { pactosVacios } from './Pactos.js';

export const JEFES_INTERMEDIOS = ['ogro', 'oni', 'espectro'];

export function nuevaPartida(jugadores, nivel = 1) {
  return {
    jugadores,
    nivel,
    vidas: [CONFIG.VIDAS_INICIALES, CONFIG.VIDAS_INICIALES], // Cada jugador tiene las suyas
    puntajes: [0, 0],
    pool: idsDeTipo('normal'),
    datosNivel: null,
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

// Elige el id del nivel: fijo para algunos números, una arena para los jefes y, si no, al azar del pool sin repetir.
function elegirNivel(partida) {
  const nivel = partida.nivel;
  if (partida.mapaForzado) return partida.mapaForzado;
  if (esNivelJefe(nivel)) return Phaser.Utils.Array.GetRandom(idsDeTipo('jefe'));
  if (CONFIG.NIVELES_FIJOS[nivel]) return CONFIG.NIVELES_FIJOS[nivel];
  if (partida.pool.length === 0) partida.pool = idsDeTipo('normal');
  return partida.pool.splice(Phaser.Math.Between(0, partida.pool.length - 1), 1)[0];
}

export function prepararNivel(partida) {
  if (partida.datosNivel) return;
  const nivel = partida.nivel;
  partida.jefe = null;
  if (esNivelJefe(nivel)) {
    partida.jefe = esNivelFinal(nivel) ? 'rey' : (partida.jefeForzado || Phaser.Utils.Array.GetRandom(JEFES_INTERMEDIOS));
  }
  partida.datosNivel = nivelPorId(elegirNivel(partida));
}

export function musicaDelNivel(nivel) {
  if (esNivelJefe(nivel)) return 'musica-jefe';
  if (nivel <= 2) return 'musica-fondo';
  return ['musica-cueva', 'musica-agua', 'musica-fondo'][nivel % 3];
}

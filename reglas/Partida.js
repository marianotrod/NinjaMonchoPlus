// Partida.js
// Estado de una partida completa (vidas, puntajes, nivel, mapa y build). Vive en el registry de Phaser
// para que sobreviva a los reinicios de NinjaMonchoScene y lo pueda leer la UI.

import { CONFIG } from '../config.js';
import { idsDeTipo, nivelPorId } from '../mundo/Niveles.js';
import { modsIniciales } from './Pergaminos.js';

export const JEFES_INTERMEDIOS = ['ogro', 'oni', 'espectro'];

// Movimientos especiales: 0 = no lo tiene. Se desbloquean con pergaminos y pueden llegar a nivel 2.
export const HABILIDADES = ['dash', 'dobleSalto', 'wallJump', 'caidaPesada', 'boulder'];
const habilidadesIniciales = () => Object.fromEntries(HABILIDADES.map(habilidad => [habilidad, 0]));

export function nuevaPartida(jugadores, nivel = 1) {
  return {
    jugadores,
    nivel,
    vidas: [CONFIG.VIDAS_INICIALES, CONFIG.VIDAS_INICIALES], // Cada jugador tiene las suyas
    puntajes: [0, 0],
    pool: idsDeTipo('normal'),
    datosNivel: null,
    jefe: null,
    mods: modsIniciales(),   // El build: lo que dieron los pergaminos, para siempre
    tomados: {},             // Cuántas veces tomó cada jugador cada efecto: { id: [J1, J2] }
    enSala: false,           // Entre un nivel y el siguiente se pasa por la sala de pergaminos
    cartas: null,
    // Lo que cada jugador conserva entre niveles. El arma guarda su tipo y la munición con la que arranca cada nivel.
    habilidades: [habilidadesIniciales(), habilidadesIniciales()],
    armas: [null, null]
  };
}

export function esNivelJefe(nivel) {
  return nivel % CONFIG.NIVELES_POR_BLOQUE === 0;
}

export function esNivelFinal(nivel) {
  return nivel >= CONFIG.TOTAL_NIVELES;
}

// Los tiers de mapa que valen para un número de nivel (null: cualquiera)
export const tiersDelNivel = (nivel) => CONFIG.TIERS_POR_NIVEL[nivel] ?? null;

// Elige el id del nivel: fijo para algunos números, una arena para los jefes y, si no, al azar del pool sin repetir,
// entre los mapas del tier que le toca al nivel (CONFIG.TIERS_POR_NIVEL).
function elegirNivel(partida) {
  const nivel = partida.nivel;
  if (partida.mapaForzado) return partida.mapaForzado;
  if (esNivelJefe(nivel)) return Phaser.Utils.Array.GetRandom(idsDeTipo('jefe'));
  if (CONFIG.NIVELES_FIJOS[nivel]) return CONFIG.NIVELES_FIJOS[nivel];
  const tiers = tiersDelNivel(nivel);
  const delTier = () => partida.pool.filter(id => !tiers || tiers.includes(nivelPorId(id)?.tier));
  // Si ya salieron todos los de ese tier, se rearma el pool; si aun así no hay ninguno, vale cualquiera
  if (delTier().length === 0) partida.pool = idsDeTipo('normal');
  const candidatos = delTier().length > 0 ? delTier() : partida.pool;
  const elegido = Phaser.Utils.Array.GetRandom(candidatos);
  partida.pool.splice(partida.pool.indexOf(elegido), 1);
  return elegido;
}

export function prepararNivel(partida) {
  if (partida.datosNivel) return;
  if (partida.enSala) {
    partida.datosNivel = nivelPorId(partida.salaForzada || CONFIG.NIVEL_SALA);
    return;
  }
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

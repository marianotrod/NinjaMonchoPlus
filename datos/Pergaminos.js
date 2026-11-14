// Pergaminos.js
// Catálogo de efectos de los pergaminos. Cada carta de la sala junta un positivo y un negativo al azar.
// Agregar un efecto que ya existe en el juego es agregar una entrada; si el efecto es nuevo, además se programa una vez.
//
//   tipo:        POSITIVO | NEGATIVO
//   noAparece:   'ambos'  → deja de salir cuando lo tienen todos los jugadores en juego
//                'alguno' → deja de salir cuando lo tiene cualquiera (los efectos de todos)
//                null     → puede salir siempre (los acumulativos)
//   maximo:      cuántas veces puede tomarse en la partida, sumando a todos los jugadores
//   peso:        qué tan seguido sale (10 por defecto)
//   decae:       cada vez que alguien lo toma, el peso se multiplica por esto (la vida extra)
//   disponible:  condición extra (partida, jugadores en juego) → bool
//   incompatible: ids con los que no puede salir en la misma carta
//   aplicar:     (partida, j) cambia la partida. "j" es quien tomó la carta (0 = J1, 1 = J2).
//   pendiente:   todavía no hace nada; la carta lo muestra con "(X)" adelante
//   texto:       (partida, jugadores en juego) → clave del texto, si cambia según la partida (los movimientos)
//
// Las reglas se evalúan cada vez que se arma la sala, con los jugadores en juego en ese momento: el J2 cuenta desde que
// entra (también por hotjoin) y deja de contar cuando se queda sin vidas.
//
// Los textos están en i18n.js como perg_<id>.
import { equiparEnPartida } from '../entidades/Armas.js';

export const POSITIVO = 'positivo';
export const NEGATIVO = 'negativo';

export const TOPE_TIEMPO_EXTRA = 10;  // Los segundos de más o de menos dejan de salir al llegar a este valor

const jugador = (partida, j) => partida.mods.jugadores[j];
const global = (partida) => partida.mods.global;

// Un movimiento especial es un solo pergamino: tomarlo sube un nivel a quien lo toma, hasta 2. Sale mientras algún
// jugador en juego no lo tenga al máximo. La carta dice "nivel 2" solo si todos los jugadores en juego ya lo tienen
// (si no, quien lo toma podría estar sacando el nivel 1).
const NIVEL_MAXIMO = 2;
const habilidad = (id, pendiente = false) => ({
  id, tipo: POSITIVO, pendiente,
  disponible: (partida, enJuego) => enJuego.some(j => partida.habilidades[j][id] < NIVEL_MAXIMO),
  texto: (partida, enJuego) => (enJuego.every(j => partida.habilidades[j][id] >= 1) ? `${id}2` : id),
  aplicar: (partida, j) => {
    partida.habilidades[j][id] = Math.min(NIVEL_MAXIMO, partida.habilidades[j][id] + 1);
  }
});

const arma = (id) => ({ id, tipo: POSITIVO, aplicar: (partida, j) => equiparEnPartida(partida, j, id) });

// Un efecto de un solo jugador o de todos que se prende y ya
const marca = (id, tipo, alcance, noAparece, pendiente = false) => ({
  id, tipo, noAparece, pendiente,
  aplicar: (partida, j) => { (alcance === 'todos' ? global(partida) : jugador(partida, j))[id] = true; }
});

export const EFECTOS = [
  // --- Positivos ---
  { id: 'rebotes', tipo: POSITIVO, aplicar: (partida, j) => { jugador(partida, j).rebotesExtra++; } },
  // Nivel 2 de cada uno: doble salto → plataforma fantasma (una pasarela temporal alineada a la grilla);
  // dash → katanazo durante el dash; caída pesada → bolas celestes al golpear el piso;
  // salto de pared → intocable durante el salto (no para el fantasma); boulder → los enemigos salen disparados
  habilidad('dobleSalto'),
  habilidad('dash'),
  habilidad('caidaPesada'),
  habilidad('wallJump'),
  habilidad('boulder'),
  {
    id: 'vidaExtra', tipo: POSITIVO, peso: 3, decae: 0.5,
    aplicar: (partida, j) => { partida.vidas[j]++; }
  },
  {
    id: 'masTiempo', tipo: POSITIVO, incompatible: ['menosTiempo'],
    disponible: (partida) => global(partida).tiempoExtra < TOPE_TIEMPO_EXTRA,
    aplicar: (partida) => { global(partida).tiempoExtra++; }
  },
  arma('shuriken'),
  arma('bumeran'),
  arma('bomba'),
  { id: 'escudo', tipo: POSITIVO, aplicar: (partida, j) => { jugador(partida, j).escudos++; } },
  marca('furiaTemporal', POSITIVO, 'todos', 'alguno'),
  marca('iman', POSITIVO, 'jugador', 'ambos'),
  marca('municionGratis', POSITIVO, 'jugador', 'ambos'),
  marca('trampaPiedra', POSITIVO, 'jugador', 'ambos'),
  marca('bombaAlMorir', POSITIVO, 'jugador', 'ambos'),
  marca('saltoPisoton', POSITIVO, 'jugador', 'ambos'),
  marca('parryRecarga', POSITIVO, 'jugador', 'ambos'),
  marca('katanaLarga', POSITIVO, 'jugador', 'ambos'),
  marca('katanaAlta', POSITIVO, 'jugador', 'ambos'),
  marca('parry360', POSITIVO, 'jugador', 'ambos'),
  marca('parryDevuelve', POSITIVO, 'jugador', 'ambos'),
  marca('proyectilesBuscan', POSITIVO, 'jugador', 'ambos'),

  // --- Negativos ---
  { id: 'rebotesEnemigos', tipo: NEGATIVO, aplicar: (partida) => { global(partida).rebotesEnemigos++; } },
  {
    id: 'menosTiempo', tipo: NEGATIVO, incompatible: ['masTiempo'],
    disponible: (partida) => global(partida).tiempoExtra > -TOPE_TIEMPO_EXTRA,
    aplicar: (partida) => { global(partida).tiempoExtra--; }
  },
  marca('pisarEnfurece', NEGATIVO, 'jugador', 'ambos'),
  marca('contagio', NEGATIVO, 'todos', 'alguno'),
  marca('primerEnemigoEscudo', NEGATIVO, 'todos', 'alguno'),
  marca('fuegoAmigo', NEGATIVO, 'todos', 'alguno'),
  marca('explosionesLanzan', NEGATIVO, 'todos', 'alguno'),
  marca('explotanAlMorir', NEGATIVO, 'todos', 'alguno'),
  marca('minas', NEGATIVO, 'todos', 'alguno'),
  marca('bombasEspeciales', NEGATIVO, 'todos', 'alguno'),
  marca('ocultarNegativos', NEGATIVO, 'todos', 'alguno'),
  marca('cadena', NEGATIVO, 'todos', 'alguno'),
  marca('positivosIlegibles', NEGATIVO, 'todos', 'alguno'),
  marca('proyectilDejaBola', NEGATIVO, 'todos', 'alguno'),
  {
    id: 'trampasAlAzar', tipo: NEGATIVO, maximo: 5,
    aplicar: (partida) => { global(partida).trampasAlAzar++; }
  },
  marca('llamaBola', NEGATIVO, 'todos', 'alguno'),
  marca('trampaSeExtiende', NEGATIVO, 'todos', 'alguno'),
  marca('bolaExtra', NEGATIVO, 'todos', 'alguno'),
  marca('fantasmaRapido', NEGATIVO, 'jugador', 'ambos'),
  marca('monedasRojas', NEGATIVO, 'todos', 'alguno')
];

export const efectoPorId = (id) => EFECTOS.find(efecto => efecto.id === id);

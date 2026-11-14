// Pergaminos.js
// El build de la partida: lo que se toma en la sala de pergaminos es permanente. Acá viven los modificadores de cada
// jugador y los de todos, qué efectos pueden salir y cómo se arman las cartas (un positivo y un negativo cada una).
import { EFECTOS, NEGATIVO, POSITIVO, efectoPorId } from '../datos/Pergaminos.js';

// Lo que cada jugador lleva en su build. Los pergaminos los cambian; el código del juego los lee.
export const MODS_JUGADOR_BASE = {
  velocidad: 1, salto: 1, knockback: 1, municionInfinitaCaceria: false,
  rebotesExtra: 0,      // Rebotes de más para sus proyectiles
  escudos: 0,           // Veces que sobrevive a una muerte (no al fantasma)
  iman: false, municionGratis: false, trampaPiedra: false, bombaAlMorir: false,
  saltoPisoton: false, parryRecarga: false, katanaLarga: false, katanaAlta: false, parry360: false, parryDevuelve: false,
  proyectilesBuscan: false,
  pisarEnfurece: false, fantasmaRapido: false
};

// Lo que afecta a todos
export const MODS_GLOBAL_BASE = {
  tiempoExtra: 0, multPuntos: 1, velProyectiles: 1, enemigosInmunesStun: false,
  fuegoAmigo: false,     // Los proyectiles de los jugadores son negros y golpean a todos, incluido quien los lanzó
  dañoPropio: false,     // Los proyectiles de un jugador lo golpean a él mismo
  monedasRojas: false,   // Las monedas se ponen rojas al perder valor
  rebotesEnemigos: 0, trampasAlAzar: 0,
  furiaTemporal: false, contagio: false, primerEnemigoEscudo: false, explotanAlMorir: false,
  ocultarNegativos: false, cadena: false, positivosIlegibles: false, minas: false, bombasEspeciales: false,
  proyectilDejaBola: false, llamaBola: false, trampaSeExtiende: false, bolaExtra: false,
  explosionesLanzan: false  // Las explosiones de los demonios lanzan monedas y talismanes que dañan a los jugadores
};

export const modsIniciales = () => ({
  global: { ...MODS_GLOBAL_BASE },
  jugadores: [{ ...MODS_JUGADOR_BASE }, { ...MODS_JUGADOR_BASE }]
});

const vecesTomado = (partida, id, j) => (partida.tomados[id] ? partida.tomados[id][j] : 0);
const totalTomado = (partida, id) => vecesTomado(partida, id, 0) + vecesTomado(partida, id, 1);
export const jugadoresEnJuego = (partida) => [0, 1].filter(j => j < partida.jugadores && partida.vidas[j] > 0);

export function disponible(partida, efecto) {
  const enJuego = jugadoresEnJuego(partida);
  if (efecto.noAparece === 'alguno' && totalTomado(partida, efecto.id) > 0) return false;
  if (efecto.noAparece === 'ambos' && enJuego.every(j => vecesTomado(partida, efecto.id, j) > 0)) return false;
  if (efecto.maximo !== undefined && totalTomado(partida, efecto.id) >= efecto.maximo) return false;
  return !efecto.disponible || efecto.disponible(partida, enJuego);
}

const peso = (partida, efecto) => (efecto.peso ?? 10) * (efecto.decae ? efecto.decae ** totalTomado(partida, efecto.id) : 1);

// Sorteo por peso, sin repetir
function sortear(partida, efectos, cantidad, azar) {
  const restantes = [...efectos];
  const elegidos = [];
  while (elegidos.length < cantidad && restantes.length > 0) {
    const total = restantes.reduce((suma, efecto) => suma + peso(partida, efecto), 0);
    let tirada = azar() * total;
    const indice = Math.max(0, restantes.findIndex(efecto => (tirada -= peso(partida, efecto)) < 0));
    elegidos.push(restantes.splice(indice, 1)[0]);
  }
  return elegidos;
}

const compatibles = (a, b) => !(a.incompatible || []).includes(b.id) && !(b.incompatible || []).includes(a.id);

// Hasta 3 cartas, cada una con un positivo y un negativo distintos de los de las otras cartas
export function armarCartas(partida, azar = Math.random, cantidad = 3) {
  const posibles = (tipo) => EFECTOS.filter(efecto => efecto.tipo === tipo && disponible(partida, efecto));
  const positivos = sortear(partida, posibles(POSITIVO), cantidad, azar);
  const negativos = sortear(partida, posibles(NEGATIVO), cantidad, azar);
  const cartas = [];
  positivos.forEach(positivo => {
    const indice = negativos.findIndex(negativo => compatibles(positivo, negativo));
    if (indice >= 0) cartas.push({ positivo: positivo.id, negativo: negativos.splice(indice, 1)[0].id });
  });
  return cartas;
}

// La clave del texto de un efecto: los movimientos dicen "nivel 2" o no según cómo esté la partida
export function textoEfecto(partida, id) {
  const efecto = efectoPorId(id);
  return `perg_${efecto.texto ? efecto.texto(partida, jugadoresEnJuego(partida)) : id}`;
}

export function tomarEfecto(partida, id, j) {
  if (!partida.tomados[id]) partida.tomados[id] = [0, 0];
  partida.tomados[id][j]++;
  efectoPorId(id).aplicar(partida, j);
}

export function tomarCarta(partida, carta, j) {
  tomarEfecto(partida, carta.positivo, j);
  tomarEfecto(partida, carta.negativo, j);
  // Quedan grabados en las paredes de la sala, en orden
  if (!partida.grabados) partida.grabados = [];
  partida.grabados.push({ j, id: carta.positivo }, { j, id: carta.negativo });
}

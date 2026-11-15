// Fuego.js
// Los tiles de fuego escupen bolas al azar por sus caras libres. Una bola rebota, pierde el impulso rápido y, cuando
// queda quieta sobre algo, se convierte en una llama que se apaga sola.
import { BANDO, CONFIG } from '../config.js';

const REBOTE_BOLA = 0.45;
const FRENO_BOLA = 50;           // Rozamiento horizontal (px/s²), para que termine quieta
const QUIETA = 30;               // Velocidad vertical (px/s) por debajo de la cual una bola apoyada se apaga en llama
const RADIO_BOLA = 5;
const SALIDA = 14;               // Distancia del centro del tile a la que nace la bola

// Cada cara del tile: la celda vecina que tiene que estar libre y con qué velocidad sale la bola
export const CARAS = [
  { col: 0, fila: -1, vx: [-100, 100], vy: -260 },
  { col: -1, fila: 0, vx: [-150, -90], vy: -160 },
  { col: 1, fila: 0, vx: [90, 150], vy: -160 },
  { col: 0, fila: 1, vx: [-40, 40], vy: 60 }
];

// Pergamino "el fuego se propaga mejor": multiplica lo que genera fuego (CONFIG.FUEGO_PROPAGA)
const propaga = (escena) => !!escena.modsGlobal.fuegoPropaga;
const frecuenciaFuego = (escena) => (propaga(escena) ? CONFIG.FUEGO_PROPAGA.frecuencia : 1);
export const duracionLlama = (escena) => CONFIG.DURACION_LLAMA * (propaga(escena) ? CONFIG.FUEGO_PROPAGA.vida : 1);
const probabilidad = (escena, p) => Math.min(1, p * frecuenciaFuego(escena));

const proximaBola = (escena, ahora) => ahora + Phaser.Math.Between(CONFIG.FUEGO_ESPERA_MIN, CONFIG.FUEGO_ESPERA_MAX) / frecuenciaFuego(escena);

export function crearBola(escena, x, y, vx, vy) {
  const bola = escena.dispararProyectilEnemigo(x, y, vx, vy, { gravedad: true });
  if (!bola) return null;
  bola.setTexture('bola-fuego');
  bola.body.setCircle(RADIO_BOLA, 1, 1);
  bola.setBounce(REBOTE_BOLA);
  bola.setDragX(FRENO_BOLA);
  bola.rebota = true;
  return bola;
}

// Algunas bolas salen más altas o más abiertas (CONFIG.VARIEDAD_BOLAS). La de abajo cae: no cambia.
function variar(cara, vx) {
  const { probAlta, alta, probAbierta, abierta } = CONFIG.VARIEDAD_BOLAS;
  let vy = cara.vy;
  if (vy >= 0) return { vx, vy };
  if (Math.random() < probAlta) vy *= Phaser.Math.FloatBetween(alta[0], alta[1]);
  if (Math.random() < probAbierta) vx *= Phaser.Math.FloatBetween(abierta[0], abierta[1]);
  return { vx: Math.round(vx), vy: Math.round(vy) };
}

export function escupirFuego(escena, tile) {
  const cara = Phaser.Math.RND.pick(tile.caras);
  const variada = variar(cara, Phaser.Math.Between(cara.vx[0], cara.vx[1]));
  const { vx } = variada;
  const x = tile.x + cara.col * SALIDA;
  const y = tile.y + cara.fila * SALIDA;
  tile.bola = crearBola(escena, x, y, vx, variada.vy);
  if (tile.bola) (tile.bolas ??= []).push(tile.bola);
  escena.efectoChispas(x, y, 0xf97316);
  // Pergamino: a veces sale una más
  if (escena.modsGlobal.bolaExtra && Math.random() < probabilidad(escena, CONFIG.PROB_BOLA_EXTRA)) crearBola(escena, x, y, -vx, variada.vy);
}

// Caída pesada nivel 2: una bola como las del tile de fuego, pero del jugador: celeste y solo daña a los enemigos.
// No deja llama: rebota unas veces y se apaga.
export function crearBolaCeleste(escena, duenio, x, y, vx, vy) {
  const bola = escena.proyectiles.create(x, y, 'bola-fuego');
  bola.bando = BANDO.JUGADORES;
  bola.tipo = 'bolaCeleste';
  bola.duenio = duenio;
  bola.golpeados = new Set();
  bola.nacimiento = escena.time.now;
  bola.rebotesRestantes = 3;
  bola.body.setAllowGravity(true);
  bola.body.setGravityY(200); // La misma caída que las bolas del tile de fuego
  bola.body.setCircle(RADIO_BOLA, 1, 1);
  bola.setBounce(REBOTE_BOLA);
  bola.setVelocity(vx, vy);
  bola.setTint(0x7dd3fc);
  return bola;
}

export function encenderLlama(escena, x, piso) {
  const llama = escena.llamas.create(x, piso - 8, 'llama');
  llama.body.setSize(12, 12);
  llama.body.setOffset(2, 4);
  llama.play('llama');
  escena.time.delayedCall(duracionLlama(escena), () => {
    if (!llama.active) return;
    if (llama.body) llama.body.enable = false;
    // Pergamino: al apagarse puede escupir otra bola
    // Con el fuego que se propaga, escupe varias (hacia los dos lados)
    if (escena.modsGlobal.llamaBola && Math.random() < probabilidad(escena, CONFIG.PROB_LLAMA_BOLA)) {
      const primera = Phaser.Math.Between(-80, 80);
      crearBola(escena, llama.x, llama.y - 4, primera, -220);
      // Las demás, hacia el otro lado que la primera
      for (let i = 1; i < frecuenciaFuego(escena); i++) {
        crearBola(escena, llama.x, llama.y - 4, -Math.sign(primera || 1) * Phaser.Math.Between(20, 80), -220);
      }
    }
    escena.tweens.add({ targets: llama, alpha: 0, duration: 300, onComplete: () => llama.destroy() });
  });
}

function apagarBolasQuietas(escena) {
  escena.proyectilesDe(BANDO.DEMONIOS).filter(p => p.rebota).forEach(bola => {
    const apoyada = bola.body.blocked.down || bola.body.touching.down;
    if (!apoyada || Math.abs(bola.body.velocity.y) > QUIETA) return;
    encenderLlama(escena, bola.x, bola.body.bottom);
    bola.destroy();
  });
}

// Cada tile tiene su propio turno, y no escupe otra bola mientras la anterior siga en juego
export function actualizarFuego(escena, ahora) {
  apagarBolasQuietas(escena);
  if (!escena.reglas.escupeFuego) return;
  escena.tilesFuego.forEach(tile => {
    tile.proxima ??= proximaBola(escena, ahora);
    if (ahora < tile.proxima) return;
    tile.proxima = proximaBola(escena, ahora);
    // Normalmente una bola por tile a la vez; con el fuego que se propaga, más
    tile.bolas = (tile.bolas ?? []).filter(bola => bola.active);
    if (tile.bolas.length < frecuenciaFuego(escena)) escupirFuego(escena, tile);
  });
}

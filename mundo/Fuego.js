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

const proximaBola = (ahora) => ahora + Phaser.Math.Between(CONFIG.FUEGO_ESPERA_MIN, CONFIG.FUEGO_ESPERA_MAX);

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

export function escupirFuego(escena, tile) {
  const cara = Phaser.Math.RND.pick(tile.caras);
  const vx = Phaser.Math.Between(cara.vx[0], cara.vx[1]);
  const x = tile.x + cara.col * SALIDA;
  const y = tile.y + cara.fila * SALIDA;
  tile.bola = crearBola(escena, x, y, vx, cara.vy);
  escena.efectoChispas(x, y, 0xf97316);
  // Pergamino: a veces sale una más
  if (escena.modsGlobal.bolaExtra && Math.random() < CONFIG.PROB_BOLA_EXTRA) crearBola(escena, x, y, -vx, cara.vy);
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

function encenderLlama(escena, x, piso) {
  const llama = escena.llamas.create(x, piso - 8, 'llama');
  llama.body.setSize(12, 12);
  llama.body.setOffset(2, 4);
  llama.play('llama');
  escena.time.delayedCall(CONFIG.DURACION_LLAMA, () => {
    if (!llama.active) return;
    if (llama.body) llama.body.enable = false;
    // Pergamino: al apagarse puede escupir otra bola
    if (escena.modsGlobal.llamaBola && Math.random() < CONFIG.PROB_LLAMA_BOLA) {
      crearBola(escena, llama.x, llama.y - 4, Phaser.Math.Between(-80, 80), -220);
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
    tile.proxima ??= proximaBola(ahora);
    if (ahora < tile.proxima) return;
    tile.proxima = proximaBola(ahora);
    if (!tile.bola || !tile.bola.active) escupirFuego(escena, tile);
  });
}

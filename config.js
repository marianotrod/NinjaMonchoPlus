// config.js
// Constantes de juego en un solo lugar para poder calibrar sin buscar números sueltos en el código.

const parametros = new URLSearchParams(window.location.search);

// Modo desarrollo: abrir el juego con ?debug en la URL.
// Activa las teclas de prueba (ENTER = colisiones, SUPR = sin enemigos, BACKSPACE = habilidades, AV PÁG = modo dios)
// y permite arrancar directo en un nivel: ?debug&nivel=5&jugadores=2&jefe=oni
export const DEBUG = parametros.has('debug');

export const ARRANQUE_DEBUG = {
  nivel: DEBUG && parametros.get('nivel') ? parseInt(parametros.get('nivel'), 10) : null,
  jugadores: DEBUG && parametros.get('jugadores') ? parseInt(parametros.get('jugadores'), 10) : 1,
  jefe: DEBUG ? parametros.get('jefe') : null   // ogro | oni | espectro (solo en niveles de jefe intermedio)
};

export const CONFIG = {
  VIDAS_INICIALES: 3,
  TOTAL_NIVELES: 10,
  NIVELES_POR_BLOQUE: 5,        // Cada 5 niveles hay jefe: el 5 es intermedio y el 10 es el final

  TIEMPO_RECOLECCION: 60,
  TIEMPO_CACERIA: 30,
  TIEMPO_JEFE: 99,
  ALARMA_TIEMPO: 10,            // Desde acá el reloj se pone rojo y suena el tic
  ALARMA_URGENTE: 5,

  BONO_POR_SEGUNDO: 100,
  PUNTOS_BAJA: 100,
  BONO_JEFE: 5000,
  VALOR_MONEDA: 200,

  // Qué se pierde al recibir un golpe en la Fase de Recolección:
  // 'ultimo' = el último talismán (como dice el GDD) | 'todos' = todo el inventario (versión anterior)
  DAÑO_PIERDE: 'ultimo',

  TOPE_ENEMIGOS_BASE: 3,
  TOPE_ENEMIGOS_MAX: 5,
  INTERVALO_DEMONIOS: 2000,
  INTERVALO_ARMAS: 12000,
  INTERVALO_ARMAS_JEFE: 7000,
  VIDA_PICKUP_ARMA: 10000
};

// Parámetros de movimiento del ninja. Gravedad efectiva = gravedadMundo + gravedadJugador = 800 px/s².
// Altura de un salto = velocidad² / (2 * 800). Con -350 son 76 px (4,8 tiles); las plataformas están cada 64 px.
export const FISICA = {
  gravedadMundo: 200,
  gravedadJugador: 600,

  velocidadCarrera: 140,
  suavizado: 0.3,

  salto: -350,
  dobleSalto: -280,
  corteSalto: 0.45,             // Al soltar el botón en subida, la velocidad se multiplica por esto (salto variable)
  saltoPared: -300,
  empujePared: 260,
  pisoton: -380,
  trampolin: -420,              // Rebote sobre la cabeza del compañero
  caidaRapida: 480,

  dash: 350,
  dashDuracion: 200,
  dashCooldown: 500,
  dobleToque: 250,

  coyote: 100,
  bufferSalto: 150,

  knockbackX: 180,
  knockbackY: -220,
  duracionStun: 500,

  katanaDuracion: 150,
  katanaCooldown: 320
};

// Índices estándar de botones de joystick (layout Xbox / "standard gamepad")
export const PAD = { A: 0, B: 1, X: 2, Y: 3, L1: 4, R1: 5, SELECT: 8, START: 9 };

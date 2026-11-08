// config.js
// Constantes de juego en un solo lugar para poder calibrar sin buscar números sueltos en el código.

const parametros = new URLSearchParams(window.location.search);

// Modo desarrollo: abrir el juego con ?debug en la URL.
// Activa las teclas de prueba (ENTER = colisiones, SUPR = sin enemigos, BACKSPACE = habilidades, AV PÁG = modo dios)
// y permite arrancar directo en un nivel: ?debug&nivel=5&jugadores=2&jefe=oni&mapa=n-valle
export const DEBUG = parametros.has('debug');

export const ARRANQUE_DEBUG = {
  nivel: DEBUG && parametros.get('nivel') ? parseInt(parametros.get('nivel'), 10) : null,
  jugadores: DEBUG && parametros.get('jugadores') ? parseInt(parametros.get('jugadores'), 10) : 1,
  jefe: DEBUG ? parametros.get('jefe') : null,  // ogro | oni | espectro (solo en niveles de jefe intermedio)
  mapa: DEBUG ? parametros.get('mapa') : null,  // id de un nivel de public/niveles (para probarlo)
  borrador: DEBUG && parametros.has('borrador'), // usa el nivel que mandó el editor online (ver mundo/Niveles.js)
  sala: DEBUG && parametros.has('sala')          // arranca en la sala de pergaminos; con &mapa= usa esa sala
};

// Traducciones por API (Traducila: https://traducila.vercel.app). Sin proyecto cargado, o si la API falla,
// el juego usa la última copia guardada o los textos de i18n.js. Con ?debug se puede cambiar: ?debug&api=...&proyecto=...
// La API de Traducila fue un pedido para la entrega: ahora los textos salen de i18n.js. Para volver a usarla, activa: true.
// Con ?debug&api=... se prende igual, para que el banco de pruebas siga cubriendo ese código.
export const TRADUCCIONES = {
  activa: DEBUG && parametros.has('api'),
  api: (DEBUG && parametros.get('api')) || 'https://traducila.vercel.app',
  proyecto: (DEBUG && parametros.get('proyecto')) || '3ed44ceb-d294-4cfb-9cfa-6a5509745628',
  espera: 3000                 // Tiempo máximo para arrancar sin respuesta de la API (ms)
};

// Grilla de los niveles: 34×20 tiles, con la pantalla de 32×18 al centro abajo (2 filas ocultas arriba y 1 columna a cada lado).
export const BANDO = { JUGADORES: 'jugadores', DEMONIOS: 'demonios' };

// Color de lo que golpea: azul daña a los enemigos, rojo a los jugadores y negro a todos (con fuego amigo)
export const COLORES = { JUGADORES: 0x60a5fa, DEMONIOS: 0xf87171, TODOS: 0x4b5563, INMORTAL: 0xfacc15 };

export const MUNDO = {
  columnas: 34, filas: 20, columnasOcultas: 1, filasOcultas: 2, tile: 16,
  caidaMaxima: 600,    // Tope de velocidad al caer por un hueco y volver a entrar por arriba (px/s)
  vidaProyectil: 4000  // Con wrap los proyectiles no salen nunca de la pantalla: duran esto como máximo (ms)
};

// Tipos de la capa "logica" de los niveles
export const LOGICA = { VACIO: 0, SOLIDO: 1, PASARELA: 2, TRAMPA: 3, FUEGO: 4 };

// Tiles con significado propio en MapTileSet.png. El fuego es el último: sus cuadros se animan solos desde este
// hasta el primer tile vacío, así que para agregar uno alcanza con dibujarlo a continuación.
export const TILES = { TRAMPA: 90, FUEGO: 91, PIEDRA: 100 };

export const CONFIG = {
  VIDAS_INICIALES: 3,          // Por jugador: las vidas no se comparten
  FANTASMA_VELOCIDAD: 45,       // Velocidad con la que aparece el fantasma (px/s). No tiene tope
  FANTASMA_ACELERACION: 6,      // Cuánto más rápido va por cada segundo que pasa (px/s por segundo)
  FUEGO_ESPERA_MIN: 3000,       // Tiempo entre bolas de un tile de fuego: al azar entre estos dos valores (ms)
  FUEGO_ESPERA_MAX: 7000,
  DURACION_LLAMA: 5000,         // Lo que dura encendida la llama que deja una bola al quedar quieta (ms)
  FANTASMA_PISADO: 800,         // Pisado, el fantasma se frena y no daña durante esto (ms); después se enoja
  FANTASMA_ENOJO: 1.3,          // Enojado va esto más rápido y acelera esto más; ya no se lo puede pisar
  ENTRADA_ENEMIGO: 1200,        // Un enemigo es intocable mientras entra a la pantalla y esto más (ms)
  TOPE_MONEDAS_CACERIA: 3,      // En la Cacería siguen cayendo monedas hasta este tope
  INTERVALO_MONEDAS_CACERIA: 3000, // Cada cuánto cae una si hay menos que el tope (ms)
  // Pergaminos
  DURACION_FURIA: 6000,         // Con "la furia se pasa": lo que dura enfurecido un demonio (ms)
  RADIO_IMAN: 72,               // Distancia a la que el imán atrae talismanes (px)
  FUERZA_IMAN: 500,             // Aceleración hacia el ninja (px/s²)
  PROB_MUNICION_GRATIS: 0.2,
  PROB_PARRY_RECARGA: 0.2,
  PROB_LLAMA_BOLA: 0.3,         // Una llama que se apaga escupe otra bola
  PROB_BOLA_EXTRA: 0.2,
  ESPERA_EXTENSION_TRAMPA: 1500, // Una trampa se extiende como mucho una vez cada este tiempo (ms)
  PLATAFORMA_ANCHO: 3,          // Doble salto nivel 2: tiles de la plataforma fantasma
  PLATAFORMA_DURACION: 3000,    // Lo que dura la plataforma fantasma (ms); el último segundo titila
  BOLA_CELESTE_DURACION: 2500,  // Caída pesada nivel 2: lo que vive cada bola celeste (ms)
  PROB_MINA: 0.25,              // Con el pergamino: probabilidad de que caiga una mina en vez de una moneda
  PROB_BOMBA_ESPECIAL: 0.25,    // Con el pergamino: lo mismo con la bomba especial
  ESPERA_BOMBA_ESPECIAL: 4000,  // La bomba especial explota sola después de esto (ms)
  ESPERA_RESPAWN: 2000,         // Tras caer fuera de la pantalla, el ninja reaparece arriba después de esto (ms)
  INVUL_RESPAWN: 2500,          // Invulnerabilidad al reaparecer, desde que toca el piso (ms)
  INVUL_INICIO: 1500,           // Lo mismo al aparecer al empezar el nivel (ms)
  TOTAL_NIVELES: 10,
  NIVELES_POR_BLOQUE: 5,        // Cada 5 niveles hay jefe: el 5 es intermedio y el 10 es el final
  NIVELES_FIJOS: { 1: 'inicio', 2: 'aprendizaje' }, // Número de nivel → id; el resto sale del pool

  TIEMPO_RECOLECCION: 60,
  TIEMPO_MINIMO: 15,            // Piso del tiempo de un nivel aunque los pergaminos lo recorten
  DURACION_SALA: 10,            // Segundos de la sala de pergaminos
  CUENTA_SALA: 600,             // Lo que dura cada número de la cuenta regresiva de la sala (ms)
  SALA_OCULTA: 3000,            // Pergaminos negativos de la sala: tiempo con textos ocultos (ms)
  SALA_CADENA: 5000,            // Tiempo que una carta queda encadenada (ms)
  NIVEL_SALA: 'sala-pergaminos',  TIEMPO_CACERIA: 30,
  TIEMPO_JEFE: 99,
  ALARMA_TIEMPO: 10,            // Desde acá el reloj se pone rojo y suena el tic
  ALARMA_URGENTE: 5,

  DURACION_INTRO: 2400,         // Cartel de inicio de nivel (ms)
  DURACION_SELLO: 2000,         // Cartel de "¡Sello roto!" antes de la Cacería (ms)
  APARICION_JEFE: 1000,         // El jefe aparece a este tiempo de empezada la intro (ms)

  BONO_POR_SEGUNDO: 100,
  PUNTOS_BAJA: 100,
  BONO_JEFE: 5000,
  VALOR_MONEDA: 200,
  CAIDA_VALOR_MONEDA: 0.8,      // En cada rebote la moneda vale esto respecto de lo que valía

  TOPE_ENEMIGOS_BASE: 3,
  TOPE_ENEMIGOS_MAX: 5,
  CUPO_CACERIA_BASE: 3,         // Demonios a cazar: base + nivel / 2, hasta el máximo
  CUPO_CACERIA_MAX: 6,
  INTERVALO_CACERIA: 500,
  INTERVALO_TALISMANES: 150,
  INTERVALO_DEMONIOS: 2000,

  // Caer de muy alto: se mide la altura caída (sigue sumando si se cae por un hueco y se vuelve a entrar por arriba).
  // Al tocar el piso desde esa altura el ninja aterriza pesado y pierde un poco de tiempo sin control.
  // Con el boulder, saltar justo antes de tocar el piso lo hace rodar; apenas antes, aterriza sin castigo.
  // Para sacar la mecánica entera: activa: false (el boulder deja de tener cuándo activarse).
  CAIDA_ALTA: {
    activa: true,
    altura: 190,                // 2/3 de la pantalla (px)
    castigo: 400,               // Tiempo sin control al aterrizar pesado (ms)
    ventanaPerfecta: 100,       // Boulder: saltar en estos últimos ms antes de tocar el piso → rueda
    ventanaCasi: 250            // Boulder: saltar en estos → aterriza sin castigo, sin rodar
  },
  BOULDER: {
    velocidad: 230,             // Velocidad del rodar (px/s)
    duracion: 600,              // Lo que dura rodando (ms)
    empujeNivel2: { x: 380, y: -220 },  // Nivel 2: así salen disparados los enemigos que toca
    duracionLanzado: 900        // Nivel 2: lo que un enemigo disparado golpea a otros (ms)
  },

  // Vida que le saca cada cosa a un jefe
  DAÑO_GOLPE: { katana: 1, proyectil: 1, pisoton: 2, explosion: 3, boulder: 2 }
};

// Parámetros de movimiento del ninja. Gravedad efectiva = gravedadMundo + gravedadJugador = 800 px/s².
// Altura de un salto = velocidad² / (2 * 800). Con -350 son 76 px (4,8 tiles); las plataformas están cada 64 px.
export const FISICA = {
  gravedadMundo: 200,
  gravedadJugador: 600,

  velocidadCarrera: 140,
  suavizado: 0.3,
  suavizadoAire: 0.4,           // En el aire, qué tan rápido responde al cambiar de dirección
  frenadoAire: 0.12,            // En el aire sin apretar nada, cuánto frena por cuadro (0 = sigue derecho)

  salto: -350,
  dobleSalto: -280,
  corteSalto: 0.45,             // Al soltar el botón en subida, la velocidad se multiplica por esto (salto variable)
  saltoPared: -300,
  empujePared: 260,
  pisoton: -380,
  pisotonSaltado: -520,         // Con el pergamino: saltar justo al pisar lleva más alto
  trampolin: -420,              // Rebote sobre la cabeza del compañero
  caidaRapida: 480,

  dash: 350,
  dashDuracion: 200,
  dashCooldown: 500,
  dobleToque: 250,

  coyote: 100,
  bufferSalto: 150,

  empujeEnemigo: { x: 200, y: -150 },  // Golpe de katana o proyectil a un enemigo que no muere
  empujeItem: { fuerza: 300, subidaMinima: -120 },  // Katana a un talismán o una moneda: se aleja del centro del ninja
  velocidadItemLanzado: 60,            // Un ítem empujado golpea hasta que anda más lento que esto (px/s)
  empujeNinja: { x: 220, y: -160 },    // Katana al compañero
  parpadeoGolpe: 1200,          // Protección que queda después del aturdimiento (ms)
  parpadeoPisoton: 600,         // Protección después de pisar a un enemigo (ms)
  bloqueoSaltoPared: 250,       // Tiempo sin control horizontal después de saltar de la pared (ms)
  knockbackX: 180,
  knockbackY: -220,
  duracionStun: 500,

  roceItem: 0.92,               // Frenado de talismanes y monedas apoyados en el piso
  caidaShuriken: 40,            // Gravedad propia del shuriken (px/s²): cae muy poco en su recorrido

  katanaDuracion: 230,
  katanaCooldown: 320,
  katanaExtra: 16,              // Pergaminos: lo que suma la katana hacia adelante o hacia arriba (px)
  radioParry360: 22             // Pergamino: el parry alcanza esto alrededor del centro del ninja (px)
};

// Índices estándar de botones de joystick (layout Xbox / "standard gamepad")
// Teclas de cada jugador, con los nombres de Phaser.Input.Keyboard.KeyCodes
export const TECLAS = {
  J1: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', ataque: 'X', especial: 'C' },
  J2: { up: 'W', down: 'S', left: 'A', right: 'D', ataque: 'J', especial: 'K' }
};

export const PAD = { A: 0, B: 1, X: 2, Y: 3, L1: 4, R1: 5, SELECT: 8, START: 9, ARRIBA: 12, ABAJO: 13, IZQUIERDA: 14, DERECHA: 15 };

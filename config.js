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
  sala: DEBUG && parametros.has('sala'),         // arranca en la sala de pergaminos; con &mapa= usa esa sala
  enemigos: DEBUG ? leerEnemigosDePrueba(parametros.get('enemigos')) : null,  // lo elige el editor al probar (ver abajo)
  fase: DEBUG ? parametros.get('fase') : null,   // caceria: el nivel común arranca directo en la Cacería (para probar mapas)
  sinTiempo: DEBUG && parametros.has('sinTiempo'), // el reloj no baja (salvo en la sala de pergaminos): para probar mapas
  // pergaminos=parryDevuelve,katanaLarga: los dos jugadores arrancan con esos efectos (ids de datos/Pergaminos.js)
  pergaminos: DEBUG && parametros.get('pergaminos') ? parametros.get('pergaminos').split(',').filter(Boolean) : []
};

// ?debug&enemigos=... (el botón Probar del editor):
//   ninguno                  → no aparece ninguno
//   nivel:7                  → aparecen como en el nivel 7 (cuáles, cuántos a la vez y el cupo de la Cacería)
//   esqueleto:2,samurai:1    → solo esos, en esas cantidades (en la Recolección a la vez; en la Cacería, el cupo)
function leerEnemigosDePrueba(texto) {
  if (!texto) return null;
  if (texto === 'ninguno') return { modo: 'ninguno' };
  const [modo, valor] = texto.split(':');
  if (modo === 'nivel') return { modo: 'nivel', nivel: Math.max(1, parseInt(valor, 10) || 1) };
  const lista = Object.fromEntries(texto.split(',').map(par => par.split(':')).map(([clave, n]) => [clave, Math.max(0, parseInt(n, 10) || 0)]));
  return { modo: 'lista', lista };
}

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
// Aura y estela de todo lo que vuela y daña: del color de a quién daña (mundo/Peligros.js)
export const COLORES_PELIGRO = { A_JUGADORES: 0xff3df0, A_DEMONIOS: 0x00b3ff, A_TODOS: 0x4c1d95 };

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
  TOPE_MONEDAS_CACERIA: 12,     // En la Cacería siguen cayendo monedas hasta este tope (sirven para pisar y llegar alto)
  INTERVALO_MONEDAS_CACERIA: 3000, // Cada cuánto cae una si hay menos que el tope (ms)
  // Pergaminos
  DURACION_FURIA: 6000,         // Con "la furia se pasa": lo que dura enfurecido un demonio (ms)
  RADIO_IMAN: 72,               // Distancia a la que el imán atrae talismanes (px)
  FUERZA_IMAN: 500,             // Aceleración hacia el ninja (px/s²)
  PROB_MUNICION_GRATIS: 0.2,
  // Parry que devuelve (roadmap 5.12): con true lo tienen todos, sin pergamino. velocidad: cuánto más rápido vuelve
  PARRY_DEVUELVE: { siempre: false, velocidad: 1.3, minima: 160 },
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
  ESPERA_BOMBA_FURIOSO: 1800,   // Pergamino negativo: la bomba que suelta un furioso al morir explota después de esto (ms)
  ESPERA_RESPAWN: 2000,         // Tras caer fuera de la pantalla, el ninja reaparece arriba después de esto (ms)
  INVUL_RESPAWN: 2500,          // Invulnerabilidad al reaparecer, desde que toca el piso (ms)
  INVUL_INICIO: 1500,           // Lo mismo al aparecer al empezar el nivel (ms)
  TOTAL_NIVELES: 10,
  NIVELES_POR_BLOQUE: 5,        // Cada 5 niveles hay jefe: el 5 es intermedio y el 10 es el final
  NIVELES_FIJOS: { 1: 'inicio', 2: 'aprendizaje' }, // Número de nivel → id; el resto sale del pool
  // Qué tiers de mapa pueden salir en cada nivel (el tier va en el JSON del mapa: 1 fácil, 3 difícil).
  // Un nivel que no está acá acepta cualquiera. Si no queda ningún mapa de esos tiers, sale cualquiera.
  TIERS_POR_NIVEL: { 3: [1], 4: [1, 2], 6: [2], 7: [2, 3], 8: [3], 9: [3] },

  TIEMPO_RECOLECCION: 60,
  TIEMPO_MINIMO: 15,            // Piso del tiempo de un nivel aunque los pergaminos lo recorten
  DURACION_SALA: 10,            // Segundos de la sala de pergaminos
  CUENTA_SALA: 600,             // Lo que dura cada número de la cuenta regresiva de la sala (ms)
  SALA_OCULTA: 3000,            // Pergaminos negativos de la sala: tiempo con textos ocultos (ms)
  SALA_CADENA: 5000,            // Tiempo que una carta queda encadenada (ms)
  SALA_REVELAR: 2500,           // Al terminar la sala, lo que quedan a la vista las cartas elegidas, con el nivel oscurecido (ms)
  // Íconos grabados en las paredes de la sala (J1 a la izquierda, J2 a la derecha): por columna, desde esta altura (px)
  GRABADOS: { filas: 14, desdeY: 40 },
  NIVEL_SALA: 'sala-pergaminos',  TIEMPO_CACERIA: 30,
  TIEMPO_JEFE: 99,
  ALARMA_TIEMPO: 10,            // Desde acá el reloj se pone rojo y suena el tic
  ALARMA_URGENTE: 5,

  DURACION_INTRO: 2400,         // Cartel de inicio de nivel (ms)
  DURACION_SELLO: 1200,         // Cartel de "¡Sello roto!" antes de la Cacería (ms), con el juego quieto
  DURACION_CARTEL_CACERIA: 1000, // Cartel de "Cacería", después del sello (ms)
  DURACION_CARTEL_FANTASMA: 1200, // Cartel del fantasma al acabarse el tiempo (ms)
  // Al cambiar de fase el juego frena hasta quedar quieto, sale el cartel (y se va rápido por arriba) y recién
  // después recupera la velocidad (sistemas/PausaDeFase.js). Con activa: false, los carteles salen con el juego andando.
  PAUSA_FASE: { activa: true, frenado: 450, cartel: 1000, salida: 220, arranque: 450 },
  // Fondo de cada fase (mundo/Fondo.js): PNG de public/assets/fondos/. La Recolección usa el del nivel; una fase en null también.
  // transicion: lo que dura el fundido (ms, tiempo real). Con activa: false todo el nivel tiene el fondo del nivel.
  FONDOS_FASE: { activa: true, transicion: 700, archivos: { caceria: 'caceria', fantasma: 'fantasma', jefe: 'jefe', sala: 'sala' } },
  // Golpe final: al completar el nivel la cámara se acerca a la última baja con un destello y el panel sale un momento
  // después. zoom: 1 lo apaga (el panel igual espera esperaPanel ms).
  GOLPE_FINAL: { zoom: 1.4, duracion: 350, esperaPanel: 600 },
  APARICION_JEFE: 1000,         // El jefe aparece a este tiempo de empezada la intro (ms)

  BONO_POR_SEGUNDO: 100,
  PUNTOS_BAJA: 100,
  BONO_JEFE: 5000,
  VALOR_MONEDA: 100,            // Lo que vale una moneda sin rebotar. Se cobra al final del nivel, por el combo máximo
  // Combo de monedas (reglas/Combo.js): ms que hay para agarrar la siguiente; si te matan con el reloj en cero, se anula
  COMBO: { ventana: 1500, anularConFantasma: true },
  CAIDA_VALOR_MONEDA: 0.8,      // En cada rebote la moneda vale esto respecto de lo que valía

  TOPE_ENEMIGOS_BASE: 3,
  TOPE_ENEMIGOS_MAX: 5,
  TOPE_ENEMIGOS_PRUEBA: 12,     // Lo más que se puede pedir desde el editor al probar un mapa (todos juntos)
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
  // Rescate: un jugador sin vidas se puede rescatar en el nivel siguiente (ver mundo/Rescate.js)
  RESCATE: {
    activo: true,
    espera: 1000,               // Después de que el vivo toca el piso, caen la llave y la jaula (ms)
    vidas: 1,                   // Con cuántas vidas vuelve el rescatado
    soltarConGolpe: true,       // Quien lleva la llave la suelta al recibir un golpe
    arrojar: { x: 220, y: -180 }, // Con la llave en la mano, atacar o disparar la arroja así
    conFantasma: false          // Con el reloj en cero (fantasma) la jaula no se abre: nadie reaparece
  },
  // Pisar un proyectil: cayendo sobre él y apretando saltar justo (en estos ms antes de tocarlo) se rebota encima.
  // Si no, golpea como siempre. Para sacarlo: activa: false.
  PISAR_PROYECTIL: { activa: true, ventana: 150 },
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
  saltoPared: -240,
  empujePared: 200,
  gravedadSaltoPared: 0.6,      // Después de un salto de pared, mientras sube, la gravedad es esta fracción: más flotón y lento
  pisoton: -380,
  pisotonSaltado: -520,         // Con el pergamino: saltar justo al pisar lleva más alto
  trampolin: -420,              // Rebote sobre la cabeza del compañero
  caidaRapida: 480,

  dash: 350,
  dashDuracion: 200,
  dashCooldown: 500,
  dobleToque: 250,              // Doble toque: al costado (dash, solo teclado) y abajo en el aire (caída pesada)

  coyote: 100,
  bufferSalto: 150,

  empujeEnemigo: { x: 200, y: -150 },  // Golpe de katana o proyectil a un enemigo que no muere
  empujeItem: { fuerza: 300, subidaMinima: -120 },  // Katana a un talismán o una moneda: se aleja del centro del ninja
  velocidadItemLanzado: 120,           // Un ítem empujado golpea hasta que anda más lento que esto (px/s)
  estelaPeligro: { activa: true, cada: 35, dura: 220, alfa: 0.55 },  // La estela de lo que vuela y daña: cada cuántos ms deja una copia y lo que dura
  auraPeligro: { activa: true, alfa: 0.9 },  // El aura de llama alrededor de lo que vuela y daña (graficos/aura.png)
  empujeNinja: { x: 220, y: -160 },    // Katana al compañero
  parpadeoGolpe: 1200,          // Protección que queda después del aturdimiento (ms)
  parpadeoPisoton: 600,         // Protección después de pisar a un enemigo (ms)
  bloqueoSaltoPared: 250,       // Tiempo sin control horizontal después de saltar de la pared (ms)
  ventanaSaltoPared: 210,       // Salto de pared: hay que saltar hasta esto después de llegar a la pared (ms); después, se agarra
  coyotePared: 120,
  ayudaSaltoPared: true,        // Una rayita celeste en la pared mientras se puede hacer el salto de pared (se apaga con el tiempo)             // ...o hasta esto después de despegarse, si se despegó dentro de la ventana (ms)
  // Agarre de pared (todos, sin pergamino): en el aire, empujando contra una pared, se queda colgado 'duracion' ms y después
  // se desliza a 'deslizar' px/s. Con salto trepa un poquito ('trepar', una vez cada 'esperaTrepar' ms) y el agarre empieza de nuevo.
  agarrePared: { duracion: 700, deslizar: 50, trepar: -150, esperaTrepar: 300 },
  knockbackX: 180,
  knockbackY: -220,
  duracionStun: 500,

  roceItem: 0.92,               // Frenado de talismanes y monedas apoyados en el piso
  caidaShuriken: 40,            // Gravedad propia del shuriken (px/s²): cae muy poco en su recorrido

  katanaDuracion: 230,
  katanaCooldown: 320,
  katanaExtra: 16,              // Pergaminos: lo que suma la katana hacia adelante o hacia arriba (px)
  // Katana hacia arriba (arriba + katana): lo que toca sale para arriba. lado: fracción del empuje de costado que conserva
  katanaArriba: { subida: 260, lado: 0.25 },
  radioParry360: 22             // Pergamino: el parry alcanza esto alrededor del centro del ninja (px)
};

// Índices estándar de botones de joystick (layout Xbox / "standard gamepad")
// Teclas de cada jugador, con los nombres de Phaser.Input.Keyboard.KeyCodes
export const TECLAS = {
  // up apunta hacia arriba (katana hacia arriba); el salto tiene tecla propia
  J1: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', salto: 'Z', ataque: 'X', especial: 'C' },
  J2: { up: 'W', down: 'S', left: 'A', right: 'D', salto: 'H', ataque: 'J', especial: 'K' }
};

export const PAD = { A: 0, B: 1, X: 2, Y: 3, L1: 4, R1: 5, SELECT: 8, START: 9, ARRIBA: 12, ABAJO: 13, IZQUIERDA: 14, DERECHA: 15 };

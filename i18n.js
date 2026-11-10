// i18n.js
// Los textos de este archivo son el respaldo local y la referencia en español. Las traducciones se piden a la API
// (Traducila) al arrancar: las claves de la API son las frases en español, con ' | ' en lugar de los saltos de línea.
import { TRADUCCIONES } from './config.js';
import { Guardado } from './sistemas/Guardado.js';

const textos = {
  es: {
    menu_1p: '1 JUGADOR',
    menu_2p: '2 JUGADORES',
    menu_opciones: 'OPCIONES',
    menu_como_jugar: 'CÓMO JUGAR',
    hud_puntos: 'PTS',
    hud_tiempo: 'TIEMPO',
    ganaste: '¡GANASTE!',
    perdiste: '¡PERDISTE!',
    reintentar: 'ENTER / A: REINTENTAR\nESC / B: MENÚ',
    volver: 'VOLVER',
    opcion_idioma: 'IDIOMA:',
    opcion_musica: 'MÚSICA',
    opcion_sonido: 'SONIDO',
    menu_creditos: 'CRÉDITOS',
    credito_diseno: 'DISEÑO',
    credito_programacion: 'PROGRAMACIÓN',
    credito_graficos: 'GRÁFICOS',
    credito_musica: 'MÚSICA Y SFX',
    jugador_corto: 'J',
    hotjoin_prompt: 'J2: MANTENÉ WASD/BOTÓN',
    hotjoin_joined: "¡JUGADOR 2 AL RESCATE!",

    nivel: 'NIVEL',
    completado: 'COMPLETADO',
    continuar: 'ENTER / A: CONTINUAR',
    objetivo_recoleccion: 'JUNTÁ 3 TALISMANES DE CADA FORMA',
    objetivo_caceria: '¡ELIMINÁ A TODOS LOS DEMONIOS!',
    ya: '¡YA!',
    diez_segundos: '¡10 SEGUNDOS!',
    sello_roto: '¡SELLO ROTO!',
    caceria: 'CACERÍA',
    quedan: 'QUEDAN',
    bono_tiempo: 'BONO TIEMPO',
    bono_jefe: 'BONO JEFE',
    combo: 'COMBO',
    monedas: 'MONEDAS',
    otra_vez: '¡OTRA VEZ!',
    fantasma: '¡EL FANTASMA!',
    fantasma_sub: 'TERMINÁ ANTES DE QUE TE TOQUE',
    fantasma_corto: '¡HUÍ!',
    vida_perdida: '-1 VIDA',
    vidas: 'VIDAS',
    eliminado: 'SIN VIDAS',
    total: 'TOTAL',
    record: 'RÉCORD',
    nuevo_record: '¡NUEVO RÉCORD!',
    escudo_usado: '¡ESCUDO!',
    sala_titulo: '¡ELEGÍ UN PERGAMINO!',
    sala_sub: 'TOCÁ UNO: ES TUYO PARA SIEMPRE',
    perg_rebotes: 'TUS PROYECTILES REBOTAN 1 VEZ MÁS',
    perg_dobleSalto: 'DOBLE SALTO',
    perg_dash: 'DASH',
    perg_caidaPesada: 'CAÍDA PESADA',
    perg_wallJump: 'SALTO DE PARED',
    perg_vidaExtra: '+1 VIDA',
    perg_masTiempo: '+1 SEGUNDO DE RELOJ',
    perg_shuriken: 'SHURIKEN',
    perg_bumeran: 'BUMERÁN',
    perg_bomba: 'BOMBA',
    perg_escudo: 'SOBREVIVÍS A UNA MUERTE',
    perg_furiaTemporal: 'LA FURIA DE LOS DEMONIOS SE PASA',
    perg_iman: 'IMÁN DE TALISMANES',
    perg_municionGratis: 'A VECES DISPARAR NO GASTA',
    perg_trampaPiedra: 'PISAR TRAMPAS LAS VUELVE PIEDRA',
    perg_bombaAlMorir: 'AL MORIR SUELTA UNA BOMBA',
    perg_saltoPisoton: 'SALTÁ JUSTO AL PISAR: SUBÍS MÁS',
    perg_parryRecarga: 'EL PARRY PUEDE DAR MUNICIÓN',
    perg_katanaLarga: 'KATANA: UN TILE MÁS DE ALCANCE',
    perg_katanaAlta: 'KATANA: UN TILE MÁS ALTA',
    perg_parry360: 'PARRY EN TODAS LAS DIRECCIONES',
    perg_rebotesEnemigos: 'PROYECTILES ENEMIGOS REBOTAN 1 VEZ MÁS',
    perg_menosTiempo: '-1 SEGUNDO DE RELOJ',
    perg_pisarEnfurece: 'PISAR DEMONIOS LOS ENFURECE',
    perg_contagio: 'LA FURIA SE CONTAGIA',
    perg_primerEnemigoEscudo: 'EL PRIMER DEMONIO TIENE ESCUDO',
    perg_fuegoAmigo: 'FUEGO AMIGO',
    perg_explotanAlMorir: 'LOS FURIOSOS SUELTAN UNA BOMBA AL MORIR',
    perg_ocultarNegativos: 'NEGATIVOS OCULTOS AL ELEGIR',
    perg_cadena: 'UNA CARTA ENCADENADA AL ELEGIR',
    perg_positivosIlegibles: 'POSITIVOS QUE SE BORRAN AL ELEGIR',
    perg_proyectilDejaBola: 'PROYECTILES ENEMIGOS DEJAN FUEGO',
    perg_trampasAlAzar: 'UN BLOQUE SE VUELVE TRAMPA',
    perg_llamaBola: 'LAS LLAMAS ESCUPEN FUEGO',
    perg_trampaSeExtiende: 'LAS TRAMPAS SE EXTIENDEN',
    perg_bolaExtra: 'MÁS BOLAS DE FUEGO',
    perg_fantasmaRapido: 'TU FANTASMA VA AL DOBLE',
    perg_monedasRojas: 'LAS MONEDAS SE PONEN ROJAS',
    perg_dobleSalto2: 'DOBLE SALTO NIVEL 2: PLATAFORMA FANTASMA',
    perg_dash2: 'DASH NIVEL 2: KATANAZO EN EL DASH',
    perg_caidaPesada2: 'CAÍDA PESADA NIVEL 2: BOLAS CELESTES',
    perg_wallJump2: 'SALTO DE PARED NIVEL 2: INTOCABLE',
    perg_boulder: 'BOULDER: SALTÁ JUSTO AL CAER DE ALTO Y RODÁS',
    perg_boulder2: 'BOULDER NIVEL 2: LOS ENEMIGOS SALEN DISPARADOS',
    perg_minas: 'A VECES CAE UNA MINA',
    perg_bombasEspeciales: 'A VECES CAE UNA BOMBA',
    ouch: '¡OUCH!',
    perdiste_talisman: '¡SE TE CAYÓ UN TALISMÁN!',
    perdiste_talismanes: '¡SE TE CAYERON LOS TALISMANES!',
    rescate_llave: '¡LLAVE! LLEVALA A LA JAULA',
    rescatado: 'RESCATADO',

    arma_shuriken: 'SHURIKEN',
    arma_bumeran: 'BUMERÁN',
    arma_bomba: 'BOMBAS',

    jefe_aparece: '¡JEFE!',
    jefe_ogro: 'OGRO EMBESTIDOR',
    jefe_oni: 'ONI DEL TRUENO',
    jefe_espectro: 'ESPECTRO DE FUEGO',
    jefe_rey: 'REY DEMONIO',

    pausa: 'PAUSA',
    continuar_juego: 'CONTINUAR',
    salir_menu: 'SALIR AL MENÚ',


    ayuda_navegacion: 'ESC: VOLVER',
    ayuda_objetivo_titulo: 'OBJETIVO',
    ayuda_objetivo:
      'JUNTÁ 3 TALISMANES DE CADA FORMA ANTES DE QUE SE ACABE EL TIEMPO. ARRIBA SE VAN ENCENDIENDO LOS QUE YA TENÉS.\n\n' +
      'LOS DEMONIOS SON INMUNES: SALTALES ENCIMA O DALES CON LA KATANA PARA ATURDIRLOS. SI TE TOCAN, SE TE CAEN TODOS LOS TALISMANES Y DESAPARECEN LAS MONEDAS.\n\n' +
      'LAS MONEDAS DAN PUNTOS, PERO VALEN MENOS CADA VEZ QUE REBOTAN.\n\n' +
      'SI EL RELOJ LLEGA A 0 APARECE EL FANTASMA: SI TE TOCA, PERDÉS UNA VIDA.',
    ayuda_caceria_titulo: 'CACERÍA',
    ayuda_caceria:
      'CON LOS 9 TALISMANES SE ROMPE EL SELLO: LOS DEMONIOS SE ENFURECEN, PERO AHORA SE PUEDEN ELIMINAR. CADA BAJA SUMA PUNTOS.\n\n' +
      'EN LA CACERÍA CADA GOLPE CUESTA UNA VIDA. CADA NINJA TIENE 3.\n\n' +
      'EL TIEMPO QUE SOBRA EN CADA FASE ES BONO. CADA 5 NIVELES HAY UN JEFE.\n\n' +
      'ENTRE NIVELES ELEGÍS UN PERGAMINO DE PACTO: UNA VENTAJA Y UNA DESVENTAJA PARA EL NIVEL SIGUIENTE.',
    ayuda_controles_titulo: 'CONTROLES',
    ayuda_controles:
      'J1: FLECHAS · Z SALTO · X KATANA · C ARMA\n' +
      'J2: WASD · H SALTO · J KATANA · K ARMA\n' +
      'JOYSTICK: A SALTO · X KATANA · Y ARMA · R1 DASH\n' +
      'ESC / START: PAUSA\n\n' +
      'SALTO ALTO: MANTENÉ. EN EL AIRE: DOBLE SALTO.\n' +
      'ARRIBA + KATANA: TAJO HACIA ARRIBA.\n' +
      'DOBLE TOQUE A UN COSTADO (TECLADO) O R1: DASH.\n' +
      'DOBLE TOQUE ABAJO EN EL AIRE: CAÍDA RÁPIDA.\n' +
      'ABAJO SOBRE UNA PASARELA: LA ATRAVESÁS.\n' +
      'EN EL AIRE CONTRA UNA PARED: TE AGARRÁS. CON SALTO, TREPÁS.\n' +
      'SALTO DE PARED (PERGAMINO): AL LLEGAR, AFUERA + SALTO.\n' +
      'SOBRE LA CABEZA DEL COMPAÑERO: ¡TRAMPOLÍN!\n' +
      'CAJAS DORADAS: SHURIKEN, BUMERÁN O BOMBAS.'
  },

  en: {
    menu_1p: '1 PLAYER',
    menu_2p: '2 PLAYERS',
    menu_opciones: 'SETTINGS',
    menu_como_jugar: 'HOW TO PLAY',
    hud_puntos: 'SCORE',
    hud_tiempo: 'TIME',
    ganaste: 'YOU WIN!',
    perdiste: 'GAME OVER',
    reintentar: 'ENTER / A: RETRY\nESC / B: MENU',
    volver: 'BACK',
    opcion_idioma: 'LANGUAGE:',
    opcion_musica: 'MUSIC',
    opcion_sonido: 'SFX',
    menu_creditos: 'CREDITS',
    credito_diseno: 'DESIGN',
    credito_programacion: 'PROGRAMMING',
    credito_graficos: 'GRAPHICS',
    credito_musica: 'MUSIC AND SFX',
    jugador_corto: 'P',
    hotjoin_prompt: 'P2: HOLD WASD/BUTTON',
    hotjoin_joined: "PLAYER 2 TO THE RESCUE!",

    nivel: 'LEVEL',
    completado: 'COMPLETE',
    continuar: 'ENTER / A: CONTINUE',
    objetivo_recoleccion: 'COLLECT 3 TALISMANS OF EACH SHAPE',
    objetivo_caceria: 'DEFEAT ALL THE DEMONS!',
    ya: 'GO!',
    diez_segundos: '10 SECONDS!',
    sello_roto: 'SEAL BROKEN!',
    caceria: 'HUNT',
    quedan: 'LEFT',
    bono_tiempo: 'TIME BONUS',
    bono_jefe: 'BOSS BONUS',
    combo: 'COMBO',
    monedas: 'COINS',
    otra_vez: 'TRY AGAIN!',
    fantasma: 'THE GHOST!',
    fantasma_sub: 'FINISH BEFORE IT TOUCHES YOU',
    fantasma_corto: 'RUN!',
    vida_perdida: '-1 LIFE',
    vidas: 'LIVES',
    eliminado: 'OUT OF LIVES',
    total: 'TOTAL',
    record: 'HIGH SCORE',
    nuevo_record: 'NEW HIGH SCORE!',
    escudo_usado: 'SHIELD!',
    sala_titulo: 'CHOOSE A SCROLL!',
    sala_sub: 'TOUCH ONE: IT IS YOURS FOREVER',
    perg_rebotes: 'YOUR PROJECTILES BOUNCE 1 MORE TIME',
    perg_dobleSalto: 'DOUBLE JUMP',
    perg_dash: 'DASH',
    perg_caidaPesada: 'HEAVY DROP',
    perg_wallJump: 'WALL JUMP',
    perg_vidaExtra: '+1 LIFE',
    perg_masTiempo: '+1 SECOND ON THE CLOCK',
    perg_shuriken: 'SHURIKEN',
    perg_bumeran: 'BOOMERANG',
    perg_bomba: 'BOMB',
    perg_escudo: 'SURVIVE ONE DEATH',
    perg_furiaTemporal: 'DEMON RAGE WEARS OFF',
    perg_iman: 'TALISMAN MAGNET',
    perg_municionGratis: 'SOMETIMES SHOTS ARE FREE',
    perg_trampaPiedra: 'STEPPING ON TRAPS TURNS THEM TO STONE',
    perg_bombaAlMorir: 'DROP A BOMB WHEN YOU DIE',
    perg_saltoPisoton: 'JUMP RIGHT ON A STOMP TO GO HIGHER',
    perg_parryRecarga: 'PARRY CAN GIVE AMMO',
    perg_katanaLarga: 'KATANA: ONE MORE TILE OF REACH',
    perg_katanaAlta: 'KATANA: ONE TILE TALLER',
    perg_parry360: 'PARRY IN EVERY DIRECTION',
    perg_rebotesEnemigos: 'ENEMY PROJECTILES BOUNCE 1 MORE TIME',
    perg_menosTiempo: '-1 SECOND ON THE CLOCK',
    perg_pisarEnfurece: 'STOMPING ENRAGES DEMONS',
    perg_contagio: 'RAGE IS CONTAGIOUS',
    perg_primerEnemigoEscudo: 'THE FIRST DEMON HAS A SHIELD',
    perg_fuegoAmigo: 'FRIENDLY FIRE',
    perg_explotanAlMorir: 'ENRAGED DEMONS DROP A BOMB WHEN THEY DIE',
    perg_ocultarNegativos: 'HIDDEN DOWNSIDES WHEN CHOOSING',
    perg_cadena: 'ONE CARD CHAINED WHEN CHOOSING',
    perg_positivosIlegibles: 'UPSIDES FADE WHEN CHOOSING',
    perg_proyectilDejaBola: 'ENEMY SHOTS LEAVE FIRE',
    perg_trampasAlAzar: 'A BLOCK TURNS INTO A TRAP',
    perg_llamaBola: 'FLAMES SPIT FIRE',
    perg_trampaSeExtiende: 'TRAPS SPREAD',
    perg_bolaExtra: 'MORE FIREBALLS',
    perg_fantasmaRapido: 'YOUR GHOST IS TWICE AS FAST',
    perg_monedasRojas: 'COINS TURN RED',
    perg_dobleSalto2: 'DOUBLE JUMP LEVEL 2: GHOST PLATFORM',
    perg_dash2: 'DASH LEVEL 2: SLASH WHILE DASHING',
    perg_caidaPesada2: 'HEAVY DROP LEVEL 2: BLUE FIREBALLS',
    perg_wallJump2: 'WALL JUMP LEVEL 2: UNTOUCHABLE',
    perg_boulder: 'BOULDER: JUMP RIGHT AS YOU LAND FROM HIGH TO ROLL',
    perg_boulder2: 'BOULDER LEVEL 2: ENEMIES GET LAUNCHED',
    perg_minas: 'SOMETIMES A MINE DROPS',
    perg_bombasEspeciales: 'SOMETIMES A BOMB DROPS',
    ouch: 'OUCH!',
    perdiste_talisman: 'YOU DROPPED A TALISMAN!',
    perdiste_talismanes: 'YOU DROPPED YOUR TALISMANS!',
    rescate_llave: 'KEY! TAKE IT TO THE CAGE',
    rescatado: 'RESCUED',

    arma_shuriken: 'SHURIKEN',
    arma_bumeran: 'BOOMERANG',
    arma_bomba: 'BOMBS',

    jefe_aparece: 'BOSS!',
    jefe_ogro: 'CHARGING OGRE',
    jefe_oni: 'THUNDER ONI',
    jefe_espectro: 'FIRE SPECTER',
    jefe_rey: 'DEMON KING',

    pausa: 'PAUSED',
    continuar_juego: 'CONTINUE',
    salir_menu: 'QUIT TO MENU',


    ayuda_navegacion: 'ESC: BACK',
    ayuda_objetivo_titulo: 'GOAL',
    ayuda_objetivo:
      'COLLECT 3 TALISMANS OF EACH SHAPE BEFORE TIME RUNS OUT. THE ICONS AT THE TOP LIGHT UP AS YOU GET THEM.\n\n' +
      'DEMONS ARE IMMUNE: STOMP THEM OR USE THE KATANA TO STUN THEM. IF THEY TOUCH YOU, YOU DROP ALL YOUR TALISMANS AND THE COINS DISAPPEAR.\n\n' +
      'COINS GIVE POINTS, BUT THEY ARE WORTH LESS EVERY TIME THEY BOUNCE.\n\n' +
      'IF THE CLOCK HITS 0 THE GHOST APPEARS: IF IT TOUCHES YOU, YOU LOSE A LIFE.',
    ayuda_caceria_titulo: 'THE HUNT',
    ayuda_caceria:
      'WITH ALL 9 TALISMANS THE SEAL BREAKS: DEMONS GET ANGRY, BUT NOW THEY CAN BE DEFEATED. EVERY KILL SCORES.\n\n' +
      'DURING THE HUNT EVERY HIT COSTS A LIFE. EACH NINJA HAS 3.\n\n' +
      'LEFTOVER TIME IN EACH PHASE IS A BONUS. THERE IS A BOSS EVERY 5 LEVELS.\n\n' +
      'BETWEEN LEVELS YOU PICK A PACT SCROLL: ONE ADVANTAGE AND ONE DRAWBACK FOR THE NEXT LEVEL.',
    ayuda_controles_titulo: 'CONTROLS',
    ayuda_controles:
      'P1: ARROWS · Z JUMP · X KATANA · C WEAPON\n' +
      'P2: WASD · H JUMP · J KATANA · K WEAPON\n' +
      'GAMEPAD: A JUMP · X KATANA · Y WEAPON · R1 DASH\n' +
      'ESC / START: PAUSE\n\n' +
      'HIGH JUMP: HOLD IT. IN THE AIR: DOUBLE JUMP.\n' +
      'UP + KATANA: UPWARD SLASH.\n' +
      'DOUBLE TAP SIDEWAYS (KEYBOARD) OR R1: DASH.\n' +
      'DOUBLE TAP DOWN IN THE AIR: FAST FALL.\n' +
      'DOWN ON A LEDGE: DROP THROUGH.\n' +
      'IN THE AIR AGAINST A WALL: GRAB IT. JUMP TO CLIMB.\n' +
      'WALL JUMP (SCROLL): AS YOU REACH IT, AWAY + JUMP.\n' +
      'LAND ON YOUR PARTNER\'S HEAD: TRAMPOLINE!\n' +
      'GOLDEN BOXES: SHURIKEN, BOOMERANG OR BOMBS.'
  }
};

let idiomaActual = 'es';
const IDIOMA_BASE = 'es'; // Las claves de la API ya están en español: no hay nada que pedir para este idioma
const remotas = {};       // { en: { 'frase en español': 'traducción' } }
const origenes = {};      // De dónde salió cada idioma: 'api', 'copia' (la última guardada) o 'local'

const aClaveRemota = (frase) => frase.replace(/\n/g, ' | ');
const desdeRemota = (texto) => texto.replace(/ \| /g, '\n');

async function pedirIdioma(idioma) {
  const { api, proyecto, espera } = TRADUCCIONES;
  const respuesta = await fetch(`${api}/api/translations/${proyecto}/${idioma}`, { signal: AbortSignal.timeout(espera) });
  const { data, error } = await respuesta.json();
  if (error || !data) throw new Error(error || 'respuesta vacía');
  return Object.fromEntries(data.words.filter(p => p.translate).map(p => [p.key.trim(), p.translate.trim()]));
}

// Se llama una vez, antes de crear el juego. Nunca falla: si no hay API, quedan la copia guardada o los textos locales.
export async function cargarTraducciones() {
  const idiomas = Object.keys(textos).filter(idioma => idioma !== IDIOMA_BASE);
  await Promise.all(idiomas.map(async (idioma) => {
    origenes[idioma] = 'local';
    if (!TRADUCCIONES.activa) return;
    const claveCopia = `traducciones.${TRADUCCIONES.proyecto}.${idioma}`;
    try {
      remotas[idioma] = await pedirIdioma(idioma);
      origenes[idioma] = 'api';
      Guardado.escribir(claveCopia, remotas[idioma]);
    } catch (e) {
      console.warn(`Sin traducciones de la API para "${idioma}":`, e.message);
      const copia = Guardado.leer(claveCopia, null);
      if (copia) {
        remotas[idioma] = copia;
        origenes[idioma] = 'copia';
      }
    }
  }));
}

// La fuente Press Start 2P no tiene mayúsculas acentuadas (dibuja "Ó" como "ó"), así que se muestran sin tilde.
const SIN_TILDE = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
const quitarTildes = (texto) => texto.replace(/[ÁÉÍÓÚ]/g, letra => SIN_TILDE[letra]);

export const i18n = {
  setIdioma: (nuevoIdioma) => {
    if (textos[nuevoIdioma]) idiomaActual = nuevoIdioma;
  },
  getIdioma: () => idiomaActual,
  alternarIdioma: () => {
    idiomaActual = idiomaActual === 'es' ? 'en' : 'es';
  },
  getOrigenes: () => ({ ...origenes }),
  // J1 en castellano, P1 en inglés (indice: 0 o 1)
  jugador: (indice) => `${i18n.t('jugador_corto')}${indice + 1}`,
  t: (clave) => {
    const frase = textos[IDIOMA_BASE][clave];
    const remota = frase && remotas[idiomaActual] && remotas[idiomaActual][aClaveRemota(frase)];
    return quitarTildes(remota ? desdeRemota(remota) : textos[idiomaActual][clave] || clave);
  }
};

// i18n.js
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
    hotjoin_prompt: 'J2: MANTENÉ WASD/BOTÓN',
    hotjoin_joined: "¡JUGADOR 2 AL RESCATE!",

    nivel: 'NIVEL',
    completado: 'COMPLETADO',
    continuar: 'ENTER / A: CONTINUAR',
    objetivo_recoleccion: 'JUNTÁ 3 TALISMANES DE CADA FORMA',
    objetivo_caceria: '¡ELIMINÁ A TODOS LOS DEMONIOS!',
    reintento: 'REINTENTO',
    ya: '¡YA!',
    diez_segundos: '¡10 SEGUNDOS!',
    sello_roto: '¡SELLO ROTO!',
    caceria: 'CACERÍA',
    quedan: 'QUEDAN',
    bono_tiempo: 'BONO TIEMPO',
    bono_jefe: 'BONO JEFE',
    caceria_incompleta: 'QUEDARON DEMONIOS: SIN BONO',
    fantasma: '¡EL FANTASMA!',
    fantasma_sub: 'TERMINÁ ANTES DE QUE TE TOQUE',
    fantasma_corto: '¡HUÍ!',
    vida_perdida: '-1 VIDA',
    vidas: 'VIDAS',
    total: 'TOTAL',
    record: 'RÉCORD',
    nuevo_record: '¡NUEVO RÉCORD!',
    ouch: '¡OUCH!',
    perdiste_talisman: '¡SE TE CAYÓ UN TALISMÁN!',
    perdiste_talismanes: '¡SE TE CAYERON LOS TALISMANES!',

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

    pacto_titulo: 'PERGAMINOS DE PACTO',
    pacto_proximo: 'PARA EL NIVEL',
    pacto_proximo_jefe: 'PARA LA PELEA CONTRA EL JEFE',
    pacto_aviso: 'APRETÁ PARA ELEGIR',
    pacto_aviso_coop: 'J1: ENTER/X  J2: J',
    pacto_sellado: '¡PACTO SELLADO!',
    pacto_velocidad: 'VELOCIDAD',
    pacto_velocidad_pro: '+30% VELOCIDAD',
    pacto_velocidad_contra: '-10 SEGUNDOS DE TIEMPO',
    pacto_fortuna: 'FORTUNA',
    pacto_fortuna_pro: 'PUNTOS X2',
    pacto_fortuna_contra: 'FUEGO ENEMIGO X2 MÁS RÁPIDO',
    pacto_filo: 'FILO VORAZ',
    pacto_filo_pro: 'MUNICIÓN INFINITA EN LA CACERÍA',
    pacto_filo_contra: 'DEMONIOS INMUNES AL ATURDIMIENTO',
    pacto_ligero: 'LIGEREZA',
    pacto_ligero_pro: '+25% ALTURA DE SALTO',
    pacto_ligero_contra: 'LOS GOLPES TE EMPUJAN MÁS',

    ayuda_navegacion: 'ESC: VOLVER',
    ayuda_objetivo_titulo: 'OBJETIVO',
    ayuda_objetivo:
      'JUNTÁ 3 TALISMANES DE CADA FORMA ANTES DE QUE SE ACABE EL TIEMPO. ARRIBA SE VAN ENCENDIENDO LOS QUE YA TENÉS.\n\n' +
      'LOS DEMONIOS SON INMUNES: SALTALES ENCIMA O DALES CON LA KATANA PARA ATURDIRLOS. SI TE TOCAN, SE TE CAE UN TALISMÁN.\n\n' +
      'LAS MONEDAS DAN PUNTOS, PERO VALEN MENOS CADA VEZ QUE REBOTAN.\n\n' +
      'SI EL RELOJ LLEGA A 0 APARECE EL FANTASMA: SI TE TOCA, PERDÉS UNA VIDA.',
    ayuda_caceria_titulo: 'CACERÍA',
    ayuda_caceria:
      'CON LOS 9 TALISMANES SE ROMPE EL SELLO: LOS DEMONIOS SE ENFURECEN, PERO AHORA SE PUEDEN ELIMINAR. CADA BAJA SUMA PUNTOS.\n\n' +
      'EN LA CACERÍA CADA GOLPE CUESTA UNA VIDA. EMPEZÁS CON 3.\n\n' +
      'EL TIEMPO QUE SOBRA EN CADA FASE ES BONO. CADA 5 NIVELES HAY UN JEFE.\n\n' +
      'ENTRE NIVELES ELEGÍS UN PERGAMINO DE PACTO: UNA VENTAJA Y UNA DESVENTAJA PARA EL NIVEL SIGUIENTE.',
    ayuda_controles_titulo: 'CONTROLES',
    ayuda_controles:
      'J1: FLECHAS · X KATANA · C ARMA\n' +
      'J2: WASD · J KATANA · K ARMA\n' +
      'JOYSTICK: A SALTO · X KATANA · Y ARMA · R1 DASH\n' +
      'ESC / START: PAUSA\n\n' +
      'SALTO ALTO: MANTENÉ. EN EL AIRE: DOBLE SALTO.\n' +
      'DOBLE TOQUE A UN COSTADO: DASH.\n' +
      'ABAJO EN EL AIRE: CAÍDA RÁPIDA.\n' +
      'ABAJO SOBRE UNA PASARELA: LA ATRAVESÁS.\n' +
      'SALTÁ CONTRA UNA PARED: REBOTÁS.\n' +
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
    hotjoin_prompt: 'P2: HOLD WASD/BUTTON',
    hotjoin_joined: "PLAYER 2 TO THE RESCUE!",

    nivel: 'LEVEL',
    completado: 'COMPLETE',
    continuar: 'ENTER / A: CONTINUE',
    objetivo_recoleccion: 'COLLECT 3 TALISMANS OF EACH SHAPE',
    objetivo_caceria: 'DEFEAT ALL THE DEMONS!',
    reintento: 'RETRY',
    ya: 'GO!',
    diez_segundos: '10 SECONDS!',
    sello_roto: 'SEAL BROKEN!',
    caceria: 'HUNT',
    quedan: 'LEFT',
    bono_tiempo: 'TIME BONUS',
    bono_jefe: 'BOSS BONUS',
    caceria_incompleta: 'DEMONS LEFT: NO BONUS',
    fantasma: 'THE GHOST!',
    fantasma_sub: 'FINISH BEFORE IT TOUCHES YOU',
    fantasma_corto: 'RUN!',
    vida_perdida: '-1 LIFE',
    vidas: 'LIVES',
    total: 'TOTAL',
    record: 'HIGH SCORE',
    nuevo_record: 'NEW HIGH SCORE!',
    ouch: 'OUCH!',
    perdiste_talisman: 'YOU DROPPED A TALISMAN!',
    perdiste_talismanes: 'YOU DROPPED YOUR TALISMANS!',

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

    pacto_titulo: 'PACT SCROLLS',
    pacto_proximo: 'FOR LEVEL',
    pacto_proximo_jefe: 'FOR THE BOSS FIGHT',
    pacto_aviso: 'PRESS TO CHOOSE',
    pacto_aviso_coop: 'P1: ENTER/X  P2: J',
    pacto_sellado: 'PACT SEALED!',
    pacto_velocidad: 'SPEED',
    pacto_velocidad_pro: '+30% SPEED',
    pacto_velocidad_contra: '-10 SECONDS OF TIME',
    pacto_fortuna: 'FORTUNE',
    pacto_fortuna_pro: 'POINTS X2',
    pacto_fortuna_contra: 'ENEMY FIRE X2 FASTER',
    pacto_filo: 'HUNGRY BLADE',
    pacto_filo_pro: 'INFINITE AMMO DURING THE HUNT',
    pacto_filo_contra: 'DEMONS IMMUNE TO STUN',
    pacto_ligero: 'LIGHTNESS',
    pacto_ligero_pro: '+25% JUMP HEIGHT',
    pacto_ligero_contra: 'HITS KNOCK YOU BACK MORE',

    ayuda_navegacion: 'ESC: BACK',
    ayuda_objetivo_titulo: 'GOAL',
    ayuda_objetivo:
      'COLLECT 3 TALISMANS OF EACH SHAPE BEFORE TIME RUNS OUT. THE ICONS AT THE TOP LIGHT UP AS YOU GET THEM.\n\n' +
      'DEMONS ARE IMMUNE: STOMP THEM OR USE THE KATANA TO STUN THEM. IF THEY TOUCH YOU, YOU DROP A TALISMAN.\n\n' +
      'COINS GIVE POINTS, BUT THEY ARE WORTH LESS EVERY TIME THEY BOUNCE.\n\n' +
      'IF THE CLOCK HITS 0 THE GHOST APPEARS: IF IT TOUCHES YOU, YOU LOSE A LIFE.',
    ayuda_caceria_titulo: 'THE HUNT',
    ayuda_caceria:
      'WITH ALL 9 TALISMANS THE SEAL BREAKS: DEMONS GET ANGRY, BUT NOW THEY CAN BE DEFEATED. EVERY KILL SCORES.\n\n' +
      'DURING THE HUNT EVERY HIT COSTS A LIFE. YOU START WITH 3.\n\n' +
      'LEFTOVER TIME IN EACH PHASE IS A BONUS. THERE IS A BOSS EVERY 5 LEVELS.\n\n' +
      'BETWEEN LEVELS YOU PICK A PACT SCROLL: ONE ADVANTAGE AND ONE DRAWBACK FOR THE NEXT LEVEL.',
    ayuda_controles_titulo: 'CONTROLS',
    ayuda_controles:
      'P1: ARROWS · X KATANA · C WEAPON\n' +
      'P2: WASD · J KATANA · K WEAPON\n' +
      'GAMEPAD: A JUMP · X KATANA · Y WEAPON · R1 DASH\n' +
      'ESC / START: PAUSE\n\n' +
      'HIGH JUMP: HOLD IT. IN THE AIR: DOUBLE JUMP.\n' +
      'DOUBLE TAP SIDEWAYS: DASH.\n' +
      'DOWN IN THE AIR: FAST FALL.\n' +
      'DOWN ON A LEDGE: DROP THROUGH.\n' +
      'JUMP AGAINST A WALL: WALL JUMP.\n' +
      'LAND ON YOUR PARTNER\'S HEAD: TRAMPOLINE!\n' +
      'GOLDEN BOXES: SHURIKEN, BOOMERANG OR BOMBS.'
  }
};

let idiomaActual = 'es';

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
  t: (clave) => {
    return quitarTildes(textos[idiomaActual][clave] || clave);
  }
};

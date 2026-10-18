// i18n.js
const textos = {
  es: {
    menu_1p: '1 JUGADOR',
    menu_2p: '2 JUGADORES',
    menu_opciones: 'OPCIONES',
    hud_puntos: 'PTS',
    hud_tiempo: 'TIEMPO',
    ganaste: '¡GANASTE!',
    perdiste: '¡PERDISTE!\n\nTIEMPO AGOTADO',
    reintentar: 'PRESIONA ESPACIO\nPARA REINTENTAR',
    volver: 'VOLVER',
    opcion_idioma: 'IDIOMA:',
    opcion_musica: 'MÚSICA',
    opcion_sonido: 'SONIDO',
    menu_creditos: 'CRÉDITOS',
    hotjoin_prompt: "J2 MANTEN PRESIONADO PARA UNIRTE",
    hotjoin_joined: "¡JUGADOR 2 AL RESCATE!" // o el texto que más te guste
  },
  
  en: {
    menu_1p: '1 PLAYER',
    menu_2p: '2 PLAYERS',
    menu_opciones: 'SETTINGS',
    hud_puntos: 'SCORE',
    hud_tiempo: 'TIME',
    ganaste: 'YOU WIN!',
    perdiste: 'YOU LOSE!\n\nTIME OUT',
    reintentar: 'PRESS SPACE\nTO RETRY',
    volver: 'BACK',
    opcion_idioma: 'LANGUAGE:',
    opcion_musica: 'MUSIC',
    opcion_sonido: 'SFX',
    menu_creditos: 'CREDITS',
    hotjoin_prompt: "P2 HOLD TO JOIN",
    hotjoin_joined: "PLAYER 2 TO THE RESCUE!" // o el texto que más te guste
  }
};

let idiomaActual = 'es';

export const i18n = {
  setIdioma: (nuevoIdioma) => {
    if (textos[nuevoIdioma]) idiomaActual = nuevoIdioma;
  },
  getIdioma: () => idiomaActual,
  alternarIdioma: () => {
    idiomaActual = idiomaActual === 'es' ? 'en' : 'es';
  },
  t: (clave) => {
    return textos[idiomaActual][clave] || clave;
  }
};
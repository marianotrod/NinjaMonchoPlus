// Gimnasio.js
// Modo para probar y calibrar (?debug&gimnasio): un mapa propio (public/niveles/gimnasio.json, o el que se elija con
// &mapa= o desde el menú), sin reloj ni fin de nivel. Con Tab (o Select en el joystick) se abre un menú que pausa el
// juego: spawnear enemigos y jefes, dar habilidades y armas, y cambiar los números de lo que hay en pantalla.
// Los números son los de config.js, Bestiario.js, Jefe.js y Armas.js: el default es el valor de hoy. Los cambios se
// guardan en el navegador y se descargan como ajustes_gimnasio.json, para pasarlos al código como nuevos defaults.
import { CONFIG, FISICA, LOGICA, MUNDO } from '../config.js';
import { pintarCelda } from '../mundo/CargadorNivel.js';
import { Bestiario } from '../datos/Bestiario.js';
import { EVENTOS } from '../datos/Eventos.js';
import { JEFES } from '../entidades/Jefe.js';
import { ARMAS, TIPOS_ARMA } from '../entidades/Armas.js';
import { HABILIDADES, nuevaPartida } from '../reglas/Partida.js';
import { MODS_GLOBAL_BASE, MODS_JUGADOR_BASE } from '../reglas/Pergaminos.js';
import { todosLosNiveles } from '../mundo/Niveles.js';
import { i18n } from '../i18n.js';

// De dónde sale cada número (para el archivo de ajustes)
const FUENTES = {
  FISICA: { objeto: FISICA, archivo: 'config.js' },
  CONFIG: { objeto: CONFIG, archivo: 'config.js' },
  MUNDO: { objeto: MUNDO, archivo: 'config.js' },
  ARMAS: { objeto: ARMAS, archivo: 'entidades/Armas.js' },
  Bestiario: { objeto: Bestiario, archivo: 'datos/Bestiario.js' },
  JEFES: { objeto: JEFES, archivo: 'entidades/Jefe.js' }
};
// Los valores de hoy, tomados antes de aplicar ningún ajuste
const DEFAULTS = Object.fromEntries(Object.entries(FUENTES).map(([raiz, { objeto }]) => [raiz, structuredClone(objeto)]));
const CLAVE_GUARDADO = 'ninja-gimnasio-ajustes';
const MAPA = 'gimnasio';
const VIDAS = 9;  // Se rellenan solas: en el gimnasio no se pierde

// Lo de Moncho que está en CONFIG y en MUNDO (el resto de CONFIG queda en "Otros")
const CONFIG_MONCHO = ['CAIDA_ALTA', 'BOULDER', 'PISAR_PROYECTIL', 'PARRY_DEVUELVE', 'PROB_PARRY_RECARGA', 'PROYECTILES_BUSCAN',
  'ESPERA_RESPAWN', 'INVUL_RESPAWN', 'INVUL_INICIO', 'PLATAFORMA_ANCHO', 'PLATAFORMA_DURACION', 'BOLA_CELESTE_DURACION',
  'RADIO_IMAN', 'FUERZA_IMAN'];
const CONFIG_ENEMIGOS = ['ENTRADA_ENEMIGO', 'DURACION_FURIA', 'ESPERA_BOMBA_FURIOSO'];
const CONFIG_JEFES = ['DAÑO_GOLPE', 'APARICION_JEFE'];
const MUNDO_FIJO = ['columnas', 'filas', 'columnasOcultas', 'filasOcultas', 'tile'];  // Forma del mapa: no se calibra
// Datos que no son números para calibrar (o que cambiarían qué es el enemigo)
const NO_CALIBRAR = new Set(['textura', 'icono', 'framesVuelo', 'cuadros', 'soloPruebas', 'vuela', 'patrones', 'necesitaStun']);

// ---------- Rutas: "FISICA.agarrePared.duracion", "Bestiario.esqueleto.rasgos.caminante.decision.0" ----------
const partes = (ruta) => ruta.split('.');
function leer(base, ruta) {
  return partes(ruta).reduce((o, p) => (o == null ? undefined : o[p]), base);
}
const valorActual = (ruta) => leer(Object.fromEntries(Object.entries(FUENTES).map(([k, f]) => [k, f.objeto])), ruta);
const valorDefault = (ruta) => leer(DEFAULTS, ruta);
function poner(ruta, valor) {
  const p = partes(ruta);
  const padre = leer(Object.fromEntries(Object.entries(FUENTES).map(([k, f]) => [k, f.objeto])), p.slice(0, -1).join('.'));
  if (padre == null || !(p[p.length - 1] in padre)) return false;
  padre[p[p.length - 1]] = valor;
  return true;
}
const calibrable = (v) => typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));

// Las hojas (números y sí/no) debajo de una ruta
function hojas(ruta, enRasgos = false) {
  const v = valorDefault(ruta);
  if (calibrable(v)) return [ruta];
  if (v == null || typeof v !== 'object') return [];
  return Object.keys(v).flatMap(k => {
    if (NO_CALIBRAR.has(k)) return [];
    if (enRasgos && k === 'activo') return [];  // Prender o apagar un rasgo cambia el enemigo, no se calibra
    if (enRasgos && v[k] && v[k].activo === false) return [];
    return hojas(`${ruta}.${k}`, enRasgos || k === 'rasgos');
  });
}

// ---------- Ajustes guardados ----------
let ajustes = {};
try { ajustes = JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || {}; } catch (e) { ajustes = {}; }
const guardar = () => { try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(ajustes)); } catch (e) {} };

// Al arrancar el gimnasio: los ajustes de la vez anterior
export function aplicarAjustesGuardados() {
  Object.entries(ajustes).forEach(([ruta, valor]) => {
    if (typeof valorDefault(ruta) === typeof valor) poner(ruta, valor); else delete ajustes[ruta];
  });
}
function cambiar(ruta, valor) {
  poner(ruta, valor);
  if (valor === valorDefault(ruta)) delete ajustes[ruta]; else ajustes[ruta] = valor;
  guardar();
}
function todoAlDefault() {
  Object.keys(ajustes).forEach(ruta => poner(ruta, valorDefault(ruta)));
  ajustes = {};
  guardar();
}

// ---------- Comentarios del código, para que cada número diga qué es ----------
let comentarios = null;
async function leerComentarios() {
  if (comentarios) return comentarios;
  comentarios = {};
  const archivos = [...new Set(Object.values(FUENTES).map(f => f.archivo))];
  await Promise.all(archivos.map(a => fetch(a).then(r => r.text()).then(t => anotar(t, comentarios)).catch(() => {})));
  return comentarios;
}
// Recorre el código llevando la pila de llaves: a cada clave le toca el comentario de su línea o el de las líneas de arriba
function anotar(texto, res) {
  const lineas = texto.split('\n');
  const comentarioDe = (n) => {
    const l = lineas[n];
    const i = l.indexOf('//');
    if (i >= 0 && l.slice(0, i).trim()) return l.slice(i + 2).trim();
    const arriba = [];
    for (let k = n - 1; k >= 0 && lineas[k].trim().startsWith('//'); k--) arriba.unshift(lineas[k].trim().slice(2).trim());
    return arriba.join(' ');
  };
  const pila = [];
  let clave = null, linea = 0, i = 0;
  const id = /[\p{L}_$][\p{L}\p{N}_$]*/uy;
  const anotarClave = (nombre) => {
    let j = i; while (texto[j] === ' ' || texto[j] === '\t') j++;
    if (texto[j] === ':' && pila.length) {
      clave = nombre;
      const ruta = [...pila, nombre].filter(p => p !== null).join('.');
      if (!(ruta in res)) { const c = comentarioDe(linea); if (c) res[ruta] = c; }
    } else if (texto[j] === '=') clave = nombre;
  };
  while (i < texto.length) {
    const c = texto[i];
    if (c === '\n') { linea++; i++; continue; }
    if (c === '/' && texto[i + 1] === '/') { while (i < texto.length && texto[i] !== '\n') i++; continue; }
    if (c === '/' && texto[i + 1] === '*') { const f = texto.indexOf('*/', i + 2); linea += (texto.slice(i, f).match(/\n/g) || []).length; i = f < 0 ? texto.length : f + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1; while (j < texto.length && texto[j] !== c) { if (texto[j] === '\\') j++; if (texto[j] === '\n') linea++; j++; }
      const contenido = texto.slice(i + 1, j); i = j + 1; anotarClave(contenido); continue;
    }
    if (c === '{' || c === '[') { pila.push(c === '{' ? clave : null); clave = null; i++; continue; }
    if (c === '}' || c === ']') { pila.pop(); clave = null; i++; continue; }
    id.lastIndex = i;
    const m = id.exec(texto);
    if (m) { i += m[0].length; anotarClave(m[0]); continue; }
    i++;
  }
}
function comentario(ruta) {
  if (!comentarios) return '';
  const p = partes(ruta);
  for (let n = p.length; n > 1; n--) { const c = comentarios[p.slice(0, n).join('.')]; if (c) return c; }
  return '';
}

// ---------- La partida del gimnasio ----------
// Conserva lo que se le dio a cada jugador (habilidades y armas) al reiniciar o cambiar de mapa
export function partidaDeGimnasio(jugadores = 1, mapa = null, anterior = null) {
  const partida = nuevaPartida(jugadores === 2 ? 2 : 1, 1);
  partida.mapaForzado = mapa || MAPA;
  partida.vidas = [VIDAS, VIDAS];
  partida.gimnasio = true;
  if (anterior) {
    partida.habilidades = anterior.habilidades;
    partida.armas = anterior.armas;
    partida.mods = anterior.mods;  // Los pergaminos activos
  }
  return partida;
}

// Lo que dura toda la sesión (sobrevive a los reinicios de la escena)
const sesion = {
  vistos: new Set(),       // Enemigos y jefes que se spawnearon: sus números aparecen en el menú
  congelados: false,
  municionInfinita: true,
  golpesQuitanVida: false,
  abiertas: new Set(['Moncho', 'Pergaminos']),  // Secciones desplegadas
  filtro: '',
  pincel: null             // Tipo de tile que pone el clic sobre el mapa (null: el clic no hace nada)
};
let escenaActual = null;
let panel = null;
let instalado = false;

export function iniciarGimnasio(escena) {
  escenaActual = escena;
  escena.esGimnasio = true;
  escena.fase = sesion.golpesQuitanVida ? 'gimnasioVida' : 'gimnasio';
  escena.events.emit(EVENTOS.FASE, 'gimnasio');
  escena.physics.world.gravity.y = FISICA.gravedadMundo;
  escena.enemigosCongelados = sesion.congelados;
  escena.municionInfinitaGimnasio = sesion.municionInfinita;
  escena.partida.vidas.fill(VIDAS);
  escena.events.emit(EVENTOS.VIDAS, escena.partida.vidas);
  // Al perder una vida, vuelve a tener todas (en el mismo arreglo, que la escena sigue usando)
  escena.events.on(EVENTOS.VIDAS, (vidas) => {
    if (vidas.every(v => v >= VIDAS)) return;
    vidas.fill(VIDAS);
    escena.time.delayedCall(0, () => escena.events.emit(EVENTOS.VIDAS, vidas));
  });
  escena.events.emit(EVENTOS.BANNER, { titulo: i18n.t('gimnasio_titulo'), subtitulo: i18n.t('gimnasio_sub'), color: '#4ADE80', duracion: 1800 });
  if (!instalado) instalar(escena.game);
  leerComentarios();
}

function instalar(game) {
  instalado = true;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !escenaActual || !escenaActual.esGimnasio) return;
    e.preventDefault();
    alternar();
  }, true);
  // Select del joystick (se mira acá porque con el juego en pausa la escena no se actualiza)
  let antes = false;
  const mirarPads = () => {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const ahora = pads.some(p => p.buttons[8] && p.buttons[8].pressed);
    if (ahora && !antes && escenaActual && escenaActual.esGimnasio) alternar();
    antes = ahora;
    requestAnimationFrame(mirarPads);
  };
  requestAnimationFrame(mirarPads);
  // Pincel: clic (o arrastrar) sobre el mapa pone el tile elegido, con el menú abierto o jugando
  const pintarEn = (e) => {
    if (sesion.pincel === null || !escenaActual || !escenaActual.esGimnasio) return;
    const r = game.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (game.scale.width / r.width);
    const y = (e.clientY - r.top) * (game.scale.height / r.height);
    if (x < 0 || y < 0 || x >= game.scale.width || y >= game.scale.height) return;
    pintar_(Math.floor(x / MUNDO.tile) + MUNDO.columnasOcultas, Math.floor(y / MUNDO.tile) + MUNDO.filasOcultas);
  };
  game.canvas.addEventListener('pointerdown', pintarEn);
  game.canvas.addEventListener('pointermove', (e) => { if (e.buttons & 1) pintarEn(e); });
  game.events.once('destroy', () => { instalado = false; });
}

const estaAbierto = () => !!panel && panel.style.display !== 'none';
function alternar() { if (estaAbierto()) cerrar(); else abrir(); }

export function abrir() {
  const escena = escenaActual;
  if (!escena || !escena.esGimnasio || !escena.reglas.jugable || estaAbierto()) return;
  escena.scene.pause();
  escena.input.keyboard.disableGlobalCapture();  // Que las flechas, Z, X... se puedan escribir en el menú
  if (!panel) crearPanel();
  panel.style.display = 'block';
  pintar();
}

export function cerrar() {
  if (!estaAbierto()) return;
  panel.style.display = 'none';
  const escena = escenaActual;
  if (document.activeElement && panel.contains(document.activeElement)) document.activeElement.blur();
  aplicarEnVivo(escena);
  escena.input.keyboard.enableGlobalCapture();
  escena.scene.resume();
}

// Lo que no se lee a cada cuadro se acomoda acá
function aplicarEnVivo(escena) {
  escena.physics.world.gravity.y = FISICA.gravedadMundo;
  escena.enemigosCongelados = sesion.congelados;
  escena.municionInfinitaGimnasio = sesion.municionInfinita;
  escena.fase = sesion.golpesQuitanVida ? 'gimnasioVida' : 'gimnasio';
  congelar(escena, sesion.congelados);
}

function congelar(escena, si) {
  escena.enemigos.getChildren().forEach(e => { if (e.body) e.body.moves = !si; if (si) e.setVelocity(0, 0); });
  if (escena.jefe && escena.jefe.active && escena.jefe.body) escena.jefe.body.moves = !si;
}

function reiniciar({ jugadores, mapa } = {}) {
  const escena = escenaActual;
  const p = escena.partida;
  escena.registry.set('partida', partidaDeGimnasio(jugadores ?? p.jugadores, mapa ?? p.mapaForzado, p));
  panel.style.display = 'none';
  escena.input.keyboard.enableGlobalCapture();
  escena.scene.resume();
  escena.scene.stop('UIScene');
  escena.scene.restart();
}

// ---------- Pincel de tiles ----------
const PINCELES = [['trampa', LOGICA.TRAMPA], ['fuego', LOGICA.FUEGO], ['sólido', LOGICA.SOLIDO], ['pasarela', LOGICA.PASARELA], ['borrar', LOGICA.VACIO]];
function pintar_(col, fila) {
  return pintarCelda(escenaActual, col, fila, sesion.pincel);
}

// ---------- Spawns, habilidades y armas ----------
const enemigosDelBestiario = () => Object.keys(Bestiario).filter(k => !Bestiario[k].soloPruebas);

export function spawnearEnemigo(clave) {
  const escena = escenaActual;
  const habilitados = escena.enemigosHabilitados;
  escena.enemigosHabilitados = true;
  const e = escena.crearEnemigo(clave);
  escena.enemigosHabilitados = habilitados;
  sesion.vistos.add(`enemigo:${clave}`);
  if (sesion.congelados && e && e.body) e.body.moves = false;
  return e;
}

export function spawnearJefe(tipo) {
  const escena = escenaActual;
  if (escena.jefe) {
    escena.collidersJefe.forEach(c => c.destroy());
    escena.collidersJefe = [];
    if (escena.jefe.active) escena.jefe.destroy();
    escena.jefe = null;
  }
  escena.partida.jefe = tipo;
  escena.spawnearJefe();
  sesion.vistos.add(`jefe:${tipo}`);
  if (sesion.congelados && escena.jefe.body) escena.jefe.body.moves = false;
  return escena.jefe;
}

function borrarEnemigos() {
  const escena = escenaActual;
  escena.enemigos.getChildren().slice().forEach(e => { if (e.textoDebug) e.textoDebug.destroy(); e.destroy(); });
  if (escena.jefe) {
    escena.collidersJefe.forEach(c => c.destroy());
    escena.collidersJefe = [];
    if (escena.jefe.active) escena.jefe.destroy();
    escena.jefe = null;
  }
  escena.proyectilesDe && escena.proyectilesDe('demonios').forEach(p => p.destroy());
}

function ponerHabilidad(nombre, nivel) {
  escenaActual.partida.habilidades.forEach(h => { h[nombre] = nivel; });
}

function equipar(tipo) {
  const escena = escenaActual;
  escena.jugadores.forEach(j => {
    if (tipo) j.equiparArma(tipo);
    else { j.arma = null; j.municion = 0; escena.partida.armas[j.indice] = null; escena.events.emit(EVENTOS.ARMA, j.indice, null, 0); }
  });
}

// ---------- El archivo de ajustes ----------
function archivoDeAjustes() {
  const lista = Object.entries(ajustes).map(([ruta, valor]) => {
    const [raiz, ...resto] = partes(ruta);
    return { archivo: FUENTES[raiz].archivo, objeto: raiz, ruta: resto.join('.'), default: valorDefault(ruta), valor, nota: comentario(ruta) || undefined };
  });
  return JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), ajustes: lista }, null, 2);
}
function cargarArchivo(texto) {
  const json = JSON.parse(texto);
  todoAlDefault();
  let ignorados = 0;
  (json.ajustes || []).forEach(a => {
    const ruta = `${a.objeto}.${a.ruta}`;
    if (typeof valorDefault(ruta) === typeof a.valor) cambiar(ruta, a.valor); else ignorados++;
  });
  return ignorados;
}

// ---------- El panel ----------
const ESTILO = `
#gimnasio { position: fixed; top: 0; right: 0; width: min(460px, 100vw); height: 100vh; overflow: auto; z-index: 1000;
  background: rgba(17,19,24,0.97); color: #e5e7eb; font: 13px/1.35 system-ui, sans-serif; border-left: 1px solid #333845;
  box-sizing: border-box; padding: 10px 12px 40px; }
#gimnasio h2 { font-size: 15px; margin: 0 0 6px; color: #4ade80; }
#gimnasio h3 { font-size: 12px; margin: 10px 0 4px; color: #fbbf24; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
#gimnasio .fila { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px; }
#gimnasio button { background: #2b303b; color: #e5e7eb; border: 1px solid #3d4350; border-radius: 4px; padding: 3px 8px; cursor: pointer; font: inherit; }
#gimnasio button:hover { border-color: #fbbf24; }
#gimnasio button.activo { border-color: #4ade80; color: #4ade80; }
#gimnasio select, #gimnasio input[type=text], #gimnasio input[type=number] { background: #0b0d11; color: #e5e7eb; border: 1px solid #3d4350; border-radius: 4px; padding: 2px 4px; font: inherit; }
#gimnasio input[type=number] { width: 78px; }
#gimnasio .ayuda { color: #9ca3af; font-size: 12px; }
#gimnasio details { border-top: 1px solid #2b303b; padding: 4px 0; }
#gimnasio summary { cursor: pointer; font-weight: 600; color: #fbbf24; padding: 2px 0; }
#gimnasio summary .cuenta { color: #4ade80; font-weight: normal; font-size: 12px; }
#gimnasio .campo { display: grid; grid-template-columns: 1fr auto auto 22px; gap: 2px 6px; align-items: center; padding: 2px 0 2px 4px; }
#gimnasio .campo.cambiado { background: #1f2a1f; }
#gimnasio .campo .nombre { overflow-wrap: anywhere; }
#gimnasio .campo .def { color: #6b7280; font-size: 11px; white-space: nowrap; }
#gimnasio .campo .nota { grid-column: 1 / -1; color: #7c8494; font-size: 11px; margin-top: -1px; }
#gimnasio .campo button.reset { padding: 0 4px; visibility: hidden; }
#gimnasio .ayuda-mod { display: inline-block; width: 15px; height: 15px; line-height: 15px; text-align: center; border-radius: 50%;
  background: #374151; color: #fbbf24; font-size: 11px; font-weight: 700; cursor: help; }
#gimnasio .campo.cambiado button.reset { visibility: visible; }
`;

function crearPanel() {
  const estilo = document.createElement('style');
  estilo.textContent = ESTILO;
  document.head.appendChild(estilo);
  panel = document.createElement('div');
  panel.id = 'gimnasio';
  panel.style.display = 'none';
  // Las teclas que se escriben en el menú no llegan al juego
  panel.addEventListener('keydown', (e) => { if (e.key !== 'Tab') e.stopPropagation(); });
  document.body.appendChild(panel);
}

const boton = (texto, alClic, clase = '') => {
  const b = document.createElement('button');
  b.textContent = texto;
  if (clase) b.className = clase;
  b.onclick = alClic;
  return b;
};
const fila = (...hijos) => { const d = document.createElement('div'); d.className = 'fila'; hijos.forEach(h => d.append(h)); return d; };
const titulo = (t) => { const h = document.createElement('h3'); h.textContent = t; return h; };
const texto = (t, clase = 'ayuda') => { const s = document.createElement('span'); s.className = clase; s.textContent = t; return s; };
const nombreEnemigo = (clave) => clave.replace(/_/g, ' ');

function pintar() {
  const escena = escenaActual;
  const scroll = panel.scrollTop;
  panel.innerHTML = '';
  const h = document.createElement('h2');
  h.textContent = 'Gimnasio · juego en pausa (Tab para volver)';
  panel.append(h);

  // Partida
  panel.append(titulo('Partida'));
  const mapas = document.createElement('select');
  todosLosNiveles().map(([id]) => id).sort((a, b) => (a === MAPA ? -1 : b === MAPA ? 1 : a.localeCompare(b))).forEach(id => {
    const o = document.createElement('option'); o.value = id; o.textContent = id; if (id === escena.partida.mapaForzado) o.selected = true; mapas.append(o);
  });
  panel.append(fila(
    texto('Jugadores'),
    boton('1', () => reiniciar({ jugadores: 1 }), escena.partida.jugadores === 1 ? 'activo' : ''),
    boton('2', () => reiniciar({ jugadores: 2 }), escena.partida.jugadores === 2 ? 'activo' : ''),
    texto('  Mapa'), mapas, boton('Cargar', () => reiniciar({ mapa: mapas.value })),
    boton('Reiniciar', () => reiniciar())
  ));
  const vida = document.createElement('label');
  vida.innerHTML = `<input type="checkbox" ${sesion.golpesQuitanVida ? 'checked' : ''}> los golpes quitan vida (si no, solo aturden)`;
  vida.querySelector('input').onchange = (e) => { sesion.golpesQuitanVida = e.target.checked; };
  panel.append(fila(vida));

  // Enemigos
  panel.append(titulo('Enemigos'));
  panel.append(fila(...enemigosDelBestiario().map(k => boton(`+ ${nombreEnemigo(k)}`, () => { spawnearEnemigo(k); pintar(); }))));
  panel.append(fila(...Object.keys(JEFES).map(t => boton(`+ jefe ${t}`, () => { spawnearJefe(t); pintar(); }))));
  const cong = document.createElement('label');
  cong.innerHTML = `<input type="checkbox" ${sesion.congelados ? 'checked' : ''}> congelados (no se mueven ni atacan)`;
  cong.querySelector('input').onchange = (e) => { sesion.congelados = e.target.checked; };
  const vivos = escena.enemigos.countActive(true) + (escena.jefe && escena.jefe.active ? 1 : 0);
  panel.append(fila(boton('Borrar todos', () => { borrarEnemigos(); pintar(); }), cong, texto(`en pantalla: ${vivos}`)));

  // Pincel de tiles
  panel.append(titulo('Tiles'));
  panel.append(fila(
    boton('ninguno', () => { sesion.pincel = null; pintar(); }, sesion.pincel === null ? 'activo' : ''),
    ...PINCELES.map(([nombre, tipo]) => boton(nombre, () => { sesion.pincel = tipo; pintar(); }, sesion.pincel === tipo ? 'activo' : ''))
  ));
  panel.append(texto('Con un tipo elegido, clic o arrastrar sobre el mapa lo pone (también jugando). Reiniciar vuelve al mapa original.'));

  // Habilidades y armas (para los dos jugadores)
  panel.append(titulo('Habilidades y armas'));
  const hab = escena.partida.habilidades[0];
  panel.append(fila(...HABILIDADES.map(nombre => {
    const s = document.createElement('select');
    ['no', 'nivel 1', 'nivel 2'].forEach((t, n) => { const o = document.createElement('option'); o.value = n; o.textContent = `${nombre}: ${t}`; if ((hab[nombre] || 0) === n) o.selected = true; s.append(o); });
    s.onchange = () => ponerHabilidad(nombre, Number(s.value));
    return s;
  })));
  const armaActual = escena.jugador && escena.jugador.arma;
  const inf = document.createElement('label');
  inf.innerHTML = `<input type="checkbox" ${sesion.municionInfinita ? 'checked' : ''}> munición infinita`;
  inf.querySelector('input').onchange = (e) => { sesion.municionInfinita = e.target.checked; };
  panel.append(fila(
    ...TIPOS_ARMA.map(t => boton(t, () => { equipar(t); pintar(); }, armaActual === t ? 'activo' : '')),
    boton('sin arma', () => { equipar(null); pintar(); }, !armaActual ? 'activo' : ''), inf
  ));

  // Pergaminos: los modificadores que dejan, editables (no van al archivo de ajustes: son de la partida)
  panel.append(titulo('Pergaminos'));
  panel.append(texto('Lo que dejan los pergaminos, para los dos o para cada jugador. Las trampas al azar se ven al Reiniciar.'));
  const perg = document.createElement('details');
  perg.open = sesion.abiertas.has('Pergaminos');
  perg.ontoggle = () => { if (perg.open) sesion.abiertas.add('Pergaminos'); else sesion.abiertas.delete('Pergaminos'); };
  const mods = escena.partida.mods;
  const activos = [mods.global, ...mods.jugadores.slice(0, escena.partida.jugadores)]
    .reduce((n, m, i) => n + Object.keys(m).filter(k => m[k] !== (i ? MODS_JUGADOR_BASE : MODS_GLOBAL_BASE)[k]).length, 0);
  perg.innerHTML = `<summary>Modificadores <span class="cuenta">${activos ? `${activos} activos` : 'ninguno activo'}</span></summary>`;
  perg.append(boton('Sacar todos', () => {
    Object.assign(mods.global, MODS_GLOBAL_BASE);
    mods.jugadores.forEach(m => Object.assign(m, MODS_JUGADOR_BASE));
    pintar();
  }));
  perg.append(titulo('Para todos'));
  modsDelGimnasio(MODS_GLOBAL_BASE).forEach(k => perg.append(campoMod(mods.global, k, MODS_GLOBAL_BASE[k])));
  mods.jugadores.slice(0, escena.partida.jugadores).forEach((m, j) => {
    perg.append(titulo(`Jugador ${j + 1}`));
    modsDelGimnasio(MODS_JUGADOR_BASE).forEach(k => perg.append(campoMod(m, k, MODS_JUGADOR_BASE[k])));
  });
  panel.append(perg);

  // Números
  panel.append(titulo(`Números · ${Object.keys(ajustes).length} cambiados`));
  const buscar = document.createElement('input');
  buscar.type = 'text'; buscar.placeholder = 'buscar (salto, gravedad, dash...)'; buscar.value = sesion.filtro;
  buscar.style.width = '100%'; buscar.style.boxSizing = 'border-box';
  buscar.oninput = () => { sesion.filtro = buscar.value; pintarSecciones(contenedor); };
  const archivo = document.createElement('input');
  archivo.type = 'file'; archivo.accept = '.json'; archivo.hidden = true;
  archivo.onchange = async () => {
    const f = archivo.files[0]; if (!f) return;
    try { const ign = cargarArchivo(await f.text()); pintar(); if (ign) alert(`${ign} ajustes no se pudieron cargar (ya no existen)`); }
    catch (e) { alert('No se pudo leer el archivo: ' + e.message); }
  };
  panel.append(fila(
    boton('Descargar ajustes', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([archivoDeAjustes()], { type: 'application/json' }));
      a.download = 'ajustes_gimnasio.json'; a.click();
    }),
    boton('Copiar', () => navigator.clipboard.writeText(archivoDeAjustes())),
    boton('Cargar', () => archivo.click()), archivo,
    boton('Todo al default', () => { if (confirm('¿Volver todos los números al default?')) { todoAlDefault(); pintar(); } })
  ));
  panel.append(fila(buscar));
  panel.append(texto('Algunos números (vida, tamaños, lo que se decide al aparecer) se ven en el próximo que spawnees o al Reiniciar.'));
  const contenedor = document.createElement('div');
  panel.append(contenedor);
  pintarSecciones(contenedor);
  panel.scrollTop = scroll;
}

// Moncho y sus armas siempre; cada enemigo y jefe, cuando se spawneó; el resto de config.js, en "Otros"
function secciones() {
  const lista = [
    ['Moncho', [...hojas('FISICA'), ...CONFIG_MONCHO.flatMap(k => hojas(`CONFIG.${k}`)), ...hojas('MUNDO.caidaMaxima')]],
    ['Armas', hojas('ARMAS')]
  ];
  const vistos = [...sesion.vistos];
  vistos.filter(v => v.startsWith('enemigo:')).forEach(v => { const k = v.slice(8); lista.push([`Enemigo: ${nombreEnemigo(k)}`, hojas(`Bestiario.${k}`)]); });
  if (vistos.some(v => v.startsWith('enemigo:'))) lista.push(['Enemigos (todos)', CONFIG_ENEMIGOS.flatMap(k => hojas(`CONFIG.${k}`))]);
  vistos.filter(v => v.startsWith('jefe:')).forEach(v => { const t = v.slice(5); lista.push([`Jefe: ${t}`, hojas(`JEFES.${t}`)]); });
  if (vistos.some(v => v.startsWith('jefe:'))) lista.push(['Jefes (todos)', CONFIG_JEFES.flatMap(k => hojas(`CONFIG.${k}`))]);
  const usados = new Set([...CONFIG_MONCHO, ...CONFIG_ENEMIGOS, ...CONFIG_JEFES]);
  lista.push(['Otros (el resto de config.js)', [
    ...Object.keys(DEFAULTS.CONFIG).filter(k => !usados.has(k)).flatMap(k => hojas(`CONFIG.${k}`)),
    ...Object.keys(DEFAULTS.MUNDO).filter(k => !MUNDO_FIJO.includes(k) && k !== 'caidaMaxima').flatMap(k => hojas(`MUNDO.${k}`))
  ]]);
  return lista;
}

function pintarSecciones(contenedor) {
  contenedor.innerHTML = '';
  const filtro = sesion.filtro.trim().toLowerCase();
  secciones().forEach(([nombre, rutas]) => {
    const visibles = filtro ? rutas.filter(r => r.toLowerCase().includes(filtro) || comentario(r).toLowerCase().includes(filtro)) : rutas;
    if (!visibles.length) return;
    const d = document.createElement('details');
    d.open = !!filtro || sesion.abiertas.has(nombre);
    d.ontoggle = () => { if (d.open) sesion.abiertas.add(nombre); else sesion.abiertas.delete(nombre); };
    const cambiados = visibles.filter(r => r in ajustes).length;
    d.innerHTML = `<summary>${nombre} <span class="cuenta">${visibles.length} números${cambiados ? ` · ${cambiados} cambiados` : ''}</span></summary>`;
    visibles.forEach(r => d.append(campo(r)));
    contenedor.append(d);
  });
}

// Una fila por número: el nombre, el valor, el default y ↺ para volver a él
function campo(ruta) {
  const def = valorDefault(ruta);
  const div = document.createElement('div');
  div.className = 'campo';
  const [raiz, ...resto] = partes(ruta);
  // El nombre corto: sin la raíz ni el enemigo/jefe (eso ya lo dice la sección)
  const corto = (raiz === 'Bestiario' || raiz === 'JEFES' || raiz === 'ARMAS') ? resto.slice(raiz === 'ARMAS' ? 0 : 1).join('.').replace(/^rasgos\./, '') : resto.join('.');
  const nombre = texto(corto, 'nombre');
  nombre.title = `${FUENTES[raiz].archivo} → ${ruta}`;
  let entrada;
  const marcar = () => div.classList.toggle('cambiado', ruta in ajustes);
  if (typeof def === 'boolean') {
    entrada = document.createElement('input');
    entrada.type = 'checkbox';
    entrada.checked = valorActual(ruta);
    entrada.onchange = () => { cambiar(ruta, entrada.checked); marcar(); };
  } else {
    entrada = document.createElement('input');
    entrada.type = 'number';
    entrada.step = Number.isInteger(def) ? (Math.abs(def) >= 50 ? 10 : 1) : (Math.abs(def) < 0.1 ? 0.005 : 0.05);
    entrada.value = valorActual(ruta);
    entrada.onchange = () => {
      const v = Number(String(entrada.value).replace(',', '.'));
      if (!Number.isFinite(v)) { entrada.value = valorActual(ruta); return; }
      cambiar(ruta, v); marcar();
    };
  }
  const reset = boton('↺', () => { cambiar(ruta, def); if (entrada.type === 'checkbox') entrada.checked = def; else entrada.value = def; marcar(); }, 'reset');
  reset.title = 'Volver al default';
  div.append(nombre, entrada, texto(`def ${def}`, 'def'), reset);
  const nota = comentario(ruta);
  if (nota) div.append(texto(nota, 'nota'));
  marcar();
  return div;
}

// Un modificador de pergamino: el nombre del pergamino que lo deja (si hay uno) y su valor sin pergaminos
const PERGAMINO_DE = { rebotesExtra: 'rebotes', escudos: 'escudo' };
// Los que en el gimnasio no hacen nada: son de la sala, del reloj, del fantasma, de las monedas o del puntaje
const MODS_FUERA = new Set(['tiempoExtra', 'multPuntos', 'ocultarNegativos', 'cadena', 'positivosIlegibles', 'monedasRojas',
  'fantasmaRapido', 'municionInfinitaCaceria']);
// Qué hace cada modificador (el ? de cada fila)
const AYUDA_MODS = {
  velProyectiles: 'Multiplica la velocidad de los tiros de los enemigos y del jefe (1 = normal).',
  enemigosInmunesStun: 'Los enemigos no se aturden: los golpes que los aturdirían no les hacen nada.',
  fuegoAmigo: 'Los tiros de los jugadores se ponen negros y golpean a todos, también a quien los tiró y al compañero.',
  dañoPropio: 'Los tiros de un jugador lo pueden golpear a él mismo.',
  rebotesEnemigos: 'Cuántas veces rebotan contra el escenario los tiros de los enemigos antes de romperse.',
  trampasAlAzar: 'Cuántos bloques del mapa se vuelven trampa al empezar el nivel (se ve al Reiniciar).',
  furiaTemporal: 'La furia de los demonios se pasa sola después de un rato (CONFIG.DURACION_FURIA).',
  contagio: 'Un demonio furioso contagia la furia a los que toca.',
  primerEnemigoEscudo: 'El primer enemigo que aparece trae escudo (hay que romperlo antes de dañarlo).',
  explotanAlMorir: 'Un demonio furioso suelta una bomba al morir (CONFIG.ESPERA_BOMBA_FURIOSO).',
  minas: 'A veces, en vez de una moneda, cae una mina (CONFIG.PROB_MINA).',
  bombasEspeciales: 'A veces, en vez de una moneda, cae una bomba que explota sola (CONFIG.PROB_BOMBA_ESPECIAL).',
  proyectilDejaBola: 'Los tiros enemigos, al romperse, dejan una bola de fuego.',
  llamaBola: 'Las llamas que se apagan a veces escupen otra bola de fuego (CONFIG.PROB_LLAMA_BOLA).',
  trampaSeExtiende: 'Tocar una trampa (un jugador o un enemigo) la extiende a un bloque vecino (CONFIG.ESPERA_EXTENSION_TRAMPA).',
  bolaExtra: 'Los tiles de fuego a veces escupen dos bolas en vez de una (CONFIG.PROB_BOLA_EXTRA).',
  fuegoPropaga: 'Los tiles de fuego escupen el doble de seguido (y pueden tener dos bolas a la vez), las llamas duran el doble, se duplican las chances de más bolas y de llamas que escupen, y las llamas escupen dos bolas (CONFIG.FUEGO_PROPAGA).',
  explosionesLanzan: 'Las explosiones de los demonios lanzan monedas y talismanes que dañan a los jugadores.',
  velocidad: 'Multiplica la velocidad de carrera, del dash y del boulder (1 = normal).',
  salto: 'Multiplica la altura de los saltos (1,25 = 25 % más alto). Se ve al Reiniciar.',
  knockback: 'Multiplica cuánto lo empuja un golpe recibido (1 = normal).',
  rebotesExtra: 'Rebotes de más para los tiros de sus armas, contra el escenario.',
  escudos: 'Veces que sobrevive a un golpe que lo mataría (no sirve contra el fantasma).',
  iman: 'Atrae los talismanes cercanos (CONFIG.RADIO_IMAN y FUERZA_IMAN).',
  municionGratis: 'A veces un tiro no gasta munición (CONFIG.PROB_MUNICION_GRATIS).',
  trampaPiedra: 'Las trampas que toca se vuelven piedra en lugar de golpearlo.',
  bombaAlMorir: 'Al morir suelta una bomba.',
  saltoPisoton: 'Apretar saltar justo al pisar un enemigo lo lleva más alto (FISICA.pisotonSaltado).',
  parryRecarga: 'Romper un tiro con la katana a veces le devuelve munición (CONFIG.PROB_PARRY_RECARGA).',
  katanaLarga: 'La katana llega más lejos hacia adelante (FISICA.katanaExtra).',
  katanaAlta: 'La katana es más alta (FISICA.katanaExtra).',
  parry360: 'La katana rompe tiros alrededor de todo el ninja, no solo adelante (FISICA.radioParry360).',
  parryDevuelve: 'La katana no rompe los tiros enemigos: los devuelve desviados y más rápidos, y pasan a ser suyos (CONFIG.PARRY_DEVUELVE).',
  proyectilesBuscan: 'Todo lo suyo que vuela se tuerce de a poco hacia el demonio más cercano que tenga adelante (CONFIG.PROYECTILES_BUSCAN).',
  pisarEnfurece: 'Pisar a un demonio sin matarlo lo enfurece.'
};
const modsDelGimnasio = (base) => Object.keys(base).filter(k => !MODS_FUERA.has(k));
function campoMod(objeto, clave, base) {
  const div = document.createElement('div');
  div.className = 'campo';
  const id = PERGAMINO_DE[clave] || clave;
  const nombrePerg = i18n.t(`perg_${id}`);
  const nombre = texto(nombrePerg && !nombrePerg.startsWith('perg_') ? `${nombrePerg.toLowerCase()} (${clave})` : clave, 'nombre');
  const marcar = () => div.classList.toggle('cambiado', objeto[clave] !== base);
  let entrada;
  if (typeof base === 'boolean') {
    entrada = document.createElement('input');
    entrada.type = 'checkbox';
    entrada.checked = objeto[clave];
    entrada.onchange = () => { objeto[clave] = entrada.checked; marcar(); };
  } else {
    entrada = document.createElement('input');
    entrada.type = 'number';
    entrada.step = Number.isInteger(base) ? 1 : 0.05;
    entrada.value = objeto[clave];
    entrada.onchange = () => { const v = Number(String(entrada.value).replace(',', '.')); if (Number.isFinite(v)) objeto[clave] = v; else entrada.value = objeto[clave]; marcar(); };
  }
  const reset = boton('↺', () => { objeto[clave] = base; if (entrada.type === 'checkbox') entrada.checked = base; else entrada.value = base; marcar(); }, 'reset');
  reset.title = 'Sin pergamino';
  const ayuda = texto('?', 'ayuda-mod');
  ayuda.title = AYUDA_MODS[clave] || 'Sin descripción';
  nombre.append(' ', ayuda);
  div.append(nombre, entrada, texto(typeof base === 'boolean' ? '' : `sin ${base}`, 'def'), reset);
  marcar();
  return div;
}

// Para el banco de pruebas (window.prueba.gimnasio)
export const puertaGimnasio = {
  abrir, cerrar, abierto: estaAbierto, spawnearEnemigo: (k) => !!spawnearEnemigo(k), spawnearJefe: (t) => !!spawnearJefe(t),
  cambiar: (ruta, valor) => { cambiar(ruta, valor); return valorActual(ruta); },
  valor: valorActual, default: valorDefault, ajustes: () => JSON.parse(archivoDeAjustes()).ajustes,
  todoAlDefault: () => { todoAlDefault(); return true; },
  secciones: () => secciones().map(([n, r]) => [n, r.length]),
  comentario: async (ruta) => { await leerComentarios(); return comentario(ruta); },
  congelar: (si) => { sesion.congelados = si; return true; },
  pincel: (tipo) => { sesion.pincel = tipo; return true; },
  pintarCelda: (col, fila, tipo) => pintarCelda(escenaActual, col, fila, tipo),
  tilesFuego: () => escenaActual.tilesFuego.length,
  pergaminos: () => escenaActual.partida.mods
};

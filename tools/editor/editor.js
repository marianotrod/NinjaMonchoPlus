// editor.js
// Editor de niveles de Ninja Moncho. Se abre con el juego servido: http://localhost:5501/tools/editor/
// Pinta las capas de un nivel (fondo, skin, lógica y objetos) sobre la grilla completa, incluida la zona oculta.
import { CONFIG, LOGICA, MUNDO } from '../../config.js';
import { Bestiario } from '../../datos/Bestiario.js';
import { CLAVE_BORRADOR, validarNivel } from '../../mundo/Niveles.js';
import { nivelNuevo } from './formato.js';
import { guardarNivel, leerIndice, leerNivel } from './almacen.js';

const T = MUNDO.tile;
const ES_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const ZOOM_MAXIMO = 5;
const MAX_DESHACER = 100;
const MAX_RECIENTES = 18;

const IMAGENES_FONDO = { 'fondo-cielo': '../../public/assets/Cielo.webp' };
const CAPAS = [
  { id: 'fondo', nombre: 'Fondo' },
  { id: 'skin', nombre: 'Skin' },
  { id: 'logica', nombre: 'Lógica' },
  { id: 'objetos', nombre: 'Objetos' }
];
const HERRAMIENTAS = [
  { id: 'lapiz', nombre: 'Lápiz', tecla: 'b' },
  { id: 'rectangulo', nombre: 'Rectángulo', tecla: 'r' },
  { id: 'borrar', nombre: 'Borrar', tecla: 'e' },
  { id: 'cuentagotas', nombre: 'Cuentagotas', tecla: 'i' },
  { id: 'copiar', nombre: 'Copiar bloque', tecla: 'c' },
  { id: 'estampar', nombre: 'Estampar bloque', tecla: 'v' }
];
// Las capas de tiles que se copian, con el valor que significa celda vacía
const CAPAS_DE_BLOQUE = [['fondo', -1], ['skin', -1], ['logica', LOGICA.VACIO]];
const TIPOS_LOGICA = [
  { valor: LOGICA.SOLIDO, nombre: 'Sólido', color: '#22c55e', letra: 'S' },
  { valor: LOGICA.PASARELA, nombre: 'Pasarela', color: '#3b82f6', letra: 'P' },
  { valor: LOGICA.TRAMPA, nombre: 'Trampa', color: '#ef4444', letra: 'T' },
  { valor: LOGICA.FUEGO, nombre: 'Fuego', color: '#f97316', letra: 'F' }
];
const TIPOS_OBJETO = [
  { nombre: 'Spawn J1', color: '#f87171', ancho: 1, alto: 1, datos: { tipo: 'spawnJugador', jugador: 1 } },
  { nombre: 'Spawn J2', color: '#4ade80', ancho: 1, alto: 1, datos: { tipo: 'spawnJugador', jugador: 2 } },
  { nombre: 'Pergamino', color: '#fbbf24', ancho: 2, alto: 4, letra: 'P', datos: { tipo: 'spawnPergamino' } },
  // Puntos de donde puede caer la llave o la jaula del rescate (se eligen dos al azar). Se pueden poner varios.
  { nombre: 'Rescate', color: '#a78bfa', ancho: 1, alto: 1, letra: 'R', datos: { tipo: 'spawnRescate' } }
];
const CAMPOS = [
  { clave: 'nombre', etiqueta: 'Nombre' },
  { clave: 'tipo', etiqueta: 'Tipo', opciones: ['inicio', 'fijo', 'normal', 'jefe', 'pergaminos', 'prueba', 'borrador'] },
  { clave: 'tier', etiqueta: 'Tier (dificultad)', opciones: [null, 1, 2, 3] },
  { clave: 'jefe', etiqueta: 'Jefe', opciones: [null, 'ogro', 'oni', 'espectro', 'rey'] },
  { clave: 'musica', etiqueta: 'Música', opciones: [null, 'musica-fondo', 'musica-cueva', 'musica-agua', 'musica-jefe'] },
  { clave: 'tiempo', etiqueta: 'Tiempo (s)', numero: true },
  { clave: 'wrap', etiqueta: 'Wrap', opciones: [null, true] }
];

const estado = {
  nivel: null,
  indice: [],
  capa: 'skin',
  herramienta: 'lapiz',
  tile: 0,
  logica: LOGICA.SOLIDO,
  objeto: 0,
  zoom: 2,
  visibles: { fondo: true, skin: true, logica: true, objetos: true },
  grilla: true,
  deshacer: [],
  rehacer: [],
  sucio: false,
  recientes: [],
  cursor: null,
  trazo: null,
  bloque: null   // Lo último que se copió: { ancho, alto, capas: { skin: [[...]], ... } }. Sigue al cambiar de nivel.
};

const $ = (id) => document.getElementById(id);
const lienzo = $('mapa');
const ctx = lienzo.getContext('2d');
const imagenTileset = new Image();
const imagenFondo = new Image();

const cargarImagen = (imagen, src) => new Promise((resolver, rechazar) => {
  imagen.onload = resolver;
  imagen.onerror = () => rechazar(new Error(`No se pudo cargar ${src}`));
  imagen.src = src;
});

const columnasTileset = () => Math.floor(imagenTileset.width / T);
const filasTileset = () => Math.floor(imagenTileset.height / T);

function avisar(texto, clase = '') {
  const mensaje = $('mensaje');
  mensaje.textContent = texto;
  mensaje.className = clase;
}

function marcarSucio(valor = true) {
  estado.sucio = valor;
  document.title = `${valor ? '● ' : ''}${estado.nivel ? estado.nivel.id : ''} — Editor de niveles`;
}

// ------------------------------------------
// Dibujo del mapa
// ------------------------------------------
function dibujarTile(destino, frame, x, y, lado) {
  const cols = columnasTileset();
  destino.drawImage(imagenTileset, (frame % cols) * T, Math.floor(frame / cols) * T, T, T, x, y, lado, lado);
}

function dibujarCapaTiles(grilla, lado) {
  grilla.forEach((fila, f) => fila.forEach((frame, c) => {
    if (frame !== -1) dibujarTile(ctx, frame, c * lado, f * lado, lado);
  }));
}

function dibujarLogica(lado) {
  ctx.globalAlpha = estado.capa === 'logica' ? 0.65 : 0.35;
  ctx.font = `bold ${Math.max(9, lado * 0.55)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  estado.nivel.capas.logica.forEach((fila, f) => fila.forEach((valor, c) => {
    const tipo = TIPOS_LOGICA.find(t => t.valor === valor);
    if (!tipo) return;
    ctx.fillStyle = tipo.color;
    if (valor === LOGICA.PASARELA) ctx.fillRect(c * lado, f * lado, lado, Math.ceil(lado / 3));
    else ctx.fillRect(c * lado, f * lado, lado, lado);
    if (lado >= T * 2) {
      ctx.fillStyle = '#000';
      ctx.fillText(tipo.letra, (c + 0.5) * lado, (f + 0.5) * lado);
    }
  }));
  ctx.globalAlpha = 1;
}

const tipoDeObjeto = (objeto) => TIPOS_OBJETO.find(t => t.datos.tipo === objeto.tipo && t.datos.jugador === objeto.jugador);

function dibujarObjetos(lado) {
  ctx.font = `bold ${Math.max(9, lado * 0.4)}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  estado.nivel.objetos.forEach(objeto => {
    const tipo = tipoDeObjeto(objeto);
    if (!tipo) return;
    const [x, y, ancho, alto] = [objeto.col * lado, objeto.fila * lado, tipo.ancho * lado, tipo.alto * lado];
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = tipo.color;
    ctx.fillRect(x, y, ancho, alto);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tipo.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, ancho - 2, alto - 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(objeto.jugador ? `J${objeto.jugador}` : tipo.letra, x + 3, y + 3);
  });
}

function dibujarZonaOculta(lado) {
  const izquierda = MUNDO.columnasOcultas * lado;
  const arriba = MUNDO.filasOcultas * lado;
  const anchoVisible = (MUNDO.columnas - MUNDO.columnasOcultas * 2) * lado;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, 0, lienzo.width, arriba);
  ctx.fillRect(0, arriba, izquierda, lienzo.height - arriba);
  ctx.fillRect(izquierda + anchoVisible, arriba, izquierda, lienzo.height - arriba);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(izquierda, arriba, anchoVisible, lienzo.height - arriba);
}

function dibujarGrilla(lado) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 1; c < MUNDO.columnas; c++) { ctx.moveTo(c * lado + 0.5, 0); ctx.lineTo(c * lado + 0.5, lienzo.height); }
  for (let f = 1; f < MUNDO.filas; f++) { ctx.moveTo(0, f * lado + 0.5); ctx.lineTo(lienzo.width, f * lado + 0.5); }
  ctx.stroke();
}

// Vista previa del bloque bajo el cursor: el dibujo semitransparente y el contorno
function dibujarBloqueEn(cursor, lado) {
  const { bloque } = estado;
  ctx.globalAlpha = 0.6;
  ['fondo', 'skin'].forEach(capa => {
    const grilla = bloque.capas[capa];
    if (!grilla) return;
    grilla.forEach((fila, f) => fila.forEach((frame, c) => {
      if (frame !== -1) dibujarTile(ctx, frame, (cursor.col + c) * lado, (cursor.fila + f) * lado, lado);
    }));
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#facc15';
  ctx.strokeRect(cursor.col * lado, cursor.fila * lado, bloque.ancho * lado, bloque.alto * lado);
}

function dibujarCursor(lado) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  const { trazo, cursor } = estado;
  if (cursor && estado.herramienta === 'estampar' && estado.bloque) {
    dibujarBloqueEn(cursor, lado);
  } else if (trazo && trazo.rectangulo) {
    const r = rectanguloDe(trazo.inicio, cursor || trazo.inicio);
    ctx.strokeRect(r.c1 * lado, r.f1 * lado, (r.c2 - r.c1 + 1) * lado, (r.f2 - r.f1 + 1) * lado);
  } else if (cursor) {
    ctx.strokeRect(cursor.col * lado, cursor.fila * lado, lado, lado);
  }
}

function dibujar() {
  if (!estado.nivel) return;
  const lado = T * estado.zoom;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(imagenFondo, MUNDO.columnasOcultas * lado, MUNDO.filasOcultas * lado,
    (MUNDO.columnas - MUNDO.columnasOcultas * 2) * lado, (MUNDO.filas - MUNDO.filasOcultas) * lado);

  const { capas } = estado.nivel;
  if (estado.visibles.fondo) dibujarCapaTiles(capas.fondo, lado);
  if (estado.visibles.skin) dibujarCapaTiles(capas.skin, lado);
  if (estado.visibles.logica) dibujarLogica(lado);
  if (estado.visibles.objetos) dibujarObjetos(lado);
  dibujarZonaOculta(lado);
  if (estado.grilla && estado.zoom >= 2) dibujarGrilla(lado);
  dibujarCursor(lado);
}

function aplicarZoom(zoom) {
  estado.zoom = Math.min(ZOOM_MAXIMO, Math.max(1, zoom));
  lienzo.width = MUNDO.columnas * T * estado.zoom;
  lienzo.height = MUNDO.filas * T * estado.zoom;
  $('zoom').textContent = `×${estado.zoom}`;
  dibujar();
}

// ------------------------------------------
// Edición
// ------------------------------------------
const fotoDelNivel = () => JSON.stringify({ capas: estado.nivel.capas, objetos: estado.nivel.objetos });

function restaurar(foto) {
  Object.assign(estado.nivel, JSON.parse(foto));
  marcarSucio();
  dibujar();
}

function deshacer() {
  if (!estado.deshacer.length) return;
  estado.rehacer.push(fotoDelNivel());
  restaurar(estado.deshacer.pop());
}

function rehacer() {
  if (!estado.rehacer.length) return;
  estado.deshacer.push(fotoDelNivel());
  restaurar(estado.rehacer.pop());
}

const celdaDe = (evento) => {
  const lado = T * estado.zoom;
  const col = Math.floor(evento.offsetX / lado);
  const fila = Math.floor(evento.offsetY / lado);
  const adentro = col >= 0 && fila >= 0 && col < MUNDO.columnas && fila < MUNDO.filas;
  return adentro ? { col, fila } : null;
};

const rectanguloDe = (a, b) => ({
  c1: Math.min(a.col, b.col), c2: Math.max(a.col, b.col), f1: Math.min(a.fila, b.fila), f2: Math.max(a.fila, b.fila)
});

function objetoEn(col, fila) {
  return estado.nivel.objetos.find(objeto => {
    const tipo = tipoDeObjeto(objeto);
    const ancho = tipo ? tipo.ancho : 1;
    const alto = tipo ? tipo.alto : 1;
    return col >= objeto.col && col < objeto.col + ancho && fila >= objeto.fila && fila < objeto.fila + alto;
  });
}

function colocarObjeto(col, fila) {
  const { datos } = TIPOS_OBJETO[estado.objeto];
  const { objetos } = estado.nivel;
  // Cada jugador tiene un solo spawn: colocarlo de nuevo lo mueve
  const existente = datos.jugador && objetos.find(o => o.tipo === datos.tipo && o.jugador === datos.jugador);
  if (existente) Object.assign(existente, { col, fila });
  else if (!objetoEn(col, fila)) objetos.push({ ...datos, col, fila });
}

function quitarObjeto(col, fila) {
  const objeto = objetoEn(col, fila);
  // Sin spawns el nivel no arranca: se mueven, no se borran
  if (objeto && objeto.tipo !== 'spawnJugador') estado.nivel.objetos.splice(estado.nivel.objetos.indexOf(objeto), 1);
}

function pintarCelda(col, fila, borrar) {
  const { capa, nivel } = estado;
  if (capa === 'objetos') {
    if (borrar) quitarObjeto(col, fila);
    else colocarObjeto(col, fila);
  } else if (capa === 'logica') {
    nivel.capas.logica[fila][col] = borrar ? LOGICA.VACIO : estado.logica;
  } else {
    nivel.capas[capa][fila][col] = borrar ? -1 : estado.tile;
  }
}

function tomarDeCelda(col, fila) {
  const { capa, nivel } = estado;
  if (capa === 'logica') {
    const valor = nivel.capas.logica[fila][col];
    if (valor !== LOGICA.VACIO) estado.logica = valor;
  } else if (capa !== 'objetos') {
    const frame = nivel.capas[capa][fila][col];
    if (frame !== -1) elegirTile(frame);
  }
  dibujarPaleta();
}

// Copia las capas visibles: con la lógica a la vista, el bloque se lleva su colisión
function copiarBloque({ c1, c2, f1, f2 }) {
  const capas = {};
  CAPAS_DE_BLOQUE.forEach(([capa]) => {
    if (estado.visibles[capa]) capas[capa] = estado.nivel.capas[capa].slice(f1, f2 + 1).map(fila => fila.slice(c1, c2 + 1));
  });
  estado.bloque = { ancho: c2 - c1 + 1, alto: f2 - f1 + 1, capas };
  avisar(`Bloque de ${estado.bloque.ancho}×${estado.bloque.alto} copiado: V lo estampa`, 'ok');
  elegirHerramienta('estampar');
}

// Las celdas vacías del bloque no pisan lo que hay abajo. Lo que queda fuera del mapa se recorta.
function estamparBloque({ col, fila }) {
  const { bloque, nivel } = estado;
  CAPAS_DE_BLOQUE.forEach(([capa, vacio]) => {
    const grilla = bloque.capas[capa];
    if (!grilla) return;
    grilla.forEach((filaBloque, f) => filaBloque.forEach((valor, c) => {
      const destino = nivel.capas[capa][fila + f];
      if (valor !== vacio && destino && col + c < MUNDO.columnas) destino[col + c] = valor;
    }));
  });
}

function empezarTrazo(evento) {
  const celda = celdaDe(evento);
  if (!celda || !estado.nivel) return;
  evento.preventDefault();
  if (evento.altKey || estado.herramienta === 'cuentagotas') {
    tomarDeCelda(celda.col, celda.fila);
    return;
  }
  const { herramienta } = estado;
  if (herramienta === 'estampar') {
    if (!estado.bloque) {
      avisar('Primero copiá un bloque (C)', 'error');
      return;
    }
    estado.trazo = { foto: fotoDelNivel(), estampa: true };
    estamparBloque(celda);
    dibujar();
    return;
  }
  const borrar = evento.button === 2 || herramienta === 'borrar';
  const copiar = herramienta === 'copiar';
  const rectangulo = copiar || (herramienta === 'rectangulo' && estado.capa !== 'objetos');
  estado.trazo = { foto: fotoDelNivel(), borrar, rectangulo, copiar, inicio: celda };
  if (!rectangulo) pintarCelda(celda.col, celda.fila, borrar);
  dibujar();
}

function moverCursor(evento) {
  const celda = celdaDe(evento);
  estado.cursor = celda;
  const { trazo } = estado;
  if (trazo && celda && !trazo.rectangulo && !trazo.estampa) pintarCelda(celda.col, celda.fila, trazo.borrar);
  dibujar();
}

function terminarTrazo() {
  const { trazo, cursor } = estado;
  if (!trazo) return;
  if (trazo.rectangulo) {
    const r = rectanguloDe(trazo.inicio, cursor || trazo.inicio);
    if (trazo.copiar) copiarBloque(r);
    else for (let f = r.f1; f <= r.f2; f++) for (let c = r.c1; c <= r.c2; c++) pintarCelda(c, f, trazo.borrar);
  }
  estado.trazo = null;
  if (fotoDelNivel() !== trazo.foto) {
    estado.deshacer.push(trazo.foto);
    if (estado.deshacer.length > MAX_DESHACER) estado.deshacer.shift();
    estado.rehacer = [];
    marcarSucio();
  }
  dibujar();
}

// ------------------------------------------
// Paneles
// ------------------------------------------
function elegirTile(frame) {
  estado.tile = frame;
  estado.recientes = [frame, ...estado.recientes.filter(f => f !== frame)].slice(0, MAX_RECIENTES);
  if (estado.herramienta === 'cuentagotas') elegirHerramienta('lapiz');
}

function dibujarRecientes() {
  const caja = $('recientes');
  caja.replaceChildren(...estado.recientes.map(frame => {
    const muestra = document.createElement('canvas');
    muestra.width = muestra.height = T;
    dibujarTile(muestra.getContext('2d'), frame, 0, 0, T);
    muestra.title = `Tile ${frame}`;
    muestra.addEventListener('click', () => { elegirTile(frame); dibujarPaleta(); });
    return muestra;
  }));
}

function paletaDeTiles() {
  const escala = 3;
  const tileset = document.createElement('canvas');
  tileset.id = 'tileset';
  tileset.width = columnasTileset() * T * escala;
  tileset.height = filasTileset() * T * escala;
  const pincel = tileset.getContext('2d');
  pincel.imageSmoothingEnabled = false;
  pincel.fillStyle = '#000';
  pincel.fillRect(0, 0, tileset.width, tileset.height);
  pincel.drawImage(imagenTileset, 0, 0, tileset.width, tileset.height);
  const lado = T * escala;
  pincel.strokeStyle = '#fbbf24';
  pincel.lineWidth = 3;
  pincel.strokeRect((estado.tile % columnasTileset()) * lado + 1, Math.floor(estado.tile / columnasTileset()) * lado + 1, lado - 2, lado - 2);
  tileset.addEventListener('click', (evento) => {
    elegirTile(Math.floor(evento.offsetY / lado) * columnasTileset() + Math.floor(evento.offsetX / lado));
    dibujarPaleta();
  });
  return tileset;
}

function opcionDePaleta(nombre, color, activa, alElegir) {
  const boton = document.createElement('button');
  boton.className = `opcion${activa ? ' activo' : ''}`;
  const muestra = document.createElement('span');
  muestra.className = 'muestra';
  muestra.style.background = color;
  boton.append(muestra, nombre);
  boton.addEventListener('click', () => {
    alElegir();
    if (estado.herramienta === 'cuentagotas') elegirHerramienta('lapiz');
    dibujarPaleta();
  });
  return boton;
}

function dibujarPaleta() {
  const contenido = $('contenido-paleta');
  const desplazamiento = contenido.scrollTop;
  const usaTiles = estado.capa === 'fondo' || estado.capa === 'skin';
  $('recientes').style.display = usaTiles ? '' : 'none';
  if (usaTiles) {
    dibujarRecientes();
    contenido.replaceChildren(paletaDeTiles());
  } else if (estado.capa === 'logica') {
    contenido.replaceChildren(...TIPOS_LOGICA.map(t => opcionDePaleta(t.nombre, t.color, estado.logica === t.valor, () => { estado.logica = t.valor; })));
  } else {
    contenido.replaceChildren(...TIPOS_OBJETO.map((t, i) => opcionDePaleta(t.nombre, t.color, estado.objeto === i, () => { estado.objeto = i; })));
  }
  contenido.scrollTop = desplazamiento;
}

function dibujarBotones() {
  const capas = CAPAS.map(capa => {
    const fila = document.createElement('div');
    fila.className = 'fila';
    const boton = document.createElement('button');
    boton.textContent = capa.nombre;
    boton.classList.toggle('activo', estado.capa === capa.id);
    boton.addEventListener('click', () => elegirCapa(capa.id));
    const ver = document.createElement('input');
    ver.type = 'checkbox';
    ver.checked = estado.visibles[capa.id];
    ver.title = 'Mostrar u ocultar';
    ver.addEventListener('change', () => { estado.visibles[capa.id] = ver.checked; dibujar(); });
    fila.append(boton, ver);
    return fila;
  });
  $('capas').replaceChildren(...capas);

  $('herramientas').replaceChildren(...HERRAMIENTAS.map(h => {
    const boton = document.createElement('button');
    boton.textContent = `${h.nombre} (${h.tecla.toUpperCase()})`;
    boton.classList.toggle('activo', estado.herramienta === h.id);
    boton.addEventListener('click', () => elegirHerramienta(h.id));
    return boton;
  }));
}

function elegirCapa(capa) {
  estado.capa = capa;
  estado.visibles[capa] = true;
  dibujarBotones();
  dibujarPaleta();
  dibujar();
}

function elegirHerramienta(herramienta) {
  estado.herramienta = herramienta;
  dibujarBotones();
}

function campoDePropiedad({ clave, etiqueta, opciones, numero }) {
  const rotulo = document.createElement('label');
  rotulo.textContent = etiqueta;
  const { nivel } = estado;
  let control;
  if (opciones) {
    control = document.createElement('select');
    opciones.forEach(valor => control.add(new Option(valor === null ? '(por defecto)' : valor === true ? 'sí' : valor, JSON.stringify(valor))));
    control.value = JSON.stringify(nivel[clave] ?? null);
    control.addEventListener('change', () => { nivel[clave] = JSON.parse(control.value); marcarSucio(); });
  } else {
    control = document.createElement('input');
    control.type = numero ? 'number' : 'text';
    control.value = nivel[clave] ?? '';
    if (numero) control.placeholder = '(por defecto)';
    control.addEventListener('input', () => {
      nivel[clave] = numero ? (control.value === '' ? null : Number(control.value)) : control.value;
      marcarSucio();
    });
  }
  rotulo.append(control);
  return rotulo;
}

function dibujarPropiedades() {
  $('propiedades').replaceChildren(...CAMPOS.map(campoDePropiedad));
}

function dibujarSelector() {
  const selector = $('selector-nivel');
  selector.replaceChildren(...estado.indice.map(({ id }) => new Option(id, id)));
  if (estado.nivel) selector.value = estado.nivel.id;
}

// ------------------------------------------
// Archivos
// ------------------------------------------
function ponerNivel(nivel, sucio = false) {
  estado.nivel = nivel;
  estado.deshacer = [];
  estado.rehacer = [];
  marcarSucio(sucio);
  dibujarSelector();
  dibujarPropiedades();
  dibujar();
  const columnas = columnasTileset();
  if (nivel.tileset.columnas !== columnas) {
    avisar(`Atención: este nivel se hizo con un tileset de ${nivel.tileset.columnas} columnas y el actual tiene ${columnas}.`, 'error');
  }
}

async function abrir(id) {
  if (estado.sucio && !confirm('Hay cambios sin guardar. ¿Abrir otro nivel igual?')) {
    dibujarSelector();
    return;
  }
  ponerNivel(await leerNivel(id));
  avisar(`Abierto ${id}`);
}

const idValido = (id) => /^[a-z0-9-]+$/.test(id) && !estado.indice.some(nivel => nivel.id === id);

function pedirId(texto, sugerido) {
  const id = prompt(texto, sugerido);
  if (id === null) return null;
  if (idValido(id)) return id;
  avisar('El id tiene que ser nuevo y usar solo minúsculas, números y guiones.', 'error');
  return null;
}

function crear(id) {
  ponerNivel(nivelNuevo(id, columnasTileset()), true);
  avisar(`Nivel nuevo ${id}: todavía no está guardado`);
}

function duplicar(id) {
  ponerNivel({ ...JSON.parse(JSON.stringify(estado.nivel)), id, nombre: id }, true);
  avisar(`Copia ${id}: todavía no está guardada`);
}

async function guardar() {
  const errores = validarNivel(estado.nivel.id, estado.nivel);
  if (errores.length) {
    avisar(errores[0], 'error');
    return false;
  }
  try {
    estado.indice = await guardarNivel(estado.nivel);
  } catch (error) {
    if (error.name !== 'AbortError') avisar(error.message, 'error');
    return false;
  }
  marcarSucio(false);
  dibujarSelector();
  avisar(`Guardado ${estado.nivel.id}`, 'ok');
  return true;
}

// El número de nivel solo importa para que el juego arme una pelea de jefe o un nivel común
function direccionDePrueba(extra = '') {
  const { id, tipo, jefe } = estado.nivel;
  const parametros = tipo === 'jefe' ? `nivel=5${jefe && jefe !== 'rey' ? `&jefe=${jefe}` : ''}` : (tipo === 'pergaminos' ? 'nivel=2&sala' : 'nivel=3');
  const fase = tipo !== 'jefe' && tipo !== 'pergaminos' && opcionesPrueba.fase === 'caceria' ? '&fase=caceria' : '';
  const reloj = opcionesPrueba.sinTiempo ? '&sinTiempo' : '';
  return `../../index.html?debug&${parametros}&mapa=${id}&enemigos=${parametroEnemigos()}${fase}${reloj}${extra}`;
}

// ------------------------------------------
// Al probar: en qué fase empieza (Recolección o Cacería) y qué enemigos aparecen (según un nivel, elegidos uno por uno o
// ninguno). Solo cambian la prueba; se recuerdan en este navegador.
// ------------------------------------------
const CLAVE_OPCIONES_PRUEBA = 'ninja-moncho-editor-prueba';
const MAX_POR_ENEMIGO = 8;
const opcionesPrueba = { modo: 'nivel', nivel: 3, lista: {}, fase: 'recoleccion', sinTiempo: false };

function leerOpcionesPrueba() {
  try {
    Object.assign(opcionesPrueba, JSON.parse(localStorage.getItem(CLAVE_OPCIONES_PRUEBA)) || {});
  } catch (error) { /* Sin opciones guardadas: las de siempre */ }
}

function guardarOpcionesPrueba() {
  try { localStorage.setItem(CLAVE_OPCIONES_PRUEBA, JSON.stringify(opcionesPrueba)); } catch (error) { /* No importa */ }
}

const totalElegidos = () => Object.values(opcionesPrueba.lista).reduce((a, b) => a + b, 0);

function parametroEnemigos() {
  const { modo, nivel, lista } = opcionesPrueba;
  if (modo === 'ninguno') return 'ninguno';
  if (modo === 'nivel') return `nivel:${nivel}`;
  const elegidos = Object.entries(lista).filter(([clave, n]) => n > 0 && Bestiario[clave]);
  return elegidos.length ? elegidos.map(([clave, n]) => `${clave}:${n}`).join(',') : 'ninguno';
}

function resumenPrueba() {
  const { modo, nivel, fase } = opcionesPrueba;
  const enemigos = modo === 'ninguno' ? 'sin enemigos' : (modo === 'nivel' ? `enemigos nivel ${nivel}` : `${totalElegidos()} enemigos`);
  return `${fase === 'caceria' ? 'Cacería' : 'Recolección'}, ${enemigos}${opcionesPrueba.sinTiempo ? ', sin reloj' : ''}`;
}

function dibujarPanelPrueba() {
  const panel = $('panel-prueba');
  const { modo, nivel, lista } = opcionesPrueba;
  const opcion = (valor, texto, extra = '') =>
    `<label><input type="radio" name="modo-prueba" value="${valor}" ${modo === valor ? 'checked' : ''}> ${texto} ${extra}</label>`;
  const filas = Object.keys(Bestiario).map(clave =>
    `<label class="enemigo ${modo === 'lista' ? '' : 'apagado'}">${clave}
      <input type="number" min="0" max="${MAX_POR_ENEMIGO}" value="${lista[clave] || 0}" data-enemigo="${clave}" ${modo === 'lista' ? '' : 'disabled'}></label>`).join('');
  const fase = (valor, texto) =>
    `<label><input type="radio" name="fase-prueba" value="${valor}" ${opcionesPrueba.fase === valor ? 'checked' : ''}> ${texto}</label>`;
  panel.innerHTML =
    '<strong>Empieza en</strong>' + fase('recoleccion', 'Recolección') + fase('caceria', 'Cacería') +
    `<label><input type="checkbox" id="sin-tiempo" ${opcionesPrueba.sinTiempo ? 'checked' : ''}> Sin reloj <small>(el tiempo no baja)</small></label>` +
    '<strong>Enemigos</strong>' +
    opcion('nivel', 'Según el nivel', `<input type="number" id="nivel-prueba" min="1" max="10" value="${nivel}" ${modo === 'nivel' ? '' : 'disabled'}>`) +
    opcion('lista', `Elegidos <small>(hasta ${CONFIG.TOPE_ENEMIGOS_PRUEBA} en total)</small>`) + filas +
    opcion('ninguno', 'Ninguno');
  $('resumen-prueba').textContent = resumenPrueba();
}

function cambiarOpcionPrueba(evento) {
  const objetivo = evento.target;
  if (objetivo.name === 'modo-prueba') opcionesPrueba.modo = objetivo.value;
  if (objetivo.name === 'fase-prueba') opcionesPrueba.fase = objetivo.value;
  if (objetivo.id === 'sin-tiempo') opcionesPrueba.sinTiempo = objetivo.checked;
  if (objetivo.id === 'nivel-prueba') opcionesPrueba.nivel = Math.min(10, Math.max(1, parseInt(objetivo.value, 10) || 1));
  if (objetivo.dataset.enemigo) {
    const clave = objetivo.dataset.enemigo;
    const otros = totalElegidos() - (opcionesPrueba.lista[clave] || 0);
    const pedido = Math.min(MAX_POR_ENEMIGO, Math.max(0, parseInt(objetivo.value, 10) || 0));
    opcionesPrueba.lista[clave] = Math.min(pedido, CONFIG.TOPE_ENEMIGOS_PRUEBA - otros);  // El total no pasa del tope
  }
  guardarOpcionesPrueba();
  dibujarPanelPrueba();
}

// Online el juego publicado no lee ninguna carpeta local: el nivel le llega por localStorage
function enviarBorrador() {
  const errores = validarNivel(estado.nivel.id, estado.nivel);
  if (errores.length) {
    avisar(errores[0], 'error');
    return null;
  }
  localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(estado.nivel));
  return direccionDePrueba('&borrador');
}

async function probar() {
  if (!ES_LOCAL) {
    const direccion = enviarBorrador();
    if (direccion) window.open(direccion, '_blank');
    return;
  }
  const ventana = window.open('about:blank', '_blank');
  if (estado.sucio && !(await guardar())) {
    if (ventana) ventana.close();
    return;
  }
  if (ventana) ventana.location = direccionDePrueba();
}

// ------------------------------------------
// Eventos
// ------------------------------------------
function alternarPaleta() {
  $('paleta').classList.toggle('oculta');
}

function teclado(evento) {
  const escribiendo = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
  const tecla = evento.key.toLowerCase();

  if (evento.ctrlKey || evento.metaKey) {
    if (tecla === 's') { evento.preventDefault(); guardar(); }
    if (escribiendo) return;
    if (tecla === 'z' && !evento.shiftKey) { evento.preventDefault(); deshacer(); }
    if (tecla === 'y' || (tecla === 'z' && evento.shiftKey)) { evento.preventDefault(); rehacer(); }
    return;
  }
  if (tecla === 'tab') {
    evento.preventDefault();
    alternarPaleta();
    return;
  }
  if (escribiendo) return;
  const herramienta = HERRAMIENTAS.find(h => h.tecla === tecla);
  if (herramienta) elegirHerramienta(herramienta.id);
  if (CAPAS[Number(tecla) - 1]) elegirCapa(CAPAS[Number(tecla) - 1].id);
}

function conectarEventos() {
  lienzo.addEventListener('mousedown', empezarTrazo);
  lienzo.addEventListener('mousemove', moverCursor);
  lienzo.addEventListener('mouseleave', () => { estado.cursor = null; dibujar(); });
  lienzo.addEventListener('contextmenu', evento => evento.preventDefault());
  window.addEventListener('mouseup', terminarTrazo);
  lienzo.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    aplicarZoom(estado.zoom + (evento.deltaY < 0 ? 1 : -1));
  }, { passive: false });
  window.addEventListener('keydown', teclado);
  window.addEventListener('beforeunload', (evento) => { if (estado.sucio) evento.preventDefault(); });

  $('selector-nivel').addEventListener('change', evento => abrir(evento.target.value));
  $('btn-guardar').addEventListener('click', guardar);
  $('btn-probar').addEventListener('click', probar);
  $('panel-prueba').addEventListener('change', cambiarOpcionPrueba);
  $('btn-nuevo').addEventListener('click', () => { const id = pedirId('Id del nivel nuevo:', 'n-'); if (id) crear(id); });
  $('btn-duplicar').addEventListener('click', () => { const id = pedirId('Id de la copia:', `${estado.nivel.id}-2`); if (id) duplicar(id); });
  $('btn-1a1').addEventListener('click', () => aplicarZoom(1));
  $('btn-mas').addEventListener('click', () => aplicarZoom(estado.zoom + 1));
  $('btn-menos').addEventListener('click', () => aplicarZoom(estado.zoom - 1));
  $('ver-grilla').addEventListener('change', evento => { estado.grilla = evento.target.checked; dibujar(); });
}

async function iniciar() {
  await Promise.all([
    cargarImagen(imagenTileset, '../../public/assets/MapTileSet.png'),
    cargarImagen(imagenFondo, IMAGENES_FONDO['fondo-cielo'])
  ]);
  estado.indice = await leerIndice();
  leerOpcionesPrueba();
  conectarEventos();
  dibujarBotones();
  dibujarPanelPrueba();
  aplicarZoom(estado.zoom);
  ponerNivel(await leerNivel(estado.indice[0].id));
  dibujarPaleta();
  avisar('Listo');
}

// Para el banco de pruebas
window.editor = { estado, abrir, crear, duplicar, guardar, enviarBorrador, deshacer, rehacer, elegirCapa, elegirHerramienta, opcionesPrueba, direccionDePrueba };

iniciar().catch(error => avisar(error.message, 'error'));

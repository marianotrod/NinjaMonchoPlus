// Fondo.js
// El fondo cambia con la fase. La Recolección usa el del nivel (el que se elige en el editor); la Cacería, los fantasmas,
// el jefe y la sala de pergaminos tienen el suyo, en public/assets/fondos/: para cambiarlo se reemplaza el PNG (512x288).
// Al cambiar de fase, el fondo nuevo aparece con un fundido encima del anterior. Va con el tiempo real: durante la
// pausa de fase el juego está quieto, pero el fundido sigue. Se calibra en CONFIG.FONDOS_FASE.
import { CONFIG } from '../config.js';

const CAPA_FONDO = -100;  // Detrás de todo

// Clave de textura del fondo de una fase ('caceria', 'fantasma', 'jefe', 'sala'), o null si esa fase usa el del nivel
export function claveFondoDeFase(fase) {
  const archivo = CONFIG.FONDOS_FASE.archivos[fase];
  return archivo ? `fondo-${archivo}` : null;
}

// fase: la que arranca el nivel (null = la del nivel)
export function crearFondo(escena, claveNivel, fase = null) {
  escena.fondo = { claveNivel, actual: null, imagen: null, saliente: null, t: 0 };
  ponerImagen(escena, elegir(escena, fase));
  escena.fondo.imagen.setAlpha(1);
}

export function cambiarFondo(escena, fase) {
  const fondo = escena.fondo;
  if (!fondo) return;
  const clave = elegir(escena, fase);
  if (clave !== fondo.actual) ponerImagen(escena, clave);
}

// Cada cuadro, con el delta de update (que no se escala)
export function actualizarFondo(escena, delta) {
  const fondo = escena.fondo;
  if (!fondo || !fondo.saliente) return;
  fondo.t += delta;
  const avance = Math.min(1, fondo.t / Math.max(1, CONFIG.FONDOS_FASE.transicion));
  fondo.imagen.setAlpha(avance);
  if (avance >= 1) {
    fondo.saliente.destroy();
    fondo.saliente = null;
  }
}

function elegir(escena, fase) {
  const clave = CONFIG.FONDOS_FASE.activa && fase ? claveFondoDeFase(fase) : null;
  // Si el PNG no está (o la fase no tiene uno propio), queda el fondo del nivel
  return clave && escena.textures.exists(clave) ? clave : escena.fondo.claveNivel;
}

function ponerImagen(escena, clave) {
  const fondo = escena.fondo;
  if (fondo.saliente) fondo.saliente.destroy();  // Si cambia otra vez en medio de un fundido, el más viejo se va
  fondo.saliente = fondo.imagen;
  if (fondo.saliente) fondo.saliente.setDepth(CAPA_FONDO);
  fondo.imagen = escena.add.image(256, 144, clave).setDisplaySize(512, 288).setDepth(CAPA_FONDO + 1).setAlpha(0);
  fondo.actual = clave;
  fondo.t = 0;
}

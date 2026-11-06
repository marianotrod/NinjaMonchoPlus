// Mundo.js
// Wrap-around: lo que sale por un borde del mundo entra por el opuesto, sin perder velocidad. Cada objeto cruza cuando
// su centro pasa el corte. La física lo teletransporta; las IA no lo tienen en cuenta y apuntan por el camino directo.
// Por ahora solo en los niveles con "wrap": true (mientras se prueba la sensación de juego).
import { MUNDO } from '../config.js';

const ANCHO = MUNDO.columnas * MUNDO.tile;
const ALTO = MUNDO.filas * MUNDO.tile;
const IZQUIERDA = -MUNDO.columnasOcultas * MUNDO.tile;
const DERECHA = IZQUIERDA + ANCHO;
// Las filas ocultas están todas arriba: el corte se corre una fila para que un objeto de 32 px cruce fuera de la vista
// en los dos extremos. Por eso lo vertical mira el sentido: lo que aparece cayendo más arriba del corte no cruza.
const ARRIBA = -MUNDO.tile;
const ABAJO = ARRIBA + ALTO;
const ANCHO_VISIBLE = (MUNDO.columnas - 2 * MUNDO.columnasOcultas) * MUNDO.tile;
const ALTO_VISIBLE = (MUNDO.filas - MUNDO.filasOcultas) * MUNDO.tile;

// El centro del objeto está fuera de la pantalla
export const fueraDeVista = ({ x, y }) => x < 0 || x > ANCHO_VISIBLE || y < 0 || y > ALTO_VISIBLE;

// La misma columna vista del otro lado del corte: quien mira adelante en el borde tiene que ver lo que hay al cruzar
export function envolverX(x) {
  if (x < IZQUIERDA) return x + ANCHO;
  return x >= DERECHA ? x - ANCHO : x;
}

// El costado opuesto a estos puntos, o null si hay alguno de cada lado.
// Sirve de punto de entrada para lo que no hace wrap, como el fantasma.
export function costadoLibre(xs) {
  const mitad = ANCHO_VISIBLE / 2;
  if (xs.every(x => x < mitad)) return DERECHA;
  return xs.every(x => x >= mitad) ? IZQUIERDA : null;
}

// El borde de arriba o de abajo, el que quede más lejos de y
export const bordeVerticalOpuesto = (y) => (y < ALTO_VISIBLE / 2 ? ABAJO : ARRIBA);

export function wrapear(objeto) {
  const { velocity } = objeto.body;
  objeto.x = envolverX(objeto.x);

  if (velocity.y < 0 && objeto.y < ARRIBA) {
    objeto.y += ALTO;
  } else if (velocity.y >= 0 && objeto.y >= ABAJO) {
    objeto.y -= ALTO;
    // Cayendo por un hueco acelera en cada vuelta: sin tope terminaría atravesando bloques
    velocity.y = Math.min(velocity.y, MUNDO.caidaMaxima);
  }
}

export function proyectilVencido(proyectil, ahora) {
  return ahora - proyectil.nacimiento > MUNDO.vidaProyectil;
}

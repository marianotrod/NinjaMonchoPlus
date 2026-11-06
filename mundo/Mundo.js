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

export function wrapear(objeto) {
  const { velocity } = objeto.body;
  if (objeto.x < IZQUIERDA) objeto.x += ANCHO;
  else if (objeto.x >= DERECHA) objeto.x -= ANCHO;

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

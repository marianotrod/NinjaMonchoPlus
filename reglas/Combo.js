// Combo.js
// Combo de monedas, uno por jugador. Agarrar una moneda antes de que pase CONFIG.COMBO.ventana desde la anterior sube
// el combo; si pasa ese tiempo sin agarrar ninguna, vuelve a x1. Las monedas no suman al agarrarlas: al final del
// nivel cada jugador cobra lo que valían sus monedas (CONFIG.VALOR_MONEDA cada una, menos si rebotaron) por el combo
// máximo que logró en el nivel. Si lo matan con el reloj en cero (fantasmas), su combo máximo se anula (vuelve a x1).
import { CONFIG } from '../config.js';
import { EVENTOS } from '../datos/Eventos.js';

const comboNuevo = () => ({ actual: 1, maximo: 1, monedas: 0, valor: 0, restante: 0 });

export function prepararCombos(escena) {
  escena.combos = [comboNuevo(), comboNuevo()];
  escena.combos.forEach((_, indice) => avisar(escena, indice, false));
}

const avisar = (escena, indice, subio) => escena.events.emit(EVENTOS.COMBO, indice, escena.combos[indice].actual, subio);

// Devuelve el combo con el que quedó
export function sumarMoneda(escena, indice, valor) {
  const combo = escena.combos[indice];
  combo.actual = combo.restante > 0 ? combo.actual + 1 : 1;
  combo.restante = CONFIG.COMBO.ventana;
  combo.maximo = Math.max(combo.maximo, combo.actual);
  combo.monedas++;
  combo.valor += valor;
  avisar(escena, indice, combo.actual > 1);
  return combo.actual;
}

// Cada cuadro, con el tiempo del juego (se frena con la pausa de fase)
export function actualizarCombos(escena, delta) {
  escena.combos.forEach((combo, indice) => {
    if (combo.restante <= 0) return;
    combo.restante -= delta;
    if (combo.restante > 0 || combo.actual === 1) return;
    combo.actual = 1;
    avisar(escena, indice, false);
  });
}

export function anularCombo(escena, indice) {
  const combo = escena.combos[indice];
  if (!CONFIG.COMBO.anularConFantasma || combo.maximo === 1) return;
  Object.assign(combo, { actual: 1, maximo: 1, restante: 0 });
  avisar(escena, indice, false);
}

// Lo que cobra cada jugador al final del nivel
export const cobroDeMonedas = (escena) => escena.combos.map(({ monedas, valor, maximo }) =>
  ({ monedas, valor, combo: maximo, puntos: Math.round(valor * maximo) }));

// PausaDeFase.js
// Al cambiar de fase el juego frena hasta quedar quieto, el cartel aparece y sale rápido por arriba, y recién después
// el juego recupera la velocidad. Así queda claro que la fase cambió y hay tiempo para prepararse.
// Varios carteles seguidos se muestran dentro de la misma pausa. Lo que sigue (empezar la Cacería, soltar los
// fantasmas) se hace al final, cuando el juego ya anda a velocidad normal.
// Se calibra en CONFIG.PAUSA_FASE; con activa: false los carteles salen como antes, sin frenar el juego.
import { CONFIG } from '../config.js';
import { EVENTOS } from '../datos/Eventos.js';

// carteles: lista de datos de cartel (los de EVENTOS.BANNER). alTerminar: lo que se hace después.
export function cartelesDeFase(escena, carteles, alTerminar) {
  const config = CONFIG.PAUSA_FASE;
  if (!config.activa) {
    // Como antes: un cartel después del otro, con el juego andando
    let espera = 0;
    carteles.forEach(datos => {
      escena.time.delayedCall(espera, () => escena.events.emit(EVENTOS.BANNER, datos));
      espera += datos.duracion ?? config.cartel;
    });
    escena.time.delayedCall(espera, () => alTerminar && alTerminar());
    return;
  }
  const pausa = escena.pausaDeFase;
  if (pausa) {
    // Ya está frenado: se suman a la cola
    pausa.cola.push(...carteles);
    if (alTerminar) pausa.alTerminar.push(alTerminar);
    return;
  }
  escena.pausaDeFase = { etapa: 'frenando', t: 0, cola: [...carteles], alTerminar: alTerminar ? [alTerminar] : [], hasta: 0 };
}

export const enPausaDeFase = (escena) => !!escena.pausaDeFase;

// Cada cuadro, con el tiempo real (delta de update, que no se escala)
export function actualizarPausaDeFase(escena, delta) {
  const pausa = escena.pausaDeFase;
  if (!pausa) return;
  const { frenado, arranque, cartel, salida } = CONFIG.PAUSA_FASE;
  pausa.t += delta;

  if (pausa.etapa === 'frenando') {
    aplicarVelocidad(escena, Phaser.Math.Easing.Quadratic.Out(1 - Math.min(1, pausa.t / frenado)));
    if (pausa.t >= frenado) siguienteCartel(escena, pausa);
  } else if (pausa.etapa === 'cartel') {
    if (pausa.t < pausa.hasta) return;
    if (pausa.cola.length > 0) siguienteCartel(escena, pausa);
    else Object.assign(pausa, { etapa: 'arrancando', t: 0 });
  } else if (pausa.etapa === 'arrancando') {
    aplicarVelocidad(escena, Phaser.Math.Easing.Quadratic.In(Math.min(1, pausa.t / arranque)));
    if (pausa.t < arranque) return;
    escena.pausaDeFase = null;
    aplicarVelocidad(escena, 1);
    pausa.alTerminar.forEach(fn => fn());
  }

  function siguienteCartel(escenaActual, p) {
    const datos = p.cola.shift();
    const duracion = (datos.duracion ?? cartel) + salida;
    escenaActual.events.emit(EVENTOS.BANNER, { ...datos, duracion, salida });
    Object.assign(p, { etapa: 'cartel', t: 0, hasta: duracion });
  }
}

// 1 = normal, 0 = quieto. Frena la física, los timers, los tweens y las animaciones de esta escena.
export function aplicarVelocidad(escena, v) {
  const velocidad = Math.max(0, Math.min(1, v));
  escena.velocidadJuego = velocidad;
  escena.physics.world.timeScale = velocidad > 0.001 ? 1 / velocidad : 1e6;
  escena.time.timeScale = velocidad;
  escena.tweens.timeScale = velocidad;
  escena.anims.globalTimeScale = velocidad;  // Es global, pero la UI no usa animaciones de cuadros
}

// Al cerrar la escena (o reiniciarla) en medio de una pausa, que todo vuelva a la normalidad
export function cortarPausaDeFase(escena) {
  escena.pausaDeFase = null;
  aplicarVelocidad(escena, 1);
}

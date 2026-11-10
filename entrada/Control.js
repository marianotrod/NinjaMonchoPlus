// Control.js
// Una capa de entrada por jugador: traduce el teclado y el joystick en acciones. El ninja solo conoce las acciones,
// así que cambiar las teclas (TECLAS en config.js) o manejarlo de otra forma no toca su código.
import { PAD } from '../config.js';

const UMBRAL_STICK = 0.5;

// Lectura segura de un botón del joystick (algunos mandos no reportan todos los botones)
const boton = (pad, indice) => !!(pad && pad.buttons[indice] && pad.buttons[indice].pressed);

export default class Control {
  constructor(scene, teclas) {
    this.scene = scene;
    this.teclas = scene.input.keyboard.addKeys(teclas);
    this.padIndice = null;
    this.padAnterior = {};
  }

  asignarPad(indice) {
    this.padIndice = indice;
  }

  obtenerPad() {
    const { gamepad } = this.scene.input;
    if (this.padIndice === null || !gamepad || gamepad.total === 0) return null;
    return gamepad.getPad(this.padIndice) || null;
  }

  leerPad() {
    const pad = this.obtenerPad();
    if (!pad) return {};
    const izqX = pad.leftStick ? pad.leftStick.x : 0;
    const izqY = pad.leftStick ? pad.leftStick.y : 0;
    const derX = pad.rightStick ? pad.rightStick.x : 0;
    const derY = pad.rightStick ? pad.rightStick.y : 0;
    return {
      izquierda: pad.left || izqX < -UMBRAL_STICK || derX < -UMBRAL_STICK,
      derecha: pad.right || izqX > UMBRAL_STICK || derX > UMBRAL_STICK,
      abajo: pad.down || izqY > UMBRAL_STICK || derY > UMBRAL_STICK,
      // Arriba solo si el stick va más para arriba que para el costado: corriendo en diagonal no apunta arriba
      arriba: pad.up || (izqY < -UMBRAL_STICK && -izqY > Math.abs(izqX)) || (derY < -UMBRAL_STICK && -derY > Math.abs(derX)),
      salto: boton(pad, PAD.A),
      dash: boton(pad, PAD.R1),
      ataque: boton(pad, PAD.X),
      especial: boton(pad, PAD.Y)
    };
  }

  // Devuelve qué botones están apretados y cuáles se apretaron recién. Hay que llamarlo una sola vez por cuadro.
  leer() {
    const pad = this.leerPad();
    const recien = (accion) => !!pad[accion] && !this.padAnterior[accion];
    const { JustDown } = Phaser.Input.Keyboard;
    const { left, right, down, up, salto, ataque, especial } = this.teclas;
    // JustDown da verdadero una sola vez por pulsación: se lee una vez y se usa en los dos lugares
    const toqueIzquierda = JustDown(left);
    const toqueDerecha = JustDown(right);

    const acciones = {
      izquierda: left.isDown || !!pad.izquierda,
      derecha: right.isDown || !!pad.derecha,
      abajo: down.isDown || !!pad.abajo,
      arriba: up.isDown || !!pad.arriba,
      salto: salto.isDown || !!pad.salto,

      recienIzquierda: toqueIzquierda || recien('izquierda'),
      recienDerecha: toqueDerecha || recien('derecha'),
      recienAbajo: JustDown(down) || recien('abajo'),
      // Solo teclado: el doble toque al costado es el dash del teclado. Con joystick el dash es R1, así no sale sin querer
      toqueIzquierda,
      toqueDerecha,
      recienSalto: JustDown(salto) || recien('salto'),
      recienDash: recien('dash'),
      recienAtaque: JustDown(ataque) || recien('ataque'),
      recienEspecial: JustDown(especial) || recien('especial')
    };
    this.padAnterior = pad;
    return acciones;
  }
}

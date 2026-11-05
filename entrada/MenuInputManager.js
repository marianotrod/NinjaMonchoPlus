export default class MenuInputManager {
  constructor(scene) {
    this.scene = scene;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Arranca como "todo apretado": un botón que venía apretado de la escena anterior
    // (por ejemplo START al pausar) no dispara nada hasta que se suelta.
    this.prevState = { up: true, down: true, left: true, right: true, confirm: true, cancel: true };
  }

  obtenerInput() {
    let padActivo = null;
    let padUp = false, padDown = false, padLeft = false, padRight = false;
    let padA = false, padB = false, padStart = false;
    let stickX = 0, stickY = 0;

    // 1. Buscamos si hay algún joystick emitiendo señales para registrarlo
    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      this.scene.input.gamepad.gamepads.forEach(pad => {
        if (!pad) return;

        // VERIFICACIÓN SEGURA: evitamos usar pad.A o pad.up que causan crasheos
        const algunBotonApretado = pad.buttons.some(b => b && b.pressed);

        const sY = pad.leftStick ? pad.leftStick.y : 0;
        const sX = pad.leftStick ? pad.leftStick.x : 0;

        // Si tocás cualquier cosa
        if (algunBotonApretado || Math.abs(sX) > 0.5 || Math.abs(sY) > 0.5) {
          padActivo = pad;
          // ¡SELLO OFICIAL! El primer mando que se toca queda como el del Jugador 1 para toda la sesión
          // (si ya había uno, no se pisa: así el mando del J2 puede usar los menús sin robarle el lugar)
          if (this.scene.registry.get('padIndexP1') === undefined) {
            this.scene.registry.set('padIndexP1', pad.index);
          }
        }
      });
    }

    // 2. Si nadie tocó nada nuevo, leemos el mando que ya estaba registrado (si existe)
    if (!padActivo && this.scene.registry.get('padIndexP1') !== undefined && this.scene.input.gamepad) {
       padActivo = this.scene.input.gamepad.getPad(this.scene.registry.get('padIndexP1'));
    }

    // 3. Lectura de inputs blindada contra botones indefinidos
    if (padActivo) {
        stickY = padActivo.leftStick ? padActivo.leftStick.y : 0;
        stickX = padActivo.leftStick ? padActivo.leftStick.x : 0;

        padUp = padActivo.buttons[12] && padActivo.buttons[12].pressed;
        padDown = padActivo.buttons[13] && padActivo.buttons[13].pressed;
        padLeft = padActivo.buttons[14] && padActivo.buttons[14].pressed;
        padRight = padActivo.buttons[15] && padActivo.buttons[15].pressed;

        padA = padActivo.buttons[0] && padActivo.buttons[0].pressed;
        padB = padActivo.buttons[1] && padActivo.buttons[1].pressed;
        padStart = padActivo.buttons[9] && padActivo.buttons[9].pressed;
    }

    const isUp = this.cursors.up.isDown || padUp || stickY < -0.5;
    const isDown = this.cursors.down.isDown || padDown || stickY > 0.5;
    const isLeft = this.cursors.left.isDown || padLeft || stickX < -0.5;
    const isRight = this.cursors.right.isDown || padRight || stickX > 0.5;

    const isConfirm = this.enterKey.isDown || this.spaceKey.isDown || padA;
    const isCancel = this.escKey.isDown || padB || padStart;

    const result = {
      up: isUp && !this.prevState.up,
      down: isDown && !this.prevState.down,
      left: isLeft && !this.prevState.left,
      right: isRight && !this.prevState.right,
      confirm: isConfirm && !this.prevState.confirm,
      cancel: isCancel && !this.prevState.cancel
    };

    this.prevState = { up: isUp, down: isDown, left: isLeft, right: isRight, confirm: isConfirm, cancel: isCancel };

    return result;
  }
}

// Texto de una opción de volumen: "MÚSICA     < |||||..... >"
export function barraVolumen(etiqueta, valor) {
  return `${etiqueta.padEnd(10, ' ')} < ${'|'.repeat(valor)}${'.'.repeat(10 - valor)} >`;
}

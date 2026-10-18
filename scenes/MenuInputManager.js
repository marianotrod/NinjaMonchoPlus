export default class MenuInputManager {
  constructor(scene) {
    this.scene = scene;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.prevState = { up: false, down: false, left: false, right: false, confirm: false, cancel: false };
  }

  obtenerInput() {
    let padActivo = null;

    // 1. Buscamos si hay algún joystick emitiendo señales para registrarlo
    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      this.scene.input.gamepad.gamepads.forEach(pad => {
        if (!pad) return;
        const stickY = pad.leftStick ? pad.leftStick.y : 0;
        const stickX = pad.leftStick ? pad.leftStick.x : 0;
        
        // Si tocás un botón, la cruceta o movés el analógico
        if (pad.up || pad.down || pad.left || pad.right || pad.A || pad.B || Math.abs(stickX) > 0.5 || Math.abs(stickY) > 0.5) {
          padActivo = pad;
          // ¡SELLO OFICIAL! Registramos este mando como el del Jugador 1 para toda la sesión
          this.scene.registry.set('padIndexP1', pad.index);
        }
      });
    }

    // 2. Si nadie tocó nada nuevo, leemos el mando que ya estaba registrado (si existe)
    if (!padActivo && this.scene.registry.get('padIndexP1') !== undefined) {
       padActivo = this.scene.input.gamepad.getPad(this.scene.registry.get('padIndexP1'));
    }

    const stickY = (padActivo && padActivo.leftStick) ? padActivo.leftStick.y : 0;
    const stickX = (padActivo && padActivo.leftStick) ? padActivo.leftStick.x : 0;

    const isUp = this.cursors.up.isDown || (padActivo && (padActivo.up || stickY < -0.5));
    const isDown = this.cursors.down.isDown || (padActivo && (padActivo.down || stickY > 0.5));
    const isLeft = this.cursors.left.isDown || (padActivo && (padActivo.left || stickX < -0.5));
    const isRight = this.cursors.right.isDown || (padActivo && (padActivo.right || stickX > 0.5));
    
    const isConfirm = this.enterKey.isDown || this.spaceKey.isDown || (padActivo && padActivo.A);
    const isCancel = this.escKey.isDown || (padActivo && (padActivo.B || padActivo.start));

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
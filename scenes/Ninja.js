export default class Ninja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura = 'ninja', configTeclado = null, animPrefix = 'moncho') {
    super(scene, x, y, textura);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.sceneRef = scene;
    this.animPrefix = animPrefix;

    this.setGravityY(600);
    this.setCollideWorldBounds(true);
    this.body.setSize(10, 16);
    this.body.setOffset(3, 0);

    this.isStunned = false;
    this.isInvul = false;
    this.isSpawning = true; 
    
    // --- VARIABLES DE HABILIDADES Y CONTROL ---
    this.isWallJumping = false;
    this.isDashing = false;
    this.tieneControlAereo = true; 
    this.bufferSaltoTimer = 0; 
    this.coyoteTimer = 0; 
    this.dropThroughTimer = 0; 
    this.tiempoUltimoTap = { left: 0, right: 0 };
    this.delayDobleTap = 250; 

    // --- NUEVO: SISTEMA DE DOBLE CANDADO PARA EL DASH ---
    this.dashDisponible = true; 
    this.ultimoDashTimer = 0; 
    this.dashCooldown = 500; // 500ms de tiempo mínimo entre dashes

    // Banderas para interactuar con plataformas
    this.quiereAtravesarOneWay = false;
    this.bloquearCaidaPesada = false;

    if (configTeclado) {
      this.teclas = configTeclado;
    } else {
      this.teclas = scene.input.keyboard.createCursorKeys();
    }

    // --- SISTEMA DE HABILIDADES MODULARES ---
    this.habilidades = {
      dobleSalto: true, 
      dash: true, 
      wallJump: true,
      caidaPesada: true
    };

    // ÍNDICE DEL GAMEPAD ASIGNADO DINÁMICAMENTE POR LA ESCENA
    this.assignedPadIndex = null;

    this.prevPadState = { left: false, right: false, down: false, A: false, R1: false };

    this.estadoDebugHabilidades = 0; 
    this.saltoExtraDisponible = false;
    this.teclaDebug = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    
    this.teclaAvPag = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
  }

  // MÉTODO PARA ASIGNAR EL PAD DESDE LA ESCENA
  asignarPadIndex(index) {
    this.assignedPadIndex = index;
  }

  tieneHabilidad(nombre) {
    if (this.estadoDebugHabilidades === 1) return true;
    if (this.estadoDebugHabilidades === 2) return false;
    return this.habilidades[nombre];
  }

  obtenerInputs() {
    let pad = null;
    if (this.assignedPadIndex !== null && this.sceneRef.input.gamepad && this.sceneRef.input.gamepad.total > this.assignedPadIndex) {
      pad = this.sceneRef.input.gamepad.getPad(this.assignedPadIndex);
    }

    const stickIzqX = (pad && pad.leftStick) ? pad.leftStick.x : 0;
    const stickIzqY = (pad && pad.leftStick) ? pad.leftStick.y : 0;
    const stickDerX = (pad && pad.rightStick) ? pad.rightStick.x : 0;
    const stickDerY = (pad && pad.rightStick) ? pad.rightStick.y : 0;

    const padLeft = pad ? (pad.left || stickIzqX < -0.5 || stickDerX < -0.5) : false;
    const padRight = pad ? (pad.right || stickIzqX > 0.5 || stickDerX > 0.5) : false;
    const padDown = pad ? (pad.down || stickIzqY > 0.5 || stickDerY > 0.5) : false;
    
    const padA = pad ? pad.A : false; 
    const padR1 = pad ? pad.R1 : false; 

    const padLeftJustDown = padLeft && !this.prevPadState.left;
    const padRightJustDown = padRight && !this.prevPadState.right;
    const padAJustDown = padA && !this.prevPadState.A;
    const padR1JustDown = padR1 && !this.prevPadState.R1;

    this.prevPadState = { left: padLeft, right: padRight, down: padDown, A: padA, R1: padR1 };

    return {
      leftIsDown: this.teclas.left.isDown || padLeft,
      rightIsDown: this.teclas.right.isDown || padRight,
      downIsDown: this.teclas.down.isDown || padDown,
      upIsDown: this.teclas.up.isDown || padA, 
      
      leftJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.left) || padLeftJustDown,
      rightJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.right) || padRightJustDown,
      upJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.up) || padAJustDown, 
      
      dashJustDown: padR1JustDown 
    };
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.teclaDebug)) {
      this.estadoDebugHabilidades = (this.estadoDebugHabilidades + 1) % 3;
      let colorVisual;
      if (this.estadoDebugHabilidades === 0) {
          colorVisual = 0xffffff;
          console.log(`${this.animPrefix}: ESTADO NORMAL`);
      } else if (this.estadoDebugHabilidades === 1) {
          colorVisual = 0xFBBF24;
          console.log(`${this.animPrefix}: TODO DESBLOQUEADO`);
      } else {
          colorVisual = 0xEF4444;
          console.log(`${this.animPrefix}: TODO BLOQUEADO`);
      }
      this.setTint(colorVisual);
      this.sceneRef.time.delayedCall(300, () => this.clearTint());
    }

    if (Phaser.Input.Keyboard.JustDown(this.teclaAvPag)) {
      if (typeof this.sceneRef.toggleModoDiosWinLose === 'function') {
        this.sceneRef.toggleModoDiosWinLose();
      } else {
        this.sceneRef.modoDiosActivo = !this.sceneRef.modoDiosActivo;
        console.log("Modo Test Win/Lose:", this.sceneRef.modoDiosActivo ? "ACTIVADO (Inmune a derrota/victoria)" : "DESACTIVADO (Normal)");
      }
      this.setTint(this.sceneRef.modoDiosActivo ? 0x00FFFF : 0xFFFFFF);
      this.sceneRef.time.delayedCall(400, () => this.clearTint());
    }

    const input = this.obtenerInputs();

    if (this.isSpawning) {
      this.setVelocityX(0); 
      this.anims.play(`${this.animPrefix}-caer`, true);
      if (this.body.touching.down || this.body.blocked.down) {
        this.isSpawning = false; 
      } else {
        return; 
      }
    }

    if (this.isStunned) {
      this.anims.play(`${this.animPrefix}-stun`, true);
      return;
    }

    if (this.isDashing) {
        return; 
    }

    const tiempoActual = this.sceneRef.time.now;

    if (input.upJustDown) {
      this.bufferSaltoTimer = tiempoActual + 150; 
    }
    let quiereSaltar = tiempoActual < this.bufferSaltoTimer;

    // --- DETECCIÓN DE ENTORNO ---
    let enElPiso = this.body.touching.down || this.body.blocked.down;
    const tocandoParedIzquierda = this.body.blocked.left || this.body.touching.left;
    const tocandoParedDerecha = this.body.blocked.right || this.body.touching.right;
    const tocandoPared = tocandoParedIzquierda || tocandoParedDerecha;

    // RECARGA DE DASH POR ENTORNO
    if (enElPiso || tocandoPared) {
      this.dashDisponible = true;
    }

    // EL DOBLE CANDADO: ¿Tiene la habilidad? Y ¿Pasó el cooldown? Y ¿Tocó el piso/pared/enemigo?
    const puedeDashear = this.tieneHabilidad('dash') && this.dashDisponible && (tiempoActual >= this.ultimoDashTimer);

    if (input.leftJustDown) {
        if (tiempoActual - this.tiempoUltimoTap.left < this.delayDobleTap && puedeDashear) {
            this.ejecutarDash(-1);
            return;
        }
        this.tiempoUltimoTap.left = tiempoActual;
    }

    if (input.rightJustDown) {
        if (tiempoActual - this.tiempoUltimoTap.right < this.delayDobleTap && puedeDashear) {
            this.ejecutarDash(1);
            return;
        }
        this.tiempoUltimoTap.right = tiempoActual;
    }

    if (input.dashJustDown && puedeDashear) {
        const direccion = input.leftIsDown ? -1 : (input.rightIsDown ? 1 : (this.flipX ? -1 : 1));
        this.ejecutarDash(direccion);
        return;
    }

    if (enElPiso && input.downIsDown) {
      this.bloquearCaidaPesada = true;
    }
    if (!input.downIsDown) {
      this.bloquearCaidaPesada = false;
    }

    if (enElPiso) {
      this.tieneControlAereo = true;
      this.body.allowGravity = true;
      this.coyoteTimer = tiempoActual + 100; 
      if (this.tieneHabilidad('dobleSalto')) {
        this.saltoExtraDisponible = true;
      }
    }
    const puedeUsarCoyote = tiempoActual < this.coyoteTimer;

    if (enElPiso && input.downIsDown) {
      this.dropThroughTimer = tiempoActual + 200; 
    }
    this.quiereAtravesarOneWay = (tiempoActual < this.dropThroughTimer);

    const wallJumpIzquierda = tocandoParedIzquierda && quiereSaltar;
    const wallJumpDerecha = tocandoParedDerecha && quiereSaltar;

    if (!enElPiso && (wallJumpIzquierda || wallJumpDerecha) && this.tieneHabilidad('wallJump')) {
      this.isWallJumping = true; 
      this.tieneControlAereo = false; 
      this.bufferSaltoTimer = 0; 
      quiereSaltar = false; 
      this.setVelocityY(-330); 
      
      if (tocandoParedIzquierda) {
        this.setVelocityX(280); 
        this.setFlipX(false);
      } else {
        this.setVelocityX(-280); 
        this.setFlipX(true);
      }
      
      this.sceneRef.reproducirSonido('snd-salto', 1.2);
    }

    if (this.isWallJumping && !this.bloqueoWallJumpConfigurado) {
      this.bloqueoWallJumpConfigurado = true;
      this.sceneRef.time.delayedCall(250, () => {
        this.isWallJumping = false;
        this.bloqueoWallJumpConfigurado = false;
      });
    }

    if ((enElPiso || puedeUsarCoyote) && quiereSaltar) {
      this.setVelocityY(-420);
      enElPiso = false; 
      this.bufferSaltoTimer = 0; 
      this.coyoteTimer = 0; 
      quiereSaltar = false; 
      this.sceneRef.reproducirSonido('snd-salto', 1);
    }

    if (!enElPiso && input.downIsDown && !this.bloquearCaidaPesada && this.tieneHabilidad('caidaPesada')) {
      this.setVelocityY(480);
    }

    if (!enElPiso && !this.tieneControlAereo) {
      if (!input.leftIsDown && !input.rightIsDown) {
        this.tieneControlAereo = true;
      }
    }

    if (!this.isWallJumping) {
      if (enElPiso || this.tieneControlAereo) {
        let velocidadObjetivo = 0; 
        let tocandoDireccion = false;

        if (input.leftIsDown) {
          velocidadObjetivo = -140;
          this.setFlipX(true);
          tocandoDireccion = true;
        } else if (input.rightIsDown) {
          velocidadObjetivo = 140;
          this.setFlipX(false);
          tocandoDireccion = true;
        }

        if (tocandoDireccion) {
          const nuevaVelocidadX = Phaser.Math.Linear(this.body.velocity.x, velocidadObjetivo, 0.3);
          this.setVelocityX(nuevaVelocidadX);
        } else {
          if (enElPiso) {
            const nuevaVelocidadX = Phaser.Math.Linear(this.body.velocity.x, 0, 0.3);
            if (Math.abs(nuevaVelocidadX) < 5) {
              this.setVelocityX(0);
            } else {
              this.setVelocityX(nuevaVelocidadX);
            }
          }
        }
      }
    }

    if (!enElPiso && !this.isWallJumping) {
      if (quiereSaltar && this.saltoExtraDisponible && this.tieneHabilidad('dobleSalto')) {
        this.setVelocityY(-350); 
        this.saltoExtraDisponible = false; 
        this.bufferSaltoTimer = 0; 
        quiereSaltar = false; 
        this.sceneRef.reproducirSonido('snd-salto', 1.2); 
        this.setAlpha(0.5);
        this.sceneRef.time.delayedCall(150, () => this.setAlpha(1));
      }
      
      if (tocandoPared && this.body.velocity.y > 0) {
        this.setVelocityY(this.body.velocity.y * 0.8);
      }
    }

    if (this.isDashing) {
      this.anims.play(`${this.animPrefix}-saltar`, true);
    } else if (this.isWallJumping) {
      this.anims.play(`${this.animPrefix}-saltar`, true); 
    } else if (tocandoPared && !enElPiso && this.body.velocity.y > 0) {
      this.anims.play(`${this.animPrefix}-caer`, true);
    } else if (!enElPiso) {
      if (this.body.velocity.y < 0) {
        this.anims.play(`${this.animPrefix}-saltar`, true);
      } else {
        this.anims.play(`${this.animPrefix}-caer`, true);
      }
    } else {
      if (this.body.velocity.x !== 0) {
        this.anims.play(`${this.animPrefix}-caminar`, true);
      } else {
        this.anims.play(`${this.animPrefix}-idle`, true);
      }
    }
  }

  ejecutarDash(direccion) {
    this.isDashing = true;
    this.dashDisponible = false; // Consumimos la recarga
    this.ultimoDashTimer = this.sceneRef.time.now + this.dashCooldown; // Arrancamos el cooldown

    this.body.allowGravity = false; 
    this.setVelocityY(0); 
    
    this.setVelocityX(direccion * 350); 
    this.setFlipX(direccion === -1);
    this.setAlpha(0.6);

    this.sceneRef.time.delayedCall(200, () => {
        this.isDashing = false;
        this.body.allowGravity = true; 
        this.setAlpha(1);
        this.setVelocityX(this.body.velocity.x * 0.4); 
    });
  }

  aplicarDaño(demonioX) {
    if (this.sceneRef.modoDiosActivo) return;
    if (this.isInvul || this.isSpawning) return; 

    this.isStunned = true;
    this.isInvul = true;
    this.setVelocity(this.x < demonioX ? -180 : 180, -220);

    this.sceneRef.time.delayedCall(500, () => {
      this.isStunned = false;
      this.sceneRef.tweens.add({
        targets: this,
        alpha: 0.2,
        duration: 100,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          this.isInvul = false;
          this.setAlpha(1);
        }
      });
    });
  }

  hacerPisoton() {
    this.dashDisponible = true; // El combate aéreo recarga el dash
    this.ultimoDashTimer = 0; // Premia al jugador reseteando también el cooldown

    this.setVelocityY(-450);
    this.sceneRef.reproducirSonido('snd-salto', 1);

    this.isInvul = true;
    this.sceneRef.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.isInvul = false;
        this.setAlpha(1);
      }
    });
  }
}
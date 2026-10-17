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
      dobleSalto: true, // Probá ponerlo en true
      dash: true, 
      wallJump: true,
      caidaPesada: true
    };

    this.estadoDebugHabilidades = 0; 
    this.saltoExtraDisponible = false;
    this.teclaDebug = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    
    // Tecla AvPág (Page Down) para desactivar Win/Lose
    this.teclaAvPag = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
  }

  tieneHabilidad(nombre) {
    if (this.estadoDebugHabilidades === 1) return true;
    if (this.estadoDebugHabilidades === 2) return false;
    return this.habilidades[nombre];
  }

  update() {
    // --- MODO DEBUG: BACKSPACE (ESTADOS DE HABILIDADES) ---
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

    // --- MODO DEBUG: AV PÁG (TOGGLE WIN/LOSE EN LA ESCENA) ---
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

    // --- ESTADO DE SPAWN ---
    if (this.isSpawning) {
      this.setVelocityX(0); 
      this.anims.play(`${this.animPrefix}-caer`, true);
      if (this.body.touching.down || this.body.blocked.down) {
        this.isSpawning = false; 
      } else {
        return; 
      }
    }

    // --- ESTADO STUN ---
    if (this.isStunned) {
      this.anims.play(`${this.animPrefix}-stun`, true);
      return;
    }

    // --- SI ESTÁ DASHEANDO, IGNORAMOS EL RESTO DEL CONTROL ---
    if (this.isDashing) {
        return; 
    }

    const tiempoActual = this.sceneRef.time.now;

    // --- BUFFER DE SALTO ---
    if (Phaser.Input.Keyboard.JustDown(this.teclas.up)) {
      this.bufferSaltoTimer = tiempoActual + 150; 
    }
    // FIX: Usamos 'let' para poder "consumir" el salto una vez utilizado
    let quiereSaltar = tiempoActual < this.bufferSaltoTimer;

    // --- DETECCIÓN DE DOBLE TAP (DASH) ---
    if (Phaser.Input.Keyboard.JustDown(this.teclas.left)) {
        if (tiempoActual - this.tiempoUltimoTap.left < this.delayDobleTap && this.tieneHabilidad('dash')) {
            this.ejecutarDash(-1);
            return;
        }
        this.tiempoUltimoTap.left = tiempoActual;
    }

    if (Phaser.Input.Keyboard.JustDown(this.teclas.right)) {
        if (tiempoActual - this.tiempoUltimoTap.right < this.delayDobleTap && this.tieneHabilidad('dash')) {
            this.ejecutarDash(1);
            return;
        }
        this.tiempoUltimoTap.right = tiempoActual;
    }

    // --- DETECCIÓN DE ENTORNO (PISO Y PAREDES) ---
    let enElPiso = this.body.touching.down || this.body.blocked.down;
    const tocandoParedIzquierda = this.body.blocked.left || this.body.touching.left;
    const tocandoParedDerecha = this.body.blocked.right || this.body.touching.right;
    const tocandoPared = tocandoParedIzquierda || tocandoParedDerecha;

    // --- SEGUIMIENTO DE LA TECLA ABAJO (Para separar acciones) ---
    if (enElPiso && this.teclas.down.isDown) {
      this.bloquearCaidaPesada = true;
    }
    if (!this.teclas.down.isDown) {
      this.bloquearCaidaPesada = false;
    }

    // --- COYOTE TIME ---
    if (enElPiso) {
      this.tieneControlAereo = true;
      this.body.allowGravity = true;
      this.coyoteTimer = tiempoActual + 100; 
      if (this.tieneHabilidad('dobleSalto')) {
        this.saltoExtraDisponible = true;
      }
    }
    const puedeUsarCoyote = tiempoActual < this.coyoteTimer;

    // --- AVISO AL MAPA: INTENCIÓN DE ATRAVESAR ONE-WAY ---
    if (enElPiso && this.teclas.down.isDown) {
      this.dropThroughTimer = tiempoActual + 200; 
    }
    this.quiereAtravesarOneWay = (tiempoActual < this.dropThroughTimer);

    // --- WALL JUMP UNIVERSAL ---
    const wallJumpIzquierda = tocandoParedIzquierda && quiereSaltar;
    const wallJumpDerecha = tocandoParedDerecha && quiereSaltar;

    if (!enElPiso && (wallJumpIzquierda || wallJumpDerecha) && this.tieneHabilidad('wallJump')) {
      this.isWallJumping = true; 
      this.tieneControlAereo = false; 
      this.bufferSaltoTimer = 0; 
      quiereSaltar = false; // Consumimos el salto
      this.setVelocityY(-330); 
      
      if (tocandoParedIzquierda) {
        this.setVelocityX(160); 
        this.setFlipX(false);
      } else {
        this.setVelocityX(-160); 
        this.setFlipX(true);
      }
      
      this.sceneRef.reproducirSonido('snd-salto', 1.2);
    }

    // --- LÓGICA DE RECUPERACIÓN DE CONTROL PARA ZIGZAG ---
    if (this.isWallJumping && !this.bloqueoWallJumpConfigurado) {
      this.bloqueoWallJumpConfigurado = true;
      this.sceneRef.time.delayedCall(200, () => {
        this.isWallJumping = false;
        this.bloqueoWallJumpConfigurado = false;
      });
    }

    // --- SALTO NORMAL (DESDE EL PISO O USANDO COYOTE TIME) ---
    if ((enElPiso || puedeUsarCoyote) && quiereSaltar) {
      this.setVelocityY(-420);
      enElPiso = false; 
      this.bufferSaltoTimer = 0; 
      this.coyoteTimer = 0; 
      quiereSaltar = false; // FIX: Consumimos el salto para que no haga el doble salto al instante
      this.sceneRef.reproducirSonido('snd-salto', 1);
    }

    // --- CAÍDA PESADA / HARD DROP ---
    if (!enElPiso && this.teclas.down.isDown && !this.bloquearCaidaPesada && this.tieneHabilidad('caidaPesada')) {
      this.setVelocityY(480);
    }

    // --- RE-ENGANCHE DE CONTROL AÉREO ---
    if (!enElPiso && !this.tieneControlAereo) {
      if (!this.teclas.left.isDown && !this.teclas.right.isDown) {
        this.tieneControlAereo = true;
      }
    }

    // --- MOVIMIENTO LATERAL ---
    if (!this.isWallJumping) {
      if (enElPiso || this.tieneControlAereo) {
        let velocidadObjetivo = 0; 
        let tocandoDireccion = false;

        if (this.teclas.left.isDown) {
          velocidadObjetivo = -140;
          this.setFlipX(true);
          tocandoDireccion = true;
        } else if (this.teclas.right.isDown) {
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

    // --- LÓGICA DE DOBLE SALTO Y FRICCIÓN DE PARED AUTOMÁTICA ---
    if (!enElPiso && !this.isWallJumping) {
      if (quiereSaltar && this.saltoExtraDisponible && this.tieneHabilidad('dobleSalto')) {
        this.setVelocityY(-350); 
        this.saltoExtraDisponible = false; 
        this.bufferSaltoTimer = 0; 
        quiereSaltar = false; // Consumimos el salto
        this.sceneRef.reproducirSonido('snd-salto', 1.2); 
        this.setAlpha(0.5);
        this.sceneRef.time.delayedCall(150, () => this.setAlpha(1));
      }
      
      if (tocandoPared && this.body.velocity.y > 0) {
        this.setVelocityY(this.body.velocity.y * 0.8);
      }
    }

    // --- ANIMACIONES ---
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

  // --- FUNCIÓN DE DASH MODULAR ---
  ejecutarDash(direccion) {
    this.isDashing = true;
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
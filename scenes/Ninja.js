import { DEBUG, FISICA, PAD } from '../config.js';
import { MODS_JUGADOR_BASE } from './Pactos.js';
import { ARMAS, dispararArma } from './Armas.js';
import { Sonido } from './Sonido.js';

// Lectura segura de un botón del joystick (algunos mandos no reportan todos los botones)
const boton = (pad, indice) => !!(pad && pad.buttons[indice] && pad.buttons[indice].pressed);

export default class Ninja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura = 'ninja', configTeclado = null, animPrefix = 'moncho', indice = 0) {
    super(scene, x, y, textura);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.sceneRef = scene;
    this.animPrefix = animPrefix;
    this.indice = indice; // 0 = Jugador 1, 1 = Jugador 2

    // Modificadores de los Pergaminos de Pacto elegidos para este nivel
    const pactos = scene.partida ? scene.partida.pactos.jugadores[indice] : {};
    this.mods = { ...MODS_JUGADOR_BASE, ...pactos };
    this.factorSalto = Math.sqrt(this.mods.salto); // +25 % de altura = velocidad * raíz(1,25)

    this.setGravityY(FISICA.gravedadJugador);
    this.setCollideWorldBounds(true);
    this.body.setSize(10, 16);
    this.body.setOffset(3, 0);
    this.setDepth(10);

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
    this.delayDobleTap = FISICA.dobleToque;
    this.saltoCortable = false;

    // --- NUEVO: SISTEMA DE DOBLE CANDADO PARA EL DASH ---
    this.dashDisponible = true;
    this.ultimoDashTimer = 0;
    this.dashCooldown = FISICA.dashCooldown; // Tiempo mínimo entre dashes

    // --- COMBATE ---
    this.katana = null;
    this.katanaGolpeados = new Set();
    this.ultimoAtaque = -9999;
    this.arma = null;
    this.municion = 0;
    this.bumeranActivo = null;

    // Banderas para interactuar con plataformas
    this.quiereAtravesarOneWay = false;
    this.bloquearCaidaPesada = false;

    if (configTeclado) {
      this.teclas = configTeclado;
    } else {
      this.teclas = scene.input.keyboard.createCursorKeys();
      this.teclas.ataque = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      this.teclas.especial = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
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

    this.prevPadState = { left: false, right: false, down: false, A: false, R1: false, X: false, Y: false };

    this.estadoDebugHabilidades = 0;
    this.saltoExtraDisponible = false;
    if (DEBUG) {
      this.teclaDebug = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
      this.teclaAvPag = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
    }
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

  obtenerPad() {
    const gamepad = this.sceneRef.input.gamepad;
    if (this.assignedPadIndex === null || !gamepad || gamepad.total === 0) return null;
    return gamepad.getPad(this.assignedPadIndex) || null;
  }

  obtenerInputs() {
    const pad = this.obtenerPad();

    const stickIzqX = (pad && pad.leftStick) ? pad.leftStick.x : 0;
    const stickIzqY = (pad && pad.leftStick) ? pad.leftStick.y : 0;
    const stickDerX = (pad && pad.rightStick) ? pad.rightStick.x : 0;
    const stickDerY = (pad && pad.rightStick) ? pad.rightStick.y : 0;

    const padLeft = pad ? (pad.left || stickIzqX < -0.5 || stickDerX < -0.5) : false;
    const padRight = pad ? (pad.right || stickIzqX > 0.5 || stickDerX > 0.5) : false;
    const padDown = pad ? (pad.down || stickIzqY > 0.5 || stickDerY > 0.5) : false;

    const padA = boton(pad, PAD.A);
    const padR1 = boton(pad, PAD.R1);
    const padX = boton(pad, PAD.X);
    const padY = boton(pad, PAD.Y);

    const padLeftJustDown = padLeft && !this.prevPadState.left;
    const padRightJustDown = padRight && !this.prevPadState.right;
    const padAJustDown = padA && !this.prevPadState.A;
    const padR1JustDown = padR1 && !this.prevPadState.R1;
    const padXJustDown = padX && !this.prevPadState.X;
    const padYJustDown = padY && !this.prevPadState.Y;

    this.prevPadState = { left: padLeft, right: padRight, down: padDown, A: padA, R1: padR1, X: padX, Y: padY };

    return {
      leftIsDown: this.teclas.left.isDown || padLeft,
      rightIsDown: this.teclas.right.isDown || padRight,
      downIsDown: this.teclas.down.isDown || padDown,
      upIsDown: this.teclas.up.isDown || padA,

      leftJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.left) || padLeftJustDown,
      rightJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.right) || padRightJustDown,
      upJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.up) || padAJustDown,

      dashJustDown: padR1JustDown,
      ataqueJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.ataque) || padXJustDown,
      especialJustDown: Phaser.Input.Keyboard.JustDown(this.teclas.especial) || padYJustDown
    };
  }

  actualizarDebug() {
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
      this.sceneRef.modoDiosActivo = !this.sceneRef.modoDiosActivo;
      console.log("Modo Test Win/Lose:", this.sceneRef.modoDiosActivo ? "ACTIVADO (Inmune a derrota/victoria)" : "DESACTIVADO (Normal)");
      this.setTint(this.sceneRef.modoDiosActivo ? 0x00FFFF : 0xFFFFFF);
      this.sceneRef.time.delayedCall(400, () => this.clearTint());
    }
  }

  update() {
    if (DEBUG) this.actualizarDebug();

    const input = this.obtenerInputs();

    if (this.katana) {
      const direccion = this.flipX ? -1 : 1;
      this.katana.setPosition(this.x + direccion * 12, this.y).setFlipX(direccion < 0);
      this.sceneRef.procesarKatana(this);
    }

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

    if (input.ataqueJustDown) this.atacar();
    if (input.especialJustDown) this.usarEspecial();

    const tiempoActual = this.sceneRef.time.now;

    if (input.upJustDown) {
      this.bufferSaltoTimer = tiempoActual + FISICA.bufferSalto;
    }
    let quiereSaltar = tiempoActual < this.bufferSaltoTimer;

    // --- SALTO VARIABLE: soltar el botón en plena subida corta el salto ---
    if (this.body.velocity.y >= 0) this.saltoCortable = false;
    if (this.saltoCortable && !input.upIsDown) {
      this.setVelocityY(this.body.velocity.y * FISICA.corteSalto);
      this.saltoCortable = false;
    }

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
      this.coyoteTimer = tiempoActual + FISICA.coyote;
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
      this.setVelocityY(FISICA.saltoPared * this.factorSalto);
      this.saltoCortable = true;

      if (tocandoParedIzquierda) {
        this.setVelocityX(FISICA.empujePared);
        this.setFlipX(false);
      } else {
        this.setVelocityX(-FISICA.empujePared);
        this.setFlipX(true);
      }

      Sonido.efecto(this.sceneRef, 'snd-salto', 1.2);
    }

    if (this.isWallJumping && !this.bloqueoWallJumpConfigurado) {
      this.bloqueoWallJumpConfigurado = true;
      this.sceneRef.time.delayedCall(250, () => {
        this.isWallJumping = false;
        this.bloqueoWallJumpConfigurado = false;
      });
    }

    if ((enElPiso || puedeUsarCoyote) && quiereSaltar) {
      this.setVelocityY(FISICA.salto * this.factorSalto);
      enElPiso = false;
      this.bufferSaltoTimer = 0;
      this.coyoteTimer = 0;
      quiereSaltar = false;
      this.saltoCortable = true;
      Sonido.efecto(this.sceneRef, 'snd-salto', 1);
    }

    if (!enElPiso && input.downIsDown && !this.bloquearCaidaPesada && this.tieneHabilidad('caidaPesada')) {
      this.setVelocityY(FISICA.caidaRapida);
    }

    if (!enElPiso && !this.tieneControlAereo) {
      if (!input.leftIsDown && !input.rightIsDown) {
        this.tieneControlAereo = true;
      }
    }

    if (!this.isWallJumping) {
      if (enElPiso || this.tieneControlAereo) {
        const velocidadMaxima = FISICA.velocidadCarrera * this.mods.velocidad;
        let velocidadObjetivo = 0;
        let tocandoDireccion = false;

        if (input.leftIsDown) {
          velocidadObjetivo = -velocidadMaxima;
          this.setFlipX(true);
          tocandoDireccion = true;
        } else if (input.rightIsDown) {
          velocidadObjetivo = velocidadMaxima;
          this.setFlipX(false);
          tocandoDireccion = true;
        }

        if (tocandoDireccion) {
          const nuevaVelocidadX = Phaser.Math.Linear(this.body.velocity.x, velocidadObjetivo, FISICA.suavizado);
          this.setVelocityX(nuevaVelocidadX);
        } else {
          if (enElPiso) {
            const nuevaVelocidadX = Phaser.Math.Linear(this.body.velocity.x, 0, FISICA.suavizado);
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
        this.setVelocityY(FISICA.dobleSalto * this.factorSalto);
        this.saltoExtraDisponible = false;
        this.bufferSaltoTimer = 0;
        quiereSaltar = false;
        this.saltoCortable = true;
        Sonido.efecto(this.sceneRef, 'snd-salto', 1.2);
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
    this.saltoCortable = false;

    this.body.allowGravity = false;
    this.setVelocityY(0);

    this.setVelocityX(direccion * FISICA.dash * this.mods.velocidad);
    this.setFlipX(direccion === -1);
    this.setAlpha(0.6);

    this.sceneRef.time.delayedCall(FISICA.dashDuracion, () => {
        this.isDashing = false;
        this.body.allowGravity = true;
        this.setAlpha(1);
        this.setVelocityX(this.body.velocity.x * 0.4);
    });
  }

  // --- KATANA: tajo corto delante del ninja. Lo que toca lo resuelve la escena en procesarKatana() ---
  atacar() {
    const ahora = this.sceneRef.time.now;
    if (ahora < this.ultimoAtaque + FISICA.katanaCooldown) return;
    this.ultimoAtaque = ahora;

    const direccion = this.flipX ? -1 : 1;
    this.katanaGolpeados = new Set();
    this.katana = this.sceneRef.add.image(this.x + direccion * 12, this.y, 'katana-corte').setFlipX(direccion < 0).setDepth(15);
    Sonido.ruido(this.sceneRef, 0.06, 0.12);

    this.sceneRef.time.delayedCall(FISICA.katanaDuracion, () => {
      if (this.katana) {
        this.katana.destroy();
        this.katana = null;
      }
    });
  }

  usarEspecial() {
    if (!this.arma) {
      Sonido.beep(this.sceneRef, 140, 0.08, 0.08);
      return;
    }
    if (dispararArma(this.sceneRef, this)) {
      this.sceneRef.events.emit('arma-cambiada', this.indice, this.arma, this.municion);
    }
  }

  equiparArma(tipo) {
    this.arma = tipo;
    this.municion = ARMAS[tipo].municion;
    this.sceneRef.events.emit('arma-cambiada', this.indice, this.arma, this.municion);
  }

  municionInfinita() {
    return this.sceneRef.fase === 'caceria' && this.mods.municionInfinitaCaceria;
  }

  aplicarDaño(demonioX, parpadeos = 5) {
    if (this.sceneRef.modoDiosActivo) return false;
    if (this.isInvul || this.isSpawning) return false;

    this.isStunned = true;
    this.isInvul = true;
    this.saltoCortable = false;
    const knockback = this.mods.knockback;
    this.setVelocity((this.x < demonioX ? -FISICA.knockbackX : FISICA.knockbackX) * knockback, FISICA.knockbackY * knockback);
    Sonido.efecto(this.sceneRef, 'snd-stun', 0.5);

    this.sceneRef.time.delayedCall(FISICA.duracionStun, () => {
      this.isStunned = false;
      this.sceneRef.tweens.add({
        targets: this,
        alpha: 0.2,
        duration: 100,
        yoyo: true,
        repeat: parpadeos,
        onComplete: () => {
          this.isInvul = false;
          this.setAlpha(1);
        }
      });
    });
    return true;
  }

  // Empujón sin daño (explosiones y katanazos del compañero: "fuego amigo cinético")
  empujar(vx, vy) {
    if (this.isSpawning) return;
    this.setVelocity(vx, vy);
    this.saltoCortable = false;
  }

  hacerPisoton() {
    this.dashDisponible = true; // El combate aéreo recarga el dash
    this.ultimoDashTimer = 0; // Premia al jugador reseteando también el cooldown
    this.saltoExtraDisponible = this.tieneHabilidad('dobleSalto');
    this.saltoCortable = false;

    this.setVelocityY(FISICA.pisoton * this.factorSalto);
    Sonido.efecto(this.sceneRef, 'snd-salto', 1);

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

  destroy(fromScene) {
    if (this.katana) this.katana.destroy();
    this.katana = null;
    super.destroy(fromScene);
  }
}

// Ninja.js
// El jugador. Cada momento está en un solo estado (ESTADO): update() atiende el estado y, si el ninja está libre, actuar()
// aplica los controles en un orden fijo que importa para la sensación del movimiento.
// La protección también vive en un solo lugar: el estado y finProteccion, que lee el getter proteccion.
import { BANDO, CONFIG, DEBUG, FISICA } from '../config.js';
import Control from '../entrada/Control.js';
import { fueraDeVista } from '../mundo/Mundo.js';
import { MODS_JUGADOR_BASE } from '../reglas/Pactos.js';
import { PROTECCION } from '../reglas/Resolvedor.js';
import { ARMAS, dispararArma } from './Armas.js';
import { Sonido } from '../sistemas/Sonido.js';
import { EVENTOS } from '../datos/Eventos.js';

export const ESTADO = {
  APARECIENDO: 'apareciendo',   // Cae hasta tocar el piso, sin control
  LIBRE: 'libre',
  DASH: 'dash',
  SALTO_PARED: 'saltoPared',    // Un instante sin control horizontal después de saltar de la pared
  ATURDIDO: 'aturdido',
  MUERTO: 'muerto',             // Golpe que costó una vida: cae fuera de la pantalla atravesando el escenario
  ELIMINADO: 'eliminado'        // Sin vidas: queda fuera de la partida
};

export default class Ninja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura, teclas, animPrefix, indice) {
    super(scene, x, y, textura);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.sceneRef = scene;
    this.bando = BANDO.JUGADORES;
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

    this.estado = ESTADO.APARECIENDO;
    this.finAturdido = 0;
    this.finProteccion = 0;
    this.parpadeo = null;
    this.reaparece = false;   // Aparece después de morir: al tocar el piso sigue protegido un rato

    // --- VARIABLES DE HABILIDADES Y CONTROL ---
    this.tieneControlAereo = true;
    this.bufferSaltoTimer = 0;
    this.coyoteTimer = 0;
    this.dropThroughTimer = 0;
    this.tiempoUltimoTap = { left: 0, right: 0 };
    this.saltoCortable = false;

    // El dash pide dos cosas: que haya pasado el cooldown y que se haya recargado tocando piso, pared o un enemigo
    this.dashDisponible = true;
    this.ultimoDashTimer = 0;

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

    this.control = new Control(scene, teclas);

    // --- SISTEMA DE HABILIDADES MODULARES ---
    this.habilidades = {
      dobleSalto: true,
      dash: true,
      wallJump: true,
      caidaPesada: true
    };

    this.estadoDebugHabilidades = 0;
    this.saltoExtraDisponible = false;
    if (DEBUG) {
      this.teclaDebug = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
      this.teclaAvPag = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
    }
  }

  get muerto() { return this.estado === ESTADO.MUERTO; }
  get eliminado() { return this.estado === ESTADO.ELIMINADO; }
  get apareciendo() { return this.estado === ESTADO.APARECIENDO; }
  get aturdido() { return this.estado === ESTADO.ATURDIDO; }

  get proteccion() {
    const sinControl = this.apareciendo || this.aturdido || this.muerto;
    return sinControl || this.sceneRef.time.now < this.finProteccion ? PROTECCION.INTOCABLE : PROTECCION.NORMAL;
  }

  // Protección con parpadeo. Lo que dura está en finProteccion: el parpadeo es solo cómo se ve.
  proteger(ms, alfa = 0.2) {
    this.finProteccion = this.sceneRef.time.now + ms;
    this.parpadear(alfa);
  }

  parpadear(alfa) {
    this.dejarDeParpadear();
    this.parpadeo = this.sceneRef.tweens.add({ targets: this, alpha: alfa, duration: 100, yoyo: true, repeat: -1 });
  }

  dejarDeParpadear() {
    if (!this.parpadeo) return;
    this.parpadeo.remove();
    this.parpadeo = null;
    this.setAlpha(1);
  }

  tieneHabilidad(nombre) {
    if (this.estadoDebugHabilidades === 1) return true;
    if (this.estadoDebugHabilidades === 2) return false;
    return this.habilidades[nombre];
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
    if (this.eliminado) return;
    if (DEBUG) this.actualizarDebug();
    if (!this.apareciendo && this.sceneRef.time.now >= this.finProteccion) this.dejarDeParpadear();

    if (this.muerto) {
      this.anims.play(`${this.animPrefix}-stun`, true);
      if (!this.caidaAvisada && this.body.top > this.sceneRef.scale.height + 8) {
        this.caidaAvisada = true;
        this.sceneRef.jugadorCayoFuera(this);
      }
      return;
    }

    const input = this.control.leer();

    if (this.katana) {
      const direccion = this.flipX ? -1 : 1;
      this.katana.setPosition(this.x + direccion * 12, this.y).setFlipX(direccion < 0);
      this.sceneRef.procesarKatana(this);
    }

    // Cada estado sin control decide si ya terminó; si terminó, en este mismo cuadro el ninja actúa
    if (this.apareciendo && !this.terminoDeAparecer()) return;
    if (this.aturdido && !this.terminoAturdimiento()) return;
    if (this.estado === ESTADO.DASH) return;

    this.actuar(input);
  }

  terminoDeAparecer() {
    this.setVelocityX(0);
    this.anims.play(`${this.animPrefix}-caer`, true);
    if (!this.body.touching.down && !this.body.blocked.down) return false;
    this.estado = ESTADO.LIBRE;
    if (this.reaparece) {
      this.reaparece = false;
      this.finProteccion = this.sceneRef.time.now + CONFIG.INVUL_RESPAWN;
    }
    return true;
  }

  terminoAturdimiento() {
    if (this.sceneRef.time.now < this.finAturdido) {
      this.anims.play(`${this.animPrefix}-stun`, true);
      return false;
    }
    this.estado = ESTADO.LIBRE;
    this.proteger(FISICA.parpadeoGolpe);
    return true;
  }

  get enSaltoPared() {
    return this.estado === ESTADO.SALTO_PARED;
  }

  get quiereSaltar() {
    return this.sceneRef.time.now < this.bufferSaltoTimer;
  }

  // Los controles en orden. Cada salto o dash que se usa corta lo que sigue, así que este orden no se puede cambiar sin probar.
  actuar(input) {
    if (input.recienAtaque) this.atacar();
    if (input.recienEspecial) this.usarEspecial();

    const ahora = this.sceneRef.time.now;
    if (input.recienSalto) this.bufferSaltoTimer = ahora + FISICA.bufferSalto;
    this.cortarSaltoSiSuelta(input);

    let enElPiso = this.body.touching.down || this.body.blocked.down;
    // Fuera de la pantalla no hay agarre: si no, el ninja podría colgarse de una pared que no se ve
    const hayAgarre = !fueraDeVista(this);
    const paredIzquierda = hayAgarre && (this.body.blocked.left || this.body.touching.left);
    const paredDerecha = hayAgarre && (this.body.blocked.right || this.body.touching.right);
    const tocandoPared = paredIzquierda || paredDerecha;

    if (enElPiso || tocandoPared) this.dashDisponible = true;
    if (this.intentarDash(input, ahora)) return;

    this.prepararCaida(input, enElPiso, ahora);

    if (!enElPiso && tocandoPared) this.intentarSaltoPared(paredIzquierda);

    const puedeUsarCoyote = ahora < this.coyoteTimer;
    if ((enElPiso || puedeUsarCoyote) && this.quiereSaltar) {
      this.setVelocityY(FISICA.salto * this.factorSalto);
      enElPiso = false;
      this.bufferSaltoTimer = 0;
      this.coyoteTimer = 0;
      this.saltoCortable = true;
      Sonido.efecto(this.sceneRef, 'snd-salto', 1);
    }

    if (!enElPiso && input.abajo && !this.bloquearCaidaPesada && this.tieneHabilidad('caidaPesada')) {
      this.setVelocityY(FISICA.caidaRapida);
    }

    if (!enElPiso && !this.tieneControlAereo && !input.izquierda && !input.derecha) {
      this.tieneControlAereo = true;
    }
    if (!this.enSaltoPared && (enElPiso || this.tieneControlAereo)) this.moverHorizontal(input, enElPiso);

    if (!enElPiso && !this.enSaltoPared) {
      this.intentarDobleSalto();
      if (tocandoPared && this.body.velocity.y > 0) this.setVelocityY(this.body.velocity.y * 0.8);
    }

    this.animar(enElPiso);
  }

  // Salto variable: soltar el botón en plena subida corta el salto
  cortarSaltoSiSuelta(input) {
    if (this.body.velocity.y >= 0) this.saltoCortable = false;
    if (this.saltoCortable && !input.salto) {
      this.setVelocityY(this.body.velocity.y * FISICA.corteSalto);
      this.saltoCortable = false;
    }
  }

  intentarDash(input, ahora) {
    const puedeDashear = this.tieneHabilidad('dash') && this.dashDisponible && ahora >= this.ultimoDashTimer;
    const dobleToque = (lado, recien, direccion) => {
      if (!recien) return false;
      if (ahora - this.tiempoUltimoTap[lado] < FISICA.dobleToque && puedeDashear) {
        this.ejecutarDash(direccion);
        return true;
      }
      this.tiempoUltimoTap[lado] = ahora;
      return false;
    };
    if (dobleToque('left', input.recienIzquierda, -1) || dobleToque('right', input.recienDerecha, 1)) return true;

    if (input.recienDash && puedeDashear) {
      const mirando = this.flipX ? -1 : 1;
      this.ejecutarDash(input.izquierda ? -1 : (input.derecha ? 1 : mirando));
      return true;
    }
    return false;
  }

  // Lo que recarga el piso y las dos formas de usar abajo: caída pesada en el aire y atravesar pasarelas
  prepararCaida(input, enElPiso, ahora) {
    if (enElPiso && input.abajo) this.bloquearCaidaPesada = true;
    if (!input.abajo) this.bloquearCaidaPesada = false;

    if (enElPiso) {
      this.tieneControlAereo = true;
      this.body.allowGravity = true;
      this.coyoteTimer = ahora + FISICA.coyote;
      if (this.tieneHabilidad('dobleSalto')) this.saltoExtraDisponible = true;
      if (input.abajo) this.dropThroughTimer = ahora + 200;
    }
    this.quiereAtravesarOneWay = ahora < this.dropThroughTimer;
  }

  intentarSaltoPared(paredIzquierda) {
    if (!this.quiereSaltar || !this.tieneHabilidad('wallJump')) return;
    if (!this.enSaltoPared) {
      this.sceneRef.time.delayedCall(FISICA.bloqueoSaltoPared, () => {
        if (this.enSaltoPared) this.estado = ESTADO.LIBRE;
      });
    }
    this.estado = ESTADO.SALTO_PARED;
    this.tieneControlAereo = false;
    this.bufferSaltoTimer = 0;
    this.saltoCortable = true;
    this.setVelocityY(FISICA.saltoPared * this.factorSalto);
    this.setVelocityX(paredIzquierda ? FISICA.empujePared : -FISICA.empujePared);
    this.setFlipX(!paredIzquierda);
    Sonido.efecto(this.sceneRef, 'snd-salto', 1.2);
  }

  moverHorizontal(input, enElPiso) {
    const { velocity } = this.body;
    const tope = FISICA.velocidadCarrera * this.mods.velocidad;
    if (input.izquierda || input.derecha) {
      this.setFlipX(input.izquierda);
      this.setVelocityX(Phaser.Math.Linear(velocity.x, input.izquierda ? -tope : tope, FISICA.suavizado));
    } else if (enElPiso) {
      const frenando = Phaser.Math.Linear(velocity.x, 0, FISICA.suavizado);
      this.setVelocityX(Math.abs(frenando) < 5 ? 0 : frenando);
    }
  }

  intentarDobleSalto() {
    if (!this.quiereSaltar || !this.saltoExtraDisponible || !this.tieneHabilidad('dobleSalto')) return;
    this.setVelocityY(FISICA.dobleSalto * this.factorSalto);
    this.saltoExtraDisponible = false;
    this.bufferSaltoTimer = 0;
    this.saltoCortable = true;
    Sonido.efecto(this.sceneRef, 'snd-salto', 1.2);
    this.setAlpha(0.5);
    this.sceneRef.time.delayedCall(150, () => this.setAlpha(1));
  }

  animar(enElPiso) {
    const { velocity } = this.body;
    let animacion;
    if (this.enSaltoPared) animacion = 'saltar';
    else if (!enElPiso) animacion = velocity.y < 0 ? 'saltar' : 'caer';
    else animacion = velocity.x !== 0 ? 'caminar' : 'idle';
    this.anims.play(`${this.animPrefix}-${animacion}`, true);
  }

  ejecutarDash(direccion) {
    this.estado = ESTADO.DASH;
    this.dashDisponible = false;
    this.ultimoDashTimer = this.sceneRef.time.now + FISICA.dashCooldown;
    this.saltoCortable = false;

    this.body.allowGravity = false;
    this.setVelocityY(0);
    this.setVelocityX(direccion * FISICA.dash * this.mods.velocidad);
    this.setFlipX(direccion === -1);
    this.setAlpha(0.6);

    // Con un temporizador y no comparando la hora: un cuadro de diferencia cambia unos 6 px el largo del dash
    this.sceneRef.time.delayedCall(FISICA.dashDuracion, () => {
      if (this.estado !== ESTADO.DASH) return;
      this.estado = ESTADO.LIBRE;
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
      this.sceneRef.events.emit(EVENTOS.ARMA, this.indice, this.arma, this.municion);
    }
  }

  equiparArma(tipo) {
    this.arma = tipo;
    this.municion = ARMAS[tipo].municion;
    this.sceneRef.events.emit(EVENTOS.ARMA, this.indice, this.arma, this.municion);
  }

  municionInfinita() {
    return this.sceneRef.fase === 'caceria' && this.mods.municionInfinitaCaceria;
  }

  aplicarDaño(demonioX) {
    if (this.sceneRef.modoDiosActivo || this.proteccion === PROTECCION.INTOCABLE) return false;

    this.estado = ESTADO.ATURDIDO;
    this.finAturdido = this.sceneRef.time.now + FISICA.duracionStun;
    this.body.allowGravity = true;
    this.saltoCortable = false;
    const knockback = this.mods.knockback;
    this.setVelocity((this.x < demonioX ? -FISICA.knockbackX : FISICA.knockbackX) * knockback, FISICA.knockbackY * knockback);
    Sonido.efecto(this.sceneRef, 'snd-stun', 0.5);
    return true;
  }

  // Golpe que cuesta una vida: mismo empujón que un golpe común, pero sin chocar con el escenario ni con los
  // bordes del mundo, así cae fuera de la pantalla. La escena descuenta la vida cuando termina de caer.
  morir(fuenteX) {
    this.estado = ESTADO.MUERTO;
    this.caidaAvisada = false;
    this.saltoCortable = false;
    if (this.katana) {
      this.katana.destroy();
      this.katana = null;
    }
    this.dejarDeParpadear();
    this.sceneRef.tweens.killTweensOf(this);
    this.setAlpha(1).setDepth(60);
    this.setCollideWorldBounds(false);
    this.body.allowGravity = true;
    const knockback = this.mods.knockback;
    this.setVelocity((this.x < fuenteX ? -FISICA.knockbackX : FISICA.knockbackX) * knockback, FISICA.knockbackY * knockback);
    Sonido.efecto(this.sceneRef, 'snd-stun', 0.5);
  }

  // Vuelve a caer desde arriba como al empezar el nivel, y titila protegido un rato después de tocar el piso
  respawnear(x) {
    this.estado = ESTADO.APARECIENDO;
    this.reaparece = true;
    this.setDepth(10).setAlpha(1);
    this.setCollideWorldBounds(true);
    this.body.reset(x, -32);
    this.dashDisponible = true;
    this.parpadear(0.2);
  }

  // Sin vidas: deja de jugar y de ocupar lugar en la física
  retirar() {
    this.estado = ESTADO.ELIMINADO;
    this.parpadeo = null;
    if (this.katana) {
      this.katana.destroy();
      this.katana = null;
    }
    this.sceneRef.tweens.killTweensOf(this);
    this.body.enable = false;
    this.setActive(false).setVisible(false);
  }

  // Empujón sin daño (explosiones y katanazos del compañero: "fuego amigo cinético")
  empujar(vx, vy) {
    if (this.apareciendo || this.muerto || this.eliminado) return;
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

    this.proteger(FISICA.parpadeoPisoton, 0.5);
  }

  destroy(fromScene) {
    if (this.katana) this.katana.destroy();
    this.katana = null;
    super.destroy(fromScene);
  }
}

// Ninja.js
// El jugador. Cada momento está en un solo estado (ESTADO): update() atiende el estado y, si el ninja está libre, actuar()
// aplica los controles en un orden fijo que importa para la sensación del movimiento.
// La protección también vive en un solo lugar: el estado y finProteccion, que lee el getter proteccion.
import { BANDO, CONFIG, DEBUG, FISICA, MUNDO } from '../config.js';
import Control from '../entrada/Control.js';
import { fueraDeVista } from '../mundo/Mundo.js';
import { PROTECCION } from '../reglas/Resolvedor.js';
import { ARMAS, dispararArma, equiparEnPartida } from './Armas.js';
import { Sonido } from '../sistemas/Sonido.js';
import { EVENTOS } from '../datos/Eventos.js';
import { arrojarLlave } from '../mundo/Rescate.js';

export const ESTADO = {
  APARECIENDO: 'apareciendo',   // Cae hasta tocar el piso, sin control
  LIBRE: 'libre',
  DASH: 'dash',
  SALTO_PARED: 'saltoPared',    // Un instante sin control horizontal después de saltar de la pared
  ATURDIDO: 'aturdido',
  ATERRIZANDO: 'aterrizando',   // Cayó de muy alto: un momento sin control
  RODANDO: 'rodando',           // Boulder: rueda dañando a lo que toca, intocable
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

    // El build de este jugador: lo que le dieron los pergaminos. Es el mismo objeto que guarda la partida.
    this.mods = scene.partida.mods.jugadores[indice];
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
    this.alfaParpadeo = 0.2;
    this.reaparece = false;   // Aparece después de morir: al tocar el piso sigue protegido un rato

    // --- VARIABLES DE HABILIDADES Y CONTROL ---
    this.tieneControlAereo = true;
    this.bufferSaltoTimer = 0;
    this.coyoteTimer = 0;
    this.dropThroughTimer = 0;
    this.tiempoUltimoTap = { left: 0, right: 0 };
    this.saltoCortable = false;
    this.alturaCaida = 0;      // Lo que lleva cayendo desde que empezó a bajar (px)
    this.enAire = false;
    this.ultimoSalto = -9999;  // Cuándo apretó saltar por última vez: para el boulder

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

    // Movimientos especiales: el nivel de cada uno (0 = no lo tiene). Es el mismo objeto que guarda la partida.
    this.habilidades = scene.partida.habilidades[indice];
    this.proximoDisparo = 0;
    // El arma sigue de un nivel al otro, con la munición completa
    const arma = scene.partida.armas[indice];
    if (arma) {
      this.arma = arma.tipo;
      this.municion = arma.municion;
    }

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
  get rodando() { return this.estado === ESTADO.RODANDO; }

  get proteccion() {
    const sinControl = this.apareciendo || this.aturdido || this.muerto || this.rodando;
    const saltoProtegido = this.enSaltoPared && this.habilidades.wallJump >= 2; // Salto de pared nivel 2
    const protegido = sinControl || saltoProtegido || this.sceneRef.time.now < this.finProteccion;
    return protegido ? PROTECCION.INTOCABLE : PROTECCION.NORMAL;
  }

  // Lo que dura está en finProteccion. El parpadeo solo lo muestra, y lo maneja actualizarParpadeo.
  proteger(ms, alfa = 0.2) {
    this.finProteccion = this.sceneRef.time.now + ms;
    this.alfaParpadeo = alfa;
  }

  // Todo lo intocable parpadea mientras lo es
  actualizarParpadeo() {
    const intocable = !this.muerto && this.proteccion === PROTECCION.INTOCABLE;
    if (intocable && !this.parpadeo) this.parpadear(this.alfaParpadeo);
    else if (!intocable) {
      this.dejarDeParpadear();
      this.alfaParpadeo = 0.2;
    }
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
    if (this.estadoDebugHabilidades === 2 || this.sceneRef.reglas.soloBasico) return false;
    return this.habilidades[nombre] > 0;
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
    this.actualizarParpadeo();

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
      this.posicionarKatana();
      this.sceneRef.procesarKatana(this);
    }

    // Cada estado sin control decide si ya terminó; si terminó, en este mismo cuadro el ninja actúa
    if (this.apareciendo && !this.terminoDeAparecer()) return;
    if (this.aturdido && !this.terminoAturdimiento()) return;
    if (this.estado === ESTADO.ATERRIZANDO && !this.terminoAterrizaje()) return;
    if (this.rodando) {
      this.seguirRodando();
      return;
    }
    if (this.estado === ESTADO.DASH) return;
    // Ya eligió su pergamino: espera quieto a que termine la sala
    if (this.congelado) {
      this.setVelocityX(0);
      this.anims.play(`${this.animPrefix}-idle`, true);
      return;
    }

    this.actuar(input);
  }

  terminoDeAparecer() {
    this.setVelocityX(0);
    this.anims.play(`${this.animPrefix}-caer`, true);
    if (!this.body.touching.down && !this.body.blocked.down) return false;
    this.estado = ESTADO.LIBRE;
    this.finProteccion = this.sceneRef.time.now + (this.reaparece ? CONFIG.INVUL_RESPAWN : CONFIG.INVUL_INICIO);
    this.reaparece = false;
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
    if (input.recienAtaque) this.atacar({ arriba: input.arriba });
    if (input.recienEspecial) this.usarEspecial();

    const ahora = this.sceneRef.time.now;
    if (input.recienSalto) {
      this.bufferSaltoTimer = ahora + FISICA.bufferSalto;
      this.ultimoSalto = ahora;
    }
    this.cortarSaltoSiSuelta(input);

    let enElPiso = this.body.touching.down || this.body.blocked.down;
    // Fuera de la pantalla no hay agarre: si no, el ninja podría colgarse de una pared que no se ve
    const hayAgarre = !fueraDeVista(this);
    const paredIzquierda = hayAgarre && (this.body.blocked.left || this.body.touching.left);
    const paredDerecha = hayAgarre && (this.body.blocked.right || this.body.touching.right);
    const tocandoPared = paredIzquierda || paredDerecha;

    this.medirCaida(enElPiso, tocandoPared);
    if (enElPiso && this.enAire && this.aterrizar(ahora)) return;
    this.enAire = !enElPiso;

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
      this.enCaidaPesada = true;
    }
    // Caída pesada nivel 2: al golpear el piso salen dos bolas celestes
    if (enElPiso && this.enCaidaPesada) {
      this.enCaidaPesada = false;
      if (this.habilidades.caidaPesada >= 2 && !this.sceneRef.reglas.soloBasico) this.sceneRef.soltarBolasCelestes(this);
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
      const suavizado = enElPiso ? FISICA.suavizado : FISICA.suavizadoAire;
      this.setVelocityX(Phaser.Math.Linear(velocity.x, input.izquierda ? -tope : tope, suavizado));
    } else {
      // En el aire también frena al soltar, pero menos que en el piso
      const frenando = Phaser.Math.Linear(velocity.x, 0, enElPiso ? FISICA.suavizado : FISICA.frenadoAire);
      this.setVelocityX(Math.abs(frenando) < 5 ? 0 : frenando);
    }
  }

  intentarDobleSalto() {
    if (!this.quiereSaltar || !this.saltoExtraDisponible || !this.tieneHabilidad('dobleSalto')) return;
    // Con el boulder, saltar justo antes de tocar el piso desde muy alto es para rodar, no para el doble salto
    if (this.esperandoBoulder()) return;
    // Doble salto nivel 2: deja una plataforma fantasma bajo los pies
    if (this.habilidades.dobleSalto >= 2 && !this.sceneRef.reglas.soloBasico) this.sceneRef.dejarPlataforma(this);
    this.setVelocityY(FISICA.dobleSalto * this.factorSalto);
    this.saltoExtraDisponible = false;
    this.bufferSaltoTimer = 0;
    this.saltoCortable = true;
    Sonido.efecto(this.sceneRef, 'snd-salto', 1.2);
    this.setAlpha(0.5);
    this.sceneRef.time.delayedCall(150, () => this.setAlpha(1));
  }

  // --- CAER DE MUY ALTO Y BOULDER (CONFIG.CAIDA_ALTA y CONFIG.BOULDER) ---
  // Suma lo que baja. Subir o agarrarse de una pared lo reinicia. El salto del wrap (de abajo a arriba) no resta.
  medirCaida(enElPiso, tocandoPared) {
    const dy = this.body.deltaY();
    this.alturaAlAterrizar = enElPiso ? this.alturaCaida : 0;
    if (enElPiso || tocandoPared || this.body.velocity.y <= 0) this.alturaCaida = 0;
    else if (dy > 0 && dy < MUNDO.tile * 2) this.alturaCaida += dy;
  }

  get cayendoAlto() {
    return CONFIG.CAIDA_ALTA.activa && this.alturaCaida >= CONFIG.CAIDA_ALTA.altura;
  }

  // Hay piso a menos de "ms" de caída
  pisoCerca(ms) {
    const alto = Math.max(4, this.body.velocity.y * ms / 1000);
    return this.sceneRef.physics.overlapRect(this.body.left, this.body.bottom, this.body.width, alto, false, true).length > 0;
  }

  esperandoBoulder() {
    return this.cayendoAlto && this.tieneHabilidad('boulder') && this.pisoCerca(CONFIG.CAIDA_ALTA.ventanaCasi);
  }

  // Al tocar el piso desde muy alto: con el boulder y el salto justo, rueda; casi justo, aterriza bien; si no, pesado.
  // Devuelve true si el ninja deja de estar libre.
  aterrizar(ahora) {
    const alto = this.alturaAlAterrizar >= CONFIG.CAIDA_ALTA.altura && CONFIG.CAIDA_ALTA.activa;
    if (!alto) return false;
    const { ventanaPerfecta, ventanaCasi, castigo } = CONFIG.CAIDA_ALTA;
    const antes = ahora - this.ultimoSalto;
    this.bufferSaltoTimer = 0;  // Desde muy alto no sale un salto guardado: se aterriza
    if (this.tieneHabilidad('boulder')) {
      if (antes <= ventanaPerfecta) {
        this.rodar();
        return true;
      }
      if (antes <= ventanaCasi) return false;
    }
    this.aterrizarPesado(castigo);
    return true;
  }

  aterrizarPesado(ms) {
    this.estado = ESTADO.ATERRIZANDO;
    this.finAterrizaje = this.sceneRef.time.now + ms;
    this.saltoCortable = false;
    this.setVelocityX(0);
    this.sceneRef.cameras.main.shake(120, 0.006);
    Sonido.ruido(this.sceneRef, 0.12, 0.15);
    this.sceneRef.tweens.add({ targets: this, scaleY: 0.7, scaleX: 1.2, duration: 90, yoyo: true });
  }

  terminoAterrizaje() {
    if (this.sceneRef.time.now < this.finAterrizaje) {
      this.setVelocityX(0);
      this.anims.play(`${this.animPrefix}-idle`, true);
      return false;
    }
    this.estado = ESTADO.LIBRE;
    return true;
  }

  rodar() {
    this.estado = ESTADO.RODANDO;
    this.direccionRodar = this.flipX ? -1 : 1;
    this.rodarGolpeados = new Set();
    this.saltoCortable = false;
    this.setVelocityX(this.direccionRodar * CONFIG.BOULDER.velocidad * this.mods.velocidad);
    Sonido.ruido(this.sceneRef, 0.3, 0.2);
    this.sceneRef.cameras.main.shake(100, 0.005);
    // Con un temporizador, como el dash
    this.sceneRef.time.delayedCall(CONFIG.BOULDER.duracion, () => this.dejarDeRodar());
  }

  seguirRodando() {
    if (this.body.blocked.left || this.body.blocked.right) {
      this.dejarDeRodar();
      return;
    }
    this.setVelocityX(this.direccionRodar * CONFIG.BOULDER.velocidad * this.mods.velocidad);
    this.setAngle(this.angle + this.direccionRodar * 24);
    this.anims.play(`${this.animPrefix}-saltar`, true);
  }

  dejarDeRodar() {
    if (!this.rodando) return;
    this.estado = ESTADO.LIBRE;
    this.setAngle(0);
    this.setVelocityX(this.body.velocity.x * 0.4);
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
    this.alturaCaida = 0;
    this.dashDisponible = false;
    this.ultimoDashTimer = this.sceneRef.time.now + FISICA.dashCooldown;
    this.saltoCortable = false;

    this.body.allowGravity = false;
    this.setVelocityY(0);
    this.setVelocityX(direccion * FISICA.dash * this.mods.velocidad);
    this.setFlipX(direccion === -1);
    this.setAlpha(0.6);
    // Dash nivel 2: sale con un katanazo que dura todo el dash
    if (this.habilidades.dash >= 2 && !this.sceneRef.reglas.soloBasico) this.atacar({ forzar: true, duracion: FISICA.dashDuracion });

    // Con un temporizador y no comparando la hora: un cuadro de diferencia cambia unos 6 px el largo del dash
    this.sceneRef.time.delayedCall(FISICA.dashDuracion, () => {
      if (this.estado !== ESTADO.DASH) return;
      this.estado = ESTADO.LIBRE;
      this.body.allowGravity = true;
      this.setAlpha(1);
      this.setVelocityX(this.body.velocity.x * 0.4);
    });
  }

  // --- KATANA: tajo corto delante del ninja, o arriba de la cabeza con arriba apretado.
  // Lo que toca lo resuelve la escena en procesarKatana() ---
  atacar({ forzar = false, duracion = FISICA.katanaDuracion, arriba = false } = {}) {
    if (!forzar && arrojarLlave(this.sceneRef, this)) return;  // Rescate: con la llave en la mano, la arroja
    const ahora = this.sceneRef.time.now;
    if (!forzar && ahora < this.ultimoAtaque + FISICA.katanaCooldown) return;
    this.ultimoAtaque = ahora;

    if (this.katana) this.katana.destroy();
    this.katanaGolpeados = new Set();
    this.katanaArriba = arriba;
    // Pergaminos: la katana llega un tile más adelante o un tile más arriba. La zona del golpe es el dibujo estirado.
    const { katanaExtra } = FISICA;
    this.katana = this.sceneRef.add.image(this.x, this.y, 'katana-corte').setDepth(15);
    if (this.mods.katanaLarga) this.katana.scaleX = (this.katana.width + katanaExtra) / this.katana.width;
    if (this.mods.katanaAlta) this.katana.scaleY = (this.katana.height + katanaExtra) / this.katana.height;
    this.posicionarKatana();
    Sonido.ruido(this.sceneRef, 0.06, 0.12);
    // Pergamino: el parry alcanza alrededor del ninja. Se ve un aro.
    if (this.mods.parry360) {
      const aro = this.sceneRef.add.image(this.x, this.y, 'parry-circular').setDepth(14).setAlpha(0.8);
      this.sceneRef.tweens.add({ targets: aro, alpha: 0, scale: 1.2, duration: duracion, onUpdate: () => aro.setPosition(this.x, this.y), onComplete: () => aro.destroy() });
    }

    const katana = this.katana;
    this.sceneRef.time.delayedCall(duracion, () => {
      if (this.katana !== katana) return;
      katana.destroy();
      this.katana = null;
    });
  }

  // La katana sigue al ninja: delante, y más arriba si es más alta (crece hacia arriba desde la altura del ninja).
  // Hacia arriba es el mismo tajo girado: el largo va para arriba y el alto, hacia adelante.
  posicionarKatana() {
    const direccion = this.flipX ? -1 : 1;
    const { katanaExtra } = FISICA;
    const adelante = 12 + (this.mods.katanaLarga ? katanaExtra / 2 : 0);
    const arriba = this.mods.katanaAlta ? katanaExtra / 2 : 0;
    if (this.katanaArriba) {
      this.katana.setAngle(-90 * direccion).setFlipX(direccion < 0).setPosition(this.x + direccion * arriba, this.y - adelante);
      return;
    }
    this.katana.setPosition(this.x + direccion * adelante, this.y - arriba).setFlipX(direccion < 0);
  }

  usarEspecial() {
    if (arrojarLlave(this.sceneRef, this)) return;
    if (!this.arma || this.municion <= 0 || this.sceneRef.reglas.soloBasico) {
      Sonido.beep(this.sceneRef, 140, 0.08, 0.08);
      return;
    }
    if (dispararArma(this.sceneRef, this)) {
      this.sceneRef.events.emit(EVENTOS.ARMA, this.indice, this.arma, this.municion);
    }
  }

  // La misma arma suma munición, por este nivel y los siguientes. Otra la reemplaza con la munición base.
  equiparArma(tipo) {
    const misma = equiparEnPartida(this.sceneRef.partida, this.indice, tipo) && this.arma === tipo;
    this.municion = misma ? this.municion + ARMAS[tipo].municion : this.sceneRef.partida.armas[this.indice].municion;
    this.arma = tipo;
    this.sceneRef.events.emit(EVENTOS.ARMA, this.indice, this.arma, this.municion);
  }

  municionInfinita() {
    return this.sceneRef.fase === 'caceria' && this.mods.municionInfinitaCaceria;
  }

  aplicarDaño(demonioX) {
    if (this.sceneRef.modoDiosActivo || this.proteccion === PROTECCION.INTOCABLE) return false;

    this.estado = ESTADO.ATURDIDO;
    this.alturaCaida = 0;
    this.setAngle(0);
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
    this.setAngle(0);
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
  respawnear({ x, y }) {
    this.estado = ESTADO.APARECIENDO;
    this.alturaCaida = 0;
    this.enAire = false;
    this.setAngle(0);
    this.reaparece = true;
    this.setDepth(10).setAlpha(1);
    this.setCollideWorldBounds(true);
    this.body.reset(x, y);
    this.dashDisponible = true;
  }

  // Rescatado: vuelve a la partida desde donde estaba la jaula, como al reaparecer
  revivir(punto) {
    this.body.enable = true;
    this.setActive(true).setVisible(true);
    this.respawnear(punto);
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

    // Pergamino: saltar justo al pisar lleva más alto
    const saltado = this.mods.saltoPisoton && this.quiereSaltar;
    if (saltado) this.bufferSaltoTimer = 0;
    this.setVelocityY((saltado ? FISICA.pisotonSaltado : FISICA.pisoton) * this.factorSalto);
    Sonido.efecto(this.sceneRef, 'snd-salto', 1);

    this.proteger(FISICA.parpadeoPisoton, 0.5);
  }

  destroy(fromScene) {
    if (this.katana) this.katana.destroy();
    this.katana = null;
    super.destroy(fromScene);
  }
}

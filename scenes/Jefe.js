// Jefe.js
// Jefes (GDD §7.3). Tres intermedios con un patrón propio cada uno y un jefe final que combina los tres.
//   embestida: avisa titilando, carga en línea recta y queda mareado al chocar la pared (recibe daño doble).
//   salto:     salta hacia el jugador y al caer larga ondas de fuego por el piso.
//   rafaga:    dispara abanicos de bolas de fuego apuntadas al jugador.
import { Sonido } from './Sonido.js';

export const JEFES = {
  ogro: { textura: 'jefe-ogro', hp: 24, patrones: ['embestida'], vuela: false, velocidad: 240 },
  oni: { textura: 'jefe-oni', hp: 24, patrones: ['salto'], vuela: false, velocidad: 200 },
  espectro: { textura: 'jefe-espectro', hp: 20, patrones: ['rafaga'], vuela: true, velocidad: 70 },
  rey: { textura: 'jefe-rey', hp: 45, patrones: ['embestida', 'salto', 'rafaga'], vuela: false, velocidad: 270 }
};

export default class Jefe extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, tipo) {
    const datos = JEFES[tipo];
    super(scene, x, y, datos.textura);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.tipo = tipo;
    this.datos = datos;
    this.hpMax = datos.hp;
    this.hp = datos.hp;
    this.estado = 'entrando';
    this.invulnerable = false;
    this.mareado = false;
    this.muerto = false;
    this.indicePatron = 0;
    this.saltosSeguidos = 0;
    this.contadorRafagas = 0;
    this.estrellas = [];

    this.setDepth(20);
    this.setCollideWorldBounds(true);
    this.body.setSize(this.width * 0.8, this.height * 0.85).setOffset(this.width * 0.1, this.height * 0.15);

    if (datos.vuela) {
      this.body.setAllowGravity(false);
      this.setVelocityY(60);
    } else {
      this.body.setGravityY(400);
    }
  }

  // Se enoja con la mitad de la vida: todo un 25 % más rápido
  furia() {
    return this.hp < this.hpMax / 2 ? 1.25 : 1;
  }

  programar(ms, fn) {
    if (this.timerEstado) this.timerEstado.remove();
    this.timerEstado = this.scene.time.delayedCall(ms, () => {
      if (!this.muerto && this.active) fn();
    });
  }

  actualizar() {
    if (this.muerto) return;
    const enPiso = this.body.blocked.down || this.body.touching.down;

    switch (this.estado) {
      case 'entrando':
        if (this.datos.vuela) this.setVelocityY(60);
        if (this.datos.vuela ? this.y >= 70 : enPiso) {
          this.setVelocity(0, 0);
          this.esperar(900);
        }
        break;
      case 'esperando':
        if (this.datos.vuela) this.flotar();
        else this.acercarse(enPiso);
        break;
      case 'rafaga':
        if (this.datos.vuela) this.flotar();
        else this.setVelocityX(0);
        break;
      case 'embestida': {
        const choco = (this.body.blocked.left && this.direccion < 0) || (this.body.blocked.right && this.direccion > 0);
        if (!choco) break;
        // Si arrancó pegado a la pared no cuenta como choque: da la vuelta (evita quedar mareado en bucle)
        if (Math.abs(this.x - this.xInicioEmbestida) < 32) {
          this.direccion *= -1;
          this.xInicioEmbestida = this.x;
          this.setFlipX(this.direccion < 0);
          this.setVelocityX(this.direccion * this.datos.velocidad * this.furia());
        } else {
          this.chocarPared();
        }
        break;
      }
      case 'saltando':
        if (!enPiso) this.enAire = true;
        else if (this.enAire) this.aterrizar();
        break;
    }

    this.estrellas.forEach((estrella, i) => {
      const angulo = this.scene.time.now / 150 + i * 2.1;
      estrella.setPosition(this.x + Math.cos(angulo) * 12, this.y - this.height / 2 - 4 + Math.sin(angulo) * 3);
    });
  }

  flotar() {
    const t = this.scene.time.now;
    const xObjetivo = 256 + Math.sin(t / 1500) * 180;
    const yObjetivo = 70 + Math.sin(t / 500) * 12;
    this.setVelocity((xObjetivo - this.x) * 1.5, (yObjetivo - this.y) * 2);
  }

  acercarse(enPiso) {
    if (!enPiso) return;
    const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
    if (!objetivo) return;
    const direccion = Math.sign(objetivo.x - this.x);
    this.setVelocityX(direccion * 30);
    this.setFlipX(direccion < 0);
  }

  esperar(ms) {
    this.estado = 'esperando';
    this.programar(ms / this.furia(), () => this.siguientePatron());
  }

  siguientePatron() {
    const patron = this.datos.patrones[this.indicePatron % this.datos.patrones.length];
    this.indicePatron++;
    if (patron === 'embestida') this.iniciarEmbestida();
    else if (patron === 'salto') this.iniciarSalto();
    else this.iniciarRafaga();
  }

  // --- EMBESTIDA ---
  iniciarEmbestida() {
    this.estado = 'preparando';
    this.setVelocityX(0);
    // Carga hacia el jugador; si lo tiene casi encima, carga hacia el centro de la arena
    const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
    const dx = objetivo ? objetivo.x - this.x : 0;
    this.direccion = Math.abs(dx) < 40 ? (this.x < 256 ? 1 : -1) : Math.sign(dx);
    this.setFlipX(this.direccion < 0);

    this.scene.time.addEvent({
      delay: 100, repeat: 5,
      callback: () => { if (this.active && !this.muerto) (this.isTinted ? this.clearTint() : this.setTint(0xff4444)); }
    });
    Sonido.efecto(this.scene, 'snd-grito', 0.4);

    this.programar(700 / this.furia(), () => {
      this.clearTint();
      this.estado = 'embestida';
      this.xInicioEmbestida = this.x;
      this.setVelocityX(this.direccion * this.datos.velocidad * this.furia());
    });
  }

  chocarPared() {
    this.estado = 'mareado';
    this.mareado = true;
    this.setVelocity(-this.direccion * 60, -150);
    this.scene.cameras.main.shake(250, 0.01);
    Sonido.ruido(this.scene, 0.3, 0.3);
    this.estrellas = [0, 1, 2].map(() => this.scene.add.image(this.x, this.y, 'estrella').setDepth(21));

    this.programar(1600, () => {
      this.mareado = false;
      this.estrellas.forEach(e => e.destroy());
      this.estrellas = [];
      this.esperar(600);
    });
  }

  // --- SALTO CON ONDAS ---
  iniciarSalto() {
    this.estado = 'preparando';
    this.setVelocityX(0);
    this.scene.tweens.add({
      targets: this, scaleY: 0.8, duration: 120, yoyo: true,
      onComplete: () => {
        if (this.muerto || !this.active) return;
        const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
        const dx = objetivo ? objetivo.x - this.x : 0;
        this.estado = 'saltando';
        this.enAire = false;
        this.setFlipX(dx < 0);
        this.setVelocity(Phaser.Math.Clamp(dx * 1.1, -220, 220), -440);
      }
    });
  }

  aterrizar() {
    this.setVelocityX(0);
    this.scene.cameras.main.shake(200, 0.012);
    Sonido.ruido(this.scene, 0.25, 0.3);
    const velocidadOnda = 170 * this.furia() * (this.scene.modsGlobal ? this.scene.modsGlobal.velProyectiles : 1);
    this.scene.crearOnda(this.x, this.body.bottom, -velocidadOnda);
    this.scene.crearOnda(this.x, this.body.bottom, velocidadOnda);

    this.saltosSeguidos++;
    if (this.saltosSeguidos < (this.furia() > 1 ? 3 : 2)) {
      this.estado = 'preparando';
      this.programar(500, () => this.iniciarSalto());
    } else {
      this.saltosSeguidos = 0;
      this.esperar(900);
    }
  }

  // --- RÁFAGA DE FUEGO ---
  iniciarRafaga() {
    this.estado = 'rafaga';
    const disparos = this.tipo === 'rey' ? 7 : 5;
    const repeticiones = this.furia() > 1 ? 3 : 2;
    const velocidad = 120 * (this.scene.modsGlobal ? this.scene.modsGlobal.velProyectiles : 1);

    this.eventoRafaga = this.scene.time.addEvent({
      delay: 550, repeat: repeticiones - 1,
      callback: () => {
        if (this.muerto || !this.active) return;
        const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
        const base = objetivo ? Math.atan2(objetivo.y - this.y, objetivo.x - this.x) : Math.PI / 2;
        for (let i = 0; i < disparos; i++) {
          const angulo = base + (i - (disparos - 1) / 2) * 0.22;
          this.scene.dispararProyectilEnemigo(this.x, this.y, Math.cos(angulo) * velocidad, Math.sin(angulo) * velocidad, { gravedad: false });
        }
        Sonido.beep(this.scene, 220, 0.15, 0.1, 'sawtooth');
      }
    });

    this.programar(repeticiones * 550 + 300, () => {
      this.contadorRafagas++;
      if (this.tipo === 'espectro' && this.contadorRafagas % 2 === 0) this.scene.invocarEnemigo('espiritu_volador');
      this.esperar(1000);
    });
  }

  recibirDaño(cantidad) {
    if (this.muerto || this.invulnerable || this.estado === 'entrando') return false;
    const daño = this.mareado ? cantidad * 2 : cantidad;
    this.hp = Math.max(0, this.hp - daño);
    this.invulnerable = true;

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => { if (this.active) this.clearTint(); });
    this.scene.time.delayedCall(250, () => { this.invulnerable = false; });
    Sonido.efecto(this.scene, 'snd-parry', 0.4);
    this.scene.events.emit('jefe-vida', this.hp, this.hpMax);

    if (this.hp <= 0) this.morir();
    return true;
  }

  morir() {
    this.muerto = true;
    if (this.timerEstado) this.timerEstado.remove();
    if (this.eventoRafaga) this.eventoRafaga.remove();
    this.estrellas.forEach(e => e.destroy());
    this.estrellas = [];
    this.setVelocity(0, 0);
    this.body.enable = false;

    Sonido.efecto(this.scene, 'snd-grito-final', 0.6);
    this.scene.time.addEvent({
      delay: 150, repeat: 8,
      callback: () => this.scene.efectoExplosion(this.x + Phaser.Math.Between(-16, 16), this.y + Phaser.Math.Between(-16, 16), 18)
    });
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 1400,
      onComplete: () => {
        this.scene.jefeDerrotado();
        this.destroy();
      }
    });
  }
}

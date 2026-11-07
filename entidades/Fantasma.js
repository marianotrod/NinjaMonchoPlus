// Fantasma.js
// Fantasma Perseguidor: aparece cuando el reloj llega a 0, uno por jugador. Es invencible y atraviesa muros.
// Persigue a su jugador cada vez más rápido y sin tope, así que tarde o temprano no se lo puede esquivar.
// Puede matar a cualquier ninja. Desaparece cuando muere su jugador, sea cual sea la causa.
import { CONFIG } from '../config.js';

export default class Fantasma extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, objetivo) {
    super(scene, x, y, 'fantasma');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(12, 12);
    this.setDepth(80).setAlpha(0.85);
    // Pergamino: el fantasma de un jugador puede ir al doble
    this.factor = objetivo && objetivo.mods.fantasmaRapido ? 2 : 1;
    this.velocidad = CONFIG.FANTASMA_VELOCIDAD * this.factor;
    this.objetivo = objetivo;
    this.colliders = [];

    scene.tweens.add({ targets: this, alpha: 0.5, duration: 400, yoyo: true, repeat: -1 });
  }

  actualizar(objetivo, delta) {
    if (!objetivo) {
      this.setVelocity(0, 0);
      return;
    }
    this.velocidad += CONFIG.FANTASMA_ACELERACION * this.factor * delta / 1000;
    const angulo = Math.atan2(objetivo.y - this.y, objetivo.x - this.x);
    this.setVelocity(Math.cos(angulo) * this.velocidad, Math.sin(angulo) * this.velocidad);
    this.setFlipX(objetivo.x < this.x);
  }
}

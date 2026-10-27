// Fantasma.js
// Fantasma Perseguidor (GDD §5.1): aparece cuando el reloj llega a 0. Es invencible, atraviesa muros
// y persigue al jugador más cercano, cada vez más rápido. Si toca a un ninja, se pierde una vida.

export default class Fantasma extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fantasma');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(12, 12);
    this.setDepth(80).setAlpha(0.85);
    this.velocidad = 45;

    scene.tweens.add({ targets: this, alpha: 0.5, duration: 400, yoyo: true, repeat: -1 });
  }

  actualizar(objetivo) {
    if (!objetivo) {
      this.setVelocity(0, 0);
      return;
    }
    this.velocidad = Math.min(this.velocidad + 0.03, 130);
    const dx = objetivo.x - this.x;
    const dy = objetivo.y - this.y;
    this.setVelocity(
      Phaser.Math.Clamp(dx * 2, -this.velocidad * 1.3, this.velocidad * 1.3),
      Phaser.Math.Clamp(dy * 1.5, -this.velocidad, this.velocidad)
    );
    this.setFlipX(dx < 0);
  }
}

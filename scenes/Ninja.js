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
    // NUEVO: Nace cayendo del cielo y es intocable
    this.isSpawning = true; 

    if (configTeclado) {
      this.teclas = configTeclado;
    } else {
      this.teclas = scene.input.keyboard.createCursorKeys();
    }
  }

  update() {
    // ESTADO DE SPAWN: Cae recto y no responde a teclas hasta tocar el piso
    if (this.isSpawning) {
      this.setVelocityX(0); 
      this.anims.play(`${this.animPrefix}-caer`, true);
      if (this.body.touching.down) {
        this.isSpawning = false; // ¡Aterrizó y ya puede jugar!
      } else {
        return; // Corta la función acá: bloquea el movimiento horizontal y saltos
      }
    }

    if (this.isStunned) {
      this.anims.play(`${this.animPrefix}-stun`, true);
      return;
    }

    if (this.teclas.left.isDown) {
      this.setVelocityX(-140);
      this.setFlipX(true);
    } else if (this.teclas.right.isDown) {
      this.setVelocityX(140);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (this.teclas.up.isDown && this.body.touching.down) {
      this.setVelocityY(-420);
      this.sceneRef.reproducirSonido('snd-salto', 1);
    }

    if (!this.body.touching.down) {
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

  aplicarDaño(demonioX) {
    if (this.isInvul || this.isSpawning) return; // Si cae, no recibe daño

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
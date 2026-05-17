export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    // Assets Visuales
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    this.load.image('tile-piso', 'public/assets/piso.png'); 
    
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    this.load.image('cuadrado', 'public/assets/cuadrado.png');
    this.load.image('triangulo', 'public/assets/triangulo.png');
    this.load.image('rombo', 'public/assets/rombo.png');
    
    // ----------------------------------------------------
    // MODIFICADO: Ahora cargamos el demonio como Spritesheet
    // (Ajustá el frameWidth/Height si tus frames miden más de 16x16)
    // ----------------------------------------------------
    this.load.spritesheet('demonio', 'public/assets/demonio.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    // Audios 
    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
  }

  create() {
    console.log("¡Paso 5: Demonios con Spritesheet y direcciones dinámicas!");

    let musicaFondo = this.sound.get('musica-fondo');
    if (!musicaFondo) {
        musicaFondo = this.sound.add('musica-fondo', { loop: true, volume: 0.4 });
    }
    if (!musicaFondo.isPlaying) {
        musicaFondo.play();
    }

    this.inventario = [];
    this.puntaje = 0;          
    this.tiempoRestante = 20;  

    this.add.image(400, 300, 'fondo-cielo').setDisplaySize(800, 600);

    // Múltiples Plataformas
    this.pisos = this.physics.add.staticGroup();
    const pisoBase = this.add.tileSprite(400, 568, 800, 32, 'tile-piso').setScale(2);
    this.pisos.add(pisoBase);
    const platIzq = this.add.tileSprite(150, 420, 150, 32, 'tile-piso').setScale(2);
    this.pisos.add(platIzq);
    const platDer = this.add.tileSprite(650, 280, 150, 32, 'tile-piso').setScale(2);
    this.pisos.add(platDer);

    // Jugador
    this.jugador = this.physics.add.sprite(400, 100, 'ninja'); 
    this.jugador.setScale(2);
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    this.physics.add.collider(this.jugador, this.pisos);
    this.physics.add.collider(this.items, this.pisos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.pisos);

    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarDemonio, null, this);

    this.time.addEvent({ delay: 1000, callback: this.spawnearItem, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 3000, callback: this.spawnearDemonio, callbackScope: this, loop: true });

    this.textoPuntaje = this.add.text(20, 20, 'Puntos: 0', { 
        fontSize: '20px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    });

    this.textoTiempo = this.add.text(780, 20, 'Tiempo: 20', { 
        fontSize: '20px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    }).setOrigin(1, 0);

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true });

    this.teclado = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
  }

  update() {
    // Controles Moncho
    if (this.teclado.left.isDown) { this.jugador.setVelocityX(-160); this.jugador.setFlipX(true); } 
    else if (this.teclado.right.isDown) { this.jugador.setVelocityX(160); this.jugador.setFlipX(false); } 
    else { this.jugador.setVelocityX(0); }

    if (this.teclado.up.isDown && this.jugador.body.touching.down) {
        this.jugador.setVelocityY(-500);
        this.sound.play('snd-salto', { volume: 1 }); 
    }

    if (!this.jugador.body.touching.down) {
        if (this.jugador.body.velocity.y < 0) { this.jugador.anims.play('moncho-saltar', true); } 
        else { this.jugador.anims.play('moncho-caer', true); }
    } else {
        if (this.jugador.body.velocity.x !== 0) { this.jugador.anims.play('moncho-caminar', true); } 
        else { this.jugador.anims.play('moncho-idle', true); }
    }

    // Comportamiento de los Items
    this.items.getChildren().forEach(item => {
        if (item.textoDebug) { item.textoDebug.setPosition(item.x, item.y - 25); item.textoDebug.setText(item.valorPuntos); }
        if (item.body.touching.down) {
            item.setVelocityX(item.body.velocity.x * 0.92);
            if (Math.abs(item.body.velocity.x) < 1) item.setVelocityX(0);
        } else {
            if (item.body.velocity.y > 0) item.yaRestoPuntosEsteRebote = false;
        }
    });

    // ----------------------------------------------------
    // MODIFICADO: Comportamiento e Inteligencia Visual del Demonio
    // ----------------------------------------------------
    this.enemigos.getChildren().forEach(demonio => {
        // Fricción horizontal estándar cuando toca el piso
        if (demonio.body.touching.down) {
            demonio.setVelocityX(demonio.body.velocity.x * 0.98); 
            if (Math.abs(demonio.body.velocity.x) < 1) demonio.setVelocityX(0);
        }

        // 1. Orientación Horizontal (Izquierda / Derecha)
        // Asumiendo que el sprite original mira hacia la derecha:
        if (demonio.body.velocity.x < 0) {
            demonio.setFlipX(true);  // Da vuelta el sprite para que mire a la izquierda
        } else if (demonio.body.velocity.x > 0) {
            demonio.setFlipX(false); // Deja el sprite normal mirando a la derecha
        }

        // 2. Cambio de Frame Vertical (Sube / Baja)
        if (demonio.body.velocity.y < 0) {
            demonio.setFrame(0); // Frame 1: Subiendo
        } else if (demonio.body.velocity.y > 0) {
            demonio.setFrame(1); // Frame 2: Bajando
        }
    });
  }

  procesarImpactoPiso(obj1, obj2) {
      const item = this.items.contains(obj1) ? obj1 : obj2;
      if (!item.yaRestoPuntosEsteRebote) {
          if (item.body.velocity.y < -10) { 
              item.yaRestoPuntosEsteRebote = true; 
              item.valorPuntos -= 5;
              item.setAlpha(item.valorPuntos / 100);
              
              if (item.valorPuntos <= 0) {
                  if (item.textoDebug) item.textoDebug.destroy();
                  item.destroy();
              }
          }
      }
  }

  tickReloj() {
    this.tiempoRestante--;
    this.textoTiempo.setText('Tiempo: ' + this.tiempoRestante);
    if (this.tiempoRestante <= 0) {
        this.sound.stopAll(); this.sound.play('snd-caida', { volume: 0.8 }); this.scene.restart(); 
    }
  }

  spawnearItem() {
    if (this.items.countActive(true) >= 8) return;

    const formas = ['cuadrado', 'triangulo', 'rombo'];
    const formaAleatoria = Phaser.Math.RND.pick(formas);
    const xAleatoria = Phaser.Math.Between(32, 768);

    const item = this.items.create(xAleatoria, -20, formaAleatoria);
    item.setScale(2);
    item.setBounce(0.75);
    item.setVelocityX(Phaser.Math.Between(-120, 120));
    item.setCollideWorldBounds(true);

    item.valorPuntos = 100;
    item.yaRestoPuntosEsteRebote = false;

    item.textoDebug = this.add.text(xAleatoria, -40, '100', { fontSize: '12px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return;

    const xAleatoria = Phaser.Math.Between(32, 768);
    
    // Nace usando la spritesheet 'demonio'
    const demonio = this.enemigos.create(xAleatoria, -20, 'demonio');
    
    demonio.setScale(2);
    demonio.setBounce(0.85); 
    demonio.setVelocityX(Phaser.Math.Between(-150, 150)); 
    demonio.setCollideWorldBounds(true);
    
    // Quitamos el setTint(0xff0000) anterior para que se vean los colores reales de tu spritesheet
    demonio.clearTint(); 
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    this.puntaje += item.valorPuntos;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);
    
    if (item.textoDebug) item.textoDebug.destroy();
    item.destroy(); 

    const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
    const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
    const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

    if (cuadrados >= 2 && triangulos >= 2 && rombos >= 2) {
        this.sound.stopAll(); this.scene.restart();
    }
  }

  tocarDemonio(jugador, demonio) {
    this.puntaje -= 50;
    if (this.puntaje < 0) this.puntaje = 0;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);

    demonio.destroy();

    this.jugador.setTint(0xff0000);
    this.time.delayedCall(200, () => {
        this.jugador.clearTint();
    });
    
    console.log("¡Auch! Un demonio te quitó 50 puntos.");
  }
}
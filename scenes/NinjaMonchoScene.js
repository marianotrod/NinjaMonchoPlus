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

    // Audios 
    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
  }

  create() {
    console.log("¡Plataformas múltiples y detector de rebote universal activos!");

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

    // ----------------------------------------------------
    // NUEVO: SISTEMA DE MÚLTIPLES PLATAFORMAS (Static Group)
    // ----------------------------------------------------
    this.pisos = this.physics.add.staticGroup();

    // 1. Piso principal (cubre todo el ancho abajo)
    const pisoBase = this.add.tileSprite(400, 568, 800, 32, 'tile-piso');
    pisoBase.setScale(2);
    this.pisos.add(pisoBase);

    // 2. Plataforma flotante izquierda
    const platIzq = this.add.tileSprite(150, 420, 150, 32, 'tile-piso');
    platIzq.setScale(2);
    this.pisos.add(platIzq);

    // 3. Plataforma flotante derecha (más alta)
    const platDer = this.add.tileSprite(650, 280, 150, 32, 'tile-piso');
    platDer.setScale(2);
    this.pisos.add(platDer);

    // Jugador
    this.jugador = this.physics.add.sprite(400, 100, 'ninja'); // Lo hacemos nacer un poco más alto
    this.jugador.setScale(2);
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    this.items = this.physics.add.group();

    // ----------------------------------------------------
    // MODIFICADO: Colisiones contra TODO el grupo de pisos
    // ----------------------------------------------------
    this.physics.add.collider(this.jugador, this.pisos);
    this.physics.add.collider(this.items, this.pisos, this.procesarImpactoPiso, null, this);
    
    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);

    this.time.addEvent({
        delay: 1000,
        callback: this.spawnearItem,
        callbackScope: this,
        loop: true
    });

    this.textoPuntaje = this.add.text(20, 20, 'Puntos: 0', { 
        fontSize: '20px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    });

    this.textoTiempo = this.add.text(780, 20, 'Tiempo: 20', { 
        fontSize: '20px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    }).setOrigin(1, 0);

    this.relojJuego = this.time.addEvent({
        delay: 1000,
        callback: this.tickReloj,
        callbackScope: this,
        loop: true
    });

    this.teclado = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
  }

  update() {
    if (this.teclado.left.isDown) {
        this.jugador.setVelocityX(-160);
        this.jugador.setFlipX(true);
    } 
    else if (this.teclado.right.isDown) {
        this.jugador.setVelocityX(160);
        this.jugador.setFlipX(false);
    } 
    else {
        this.jugador.setVelocityX(0);
    }

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

    this.items.getChildren().forEach(item => {
        if (item.textoDebug) {
            item.textoDebug.setPosition(item.x, item.y - 25);
            item.textoDebug.setText(item.valorPuntos);
        }

        if (item.body.touching.down) {
            item.setVelocityX(item.body.velocity.x * 0.92);
            if (Math.abs(item.body.velocity.x) < 1) {
                item.setVelocityX(0);
            }
        } else {
            if (item.body.velocity.y > 0) {
                item.yaRestoPuntosEsteRebote = false;
            }
        }
    });
  }

  // ----------------------------------------------------
  // NUEVO: Identificación universal del item
  // ----------------------------------------------------
  procesarImpactoPiso(obj1, obj2) {
      // Le preguntamos a Phaser: ¿El obj1 forma parte del grupo de items?
      // Si la respuesta es sí, el item es obj1. Si es no, el item es obj2.
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
        this.sound.stopAll(); 
        this.sound.play('snd-caida', { volume: 0.8 }); 
        this.scene.restart(); 
    }
  }

  spawnearItem() {
    if (this.items.countActive(true) >= 8) {
        return;
    }

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

    item.textoDebug = this.add.text(xAleatoria, -40, '100', {
        fontSize: '12px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    
    this.puntaje += item.valorPuntos;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);
    
    if (item.textoDebug) {
        item.textoDebug.destroy();
    }
    item.destroy(); 

    const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
    const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
    const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

    if (cuadrados >= 2 && triangulos >= 2 && rombos >= 2) {
        this.sound.stopAll(); 
        this.scene.restart();
    }
  }
}
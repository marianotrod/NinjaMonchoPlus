export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    // Assets
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    this.load.image('tile-piso', 'public/assets/piso.png'); 
    
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    this.load.image('cuadrado', 'public/assets/cuadrado.png');
    this.load.image('triangulo', 'public/assets/triangulo.png');
    this.load.image('rombo', 'public/assets/rombo.png');
  }

  create() {
    console.log("¡Paso 2: UI, Timer y Puntaje activos!");

    // Arrays y Variables de juego
    this.inventario = [];
    this.puntaje = 0;          // NUEVO: Puntos iniciales
    this.tiempoRestante = 20;  // NUEVO: Segundos para ganar

    // 1. Fondo estirado
    this.add.image(400, 300, 'fondo-cielo').setDisplaySize(800, 600);

    // 2. Piso
    const piso = this.add.tileSprite(400, 568, 400, 32, 'tile-piso');
    piso.setScale(2);
    this.physics.add.existing(piso, true);

    // 3. Jugador
    this.jugador = this.physics.add.sprite(400, 200, 'ninja');
    this.jugador.setScale(2);
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    // 4. Grupo para los items
    this.items = this.physics.add.group();

    // 5. Colisiones físicas
    this.physics.add.collider(this.jugador, piso);
    this.physics.add.collider(this.items, piso);

    // 6. Sensor de Recolección (Overlap)
    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);

    // 7. Temporizador para la lluvia
    this.time.addEvent({
        delay: 1000,
        callback: this.spawnearItem,
        callbackScope: this,
        loop: true
    });

    // ----------------------------------------------------
    // NUEVO: INTERFAZ DE USUARIO (HUD) Y RELOJ
    // ----------------------------------------------------
    
    // Texto de Puntaje (Arriba a la izquierda)
this.textoPuntaje = this.add.text(20, 20, 'Puntos: 0', { 
    fontSize: '20px', 
    fill: '#FFF',
    fontFamily: '"Press Start 2P"', 
    stroke: '#000', 
    strokeThickness: 4,
    // ----------------------------------------------------
    // NUEVO: Agrega un colchón de píxeles para que no se corte
    // ----------------------------------------------------
    padding: { top: 8, bottom: 8, left: 4, right: 4 } 
});

// Texto del Reloj (Arriba a la derecha)
this.textoTiempo = this.add.text(780, 20, 'Tiempo: 20', { 
    fontSize: '20px', 
    fill: '#FFF',
    fontFamily: '"Press Start 2P"', 
    stroke: '#000',
    strokeThickness: 4,
    // NUEVO: Lo mismo para el reloj
    padding: { top: 8, bottom: 8, left: 4, right: 4 } 
}).setOrigin(1, 0);

    // Evento del reloj: Ejecuta la función "tickReloj" cada 1 segundo (1000 ms)
    this.relojJuego = this.time.addEvent({
        delay: 1000,
        callback: this.tickReloj,
        callbackScope: this,
        loop: true
    });

    // 8. Controles por teclado
    this.teclado = this.input.keyboard.createCursorKeys();

    // 9. Animaciones
    this.anims.create({
        key: 'moncho-idle',
        frames: [{ key: 'ninja', frame: 9 }],
        frameRate: 10
    });
    this.anims.create({
        key: 'moncho-caminar',
        frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }),
        frameRate: 12,
        repeat: -1
    });
    this.anims.create({
        key: 'moncho-saltar',
        frames: [{ key: 'ninja', frame: 5 }],
        frameRate: 10
    });
    this.anims.create({
        key: 'moncho-caer',
        frames: [{ key: 'ninja', frame: 7 }],
        frameRate: 10
    });
  }

  update() {
    // Controles de Moncho
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
    }

    // Animaciones
    if (!this.jugador.body.touching.down) {
        if (this.jugador.body.velocity.y < 0) {
            this.jugador.anims.play('moncho-saltar', true);
        } else {
            this.jugador.anims.play('moncho-caer', true);
        }
    } else {
        if (this.jugador.body.velocity.x !== 0) {
            this.jugador.anims.play('moncho-caminar', true);
        } else {
            this.jugador.anims.play('moncho-idle', true);
        }
    }

    // Fricción de items en el piso
    this.items.getChildren().forEach(item => {
        if (item.body.touching.down) {
            item.setVelocityX(item.body.velocity.x * 0.92);
            if (Math.abs(item.body.velocity.x) < 1) {
                item.setVelocityX(0);
            }
        }
    });
  }

  // ----------------------------------------------------
  // NUEVO: FUNCIÓN DEL RELOJ
  // ----------------------------------------------------
  tickReloj() {
    this.tiempoRestante--;
    this.textoTiempo.setText('Tiempo: ' + this.tiempoRestante);

    // Condición de Derrota
    if (this.tiempoRestante <= 0) {
        console.log("¡Se acabó el tiempo! Perdiste.");
        this.scene.restart(); // Reinicia el juego
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
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    
    item.destroy(); 

    // ----------------------------------------------------
    // NUEVO: SISTEMA DE PUNTOS
    // ----------------------------------------------------
    this.puntaje += 50;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);

    const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
    const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
    const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

    // Condición de Victoria
    if (cuadrados >= 2 && triangulos >= 2 && rombos >= 2) {
        console.log("¡Ganaste! Reiniciando el mapa...");
        this.scene.restart();
    }
  }
}
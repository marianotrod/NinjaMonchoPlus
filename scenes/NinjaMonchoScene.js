export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    // Carga de Assets
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
    console.log("¡Paso 1: Sistema de inventario y condición de victoria activos!");

    // NUEVO: Estructura de datos (Array) para persistir los objetos recolectados
    this.inventario = [];

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

    // 6. Lector de recolección (Overlap)
    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);

    // 7. Temporizador para la lluvia (Máximo 8 en pantalla)
    this.time.addEvent({
        delay: 1000,
        callback: this.spawnearItem,
        callbackScope: this,
        loop: true
    });

    // 8. Controles por teclado
    this.teclado = this.input.keyboard.createCursorKeys();

    // 9. Registro de Animaciones
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

  spawnearItem() {
    // Límite estricto de 8 objetos en pantalla
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

  // MODIFICADO: Lógica de recolección, persistencia y victoria
  recolectarItem(jugador, item) {
    // 1. Conseguimos el nombre del item ('cuadrado', 'triangulo', o 'rombo') desde su asset
    const tipoItem = item.texture.key;

    // 2. Lo agregamos al array persistente
    this.inventario.push(tipoItem);

    // 3. Borramos el objeto de la pantalla
    item.destroy(); 

    // Imprime en consola para que veas cómo se va llenando tu array en tiempo real
    console.log("Inventario actual:", this.inventario);

    // 4. Contamos cuántos tenemos de cada tipo usando filter
    const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
    const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
    const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

    console.log(`Progreso -> Cuadrados: ${cuadrados}/2 | Triángulos: ${triangulos}/2 | Rombos: ${rombos}/2`);

    // 5. CONDICIÓN DE VICTORIA: Al menos 2 de cada uno
    if (cuadrados >= 2 && triangulos >= 2 && rombos >= 2) {
        console.log("¡Ganaste! Reiniciando el mapa...");
        
        // Reinicia la escena actual por completo (resetea el inventario, el ninja y el mapa)
        this.scene.restart();
    }
  }
}
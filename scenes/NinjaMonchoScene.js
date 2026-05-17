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
    console.log("¡Mecánica de pérdida de valor por REBOTE activa!");

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

    const piso = this.add.tileSprite(400, 568, 400, 32, 'tile-piso');
    piso.setScale(2);
    this.physics.add.existing(piso, true);

    this.jugador = this.physics.add.sprite(400, 200, 'ninja');
    this.jugador.setScale(2);
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    this.items = this.physics.add.group();

    this.physics.add.collider(this.jugador, piso);
    
    // El collider contra el piso dispara la función que chequeará si hubo rebote
    this.physics.add.collider(this.items, piso, this.procesarImpactoPiso, null, this);

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

    // Fricción horizontal: Sólo aplicamos cuando toca el suelo.
    // Además, usamos este momento para destrabar el flag de "ya reboté".
    this.items.getChildren().forEach(item => {
        if (item.body.touching.down) {
            item.setVelocityX(item.body.velocity.x * 0.92);
            if (Math.abs(item.body.velocity.x) < 1) {
                item.setVelocityX(0);
            }
        } else {
            // Si el objeto está en el aire (volando o rebotando), reseteamos su flag.
            // Así, el próximo impacto contra el piso contará como un rebote nuevo.
            item.yaRestoPuntosEsteRebote = false;
        }
    });
  }

  // ----------------------------------------------------
  // NUEVO: Función que resta puntos SOLO por rebote
  // ----------------------------------------------------
  procesarImpactoPiso(obj1, obj2) {
      // Identificamos cuál de los dos objetos es el item y no el piso
      const item = obj1.texture ? obj1 : obj2;

      // Si el item acaba de tocar el piso y aún no le cobramos "peaje" por este rebote:
      if (!item.yaRestoPuntosEsteRebote) {
          
          // La clave de Phaser: Si después de chocar, el cuerpo tiene velocidad Y negativa (sube), 
          // significa que la física del motor generó un rebote efectivo.
          // Ponemos un umbral pequeñísimo (-5) para ignorar cuando ya está casi quieto vibrando.
          if (item.body.velocity.y < -5) { 
              item.yaRestoPuntosEsteRebote = true; // Bloqueamos para no restar en cada milisegundo de este impacto
              item.valorPuntos -= 5;
              
              // Opcional: Feedback visual para que se note que pierde valor
              item.setAlpha(item.valorPuntos / 100);
              
              // Si su valor llega a 0 (rebotó 20 veces), desaparece
              if (item.valorPuntos <= 0) {
                  item.destroy();
              }
          }
      }
  }

  tickReloj() {
    this.tiempoRestante--;
    this.textoTiempo.setText('Tiempo: ' + this.tiempoRestante);

    if (this.tiempoRestante <= 0) {
        console.log("¡Se acabó el tiempo! Perdiste.");
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

    // NUEVO: Arranca con 100 puntos y el flag destrabado
    item.valorPuntos = 100;
    item.yaRestoPuntosEsteRebote = false;
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    
    // NUEVO: Moncho suma exactamente el valor que le quedó al item
    this.puntaje += item.valorPuntos;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);
    
    item.destroy(); 

    const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
    const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
    const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

    if (cuadrados >= 2 && triangulos >= 2 && rombos >= 2) {
        console.log("¡Ganaste! Reiniciando el mapa...");
        this.sound.stopAll(); 
        this.scene.restart();
    }
  }
}
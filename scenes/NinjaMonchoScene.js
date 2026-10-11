export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    this.load.spritesheet('MapTileSet', 'public/assets/MapTileSet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('cuadrado', 'public/assets/cuadrado.png');
    this.load.image('triangulo', 'public/assets/triangulo.png');
    this.load.image('rombo', 'public/assets/rombo.png');
    this.load.spritesheet('demonio', 'public/assets/demonio.png', { frameWidth: 16, frameHeight: 16 });

    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
    this.load.audio('musica-win', ['public/assets/WinMusic.ogg', 'public/assets/WinMusic.mp3']);
    this.load.audio('musica-lose', ['public/assets/LoseMusic.ogg', 'public/assets/LoseMusic.mp3']);
  }

  create() {
    this.juegoTerminado = false;
    this.MODO_TALISMANES = true;
    this.PISOTON_INVIERTE_DEMONIO = true;

    this.scene.launch('UIScene');

    // Límites físicos (2 tiles offscreen arriba)
    this.physics.world.setBounds(0, -32, 512, 320);

    let musicaFondo = this.sound.get('musica-fondo');
    if (!musicaFondo) {
      musicaFondo = this.sound.add('musica-fondo', { loop: true, volume: 0.4 });
    }
    if (!musicaFondo.isPlaying) {
      musicaFondo.play();
    }

    this.inventario = []; 
    this.puntaje = 0;          
    this.tiempoRestante = 60;  

    this.add.image(256, 144, 'fondo-cielo').setDisplaySize(512, 288);

    this.catalogoPiezas = {
      'CR01TL': { frame: 0,  tipo: 'solido' },   
      'CR01TR': { frame: 1,  tipo: 'solido' },   
      'CR01BL': { frame: 10, tipo: 'solido' },   
      'CR01BR': { frame: 11, tipo: 'solido' },  
      'CR02TL': { frame: 2,  tipo: 'solido' },   
      'CR02TR': { frame: 3,  tipo: 'solido' },   
      'CR02BL': { frame: 12, tipo: 'solido' },   
      'CR02BR': { frame: 13, tipo: 'solido' }, 
      'CP01TC': { frame: 4,  tipo: 'solido' },   
      'CP02TC': { frame: 14, tipo: 'solido' }, 
      'PP01TC': { frame: 15, tipo: 'fondo' }, 
      'PP02TC': { frame: 16, tipo: 'fondo' }, 
      'PP03TC': { frame: 17, tipo: 'fondo' }, 
      'CH01TC': { frame: 40, tipo: 'pasarela' },
      'CH02TC': { frame: 41, tipo: 'pasarela' },
      'CH03TC': { frame: 42, tipo: 'pasarela' },
      'CH01CC': { frame: 50, tipo: 'fondo' },
      'CH02CC': { frame: 51, tipo: 'fondo' },
      'CH03CC': { frame: 52, tipo: 'fondo' },
      'CH04CC': { frame: 53, tipo: 'fondo' },
      'CH01BC': { frame: 60, tipo: 'fondo' },
      'CH02BC': { frame: 61, tipo: 'fondo' },   
      'CH03BC': { frame: 62, tipo: 'fondo' }
    };

    // --- NUEVO CATÁLOGO DE ENEMIGOS ---
    this.catalogoEnemigos = {
      'demonio_comun': {
        textura: 'demonio',
        velXMin: 45,
        velXMax: 100,
        reboteYMin: -100, // Fuerza mínima (salto cortito)
        reboteYMax: -200  // Fuerza máxima (salto mediano)
      }
    };

    this.bloquesFisicos = this.physics.add.staticGroup();

    const _ = '';
    const L = 'CR01TL'; 
    const R = 'CR01TR'; 
    const P = 'CP01TC'; 
    const H1 = 'CH01TC', H2 = 'CH02TC', H3 = 'CH03TC'; 

    const mapaNivel = [
      /* -02 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* -01 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  00 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  01 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  02 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  03 */ [L,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,_,R],
      /*  04 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  05 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  06 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  07 */ [L,_,_,H1,H2,H3,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,H1,H2,H3,_,_,_,_,R],
      /*  08 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  09 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  10 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  11 */ [L,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,_,_,R],
      /*  12 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  13 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  14 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  15 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  16 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /*  17 */ [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P]
    ];

    const FILAS_OFFSCREEN = 2;

    mapaNivel.forEach((fila, indiceFila) => {
      fila.forEach((codigo, indiceColumna) => {
        if (codigo === '') return;

        const datosPieza = this.catalogoPiezas[codigo];
        if (!datosPieza) return;

        const posX = (indiceColumna * 16) + 8;
        const posY = ((indiceFila - FILAS_OFFSCREEN) * 16) + 8;

        let bloque;
        if (datosPieza.tipo !== 'fondo') {
          bloque = this.bloquesFisicos.create(posX, posY, 'MapTileSet', datosPieza.frame);
          bloque.body.updateFromGameObject();

          if (datosPieza.tipo === 'pasarela') {
            bloque.body.checkCollision.up = true;
            bloque.body.checkCollision.down = false;
            bloque.body.checkCollision.left = false;
            bloque.body.checkCollision.right = false;
          } else if (datosPieza.tipo === 'solido') {
            const codigoArriba = indiceFila > 0 ? mapaNivel[indiceFila - 1][indiceColumna] : '';
            if (this.catalogoPiezas[codigoArriba]?.tipo === 'solido') {
              bloque.body.checkCollision.up = false;
            }

            const codigoAbajo = indiceFila < mapaNivel.length - 1 ? mapaNivel[indiceFila + 1][indiceColumna] : '';
            if (this.catalogoPiezas[codigoAbajo]?.tipo === 'solido') {
              bloque.body.checkCollision.down = false;
            }
          }
        } else {
          bloque = this.add.image(posX, posY, 'MapTileSet', datosPieza.frame);
        }
      });
    });

    this.jugador = this.physics.add.sprite(256, 200, 'ninja'); 
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);
    this.jugador.body.setSize(10, 16);
    this.jugador.body.setOffset(3, 0);

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    this.physics.add.collider(this.jugador, this.bloquesFisicos);
    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos);

    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarDemonio, null, this);

    this.timerItems = this.time.addEvent({ delay: 1200, callback: this.spawnearItem, callbackScope: this, loop: true });
    this.timerDemonios = this.time.addEvent({ delay: 3500, callback: this.spawnearDemonio, callbackScope: this, loop: true });

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true });
    this.teclado = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-stun', frames: this.anims.generateFrameNumbers('ninja', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });

    this.jugador.isStunned = false;
    this.jugador.isInvul = false;
  }

  update() {
    if (this.juegoTerminado) return;

    if (!this.jugador.isStunned) {
      if (this.teclado.left.isDown) { 
        this.jugador.setVelocityX(-140); 
        this.jugador.setFlipX(true); 
      } else if (this.teclado.right.isDown) { 
        this.jugador.setVelocityX(140); 
        this.jugador.setFlipX(false); 
      } else { 
        this.jugador.setVelocityX(0); 
      }

      if (this.teclado.up.isDown && this.jugador.body.touching.down) {
        this.jugador.setVelocityY(-420); 
        this.sound.play('snd-salto', { volume: 1 }); 
      }

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
    } else {
      this.jugador.anims.play('moncho-stun', true);
    }

    this.items.getChildren().forEach(item => {
      if (item.body.touching.down) {
        item.setVelocityX(item.body.velocity.x * 0.92);
        if (Math.abs(item.body.velocity.x) < 1) item.setVelocityX(0);
      } else {
        if (item.body.velocity.y > 0) item.yaRestoPuntosEsteRebote = false;
      }
    });

    this.enemigos.getChildren().forEach(demonio => {
      if (demonio.body.touching.down) {
        
        // --- LÓGICA DEL PRIMER REBOTE CON CATÁLOGO ---
        if (!demonio.primerReboteHecho) {
          demonio.primerReboteHecho = true;
          // Genera un rebote aleatorio usando los datos guardados en el demonio
          // Nota: en Phaser, valores en Y más negativos saltan más alto.
          const fuerzaReboteY = Phaser.Math.Between(demonio.reboteYMax, demonio.reboteYMin);
          demonio.setVelocityY(fuerzaReboteY);
        }

        demonio.setVelocityX(demonio.body.velocity.x * 0.98); 
        if (Math.abs(demonio.body.velocity.x) < 1) demonio.setVelocityX(0);
      }
      
      if (demonio.body.velocity.x < 0) demonio.setFlipX(true); 
      else if (demonio.body.velocity.x > 0) demonio.setFlipX(false); 

      if (demonio.body.velocity.y < 0) demonio.setFrame(0); 
      else if (demonio.body.velocity.y > 0) demonio.setFrame(1); 
    });
  }

  procesarImpactoPiso(obj1, obj2) {
    const item = this.items.contains(obj1) ? obj1 : obj2;
    if (!item.yaRestoPuntosEsteRebote) {
      if (item.body.velocity.y < -10) { 
        item.yaRestoPuntosEsteRebote = true; 
        item.valorPuntos -= 5;
        item.setAlpha(item.valorPuntos / 100);
        if (item.valorPuntos <= 0) item.destroy();
      }
    }
  }

  tickReloj() {
    this.tiempoRestante--;
    this.events.emit('actualizar-tiempo', this.tiempoRestante);
    
    if (this.tiempoRestante <= 0) this.finalizarJuego(false);
  }

  spawnearItem() {
    if (this.items.countActive(true) >= 8) return;
    const formaAleatoria = Phaser.Math.RND.pick(['cuadrado', 'triangulo', 'rombo']);
    const xAleatoria = Phaser.Math.Between(32, 480);

    const item = this.items.create(xAleatoria, -8, formaAleatoria);
    item.setBounce(0.75);
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(25, 80) * direccion;
    item.setVelocityX(velocidadX);

    item.setCollideWorldBounds(true);
    item.valorPuntos = 100;
    item.yaRestoPuntosEsteRebote = false;
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return;
    
    // Elegimos el tipo desde el catálogo
    const config = this.catalogoEnemigos['demonio_comun'];
    
    const demonio = this.enemigos.create(Phaser.Math.Between(32, 480), -8, config.textura);
    demonio.setBounce(1); 
    demonio.primerReboteHecho = false;
    
    // Asignamos las variables de rebote específicas de este enemigo
    demonio.reboteYMin = config.reboteYMin;
    demonio.reboteYMax = config.reboteYMax;
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(config.velXMin, config.velXMax) * direccion;
    demonio.setVelocityX(velocidadX);

    demonio.setCollideWorldBounds(true);
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    this.puntaje += item.valorPuntos;
    
    this.events.emit('talisman-recolectado', tipoItem);
    this.events.emit('actualizar-puntaje', this.puntaje);
    
    item.destroy(); 

    if (this.MODO_TALISMANES) {
      const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
      const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
      const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

      if (cuadrados >= 3 && triangulos >= 3 && rombos >= 3) {
        this.finalizarJuego(true);
      }
    } else {
      if (this.puntaje >= 1000) this.finalizarJuego(true);
    }
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul) return;

    if (jugador.body.velocity.y > 0 && jugador.y < demonio.y) {
      jugador.setVelocityY(-450); 
      this.sound.play('snd-salto', { volume: 1 });
      
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);

      if (this.PISOTON_INVIERTE_DEMONIO) demonio.setVelocityY(250); 

      jugador.isInvul = true;
      this.tweens.add({ targets: jugador, alpha: 0.5, duration: 100, yoyo: true, repeat: 2, 
        onComplete: () => { jugador.isInvul = false; jugador.setAlpha(1); }
      });
    } else {
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);

      jugador.isStunned = true;
      jugador.isInvul = true;
      jugador.setVelocity(jugador.x < demonio.x ? -180 : 180, -220); 

      this.time.delayedCall(500, () => {
        jugador.isStunned = false; 
        this.tweens.add({ targets: jugador, alpha: 0.2, duration: 100, yoyo: true, repeat: 5, 
          onComplete: () => { jugador.isInvul = false; jugador.setAlpha(1); }
        });
      });
    }
  }

  finalizarJuego(ganaste) {
    this.juegoTerminado = true;
    this.physics.pause();
    this.relojJuego.remove();
    this.timerItems.remove();
    this.timerDemonios.remove();

    this.sound.stopAll(); 
    this.sound.play(ganaste ? 'musica-win' : 'musica-lose', { volume: 0.5 });

    this.events.emit('juego-terminado', { ganaste: ganaste, puntos: this.puntaje });

    this.time.delayedCall(1500, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.stopAll(); 
        this.scene.stop('UIScene');
        this.scene.restart();
      });
    });
  }
}
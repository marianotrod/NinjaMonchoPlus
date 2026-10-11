import Ninja from './Ninja.js'; 
import { i18n } from '../i18n.js'; 

export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  init(data) {
    this.cantidadJugadores = data.jugadores || 1; 
  }

  preload() {
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    
    this.load.spritesheet('MapTileSet', 'public/assets/MapTileSet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja_coop', 'public/assets/NinjaCoopSprite.png', { frameWidth: 16, frameHeight: 16 });
    
    this.load.spritesheet('cuadrado', 'public/assets/cuadrado.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('triangulo', 'public/assets/triangulo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('rombo', 'public/assets/rombo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('coin', 'public/assets/coin.png', { frameWidth: 16, frameHeight: 16 });
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
    this.DEBUG_DEMONIOS = true; 

    this.scene.launch('UIScene');
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

    this.catalogoEnemigos = {
      'demonio_comun': {
        textura: 'demonio',
        velXMin: 45, velXMax: 100, 
        reboteYMin: -100, reboteYMax: -220  
      }
    };

    this.bloquesFisicos = this.physics.add.staticGroup();

    const _ = '';
    const L = 'CR01TL', R = 'CR01TR', P = 'CP01TC'; 
    const H1 = 'CH01TC', H2 = 'CH02TC', H3 = 'CH03TC'; 
    
    const M1 = 'M1'; 
    const C2 = 'C2'; 
    
    this.spawnMonchoX = 240; 
    this.spawnCoopX = 272;   

    const mapaNivel = [
      /* -02 */ [L,_,_,_,_,M1,_,_,_,_,_,_,_,_,_,_,_,_,C2,_,_,_,_,_,_,_,_,_,_,_,_,R], 
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

        const posX = (indiceColumna * 16) + 8;
        const posY = ((indiceFila - FILAS_OFFSCREEN) * 16) + 8;

        if (codigo === M1) { this.spawnMonchoX = posX; return; }
        if (codigo === C2) { this.spawnCoopX = posX; return; }

        const datosPieza = this.catalogoPiezas[codigo];
        if (!datosPieza) return;

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

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    this.jugador = new Ninja(this, this.spawnMonchoX, -32);
    this.conectarFisicasJugador(this.jugador);

    if (this.cantidadJugadores === 2) {
      this.crearPlayer2();
    } else {
      this.prepararHotJoin(); 
    }

    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos);

    this.timerDemonios = this.time.addEvent({ delay: 2000, callback: this.spawnearDemonio, callbackScope: this, loop: true });
    
    const bolsaInicial = [
      'cuadrado', 'cuadrado', 'cuadrado', 'cuadrado',
      'triangulo', 'triangulo', 'triangulo', 'triangulo',
      'rombo', 'rombo', 'rombo', 'rombo'
    ];
    Phaser.Utils.Array.Shuffle(bolsaInicial);

    this.time.addEvent({ 
      delay: 150, 
      repeat: 11, 
      callback: () => {
        const forma = bolsaInicial.pop(); 
        this.spawnearItem(forma); 
      }, 
      callbackScope: this 
    });

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true });
    this.teclaEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-stun', frames: this.anims.generateFrameNumbers('ninja', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });

    this.anims.create({ key: 'coop-idle', frames: [{ key: 'ninja_coop', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'coop-caminar', frames: this.anims.generateFrameNumbers('ninja_coop', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'coop-saltar', frames: [{ key: 'ninja_coop', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'coop-caer', frames: [{ key: 'ninja_coop', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'coop-stun', frames: this.anims.generateFrameNumbers('ninja_coop', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });
  }

  conectarFisicasJugador(jugador) {
    this.physics.add.collider(jugador, this.bloquesFisicos);
    this.physics.add.overlap(jugador, this.items, (j, item) => {
      this.recolectarItem(j, item);
    }, null, this);
    this.physics.add.overlap(jugador, this.enemigos, (j, demonio) => {
      this.tocarDemonio(j, demonio);
    }, null, this);
  }

prepararHotJoin() {
    this.teclaW_P2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.hotJoinTimer = 0;

    // Contenedor posicionado a la derecha, debajo del piso (ajustá este 268 si lo querés más arriba o abajo)
    this.uiHotJoin = this.add.container(496, 284);
    this.uiHotJoin.setDepth(100);

    // Texto alineado a la derecha (Origin 1)
    const txtHotJoin = this.add.text(0, -6, i18n.t('hotjoin_prompt'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff',
      resolution: 10
    }).setOrigin(1, 0.5); 

    // Fondo negro: Mide 60px y está anclado a la derecha. (Va del pixel -60 al 0).
    const bgBarra = this.add.rectangle(0, 1, 60, 4, 0x000000, 0.5).setOrigin(1, 0.5);
    
    // Barrita blanca: Arranca a la izquierda del fondo negro (-59 para dejar 1px de margen) y crece a la derecha.
    this.barraHotJoin = this.add.rectangle(-59, 1, 0, 2, 0xffffff).setOrigin(0, 0.5);

    this.uiHotJoin.add([txtHotJoin, bgBarra, this.barraHotJoin]);
  }

  crearPlayer2(esMidGame = false) {
    this.cantidadJugadores = 2;
    if (this.uiHotJoin) this.uiHotJoin.destroy(); 

    const teclasP2 = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.jugador2 = new Ninja(this, this.spawnCoopX, -32, 'ninja_coop', teclasP2, 'coop');
    this.conectarFisicasJugador(this.jugador2);

    if (esMidGame) {
      this.reproducirSonido('snd-salto', 1);
      
      const cartel = this.add.text(496, 268, i18n.t('hotjoin_joined'), {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#FBBF24', // Usamos 'color' en lugar de 'fill'
        resolution: 10
      }).setOrigin(1, 0.5).setDepth(200);

      // Temporizador que alterna el color 18 veces (aprox 1.8 segundos)
      let esNaranja = true;
      this.time.addEvent({
        delay: 100, 
        repeat: 18, 
        callback: () => {
          esNaranja = !esNaranja;
          cartel.setColor(esNaranja ? '#FBBF24' : '#FFFFFF');
        }
      });

      // El tween original que lo hace flotar y desaparecer
      this.tweens.add({
        targets: cartel,
        y: 230, alpha: 0, duration: 2000, ease: 'Power1',
        onComplete: () => cartel.destroy()
      });
    }
  }

  update(time, delta) {
    if (this.juegoTerminado) return;

    if (Phaser.Input.Keyboard.JustDown(this.teclaEnter)) {
      this.DEBUG_DEMONIOS = !this.DEBUG_DEMONIOS; 
      this.physics.world.drawDebug = this.DEBUG_DEMONIOS;
      if (!this.DEBUG_DEMONIOS) {
        this.physics.world.debugGraphic.clear(); 
      }
      this.enemigos.getChildren().forEach(demonio => {
        if (demonio.textoDebug) demonio.textoDebug.setVisible(this.DEBUG_DEMONIOS);
      });
    }

    if (this.cantidadJugadores === 1 && this.uiHotJoin) {
      if (this.teclaW_P2.isDown) {
        this.hotJoinTimer += delta; 
        let progreso = Phaser.Math.Clamp(this.hotJoinTimer / 1000, 0, 1);
        this.barraHotJoin.width = 58 * progreso; 

        if (this.hotJoinTimer >= 1000) {
          this.crearPlayer2(true); 
        }
      } else {
        this.hotJoinTimer = 0;
        this.barraHotJoin.width = 0;
      }
    }

    this.jugador.update();
    if (this.jugador2) this.jugador2.update();

    this.items.getChildren().forEach(item => {
      if (item.body.touching.down) {
        item.setVelocityX(item.body.velocity.x * 0.92); 
        if (Math.abs(item.body.velocity.x) < 1) item.setVelocityX(0); 
      } else {
        if (item.body.velocity.y > 0) item.yaRestoPuntosEsteRebote = false;
      }
    });

    this.enemigos.getChildren().forEach(demonio => {
      if (this.DEBUG_DEMONIOS && demonio.textoDebug) {
        demonio.textoDebug.setPosition(demonio.x, demonio.y - 18);
        demonio.textoDebug.setText(`Y: ${demonio.ultimoReboteY}\nC: ${demonio.contadorRebotes}`);
      }

      if (demonio.body.touching.down) {
        if (demonio.body.velocity.y > demonio.reboteYMin || demonio.body.velocity.y < demonio.reboteYMax) {
          const fuerzaAleatoria = Phaser.Math.Between(demonio.reboteYMax, demonio.reboteYMin);
          demonio.setVelocityY(fuerzaAleatoria);
        }

        let fuerzaActual = Math.round(demonio.body.velocity.y);

        if (Math.abs(fuerzaActual - demonio.ultimoReboteY) <= 5) {
          demonio.contadorRebotes++; 
        } else {
          demonio.contadorRebotes = 1; 
          demonio.ultimoReboteY = fuerzaActual;
          demonio.enModoAntiLoop = false;
        }

        if (demonio.contadorRebotes >= 3) {
          demonio.enModoAntiLoop = true;
        }

        if (demonio.enModoAntiLoop) {
          if (Math.random() < 0.70) { 
            let nuevaFuerza;
            if (fuerzaActual > demonio.reboteYMax + 5) {
              nuevaFuerza = Phaser.Math.Between(demonio.reboteYMax, fuerzaActual - 5);
            } else {
              nuevaFuerza = Phaser.Math.Between(fuerzaActual + 5, demonio.reboteYMin);
            }

            demonio.setVelocityY(nuevaFuerza); 
            demonio.ultimoReboteY = Math.round(nuevaFuerza);
            
            demonio.enModoAntiLoop = false;
            demonio.contadorRebotes = 0; 
          }
        }
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
        
        if (item.valorPuntos <= 0) {
          const esTalisman = item.esTalisman; 
          const tipoTextura = item.texture.key;
          
          item.destroy();

          if (esTalisman) {
            this.spawnearItem(tipoTextura); 
          } else {
            this.spawnearMoneda(); 
          }
        }
      }
    }
  }

  tickReloj() {
    this.tiempoRestante--;
    this.events.emit('actualizar-tiempo', this.tiempoRestante); 
    
    if (this.tiempoRestante <= 0) this.finalizarJuego(false);
  }

  spawnearItem(forma) {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, forma);
    
    item.esTalisman = true; 
    item.setBounce(0.75); 
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(25, 80) * direccion;
    item.setVelocityX(velocidadX);

    item.setCollideWorldBounds(true); 
    item.valorPuntos = 100; 
    item.yaRestoPuntosEsteRebote = false; 
  }

  spawnearMoneda() {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, 'coin');
    
    item.esTalisman = false; 
    item.setBounce(0.75); 
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(25, 80) * direccion;
    item.setVelocityX(velocidadX);

    item.setCollideWorldBounds(true); 
    item.valorPuntos = 50; 
    item.yaRestoPuntosEsteRebote = false; 
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return; 
    
    const config = this.catalogoEnemigos['demonio_comun'];
    
    const demonio = this.enemigos.create(Phaser.Math.Between(32, 480), -8, config.textura);
    demonio.setBounce(1);  
    
    demonio.reboteYMin = config.reboteYMin;
    demonio.reboteYMax = config.reboteYMax;

    demonio.ultimoReboteY = 0;
    demonio.contadorRebotes = 0;
    demonio.enModoAntiLoop = false;

    demonio.textoDebug = this.add.text(demonio.x, demonio.y - 18, '', {
      fontSize: '9px',
      fill: '#00ff00',
      backgroundColor: '#000000AA',
      align: 'center'
    }).setOrigin(0.5, 1);
    demonio.textoDebug.setDepth(10);
    demonio.textoDebug.setVisible(this.DEBUG_DEMONIOS);
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(config.velXMin, config.velXMax) * direccion;
    demonio.setVelocityX(velocidadX);

    demonio.setCollideWorldBounds(true);
  }

  reproducirSonido(key, volumen = 0.5) {
    try {
      this.sound.play(key, { volume: volumen });
    } catch (e) {
      console.warn(`No se pudo reproducir el sonido: ${key}`);
    }
  }

  mostrarTextoFlotante(x, y, texto, color = '#ffffff') {
    const flotante = this.add.text(x, y, texto, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: color,
      resolution: 10
    }).setOrigin(0.5);

    this.tweens.add({
      targets: flotante,
      y: y - 25,
      alpha: 0,
      duration: 500,
      ease: 'Power1',
      onComplete: () => {
        flotante.destroy();
      }
    });
  }

  recolectarItem(jugador, item) {
    if (jugador.isSpawning) return; 
    if (!item || !item.active) return; 

    const puntosGanados = item.valorPuntos;
    this.puntaje += puntosGanados; 
    this.events.emit('actualizar-puntaje', this.puntaje);
    
    const colorTexto = puntosGanados >= 100 ? '#4ADE80' : '#FBBF24';
    this.mostrarTextoFlotante(item.x, item.y, `+${puntosGanados}`, colorTexto);
    this.reproducirSonido('snd-salto', 0.5);

    if (item.esTalisman) {
      const tipoItem = item.texture.key; 
      this.inventario.push(tipoItem); 
      this.events.emit('talisman-recolectado', tipoItem);
      
      if (this.MODO_TALISMANES) {
        const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
        const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
        const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

        if (cuadrados >= 3 && triangulos >= 3 && rombos >= 3) {
          this.finalizarJuego(true);
        }
      }
    }

    item.destroy(); 
    this.spawnearMoneda(); 

    if (!this.MODO_TALISMANES && this.puntaje >= 1000) {
      this.finalizarJuego(true);
    }
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul || jugador.isSpawning) return; 

    if (jugador.body.velocity.y > 0 && jugador.y < demonio.y) {
      jugador.hacerPisoton();
      
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);
      this.mostrarTextoFlotante(demonio.x, demonio.y, `-50`, '#EF4444');

      if (this.PISOTON_INVIERTE_DEMONIO) {
        demonio.setVelocityY(250); 
        demonio.ultimoReboteY = 0;
        demonio.contadorRebotes = 0;
      }
    } else {
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);
      this.mostrarTextoFlotante(jugador.x, jugador.y, `-50`, '#EF4444');

      jugador.aplicarDaño(demonio.x);
    }
  }

  finalizarJuego(ganaste) {
    this.juegoTerminado = true; 
    this.physics.pause(); 
    
    this.relojJuego.remove();
    this.timerDemonios.remove();

    this.sound.stopAll(); 
    this.reproducirSonido(ganaste ? 'musica-win' : 'musica-lose', 0.5);

    this.events.emit('juego-terminado', { ganaste: ganaste, puntos: this.puntaje });

    this.time.delayedCall(1500, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.stopAll(); 
        this.scene.stop('UIScene'); 
        this.scene.restart({ jugadores: this.cantidadJugadores }); 
      });
    });
  }
}
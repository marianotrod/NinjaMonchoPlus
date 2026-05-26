export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    // Assets Visuales
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    
    // Matriz modular 16x16 (se escalará a 32x32 en el create)
    this.load.spritesheet('MapTileSet', 'public/assets/MapTileSet.png', { 
        frameWidth: 16, 
        frameHeight: 16 
    });
    
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', {
        frameWidth: 16,
        frameHeight: 16
    });

    this.load.image('cuadrado', 'public/assets/cuadrado.png');
    this.load.image('triangulo', 'public/assets/triangulo.png');
    this.load.image('rombo', 'public/assets/rombo.png');
    this.load.spritesheet('demonio', 'public/assets/demonio.png', { frameWidth: 16, frameHeight: 16 });

    // Audios y Efectos
    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
    this.load.audio('musica-win', ['public/assets/WinMusic.ogg', 'public/assets/WinMusic.mp3']);
    this.load.audio('musica-lose', ['public/assets/LoseMusic.ogg', 'public/assets/LoseMusic.mp3']);
  }

  create() {
    console.log("¡Matriz Escala x2 cargada correctamente con mapa manual!");

    this.juegoTerminado = false;

    // 🔮 INTERRUPTOR DE MODO DE JUEGO
    this.MODO_TALISMANES = true;
    this.PISOTON_INVIERTE_DEMONIO = true;

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

    this.add.image(400, 300, 'fondo-cielo').setDisplaySize(800, 600);

    // 🏷️ 1. CATÁLOGO DE PIEZAS
    this.catalogoPiezas = {
        // ROCAS SOLIDAS OSCURAS
        'CR01TL': { frame: 0,  tipo: 'solido' },   
        'CR01TR': { frame: 1,  tipo: 'solido' },   
        'CR01BL': { frame: 10,  tipo: 'solido' },   
        'CR01BR': { frame: 11,  tipo: 'solido' },  
        //ROCAS SOLIDAS CLARAS 
        'CR02TL': { frame: 2,  tipo: 'solido' },  
        'CR02TR': { frame: 3,  tipo: 'solido' },  
        'CR02BL': { frame: 12,  tipo: 'solido' },   
        'CR02BR': { frame: 13,  tipo: 'solido' }, 
        //PASTO
        'CP01TC': { frame: 4,  tipo: 'solido' },  
        'CP02TC': { frame: 14,  tipo: 'solido' }, 
        'PP01TC': { frame: 15,  tipo: 'fondo' }, 
        'PP02TC': { frame: 16,  tipo: 'fondo' }, 
        'PP03TC': { frame: 17,  tipo: 'fondo' }, 
        //HIELO
        'CH01TC': { frame: 40,  tipo: 'pasarela' },
        'CH02TC': { frame: 41,  tipo: 'pasarela' },
        'CH03TC': { frame: 42,  tipo: 'pasarela' },
        'CH01CC': { frame: 50,  tipo: 'fondo' },
        'CH02CC': { frame: 51,  tipo: 'fondo' },
        'CH03CC': { frame: 52,  tipo: 'fondo' },
        'CH04CC': { frame: 53,  tipo: 'fondo' },
        'CH01BC': { frame: 60,  tipo: 'fondo' },
        'CH02BC': { frame: 61,  tipo: 'fondo' },  
        'CH03BC': { frame: 62,  tipo: 'fondo' }
    };

    // 🧱 2. GRUPO FÍSICO ESTÁTICO
    this.bloquesFisicos = this.physics.add.staticGroup();

    // 🗺️ 3. MAPA DEFINIDO A MANO (25 columnas x 19 filas - Escala x2)
    const mapaNivel = [
        ['CR01TL','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR','CR01TR'], // Fila 0 (Techo)
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 1
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 2
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 3
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 4
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 5
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 6
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 7
        ['CR01TL',    '',     '',     '',     '', 'CH01TC','CH02TC','CH02TC','CH03TC',  '',     '',     '',     '',     '',     '', 'CH01TC','CH02TC','CH02TC','CH03TC',  '',     '',     '',     '',     '', 'CR01TR'], // Fila 8
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CH01CC',   '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 9
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 10
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 11
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 12
        ['CR01TL',    '', 'CR01TL','CR01TR','CR01TL','CR01TR',  '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',  '', 'CH01TC','CH02TC','CH02TC','CH03TC',  '', 'CR01TR'], // Fila 13
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 14
        ['CR01TL',    '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '',     '', 'CR01TR'], // Fila 15
        ['CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC','CP01TC'], // Fila 16
        ['CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL'], // Fila 17
        ['CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL','CR02BL']  // Fila 18
    ];

    // 🛠️ 4. BUCLE PROCESADOR DE LA GRILLA
    mapaNivel.forEach((fila, indiceFila) => {
        fila.forEach((codigo, indiceColumna) => {
            if (codigo === '') return;

            const datosPieza = this.catalogoPiezas[codigo];
            if (!datosPieza) return;

            const posX = (indiceColumna * 32) + 16;
            const posY = (indiceFila * 32) + 16;

            let bloque;

            if (datosPieza.tipo !== 'fondo') {
                bloque = this.bloquesFisicos.create(posX, posY, 'MapTileSet', datosPieza.frame);
                bloque.setScale(2);
                bloque.body.updateFromGameObject();

                if (datosPieza.tipo === 'pasarela') {
                    bloque.body.checkCollision.up = true;
                    bloque.body.checkCollision.down = false;
                    bloque.body.checkCollision.left = false;
                    bloque.body.checkCollision.right = false;
                }
            } else {
                bloque = this.add.image(posX, posY, 'MapTileSet', datosPieza.frame);
                bloque.setScale(2);
            }
        });
    });

    // Jugador
    this.jugador = this.physics.add.sprite(400, 100, 'ninja'); 
    this.jugador.setScale(2);
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    // 🛑 COLIDERS
    this.physics.add.collider(this.jugador, this.bloquesFisicos);
    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos);

    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarDemonio, null, this);

    this.timerItems = this.time.addEvent({ delay: 1000, callback: this.spawnearItem, callbackScope: this, loop: true });
    this.timerDemonios = this.time.addEvent({ delay: 3000, callback: this.spawnearDemonio, callbackScope: this, loop: true });

    // TEXTOS
    this.textoPuntaje = this.add.text(20, 20, 'Puntos: 0', { 
        fontSize: '24px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    });

    this.textoTiempo = this.add.text(780, 20, 'Tiempo: 20', { 
        fontSize: '24px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4,
        padding: { top: 8, bottom: 8, left: 4, right: 4 } 
    }).setOrigin(1, 0);

    // HUD CENTRAL
    this.hudTalismanes = { cuadrado: [], triangulo: [], rombo: [] };

    if (this.MODO_TALISMANES) {
        const configuracionGrupos = {
            cuadrado: { xInicio: 260 },
            triangulo: { xInicio: 370 },
            rombo: { xInicio: 480 }
        };
        const separacionX = 20;

        ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
            const conf = configuracionGrupos[tipo];
            for (let i = 0; i < 3; i++) {
                const x = conf.xInicio + (i * separacionX);
                const y = 32; 
                const icono = this.add.image(x, y, tipo);
                this.hudTalismanes[tipo].push(icono);
            }
        });
    }

    document.fonts.ready.then(() => {
        if (this.textoPuntaje && this.textoPuntaje.scene) this.textoPuntaje.updateText();
        if (this.textoTiempo && this.textoTiempo.scene) this.textoTiempo.updateText();
    });

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true });

    this.teclado = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-stun', frames: this.anims.generateFrameNumbers('ninja', { start: 10, end: 13}), frameRate: 12, repeat: -1 });

    this.jugador.isStunned = false;
    this.jugador.isInvul = false;
  }

  update() {
    if (this.juegoTerminado) return;

    if (!this.jugador.isStunned) {
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
    } else {
        this.jugador.anims.play('moncho-stun', true);
    }

    this.items.getChildren().forEach(item => {
        if (item.textoDebug) { item.textoDebug.setPosition(item.x, item.y - 25); item.textoDebug.setText(item.valorPuntos); }
        if (item.body.touching.down) {
            item.setVelocityX(item.body.velocity.x * 0.92);
            if (Math.abs(item.body.velocity.x) < 1) item.setVelocityX(0);
        } else {
            if (item.body.velocity.y > 0) item.yaRestoPuntosEsteRebote = false;
        }
    });

    this.enemigos.getChildren().forEach(demonio => {
        if (demonio.body.touching.down) {
            demonio.setVelocityX(demonio.body.velocity.x * 0.98); 
            if (Math.abs(demonio.body.velocity.x) < 1) demonio.setVelocityX(0);
        }
        if (demonio.body.velocity.x < 0) { demonio.setFlipX(true); } 
        else if (demonio.body.velocity.x > 0) { demonio.setFlipX(false); }

        if (demonio.body.velocity.y < 0) { demonio.setFrame(0); } 
        else if (demonio.body.velocity.y > 0) { demonio.setFrame(1); }
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
        this.finalizarJuego(false);
    }
  }

  spawnearItem() {
    if (this.items.countActive(true) >= 8) return;

    const formas = ['cuadrado', 'triangulo', 'rombo'];
    const formaAleatoria = Phaser.Math.RND.pick(formas);
    const xAleatoria = Phaser.Math.Between(32, 768);

    const item = this.items.create(xAleatoria, 20, formaAleatoria);
    item.setScale(2);
    item.setBounce(0.75);
    item.setVelocityX(Phaser.Math.Between(-120, 120));
    item.setCollideWorldBounds(true);

    item.valorPuntos = 100;
    item.yaRestoPuntosEsteRebote = false;

    item.textoDebug = this.add.text(xAleatoria, -40, '100', { 
        fontSize: '16px', fill: '#FFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return;
    const xAleatoria = Phaser.Math.Between(32, 768);
    const demonio = this.enemigos.create(xAleatoria, 20, 'demonio');
    demonio.setScale(2);
    
    demonio.setBounce(1); 
    demonio.setVelocityX(Phaser.Math.Between(-150, 150)); 
    demonio.setCollideWorldBounds(true);
    demonio.clearTint(); 
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    this.puntaje += item.valorPuntos;
    this.textoPuntaje.setText('Puntos: ' + this.puntaje);
    
    if (item.textoDebug) item.textoDebug.destroy();
    item.destroy(); 

    if (this.MODO_TALISMANES) {
        const listaIconosHUD = this.hudTalismanes[tipoItem];
        if (listaIconosHUD && listaIconosHUD.length > 0) {
            const iconoABorrar = listaIconosHUD.pop();
            if (iconoABorrar) iconoABorrar.destroy();
        }

        const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
        const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
        const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

        if (cuadrados >= 3 && triangulos >= 3 && rombos >= 3) {
            this.finalizarJuego(true);
        }
    } else {
        if (this.puntaje >= 1000) {
            this.finalizarJuego(true);
        }
    }
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul) return;

    const leCayoEnLaCabeza = jugador.body.velocity.y > 0 && jugador.y < demonio.y;

    if (leCayoEnLaCabeza) {
        jugador.setVelocityY(-550); 
        this.sound.play('snd-salto', { volume: 1 });
        
        this.puntaje -= 50;
        if (this.puntaje < 0) this.puntaje = 0;
        this.textoPuntaje.setText('Puntos: ' + this.puntaje);

        if (this.PISOTON_INVIERTE_DEMONIO) {
            demonio.setVelocityY(300); 
        }

        jugador.isInvul = true;
        
        this.tweens.add({
            targets: jugador,
            alpha: 0.5, 
            duration: 100, 
            yoyo: true,
            repeat: 2, 
            onComplete: () => {
                jugador.isInvul = false;
                jugador.setAlpha(1); 
            }
        });

    } else {
        this.puntaje -= 50;
        if (this.puntaje < 0) this.puntaje = 0;
        this.textoPuntaje.setText('Puntos: ' + this.puntaje);

        jugador.isStunned = true;
        jugador.isInvul = true;

        const fuerzaEmpujeX = jugador.x < demonio.x ? -200 : 200;
        jugador.setVelocity(fuerzaEmpujeX, -250); 

        this.time.delayedCall(500, () => {
            jugador.isStunned = false; 

            this.tweens.add({
                targets: jugador,
                alpha: 0.2, 
                duration: 100, 
                yoyo: true,
                repeat: 5, 
                onComplete: () => {
                    jugador.isInvul = false;
                    jugador.setAlpha(1); 
                }
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
      if (ganaste) {
          this.sound.play('musica-win', { volume: 0.5 });
      } else {
          this.sound.play('musica-lose', { volume: 0.5 });
      }

      const mensajeTitulo = ganaste ? '¡GANASTE!' : '¡PERDISTE!\n\n(Se acabó el tiempo!)';
      const colorTitulo = ganaste ? '#00FF00' : '#FF0000';

      this.add.text(400, 200, mensajeTitulo, {
          fontSize: '32px', fill: colorTitulo, fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 6, align: 'center'
      }).setOrigin(0.5);

      this.add.text(400, 340, `Puntos totales: ${this.puntaje}`, {
          fontSize: '24px', fill: '#FFFFFF', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5);
      
      this.time.delayedCall(2000, () => {
          this.add.text(400, 440, 'presiona ESPACIO para\nintentarlo otra vez', {
              fontSize: '16px', fill: '#AAAAAA', fontFamily: '"Press Start 2P"', stroke: '#000', strokeThickness: 4, align: 'center'
          }).setOrigin(0.5);

          this.input.keyboard.once('keydown-SPACE', () => {
              this.sound.stopAll(); 
              this.scene.restart();
          });
      });
  }
}
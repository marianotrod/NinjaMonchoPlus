import Ninja from './Ninja.js'; 
import { i18n } from '../i18n.js'; 
import { Bestiario } from './Bestiario.js';
import Enemigo from './Enemigo.js';
import ConstructorNivel from './ConstructorNivel.js'; // Importamos el nuevo gestor

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
    this.modoDiosActivo = false; 

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

    // --- DELEGAMOS LA CONSTRUCCIÓN DEL NIVEL ---
    const spawns = ConstructorNivel.construir(this);
    this.spawnMonchoX = spawns.spawnMonchoX;
    this.spawnCoopX = spawns.spawnCoopX;
    // -------------------------------------------

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    this.jugador = new Ninja(this, this.spawnMonchoX, -32);
    this.conectarFisicasJugador(this.jugador);

    if (this.cantidadJugadores === 2) {
      this.crearPlayer2();
    } else {
      this.prepararHotJoin(); 
    }

    // Los bloques físicos ya fueron creados por el ConstructorNivel
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
    this.teclaSupr = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    this.enemigosHabilitados = true;

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

  toggleModoDiosWinLose() {
    this.modoDiosActivo = !this.modoDiosActivo;
    console.log("🛠️ MODO TEST WIN/LOSE:", this.modoDiosActivo ? "ACTIVADO (Inmune a derrota/victoria)" : "DESACTIVADO (Normal)");
  }

  conectarFisicasJugador(jugador) {
    // ¡ACÁ ESTÁ LA MAGIA DEL FILTRO!
    this.physics.add.collider(jugador, this.bloquesFisicos, null, (j, bloque) => {
      if (j.quiereAtravesarOneWay && bloque.body.checkCollision.up && !bloque.body.checkCollision.down) {
          return false; // Lo deja pasar si aprieta abajo y es una pasarela
      }
      return true; // Choca normal contra el piso sólido "P" o las paredes
    }, this);

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

    this.uiHotJoin = this.add.container(496, 284);
    this.uiHotJoin.setDepth(100);

    const txtHotJoin = this.add.text(0, -6, i18n.t('hotjoin_prompt'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff',
      resolution: 10
    }).setOrigin(1, 0.5); 

    const bgBarra = this.add.rectangle(0, 1, 60, 4, 0x000000, 0.5).setOrigin(1, 0.5);
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
        color: '#FBBF24',
        resolution: 10
      }).setOrigin(1, 0.5).setDepth(200);

      let esNaranja = true;
      this.time.addEvent({
        delay: 100, 
        repeat: 18, 
        callback: () => {
          esNaranja = !esNaranja;
          cartel.setColor(esNaranja ? '#FBBF24' : '#FFFFFF');
        }
      });

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

      if (Phaser.Input.Keyboard.JustDown(this.teclaSupr)) {
      this.enemigosHabilitados = !this.enemigosHabilitados;
      
      if (!this.enemigosHabilitados) {
        this.timerDemonios.paused = true;
        const arrayEnemigos = this.enemigos.getChildren();
        for (let i = arrayEnemigos.length - 1; i >= 0; i--) {
          const demonio = arrayEnemigos[i];
          if (demonio.textoDebug) demonio.textoDebug.destroy();
          demonio.destroy();
        }
        this.enemigos.clear(true, true); 
      } else {
        this.timerDemonios.paused = false;
      }
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
        demonio.textoDebug.setText(`Y: ${demonio.ultimoReboteY || 0}\nC: ${demonio.contadorRebotes || 0}`);
      }
      demonio.actualizarComportamiento();
    });
  }

  procesarImpactoPiso(obj1, obj2) {
    const item = this.items.contains(obj1) ? obj1 : obj2; 
    
    if (item.esTalisman) return; 

    if (!item.yaRestoPuntosEsteRebote) {
      if (item.body.velocity.y < -10) { 
        item.yaRestoPuntosEsteRebote = true; 
        item.valorPuntos = Math.max(1, Math.floor(item.valorPuntos * 0.8));
        const porcentaje = Math.max(0, item.valorPuntos / 200); 
        const colorGB = Math.floor(255 * porcentaje); 
        item.setTint(Phaser.Display.Color.GetColor(255, colorGB, colorGB));
      }
    }
  }
   
  tickReloj() {
    this.tiempoRestante--;
    this.events.emit('actualizar-tiempo', this.tiempoRestante); 
    
    if (this.tiempoRestante <= 0 && !this.modoDiosActivo) {
      this.finalizarJuego(false);
    }
  }

  spawnearItem(forma) {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, forma);
    
    item.esTalisman = true; 
    item.setBounce(0.75); 
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    item.setVelocityX(Phaser.Math.Between(25, 80) * direccion);
    item.setCollideWorldBounds(true); 
    item.valorPuntos = 0; 
    item.yaRestoPuntosEsteRebote = false; 
  }

  spawnearMoneda() {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, 'coin');
    
    item.esTalisman = false; 
    item.setBounce(0.75); 
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    item.setVelocityX(Phaser.Math.Between(25, 80) * direccion);
    item.setCollideWorldBounds(true); 
    item.valorPuntos = 200; 
    item.yaRestoPuntosEsteRebote = false; 
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return; 
    
    const config = Bestiario['demonio_saltarin']; 
    const xAleatoria = Phaser.Math.Between(32, 480);
    
    const demonio = new Enemigo(this, xAleatoria, -8, config);
    this.enemigos.add(demonio);
    
    demonio.setCollideWorldBounds(true);
    demonio.arrancar();

    demonio.textoDebug = this.add.text(demonio.x, demonio.y - 18, '', {
      fontSize: '9px',
      fill: '#00ff00',
      backgroundColor: '#000000AA',
      align: 'center'
    }).setOrigin(0.5, 1);
    demonio.textoDebug.setDepth(10);
    demonio.textoDebug.setVisible(this.DEBUG_DEMONIOS);
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
    if (jugador.isSpawning || !item || !item.active) return; 

    if (item.esTalisman) {
      const tipoItem = item.texture.key; 
      this.inventario.push(tipoItem); 
      this.events.emit('talisman-recolectado', tipoItem);
      
      if (this.MODO_TALISMANES) {
        const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
        const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
        const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

        if (cuadrados >= 3 && triangulos >= 3 && rombos >= 3 && !this.modoDiosActivo) {
          this.finalizarJuego(true); 
        }
      }
    } else {
      this.puntaje += item.valorPuntos; 
      this.events.emit('actualizar-puntaje', this.puntaje);
      
      const colorTexto = item.valorPuntos >= 150 ? '#4ADE80' : (item.valorPuntos > 50 ? '#FBBF24' : '#EF4444');
      this.mostrarTextoFlotante(item.x, item.y, `+${item.valorPuntos}`, colorTexto);
    }

    this.reproducirSonido('snd-salto', 0.5);
    item.destroy(); 
    this.spawnearMoneda(); 
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul || jugador.isSpawning) return; 

    if (jugador.body.velocity.y > 0 && jugador.y < demonio.y) {
      jugador.hacerPisoton();
      if (this.PISOTON_INVIERTE_DEMONIO) {
        demonio.setVelocityY(250); 
        if (demonio.rasgos && demonio.rasgos.saltarin && demonio.rasgos.saltarin.activo) {
          demonio.ultimoReboteY = 0; demonio.contadorRebotes = 0;
        }
      }
    } else {
      jugador.aplicarDaño(demonio.x); 
      this.mostrarTextoFlotante(jugador.x, jugador.y, `¡OUCH!`, '#EF4444');

      if (this.MODO_TALISMANES && this.inventario.length > 0) {
        const cantidadPerdidos = this.inventario.length;
        const arrayPerdidos = [...this.inventario];
        
        this.inventario = []; 
        this.events.emit('inventario-perdido'); 

        arrayPerdidos.forEach(tipo => {
          let dummy = this.physics.add.sprite(jugador.x, jugador.y, tipo);
          dummy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-200, -350));
          this.tweens.add({
            targets: dummy, alpha: 0, duration: 800,
            onComplete: () => dummy.destroy()
          });
        });

        let monedasEnPantalla = this.items.getChildren().filter(i => !i.esTalisman);
        monedasEnPantalla.sort((a, b) => b.valorPuntos - a.valorPuntos); 
        let monedasABorrar = monedasEnPantalla.slice(0, cantidadPerdidos);
        monedasABorrar.forEach(m => m.destroy());

        this.time.delayedCall(1200, () => {
          arrayPerdidos.forEach((tipo, index) => {
            this.time.delayedCall(index * 250, () => this.spawnearItem(tipo));
          });
        });
      }
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
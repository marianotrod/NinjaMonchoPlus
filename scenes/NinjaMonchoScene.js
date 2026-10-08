export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  preload() {
    // Assets Visuales
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    
    // Spritesheets nativas de 16x16 (Escala 1:1)
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
    this.load.spritesheet('demonio', 'public/assets/demonio.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });

    // Audios
    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
    this.load.audio('musica-win', ['public/assets/WinMusic.ogg', 'public/assets/WinMusic.mp3']);
    this.load.audio('musica-lose', ['public/assets/LoseMusic.ogg', 'public/assets/LoseMusic.mp3']);
  }

  // Generador de texto binarizado sin antialiasing
  crearTextoCrisp(x, y, texto, size = 8, color = '#FFFFFF', align = 'left', originX = 0, originY = 0) {
    const textoMayus = String(texto).toUpperCase();
    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    ctx.font = `${size}px "Press Start 2P"`;
    const lineas = textoMayus.split('\n');
    const altoLinea = Math.ceil(size * 1.5);
    
    let anchoMax = 0;
    lineas.forEach(l => {
      const w = Math.ceil(ctx.measureText(l).width);
      if (w > anchoMax) anchoMax = w;
    });

    offscreen.width = anchoMax + 4;
    offscreen.height = (lineas.length * altoLinea) + 4;

    ctx.font = `${size}px "Press Start 2P"`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;

    lineas.forEach((linea, index) => {
      let posX = 0;
      if (align === 'center') posX = offscreen.width / 2;
      if (align === 'right') posX = offscreen.width;
      ctx.fillText(linea, posX, index * altoLinea);
    });

    const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = d[i + 3] > 80 ? 255 : 0;
    }
    ctx.putImageData(imgData, 0, 0);

    const key = `txt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.textures.addCanvas(key, offscreen);
    const tex = this.textures.get(key);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const img = this.add.image(Math.round(x), Math.round(y), key);
    img.setOrigin(originX, originY);
    img.textKey = key;
    return img;
  }

  actualizarTextoCrisp(imgObj, nuevoTexto, size = 8, color = '#FFFFFF', align = 'left') {
    if (!imgObj) return;
    const x = imgObj.x;
    const y = imgObj.y;
    const ox = imgObj.originX;
    const oy = imgObj.originY;

    if (imgObj.textKey && this.textures.exists(imgObj.textKey)) {
      this.textures.remove(imgObj.textKey);
    }
    imgObj.destroy();

    return this.crearTextoCrisp(x, y, nuevoTexto, size, color, align, ox, oy);
  }

  create() {
    this.juegoTerminado = false;
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

    // Fondo en 512x288 exactos
    this.add.image(256, 144, 'fondo-cielo').setDisplaySize(512, 288);

    // 1. Catálogo de piezas
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

    this.bloquesFisicos = this.physics.add.staticGroup();

    // 2. MAPA NATIVO 16x16: 32 columnas x 18 filas
    const _ = '';
    const T = 'CR01TR'; // Techo
    const L = 'CR01TL'; // Pared izquierda
    const R = 'CR01TR'; // Pared derecha
    const P = 'CP01TC'; // Piso pasto
    const S = 'CR02BL'; // Subsuelo
    const H1 = 'CH01TC', H2 = 'CH02TC', H3 = 'CH03TC'; // Pasarelas de hielo

    const mapaNivel = [
      /* 00 */ [L,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,R],
      /* 01 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 02 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 03 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 04 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 05 */ [L,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,R],
      /* 06 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 07 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 08 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 09 */ [L,_,_,H1,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,H1,H2,H3,_,_,R],
      /* 10 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 11 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 12 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 13 */ [L,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,R],
      /* 14 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 15 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
      /* 16 */ [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P],
      /* 17 */ [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S]
    ];

    mapaNivel.forEach((fila, indiceFila) => {
      fila.forEach((codigo, indiceColumna) => {
        if (codigo === '') return;

        const datosPieza = this.catalogoPiezas[codigo];
        if (!datosPieza) return;

        // Posicionamiento nativo 16x16 (centro en +8 px)
        const posX = (indiceColumna * 16) + 8;
        const posY = (indiceFila * 16) + 8;

        let bloque;
        if (datosPieza.tipo !== 'fondo') {
          bloque = this.bloquesFisicos.create(posX, posY, 'MapTileSet', datosPieza.frame);
          bloque.body.updateFromGameObject();

          if (datosPieza.tipo === 'pasarela') {
            bloque.body.checkCollision.up = true;
            bloque.body.checkCollision.down = false;
            bloque.body.checkCollision.left = false;
            bloque.body.checkCollision.right = false;
          }
        } else {
          bloque = this.add.image(posX, posY, 'MapTileSet', datosPieza.frame);
        }
      });
    });

    // 3. Jugador nativo 16x16
    this.jugador = this.physics.add.sprite(256, 200, 'ninja'); 
    this.jugador.setGravityY(600);
    this.jugador.setCollideWorldBounds(true);

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    // Colisiones
    this.physics.add.collider(this.jugador, this.bloquesFisicos);
    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos);

    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarDemonio, null, this);

    this.timerItems = this.time.addEvent({ delay: 1200, callback: this.spawnearItem, callbackScope: this, loop: true });
    this.timerDemonios = this.time.addEvent({ delay: 3500, callback: this.spawnearDemonio, callbackScope: this, loop: true });

    // 4. HUD Pixel-Perfect (8px)
    this.textoPuntaje = this.crearTextoCrisp(8, 8, 'PTS: 0', 8, '#FFFFFF');
    this.textoTiempo = this.crearTextoCrisp(504, 8, 'TIEMPO: 60', 8, '#FFFFFF', 'right', 1, 0);

    // 5. HUD Central de talismanes
    this.hudTalismanes = { cuadrado: [], triangulo: [], rombo: [] };

    if (this.MODO_TALISMANES) {
      const configuracionGrupos = {
        cuadrado: { xInicio: 200 },
        triangulo: { xInicio: 250 },
        rombo: { xInicio: 300 }
      };
      const separacionX = 12;

      ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
        const conf = configuracionGrupos[tipo];
        for (let i = 0; i < 3; i++) {
          const x = conf.xInicio + (i * separacionX);
          const y = 12; 
          const icono = this.add.image(x, y, tipo);
          this.hudTalismanes[tipo].push(icono);
        }
      });
    }

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
        demonio.setVelocityX(demonio.body.velocity.x * 0.98); 
        if (Math.abs(demonio.body.velocity.x) < 1) demonio.setVelocityX(0);
      }
      if (demonio.body.velocity.x < 0) { 
        demonio.setFlipX(true); 
      } else if (demonio.body.velocity.x > 0) { 
        demonio.setFlipX(false); 
      }

      if (demonio.body.velocity.y < 0) { 
        demonio.setFrame(0); 
      } else if (demonio.body.velocity.y > 0) { 
        demonio.setFrame(1); 
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
          item.destroy();
        }
      }
    }
  }

  tickReloj() {
    this.tiempoRestante--;
    this.textoTiempo = this.actualizarTextoCrisp(this.textoTiempo, `TIEMPO: ${this.tiempoRestante}`, 8, '#FFFFFF', 'right');
    
    if (this.tiempoRestante <= 0) {
      this.finalizarJuego(false);
    }
  }

  spawnearItem() {
    if (this.items.countActive(true) >= 8) return;

    const formas = ['cuadrado', 'triangulo', 'rombo'];
    const formaAleatoria = Phaser.Math.RND.pick(formas);
    const xAleatoria = Phaser.Math.Between(32, 480);

    const item = this.items.create(xAleatoria, 20, formaAleatoria);
    item.setBounce(0.75);
    item.setVelocityX(Phaser.Math.Between(-80, 80));
    item.setCollideWorldBounds(true);

    item.valorPuntos = 100;
    item.yaRestoPuntosEsteRebote = false;
  }

  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return;
    const xAleatoria = Phaser.Math.Between(32, 480);
    const demonio = this.enemigos.create(xAleatoria, 20, 'demonio');
    
    demonio.setBounce(1); 
    demonio.setVelocityX(Phaser.Math.Between(-100, 100)); 
    demonio.setCollideWorldBounds(true);
    demonio.clearTint(); 
  }

  recolectarItem(jugador, item) {
    const tipoItem = item.texture.key;
    this.inventario.push(tipoItem);
    this.puntaje += item.valorPuntos;
    this.textoPuntaje = this.actualizarTextoCrisp(this.textoPuntaje, `PTS: ${this.puntaje}`, 8, '#FFFFFF', 'left');
    
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
      jugador.setVelocityY(-450); 
      this.sound.play('snd-salto', { volume: 1 });
      
      this.puntaje -= 50;
      if (this.puntaje < 0) this.puntaje = 0;
      this.textoPuntaje = this.actualizarTextoCrisp(this.textoPuntaje, `PTS: ${this.puntaje}`, 8, '#FFFFFF', 'left');

      if (this.PISOTON_INVIERTE_DEMONIO) {
        demonio.setVelocityY(250); 
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
      this.textoPuntaje = this.actualizarTextoCrisp(this.textoPuntaje, `PTS: ${this.puntaje}`, 8, '#FFFFFF', 'left');

      jugador.isStunned = true;
      jugador.isInvul = true;

      const fuerzaEmpujeX = jugador.x < demonio.x ? -180 : 180;
      jugador.setVelocity(fuerzaEmpujeX, -220); 

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

    const mensajeTitulo = ganaste ? '¡GANASTE!' : '¡PERDISTE!\n\nTIEMPO AGOTADO';
    const colorTitulo = ganaste ? '#4ADE80' : '#EF4444';

    // 24px (3x)
    this.crearTextoCrisp(256, 90, mensajeTitulo, 24, colorTitulo, 'center', 0.5, 0.5);

    // 16px (2x)
    this.crearTextoCrisp(256, 170, `PUNTOS TOTALES: ${this.puntaje}`, 16, '#FFFFFF', 'center', 0.5, 0.5);
    
    // 8px (1x)
    this.time.delayedCall(1500, () => {
      this.crearTextoCrisp(256, 220, 'PRESIONA ESPACIO\nPARA REINTENTAR', 8, '#FBBF24', 'center', 0.5, 0.5);

      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.stopAll(); 
        this.scene.restart();
      });
    });
  }
}
// Exportamos la clase para que Phaser sepa que esta es una escena del juego.
export default class NinjaMonchoScene extends Phaser.Scene {
  
  // El constructor es el "DNI" de la escena. Le da un nombre interno para que Phaser la reconozca.
  constructor() {
    super("NinjaMonchoScene");
  }

  // PRELOAD: Es la etapa de "comprar los ingredientes". 
  // Phaser descarga todas las imágenes y sonidos a la memoria ANTES de empezar el juego.
  preload() {
    this.load.image('fondo-cielo', 'public/assets/Cielo.webp'); 
    
    // Spritesheets: Son tiras de imágenes. Le decimos cuánto mide cada "cuadrito" (16x16) para que pueda animarlos.
    this.load.spritesheet('MapTileSet', 'public/assets/MapTileSet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja', 'public/assets/NinjaSpriteSheet.png', { frameWidth: 16, frameHeight: 16 });
    
    // Talismanes como spritesheets (por si después los animamos)
    this.load.spritesheet('cuadrado', 'public/assets/cuadrado.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('triangulo', 'public/assets/triangulo.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('rombo', 'public/assets/rombo.png', { frameWidth: 16, frameHeight: 16 });
    
    // La moneda como spritesheet para futuras animaciones
    this.load.spritesheet('coin', 'public/assets/coin.png', { frameWidth: 16, frameHeight: 16 });

    this.load.spritesheet('demonio', 'public/assets/demonio.png', { frameWidth: 16, frameHeight: 16 });

    // Audio: Le pasamos .ogg y .mp3 para que funcione en cualquier navegador.
    this.load.audio('musica-fondo', ['public/assets/GameMusic.ogg', 'public/assets/GameMusic.mp3']);
    this.load.audio('snd-salto', ['public/assets/Jump.ogg', 'public/assets/Jump.mp3']);
    this.load.audio('snd-caida', ['public/assets/fall.ogg', 'public/assets/fall.mp3']);
    this.load.audio('musica-win', ['public/assets/WinMusic.ogg', 'public/assets/WinMusic.mp3']);
    this.load.audio('musica-lose', ['public/assets/LoseMusic.ogg', 'public/assets/LoseMusic.mp3']);
  }

  // CREATE: Es la etapa de "armar el escenario". Se ejecuta una sola vez cuando arranca el nivel.
  create() {
    // Variables de control del juego
    this.juegoTerminado = false; // Switch para apagar los controles cuando perdés/ganás
    this.MODO_TALISMANES = true; // Si es true, ganás juntando 3 de cada. Si es false, por 1000 puntos.
    this.PISOTON_INVIERTE_DEMONIO = true; // Si es true, saltarle en la cabeza a un demonio lo empuja hacia abajo.
    
    // Switch para ver los textos verdes con los números del Anti-Loop de los demonios
    this.DEBUG_DEMONIOS = true; 

    // Lanzamos la escena de la Interfaz (UI) en paralelo, para que se dibuje por encima del juego.
    this.scene.launch('UIScene');

    // Definimos los límites del mundo físico. El jugador y los bichos no pueden salir de esta caja.
    // Arranca en Y: -32 para que los ítems puedan spawnear por arriba del techo y caer.
    this.physics.world.setBounds(0, -32, 512, 320);

    // Reproducir música de fondo. Verificamos que no esté sonando ya para que no se superpongan audios.
    let musicaFondo = this.sound.get('musica-fondo');
    if (!musicaFondo) {
      musicaFondo = this.sound.add('musica-fondo', { loop: true, volume: 0.4 });
    }
    if (!musicaFondo.isPlaying) {
      musicaFondo.play();
    }

    // Inicializamos el inventario vacío, el puntaje en cero y el tiempo en 60 segundos.
    this.inventario = []; 
    this.puntaje = 0;          
    this.tiempoRestante = 60;  

    // Ponemos la imagen de fondo en el centro (256, 144) y la estiramos a tamaño completo.
    this.add.image(256, 144, 'fondo-cielo').setDisplaySize(512, 288);

    // EL CATÁLOGO DE BLOQUES: Como si fuera un manual de Lego. 
    // Cada código nos dice qué dibujito usar (frame) y cómo se comporta físicamente (tipo).
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

    // EL CATÁLOGO DE ENEMIGOS: Configuraciones base de los demonios.
    this.catalogoEnemigos = {
      'demonio_comun': {
        textura: 'demonio',
        velXMin: 45, // Velocidad lateral más lenta posible
        velXMax: 100, // Velocidad lateral más rápida posible
        reboteYMin: -100, // El salto más bajito permitido
        reboteYMax: -220  // El salto más alto permitido
      }
    };

    // Grupo para meter todos los bloques del mapa que tienen físicas (con los que chocamos)
    this.bloquesFisicos = this.physics.add.staticGroup();

    // Atajos de texto para escribir el mapa más fácil sin que ocupe 2 metros de pantalla
    const _ = '';
    const L = 'CR01TL'; 
    const R = 'CR01TR'; 
    const P = 'CP01TC'; 
    const H1 = 'CH01TC', H2 = 'CH02TC', H3 = 'CH03TC'; 

    // DIBUJO DEL MAPA EN TEXTO. Cada array es una fila, cada elemento es un cuadradito de 16x16.
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

    // Corremos todo el mapa hacia arriba 2 bloques para tapar el "agujero" negro de arriba.
    const FILAS_OFFSCREEN = 2;

    // EL CONSTRUCTOR DEL MAPA: Lee el texto de arriba y pone las imágenes en pantalla.
    mapaNivel.forEach((fila, indiceFila) => {
      fila.forEach((codigo, indiceColumna) => {
        if (codigo === '') return; // Si hay espacio vacío (_), salteamos.

        const datosPieza = this.catalogoPiezas[codigo];
        if (!datosPieza) return;

        // Calculamos coordenadas matemáticas (16 píxeles cada bloque + 8 para centrarlo)
        const posX = (indiceColumna * 16) + 8;
        const posY = ((indiceFila - FILAS_OFFSCREEN) * 16) + 8;

        let bloque;
        // Si el bloque es físico (se puede pisar o chocar)
        if (datosPieza.tipo !== 'fondo') {
          bloque = this.bloquesFisicos.create(posX, posY, 'MapTileSet', datosPieza.frame);
          bloque.body.updateFromGameObject();

          // Lógica de colisión inteligente
          if (datosPieza.tipo === 'pasarela') {
            // Pasarelas: Solo chocan desde arriba (podés saltar a través de ellas desde abajo)
            bloque.body.checkCollision.up = true;
            bloque.body.checkCollision.down = false;
            bloque.body.checkCollision.left = false;
            bloque.body.checkCollision.right = false;
          } else if (datosPieza.tipo === 'solido') {
            // Sólidos: Si hay otro bloque sólido pegado arriba o abajo, anulamos esa pared 
            // para que los personajes no se enganchen en las costuras (uniones) de los bloques.
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
          // Si el bloque es de fondo, lo ponemos solo como imagen sin darle peso físico.
          bloque = this.add.image(posX, posY, 'MapTileSet', datosPieza.frame);
        }
      });
    });

    // CREAMOS AL JUGADOR
    this.jugador = this.physics.add.sprite(256, 200, 'ninja'); 
    this.jugador.setGravityY(600); // Qué tan fuerte lo tira el piso hacia abajo
    this.jugador.setCollideWorldBounds(true); // Evita que caiga al abismo por los bordes
    
    // Ajustamos su Hitbox (caja física). La achicamos un poco para que no choque de forma injusta.
    this.jugador.body.setSize(10, 16);
    this.jugador.body.setOffset(3, 0); // La centramos

    // Creamos los grupos para los objetos que se van a multiplicar (Items y Demonios)
    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    // LEYES DE LA FÍSICA: "Collider" hace que las cosas choquen y se frenen.
    this.physics.add.collider(this.jugador, this.bloquesFisicos);
    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos);

    // EVENTOS: "Overlap" detecta si se tocan, sin que se choquen como paredes.
    this.physics.add.overlap(this.jugador, this.items, this.recolectarItem, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarDemonio, null, this);

    // TEMPORIZADORES (Timers)
    // El timer de demonios: Cada 2 segundos intenta meter un bicho nuevo.
    this.timerDemonios = this.time.addEvent({ delay: 2000, callback: this.spawnearDemonio, callbackScope: this, loop: true });
    
    // --- BOLSA INICIAL BALANCEADA DE TALISMANES ---
    // Armamos una "bolsa" perfecta con 4 de cada uno para evitar quedarnos sin una forma (softlock)
    const bolsaInicial = [
      'cuadrado', 'cuadrado', 'cuadrado', 'cuadrado',
      'triangulo', 'triangulo', 'triangulo', 'triangulo',
      'rombo', 'rombo', 'rombo', 'rombo'
    ];

    // Mezclamos la bolsa al azar para que el orden de caída sea impredecible
    Phaser.Utils.Array.Shuffle(bolsaInicial);

    // Timer rápido que actúa como una ametralladora de talismanes
    this.time.addEvent({ 
      delay: 150, // 150 milisegundos de diferencia entre cada caída (Da el efecto orgánico)
      repeat: 11, // Se ejecuta la 1ra vez + 11 repeticiones = 12 veces en total
      callback: () => {
        const forma = bolsaInicial.pop(); // Saca un talismán mezclado de la bolsa...
        this.spawnearItem(forma); // ...y lo tira a la pantalla
      }, 
      callbackScope: this 
    });

    // Reloj que resta 1 segundo cada 1000 milisegundos
    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true });
    
    // Activamos las flechas del teclado
    this.teclado = this.input.keyboard.createCursorKeys();

    // REGISTRAMOS LA TECLA ENTER PARA ALTERNAR EL DEBUG GLOBAL
    this.teclaEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // ANIMACIONES DEL NINJA (Indicamos qué cuadrito del sprite usa cada movimiento)
    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-stun', frames: this.anims.generateFrameNumbers('ninja', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });

    // Estados del jugador al empezar
    this.jugador.isStunned = false; // Aturdido
    this.jugador.isInvul = false; // Invulnerable (titilando)
  }

  // UPDATE: Es el corazón del juego. Se ejecuta 60 veces por segundo (frame por frame).
  update() {
    // Si ganaste o perdiste, frenamos toda la lógica acá para que no puedas moverte más.
    if (this.juegoTerminado) return;

    // --- DETECCIÓN DE ENTER PARA PRENDER/APAGAR DEBUG GLOBAL ---
    if (Phaser.Input.Keyboard.JustDown(this.teclaEnter)) {
      this.DEBUG_DEMONIOS = !this.DEBUG_DEMONIOS; // Invierte el estado (true/false)

      // 1. Apaga/Prende el debug nativo de físicas de Phaser (cajas de colisión)
      this.physics.world.drawDebug = this.DEBUG_DEMONIOS;
      if (!this.DEBUG_DEMONIOS) {
        this.physics.world.debugGraphic.clear(); // Limpia los trazos de golpe si los apaga
      }

      // 2. Apaga/Prende los textos verdes flotantes de todos los demonios activos
      this.enemigos.getChildren().forEach(demonio => {
        if (demonio.textoDebug) {
          demonio.textoDebug.setVisible(this.DEBUG_DEMONIOS);
        }
      });
    }

    // CONTROLES DEL JUGADOR (Si no está aturdido)
    if (!this.jugador.isStunned) {
      if (this.teclado.left.isDown) { 
        this.jugador.setVelocityX(-140); 
        this.jugador.setFlipX(true); // Mira a la izquierda
      } else if (this.teclado.right.isDown) { 
        this.jugador.setVelocityX(140); 
        this.jugador.setFlipX(false); // Mira a la derecha
      } else { 
        this.jugador.setVelocityX(0); // Frena si no toco nada
      }

      // SALTO: Si toca arriba y está tocando el suelo.
      if (this.teclado.up.isDown && this.jugador.body.touching.down) {
        this.jugador.setVelocityY(-420); // Impulso hacia arriba (negativo es arriba)
        this.reproducirSonido('snd-salto', 1); 
      }

      // MANEJO DE ANIMACIONES
      if (!this.jugador.body.touching.down) {
        // En el aire
        if (this.jugador.body.velocity.y < 0) { 
          this.jugador.anims.play('moncho-saltar', true); 
        } else { 
          this.jugador.anims.play('moncho-caer', true); 
        }
      } else {
        // En el suelo
        if (this.jugador.body.velocity.x !== 0) { 
          this.jugador.anims.play('moncho-caminar', true); 
        } else { 
          this.jugador.anims.play('moncho-idle', true); 
        }
      }
    } else {
      // Si está aturdido (porque chocó un demonio), pone la animación de daño.
      this.jugador.anims.play('moncho-stun', true);
    }

    // LÓGICA CONSTANTE DE LOS ÍTEMS
    this.items.getChildren().forEach(item => {
      // Si está tocando el piso, le aplicamos "fricción" para que se frene de a poco.
      if (item.body.touching.down) {
        item.setVelocityX(item.body.velocity.x * 0.92); // Pierde un 8% de velocidad en cada frame.
        if (Math.abs(item.body.velocity.x) < 1) item.setVelocityX(0); // Frena por completo si va muy despacio.
      } else {
        // Si está cayendo en el aire, lo preparamos para que pueda volver a restar puntos al golpear el suelo.
        if (item.body.velocity.y > 0) item.yaRestoPuntosEsteRebote = false;
      }
    });

    // LÓGICA CONSTANTE DE LOS DEMONIOS
    this.enemigos.getChildren().forEach(demonio => {
      
      // Actualiza el texto verde flotante si el modo Debug está activo.
      if (this.DEBUG_DEMONIOS && demonio.textoDebug) {
        demonio.textoDebug.setPosition(demonio.x, demonio.y - 18);
        demonio.textoDebug.setText(`Y: ${demonio.ultimoReboteY}\nC: ${demonio.contadorRebotes}`);
      }

      // CUANDO EL DEMONIO TOCA EL PISO (Acá pasa toda la magia física)
      if (demonio.body.touching.down) {
        
        // 1. LA ADUANA (CLAMP CON AZAR): 
        // Si el salto es demasiado alto o demasiado bajito, confisca el salto y sortea uno nuevo dentro del límite legal.
        if (demonio.body.velocity.y > demonio.reboteYMin || demonio.body.velocity.y < demonio.reboteYMax) {
          const fuerzaAleatoria = Phaser.Math.Between(demonio.reboteYMax, demonio.reboteYMin);
          demonio.setVelocityY(fuerzaAleatoria);
        }

        // 2. SISTEMA ANTI-LOOP (La Timba)
        let fuerzaActual = Math.round(demonio.body.velocity.y);

        // Permitimos un margen de error de 5 puntos por las micro-imperfecciones del motor físico de Phaser.
        if (Math.abs(fuerzaActual - demonio.ultimoReboteY) <= 5) {
          demonio.contadorRebotes++; // Si el salto es casi igual al anterior, sumamos 1 repetición.
        } else {
          demonio.contadorRebotes = 1; // Si es distinto, volvemos a empezar a contar.
          demonio.ultimoReboteY = fuerzaActual;
          demonio.enModoAntiLoop = false;
        }

        // Si repitió el mismo salto 3 veces, activamos las alarmas de Loop
        if (demonio.contadorRebotes >= 3) {
          demonio.enModoAntiLoop = true;
        }

        // Si está en Loop, tira una moneda (70% de probabilidades de actuar)
        if (demonio.enModoAntiLoop) {
          if (Math.random() < 0.70) { 
            let nuevaFuerza;
            // Si el salto anterior ya estaba pegado al techo máximo, lo obliga a sortear uno más bajo.
            if (fuerzaActual > demonio.reboteYMax + 5) {
              nuevaFuerza = Phaser.Math.Between(demonio.reboteYMax, fuerzaActual - 5);
            } else {
              // Si no, lo obliga a saltar más alto.
              nuevaFuerza = Phaser.Math.Between(fuerzaActual + 5, demonio.reboteYMin);
            }

            demonio.setVelocityY(nuevaFuerza); // Inyecta el nuevo salto
            demonio.ultimoReboteY = Math.round(nuevaFuerza);
            
            demonio.enModoAntiLoop = false;
            demonio.contadorRebotes = 0; // Reinicia el sistema para la próxima
          }
        }
      }
      
      // Controla hacia dónde mira el sprite del demonio según a dónde se mueve.
      if (demonio.body.velocity.x < 0) demonio.setFlipX(true); 
      else if (demonio.body.velocity.x > 0) demonio.setFlipX(false); 

      // Cambia el dibujito: 0 (Alas arriba) si está subiendo, 1 (Alas abajo) si está cayendo.
      if (demonio.body.velocity.y < 0) demonio.setFrame(0); 
      else if (demonio.body.velocity.y > 0) demonio.setFrame(1); 
    });
  }

  // FUNCIÓN: Desgaste de ítems. Se ejecuta cada vez que un ítem choca con el piso físico.
  procesarImpactoPiso(obj1, obj2) {
    const item = this.items.contains(obj1) ? obj1 : obj2; // Identifica cuál de los dos objetos chocando es el ítem
    
    // Si no restó puntos durante este vuelo (evita que reste 10 veces en un mismo choque por error físico)
    if (!item.yaRestoPuntosEsteRebote) {
      if (item.body.velocity.y < -10) { // Si el impacto fue un poco fuerte (no estaba solo rodando)
        item.yaRestoPuntosEsteRebote = true; 
        item.valorPuntos -= 5; // Le quita 5 puntos de valor
        item.setAlpha(item.valorPuntos / 100); // Lo vuelve más transparente para dar feedback visual
        
        // Si el ítem ya no vale nada, se destruye y lo reponemos convirtiéndolo en moneda
        if (item.valorPuntos <= 0) {
          item.destroy();
          this.spawnearMoneda(); // Ahora los reemplazos son monedas de puntos
        }
      }
    }
  }

  // FUNCIÓN: Se ejecuta 1 vez por segundo por culpa del timer relojJuego.
  tickReloj() {
    this.tiempoRestante--;
    this.events.emit('actualizar-tiempo', this.tiempoRestante); // Le avisa a la UI que actualice el texto.
    
    // Si se acabó el tiempo, termina la partida perdiendo (false).
    if (this.tiempoRestante <= 0) this.finalizarJuego(false);
  }

  // FUNCIÓN: Crea un Talismán inicial de la bolsa
  spawnearItem(forma) {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, forma);
    
    item.esTalisman = true; // Este SÍ cuenta para ganar
    item.setBounce(0.75); // Goma del talismán
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(25, 80) * direccion;
    item.setVelocityX(velocidadX);

    item.setCollideWorldBounds(true); 
    item.valorPuntos = 100; 
    item.yaRestoPuntosEsteRebote = false; 
  }

  // FUNCIÓN: Crea una Moneda de puntos (para cuando se destruyen ítems o al recolectar)
  spawnearMoneda() {
    const xAleatoria = Phaser.Math.Between(32, 480);
    const item = this.items.create(xAleatoria, -8, 'coin');
    
    item.esTalisman = false; // Esto es una moneda, NO sirve para ganar
    item.setBounce(0.75); 
    
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(25, 80) * direccion;
    item.setVelocityX(velocidadX);

    item.setCollideWorldBounds(true); 
    item.valorPuntos = 50; // Las monedas dan puntos
    item.yaRestoPuntosEsteRebote = false; 
  }

  // FUNCIÓN: Crea un Demonio nuevo en el cielo
  spawnearDemonio() {
    if (this.enemigos.countActive(true) >= 3) return; // Máximo de 3 demonios al mismo tiempo
    
    const config = this.catalogoEnemigos['demonio_comun'];
    
    const demonio = this.enemigos.create(Phaser.Math.Between(32, 480), -8, config.textura);
    demonio.setBounce(1);  // Goma perfecta, rebota el 100% de la fuerza del impacto.
    
    // Le guardamos sus topes de salto copiándolos del catálogo
    demonio.reboteYMin = config.reboteYMin;
    demonio.reboteYMax = config.reboteYMax;

    // Variables internas que la "Timba" usará para saber si se quedó loopeando
    demonio.ultimoReboteY = 0;
    demonio.contadorRebotes = 0;
    demonio.enModoAntiLoop = false;

    // Le enchufamos el textito verde si estamos en modo Debug
    demonio.textoDebug = this.add.text(demonio.x, demonio.y - 18, '', {
      fontSize: '9px',
      fill: '#00ff00',
      backgroundColor: '#000000AA',
      align: 'center'
    }).setOrigin(0.5, 1);
    demonio.textoDebug.setDepth(10);
    demonio.textoDebug.setVisible(this.DEBUG_DEMONIOS);
    
    // Le damos un empujoncito lateral para arrancar
    const direccion = Phaser.Math.RND.pick([-1, 1]);
    const velocidadX = Phaser.Math.Between(config.velXMin, config.velXMax) * direccion;
    demonio.setVelocityX(velocidadX);

    demonio.setCollideWorldBounds(true);
  }

  // FUNCIÓN AUXILIAR DE SONIDO: Centraliza la reproducción y evita errores
  reproducirSonido(key, volumen = 0.5) {
    try {
      this.sound.play(key, { volume: volumen });
    } catch (e) {
      console.warn(`No se pudo reproducir el sonido: ${key}`);
    }
  }

  // FUNCIÓN AUXILIAR DE TEXTO FLOTANTE: Muestra puntos flotantes con animación
  mostrarTextoFlotante(x, y, texto, color = '#ffffff') {
    const flotante = this.add.text(x, y, texto, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: color,
      resolution: 10
    }).setOrigin(0.5);

    // Animación (Tween): Sube y se desvanece
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

  // FUNCIÓN: Cuando Moncho agarra cualquier ítem (talismán o moneda)
  recolectarItem(jugador, item) {
    const puntosGanados = item.valorPuntos;
    this.puntaje += puntosGanados; // Suma los puntos correspondientes
    this.events.emit('actualizar-puntaje', this.puntaje);
    
    // Mostramos el texto flotante con los puntos obtenidos
    const colorTexto = puntosGanados >= 100 ? '#4ADE80' : '#FBBF24';
    this.mostrarTextoFlotante(item.x, item.y, `+${puntosGanados}`, colorTexto);

    // Reproducimos sonido de recolección (usamos el de salto temporalmente o el que prefieras)
    this.reproducirSonido('snd-salto', 0.5);

    // Si era un talismán de la bolsa inicial, lo guardamos en la mochila
    if (item.esTalisman) {
      const tipoItem = item.texture.key; 
      this.inventario.push(tipoItem); 
      this.events.emit('talisman-recolectado', tipoItem);
      
      // CONDICIÓN DE VICTORIA POR TALISMANES
      if (this.MODO_TALISMANES) {
        const cuadrados = this.inventario.filter(tipo => tipo === 'cuadrado').length;
        const triangulos = this.inventario.filter(tipo => tipo === 'triangulo').length;
        const rombos = this.inventario.filter(tipo => tipo === 'rombo').length;

        // Si llegás a 3 de cada uno, ¡GANASTE! (true)
        if (cuadrados >= 3 && triangulos >= 3 && rombos >= 3) {
          this.finalizarJuego(true);
        }
      }
    }

    // Se destruye el objeto y ahora siempre spawnea una moneda en su lugar
    item.destroy(); 
    this.spawnearMoneda(); 

    // Condición de victoria alternativa por puntaje
    if (!this.MODO_TALISMANES && this.puntaje >= 1000) {
      this.finalizarJuego(true);
    }
  }

  // FUNCIÓN: Cuando Moncho y un demonio se tocan
  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul) return; // Si Moncho está titilando (invulnerable), ignora el golpe

    // EVALUACIÓN DE PISOTÓN: Si Moncho está cayendo (Y > 0) y está más alto que el demonio.
    if (jugador.body.velocity.y > 0 && jugador.y < demonio.y) {
      // Le damos un gran rebote a Moncho hacia arriba, al estilo Mario Bros.
      jugador.setVelocityY(-450); 
      this.reproducirSonido('snd-salto', 1);
      
      // Restamos puntos como castigo por tocar el demonio de cualquier forma, pero sin bajar de cero.
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);
      this.mostrarTextoFlotante(demonio.x, demonio.y, `-50`, '#EF4444');

      // Si esta opción está activa, aplastamos al demonio dándole un empujón fuerte hacia abajo
      if (this.PISOTON_INVIERTE_DEMONIO) {
        demonio.setVelocityY(250); 
        // Le reiniciamos la memoria física al demonio para no confundir a la "Aduana" en el próximo rebote.
        demonio.ultimoReboteY = 0;
        demonio.contadorRebotes = 0;
      }

      // Hacemos a Moncho invulnerable por un instante (titila 2 veces muy rápido)
      jugador.isInvul = true;
      this.tweens.add({ targets: jugador, alpha: 0.5, duration: 100, yoyo: true, repeat: 2, 
        onComplete: () => { jugador.isInvul = false; jugador.setAlpha(1); }
      });
    } else {
      // GOLPE COMÚN: El demonio chocó a Moncho de lado o desde arriba.
      this.puntaje = Math.max(0, this.puntaje - 50);
      this.events.emit('actualizar-puntaje', this.puntaje);
      this.mostrarTextoFlotante(jugador.x, jugador.y, `-50`, '#EF4444');

      jugador.isStunned = true; // Pierde los controles temporalmente
      jugador.isInvul = true;
      // Empujón de daño (Knockback). Lo tira hacia la izquierda o derecha según de dónde vino el golpe.
      jugador.setVelocity(jugador.x < demonio.x ? -180 : 180, -220); 

      // Medio segundo después, le devolvemos el control (le sacamos el Stun)
      this.time.delayedCall(500, () => {
        jugador.isStunned = false; 
        // Titila como fantasmita un rato largo (frames de inmunidad clásicos)
        this.tweens.add({ targets: jugador, alpha: 0.2, duration: 100, yoyo: true, repeat: 5, 
          onComplete: () => { jugador.isInvul = false; jugador.setAlpha(1); }
        });
      });
    }
  }

  // FUNCIÓN: Apaga todo y decide qué música poner
  finalizarJuego(ganaste) {
    this.juegoTerminado = true; // Corta los controles en el Update
    this.physics.pause(); // Congela todos los movimientos y caídas en pantalla
    
    // Apaga los cronómetros para que dejen de generar cosas o contar el tiempo
    this.relojJuego.remove();
    this.timerDemonios.remove();

    this.sound.stopAll(); // Corta el tema de fondo normal
    // Pone el tema de ganar o el de perder
    this.reproducirSonido(ganaste ? 'musica-win' : 'musica-lose', 0.5);

    // Le avisa a la UI que ponga el cartelón de victoria/derrota
    this.events.emit('juego-terminado', { ganaste: ganaste, puntos: this.puntaje });

    // Espera 1.5 segundos para que no reinicies por error si estabas aporreando teclas
    this.time.delayedCall(1500, () => {
      // Y después queda a la espera de que toques ESPACIO para reiniciar todo
      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.stopAll(); 
        this.scene.stop('UIScene'); // Mata la UI vieja
        this.scene.restart(); // Reinicia este nivel desde el Create()
      });
    });
  }
}
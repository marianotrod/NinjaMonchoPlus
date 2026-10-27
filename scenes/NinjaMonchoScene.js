import Ninja from './Ninja.js';
import { i18n } from '../i18n.js';
import { Bestiario } from './Bestiario.js';
import Enemigo from './Enemigo.js';
import Fantasma from './Fantasma.js';
import Jefe from './Jefe.js';
import ConstructorNivel from './ConstructorNivel.js';
import { CONFIG, DEBUG, FISICA, PAD } from '../config.js';
import { nuevaPartida, prepararNivel, esNivelJefe, esNivelFinal, musicaDelNivel } from './Partida.js';
import { MODS_GLOBAL_BASE, pactosVacios } from './Pactos.js';
import { ARMAS, TIPOS_ARMA, actualizarProyectiles, arrastrarItem } from './Armas.js';
import { Sonido } from './Sonido.js';
import { Guardado } from './Guardado.js';

// Fases del nivel:
//   intro -> recoleccion -> transicion -> caceria -> nivelCompletado   (niveles normales)
//   intro -> jefe -> nivelCompletado                                    (niveles de jefe)
//   perdiendoVida y fin interrumpen cualquiera de las anteriores.
const FASES_JUGABLES = ['intro', 'recoleccion', 'transicion', 'caceria', 'jefe'];
const TIPOS_TALISMAN = ['cuadrado', 'triangulo', 'rombo'];

export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  init(data) {
    this.reintento = !!(data && data.reintento);

    let partida = this.registry.get('partida');
    if (!partida) {
      partida = nuevaPartida((data && data.jugadores) || 1);
      this.registry.set('partida', partida);
    }
    this.partida = partida;
    this.cantidadJugadores = partida.jugadores;
    this.nivelActual = partida.nivel;
  }

  create() {
    const partida = this.partida;
    prepararNivel(partida);

    // Al perder una vida se repite el nivel descartando los puntos de ese intento
    if (this.reintento) partida.puntajes = [...partida.puntajesInicioNivel];
    else partida.puntajesInicioNivel = [...partida.puntajes];

    this.esNivelJefe = esNivelJefe(this.nivelActual);
    this.modsGlobal = { ...MODS_GLOBAL_BASE, ...partida.pactos.global };
    this.fase = 'intro';
    this.listoParaContinuar = false;
    this.inventario = [];
    this.fantasma = null;
    this.jefe = null;
    this.collidersFantasma = [];
    this.collidersJefe = [];
    this.enemigosPorAparecer = 0;

    this.DEBUG_DEMONIOS = false;
    this.modoDiosActivo = false;
    this.enemigosHabilitados = true;

    const padP1 = this.registry.get('padIndexP1');
    const padP2 = this.registry.get('padIndexP2');
    this.padIndexP1 = padP1 === undefined ? null : padP1;
    this.padIndexP2 = padP2 === undefined ? null : padP2;
    this.prevPadBotones = {};

    this.physics.world.setBounds(0, -32, 512, 320);

    Sonido.musica(this, musicaDelNivel(this.nivelActual), 0.4);
    Sonido.ritmoMusica(1);

    this.add.image(256, 144, 'fondo-cielo').setDisplaySize(512, 288);

    const spawns = ConstructorNivel.construir(this, partida.mapa);
    this.spawnMonchoX = spawns.spawnMonchoX;
    this.spawnCoopX = spawns.spawnCoopX;

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.cajasArmas = this.physics.add.group();
    this.proyectilesJugador = this.physics.add.group({ allowGravity: false });
    this.proyectilesEnemigos = this.physics.add.group({ allowGravity: false });

    this.jugadores = [];
    this.jugador = new Ninja(this, this.spawnMonchoX, -32, 'ninja', null, 'moncho', 0);
    if (this.padIndexP1 !== null) {
      this.jugador.asignarPadIndex(this.padIndexP1);
    }
    this.jugadores.push(this.jugador);
    this.conectarFisicasJugador(this.jugador);

    if (this.cantidadJugadores === 2) {
      this.crearPlayer2();
    } else {
      this.prepararHotJoin();
    }

    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.cajasArmas, this.bloquesFisicos);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos, null, (enemigo) => !enemigo.rasgos.volador.activo, this);
    this.physics.add.collider(this.proyectilesJugador, this.bloquesFisicos,
      (proyectil) => { if (proyectil.tipo === 'shuriken') proyectil.destroy(); },
      (proyectil, bloque) => proyectil.tipo === 'bomba' || (proyectil.tipo === 'shuriken' && !bloque.esOneWay), this);
    this.physics.add.collider(this.proyectilesEnemigos, this.bloquesFisicos,
      (proyectil) => proyectil.destroy(),
      (proyectil, bloque) => !proyectil.atraviesaBloques && !bloque.esOneWay, this);
    this.physics.add.overlap(this.proyectilesJugador, this.enemigos, this.impactoProyectil, null, this);
    this.physics.add.overlap(this.proyectilesJugador, this.items, (proyectil, item) => arrastrarItem(proyectil, item),
      (proyectil) => proyectil.tipo === 'bumeran', this);

    const tiempoBase = this.esNivelJefe ? CONFIG.TIEMPO_JEFE : CONFIG.TIEMPO_RECOLECCION + this.modsGlobal.tiempoExtra;
    this.tiempoRestante = Math.max(15, tiempoBase);

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true, paused: true });
    this.timerDemonios = this.time.addEvent({ delay: CONFIG.INTERVALO_DEMONIOS, callback: () => this.spawnearDemonio(), loop: true, paused: true });
    this.timerArmas = this.time.addEvent({
      delay: this.esNivelJefe ? CONFIG.INTERVALO_ARMAS_JEFE : CONFIG.INTERVALO_ARMAS,
      callback: this.spawnearCajaArma, callbackScope: this, loop: true, paused: true
    });

    this.teclaEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (DEBUG) this.teclaSupr = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);

    // Al volver de la pausa, las teclas que se soltaron mientras tanto quedarían "apretadas"
    const alReanudar = () => {
      this.input.keyboard.resetKeys();
      this.prevPadBotones = {};
    };
    this.events.on('resume', alReanudar);
    this.events.once('shutdown', () => this.events.off('resume', alReanudar));

    this.events.once('ui-lista', () => this.mostrarIntro());
    this.scene.launch('UIScene');
  }

  // ==========================================
  // FASES DEL NIVEL
  // ==========================================
  mostrarIntro() {
    if (this.esNivelJefe) {
      this.events.emit('banner', {
        titulo: i18n.t('jefe_aparece'), subtitulo: i18n.t(`jefe_${this.partida.jefe}`), color: '#EF4444', duracion: 2400
      });
      this.time.delayedCall(1000, () => this.spawnearJefe());
      this.time.delayedCall(2400, () => this.iniciarFaseJefe());
    } else {
      const subtitulo = this.reintento
        ? `${i18n.t('reintento')} · ${i18n.t('objetivo_recoleccion')}`
        : i18n.t('objetivo_recoleccion');
      this.events.emit('banner', {
        titulo: `${i18n.t('nivel')} ${this.nivelActual}`, subtitulo, iconos: true, duracion: 2400
      });
      this.time.delayedCall(2400, () => this.iniciarRecoleccion());
    }
  }

  iniciarRecoleccion() {
    if (this.fase !== 'intro') return;
    this.fase = 'recoleccion';
    this.events.emit('fase', 'recoleccion');
    this.events.emit('banner', { titulo: i18n.t('ya'), color: '#4ADE80', duracion: 700, chico: true });

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

    this.relojJuego.paused = false;
    this.timerDemonios.paused = false;
    this.timerArmas.paused = false;
    this.time.delayedCall(5000, () => this.spawnearCajaArma());
  }

  finRecoleccion() {
    if (this.fase !== 'recoleccion' || this.modoDiosActivo) return;
    this.fase = 'transicion';
    this.detenerTimers();
    Sonido.ritmoMusica(1);
    this.quitarFantasma();

    // Cobro de la fase: bono por segundos restantes para cada jugador
    const bono = this.tiempoRestante * CONFIG.BONO_POR_SEGUNDO;
    this.jugadores.forEach(j => this.sumarPuntos(j.indice, bono));

    // Los talismanes sobrantes ya no sirven
    this.items.getChildren().filter(item => item.esTalisman).forEach(item => {
      this.efectoChispas(item.x, item.y, 0xfde047);
      item.destroy();
    });

    Sonido.efecto(this, 'snd-parry', 0.6);
    this.cameras.main.flash(250, 255, 255, 255);
    this.events.emit('banner', {
      titulo: i18n.t('sello_roto'), subtitulo: `${i18n.t('bono_tiempo')} +${bono}`, color: '#EF4444', duracion: 2000
    });
    this.enemigos.getChildren().forEach(enemigo => enemigo.enfurecer());

    this.time.delayedCall(2000, () => this.iniciarCaceria());
  }

  iniciarCaceria() {
    if (this.fase !== 'transicion') return;
    this.fase = 'caceria';
    this.tiempoRestante = CONFIG.TIEMPO_CACERIA;
    this.events.emit('actualizar-tiempo', this.tiempoRestante);
    this.events.emit('fase', 'caceria');
    this.events.emit('banner', { titulo: i18n.t('caceria'), subtitulo: i18n.t('objetivo_caceria'), color: '#EF4444', duracion: 1400, chico: true });

    // Cupo de demonios a cazar: crece con el nivel
    const cupo = Math.min(3 + Math.floor(this.nivelActual / 2), 6);
    this.enemigosPorAparecer = Math.max(0, cupo - this.enemigos.countActive(true));
    if (this.enemigosPorAparecer > 0) {
      this.time.addEvent({
        delay: 500, repeat: this.enemigosPorAparecer - 1,
        callback: () => {
          if (this.fase !== 'caceria') return;
          this.enemigosPorAparecer--;
          this.spawnearDemonio(true);
          this.emitirEnemigosRestantes();
        }
      });
    }
    this.emitirEnemigosRestantes();

    this.relojJuego.paused = false;
    this.timerArmas.paused = false;
  }

  finCaceria(limpio) {
    if (this.fase !== 'caceria') return;
    const bono = limpio ? this.tiempoRestante * CONFIG.BONO_POR_SEGUNDO : 0;
    this.jugadores.forEach(j => this.sumarPuntos(j.indice, bono));
    this.enemigos.getChildren().slice().forEach(enemigo => {
      this.efectoChispas(enemigo.x, enemigo.y, 0x9ca3af);
      enemigo.morir();
    });
    this.completarNivel({ bonoTiempo: bono, limpio });
  }

  iniciarFaseJefe() {
    if (this.fase !== 'intro') return;
    this.fase = 'jefe';
    this.events.emit('fase', 'jefe');
    this.relojJuego.paused = false;
    this.timerArmas.paused = false;
    this.spawnearCajaArma();
  }

  spawnearJefe() {
    // Aparece apenas dentro del límite superior del mundo (y = -32): si naciera afuera, el borde lo frenaría
    this.jefe = new Jefe(this, 256, -6, this.partida.jefe);
    this.collidersJefe.push(
      this.physics.add.collider(this.jefe, this.bloquesFisicos, null, (jefe, bloque) => !jefe.datos.vuela && !bloque.esOneWay, this),
      this.physics.add.overlap(this.jefe, this.proyectilesJugador, this.impactoProyectilJefe, null, this)
    );
    this.jugadores.forEach(j => this.conectarJefe(j));
    this.events.emit('jefe-aparece', i18n.t(`jefe_${this.partida.jefe}`), this.jefe.hp);
  }

  jefeDerrotado() {
    if (this.fase !== 'jefe') return;
    this.jefe = null;
    this.collidersJefe.forEach(c => c.destroy());
    this.collidersJefe = [];
    this.detenerTimers();
    this.quitarFantasma();
    this.enemigos.getChildren().slice().forEach(enemigo => enemigo.morir());
    this.proyectilesEnemigos.clear(true, true);

    const bonoTiempo = this.tiempoRestante * CONFIG.BONO_POR_SEGUNDO;
    this.jugadores.forEach(j => this.sumarPuntos(j.indice, bonoTiempo + CONFIG.BONO_JEFE));

    if (esNivelFinal(this.nivelActual)) {
      this.fase = 'transicion';
      this.time.delayedCall(600, () => this.finalizarPartida(true));
      return;
    }
    this.completarNivel({ bonoTiempo, bonoExtra: CONFIG.BONO_JEFE });
  }

  completarNivel(info) {
    this.fase = 'nivelCompletado';
    this.detenerTimers();
    this.physics.pause();
    Sonido.ritmoMusica(1);
    // Como música (no como efecto): así la corta la música del nivel siguiente en vez de superponerse
    Sonido.musica(this, 'musica-win', 0.5, false);
    if (this.uiHotJoin) this.uiHotJoin.setVisible(false);

    this.events.emit('nivel-completado', {
      nivel: this.nivelActual,
      puntajes: this.partida.puntajes,
      jugadores: this.cantidadJugadores,
      ...info
    });
    this.listoParaContinuar = false;
    this.time.delayedCall(1200, () => { this.listoParaContinuar = true; });
  }

  avanzarNivel() {
    const partida = this.partida;
    partida.nivel++;
    partida.mapa = null;
    partida.pactos = pactosVacios(); // Los pactos duran un solo nivel
    this.scene.stop('UIScene');
    this.scene.start('PactSelectionScene');
  }

  perderVida() {
    if (!FASES_JUGABLES.includes(this.fase) || this.modoDiosActivo) return;
    this.fase = 'perdiendoVida';
    this.detenerTimers();
    this.physics.pause();
    Sonido.ritmoMusica(1);
    Sonido.efecto(this, 'snd-caida', 0.7);
    this.cameras.main.shake(300, 0.015);

    this.partida.vidas--;
    this.events.emit('vidas', this.partida.vidas);

    if (this.partida.vidas <= 0) {
      this.time.delayedCall(900, () => this.finalizarPartida(false));
      return;
    }

    this.events.emit('banner', {
      titulo: i18n.t('vida_perdida'), subtitulo: `${i18n.t('vidas')}: ${this.partida.vidas}`, color: '#EF4444', duracion: 1700
    });
    this.time.delayedCall(1800, () => {
      this.scene.stop('UIScene');
      this.scene.restart({ reintento: true });
    });
  }

  // En la pelea contra el jefe un golpe cuesta una vida pero no reinicia la pelea
  perderVidaEnJefe() {
    this.partida.vidas--;
    this.events.emit('vidas', this.partida.vidas);
    this.cameras.main.shake(250, 0.012);
    if (this.partida.vidas <= 0) {
      this.fase = 'perdiendoVida';
      this.detenerTimers();
      this.physics.pause();
      this.time.delayedCall(900, () => this.finalizarPartida(false));
      return;
    }
    this.events.emit('banner', { titulo: i18n.t('vida_perdida'), color: '#EF4444', duracion: 900, chico: true });
  }

  finalizarPartida(ganaste) {
    this.fase = 'fin';
    this.detenerTimers();
    this.physics.pause();
    Sonido.ritmoMusica(1);
    Sonido.musica(this, ganaste ? 'musica-win' : 'musica-lose', 0.5, false);
    if (ganaste) Sonido.efecto(this, 'snd-grito-final', 0.5);
    if (this.uiHotJoin) this.uiHotJoin.setVisible(false);

    const puntajes = this.partida.puntajes.slice(0, this.cantidadJugadores);
    const total = puntajes.reduce((a, b) => a + b, 0);
    const recordAnterior = Guardado.leer('record', 0);
    const nuevoRecord = total > recordAnterior;
    if (nuevoRecord) {
      Guardado.escribir('record', total);
      this.registry.set('record', total);
    }

    this.events.emit('juego-terminado', {
      ganaste, puntajes, total, nuevoRecord, record: Math.max(total, recordAnterior), nivel: this.nivelActual
    });
    this.listoParaContinuar = false;
    this.time.delayedCall(1500, () => { this.listoParaContinuar = true; });
  }

  detenerTimers() {
    this.relojJuego.paused = true;
    this.timerDemonios.paused = true;
    this.timerArmas.paused = true;
  }

  esFaseJugable() {
    return FASES_JUGABLES.includes(this.fase);
  }

  // ==========================================
  // RELOJ, ALARMA Y FANTASMA
  // ==========================================
  tickReloj() {
    if (this.fantasma) return;
    this.tiempoRestante = Math.max(0, this.tiempoRestante - 1);
    this.events.emit('actualizar-tiempo', this.tiempoRestante);

    const t = this.tiempoRestante;
    if (t > 0 && t <= CONFIG.ALARMA_TIEMPO) {
      const urgente = t <= CONFIG.ALARMA_URGENTE;
      Sonido.beep(this, urgente ? 1046 : 784, 0.07, 0.1);
      Sonido.ritmoMusica(urgente ? 1.25 : 1.12);
    }
    if (t > 0 || this.modoDiosActivo) return;

    if (this.fase === 'caceria') this.finCaceria(false);
    else if (this.fase === 'recoleccion' || this.fase === 'jefe') this.aparecerFantasma();
  }

  aparecerFantasma() {
    this.relojJuego.paused = true;
    Sonido.ritmoMusica(1.3);
    Sonido.beep(this, 110, 0.6, 0.15, 'sawtooth');
    this.fantasma = new Fantasma(this, 256, -24);
    this.jugadores.forEach(j => this.conectarFantasma(j));
    this.events.emit('fantasma');
  }

  quitarFantasma() {
    if (!this.fantasma) return;
    const fantasma = this.fantasma;
    this.fantasma = null;
    this.collidersFantasma.forEach(c => c.destroy());
    this.collidersFantasma = [];
    fantasma.body.enable = false;
    this.tweens.killTweensOf(fantasma);
    this.tweens.add({ targets: fantasma, alpha: 0, scale: 2, duration: 400, onComplete: () => fantasma.destroy() });
  }

  // ==========================================
  // JUGADORES, HOT-JOIN Y JOYSTICKS
  // ==========================================
  conectarFisicasJugador(jugador) {
    this.physics.add.collider(jugador, this.bloquesFisicos, null, (j, bloque) => {
      if (j.quiereAtravesarOneWay && bloque.esOneWay) {
          return false;
      }
      return true;
    }, this);

    this.physics.add.overlap(jugador, this.items, (j, item) => {
      this.recolectarItem(j, item);
    }, null, this);

    this.physics.add.overlap(jugador, this.enemigos, (j, demonio) => {
      this.tocarDemonio(j, demonio);
    }, null, this);

    this.physics.add.overlap(jugador, this.cajasArmas, this.recogerArma, null, this);
    this.physics.add.overlap(jugador, this.proyectilesEnemigos, this.impactoProyectilEnemigo, null, this);

    if (this.fantasma) this.conectarFantasma(jugador);
    if (this.jefe) this.conectarJefe(jugador);
  }

  conectarFantasma(jugador) {
    this.collidersFantasma.push(this.physics.add.overlap(jugador, this.fantasma, () => {
      if (!jugador.isSpawning && this.fantasma) this.perderVida();
    }, null, this));
  }

  conectarJefe(jugador) {
    this.collidersJefe.push(this.physics.add.overlap(jugador, this.jefe, this.tocarJefe, null, this));
  }

  prepararHotJoin() {
    this.hotJoinTimer = 0;
    this.hotJoinTecladoP2 = false;

    this.uiHotJoin = this.add.container(496, 284).setDepth(100);
    const txtHotJoin = this.add.text(0, -6, i18n.t('hotjoin_prompt'), {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff', resolution: 10
    }).setOrigin(1, 0.5);
    const bgBarra = this.add.rectangle(0, 1, 60, 4, 0x000000, 0.5).setOrigin(1, 0.5);
    this.barraHotJoin = this.add.rectangle(-59, 1, 0, 2, 0xffffff).setOrigin(0, 0.5);

    this.uiHotJoin.add([txtHotJoin, bgBarra, this.barraHotJoin]);

    const teclasJ2 = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK'];
    const alApretar = (event) => {
      if (this.cantidadJugadores === 1 && this.esFaseJugable() && teclasJ2.includes(event.code)) {
        this.hotJoinTecladoP2 = true;
      }
    };
    const alSoltar = (event) => {
      if (teclasJ2.includes(event.code)) this.hotJoinTecladoP2 = false;
    };
    this.input.keyboard.on('keydown', alApretar);
    this.input.keyboard.on('keyup', alSoltar);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', alApretar);
      this.input.keyboard.off('keyup', alSoltar);
    });
  }

  crearPlayer2(esMidGame = false) {
    this.cantidadJugadores = 2;
    this.partida.jugadores = 2;
    if (this.uiHotJoin) {
      this.uiHotJoin.destroy();
      this.uiHotJoin = null;
    }

    const K = Phaser.Input.Keyboard.KeyCodes;
    const teclasP2 = this.input.keyboard.addKeys({
      up: K.W, down: K.S, left: K.A, right: K.D, ataque: K.J, especial: K.K
    });

    this.jugador2 = new Ninja(this, this.spawnCoopX, -32, 'ninja_coop', teclasP2, 'coop', 1);

    if (this.padIndexP2 !== null) {
      this.jugador2.asignarPadIndex(this.padIndexP2);
    }

    this.jugadores.push(this.jugador2);
    this.conectarFisicasJugador(this.jugador2);

    // Colisión sólida entre ninjas y "trampolín humano" al caer sobre la cabeza del compañero
    this.physics.add.collider(this.jugador, this.jugador2, null, this.procesarChoqueNinjas, this);
    this.events.emit('jugadores', 2);

    if (esMidGame) {
      Sonido.efecto(this, 'snd-salto', 1);
      const cartel = this.add.text(496, 268, i18n.t('hotjoin_joined'), {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FBBF24', resolution: 10
      }).setOrigin(1, 0.5).setDepth(200);

      let esNaranja = true;
      this.time.addEvent({
        delay: 100, repeat: 18,
        callback: () => { esNaranja = !esNaranja; cartel.setColor(esNaranja ? '#FBBF24' : '#FFFFFF'); }
      });

      this.tweens.add({
        targets: cartel, y: 230, alpha: 0, duration: 2000, ease: 'Power1',
        onComplete: () => cartel.destroy()
      });
    }
  }

  procesarChoqueNinjas(a, b) {
    for (const [arriba, abajo] of [[a, b], [b, a]]) {
      if (arriba.body.velocity.y > 40 && arriba.body.bottom <= abajo.body.top + 6) {
        arriba.setVelocityY(FISICA.trampolin * arriba.factorSalto);
        arriba.saltoExtraDisponible = arriba.tieneHabilidad('dobleSalto');
        arriba.dashDisponible = true;
        Sonido.efecto(this, 'snd-salto', 1.2, { rate: 1.3 });
        return false;
      }
    }
    return true;
  }

  // Asigna joysticks: el primero que toca un botón es el J1; cualquier otro es el J2 (y lo hace entrar si no estaba).
  // El índice del J2 se guarda en el registry para que lo conserve al pasar de nivel.
  actualizarJoysticks(delta) {
    let p2IntentandoEntrar = this.hotJoinTecladoP2;
    const gamepad = this.input.gamepad;

    if (gamepad && gamepad.total > 0) {
      gamepad.gamepads.forEach(pad => {
        if (!pad || !pad.buttons.some(b => b && b.pressed)) return;
        if (this.padIndexP1 === null) {
          this.padIndexP1 = pad.index;
          this.registry.set('padIndexP1', pad.index);
          this.jugador.asignarPadIndex(pad.index);
        } else if (pad.index !== this.padIndexP1) {
          if (this.padIndexP2 !== pad.index) {
            this.padIndexP2 = pad.index;
            this.registry.set('padIndexP2', pad.index);
          }
          if (this.jugador2) {
            if (this.jugador2.assignedPadIndex !== pad.index) this.jugador2.asignarPadIndex(pad.index);
          } else {
            p2IntentandoEntrar = true;
          }
        }
      });
    }

    if (this.cantidadJugadores === 1 && this.uiHotJoin) {
      if (p2IntentandoEntrar) {
        this.hotJoinTimer += delta;
        let progreso = Phaser.Math.Clamp(this.hotJoinTimer / 1000, 0, 1);
        this.barraHotJoin.width = 58 * progreso;

        if (this.hotJoinTimer >= 1000) {
          this.crearPlayer2(true);
          this.hotJoinTecladoP2 = false;
        }
      } else {
        this.hotJoinTimer = 0;
        this.barraHotJoin.width = 0;
      }
    }
  }

  jugadorMasCercano(x, y) {
    let mejor = null;
    let mejorDistancia = Infinity;
    this.jugadores.forEach(j => {
      if (!j.active) return;
      const d = Phaser.Math.Distance.Between(x, y, j.x, j.y);
      if (d < mejorDistancia) {
        mejor = j;
        mejorDistancia = d;
      }
    });
    return mejor;
  }

  // Botón recién apretado en cualquier joystick (para menús dentro de la escena)
  padRecienApretado(botones) {
    let apretado = false;
    const gamepad = this.input.gamepad;
    if (!gamepad || gamepad.total === 0) return false;
    gamepad.gamepads.forEach(pad => {
      if (!pad) return;
      botones.forEach(b => {
        const clave = `${pad.index}-${b}`;
        const ahora = !!(pad.buttons[b] && pad.buttons[b].pressed);
        if (ahora && !this.prevPadBotones[clave]) apretado = true;
        this.prevPadBotones[clave] = ahora;
      });
    });
    return apretado;
  }

  // ==========================================
  // UPDATE
  // ==========================================
  update(time, delta) {
    if (this.fase === 'fin') {
      if (!this.listoParaContinuar) return;
      const reintentar = Phaser.Input.Keyboard.JustDown(this.teclaEnter) || Phaser.Input.Keyboard.JustDown(this.teclaEspacio) || this.padRecienApretado([PAD.A, PAD.START]);
      const salir = Phaser.Input.Keyboard.JustDown(this.teclaEsc) || this.padRecienApretado([PAD.B]);
      if (reintentar) {
        this.listoParaContinuar = false;
        this.registry.set('partida', nuevaPartida(this.cantidadJugadores));
        this.scene.stop('UIScene');
        this.scene.restart();
      } else if (salir) {
        this.listoParaContinuar = false;
        Sonido.detenerMusica();
        this.scene.stop('UIScene');
        this.scene.start('TitleScene');
      }
      return;
    }

    if (this.fase === 'nivelCompletado') {
      const continuar = Phaser.Input.Keyboard.JustDown(this.teclaEnter) || Phaser.Input.Keyboard.JustDown(this.teclaEspacio) || this.padRecienApretado([PAD.A, PAD.START]);
      if (this.listoParaContinuar && continuar) {
        this.listoParaContinuar = false;
        this.avanzarNivel();
      }
      return;
    }

    if (!this.esFaseJugable()) return;

    if (Phaser.Input.Keyboard.JustDown(this.teclaEsc) || this.padRecienApretado([PAD.START])) {
      this.scene.pause();
      this.scene.pause('UIScene');
      this.scene.launch('PauseScene');
      return;
    }

    if (DEBUG) this.actualizarDebug();

    this.actualizarJoysticks(delta);

    this.jugadores.forEach(j => j.update());

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

    actualizarProyectiles(this);
    this.proyectilesEnemigos.getChildren().slice().forEach(p => {
      if (p.x < -24 || p.x > 536 || p.y > 310 || p.y < -60) p.destroy();
    });

    if (this.fantasma) this.fantasma.actualizar(this.jugadorMasCercano(this.fantasma.x, this.fantasma.y));
    if (this.jefe && this.jefe.active) this.jefe.actualizar();
  }

  actualizarDebug() {
    if (Phaser.Input.Keyboard.JustDown(this.teclaEnter)) {
      this.DEBUG_DEMONIOS = !this.DEBUG_DEMONIOS;

      if (this.DEBUG_DEMONIOS && !this.physics.world.debugGraphic) {
          this.physics.world.createDebugGraphic();
      }

      this.physics.world.drawDebug = this.DEBUG_DEMONIOS;

      if (!this.DEBUG_DEMONIOS && this.physics.world.debugGraphic) {
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
        this.enemigos.getChildren().slice().forEach(demonio => demonio.destroy());
      } else if (this.fase === 'recoleccion') {
        this.timerDemonios.paused = false;
      }
    }
  }

  // ==========================================
  // ITEMS: TALISMANES, MONEDAS Y CAJAS DE ARMAS
  // ==========================================
  procesarImpactoPiso(obj1, obj2) {
    const item = this.items.contains(obj1) ? obj1 : obj2;
    if (item.esTalisman) return;

    if (!item.yaRestoPuntosEsteRebote) {
      if (item.body.velocity.y < -10) {
        item.yaRestoPuntosEsteRebote = true;
        item.valorPuntos = Math.max(1, Math.floor(item.valorPuntos * 0.8));
        const porcentaje = Math.max(0, item.valorPuntos / item.valorInicial);
        const colorGB = Math.floor(255 * porcentaje);
        item.setTint(Phaser.Display.Color.GetColor(255, colorGB, colorGB));
      }
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
    item.valorInicial = CONFIG.VALOR_MONEDA * this.modsGlobal.multPuntos;
    item.valorPuntos = item.valorInicial;
    item.yaRestoPuntosEsteRebote = false;
  }

  spawnearCajaArma() {
    if (!this.esFaseJugable() || this.cajasArmas.countActive(true) > 0) return;
    const tipo = Phaser.Utils.Array.GetRandom(TIPOS_ARMA);
    const caja = this.cajasArmas.create(Phaser.Math.Between(48, 464), -8, ARMAS[tipo].icono);
    caja.tipoArma = tipo;
    caja.setBounce(0.3);
    caja.setCollideWorldBounds(true);

    // Desaparece si nadie la agarra; titila los últimos segundos
    this.time.delayedCall(CONFIG.VIDA_PICKUP_ARMA - 2500, () => {
      if (caja.active) this.tweens.add({ targets: caja, alpha: 0.2, duration: 150, yoyo: true, repeat: -1 });
    });
    this.time.delayedCall(CONFIG.VIDA_PICKUP_ARMA, () => {
      if (caja.active) {
        this.tweens.killTweensOf(caja);
        caja.destroy();
      }
    });
  }

  recogerArma(jugador, caja) {
    if (jugador.isSpawning || !caja.active) return;
    jugador.equiparArma(caja.tipoArma);
    this.mostrarTextoFlotante(caja.x, caja.y - 8, i18n.t(`arma_${caja.tipoArma}`), '#FBBF24');
    Sonido.beep(this, 523, 0.08, 0.1);
    this.time.delayedCall(80, () => Sonido.beep(this, 784, 0.12, 0.1));
    this.tweens.killTweensOf(caja);
    caja.destroy();
  }

  sumarPuntos(indice, puntos) {
    if (!puntos) return;
    this.partida.puntajes[indice] += puntos;
    this.events.emit('actualizar-puntaje', this.partida.puntajes);
  }

  contarInventario() {
    const conteo = { cuadrado: 0, triangulo: 0, rombo: 0 };
    this.inventario.forEach(tipo => { conteo[tipo]++; });
    return conteo;
  }

  recolectarItem(jugador, item) {
    if (jugador.isSpawning || !item || !item.active) return;

    if (item.esTalisman) {
      if (this.fase !== 'recoleccion') return;
      const tipoItem = item.texture.key;
      this.inventario.push(tipoItem);
      const conteo = this.contarInventario();
      const cantidad = conteo[tipoItem];
      this.events.emit('inventario', conteo);

      // Feedback: cuántos van de esa forma; los extras se ven en gris porque no hacen falta
      this.mostrarTextoFlotante(item.x, item.y, `${Math.min(cantidad, 3)}/3`, cantidad <= 3 ? '#FBBF24' : '#9CA3AF');
      this.efectoChispas(item.x, item.y, 0xfde047);
      Sonido.beep(this, 523 + Math.min(cantidad, 3) * 131, 0.1, 0.1, 'triangle');

      if (TIPOS_TALISMAN.every(tipo => conteo[tipo] >= 3)) {
        item.destroy();
        this.finRecoleccion();
        return;
      }
    } else {
      this.sumarPuntos(jugador.indice, item.valorPuntos);
      const colorTexto = item.valorPuntos >= item.valorInicial * 0.75 ? '#4ADE80' : (item.valorPuntos > item.valorInicial * 0.25 ? '#FBBF24' : '#EF4444');
      this.mostrarTextoFlotante(item.x, item.y, `+${item.valorPuntos}`, colorTexto);
      Sonido.beep(this, 988, 0.06, 0.08);
      this.time.delayedCall(60, () => Sonido.beep(this, 1319, 0.1, 0.08));
    }

    item.destroy();
    if (this.fase === 'recoleccion') this.spawnearMoneda();
  }

  // Al recibir un golpe en Recolección se caen talismanes (el último o todos, según CONFIG.DAÑO_PIERDE)
  // y vuelven a caer desde arriba un rato después.
  perderTalismanes(jugador) {
    if (this.inventario.length === 0) return;
    const arrayPerdidos = CONFIG.DAÑO_PIERDE === 'todos' ? this.inventario.splice(0) : [this.inventario.pop()];
    this.events.emit('inventario', this.contarInventario());
    this.mostrarTextoFlotante(jugador.x, jugador.y - 12, i18n.t(arrayPerdidos.length > 1 ? 'perdiste_talismanes' : 'perdiste_talisman'), '#EF4444');

    arrayPerdidos.forEach(tipo => {
      let dummy = this.physics.add.sprite(jugador.x, jugador.y, tipo);
      dummy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-200, -350));
      this.tweens.add({
        targets: dummy, alpha: 0, duration: 800,
        onComplete: () => dummy.destroy()
      });
    });

    // Cada talismán juntado había generado una moneda: se quitan tantas como talismanes perdidos
    let monedasEnPantalla = this.items.getChildren().filter(i => !i.esTalisman);
    monedasEnPantalla.sort((a, b) => b.valorPuntos - a.valorPuntos);
    monedasEnPantalla.slice(0, arrayPerdidos.length).forEach(m => m.destroy());

    this.time.delayedCall(1200, () => {
      arrayPerdidos.forEach((tipo, index) => {
        this.time.delayedCall(index * 250, () => {
          if (this.fase === 'recoleccion') this.spawnearItem(tipo);
        });
      });
    });
  }

  // ==========================================
  // ENEMIGOS
  // ==========================================
  spawnearDemonio(enCaceria = false) {
    if (!this.enemigosHabilitados) return null;
    if (!enCaceria) {
      if (this.fase !== 'recoleccion') return null;
      const tope = Math.min(CONFIG.TOPE_ENEMIGOS_BASE + Math.floor((this.nivelActual - 1) / 2), CONFIG.TOPE_ENEMIGOS_MAX);
      if (this.enemigos.countActive(true) >= tope) return null;
    }

    // Elección ponderada entre los enemigos habilitados para este nivel
    const disponibles = Object.entries(Bestiario).filter(([, datos]) => datos.nivelMinimo <= this.nivelActual);
    const pesoTotal = disponibles.reduce((suma, [, datos]) => suma + datos.peso, 0);
    let tirada = Math.random() * pesoTotal;
    const [clave] = disponibles.find(([, datos]) => (tirada -= datos.peso) < 0) || disponibles[0];

    return this.crearEnemigo(clave, enCaceria);
  }

  crearEnemigo(clave, enfurecido = false) {
    const config = Bestiario[clave];
    const xAleatoria = Phaser.Math.Between(32, 480);

    const demonio = new Enemigo(this, xAleatoria, -8, config);
    this.enemigos.add(demonio);

    demonio.setCollideWorldBounds(true);
    demonio.arrancar();
    if (enfurecido) demonio.enfurecer();

    if (DEBUG) {
      demonio.textoDebug = this.add.text(demonio.x, demonio.y - 18, '', {
        fontSize: '9px', fill: '#00ff00', backgroundColor: '#000000AA', align: 'center'
      }).setOrigin(0.5, 1).setDepth(10).setVisible(this.DEBUG_DEMONIOS);
    }
    return demonio;
  }

  // El jefe Espectro invoca ayudantes durante la pelea
  invocarEnemigo(clave) {
    if (this.fase !== 'jefe' || this.enemigos.countActive(true) >= 2) return;
    this.crearEnemigo(clave);
  }

  emitirEnemigosRestantes() {
    this.events.emit('enemigos-restantes', this.enemigos.countActive(true) + this.enemigosPorAparecer);
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.isInvul || jugador.isSpawning || demonio.muerto || !this.esFaseJugable()) return;

    const desdeArriba = jugador.body.velocity.y > 0 && jugador.body.bottom <= demonio.body.top + 8;
    if (desdeArriba) {
      jugador.hacerPisoton();
      this.hitStop(50);
      Sonido.efecto(this, 'snd-grito', 0.25);
      if (demonio.enfurecido || this.fase === 'jefe') {
        this.matarEnemigo(demonio, jugador);
        return;
      }
      demonio.setVelocityY(250);
      if (demonio.rasgos.saltarin.activo) {
        demonio.ultimoReboteY = 0; demonio.contadorRebotes = 0;
      }
      return;
    }

    if (demonio.aturdido) return; // Un demonio aturdido no hace daño
    this.recibirGolpe(jugador, demonio.x);
  }

  // Golpe de katana o proyectil: en Recolección aturde y empuja; enfurecidos (Cacería) o en la pelea del jefe, mata.
  golpearEnemigo(enemigo, { dirX = 1, jugador = null } = {}) {
    if (enemigo.muerto) return;
    if (enemigo.enfurecido || this.fase === 'jefe') {
      this.matarEnemigo(enemigo, jugador);
      return;
    }
    enemigo.inmuneStun = this.modsGlobal.enemigosInmunesStun;
    enemigo.aturdir(enemigo.config.duracionStun, dirX * 200, -150);
    Sonido.efecto(this, 'snd-parry', 0.35);
    this.efectoChispas(enemigo.x, enemigo.y, 0x7dd3fc);
  }

  matarEnemigo(enemigo, jugador) {
    if (enemigo.muerto) return;
    const puntos = CONFIG.PUNTOS_BAJA * this.modsGlobal.multPuntos;
    if (jugador) {
      this.sumarPuntos(jugador.indice, puntos);
      this.mostrarTextoFlotante(enemigo.x, enemigo.y - 8, `+${puntos}`, '#4ADE80');
    }
    this.efectoExplosion(enemigo.x, enemigo.y, 10);
    Sonido.efecto(this, 'snd-grito', 0.3, { rate: 1.4 });
    enemigo.morir();

    if (this.fase === 'caceria') {
      this.emitirEnemigosRestantes();
      if (this.enemigos.countActive(true) === 0 && this.enemigosPorAparecer <= 0) this.finCaceria(true);
    }
  }

  recibirGolpe(jugador, fuenteX) {
    if (jugador.isInvul || jugador.isSpawning || this.modoDiosActivo) return;

    if (this.fase === 'caceria') {
      jugador.aplicarDaño(fuenteX);
      this.perderVida();
      return;
    }
    if (this.fase === 'jefe') {
      if (jugador.aplicarDaño(fuenteX, 11)) this.perderVidaEnJefe(); // Invulnerabilidad más larga: cada golpe ya cuesta una vida
      return;
    }
    if (jugador.aplicarDaño(fuenteX)) {
      this.cameras.main.shake(150, 0.008);
      this.mostrarTextoFlotante(jugador.x, jugador.y, i18n.t('ouch'), '#EF4444');
      if (this.fase === 'recoleccion') this.perderTalismanes(jugador);
    }
  }

  // ==========================================
  // COMBATE: KATANA, PROYECTILES Y EXPLOSIONES
  // ==========================================
  procesarKatana(ninja) {
    const katana = ninja.katana;
    if (!katana || !this.esFaseJugable()) return;
    const zona = katana.getBounds();
    const direccion = ninja.flipX ? -1 : 1;

    const golpear = (objeto, accion) => {
      if (!objeto || !objeto.active || ninja.katanaGolpeados.has(objeto)) return;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(zona, objeto.getBounds())) return;
      ninja.katanaGolpeados.add(objeto);
      accion(objeto);
    };

    this.enemigos.getChildren().slice().forEach(e => golpear(e, () => this.golpearEnemigo(e, { dirX: direccion, jugador: ninja })));
    this.items.getChildren().forEach(item => golpear(item, () => item.setVelocity(direccion * 220, -200)));
    this.proyectilesEnemigos.getChildren().slice().forEach(p => golpear(p, () => {
      Sonido.efecto(this, 'snd-parry', 0.5);
      this.efectoChispas(p.x, p.y, 0xffffff);
      p.destroy();
    }));
    this.jugadores.forEach(otro => {
      if (otro !== ninja) golpear(otro, () => otro.empujar(direccion * 220, -160));
    });
    if (this.jefe && this.jefe.active) golpear(this.jefe, () => this.jefe.recibirDaño(1));
  }

  impactoProyectil(proyectil, enemigo) {
    if (!proyectil.active || enemigo.muerto || proyectil.golpeados.has(enemigo)) return;
    proyectil.golpeados.add(enemigo);
    if (proyectil.tipo === 'bomba') {
      this.explotarBomba(proyectil);
      return;
    }
    this.golpearEnemigo(enemigo, { dirX: Math.sign(proyectil.body.velocity.x) || 1, jugador: proyectil.duenio });
    if (proyectil.tipo === 'shuriken') proyectil.destroy();
  }

  impactoProyectilJefe(jefe, proyectil) {
    if (!proyectil.active || proyectil.golpeados.has(jefe)) return;
    proyectil.golpeados.add(jefe);
    if (proyectil.tipo === 'bomba') {
      this.explotarBomba(proyectil);
      return;
    }
    jefe.recibirDaño(1);
    if (proyectil.tipo === 'shuriken') proyectil.destroy();
  }

  explotarBomba(bomba) {
    if (!bomba.active) return;
    const { x, y } = bomba;
    const duenio = bomba.duenio;
    bomba.destroy();

    this.efectoExplosion(x, y, 24);
    Sonido.ruido(this, 0.4, 0.4);
    this.cameras.main.shake(200, 0.01);

    const radio = 48;
    const impulso = (objeto) => {
      const distancia = Phaser.Math.Distance.Between(x, y, objeto.x, objeto.y);
      if (distancia > radio) return null;
      const angulo = Math.atan2(objeto.y - y, objeto.x - x);
      return { vx: Math.cos(angulo) * 300, vy: Math.min(-150, Math.sin(angulo) * 300) };
    };

    this.enemigos.getChildren().slice().forEach(enemigo => {
      const v = impulso(enemigo);
      if (!v || enemigo.muerto) return;
      if (enemigo.enfurecido || this.fase === 'jefe') {
        this.matarEnemigo(enemigo, duenio);
      } else {
        enemigo.inmuneStun = this.modsGlobal.enemigosInmunesStun;
        enemigo.aturdir(enemigo.config.duracionStun, v.vx, v.vy);
      }
    });
    this.items.getChildren().forEach(item => {
      const v = impulso(item);
      if (v) item.setVelocity(v.vx, v.vy);
    });
    this.jugadores.forEach(j => {
      const v = impulso(j);
      if (v) j.empujar(v.vx, v.vy);
    });
    if (this.jefe && this.jefe.active && Phaser.Math.Distance.Between(x, y, this.jefe.x, this.jefe.y) < radio + 16) {
      this.jefe.recibirDaño(3);
    }
  }

  dispararProyectilEnemigo(x, y, vx, vy, { gravedad = false } = {}) {
    if (!this.esFaseJugable()) return null;
    const proyectil = this.proyectilesEnemigos.create(x, y, 'proyectil');
    proyectil.body.setAllowGravity(gravedad);
    if (gravedad) proyectil.body.setGravityY(200);
    proyectil.body.setCircle(3);
    proyectil.setVelocity(vx, vy);
    proyectil.atraviesaBloques = false;
    return proyectil;
  }

  crearOnda(x, yPiso, vx) {
    const onda = this.proyectilesEnemigos.create(x, yPiso - 5, 'onda');
    onda.setVelocity(vx, 0);
    onda.setFlipX(vx < 0);
    onda.atraviesaBloques = true;
    return onda;
  }

  impactoProyectilEnemigo(jugador, proyectil) {
    if (!proyectil.active || jugador.isInvul || jugador.isSpawning) return;
    if (!proyectil.atraviesaBloques) proyectil.destroy();
    this.recibirGolpe(jugador, proyectil.x);
  }

  tocarJefe(jugador, jefe) {
    if (jugador.isInvul || jugador.isSpawning || jefe.muerto || this.fase !== 'jefe') return;
    const desdeArriba = jugador.body.velocity.y > 0 && jugador.body.bottom <= jefe.body.top + 10;
    if (desdeArriba) {
      jugador.hacerPisoton();
      jefe.recibirDaño(2);
      this.hitStop(60);
      return;
    }
    this.recibirGolpe(jugador, jefe.x);
  }

  // ==========================================
  // EFECTOS ("JUICE")
  // ==========================================
  // Congela la física unos milisegundos para que los golpes "peguen"
  hitStop(ms) {
    if (this.physics.world.isPaused) return;
    this.physics.pause();
    this.time.delayedCall(ms, () => {
      if (this.esFaseJugable()) this.physics.resume();
    });
  }

  efectoExplosion(x, y, tamaño) {
    const destello = this.add.circle(x, y, tamaño, 0xffcc33, 0.9).setDepth(70);
    this.tweens.add({ targets: destello, scale: 1.6, alpha: 0, duration: 300, onComplete: () => destello.destroy() });
    const particulas = this.add.particles(x, y, 'chispa', {
      speed: { min: 40, max: 160 }, lifespan: 450, scale: { start: 1.5, end: 0 },
      tint: [0xfde047, 0xf97316, 0xef4444], emitting: false
    }).setDepth(71);
    particulas.explode(Math.min(24, 8 + tamaño));
    this.time.delayedCall(600, () => particulas.destroy());
  }

  efectoChispas(x, y, color = 0xffffff) {
    const particulas = this.add.particles(x, y, 'chispa', {
      speed: { min: 30, max: 90 }, lifespan: 300, scale: { start: 1, end: 0 }, tint: color, emitting: false
    }).setDepth(71);
    particulas.explode(8);
    this.time.delayedCall(400, () => particulas.destroy());
  }

  mostrarTextoFlotante(x, y, texto, color = '#ffffff') {
    const flotante = this.add.text(x, y, texto, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: color, resolution: 10
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: flotante, y: y - 25, alpha: 0, duration: 600, ease: 'Power1',
      onComplete: () => flotante.destroy()
    });
  }
}

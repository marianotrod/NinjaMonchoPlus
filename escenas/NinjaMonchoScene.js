import Ninja, { ESTADO } from '../entidades/Ninja.js';
import { i18n } from '../i18n.js';
import { Bestiario } from '../datos/Bestiario.js';
import Enemigo from '../entidades/Enemigo.js';
import Fantasma from '../entidades/Fantasma.js';
import Jefe from '../entidades/Jefe.js';
import { cambiarTile, construirNivel, crearPlataformaFantasma, extenderTrampa, trampasAlAzar } from '../mundo/CargadorNivel.js';
import { bordeVerticalOpuesto, costadoLibre, wrapear } from '../mundo/Mundo.js';
import { actualizarFuego, crearBola, crearBolaCeleste } from '../mundo/Fuego.js';
import { actualizarRescate, objetosSueltos, prepararRescate } from '../mundo/Rescate.js';
import { BANDO, COLORES, CONFIG, DEBUG, FISICA, LOGICA, MUNDO, PAD, TECLAS, TILES } from '../config.js';
import { nuevaPartida, prepararNivel, esNivelJefe, esNivelFinal, musicaDelNivel } from '../reglas/Partida.js';
import { armarCartas, textoEfecto, tomarCarta } from '../reglas/Pergaminos.js';
import { efectoPorId } from '../datos/Pergaminos.js';
import { RECOMIENZO, reglasDe } from '../reglas/Fases.js';
import { PROTECCION, crearGolpe, golpeaAliado, itemLanzado, resolverGolpe } from '../reglas/Resolvedor.js';
import { marcarPeligros } from '../mundo/Peligros.js';
import { actualizarPausaDeFase, cartelesDeFase, cortarPausaDeFase } from '../sistemas/PausaDeFase.js';
import { crearFondo, cambiarFondo, actualizarFondo } from '../mundo/Fondo.js';
import { actualizarCombos, anularCombo, cobroDeMonedas, prepararCombos, sumarMoneda } from '../reglas/Combo.js';
import { ARMAS, actualizarProyectiles, arrastrarItem, chocarProyectil, soltarBomba } from '../entidades/Armas.js';
import { Sonido } from '../sistemas/Sonido.js';
import { Guardado } from '../sistemas/Guardado.js';
import { estilo } from '../sistemas/Estilo.js';
import { EVENTOS } from '../datos/Eventos.js';

// Fases del nivel:
//   intro -> recoleccion -> transicion -> caceria -> nivelCompletado   (niveles normales)
//   intro -> jefe -> nivelCompletado                                    (niveles de jefe)
//   perdiendoVida (todos sin vidas, esperando el game over) y fin interrumpen cualquiera de las anteriores.
// Perder una vida no reinicia el nivel: el ninja cae fuera de la pantalla y reaparece arriba (si le quedan vidas).
const TIPOS_TALISMAN = ['cuadrado', 'triangulo', 'rombo'];

export default class NinjaMonchoScene extends Phaser.Scene {
  constructor() {
    super("NinjaMonchoScene");
  }

  init(data) {
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

    this.esNivelJefe = esNivelJefe(this.nivelActual);
    this.esSala = partida.enSala;
    // Los modificadores de todos: es el mismo objeto que guarda la partida
    this.modsGlobal = partida.mods.global;
    this.fase = 'intro';
    this.listoParaContinuar = false;
    this.inventario = [];
    this.fantasmas = [];
    this.persecucion = false;  // Ya se acabó el tiempo y aparecieron los fantasmas
    partida.puntajesAlEmpezar = [...partida.puntajes];
    this.jefe = null;
    this.collidersJefe = [];
    this.enemigosPorAparecer = 0;
    this.primerEnemigoCreado = false;
    // La escena se reutiliza al pasar de nivel: lo del nivel anterior ya no existe
    this.uiHotJoin = null;
    this.jugador2 = null;
    this.cartas = null;
    this.timerCaceria = null;
    this.esperaExtension = CONFIG.ESPERA_EXTENSION_TRAMPA;
    this.anchoPlataforma = CONFIG.PLATAFORMA_ANCHO;
    this.duracion = CONFIG.PLATAFORMA_DURACION;

    this.DEBUG_DEMONIOS = false;
    this.modoDiosActivo = false;
    this.enemigosHabilitados = true;

    const padP1 = this.registry.get('padIndexP1');
    const padP2 = this.registry.get('padIndexP2');
    this.padIndexP1 = padP1 === undefined ? null : padP1;
    this.padIndexP2 = padP2 === undefined ? null : padP2;
    this.prevPadBotones = {};

    this.physics.world.setBounds(0, -32, 512, 320);

    const datosNivel = partida.datosNivel;
    this.conWrap = !!datosNivel.wrap;
    const hayBordes = !this.conWrap;
    this.physics.world.setBoundsCollision(hayBordes, hayBordes, hayBordes, hayBordes);
    Sonido.musica(this, datosNivel.musica || musicaDelNivel(this.nivelActual), 0.4);
    Sonido.ritmoMusica(1);

    crearFondo(this, datosNivel.fondoImagen, this.esSala ? 'sala' : (this.esNivelJefe ? 'jefe' : null));

    this.spawns = construirNivel(this, datosNivel);
    if (!this.esSala) trampasAlAzar(this, this.modsGlobal.trampasAlAzar);

    this.items = this.physics.add.group();
    this.enemigos = this.physics.add.group();
    this.proyectiles = this.physics.add.group({ allowGravity: false });
    this.llamas = this.physics.add.group({ allowGravity: false, immovable: true });
    this.peligros = this.physics.add.group();   // Minas y bombas especiales: solo dañan a los jugadores

    this.jugadores = [];
    this.jugador = new Ninja(this, this.spawns[0].x, this.spawns[0].y, 'ninja', TECLAS.J1, 'moncho', 0);
    if (this.padIndexP1 !== null) this.jugador.control.asignarPad(this.padIndexP1);
    this.jugadores.push(this.jugador);
    this.conectarFisicasJugador(this.jugador);
    if (partida.vidas[0] <= 0) this.jugador.retirar();

    if (this.cantidadJugadores === 2) {
      this.crearPlayer2();
    } else if (!this.esSala) {
      // En la sala no se puede entrar: el J2 entra en un nivel común
      this.prepararHotJoin();
    }
    this.grupoRescate = null;
    prepararRescate(this);
    prepararCombos(this);
    cortarPausaDeFase(this);  // Por si el nivel anterior se cerró en medio de una pausa de fase
    this.events.once('shutdown', () => { this.anims.globalTimeScale = 1; });

    this.physics.add.collider(this.items, this.bloquesFisicos, this.procesarImpactoPiso, null, this);
    this.physics.add.collider(this.enemigos, this.bloquesFisicos,
      (enemigo, bloque) => {
        if (!bloque.esTrampa || enemigo.intocable) return;
        enemigo.enfurecer();
        if (this.modsGlobal.trampaSeExtiende) extenderTrampa(this, bloque);
      },
      // Los voladores no chocan; los caminantes atraviesan las pasarelas mientras bajan de una
      (enemigo, bloque) => !enemigo.rasgos.volador.activo && !(bloque.esOneWay && this.time.now < enemigo.atravesando), this);
    this.physics.add.overlap(this.enemigos, this.llamas, (enemigo) => enemigo.enfurecer(), (enemigo) => !enemigo.intocable);
    // Pergamino: la furia se contagia entre demonios
    this.physics.add.overlap(this.enemigos, this.enemigos, (a, b) => { a.enfurecer(); b.enfurecer(); },
      (a, b) => this.modsGlobal.contagio && a !== b && a.enfurecido !== b.enfurecido && !a.intocable && !b.intocable);
    this.physics.add.overlap(this.items, this.enemigos, this.impactoItem, itemLanzado, this);
    // Boulder nivel 2: un enemigo disparado golpea a los otros
    this.physics.add.overlap(this.enemigos, this.enemigos, this.choqueLanzado,
      (a, b) => a !== b && !!(a.lanzado || b.lanzado), this);
    this.physics.add.collider(this.peligros, this.bloquesFisicos);
    // Las minas y las bombas especiales se rompen con los proyectiles de los jugadores, y explotan
    this.physics.add.overlap(this.proyectiles, this.peligros, (proyectil, peligro) => {
      if (proyectil.tipo === 'shuriken' || proyectil.tipo === 'bolaCeleste') proyectil.destroy();
      this.detonarPeligro(peligro);
    }, (proyectil) => proyectil.bando === BANDO.JUGADORES, this);
    this.physics.add.collider(this.proyectiles, this.bloquesFisicos,
      (proyectil) => {
        if (proyectil.bando === BANDO.JUGADORES) chocarProyectil(this, proyectil);
        else if (!proyectil.rebota) this.chocarProyectilEnemigo(proyectil);
      },
      (proyectil, bloque) => (proyectil.bando === BANDO.DEMONIOS
        ? proyectil.rebota || (!proyectil.atraviesaBloques && !bloque.esOneWay)
        : proyectil.tipo === 'bomba' || !bloque.esOneWay), this);
    this.physics.add.overlap(this.proyectiles, this.enemigos, this.impactoProyectil,
      (proyectil) => proyectil.bando === BANDO.JUGADORES, this);
    this.physics.add.overlap(this.proyectiles, this.items, (proyectil, item) => arrastrarItem(proyectil, item),
      (proyectil) => proyectil.tipo === 'bumeran', this);

    const tiempoNivel = datosNivel.tiempo ?? (this.esNivelJefe ? CONFIG.TIEMPO_JEFE : CONFIG.TIEMPO_RECOLECCION);
    const tiempoBase = this.esNivelJefe ? tiempoNivel : tiempoNivel + this.modsGlobal.tiempoExtra;
    this.tiempoRestante = this.esSala ? CONFIG.DURACION_SALA : Math.max(CONFIG.TIEMPO_MINIMO, tiempoBase);
    if (this.esSala) this.prepararSala(datosNivel);

    this.relojJuego = this.time.addEvent({ delay: 1000, callback: this.tickReloj, callbackScope: this, loop: true, paused: true });
    this.timerDemonios = this.time.addEvent({ delay: CONFIG.INTERVALO_DEMONIOS, callback: () => this.spawnearDemonio(), loop: true, paused: true });

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

    this.events.once(EVENTOS.UI_LISTA, () => this.mostrarIntro());
    this.scene.launch('UIScene');
  }

  // ==========================================
  // FASES DEL NIVEL
  // ==========================================
  mostrarIntro() {
    if (this.esSala) {
      this.events.emit(EVENTOS.BANNER, { titulo: i18n.t('sala_titulo'), subtitulo: i18n.t('sala_sub'), color: '#4ADE80', duracion: CONFIG.CUENTA_SALA * 3 });
      [3, 2, 1].forEach((numero, i) => this.time.delayedCall(CONFIG.CUENTA_SALA * (i + 1), () => {
        this.events.emit(EVENTOS.BANNER, { titulo: `${numero}`, color: '#FBBF24', duracion: CONFIG.CUENTA_SALA - 50, chico: true });
        Sonido.beep(this, 523, 0.06, 0.08);
      }));
      this.time.delayedCall(CONFIG.CUENTA_SALA * 4, () => this.iniciarSala());
    } else if (this.esNivelJefe) {
      this.events.emit(EVENTOS.BANNER, {
        titulo: i18n.t('jefe_aparece'), subtitulo: i18n.t(`jefe_${this.partida.jefe}`), color: '#EF4444', duracion: CONFIG.DURACION_INTRO
      });
      this.time.delayedCall(CONFIG.APARICION_JEFE, () => this.spawnearJefe());
      this.time.delayedCall(CONFIG.DURACION_INTRO, () => this.iniciarFaseJefe());
    } else {
      this.events.emit(EVENTOS.BANNER, {
        titulo: `${i18n.t('nivel')} ${this.nivelActual}`, subtitulo: i18n.t('objetivo_recoleccion'), iconos: true, duracion: CONFIG.DURACION_INTRO
      });
      this.time.delayedCall(CONFIG.DURACION_INTRO, () => this.iniciarRecoleccion());
    }
  }

  iniciarRecoleccion() {
    if (this.fase !== 'intro') return;
    this.fase = 'recoleccion';
    this.events.emit(EVENTOS.FASE, 'recoleccion');
    this.events.emit(EVENTOS.BANNER, { titulo: i18n.t('ya'), color: '#4ADE80', duracion: 700, chico: true });

    const bolsaInicial = [
      'cuadrado', 'cuadrado', 'cuadrado', 'cuadrado',
      'triangulo', 'triangulo', 'triangulo', 'triangulo',
      'rombo', 'rombo', 'rombo', 'rombo'
    ];
    Phaser.Utils.Array.Shuffle(bolsaInicial);

    this.time.addEvent({
      delay: CONFIG.INTERVALO_TALISMANES,
      repeat: 11,
      callback: () => {
        const forma = bolsaInicial.pop();
        this.spawnearItem(forma);
      },
      callbackScope: this
    });

    this.relojJuego.paused = false;
    this.timerDemonios.paused = false;
  }

  finRecoleccion() {
    if (this.fase !== 'recoleccion' || this.modoDiosActivo) return;
    this.fase = 'transicion';
    this.detenerTimers();
    Sonido.ritmoMusica(1);
    this.terminarPersecucion();

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
    this.enemigos.getChildren().forEach(enemigo => enemigo.enfurecer());

    // El juego frena, cambia el fondo, salen los carteles y la Cacería empieza recién cuando recupera la velocidad
    cambiarFondo(this, 'caceria');
    cartelesDeFase(this, [
      { titulo: i18n.t('sello_roto'), subtitulo: `${i18n.t('bono_tiempo')} +${bono}`, color: '#EF4444', duracion: CONFIG.DURACION_SELLO },
      { titulo: i18n.t('caceria'), subtitulo: i18n.t('objetivo_caceria'), color: '#EF4444', duracion: CONFIG.DURACION_CARTEL_CACERIA, chico: true }
    ], () => this.iniciarCaceria());
  }

  iniciarCaceria() {
    if (this.fase !== 'transicion') return;
    this.fase = 'caceria';
    this.puntajesCaceria = [...this.partida.puntajes];
    this.reaparecerLosQueEsperan();
    this.arrancarCaceria(false);  // El cartel ya salió en la pausa de fase
  }

  arrancarCaceria(conCartel = true) {
    this.tiempoRestante = CONFIG.TIEMPO_CACERIA;
    this.relojJuego.paused = false;
    Sonido.ritmoMusica(1);
    this.events.emit(EVENTOS.TIEMPO, this.tiempoRestante);
    this.events.emit(EVENTOS.FASE, 'caceria');
    if (conCartel) this.events.emit(EVENTOS.BANNER, { titulo: i18n.t('caceria'), subtitulo: i18n.t('objetivo_caceria'), color: '#EF4444', duracion: 1400, chico: true });

    // Cupo de demonios a cazar: crece con el nivel
    const cupo = Math.min(CONFIG.CUPO_CACERIA_BASE + Math.floor(this.nivelActual / 2), CONFIG.CUPO_CACERIA_MAX);
    this.enemigosPorAparecer = Math.max(0, cupo - this.enemigos.countActive(true));
    if (this.timerCaceria) this.timerCaceria.remove();
    if (this.enemigosPorAparecer > 0) {
      this.timerCaceria = this.time.addEvent({
        delay: CONFIG.INTERVALO_CACERIA, repeat: this.enemigosPorAparecer - 1,
        callback: () => {
          if (this.fase !== 'caceria') return;
          this.enemigosPorAparecer--;
          this.spawnearDemonio(true);
          this.emitirEnemigosRestantes();
        }
      });
    }
    this.emitirEnemigosRestantes();

    // Siguen cayendo monedas, hasta un tope: sirven para sumar puntos y para pisarlas y llegar más alto
    if (this.timerMonedas) this.timerMonedas.remove();
    this.timerMonedas = this.time.addEvent({ delay: CONFIG.INTERVALO_MONEDAS_CACERIA, loop: true, callback: () => this.reponerMoneda() });

    this.relojJuego.paused = false;
  }

  finCaceria() {
    if (this.fase !== 'caceria' || this.cobrarCaidas()) return;
    this.terminarPersecucion();
    const bono = this.tiempoRestante * CONFIG.BONO_POR_SEGUNDO;
    this.jugadores.forEach(j => this.sumarPuntos(j.indice, bono));
    this.completarNivel({ bonoTiempo: bono });
  }

  iniciarFaseJefe() {
    if (this.fase !== 'intro') return;
    this.fase = 'jefe';
    this.events.emit(EVENTOS.FASE, 'jefe');
    this.relojJuego.paused = false;
  }

  spawnearJefe() {
    // Aparece apenas dentro del límite superior del mundo (y = -32): si naciera afuera, el borde lo frenaría
    this.jefe = new Jefe(this, 256, -6, this.partida.jefe);
    this.collidersJefe.push(
      this.physics.add.collider(this.jefe, this.bloquesFisicos, null, (jefe, bloque) => !jefe.datos.vuela && !bloque.esOneWay, this),
      this.physics.add.overlap(this.jefe, this.proyectiles, (jefe, proyectil) => this.impactoProyectil(proyectil, jefe),
        (jefe, proyectil) => proyectil.bando === BANDO.JUGADORES, this),
      this.physics.add.overlap(this.jefe, this.items, (jefe, item) => this.impactoItem(item, jefe),
        (jefe, item) => itemLanzado(item), this)
    );
    this.jugadores.forEach(j => this.conectarJefe(j));
    this.events.emit(EVENTOS.JEFE_APARECE, i18n.t(`jefe_${this.partida.jefe}`), this.jefe.hp);
  }

  jefeDerrotado() {
    if (this.fase !== 'jefe' || this.cobrarCaidas()) return;
    if (this.jefe) this.ultimaBaja = { x: this.jefe.x, y: this.jefe.y };
    this.jefe = null;
    this.collidersJefe.forEach(c => c.destroy());
    this.collidersJefe = [];
    this.detenerTimers();
    this.terminarPersecucion();
    this.enemigos.getChildren().slice().forEach(enemigo => enemigo.morir());
    this.proyectilesDe(BANDO.DEMONIOS).forEach(proyectil => proyectil.destroy());

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

    // Las monedas se cobran ahora: lo que valían por el combo máximo de cada uno
    const monedas = cobroDeMonedas(this);
    monedas.forEach((cobro, indice) => this.sumarPuntos(indice, cobro.puntos));

    // Golpe final: la cámara se acerca a la última baja con un destello, y el panel sale un momento después
    const { zoom, duracion, esperaPanel } = CONFIG.GOLPE_FINAL;
    if (this.ultimaBaja && zoom > 1) {
      const camara = this.cameras.main;
      camara.setBounds(0, 0, this.scale.width, this.scale.height);  // Que el zoom no muestre lo que está fuera de la pantalla
      camara.flash(150, 255, 255, 255);
      camara.pan(this.ultimaBaja.x, this.ultimaBaja.y, duracion, 'Quad.easeOut');
      camara.zoomTo(zoom, duracion, 'Quad.easeOut');
      Sonido.beep(this, 196, 0.35, 0.12, 'square');
    }
    this.time.delayedCall(esperaPanel, () => this.events.emit(EVENTOS.NIVEL_COMPLETADO, {
      nivel: this.nivelActual,
      monedas,
      puntajes: this.partida.puntajes,
      jugadores: this.cantidadJugadores,
      ...info
    }));
    this.listoParaContinuar = false;
    this.time.delayedCall(esperaPanel + 1200, () => { this.listoParaContinuar = true; });
  }

  // Entre un nivel y el siguiente se pasa por la sala de pergaminos
  avanzarNivel() {
    const partida = this.partida;
    partida.nivel++;
    partida.datosNivel = null;
    partida.enSala = true;
    partida.cartas = armarCartas(partida);
    this.scene.stop('UIScene');
    this.scene.restart();
  }

  // ==========================================
  // SALA DE PERGAMINOS
  // ==========================================
  // Cada carta muestra arriba el positivo y abajo el negativo. El primero que toca una se la lleva y queda quieto.
  prepararSala(nivel) {
    const g = this.modsGlobal;
    const lugares = nivel.objetos.filter(objeto => objeto.tipo === 'spawnPergamino');
    this.cartas = this.physics.add.staticGroup();
    const encadenada = g.cadena ? Phaser.Math.Between(0, this.partida.cartas.length - 1) : -1;
    this.partida.cartas.forEach((datos, i) => {
      const lugar = lugares[i];
      if (!lugar) return;
      const x = (lugar.col - MUNDO.columnasOcultas) * MUNDO.tile + MUNDO.tile;
      const y = (lugar.fila - MUNDO.filasOcultas) * MUNDO.tile + MUNDO.tile * 2;
      const carta = this.cartas.create(x, y, 'carta-pergamino');
      carta.datos = datos;
      carta.encadenada = i === encadenada;
      const texto = (id, dy, color) => this.add.text(x, y + dy, this.nombrePergamino(id), estilo(8, color, {
        align: 'center', lineSpacing: 2, wordWrap: { width: 120 }, stroke: '#000000', strokeThickness: 3
      })).setOrigin(0.5, dy < 0 ? 1 : 0).setDepth(30);
      carta.textoPositivo = texto(datos.positivo, -36, '#86EFAC');
      carta.textoNegativo = texto(datos.negativo, 36, '#FCA5A5');
      if (g.ocultarNegativos) {
        carta.textoNegativo.setVisible(false);
        this.time.delayedCall(CONFIG.SALA_OCULTA, () => carta.textoNegativo.setVisible(true));
      }
      if (g.positivosIlegibles) this.time.delayedCall(CONFIG.SALA_OCULTA, () => carta.textoPositivo.setText('???'));
      this.jugadores.forEach(jugador => {
        this.physics.add.overlap(jugador, carta, this.tocarCarta, () => !jugador.muerto && !jugador.eliminado, this);
      });
      if (carta.encadenada) {
        carta.cadena = this.add.text(x, y, 'X', estilo(32, '#9CA3AF')).setOrigin(0.5).setDepth(31);
        this.time.delayedCall(CONFIG.SALA_CADENA, () => { carta.encadenada = false; carta.cadena.destroy(); });
      }
    });
  }

  // Los que todavía no funcionan llevan (X) adelante
  nombrePergamino(id) {
    return `${efectoPorId(id).pendiente ? '(X) ' : ''}${i18n.t(textoEfecto(this.partida, id))}`;
  }

  iniciarSala() {
    if (this.fase !== 'intro') return;
    this.fase = 'sala';
    this.events.emit(EVENTOS.FASE, 'sala');
    this.relojJuego.paused = false;
  }

  tocarCarta(jugador, carta) {
    if (this.fase !== 'sala' || jugador.congelado || carta.tomada || carta.encadenada) return;
    carta.tomada = true;
    jugador.congelado = true;
    const nombre = this.nombrePergamino(carta.datos.positivo); // Antes de tomarla: después el nivel ya cambió
    tomarCarta(this.partida, carta.datos, jugador.indice);
    Sonido.beep(this, 784, 0.1, 0.1);
    this.efectoChispas(carta.x, carta.y, 0xfde047);
    [carta, carta.textoPositivo, carta.textoNegativo].forEach(objeto => objeto.destroy());
    this.mostrarTextoFlotante(jugador.x, jugador.y - 16, nombre, '#4ADE80');
    const quedan = this.jugadores.some(j => !j.eliminado && !j.congelado);
    if (!quedan) this.terminarSala();
  }

  // Sigue el nivel que se había pedido al salir del anterior
  terminarSala() {
    if (this.fase !== 'sala') return;
    this.fase = 'transicion';
    this.detenerTimers();
    this.time.delayedCall(700, () => {
      const partida = this.partida;
      partida.enSala = false;
      partida.cartas = null;
      partida.datosNivel = null;
      this.scene.stop('UIScene');
      this.scene.restart();
    });
  }

  jugadorCayoFuera(jugador) {
    if (!this.esFaseJugable()) return;
    Sonido.efecto(this, 'snd-caida', 0.7);
    const vidas = this.partida.vidas;
    vidas[jugador.indice] = Math.max(0, vidas[jugador.indice] - 1);
    this.events.emit(EVENTOS.VIDAS, vidas);

    const sinVidas = vidas[jugador.indice] === 0;
    if (sinVidas) {
      jugador.retirar();
      this.events.emit(EVENTOS.ARMA, jugador.indice, null, 0);
      if (this.jugadores.every(j => j.eliminado)) {
        this.perderPartida();
        return;
      }
    }

    // Perder una vida se ve en el corazón que late en el HUD; el cartel queda para cuando alguien se queda sin vidas
    if (sinVidas) this.events.emit(EVENTOS.BANNER, { titulo: `${i18n.jugador(jugador.indice)} ${i18n.t('eliminado')}`, color: '#EF4444', duracion: 1400, chico: true });

    if (this.debeRecomenzar()) {
      this.recomenzar();
      return;
    }
    if (sinVidas || this.persecucion) return;
    this.time.delayedCall(CONFIG.ESPERA_RESPAWN, () => {
      if (this.esFaseJugable() && jugador.active) jugador.respawnear(this.spawnDe(jugador));
    });
  }

  // Si la fase se gana mientras alguien todavía cae, esa vida igual se pierde. Devuelve si con eso terminó la partida.
  cobrarCaidas() {
    const vidas = this.partida.vidas;
    this.jugadores.filter(j => j.muerto && !j.caidaAvisada).forEach(jugador => {
      jugador.caidaAvisada = true;
      vidas[jugador.indice] = Math.max(0, vidas[jugador.indice] - 1);
      if (vidas[jugador.indice] === 0) jugador.retirar();
    });
    this.events.emit(EVENTOS.VIDAS, vidas);
    if (!this.jugadores.every(j => j.eliminado)) return false;
    this.perderPartida();
    return true;
  }

  // Nadie más en pie: fin de la partida
  perderPartida() {
    this.fase = 'perdiendoVida';
    this.detenerTimers();
    this.physics.pause();
    Sonido.ritmoMusica(1);
    this.cameras.main.shake(300, 0.015);
    this.time.delayedCall(900, () => this.finalizarPartida(false));
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

    this.events.emit(EVENTOS.JUEGO_TERMINADO, {
      ganaste, puntajes, total, nuevoRecord, record: Math.max(total, recordAnterior), nivel: this.nivelActual
    });
    this.listoParaContinuar = false;
    this.time.delayedCall(1500, () => { this.listoParaContinuar = true; });
  }

  detenerTimers() {
    this.relojJuego.paused = true;
    this.timerDemonios.paused = true;
    if (this.timerMonedas) this.timerMonedas.remove();
    this.timerMonedas = null;
  }

  get reglas() {
    return reglasDe(this.fase);
  }

  esFaseJugable() {
    return this.reglas.jugable;
  }

  // ==========================================
  // RELOJ, ALARMA Y FANTASMA
  // ==========================================
  tickReloj() {
    if (this.persecucion) return;
    this.tiempoRestante = Math.max(0, this.tiempoRestante - 1);
    this.events.emit(EVENTOS.TIEMPO, this.tiempoRestante);

    const t = this.tiempoRestante;
    if (t > 0 && t <= CONFIG.ALARMA_TIEMPO) {
      const urgente = t <= CONFIG.ALARMA_URGENTE;
      Sonido.beep(this, urgente ? 1046 : 784, 0.07, 0.1);
      Sonido.ritmoMusica(urgente ? 1.25 : 1.12);
    }
    if (t > 0 || this.modoDiosActivo) return;

    if (this.reglas.terminaConElTiempo) this.terminarSala();
    else if (this.reglas.recomienzoPorFantasma) this.tiempoAgotado();
  }

  // Se acabó el tiempo: el juego frena, avisa, y los fantasmas entran cuando recupera la velocidad
  tiempoAgotado() {
    this.persecucion = true;
    Sonido.ritmoMusica(1.3);
    Sonido.beep(this, 110, 0.6, 0.15, 'sawtooth');
    cambiarFondo(this, 'fantasma');
    cartelesDeFase(this, [
      { titulo: i18n.t('fantasma'), subtitulo: i18n.t('fantasma_sub'), color: '#E5E7EB', duracion: CONFIG.DURACION_CARTEL_FANTASMA }
    ], () => { if (this.persecucion) this.aparecerFantasmas(); });
  }

  // Uno por jugador en pie. Cada uno persigue al suyo, pero puede matar a cualquiera. Para dar el mayor tiempo posible
  // entran por el costado opuesto a los jugadores, a la altura de su objetivo. Si hay uno de cada lado, cada uno entra
  // en la columna de su objetivo, por arriba o por abajo, lo más lejos de él. Nacen en el corte del wrap, pero no les
  // afecta: los fantasmas no cruzan.
  aparecerFantasmas() {
    this.persecucion = true;
    const perseguidos = this.jugadores.filter(j => j.active && !j.muerto);
    const costado = costadoLibre(perseguidos.map(j => j.x));
    const objetivos = perseguidos.length > 0 ? perseguidos : [null];
    objetivos.forEach(objetivo => {
      const x = costado ?? objetivo.x;
      const altura = objetivo ? Phaser.Math.Clamp(objetivo.y, 24, 264) : 144;
      const y = costado === null ? bordeVerticalOpuesto(objetivo.y) : altura;
      const fantasma = new Fantasma(this, x, y, objetivo);
      this.fantasmas.push(fantasma);
      this.jugadores.forEach(jugador => this.conectarFantasma(jugador, fantasma));
    });
    this.events.emit(EVENTOS.FANTASMA);
  }

  quitarFantasma(fantasma) {
    this.fantasmas = this.fantasmas.filter(f => f !== fantasma);
    fantasma.colliders.forEach(c => c.destroy());
    fantasma.body.enable = false;
    this.tweens.killTweensOf(fantasma);
    this.tweens.add({ targets: fantasma, alpha: 0, scale: 2, duration: 400, onComplete: () => fantasma.destroy() });
  }

  terminarPersecucion() {
    if (this.persecucion) cambiarFondo(this, this.esNivelJefe ? 'jefe' : 'caceria');
    this.persecucion = false;
    this.fantasmas.forEach(fantasma => this.quitarFantasma(fantasma));
  }

  // Cada jugador tiene su fantasma: muera como muera, el suyo desaparece, y nunca quedan dos para uno solo
  alMorirNinja(jugador) {
    if (this.persecucion) anularCombo(this, jugador.indice);  // Morir con el reloj en cero anula el combo máximo
    if (jugador.mods.bombaAlMorir) soltarBomba(this, jugador);
    this.fantasmas.filter(fantasma => fantasma.objetivo === jugador).forEach(fantasma => this.quitarFantasma(fantasma));
  }

  // Solo le falta objetivo si apareció cuando no había nadie en pie
  objetivoDeFantasma(fantasma) {
    const { objetivo } = fantasma;
    if (objetivo && objetivo.active && !objetivo.muerto) return objetivo;
    fantasma.objetivo = this.jugadorMasCercano(fantasma.x, fantasma.y);
    return fantasma.objetivo;
  }

  // Se lo puede pisar una sola vez: se frena un momento y después se enoja, va más rápido y ya no se deja pisar
  tocarFantasma(jugador, fantasma) {
    if (jugador.muerto || !this.fantasmas.includes(fantasma) || fantasma.pisado) return;
    const desdeArriba = jugador.body.velocity.y > 0 && jugador.body.bottom <= fantasma.body.top + 8;
    if (desdeArriba && !fantasma.enojado && !jugador.apareciendo && this.reglas.jugable) {
      jugador.hacerPisoton();
      fantasma.serPisado();
      this.hitStop(50);
      Sonido.beep(this, 220, 0.25, 0.12, 'sawtooth');
      return;
    }
    resolverGolpe(this, jugador, crearGolpe('fantasma', { bando: BANDO.DEMONIOS, fuenteX: fantasma.x }));
  }

  // Con el reloj en cero se juega a todo o nada. Se espera a que terminen de caer todos, para que cada uno pierda su vida.
  debeRecomenzar() {
    return this.persecucion && !this.jugadores.some(j => j.active && (!j.muerto || !j.caidaAvisada));
  }

  // Los que murieron con el reloj en cero vuelven cuando el reloj vuelve a empezar
  reaparecerLosQueEsperan() {
    this.jugadores.filter(j => j.muerto && j.caidaAvisada).forEach(j => j.respawnear(this.spawnDe(j)));
  }

  // La física sigue andando: un último disparo que ya iba por el aire todavía puede ganar la fase
  recomenzar() {
    const { fase } = this;
    const recomienzo = this.reglas.recomienzoPorFantasma;
    this.detenerTimers();
    this.events.emit(EVENTOS.BANNER, { titulo: i18n.t('otra_vez'), color: '#EF4444', duracion: CONFIG.ESPERA_RESPAWN, chico: true });
    this.time.delayedCall(CONFIG.ESPERA_RESPAWN, () => {
      const jefeVencido = this.jefe && this.jefe.muerto;
      if (this.fase !== fase || jefeVencido) return;
      if (recomienzo === RECOMIENZO.NIVEL) this.recomenzarNivel();
      else this.recomenzarCaceria();
    });
  }

  // Se pierden los puntos del nivel: morir no puede ser una forma de sumar más
  recomenzarNivel() {
    this.partida.puntajes = [...this.partida.puntajesAlEmpezar];
    this.scene.stop('UIScene');
    this.scene.restart();
  }

  // Sigue con los enemigos que queden y completa el cupo. Por eso vuelven los puntos del comienzo de la fase.
  recomenzarCaceria() {
    this.partida.puntajes = [...this.puntajesCaceria];
    this.events.emit(EVENTOS.PUNTAJE, this.partida.puntajes);
    this.terminarPersecucion();
    this.reaparecerLosQueEsperan();
    this.arrancarCaceria();
  }

  spawnDe(jugador) {
    return this.spawns[jugador.indice];
  }

  // ==========================================
  // JUGADORES, HOT-JOIN Y JOYSTICKS
  // ==========================================
  conectarFisicasJugador(jugador) {
    // Un ninja muerto atraviesa el escenario y no interactúa con nada mientras cae
    const enJuego = () => !jugador.muerto && !jugador.eliminado;

    this.physics.add.collider(jugador, this.bloquesFisicos, (j, bloque) => {
      if (bloque.esTrampa) this.tocarTrampa(j, bloque);
    }, (j, bloque) => {
      if (!enJuego()) return false;
      if (j.quiereAtravesarOneWay && bloque.esOneWay) {
          return false;
      }
      return true;
    }, this);

    this.physics.add.overlap(jugador, this.items, this.tocarItem, enJuego, this);

    this.physics.add.overlap(jugador, this.peligros, (j, peligro) => { if (peligro.explotaAlTocar) this.detonarPeligro(peligro); }, enJuego, this);
    this.physics.add.overlap(jugador, this.llamas, (j, llama) => this.golpearConTile(j, 'llama', llama.x), enJuego, this);

    this.physics.add.overlap(jugador, this.enemigos, (j, demonio) => {
      this.tocarDemonio(j, demonio);
    }, enJuego, this);

    this.physics.add.overlap(jugador, this.proyectiles, this.impactoProyectilEnemigo,
      (j, proyectil) => enJuego() && this.proyectilGolpea(proyectil, j), this);

    this.fantasmas.forEach(fantasma => this.conectarFantasma(jugador, fantasma));
    if (this.jefe) this.conectarJefe(jugador);
  }

  conectarFantasma(jugador, fantasma) {
    fantasma.colliders.push(this.physics.add.overlap(jugador, fantasma, () => this.tocarFantasma(jugador, fantasma)));
  }

  conectarJefe(jugador) {
    this.collidersJefe.push(this.physics.add.overlap(jugador, this.jefe, this.tocarJefe, null, this));
  }

  prepararHotJoin() {
    this.hotJoinTimer = 0;
    this.hotJoinTecladoP2 = false;

    this.uiHotJoin = this.add.container(496, 284).setDepth(100);
    const txtHotJoin = this.add.text(0, -6, i18n.t('hotjoin_prompt'), estilo(8)).setOrigin(1, 0.5);
    const bgBarra = this.add.rectangle(0, 1, 60, 4, 0x000000, 0.5).setOrigin(1, 0.5);
    this.barraHotJoin = this.add.rectangle(-59, 1, 0, 2, 0xffffff).setOrigin(0, 0.5);

    this.uiHotJoin.add([txtHotJoin, bgBarra, this.barraHotJoin]);

    const teclasJ2 = Object.values(TECLAS.J2).map(tecla => `Key${tecla}`);
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

    this.jugador2 = new Ninja(this, this.spawns[1].x, this.spawns[1].y, 'ninja_coop', TECLAS.J2, 'coop', 1);
    if (this.padIndexP2 !== null) this.jugador2.control.asignarPad(this.padIndexP2);

    this.jugadores.push(this.jugador2);
    this.brillar(this.jugador2, !!this.reglas.brilloInmortal);
    this.conectarFisicasJugador(this.jugador2);
    if (this.partida.vidas[1] <= 0) this.jugador2.retirar();

    // Los ninjas se atraviesan entre sí, salvo al caer sobre la cabeza del compañero: "trampolín humano"
    this.physics.add.overlap(this.jugador, this.jugador2, this.procesarTrampolin, null, this);
    this.events.emit(EVENTOS.JUGADORES, 2);

    if (esMidGame) {
      Sonido.efecto(this, 'snd-salto', 1);
      const cartel = this.add.text(496, 268, i18n.t('hotjoin_joined'), estilo(8, '#FBBF24')).setOrigin(1, 0.5).setDepth(200);

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

  procesarTrampolin(a, b) {
    if (a.muerto || b.muerto) return;
    for (const [arriba, abajo] of [[a, b], [b, a]]) {
      // Venía cayendo y en el paso anterior sus pies estaban por encima de la cabeza del otro
      const piesAntes = arriba.body.prev.y + arriba.body.height;
      if (arriba.body.velocity.y > 40 && piesAntes <= abajo.body.prev.y + 4) {
        arriba.setVelocityY(FISICA.trampolin * arriba.factorSalto);
        arriba.saltoExtraDisponible = arriba.tieneHabilidad('dobleSalto');
        arriba.dashDisponible = true;
        arriba.saltoCortable = false;
        Sonido.efecto(this, 'snd-salto', 1.2, { rate: 1.3 });
        return;
      }
    }
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
          this.jugador.control.asignarPad(pad.index);
        } else if (pad.index !== this.padIndexP1) {
          if (this.padIndexP2 !== pad.index) {
            this.padIndexP2 = pad.index;
            this.registry.set('padIndexP2', pad.index);
          }
          if (this.jugador2) {
            this.jugador2.control.asignarPad(pad.index);
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
      if (!j.active || j.muerto) return;
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
    actualizarPausaDeFase(this, delta);
    actualizarFondo(this, delta);
    if (this.brilloActual !== this.reglas.brilloInmortal) this.aplicarBrillo();
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

    actualizarCombos(this, delta * (this.velocidadJuego ?? 1));
    this.items.getChildren().forEach(item => {
      if (item.esTalisman) this.atraerConIman(item, delta);
      if (item.lanzador && !itemLanzado(item)) {
        item.lanzador = null;
        this.colorearItem(item);
      }
      if (item.body.touching.down) {
        item.setVelocityX(item.body.velocity.x * FISICA.roceItem);
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
    marcarPeligros(this);
    actualizarFuego(this, time);
    actualizarRescate(this);
    if (this.conWrap) this.aplicarWrap();

    this.fantasmas.forEach(fantasma => fantasma.actualizar(this.objetivoDeFantasma(fantasma), delta));
    if (this.jefe && this.jefe.active) this.jefe.actualizar();
  }

  // El ninja muerto no cruza: sigue cayendo hasta salir de la pantalla y recién ahí pierde la vida
  aplicarWrap() {
    this.jugadores.filter(jugador => !jugador.muerto).forEach(wrapear);
    [this.items, this.enemigos, this.proyectiles, this.peligros, this.grupoRescate]
      .forEach(grupo => grupo && grupo.getChildren().forEach(wrapear));
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
      } else if (this.reglas.aparecenEnemigos) {
        this.timerDemonios.paused = false;
      }
    }
  }

  // ==========================================
  // ITEMS: TALISMANES Y MONEDAS
  // ==========================================
  procesarImpactoPiso(obj1, obj2) {
    const item = this.items.contains(obj1) ? obj1 : obj2;
    if (item.esTalisman) return;

    if (!item.yaRestoPuntosEsteRebote) {
      if (item.body.velocity.y < -10) {
        item.yaRestoPuntosEsteRebote = true;
        item.valorPuntos = Math.max(1, Math.floor(item.valorPuntos * CONFIG.CAIDA_VALOR_MONEDA));
        item.desgaste = (item.desgaste || 0) + 1;
        this.colorearItem(item);
      }
    }
  }

  // Una mina explota al tocarla; la bomba especial, además, sola después de un rato. No se van al pasar a la Cacería.
  // espera: cuándo explota sola (la bomba especial). alTocar: false para que solo explote sola (o con un proyectil).
  soltarPeligro(tipo, x = Phaser.Math.Between(32, 480), y = -8, { espera = CONFIG.ESPERA_BOMBA_ESPECIAL, alTocar = true } = {}) {
    const peligro = this.peligros.create(x, y, tipo);
    peligro.setBounce(0.3);
    peligro.body.setSize(12, 10).setOffset(2, 6);
    peligro.explotaAlTocar = alTocar;
    if (tipo === 'bomba-especial') {
      this.time.delayedCall(espera, () => this.detonarPeligro(peligro));
      this.tweens.add({ targets: peligro, scale: 1.15, duration: alTocar ? 250 : 120, yoyo: true, repeat: -1 });
    }
    return peligro;
  }

  detonarPeligro(peligro) {
    if (!peligro.active) return;
    const { x, y } = peligro;
    this.tweens.killTweensOf(peligro);
    peligro.destroy();
    this.explotar(x, y, { bando: BANDO.DEMONIOS });
  }

  // Doble salto nivel 2
  dejarPlataforma(ninja) {
    crearPlataformaFantasma(this, ninja.x, ninja.body.bottom + 1);
  }

  // Caída pesada nivel 2
  soltarBolasCelestes(ninja) {
    [-1, 1].forEach(direccion => crearBolaCeleste(this, ninja, ninja.x + direccion * 8, ninja.y - 4, direccion * 120, -160));
  }

  // Pergamino: el imán atrae los talismanes cercanos hacia quien lo tiene
  atraerConIman(item, delta) {
    this.jugadores.forEach(j => {
      if (!j.mods.iman || !j.active || j.muerto) return;
      const dx = j.x - item.x;
      const dy = j.y - item.y;
      const distancia = Math.hypot(dx, dy);
      if (distancia > CONFIG.RADIO_IMAN || distancia < 1) return;
      const fuerza = CONFIG.FUERZA_IMAN * delta / 1000;
      item.setVelocity(item.body.velocity.x + dx / distancia * fuerza, item.body.velocity.y + dy / distancia * fuerza);
    });
  }

  // Una moneda se resquebraja un cuadro de coin.png por cada rebote que le resta valor: usa todos los cuadros que tenga.
  // Mientras vuela empujada no se tiñe: lleva aura y estela (mundo/Peligros.js). Rojiza solo con el pergamino de monedas rojas.
  colorearItem(item) {
    if (!item.esTalisman) {
      const cuadros = this.textures.get('coin').frameTotal - 1;
      item.setFrame(Math.min(item.desgaste || 0, cuadros - 1));
    }
    if (item.lanzador) return;
    if (!item.esTalisman && this.modsGlobal.monedasRojas) {
      const colorGB = Math.floor(255 * Math.max(0, item.valorPuntos / item.valorInicial));
      item.setTint(Phaser.Display.Color.GetColor(255, colorGB, colorGB));
    } else {
      item.clearTint();
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

  // Pergaminos negativos: a veces cae una mina o una bomba especial en vez de la moneda
  spawnearMoneda({ conPeligros = true } = {}) {
    const g = this.modsGlobal;
    if (conPeligros && g.minas && Math.random() < CONFIG.PROB_MINA) return this.soltarPeligro('mina');
    if (conPeligros && g.bombasEspeciales && Math.random() < CONFIG.PROB_BOMBA_ESPECIAL) return this.soltarPeligro('bomba-especial');
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

  sumarPuntos(indice, puntos) {
    if (!puntos) return;
    this.partida.puntajes[indice] += puntos;
    this.events.emit(EVENTOS.PUNTAJE, this.partida.puntajes);
  }

  contarInventario() {
    const conteo = { cuadrado: 0, triangulo: 0, rombo: 0 };
    this.inventario.forEach(tipo => { conteo[tipo]++; });
    return conteo;
  }

  recolectarItem(jugador, item) {
    if (jugador.apareciendo || !item || !item.active) return;

    const esTalisman = item.esTalisman;
    if (esTalisman) {
      if (!this.reglas.hayTalismanes) return;
      const tipoItem = item.texture.key;
      this.inventario.push(tipoItem);
      const conteo = this.contarInventario();
      const cantidad = conteo[tipoItem];
      this.events.emit(EVENTOS.INVENTARIO, conteo);

      // Feedback: cuántos van de esa forma; los extras se ven en gris porque no hacen falta
      this.mostrarTextoFlotante(item.x, item.y, `${Math.min(cantidad, 3)}/3`, cantidad <= 3 ? '#FBBF24' : '#9CA3AF');
      this.efectoChispas(item.x, item.y, 0xfde047);
      Sonido.beep(this, 523 + Math.min(cantidad, 3) * 131, 0.1, 0.1, 'triangle');

      if (TIPOS_TALISMAN.every(tipo => conteo[tipo] >= 3)) {
        this.actualizarBrillo();
        item.destroy();
        this.finRecoleccion();
        return;
      }
    } else {
      // No suma ahora: se cobra al final del nivel, por el combo máximo (reglas/Combo.js)
      const combo = sumarMoneda(this, jugador.indice, item.valorPuntos);
      const colorTexto = item.valorPuntos >= item.valorInicial * 0.75 ? '#4ADE80' : (item.valorPuntos > item.valorInicial * 0.25 ? '#FBBF24' : '#EF4444');
      this.mostrarTextoFlotante(item.x, item.y, combo > 1 ? `X${combo}` : `+${item.valorPuntos}`, colorTexto);
      const tono = Math.pow(2, Math.min(combo - 1, 12) / 12);  // Cada moneda del combo suena un semitono más aguda
      Sonido.beep(this, 988 * tono, 0.06, 0.08);
      this.time.delayedCall(60, () => Sonido.beep(this, 1319 * tono, 0.1, 0.08));
    }

    item.destroy();
    if (this.reglas.hayTalismanes) this.spawnearMoneda();
    else this.reponerMoneda();
    if (esTalisman) this.actualizarBrillo();
  }

  // En la Cacería: cae una moneda si hay menos que el tope. Las minas y bombas especiales también tienen tope.
  reponerMoneda() {
    if (this.fase !== 'caceria') return;
    const monedas = this.items.getChildren().filter(item => item.active && !item.esTalisman).length;
    if (monedas >= CONFIG.TOPE_MONEDAS_CACERIA) return;
    this.spawnearMoneda({ conPeligros: this.peligros.countActive(true) < CONFIG.TOPE_MONEDAS_CACERIA });
  }

  // Al recibir un golpe en Recolección se caen todos los talismanes y desaparecen todas las monedas: quien se queda
  // juntando monedas para sumar puntos arriesga lo que ya juntó.
  // y vuelven a caer desde arriba un rato después.
  perderTalismanes(jugador) {
    if (this.inventario.length === 0) return;
    const arrayPerdidos = this.inventario.splice(0);
    this.events.emit(EVENTOS.INVENTARIO, this.contarInventario());
    this.actualizarBrillo();
    this.mostrarTextoFlotante(jugador.x, jugador.y - 12, i18n.t(arrayPerdidos.length > 1 ? 'perdiste_talismanes' : 'perdiste_talisman'), '#EF4444');

    arrayPerdidos.forEach(tipo => {
      let dummy = this.physics.add.sprite(jugador.x, jugador.y, tipo);
      dummy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-200, -350));
      this.tweens.add({
        targets: dummy, alpha: 0, duration: 800,
        onComplete: () => dummy.destroy()
      });
    });

    this.items.getChildren().filter(item => !item.esTalisman).forEach(moneda => moneda.destroy());

    this.time.delayedCall(1200, () => {
      arrayPerdidos.forEach((tipo, index) => {
        this.time.delayedCall(index * 250, () => {
          if (this.reglas.hayTalismanes) this.spawnearItem(tipo);
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
      if (!this.reglas.aparecenEnemigos) return null;
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
    this.brillar(demonio, !!this.reglas.brilloInmortal);
    if (this.modsGlobal.primerEnemigoEscudo && !this.primerEnemigoCreado) demonio.ponerEscudo();
    this.primerEnemigoCreado = true;
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
    if (!this.reglas.invocaAyudantes || this.enemigos.countActive(true) >= 2) return;
    this.crearEnemigo(clave);
  }

  emitirEnemigosRestantes() {
    this.events.emit(EVENTOS.ENEMIGOS_RESTANTES, this.enemigos.countActive(true) + this.enemigosPorAparecer);
  }

  // Brillo dorado en lo que no puede morir en esta fase. Sin WebGL no se dibuja, pero conBrillo queda igual.
  brillar(objeto, activo) {
    objeto.conBrillo = activo;
    objeto.intensidadBrillo = activo ? this.intensidadBrillo() : 0;
    if (!objeto.preFX) return;
    if (activo && !objeto.brillo) {
      objeto.preFX.setPadding(4);
      objeto.brillo = objeto.preFX.addGlow(COLORES.INMORTAL, 2 * objeto.intensidadBrillo, 0, false, 0.1, 6);
    } else if (!activo && objeto.brillo) {
      objeto.preFX.remove(objeto.brillo);
      objeto.brillo = null;
    }
  }

  // El brillo se apaga de a poco a medida que se juntan los talismanes que hacen falta (3 de cada forma)
  intensidadBrillo() {
    const conteo = this.contarInventario();
    const juntados = TIPOS_TALISMAN.reduce((suma, tipo) => suma + Math.min(conteo[tipo], 3), 0);
    return 1 - juntados / (TIPOS_TALISMAN.length * 3);
  }

  actualizarBrillo() {
    const intensidad = this.intensidadBrillo();
    [...this.jugadores, ...this.enemigos.getChildren()].forEach(objeto => {
      if (!objeto.conBrillo) return;
      objeto.intensidadBrillo = intensidad;
      if (objeto.brillo) objeto.brillo.outerStrength = 2 * intensidad;
    });
  }

  aplicarBrillo() {
    this.brilloActual = this.reglas.brilloInmortal;
    [...this.jugadores, ...this.enemigos.getChildren()].forEach(objeto => this.brillar(objeto, this.brilloActual));
  }

  // Boulder: lo que toca el ninja rodando recibe un golpe, una vez por rodada
  golpeRodando(jugador, objetivo) {
    if (jugador.rodarGolpeados.has(objetivo)) return;
    jugador.rodarGolpeados.add(objetivo);
    const lanza = jugador.habilidades.boulder >= 2;  // Nivel 2: sale disparado y golpea a los demás
    resolverGolpe(this, objetivo, crearGolpe('boulder', { duenio: jugador, direccion: jugador.direccionRodar, lanza }));
    this.hitStop(40);
  }

  tocarDemonio(jugador, demonio) {
    if (jugador.rodando) {
      if (!demonio.muerto && !demonio.intocable && this.reglas.jugable) this.golpeRodando(jugador, demonio);
      return;
    }
    if (jugador.proteccion === PROTECCION.INTOCABLE || demonio.muerto || demonio.intocable || !this.reglas.jugable) return;

    const desdeArriba = jugador.body.velocity.y > 0 && jugador.body.bottom <= demonio.body.top + 8;
    if (desdeArriba) {
      jugador.hacerPisoton();
      this.hitStop(50);
      Sonido.efecto(this, 'snd-grito', 0.25);
      resolverGolpe(this, demonio, crearGolpe('pisoton', { duenio: jugador }));
      if (jugador.mods.pisarEnfurece && !demonio.muerto) demonio.enfurecer(); // Pergamino negativo
      return;
    }

    if (demonio.aturdido) return; // Un demonio aturdido no hace daño
    resolverGolpe(this, jugador, crearGolpe('contacto', { bando: BANDO.DEMONIOS, fuenteX: demonio.x, autor: demonio }));
  }

  // Boulder nivel 2: el enemigo sale disparado como un proyectil del jugador. Al terminar, si la fase lo permite, muere.
  lanzarEnemigo(enemigo, golpe) {
    const { empujeNivel2, duracionLanzado } = CONFIG.BOULDER;
    enemigo.aturdir(Math.max(enemigo.config.duracionStun, duracionLanzado), (golpe.direccion ?? 1) * empujeNivel2.x, empujeNivel2.y);
    enemigo.lanzado = { duenio: golpe.duenio, fin: this.time.now + duracionLanzado, golpeados: new Set() };
  }

  choqueLanzado(a, b) {
    const [lanzado, otro] = a.lanzado ? [a, b] : [b, a];
    if (otro.muerto || otro.intocable || lanzado.lanzado.golpeados.has(otro)) return;
    lanzado.lanzado.golpeados.add(otro);
    const direccion = Math.sign(lanzado.body.velocity.x) || 1;
    resolverGolpe(this, otro, crearGolpe('proyectil', { duenio: lanzado.lanzado.duenio, direccion }));
  }

  terminarLanzamiento(enemigo, duenio) {
    if (this.reglas.enemigosVulnerables) this.matarEnemigo(enemigo, duenio);
  }

  matarEnemigo(enemigo, jugador) {
    if (enemigo.muerto) return;
    const sueltaBomba = enemigo.enfurecido && this.modsGlobal.explotanAlMorir; // Pergamino negativo
    const puntos = CONFIG.PUNTOS_BAJA * this.modsGlobal.multPuntos;
    if (jugador) {
      this.sumarPuntos(jugador.indice, puntos);
      this.mostrarTextoFlotante(enemigo.x, enemigo.y - 8, `+${puntos}`, '#4ADE80');
    }
    this.efectoExplosion(enemigo.x, enemigo.y, 10);
    Sonido.efecto(this, 'snd-grito', 0.3, { rate: 1.4 });
    this.ultimaBaja = { x: enemigo.x, y: enemigo.y };  // Para el golpe final
    enemigo.morir(jugador ? jugador.x : null);
    // Suelta una bomba que explota después de un rato, no al tocarla: hay tiempo para alejarse
    if (sueltaBomba) this.soltarPeligro('bomba-especial', enemigo.x, enemigo.y, { espera: CONFIG.ESPERA_BOMBA_FURIOSO, alTocar: false }).setVelocityY(-150);

    if (this.reglas.cuentaBajas) {
      this.emitirEnemigosRestantes();
      if (this.enemigos.countActive(true) === 0 && this.enemigosPorAparecer <= 0) this.finCaceria();
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

    const golpe = crearGolpe('katana', { duenio: ninja, direccion, origen: ninja, arriba: !!ninja.katanaArriba });
    const alcanzar = (objeto, accion = () => resolverGolpe(this, objeto, golpe)) => {
      if (!objeto || !objeto.active || ninja.katanaGolpeados.has(objeto)) return;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(zona, objeto.getBounds())) return;
      ninja.katanaGolpeados.add(objeto);
      accion();
    };

    this.enemigos.getChildren().slice().forEach(enemigo => alcanzar(enemigo));
    this.items.getChildren().forEach(item => alcanzar(item));
    // Rescate: la llave suelta y la jaula se alejan del centro del ninja, como los ítems
    objetosSueltos(this).forEach(objeto => alcanzar(objeto, () => {
      const { fuerza, subidaMinima } = FISICA.empujeItem;
      const angulo = Math.atan2(objeto.y - ninja.y, objeto.x - ninja.x);
      objeto.setVelocity(Math.cos(angulo) * fuerza, Math.min(subidaMinima, Math.sin(angulo) * fuerza));
    }));
    this.proyectilesDe(BANDO.DEMONIOS).forEach(p => {
      // Pergamino: el parry alcanza a todo lo que esté alrededor del ninja, no solo delante
      const cerca = ninja.mods.parry360 && Phaser.Math.Distance.Between(ninja.x, ninja.y, p.x, p.y) <= FISICA.radioParry360;
      if (cerca && !ninja.katanaGolpeados.has(p)) {
        ninja.katanaGolpeados.add(p);
        this.pararProyectil(ninja, p);
      } else {
        alcanzar(p, () => this.pararProyectil(ninja, p));
      }
    });
    this.jugadores.forEach(otro => {
      if (otro !== ninja && !otro.eliminado) alcanzar(otro);
    });
    if (this.jefe && this.jefe.active) alcanzar(this.jefe);
  }

  // Parry: el proyectil enemigo se rompe
  pararProyectil(ninja, p) {
    Sonido.efecto(this, 'snd-parry', 0.5);
    this.efectoChispas(p.x, p.y, 0xffffff);
    p.destroy();
    // Pergamino: el parry a veces da un tiro más por este nivel
    if (ninja.mods.parryRecarga && ninja.arma && Math.random() < CONFIG.PROB_PARRY_RECARGA) {
      ninja.municion++;
      this.events.emit(EVENTOS.ARMA, ninja.indice, ninja.arma, ninja.municion);
    }
  }

  proyectilesDe(bando) {
    return this.proyectiles.getChildren().filter(p => p.bando === bando);
  }

  // El objetivo es un enemigo o el jefe
  impactoProyectil(proyectil, objetivo) {
    if (!proyectil.active || objetivo.muerto || objetivo.intocable || proyectil.golpeados.has(objetivo)) return;
    proyectil.golpeados.add(objetivo);
    if (proyectil.tipo === 'bomba') {
      this.explotarBomba(proyectil);
      return;
    }
    const direccion = Math.sign(proyectil.body.velocity.x) || 1;
    resolverGolpe(this, objetivo, crearGolpe('proyectil', { duenio: proyectil.duenio, direccion }));
    if (proyectil.tipo === 'shuriken') proyectil.destroy();
  }

  explotarBomba(bomba) {
    if (!bomba.active) return;
    const { x, y } = bomba;
    bomba.destroy();
    this.explotar(x, y, { duenio: bomba.duenio, bando: BANDO.JUGADORES });
  }

  // Empuja todo lo cercano. La de un jugador aturde o mata demonios; la de los demonios golpea a los jugadores.
  explotar(x, y, { duenio = null, bando }) {

    this.efectoExplosion(x, y, 24);
    Sonido.ruido(this, 0.4, 0.4);
    this.cameras.main.shake(200, 0.01);

    const { radio, impulso: fuerza, impulsoMinimo } = ARMAS.bomba;
    const impulso = (objeto) => {
      const distancia = Phaser.Math.Distance.Between(x, y, objeto.x, objeto.y);
      if (distancia > radio) return null;
      const angulo = Math.atan2(objeto.y - y, objeto.x - x);
      return { vx: Math.cos(angulo) * fuerza, vy: Math.min(impulsoMinimo, Math.sin(angulo) * fuerza) };
    };

    const golpeA = (objeto, empuje) => {
      if (empuje) resolverGolpe(this, objeto, crearGolpe('explosion', { duenio, bando, empuje, fuenteX: x }));
    };
    this.enemigos.getChildren().slice().forEach(enemigo => golpeA(enemigo, impulso(enemigo)));
    this.items.getChildren().forEach(item => golpeA(item, impulso(item)));
    objetosSueltos(this).forEach(objeto => {
      const empuje = impulso(objeto);
      if (empuje) objeto.setVelocity(empuje.vx, empuje.vy);
    });
    this.jugadores.forEach(jugador => golpeA(jugador, impulso(jugador)));
    if (bando === BANDO.JUGADORES && this.jefe && this.jefe.active && Phaser.Math.Distance.Between(x, y, this.jefe.x, this.jefe.y) < radio + 16) {
      resolverGolpe(this, this.jefe, crearGolpe('explosion', { duenio }));
    }
  }

  dispararProyectilEnemigo(x, y, vx, vy, { gravedad = false, textura = 'proyectil', gravedadY = 200 } = {}) {
    if (!this.esFaseJugable()) return null;
    const proyectil = this.proyectiles.create(x, y, textura);
    proyectil.bando = BANDO.DEMONIOS;
    proyectil.body.setAllowGravity(gravedad);
    if (gravedad) proyectil.body.setGravityY(gravedadY);
    proyectil.body.setCircle(3, (proyectil.width - 6) / 2, (proyectil.height - 6) / 2);
    proyectil.setVelocity(vx, vy);
    proyectil.atraviesaBloques = false;
    proyectil.nacimiento = this.time.now;
    proyectil.rebotesRestantes = this.modsGlobal.rebotesEnemigos;
    proyectil.setBounce(1);
    return proyectil;
  }

  crearOnda(x, yPiso, vx) {
    const onda = this.proyectiles.create(x, yPiso - 5, 'onda');
    onda.bando = BANDO.DEMONIOS;
    onda.setVelocity(vx, 0);
    onda.setFlipX(vx < 0);
    onda.atraviesaBloques = true;
    onda.nacimiento = this.time.now;
    return onda;
  }

  // Pergaminos: pisarla con "trampas en piedra" la apaga; si no, golpea y quizás se extiende
  tocarTrampa(jugador, bloque) {
    if (jugador.mods.trampaPiedra) {
      cambiarTile(this, bloque.col, bloque.fila, LOGICA.SOLIDO, TILES.PIEDRA);
      this.efectoChispas(bloque.x, bloque.y, 0x9ca3af);
      return;
    }
    this.golpearConTile(jugador, 'trampa', bloque.x);
    if (this.modsGlobal.trampaSeExtiende) extenderTrampa(this, bloque);
  }

  // Pergaminos: los proyectiles enemigos pueden rebotar, y al romperse dejar una bola de fuego
  chocarProyectilEnemigo(proyectil) {
    const { x, y } = proyectil;
    chocarProyectil(this, proyectil);
    if (!proyectil.active && this.modsGlobal.proyectilDejaBola && !proyectil.atraviesaBloques) crearBola(this, x, y - 4, 0, -80);
  }

  golpearConTile(jugador, tipo, fuenteX) {
    resolverGolpe(this, jugador, crearGolpe(tipo, { bando: BANDO.DEMONIOS, fuenteX }));
  }

  golpeDeProyectil(proyectil) {
    return crearGolpe('proyectil', { bando: proyectil.bando, duenio: proyectil.duenio, fuenteX: proyectil.x, autor: proyectil.autor });
  }

  // Los de los demonios siempre. Los de un jugador, si un modificador lo permite y ya se alejaron de quien los tiró.
  proyectilGolpea(proyectil, jugador) {
    if (proyectil.bando === BANDO.DEMONIOS) return true;
    const reciente = this.time.now - proyectil.nacimiento < 150;
    return !reciente && golpeaAliado(this, this.golpeDeProyectil(proyectil), jugador);
  }

  impactoProyectilEnemigo(jugador, proyectil) {
    if (!proyectil.active) return;
    // Dash nivel 2: durante el dash los proyectiles enemigos se paran como con la katana
    if (proyectil.bando === BANDO.DEMONIOS && jugador.estado === ESTADO.DASH && jugador.habilidades.dash >= 2) {
      this.pararProyectil(jugador, proyectil);
      return;
    }
    if (this.pisarProyectil(jugador, proyectil)) return;
    if (jugador.proteccion === PROTECCION.INTOCABLE) return;
    if (!proyectil.atraviesaBloques) proyectil.destroy();
    resolverGolpe(this, jugador, this.golpeDeProyectil(proyectil));
  }

  // Cayendo sobre un proyectil y apretando saltar justo antes, el ninja rebota encima y el proyectil se rompe.
  // No es automático: sin el salto a tiempo, golpea. Vale para cualquiera que lo dañaría (también un ítem lanzado).
  pisarProyectil(jugador, proyectil) {
    const { activa, ventana } = CONFIG.PISAR_PROYECTIL;
    if (!activa || jugador.body.velocity.y <= 0 || !this.reglas.jugable) return false;
    if (jugador.body.bottom > proyectil.body.top + 6) return false;
    if (this.time.now - jugador.ultimoSalto > ventana) return false;
    jugador.ultimoSalto = -9999;
    jugador.hacerPisoton();
    this.efectoChispas(proyectil.x, proyectil.y, 0xffffff);
    Sonido.efecto(this, 'snd-parry', 0.4, { rate: 1.3 });
    if (proyectil.esTalisman !== undefined) proyectil.lanzador = null;  // Un ítem pisado deja de ser proyectil
    else if (!proyectil.atraviesaBloques) proyectil.destroy();
    return true;
  }

  // Un ítem lanzado golpea una sola vez a cada objetivo y sigue su camino: no se rompe, porque hay que poder juntarlo
  impactoItem(item, objetivo) {
    if (objetivo.muerto || objetivo.intocable || item.golpeados.has(objetivo)) return;
    item.golpeados.add(objetivo);
    const golpe = crearGolpe('proyectil', {
      duenio: item.lanzador, direccion: Math.sign(item.body.velocity.x) || 1, fuenteX: item.x
    });
    resolverGolpe(this, objetivo, golpe);
  }

  // Normalmente se junta. Lanzado por el otro con fuego amigo, o por uno mismo con daño propio, primero golpea.
  tocarItem(jugador, item) {
    if (itemLanzado(item)) {
      const golpe = crearGolpe('proyectil', { duenio: item.lanzador, fuenteX: item.x });
      if (golpeaAliado(this, golpe, jugador)) {
        if (this.pisarProyectil(jugador, item)) return;
        this.impactoItem(item, jugador);
        return;
      }
    }
    this.recolectarItem(jugador, item);
  }

  tocarJefe(jugador, jefe) {
    if (jugador.rodando) {
      if (!jefe.muerto && this.reglas.enemigosVulnerables) this.golpeRodando(jugador, jefe);
      return;
    }
    if (jugador.proteccion === PROTECCION.INTOCABLE || jefe.muerto || !this.reglas.enemigosVulnerables) return;
    const desdeArriba = jugador.body.velocity.y > 0 && jugador.body.bottom <= jefe.body.top + 10;
    if (desdeArriba) {
      jugador.hacerPisoton();
      resolverGolpe(this, jefe, crearGolpe('pisoton', { duenio: jugador }));
      this.hitStop(60);
      return;
    }
    resolverGolpe(this, jugador, crearGolpe('contacto', { bando: BANDO.DEMONIOS, fuenteX: jefe.x }));
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
    const flotante = this.add.text(x, y, texto, estilo(8, color)).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: flotante, y: y - 25, alpha: 0, duration: 600, ease: 'Power1',
      onComplete: () => flotante.destroy()
    });
  }
}

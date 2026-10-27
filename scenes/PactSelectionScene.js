import { i18n } from '../i18n.js';
import { PAD } from '../config.js';
import { PACTOS, aplicarPacto } from './Pactos.js';
import { esNivelJefe } from './Partida.js';
import { Sonido } from './Sonido.js';

const TIEMPO_ELECCION = 8;
const POSICIONES_X = [128, 256, 384];

// Pergaminos de Pacto (GDD §8): una mano oscila sobre tres pergaminos y cada jugador fija el que tiene
// debajo al apretar. Si se acaba el tiempo, se queda con el que esté señalando en ese instante.
// En cooperativo, el primero que aprieta se lo lleva y el otro elige entre los que quedan.
export default class PactSelectionScene extends Phaser.Scene {
  constructor() {
    super("PactSelectionScene");
  }

  create() {
    this.partida = this.registry.get('partida');
    this.cantidadJugadores = this.partida.jugadores;
    this.elecciones = [null, null];
    this.reclamados = {};
    this.terminado = false;
    this.listo = false;
    this.prevPad = {};

    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);
    this.add.text(256, 22, i18n.t('pacto_titulo'), {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#FBBF24', resolution: 10
    }).setOrigin(0.5);
    const proximo = esNivelJefe(this.partida.nivel) ? i18n.t('pacto_proximo_jefe') : `${i18n.t('pacto_proximo')} ${this.partida.nivel}`;
    this.add.text(256, 40, proximo, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#9CA3AF', resolution: 10
    }).setOrigin(0.5);

    this.opciones = Phaser.Utils.Array.Shuffle([...PACTOS]).slice(0, 3);
    this.pergaminos = this.opciones.map((pacto, i) => {
      const x = POSICIONES_X[i];
      const imagen = this.add.image(x, 96, 'pergamino').setScale(2);
      const texto = (clave, y, color) => this.add.text(x, y, i18n.t(clave), {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color, align: 'center', lineSpacing: 4,
        wordWrap: { width: 116 }, resolution: 10
      }).setOrigin(0.5, 0);
      texto(`pacto_${pacto.id}`, 138, '#FBBF24');
      texto(`pacto_${pacto.id}_pro`, 156, '#4ADE80');
      texto(`pacto_${pacto.id}_contra`, 202, '#EF4444');
      const etiqueta = this.add.text(x, 52, '', {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FFFFFF', resolution: 10
      }).setOrigin(0.5);
      return { imagen, etiqueta };
    });

    this.mano = this.add.image(POSICIONES_X[0] - 32, 254, 'mano').setScale(2);
    this.tweenMano = this.tweens.add({
      targets: this.mano, x: POSICIONES_X[2] + 32, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut'
    });

    this.tiempo = TIEMPO_ELECCION;
    this.textoTiempo = this.add.text(256, 278, this.textoAviso(), {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FFFFFF', resolution: 10
    }).setOrigin(0.5);
    this.reloj = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        this.tiempo--;
        this.textoTiempo.setText(this.textoAviso());
        if (this.tiempo <= 3 && this.tiempo > 0) Sonido.beep(this, 784, 0.06, 0.08);
        if (this.tiempo <= 0) this.finalizar();
      }
    });

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.teclasJ1 = [K.ENTER, K.SPACE, K.X, K.UP].map(k => this.input.keyboard.addKey(k));
    this.teclasJ2 = [K.J, K.W].map(k => this.input.keyboard.addKey(k));

    // Pequeña espera para que el botón con el que se cerró el nivel no elija sin querer
    this.time.delayedCall(500, () => { this.listo = true; });
  }

  textoAviso() {
    const quien = this.cantidadJugadores === 2 ? i18n.t('pacto_aviso_coop') : i18n.t('pacto_aviso');
    return `${quien}  ${Math.max(0, this.tiempo)}`;
  }

  padApretado(indicePad) {
    const gamepad = this.input.gamepad;
    if (indicePad === undefined || indicePad === null || !gamepad || gamepad.total === 0) return false;
    const pad = gamepad.getPad(indicePad);
    const ahora = !!(pad && pad.buttons[PAD.A] && pad.buttons[PAD.A].pressed);
    const antes = this.prevPad[indicePad];
    this.prevPad[indicePad] = ahora;
    return ahora && !antes;
  }

  update() {
    if (this.terminado) return;
    const padJ1 = this.padApretado(this.registry.get('padIndexP1'));
    const padJ2 = this.padApretado(this.registry.get('padIndexP2'));
    if (!this.listo) return;

    const teclaJ1 = this.teclasJ1.some(t => Phaser.Input.Keyboard.JustDown(t));
    const teclaJ2 = this.teclasJ2.some(t => Phaser.Input.Keyboard.JustDown(t));

    if (this.cantidadJugadores === 1) {
      if (teclaJ1 || teclaJ2 || padJ1 || padJ2) this.reclamar(0);
    } else {
      if (teclaJ1 || padJ1) this.reclamar(0);
      if (teclaJ2 || padJ2) this.reclamar(1);
    }
  }

  indiceBajoCursor() {
    let mejor = 0;
    POSICIONES_X.forEach((x, i) => {
      if (Math.abs(x - this.mano.x) < Math.abs(POSICIONES_X[mejor] - this.mano.x)) mejor = i;
    });
    return mejor;
  }

  // El pergamino libre más cercano a la mano (para la selección forzada)
  indiceLibreMasCercano() {
    const libres = [0, 1, 2].filter(i => this.reclamados[i] === undefined);
    libres.sort((a, b) => Math.abs(POSICIONES_X[a] - this.mano.x) - Math.abs(POSICIONES_X[b] - this.mano.x));
    return libres[0];
  }

  reclamar(jugador, forzado = false) {
    if (this.elecciones[jugador] !== null) return;
    const indice = forzado ? this.indiceLibreMasCercano() : this.indiceBajoCursor();
    if (this.reclamados[indice] !== undefined) {
      Sonido.beep(this, 140, 0.1, 0.1);
      return;
    }

    this.elecciones[jugador] = indice;
    this.reclamados[indice] = jugador;
    const { imagen, etiqueta } = this.pergaminos[indice];
    etiqueta.setText(`J${jugador + 1}`).setColor(jugador === 0 ? '#FFFFFF' : '#86EFAC');
    imagen.setTint(jugador === 0 ? 0xfff2b3 : 0xb3ffcc);
    this.tweens.add({ targets: imagen, scale: { from: 2.6, to: 2 }, duration: 250, ease: 'Back.Out' });
    Sonido.efecto(this, 'snd-parry', 0.4);

    const todosEligieron = this.elecciones.slice(0, this.cantidadJugadores).every(e => e !== null);
    if (todosEligieron && !this.terminado) this.finalizar();
  }

  finalizar() {
    if (this.terminado) return;
    this.terminado = true;
    this.reloj.remove();
    this.tweenMano.stop();

    for (let j = 0; j < this.cantidadJugadores; j++) {
      if (this.elecciones[j] === null) this.reclamar(j, true);
    }
    this.elecciones.slice(0, this.cantidadJugadores).forEach((indice, j) => {
      aplicarPacto(this.partida.pactos, this.opciones[indice], j);
    });

    this.textoTiempo.setText(i18n.t('pacto_sellado')).setColor('#FBBF24');
    this.time.delayedCall(1500, () => this.scene.start('NinjaMonchoScene'));
  }
}

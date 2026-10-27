import { i18n } from '../i18n.js';
import MenuInputManager from './MenuInputManager.js';
import { nuevaPartida } from './Partida.js';
import { Sonido } from './Sonido.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);
    this.add.image(256, 144, 'fondo-cielo').setDisplaySize(512, 288).setAlpha(0.25);

    // Logo (provisorio, en texto) con los dos ninjas a los costados
    const titulo = this.add.text(256, 52, 'NINJA MONCHO', {
      fontFamily: '"Press Start 2P"', fontSize: '24px', color: '#FFFFFF', resolution: 10
    }).setOrigin(0.5).setShadow(3, 3, '#B91C1C', 0, false, true);
    this.add.text(372, 78, 'PLUS', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#EF4444', resolution: 10
    }).setOrigin(0.5).setShadow(2, 2, '#000000', 0, false, true);
    this.tweens.add({ targets: titulo, y: 48, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const moncho = this.add.sprite(88, 56, 'ninja').setScale(2).play('moncho-caminar');
    const coop = this.add.sprite(424, 56, 'ninja_coop').setScale(2).setFlipX(true).play('coop-caminar');
    this.tweens.add({ targets: [moncho, coop], y: 46, duration: 500, yoyo: true, repeat: -1, ease: 'Quad.Out' });

    this.opciones = [
      { texto: i18n.t('menu_1p'), accion: () => this.iniciarJuego(1) },
      { texto: i18n.t('menu_2p'), accion: () => this.iniciarJuego(2) },
      { texto: i18n.t('menu_como_jugar'), accion: () => this.scene.start('HowToPlayScene') },
      { texto: i18n.t('menu_opciones'), accion: () => this.scene.start('OptionsScene') },
      { texto: i18n.t('menu_creditos'), accion: () => this.scene.start('CreditsScene') }
    ];

    this.textosOpciones = [];
    this.indiceSeleccionado = 0;

    this.startX = 196;
    this.startY = 124;
    this.espaciado = 24;

    this.opciones.forEach((opcion, index) => {
      const txt = this.add.text(this.startX, this.startY + (index * this.espaciado), opcion.texto, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#FFFFFF',
        resolution: 10
      }).setOrigin(0, 0.5);

      this.textosOpciones.push(txt);
    });

    this.cursor = this.add.text(this.startX - 20, this.startY, ">", {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FBBF24',
      resolution: 10
    }).setOrigin(0.5);
    this.resaltarOpcion();

    const record = this.registry.get('record') || 0;
    this.add.text(256, 262, `${i18n.t('record')}: ${record}`, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#9CA3AF', resolution: 10
    }).setOrigin(0.5);

    // INSTANCIAMOS EL MÓDULO DE INPUT GLOBAL
    this.menuInput = new MenuInputManager(this);
  }

  // AHORA USAMOS EL UPDATE PARA LEER LOS CONTROLES
  update() {
    const input = this.menuInput.obtenerInput();

    if (input.up) {
      this.moverCursor(-1);
    }
    if (input.down) {
      this.moverCursor(1);
    }
    if (input.confirm) {
      this.seleccionarOpcion();
    }
  }

  moverCursor(direccion) {
    this.indiceSeleccionado += direccion;
    if (this.indiceSeleccionado < 0) this.indiceSeleccionado = this.opciones.length - 1;
    else if (this.indiceSeleccionado >= this.opciones.length) this.indiceSeleccionado = 0;
    this.cursor.y = this.startY + (this.indiceSeleccionado * this.espaciado);
    this.resaltarOpcion();
    Sonido.beep(this, 440, 0.04, 0.06);
  }

  resaltarOpcion() {
    this.textosOpciones.forEach((txt, i) => txt.setColor(i === this.indiceSeleccionado ? '#FBBF24' : '#FFFFFF'));
  }

  seleccionarOpcion() {
    Sonido.beep(this, 880, 0.06, 0.08);
    this.opciones[this.indiceSeleccionado].accion();
  }

  iniciarJuego(cantidadJugadores) {
    this.registry.set('partida', nuevaPartida(cantidadJugadores));
    this.scene.start('NinjaMonchoScene');
  }
}

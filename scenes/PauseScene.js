import { i18n } from '../i18n.js';
import MenuInputManager, { barraVolumen } from './MenuInputManager.js';
import { Sonido } from './Sonido.js';

// Menú de pausa encima del juego (ESC / START): continuar, volúmenes y salir al título.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000, 0.7).setOrigin(0, 0);
    this.add.text(256, 70, i18n.t('pausa'), {
      fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#FBBF24', resolution: 10
    }).setOrigin(0.5);

    this.opciones = [
      { getTexto: () => i18n.t('continuar_juego'), accion: () => this.continuar(), modificar: () => {} },
      { getTexto: () => barraVolumen(i18n.t('opcion_musica'), this.registry.get('volMusica')), accion: () => {}, modificar: (dir) => Sonido.cambiarVolumen(this, 'volMusica', dir) },
      { getTexto: () => barraVolumen(i18n.t('opcion_sonido'), this.registry.get('volSonido')), accion: () => {}, modificar: (dir) => Sonido.cambiarVolumen(this, 'volSonido', dir) },
      { getTexto: () => i18n.t('salir_menu'), accion: () => this.salir(), modificar: () => {} }
    ];

    this.textos = this.opciones.map((opcion, i) => this.add.text(150, 120 + i * 26, opcion.getTexto(), {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FFFFFF', resolution: 10
    }).setOrigin(0, 0.5));
    this.cursor = this.add.text(134, 120, '>', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FBBF24', resolution: 10
    }).setOrigin(0.5);
    this.indice = 0;

    this.menuInput = new MenuInputManager(this);
  }

  update() {
    const input = this.menuInput.obtenerInput();
    if (input.up || input.down) {
      this.indice = (this.indice + (input.up ? -1 : 1) + this.opciones.length) % this.opciones.length;
      this.cursor.y = 120 + this.indice * 26;
    }
    if (input.left || input.right) {
      this.opciones[this.indice].modificar(input.left ? -1 : 1);
      this.textos.forEach((txt, i) => txt.setText(this.opciones[i].getTexto()));
    }
    if (input.confirm) this.opciones[this.indice].accion();
    if (input.cancel) this.continuar();
  }

  continuar() {
    this.scene.stop();
    this.scene.resume('UIScene');
    this.scene.resume('NinjaMonchoScene');
  }

  salir() {
    Sonido.detenerMusica();
    this.scene.stop('UIScene');
    this.scene.stop('NinjaMonchoScene');
    this.scene.start('TitleScene');
  }
}

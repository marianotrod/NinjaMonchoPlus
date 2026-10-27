import { i18n } from '../i18n.js';
import MenuInputManager from './MenuInputManager.js';

export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super("CreditsScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);

    this.add.text(256, 40, i18n.t('menu_creditos'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#4ADE80',
      resolution: 10
    }).setOrigin(0.5);

    const creditosTexto = [
      i18n.t('credito_musica'),
      "Ninja Kid 2 · UPL 1987",
      "",
      i18n.t('credito_graficos'),
      "Ninja Kid 2 · UPL 1987 · Mariano Trod",
      "",
      i18n.t('credito_diseno'),
      "Mariano Trod · Santiago Tornau",
      "",
      i18n.t('credito_programacion'),
      "Gemini · Claude · Mariano Trod · Santiago Tornau"
    ];

    this.add.text(256, 145, creditosTexto, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: 6,
      resolution: 10
    }).setOrigin(0.5);

    this.add.text(256, 250, `> ${i18n.t('volver')} <`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FBBF24',
      resolution: 10
    }).setOrigin(0.5);

    // INSTANCIAMOS EL MÓDULO DE INPUT GLOBAL
    this.menuInput = new MenuInputManager(this);
  }

  update() {
    const input = this.menuInput.obtenerInput();

    // Si acepta o cancela, vuelve atrás
    if (input.confirm || input.cancel) {
      this.scene.start('TitleScene');
    }
  }
}
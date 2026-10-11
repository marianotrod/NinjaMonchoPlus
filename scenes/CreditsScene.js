import { i18n } from '../i18n.js';

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
      "DISEÑO Y PROGRAMACIÓN",
      "Mariano",
      "",
      "ARTE Y ANIMACIÓN",
      "Mariano",
      "",
      "MÚSICA Y SFX",
      "Mariano"
    ];

    this.add.text(256, 130, creditosTexto, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: 8,
      resolution: 10
    }).setOrigin(0.5);

    this.add.text(256, 250, `> ${i18n.t('volver')} <`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FBBF24',
      resolution: 10
    }).setOrigin(0.5);

    this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.teclaEspacio.on('down', () => {
      this.input.keyboard.removeAllKeys();
      this.scene.start('TitleScene');
    });
  }
}
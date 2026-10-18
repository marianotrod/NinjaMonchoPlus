import { i18n } from '../i18n.js';
import MenuInputManager from './MenuInputManager.js'; // Ajustá la ruta según tu carpeta

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);

    // Placeholder centrado en 256
    this.add.rectangle(256, 60, 250, 60, 0x333333).setOrigin(0.5);
    this.add.text(256, 60, "LOGO PIXEL ART AQUI", {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      resolution: 10
    }).setOrigin(0.5);

    this.opciones = [
      { texto: i18n.t('menu_1p'), accion: () => this.iniciarJuego(1) },
      { texto: i18n.t('menu_2p'), accion: () => this.iniciarJuego(2) },
      { texto: i18n.t('menu_opciones'), accion: () => this.abrirOpciones() },
      { texto: i18n.t('menu_creditos'), accion: () => this.scene.start('CreditsScene') }
    ];

    this.textosOpciones = [];
    this.indiceSeleccionado = 0;

    const startX = 212; 
    const startY = 140;
    const espaciado = 30;

    this.opciones.forEach((opcion, index) => {
      const txt = this.add.text(startX, startY + (index * espaciado), opcion.texto, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#FFFFFF',
        resolution: 10
      }).setOrigin(0, 0.5); 
      
      this.textosOpciones.push(txt);
    });

    this.cursor = this.add.text(startX - 20, startY, ">", {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FBBF24',
      resolution: 10
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
    this.cursor.y = 140 + (this.indiceSeleccionado * 30);
  }

  seleccionarOpcion() {
    this.opciones[this.indiceSeleccionado].accion();
  }

  iniciarJuego(cantidadJugadores) {
    this.scene.start('NinjaMonchoScene', { jugadores: cantidadJugadores });
  }

  abrirOpciones() {
    this.scene.start('OptionsScene');
  }
}
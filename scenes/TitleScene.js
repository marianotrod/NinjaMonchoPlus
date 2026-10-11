import { i18n } from '../i18n.js';

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

    // Cálculo para centrar el bloque: (512 - 88) / 2 = 212
    const startX = 212; 
    const startY = 140;
    const espaciado = 30;

    this.opciones.forEach((opcion, index) => {
      const txt = this.add.text(startX, startY + (index * espaciado), opcion.texto, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#FFFFFF',
        resolution: 10
      }).setOrigin(0, 0.5); // Alineación izquierda
      
      this.textosOpciones.push(txt);
    });

    // El cursor va un poco más a la izquierda del bloque
    this.cursor = this.add.text(startX - 20, startY, ">", {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FBBF24',
      resolution: 10
    }).setOrigin(0.5);

    this.teclado = this.input.keyboard.createCursorKeys();
    this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    this.teclado.up.on('down', () => this.moverCursor(-1));
    this.teclado.down.on('down', () => this.moverCursor(1));
    this.teclaEspacio.on('down', () => this.seleccionarOpcion());
  }

  moverCursor(direccion) {
    this.indiceSeleccionado += direccion;
    if (this.indiceSeleccionado < 0) this.indiceSeleccionado = this.opciones.length - 1;
    else if (this.indiceSeleccionado >= this.opciones.length) this.indiceSeleccionado = 0;
    this.cursor.y = 140 + (this.indiceSeleccionado * 30);
  }

  seleccionarOpcion() {
    this.input.keyboard.removeAllKeys();
    this.opciones[this.indiceSeleccionado].accion();
  }

  iniciarJuego(cantidadJugadores) {
    this.scene.start('NinjaMonchoScene', { jugadores: cantidadJugadores });
  }

  abrirOpciones() {
    this.scene.start('OptionsScene');
  }
}
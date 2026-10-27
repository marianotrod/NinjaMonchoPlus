import { i18n } from '../i18n.js';
import MenuInputManager, { barraVolumen } from './MenuInputManager.js'; // Importamos el gestor unificado
import { Sonido } from './Sonido.js';
import { Guardado } from './Guardado.js';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super("OptionsScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);

    this.add.text(256, 40, i18n.t('menu_opciones'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#4ADE80',
      resolution: 10
    }).setOrigin(0.5);

    if (this.registry.get('volMusica') === undefined) this.registry.set('volMusica', 5);
    if (this.registry.get('volSonido') === undefined) this.registry.set('volSonido', 5);

    this.opciones = [
      {
        getTexto: () => `${i18n.t('opcion_idioma').padEnd(10, ' ')} < ${i18n.getIdioma().toUpperCase().padEnd(10, ' ')} >`,
        accion: () => this.cambiarIdioma(),
        modificar: () => this.cambiarIdioma()
      },
      {
        getTexto: () => barraVolumen(i18n.t('opcion_musica'), this.registry.get('volMusica')),
        accion: () => {},
        modificar: (dir) => Sonido.cambiarVolumen(this, 'volMusica', dir)
      },
      {
        getTexto: () => barraVolumen(i18n.t('opcion_sonido'), this.registry.get('volSonido')),
        accion: () => Sonido.beep(this, 660, 0.08, 0.12),
        modificar: (dir) => Sonido.cambiarVolumen(this, 'volSonido', dir)
      },
      {
        getTexto: () => i18n.t('volver'),
        accion: () => this.volver(),
        modificar: () => {}
      }
    ];

    this.textosOpciones = [];
    this.indiceSeleccionado = 0;

    const startX = 160;
    const startY = 110;
    const espaciado = 30;

    this.opciones.forEach((opcion, index) => {
      const txt = this.add.text(startX, startY + (index * espaciado), opcion.getTexto(), {
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

    // Música de fondo para poder escuchar el volumen mientras se ajusta
    Sonido.musica(this, 'musica-fondo', 0.4);

    // INSTANCIAMOS EL MÓDULO DE INPUT GLOBAL
    this.menuInput = new MenuInputManager(this);
  }

  // REEMPLAZAMOS LOS EVENTOS POR EL BUCLE UPDATE CON EL GESTOR
  update() {
    const input = this.menuInput.obtenerInput();

    if (input.up) {
      this.moverCursor(-1);
    }
    if (input.down) {
      this.moverCursor(1);
    }
    if (input.left) {
      this.opciones[this.indiceSeleccionado].modificar(-1);
      this.actualizarTextos();
    }
    if (input.right) {
      this.opciones[this.indiceSeleccionado].modificar(1);
      this.actualizarTextos();
    }
    if (input.confirm) {
      this.opciones[this.indiceSeleccionado].accion();
    }
    if (input.cancel) {
      this.volver(); // Salir rápidamente con B o Esc
    }
  }

  moverCursor(direccion) {
    this.indiceSeleccionado += direccion;
    if (this.indiceSeleccionado < 0) this.indiceSeleccionado = this.opciones.length - 1;
    else if (this.indiceSeleccionado >= this.opciones.length) this.indiceSeleccionado = 0;
    this.cursor.y = 110 + (this.indiceSeleccionado * 30);
  }

  cambiarIdioma() {
    i18n.alternarIdioma();
    Guardado.escribir('idioma', i18n.getIdioma());
    this.scene.restart();
  }

  actualizarTextos() {
    this.textosOpciones.forEach((txt, index) => {
      txt.setText(this.opciones[index].getTexto());
    });
  }

  volver() {
    Sonido.detenerMusica();
    this.scene.start('TitleScene');
  }
}

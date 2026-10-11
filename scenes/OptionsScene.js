import { i18n } from '../i18n.js';

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
    }).setOrigin(0.5); // Título principal centrado

    if (this.registry.get('volMusica') === undefined) this.registry.set('volMusica', 5);
    if (this.registry.get('volSonido') === undefined) this.registry.set('volSonido', 5);

    this.opciones = [
      { 
        getTexto: () => `${i18n.t('opcion_idioma').padEnd(10, ' ')} < ${i18n.getIdioma().toUpperCase().padEnd(10, ' ')} >`, 
        accion: () => this.cambiarIdioma(),
        modificar: () => this.cambiarIdioma() 
      },
      { 
        getTexto: () => this.generarBarraTexto(i18n.t('opcion_musica'), this.registry.get('volMusica')), 
        accion: () => {}, 
        modificar: (dir) => this.cambiarVolumen('volMusica', dir) 
      },
      { 
        getTexto: () => this.generarBarraTexto(i18n.t('opcion_sonido'), this.registry.get('volSonido')), 
        accion: () => { console.log("Sonido de prueba boop!") }, 
        modificar: (dir) => this.cambiarVolumen('volSonido', dir) 
      },
      { 
        getTexto: () => i18n.t('volver'), 
        accion: () => this.volver(),
        modificar: () => {} 
      }
    ];

    this.textosOpciones = [];
    this.indiceSeleccionado = 0;
    
    // Cálculo para centrar el bloque ancho: (512 - 192) / 2 = 160
    const startX = 160; 
    const startY = 110;
    const espaciado = 30;

    this.opciones.forEach((opcion, index) => {
      const txt = this.add.text(startX, startY + (index * espaciado), opcion.getTexto(), {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#FFFFFF',
        resolution: 10
      }).setOrigin(0, 0.5); // Alineado a la izquierda
      
      this.textosOpciones.push(txt);
    });

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
    this.teclado.left.on('down', () => this.opciones[this.indiceSeleccionado].modificar(-1));
    this.teclado.right.on('down', () => this.opciones[this.indiceSeleccionado].modificar(1));
    this.teclaEspacio.on('down', () => this.opciones[this.indiceSeleccionado].accion());
  }

  generarBarraTexto(etiqueta, valor) {
    const palitos = '|'.repeat(valor);
    const puntos = '.'.repeat(10 - valor);
    return `${etiqueta.padEnd(10, ' ')} < ${palitos}${puntos} >`;
  }

  cambiarVolumen(claveRegistry, direccion) {
    let valorActual = this.registry.get(claveRegistry);
    valorActual += direccion;
    
    if (valorActual < 0) valorActual = 0;
    if (valorActual > 10) valorActual = 10;
    
    this.registry.set(claveRegistry, valorActual);
    this.actualizarTextos();

    const volumenPhaser = valorActual / 10;
    if (claveRegistry === 'volMusica') {
      console.log(`Música seteada a: ${volumenPhaser}`);
    } else {
      console.log(`SFX seteado a: ${volumenPhaser}`);
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
    this.scene.restart(); 
  }

  actualizarTextos() {
    this.textosOpciones.forEach((txt, index) => {
      txt.setText(this.opciones[index].getTexto());
    });
  }

  volver() {
    this.input.keyboard.removeAllKeys();
    this.scene.start('TitleScene');
  }
}
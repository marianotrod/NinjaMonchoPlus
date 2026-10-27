import { i18n } from '../i18n.js';
import MenuInputManager from './MenuInputManager.js';
import { Sonido } from './Sonido.js';

// Pantalla "CÓMO JUGAR": tres páginas (objetivo, cacería y progresión, controles).
export default class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super("HowToPlayScene");
  }

  create() {
    this.add.rectangle(0, 0, 512, 288, 0x000000).setOrigin(0, 0);
    this.paginas = ['ayuda_objetivo', 'ayuda_caceria', 'ayuda_controles'];
    this.pagina = 0;
    this.contenido = this.add.container(0, 0);
    this.menuInput = new MenuInputManager(this);
    this.dibujarPagina();
  }

  dibujarPagina() {
    this.contenido.removeAll(true);
    const clave = this.paginas[this.pagina];

    this.contenido.add(this.add.text(256, 28, i18n.t(`${clave}_titulo`), {
      fontFamily: '"Press Start 2P"', fontSize: '16px', color: '#4ADE80', resolution: 10
    }).setOrigin(0.5));

    this.contenido.add(this.add.text(36, 56, i18n.t(clave), {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FFFFFF', lineSpacing: 7,
      wordWrap: { width: 440 }, resolution: 10
    }));

    if (clave === 'ayuda_objetivo') {
      ['cuadrado', 'triangulo', 'rombo'].forEach((tipo, i) => {
        this.contenido.add(this.add.image(436 + i * 20, 28, tipo));
      });
    }

    this.contenido.add(this.add.text(256, 270, `<  ${this.pagina + 1}/${this.paginas.length}  >     ${i18n.t('ayuda_navegacion')}`, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FBBF24', resolution: 10
    }).setOrigin(0.5));
  }

  cambiarPagina(direccion) {
    const nueva = Phaser.Math.Clamp(this.pagina + direccion, 0, this.paginas.length - 1);
    if (nueva === this.pagina) return;
    this.pagina = nueva;
    Sonido.beep(this, 440, 0.04, 0.06);
    this.dibujarPagina();
  }

  update() {
    const input = this.menuInput.obtenerInput();
    if (input.left) this.cambiarPagina(-1);
    if (input.right) this.cambiarPagina(1);
    if (input.confirm) {
      if (this.pagina < this.paginas.length - 1) this.cambiarPagina(1);
      else this.scene.start('TitleScene');
    }
    if (input.cancel) this.scene.start('TitleScene');
  }
}

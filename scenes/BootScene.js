import { i18n } from '../i18n.js';
import { ARRANQUE_DEBUG } from '../config.js';
import { Texturas } from './Texturas.js';
import { Guardado } from './Guardado.js';
import { nuevaPartida } from './Partida.js';

// Carga todos los recursos una sola vez, genera las texturas provisorias, crea las animaciones
// y recupera las preferencias guardadas. Después pasa al título (o directo a un nivel en modo debug).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const barraFondo = this.add.rectangle(256, 144, 202, 10, 0x333333);
    const barra = this.add.rectangle(156, 144, 0, 6, 0x4ADE80).setOrigin(0, 0.5);
    this.load.on('progress', (valor) => { barra.width = 200 * valor; });
    this.load.once('complete', () => { barraFondo.destroy(); barra.destroy(); });

    const A = 'public/assets/';
    this.load.image('fondo-cielo', `${A}Cielo.webp`);
    this.load.spritesheet('MapTileSet', `${A}MapTileSet.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja', `${A}NinjaSpriteSheet.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja_coop', `${A}NinjaCoopSprite.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('cuadrado', `${A}cuadrado.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('triangulo', `${A}triangulo.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('rombo', `${A}rombo.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('coin', `${A}coin.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('demonio', `${A}demonio.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('escudo_roto', `${A}escudo_roto-Sheet.png`, { frameWidth: 16, frameHeight: 16 });

    this.load.audio('musica-fondo', [`${A}GameMusic.ogg`, `${A}GameMusic.mp3`]);
    this.load.audio('musica-cueva', [`${A}CaveMusic.mp3`]);
    this.load.audio('musica-agua', [`${A}WaterMusic.mp3`]);
    this.load.audio('musica-jefe', [`${A}BossMusic.mp3`]);
    this.load.audio('musica-win', [`${A}WinMusic.ogg`, `${A}WinMusic.mp3`]);
    this.load.audio('musica-lose', [`${A}LoseMusic.ogg`, `${A}LoseMusic.mp3`]);
    this.load.audio('snd-salto', [`${A}Jump.ogg`, `${A}Jump.mp3`]);
    this.load.audio('snd-caida', [`${A}Fall.ogg`, `${A}Fall.mp3`]);
    this.load.audio('snd-parry', [`${A}Parry.ogg`, `${A}Parry.mp3`]);
    this.load.audio('snd-grito', [`${A}Shout.ogg`, `${A}Shout.mp3`]);
    this.load.audio('snd-grito-final', [`${A}FinalShout.ogg`, `${A}FinalShout.mp3`]);
    this.load.audio('snd-shuriken', [`${A}Shuriken.ogg`, `${A}Shuriken.mp3`]);
    this.load.audio('snd-stun', [`${A}Stun.ogg`, `${A}Stun.mp3`]);
  }

  create() {
    Texturas.generar(this);
    this.crearAnimaciones();

    i18n.setIdioma(Guardado.leer('idioma', 'es'));
    this.registry.set('volMusica', Guardado.leer('volMusica', 5));
    this.registry.set('volSonido', Guardado.leer('volSonido', 5));
    this.registry.set('record', Guardado.leer('record', 0));

    if (ARRANQUE_DEBUG.nivel) {
      const partida = nuevaPartida(ARRANQUE_DEBUG.jugadores, ARRANQUE_DEBUG.nivel);
      partida.jefeForzado = ARRANQUE_DEBUG.jefe;
      this.registry.set('partida', partida);
      this.scene.start('NinjaMonchoScene');
    } else {
      this.scene.start('TitleScene');
    }
  }

  crearAnimaciones() {
    this.anims.create({ key: 'moncho-idle', frames: [{ key: 'ninja', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caminar', frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'moncho-saltar', frames: [{ key: 'ninja', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-caer', frames: [{ key: 'ninja', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'moncho-stun', frames: this.anims.generateFrameNumbers('ninja', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });

    this.anims.create({ key: 'coop-idle', frames: [{ key: 'ninja_coop', frame: 9 }], frameRate: 10 });
    this.anims.create({ key: 'coop-caminar', frames: this.anims.generateFrameNumbers('ninja_coop', { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'coop-saltar', frames: [{ key: 'ninja_coop', frame: 5 }], frameRate: 10 });
    this.anims.create({ key: 'coop-caer', frames: [{ key: 'ninja_coop', frame: 7 }], frameRate: 10 });
    this.anims.create({ key: 'coop-stun', frames: this.anims.generateFrameNumbers('ninja_coop', { start: 10, end: 13 }), frameRate: 12, repeat: -1 });

    this.anims.create({ key: 'escudo-roto', frames: this.anims.generateFrameNumbers('escudo_roto', { start: 0, end: 3 }), frameRate: 8 });
  }
}

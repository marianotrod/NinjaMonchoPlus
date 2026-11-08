import { i18n } from '../i18n.js';
import { ARRANQUE_DEBUG, TILES } from '../config.js';
import { GRAFICOS, GRAFICOS_ANIMADOS, GRAFICOS_ANIMADOS_24, GRAFICOS_CUADROS } from '../datos/Graficos.js';
import { armarCartas } from '../reglas/Pergaminos.js';
import { Guardado } from '../sistemas/Guardado.js';
import { nuevaPartida } from '../reglas/Partida.js';
import { cargarNiveles, registrarNiveles } from '../mundo/Niveles.js';

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

    cargarNiveles(this.load);

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

    GRAFICOS.forEach(clave => this.load.image(clave, `${A}graficos/${clave}.png`));
    [...GRAFICOS_ANIMADOS, ...GRAFICOS_CUADROS].forEach(clave => this.load.spritesheet(clave, `${A}graficos/${clave}.png`, { frameWidth: 16, frameHeight: 16 }));
    GRAFICOS_ANIMADOS_24.forEach(clave => this.load.spritesheet(clave, `${A}graficos/${clave}.png`, { frameWidth: 24, frameHeight: 24 }));

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
    registrarNiveles(this.cache);
    this.crearAnimaciones();

    i18n.setIdioma(Guardado.leer('idioma', 'es'));
    this.registry.set('volMusica', Guardado.leer('volMusica', 5));
    this.registry.set('volSonido', Guardado.leer('volSonido', 5));
    this.registry.set('record', Guardado.leer('record', 0));

    if (ARRANQUE_DEBUG.nivel) {
      const partida = nuevaPartida(ARRANQUE_DEBUG.jugadores, ARRANQUE_DEBUG.nivel);
      partida.jefeForzado = ARRANQUE_DEBUG.jefe;
      if (ARRANQUE_DEBUG.sala) {
        // Probar una sala: arranca en ella y después sigue el nivel pedido, sin forzar el mapa
        partida.enSala = true;
        partida.salaForzada = ARRANQUE_DEBUG.mapa;
        partida.cartas = armarCartas(partida);
      } else {
        partida.mapaForzado = ARRANQUE_DEBUG.mapa;
      }
      this.registry.set('partida', partida);
      this.scene.start('NinjaMonchoScene');
    } else {
      this.scene.start('TitleScene');
    }
  }

  // Los cuadros de un tile animado siguen en la hoja hasta el primer tile vacío o el final de su fila
  ultimoCuadroDelTile(inicio) {
    const textura = this.textures.get('MapTileSet');
    const columnas = textura.getSourceImage().width / 16;
    const finFila = (Math.floor(inicio / columnas) + 1) * columnas;
    const total = Math.min(textura.frameTotal - 1, finFila); // frameTotal cuenta el cuadro __BASE de Phaser
    const vacio = (cuadro) => {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (this.textures.getPixelAlpha(x, y, 'MapTileSet', cuadro) > 0) return false;
        }
      }
      return true;
    };
    let ultimo = inicio;
    while (ultimo + 1 < total && !vacio(ultimo + 1)) ultimo++;
    return ultimo;
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

    [...GRAFICOS_ANIMADOS, ...GRAFICOS_ANIMADOS_24].forEach(clave => this.anims.create({
      key: clave, frames: this.anims.generateFrameNumbers(clave), frameRate: 10, repeat: -1
    }));
    this.anims.create({
      key: 'tile-fuego', frameRate: 8, repeat: -1,
      frames: this.anims.generateFrameNumbers('MapTileSet', { start: TILES.FUEGO, end: this.ultimoCuadroDelTile(TILES.FUEGO) })
    });

    this.anims.create({ key: 'escudo-roto', frames: this.anims.generateFrameNumbers('escudo_roto', { start: 0, end: 3 }), frameRate: 8 });
  }
}

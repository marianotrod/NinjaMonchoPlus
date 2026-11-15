import { i18n } from '../i18n.js';
import { ARRANQUE_DEBUG, CONFIG, TILES } from '../config.js';
import { GRAFICOS, GRAFICOS_ANIMADOS, GRAFICOS_ANIMADOS_24, GRAFICOS_CUADROS, GRAFICOS_UNA_VEZ } from '../datos/Graficos.js';
import { crearAnimaciones } from '../datos/Animaciones.js';
import { armarCartas } from '../reglas/Pergaminos.js';
import { EFECTOS } from '../datos/Pergaminos.js';
import { Guardado } from '../sistemas/Guardado.js';
import { nuevaPartida } from '../reglas/Partida.js';
import { aplicarAjustesGuardados, partidaDeGimnasio } from '../sistemas/Gimnasio.js';
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

    // public/assets: musica/, sonidos/, sprites/ (hojas de cuadros), tiles/, fondos/, graficos/ (sueltos) y pergaminos/
    const A = 'public/assets/';
    this.load.image('fondo-cielo', `${A}fondos/Cielo.webp`);
    // Fondos de cada fase (ver CONFIG.FONDOS_FASE): se reemplaza el PNG para cambiarlos
    Object.values(CONFIG.FONDOS_FASE.archivos).filter(Boolean).forEach(archivo => this.load.image(`fondo-${archivo}`, `${A}fondos/${archivo}.png`));
    this.load.spritesheet('MapTileSet', `${A}tiles/MapTileSet.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja', `${A}sprites/NinjaSpriteSheet.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ninja_coop', `${A}sprites/NinjaCoopSprite.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('cuadrado', `${A}sprites/cuadrado.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('triangulo', `${A}sprites/triangulo.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('rombo', `${A}sprites/rombo.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('coin', `${A}sprites/coin.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('demonio', `${A}sprites/demonio.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('escudo_roto', `${A}sprites/escudo_roto-Sheet.png`, { frameWidth: 16, frameHeight: 16 });

    GRAFICOS.forEach(clave => this.load.image(clave, `${A}graficos/${clave}.png`));
    // Íconos de los pergaminos: el de la carta y el grabado en la pared de la sala (archivos distintos, para cambiar uno sin el otro)
    EFECTOS.forEach(({ id }) => {
      this.load.image(`icono-perg-${id}`, `${A}pergaminos/cartas/${id}.png`);
      this.load.image(`grabado-perg-${id}`, `${A}pergaminos/grabados/${id}.png`);
    });
    [...GRAFICOS_ANIMADOS, ...GRAFICOS_CUADROS, ...GRAFICOS_UNA_VEZ].forEach(clave => this.load.spritesheet(clave, `${A}graficos/${clave}.png`, { frameWidth: 16, frameHeight: 16 }));
    GRAFICOS_ANIMADOS_24.forEach(clave => this.load.spritesheet(clave, `${A}graficos/${clave}.png`, { frameWidth: 24, frameHeight: 24 }));

    this.load.audio('musica-fondo', [`${A}musica/GameMusic.ogg`, `${A}musica/GameMusic.mp3`]);
    this.load.audio('musica-cueva', [`${A}musica/CaveMusic.mp3`]);
    this.load.audio('musica-agua', [`${A}musica/WaterMusic.mp3`]);
    this.load.audio('musica-jefe', [`${A}musica/BossMusic.mp3`]);
    this.load.audio('musica-win', [`${A}musica/WinMusic.ogg`, `${A}musica/WinMusic.mp3`]);
    this.load.audio('musica-lose', [`${A}musica/LoseMusic.ogg`, `${A}musica/LoseMusic.mp3`]);
    this.load.audio('snd-salto', [`${A}sonidos/Jump.ogg`, `${A}sonidos/Jump.mp3`]);
    this.load.audio('snd-caida', [`${A}sonidos/Fall.ogg`, `${A}sonidos/Fall.mp3`]);
    this.load.audio('snd-parry', [`${A}sonidos/Parry.ogg`, `${A}sonidos/Parry.mp3`]);
    this.load.audio('snd-grito', [`${A}sonidos/Shout.ogg`, `${A}sonidos/Shout.mp3`]);
    this.load.audio('snd-grito-final', [`${A}sonidos/FinalShout.ogg`, `${A}sonidos/FinalShout.mp3`]);
    this.load.audio('snd-shuriken', [`${A}sonidos/Shuriken.ogg`, `${A}sonidos/Shuriken.mp3`]);
    this.load.audio('snd-stun', [`${A}sonidos/Stun.ogg`, `${A}sonidos/Stun.mp3`]);
  }

  create() {
    registrarNiveles(this.cache);
    this.crearAnimaciones();

    i18n.setIdioma(Guardado.leer('idioma', 'es'));
    this.registry.set('volMusica', Guardado.leer('volMusica', 5));
    this.registry.set('volSonido', Guardado.leer('volSonido', 5));
    this.registry.set('record', Guardado.leer('record', 0));

    if (ARRANQUE_DEBUG.gimnasio) {
      aplicarAjustesGuardados();
      this.registry.set('partida', partidaDeGimnasio(ARRANQUE_DEBUG.jugadores, ARRANQUE_DEBUG.mapa));
      this.scene.start('NinjaMonchoScene');
    } else if (ARRANQUE_DEBUG.nivel) {
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
    [...GRAFICOS_ANIMADOS, ...GRAFICOS_ANIMADOS_24].forEach(clave => this.anims.create({
      key: clave, frames: this.anims.generateFrameNumbers(clave), frameRate: 10, repeat: -1
    }));
    // Si falta el PNG, no se crea: el juego sigue sin ese efecto
    GRAFICOS_UNA_VEZ.filter(clave => this.textures.exists(clave)).forEach(clave => this.anims.create({
      key: clave, frames: this.anims.generateFrameNumbers(clave), frameRate: 14, repeat: 0
    }));
    this.anims.create({
      key: 'tile-fuego', frameRate: 8, repeat: -1,
      frames: this.anims.generateFrameNumbers('MapTileSet', { start: TILES.FUEGO, end: this.ultimoCuadroDelTile(TILES.FUEGO) })
    });

    crearAnimaciones(this.anims);  // Las de Moncho y las de los enemigos con hoja de cuadros (datos/Animaciones.js)
    this.anims.create({ key: 'escudo-roto', frames: this.anims.generateFrameNumbers('escudo_roto', { start: 0, end: 3 }), frameRate: 8 });
  }
}

import { i18n } from '../i18n.js';
import { CONFIG } from '../config.js';
import { ARMAS } from './Armas.js';

const TIPOS = ['cuadrado', 'triangulo', 'rombo'];
const estilo = (tamaño, color = '#FFFFFF') => ({
  fontFamily: '"Press Start 2P"', fontSize: `${tamaño}px`, color, resolution: 10
});

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    const juegoEscena = this.scene.get('NinjaMonchoScene');
    this.juego = juegoEscena;
    const partida = juegoEscena.partida;

    // 1. Franja negra de fondo superior (ocupa la primera fila del grid 16px)
    this.add.rectangle(0, 0, 512, 16, 0x000000).setOrigin(0, 0).setDepth(0);

    // 2. Puntaje de cada jugador (el J2 aparece cuando se une)
    this.textosPuntaje = [
      this.add.text(4, 4, '', estilo(8)),
      this.add.text(84, 4, '', estilo(8, '#86EFAC'))
    ];
    this.cantidadJugadores = juegoEscena.cantidadJugadores;
    this.actualizarPuntajes(partida.puntajes);

    // 3. HUD central de talismanes: siluetas apagadas que se encienden al juntarlos
    this.hudTalismanes = {};
    this.conteoPrevio = { cuadrado: 0, triangulo: 0, rombo: 0 };
    const configuracionGrupos = { cuadrado: 175, triangulo: 235, rombo: 295 };
    const separacionX = 16;
    TIPOS.forEach(tipo => {
      this.hudTalismanes[tipo] = [0, 1, 2].map(i => this.add.image(configuracionGrupos[tipo] + i * separacionX, 8, tipo).setDepth(1));
    });
    this.mostrarInventario(this.conteoPrevio);

    // Texto central alternativo (Cacería: demonios restantes · Jefe: nombre)
    this.textoCentro = this.add.text(256, 4, '', estilo(8, '#EF4444')).setOrigin(0.5, 0).setVisible(false);

    // 4. Vidas (un grupo de corazones por jugador; los del J2 en verde) y tiempo
    this.corazones = [];
    this.vidasPrevias = [...partida.vidas];
    this.mostrarVidas(partida.vidas);
    this.textoTiempo = this.add.text(508, 4, '', estilo(8)).setOrigin(1, 0);
    this.actualizarTiempo(juegoEscena.tiempoRestante);

    // 5. Viñeta roja para los últimos segundos
    this.vineta = this.add.graphics().setDepth(150).setAlpha(0);
    this.vineta.lineStyle(8, 0xEF4444, 1).strokeRect(4, 20, 504, 264);

    // 6. Armas (abajo a la izquierda el J1, abajo a la derecha el J2) y nivel al centro
    this.hudArmas = [
      { icono: this.add.image(12, 278, 'icono-shuriken').setVisible(false), texto: this.add.text(24, 278, '', estilo(8)).setOrigin(0, 0.5) },
      { icono: this.add.image(500, 278, 'icono-shuriken').setVisible(false), texto: this.add.text(488, 278, '', estilo(8, '#86EFAC')).setOrigin(1, 0.5) }
    ];
    this.add.text(256, 282, `${i18n.t('nivel')} ${partida.nivel}/${CONFIG.TOTAL_NIVELES}`, estilo(8, '#9CA3AF')).setOrigin(0.5);

    // 7. Barra de vida del jefe
    this.barraJefe = this.add.container(256, 24).setVisible(false).setDepth(5);
    const fondoBarra = this.add.rectangle(0, 0, 202, 6, 0x000000, 0.8).setStrokeStyle(1, 0xffffff);
    this.rellenoJefe = this.add.rectangle(-100, 0, 200, 4, 0xEF4444).setOrigin(0, 0.5);
    this.barraJefe.add([fondoBarra, this.rellenoJefe]);

    // 8. Escuchar eventos de la escena principal. Se desuscriben al cerrar la UI para no acumular listeners entre niveles.
    this.listeners = [];
    this.escuchar('actualizar-puntaje', (puntajes) => this.actualizarPuntajes(puntajes));
    this.escuchar('jugadores', (cantidad) => {
      this.cantidadJugadores = cantidad;
      this.actualizarPuntajes(juegoEscena.partida.puntajes);
      this.mostrarVidas(juegoEscena.partida.vidas);
    });
    this.escuchar('actualizar-tiempo', (tiempo) => this.actualizarTiempo(tiempo));
    this.escuchar('inventario', (conteo) => this.mostrarInventario(conteo));
    this.escuchar('vidas', (vidas) => this.mostrarVidas(vidas));
    this.escuchar('fase', (fase) => this.cambiarFase(fase));
    this.escuchar('enemigos-restantes', (cantidad) => this.textoCentro.setText(`${i18n.t('caceria')} · ${i18n.t('quedan')} ${cantidad}`));
    this.escuchar('banner', (datos) => this.mostrarBanner(datos));
    this.escuchar('fantasma', () => {
      this.mostrarBanner({ titulo: i18n.t('fantasma'), subtitulo: i18n.t('fantasma_sub'), color: '#E5E7EB', duracion: 1800 });
      this.textoTiempo.setText(i18n.t('fantasma_corto')).setColor('#E5E7EB');
      this.vineta.setAlpha(0.5);
    });
    this.escuchar('arma-cambiada', (indice, arma, municion) => this.mostrarArma(indice, arma, municion));
    this.escuchar('jefe-aparece', (nombre) => {
      this.textoCentro.setText(nombre).setVisible(true);
      this.barraJefe.setVisible(true);
      this.rellenoJefe.width = 200;
    });
    this.escuchar('jefe-vida', (hp, hpMax) => {
      this.rellenoJefe.width = 200 * Math.max(0, hp / hpMax);
      this.tweens.add({ targets: this.barraJefe, scaleY: 1.6, duration: 60, yoyo: true });
    });
    this.escuchar('nivel-completado', (datos) => this.mostrarNivelCompletado(datos));
    this.escuchar('juego-terminado', (datos) => this.mostrarFinDePartida(datos));

    this.events.once('shutdown', () => {
      this.listeners.forEach(([evento, fn]) => juegoEscena.events.off(evento, fn));
      this.listeners = [];
    });

    juegoEscena.events.emit('ui-lista');
  }

  escuchar(evento, fn) {
    this.juego.events.on(evento, fn);
    this.listeners.push([evento, fn]);
  }

  actualizarPuntajes(puntajes) {
    this.textosPuntaje[0].setText(`J1 ${String(puntajes[0]).padStart(6, '0')}`);
    this.textosPuntaje[1].setText(`J2 ${String(puntajes[1]).padStart(6, '0')}`).setVisible(this.cantidadJugadores === 2);
  }

  mostrarInventario(conteo) {
    TIPOS.forEach(tipo => {
      const iconos = this.hudTalismanes[tipo];
      const cantidad = Math.min(conteo[tipo], 3);
      const previo = Math.min(this.conteoPrevio[tipo], 3);
      iconos.forEach((icono, i) => {
        if (i < cantidad) icono.clearTint().setAlpha(1);
        else icono.setTint(0x222222).setAlpha(0.7);

        if (i >= previo && i < cantidad) {
          this.tweens.add({ targets: icono, scale: { from: 1.8, to: 1 }, duration: 200, ease: 'Back.Out' });
        } else if (i >= cantidad && i < previo) {
          icono.setTint(0xff3333);
          this.time.delayedCall(250, () => icono.setTint(0x222222));
        }
      });
      // Brillo al completar las 3 de una forma
      if (cantidad === 3 && previo < 3) {
        this.tweens.add({ targets: iconos, y: 5, duration: 100, yoyo: true, repeat: 1 });
      }
    });
    this.conteoPrevio = { ...conteo };
  }

  mostrarVidas(vidas) {
    this.corazones.forEach(c => c.destroy());
    this.corazones = [];
    for (let j = 0; j < this.cantidadJugadores; j++) {
      const lleno = j === 0 ? 'corazon' : 'corazon-coop';
      const grupo = [];
      for (let i = 0; i < Math.max(CONFIG.VIDAS_INICIALES, vidas[j]); i++) {
        grupo.push(this.add.image(344 + j * 40 + i * 10, 8, i < vidas[j] ? lleno : 'corazon-vacio'));
      }
      // Late el corazón que se acaba de perder
      const perdido = vidas[j] < this.vidasPrevias[j] ? grupo[vidas[j]] : null;
      if (perdido) this.tweens.add({ targets: perdido, scale: { from: 2, to: 1 }, duration: 300 });
      this.corazones.push(...grupo);
    }
    this.vidasPrevias = [...vidas];
  }

  cambiarFase(fase) {
    const conTalismanes = fase === 'recoleccion';
    TIPOS.forEach(tipo => this.hudTalismanes[tipo].forEach(icono => icono.setVisible(conTalismanes)));
    this.textoCentro.setVisible(!conTalismanes);
    this.vineta.setAlpha(0);
    if (fase === 'caceria') this.textoCentro.setColor('#EF4444');
    if (fase === 'jefe') this.textoCentro.setColor('#FBBF24');
  }

  // Alarma: desde 10 s el reloj se pone rojo y titila; desde 5 s además late y se marca el borde de la pantalla.
  actualizarTiempo(tiempo) {
    this.textoTiempo.setText(`${i18n.t('hud_tiempo')} ${tiempo}`);
    const enJuego = ['recoleccion', 'caceria', 'jefe'].includes(this.juego.fase);

    if (!enJuego || tiempo > CONFIG.ALARMA_TIEMPO || tiempo <= 0) {
      this.textoTiempo.setColor(tiempo <= 0 && enJuego ? '#EF4444' : '#FFFFFF').setAlpha(1);
      return;
    }

    this.textoTiempo.setColor('#EF4444');
    this.tweens.add({ targets: this.textoTiempo, alpha: { from: 0.3, to: 1 }, duration: 300 });

    if (tiempo === CONFIG.ALARMA_TIEMPO) {
      this.mostrarBanner({ titulo: i18n.t('diez_segundos'), color: '#EF4444', duracion: 1000, chico: true });
    }
    if (tiempo <= CONFIG.ALARMA_URGENTE) {
      this.tweens.add({ targets: this.textoTiempo, scale: { from: 1.5, to: 1 }, duration: 350, ease: 'Quad.Out' });
      this.tweens.add({ targets: this.vineta, alpha: { from: 0.6, to: 0 }, duration: 700 });
    }
  }

  mostrarArma(indice, arma, municion) {
    const hud = this.hudArmas[indice];
    if (!hud) return;
    if (!arma) {
      hud.icono.setVisible(false);
      hud.texto.setText('');
      return;
    }
    const jugador = this.juego.jugadores[indice];
    const cantidad = jugador && jugador.municionInfinita() ? 'INF' : municion;
    hud.icono.setTexture(ARMAS[arma].icono).setVisible(true);
    hud.texto.setText(`x${cantidad}`);
  }

  mostrarBanner({ titulo, subtitulo = '', color = '#FBBF24', duracion = 1800, iconos = false, chico = false }) {
    if (this.banner) {
      this.tweens.killTweensOf(this.banner);
      this.banner.destroy();
    }
    const contenedor = this.add.container(256, chico ? 64 : 120).setDepth(200);
    const alto = chico ? 0 : (iconos ? 84 : (subtitulo ? 64 : 40));
    if (alto) contenedor.add(this.add.rectangle(0, 0, 512, alto, 0x000000, 0.65));

    const yTitulo = chico ? 0 : (iconos ? -24 : (subtitulo ? -12 : 0));
    contenedor.add(this.add.text(0, yTitulo, titulo, estilo(chico ? 12 : 16, color)).setOrigin(0.5));
    if (subtitulo) {
      contenedor.add(this.add.text(0, yTitulo + 22, subtitulo, { ...estilo(8), align: 'center' }).setOrigin(0.5));
    }
    if (iconos) {
      // Cada grupo (talismán + "x3") ocupa unos 42 px; se separan cada 64 para que no se toquen
      TIPOS.forEach((tipo, i) => {
        const x = (i - 1) * 64;
        contenedor.add(this.add.image(x - 10, 24, tipo).setScale(1.5));
        contenedor.add(this.add.text(x + 4, 24, 'x3', estilo(8)).setOrigin(0, 0.5));
      });
    }

    contenedor.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: contenedor, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: contenedor, alpha: 0, delay: Math.max(200, duracion - 250), duration: 250, onComplete: () => contenedor.destroy() });
    this.banner = contenedor;
  }

  crearPanel(titulo, colorTitulo, lineas, aviso) {
    const panel = this.add.container(256, 150).setDepth(250);
    panel.add(this.add.rectangle(0, 0, 360, 170, 0x000000, 0.85).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(colorTitulo).color));
    panel.add(this.add.text(0, -62, titulo, { ...estilo(16, colorTitulo), align: 'center' }).setOrigin(0.5));
    lineas.forEach(([texto, color], i) => {
      panel.add(this.add.text(0, -28 + i * 16, texto, { ...estilo(8, color), align: 'center' }).setOrigin(0.5));
    });
    panel.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });

    this.time.delayedCall(1200, () => {
      const textoAviso = this.add.text(0, 66, aviso, { ...estilo(8, '#FBBF24'), align: 'center', lineSpacing: 6 }).setOrigin(0.5);
      panel.add(textoAviso);
      this.tweens.add({ targets: textoAviso, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    });
    return panel;
  }

  lineasPuntaje(puntajes, cantidad) {
    const lineas = [[`J1  ${puntajes[0]}`, '#FFFFFF']];
    if (cantidad === 2) lineas.push([`J2  ${puntajes[1]}`, '#86EFAC']);
    return lineas;
  }

  mostrarNivelCompletado(datos) {
    const lineas = [];
    if (datos.bonoExtra) lineas.push([`${i18n.t('bono_jefe')} +${datos.bonoExtra}`, '#FBBF24']);
    lineas.push([`${i18n.t('bono_tiempo')} +${datos.bonoTiempo}`, datos.bonoTiempo ? '#4ADE80' : '#9CA3AF']);
    if (datos.limpio === false) lineas.push([i18n.t('caceria_incompleta'), '#9CA3AF']);
    lineas.push(['', '#FFFFFF'], ...this.lineasPuntaje(datos.puntajes, datos.jugadores));
    this.crearPanel(`${i18n.t('nivel')} ${datos.nivel}\n${i18n.t('completado')}`, '#4ADE80', lineas.slice(0, 6), i18n.t('continuar'));
  }

  mostrarFinDePartida(datos) {
    const lineas = this.lineasPuntaje(datos.puntajes, datos.puntajes.length);
    lineas.push([`${i18n.t('total')}  ${datos.total}`, '#FFFFFF']);
    lineas.push([datos.nuevoRecord ? i18n.t('nuevo_record') : `${i18n.t('record')}  ${datos.record}`, datos.nuevoRecord ? '#FBBF24' : '#9CA3AF']);
    this.crearPanel(
      datos.ganaste ? i18n.t('ganaste') : i18n.t('perdiste'),
      datos.ganaste ? '#4ADE80' : '#EF4444',
      lineas,
      i18n.t('reintentar')
    );
  }
}

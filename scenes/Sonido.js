// Sonido.js
// Helper único de audio: aplica los volúmenes de Opciones y maneja la música de fondo entre escenas.
import { Guardado } from './Guardado.js';

let musicaActual = null;
let volumenBaseMusica = 0.4;

// Volumen 5 de 10 (el valor por defecto) deja los sonidos como estaban antes de tener Opciones.
const factor = (scene, clave) => {
  const valor = scene.registry.get(clave);
  return (valor === undefined ? 5 : valor) / 5;
};

export const Sonido = {
  efecto(scene, key, volumen = 0.5, config = {}) {
    const vol = volumen * factor(scene, 'volSonido');
    if (vol <= 0) return;
    try {
      scene.sound.play(key, { ...config, volume: vol });
    } catch (e) {}
  },

  musica(scene, key, volumen = 0.4, loop = true) {
    if (musicaActual && musicaActual.key === key && musicaActual.isPlaying) return musicaActual;
    this.detenerMusica();
    volumenBaseMusica = volumen;
    try {
      musicaActual = scene.sound.add(key, { loop, volume: volumen * factor(scene, 'volMusica') });
      musicaActual.play();
    } catch (e) {
      musicaActual = null;
    }
    return musicaActual;
  },

  detenerMusica() {
    if (musicaActual) {
      musicaActual.stop();
      musicaActual.destroy();
      musicaActual = null;
    }
  },

  actualizarVolumenMusica(scene) {
    if (musicaActual) musicaActual.setVolume(volumenBaseMusica * factor(scene, 'volMusica'));
  },

  // Cambia un volumen (0 a 10) desde Opciones o la Pausa y lo deja guardado
  cambiarVolumen(scene, clave, direccion) {
    const actual = scene.registry.get(clave);
    const valor = Phaser.Math.Clamp((actual === undefined ? 5 : actual) + direccion, 0, 10);
    scene.registry.set(clave, valor);
    Guardado.escribir(clave, valor);
    if (clave === 'volMusica') this.actualizarVolumenMusica(scene);
    else this.beep(scene, 660, 0.08, 0.12);
    return valor;
  },

  ritmoMusica(rate) {
    if (musicaActual && musicaActual.rate !== rate) musicaActual.setRate(rate);
  },

  // Sonidos sintetizados con WebAudio (no necesitan archivo): tic del reloj, explosiones, menús.
  beep(scene, frecuencia = 880, duracion = 0.08, volumen = 0.12, tipo = 'square') {
    const ctx = scene.sound.context;
    const vol = volumen * factor(scene, 'volSonido');
    if (!ctx || vol <= 0) return;
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = frecuencia;
    ganancia.gain.setValueAtTime(vol, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracion);
    osc.connect(ganancia);
    ganancia.connect(scene.sound.masterVolumeNode || ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracion);
  },

  ruido(scene, duracion = 0.35, volumen = 0.35) {
    const ctx = scene.sound.context;
    const vol = volumen * factor(scene, 'volSonido');
    if (!ctx || vol <= 0) return;
    const muestras = Math.floor(ctx.sampleRate * duracion);
    const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras);
    const fuente = ctx.createBufferSource();
    const ganancia = ctx.createGain();
    fuente.buffer = buffer;
    ganancia.gain.value = vol;
    fuente.connect(ganancia);
    ganancia.connect(scene.sound.masterVolumeNode || ctx.destination);
    fuente.start();
  }
};

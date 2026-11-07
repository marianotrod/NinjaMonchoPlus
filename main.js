import BootScene from './escenas/BootScene.js';
import TitleScene from './escenas/TitleScene.js';
import OptionsScene from './escenas/OptionsScene.js'; 
import HowToPlayScene from './escenas/HowToPlayScene.js';
import NinjaMonchoScene from './escenas/NinjaMonchoScene.js';
import UIScene from './escenas/UIScene.js';
import PauseScene from './escenas/PauseScene.js';
import CreditsScene from './escenas/CreditsScene.js';
import { DEBUG, FISICA } from './config.js';
import { instalarPuertaPruebas } from './sistemas/PuertaPruebas.js';
import { cargarTraducciones, i18n } from './i18n.js';


const GAME_WIDTH = 512;
const GAME_HEIGHT = 288;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.NONE // El escalado lo maneja el algoritmo entero en CSS
  },
  input: {
    gamepad: true // <-- ¡ESTO ACTIVA EL SOPORTE PARA JOYSTICKS!
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: FISICA.gravedadMundo },
      debug: false,
    },
  },
  // BootScene carga todo y arranca el título. UIScene y PauseScene se dibujan encima de NinjaMonchoScene.
  scene: [BootScene, TitleScene, OptionsScene, HowToPlayScene, CreditsScene, NinjaMonchoScene, UIScene, PauseScene],
};

// Función para calcular y aplicar el multiplicador entero exacto (1x, 2x, 3x, 4x...)
function applyIntegerScaling() {
  if (!window.game || !window.game.canvas) return;
  const canvas = window.game.canvas;
  const winW = window.innerWidth;
  const winH = window.innerHeight;

  const scaleX = Math.floor(winW / GAME_WIDTH);
  const scaleY = Math.floor(winH / GAME_HEIGHT);
  const integerScale = Math.max(1, Math.min(scaleX, scaleY));

  canvas.style.width = (GAME_WIDTH * integerScale) + "px";
  canvas.style.height = (GAME_HEIGHT * integerScale) + "px";
}

// Inicialización controlada una vez que la fuente esté lista
async function initGame() {
  try {
    await document.fonts.load('8px "Press Start 2P"');
    await document.fonts.load('16px "Press Start 2P"');
  } catch (e) {
    console.warn("Aviso al precargar fuente:", e);
  }

  await cargarTraducciones();
  if (DEBUG) window.i18n = i18n; // Para el banco de pruebas

  window.game = new Phaser.Game(config);
  if (DEBUG) instalarPuertaPruebas(window.game); // Para el banco de pruebas (tools/navegador)
  setTimeout(applyIntegerScaling, 50);
}

window.addEventListener("resize", applyIntegerScaling);
window.addEventListener("load", initGame);
// Banco de pruebas: abre el juego en Edge (o Chrome) sin ventana, ejecuta los pasos de un escenario
// y muestra los errores de consola. Sirve para detectar roturas sin abrir el juego a mano.
//
// Uso (con el juego servido en http://127.0.0.1:5501):
//   node tools/navegador/probar.js http://127.0.0.1:5501/index.html tools/navegador/escenarios/humo.json capturas
//
// Pasos posibles en el escenario (JSON): {"wait": ms}, {"press": "Enter"}, {"down": "ArrowRight"}, {"up": "ArrowRight"},
// {"eval": "expresión JS en la página"}, {"shot": "nombre-captura"}. Se pueden combinar en un mismo paso.
// Dejar ~100 ms entre teclas: si se aprietan pegadas, los menús las toman como una sola.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const NAVEGADOR = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [, , url, archivo, salida = '.'] = process.argv;
const pasos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(salida, { recursive: true });

  // Se lanza el navegador a mano y puppeteer se conecta por el puerto de depuración
  // (en algunas PCs con Windows, puppeteer.launch no logra arrancar Edge).
  const puerto = 9300 + Math.floor(Math.random() * 500);
  const navegador = spawn(NAVEGADOR, ['--headless=new', '--no-sandbox', '--no-first-run', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${path.join(os.tmpdir(), `ninja-moncho-perfil-${puerto}`)}`,
    `--remote-debugging-port=${puerto}`, 'about:blank'], { stdio: 'ignore' });

  let browser = null;
  for (let i = 0; i < 40 && !browser; i++) {
    await esperar(250);
    try { browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${puerto}` }); } catch (e) {}
  }
  if (!browser) {
    console.log('NO SE PUDO CONECTAR AL NAVEGADOR');
    navegador.kill();
    process.exit(1);
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 576 });
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => logs.push(`PAGEERROR: ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
  await page.goto(url, { waitUntil: 'load' });

  for (const p of pasos) {
    if (p.wait) await esperar(p.wait);
    if (p.press) await page.keyboard.press(p.press, { delay: p.delay || 60 });
    if (p.down) await page.keyboard.down(p.down);
    if (p.up) await page.keyboard.up(p.up);
    if (p.eval) {
      try { console.log('EVAL', JSON.stringify(await page.evaluate(p.eval))); }
      catch (e) { console.log('EVAL ERROR', e.message); }
    }
    if (p.shot) await page.screenshot({ path: path.join(salida, `${p.shot}.png`) });
  }

  console.log(logs.length ? logs.join('\n') : 'SIN ERRORES');
  await browser.close();
  navegador.kill();
})();

// Banco de pruebas: abre el juego en Edge (o Chrome) sin ventana, ejecuta los pasos de uno o varios escenarios,
// verifica los resultados y muestra los errores de consola. Sirve para detectar roturas sin abrir el juego a mano.
//
// Uso (con el juego servido en http://127.0.0.1:5501, y desde PowerShell en Windows):
//   node tools/navegador/probar.js http://127.0.0.1:5501/index.html tools/navegador/escenarios capturas
//   node tools/navegador/probar.js http://127.0.0.1:5501/index.html tools/navegador/escenarios/fases.json capturas
// Con una carpeta corre todos sus .json en orden alfabético, cada uno en una página nueva.
// Termina con código 1 si falló alguna verificación o hubo un error de JavaScript en la página.
//
// Un escenario es una lista de pasos, o un objeto { "descripcion", "query": "?debug&nivel=1", "pasos": [...] }.
// "query" reemplaza los parámetros de la URL (para arrancar directo en un nivel con ?debug).
//
// Pasos posibles (se pueden combinar en un mismo paso; se ejecutan en este orden):
//   {"wait": ms}                       espera fija
//   {"hasta": "expr", "timeout": ms}   espera hasta que la expresión dé verdadero (si no llega, cuenta como falla)
//   {"press": "Enter"} {"down": "ArrowRight"} {"up": "ArrowRight"}   teclado ("delay" = ms apretada en press)
//   {"eval": "expr"}                   evalúa en la página e imprime el resultado
//   {"verificar": "nombre", "eval": "expr", "espera": {...}}
//        sin "espera", el resultado tiene que ser true. Con "espera", cada clave se compara con la del resultado:
//        un valor común se compara exacto; {"min": a}, {"max": b}, {"distinto": c} comparan con márgenes.
//   {"shot": "nombre-captura"}
// Dejar ~100 ms entre teclas: si se aprietan pegadas, los menús las toman como una sola.
// Las expresiones pueden usar window.prueba (puerta de pruebas, solo con ?debug: ver sistemas/PuertaPruebas.js).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const NAVEGADOR = process.env.NAVEGADOR || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [, , url, objetivo, salida = '.'] = process.argv;
const esperar = (ms) => new Promise(r => setTimeout(r, ms));

function listarEscenarios(ruta) {
  if (fs.statSync(ruta).isDirectory()) {
    return fs.readdirSync(ruta).filter(f => f.endsWith('.json')).sort().map(f => path.join(ruta, f));
  }
  return [ruta];
}

function leerEscenario(archivo) {
  const datos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  return Array.isArray(datos) ? { pasos: datos } : datos;
}

function urlConQuery(base, query) {
  if (query === undefined) return base;
  return base.split('?')[0] + query;
}

function iguales(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Devuelve la lista de diferencias entre lo esperado y lo obtenido (vacía si todo coincide)
function comparar(espera, resultado) {
  if (espera === undefined) return resultado === true ? [] : [`se esperaba true y dio ${JSON.stringify(resultado)}`];
  if (resultado === null || typeof resultado !== 'object') return [`se esperaba un objeto y dio ${JSON.stringify(resultado)}`];
  const errores = [];
  Object.entries(espera).forEach(([clave, esperado]) => {
    const valor = resultado[clave];
    const esRango = esperado !== null && typeof esperado === 'object' && !Array.isArray(esperado) &&
      Object.keys(esperado).every(k => ['min', 'max', 'distinto'].includes(k));
    if (esRango) {
      if ('min' in esperado && !(valor >= esperado.min)) errores.push(`${clave}: ${JSON.stringify(valor)} < mínimo ${esperado.min}`);
      if ('max' in esperado && !(valor <= esperado.max)) errores.push(`${clave}: ${JSON.stringify(valor)} > máximo ${esperado.max}`);
      if ('distinto' in esperado && iguales(valor, esperado.distinto)) errores.push(`${clave}: no debía ser ${JSON.stringify(valor)}`);
    } else if (!iguales(valor, esperado)) {
      errores.push(`${clave}: se esperaba ${JSON.stringify(esperado)} y dio ${JSON.stringify(valor)}`);
    }
  });
  return errores;
}

async function correrEscenario(browser, archivo, totales) {
  const escenario = leerEscenario(archivo);
  const nombre = path.basename(archivo, '.json');
  console.log(`\n=== ${nombre}${escenario.descripcion ? ` — ${escenario.descripcion}` : ''}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 576 });
  const logs = [];
  let erroresPagina = 0;
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => {
    erroresPagina++;
    logs.push(`PAGEERROR: ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`);
  });
  await page.goto(urlConQuery(url, escenario.query), { waitUntil: 'load' });

  const anotar = (ok, texto, detalle = []) => {
    if (ok) totales.ok++; else totales.fallas.push(`${nombre}: ${texto}`);
    console.log(`  ${ok ? '✔' : '✘'} ${texto}${detalle.length ? `\n      ${detalle.join('\n      ')}` : ''}`);
  };

  for (const p of escenario.pasos) {
    if (p.wait) await esperar(p.wait);
    if (p.hasta) {
      const limite = Date.now() + (p.timeout || 5000);
      let listo = false;
      while (!listo && Date.now() < limite) {
        try { listo = !!(await page.evaluate(p.hasta)); } catch (e) { listo = false; }
        if (!listo) await esperar(50);
      }
      if (!listo) anotar(false, `esperando: ${p.nombre || p.hasta}`, ['no se cumplió a tiempo']);
    }
    if (p.press) await page.keyboard.press(p.press, { delay: p.delay || 60 });
    if (p.down) await page.keyboard.down(p.down);
    if (p.up) await page.keyboard.up(p.up);
    if (p.eval) {
      let resultado;
      let error = null;
      try { resultado = await page.evaluate(p.eval); } catch (e) { error = e.message; }
      if (p.verificar) {
        if (error) anotar(false, p.verificar, [`error: ${error}`]);
        else {
          const diferencias = comparar(p.espera, resultado);
          anotar(diferencias.length === 0, p.verificar, diferencias.length ? [...diferencias, `resultado: ${JSON.stringify(resultado)}`] : []);
        }
      } else {
        console.log(error ? `  EVAL ERROR ${error}` : `  EVAL ${JSON.stringify(resultado)}`);
      }
    }
    if (p.shot) await page.screenshot({ path: path.join(salida, `${nombre}_${p.shot}.png`) });
  }

  if (erroresPagina) anotar(false, `errores de JavaScript en la página: ${erroresPagina}`);
  if (logs.length) console.log(`  consola:\n    ${logs.join('\n    ')}`);
  await page.close();
}

(async () => {
  fs.mkdirSync(salida, { recursive: true });

  // Se lanza el navegador a mano y puppeteer se conecta por el puerto de depuración
  // (en algunas PCs con Windows, puppeteer.launch no logra arrancar Edge).
  const puerto = 9300 + Math.floor(Math.random() * 500);
  // Perfil descartable del navegador: se borra al terminar (cada uno ocupa ~100 MB)
  const perfil = path.join(os.tmpdir(), `ninja-moncho-perfil-${puerto}`);
  const navegador = spawn(NAVEGADOR, ['--headless=new', '--no-sandbox', '--no-first-run', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${perfil}`,
    `--remote-debugging-port=${puerto}`, 'about:blank'], { stdio: 'ignore' });
  const borrarPerfil = async () => {
    for (let i = 0; i < 10; i++) {
      try { fs.rmSync(perfil, { recursive: true, force: true }); return; } catch (e) { await esperar(300); }
    }
  };

  let browser = null;
  for (let i = 0; i < 40 && !browser; i++) {
    await esperar(250);
    try { browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${puerto}` }); } catch (e) {}
  }
  if (!browser) {
    console.log('NO SE PUDO CONECTAR AL NAVEGADOR');
    navegador.kill();
    await borrarPerfil();
    process.exit(1);
  }

  const totales = { ok: 0, fallas: [] };
  try {
    for (const archivo of listarEscenarios(objetivo)) {
      await correrEscenario(browser, archivo, totales);
    }
  } catch (e) {
    totales.fallas.push(`el banco de pruebas se cortó: ${e.message}`);
  }

  const total = totales.ok + totales.fallas.length;
  console.log(`\n${totales.fallas.length ? '✘' : '✔'} ${totales.ok} de ${total} verificaciones bien`);
  totales.fallas.forEach(f => console.log(`  ✘ ${f}`));
  await browser.close().catch(() => {});
  navegador.kill();
  await esperar(500);
  await borrarPerfil();
  process.exit(totales.fallas.length ? 1 : 0);
})();

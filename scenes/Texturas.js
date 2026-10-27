// Texturas.js
// Arte provisorio generado por código para lo que todavía no tiene sprite (armas, enemigos nuevos, jefes, HUD).
// Cada dibujo es una grilla de caracteres, igual que los mapas: cada letra es un color de la paleta y '.' es transparente.
// Cuando haya arte definitivo alcanza con cargar un PNG con la misma key en BootScene y borrar el dibujo de acá.

function crearCanvas(scene, key, ancho, alto, dibujar) {
  if (scene.textures.exists(key)) return;
  const textura = scene.textures.createCanvas(key, ancho, alto);
  dibujar(textura.getContext());
  textura.refresh();
}

function dibujarFilas(ctx, filas, paleta, dx = 0, dy = 0) {
  filas.forEach((fila, y) => {
    [...fila].forEach((caracter, x) => {
      const color = paleta[caracter];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    });
  });
}

function dibujarFuncion(ctx, ancho, alto, fn) {
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const color = fn(x, y);
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function texturaPixel(scene, key, filas, paleta) {
  crearCanvas(scene, key, filas[0].length, filas.length, ctx => dibujarFilas(ctx, filas, paleta));
}

function texturaProcedural(scene, key, ancho, alto, fn) {
  crearCanvas(scene, key, ancho, alto, ctx => dibujarFuncion(ctx, ancho, alto, fn));
}

// ==========================================
// DIBUJOS
// ==========================================
const SHURIKEN = [
  '...a...',
  '...a...',
  '..bab..',
  'aaa.aaa',
  '..bab..',
  '...a...',
  '...a...'
];

const BUMERAN = [
  'aaaaaaa.',
  'abbbbba.',
  'abaaaaa.',
  'aba.....',
  'aba.....',
  'aba.....',
  'aba.....',
  'aaa.....'
];

const BOMBA = [
  '....cc..',
  '...c....',
  '..aaaa..',
  '.aabaaa.',
  '.abaaaa.',
  '.aaaaaa.',
  '.aaaaaa.',
  '..aaaa..'
];

const FANTASMA = [
  '................',
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '...aaaaaaaaaa...',
  '...aabbaabbaa...',
  '..aaabbaabbaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaccccaaaa..',
  '..aaaaccccaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aa.aaa.aaa.a..',
  '..a...a...a.....',
  '................'
];

const VOLADOR = [
  '................',
  '................',
  '......aaaa......',
  '.....aaaaaa.....',
  'c...aabaabaa...c',
  'cc..aabaabaa..cc',
  'ccc.aaaaaaaa.ccc',
  '.cccaaaddaaaccc.',
  '..ccaaaaaaaacc..',
  '....aaaaaaaa....',
  '.....aaaaaa.....',
  '......aaaa......',
  '.......aa.......',
  '................',
  '................',
  '................'
];

const LANZADOR = [
  '................',
  '...b........b...',
  '...bb......bb...',
  '....aaaaaaaa....',
  '...aaaaaaaaaa...',
  '..aaacaaaacaaa..',
  '..aaacaaaacaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaddddddaaa..',
  '..aaadeeeedaaa..',
  '..aaaddddddaaa..',
  '..aaaaaaaaaaaa..',
  '...aaaaaaaaaa...',
  '...ff......ff...',
  '..fff......fff..',
  '................'
];

const PROYECTIL = [
  '..aa..',
  '.abba.',
  'abccba',
  'abccba',
  '.abba.',
  '..aa..'
];

const CORAZON = [
  '.aa.aa.',
  'abaaaaa',
  'aaaaaaa',
  '.aaaaa.',
  '..aaa..',
  '...a...'
];

const MANO = [
  '....aa......',
  '....aba.....',
  '....aba.....',
  '....abaaa...',
  '.aa.abababa.',
  'abbaabbbbbba',
  'abbbbbbbbbba',
  '.abbbbbbbba.',
  '..abbbbbba..',
  '...aaaaaa...'
];

const ESTRELLA = [
  '..a..',
  '.aaa.',
  'aaaaa',
  '.aaa.',
  '.a.a.'
];

// Demonio grande parametrizable para los jefes: cuerpo elíptico, cuernos o corona, ojos, boca con colmillos y patas o cola.
function dibujoJefe(t, { cuerpo, sombra, detalle, ojo, cuernos = true, corona = false, cola = false }) {
  const cx = t / 2 - 0.5;
  return (x, y) => {
    const nx = (x - cx) / (t * 0.42);
    const ny = (y - t * 0.58) / (t * 0.36);
    const radio = nx * nx + ny * ny;
    let enCuerpo = radio <= 1;

    if (cola && ny > 0) {
      const borde = t * 0.95 - (Math.sin(x * 0.9) + 1) * t * 0.05;
      enCuerpo = Math.abs(nx) <= 1 && y < borde;
    }

    if (!enCuerpo) {
      if (cuernos) {
        const puntaY = t * 0.04, baseY = t * 0.3;
        const centroCuerno = Math.abs(x - cx) - t * 0.24;
        if (y >= puntaY && y <= baseY && Math.abs(centroCuerno) <= ((y - puntaY) / (baseY - puntaY)) * t * 0.08 + 0.5) return detalle;
      }
      if (corona && Math.abs(x - cx) <= t * 0.26 && y >= t * 0.1 && y <= t * 0.24) {
        if (y > t * 0.17 || Math.floor(x / 3) % 2 === 0) return '#facc15';
      }
      if (!cola && y >= t * 0.9 && Math.abs(x - cx) >= t * 0.1 && Math.abs(x - cx) <= t * 0.3) return sombra;
      return null;
    }

    const dxOjo = Math.abs(x - cx);
    if (y >= t * 0.44 && y <= t * 0.54 && dxOjo >= t * 0.08 && dxOjo <= t * 0.22) {
      return (dxOjo >= t * 0.13 && dxOjo <= t * 0.16 && y >= t * 0.47) ? '#111111' : ojo;
    }
    if (y >= t * 0.67 && y <= t * 0.73 && dxOjo <= t * 0.18) return '#1f0a0a';
    if (y > t * 0.73 && y <= t * 0.8 && dxOjo >= t * 0.1 && dxOjo <= t * 0.14) return '#f8fafc';
    if (radio > 0.78 && !cola) return sombra;
    if (x < cx - t * 0.15 && y < t * 0.4 && radio < 0.5) return '#ffffff55';
    return cuerpo;
  };
}

export const Texturas = {
  generar(scene) {
    // Corte de katana: media luna que se dibuja delante del ninja
    texturaProcedural(scene, 'katana-corte', 18, 18, (x, y) => {
      const d = Math.hypot(x - 1, y - 8.5);
      if (x < 6 || d < 10 || d > 13.5) return null;
      return d > 12.5 ? '#7dd3fc' : '#ffffff';
    });

    texturaPixel(scene, 'shuriken', SHURIKEN, { a: '#e5e7eb', b: '#6b7280' });
    texturaPixel(scene, 'bumeran', BUMERAN, { a: '#7c2d12', b: '#f59e0b' });
    texturaPixel(scene, 'bomba', BOMBA, { a: '#1f2937', b: '#9ca3af', c: '#f97316' });
    texturaPixel(scene, 'fantasma', FANTASMA, { a: '#e5e7eb', b: '#111827', c: '#7f1d1d' });
    texturaPixel(scene, 'volador', VOLADOR, { a: '#a855f7', b: '#fde047', c: '#6b21a8', d: '#3b0764' });
    texturaPixel(scene, 'lanzador', LANZADOR, { a: '#16a34a', b: '#fef3c7', c: '#fde047', d: '#14532d', e: '#f97316', f: '#14532d' });
    texturaPixel(scene, 'proyectil', PROYECTIL, { a: '#b91c1c', b: '#f97316', c: '#fde047' });
    texturaPixel(scene, 'corazon', CORAZON, { a: '#ef4444', b: '#fecaca' });
    texturaPixel(scene, 'corazon-vacio', CORAZON, { a: '#4b5563', b: '#4b5563' });
    texturaPixel(scene, 'mano', MANO, { a: '#111827', b: '#fde68a' });
    texturaPixel(scene, 'estrella', ESTRELLA, { a: '#fde047' });
    texturaProcedural(scene, 'chispa', 2, 2, () => '#ffffff');

    // Onda expansiva del jefe Oni: media elipse que se desliza por el piso
    texturaProcedural(scene, 'onda', 16, 10, (x, y) => {
      const d = ((x - 7.5) / 8) ** 2 + ((y - 10) / 10) ** 2;
      if (d > 1) return null;
      return d > 0.6 ? '#fde047' : (d > 0.3 ? '#f97316' : '#dc2626');
    });

    // Cajas de armas: marco dorado con el arma adentro
    const marco = (x, y) => {
      const esquina = (x === 0 || x === 15) && (y === 0 || y === 15);
      if (esquina) return null;
      if (x === 0 || x === 15 || y === 0 || y === 15) return '#facc15';
      return '#1f2937';
    };
    crearCanvas(scene, 'icono-shuriken', 16, 16, ctx => { dibujarFuncion(ctx, 16, 16, marco); dibujarFilas(ctx, SHURIKEN, { a: '#e5e7eb', b: '#9ca3af' }, 4, 4); });
    crearCanvas(scene, 'icono-bumeran', 16, 16, ctx => { dibujarFuncion(ctx, 16, 16, marco); dibujarFilas(ctx, BUMERAN, { a: '#7c2d12', b: '#f59e0b' }, 4, 4); });
    crearCanvas(scene, 'icono-bomba', 16, 16, ctx => { dibujarFuncion(ctx, 16, 16, marco); dibujarFilas(ctx, BOMBA, { a: '#4b5563', b: '#d1d5db', c: '#f97316' }, 4, 4); });

    // Pergamino de Pacto
    texturaProcedural(scene, 'pergamino', 28, 36, (x, y) => {
      const enRollo = y <= 4 || y >= 31;
      if (enRollo) {
        if (y === 0 || y === 4 || y === 31 || y === 35) return '#78350f';
        return (x === 0 || x === 27) ? '#78350f' : '#b45309';
      }
      if (x < 2 || x > 25) return null;
      if (x === 2 || x === 25) return '#b45309';
      return (y % 6 === 0 && x > 5 && x < 22) ? '#f59e0b' : '#fde68a';
    });

    // Jefes
    texturaProcedural(scene, 'jefe-ogro', 32, 32, dibujoJefe(32, { cuerpo: '#b45309', sombra: '#78350f', detalle: '#e5e7eb', ojo: '#fde047' }));
    texturaProcedural(scene, 'jefe-oni', 32, 32, dibujoJefe(32, { cuerpo: '#dc2626', sombra: '#7f1d1d', detalle: '#fef3c7', ojo: '#fde047' }));
    texturaProcedural(scene, 'jefe-espectro', 32, 32, dibujoJefe(32, { cuerpo: '#6366f1', sombra: '#312e81', detalle: '#c7d2fe', ojo: '#f0abfc', cuernos: false, cola: true }));
    texturaProcedural(scene, 'jefe-rey', 48, 48, dibujoJefe(48, { cuerpo: '#6d28d9', sombra: '#2e1065', detalle: '#f5f5f4', ojo: '#ef4444', corona: true }));
  }
};

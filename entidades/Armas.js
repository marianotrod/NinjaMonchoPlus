// Armas.js
// Armas especiales: una sola por jugador. Tienen cooldown entre tiros y munición por nivel, que se recarga al empezar
// el siguiente. La misma arma suma munición; otra la reemplaza y vuelve a la munición base.
// Rebotan contra el escenario tantas veces como dice "rebotes" y el golpe siguiente las destruye (la bomba explota).
// Empujan las monedas y los talismanes que tocan, que salen como proyectiles de quien tiró (como con la katana).
//   shuriken: proyectil rápido que cae muy poco (FISICA.caidaShuriken).
//   bumeran:  va y vuelve y golpea varias veces. No se vence: dura hasta
//             que lo agarrás (tocándolo) o hasta que choca sin rebotes. Cada rebote arranca una ida nueva.
//   bomba:    rebota todo lo que quiera y explota por tiempo (o al tocar a un demonio); empuja todo lo que esté cerca.
import { BANDO, CONFIG, FISICA } from '../config.js';
import { proyectilVencido } from '../mundo/Mundo.js';
import { Sonido } from '../sistemas/Sonido.js';
import { crearGolpe, itemLanzado, resolverGolpe } from '../reglas/Resolvedor.js';

export const ARMAS = {
  shuriken: { icono: 'icono-shuriken', municion: 7, rebotes: 0, cooldown: 250, velocidad: 300, duracion: 4000 },
  bumeran: {
    icono: 'icono-bumeran', municion: 5, rebotes: 1, cooldown: 300, velocidad: 240, velocidadVuelta: 280, duracionIda: 900,
    aceleracionVuelta: 700,  // Al volver frena, da la vuelta y acelera hacia Moncho (px/s²): si lo esquivás, te pasa de largo
    agarre: 12,              // A qué distancia de Moncho lo agarra (px)
    // Busca la altura de Moncho con retraso, y así hace una curva: sigue (por segundo: más alto, más pegado) y
    // subida (px/s como máximo hacia arriba o hacia abajo)
    sigue: 3, subida: 140
  },
  bomba: {
    icono: 'icono-bomba', municion: 3, rebotes: Infinity, cooldown: 600, velocidadX: 160, velocidadY: -200, rebote: 0.4,
    espera: 2400, radio: 48, impulso: 300, impulsoMinimo: -150
  }
};

export const TIPOS_ARMA = Object.keys(ARMAS);

// La misma arma suma munición; otra la reemplaza con la munición base. Devuelve si era la misma.
export function equiparEnPartida(partida, j, tipo) {
  const actual = partida.armas[j];
  const misma = !!actual && actual.tipo === tipo;
  partida.armas[j] = { tipo, municion: ARMAS[tipo].municion + (misma ? actual.municion : 0) };
  return misma;
}

export function dispararArma(scene, ninja) {
  if (ninja.arma === 'bumeran' && ninja.bumeranActivo && ninja.bumeranActivo.active) return false;
  if (scene.time.now < ninja.proximoDisparo) return false;
  ninja.proximoDisparo = scene.time.now + ARMAS[ninja.arma].cooldown;

  const direccion = ninja.flipX ? -1 : 1;
  const datos = ARMAS[ninja.arma];
  const proyectil = crearProyectil(scene, ninja.arma, ninja.x + direccion * 8, ninja.y - 2, ninja);

  if (ninja.arma === 'shuriken') {
    proyectil.body.setAllowGravity(false);
    proyectil.body.setAccelerationY(FISICA.caidaShuriken);
    const angulo = Phaser.Math.DegToRad(FISICA.anguloShuriken);
    proyectil.setVelocity(direccion * datos.velocidad * Math.cos(angulo), -datos.velocidad * Math.sin(angulo));
    proyectil.play('shuriken');  // Gira en el dibujo; según hacia dónde va, se da vuelta
    proyectil.mira = 'derecha';
    Sonido.efecto(scene, 'snd-shuriken', 0.4);
  } else if (ninja.arma === 'bumeran') {
    proyectil.body.setAllowGravity(false);
    proyectil.setVelocityX(direccion * datos.velocidad);
    proyectil.play('bumeran');  // Gira en el dibujo; según hacia dónde va, se da vuelta
    proyectil.mira = 'derecha';
    proyectil.vuelta = false;
    ninja.bumeranActivo = proyectil;
    Sonido.efecto(scene, 'snd-shuriken', 0.3, { rate: 0.7 });
  } else {
    armarBomba(scene, proyectil, direccion * datos.velocidadX, datos.velocidadY);
    Sonido.beep(scene, 330, 0.1, 0.08, 'triangle');
  }

  const gratis = ninja.mods.municionGratis && Math.random() < CONFIG.PROB_MUNICION_GRATIS;
  if (!ninja.municionInfinita() && !gratis) ninja.municion--;
  return true;
}

function crearProyectil(scene, tipo, x, y, duenio) {
  const proyectil = scene.proyectiles.create(x, y, tipo);
  proyectil.bando = BANDO.JUGADORES;
  proyectil.body.setSize(16, 16);  // Todas las armas chocan con un cuadrado de 16x16
  proyectil.tipo = tipo;
  proyectil.duenio = duenio;
  proyectil.golpeados = new Set();
  proyectil.nacimiento = scene.time.now;
  proyectil.rebotesRestantes = ARMAS[tipo].rebotes + duenio.mods.rebotesExtra;
  proyectil.setBounce(1);  // No se tiñe: lleva aura y estela del color de a quién daña (mundo/Peligros.js)
  return proyectil;
}

function armarBomba(scene, bomba, vx, vy) {
  bomba.body.setAllowGravity(true);
  bomba.setVelocity(vx, vy);
  bomba.setBounce(ARMAS.bomba.rebote);
  bomba.play('bomba');  // La mecha largando chispas
  scene.time.delayedCall(ARMAS.bomba.espera, () => { if (bomba.active) scene.explotarBomba(bomba); });
}

// Pergamino: al morir el ninja suelta una bomba donde estaba
export function soltarBomba(scene, ninja) {
  armarBomba(scene, crearProyectil(scene, 'bomba', ninja.x, ninja.y, ninja), 0, -150);
}

// Un choque contra el escenario: gasta un rebote o, si no quedan, destruye el proyectil. Un mismo choque no cuenta
// dos veces aunque siga apoyado varios cuadros.
export function chocarProyectil(scene, proyectil) {
  const ahora = scene.time.now;
  if (ahora - (proyectil.ultimoChoque ?? -Infinity) < 120) return;
  proyectil.ultimoChoque = ahora;
  if (proyectil.rebotesRestantes > 0) {
    proyectil.rebotesRestantes--;
    if (proyectil.tipo === 'bumeran') nuevaIda(scene, proyectil);
    return;
  }
  if (proyectil.tipo === 'bomba') scene.explotarBomba(proyectil);
  else romperProyectil(scene, proyectil);
}

// El bumerán que rebota arranca una ida nueva, hacia donde lo mandó el rebote
function nuevaIda(scene, bumeran) {
  const { blocked, velocity } = bumeran.body;
  const direccion = blocked.left ? 1 : blocked.right ? -1 : (Math.sign(velocity.x) || 1);
  bumeran.vuelta = false;
  bumeran.nacimiento = scene.time.now;
  bumeran.golpeados.clear();
  bumeran.setVelocityX(direccion * ARMAS.bumeran.velocidad);
}

// Las armas que no explotan (shuriken, bumerán, cuchilla, flecha) se rompen con su efecto (arma_destruccion.png);
// lo demás desaparece sin más
const ARMAS_QUE_SE_ROMPEN = ['shuriken', 'bumeran', 'cuchilla', 'flechasamurai'];
export function romperProyectil(scene, proyectil) {
  if (!proyectil.active) return;
  if (ARMAS_QUE_SE_ROMPEN.includes(proyectil.texture.key) && scene.anims.exists('arma_destruccion')) {
    const efecto = scene.add.sprite(proyectil.x, proyectil.y, 'arma_destruccion').setDepth(proyectil.depth);
    efecto.setFlipX(proyectil.flipX);
    efecto.play('arma_destruccion');
    efecto.once('animationcomplete', () => efecto.destroy());
  }
  proyectil.destroy();
}

export function actualizarProyectiles(scene) {
  const ahora = scene.time.now;
  // Pergamino: también buscan lo demás que es tuyo mientras vuela: ítems empujados y demonios lanzados por el boulder
  scene.items.getChildren().forEach(item => { if (item.body && itemLanzado(item) && buscan(item.lanzador)) buscarDemonio(scene, item); });
  scene.enemigos.getChildren().forEach(enemigo => { if (enemigo.lanzado && buscan(enemigo.lanzado.duenio)) buscarDemonio(scene, enemigo); });
  scene.proyectiles.getChildren().slice().forEach(p => {
    if (p.orientar && p.body) p.setRotation(Math.atan2(p.body.velocity.y, p.body.velocity.x));  // La flecha apunta hacia donde va
    // Los que no giran se dan vuelta según hacia dónde van. mira: hacia dónde está dibujado
    if (p.mira && p.body && p.body.velocity.x !== 0) p.setFlipX((p.body.velocity.x < 0) === (p.mira === 'derecha'));
    if (p.bando === BANDO.DEMONIOS) {
      const termino = scene.conWrap ? proyectilVencido(p, ahora) : (p.x < -24 || p.x > 536 || p.y > 310 || p.y < -60);
      if (termino) p.destroy();
      return;
    }

    const fuera = !scene.conWrap && (p.x < -24 || p.x > 536 || p.y > 310 || p.y < -80);
    // Pergamino: todos tus proyectiles buscan al demonio más cercano (el bumerán, solo a la ida)
    if (buscan(p.duenio) && !p.vuelta) buscarDemonio(scene, p);

    if (p.tipo === 'bumeran') {
      const duenio = p.duenio;
      if (!duenio || !duenio.active) { p.destroy(); return; }
      if (!p.vuelta && (ahora - p.nacimiento > ARMAS.bumeran.duracionIda || fuera)) {
        p.vuelta = true;
        p.golpeados.clear(); // En la vuelta puede volver a golpear a los mismos objetivos
      }
      // Busca la altura de Moncho, a la ida y a la vuelta, sin llegar de golpe: dibuja una curva
      const { sigue, subida } = ARMAS.bumeran;
      p.setVelocityY(Phaser.Math.Clamp((duenio.y - 2 - p.y) * sigue, -subida, subida));
      if (p.vuelta) {
        const { aceleracionVuelta, velocidadVuelta, agarre } = ARMAS.bumeran;
        const vx = p.body.velocity.x + Math.sign(duenio.x - p.x) * aceleracionVuelta * scene.game.loop.delta / 1000;
        p.setVelocityX(Phaser.Math.Clamp(vx, -velocidadVuelta, velocidadVuelta));
        if (Phaser.Math.Distance.Between(p.x, p.y, duenio.x, duenio.y) < agarre) {
          duenio.bumeranActivo = null;
          p.destroy();
          return;
        }
      }
      return;
    }

    const vencido = scene.conWrap && proyectilVencido(p, ahora);
    const vieja = (p.tipo === 'shuriken' && ahora - p.nacimiento > ARMAS.shuriken.duracion)
      || (p.tipo === 'bolaCeleste' && ahora - p.nacimiento > CONFIG.BOLA_CELESTE_DURACION);
    if (fuera || vencido || vieja) p.destroy();
  });
}

const buscan = (duenio) => !!(duenio && duenio.mods && duenio.mods.proyectilesBuscan);

// Tuerce un poco la velocidad de lo que vuela hacia el demonio (o el jefe) más cercano que tenga adelante, sin cambiar
// su rapidez (CONFIG.PROYECTILES_BUSCAN)
function buscarDemonio(scene, p) {
  if (!p.body) return;
  const { radio, giro, cono } = CONFIG.PROYECTILES_BUSCAN;
  const { x: vx, y: vy } = p.body.velocity;
  const rapidez = Math.hypot(vx, vy);
  if (rapidez < 1) return;
  const rumbo = Math.atan2(vy, vx);
  const candidatos = scene.enemigos.getChildren().filter(e => e !== p && e.active && !e.muerto && !e.intocable);
  if (scene.jefe && scene.jefe.active) candidatos.push(scene.jefe);
  let objetivo = null;
  let mejor = radio;
  candidatos.forEach(e => {
    const distancia = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
    const desvio = Phaser.Math.Angle.Wrap(Math.atan2(e.y - p.y, e.x - p.x) - rumbo);
    if (distancia < mejor && Math.abs(desvio) <= Phaser.Math.DegToRad(cono)) {
      mejor = distancia;
      objetivo = e;
    }
  });
  if (!objetivo) return;
  const deseado = Math.atan2(objetivo.y - p.y, objetivo.x - p.x);
  const paso = Phaser.Math.DegToRad(giro) * scene.game.loop.delta / 1000;
  const nuevo = Phaser.Math.Angle.RotateTo(rumbo, deseado, paso);
  p.setVelocity(Math.cos(nuevo) * rapidez, Math.sin(nuevo) * rapidez);
}

// Un arma que toca una moneda o un talismán lo empuja hacia donde va (con la fuerza de la katana, FISICA.empujeItem) y
// lo vuelve un proyectil de quien tiró. Una vez por pasada: el bumerán lo puede volver a empujar a la vuelta.
export function empujarItem(scene, proyectil, item) {
  if (proyectil.golpeados.has(item)) return;
  proyectil.golpeados.add(item);
  const { fuerza, subidaMinima } = FISICA.empujeItem;
  const angulo = Math.atan2(proyectil.body.velocity.y, proyectil.body.velocity.x);
  const empuje = { vx: Math.cos(angulo) * fuerza, vy: Math.min(subidaMinima, Math.sin(angulo) * fuerza) };
  resolverGolpe(scene, item, crearGolpe('proyectil', { duenio: proyectil.duenio, empuje }));
}

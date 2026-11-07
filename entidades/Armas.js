// Armas.js
// Armas especiales: una sola por jugador. Tienen cooldown entre tiros y munición por nivel, que se recarga al empezar
// el siguiente. La misma arma suma munición; otra la reemplaza y vuelve a la munición base.
// Rebotan contra el escenario tantas veces como dice "rebotes" y el golpe siguiente las destruye (la bomba explota).
//   shuriken: proyectil rápido que cae muy poco (FISICA.caidaShuriken).
//   bumeran:  va y vuelve; arrastra talismanes y monedas hacia el jugador y golpea varias veces.
//   bomba:    tiro con rebote que explota por tiempo y empuja todo lo que esté cerca.
import { BANDO, CONFIG, FISICA } from '../config.js';
import { proyectilVencido } from '../mundo/Mundo.js';
import { colorDeJugador } from '../reglas/Resolvedor.js';
import { Sonido } from '../sistemas/Sonido.js';

export const ARMAS = {
  shuriken: { icono: 'icono-shuriken', municion: 7, rebotes: 0, cooldown: 250, velocidad: 300, giro: 900, duracion: 4000 },
  bumeran: {
    icono: 'icono-bumeran', municion: 5, rebotes: 2, cooldown: 300, velocidad: 240, velocidadVuelta: 280, giro: 720, duracionIda: 380
  },
  bomba: {
    icono: 'icono-bomba', municion: 3, rebotes: 1, cooldown: 600, velocidadX: 160, velocidadY: -200, rebote: 0.4, giro: 300,
    espera: 1200, radio: 48, impulso: 300, impulsoMinimo: -150
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
    proyectil.setVelocityX(direccion * datos.velocidad);
    proyectil.setAngularVelocity(datos.giro);
    Sonido.efecto(scene, 'snd-shuriken', 0.4);
  } else if (ninja.arma === 'bumeran') {
    proyectil.body.setAllowGravity(false);
    proyectil.setVelocityX(direccion * datos.velocidad);
    proyectil.setAngularVelocity(datos.giro);
    proyectil.vuelta = false;
    proyectil.arrastrados = [];
    ninja.bumeranActivo = proyectil;
    Sonido.efecto(scene, 'snd-shuriken', 0.3, { rate: 0.7 });
  } else {
    armarBomba(scene, proyectil, direccion * datos.velocidadX, datos.velocidadY);
    proyectil.setAngularVelocity(direccion * datos.giro);
    Sonido.beep(scene, 330, 0.1, 0.08, 'triangle');
  }

  const gratis = ninja.mods.municionGratis && Math.random() < CONFIG.PROB_MUNICION_GRATIS;
  if (!ninja.municionInfinita() && !gratis) ninja.municion--;
  return true;
}

function crearProyectil(scene, tipo, x, y, duenio) {
  const proyectil = scene.proyectiles.create(x, y, tipo);
  proyectil.bando = BANDO.JUGADORES;
  proyectil.body.setSize(10, 10); // El dibujo es de 16x16 pero el área de impacto es más chica (si no, roza el piso al tirar)
  proyectil.tipo = tipo;
  proyectil.duenio = duenio;
  proyectil.golpeados = new Set();
  proyectil.nacimiento = scene.time.now;
  proyectil.rebotesRestantes = ARMAS[tipo].rebotes + duenio.mods.rebotesExtra;
  proyectil.setBounce(1);
  proyectil.setTint(colorDeJugador(scene));
  return proyectil;
}

function armarBomba(scene, bomba, vx, vy) {
  bomba.body.setAllowGravity(true);
  bomba.setVelocity(vx, vy);
  bomba.setBounce(ARMAS.bomba.rebote);
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
    return;
  }
  if (proyectil.tipo === 'bomba') scene.explotarBomba(proyectil);
  else proyectil.destroy();
}

export function actualizarProyectiles(scene) {
  const ahora = scene.time.now;
  scene.proyectiles.getChildren().slice().forEach(p => {
    if (p.bando === BANDO.DEMONIOS) {
      const termino = scene.conWrap ? proyectilVencido(p, ahora) : (p.x < -24 || p.x > 536 || p.y > 310 || p.y < -60);
      if (termino) p.destroy();
      return;
    }

    const fuera = !scene.conWrap && (p.x < -24 || p.x > 536 || p.y > 310 || p.y < -80);

    if (p.tipo === 'bumeran') {
      const duenio = p.duenio;
      if (!duenio || !duenio.active) { soltarArrastrados(p); p.destroy(); return; }
      if (!p.vuelta && (ahora - p.nacimiento > ARMAS.bumeran.duracionIda || fuera)) {
        p.vuelta = true;
        p.golpeados.clear(); // En la vuelta puede volver a golpear a los mismos objetivos
      }
      if (p.vuelta) {
        const angulo = Math.atan2(duenio.y - p.y, duenio.x - p.x);
        p.setVelocity(Math.cos(angulo) * ARMAS.bumeran.velocidadVuelta, Math.sin(angulo) * ARMAS.bumeran.velocidadVuelta);
        if (Phaser.Math.Distance.Between(p.x, p.y, duenio.x, duenio.y) < 10) {
          soltarArrastrados(p);
          duenio.bumeranActivo = null;
          p.destroy();
          return;
        }
      }
      p.arrastrados = p.arrastrados.filter(item => item.active);
      p.arrastrados.forEach(item => item.body.reset(p.x, p.y));
      return;
    }

    const vencido = scene.conWrap && proyectilVencido(p, ahora);
    const vieja = (p.tipo === 'shuriken' && ahora - p.nacimiento > ARMAS.shuriken.duracion)
      || (p.tipo === 'bolaCeleste' && ahora - p.nacimiento > CONFIG.BOLA_CELESTE_DURACION);
    if (fuera || vencido || vieja) p.destroy();
  });
}

export function arrastrarItem(bumeran, item) {
  if (bumeran.tipo !== 'bumeran' || bumeran.arrastrados.includes(item)) return;
  bumeran.arrastrados.push(item);
}

function soltarArrastrados(bumeran) {
  (bumeran.arrastrados || []).forEach(item => {
    if (item.active) item.setVelocity(0, 0);
  });
  bumeran.arrastrados = [];
}

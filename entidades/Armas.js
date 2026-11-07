// Armas.js
// Armas especiales: una sola por jugador. Tienen cooldown entre tiros y munición por nivel, que se recarga al empezar
// el siguiente. La misma arma suma munición; otra la reemplaza y vuelve a la munición base.
// Rebotan contra el escenario tantas veces como dice "rebotes" y el golpe siguiente las destruye (la bomba explota).
//   shuriken: proyectil rápido que cae muy poco (FISICA.caidaShuriken).
//   bumeran:  va y vuelve; arrastra talismanes y monedas hacia el jugador y golpea varias veces.
//   bomba:    tiro con rebote que explota por tiempo y empuja todo lo que esté cerca.
import { BANDO, FISICA } from '../config.js';
import { proyectilVencido } from '../mundo/Mundo.js';
import { colorDeJugador } from '../reglas/Resolvedor.js';
import { Sonido } from '../sistemas/Sonido.js';

export const ARMAS = {
  shuriken: { icono: 'icono-shuriken', municion: 7, rebotes: 0, cooldown: 250, velocidad: 300, giro: 900, duracion: 1500 },
  bumeran: {
    icono: 'icono-bumeran', municion: 5, rebotes: 2, cooldown: 300, velocidad: 240, velocidadVuelta: 280, giro: 720, duracionIda: 380
  },
  bomba: {
    icono: 'icono-bomba', municion: 3, rebotes: 1, cooldown: 600, velocidadX: 160, velocidadY: -200, rebote: 0.4, giro: 300,
    espera: 1200, radio: 48, impulso: 300, impulsoMinimo: -150
  }
};

export const TIPOS_ARMA = Object.keys(ARMAS);

export function dispararArma(scene, ninja) {
  if (ninja.arma === 'bumeran' && ninja.bumeranActivo && ninja.bumeranActivo.active) return false;
  if (scene.time.now < ninja.proximoDisparo) return false;
  ninja.proximoDisparo = scene.time.now + ARMAS[ninja.arma].cooldown;

  const direccion = ninja.flipX ? -1 : 1;
  const datos = ARMAS[ninja.arma];
  const proyectil = scene.proyectiles.create(ninja.x + direccion * 8, ninja.y - 2, ninja.arma);
  proyectil.bando = BANDO.JUGADORES;
  proyectil.body.setSize(10, 10); // El dibujo es de 16x16 pero el área de impacto es más chica (si no, roza el piso al tirar)
  proyectil.tipo = ninja.arma;
  proyectil.duenio = ninja;
  proyectil.golpeados = new Set();
  proyectil.nacimiento = scene.time.now;
  proyectil.rebotesRestantes = datos.rebotes + ninja.mods.rebotesExtra;
  proyectil.setTint(colorDeJugador(scene));
  proyectil.setBounce(1);

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
    proyectil.body.setAllowGravity(true);
    proyectil.setVelocity(direccion * datos.velocidadX, datos.velocidadY);
    proyectil.setBounce(datos.rebote);
    proyectil.setAngularVelocity(direccion * datos.giro);
    scene.time.delayedCall(datos.espera, () => { if (proyectil.active) scene.explotarBomba(proyectil); });
    Sonido.beep(scene, 330, 0.1, 0.08, 'triangle');
  }

  if (!ninja.municionInfinita()) ninja.municion--;
  return true;
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
    if (fuera || vencido || (p.tipo === 'shuriken' && ahora - p.nacimiento > ARMAS.shuriken.duracion)) p.destroy();
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

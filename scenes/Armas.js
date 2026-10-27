// Armas.js
// Armas secundarias (GDD §6): una sola ranura por jugador; recoger otra caja reemplaza el arma y su munición.
//   shuriken: proyectil recto y rápido.
//   bumeran:  va y vuelve; arrastra talismanes y monedas hacia el jugador y golpea varias veces.
//   bomba:    tiro con rebote corto que explota y empuja todo lo que esté cerca.
import { Sonido } from './Sonido.js';

export const ARMAS = {
  shuriken: { icono: 'icono-shuriken', municion: 12 },
  bumeran: { icono: 'icono-bumeran', municion: 6 },
  bomba: { icono: 'icono-bomba', municion: 4 }
};

export const TIPOS_ARMA = Object.keys(ARMAS);

export function dispararArma(scene, ninja) {
  if (ninja.arma === 'bumeran' && ninja.bumeranActivo && ninja.bumeranActivo.active) return false;

  const direccion = ninja.flipX ? -1 : 1;
  const proyectil = scene.proyectilesJugador.create(ninja.x + direccion * 8, ninja.y, ninja.arma);
  proyectil.tipo = ninja.arma;
  proyectil.duenio = ninja;
  proyectil.golpeados = new Set();
  proyectil.nacimiento = scene.time.now;

  if (ninja.arma === 'shuriken') {
    proyectil.body.setAllowGravity(false);
    proyectil.setVelocityX(direccion * 300);
    proyectil.setAngularVelocity(900);
    Sonido.efecto(scene, 'snd-shuriken', 0.4);
  } else if (ninja.arma === 'bumeran') {
    proyectil.body.setAllowGravity(false);
    proyectil.setVelocityX(direccion * 240);
    proyectil.setAngularVelocity(720);
    proyectil.vuelta = false;
    proyectil.arrastrados = [];
    ninja.bumeranActivo = proyectil;
    Sonido.efecto(scene, 'snd-shuriken', 0.3, { rate: 0.7 });
  } else {
    proyectil.body.setAllowGravity(true);
    proyectil.setVelocity(direccion * 160, -200);
    proyectil.setBounce(0.4);
    proyectil.setAngularVelocity(direccion * 300);
    scene.time.delayedCall(1200, () => { if (proyectil.active) scene.explotarBomba(proyectil); });
    Sonido.beep(scene, 330, 0.1, 0.08, 'triangle');
  }

  if (!ninja.municionInfinita()) ninja.municion--;
  if (ninja.municion <= 0 && !ninja.municionInfinita()) ninja.arma = null;
  return true;
}

export function actualizarProyectiles(scene) {
  const ahora = scene.time.now;
  scene.proyectilesJugador.getChildren().slice().forEach(p => {
    const fuera = p.x < -24 || p.x > 536 || p.y > 310 || p.y < -80;

    if (p.tipo === 'bumeran') {
      const duenio = p.duenio;
      if (!duenio || !duenio.active) { soltarArrastrados(p); p.destroy(); return; }
      if (!p.vuelta && (ahora - p.nacimiento > 380 || fuera)) {
        p.vuelta = true;
        p.golpeados.clear(); // En la vuelta puede volver a golpear a los mismos objetivos
      }
      if (p.vuelta) {
        const angulo = Math.atan2(duenio.y - p.y, duenio.x - p.x);
        p.setVelocity(Math.cos(angulo) * 280, Math.sin(angulo) * 280);
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

    if (fuera || (p.tipo === 'shuriken' && ahora - p.nacimiento > 1500)) p.destroy();
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

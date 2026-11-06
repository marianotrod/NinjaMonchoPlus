// Resolvedor.js
// Todo contacto que hace algo es un golpe, y acá se decide qué provoca según las reglas de la fase, el bando y la protección.
// Un golpe es { tipo, bando, duenio, fuenteX, daño, direccion, empuje }:
//   tipo:      katana | proyectil | pisoton | explosion | contacto | fantasma
//   direccion: -1 o 1, para empujar con la fuerza propia de cada objetivo
//   empuje:    { vx, vy }, para los golpes que empujan distinto a cada objetivo (explosiones)
import { BANDO, CONFIG, FISICA } from '../config.js';
import { i18n } from '../i18n.js';
import { Sonido } from '../sistemas/Sonido.js';
import { GOLPE_AL_NINJA } from './Fases.js';

// normal: lo aturden y lo dañan. invulnerable: lo aturden, pero no recibe daño. intocable: no le pasa nada.
export const PROTECCION = { NORMAL: 'normal', INVULNERABLE: 'invulnerable', INTOCABLE: 'intocable' };

export function crearGolpe(tipo, datos = {}) {
  return { tipo, bando: BANDO.JUGADORES, daño: CONFIG.DAÑO_GOLPE[tipo] ?? 0, ...datos };
}

function empujeDe(golpe, fuerza) {
  return golpe.empuje ?? { vx: (golpe.direccion ?? 1) * fuerza.x, vy: fuerza.y };
}

function golpearNinja(escena, ninja, golpe) {
  if (golpe.bando === ninja.bando) {
    const { vx, vy } = empujeDe(golpe, FISICA.empujeNinja);
    ninja.empujar(vx, vy);
    return;
  }
  const { reglas } = escena;
  if (!reglas.jugable || escena.modoDiosActivo) return;
  if (ninja.muerto || ninja.eliminado) return;

  // El fantasma es la excepción: mata en cualquier fase y no le importa el parpadeo tras un golpe o un pisotón,
  // que el jugador podría provocar a propósito. Solo respeta la caída al aparecer.
  const esFantasma = golpe.tipo === 'fantasma';
  if (esFantasma ? ninja.isSpawning : ninja.proteccion === PROTECCION.INTOCABLE) return;
  const efecto = esFantasma ? GOLPE_AL_NINJA.VIDA : reglas.golpeAlNinja;
  if (efecto === GOLPE_AL_NINJA.NADA) return;

  if (efecto === GOLPE_AL_NINJA.VIDA && (esFantasma || ninja.proteccion === PROTECCION.NORMAL)) {
    // Sale despedido, atraviesa el escenario y cae fuera de la pantalla: recién ahí pierde la vida (jugadorCayoFuera)
    ninja.morir(golpe.fuenteX);
    escena.cameras.main.shake(250, 0.012);
    escena.alMorirNinja(ninja);
  } else if (ninja.aplicarDaño(golpe.fuenteX)) {
    escena.cameras.main.shake(150, 0.008);
    escena.mostrarTextoFlotante(ninja.x, ninja.y, i18n.t('ouch'), '#EF4444');
  } else {
    return;
  }
  if (reglas.hayTalismanes) escena.perderTalismanes(ninja);
}

function golpearEnemigo(escena, enemigo, golpe) {
  if (enemigo.muerto || golpe.bando === enemigo.bando) return;
  if (escena.reglas.enemigosVulnerables) {
    enemigo.hp -= golpe.daño;
    if (enemigo.hp <= 0) {
      escena.matarEnemigo(enemigo, golpe.duenio);
      return;
    }
  }
  if (golpe.tipo === 'pisoton') {
    enemigo.alSerPisado();
    return;
  }
  const { vx, vy } = empujeDe(golpe, FISICA.empujeEnemigo);
  enemigo.inmuneStun = escena.modsGlobal.enemigosInmunesStun;
  enemigo.aturdir(enemigo.config.duracionStun, vx, vy);
  if (golpe.tipo !== 'explosion') {
    Sonido.efecto(escena, 'snd-parry', 0.35);
    escena.efectoChispas(enemigo.x, enemigo.y, 0x7dd3fc);
  }
}

// Sin bando: talismanes y monedas, que solo se empujan
export function resolverGolpe(escena, objetivo, golpe) {
  if (objetivo.esJefe) {
    objetivo.recibirDaño(golpe.daño);
  } else if (objetivo.bando === BANDO.DEMONIOS) {
    golpearEnemigo(escena, objetivo, golpe);
  } else if (objetivo.bando === BANDO.JUGADORES) {
    golpearNinja(escena, objetivo, golpe);
  } else {
    const { vx, vy } = empujeDe(golpe, FISICA.empujeItem);
    objetivo.setVelocity(vx, vy);
  }
}

// Resolvedor.js
// Todo contacto que hace algo es un golpe, y acá se decide qué provoca según las reglas de la fase, el bando y la protección.
// Un golpe es { tipo, bando, duenio, fuenteX, daño, direccion, origen, empuje }:
//   tipo:      katana | proyectil | pisoton | explosion | contacto | trampa | llama | fantasma | boulder
//   lanza:     boulder nivel 2: el enemigo sale disparado como proyectil en vez de recibir el golpe
//   direccion: -1 o 1, para empujar con la fuerza propia de cada objetivo
//   origen:    desde dónde empuja: los ítems se alejan de ese punto
//   empuje:    { vx, vy }, para los golpes que empujan distinto a cada objetivo (explosiones)
import { BANDO, COLORES, CONFIG, FISICA } from '../config.js';
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

function empujeDesde(origen, objetivo) {
  const { fuerza, subidaMinima } = FISICA.empujeItem;
  const angulo = Math.atan2(objetivo.y - origen.y, objetivo.x - origen.x);
  return { vx: Math.cos(angulo) * fuerza, vy: Math.min(subidaMinima, Math.sin(angulo) * fuerza) };
}

// Un proyectil o una explosión de un jugador solo golpea a un jugador si algún modificador lo permite.
// Con fuego amigo todo es negro y golpea a todos, incluido quien lo lanzó.
export function golpeaAliado(escena, golpe, ninja) {
  if (golpe.tipo !== 'proyectil' && golpe.tipo !== 'explosion') return false;
  const { fuegoAmigo, dañoPropio } = escena.modsGlobal;
  return fuegoAmigo || (golpe.duenio === ninja && dañoPropio);
}

// El color de lo que lanza un jugador
export const colorDeJugador = (escena) => (escena.modsGlobal.fuegoAmigo ? COLORES.TODOS : COLORES.JUGADORES);

function golpearNinja(escena, ninja, golpe) {
  if (golpe.bando === ninja.bando && !golpeaAliado(escena, golpe, ninja)) {
    if (golpe.tipo === 'proyectil') return;
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
  if (esFantasma ? ninja.apareciendo : ninja.proteccion === PROTECCION.INTOCABLE) return;
  const efecto = esFantasma ? GOLPE_AL_NINJA.VIDA : reglas.golpeAlNinja;
  if (efecto === GOLPE_AL_NINJA.NADA) return;

  let muere = efecto === GOLPE_AL_NINJA.VIDA && (esFantasma || ninja.proteccion === PROTECCION.NORMAL);
  // Pergamino: el escudo se gasta y salva de una muerte. Al fantasma no le importa.
  if (muere && !esFantasma && ninja.mods.escudos > 0) {
    ninja.mods.escudos--;
    escena.mostrarTextoFlotante(ninja.x, ninja.y - 16, i18n.t('escudo_usado'), '#93C5FD');
    muere = false;
  }

  if (muere) {
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
  if (enemigo.muerto || enemigo.intocable || golpe.bando === enemigo.bando) return;
  // Pergamino: el primer demonio del nivel tiene un escudo que se rompe con el primer golpe
  if (enemigo.escudo) {
    enemigo.romperEscudo();
    escena.efectoChispas(enemigo.x, enemigo.y, 0x93c5fd);
    return;
  }
  // Samurái: hasta que no está aturdido, la katana rebota y lo demás solo lo aturde
  if (enemigo.config.necesitaStun && !enemigo.aturdido) {
    if (golpe.tipo === 'katana') {
      Sonido.efecto(escena, 'snd-parry', 0.5, { rate: 0.7 });
      escena.efectoChispas(enemigo.x, enemigo.y, 0xffffff);
      if (golpe.duenio) golpe.duenio.empujar(-(golpe.direccion ?? 1) * 150, -100);
      return;
    }
    const { vx, vy } = empujeDe(golpe, FISICA.empujeEnemigo);
    enemigo.aturdir(enemigo.config.duracionStun, golpe.tipo === 'pisoton' ? 0 : vx, golpe.tipo === 'pisoton' ? 100 : vy);
    escena.efectoChispas(enemigo.x, enemigo.y, 0x7dd3fc);
    return;
  }
  if (golpe.lanza) {
    escena.lanzarEnemigo(enemigo, golpe);
    return;
  }
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

// Un ítem empujado pasa a ser un proyectil de quien lo empujó, hasta que frena
function lanzarItem(escena, item, golpe) {
  const { vx, vy } = golpe.empuje ?? empujeDesde(golpe.origen, item);
  item.setVelocity(vx, vy);
  item.lanzador = golpe.duenio ?? null;
  item.golpeados = new Set();
  if (item.lanzador) item.setTint(colorDeJugador(escena));
}

export const itemLanzado = (item) =>
  !!item.lanzador && Math.hypot(item.body.velocity.x, item.body.velocity.y) >= FISICA.velocidadItemLanzado;

// Sin bando: talismanes y monedas
export function resolverGolpe(escena, objetivo, golpe) {
  if (objetivo.esJefe) {
    objetivo.recibirDaño(golpe.daño);
  } else if (objetivo.bando === BANDO.DEMONIOS) {
    golpearEnemigo(escena, objetivo, golpe);
  } else if (objetivo.bando === BANDO.JUGADORES) {
    golpearNinja(escena, objetivo, golpe);
  } else {
    lanzarItem(escena, objetivo, golpe);
  }
}

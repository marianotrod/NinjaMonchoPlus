// Rescate.js
// Un jugador que se quedó sin vidas se puede rescatar en el nivel SIGUIENTE. Un poco después de que aparece el que
// sigue vivo, cae una llave y una jaula: de dos puntos de rescate del mapa al azar (objeto "Rescate" del editor) o, si
// el mapa no tiene, la llave desde el spawn del vivo y la jaula desde el del otro. Quien lleva la llave a la jaula lo libera:
// vuelve con CONFIG.RESCATE.vidas. Si quien lleva la llave recibe un golpe, la suelta. Si el nivel termina sin rescate,
// se intenta otra vez en el siguiente. Todo lo que se calibra está en CONFIG.RESCATE.
import { CONFIG } from '../config.js';
import { EVENTOS } from '../datos/Eventos.js';
import { i18n } from '../i18n.js';
import { Sonido } from '../sistemas/Sonido.js';

// Se llama al crear el nivel, con los jugadores ya creados
export function prepararRescate(escena) {
  escena.rescate = null;
  if (!CONFIG.RESCATE.activo || escena.esSala || escena.cantidadJugadores < 2) return;
  const muertos = escena.jugadores.filter(j => j.eliminado);
  const vivos = escena.jugadores.filter(j => !j.eliminado);
  if (muertos.length !== 1 || vivos.length !== 1) return;

  escena.grupoRescate = escena.physics.add.group();
  escena.physics.add.collider(escena.grupoRescate, escena.bloquesFisicos);
  escena.rescate = { vivo: vivos[0], muerto: muertos[0], programado: false, llave: null, jaula: null, portador: null };
}

// Cada cuadro: programa la caída cuando el vivo ya tocó el piso, y la llave sigue a quien la lleva
export function actualizarRescate(escena) {
  const r = escena.rescate;
  if (!r) return;
  if (!r.programado && !r.vivo.apareciendo) {
    r.programado = true;
    escena.time.delayedCall(CONFIG.RESCATE.espera, () => soltarLlaveYJaula(escena));
  }
  if (r.portador && r.llave) r.llave.setPosition(r.portador.x, r.portador.y - 14);
}

function soltarLlaveYJaula(escena) {
  const r = escena.rescate;
  if (!r || r.llave || escena.rescate !== r) return;
  // Dos puntos de rescate distintos al azar; lo que falte sale de los spawns de los jugadores
  const puntos = Phaser.Utils.Array.Shuffle([...(escena.puntosRescate || [])]);
  const desdeLlave = puntos[0] ?? escena.spawnDe(r.vivo);
  const desdeJaula = puntos[1] ?? escena.spawnDe(r.muerto);
  r.llave = escena.grupoRescate.create(desdeLlave.x, desdeLlave.y, 'llave').setDepth(20);
  r.llave.setBounce(0.3);
  r.jaula = escena.grupoRescate.create(desdeJaula.x, desdeJaula.y, 'jaula').setDepth(9);
  // Adentro de la jaula se ve al compañero
  r.preso = escena.add.sprite(r.jaula.x, r.jaula.y, r.muerto.texture.key, 9).setDepth(8).setAlpha(0.7);
  if (!escena.conWrap) [r.llave, r.jaula].forEach(objeto => objeto.setCollideWorldBounds(true));

  escena.jugadores.forEach(jugador => {
    escena.physics.add.overlap(jugador, r.llave, () => agarrarLlave(escena, jugador));
    escena.physics.add.overlap(jugador, r.jaula, () => abrirJaula(escena, jugador));
  });
  escena.mostrarTextoFlotante(r.llave.x, Math.max(16, r.llave.y + 24), i18n.t('rescate_llave'), '#FBBF24');
  Sonido.beep(escena, 660, 0.1, 0.1, 'triangle');
}

const puedeActuar = (jugador) => !jugador.eliminado && !jugador.muerto && !jugador.apareciendo;

function agarrarLlave(escena, jugador) {
  const r = escena.rescate;
  if (!r || r.portador || !puedeActuar(jugador) || jugador === r.muerto) return;
  if (escena.time.now < (r.libreDesde ?? 0)) return;  // Recién soltada: que no se vuelva a pegar al mismo instante
  r.portador = jugador;
  r.llave.body.enable = false;
  Sonido.beep(escena, 880, 0.08, 0.1);
}

// Con el reloj en cero nadie reaparece: tampoco por un rescate (salvo que CONFIG.RESCATE.conFantasma lo permita)
function abrirJaula(escena, jugador) {
  const r = escena.rescate;
  if (!r || r.portador !== jugador || !puedeActuar(jugador) || !escena.reglas.jugable) return;
  if (escena.persecucion && !CONFIG.RESCATE.conFantasma) return;

  const { x, y } = r.jaula;
  escena.efectoChispas(x, y, 0xfde047);
  [r.llave, r.jaula, r.preso].forEach(objeto => objeto.destroy());
  escena.rescate = null;

  escena.partida.vidas[r.muerto.indice] = CONFIG.RESCATE.vidas;
  escena.events.emit(EVENTOS.VIDAS, escena.partida.vidas);
  // Vuelve desde su spawn, como al reaparecer (intocable un rato al tocar el piso)
  r.muerto.revivir(escena.spawnDe(r.muerto));
  escena.events.emit(EVENTOS.BANNER, { titulo: `${i18n.jugador(r.muerto.indice)} ${i18n.t('rescatado')}`, color: '#4ADE80', duracion: 1400, chico: true });
  Sonido.beep(escena, 784, 0.1, 0.1, 'triangle');
  escena.time.delayedCall(90, () => Sonido.beep(escena, 1047, 0.18, 0.1, 'triangle'));
}

// Quien lleva la llave la suelta con un golpe o al morir: cae desde donde estaba
export function soltarLlave(escena, jugador) {
  const r = escena.rescate;
  if (!r || r.portador !== jugador || !CONFIG.RESCATE.soltarConGolpe) return;
  liberarLlave(escena, jugador, jugador.flipX ? 60 : -60, -160);
}

// Con la llave en la mano no se ataca ni se dispara: intentarlo la arroja hacia adelante. Devuelve si la arrojó.
export function arrojarLlave(escena, jugador) {
  const r = escena.rescate;
  if (!r || r.portador !== jugador) return false;
  const { x, y } = CONFIG.RESCATE.arrojar;
  liberarLlave(escena, jugador, (jugador.flipX ? -1 : 1) * x, y);
  return true;
}

function liberarLlave(escena, jugador, vx, vy) {
  const r = escena.rescate;
  r.portador = null;
  r.libreDesde = escena.time.now + 600;
  r.llave.body.enable = true;
  r.llave.body.reset(jugador.x, jugador.y - 14);
  r.llave.setVelocity(vx, vy);
}

// La llave suelta y la jaula: la katana y las explosiones las empujan
export function objetosSueltos(escena) {
  const r = escena.rescate;
  if (!r || !r.llave) return [];
  return [r.llave, r.jaula].filter(objeto => objeto.active && objeto.body.enable);
}

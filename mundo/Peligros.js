// Peligros.js
// Todo lo que vuela y daña lleva un aura de llama y deja una estela, las dos del color de a quién daña:
//   rosa neón: a los jugadores (proyectiles de enemigos, bolas de fuego)
//   azul eléctrico: a los demonios (lo que tira o empuja un jugador)
//   negro-violeta: a todos (lo de un jugador con fuego amigo o daño propio)
// Vale para los proyectiles, los ítems lanzados y los enemigos lanzados por el boulder. Cuando deja de ser peligroso
// (un ítem que frena o se pisa), pierde las dos y vuelve a su capa.
// El aura es graficos/aura.png (blanca: se tiñe acá). Colores en COLORES_PELIGRO; se apagan en FISICA.auraPeligro y estelaPeligro.
import { BANDO, COLORES_PELIGRO, FISICA } from '../config.js';
import { itemLanzado } from '../reglas/Resolvedor.js';

// Capas de dibujo: el peligro va arriba de su aura y su estela, y las tres arriba del fondo y del mapa
const CAPA_RASTRO = 3;
const CAPA_PELIGRO = 4;

// bando: el de quien lo lanzó
export function colorDePeligro(escena, bando) {
  if (bando === BANDO.DEMONIOS) return COLORES_PELIGRO.A_JUGADORES;
  const { fuegoAmigo, dañoPropio } = escena.modsGlobal;
  return fuegoAmigo || dañoPropio ? COLORES_PELIGRO.A_TODOS : COLORES_PELIGRO.A_DEMONIOS;
}

// Por grupo, el bando de quien volvió peligroso al objeto, o null si ahora no daña
const BANDO_DEL_PELIGRO = [
  ['proyectiles', p => p.bando],
  ['items', item => (itemLanzado(item) ? item.lanzador.bando ?? BANDO.JUGADORES : null)],
  ['enemigos', enemigo => (enemigo.lanzado ? enemigo.lanzado.duenio?.bando ?? BANDO.JUGADORES : null)]
];

export function marcarPeligros(escena) {
  BANDO_DEL_PELIGRO.forEach(([grupo, bandoDe]) => escena[grupo].getChildren().forEach(objeto => {
    const bando = objeto.active ? bandoDe(objeto) : null;
    if (bando) {
      const color = colorDePeligro(escena, bando);
      seguirAura(escena, objeto, color);
      dejarEstela(escena, objeto, color);
    } else if (objeto.aura !== undefined) {
      apagar(objeto);
    }
  }));
}

function seguirAura(escena, objeto, color) {
  if (objeto.aura === undefined) {
    objeto.capaOriginal = objeto.depth;
    objeto.setDepth(CAPA_PELIGRO);
    objeto.aura = null;
    objeto.once('destroy', () => apagar(objeto));
  }
  const { activa, alfa } = FISICA.auraPeligro;
  if (!activa) return;
  if (!objeto.aura) objeto.aura = escena.add.sprite(objeto.x, objeto.y, 'aura').play('aura').setAlpha(alfa).setDepth(CAPA_RASTRO);
  objeto.aura.setPosition(objeto.x, objeto.y).setTint(color);
}

function dejarEstela(escena, objeto, color) {
  const { activa, cada, dura, alfa } = FISICA.estelaPeligro;
  if (!activa || escena.time.now < (objeto.proximaEstela ?? 0)) return;
  objeto.proximaEstela = escena.time.now + cada;
  const copia = escena.add.image(objeto.x, objeto.y, objeto.texture.key, objeto.frame.name)
    .setFlipX(objeto.flipX).setRotation(objeto.rotation).setTintFill(color).setAlpha(alfa).setDepth(CAPA_RASTRO);
  escena.tweens.add({ targets: copia, alpha: 0, scale: 0.6, duration: dura, onComplete: () => copia.destroy() });
}

function apagar(objeto) {
  if (objeto.aura) objeto.aura.destroy();
  if (objeto.active && objeto.capaOriginal !== undefined) objeto.setDepth(objeto.capaOriginal);
  delete objeto.aura;
  delete objeto.capaOriginal;
}

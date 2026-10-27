// Pactos.js
// Pergaminos de Pacto (GDD §8): cada uno combina una ventaja con una desventaja y dura un solo nivel.
// "jugador" afecta solo a quien lo eligió; "global" afecta a toda la partida en el nivel siguiente.

export const PACTOS = [
  { id: 'velocidad', jugador: { velocidad: 1.3 }, global: { tiempoExtra: -10 } },
  { id: 'fortuna', jugador: {}, global: { multPuntos: 2, velProyectiles: 2 } },
  { id: 'filo', jugador: { municionInfinitaCaceria: true }, global: { enemigosInmunesStun: true } },
  { id: 'ligero', jugador: { salto: 1.25, knockback: 1.6 }, global: {} }
];

export const MODS_JUGADOR_BASE = { velocidad: 1, salto: 1, knockback: 1, municionInfinitaCaceria: false };
export const MODS_GLOBAL_BASE = { tiempoExtra: 0, multPuntos: 1, velProyectiles: 1, enemigosInmunesStun: false };

export function pactosVacios() {
  return { global: { ...MODS_GLOBAL_BASE }, jugadores: [{ ...MODS_JUGADOR_BASE }, { ...MODS_JUGADOR_BASE }] };
}

// Suma un pacto a los modificadores: los tiempos se suman, los multiplicadores se multiplican y los booleanos se acumulan.
function combinar(destino, origen) {
  Object.entries(origen).forEach(([clave, valor]) => {
    if (typeof valor === 'boolean') destino[clave] = destino[clave] || valor;
    else if (clave === 'tiempoExtra') destino[clave] += valor;
    else destino[clave] *= valor;
  });
}

export function aplicarPacto(pactos, pacto, indiceJugador) {
  combinar(pactos.jugadores[indiceJugador], pacto.jugador);
  combinar(pactos.global, pacto.global);
}

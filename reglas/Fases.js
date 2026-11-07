// Fases.js
// Qué vale en cada fase del nivel. El resto del código consulta esta tabla en lugar de preguntar en qué fase está.
export const GOLPE_AL_NINJA = { NADA: 'nada', ATURDE: 'aturde', VIDA: 'vida' };
export const RECOMIENZO = { NIVEL: 'nivel', FASE: 'fase' };

const { NADA, ATURDE, VIDA } = GOLPE_AL_NINJA;
const { NIVEL, FASE } = RECOMIENZO;

const BASE = {
  jugable: false,               // Corren el ninja, los enemigos y los golpes
  enemigosVulnerables: false,   // Los golpes les restan vida; si no, solo los aturden
  golpeAlNinja: NADA,
  hayTalismanes: false,         // Se juntan talismanes: caen, se recogen y se pierden con los golpes
  aparecenEnemigos: false,      // Aparecen enemigos por tiempo
  cuentaBajas: false,           // Matar enemigos acerca el fin de la fase
  invocaAyudantes: false,       // El jefe puede invocar enemigos
  escupeFuego: false,           // Los tiles de fuego escupen bolas
  brilloInmortal: false,        // Ninjas y enemigos brillan en dorado: en esta fase no pueden morir
  soloBasico: false,            // Sin movimientos especiales ni armas (la sala de pergaminos)
  terminaConElTiempo: false,    // Al llegar a cero termina, sin fantasma (la sala)
  // Al acabarse el tiempo aparecen los fantasmas y nadie reaparece. Esto es lo que se repite si no queda nadie en pie.
  recomienzoPorFantasma: null
};

const REGLAS = {
  intro: { ...BASE, jugable: true, golpeAlNinja: ATURDE, brilloInmortal: true },
  recoleccion: {
    ...BASE, jugable: true, golpeAlNinja: ATURDE, hayTalismanes: true, aparecenEnemigos: true, escupeFuego: true,
    recomienzoPorFantasma: NIVEL, brilloInmortal: true
  },
  transicion: { ...BASE, jugable: true, enemigosVulnerables: true },
  sala: { ...BASE, jugable: true, soloBasico: true, terminaConElTiempo: true },
  caceria: { ...BASE, jugable: true, enemigosVulnerables: true, golpeAlNinja: VIDA, cuentaBajas: true, escupeFuego: true, recomienzoPorFantasma: FASE },
  jefe: { ...BASE, jugable: true, enemigosVulnerables: true, golpeAlNinja: VIDA, invocaAyudantes: true, escupeFuego: true, recomienzoPorFantasma: NIVEL }
};

export const reglasDe = (fase) => REGLAS[fase] ?? BASE;

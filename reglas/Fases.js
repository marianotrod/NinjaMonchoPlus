// Fases.js
// Qué vale en cada fase del nivel. El resto del código consulta esta tabla en lugar de preguntar en qué fase está.
export const GOLPE_AL_NINJA = { NADA: 'nada', ATURDE: 'aturde', VIDA: 'vida' };
export const AL_ACABARSE_EL_TIEMPO = { FANTASMA: 'fantasma', FIN_CACERIA: 'finCaceria' };

const { NADA, ATURDE, VIDA } = GOLPE_AL_NINJA;
const { FANTASMA, FIN_CACERIA } = AL_ACABARSE_EL_TIEMPO;

const BASE = {
  jugable: false,               // Corren el ninja, los enemigos y los golpes
  enemigosVulnerables: false,   // Los golpes les restan vida; si no, solo los aturden
  golpeAlNinja: NADA,
  hayTalismanes: false,         // Se juntan talismanes: caen, se recogen y se pierden con los golpes
  aparecenEnemigos: false,      // Aparecen enemigos por tiempo
  cuentaBajas: false,           // Matar enemigos acerca el fin de la fase
  invocaAyudantes: false,       // El jefe puede invocar enemigos
  alAcabarseElTiempo: null
};

const REGLAS = {
  intro: { ...BASE, jugable: true, golpeAlNinja: ATURDE },
  recoleccion: {
    ...BASE, jugable: true, golpeAlNinja: ATURDE, hayTalismanes: true, aparecenEnemigos: true, alAcabarseElTiempo: FANTASMA
  },
  transicion: { ...BASE, jugable: true, enemigosVulnerables: true },
  caceria: { ...BASE, jugable: true, enemigosVulnerables: true, golpeAlNinja: VIDA, cuentaBajas: true, alAcabarseElTiempo: FIN_CACERIA },
  jefe: { ...BASE, jugable: true, enemigosVulnerables: true, golpeAlNinja: VIDA, invocaAyudantes: true, alAcabarseElTiempo: FANTASMA }
};

export const reglasDe = (fase) => REGLAS[fase] ?? BASE;

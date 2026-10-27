// Bestiario.js
// Cada enemigo combina rasgos de comportamiento. nivelMinimo indica desde qué nivel puede aparecer
// y peso, qué tan seguido sale respecto de los demás.
export const Bestiario = {
    'demonio_saltarin': {
        textura: 'demonio',
        framesVuelo: true,
        hp: 1,
        costoIA: 1,
        nivelMinimo: 1,
        peso: 4,
        duracionStun: 1500,
        // Acá definimos qué rasgos tiene encendidos y sus parámetros
        rasgos: {
            saltarin: {
                activo: true,
                velXMin: 45,
                velXMax: 100,
                reboteYMin: -100,
                reboteYMax: -220
            },
            caminante: { activo: false },
            volador: { activo: false },
            lanzador: { activo: false },
            acorazado: { activo: false }
        }
    },
    // Patrullero terrestre: camina y da la vuelta en paredes y bordes de plataforma
    'demonio_caminante': {
        textura: 'demonio',
        framesVuelo: true,
        hp: 1,
        costoIA: 1,
        nivelMinimo: 2,
        peso: 3,
        duracionStun: 2000,
        rasgos: {
            saltarin: { activo: false },
            caminante: { activo: true, velocidadX: 60 },
            volador: { activo: false },
            lanzador: { activo: false },
            acorazado: { activo: false }
        }
    },
    // Espíritu volador: flota en ondas, ignora plataformas y busca la altura del jugador
    'espiritu_volador': {
        textura: 'volador',
        framesVuelo: false,
        hp: 1,
        costoIA: 1,
        nivelMinimo: 3,
        peso: 2,
        duracionStun: 1200,
        rasgos: {
            saltarin: { activo: false },
            caminante: { activo: false },
            volador: { activo: true, velocidadX: 50, amplitud: 10, seguimiento: 0.012 },
            lanzador: { activo: false },
            acorazado: { activo: false }
        }
    },
    // Lanzador estático: se queda en su plataforma y tira bolas de fuego en parábola
    'lanzador': {
        textura: 'lanzador',
        framesVuelo: false,
        hp: 1,
        costoIA: 2,
        nivelMinimo: 4,
        peso: 1,
        duracionStun: 2000,
        rasgos: {
            saltarin: { activo: false },
            caminante: { activo: false },
            volador: { activo: false },
            lanzador: { activo: true, intervalo: 2600, intervaloEnfurecido: 1500, velocidad: 150 },
            acorazado: { activo: false }
        }
    }
};

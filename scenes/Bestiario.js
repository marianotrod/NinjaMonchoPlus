// Bestiario.js
export const Bestiario = {
    'demonio_saltarin': {
        textura: 'demonio',
        hp: 1,
        costoIA: 1,
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
            acorazado: { activo: false }
        }
    },
    'demonio_caminante': {
        textura: 'demonio',
        hp: 1,
        costoIA: 1,
        rasgos: {
            saltarin: { activo: false },
            caminante: { activo: true, velocidadX: 60 },
            acorazado: { activo: false }
        }
    }
};
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
            lanzador: { activo: false }
        }
    },
    // Patrullero terrestre simple: camina y da la vuelta en paredes y bordes de plataforma.
    // Ya no sale al azar (peso 0): lo reemplazó el esqueleto. Queda para las pruebas y para usarlo a mano.
    'demonio_caminante': {
        textura: 'demonio',
        framesVuelo: true,
        hp: 1,
        costoIA: 1,
        nivelMinimo: 2,
        peso: 0,
        duracionStun: 2000,
        rasgos: {
            saltarin: { activo: false },
            caminante: { activo: true, velocidadX: 60 },
            volador: { activo: false },
            lanzador: { activo: false }
        }
    },
    // Esqueleto: camina, a veces frena, a veces salta un par de tiles (así sube y no se traba), a veces baja de una
    // pasarela y de vez en cuando tira una cuchilla hacia adelante, avisando antes con un cuadro.
    // En un tile suelto no intenta caminar: solo se da vuelta.
    'esqueleto': {
        textura: 'esqueleto',
        cuadros: true,
        hp: 1,
        costoIA: 1,
        nivelMinimo: 2,
        peso: 3,
        duracionStun: 2000,
        rasgos: {
            saltarin: { activo: false },
            caminante: {
                activo: true, velocidadX: 55,
                gravedad: 600,                 // Gravedad propia, para que el salto sea corto y firme
                decision: [700, 1500],         // Cada cuánto decide qué hacer (ms, al azar entre los dos)
                pesos: { seguir: 5, pausa: 2, salto: 2, bajar: 1, lanzar: 1 },
                pausa: 900,                    // Lo que se queda quieto (ms)
                salto: -260,                   // Unos 2,5 tiles
                // La cuchilla va como el shuriken de Moncho: derecho, girando y cayendo apenas. Con la animación
                // 'lanzar' el aviso dura lo que tarda en llegar a su último cuadro; sin ella, 'aviso' (ms).
                lanza: { aviso: 450, vx: 160, caida: 10, giro: 900 },  // caida: px/s², más baja que la del shuriken porque va más lento
                risa: 1500                     // Lo que se ríe cuando mata a un ninja (ms)
            },
            volador: { activo: false },
            lanzador: { activo: false }
        }
    },
    // Samurái: camina como el esqueleto pero no tira nada. Si un ninja pasa por delante, a su altura, se prepara y
    // corre hacia adelante. La katana no le hace nada: primero hay que aturdirlo (proyectil, explosión o pisotón).
    'samurai': {
        textura: 'samurai',
        cuadros: true,
        hp: 1,
        costoIA: 2,
        nivelMinimo: 3,
        peso: 2,
        duracionStun: 2500,
        necesitaStun: true,
        rasgos: {
            saltarin: { activo: false },
            caminante: {
                activo: true, velocidadX: 50,
                gravedad: 600,
                decision: [700, 1500],
                pesos: { seguir: 5, pausa: 2, salto: 2, bajar: 1 },
                pausa: 900,
                salto: -260,
                carga: { distancia: 128, aviso: 350, velocidad: 240, duracion: 700, espera: 1500 },
                // Cada tanto se da vuelta hacia el ninja más cercano y tira una flecha en arco hacia adelante
                // (sube empinada y cae). intervalo: cada cuánto (ms, al azar entre los dos); gravedad: la suya, más la del mundo
                arco: { intervalo: [2500, 4500], vx: 130, vy: -230, gravedad: 300 },
                risa: 1500
            },
            volador: { activo: false },
            lanzador: { activo: false }
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
            lanzador: { activo: false }
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
            lanzador: { activo: true, intervalo: 2600, intervaloEnfurecido: 1500 }
        }
    }
};

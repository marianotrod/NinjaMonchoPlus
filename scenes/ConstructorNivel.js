export default class ConstructorNivel {
    static construir(scene) {
        scene.catalogoPiezas = {
            'CR01TL': { frame: 0,  tipo: 'solido' },   
            'CR01TR': { frame: 1,  tipo: 'solido' },   
            'CR01BL': { frame: 10, tipo: 'solido' },   
            'CR01BR': { frame: 11, tipo: 'solido' },  
            'CR02TL': { frame: 2,  tipo: 'solido' },   
            'CR02TR': { frame: 3,  tipo: 'solido' },   
            'CR02BL': { frame: 12, tipo: 'solido' },   
            'CR02BR': { frame: 13, tipo: 'solido' }, 
            'CP01TC': { frame: 4,  tipo: 'solido' },   
            'CP02TC': { frame: 14, tipo: 'solido' }, 
            'PP01TC': { frame: 15, tipo: 'fondo' }, 
            'PP02TC': { frame: 16, tipo: 'fondo' }, 
            'PP03TC': { frame: 17, tipo: 'fondo' }, 
            'CH01TC': { frame: 40, tipo: 'pasarela' },
            'CH02TC': { frame: 41, tipo: 'pasarela' },
            'CH03TC': { frame: 42, tipo: 'pasarela' },
            'CH01CC': { frame: 50, tipo: 'fondo' },
            'CH02CC': { frame: 51, tipo: 'fondo' },
            'CH03CC': { frame: 52, tipo: 'fondo' },
            'CH04CC': { frame: 53, tipo: 'fondo' },
            'CH01BC': { frame: 60, tipo: 'fondo' },
            'CH02BC': { frame: 61, tipo: 'fondo' },   
            'CH03BC': { frame: 62, tipo: 'fondo' }
        };

        scene.bloquesFisicos = scene.physics.add.staticGroup();

        const _ = '';
        const L = 'CR01TL', R = 'CR01TR', P = 'CP01TC'; 
        const H1 = 'CH01TC', H2 = 'CH02TC', H3 = 'CH03TC'; 
        const M1 = 'M1'; 
        const C2 = 'C2'; 
        
        let spawnMonchoX = 240; 
        let spawnCoopX = 272;   

        // En el futuro, este array puede venir de un JSON externo según el nivel
        const mapaNivel = [
            /* -02 */ [L,_,_,_,_,M1,_,_,_,_,_,_,_,_,_,_,_,_,C2,_,_,_,_,_,_,_,_,_,_,_,_,R], 
            /* -01 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  00 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  01 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  02 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  03 */ [L,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,_,R],
            /*  04 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  05 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  06 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  07 */ [L,_,_,H1,H2,H3,_,_,_,_,_,_,_,H1,H2,H2,H3,_,_,_,_,_,_,_,H1,H2,H3,_,_,_,_,R],
            /*  08 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  09 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  10 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  11 */ [L,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,_,_,_,H1,H2,H2,H2,H3,_,_,_,_,_,_,_,R],
            /*  12 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  13 */ [L,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  14 */ [L,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  15 */ [L,_,_,_,_,_,_,_,_,_,_,P,P,P,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  16 */ [L,_,_,_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,R],
            /*  17 */ [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P]
        ];

        const FILAS_OFFSCREEN = 2;

        mapaNivel.forEach((fila, indiceFila) => {
            fila.forEach((codigo, indiceColumna) => {
                if (codigo === '') return; 

                const posX = (indiceColumna * 16) + 8;
                const posY = ((indiceFila - FILAS_OFFSCREEN) * 16) + 8;

                if (codigo === M1) { spawnMonchoX = posX; return; }
                if (codigo === C2) { spawnCoopX = posX; return; }

                const datosPieza = scene.catalogoPiezas[codigo];
                if (!datosPieza) return;

                let bloque;
                if (datosPieza.tipo !== 'fondo') {
                    bloque = scene.bloquesFisicos.create(posX, posY, 'MapTileSet', datosPieza.frame);
                    bloque.body.updateFromGameObject();

                    if (datosPieza.tipo === 'pasarela') {
                        // --- ETIQUETA OFICIAL DE ONE-WAY ---
                        bloque.esOneWay = true;
                        
                        bloque.body.checkCollision.up = true;
                        bloque.body.checkCollision.down = false;
                        bloque.body.checkCollision.left = false;
                        bloque.body.checkCollision.right = false;
                    } else if (datosPieza.tipo === 'solido') {
                        // --- EXPLICITAMENTE NO ES ONE-WAY ---
                        bloque.esOneWay = false;

                        // Colisión sólida por todos los lados sin optimización
                        bloque.body.checkCollision.up = true;
                        bloque.body.checkCollision.down = true;
                        bloque.body.checkCollision.left = true;
                        bloque.body.checkCollision.right = true;
                    }
                } else {
                    bloque = scene.add.image(posX, posY, 'MapTileSet', datosPieza.frame);
                }
            });
        });

        // Devolvemos los puntos de spawn al finalizar
        return { spawnMonchoX, spawnCoopX };
    }
}
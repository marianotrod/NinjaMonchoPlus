export default class ConstructorNivel {
    // Fijate que ahora recibe "matrizMapa" como segundo parámetro
    static construir(scene, matrizMapa) {
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

        const M1 = 'M1'; 
        const C2 = 'C2'; 
        
        let spawnMonchoX = 240; 
        let spawnCoopX = 272;   
        const FILAS_OFFSCREEN = 2;

        // AHORA RECORRE EXCLUSIVAMENTE LA MATRIZ QUE LE MANDAMOS
        matrizMapa.forEach((fila, indiceFila) => {
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
                        bloque.esOneWay = true;
                        
                        bloque.body.checkCollision.up = true;
                        bloque.body.checkCollision.down = false;
                        bloque.body.checkCollision.left = false;
                        bloque.body.checkCollision.right = false;
                    } else if (datosPieza.tipo === 'solido') {
                        bloque.esOneWay = false;

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

        return { spawnMonchoX, spawnCoopX };
    }
}
// Enemigo.js

export default class Enemigo extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, configConfiguracion) {
        super(scene, x, y, configConfiguracion.textura);

        // Solo lo agregamos visualmente a la escena. 
        // Las físicas se activan en NinjaMonchoScene al hacer this.enemigos.add(demonio)
        scene.add.existing(this);

        this.hp = configConfiguracion.hp;
        this.rasgos = configConfiguracion.rasgos;
    }

    // Este método se llama desde la escena DESPUÉS de agregarlo al grupo de físicas
    arrancar() {
        // Variables internas para el rasgo [Saltarín]
        if (this.rasgos.saltarin.activo) {
            this.setBounce(1);
            this.ultimoReboteY = 0;
            this.contadorRebotes = 0;
            this.enModoAntiLoop = false;
            
            // Asignar velocidad inicial aleatoria X
            const direccion = Phaser.Math.RND.pick([-1, 1]);
            const velX = Phaser.Math.Between(this.rasgos.saltarin.velXMin, this.rasgos.saltarin.velXMax);
            this.setVelocityX(velX * direccion);
        }

        // Variables para el rasgo [Caminante]
        if (this.rasgos.caminante.activo) {
            const direccion = Phaser.Math.RND.pick([-1, 1]);
            this.setVelocityX(this.rasgos.caminante.velocidadX * direccion);
        }
    }

    // Este método se llamará desde el update() de la escena principal
    actualizarComportamiento() {
        // --- LÓGICA: SALTARÍN ---
        if (this.rasgos.saltarin.activo) {
            this.logicaSaltarin();
        }

        // --- LÓGICA: CAMINANTE ---
        if (this.rasgos.caminante.activo) {
            this.logicaCaminante();
        }

        // Animación visual genérica basada en velocidad Y
        if (this.body.velocity.y < 0) this.setFrame(0); 
        else if (this.body.velocity.y > 0) this.setFrame(1); 
    }

    logicaSaltarin() {
        const config = this.rasgos.saltarin;

        if (this.body.touching.down) {
            // Fuerza aleatoria de rebote
            if (this.body.velocity.y > config.reboteYMin || this.body.velocity.y < config.reboteYMax) {
                const fuerzaAleatoria = Phaser.Math.Between(config.reboteYMax, config.reboteYMin);
                this.setVelocityY(fuerzaAleatoria);
            }

            let fuerzaActual = Math.round(this.body.velocity.y);

            // Sistema Anti-Loop
            if (Math.abs(fuerzaActual - this.ultimoReboteY) <= 5) {
                this.contadorRebotes++; 
            } else {
                this.contadorRebotes = 1; 
                this.ultimoReboteY = fuerzaActual;
                this.enModoAntiLoop = false;
            }

            if (this.contadorRebotes >= 3) {
                this.enModoAntiLoop = true;
            }

            if (this.enModoAntiLoop && Math.random() < 0.70) { 
                let nuevaFuerza;
                if (fuerzaActual > config.reboteYMax + 5) {
                    nuevaFuerza = Phaser.Math.Between(config.reboteYMax, fuerzaActual - 5);
                } else {
                    nuevaFuerza = Phaser.Math.Between(fuerzaActual + 5, config.reboteYMin);
                }
                this.setVelocityY(nuevaFuerza); 
                this.ultimoReboteY = Math.round(nuevaFuerza);
                this.enModoAntiLoop = false;
                this.contadorRebotes = 0; 
            }
        }
        
        // Flip visual
        if (this.body.velocity.x < 0) this.setFlipX(true); 
        else if (this.body.velocity.x > 0) this.setFlipX(false); 
    }

    logicaCaminante() {
        // Invierte la dirección si choca contra una pared
        if (this.body.blocked.left || this.body.blocked.right) {
            this.setVelocityX(this.body.velocity.x * -1);
        }
        
        if (this.body.velocity.x < 0) this.setFlipX(true); 
        else if (this.body.velocity.x > 0) this.setFlipX(false); 
    }
}
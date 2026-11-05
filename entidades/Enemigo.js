// Enemigo.js

export default class Enemigo extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, configConfiguracion) {
        super(scene, x, y, configConfiguracion.textura);

        // Solo lo agregamos visualmente a la escena.
        // Las físicas se activan en NinjaMonchoScene al hacer this.enemigos.add(demonio)
        scene.add.existing(this);

        this.config = configConfiguracion;
        this.hp = configConfiguracion.hp;
        this.rasgos = configConfiguracion.rasgos;

        // Estado Neutral (Recolección): inmune, solo se aturde. Estado Enfurecido (Cacería): más rápido y vulnerable.
        this.enfurecido = false;
        this.aturdido = false;
        this.muerto = false;
        this.inmuneStun = false;
        this.multVelocidad = 1;
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

        // Variables para el rasgo [Volador]
        if (this.rasgos.volador.activo) {
            this.body.setAllowGravity(false);
            this.setBounce(1, 0);
            this.alturaBase = Phaser.Math.Between(60, 200);
            this.faseOnda = Math.random() * Math.PI * 2;
            this.setVelocityX(this.rasgos.volador.velocidadX * Phaser.Math.RND.pick([-1, 1]));
        }

        // Variables para el rasgo [Lanzador]
        if (this.rasgos.lanzador.activo) {
            this.proximoDisparo = this.scene.time.now + this.rasgos.lanzador.intervalo;
        }
    }

    // Este método se llamará desde el update() de la escena principal
    actualizarComportamiento() {
        if (this.muerto) return;

        if (this.estrellaStun) {
            this.estrellaStun.setPosition(this.x + Math.sin(this.scene.time.now / 80) * 6, this.y - 12);
        }

        if (this.aturdido) {
            if (this.rasgos.volador.activo) this.setVelocity(this.body.velocity.x * 0.95, this.body.velocity.y * 0.95);
            return;
        }

        // --- LÓGICA: SALTARÍN ---
        if (this.rasgos.saltarin.activo) {
            this.logicaSaltarin();
        }

        // --- LÓGICA: CAMINANTE ---
        if (this.rasgos.caminante.activo) {
            this.logicaCaminante();
        }

        if (this.rasgos.volador.activo) {
            this.logicaVolador();
        }

        if (this.rasgos.lanzador.activo) {
            this.logicaLanzador();
        }

        // Animación visual genérica basada en velocidad Y (solo para texturas de 2 cuadros)
        if (this.config.framesVuelo) {
            if (this.body.velocity.y < 0) this.setFrame(0);
            else if (this.body.velocity.y > 0) this.setFrame(1);
        }
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

        // Tras un aturdimiento puede quedar casi quieto en X: lo volvemos a lanzar
        if (Math.abs(this.body.velocity.x) < 20) {
            this.setVelocityX(config.velXMin * this.multVelocidad * Phaser.Math.RND.pick([-1, 1]));
        }

        // Flip visual
        if (this.body.velocity.x < 0) this.setFlipX(true);
        else if (this.body.velocity.x > 0) this.setFlipX(false);
    }

    logicaCaminante() {
        const velocidad = this.rasgos.caminante.velocidadX * this.multVelocidad;
        const enPiso = this.body.blocked.down || this.body.touching.down;

        // Invierte la dirección si choca contra una pared
        if (this.body.blocked.left || this.body.touching.left) {
            this.setVelocityX(velocidad);
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.setVelocityX(-velocidad);
        } else if (enPiso) {
            // ...o si se acaba la plataforma: miramos si hay un bloque justo delante y debajo de los pies
            const direccion = Math.sign(this.body.velocity.x) || 1;
            const xAdelante = direccion > 0 ? this.body.right + 1 : this.body.left - 3;
            const hayPiso = this.scene.physics.overlapRect(xAdelante, this.body.bottom + 1, 2, 4, false, true).length > 0;
            this.setVelocityX((hayPiso ? direccion : -direccion) * velocidad);
        }

        if (this.body.velocity.x < 0) this.setFlipX(true);
        else if (this.body.velocity.x > 0) this.setFlipX(false);
    }

    logicaVolador() {
        const config = this.rasgos.volador;
        const objetivo = this.scene.jugadorMasCercano(this.x, this.y);

        // Busca de a poco la altura del jugador más cercano y ondula alrededor de ella
        if (objetivo) this.alturaBase += (objetivo.y - this.alturaBase) * config.seguimiento * this.multVelocidad;
        this.alturaBase = Phaser.Math.Clamp(this.alturaBase, 24, 260);
        this.faseOnda += 0.05 * this.multVelocidad;
        const yDeseada = this.alturaBase + Math.sin(this.faseOnda) * config.amplitud;
        this.setVelocityY((yDeseada - this.y) * 3);

        if (Math.abs(this.body.velocity.x) < config.velocidadX * 0.5) {
            this.setVelocityX(config.velocidadX * this.multVelocidad * Phaser.Math.RND.pick([-1, 1]));
        }
        this.setFlipX(this.body.velocity.x < 0);
    }

    logicaLanzador() {
        const config = this.rasgos.lanzador;
        if (this.body.blocked.down || this.body.touching.down) this.setVelocityX(0);

        const ahora = this.scene.time.now;
        if (ahora < this.proximoDisparo) return;
        this.proximoDisparo = ahora + (this.enfurecido ? config.intervaloEnfurecido : config.intervalo);

        const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
        if (!objetivo) return;
        this.setFlipX(objetivo.x < this.x);

        // Tiro parabólico que cae sobre la posición actual del jugador
        const multVelocidad = this.scene.modsGlobal ? this.scene.modsGlobal.velProyectiles : 1;
        const tiempoVuelo = 1.1 / multVelocidad;
        const gravedad = this.scene.physics.world.gravity.y + 200;
        const vx = Phaser.Math.Clamp((objetivo.x - this.x) / tiempoVuelo, -220, 220);
        const vy = ((objetivo.y - this.y) - 0.5 * gravedad * tiempoVuelo * tiempoVuelo) / tiempoVuelo;

        this.scene.dispararProyectilEnemigo(this.x, this.y - 6, vx, vy, { gravedad: true });
        this.scene.tweens.add({ targets: this, scaleY: 0.8, duration: 80, yoyo: true });
    }

    enfurecer(multiplicador = 1.5) {
        if (this.enfurecido || this.muerto) return;
        this.enfurecido = true;
        this.multVelocidad = multiplicador;
        this.setVelocityX(this.body.velocity.x * multiplicador);
        this.setTint(0xff9999);

        // El escudo con calavera se rompe sobre su cabeza: ya no es inmune
        const escudo = this.scene.add.sprite(this.x, this.y - 16, 'escudo_roto').setDepth(60);
        escudo.play('escudo-roto');
        escudo.once('animationcomplete', () => escudo.destroy());
    }

    aturdir(duracion, vx = 0, vy = -120) {
        if (this.muerto) return;
        this.setVelocity(vx, vy);
        if (this.inmuneStun) return;

        this.aturdido = true;
        this.setTint(0x88ccff);
        if (!this.estrellaStun) this.estrellaStun = this.scene.add.image(this.x, this.y - 12, 'estrella').setDepth(61);

        if (this.timerStun) this.timerStun.remove();
        this.timerStun = this.scene.time.delayedCall(duracion, () => {
            if (!this.active) return;
            this.aturdido = false;
            if (this.enfurecido) this.setTint(0xff9999); else this.clearTint();
            if (this.estrellaStun) { this.estrellaStun.destroy(); this.estrellaStun = null; }
            if (this.rasgos.caminante.activo) {
                this.setVelocityX(this.rasgos.caminante.velocidadX * this.multVelocidad * Phaser.Math.RND.pick([-1, 1]));
            }
        });
    }

    morir() {
        if (this.muerto) return;
        this.muerto = true;
        this.destroy();
    }

    destroy(fromScene) {
        if (this.timerStun) this.timerStun.remove();
        if (this.estrellaStun) this.estrellaStun.destroy();
        if (this.textoDebug) this.textoDebug.destroy();
        this.estrellaStun = null;
        this.textoDebug = null;
        super.destroy(fromScene);
    }
}

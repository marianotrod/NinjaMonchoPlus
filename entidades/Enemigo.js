// Enemigo.js
import { BANDO, CONFIG } from '../config.js';
import { envolverX, fueraDeVista } from '../mundo/Mundo.js';

export default class Enemigo extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, configConfiguracion) {
        super(scene, x, y, configConfiguracion.textura);

        // Solo lo agregamos visualmente a la escena.
        // Las físicas se activan en NinjaMonchoScene al hacer this.enemigos.add(demonio)
        scene.add.existing(this);

        this.bando = BANDO.DEMONIOS;
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
    // Mientras entra a la pantalla es intocable: no daña, no lo dañan y no lo mueven. Parpadea mientras dure.
    get intocable() {
        return this.entrando;
    }

    empezarEntrada() {
        this.entrando = true;
        this.finEntrada = null;
        this.parpadeo = this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 100, yoyo: true, repeat: -1 });
    }

    terminarEntrada() {
        this.entrando = false;
        if (this.parpadeo) this.parpadeo.remove();
        this.parpadeo = null;
        this.setAlpha(1);
    }

    actualizarEntrada() {
        if (!this.entrando) return;
        const ahora = this.scene.time.now;
        if (this.finEntrada === null) {
            if (!fueraDeVista(this)) this.finEntrada = ahora + CONFIG.ENTRADA_ENEMIGO;
        } else if (ahora >= this.finEntrada) {
            this.terminarEntrada();
        }
    }

    arrancar() {
        this.empezarEntrada();
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
            const config = this.rasgos.caminante;
            const direccion = Phaser.Math.RND.pick([-1, 1]);
            this.setVelocityX(config.velocidadX * direccion);
            this.setFlipX(direccion < 0);
            if (config.gravedad) this.body.setGravityY(config.gravedad);
            this.accion = null;          // pausa | aviso | preparar | carga: mientras dura, manda sobre el caminar
            this.proximaDecision = this.scene.time.now + this.esperaDecision();
            this.proximoGiro = 0;
            this.proximaCarga = 0;
            this.atravesando = 0;        // Hasta cuándo atraviesa las pasarelas (para bajar de una)
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
        this.actualizarEntrada();

        // Boulder nivel 2: disparado, golpea a los otros hasta que se le acaba el impulso
        if (this.lanzado && this.scene.time.now >= this.lanzado.fin) {
            const { duenio } = this.lanzado;
            this.lanzado = null;
            if (this.aturdido) this.setTint(0x88ccff);
            this.scene.terminarLanzamiento(this, duenio);
            if (this.muerto) return;
        }

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
        const config = this.rasgos.caminante;
        const ahora = this.scene.time.now;
        const enPiso = this.body.blocked.down || this.body.touching.down;

        if (this.accion && this.seguirAccion(config, ahora, enPiso)) {
            this.animarCaminante(enPiso);
            return;
        }

        const velocidad = config.velocidadX * this.multVelocidad;
        // Invierte la dirección si choca contra una pared
        if (this.body.blocked.left || this.body.touching.left) {
            this.setVelocityX(velocidad);
        } else if (this.body.blocked.right || this.body.touching.right) {
            this.setVelocityX(-velocidad);
        } else if (enPiso) {
            // ...o si se acaba la plataforma: miramos si hay un bloque justo delante y debajo de los pies
            const direccion = this.direccion;
            if (this.hayPisoHacia(direccion)) {
                this.setVelocityX(direccion * velocidad);
            } else if (!config.decision || this.hayPisoHacia(-direccion)) {
                this.setVelocityX(-direccion * velocidad);
            } else if (ahora >= this.proximoGiro) {
                // Parado en un tile suelto no puede caminar: solo se da vuelta de vez en cuando
                this.setVelocityX(0);
                this.setFlipX(!this.flipX);
                this.proximoGiro = ahora + 1000;
            } else {
                this.setVelocityX(0);
            }
        }

        if (this.body.velocity.x < 0) this.setFlipX(true);
        else if (this.body.velocity.x > 0) this.setFlipX(false);

        if (enPiso && config.carga) this.buscarCarga(config.carga, ahora);
        if (enPiso && config.decision && !this.accion && ahora >= this.proximaDecision) this.decidir(config, ahora);
        this.animarCaminante(enPiso);
    }

    // Hacia dónde mira: la velocidad manda; quieto, lo que muestra el dibujo
    get direccion() {
        return Math.sign(this.body.velocity.x) || (this.flipX ? -1 : 1);
    }

    hayPisoHacia(direccion) {
        const xAdelante = direccion > 0 ? this.body.right + 1 : this.body.left - 3;
        const xPiso = this.scene.conWrap ? envolverX(xAdelante) : xAdelante;
        return this.scene.physics.overlapRect(xPiso, this.body.bottom + 1, 2, 4, false, true).length > 0;
    }

    sobrePasarela() {
        const bloques = this.scene.physics.overlapRect(this.body.left + 2, this.body.bottom + 1, this.body.width - 4, 4, false, true);
        return bloques.length > 0 && bloques.every(cuerpo => cuerpo.gameObject && cuerpo.gameObject.esOneWay);
    }

    esperaDecision() {
        const [minimo, maximo] = this.rasgos.caminante.decision || [1000, 1000];
        return Phaser.Math.Between(minimo, maximo);
    }

    // Elige al azar, según los pesos, qué hace un rato: seguir, frenar, saltar, bajar de la pasarela o tirar la cuchilla
    decidir(config, ahora) {
        this.proximaDecision = ahora + this.esperaDecision();
        const opciones = Object.entries(config.pesos).filter(([opcion]) => opcion !== 'bajar' || this.sobrePasarela());
        const total = opciones.reduce((suma, [, peso]) => suma + peso, 0);
        let tirada = Math.random() * total;
        const [opcion] = opciones.find(([, peso]) => (tirada -= peso) < 0) || ['seguir'];

        if (opcion === 'pausa') {
            this.accion = { tipo: 'pausa', fin: ahora + config.pausa };
        } else if (opcion === 'salto') {
            this.setVelocityY(config.salto);
        } else if (opcion === 'bajar') {
            this.atravesando = ahora + 300;
        } else if (opcion === 'lanzar' && config.lanza) {
            this.accion = { tipo: 'aviso', fin: ahora + config.lanza.aviso };
        }
    }

    // Samurái: si un ninja pasa por delante, a su altura y cerca, se prepara para correr
    buscarCarga(carga, ahora) {
        if (this.accion || ahora < this.proximaCarga || this.intocable) return;
        const objetivo = this.scene.jugadorMasCercano(this.x, this.y);
        if (!objetivo) return;
        const dx = objetivo.x - this.x;
        const delante = Math.sign(dx) === this.direccion;
        if (delante && Math.abs(dx) <= carga.distancia && Math.abs(objetivo.y - this.y) < 12) {
            this.accion = { tipo: 'preparar', fin: ahora + carga.aviso, direccion: this.direccion };
        }
    }

    // Devuelve true mientras la acción sigue y manda sobre el caminar
    seguirAccion(config, ahora, enPiso) {
        const { accion } = this;
        if (accion.tipo === 'carga') {
            const choco = this.body.blocked.left || this.body.blocked.right || this.body.touching.left || this.body.touching.right;
            if (ahora < accion.fin && !choco && (!enPiso || this.hayPisoHacia(accion.direccion))) {
                this.setVelocityX(accion.direccion * config.carga.velocidad * this.multVelocidad);
                return true;
            }
            this.accion = null;
            this.proximaCarga = ahora + config.carga.espera;
            this.setVelocityX(-accion.direccion * config.velocidadX * this.multVelocidad);
            return false;
        }

        this.setVelocityX(0);
        if (ahora < accion.fin) return true;
        this.accion = null;
        if (accion.tipo === 'aviso') this.lanzarCuchilla(config.lanza);
        if (accion.tipo === 'preparar') {
            this.accion = { tipo: 'carga', fin: ahora + config.carga.duracion, direccion: accion.direccion };
            this.setVelocityX(accion.direccion * config.carga.velocidad * this.multVelocidad);
            return true;
        }
        this.setVelocityX(this.direccion * config.velocidadX * this.multVelocidad);
        return false;
    }

    lanzarCuchilla(lanza) {
        const direccion = this.flipX ? -1 : 1;
        const cuchilla = this.scene.dispararProyectilEnemigo(this.x + direccion * 6, this.y - 3, direccion * lanza.vx, lanza.vy,
            { gravedad: true, textura: 'cuchilla', gravedadY: lanza.gravedad });
        if (cuchilla) cuchilla.setAngularVelocity(direccion * 720);
    }

    animarCaminante(enPiso) {
        if (!this.config.cuadros) return;
        const tipo = this.accion && this.accion.tipo;
        let cuadro;
        if (tipo === 'aviso' || tipo === 'preparar') cuadro = 2;
        else if (tipo === 'carga') cuadro = 3;
        else if (!enPiso) cuadro = 1;
        else cuadro = this.body.velocity.x !== 0 ? Math.floor(this.scene.time.now / 160) % 2 : 0;
        this.setFrame(cuadro);
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

    // Pisado sin morir: cae de golpe y un saltarín vuelve a tomar impulso
    alSerPisado() {
        this.setVelocityY(250);
        if (this.rasgos.saltarin.activo) {
            this.ultimoReboteY = 0;
            this.contadorRebotes = 0;
        }
    }

    // Pergamino: el primer demonio del nivel aguanta un golpe
    ponerEscudo() {
        this.escudo = true;
        this.setTint(0x93c5fd);
    }

    romperEscudo() {
        this.escudo = false;
        if (this.enfurecido) this.setTint(0xff9999); else this.clearTint();
    }

    // Pergamino: la furia se pasa con el tiempo
    calmar() {
        if (!this.enfurecido || this.muerto) return;
        this.enfurecido = false;
        this.setVelocityX(this.body.velocity.x / this.multVelocidad);
        this.multVelocidad = 1;
        if (!this.aturdido && !this.escudo) this.clearTint();
    }

    enfurecer(multiplicador = 1.5) {
        if (this.enfurecido || this.muerto) return;
        if (this.scene.modsGlobal.furiaTemporal) {
            if (this.timerFuria) this.timerFuria.remove();
            this.timerFuria = this.scene.time.delayedCall(CONFIG.DURACION_FURIA, () => this.calmar());
        }
        this.enfurecido = true;
        this.multVelocidad = multiplicador;
        this.setVelocityX(this.body.velocity.x * multiplicador);
        this.setTint(0xff9999);

        // El escudo con calavera se rompe sobre su cabeza: ya no es inmune. Solo si lo es por la fase, no por una trampa
        if (!this.scene.reglas.enemigosVulnerables) return;
        const escudo = this.scene.add.sprite(this.x, this.y - 16, 'escudo_roto').setDepth(60);
        escudo.play('escudo-roto');
        escudo.once('animationcomplete', () => escudo.destroy());
    }

    aturdir(duracion, vx = 0, vy = -120) {
        if (this.muerto) return;
        this.setVelocity(vx, vy);
        if (this.inmuneStun) return;

        this.accion = null;  // Un golpe corta lo que estaba haciendo (el aviso, la carga)
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
        if (this.timerFuria) this.timerFuria.remove();
        if (this.estrellaStun) this.estrellaStun.destroy();
        if (this.textoDebug) this.textoDebug.destroy();
        this.estrellaStun = null;
        this.textoDebug = null;
        super.destroy(fromScene);
    }
}

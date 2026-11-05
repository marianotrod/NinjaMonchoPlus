// PuertaPruebas.js
// Puerta de pruebas: solo existe con ?debug (la instala main.js). Los escenarios del banco de pruebas
// (tools/navegador/escenarios) hablan con el juego a través de window.prueba y no tocan las variables internas.
// Así, cuando se reorganiza el código, se adapta este archivo y los escenarios siguen sirviendo para verificar
// que el juego se comporte igual. Los jugadores se numeran 1 y 2, como en pantalla.
import { Bestiario } from '../datos/Bestiario.js';
import { ARMAS } from '../entidades/Armas.js';
import { EVENTOS } from '../datos/Eventos.js';

export function instalarPuertaPruebas(game) {
  const juego = () => game.scene.getScene('NinjaMonchoScene');
  const jugador = (n = 1) => juego().jugadores[n - 1];
  const claveEnemigo = (enemigo) => Object.keys(Bestiario).find(clave => Bestiario[clave] === enemigo.config) || null;
  const redondear = (v) => Math.round(v);

  const estadoJugador = (j) => j ? {
    x: redondear(j.x), y: redondear(j.y),
    vx: redondear(j.body.velocity.x), vy: redondear(j.body.velocity.y),
    enPiso: j.body.blocked.down || j.body.touching.down,
    muerto: j.muerto, eliminado: j.eliminado,
    aturdido: j.isStunned, invulnerable: j.isInvul, apareciendo: j.isSpawning,
    arma: j.arma, municion: j.municion
  } : null;

  const estadoEnemigo = (e) => ({
    clave: claveEnemigo(e), x: redondear(e.x), y: redondear(e.y),
    enfurecido: e.enfurecido, aturdido: e.aturdido, muerto: e.muerto
  });

  window.prueba = {
    // --- Lectura ---
    escenas: () => game.scene.getScenes(true).map(s => s.scene.key),
    enJuego: () => game.scene.isActive('NinjaMonchoScene') && !!juego().jugadores,

    estado() {
      const s = juego();
      return {
        fase: s.fase,
        nivel: s.partida.nivel,
        jugadores: s.cantidadJugadores,
        tiempo: s.tiempoRestante,
        vidas: [...s.partida.vidas],
        puntajes: [...s.partida.puntajes],
        talismanes: s.contarInventario(),
        enemigos: s.enemigos.countActive(true),
        enemigosPorAparecer: s.enemigosPorAparecer,
        fantasma: !!s.fantasma,
        jefe: s.jefe ? { tipo: s.jefe.tipo, hp: s.jefe.hp, hpMax: s.jefe.hpMax, estado: s.jefe.estado } : null,
        listoParaContinuar: s.listoParaContinuar,
        jefePartida: s.partida.jefe
      };
    },

    jugador: (n = 1) => estadoJugador(jugador(n)),
    enemigos: () => juego().enemigos.getChildren().map(estadoEnemigo),
    enemigo: (i = 0) => { const e = juego().enemigos.getChildren()[i]; return e ? estadoEnemigo(e) : null; },
    proyectiles: () => ({
      jugador: juego().proyectilesJugador.getChildren().map(p => ({ tipo: p.tipo, x: redondear(p.x), y: redondear(p.y) })),
      enemigos: juego().proyectilesEnemigos.countActive(true)
    }),
    items: () => juego().items.getChildren().map(i => ({
      talisman: i.esTalisman, tipo: i.texture.key, x: redondear(i.x), y: redondear(i.y),
      vx: redondear(i.body.velocity.x), vy: redondear(i.body.velocity.y), valor: i.valorPuntos
    })),
    cajasArmas: () => juego().cajasArmas.countActive(true),
    pactos: () => JSON.parse(JSON.stringify(juego().partida.pactos)),
    modsJugador: (n = 1) => ({ ...jugador(n).mods }),
    modsGlobal: () => ({ ...juego().modsGlobal }),
    // En la pantalla de pergaminos: qué pergamino (0, 1 o 2) fijó cada jugador
    eleccionesPergaminos: () => [...game.scene.getScene('PactSelectionScene').elecciones],

    // El jugador terminó de aparecer y está parado en el piso
    listo: (n = 1) => {
      const j = jugador(n);
      return !!j && !j.isSpawning && (j.body.blocked.down || j.body.touching.down);
    },

    // --- Control del entorno ---
    sinEnemigos() {
      const s = juego();
      s.enemigosHabilitados = false;
      s.timerDemonios.paused = true;
      s.enemigos.getChildren().slice().forEach(e => e.destroy());
      s.enemigosPorAparecer = 0;
      return true;
    },
    conEnemigos() {
      juego().enemigosHabilitados = true;
      return true;
    },
    sinCajasArmas() {
      const s = juego();
      s.timerArmas.paused = true;
      s.cajasArmas.clear(true, true);
      s.spawnearCajaArma = () => {};
      return true;
    },
    sinItems() {
      juego().items.clear(true, true);
      return true;
    },
    crearEnemigo(clave, x, y) {
      const s = juego();
      const habilitados = s.enemigosHabilitados;
      s.enemigosHabilitados = true;
      const e = s.crearEnemigo(clave);
      s.enemigosHabilitados = habilitados;
      if (x !== undefined) e.body.reset(x, y);
      e.setVelocity(0, 0);
      return s.enemigos.getChildren().indexOf(e);
    },
    // Coloca un talismán o una moneda quieta en un lugar
    crearItem(tipo, x, y) {
      const s = juego();
      if (tipo === 'coin') s.spawnearMoneda(); else s.spawnearItem(tipo);
      const item = s.items.getChildren()[s.items.getChildren().length - 1];
      item.body.reset(x, y);
      item.setVelocity(0, 0);
      return s.items.getChildren().length - 1;
    },
    crearCajaArma(tipo, x, y) {
      const caja = juego().cajasArmas.create(x, y, ARMAS[tipo].icono);
      caja.tipoArma = tipo;
      return true;
    },
    ponerTiempo(t) {
      juego().tiempoRestante = t;
      return true;
    },
    ponerVidas(n, vidas) {
      juego().partida.vidas[n - 1] = vidas;
      return true;
    },
    ponerJugador(n, x, y, vx = 0, vy = 0) {
      const j = jugador(n);
      j.body.reset(x, y);
      j.setVelocity(vx, vy);
      return true;
    },
    // Saca la protección de aparición o del último golpe, para poder probar el siguiente golpe enseguida
    quitarProteccion(n = 1) {
      const j = jugador(n);
      const s = juego();
      s.tweens.killTweensOf(j);
      j.setAlpha(1);
      j.isInvul = false;
      j.isSpawning = false;
      j.isStunned = false;
      return true;
    },
    // Lo deja protegido contra golpes (para pruebas donde los enemigos andan sueltos)
    proteger(n = 1) {
      jugador(n).isInvul = true;
      return true;
    },
    mirar(n, direccion) {
      jugador(n).setFlipX(direccion < 0);
      return true;
    },

    // --- Acciones ---
    golpear(n = 1, desdeLado = 1) {
      const j = jugador(n);
      juego().recibirGolpe(j, j.x + desdeLado * 5);
      return true;
    },
    atacar(n = 1) {
      const j = jugador(n);
      j.ultimoAtaque = -9999;
      j.atacar();
      return true;
    },
    equipar(n, arma) {
      jugador(n).equiparArma(arma);
      return true;
    },
    disparar(n = 1) {
      jugador(n).usarEspecial();
      return true;
    },
    vaciarTalismanes() {
      const s = juego();
      s.inventario = [];
      s.events.emit(EVENTOS.INVENTARIO, s.contarInventario());
      return true;
    },
    juntarTalismanes(conteo) {
      const s = juego();
      ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
        for (let i = 0; i < (conteo[tipo] || 0); i++) s.inventario.push(tipo);
      });
      s.events.emit(EVENTOS.INVENTARIO, s.contarInventario());
      return s.contarInventario();
    },
    // Hace que el jugador toque un talismán (como si lo agarrara) de ese tipo
    tocarTalisman(n, tipo) {
      const s = juego();
      s.spawnearItem(tipo);
      const item = s.items.getChildren()[s.items.getChildren().length - 1];
      s.recolectarItem(jugador(n), item);
      return s.fase;
    },
    completarRecoleccion() {
      const s = juego();
      s.inventario = ['cuadrado', 'cuadrado', 'cuadrado', 'triangulo', 'triangulo', 'triangulo', 'rombo', 'rombo'];
      return window.prueba.tocarTalisman(1, 'rombo');
    },
    enfurecerEnemigos() {
      juego().enemigos.getChildren().forEach(e => e.enfurecer());
      return true;
    },
    matarEnemigos(n = 1) {
      const s = juego();
      s.enemigos.getChildren().slice().forEach(e => s.matarEnemigo(e, jugador(n)));
      return s.enemigos.countActive(true);
    },
    terminarCaceria(limpio = true) {
      const s = juego();
      s.enemigosPorAparecer = 0;
      if (limpio) window.prueba.matarEnemigos(1);
      else s.finCaceria(false);
      return s.fase;
    },
    proyectilEnemigo(x, y, vx, vy, gravedad = false) {
      return !!juego().dispararProyectilEnemigo(x, y, vx, vy, { gravedad });
    },
    danarJefe(cantidad) {
      const jefe = juego().jefe;
      jefe.invulnerable = false;
      return jefe.recibirDaño(cantidad);
    },
    modoDios(activo) {
      juego().modoDiosActivo = activo;
      return true;
    }
  };
}

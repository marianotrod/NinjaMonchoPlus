// PuertaPruebas.js
// Puerta de pruebas: solo existe con ?debug (la instala main.js). Los escenarios del banco de pruebas
// (tools/navegador/escenarios) hablan con el juego a través de window.prueba y no tocan las variables internas.
// Así, cuando se reorganiza el código, se adapta este archivo y los escenarios siguen sirviendo para verificar
// que el juego se comporte igual. Los jugadores se numeran 1 y 2, como en pantalla.
import { Bestiario } from '../datos/Bestiario.js';
import { ESTADO } from '../entidades/Ninja.js';
import { BANDO, CONFIG } from '../config.js';
import { PROTECCION, crearGolpe, resolverGolpe } from '../reglas/Resolvedor.js';
import { todosLosNiveles, validarNivel } from '../mundo/Niveles.js';
import { crearBola, escupirFuego } from '../mundo/Fuego.js';
import { tomarEfecto } from '../reglas/Pergaminos.js';
import { EVENTOS } from '../datos/Eventos.js';
import { Sonido } from './Sonido.js';

// Enemigo solo para las pruebas: camina y da la vuelta en paredes y bordes, sin nada al azar. Salió del juego (roadmap 5.11),
// pero los escenarios lo usan como enemigo simple. Se agrega al Bestiario solo con ?debug y nunca sale al azar (peso 0).
const DEMONIO_DE_PRUEBA = {
  textura: 'demonio', framesVuelo: true, hp: 1, costoIA: 1, nivelMinimo: 99, peso: 0, duracionStun: 2000, soloPruebas: true,
  rasgos: { saltarin: { activo: false }, caminante: { activo: true, velocidadX: 60 }, volador: { activo: false }, lanzador: { activo: false } }
};

export function instalarPuertaPruebas(game) {
  Bestiario.demonio_caminante = DEMONIO_DE_PRUEBA;
  const juego = () => game.scene.getScene('NinjaMonchoScene');
  const jugador = (n = 1) => juego().jugadores[n - 1];
  const claveEnemigo = (enemigo) => Object.keys(Bestiario).find(clave => Bestiario[clave] === enemigo.config) || null;
  const redondear = (v) => Math.round(v);

  const estadoJugador = (j) => j ? {
    x: redondear(j.x), y: redondear(j.y),
    vx: redondear(j.body.velocity.x), vy: redondear(j.body.velocity.y),
    enPiso: j.body.blocked.down || j.body.touching.down,
    muerto: j.muerto, eliminado: j.eliminado,
    estado: j.estado, brillo: !!j.conBrillo, alfa: Math.round(j.alpha * 10) / 10, aturdido: j.aturdido, invulnerable: j.proteccion !== PROTECCION.NORMAL, apareciendo: j.apareciendo,
    arma: j.arma, municion: j.municion, intensidadBrillo: Math.round((j.intensidadBrillo ?? 0) * 100) / 100,
    katanaArriba: !!j.katanaArriba, pared: j.estadoPared, miraPared: j.miraPared, caidaPeligrosa: !!j.caidaPeligrosa, flipX: j.flipX, cuadro: j.frame ? j.frame.name : null,
    animacion: j.anims && j.anims.currentAnim ? j.anims.currentAnim.key.replace(`${j.texture.key}-`, '') : null,
    katana: j.katana ? { ancho: Math.round(j.katana.getBounds().width), alto: Math.round(j.katana.getBounds().height), top: Math.round(j.katana.getBounds().top) } : null
  } : null;

  const estadoEnemigo = (e) => ({
    clave: claveEnemigo(e), x: redondear(e.x), y: redondear(e.y),
    enfurecido: e.enfurecido, aturdido: e.aturdido, muerto: e.muerto, hp: e.hp, intocable: e.intocable, brillo: !!e.conBrillo,
    escudo: !!e.escudo, lanzado: !!e.lanzado, accion: e.accion ? e.accion.tipo : null, animacion: e.anims && e.anims.currentAnim ? e.anims.currentAnim.key : null, vx: redondear(e.body.velocity.x), cuadro: e.frame ? e.frame.name : null
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
        fantasma: s.fantasmas.length > 0,
        jefe: s.jefe ? { tipo: s.jefe.tipo, hp: s.jefe.hp, hpMax: s.jefe.hpMax, estado: s.jefe.estado } : null,
        listoParaContinuar: s.listoParaContinuar,
        jefePartida: s.partida.jefe
      };
    },

    nivel: () => {
      const s = juego();
      const bloques = s.bloquesFisicos.getChildren();
      const { id, fondoImagen, musica } = s.partida.datosNivel;
      return { id, fondoImagen, musica, bloques: bloques.length, pasarelas: bloques.filter(b => b.esOneWay).length };
    },
    validarNiveles: () => {
      const niveles = todosLosNiveles();
      return { cantidad: niveles.length, errores: niveles.flatMap(([id, nivel]) => validarNivel(id, nivel)) };
    },
    fuego: () => {
      const s = juego();
      return { tiles: s.tilesFuego.length, bolas: s.proyectilesDe(BANDO.DEMONIOS).filter(p => p.rebota).length, llamas: s.llamas.countActive(true) };
    },
    escupirFuego(i = 0) {
      const s = juego();
      escupirFuego(s, s.tilesFuego[i]);
      return true;
    },
    crearBola: (x, y, vx = 0, vy = 0) => !!crearBola(juego(), x, y, vx, vy),
    sinFuego() {
      juego().tilesFuego = [];
      return true;
    },
    fantasmas: () => juego().fantasmas.map(f => ({
      x: redondear(f.x), y: redondear(f.y), velocidad: redondear(f.velocidad), objetivo: f.objetivo ? f.objetivo.indice + 1 : null,
      pisado: !!f.pisado, enojado: !!f.enojado
    })),
    jugador: (n = 1) => estadoJugador(jugador(n)),
    enemigos: () => juego().enemigos.getChildren().map(estadoEnemigo),
    enemigo: (i = 0) => { const e = juego().enemigos.getChildren()[i]; return e ? estadoEnemigo(e) : null; },
    proyectiles: () => ({
      jugador: juego().proyectilesDe(BANDO.JUGADORES).map(p => ({ tipo: p.tipo, x: redondear(p.x), y: redondear(p.y) })),
      enemigos: juego().proyectilesDe(BANDO.DEMONIOS).length
    }),
    items: () => juego().items.getChildren().map(i => ({
      talisman: i.esTalisman, tipo: i.texture.key, x: redondear(i.x), y: redondear(i.y),
      vx: redondear(i.body.velocity.x), vy: redondear(i.body.velocity.y), valor: i.valorPuntos
    })),
    cajasArmas: () => 0,   // Ya no hay cajas: las armas salen de los pergaminos
    modsJugador: (n = 1) => ({ ...jugador(n).mods }),
    modsGlobal: () => ({ ...juego().modsGlobal }),
    // Sala de pergaminos: las cartas que siguen en juego, y quién está congelado porque ya eligió
    // Las cartas que todavía se pueden tomar (las elegidas quedan a la vista, pero ya no cuentan)
    cartasLibres: () => (juego().cartas ? juego().cartas.getChildren().filter(c => !c.tomada) : []),
    cartas: () => (juego().cartas ? window.prueba.cartasLibres().map(c => ({ ...c.datos, x: Math.round(c.x), y: Math.round(c.y), encadenada: !!c.encadenada })) : []),
    tomados: () => JSON.parse(JSON.stringify(juego().partida.tomados)),
    spawn: (n = 1) => ({ ...juego().spawns[n - 1] }),
    peligros: () => juego().peligros.getChildren().map(p => ({ tipo: p.texture.key, x: Math.round(p.x), y: Math.round(p.y) })),
    soltarPeligro(tipo, x, y) {
      juego().soltarPeligro(tipo, x, y);
      return true;
    },
    // Cambia un valor de config.js mientras dura la prueba (por ejemplo, para no esperar 6 segundos de furia)
    configurar(clave, valor) {
      CONFIG[clave] = valor;
      return true;
    },
    // Pisa al enemigo que tenga debajo; con salto, como si hubiera apretado saltar justo a tiempo
    pisotear(n = 1, conSalto = false) {
      const j = jugador(n);
      if (conSalto) j.bufferSaltoTimer = juego().time.now + 200;
      j.hacerPisoton();
      return Math.round(j.body.velocity.y);
    },
    enfurecerEnemigo(i) {
      juego().enemigos.getChildren()[i].enfurecer();
      return true;
    },
    reiniciarPrimerEnemigo() {
      juego().primerEnemigoCreado = false;
      return true;
    },
    tomarEfecto(n, id) {
      tomarEfecto(juego().partida, id, n - 1);
      return true;
    },
    // La lógica de una celda del nivel en juego, y cuántas hay de un tipo
    tile: (col, fila) => juego().logica[fila][col],
    contarTiles: (tipo) => juego().logica.flat().filter(t => t === tipo).length,
    tocarCarta(n, i) {
      const s = juego();
      const carta = window.prueba.cartasLibres()[i];
      if (!carta) return false;
      s.tocarCarta(jugador(n), carta);
      return true;
    },
    terminarSala() {
      juego().terminarSala();
      return true;
    },
    ponerCartas(cartas) {
      juego().partida.cartas = cartas;
      return true;
    },

    // El jugador terminó de aparecer y está parado en el piso
    listo: (n = 1) => {
      const j = jugador(n);
      return !!j && !j.apareciendo && (j.body.blocked.down || j.body.touching.down);
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
    sinCajasArmas: () => true,
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
      e.terminarEntrada(); // Las pruebas lo ponen ya en juego; entrar() lo vuelve a la entrada normal
      return s.enemigos.getChildren().indexOf(e);
    },
    // Crea un enemigo que entra como en el juego: desde arriba y fuera de la pantalla
    enemigoEntrando(clave, x) {
      const s = juego();
      const habilitados = s.enemigosHabilitados;
      s.enemigosHabilitados = true;
      const e = s.crearEnemigo(clave);
      s.enemigosHabilitados = habilitados;
      e.body.reset(x, -8);
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
    ponerTiempo(t) {
      juego().tiempoRestante = t;
      return true;
    },
    // Da movimientos especiales: una lista o 'todos', con su nivel
    darHabilidades(n = 1, habilidades = 'todos', nivel = 1) {
      const j = jugador(n);
      const lista = habilidades === 'todos' ? Object.keys(j.habilidades) : habilidades;
      lista.forEach(habilidad => { j.habilidades[habilidad] = nivel; });
      return true;
    },
    sinDobleSalto(n = 1) {
      jugador(n).saltoExtraDisponible = false;
      return true;
    },
    ponerModGlobal(mod, valor) {
      juego().modsGlobal[mod] = valor;
      return true;
    },
    sumarPuntos(n, puntos) {
      juego().sumarPuntos(n - 1, puntos);
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
      j.dejarDeParpadear();
      j.finProteccion = 0;
      j.reaparece = false;
      if (j.apareciendo || j.aturdido) j.estado = ESTADO.LIBRE;
      return true;
    },
    // Lo deja protegido contra golpes (para pruebas donde los enemigos andan sueltos)
    proteger(n = 1) {
      jugador(n).finProteccion = Infinity;
      return true;
    },
    mirar(n, direccion) {
      jugador(n).setFlipX(direccion < 0);
      return true;
    },

    // --- Acciones ---
    golpear(n = 1, desdeLado = 1) {
      const j = jugador(n);
      resolverGolpe(juego(), j, crearGolpe('contacto', { bando: BANDO.DEMONIOS, fuenteX: j.x + desdeLado * 5 }));
      return true;
    },
    atacar(n = 1, arriba = false) {
      const j = jugador(n);
      j.ultimoAtaque = -9999;
      j.atacar({ arriba });
      return true;
    },
    equipar(n, arma) {
      jugador(n).equiparArma(arma);
      return true;
    },
    // Sin respetar el cooldown, salvo que se pida
    disparar(n = 1, conCooldown = false) {
      if (!conCooldown) jugador(n).proximoDisparo = 0;
      jugador(n).usarEspecial();
      return true;
    },
    // Anota en window.talismanesCaidos cada talismán que vuelve a caer
    espiarTalismanes() {
      const s = juego();
      const original = s.spawnearItem;
      window.talismanesCaidos = [];
      s.spawnearItem = function (tipo) {
        window.talismanesCaidos.push(tipo);
        return original.call(this, tipo);
      };
      return true;
    },
    vaciarTalismanes() {
      const s = juego();
      s.inventario = [];
      s.events.emit(EVENTOS.INVENTARIO, s.contarInventario());
      s.actualizarBrillo();
      return true;
    },
    juntarTalismanes(conteo) {
      const s = juego();
      ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
        for (let i = 0; i < (conteo[tipo] || 0); i++) s.inventario.push(tipo);
      });
      s.events.emit(EVENTOS.INVENTARIO, s.contarInventario());
      s.actualizarBrillo();
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
    completarRecoleccion(n = 1) {
      const s = juego();
      s.inventario = ['cuadrado', 'cuadrado', 'cuadrado', 'triangulo', 'triangulo', 'triangulo', 'rombo', 'rombo'];
      return window.prueba.tocarTalisman(n, 'rombo');
    },
    // Hace que el enemigo i haga ya una de sus acciones (pausa, salto, bajar, lanzar), sin esperar al azar
    accionEnemigo(i, opcion) {
      const e = juego().enemigos.getChildren()[i];
      const config = e.rasgos.caminante;
      const pesos = config.pesos;
      config.pesos = { [opcion]: 1 };
      e.decidir(config, juego().time.now);
      config.pesos = pesos;
      return e.accion ? e.accion.tipo : opcion;
    },
    // Sin decisiones al azar por un rato largo: el enemigo i solo camina
    sinDecisiones(i) {
      const e = juego().enemigos.getChildren()[i];
      e.proximaDecision = Infinity;
      e.proximoArco = Infinity;  // Tampoco dispara flechas
      return true;
    },
    // Los textos del último panel de la UI (nivel completado, fin de partida)
    panel: () => {
      const ui = game.scene.getScene('UIScene');
      return ui && ui.panel && ui.panel.active ? ui.panel.lineas.map(linea => linea.text) : null;
    },
    monedas: () => juego().items.getChildren().filter(item => item.active && !item.esTalisman).length,
    combo: (n) => ({ ...juego().combos[n - 1] }),
    pausaDeFase: () => !!juego().pausaDeFase,
    fondo: () => { const f = juego().fondo; return { clave: f.actual, alfa: Math.round(f.imagen.alpha * 100) / 100, fundiendo: !!f.saliente, capa: f.imagen.depth }; },
    musica: () => Sonido.claveMusica(),
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
      else {
        window.prueba.sinEnemigos();
        s.finCaceria();
      }
      return s.fase;
    },
    ponerVidaEnemigo(i, hp) {
      juego().enemigos.getChildren()[i].hp = hp;
      return true;
    },
    reglas: () => ({ ...juego().reglas }),
    habilidades: (n = 1) => ({ ...jugador(n).habilidades }),
    armaGuardada: (n = 1) => juego().partida.armas[n - 1],
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

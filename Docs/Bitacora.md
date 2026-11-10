# Bitácora de trabajo

Registro breve de cada sesión: qué se hizo, decisiones y pendientes. Lo más nuevo va arriba.
El detalle fino de cada cambio está en `git log`.

---

## 2026-11-10 — Claude: volador con hoja nueva

- `volador.png` ahora es una hoja (Mariano): vuela con 0-3 en loop, mirando hacia donde va, y al morir explota en su
  lugar con 4-5 y desaparece (`cae: false` en `datos/Animaciones.js`). Pasó de `GRAFICOS` a `GRAFICOS_CUADROS`.
- Aturdido sigue con el tinte celeste (no tiene cuadros de aturdido). Escenario nuevo `volador`.

## 2026-11-10 — Claude: agarre de pared, salto de pared por timing, enemigos al probar un mapa y samurái arquero

- Agarre de pared (todos, sin pergamino): en el aire, empujando contra una pared, el ninja se queda colgado 0,7 s y después
  se desliza. Con el salto trepa un poquito (una vez cada 0,3 s) y el agarre empieza de nuevo; soltando la dirección, cae.
  Así ya no se queda atrapado en pozos. Calibración en `FISICA.agarrePared`.
- Salto de pared (pergamino): ahora es de timing. Vale solo si salta hasta 130 ms después de llegar a la pared
  (`FISICA.ventanaSaltoPared`), aunque ya haya apretado hacia afuera. Más tarde, ya está agarrado y el salto trepa.
- Solo las paredes cuentan para agarrarse: el compañero o un enemigo al costado no.
- Mapa de prueba `n-paredes` (tipo prueba): pozo donde arranca J1, paredes de 5, 9 y 13 tiles y repisas.
- Editor: junto a Probar, "Enemigos": según un nivel (1 a 10), elegidos uno por uno (hasta 12 en total) o ninguno.
  Llega al juego como `?debug&enemigos=...` y solo cambia la prueba. Se recuerda en el navegador.
- Escenarios nuevos `paredes`, `enemigos_prueba`, `enemigos_prueba_nivel` y `editor_prueba`.
- Samurái con hoja nueva (`samurai.png`, 3 filas) y flecha (`flechasamurai.png`, 2 cuadros, en `GRAFICOS_ANIMADOS`):
  - Además de embestir, cada 2,5 a 4,5 s se da vuelta hacia el ninja más cercano, apunta (cuadro 15) y dispara (17-19)
    una flecha en arco fijo hacia adelante que apunta hacia donde va (`arco` en el Bestiario). Corta: unos 120 px.
  - La embestida no tiene cuadros propios: provisorios `preparaCarga` (21) y `carga` (caminar rápido) en `datos/Animaciones.js`.
  - Aturdido queda en el 28 (la guía decía 24) y la muerte es 33-36 (la guía decía 30-36): así está en la hoja.
  - La katana sigue rebotando si no está aturdido. Se ríe si mata estando en el piso.
- `Animaciones.js` acepta rangos al revés ('2-0'). Escenario nuevo `samurai`.
- Después de probarlo (Mariano): salto de pared más fácil de encadenar. Ventana de 180 ms desde que llega a la pared y
  "coyote" de pared de 100 ms después de despegarse (`FISICA.ventanaSaltoPared`, `FISICA.coyotePared`).
- Caída pesada con doble toque abajo en el aire (antes bastaba mantener abajo y molestaba para el salto de pared). Sigue
  hasta el piso; la cortan el doble salto, el salto de pared, el dash y agarrarse de una pared.
- Dash con doble toque al costado solo con teclado; con joystick, solo R1 (salía sin querer con el stick).
- Editor, opciones de Probar: además de los enemigos, "Empieza en" Recolección o Cacería (`?debug&fase=caceria`):
  el nivel común arranca directo en la Cacería, sin bono ni carteles de sello. Escenario nuevo `fase_prueba`.
  Y "Sin reloj" (`?debug&sinTiempo`): el tiempo no baja, salvo en la sala de pergaminos.
- Salto de pared: ahora pide apretar hacia el lado contrario a la pared (además del timing). Salto apretando contra la
  pared es siempre trepar. Agarrado o trepando, volver a tocar la pared no abre la ventana de nuevo (antes, trepando a
  veces salía un salto de pared).
- Salto de pared más flotón: mientras sube, gravedad al 60% (`gravedadSaltoPared`), impulso -240 (antes -300) y empuje
  200 (antes 260): misma altura, más lento. Ventana 210 ms y coyote 120 ms.
- Arreglo: cayendo y empujando contra una pared, la física podía tomar la esquina del bloque de la pared como piso y el
  ninja quedaba parado en el costado de la pared (sin poder agarrarse). Ahora "en el piso" pide algo debajo del cuerpo,
  y agarrado no empuja contra la pared (alcanza con que esté al lado).
- Al soltar la cuchilla o la flecha, el enemigo muestra el último cuadro aunque la animación venga atrasada.
- Esqueleto y samurái dibujados mirando a la derecha (Mariano). Roadmap: 5.10 animaciones de Moncho, 5.11 sacar el
  demonio caminante, 5.12 pergamino "parry que devuelve".
- Pendiente (Mariano): probar el agarre y el salto de pared en `n-paredes`; cuadros nuevos (agarre, trepar, salto de pared);
  cuadros de embestida del samurái; probar el alcance de la flecha; borrar `samurai_backup_borrar.png`.

## 2026-11-10 — Claude: katana hacia arriba, salto en tecla propia, P1/P2 en inglés y animaciones del esqueleto

- Katana hacia arriba: arriba + katana (flecha arriba + X, W + J, stick arriba + X). Es el mismo tajo girado, arriba de la cabeza;
  lo que toca sale para arriba (`FISICA.katanaArriba`). En el joystick el stick cuenta como arriba solo si va más arriba que al costado.
- El salto del teclado pasó a tecla propia: J1 **Z**, J2 **H** (`TECLAS` en `config.js`). Arriba y W quedan para apuntar.
  Actualizados Cómo jugar (es/en) y el README.
- En inglés el HUD, los paneles y los carteles dicen P1/P2 (`i18n.jugador()`).
- Escenario nuevo `katana_arriba`; los escenarios que saltaban con la flecha arriba ahora usan Z.
- Animaciones de enemigos: le pasé a Mariano la lista de lo que falta dibujar. Él agrega cuadros a las hojas (a la derecha, sin
  mover los que están) y manda una guía; con eso se arma una tabla de animaciones (`datos/Animaciones.js`) para no tocar código después.
- Esqueleto con hoja nueva (`esqueleto.png`, 2 filas de 16 cuadros): tabla de animaciones en `datos/Animaciones.js`
  (quieto, risa, caminar, lanzar, preparaSalto, subir, caer, aturdido, despertar, muerto). Para otro enemigo se agrega su entrada.
  - Se agacha antes de saltar; la cuchilla sale en el último cuadro de lanzar y va como el shuriken (derecho, girando, cae apenas).
  - Aturdido: su animación en lugar del tinte celeste; al final se despierta (sin alargar el aturdimiento).
  - Si mata a un ninja (contacto o cuchilla) estando en el piso, se ríe quieto un rato (`risa` en el Bestiario).
  - Al morir deja de contar enseguida y su cuerpo sale despedido y cae fuera de la pantalla, como Moncho.
- Escenario nuevo `esqueleto`; `enemigos_nuevos` adaptado.
- Pergamino negativo "los furiosos explotan al morir": ahora sueltan una bomba que explota sola a los 1,8 s
  (`CONFIG.ESPERA_BOMBA_FURIOSO`); tocarla no la hace explotar. Antes, matarlo con la katana te mataba siempre.
- Pendiente (Mariano): probar el tajo hacia arriba, las teclas nuevas y el esqueleto; decidir el pergamino de katana alta;
  borrar `esqueleto_backup_borrar.png`; seguir con los otros enemigos.

## 2026-11-09 — Claude: un fondo por fase (5.3) y música de la sala (5.7)

- 5.3: `mundo/Fondo.js` y `CONFIG.FONDOS_FASE`. La Recolección usa el fondo del nivel; Cacería, fantasmas, jefe y sala
  tienen PNG propios en `public/assets/fondos/` (provisorios, pixel art generado). El cambio es un fundido que corre en
  tiempo real durante la pausa de fase. Si falta un PNG queda el fondo del nivel.
- 5.7: el juego respeta la música que tenga la sala; la prueba lo verifica. Vacía, suena la del nivel siguiente (antes del 5, la del jefe).
- Escenarios nuevos `fondos` y `fondos_jefe`; la puerta suma `fondo()` y `musica()`.
- Pendiente (Mariano): reemplazar los 4 fondos y elegir la música de la sala en el editor.

---

## 2026-11-09 — Claude: golpe final, vida perdida sin cartel, puntos de rescate y revisión de los mapas base

- Golpe final (`CONFIG.GOLPE_FINAL`): al completar el nivel la cámara se acerca a la última baja (o al jefe) con un destello
  y el panel sale 0,6 s después. La cámara queda limitada a la pantalla.
- Perder una vida ya no saca cartel: el corazón late fuerte en el HUD y aparece un "-1". El cartel queda para "eliminado".
- Puntos de rescate en los 10 mapas `n-`: 2 o 3 por mapa, en la mitad de arriba, lejos de los spawns. Para corregir en el editor.
- Revisión de los 60 `b-XX` (imagen con todos): se repiten mucho por familia. Las mesetas (b-06, 12, 18…) y los escalones
  (b-03, 09, 15…) son casi iguales entre sí; las islas (b-05, 11, 17…) tienen muchas plataformas chiquitas. b-57 tiene
  pasarelas apiladas de a dos junto a los costados abiertos.
- Pendiente (Mariano): probar; decidir si se regeneran los base con más variedad (pisa los b-XX).

---

## 2026-11-08 — Claude: roadmap 5.1, 5.4, 5.5 y 5.8

- 5.1: los 60 niveles base `b-XX` pasaron a `normal` (70 en el sorteo). El generador ya los crea así.
- El sorteo respeta el tier: `CONFIG.TIERS_POR_NIVEL` dice qué tiers salen en cada nivel (3: tier 1 … 8 y 9: tier 3).
- 5.4: pausa de fase (`sistemas/PausaDeFase.js`, `CONFIG.PAUSA_FASE`). Al romper el sello y al acabarse el tiempo el juego
  frena hasta quedar quieto, salen los carteles (se van rápido por arriba) y recién al recuperar la velocidad empieza
  la Cacería o entran los fantasmas.
- 5.5: objeto "Rescate" en el editor (varios por mapa). La llave y la jaula caen de dos de ellos al azar; sin puntos, como antes.
- 5.8: combo de monedas (`reglas/Combo.js`, `CONFIG.COMBO`). 1,5 s para la siguiente, "COMBO X1" arriba, uno por jugador.
  Las monedas se cobran al final: lo que valían (100 sin rebotar) × combo máximo; en el panel cuentan con sonido.
  Morir con el reloj en cero anula el combo máximo.
- Escenarios nuevos: combo, pausa_fase, rescate_puntos. Plazos más largos donde se espera la Cacería o el fantasma.
- Pendiente (Mariano): poner puntos de rescate en los mapas; probar la pausa y el combo jugando. 5.2 y 5.3 para más adelante.

---

## 2026-11-08 — Claude: aura y estela de los peligros, monedas en la Cacería

- Todo lo que vuela y daña (proyectiles propios y de enemigos, bolas de fuego, ítems y enemigos lanzados) lleva un aura
  de llama y una estela del color de a quién daña: rosa a los jugadores, azul a los demonios, negro-violeta a todos.
  Ya no se tiñe nada. Está en `mundo/Peligros.js`; colores en `COLORES_PELIGRO`, se apagan en `FISICA.auraPeligro` y `estelaPeligro`.
- La estela anterior no se veía: quedaba dibujada detrás del cielo.
- `TOPE_MONEDAS_CACERIA` de 3 a 12, para pisarlas y llegar a lugares altos.
- Pendiente (Mariano): redibujar `graficos/aura.png` (blanca, la tiñe el juego); ver si el negro-violeta se lee bien.

---

## 2026-11-08 — Claude: etapa 9 y 60 niveles base

- Rescate (`mundo/Rescate.js`, `CONFIG.RESCATE`): en el nivel siguiente a quedarse sin vidas uno solo, cae una llave desde
  el spawn del vivo y una jaula desde el del muerto. Con la llave no se ataca ni se dispara (se arroja); un golpe la suelta;
  la katana y las explosiones empujan la llave suelta y la jaula. Al abrirla, el compañero vuelve desde su spawn con 1 vida.
  Gráficos provisorios: `llave.png`, `jaula.png`.
- Pisar proyectiles con el salto a tiempo (`CONFIG.PISAR_PROYECTIL`), también ítems lanzados.
- 60 niveles base `b-01` a `b-60` (tipo `borrador`: no salen en el juego hasta pasarlos a `normal` en el editor), hechos
  con `tools/generar_niveles_base.py`: 6 familias, tiers 1 a 3 (trampas desde el 21, fuego desde el 41), algunos con wrap.
  Todas las superficies se alcanzan con el salto básico. OJO: volver a correr el script pisa los `b-XX`.
- Ítems lanzados: dejan una estela del color de a quién dañan (azul a los demonios, negro a todos con fuego amigo). Al frenar
  dejan de ser proyectil, se corta la estela y vuelven a su color. Ahora dejan de golpear por debajo de 120 px/s (antes 60):
  una moneda lenta ya no mata (`FISICA.velocidadItemLanzado`, `FISICA.estelaItem`).
- Pruebas nuevas: `rescate`, `niveles_base`, `estela`.

**Pendientes**
- Mariano: probar la estela de las monedas, el rescate y pisar proyectiles. Editar los niveles base.

---

## 2026-11-08 — Claude: notas de la partida de prueba de Mariano

- Tiempos: intocable al aparecer 1,5 s al empezar el nivel y 2,5 s al reaparecer (`INVUL_INICIO`, `INVUL_RESPAWN`);
  enemigos intocables 1,2 s después de entrar (`ENTRADA_ENEMIGO`). El katanazo dura 230 ms (antes 150).
- Control aéreo: en el aire responde más rápido al cambiar de dirección y frena un poco al soltar (`FISICA.suavizadoAire`, `frenadoAire`).
- Brillo dorado: se apaga en proporción a los talismanes juntados (los que sobran de una forma no cuentan).
- Pergaminos nuevos: katana un tile más larga, katana un tile más alta, parry en 360 (con un aro, `parry-circular.png`).
  Dash nivel 2: ahora es un katanazo que dura todo el dash.
- Fantasma: se lo puede pisar una vez; se frena 0,8 s y se enoja (rojo, 1,3 veces más rápido, ya no se deja pisar).
- Cacería: siguen cayendo monedas, hasta 3; al agarrar una cae otra (`TOPE_MONEDAS_CACERIA`, `INTERVALO_MONEDAS_CACERIA`).
- Nivel completado: el bono pasa al puntaje de a poco, con un tic que sube de tono y un salto al final.
- Enemigos nuevos: esqueleto (reemplaza al caminante) y samurái, ver `DisenoV2.md` 5.3. Gráficos provisorios y reemplazables:
  `esqueleto.png`, `samurai.png` (hojas de cuadros), `cuchilla.png`.
- Pruebas nuevas: `notas_ninja`, `notas_caceria`, `enemigos_nuevos`.
- Caer de muy alto (`CONFIG.CAIDA_ALTA`, se apaga con `activa: false`): se mide la altura caída (190 px, 2/3 de pantalla).
  Al tocar el piso desde ahí, 400 ms sin control. Boulder (`CONFIG.BOULDER`): saltar en los últimos 100 ms → rueda 600 ms,
  intocable, golpeando lo que toca; entre 100 y 250 ms → aterriza sin castigo. Nivel 2: los enemigos que toca salen disparados
  y golpean a los otros; en la Cacería mueren al terminar. Ya no tiene "(X)". Prueba: `boulder`.
- Cada movimiento es un solo pergamino que sube un nivel; la carta dice "nivel 2" solo si todos los jugadores en juego ya lo tienen.

**Pendientes**
- Mariano: probar todo y calibrar. Los valores de los enemigos están en `datos/Bestiario.js`; el resto en `config.js`.
- Redibujar los gráficos provisorios del esqueleto, el samurái y la cuchilla.

---

## 2026-11-07 — Claude: pergaminos pendientes, mientras Mariano no estaba

- Funcionan cuatro de los que tenían "(X)": doble salto nivel 2 (plataforma fantasma, una pasarela temporal alineada a la grilla, de 3 tiles y 3 segundos),
  caída pesada nivel 2 (dos bolas celestes al tocar el piso, que solo dañan a los demonios y no dejan llama), dash nivel 2 (parry durante el dash),
  y minas y bombas especiales (a veces caen en lugar de una moneda, solo dañan a los jugadores, se rompen con proyectiles y siguen en la Cacería).
- Sigue con "(X)" el boulder y su nivel 2: falta definir "caer de muy alto".
- El botón Probar del editor abre la sala como sala cuando el nivel es de tipo "pergaminos" (`?debug&nivel=2&sala&mapa=...`).
- Gráficos nuevos y reemplazables: `plataforma-fantasma.png`, `mina.png`, `bomba-especial.png`. Banco de pruebas: 309 de 309.

**Pendientes**
- Mariano: probar la sala y estos pergaminos. Calibrar en `config.js` (`PLATAFORMA_*`, `BOLA_CELESTE_DURACION`, `PROB_MINA`, `PROB_BOMBA_ESPECIAL`, `ESPERA_BOMBA_ESPECIAL`).
- Definir el boulder.

---

## 2026-11-07 — Claude: etapa 7 (segunda parte), pergaminos y sala

- 7d: `datos/Pergaminos.js` (catálogo de efectos) y `reglas/Pergaminos.js` (build permanente, qué puede salir y armado de cartas).
  Reglas: "si ambos", "si alguno", máximo, peso que decae (vida extra), incompatibles (±1 segundo) y movimientos con nivel.
- 7e: sala de pergaminos (`sala-pergaminos`, editable): cuenta regresiva, 3 cartas, 10 segundos, el primero que toca se la lleva y queda quieto.
  Se juega con lo básico. Reemplaza a la pantalla de pactos, que se borró junto con `reglas/Pactos.js`. Se fueron las cajas de armas.
- 7f: el primer lote de efectos, con pruebas en `efectos_*.json`. Faltan los que piden sistemas nuevos (ver `DisenoV2.md` 7.4).
- Shuriken con 4 s de vida (antes 1,5), para que le alcance el tiempo de rebotar. Tile de piedra (100) en una fila nueva.
- Banco de pruebas: 291 de 291.

**Pendientes**
- Mariano: probar la sala y los pergaminos, y calibrar.
- La katana que empuja más fuerte se sacó: quedó en la lista por error (Mariano).
- Todos los pergaminos de la lista están en el catálogo; los que todavía no hacen nada muestran "(X)". Cada nivel de un movimiento es su propio pergamino.
- Las reglas se recalculan al armar cada sala, así que contemplan al J2 que entra por hotjoin y al que se queda sin vidas. En la sala no hay hotjoin.
- Arreglado: al pasar de nivel quedaba la referencia al cartel de hotjoin del nivel anterior. 295 de 295.
- Arreglado: tocar una carta no la agarraba (la conexión se armaba antes de que existieran las cartas; la prueba usaba un atajo). Ahora la prueba la toca de verdad.
- El ninja aparece en la celda de su spawn, también en la fila, y desde ahí cae. Los niveles con el spawn en la fila 0 se ven igual que antes. 296 de 296.
- Después: armas y saltos para calibrar, y los pergaminos que esperan sistemas (nivel 2, boulder, minas).

---

## 2026-11-07 — Mariano y Claude: lista de pergaminos y etapa 7 (primera parte)

- Mariano pasó la lista de pergaminos, con a quién afecta cada uno: `Docs/Pergaminos_borrador.md`. Las decisiones están en `DisenoV2.md` (7.0).
- Editor: herramientas Copiar bloque (C) y Estampar bloque (V). Copia las capas visibles y sus celdas vacías no borran al estampar.
- 7c, kit base: el ninja arranca con caminar, saltar, katana y parry. Dash, doble salto, salto de pared y caída pesada quedan para los pergaminos (`partida.habilidades`, con nivel).
- 7b, armas: cooldown y munición por nivel. Se recarga en cada nivel, la misma arma suma y otra la reemplaza. Rebotes propios: shuriken 0, bumerán 2, bomba 1.
- 7a, lo visual: lo intocable parpadea, los enemigos son intocables al entrar, brillo dorado en la Recolección, colores azul, rojo y negro, y monedas que se resquebrajan (rojas solo con el pergamino).
- Banco de pruebas: 255 de 255.

**Pendientes**
- Mariano: revisar si los niveles se pueden recorrer sin movimientos especiales, y probar el brillo y los colores.
- 7d y 7e: sistema de pergaminos y sala de pergaminos. Después, 7f: el primer lote de efectos.

---

## 2026-11-06 — Claude: etapa 8 de la v2, estados del ninja y controles

- La 7 espera la lista de pergaminos de Mariano, así que se hizo antes la 8.
- Antes de tocar nada se midió el movimiento (`movimiento.json`): no había pruebas de salto, doble salto, dash ni salto de pared. Las medidas dan igual después de reorganizar.
- `entrada/Control.js`: teclado y joystick de cada jugador en acciones. Las teclas están en `TECLAS` (`config.js`).
- `Ninja`: un solo estado por vez (`ESTADO`) y la protección en un solo lugar, medida en tiempo. Ya no depende de que termine un parpadeo.
- Cambios mínimos a propósito: morir o aturdirse durante un dash ya no deja al ninja un instante sin gravedad.
- El banco de pruebas usa `servidor.py`: el servidor simple de Python rechazaba conexiones y a veces un nivel no cargaba. Era el servidor de pruebas, no el juego.

**Pendientes**
- Mariano: probar el movimiento con teclado y joystick. Las pruebas usan solo teclado y no miden el coyote time.
- Saltar sobre ítems queda como mecánica del juego, a pedido de Mariano.
- La katana aleja los ítems del centro del ninja, y un ítem empujado es un proyectil hasta que frena. Modificadores `fuegoAmigo` y `dañoPropio` listos para los pergaminos.
- Mariano: lista revisada de pergaminos y de habilidades, para la etapa 7.

---

## 2026-11-06 — Claude: etapa 6 de la v2, trampa y fuego

- Trampa: bloque sólido. Golpea al ninja según la fase y enfurece a los enemigos, sin hacerlos vulnerables.
- Fuego (`mundo/Fuego.js`): bloque sólido que escupe bolas al azar por sus caras libres. La bola es un proyectil de los demonios, rebota, acepta parry y, al quedar quieta, deja una llama que se apaga sola. La llama golpea al ninja y enfurece a los enemigos.
- `MapTileSet.png` creció una fila: trampa en el 90 y fuego del 91 al 94. Los cuadros del fuego se detectan solos hasta el primer tile vacío. `llama.png` también anima todos sus cuadros. `bola-fuego.png` es un gráfico suelto.
- Nivel `n-peligros`, tipo `prueba`. Se abre con `?debug&nivel=3&mapa=n-peligros`.
- Arte provisorio, para reemplazar.

**Pendientes**
- Mariano: probar `n-peligros` y calibrar en `config.js` (`FUEGO_ESPERA_MIN`, `FUEGO_ESPERA_MAX`, `DURACION_LLAMA`).
- Mariano: lista revisada de pergaminos y de habilidades, para la etapa 7.

---

## 2026-11-06 — Mariano y Claude: fantasmas y gráficos en archivos

- El fantasma va siempre a toda velocidad y acelera sin tope: antes frenaba al acercarse y un ninja corriendo nunca era alcanzado. Valores en `config.js`.
- Un fantasma por jugador en pie: cada uno persigue al suyo y cualquiera mata a cualquiera. Al morir un jugador, por la causa que sea, desaparece su fantasma. Entran por el costado opuesto a los jugadores; con uno de cada lado, por arriba o por abajo, lo más lejos de su jugador.
- Si un disparo que ya iba por el aire gana la fase después de morir, se gana igual y la vida se pierde; si era la última de todos, termina la partida.
- El parpadeo tras un golpe o un pisotón no protege del fantasma, para que no se pueda explotar. Solo protege la caída al aparecer.
- Con el reloj en cero nadie reaparece hasta que el reloj vuelva a empezar. Si no queda nadie en pie, se repite: el nivel en la Recolección y con el jefe (sin los puntos ganados en él), la fase en la Cacería (con los puntos que había al empezarla, completando el cupo).
- Cacería: al acabarse el tiempo aparece el fantasma y ya no se pasa de nivel sin matar a todos.
- Los 23 gráficos generados por código pasaron a `public/assets/graficos/` y se borró `sistemas/Texturas.js`. Los beeps siguen en `Sonido`.

**Pendientes**
- Mariano: probar la dificultad del fantasma y reemplazar los gráficos que quiera.
- Mariano: lista revisada de pergaminos y de habilidades.
- Etapa 6: tiles de trampa y fuego.

---

## 2026-11-06 — Claude: etapa 5 de la v2, reglas y golpes en un solo lugar

- `reglas/Fases.js`: tabla de reglas por fase. `reglas/Resolvedor.js`: todo golpe pasa por `resolverGolpe`, con su bando y la protección del ninja.
- Un solo grupo de proyectiles, cada uno con `bando` y `duenio`. Los enemigos usan su vida real; todos tienen 1, así que siguen muriendo de un golpe.
- El juego se juega igual. La diferencia es interna: la vulnerabilidad la decide la fase y no el estar enfurecido.
- En `v2` la API de Traducila quedó apagada: los textos salen de `i18n.js` (idea de Mariano). `main` la sigue usando.
- Arreglada una prueba que fallaba al azar (la moneda que pierde valor): también fallaba sin estos cambios.
- Corregido en el wrap: el caminante no veía piso del otro lado del corte y quedaba yendo y viniendo oculto, sin dejar terminar la Cacería.
- Corregido: un archivo de nivel que no llegaba rompía el arranque. Ese error también está en `main`, y es muy poco probable que aparezca.
- Corregida la pérdida de talismanes, a pedido de Mariano: un golpe en la Recolección tira todos, que vuelven a caer, y borra las monedas, como dice el GDD. El juego perdía solo el último desde hace tiempo: en `main` sigue así.
- Rareza de la v1, para la etapa 8: tocar un ítem en el aire cuenta un instante como estar en el piso.

**Pendientes**
- Antes de pasar `v2` a `main`: decidir si los profes necesitan seguir viendo la API. Si es así, poner `TRADUCCIONES.activa` en `true`.
- Mariano: lista revisada de pergaminos y de habilidades.
- Etapa 6: tiles de trampa y fuego.

---

## 2026-11-06 — Claude: etapa 4 de la v2, wrap en un nivel de prueba

- `mundo/Mundo.js`: el wrap, en los dos ejes. Jugadores, ítems, cajas, enemigos y proyectiles cruzan; el ninja muerto no.
- Solo actúa en niveles con `"wrap": true` (el editor tiene el campo). El resto de los niveles se juega igual.
- Nivel `n-wrap`, tipo `prueba` (no entra en los niveles al azar), con huecos en los 4 lados. Se abre con `?debug&nivel=3&mapa=n-wrap`.
- Con wrap los proyectiles duran 4 s como máximo. Cambio al diseño: el corte vertical quedó una fila más abajo, para que no se vea.
- Sin agarre a paredes fuera de la pantalla, en todos los niveles (idea de Mariano). No hizo falta un tile nuevo.
- Bloques en la fila 1 traban a los enemigos que aparecen ahí: el techo va solo en la fila 0. Mariano saca los cuadrados que puse en `n-wrap`.
- Sin probar con wrap: jefes. Banco de pruebas: el escenario nuevo `wrap` cubre los 4 lados.

**Pendientes**
- Mariano: jugar `n-wrap` y decidir cómo se siente.
- Mariano: lista revisada de pergaminos y de habilidades.

---

## 2026-11-05 — Claude: el editor funciona online

- Mariano les pasó el link del editor a los profes. Online, Probar abre el nivel editado sin guardar: se lo pasa al juego por localStorage (`?debug&borrador`). En local sigue guardando en la carpeta.
- El README tiene el enlace al editor.
- Banco de pruebas: 144 de 144, con el escenario nuevo `editor_borrador`.

---

## 2026-11-05 — Mariano y Claude: la v2 pasa a main

- Mariano rediseñó el nivel `inicio` en el editor: el guardado en la carpeta real quedó confirmado.
- El banco de pruebas usa su propio servidor en el puerto 5599: Live Server recargaba la página al guardarse cada captura.
- Mariano jugó la `v2` con Live Server y dio el OK. `main` pasa a tener las etapas 1 a 3, sin wrap: se juega igual que la entrega, salvo por el nivel `inicio`.
- Para volver a la versión anterior está el tag `v1.02-entrega`.

**Pendientes**
- Mariano: lista revisada de pergaminos y de habilidades.
- Etapa 4: mundo de 34×20 con wrap, en un nivel de prueba, en la rama `v2`.

---

## 2026-11-05 — Claude: etapa 3 de la v2, editor de niveles

- `tools/editor/`: capas de fondo, skin, lógica y objetos sobre la grilla de 34×20; paleta con Tab, recientes y scroll propio;
  lápiz, rectángulo, borrar, cuentagotas, deshacer y rehacer; zoom y vista 1:1; propiedades del nivel; nuevo y duplicar; guardar y probar.
- Los tiles de trampa y fuego ya se pueden pintar. En el juego, el fuego es por ahora un bloque sólido y la trampa no hace nada, hasta la etapa 6.
- Abrir y volver a escribir los 13 niveles no cambia ni un byte. Sin los spawns de los dos jugadores el nivel no se guarda.
- El guardado se probó con una carpeta simulada: falta confirmarlo con la carpeta real en Chrome.

**Pendientes**
- Mariano: probar el editor y guardar un nivel en la carpeta real.
- Mariano: lista revisada de pergaminos y de habilidades.
- Etapa 4: mundo de 34×20 con wrap, en un nivel de prueba.

---

## 2026-11-05 — Claude: etapa 2 de la v2, niveles en archivos

- Los 13 mapas de `datos/Mapas.js` pasaron a `public/niveles/*.json`, con `indice.json`. Una comparación tile por tile con los mapas viejos dio igual en los 13.
- `mundo/Niveles.js` los carga y valida en `BootScene`; `mundo/CargadorNivel.js` arma el nivel. La skin es solo dibujo y la lógica crea bloques invisibles.
- Grilla de 34×20 ya en los archivos (`MUNDO` en `config.js`); las columnas ocultas están vacías hasta la etapa del wrap.
- `?debug&nivel=3&mapa=<id>` arranca un nivel puntual (lo va a usar el editor). `musica` y `tiempo` en `null` siguen la progresión de siempre.
- No cambia el comportamiento: 123 de 123 pruebas.

**Pendientes**
- Etapa 3: editor de niveles en `tools/editor/`.
- Mariano: lista revisada de pergaminos y de habilidades.

---

## 2026-11-05 — Claude: etapa 1 de la v2, orden y limpieza

- `scenes/` se repartió en `escenas/`, `entidades/`, `datos/`, `reglas/`, `mundo/`, `sistemas/` y `entrada/`.
- Un solo estilo de texto (`sistemas/Estilo.js`) en lugar de 26 copias.
- Valores de calibración sueltos a `config.js` y a la tabla `ARMAS` (tiempos, cupo, daño a jefes, velocidades y bomba).
- Catálogo de eventos en `datos/Eventos.js`. Botones del menú con `PAD`. Se sacaron `acorazado` y `lanzador.velocidad`, que nada usaba.
- No cambia el comportamiento: 118 de 118 pruebas después de cada paso, y capturas revisadas a ojo.

**Pendientes**
- Etapa 2: formato de nivel en JSON, cargador y conversión de los mapas actuales.
- Mariano: lista revisada de pergaminos y de habilidades.

---

## 2026-11-05 — Mariano y Claude: entrega con traducciones por API

- Las 80 frases quedaron cargadas en Traducila y verificadas contra `Docs/traducila_frases.tsv`.
- Probado en GitHub Pages: el inglés llega de la API y el español sale del juego.
- La versión entregada quedó congelada en la etiqueta `v1.02-entrega` (`main`). `v1.01-entrega` conserva la anterior.

**Pendientes**
- Retomar la etapa 1 del plan de la v2 en la rama `v2`. `main` no se toca sin acordarlo con Mariano.

---

## 2026-11-04 — Claude: traducciones por API (Traducila), pedido para la entrega

- Al arrancar, el juego pide el inglés a la API de Traducila (`TRADUCCIONES` en `config.js`); las claves son las frases en español.
- Si la API falla, usa la última copia guardada en localStorage; si no hay copia, los textos de `i18n.js`. Una frase que falte también cae al texto local.
- Las escenas no cambiaron: siguen usando `i18n.t('clave')`.
- `Docs/traducila_frases.tsv` tiene las 80 frases para cargar (se regenera con `node tools/traducciones/generar_frases.js`).

**Pendientes**
- Crear el proyecto en Traducila, cargar las frases y poner su id en `TRADUCCIONES.proyecto`. Después, mergear a `main` con el OK de Mariano.
## 2026-11-03 / 04 — Claude (sin supervisión): etapa 0, red de seguridad de pruebas

- `probar.js` verifica resultados (`verificar` + `espera`), espera condiciones (`hasta`), corre una carpeta entera,
  da un total ✔/✘ y termina con error si algo falla. Borra al terminar el perfil temporal de Edge que usa.
- `probar.ps1`: un solo comando desde PowerShell (levanta el servidor si hace falta y usa Node portable si no está instalado).
- Puerta de pruebas `window.prueba` (`scenes/PuertaPruebas.js`), solo con `?debug`: los escenarios no tocan variables internas.
- 17 escenarios y **109 verificaciones** sobre la v1.01: fases, golpes y vidas, combate, armas, enemigos, fantasma,
  los 4 jefes, cooperativo, hot-join, pausa, pergaminos, recorrido desde el título y que sin `?debug` no exista la puerta.
  Pasaron 5 corridas completas seguidas sin fallas.
- **No se cambió el comportamiento del juego** (solo se agregó la puerta, que no se instala sin `?debug`).

**Cosas que aparecieron y quedan para decidir (Mariano)**
- Al empezar un nivel, el ninja está protegido solo mientras cae: al tocar el piso ya se lo puede golpear.
  En el respawn, en cambio, sigue protegido 1,5 s más. El diseño de la v2 dice "al aparecer, intocable un rato" en los dos casos.
- En la v1 el fantasma quita una vida **también en la Recolección**. El diseño de la v2 dice "en la Recolección nadie muere":
  ¿el fantasma es la excepción o pasa a aturdir como el resto?
- El bumerán trae las monedas hasta el ninja, que las cobra solo (funciona bien; lo anoto porque en la v2 el bumerán cambia).

**Pendientes**
- Mariano: lista de pergaminos revisada, lista de habilidades y las dos decisiones de arriba.
- Siguiente: etapa 1 del plan (reordenar carpetas y limpieza), corriendo `probar.ps1` antes y después.

---

## 2026-11-02 / 03 — Mariano y Claude: análisis del proyecto y diseño de la v2

- Se analizó la arquitectura de la v1.01: está ordenada, pero `NinjaMonchoScene` concentra demasiado y las reglas por fase están desparramadas.
- La v1.01 quedó congelada en la etiqueta `v1.01-entrega`. La v2 se trabaja en la rama `v2`; `main` y Pages no se tocan mientras dura la evaluación.
- Diseño completo en `Docs/DisenoV2.md`: niveles en JSON con editor propio, mundo de 34×20 con wrap en los dos ejes,
  tiles de trampa y fuego, golpe y bando únicos, pergaminos permanentes con positivo y negativo, y rescate con llave y vórtice.

**Pendientes**
- Mariano: lista de pergaminos revisada y lista de habilidades desbloqueables.
- Empezar por la etapa 0 del plan (escenarios de prueba que fijen el comportamiento actual).

---

## 2026-10-27 — Claude: vidas por jugador, respawn y ajustes de armas y cooperativo

- Durante el cartel de "¡Sello roto!" los ninjas son invulnerables.
- Los ninjas ya no chocan entre sí; caer sobre la cabeza del compañero sigue siendo trampolín.
- Armas arrojadas de 16x16 (el dibujo provisorio ampliado al doble; el área de impacto es de 10x10). El shuriken cae un poco
  (`FISICA.caidaShuriken`).
- Vidas por jugador (`partida.vidas` es un arreglo; corazones del J2 en verde). Perder una vida ya no reinicia el nivel:
  el ninja sale despedido, atraviesa el escenario, cae fuera y reaparece arriba (`CONFIG.ESPERA_RESPAWN`, `INVUL_RESPAWN`).
  Vale para Cacería, jefe y fantasma; si es en Recolección también se le cae un talismán. El fantasma no se va al matar a alguien.
- Un jugador sin vidas queda afuera el resto de la partida; game over cuando no queda nadie.
- Nuevo escenario de prueba: `tools/navegador/escenarios/vidas_y_coop.json` (con `?debug&nivel=1&jugadores=2`).

**Pendientes**
- Sprites definitivos de las armas arrojadas (16x16).
- Calibrar la caída del shuriken y los tiempos de respawn jugando.

---

## 2026-10-27 — Claude: créditos actualizados

- Pantalla de créditos y README con los créditos definitivos: Música y SFX, Gráficos, Diseño y Programación.

---

## 2026-10-27 — Claude: arreglo de música superpuesta

- Al pasar de nivel seguía sonando el jingle de victoria (59 s) o de derrota (74 s) encima de la música nueva:
  se reproducían como efecto y nadie los cortaba. Ahora pasan por `Sonido.musica()` sin loop, así la música siguiente los reemplaza.

---

## 2026-10-27 — Claude: implementación del roadmap (fases 0 a 4)

**Hecho** (detalle en `Docs/Roadmap.md`)
- Bugs B1 a B6 resueltos (J2 con joystick al pasar de nivel, puntaje entre niveles, volumen, `Fall.ogg`, debug, animaciones).
- Salto más bajo y variable, alarma de tiempo, cartel de inicio, HUD con siluetas, pantalla Cómo jugar, pausa, récord guardado.
- Contenido del GDD: vidas, fantasma, katana, Cacería, 3 enemigos nuevos, 3 armas, cooperativo (trampolín, puntaje por jugador),
  Pergaminos de Pacto, 4 jefes, 10 niveles con mapa de aprendizaje y arena de jefes.
- Base técnica nueva: `config.js`, `BootScene`, `Partida.js`, `Sonido.js`, `Guardado.js`, `Texturas.js` (arte provisorio), Phaser local.
- Banco de pruebas en `tools/navegador/`. Probado sin errores de consola: menús, flujo completo de nivel, pergaminos (1 y 2 jugadores),
  fantasma, vidas, game over, pausa, armas y los 4 jefes.

**Decisiones tomadas** (revisables)
- Al recibir daño se pierde solo el último talismán (GDD). Configurable en `CONFIG.DAÑO_PIERDE`.
- En la pelea contra el jefe un golpe cuesta una vida sin reiniciar el combate.
- No se movieron archivos de carpeta para no generar conflictos con Mariano.

**Pendientes**
- Jugarlo y calibrar dificultad; probar con dos joysticks reales.
- Arte definitivo para lo provisorio (logo, armas, enemigos nuevos, jefes, fantasma).
- GitHub Pages (lo activa Mariano) y acordar el flujo de ramas.

---

## 2026-10-27 — Claude: análisis y roadmap

**Hecho**
- Se borraron los archivos vacíos `tipo` y `{`.
- Se analizó todo el código y se comparó con el GDD técnico. Resultado en `Docs/Roadmap.md` (fases 0 a 4).
- Bugs encontrados: J2 sin joystick al pasar de nivel (B1), puntaje que vuelve a 0 por nivel (B2), volumen de
  Opciones sin efecto (B3), `fall.ogg` con mayúsculas incorrectas (B4) y teclas de debug activas (B5).
- Salto medido: 110 px simple y 187 px con doble salto (11,6 tiles), cuando las plataformas están cada 64 px.

**Pendientes**
- Arrancar por la Fase 0 del roadmap.
- Decisiones de diseño a charlar con Mariano: ¿perder todos los talismanes o solo el último? ¿Fantasma al llegar a 0?

---

## 2026-10-27 — Claude: preparación del entorno

**Hecho**
- Se clonó el repo `marianotrod/NinjaMonchoPlus` (rama `main`, último commit `094cf86`).
- Entorno virtual `.venv` (Python 3.12, creado con `uv`) con markitdown, Pillow y mutagen (`tools/requirements.txt`).
- Se instaló GitHub CLI (`gh`). Ya estaban: git 2.55, Python 3.12, uv, ripgrep, node.
- Carpetas nuevas: `tools/` (scripts de soporte), `Docs/fuentes/` (documentos originales: docx, pdf…),
  `Docs/convertidos/` (salida de markitdown).
- Scripts: `tools/assets_info.py` (inventario de assets) y `tools/convertir_docs.py` (docs a Markdown).
- `CLAUDE.md` con el contexto del proyecto para ahorrar tokens en sesiones futuras.

**Pendientes / a charlar con Mariano**
- ~~Hay dos archivos vacíos commiteados por error en la raíz: `tipo` y `{`.~~ Borrados.
- El `README.md` sigue siendo el de la plantilla de Phaser.
- Definir el flujo de trabajo en git: una rama por funcionalidad y PR a `main`.

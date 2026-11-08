# Diseño de la versión 2 — Ninja Moncho Plus

Plano de la v2 antes de tocar código. Junta lo que se decidió entre el 2026-11-02 y el 2026-11-03.
**[Pendiente]** marca lo que falta definir y **[Probar]** lo que se decide jugando.

- La versión entregada quedó congelada en la etiqueta `v1.01-entrega`. La v2 se trabaja en la rama `v2`.
- `main` y GitHub Pages no se tocan hasta que termine la evaluación.

---

## 1. Principios

1. **Pantalla fija de 32×18 tiles de 16 px, sin scroll.** No se cambia.
2. **Pocos conceptos que se combinan:** golpe, bando, rasgo, modificador y regla de fase.
   Las features nuevas se arman con esas piezas en lugar de sumar casos especiales.
3. **Los datos, fuera del código:** niveles, enemigos, armas, pergaminos y reglas son tablas o archivos.
4. **Mundo y reglas separados:** el mundo es el mapa, los ninjas, la física, el input y el wrap.
   Las reglas son lo que se juega encima (Recolección, Cacería, jefe o pergaminos).
5. **Efectos generales:** un pergamino afecta a "tus proyectiles", no al shuriken. Nada de "+30 %".

---

## 2. El mundo

### 2.1 Grilla
El mundo mide **34×20 tiles**. La cámara muestra los 32×18 del centro.

```
         col 0   cols 1..32 (visibles)   col 33
fila 0   [   ]   techo (espejo del piso)  [   ]   oculta
fila 1   [   ]   aire: aparecen ítems y    [   ]   oculta
                 enemigos
filas 2..19      lo visible (la 19 es el piso)
```

- **Columnas 0 y 33:** buffer oculto para el wrap lateral.
- **Fila 0:** techo, espejo del piso. Sus huecos coinciden con los del piso por trabajo del diseñador; el código no lo fuerza.
- **Fila 1:** aire donde aparecen talismanes, monedas, enemigos, la llave y el vórtice.

### 2.2 Wrap-around
- **Permanente, en los dos ejes, y afecta a todo de la misma manera.** No es una propiedad del nivel.
- Un objeto se teletransporta cuando **su centro** cruza el borde del mundo. Una columna oculta por lado esconde objetos
  de hasta 32 px de ancho, así que el cruce no se ve. El cruce vertical tampoco se ve, porque pasa por las filas ocultas.
- **Apuntar y perseguir** (lanzador, ráfagas, volador, fantasma, el bumerán que vuelve): por el **camino directo**.
  Las IA no piensan en el wrap; la física sí. Está en una sola función, así que cambiarlo es fácil.
- **Todos los proyectiles tienen duración máxima,** porque ya no mueren al salir de la pantalla.
- **Excepción:** el ninja muerto (sale despedido y cae atravesando el escenario) no hace wrap.
- **Sin agarre fuera de la pantalla:** mientras el centro del ninja está fuera de la vista, las paredes no lo frenan ni le dan salto ni dash.
  Vale para cualquier nivel y no hace falta pintar nada.
- **Corte vertical:** las dos filas ocultas están arriba y abajo de la pantalla no hay ninguna. Para que el cruce no se vea en ningún extremo,
  el corte queda una fila más abajo: entre y = -16 y y = 304 (el mundo mide 320 px igual). Lo vertical mira el sentido del movimiento,
  así lo que aparece cayendo desde más arriba, como el ninja al empezar, no cruza. Además, cada vuelta por un hueco tiene tope de velocidad.
- **[Probar]** Prototipo temprano en un nivel de prueba antes de armar muchos niveles. El riesgo es la sensación de juego, no lo técnico.

Todo esto vive en un módulo **Mundo**: teletransporta, mide distancias y direcciones, y maneja las excepciones.

---

## 3. Niveles

### 3.1 Archivos
Un JSON por nivel en `public/niveles/`, más un `indice.json` que mantiene el editor (el navegador no puede listar carpetas).

```json
{
  "id": "n-piramide",
  "nombre": "Pirámide",
  "tipo": "normal",
  "tier": 1,
  "jefe": null,
  "musica": "musica-cueva",
  "fondoImagen": "fondo-cielo",
  "tiempo": 60,
  "tileset": { "clave": "MapTileSet", "columnas": 10 },
  "capas": {
    "fondo":  [[...34 valores...], ...20 filas],
    "skin":   [[...], ...],
    "logica": [[...], ...]
  },
  "objetos": [
    { "tipo": "spawnJugador", "jugador": 1, "col": 6, "fila": 1 },
    { "tipo": "spawnPergamino", "col": 10, "fila": 5 }
  ]
}
```

- **Tipos:** `inicio` (el nivel 0), `fijo` (fuera del pool, como el nivel de aprendizaje de hoy), `normal`, `jefe` y `pergaminos`.
- **Capas:** `fondo` y `skin` guardan índices del tileset (−1 = vacío). `logica` guarda un número por celda (`LOGICA` en `config.js`: 0 vacío, 1 sólido, 2 pasarela); las propiedades de una celda, cuando hagan falta, irán en una lista aparte.
- **Tileset:** crece solo hacia abajo y el ancho no cambia, así los índices no se mueven. Si algún día cambia el ancho,
  `columnas` permite recalcularlos.
- **Objetos:** se colocan en la grilla de 16 px.
- **[Pendiente]** El presupuesto de enemigos por nivel o por tier (GDD 02; el Bestiario ya tiene `costoIA`).

### 3.2 Progresión
- Unos **30 niveles** por partida.
- **Nivel 0:** siempre el mismo. Es un nivel normal y sencillo, que se recorre bien sin mejoras.
- El resto se **sortea del pool**, filtrando por **tier** (1 a 3) según el número de nivel.
- **Jefes:** cada uno con su arena o con un juego de variantes propias.
- **Nivel de pergaminos** después de cada nivel, si la economía lo permite **[Probar]**. Se sortea de su propio pool
  (de carrera para competir, o que necesiten al compañero).
- Las reglas de progresión (qué tier sale en cada número de nivel, cada cuánto hay jefe) viven en `config`, no en los niveles.

### 3.3 Tiles de lógica

| Tipo | Comportamiento |
|---|---|
| `vacio` | — |
| `solido` | Choca por los cuatro lados. |
| `pasarela` | One-way: solo choca desde arriba y se puede bajar. |
| `trampa` | Bloque sólido que daña al ninja desde cualquier dirección. Enfurece a los enemigos. |
| `fuego` | Bloque sólido que escupe bolas de fuego al azar (ver 6.4). |

- La colisión es siempre por tile completo.
- **Para más adelante (dejarlos posibles):** barrera espiritual (deja pasar a los ninjas y no a los demonios, o al revés)
  y corriente de aire (empuja hacia arriba).
- **Descartados:** plataformas móviles, hielo, rompibles, escaleras y rebote.

### 3.4 Objetos del nivel
- Se colocan a mano: spawn del J1, spawn del J2 y spawns de pergaminos.
- Aparecen desde el aire (fila 1): talismanes, monedas, enemigos, la llave y el vórtice.

---

## 4. Editor de niveles

Una página en `tools/editor/`, sin build y para uso de Mariano.

- **Vista:** el mundo completo de 34×20, con líneas que marcan la zona oculta. Zoom ×2 o ×3, más un **botón 1:1** para revisar las costuras.
- **Capas:** fondo, skin, lógica y objetos. Cada capa se puede mostrar u ocultar, y la lógica se ve semitransparente sobre la skin.
- **Paleta:** en un panel lateral con scroll propio (la rueda del mouse sobre la paleta la mueve; sobre el mapa hace zoom).
  **Tab** la muestra u oculta. Tiene una fila de recientes. La paleta cambia según la capa: tiles, tipos de lógica u objetos.
- **Herramientas:** lápiz, rectángulo, borrar, cuentagotas y deshacer.
- **Propiedades** del nivel y del tile o el objeto seleccionado (por ejemplo, el intervalo de un tile de fuego).
- **Archivos:** abre y guarda directo en `public/niveles/` (con la API de archivos de Edge) y actualiza `indice.json`.
- **Probar:** abre el juego con `?debug&nivel=<id>`.
- **Conversión inicial:** un script pasa los 13 mapas ASCII actuales al formato nuevo. El juego tiene que quedar igual.
- Sin autotile y sin validador entre skin y lógica: lo controla el diseñador probando.

---

## 5. Reglas de juego

### 5.1 Fases
- **Nivel normal:** intro → Recolección → transición → Cacería → completado.
- **Nivel de jefe:** intro → jefe → completado.
- **Nivel de pergaminos:** se juega con lo **básico**, sin mejoras ni desventajas activas.

Cada fase es una **tabla de reglas**. El resto del código consulta la tabla y no pregunta "¿en qué fase estoy?":

| Regla | Recolección | Transición | Cacería | Jefe | Pergaminos |
|---|---|---|---|---|---|
| Los enemigos son vulnerables | no | — | sí | sí | — |
| Un golpe al ninja | aturde, se caen todos los talismanes (vuelven a aparecer) y desaparecen las monedas | nada | cuesta una vida | cuesta una vida | no hay peligros |
| Corre el reloj | sí | no | sí | sí | sí, corto (≈5 s) |
| Aparecen enemigos | sí | no | cupo | los del jefe | no |
| Pergaminos activos | sí | sí | sí | sí | no |

### 5.2 Protección del ninja

| Estado | Lo pueden aturdir | Recibe daño |
|---|---|---|
| normal | sí | sí |
| invulnerable | sí | no |
| intocable | no | no |

- **Al aparecer** (inicio, respawn o rescate), el ninja es **intocable** un rato.
- **En la Recolección nadie muere:** trampa, fuego y enemigos tienen el mismo efecto que un golpe común.
- **La excepción es el fantasma:** aparece cuando se acaba el tiempo de la Recolección, la Cacería o la pelea con el jefe. Hay uno por jugador en pie: cada uno persigue al suyo y cualquiera puede matar a cualquiera. Cuando un jugador muere, por la causa que sea, desaparece **su** fantasma, así que nunca quedan dos para uno. Con los jugadores del mismo lado, o con uno solo, entran por el costado opuesto, a la altura de su objetivo; con uno de cada lado, cada uno entra en la columna de su objetivo, por arriba o por abajo, lo más lejos de él. No hacen wrap. Acelera sin tope, así que tarde o temprano no se lo puede esquivar. Ignora el parpadeo tras un golpe o un pisotón; solo respeta la caída al aparecer.
  - **Con el reloj en cero nadie reaparece,** en ninguna fase y por ninguna causa: quien muere espera, y el compañero todavía puede lograr el objetivo. Reaparece cuando el reloj vuelve a empezar, por cambio de fase o de nivel.
  - **El último disparo cuenta:** si un proyectil que ya iba por el aire gana la fase después de morir, se gana igual. La vida se pierde de todos modos, y si era la última de todos, termina la partida.
  - **Si no queda nadie en pie, se repite:** en la Recolección y con el jefe recomienza el nivel, sin los puntos obtenidos en él, para que morir y recomenzar no se pueda explotar. En la Cacería recomienza la fase, con los puntos que había al empezarla. Vuelven los que tengan vidas.
  - **Cacería:** ya no se pasa de nivel sin matar a todos.
  - **[Pendiente]** Si los pergaminos o el "sobrevivir a la muerte" cambian algo.

### 5.3 Enemigos
- **Enfurecido** = rojo, más rápido y más agresivo (por ejemplo, dispara más seguido). **Nada más.**
- La **vulnerabilidad la decide la fase:** en la Recolección nunca se los puede matar; en la Cacería, siempre.
- **Tienen HP:** cada golpe resta su daño y mueren al llegar a 0. Por ahora los valores están balanceados para morir de un golpe.
- Lo que los enfurece: el paso a la Cacería, la trampa, la llama y algunos pergaminos negativos.
- Al entrar a la pantalla son intocables mientras entran y 1,2 s más (`ENTRADA_ENEMIGO`).
- **Esqueleto** (reemplaza al demonio caminante, que queda en el bestiario con peso 0 para las pruebas): camina, a veces
  frena, a veces salta unos 2,5 tiles (así sube escalones y no se traba), a veces baja de una pasarela y de vez en cuando
  tira una cuchilla hacia adelante con una curva chica, avisando antes con un cuadro. En un tile suelto no camina: se da vuelta.
- **Samurái:** camina igual pero no tira nada. Si un ninja pasa por delante, a su altura y cerca, se prepara y corre.
  La katana rebota si no está aturdido; proyectiles, explosiones y pisotones lo aturden sin dañarlo. Aturdido, muere como cualquiera.
- Los dos tienen gravedad propia y su comportamiento se calibra en `datos/Bestiario.js`. Gráficos: `esqueleto.png`,
  `samurai.png` (hojas de cuadros) y `cuchilla.png`.

### 5.4 Fin de partida y rescate
- La partida termina cuando **todos** los jugadores se quedan sin vidas.
- Si se queda sin vidas **uno solo**, en el nivel siguiente (decidido el 2026-11-08: al empezar, no en la Cacería):
  - Un poco después de que el vivo toca el piso (`CONFIG.RESCATE.espera`), desde el spawn del muerto cae una **jaula**
    (se verá si es vórtice o qué; gráfico provisorio `jaula.png`, 16×16) con el compañero adentro.
  - Desde el spawn del vivo cae una **llave** (`llave.png`).
  - Con el reloj en cero (fantasma) la jaula no se abre: nadie reaparece (`CONFIG.RESCATE.conFantasma`).
  - Código: `mundo/Rescate.js`. Prueba: `rescate.json`.
  - La llave se agarra tocándola. **Mientras la lleva, el ninja no puede atacar ni disparar:** si lo intenta, la arroja.
  - Si el que la lleva recibe un golpe, la llave se le cae.
  - La katana, los proyectiles y las explosiones empujan la llave y el vórtice. Si los enemigos también los empujan es **[Probar]**.
  - El vórtice **solo se abre si lo toca un ninja que lleva la llave.** La llave suelta no lo abre.
  - Al abrirse, el muerto aparece en su spawn con **1 vida**, intocable un rato.
  - Los proyectiles de los jugadores todavía no empujan la llave ni la jaula (la katana y las explosiones sí).
- **Pisar proyectiles** (`CONFIG.PISAR_PROYECTIL`): cayendo sobre un proyectil que te dañaría (también un ítem lanzado)
  y apretando saltar en los últimos 150 ms, se rebota encima y el proyectil se rompe. Sin el salto a tiempo, golpea.
  - El sobreviviente no está obligado a rescatarlo. Si el nivel termina sin rescate, el vórtice y la llave vuelven en el nivel siguiente.
- El jugador muerto **no participa** del nivel de pergaminos.

### 5.5 Nivel de pergaminos
La idea es **decidir bajo presión**.
- **Sin peligros:** ni enemigos, ni trampas, ni fuego. Más adelante puede haber variantes que pidan resolver algo de forma creativa o cooperar.
- **Armado base:** los 3 pergaminos sobre una misma pasarela, equidistantes y más arriba. Los jugadores aparecen justo debajo, en el medio,
  así quedan más o menos a la misma distancia de todos los pergaminos.
- **Cuenta regresiva 3… 2… 1** antes de poder moverse.
- **Reloj corto: unos 5 segundos** para agarrar un pergamino.
- **Al agarrar uno, el jugador queda congelado** y no puede tomar otro (con una animación).
- Se juega con lo básico: no funciona ninguna mejora ni desventaja.
- Si se acaba el tiempo y alguien no agarró ninguno, **se queda sin pergamino**.
- Empate (los dos tocan el mismo pergamino en el mismo instante): se decide al azar.

---

## 6. Interacciones

### 6.1 El golpe
Todo contacto que hace algo genera un **golpe**, y lo resuelve un solo **resolvedor**:

```js
{ tipo, fuente, dueño, bando, dirección, fuerza, daño, origen }
// tipo:   katana | proyectil | pisotón | explosión | contacto | trampa | llama | fantasma
// origen: para excepciones (por ejemplo, el escudo de "sobrevivir a la muerte" ignora el origen 'fantasma')
```

El resolvedor mira el golpe, las **reglas de la fase**, los **rasgos** del objetivo y los **modificadores** activos, y decide:
aturdir, dañar, matar, empujar, desviar, rebotar o nada. La regla "en la Cacería mata, en la Recolección aturde" vive solo acá.

### 6.2 Bando
- Hay un solo grupo de proyectiles. Cada proyectil tiene **dueño** y **bando** (jugadores o demonios).
- **Parry:** la katana le cambia el bando y la dirección a un proyectil.
- **Desviar el proyectil del compañero** sale de la misma regla.
- **Fuego amigo** es un modificador que hace que los proyectiles de un jugador puedan golpear al otro.
- **Daño propio** es un modificador que hace que los proyectiles de un jugador lo golpeen a él mismo. Sin él, tu proyectil no te hace nada.
- **Saltar sobre ítems:** tocar un talismán o una moneda desde arriba cuenta como pisar el piso por un instante: recarga los saltos y permite saltar. Es una mecánica buscada.

### 6.3 Rasgos
Cada entidad declara qué es y el resolvedor actúa según eso. Algunos rasgos:

| Rasgo | Significado |
|---|---|
| `pisable` | Se lo puede pisar desde arriba y da rebote (enemigos, **proyectiles**, incluso los propios). |
| `desviable` | La katana le cambia la dirección o el bando. |
| `empujable` | La katana y las explosiones lo mueven (talismanes, monedas, llave, vórtice). La katana lo aleja del centro del ninja, con una subida mínima. Un ítem empujado es un proyectil de quien lo empujó hasta que frena: golpea una vez a cada objetivo, sigue su camino y se puede juntar. |
| `saltarin` | Rebota y pierde el rebote de a poco. |
| `cargable` | Un ninja lo puede llevar (la llave). |
| `danino` | Daña al tocarlo; tiene dirección (de cualquier lado o solo de costado). |

- **Pisar un proyectil:** el proyectil **sigue su camino** y el ninja rebota.
  - Si también se pueden pisar los proyectiles enemigos: **[Probar]**.
  - **[Probar]** dos variantes: (a) desde arriba lo pisás y de costado te daña, igual que con los enemigos;
    (b) en los dos casos hay que **timear** el salto para no recibir daño.

### 6.4 Proyectiles
- **Por defecto se destruyen al tocar cualquier cosa:** el shuriken se rompe, la bomba explota y el bumerán explota.
  Sí cuentan los talismanes, las monedas, los enemigos, los tiles y los jugadores.
- **Al impactar** empujan talismanes y monedas y aturden o dañan a los enemigos, según la fase.
- Tienen `rebotes: 0` y los pergaminos lo suben. Cada rebote gasta uno.
- El bumerán vuelve al dueño solo si no tocó nada. **Ya no arrastra ítems** (podría volver con un pergamino).
- **Bola de fuego** (del tile de fuego): proyectil de los demonios con el rasgo `saltarin`, que pierde el rebote rápido.
  Cuando queda quieta se convierte en una **llama**: objeto `danino` que dura un tiempo y se apaga sola.
  Se le puede hacer parry. La llama **no mata a los enemigos: los enfurece**.

### 6.5 Objeto cargable
Un ninja que carga algo no puede atacar ni disparar; si lo intenta, lo arroja. Si recibe un golpe, lo suelta.
La llave es el primer caso, pero sirve para cualquier objeto futuro.

### 6.6 Eventos
El resolvedor y las reglas emiten eventos de lo que pasó (`enemigo-aturdido`, `proyectil-desviado`, `vida-perdida`…).
El sonido, las partículas, el puntaje y la UI escuchan sin mezclarse con la lógica. Los nombres van en un catálogo único.

---

## 7. Pergaminos

### 7.1 Reglas
- Se juntan en un **nivel jugable:** los pergaminos son objetos de **32×64** (arriba el efecto positivo y abajo el negativo,
  cada parte de 32×32) y **el primero que llega se lo lleva**.
- Son **permanentes:** forman el "build" de la partida y no se pierden. Los **negativos también son permanentes**, por eso hay que balancearlos.
- **Ranuras:** uno de la misma ranura reemplaza al anterior (por ejemplo, el arma). El descartado puede volver a salir.
- **No se ofrece** un pergamino que ya tienen todos los jugadores.
- Se puede agarrar uno que ya tenés: no ganás nada, recibís el negativo y se lo bloqueás al compañero.
- Cada negativo dice si afecta **solo al que lo agarró** o **a todos**.
- Las armas ya no vienen en cajas: **se obtienen con pergaminos y usan cooldown y munición** (decidido el 2026-11-07).
  La munición se recarga al empezar cada nivel. Un arma por jugador: la misma suma munición, otra la reemplaza.
  Cada arma tiene sus rebotes base (shuriken 0, bumerán 2, bomba 1) y se destruye en el golpe siguiente al último.
- **Habilidades base:** moverse, saltar, katana y parry. El parry viene desde el principio: es útil y crea variedad.
  Dash, doble salto, salto de pared, caída pesada y boulder se desbloquean con pergaminos, son acumulativos y tienen nivel 2.

### 7.0 Decisiones del 2026-11-07
- **Cada pergamino combina al azar un positivo y un negativo:** una carta de 2×4 tiles, mitad verde arriba (positivo) y mitad roja abajo (negativo), con texto chico en cada parte. La estética se ve después.
- **Sala de pergaminos:** 3 cartas y dura **10 segundos** (calibrable).
- A quién afecta cada efecto: lo aclara Mariano en la lista revisada.
- **Colores de los proyectiles:** azul los de los jugadores (dañan a los enemigos), rojo los de los enemigos (dañan a los jugadores), negro dañan a todos, incluido quien los lanzó. Un ítem empujado toma el color de quien lo empujó.
- **Bombas:** la azul (del jugador) no te daña; la negra sí. Las dos empujan.
- **Fuego amigo:** todos los proyectiles de los jugadores pasan a negros. Los proyectiles enemigos **no** dañan a otros enemigos: si no, se podría terminar un nivel por casualidad.
- **Lo intocable parpadea mientras lo es.** Los enemigos son intocables al entrar en la pantalla.
- **Glow dorado** en lo que no puede morir durante la Recolección: los ninjas y los enemigos.
- **Monedas:** se resquebrajan al perder valor, sin cambiar de color. Ponerse rojas pasa a ser un pergamino negativo.
- **Tile de piedra** para el pergamino de pisar trampas: provisorio, Mariano lo reemplaza.

### 7.2 Cómo se define cada mitad
```js
{
  id: 'rebote-propio',
  efecto: { stat: 'proyectiles.rebotes', op: 'sumar', valor: 1 },
  alcance: 'jugador',          // jugador | todos
  maximo: null,                // null = apilable · 1 = único por jugador
  peso: 10,                    // qué tan seguido sale
  decae: 0,                    // cuánto baja el peso cada vez que alguien lo toma (la vida extra)
  tope: null,                  // por ejemplo, el reloj máximo
  incompatible: [],            // ids con los que no puede salir en el mismo pergamino
  requiere: null,              // por ejemplo, 'habilidad.dash' o 'jugadores=2'
  ranura: null                 // por ejemplo, 'arma'
}
```
Si el efecto ya existe, agregar un pergamino es agregar un dato. Si el efecto es nuevo, se programa una sola vez.

### 7.4 Estado del catálogo (2026-11-07)
Todos los de la lista revisada están en `datos/Pergaminos.js` y todos funcionan. "La katana empuja más fuerte" se sacó.
- **Movimientos:** cada uno es un solo pergamino que sube un nivel a quien lo toma, hasta 2. La carta dice "nivel 2" solo si
  todos los jugadores en juego ya lo tienen (si no, quien lo toma podría estar sacando el nivel 1).
- **Caer de muy alto** (`CONFIG.CAIDA_ALTA`, se puede apagar): se mide la altura caída, 190 px (2/3 de la pantalla); se sigue
  sumando si se cae por un hueco y se entra por arriba. Al tocar el piso desde ahí, 400 ms sin control.
- **Boulder:** saltar en los últimos 100 ms antes de tocar el piso desde muy alto → rueda 600 ms hacia donde mira, intocable,
  golpeando a lo que toca. Entre 100 y 250 ms → aterriza sin castigo. Mientras cae alto y cerca del piso, saltar no gasta el
  doble salto. Nivel 2: los enemigos que toca salen disparados y golpean a los otros; en la Cacería mueren al terminar el vuelo.
- **Plataforma fantasma:** es una pasarela temporal. Se coloca alineada a la grilla, en una celda entera como cualquier pasarela, no en el píxel exacto donde se generó.
- Las reglas de aparición se evalúan al armar cada sala con los jugadores en juego: el J2 cuenta desde que entra por hotjoin y deja de contar sin vidas. En la sala no hay hotjoin.
- Agregados el 2026-11-08: katana un tile más larga, katana un tile más alta y parry en 360 (solo el parry; el ataque sigue igual).
  El dash nivel 2 pasó a ser un katanazo durante el dash (golpea y hace parry).

### 7.3 Lista actual (borrador de Mariano; la revisa y la completa)
**Positivos**
- Tus proyectiles rebotan 1 vez más (apilable).
- Doble salto, dash, caída pesada, wall jump (únicos).
- 1 vida extra (apilable; la chance baja cada vez).
- El parry impulsa con más fuerza durante un tiempo (único).
- +1 s en el reloj (apilable hasta un máximo; incompatible con −1 s).
- Shuriken, bumerán, bomba y otras armas (ranura `arma`).
- Nada positivo (incompatible con nada negativo).
- Sobrevivís a la muerte 1 vez: un escudo que se rompe una vez y no protege del fantasma.

**Negativos**
- Los proyectiles enemigos rebotan 1 vez más (apilable).
- −1 s en el reloj (apilable hasta un mínimo; incompatible con +1 s).
- Nada negativo (incompatible con nada positivo).
- Pisar enemigos los enfurece (único por jugador).
- Los enfurecidos contagian a otros al tocarlos (único).
- El primer enemigo de cada nivel tiene un escudo que se rompe con el primer golpe.
- A veces aparece una mina de tierra en lugar de una moneda: solo afecta a los jugadores, se destruye con proyectiles y sigue en la Cacería.
- A veces aparece una bomba de tiempo en lugar de una moneda (mismas reglas).
- Fuego amigo (único; afecta a los dos; requiere 2 jugadores).

Las sugerencias de Claude para sumar (perforación, imán, reloj congelado, dash cortante, venganza, talismanes fugaces, etc.)
están en las notas de la conversación, para elegir o descartar.

---

## 8. Arquitectura de código

```
main.js, config.js, i18n.js
escenas/       Boot, Title, Options, HowToPlay, Credits, Juego, UI, Pausa
mundo/         Mundo (grilla y wrap), CargadorNivel, Camara
reglas/        Fases (tablas de reglas), Resolvedor (golpes), Progresion, Partida
entidades/     Ninja, Enemigo, Jefe, Proyectil, Item, Llave, Vortice, Pergamino, Fantasma
rasgos/        saltarin, caminante, volador, lanzador, pisable, empujable, cargable...
datos/         Bestiario, Jefes, Armas, Pergaminos, Eventos
sistemas/      Spawner, Efectos (juice), Sonido, Guardado
entrada/       Control (acciones por jugador: teclado y joystick), MenuInput
public/niveles/  JSON de los niveles
tools/editor/    editor de niveles
```

- **Juego** (lo que hoy es `NinjaMonchoScene`) arma el mundo, crea los sistemas y delega en ellos. Deja de resolver todo por sí misma.
- **Ninja** pasa a ser una **máquina de estados explícita** (de pie, en el aire, dash, wall jump, aturdido, muerto, cargando…),
  con la protección en un solo lugar y no en tweens sueltos.
- **Control:** una sola capa de input por jugador que entrega acciones (saltar, atacar, dash…). Permite remapear las teclas y usar bots en las pruebas.
- **Rasgos de enemigos y patrones de jefe** como módulos registrados: el Bestiario solo nombra los que usa.

---

## 9. Plan de trabajo

| # | Etapa | Resultado verificable |
|---|---|---|
| 0 | ✔ Red de seguridad: escenarios de `probar.js` que fijan el comportamiento actual | Hecho: 109 verificaciones pasan sobre la v1.01 |
| 1 | ✔ Reordenar carpetas, limpieza, constantes y catálogo de eventos | Hecho: 118 pruebas pasan y el juego sigue igual |
| 2 | ✔ Formato de nivel + cargador + conversión de los 13 mapas | Hecho: el juego sigue igual y lee JSON |
| 3 | ✔ Editor de niveles | Hecho: pinta, guarda y prueba (falta confirmar el guardado real en Chrome) |
| 4 | ✔ Mundo de 34×20 + wrap + nivel de prueba | Hecho: `n-wrap`; solo en niveles con `"wrap": true` hasta decidir si es permanente |
| 5 | ✔ Reglas por fase, golpe, bando, protección y HP de los enemigos | Hecho: mismo comportamiento, código centralizado |
| 6 | ✔ Tiles de trampa y fuego | Hecho: funcionan en `n-peligros` |
| 7 | ✔ Pergaminos permanentes + sala de pergaminos + armas con cooldown y munición | Hecho el primer lote; faltan los que piden sistemas nuevos (ver 7.4) |
| 8 | ✔ Ninja como máquina de estados + input unificado | Hecho: `entrada/Control.js`, estados en `Ninja`, mismas medidas de movimiento |
| 9 | Rescate (llave y vórtice), pisar proyectiles, parry | Probar las variantes |
| 10 | Contenido: niveles, enemigos, pergaminos, jefes, balance | — |

Cada etapa queda jugable y probada antes de pasar a la siguiente.

---

## 10. Pendientes
- La lista de pergaminos revisada (Mariano).
- La lista completa de habilidades desbloqueables.
- El presupuesto de enemigos por nivel o por tier.
- Las variantes que se definen jugando: pisar proyectiles (normal o timeado), si los enemigos empujan la llave,
  el cooldown frente a la munición, la economía de un nivel de pergaminos por nivel y la sensación del wrap.

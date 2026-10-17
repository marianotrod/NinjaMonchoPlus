# Game Design Document (GDD): Ninja Moncho

## 1. Visión General y Arquitectura Técnica
*   **Motor de Juego:** Phaser 3 (JavaScript/HTML5).
*   **Resolución:** 512x288 px (Pixel Art).
*   **Arquitectura Escalable:** Fuerte enfoque en clases modulares y parámetros. Cero *hardcodeo*. Físicas, *inputs* y datos se manejan mediante objetos de configuración globales (ej. `FISICAS.gravedad`).
*   **Reutilización de Lógica:** Las entidades comparten mecánicas base. Por ejemplo, arrojar un shuriken o arrojar la "Llave" de rescate comparten la misma clase de físicas arrojables, diferenciándose únicamente por los parámetros inyectados (sprite, daño, peso, hitbox).
*   **Física Arcade:** Simple, rebotes, sin rotación de objetos.
*   **Internacionalización (i18n):** Soporte bilingüe (Inglés/Español). Los textos se gestionan desde un módulo de diccionario centralizado en código.
*   **Persistencia de Datos:** Uso de `localStorage` para guardar la configuración de teclas, idioma, puntaje máximo local y estado de desbloqueos entre sesiones.

## 2. Core Loop y Flujo de Partida
*   **Flujo Base (Estructura Roguelite):** Pantalla de Título -> Gameplay Nivel 0 (Fijo) -> Selección de Pergaminos -> Siguientes niveles elegidos al azar de un pool de niveles (Fase de Recolección -> Fase de Cacería) -> Repite.
*   **Progresión y Jefes:** El juego consta de 30 niveles. Cada 10 niveles (Niveles 10, 20 y 30) hay un enfrentamiento contra un Jefe elegido al azar de un pool de 3 disponibles.
*   **Victoria y Derrota:** Al derrotar al Jefe del nivel 30, se gana el juego. No hay "Continues"; si los jugadores pierden todas sus vidas es Game Over definitivo y se debe empezar una nueva *run* desde el principio.
*   **Score Global:** El puntaje es cooperativo y compartido por el equipo. Se integrará una API para una tabla de clasificación (Leaderboard) global online, con *fallback* a guardado en `localStorage` si no hay conexión a internet.
*   **Sistema Cooperativo:** Drop-in/Hot-join habilitado. Los jugadores comparten vidas.

## 3. Estados del Juego (Fases del Nivel)
Los niveles se dividen en dos fases diferentes:

### A. Fase de Recolección (Mecánica de Talismanes)
*   **Objetivo:** Recolectar 3 talismanes de cada uno de los 3 tipos: cuadrado, rombo, triángulo. Al obtener estos 9 talismanes objetivo termina la fase de recolección y comienza la siguiente fase: Cacería.
*   **Aparición (Spawn/Drop):** 12 talismanes, 4 de cada tipo, caen desde arriba uno cada X segundos.
*   **Física de Talismanes y Monedas:** Los talismanes y Monedas caen desde arriba con un ángulo oblicuo. Cada vez que rebotan pierden un poco de fuerza y siguen rebotando hasta detenerse por completo.
*   **Monedas:** Al recoger un talismán cae una moneda desde arriba. Las monedas tienen un valor base y pierden un 10% de su valor cada vez que rebotan contra algo. Una moneda completamente detenida solo vale 10 puntos. Los puntos de las monedas se obtienen al recogerlas. Al recoger una moneda otra vuelve a caer desde arriba. 
*   **Pérdida de Talismanes:** Si el jugador es aturdido pierde todos los talismanes acumulados y desaparecen todas las monedas disponibles en el mapa. Los talismanes vuelven a caer desde arriba con la misma lógica del spawn inicial.
*   **Modificador de Daño:** Durante esta fase, los talismanes emiten una magia protectora en todo el mapa. Cualquier daño recibido por jugadores o enemigos solo produce un empujón (*knockback*) y un breve aturdimiento (*stun*) a las entidades.
*   **Límite de Tiempo:** La fase tiene un contador regresivo. Si llega a 0 antes de juntar los 3 talismanes de cada tipo:
    1. Se penaliza a los jugadores quitando 1 vida compartida.
    2. Se pierden los puntos obtenidos desde el inicio de la fase.
    3. La fase se reinicia a su estado inicial.
*   **Condiciones de fracaso:** Si los jugadores pierden todas las vidas pierden el juego.
*   **Condiciones de victoria:** Al recolectar el último talismán requerido, el reloj se detiene. Las monedas y talismanes restantes desaparecen. El juego se pausa (congelamiento/hit-stop global), aparece un aviso en pantalla. Se muestran los puntos obtenidos y se multiplican por los segundos restantes en el reloj. Se muestra el puntaje final obtenido en esta fase. La fase de recolección se considera concluida. Aparece un cartel y comienza la fase de Cacería.

### B. Fase de Cacería
*   **Objetivo:** El objetivo de esta fase es eliminar a la mayor cantidad de enemigos posible antes que se termine el tiempo del reloj.
*   **Modificadores:** Se desactiva la protección. Ahora los enemigos y jugadores pueden recibir daño y morir.
*   **Salud de jugadores:** Los jugadores mueren con un solo hit.
*   **Salud de enemigos:** Los enemigos comunes mueren de un hit, pero ciertos enemigos pueden requerir más. La barra de vida de los enemigos está oculta. Al recibir daño sin morir, cambian visualmente a un **estado "Enraged"** (brillo rojizo o cambio de sprite) y se vuelven más peligrosos. `[PENDIENTE: LISTA de enemigos y mecánicas Enraged]`.

## 4. Mecánicas del Jugador (Inputs y Físicas)
El sistema de *inputs* soporta teclado y hasta 2 Gamepads (Plug & Play). 
*   **Mapeo por defecto:** 
    *   **P1:** Flechas (Mover/Saltar) + Teclas O/P o K/L (Katana y Arma Especial).
    *   **P2:** WASD (Mover/Saltar) + Teclas V/B (Katana y Arma Especial).

**Movimientos Habilitados (Sistema de Lock/Unlock):**
*   **Caminar y Saltar:** Por defecto.
*   **Pogo (Rebote en cabeza):** Funciona con enemigos y aliados. Al caer sobre la cabeza se produce un rebote pasivo pequeño. Si el jugador presiona *Salto* en el frame de impacto, ejecuta un salto normal completo.
*   **Dash Lateral:** Ejecutado con doble-tap direccional (suelo o aire). En Cacería funciona como *hitbox* ofensiva. En Recolección sirve para empujar. Si el *Parry* está desbloqueado, dashear hacia un proyectil lo desvía.
*   **Doble Salto:** Permite un segundo salto en el aire. Se puede utilizar siempre y cuando el personaje no esté en estado de "caída pesada/pataleo".
*   **Wall Jump (Pique):** Salto + dirección contraria al tocar una pared. Aplica una penalización que remueve el control aéreo direccional por un breve periodo de tiempo (impide escalar infinitamente la misma pared).
*   **Caída Pesada y Aterrizaje (Risk/Reward):** Caer desde mucha altura activa animación de pataleo. 
    *   *Fallo:* El ninja choca y queda aturdido en el suelo.
    *   *Timing Bueno (Botón Salto):* Aterriza de pie limpiamente.
    *   *Timing Perfecto (Botón Salto):* Ejecuta un *Roll* horizontal que stunea a los enemigos cercanos.

## 5. Combate, Fuego Amigo y Armas
*   **Katana (Ataque Base):** No tiene fuego amigo. Daña enemigos en Cacería y sirve para ejecutar **Parry**. Al golpear un objeto o proyectil, invierte su momentum y lo convierte en un proyectil aliado (dirección opuesta o hacia donde mira el player).
*   **Armas Especiales (Arrojables):** Requieren ser desbloqueadas. **Tienen fuego amigo**. Solo se puede portar una a la vez. Utilizan la misma clase física de proyectiles parametrizados. `[A DEFINIR: Lista de armas (shuriken, bomba, boomerang, etc.), radio de explosión, velocidad y daño]`.

## 6. Cooperativo y Sistema de Rescate
*   **Colisión Amiga:** Los jugadores se traspasan al caminar en el eje horizontal. Solo interactúan físicamente en el eje vertical (sistema de Pogo).
*   **Rescate (Llave y Jaula):** Si un jugador muere, respawnea atrapado en una jaula. El aliado debe transportar una llave para liberarlo.
*   **Físicas de la Llave:** El jugador la lleva balanceada sobre la cabeza. La llave cae inmediatamente si el jugador recibe daño, o si realiza cualquier acción brusca que no sea caminar, saltar o caer de forma limpia. 

## 7. Enemigos, Jefes y Entorno
*   **Sistema de Spawns (Presupuesto de IA):** La aparición de enemigos está dictada por un sistema matemático. Cada nivel tiene un presupuesto de amenaza (que aumenta a medida que la *run* avanza). Cada tipo de enemigo cuesta puntos (ej. básico = 1 pt, pesado = 3 pts). El juego sortea enemigos hasta agotar el presupuesto de ese nivel y los sitúa en puntos de spawn de Tiled.
*   **Blueprints de Enemigos:** Se utiliza una clase maestra `Enemigo`. Cada variante se construye inyectando parámetros booleanos (vuela, dispara, corre).
*   **Tilemap:** Los niveles se diseñan lógicamente mediante arrays/caracteres (bloques impasables, one-way, trampas) compatibles con exportaciones JSON de *Tiled*.
*   **Jefes (Bosses):** Los enfrentamientos ocurren en Arenas exclusivas separadas de los mapas estándar, con diseño pensado para la mecánica de cada jefe. `[A DEFINIR: Triggers de aparición, mecánicas de las 3 arenas y patrones de ataque]`.

## 8. Progresión y Desbloqueos
*   **Pergaminos de Mejora (Riesgo / Recompensa):** Entre fases/niveles, los jugadores ingresan a una pantalla de selección estilo *draft* (3 pergaminos). Cada mejora es individual por jugador.
*   **Sistema de Combinación Oculta:** Cada pergamino de mejora positiva tiene combinada internamente una penalización (negativa) asignada al azar.
*   **Interpretación:** En la pantalla de selección, los pergaminos no tienen descripciones de texto, solo iconos o dibujos crípticos. Al recogerlo, el juego revela el efecto exacto (o emite una pista abstracta).
*   **Economía de Builds:** `[PENDIENTE: LISTA de mejoras positivas, LISTA de penalizaciones negativas e iconografía asociada]`.

## 9. Dirección de Audio y Game Juice
*   **Música y SFX:** Los *assets* son ripeos en .wav/.ogg del juego *Ninja Kid 2* (proyecto académico UNRaf). El diseño sonoro emula las limitaciones de la arquitectura NES 2A03 (Ondas cuadradas para melodías, triángulo para bajos, canal de ruido para efectos e impactos).
*   **Game Juice y Feedback (Opciones modulares a ajustar):**
    *   *Hit-Stop:* Congelamiento de frames en parries y golpes críticos.
    *   *Screen Shake:* Al recibir daño o ejecutar un aterrizaje/roll perfecto.
    *   *Ghost Trails (Estelas):* Efecto visual translúcido al utilizar el Dash.
    *   *Partículas:* Polvo al derrapar, picar en la pared o aterrizar.
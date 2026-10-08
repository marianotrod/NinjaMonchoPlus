# NINJA MONCHO PLUS - Manual de Especificaciones Técnicas y Sistemas (GDD)

---

## 1. Visión General del Proyecto

### 1.1. High Concept
Juego de plataformas arcade 2D de ritmo rápido en arena cerrada de pantalla fija. Cada nivel se divide en dos fases cronometradas sucesivas:
1. **Fase de Recolección (No Letal):** Plataformeo acrobático, recolección de talismanes bajo degradación cinética, empuje y aturdimiento de entidades sin daño directo bajo presión de tiempo.
2. **Fase de Cacería (Letal):** Eliminación agresiva de amenazas en estado enfurecido (Enraged) mediante armas de impacto directo antes de que expire el temporizador.

### 1.2. Plataformas y Dependencias
* **Plataformas Objetivo:** PC (Web, itch.io, eventual empaquetado para Steam).
* **Motor:** Phaser 3 (rama estable oficial mediante CDN o npm). Prohibido el uso de versiones experimentales.
* **Módulo de Ejecución:** ES Modules (<script type="module">, sintaxis nativa import / export).

### 1.3. Localización (i18n)
* **Estructura:** Archivos JSON desacoplados clave-valor (es.json, en.json) para textos de interfaz, nombres y efectos de Pergaminos de Pacto.
* **Idiomas:** Español (base de desarrollo) e Inglés.
* **Restricción:** El set de caracteres debe ser compatible con la fuente Press Start 2P (uso estricto de mayúsculas).

---

## 2. Entorno Gráfico, Viewport y Grilla

### 2.1. Métricas de Render y Grilla
* **Resolución Nativa del Viewport:** 512 x 288 px (Aspect Ratio nativo 16:9).
* **Métrica de Grilla:** 16 x 16 px por tile/celda (escala nativa 1:1, sin escalado artificial de assets).
* **Área Visible de Juego:** Matriz de 32 columnas x 18 filas (32 * 16 = 512 px, 18 * 16 = 288 px).
* **Escala de Entidades:**
  * Personajes jugables (Moncho / P2) y enemigos base: 16 x 16 px (ocupan exactamente 1 x 1 tile).
  * Jefes y entidades mayores: Múltiplos enteros de la grilla base (32x32, 48x48 px, etc.).

### 2.2. Viewport y Cámara
* **Cámara:** Pantalla fija única (single-screen). Encuadre centrado permanentemente en el rectángulo visible (0, 0, 512, 288). Sin scroll, paneo ni seguimiento de cámara.

### 2.3. Buffer Superior Offscreen y Topología de Sala
* **Buffer Superior Configurable:**
  * La matriz del nivel reserva una constante desacoplada para filas lógicas por encima del viewport: OFFSCREEN_BUFFER_ROWS = 2 (por defecto 2 filas = 32 px, modificable desde constantes para calibración).
  * Coordenadas de instanciación: Y < 0 (zona de spawn de ítems y entidades en caída libre antes de ingresar al viewport).
* **Continuidad de Muros:** Si el diseño matricial del mapa incluye paredes laterales sólidas, las columnas correspondientes deben extenderse hacia arriba cubriendo las filas del buffer offscreen para evitar que el jugador desborde el muro perimetral al saltar.
* **Mecánica de Wrap-Around:**
  * **Horizontal (Eje X):** En mapas con laterales abiertos, las entidades que rebasen un extremo horizontal reaparecen en el extremo opuesto conservando su vector de velocidad.
  * **Vertical (Eje Y):** En mapas con techo abierto, las entidades pueden ingresar al buffer offscreen. Al rebasar la cota superior del buffer, se procesa wrap vertical hacia el límite inferior del mapa. Si el suelo inferior es sólido, la cara inferior colisiona cancelando el ascenso con impacto seco.

### 2.4. Escalado e Integer Scaling (Pixel-Perfect)
* **Modo en Phaser:** Phaser.Scale.NONE. El lienzo interno de Phaser permanece clavado en 512x288 px.
* **Escalado Entero Dinámico:** Se calcula mediante script en ventana y se aplica mediante atributos de estilo CSS:
  scale = Math.max(1, Math.min(Math.floor(windowWidth / 512), Math.floor(windowHeight / 288)))
* **Letterboxing / Pillarboxing:** Contenedor con fondo #000000 y centrado flex/grid absoluto.
* **CSS Obligatorio del Canvas:** Aplicar en la hoja de estilos reglas de image-rendering: pixelated, crisp-edges, -moz-crisp-edges y -webkit-crisp-edges sobre el elemento canvas.

---

## 3. Tipografía y Pipeline de Texto Binarizado (Crisp Text)

### 3.1. Reglas Generales
* **Fuente Oficial:** Press Start 2P.
* **Formato Estricto:** Todo texto in-game debe renderizarse exclusivamente en MAYÚSCULAS (ALL CAPS).
* **Prohibición:** Prohibido el uso de this.add.text() nativo en producción para evitar el renderizado borroso/antialiasing del navegador.

### 3.2. Jerarquía de Escalas
* **1x (8 px):** HUD, contadores de tiempo/puntos, diálogos y textos de sistema (0.5 tiles de alto).
* **2x (16 px):** Subtítulos, pantallas intermedias, nombres de objetos y avisos secundarios (1 tile completo de alto).
* **3x (24 px):** Título principal, carteles de fin de partida (¡GANASTE!, ¡PERDISTE!).

### 3.3. Pipeline Modular de Renderizado (crearTextoCrisp)
* **Funcionamiento:** Renderizado del glifo en canvas offscreen, binarización de canal alfa mediante umbral estricto (alpha > 80 ? 255 : 0), generación de textura dinámica en Phaser y aplicación de filtro Phaser.Textures.FilterMode.NEAREST.
* **Gestión de Memoria:** Destruir texturas dinámicas huérfanas mediante actualizarTextoCrisp() cada vez que un contador cambie de valor numérico.

---

## 4. Esquema de Entradas y Físicas

### 4.1. Mapeo de Controles (Input Mapping)
* **Jugador 1 (Teclado):**
  * Flechas Izquierda / Derecha: Desplazamiento horizontal y orientación del sprite.
  * Flecha Arriba: Salto e impulso inicial.
  * Flecha Abajo: Descenso rápido en el aire (fast-fall) o agacharse en suelo.
  * Doble toque lateral (Izquierda o Derecha): Desplazamiento rápido horizontal (Dash).
  * Tecla X: Ataque cuerpo a cuerpo con Katana.
  * Tecla C: Disparo de Arma Secundaria especial.
* **Jugador 2 (Teclado Alternativo o Gamepad):**
  * Teclas A / D: Movimiento horizontal.
  * Tecla W: Salto.
  * Tecla S: Descenso rápido.
  * Tecla J: Ataque con Katana.
  * Tecla K: Arma Especial.
  * Soporte Gamepad: Eje analógico izquierdo / D-Pad para movimiento, botón inferior (A / Cruz) para salto, botón izquierdo (X / Cuadrado) para katana, botón superior (Y / Triángulo) para arma secundaria.

### 4.2. Configuración de Motor de Físicas
* **Sistema:** Arcade Physics (physics.default: "arcade").
* **Parámetros Globales:**
  * arcade.gravity.y: 200 (gravedad base ambiental).
  * arcade.debug: true en desarrollo; false en builds de producción.
  * pixelArt: true.
  * roundPixels: true.

### 4.3. Parámetros Cinéticos del Jugador (Sujetos a Calibración en Testeo)
* **Gravedad Adicional en Cuerpo:** gravity.y: 600 (gravedad resultante efectiva: 800).
* **Velocidad Horizontal de Carrera:** +-140 px/s (respuesta inmediata, sin aceleración lenta).
* **Impulso de Salto Estándar:** -420 px/s (altura variable controlada por tiempo de presión de tecla).
* **Rebote en Cabeza (Pogo Jump):** -450 px/s al impactar sobre enemigos o sobre el segundo jugador (restaura la capacidad de salto).
* **Descenso Rápido (Fast-Fall):** Presionar Abajo en el aire multiplica la velocidad vertical descendente para aterrizajes precisos.

---

## 5. Bucle de Juego y Sistemas de Nivel

### 5.1. Fases del Nivel

#### Fase 1: Recolección
* **Objetivo Primario:** Obtener la combinación requerida de 6 talismanes mostrados en el HUD.
* **Talismanes:**
  * Keys de assets y texturas fijas: cuadrado, triangulo y rombo.
  * Spawnean 9 talismanes desde el buffer superior offscreen (3 de cada tipo).
  * Comportamiento balístico con rebote (bounce: 0.75).
  * **Degradación Balística:** Inician en 100 puntos. Pierden 5 puntos en cada impacto contra superficies sólidas. Si se detienen por completo o su valor llega a 0, se autodestruyen y reaparece uno nuevo del mismo tipo desde el buffer superior.
  * **Optimización:** El jugador puede recoger talismanes no requeridos para sumar puntos potenciales extra. Al juntar los 6 requeridos, los talismanes sobrantes en pantalla se destruyen de inmediato.
* **Reglas de Combate:**
  * Daño mutuo desactivado. La katana y las armas solo generan empuje y aturdimiento temporal (1 a 2 segundos).
  * Al recibir un impacto enemigo, Moncho sufre aturdimiento y retroceso (knockback), pierde el último talismán objetivo recogido (se destruye visualmente en el aire) y pierde los puntos asociados a ese talismán. Dicho talismán reaparece cayendo desde arriba segundos después.
* **Cierre de Fase y Cobro:** Al reunir los 6 talismanes requeridos, los puntos potenciales se consolidan en el marcador sumando el bono de tiempo: puntos_potenciales + (segundos_restantes * 100).
* **Fallo por Tiempo:** Si el reloj llega a 0, aparece un Fantasma Perseguidor invencible que atraviesa muros y rastrea la posición horizontal de Moncho. Si el jugador completa la cuota antes del impacto, avanza de fase; si el fantasma lo toca, pierde 1 vida, se descartan los puntos del intento y el nivel reinicia en Fase de Recolección.

#### Fase 2: Cacería
* **Activación:** Se inicia inmediatamente tras consolidar los puntos de recolección, activando un nuevo temporizador regresivo exclusivo.
* **Comportamiento Enemigo (Enraged):** Aumento notable en velocidad de desplazamiento y agresividad general. Pierden la inmunidad.
* **Letalidad y Daño:**
  * Cualquier impacto directo de enemigo o proyectil resta 1 vida al jugador de forma inmediata.
  * Ataques de katana o armas secundarias destruyen a los enemigos menores al primer contacto.
* **Generación de Puntos:** Cada baja enemiga suma a un pozo de puntos potenciales de cacería.
* **Cierre de Fase y Cobro:** Finaliza al eliminar a todos los enemigos de la sala o al expirar el temporizador. Se aplica la fórmula de cobro: puntos_caceria + (segundos_restantes * 100). Si el tiempo llega a 0 sin limpiar la sala, el bono de tiempo es 0 y se cobran las bajas conseguidas hasta ese instante.

### 5.2. Condiciones de Victoria, Derrota y Vidas
* **Reserva de Vidas:** Base inicial de 3 vidas.
* **Pérdida de Vida:** Contacto con Fantasma Perseguidor en Fase 1, recibir daño en Fase 2 o caer en precipicios/trampas letales.
* **Reinicio de Nivel:** Al perder una vida, el nivel se reinicia desde el comienzo de la Fase de Recolección descartando los puntos acumulados en ese intento.
* **Game Over:** Agotar las 3 vidas. Transfiere a la pantalla de Game Over y guarda el récord de puntuación.

---

## 6. Sistema de Armas y Equipamiento

### 6.1. Filosofía de Combate Cinético
Fuera de la Fase de Cacería, las armas no destruyen: alteran trayectorias de talismanes, empujan enemigos hacia fosos o impulsan al compañero de equipo.

### 6.2. Catálogo de Armas
* **Katana (Básica Fija - Tecla X):** Ataque frontal cuerpo a cuerpo de rango corto y alta cadencia. En Fase 1 aplica retroceso y aturdimiento; en Fase 2 inflige muerte instantánea a enemigos menores.
* **Shuriken (Arma Secundaria - Tecla C):** Proyectil horizontal lineal de alta velocidad. En Fase 1 empuja enemigos a distancia; en Fase 2 destruye enemigos menores en su trayectoria.
* **Bumerán (Arma Secundaria - Tecla C):** Proyectil con trayectoria elíptica de ida y vuelta. Capaz de arrastrar talismanes en su vuelo hacia el jugador y golpear múltiples objetivos en su recorrido de regreso.
* **Bombas (Arma Secundaria - Tecla C):** Proyectil balístico con rebote breve. Genera una onda expansiva de radio medio que aplica un impulso masivo de empuje a todas las entidades alcanzadas.

### 6.3. Reglas de Ranura de Armas
* **Ranura Única:** El jugador solo puede portar un arma especial secundaria a la vez.
* **Reemplazo Destructivo:** Recoger un nuevo icono de arma sobreescribe el arma actual y reinicia la reserva de munición asociada.

---

## 7. Catálogo de Enemigos e Inteligencia Artificial

### 7.1. Enemigos Comunes
* **Patrullero Terrestre:** Desplazamiento lineal sobre plataformas que invierte su marcha al colisionar con bordes de plataforma o muros sólidos.
* **Espíritu Volador:** Movimiento senoidal flotante continuo que ignora plataformas ligeras y busca activamente la altura del jugador.
* **Lanzador Estático:** Posición fija sobre plataformas; dispara proyectiles hostiles parabólicos en intervalos de tiempo regulares.

### 7.2. Máquina de Estados de IA
* **Estado Neutral (Fase de Recolección):**
  * Velocidad de desplazamiento estándar.
  * Inmunes a la muerte: reciben impulso vectorial hacia atrás y aturdimiento de 1 a 2 segundos según el tipo de criatura.
* **Estado Enraged (Fase de Cacería):**
  * Activación inmediata al romperse el sello.
  * Incremento en velocidad de persecución horizontal y mayor cadencia de disparo.
  * Vulnerabilidad completa al filo de la katana y proyectiles del jugador.

### 7.3. Jefes (Bosses)
* **Jefes Intermedios:** Encuentros especiales cada bloque fijo de niveles, seleccionados al azar entre un banco de 3 jefes con patrones mecánicos propios (entidades de 32x32 o 48x48 px).
* **Jefe Final:** Encuentro culminante que combina mecánicamente los patrones de los 3 jefes intermedios.

### 7.4. Límites de Entidades (Pool Cap)
* **Tope de Enemigos Simultáneos:** Máximo estricto de entidades hostiles activas en pantalla para garantizar estabilidad de físicas a 60 FPS fijos.
* **Reaparición Dinámica:** Si un enemigo cae fuera de los límites de la pantalla durante la Fase de Recolección, es reciclado y reaparece desde el buffer superior offscreen.

---

## 8. Metajuego: Sistema de Pergaminos de Pacto

### 8.1. Pantalla de Transición y Mecánica de Selección
* **Ubicación:** Escena modal intercalada entre niveles superados (PactSelectionScene).
* **Cursor Oscilante:** Una mano indicadora oscila continuamente de izquierda a derecha sobre tres Pergaminos de Pacto desplegados (emulando la interfaz clásica de Ninja Kid II).
* **Temporizador:** Cuenta regresiva visible de 5 a 10 segundos para fijar la elección.
* **Confirmación (Lock-in):** Al pulsar el botón de acción, el cursor fija de inmediato el pergamino apuntado de forma irreversible.
* **Selección Forzada:** Si el temporizador expira sin confirmación del jugador, el sistema selecciona automáticamente el pergamino sobre el cual se encuentre el cursor en ese instante exacto.

### 8.2. Taxonomía de Modificadores (Ventaja vs Desventaja)
Cada pergamino empareja obligatoriamente un beneficio con una condición adversa para el siguiente sector:
* **Pacto de Velocidad:** +30% velocidad de carrera / -10 segundos al temporizador de Fase de Recolección.
* **Pacto de Fortuna:** Duplica el valor en puntos de los talismanes / Duplica la velocidad de los proyectiles enemigos.
* **Pacto de Filo Voraz:** Munición infinita de arma secundaria en Fase de Cacería / Enemigos inmunes al aturdimiento en Fase de Recolección.
* **Pacto Ligero:** +25% altura de salto / Aumento del retroceso (knockback) sufrido por Moncho ante impactos.

---

## 9. Modo Multijugador (Cooperativo y Sabotaje Local)

### 9.1. Identidad Visual
* **Jugador 1 (Moncho):** Traje ninja tradicional de color primario.
* **Jugador 2:** Traje ninja con paleta de alto contraste visual para diferenciación inmediata en pantalla saturada.

### 9.2. Físicas Interpersonales
* **Colisiones Sólidas:** Cajas de colisión activas entre ambos ninjas.
* **Trampolín Humano:** Un jugador puede realizar Pogo Jump sobre la cabeza de su compañero para alcanzar repisas elevadas.
* **Fuego Amigo Cinético:** Los tajos de katana y las explosiones empujan físicamente al compañero sin restarle vidas, permitiendo maniobras de rescate o empujones accidentales/intencionales hacia peligros.

### 9.3. Dinámica Competitiva
* **Robo de Pergamino:** En la pantalla de pactos, el primer jugador que presiona confirmación reclama el pergamino elegido; el segundo jugador debe escoger entre las opciones restantes o someterse a la selección forzada.
* **Disputa de Marcador:** La cuota de 6 talismanes es compartida para abrir la fase, pero el puntaje de cada talismán recogido se adjudica al jugador que lo capturó.

---

## 10. Arquitectura de Software y Progresión de Mapas

### 10.1. Modularidad de Escenas
* **BootScene:** Carga asíncrona de recursos, hojas de sprites, audios y pre-carga de la fuente Press Start 2P.
* **NinjaMonchoScene:** Escena de nivel central. Gestiona el ciclo de vida del juego, grupos físicos, spawners de entidades y colisiones.
* **UIScene (HUD Desacoplado):**
  * Escena paralela superpuesta (this.scene.launch('UIScene')).
  * Renderiza contadores de tiempo, puntos e inventario de talismanes usando crearTextoCrisp.
  * Escucha eventos emitidos por NinjaMonchoScene (cambio de puntos, tiempo o talismanes).
  * Permanece intacta durante las rotaciones o reinicios de mapas.
* **PactSelectionScene:** Escena modal de transición para la ruleta de pergaminos.

### 10.2. Banco de Mapas y Progresión (maps.js)
* **Estructura:** Archivo de datos desacoplado que exporta un banco de matrices de 32 columnas x 18 filas (+ filas offscreen).
* **Flujo de Progresión:**
  * Niveles 1 y 2: Mapas prediseñados fijos de aprendizaje.
  * Nivel 3 en adelante: Selección aleatoria a partir de un banco amplio de arenas prediseñadas (pool de X mapas).
* **Curva de Dificultad:** Incremento progresivo en la cantidad base de enemigos por sala hasta alcanzar el pool cap máximo permitido.
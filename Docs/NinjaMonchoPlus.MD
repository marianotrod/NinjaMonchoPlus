# NINJA MONCHO PLUS - Game Design Document (GDD)

# 1\. Visión General del Proyecto (Overview)

## 1.1. High Concept y Elevator Pitch

Ninja Moncho Plus es un juego de plataformas arcade 2D de ritmo frenético que homenajea la era dorada de los 8 bits. La experiencia se estructura en dos fases consecutivas a contrarreloj: una primera etapa de recolección acrobática y control de masas pacífico bajo la presión del temporizador, seguida inmediatamente por una segunda fase de cacería letal (Encore) con una cuenta regresiva aún más implacable. Con físicas de rebote continuo, armas orientadas a la manipulación cinética y un sistema de cartas tácticas de riesgo y recompensa entre pantallas, ofrece una experiencia tensa y rejugable tanto en solitario como en cooperativo local con fuego amigo.

## 1.2. Género, Audiencia y Plataformas

* Género: Plataformas arcade 2D, Acción retro, Cooperativo de sillón (couch co-op y sabotaje).
* Audiencia Objetivo: Jugadores nostálgicos de los arcades clásicos, entusiastas del pixel art de precisión y fanáticos de títulos plataformeros donde priman la respuesta de control y la maestría mecánica.
* Plataformas Objetivo: PC (Web, itch.io y eventual publicación en Steam).

## 1.3. Pilares de Diseño (Core Pillars)

1. Game Feel y Fluidez de Movimiento: Cada salto, rebote sobre cabezas enemigas y descenso rápido responde al instante sin retrasos artificiales, priorizando la inercia vertical.
2. Dualidad de Fases (Tensión versus Catarsis): El paso de un estado no letal (recolección y esquive) a un estado de cacería agresiva cambia las reglas del nivel en tiempo real, manteniendo la adrenalina al máximo.
3. Física Cinética sobre Letalidad Básica: Fuera de la fase de Cacería, las herramientas ofensivas sirven para empujar entidades, alterar trayectorias de talismanes y manipular el entorno, no simplemente para dañar a los enemigos.
4. Cooperación al Filo del Sabotaje: El juego compartido balancea la asistencia táctica (impulsar al compañero, saltar uno sobre otro, desviar armas para alcanzar otros lugares) con el conflicto directo (Pergaminos de Pacto exclusivos, empujones accidentales y fuego amigo).

## 1.4. Referencias e Inspiraciones

* Ninja Kid II (UPL, 1987): Referente nuclear. Estética chibi y cabezona de 8 bits, música FM de ritmo vertiginoso, selección de cartas mediante cursor oscilante y verticalidad constante.
* Arcades de arena cerrada (estilo Bubble Bobble y Snow Bros): Dominio del espacio en pantallas contenidas, donde los enemigos son primero obstáculos de navegación a manipular y luego presas a limpiar en un clímax rápido.
* Plataformeros de combate y sabotaje local (estilo Duck Game y TowerFall): Físicas interpersonales directas donde dos personajes colisionan, se usan como trampolín y sufren las consecuencias del fuego amigo cinético.

# 2\. Narrativa, Lore y Ambientación

## 2.1. Premisa y Contexto Temático

El juego está ambientado en parajes y templos invadidos por entidades del inframundo japonés (esqueletos, demonios y espíritus). Moncho (y un segundo ninja en cooperativo) recorre cada nivel para purificar el sector mediante la recolección de talismanes sagrados y la erradicación posterior de las amenazas.

## 2.2. Justificación Narrativa de las Mecánicas

Las reglas mecánicas del bucle de juego se fundamentan en el estado del entorno:

* Presencia del Sello (Fase de Recolección): La energía residual de los talismanes suspendidos en el nivel impide la destrucción física en el área. Mientras haya talismanes sin recoger, ni los ninjas ni los enemigos pueden matarse; el conflicto se reduce a colisiones, empujes y aturdimientos temporales.
* Absorción de Impacto: Cuando un enemigo impacta contra un ninja durante esta fase, la energía de los talismanes recolectados absorbe el golpe: el jugador pierde puntaje y un talismán de su inventario (el cual se destruye visualmente en el aire), evitando su muerte inmediata a cambio de retrasar su objetivo contra el reloj.
* Colapso del Sello (Fase de Cacería): Al recolectar el último talismán objetivo, la barrera mágica se desvanece. Sin la protección del sello, la invulnerabilidad general se desactiva: los enemigos entran en estado hostil agresivo (Enraged) y tanto el jugador como los enemigos pasan a ser vulnerables al daño letal de las armas.
* Pergaminos de Pacto: En la transición entre niveles, los pergaminos representan tratos vinculantes tomados a las apuradas: conceden una ventaja inmediata para el siguiente sector a cambio de asumir una condición adversa.

## 2.3. Tono y Caracterización Visual

* Tono General: Arcade de acción ligera con humor físico retro (estilo años 80 y 90).
* Personajes Jugables: Proporciones compactas (estilo chibi y cabezón), animaciones ágiles y reacciones exageradas ante colisiones o caídas.
* Enemigos: Diseños caricaturescos inspirados en el folclore clásico. Pasan de un patrullaje despreocupado a expresiones de enfado agresivo durante la Fase de Cacería.

# 3\. Dirección de Arte y Audio

## 3.1. Estilo Visual, Proporciones y Paleta de Color

* Estilo Gráfico: Pixel art estricto de estética arcade retro (8-bit y 16-bit).
* Métrica Base del Mundo:

  * Tamaño de celda o tile del mapa: Cuadrícula estándar de 16x16 píxeles.
  * Tamaño base de sprites (Moncho y enemigos menores): 16x16 píxeles (proporciones chibi). Los jefes o entidades mayores usarán múltiplos de esta cuadrícula (ejemplos: 32x32, 48x48).
* Resolución de Render y Configuración de Pantalla:

  * Resolución lógica base del canvas: 800 x 600 px (relación 4:3).
  * Modo de escalado: Phaser.Scale.FIT con centrado automático Phaser.Scale.CENTER\_BOTH.
  * Rango de escala dinámico: Mínimo 800x600 px, Máximo 1600x1200 px.
  * Renderizado nítido: Parámetro render pixelArt en true obligatorio en la configuración del motor para desactivar el suavizado bilinear (antialiasing) en escalados altos.
* Tipografía e Interfaz:

  * Fuente tipográfica oficial: Press Start 2P cargada mediante Google Fonts o archivo local.
  * Renderizado tipográfico sin desenfoque ni gradientes suaves, respetando el alineamiento estricto a píxel entero y fondo de página negro (#000000).

## 3.2. Hoja de Ruta de Assets (Prototipado versus Producción Legal)

* Fase 1 (Prototipado y Game Feel):

  * Uso temporal de hojas de sprites y efectos de sonido ripeados de Ninja Kid II (UPL) exclusivamente como marcadores de posición (placeholders) para calibrar cajas de colisión (hitboxes), tiempos de animación y pesos de física.
* Fase 2 (Producción Final y Comercialización):

  * Sustitución total y obligatoria del banco de assets antes de cualquier distribución pública en itch.io o Steam.
  * Las nuevas hojas de sprites deberán respetar exactamente la cuadrícula de 16x16 px (o múltiplos), puntos de pivote y cantidad de cuadros clave del prototipo para no alterar el comportamiento del motor.
  * Arte original o de uso libre bajo licencias comerciales compatibles (CC0 o similar).

## 3.3. Diseño Sonoro, Paisaje de Audio y Banda Sonora

* Banda Sonora:

  * Composición chiptune orientada a síntesis FM arcade (estilo Yamaha YM2151 o SN76489).
  * Pistas de tempo alto y ritmo sincopado con líneas de bajo marcadas (slap-bass sintetizado).
  * Variación de estados: La música de fondo debe acelerar su tempo (pitch o speed shift) o alternar a una pista frenética al dispararse la Fase de Cacería.
* Efectos de Sonido:

  * Sonidos secos, percusivos y con respuesta inmediata: impacto de katana, rebote en cabezas, chasquido de recogida de talismán y alarma audible de tiempo crítico.
  * Prioridad de mezcla sonora: Los avisos mecánicos (disparo de proyectiles enemigos, explosión de bombas y alarmas de temporizador) deben tener prioridad sobre la música.

# 4\. Especificaciones Técnicas y Arquitectura de Software

## 4.1. Motor, Librerías y Dependencias (Phaser Estable)

* Versión del Motor: Phaser 3 (última versión estable). Al inicializar el proyecto o compilar dependencias, utilizar la versión estable más reciente disponible de la rama principal de Phaser 3 mediante CDN o npm. Quedan excluidas ramas experimentales o versiones beta.
* Módulo de Ejecución: ES Modules (atributo type="module" en HTML e import o export nativo en scripts JavaScript).
* Motor de Físicas:

  * Sistema: Arcade Physics (physics.default en arcade).
  * Gravedad global base: y: 200 (calibrada para caída controlada y saltos arcade de flotabilidad media).
  * Parámetro de depuración: arcade.debug en true durante prototipado; false en compilaciones finales.
* Entorno de Despliegue y Control de Versiones:

  * Estructura servida mediante HTTP local con Vite, Live Server o Node.js.
  * Repositorio y control de versiones bajo Git y GitHub.

## 4.2. Módulos del Sistema y Flujo de Escenas

La arquitectura se divide en escenas desacopladas gestionadas por el SceneManager de Phaser:

* BootScene o PreloadScene: Carga asíncrona de recursos (hojas de sprites, atlas, audio SFX, música de fondo, fuentes web).
* MainMenuScene: Pantalla de título, selector de modo (Solitario o Cooperativo Local) y créditos.
* NinjaMonchoScene (GameScene Principal):

  * Instancia el bucle de nivel, la máquina de estados de las dos fases (Recolección y Cacería) y el temporizador maestro.
  * Contiene los grupos de físicas para jugadores, enemigos, proyectiles y talismanes.
* PactSelectionScene (Ruleta de Pergaminos):

  * Escena modal o intercalada entre niveles.
  * Procesa la selección interactiva de los tres Pergaminos de Pacto con el cursor oscilante, la lógica de confirmación irreversible y la asignación forzada al expirar el tiempo.
* UIScene o HUD: Capa superpuesta en paralelo que muestra cronómetro, talismanes restantes, vidas y puntuación sin interferir con la cámara del juego.
* GameOverScene o VictoryScene: Gestión de fin de partida, resumen de récord de puntuación y reinicio de ciclo.

## 4.3. Soporte de Localización (i18n)

* Estructura de Textos: Archivo JSON desacoplado con clave y valor para textos de interfaz, nombres de Pergaminos de Pacto y descripciones de modificadores (es.json, en.json).
* Idiomas de Lanzamiento: Español (idioma base de desarrollo) e Inglés.
* Restricción de Fuentes: Los caracteres utilizados deben ser compatibles con el set de glifos de la fuente Press Start 2P (evitar caracteres especiales incompatibles o prever textos en mayúsculas).





# 5\. Bucle Principal y Dinamica de Juego (Core Gameplay Loop)

## 5.1. Fases del Bucle Principal y Estructura de Arena

Cada nivel estandar se desarrolla en una arena de pantalla fija sin scroll de camara, con resolucion de 800 por 600 pixeles. En los mapas con laterales abiertos rige la mecanica de pantalla continua (Screen Wrap): cualquier entidad que cruce el limite horizontal por un extremo reaparece instantaneamente en el extremo opuesto conservando su velocidad.

Cada nivel se divide en dos fases consecutivas e independientes, cada una gobernada por su propio temporizador regresivo:

1. Fase de Recoleccion (El Sello Activo)
* Objetivo Primario: Obtener la combinacion aleatoria de 6 talismanes requeridos mostrados en la interfaz.
* Generacion de Talismanes: Caen 9 talismanes desde el borde superior (3 cuadrados, 3 circulos y 3 triangulos).
* Fisica y Degradacion Balistica: Los talismanes caen y rebotan perdiendo fuerza en cada impacto. El puntaje potencial de cada talismán disminuye con cada rebote. Si un talisman se detiene por completo en el suelo, su valor cae a cero, desaparece y se genera uno nuevo del mismo tipo desde arriba.
* Optimizacion de Puntos: El jugador puede recoger talismanes no requeridos para sumar puntos potenciales extra. Al juntar los 6 talismanes obligatorios, todos los demas talismanes en pantalla se destruyen de inmediato.
* Reglas de Combate y Dano: Rige la invulnerabilidad mutua. La katana y las armas solo empujan o aturden enemigos. Al recibir un golpe enemigo, Moncho sufre aturdimiento temporal, pierde el ultimo talisman objetivo recogido (se destruye en el aire) y pierde los puntos potenciales de ese talisman. Dicho talisman reaparece cayendo desde arriba segundos despues.
* Cierre de Fase y Cobro: Al reunir los 6 talismanes requeridos, los puntos potenciales se consolidan en el marcador sumando el bono de tiempo: puntos potenciales mas segundos restantes multiplicados por 100.
* Tiempo Agotado en Recoleccion: Si el reloj llega a cero, aparece un Fantasma Perseguidor invencible que atraviesa muros y busca la posicion horizontal de Moncho. Si el jugador completa la cuota antes de ser tocado, avanza de fase. Si el fantasma lo toca, pierde 1 vida, se descartan los puntos del intento y el nivel reinicia en Fase de Recoleccion.
2. Fase de Caceria (El Sello Roto)
* Activacion: Inicia inmediatamente despues de consolidar los puntos de recoleccion. Se activa un nuevo temporizador exclusivo para caceria.
* Objetivo Primario: Eliminar la mayor cantidad de enemigos posible antes de que termine el tiempo o limpiar la pantalla por completo.
* Comportamiento Enemigo: Los enemigos pasan a estado Enraged, aumentando su velocidad y agresividad, pero pierden la inmunidad y pueden morir por ataques de katana o armas secundarias.
* Dano Letal: Moncho pierde 1 vida ante cualquier impacto directo de enemigo o proyectil hostil.
* Generacion de Puntos: Cada baja enemiga suma puntos a un pozo de puntos potenciales de caceria.
* Cierre de Fase y Cobro: La fase termina al matar a todos los enemigos o cuando el tiempo llega a cero. Se aplica la formula simetrica: puntos potenciales mas segundos restantes multiplicados por 100. Si el tiempo expira, el bono de tiempo es cero y se cobran todas las bajas logradas.
* Transicion: Finalizada la caceria, el juego avanza a la pantalla de Pergaminos de Pacto antes del proximo nivel.

## 5.2. Condiciones de Victoria, Derrota y Reintentos

* Victoria de Nivel: Superar la Fase de Caceria sin perder la vida en curso.
* Perdida de Vida: Tocar al Fantasma Perseguidor en recoleccion, recibir dano en caceria o caer en precipicios.
* Reinicio de Nivel: Al perder una vida (base inicial de 3 vidas), el nivel reinicia desde el comienzo de la Fase de Recoleccion y se pierden los puntos de ese intento.
* Game Over: Perder las 3 vidas. Transfiere a pantalla final con guardado de record.

## 5.3. Progresion, Rotacion de Mapas y Jefes

* Estructura de Mapas: Niveles 1 y 2 son mapas fijos de introduccion. Desde el nivel 3 en adelante se seleccionan mapas al azar desde un banco de aproximadamente 27 arenas prediseñadas.
* Curva de Dificultad: Se anade 1 enemigo adicional por nivel hasta alcanzar un tope maximo permitido por la pantalla.
* Jefes Intermedios: Encuentros especiales cada cierta cantidad fija de niveles, seleccionados al azar entre un banco de 3 jefes con patrones unicos.
* Jefe Final: Encuentro culminante que combina las mecanicas de los 3 jefes anteriores.





# 6\. Mecánicas del Jugador y Controles

## 6.1. Esquema de Entradas (Input Mapping)

* Jugador 1 (Teclado):

  * Flechas Izquierda y Derecha: Movimiento horizontal y orientación.
  * Flecha Arriba: Salto y activación de rebote.
  * Flecha Abajo: Descenso rápido en el aire (fast-fall) o agacharse en suelo.
  * Tecla X: Ataque con Katana (cuerpo a cuerpo fijo).
  * Tecla C: Uso de Arma Especial secundaria (consumo de munición o carga).
  * Doble pulsación lateral: Desplazamiento rápido horizontal (Dash).
* Jugador 2 (Teclado alternativo o Gamepad):

  * Mapeo simétrico mediante teclas WASD y teclas J y K para acciones, o gamepad estándar mediante Phaser Gamepad Plugin.

## 6.2. Físicas de Movimiento y Desplazamiento

* Movimiento Horizontal: Respuesta inmediata sin aceleraciones lentas ni deslizamiento artificial.
* Salto Arcade: Altura variable controlada por tiempo de presión de tecla.
* Descenso Rápido (Fast-Fall): Al presionar la dirección Abajo durante la caída en el aire, se multiplica la gravedad temporalmente para aterrizajes de precisión.
* Rebote Aéreo (Pogo Jump): Al caer sobre la cabeza de un enemigo o del segundo jugador, se produce un rebote elástico hacia arriba que restaura la capacidad de salto.

## 6.3. Acciones Básicas y Capacidades Ofensivas

* Corte de Katana (Tecla X):

  * Fase de Recolección: No inflige daño. Aplica un impulso de retroceso (knockback) al enemigo y, si el tipo de enemigo lo permite, un estado de aturdimiento de 1 a 2 segundos.
  * Fase de Cacería: Inflige daño letal cuerpo a cuerpo inmediato con rango de alcance corto.
* Arma Especial (Tecla C): Disparo del arma secundaria asignada al nivel o recogida como objeto (shuriken, bumerán o bombas).

## 6.4. Estado de Salud, Vulnerabilidad y Penalizaciones

* Fase de Recolección: Moncho no tiene barra de salud en esta fase. Al ser golpeado:

  * Entra en animación de tropiezo y parpadeo de invulnerabilidad temporal.
  * Descuenta 1 talismán del inventario activo y lo expulsa en una parábola decorativa que se destruye sin poder recuperarse.
  * Se aplica una penalización directa en el marcador de puntos.
* Fase de Cacería: El contacto con enemigos o proyectiles resta una vida de forma inmediata o descuenta un corazón si rige un modificador de resistencia.

# 7\. Habilidades y Sistema de Armas (Power-Ups)

## 7.1. Filosofía de Combate e Interacción Cinética

Las armas no están pensadas únicamente para vaciar barras de vida, sino para alterar el posicionamiento y manipular el entorno: empujar enemigos hacia fosos, desviar talismanes que caen o impulsar al compañero mediante colisiones intencionales.

## 7.2. Catálogo de Armas y Comportamiento Balístico

* Katana (Básica fija): Ataque frontal cuerpo a cuerpo de rango corto. Alta cadencia.
* Shuriken (Estrella ninja): Proyectil lineal de alta velocidad con trayectoria recta horizontal. En Fase 1 empuja; en Fase 2 destruye enemigos menores.
* Bumerán: Proyectil que describe una parábola elíptica de ida y vuelta. Capaz de arrastrar talismanes en su recorrido hacia el jugador y golpear múltiples objetivos en su retorno.
* Bombas: Objeto con caída balística y rebote breve en superficies. Genera una onda expansiva de radio medio que empuja con fuerza masiva a todas las entidades cercanas.

## 7.3. Reglas de Adquisición y Reemplazo de Equipamiento

* Ranura Única Especial: El jugador sólo puede portar un arma especial a la vez en la ranura secundaria (Tecla C).
* Reemplazo Inmediato: Recoger un nuevo icono de arma sobreescribe el arma actual y reinicia la reserva de munición.

# 8\. Arquitectura de Niveles y Entorno

## 8.1. Estructura de Datos de los Mapas (maps.js)

Los niveles se definen mediante matrices o estructuras de datos en JavaScript:

* Capas de Terreno: Sólidos impermeables, plataformas atravesables desde abajo (one-way platforms) y zonas de precipicio.
* Capas de Entidades: Puntos de aparición (spawns) de jugadores, ubicaciones estáticas de talismanes y puntos de generación continua o fija de enemigos.

## 8.2. Paradigmas de Dificultad y Obstáculos Dinámicos

* Diseño Vertical y Horizontal: Combinación de arenas compactas de pantalla fija con niveles de avance vertical ascendente.
* Obstáculos Activos: Pinchos estáticos, plataformas móviles y proyectiles ambientales sincronizados con el temporizador.

## 8.3. Reglas de Generación y Límites de Entidades en Pantalla

* Límite de Enemigos (Pool cap): Límite estricto de entidades simultáneas en pantalla para evitar saturación de físicas y caída de cuadros por segundo.
* Reaparición Dinámica: Si un enemigo cae fuera de los límites de la pantalla durante la Fase de Recolección, reaparece en un punto de origen superior.

# 9\. Enemigos e Inteligencia Artificial

## 9.1. Tipos de Enemigos Comunes y Patrones Base

* Patrullero Terrestre: Desplazamiento lineal sobre plataformas que cambia de sentido al topar con bordes o paredes.
* Espíritu Volador: Movimiento senoidal flotante que atraviesa plataformas ligeras y busca la altura del jugador.
* Lanzador Estático: Permanece apostado en plataformas fijas y dispara proyectiles parabólicos en intervalos regulares.

## 9.2. Máquina de Estados (Estado Neutral versus Estado Enraged)

* Estado Neutral (Fase de Recolección):

  * Velocidad de movimiento moderada.
  * Reacción a golpes: Reciben impulso vectorial hacia atrás y aturdimiento breve según el tipo de criatura.
  * Inmunes a la muerte por katana o proyectil.
* Estado Enraged (Fase de Cacería):

  * Activación inmediata al recoger el último talismán.
  * Incremento en velocidad de persecución horizontal y cadencia de disparo.
  * Vulnerabilidad completa: Mueren al recibir un golpe de katana o impacto de arma especial.

## 9.3. Encuentros Mayores (Jefes o Bosses) y Recompensas

* Aparición: Niveles climáticos finales de cada bloque de templos.
* Mecánica de Jefes: Entidades segmentadas (dragones aéreos o guardianes gigantes) que exigen esquivar patrones durante la Fase de Recolección para luego exponer un núcleo vulnerable durante la Fase de Cacería.

# 10\. Metajuego y Transición de Pantalla (Sistema de Pergaminos de Pacto)

## 10.1. Interfaz de Selección y Temporizador

* Transición entre Niveles: Se presenta un panel con tres Pergaminos de Pacto cerrados o semidesplegados.
* Cursor Oscilante: Una mano indicadora se mueve continuamente de izquierda a derecha sobre los tres pergaminos emulando la interfaz de Ninja Kid II.
* Temporizador de Selección: Cuenta regresiva visible de 5 a 10 segundos para confirmar la elección.

## 10.2. Mecánica de Bloqueo (Lock-in) y Selección Forzada

* Confirmación (Lock-in): Al presionar el botón de acción, el cursor fija el pergamino seleccionado de forma irreversible.
* Selección Forzada: Si el tiempo expira sin que el jugador haya confirmado, el juego selecciona automáticamente el pergamino sobre el cual se encuentre el cursor en ese instante.

## 10.3. Taxonomía de Modificadores (Matriz Positivo versus Negativo)

Cada pergamino combina siempre un efecto favorable emparejado con una complicación obligatoria:

* Pacto de Velocidad: Aumenta la velocidad de carrera un 30 por ciento, pero reduce el tiempo total de la Fase de Recolección en 10 segundos.
* Pacto de Fortuna: Duplica el valor en puntos de los talismanes, pero duplica la velocidad de los proyectiles enemigos.
* Pacto de Filo Voraz: Otorga munición infinita de arma especial en Fase de Cacería, pero los enemigos en Fase de Recolección son inmunes al aturdimiento.
* Pacto Ligero: Permite saltar un 25 por ciento más alto, pero aumenta el retroceso sufrido por Moncho al chocar con enemigos.

# 11\. Modo Multijugador (Co-op y Competitivo)

## 11.1. Diferenciación Visual e Identidad

* Jugador 1 (Moncho): Traje ninja tradicional de color principal.
* Jugador 2: Traje ninja con paleta de color de alto contraste visual para fácil identificación en pantalla saturada.

## 11.2. Físicas e Interacciones Interpersonales (Asistencia versus Sabotaje)

* Colisión de Jugadores: Cajas de impacto sólidas entre compañeros.
* Trampolín Humano: Un jugador puede saltar sobre la cabeza del otro para impulsarse y alcanzar plataformas elevadas.
* Empujones y Fuego Amigo Cinético: Los ataques de katana y explosiones empujan físicamente al compañero sin restarle vidas, permitiendo salvarlo de un enemigo o empujarlo hacia una trampa.

## 11.3. Dinámica Competitiva en Menús y Asignación de Recursos

* Robo de Pergamino: En la pantalla de Pergaminos de Pacto, el primer jugador que presiona confirmación reclama el pergamino deseado. El segundo jugador queda forzado a elegir entre las opciones restantes o aceptar la asignación forzada.
* Disputa de Talismanes: Ambos ninjas comparten el objetivo numérico para completar el sello, pero cada talismán suma puntaje individual para definir al jugador con mayor puntuación al final del nivel.


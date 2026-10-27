# Roadmap de mejoras — Ninja Moncho Plus

Análisis inicial del 2026-10-27 y estado de cada punto. Esfuerzo: **S** = menos de 1 h · **M** = algunas horas · **L** = uno o más días.
`[x]` = hecho (rama de entorno y herramientas) · `[ ]` = pendiente · `[~]` = hecho en parte o con una decisión a revisar.

## Estado actual en una línea
10 niveles de una pantalla. En cada uno: **Recolección** (3 talismanes de cada forma) → **Cacería** (los demonios se enfurecen
y se pueden eliminar) → **Pergaminos de Pacto**. Hay 3 vidas por jugador, un fantasma cuando se acaba el tiempo, katana, 3 armas especiales,
4 tipos de enemigos y 4 jefes (3 intermedios al azar en el nivel 5, y el Rey Demonio en el 10). Hasta 2 jugadores, con hot-join.

---

## Fase 0 — Bugs

- [x] **B1. El J2 quedaba congelado al pasar de nivel (con joystick).** El índice del joystick del J2 ahora se guarda en el
      `registry` y se reasigna al crear al J2 y en cada `update()`. También arregla el joystick del J2 al elegir "2 JUGADORES".
      *Verificado simulando el índice; falta probarlo con dos joysticks reales.*
- [x] **B2. El puntaje volvía a 0 en cada nivel.** El estado de la partida vive en `Partida.js` (registry) y se conserva entre niveles.
- [x] **B3. El volumen de Opciones no hacía nada.** `Sonido.js` aplica `volMusica` y `volSonido` a todo y los guarda.
- [x] **B4. `fall.ogg` con mayúsculas incorrectas.** Ahora carga `Fall.ogg`.
- [x] **B5. Teclas de debug activas.** Solo funcionan con `?debug` en la URL.
- [x] **B6. Animaciones recreadas en cada nivel.** Se crean una sola vez en `BootScene`.
- [x] *(Extra)* Una fila del mapa 10 tenía 33 columnas; se recortó.

## Fase 1 — Sensación de juego y claridad

- [x] **1.1 Salto.** -420 → **-350** (76 px, 4,8 tiles) y doble salto -350 → **-280**. **Salto variable**: soltar el botón corta la subida.
      Todas las constantes están en `FISICA` (`config.js`). *A calibrar jugando.*
- [x] **1.2 Alarma de tiempo.** Con 10 s o menos: reloj rojo que titila, tic por segundo, música más rápida y cartel "¡10 SEGUNDOS!".
      Con 5 s o menos: tic más agudo, el número late y se marca el borde rojo de la pantalla.
- [x] **1.3 Claridad.** Cartel de inicio de nivel con el objetivo y los íconos · HUD con siluetas que se encienden ·
      texto "2/3" y sonido propio al juntar · aviso al perder un talismán · pantalla **CÓMO JUGAR** (3 páginas).
- [~] **Decisión de diseño:** al recibir daño se pierde **solo el último talismán** (como dice el GDD). Para volver a perder todos:
      `CONFIG.DAÑO_PIERDE = 'todos'`.

## Fase 2 — Pulido de interfaz

- [x] Todos los textos pasan por `i18n` (español e inglés). Las mayúsculas acentuadas se muestran sin tilde porque la fuente no las tiene.
- [x] Transición entre niveles: panel de resumen y "presioná" (con 1,2 s de espera) en lugar de mantener 2 s.
- [x] El cartel de hot-join dice qué tocar.
- [x] **Pausa** con ESC / START (continuar, volúmenes, salir al menú).
- [x] Idioma, volúmenes y **récord** guardados en `localStorage`. Récord en el título y en el fin de partida.
- [x] Fin de partida: ENTER / A reintenta, ESC / B vuelve al menú.
- [~] Logo: título en texto con sombra y los dos ninjas animados. **Falta el logo en pixel art.**
- [x] Assets que no se usaban: música de cueva, agua y jefe, Parry, Shout, FinalShout, Shuriken, Stun y el escudo roto (sello de los demonios).
      `piso.png` sigue sin uso (no queda claro para qué era).
- [x] *Juice*: sacudidas de cámara, partículas, destellos y *hit-stop* al pisotear.
- [x] README nuevo.

## Fase 3 — Contenido del GDD

1. [x] **Vidas** (3 por jugador, no se comparten). Al perder una el nivel sigue: el ninja cae fuera de la pantalla y reaparece.
       Sin vidas queda afuera hasta el final de la partida; si se quedan sin vidas todos, game over.
2. [x] **Fantasma perseguidor** al llegar el tiempo a 0 (invencible, atraviesa muros y acelera).
3. [x] **Katana** (X / J / botón X): aturde y empuja en Recolección, mata en Cacería, desvía talismanes y bolas de fuego, empuja al compañero.
4. [x] **Fase de Cacería** con temporizador propio, cupo de demonios según el nivel y bono si se limpia la sala.
5. [x] **Enemigos**: patrullero (da la vuelta en bordes), espíritu volador (ondula y busca tu altura) y lanzador (tiros en parábola).
       Aparecen desde los niveles 2, 3 y 4 respectivamente.
6. [x] **Armas especiales** en cajas doradas: shuriken, bumerán (arrastra talismanes y monedas) y bombas. Una sola ranura.
7. [x] **Cooperativo**: los ninjas se atraviesan, salvo al caer sobre la cabeza del otro (trampolín humano), fuego amigo sin daño y puntaje por jugador.
8. [x] **Pergaminos de Pacto** con mano oscilante, 8 s, selección forzada y "robo" de pergamino en cooperativo. Duran un nivel.
9. [x] **Jefes**: Ogro (embestida y mareo), Oni (saltos con ondas), Espectro (ráfagas e invoca voladores) y Rey Demonio (los tres).
       En la pelea, cada golpe cuesta una vida (como en la Cacería) y el combate sigue.
10. [x] **Progresión**: niveles 1 y 2 fijos (se sumó un mapa de aprendizaje), resto al azar del pool, arena propia para jefes.

## Fase 4 — Técnico

- [x] **BootScene** con precarga única y barra de progreso.
- [x] `config.js` con constantes (`CONFIG`, `FISICA`, `PAD`) y modo `?debug`.
- [x] Phaser copiado en `lib/` (funciona sin internet).
- [x] Banco de pruebas en navegador (`tools/navegador/`).
- [ ] **GitHub Pages**: lo tiene que activar el dueño del repo (Settings → Pages → Branch `main`, carpeta `/`).
- [ ] **Ordenar carpetas** (`scenes/` mezcla escenas con clases de juego). Se dejó para hacerlo cuando todos estén
      sincronizados, porque mover archivos genera conflictos con lo que el otro tenga en curso.
- [ ] Flujo de git: una rama por tarea y PR a `main`.

---

## Diferencias con el GDD que quedaron así a propósito
- **9 talismanes (3 de cada forma)** en lugar de 6: es lo que ya tenía el juego.
- **Los talismanes no dan puntos ni se degradan**; los puntos vienen de las monedas, que pierden valor al rebotar
  (cambio que había hecho Mariano). El Pacto de Fortuna duplica las monedas y las bajas.
- **Sin precipicios ni trampas letales**: los mapas actuales tienen piso completo.

## Próximos pasos sugeridos
1. Jugarlo entre los dos y calibrar: salto, tiempos, cupo de demonios, vida de los jefes y dificultad general.
2. Probar con dos joysticks reales (hot-join, pasar de nivel, pausa, pergaminos).
3. Arte definitivo para lo provisorio (logo, armas, enemigos nuevos, jefes, fantasma) y un sonido de explosión.
4. Más mapas para el pool y más niveles (la estructura ya lo soporta: `CONFIG.TOTAL_NIVELES` y `NIVELES_POR_BLOQUE`).

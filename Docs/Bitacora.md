# Bitácora de trabajo

Registro breve de cada sesión: qué se hizo, decisiones y pendientes. Lo más nuevo va arriba.
El detalle fino de cada cambio está en `git log`.

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

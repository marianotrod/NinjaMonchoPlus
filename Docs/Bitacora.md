# Bitácora de trabajo

Registro breve de cada sesión: qué se hizo, decisiones y pendientes. Lo más nuevo va arriba.
El detalle fino de cada cambio está en `git log`.

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

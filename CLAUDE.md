# Ninja Moncho Plus

Juego de plataformas en pixel art hecho con **Phaser 3.80.1** (copia local en `lib/phaser.min.js`), en JavaScript plano
con módulos ES. No usa npm ni build. Lo desarrollan Mariano Trod y Santiago Tornau (repo `marianotrod/NinjaMonchoPlus`).

## Cómo correrlo
Hace falta un servidor estático (los módulos ES no cargan desde `file://`):
- VS Code Live Server (puerto 5501, ver `.vscode/settings.json`), o
- `python -m http.server 5501` desde la raíz del repo, y abrir http://localhost:5501
- Modo desarrollo: `?debug` (teclas de prueba) y `?debug&nivel=5&jugadores=2&jefe=oni` para arrancar en un nivel.

## Estructura
- `main.js`: configuración de Phaser (512x288, arcade physics, gamepad), lista de escenas y escalado entero del canvas.
- `config.js`: `CONFIG` (vidas, tiempos, niveles, bonos), `FISICA` (salto, velocidades) y `PAD` (botones). Calibrar acá.
- `i18n.js`: textos es/en. Todo texto visible pasa por `i18n.t()` (que quita tildes de mayúsculas: la fuente no las tiene).
  Las traducciones se piden a la API de Traducila al arrancar (`TRADUCCIONES` en `config.js`); los textos de `i18n.js` son el respaldo. Frases nuevas: correr `node tools/traducciones/generar_frases.js` y cargarlas en el panel.
- `escenas/`: `BootScene` (carga todo, texturas, animaciones, preferencias) → `TitleScene` → `NinjaMonchoScene` (juego)
  con `UIScene` (HUD, carteles, paneles) y `PauseScene` encima; `PactSelectionScene` entre niveles; `HowToPlayScene`, `OptionsScene`, `CreditsScene`.
- `entidades/`: `Ninja` (jugador, katana), `Enemigo` (rasgos saltarín/caminante/volador/lanzador), `Jefe`, `Fantasma`, `Armas` (proyectiles del jugador).
- `datos/`: `Bestiario` (enemigos), `Mapas`, `Eventos` (catálogo de eventos). `reglas/`: `Partida` (estado de la partida en el registry), `Pactos`. `mundo/`: `ConstructorNivel`.
- `sistemas/`: `Texturas` (arte provisorio generado por código), `Sonido` (volúmenes, música, beeps WebAudio), `Guardado` (localStorage), `Estilo` (texto), `PuertaPruebas`. `entrada/`: `MenuInputManager`.
- Fases de `NinjaMonchoScene`: intro → recoleccion → transicion → caceria → nivelCompletado (o intro → jefe → nivelCompletado);
  perdiendoVida y fin interrumpen. La UI se entera por eventos (`this.events.emit(...)`).
- `public/assets/`: sprites, tiles y audio. `Docs/`: GDD, GDD técnico, lore, `Roadmap.md` y `Bitacora.md`.
- `tools/`: scripts de soporte (no son parte del juego). `.venv/` y `node_modules/` no se versionan.

## Para ahorrar tokens
- Probar cambios sin abrir el juego: desde **PowerShell** (desde Git Bash Edge no arranca), `.\tools\navegador\probar.ps1`
  corre todos los escenarios de `tools/navegador/escenarios/` (o `probar.ps1 golpes` uno solo). Levanta el servidor si
  hace falta, usa Edge sin ventana, verifica resultados y termina con ✔/✘ por verificación y un total. Si no hay Node
  instalado, usa el portable de `%LOCALAPPDATA%\node-portable`. **Correrlo antes y después de cada cambio.**
- Los escenarios hablan con el juego a través de `window.prueba` (`sistemas/PuertaPruebas.js`, solo con `?debug`), no con
  las variables internas. Al reorganizar código se adapta la puerta, no los escenarios. Formato de los pasos: ver `probar.js`.
- Revisar sintaxis rápido: copiar el `.js` a un `.mjs` temporal y `node --check`.
- Inventario de assets en lugar de abrir imágenes: `.venv/Scripts/python tools/assets_info.py`
- Documentos docx/pdf/pptx/xlsx: dejarlos en `Docs/fuentes/` y correr `.venv/Scripts/python tools/convertir_docs.py`;
  leer el `.md` que queda en `Docs/convertidos/`. Un archivo suelto: `.venv/Scripts/markitdown archivo.pdf -o archivo.md`.
- Buscar en el código con ripgrep antes de leer archivos enteros. `NinjaMonchoScene.js` es el más grande.

## Convenciones
- Código, comentarios y commits en español, como el código existente.
- Git guarda los archivos de texto con LF (`core.autocrlf` del sistema los pasa a CRLF en el directorio de trabajo).
- Al final de cada sesión, agregar una entrada breve arriba de todo en `Docs/Bitacora.md` (fecha, quién, qué se hizo, pendientes).
- Trabajar en ramas y no pushear a `main` sin acordarlo con Mariano.

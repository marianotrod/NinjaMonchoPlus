# Ninja Moncho Plus

Juego de plataformas en pixel art hecho con **Phaser 3.80.1** (copia local en `lib/phaser.min.js`), en JavaScript plano
con módulos ES. No usa npm ni build. Lo desarrollan Mariano Trod y Santiago Tornau (repo `marianotrod/NinjaMonchoPlus`).

## Cómo correrlo
Hace falta un servidor estático (los módulos ES no cargan desde `file://`):
- VS Code Live Server (puerto 5501, ver `.vscode/settings.json`), o
- `python -m http.server 5501` desde la raíz del repo, y abrir http://localhost:5501
- Modo desarrollo: `?debug` (teclas de prueba) y `?debug&nivel=5&jugadores=2&jefe=oni` para arrancar en un nivel (`&mapa=n-valle` elige el mapa).

## Estructura
- `main.js`: configuración de Phaser (512x288, arcade physics, gamepad), lista de escenas y escalado entero del canvas.
- `config.js`: `CONFIG` (vidas, tiempos, niveles, bonos), `FISICA` (salto, velocidades) y `PAD` (botones). Calibrar acá.
- `i18n.js`: textos es/en. Todo texto visible pasa por `i18n.t()` (que quita tildes de mayúsculas: la fuente no las tiene).
  En `v2` los textos salen solo de `i18n.js`. La API de Traducila fue un pedido para la entrega y quedó apagada (`TRADUCCIONES.activa` en `config.js`); `main` la sigue usando.
- `escenas/`: `BootScene` (carga todo, texturas, animaciones, preferencias) → `TitleScene` → `NinjaMonchoScene` (juego)
  con `UIScene` (HUD, carteles, paneles) y `PauseScene` encima; `PactSelectionScene` entre niveles; `HowToPlayScene`, `OptionsScene`, `CreditsScene`.
- `entidades/`: `Ninja` (jugador, katana), `Enemigo` (rasgos saltarín/caminante/volador/lanzador), `Jefe`, `Fantasma`, `Armas` (proyectiles del jugador).
- `datos/`: `Bestiario` (enemigos), `Eventos` (catálogo de eventos), `Graficos` (los PNG sueltos de `public/assets/graficos/`). `reglas/`: `Partida` (estado de la partida en el registry), `Pactos`, `Fases` (qué vale en cada fase), `Resolvedor` (qué hace cada golpe). `mundo/`: `Niveles` (carga y valida `public/niveles/`), `CargadorNivel` (arma el nivel en la escena), `Mundo` (wrap; por ahora solo en niveles con `"wrap": true`, como `n-wrap`), `Fuego` (tiles de fuego, bolas y llamas).
- `sistemas/`: `Sonido` (volúmenes, música, beeps WebAudio), `Guardado` (localStorage), `Estilo` (texto), `PuertaPruebas`. `entrada/`: `MenuInputManager`.
- Fases de `NinjaMonchoScene`: intro → recoleccion → transicion → caceria → nivelCompletado (o intro → jefe → nivelCompletado);
  perdiendoVida y fin interrumpen. La UI se entera por eventos (`this.events.emit(...)`).
- Reglas de juego: se consulta `this.reglas` (tabla de `reglas/Fases.js`), no `this.fase`. Todo golpe pasa por `resolverGolpe` (`reglas/Resolvedor.js`).
  Los proyectiles viven en un solo grupo (`this.proyectiles`), cada uno con `bando` y `duenio`.
- Tiles de `MapTileSet.png`: la hoja crece hacia abajo y no cambia de ancho. Los índices especiales están en `TILES` (`config.js`). Los cuadros del fuego se animan solos desde el 91 hasta el primer tile vacío.
- `public/niveles/`: un JSON por nivel más `indice.json`. `public/assets/`: sprites, tiles y audio. `Docs/`: GDD, GDD técnico, lore, `Roadmap.md` y `Bitacora.md`.
- `tools/editor/`: editor de niveles. Con el juego servido, abrir http://localhost:5501/tools/editor/ en Chrome o Edge.
  Online, Probar no guarda: le pasa el nivel al juego por localStorage (`?debug&borrador`).
- `tools/`: scripts de soporte (no son parte del juego). `.venv/` y `node_modules/` no se versionan.

## Para ahorrar tokens
- Probar cambios sin abrir el juego: desde **PowerShell** (desde Git Bash Edge no arranca), `.\tools\navegador\probar.ps1`
  corre todos los escenarios de `tools/navegador/escenarios/` (o `probar.ps1 golpes` uno solo). Usa su propio servidor en el
  puerto 5599, para no chocar con Live Server, que recarga la página al guardarse una captura; usa Edge sin ventana, verifica resultados y termina con ✔/✘ por verificación y un total. Si no hay Node
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

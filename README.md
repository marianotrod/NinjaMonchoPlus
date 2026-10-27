# Ninja Moncho Plus

Juego de plataformas en pixel art para 1 o 2 jugadores, hecho con [Phaser 3](https://phaser.io/) en JavaScript plano.
Una arena por pantalla: juntá los talismanes, rompé el sello y cazá a los demonios antes de que se acabe el tiempo.

## Cómo se juega

1. **Recolección.** Juntá 3 talismanes de cada forma (cuadrado, triángulo y rombo). Arriba se van encendiendo los que ya tenés.
   Los demonios son inmunes: saltales encima o dales con la katana para aturdirlos. Si te tocan, se te cae un talismán.
   Las monedas dan puntos, pero valen menos cada vez que rebotan.
2. **Cacería.** Con los 9 talismanes se rompe el sello: los demonios se enfurecen, pero ahora se pueden eliminar.
   Acá cada golpe cuesta una vida.
3. **Pergaminos de Pacto.** Entre niveles elegís un pergamino: una ventaja y una desventaja para el nivel siguiente.

- Hay 3 vidas. Si el reloj llega a 0 aparece **el fantasma**: si te toca, perdés una vida y se repite el nivel.
- El tiempo que sobra en cada fase se cobra como bono.
- Son 10 niveles: el 5 es un jefe intermedio (ogro, oni o espectro, al azar) y el 10 es el Rey Demonio.
- El segundo jugador puede sumarse en cualquier momento manteniendo WASD o un botón de su joystick.

### Controles

| Acción | Jugador 1 | Jugador 2 | Joystick |
|---|---|---|---|
| Mover / saltar | Flechas | WASD | Stick o cruceta / A |
| Katana | X | J | X |
| Arma especial | C | K | Y |
| Dash | Doble toque a un costado | Doble toque a un costado | R1 |
| Pausa | ESC | ESC | START |

Mantené el salto para saltar más alto; en el aire podés saltar otra vez. Abajo en el aire es caída rápida
y abajo sobre una pasarela la atravesás. Saltando contra una pared rebotás, y sobre la cabeza del compañero, trampolín.

## Cómo correrlo

Hace falta un servidor estático (los módulos ES no cargan abriendo el `index.html` con doble clic):

- **VS Code:** extensión Live Server (puerto 5501, ya configurado en `.vscode/settings.json`).
- **Python:** `python -m http.server 5501` en la carpeta del proyecto y abrir <http://localhost:5501>.

Phaser está copiado en `lib/phaser.min.js`, así que funciona sin internet (la fuente Press Start 2P sí se baja de Google Fonts).

### Modo desarrollo

Agregá `?debug` a la URL para activar las teclas de prueba y los atajos:

- `?debug&nivel=5&jugadores=2&jefe=oni` arranca directo en un nivel (jefes: `ogro`, `oni`, `espectro`).
- ENTER muestra las cajas de colisión · SUPR saca los enemigos · BACKSPACE alterna habilidades · AV PÁG modo dios.

## Estructura

```
index.html, main.js     Página y configuración de Phaser
config.js               Constantes de juego y de física (para calibrar sin buscar números sueltos)
i18n.js                 Textos en español e inglés
scenes/                 Escenas (Boot, Title, HowToPlay, Options, Credits, NinjaMoncho, UI, Pause, PactSelection)
                        y módulos de juego (Ninja, Enemigo, Bestiario, Jefe, Fantasma, Armas, Pactos, Partida,
                        Mapas, ConstructorNivel, Texturas, Sonido, Guardado, MenuInputManager)
public/assets/          Sprites, tiles y audio
lib/                    Phaser 3.80.1
Docs/                   GDD, lore, roadmap y bitácora de trabajo
tools/                  Herramientas de soporte (no son parte del juego)
```

El arte de armas, enemigos nuevos, jefes y HUD es provisorio y está generado por código en `scenes/Texturas.js`.
Para reemplazarlo alcanza con cargar un PNG con la misma key en `BootScene` y borrar el dibujo.

## Herramientas

- `tools/navegador/`: banco de pruebas que abre el juego en Edge sin ventana y reporta errores de consola.
  `cd tools/navegador && npm install && npm run humo` (con el juego servido en el puerto 5501).
- `tools/assets_info.py` y `tools/convertir_docs.py`: inventario de assets y conversión de documentos a Markdown
  (`uv pip install --python .venv -r tools/requirements.txt`).

## Créditos

- Música y SFX: Ninja Kid 2 (UPL, 1987)
- Gráficos: Ninja Kid 2 (UPL, 1987) · Mariano Trod
- Diseño: Mariano Trod · Santiago Tornau
- Programación: Gemini · Claude · Mariano Trod · Santiago Tornau

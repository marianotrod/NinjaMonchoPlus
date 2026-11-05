// Estilo.js
// Estilo de texto del juego: la fuente pixelada con resolución alta para que no se vea borrosa al escalar el canvas.
export const estilo = (tamaño, color = '#FFFFFF', extra = {}) => ({
  fontFamily: '"Press Start 2P"', fontSize: `${tamaño}px`, color, resolution: 10, ...extra
});

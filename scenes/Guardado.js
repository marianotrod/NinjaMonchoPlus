// Guardado.js
// Persistencia local (idioma, volumen, récord). Si el navegador bloquea localStorage, el juego sigue andando sin guardar.

const PREFIJO = 'ninjaMoncho.';

export const Guardado = {
  leer(clave, porDefecto) {
    try {
      const valor = localStorage.getItem(PREFIJO + clave);
      return valor === null ? porDefecto : JSON.parse(valor);
    } catch (e) {
      return porDefecto;
    }
  },

  escribir(clave, valor) {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    } catch (e) {}
  }
};

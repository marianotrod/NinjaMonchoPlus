// Graficos.js
// Gráficos sueltos de public/assets/graficos: cada uno es un PNG con este nombre. Para cambiar uno, se reemplaza el archivo.
// Conviene respetar el tamaño: el cuerpo físico de los jefes sale del tamaño de su dibujo.
export const GRAFICOS = [
  'katana-corte', 'shuriken', 'bumeran', 'bomba', 'fantasma', 'lanzador',
  'proyectil', 'corazon', 'corazon-vacio', 'corazon-coop', 'mano', 'estrella', 'chispa',
  'onda', 'icono-shuriken', 'icono-bumeran', 'icono-bomba', 'pergamino', 'jefe-ogro', 'jefe-oni',
  'jefe-espectro', 'jefe-rey', 'bola-fuego',
  'carta-pergamino', 'plataforma-fantasma', 'mina', 'bomba-especial', 'cuchilla', 'parry-circular',
  'llave', 'jaula'
];

// Hojas de cuadros de 16x16 en una fila. La animación usa todos los cuadros que tenga el PNG: se pueden agregar sin tocar código.
export const GRAFICOS_ANIMADOS = ['llama', 'flechasamurai'];

// Hojas de cuadros de 16x16 en una fila, sin animación propia: el código elige el cuadro.
//   esqueleto: sus animaciones están en datos/Animaciones.js
//   samurai: sus animaciones están en datos/Animaciones.js
//   volador: sus animaciones están en datos/Animaciones.js
export const GRAFICOS_CUADROS = ['esqueleto', 'samurai', 'volador'];

// Como los animados, pero con cuadros de 24x24.
//   aura: la llama alrededor de un ítem lanzado. Blanca: el juego la tiñe del color de a quién daña.
export const GRAFICOS_ANIMADOS_24 = ['aura'];

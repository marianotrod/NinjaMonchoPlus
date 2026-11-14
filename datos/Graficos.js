// Graficos.js
// Gráficos sueltos de public/assets/graficos: cada uno es un PNG con este nombre. Para cambiar uno, se reemplaza el archivo.
// Conviene respetar el tamaño: el cuerpo físico de los jefes sale del tamaño de su dibujo.
export const GRAFICOS = [
  'katana-corte', 'fantasma', 'lanzador',
  'proyectil', 'corazon', 'corazon-vacio', 'corazon-coop', 'mano', 'estrella', 'chispa',
  'onda', 'icono-shuriken', 'icono-bumeran', 'icono-bomba', 'pergamino', 'jefe-ogro', 'jefe-oni',
  'jefe-espectro', 'jefe-rey', 'bola-fuego',
  'carta-pergamino', 'plataforma-fantasma', 'mina', 'bomba-especial', 'cuchilla', 'parry-circular',
  'llave', 'jaula'
];

// Hojas de cuadros de 16x16 en una fila. La animación usa todos los cuadros que tenga el PNG: se pueden agregar sin tocar código.
//   shuriken y bumeran: girando, dibujados yendo a la derecha (el juego los da vuelta, no los rota)
//   bomba: la mecha largando chispas
export const GRAFICOS_ANIMADOS = ['llama', 'flechasamurai', 'shuriken', 'bumeran', 'bomba'];

// Como los animados, pero se ven una sola vez y desaparecen.
//   arma_destruccion: cuando un arma que no explota se rompe (shuriken, bumerán, cuchilla, flecha)
export const GRAFICOS_UNA_VEZ = ['arma_destruccion'];

// Hojas de cuadros de 16x16 en una fila, sin animación propia: el código elige el cuadro.
//   esqueleto: sus animaciones están en datos/Animaciones.js
//   samurai: sus animaciones están en datos/Animaciones.js
//   volador: sus animaciones están en datos/Animaciones.js
export const GRAFICOS_CUADROS = ['esqueleto', 'samurai', 'volador'];

// Como los animados, pero con cuadros de 24x24.
//   aura: la llama alrededor de un ítem lanzado. Blanca: el juego la tiñe del color de a quién daña.
export const GRAFICOS_ANIMADOS_24 = ['aura'];

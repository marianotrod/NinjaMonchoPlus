export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  // Generador de texto binarizado con espacio forzado
  crearTextoCrisp(x, y, texto, size = 8, color = '#FFFFFF', align = 'left', originX = 0, originY = 0) {
    const textoMayus = String(texto).toUpperCase();
    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    const fuente = `${size}px "Press Start 2P"`;
    ctx.font = fuente;
    // FIX: Forzamos espacio entre letras para que no se fundan al binarizar
    ctx.letterSpacing = '2px';

    const lineas = textoMayus.split('\n');
    const altoLinea = Math.ceil(size * 1.5);
    
    let anchoMax = 0;
    lineas.forEach(l => {
      const w = Math.ceil(ctx.measureText(l).width);
      if (w > anchoMax) anchoMax = w;
    });

    offscreen.width = anchoMax + 4;
    offscreen.height = (lineas.length * altoLinea) + 4;

    ctx.font = fuente;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;

    lineas.forEach((linea, index) => {
      let posX = 0;
      if (align === 'center') posX = offscreen.width / 2;
      if (align === 'right') posX = offscreen.width;
      ctx.fillText(linea, posX, index * altoLinea);
    });

    const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = d[i + 3] > 80 ? 255 : 0;
    }
    ctx.putImageData(imgData, 0, 0);

    const key = `txt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.textures.addCanvas(key, offscreen);
    const tex = this.textures.get(key);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const img = this.add.image(Math.round(x), Math.round(y), key);
    img.setOrigin(originX, originY);
    img.textKey = key;
    return img;
  }

  actualizarTextoCrisp(imgObj, nuevoTexto, size = 8, color = '#FFFFFF', align = 'left') {
    if (!imgObj) return;
    const x = imgObj.x;
    const y = imgObj.y;
    const ox = imgObj.originX;
    const oy = imgObj.originY;

    if (imgObj.textKey && this.textures.exists(imgObj.textKey)) {
      this.textures.remove(imgObj.textKey);
    }
    imgObj.destroy();

    return this.crearTextoCrisp(x, y, nuevoTexto, size, color, align, ox, oy);
  }

  create() {
    // 1. Franja negra de fondo superior (ocupa la primera fila del grid 16px)
    this.add.rectangle(0, 0, 512, 16, 0x000000).setOrigin(0, 0).setDepth(0);

    // 2. Textos iniciales
    this.textoPuntaje = this.crearTextoCrisp(8, 4, 'PTS: 0', 8, '#FFFFFF');
    this.textoTiempo = this.crearTextoCrisp(504, 4, 'TIEMPO: 60', 8, '#FFFFFF', 'right', 1, 0);

    // 3. HUD Central de talismanes
    this.hudTalismanes = { cuadrado: [], triangulo: [], rombo: [] };

    const configuracionGrupos = {
      cuadrado: { xInicio: 200 },
      triangulo: { xInicio: 250 },
      rombo: { xInicio: 300 }
    };
    const separacionX = 12;

    ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
      const conf = configuracionGrupos[tipo];
      for (let i = 0; i < 3; i++) {
        const x = conf.xInicio + (i * separacionX);
        const y = 8; // Centrado en la franja negra
        const icono = this.add.image(x, y, tipo).setDepth(1);
        this.hudTalismanes[tipo].push(icono);
      }
    });

    // 4. Escuchar eventos de la escena principal
    const juegoEscena = this.scene.get('NinjaMonchoScene');

    juegoEscena.events.on('actualizar-puntaje', (puntos) => {
      this.textoPuntaje = this.actualizarTextoCrisp(this.textoPuntaje, `PTS: ${puntos}`, 8, '#FFFFFF', 'left');
    });

    juegoEscena.events.on('actualizar-tiempo', (tiempo) => {
      this.textoTiempo = this.actualizarTextoCrisp(this.textoTiempo, `TIEMPO: ${tiempo}`, 8, '#FFFFFF', 'right');
    });

    juegoEscena.events.on('talisman-recolectado', (tipoItem) => {
      const listaIconosHUD = this.hudTalismanes[tipoItem];
      if (listaIconosHUD && listaIconosHUD.length > 0) {
        const iconoABorrar = listaIconosHUD.pop();
        if (iconoABorrar) iconoABorrar.destroy();
      }
    });

    // Escuchar el fin de juego para limpiar texto final
    juegoEscena.events.on('juego-terminado', (datos) => {
      const mensajeTitulo = datos.ganaste ? '¡GANASTE!' : '¡PERDISTE!\n\nTIEMPO AGOTADO';
      const colorTitulo = datos.ganaste ? '#4ADE80' : '#EF4444';

      this.crearTextoCrisp(256, 90, mensajeTitulo, 24, colorTitulo, 'center', 0.5, 0.5);
      this.crearTextoCrisp(256, 170, `PUNTOS TOTALES: ${datos.puntos}`, 16, '#FFFFFF', 'center', 0.5, 0.5);
      
      this.time.delayedCall(1500, () => {
        this.crearTextoCrisp(256, 220, 'PRESIONA ESPACIO\nPARA REINTENTAR', 8, '#FBBF24', 'center', 0.5, 0.5);
      });
    });
  }
}
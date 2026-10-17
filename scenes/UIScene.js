import { i18n } from '../i18n.js'; 

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    // 1. Franja negra de fondo superior (ocupa la primera fila del grid 16px)
    this.add.rectangle(0, 0, 512, 16, 0x000000).setOrigin(0, 0).setDepth(0);

    // 2. Textos iniciales nativos con i18n y resolución forzada para pixel art
    this.textoPuntaje = this.add.text(8, 4, `${i18n.t('hud_puntos')}: 0`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      resolution: 10
    });

    this.textoTiempo = this.add.text(504, 4, `${i18n.t('hud_tiempo')}: 60`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#FFFFFF',
      resolution: 10
    }).setOrigin(1, 0); // Alineado a la derecha

    // 3. HUD Central de talismanes
    this.hudTalismanes = { cuadrado: [], triangulo: [], rombo: [] };

    // Separación más holgada (16px entre cada icono) y posiciones de inicio distribuidas
    const configuracionGrupos = {
      cuadrado: { xInicio: 175 },
      triangulo: { xInicio: 235 },
      rombo: { xInicio: 295 }
    };
    const separacionX = 16; // Distancia cómoda para que no se solapen

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
      // Actualizamos con el texto dinámico del idioma actual
      this.textoPuntaje.setText(`${i18n.t('hud_puntos')}: ${puntos}`);
    });

    juegoEscena.events.on('actualizar-tiempo', (tiempo) => {
      this.textoTiempo.setText(`${i18n.t('hud_tiempo')}: ${tiempo}`);
    });

    juegoEscena.events.on('talisman-recolectado', (tipoItem) => {
      const listaIconosHUD = this.hudTalismanes[tipoItem];
      if (listaIconosHUD && listaIconosHUD.length > 0) {
        const iconoABorrar = listaIconosHUD.pop();
        if (iconoABorrar) iconoABorrar.destroy();
      }
    });

    // EVENTO NUEVO: Reseteo visual del HUD al recibir daño
    juegoEscena.events.on('inventario-perdido', () => {
      ['cuadrado', 'triangulo', 'rombo'].forEach(tipo => {
        const listaIconosHUD = this.hudTalismanes[tipo];
        
        // Destruimos todos los iconos sobrantes
        listaIconosHUD.forEach(icono => {
            if (icono) icono.destroy(); 
        });
        
        // Vaciamos el array de referencia
        this.hudTalismanes[tipo] = [];
        
        // Reconstruimos el HUD inicial con un parpadeo rojo
        const conf = configuracionGrupos[tipo];
        for (let i = 0; i < 3; i++) {
          const x = conf.xInicio + (i * separacionX);
          const y = 8;
          const nuevoIcono = this.add.image(x, y, tipo).setDepth(1);
          
          nuevoIcono.setTint(0xff5555); // Se ponen rojos
          this.time.delayedCall(200, () => nuevoIcono.clearTint()); // Vuelven a la normalidad
          
          this.hudTalismanes[tipo].push(nuevoIcono);
        }
      });
    });

    // Escuchar el fin de juego para mostrar textos finales
    juegoEscena.events.on('juego-terminado', (datos) => {
      const mensajeTitulo = datos.ganaste ? i18n.t('ganaste') : i18n.t('perdiste');
      const colorTitulo = datos.ganaste ? '#4ADE80' : '#EF4444';

      this.add.text(256, 90, mensajeTitulo, {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: colorTitulo,
        align: 'center',
        resolution: 10
      }).setOrigin(0.5);

      this.add.text(256, 170, `${i18n.t('hud_puntos')} TOTAL: ${datos.puntos}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center',
        resolution: 10
      }).setOrigin(0.5);
      
      this.time.delayedCall(1500, () => {
        this.add.text(256, 220, i18n.t('reintentar'), {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: '#FBBF24',
          align: 'center',
          lineSpacing: 5,
          resolution: 10
        }).setOrigin(0.5);
      });
    });
  }
}
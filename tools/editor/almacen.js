// almacen.js
// Lee los niveles del servidor y los guarda directo en la carpeta public/niveles del repo.
// Guardar usa la API de archivos del navegador (Chrome y Edge): la primera vez pide elegir la carpeta y dar permiso.
import { indiceConNivel, serializarIndice, serializarNivel } from './formato.js';

const RUTA = '../../public/niveles/';
let carpeta = null;

async function leerJson(archivo) {
  const respuesta = await fetch(`${RUTA}${archivo}`, { cache: 'no-store' });
  if (!respuesta.ok) throw new Error(`No se pudo leer ${archivo}`);
  return respuesta.json();
}

export const leerIndice = async () => (await leerJson('indice.json')).niveles;
export const leerNivel = (id) => leerJson(`${id}.json`);

async function pedirCarpeta() {
  if (carpeta) return carpeta;
  if (!window.showDirectoryPicker) throw new Error('Este navegador no permite guardar: usá Chrome o Edge.');
  const elegida = await window.showDirectoryPicker({ id: 'niveles', mode: 'readwrite' });
  try {
    await elegida.getFileHandle('indice.json');
  } catch (e) {
    throw new Error('Esa carpeta no tiene indice.json: elegí public/niveles del repo.');
  }
  carpeta = elegida;
  return carpeta;
}

async function escribir(dir, nombre, texto) {
  const archivo = await dir.getFileHandle(nombre, { create: true });
  const salida = await archivo.createWritable();
  await salida.write(texto);
  await salida.close();
}

// Devuelve el índice actualizado
export async function guardarNivel(nivel) {
  const dir = await pedirCarpeta();
  await escribir(dir, `${nivel.id}.json`, serializarNivel(nivel));
  const indice = indiceConNivel(await leerIndice(), nivel);
  await escribir(dir, 'indice.json', serializarIndice(indice));
  return indice;
}

// Genera las frases para cargar en Traducila a partir de los textos de i18n.js:
//   node tools/traducciones/generar_frases.js
// Deja Docs/traducila_frases.tsv (frase en español <TAB> inglés), sin repetidas y con ' | ' en lugar de los saltos de línea.
const fs = require('fs');

const fuente = fs.readFileSync('i18n.js', 'utf8');
const inicio = fuente.indexOf('const textos = {');
const fin = fuente.indexOf('let idiomaActual');
const textos = new Function(`${fuente.slice(inicio, fin)}; return textos;`)();

const unaLinea = (texto) => texto.replace(/\n/g, ' | ');
const frases = new Map();
const conflictos = [];
Object.entries(textos.es).forEach(([clave, frase]) => {
  const es = unaLinea(frase);
  const en = unaLinea(textos.en[clave] || '');
  if (!en) console.log(`Sin inglés: ${clave}`);
  if (frases.has(es) && frases.get(es) !== en) conflictos.push(`${clave}: "${es}" → "${frases.get(es)}" o "${en}"`);
  if (!frases.has(es)) frases.set(es, en);
});

const lineas = [...frases].map(([es, en]) => `${es}\t${en}`);
fs.writeFileSync('Docs/traducila_frases.tsv', `${lineas.join('\n')}\n`);
console.log(`${frases.size} frases en Docs/traducila_frases.tsv`);
conflictos.forEach(c => console.log(`CONFLICTO ${c}`));

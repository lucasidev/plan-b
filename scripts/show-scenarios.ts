/**
 * Imprime el punto de partida de TDD/ATDD de una story: su "listo cuando" y sus
 * escenarios ejecutables, sin importar en qué recorrido viva (ADR-0077).
 *
 * Usage: bun scripts/show-scenarios.ts <US-NNN | NNN>
 * Invocado por `just scenarios US-228`. El test que salga de acá cita el ID de la
 * story y el escenario (E1, N2): es el contrato de ADR-0072.
 */

import { existsSync, globSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const arg = process.argv[2] ?? '';
const num = arg.replace(/^US-?/i, '');
if (!/^\d{3}$/.test(num)) {
  console.error('Uso: bun scripts/show-scenarios.ts <US-NNN | NNN>');
  process.exit(2);
}

// la story vive en un tramo (product/<journey>/<epic>/stories/) o es una garantía
// (product/guarantees/); el ID es único en todo el producto, así que hay un solo hit
const hits = [
  ...globSync(`docs/product/*/*/stories/US-${num}-*/README.md`, { cwd: ROOT }),
  ...globSync(`docs/product/guarantees/US-${num}-*/README.md`, { cwd: ROOT }),
];
if (hits.length === 0) {
  console.error(`US-${num}: no existe en docs/product/`);
  process.exit(1);
}
if (hits.length > 1) {
  console.error(`US-${num}: ID duplicado (${hits.join(', ')}); check-docs lo canta`);
  process.exit(1);
}

const dir = join(ROOT, hits[0], '..');
const readme = readFileSync(join(dir, 'README.md'), 'utf-8');
const titulo = readme.split('\n')[0];
const listo = readme.split('## Listo cuando')[1]?.split(/^## /m)[0]?.trim() ?? '(sin criterio)';

console.log(titulo);
console.log(`\n${hits[0].replace(/\\/g, '/')}\n`);
console.log('## Listo cuando\n');
console.log(listo);
console.log('');

const scen = join(dir, 'scenarios.md');
if (existsSync(scen)) {
  // del scenarios.md se omite el título (repite el de arriba) y se imprime el resto entero
  const cuerpo = readFileSync(scen, 'utf-8').split('\n').slice(1).join('\n').trim();
  console.log(cuerpo);
} else {
  console.log('(sin scenarios.md: el slice está incompleto y check-docs lo canta)');
}

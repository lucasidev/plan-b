/**
 * Borra archivos y carpetas, recursivo y sin quejarse si no existen.
 *
 * Existe porque el Justfile usaba `rm -f` y `rm -rf` directo en las recetas, y
 * en Windows el shell es pwsh (`set windows-shell`), donde `rm` es alias de
 * `Remove-Item` y no acepta flags de POSIX: `rm -f x` corta con "the parameter
 * name 'f' is ambiguous. Possible matches include: -Filter -Force". O sea que
 * `just teardown` y `just clean` no corrían en la máquina de desarrollo. Es el
 * mismo motivo por el que existe infra-logs.ts, y la razón por la que este repo
 * escribe sus scripts en TS y no en shell.
 *
 * Uso: bun scripts/remove-paths.ts .env frontend/.env.local
 */

import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = process.argv.slice(2);

if (targets.length === 0) {
  process.stderr.write('Uso: bun scripts/remove-paths.ts <path> [path...]\n');
  process.exit(1);
}

const ROOT = resolve(import.meta.dirname, '..');

for (const target of targets) {
  // Los paths se resuelven contra la raíz del repo y no contra el cwd, así la
  // receta funciona sin importar desde dónde la corras.
  const full = resolve(ROOT, target);
  // Se mira antes de borrar solo para poder decir la verdad: `force` no falla
  // ante un path inexistente, y sin esto un path mal escrito informaría
  // "borrado" habiendo tocado nada. Es la clase de mentira que hace perder una
  // tarde buscando por qué el archivo sigue ahí.
  const existed = existsSync(full);
  rmSync(full, { recursive: true, force: true });
  process.stdout.write(existed ? `  borrado: ${target}\n` : `  no existía: ${target}\n`);
}

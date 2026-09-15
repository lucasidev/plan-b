import { readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const crumbsDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const planbDir = join(crumbsDir, '..');

/** Las rutas, relativas a `base`, que tienen un `page.tsx`, salteando las carpetas que `skip` descarta. */
function routesWithPage(base: string, skip: (folder: string) => boolean): string[] {
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skip(entry.name)) walk(join(dir, entry.name));
      } else if (entry.name === 'page.tsx') {
        routes.push(relative(base, dir).split(sep).join('/'));
      }
    }
  };
  walk(base);
  return routes.sort();
}

describe('el slot @crumbs de (planb)', () => {
  // En el build de producción, navegar desde una ruta que resuelve el slot con default.tsx hacia una
  // que tiene página propia rompe el router: una ruta nueva sin su página en el slot reabre ese caso.
  it('tiene una página por cada ruta de (planb)', () => {
    const planbRoutes = routesWithPage(
      planbDir,
      (folder) => folder.startsWith('@') || folder.startsWith('_'),
    );
    const slotRoutes = routesWithPage(crumbsDir, (folder) => folder.startsWith('_'));

    expect(slotRoutes).toEqual(planbRoutes);
  });
});

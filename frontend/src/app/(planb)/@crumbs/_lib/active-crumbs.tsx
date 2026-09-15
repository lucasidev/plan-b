'use client';

import { usePathname } from 'next/navigation';
import type { Crumb } from '@/components/layout/breadcrumbs';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { genericCrumbs } from '@/lib/member-shell';

/**
 * Envuelve las migas de una de las cuatro fichas con nombre real del slot `@crumbs`. Sin un
 * catch-all que matchee cada segmento, una navegación suave desde esta ficha a una ruta que el
 * slot no resuelve (p. ej. de `/subjects/[id]` a `/method`) no le pide contenido nuevo a este
 * slot, y las migas de la ficha vieja quedarían colgadas. `usePathname()` sí es reactivo del lado
 * del cliente: si ya no coincide con el pathname para el que el server armó `items`, se dibujan
 * las genéricas en su lugar.
 */
export function ActiveCrumbs({ pathname, items }: { pathname: string; items: Crumb[] }) {
  const currentPathname = usePathname();

  if (currentPathname !== pathname) {
    return <Breadcrumbs items={genericCrumbs(currentPathname)} />;
  }

  return <Breadcrumbs items={items} />;
}

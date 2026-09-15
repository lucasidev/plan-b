'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { genericCrumbs } from '@/lib/member-shell';

/**
 * Las migas genéricas del topbar para las rutas de (planb) sin ficha con nombre real, derivadas
 * del pathname. Cada una de esas rutas tiene su propia página en el slot que dibuja esto: en el
 * build de producción, navegar desde una ruta que resuelve el slot con `default.tsx` hacia una que
 * tiene página propia rompe el router ("e is not iterable"), así que ninguna ruta de (planb) deja
 * el slot en `default.tsx`.
 */
export function GenericCrumbs() {
  const pathname = usePathname();
  return <Breadcrumbs items={genericCrumbs(pathname)} />;
}

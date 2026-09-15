'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { genericCrumbs } from '@/lib/member-shell';

/**
 * Fallback del slot `@crumbs` para toda ruta de `(planb)` que no sea una de las cuatro fichas con
 * nombre real: las migas genéricas de siempre, las mismas que arma el topbar de `(member)`.
 *
 * Client, no server: sin un catch-all que matchee cada segmento (ver el commit que lo sacó), Next
 * solo vuelve a pedirle contenido a este slot cuando hay una `page` que matchea el segmento nuevo,
 * así que una navegación suave entre dos rutas que ninguna resuelve acá (p. ej. `/method` ->
 * `/about`) no dispara un nuevo render server-side de este `default`. `usePathname()` sí es
 * reactivo del lado del cliente: el componente ya montado vuelve a renderizar con el pathname
 * nuevo aunque el árbol server no se toque.
 */
export default function CrumbsDefault() {
  const pathname = usePathname();
  return <Breadcrumbs items={genericCrumbs(pathname)} />;
}

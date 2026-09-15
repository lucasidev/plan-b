import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { genericCrumbs } from '@/lib/member-shell';

type Params = Promise<{ catchAll: string[] }>;

/**
 * Fallback del slot para toda ruta de `(planb)` que no sea una de las cuatro fichas con nombre
 * real: las mismas migas genéricas que ya arma el topbar de `(member)` (`genericCrumbs`).
 *
 * Obligatorio junto a `default.tsx`: sin un `page.tsx` que matchee cada segmento, una navegación
 * suave entre dos rutas que ninguna resuelve acá (p. ej. `/method` -> `/about`) deja el slot con la
 * última miga que sí renderizó, porque Next solo vuelve a pedirle contenido a un slot cuando hay
 * una `page` que matchea el segmento nuevo.
 */
export default async function CrumbsCatchAll({ params }: { params: Params }) {
  const { catchAll } = await params;
  return <Breadcrumbs items={genericCrumbs(`/${catchAll.join('/')}`)} />;
}

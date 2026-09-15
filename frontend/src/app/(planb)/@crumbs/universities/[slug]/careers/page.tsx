import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { universityShortName } from '@/features/browse-catalog';
import { fetchUniversitiesServer } from '@/features/browse-catalog/api.server';
import { genericCrumbs } from '@/lib/member-shell';
import { ActiveCrumbs } from '../../../_lib/active-crumbs';

type Params = Promise<{ slug: string }>;

/**
 * Migas de la ficha de institución (`V.university`, línea 485 de la maqueta aprobada): Explorar /
 * {universidad en nombre corto}. Mismo fetch que la página (`fetchUniversitiesServer`), memoizado
 * por Next dentro del mismo render: no duplica el pedido al backend.
 *
 * Sin catch acá, un pedido que falla tiraría abajo la página entera: el slot cae a las migas
 * genéricas en cualquiera de los dos casos (slug sin coincidencia, pedido que falla), nunca a un
 * 500.
 */
export default async function UniversityCrumbs({ params }: { params: Params }) {
  const { slug } = await params;
  const pathname = `/universities/${slug}/careers`;
  const universities = await fetchUniversitiesServer().catch(() => []);
  const university = universities.find((u) => u.slug === slug);

  if (!university) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  return (
    <ActiveCrumbs
      pathname={pathname}
      items={[
        { label: 'Explorar', href: '/universities' },
        { label: universityShortName(university) },
      ]}
    />
  );
}

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { universityShortName } from '@/features/browse-catalog';
import { fetchUniversitiesServer } from '@/features/browse-catalog/api.server';
import { genericCrumbs } from '@/lib/member-shell';

type Params = Promise<{ slug: string }>;

/**
 * Migas de la ficha de institución (`V.university`, línea 485 de la maqueta aprobada): Explorar /
 * {universidad en nombre corto}. Mismo fetch que la página (`fetchUniversitiesServer`), memoizado
 * por Next dentro del mismo render: no duplica el pedido al backend.
 */
export default async function UniversityCrumbs({ params }: { params: Params }) {
  const { slug } = await params;
  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);

  if (!university) {
    return <Breadcrumbs items={genericCrumbs(`/universities/${slug}/careers`)} />;
  }

  return (
    <Breadcrumbs
      items={[
        { label: 'Explorar', href: '/universities' },
        { label: universityShortName(university) },
      ]}
    />
  );
}

import type { Crumb } from '@/components/layout/breadcrumbs';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchCareerFactsServer } from '@/features/career-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { ActiveCrumbs } from '../../_lib/active-crumbs';
import { universityCrumbByCareer } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de carrera (`V.career`, línea 508 de la maqueta aprobada): Explorar /
 * {universidad corta} / {facultad} / {carrera}. La facultad sale de `academicUnitName` y no va si
 * viene null; cuando va, lleva al mismo link que la universidad (la maqueta no tiene ficha propia
 * de facultad). Mismo fetch que la página (`fetchCareerFactsServer`), memoizado por Next.
 *
 * Sin catch acá, un pedido que falla (no 404) tiraría abajo la página entera: el slot cae a las
 * migas genéricas en cualquiera de los tres casos (carrera inexistente, universidad sin
 * coincidencia, pedido que falla), nunca a un 500.
 */
export default async function CareerCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const pathname = `/careers/${id}`;
  const facts = await fetchCareerFactsServer(id).catch(() => null);
  if (!facts) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  const university = await universityCrumbByCareer(facts.careerId);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  const items: Crumb[] = [{ label: 'Explorar', href: '/universities' }, university];
  if (facts.academicUnitName) {
    items.push({ label: facts.academicUnitName, href: university.href });
  }
  // La carrera no tiene nombre corto en el backend: va entera pero recortada (`truncate`), para
  // que estas migas entren en dos líneas a 1280px como el resto de las fichas (ver `Breadcrumbs`).
  items.push({ label: facts.careerName, truncate: true });

  return <ActiveCrumbs pathname={pathname} items={items} />;
}

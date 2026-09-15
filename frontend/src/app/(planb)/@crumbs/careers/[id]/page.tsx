import type { Crumb } from '@/components/layout/breadcrumbs';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchCareerFactsServer } from '@/features/career-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { universityCrumb } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de carrera (`V.career`, línea 508 de la maqueta aprobada): Explorar /
 * {universidad corta} / {facultad} / {carrera}. La facultad sale de `academicUnitName` y no va si
 * viene null; cuando va, lleva al mismo link que la universidad (la maqueta no tiene ficha propia
 * de facultad). Mismo fetch que la página (`fetchCareerFactsServer`), memoizado por Next.
 */
export default async function CareerCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const facts = await fetchCareerFactsServer(id);
  if (!facts) {
    return <Breadcrumbs items={genericCrumbs(`/careers/${id}`)} />;
  }

  const university = await universityCrumb(facts.universityName);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(`/careers/${id}`)} />;
  }

  const items: Crumb[] = [{ label: 'Explorar', href: '/universities' }, university];
  if (facts.academicUnitName) {
    items.push({ label: facts.academicUnitName, href: university.href });
  }
  // La carrera no tiene nombre corto en el backend: va entera, con ellipsis por CSS para que un
  // nombre largo no le haga crecer el alto al topbar.
  items.push({ label: facts.careerName, truncate: true });

  return <Breadcrumbs items={items} />;
}

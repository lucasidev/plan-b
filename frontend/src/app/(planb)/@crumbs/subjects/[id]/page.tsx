import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { ActiveCrumbs } from '../../_lib/active-crumbs';
import { universityCrumbByPlan } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de materia (`V.subject`, línea 538 de la maqueta aprobada): Explorar /
 * {universidad corta} / {carrera} / {código} · {materia}, sin facultad. Mismo fetch que la página
 * (`fetchSubjectFactsServer`), memoizado por Next dentro del mismo render.
 *
 * La carrera lleva `truncate` (la única miga sin nombre corto en el backend): sin recortarla, a
 * 1280px estas migas ocupan tres líneas en vez de dos (ver `Breadcrumbs`).
 *
 * Sin catch acá, un pedido que falla (no 404) tiraría abajo la página entera: el slot cae a las
 * migas genéricas en cualquiera de los tres casos (materia inexistente, universidad sin
 * coincidencia, pedido que falla), nunca a un 500.
 */
export default async function SubjectCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const pathname = `/subjects/${id}`;
  const facts = await fetchSubjectFactsServer(id).catch(() => null);
  if (!facts) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  const university = await universityCrumbByPlan(facts.careerPlanId);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  return (
    <ActiveCrumbs
      pathname={pathname}
      items={[
        { label: 'Explorar', href: '/universities' },
        university,
        { label: facts.careerName, href: `/careers/${facts.careerId}`, truncate: true },
        { label: `${facts.subjectCode} · ${facts.subjectName}` },
      ]}
    />
  );
}

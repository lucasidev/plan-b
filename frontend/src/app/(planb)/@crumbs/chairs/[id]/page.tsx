import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchChairFactsServer } from '@/features/chair-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { subjectLabel } from '@/lib/subject-label';
import { ActiveCrumbs } from '../../_lib/active-crumbs';
import { universityCrumbByPlan } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de cátedra (`V.chair`, línea 565 de la maqueta aprobada): la cadena de su
 * materia más "Cátedra {nombre}". Pide la ficha de materia con `chairFacts.subjectId`, el mismo
 * dato que usa la columna "Las hermanas" de la página (memoizado por Next dentro del mismo render).
 *
 * La carrera lleva `truncate` (la única miga sin nombre corto en el backend): sin recortarla, a
 * 1280px estas migas ocupan tres líneas en vez de dos (ver `Breadcrumbs`).
 *
 * Sin catch acá, un pedido que falla (no 404) tiraría abajo la página entera: el slot cae a las
 * migas genéricas en cualquiera de los tres casos (cátedra o materia inexistente, universidad sin
 * coincidencia, pedido que falla), nunca a un 500.
 */
export default async function ChairCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const pathname = `/chairs/${id}`;
  const chairFacts = await fetchChairFactsServer(id).catch(() => null);
  if (!chairFacts) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  const subjectFacts = await fetchSubjectFactsServer(chairFacts.subjectId).catch(() => null);
  if (!subjectFacts) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  const university = await universityCrumbByPlan(subjectFacts.careerPlanId);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(pathname)} />;
  }

  return (
    <ActiveCrumbs
      pathname={pathname}
      items={[
        { label: 'Explorar', href: '/universities' },
        university,
        {
          label: subjectFacts.careerName,
          href: `/careers/${subjectFacts.careerId}`,
          truncate: true,
        },
        {
          label: subjectLabel(subjectFacts.subjectCode, subjectFacts.subjectName),
          href: `/subjects/${subjectFacts.subjectId}`,
        },
        { label: `Cátedra ${chairFacts.chairName}` },
      ]}
    />
  );
}

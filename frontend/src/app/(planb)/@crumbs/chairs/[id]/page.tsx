import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchChairFactsServer } from '@/features/chair-facts';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { universityCrumb } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de cátedra (`V.chair`, línea 565 de la maqueta aprobada): la cadena de su
 * materia más "Cátedra {nombre}". Pide la ficha de materia con `chairFacts.subjectId`, el mismo
 * dato que usa la columna "Las hermanas" de la página (memoizado por Next dentro del mismo render).
 */
export default async function ChairCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const chairFacts = await fetchChairFactsServer(id);
  if (!chairFacts) {
    return <Breadcrumbs items={genericCrumbs(`/chairs/${id}`)} />;
  }

  const subjectFacts = await fetchSubjectFactsServer(chairFacts.subjectId);
  if (!subjectFacts) {
    return <Breadcrumbs items={genericCrumbs(`/chairs/${id}`)} />;
  }

  const university = await universityCrumb(subjectFacts.universityName);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(`/chairs/${id}`)} />;
  }

  return (
    <Breadcrumbs
      items={[
        { label: 'Explorar', href: '/universities' },
        university,
        {
          label: subjectFacts.careerName,
          href: `/careers/${subjectFacts.careerId}`,
          truncate: true,
        },
        {
          label: `${subjectFacts.subjectCode} · ${subjectFacts.subjectName}`,
          href: `/subjects/${subjectFacts.subjectId}`,
        },
        { label: `Cátedra ${chairFacts.chairName}` },
      ]}
    />
  );
}

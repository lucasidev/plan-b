import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { fetchSubjectFactsServer } from '@/features/subject-facts';
import { genericCrumbs } from '@/lib/member-shell';
import { universityCrumb } from '../../_lib/resolve-university';

type Params = Promise<{ id: string }>;

/**
 * Migas de la ficha de materia (`V.subject`, línea 538 de la maqueta aprobada): Explorar /
 * {universidad corta} / {carrera} / {código} · {materia}, sin facultad. Mismo fetch que la página
 * (`fetchSubjectFactsServer`), memoizado por Next dentro del mismo render.
 */
export default async function SubjectCrumbs({ params }: { params: Params }) {
  const { id } = await params;
  const facts = await fetchSubjectFactsServer(id);
  if (!facts) {
    return <Breadcrumbs items={genericCrumbs(`/subjects/${id}`)} />;
  }

  const university = await universityCrumb(facts.universityName);
  if (!university) {
    return <Breadcrumbs items={genericCrumbs(`/subjects/${id}`)} />;
  }

  return (
    <Breadcrumbs
      items={[
        { label: 'Explorar', href: '/universities' },
        university,
        { label: facts.careerName, href: `/careers/${facts.careerId}`, truncate: true },
        { label: `${facts.subjectCode} · ${facts.subjectName}` },
      ]}
    />
  );
}

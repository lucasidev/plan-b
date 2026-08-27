import { redirect } from 'next/navigation';
import {
  CourseReviewForm,
  fetchCurrentInstrumentServer,
  fetchPlanSubjectsServer,
  fetchTermsServer,
} from '@/features/write-course-review';
import { fetchStudentProfile } from '@/lib/student-profile';

export const metadata = {
  title: 'Reseñar una cursada · planb',
};

// Depende del plan y la universidad del alumno, que salen de su cookie. Dinámica para no
// prerenderizar con el backend abajo.
export const dynamic = 'force-dynamic';

/**
 * Reseñar una cursada (US-146, SC-015). El acto principal del producto: se elige una materia del
 * plan, el período y la cátedra, y se contesta el cuestionario vigente.
 *
 * Todo lo que la pantalla necesita se prefetchea acá y baja como props: el cuestionario y las
 * materias no cambian mientras alguien responde, así que no hay nada que revalidar del lado del
 * cliente. Lo único que se pide en el browser son las cátedras, porque dependen de la materia que
 * todavía no eligió.
 */
export default async function WriteCourseReviewPage() {
  const profile = await fetchStudentProfile();
  if (!profile) {
    redirect('/onboarding');
  }

  const [instrument, subjects, terms] = await Promise.all([
    fetchCurrentInstrumentServer(),
    fetchPlanSubjectsServer(profile.careerPlanId),
    profile.universityId ? fetchTermsServer(profile.universityId) : Promise.resolve([]),
  ]);

  return (
    <div data-surface="bulletin" className="mx-auto w-full max-w-[560px] px-4 py-8">
      {instrument === null ? (
        <div className="rounded-lg border border-line bg-bg-card p-6">
          <h1 className="font-serif text-[22px] font-semibold text-ink">
            Todavía no hay cuestionario publicado
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-2">
            Sin preguntas no hay nada que contar. Volvé en un rato.
          </p>
        </div>
      ) : (
        <CourseReviewForm instrument={instrument} subjects={subjects} terms={terms} />
      )}
    </div>
  );
}

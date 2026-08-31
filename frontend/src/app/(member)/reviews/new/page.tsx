import Link from 'next/link';
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
    // Las materias que se ofrecen salen del plan de la persona, así que sin carrera declarada
    // no hay lista que mostrar y esta pantalla no puede seguir. Es un estado que una cuenta
    // creada por el registro no alcanza (declara su carrera al darse de alta y el perfil nace
    // al verificar el mail): queda para las que se registraron antes de ADR-0086. Se dice por
    // qué y se ofrece el camino, en vez de redirigir callado a un lugar que ya no existe.
    return <MissingCareerNotice />;
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
            Sin preguntas no hay nada que reseñar. Volvé en un rato.
          </p>
        </div>
      ) : (
        <CourseReviewForm instrument={instrument} subjects={subjects} terms={terms} />
      )}
    </div>
  );
}

function MissingCareerNotice() {
  return (
    <div data-surface="bulletin" className="mx-auto w-full max-w-[560px] px-4 py-8">
      <div className="rounded-lg border border-line bg-bg-card p-6">
        <h1 className="font-serif text-[22px] font-semibold text-ink">
          Primero decinos qué cursás
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-2">
          Las materias que te mostramos salen de tu carrera, y todavía no la tenemos. Se declara una
          sola vez, en tu perfil.
        </p>
        <Link
          href="/my-profile"
          className="mt-4 inline-block text-[13.5px] font-medium text-accent underline-offset-2 hover:underline"
        >
          Ir a Mi perfil →
        </Link>
      </div>
    </div>
  );
}

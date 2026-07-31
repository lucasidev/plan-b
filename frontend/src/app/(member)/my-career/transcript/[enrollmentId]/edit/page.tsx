import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EditEnrollmentForm } from '@/features/edit-enrollment';
import { fetchTranscriptServer } from '@/features/my-career/api.server';
import { fetchMyReviewsServer } from '@/features/my-reviews/api.server';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/my-career/transcript/{enrollmentId}/edit` (US-015-f).
 *
 * Resuelve la cursada contra el historial (GET /api/me/enrollment-records) en vez de contra un
 * endpoint por id: el listado ya trae todo lo que el editor necesita y es corto, así que un
 * endpoint dedicado sería prematuro. Mismo criterio que la edición de reseñas.
 *
 * De paso, resolver por el historial propio es lo que garantiza que el alumno solo pueda abrir el
 * editor de una cursada suya: un id ajeno no aparece en su historial y cae en `notFound()`. La
 * autorización real igual la hace el backend en el PATCH (404 para lo que no es tuyo).
 */
export default async function EditTranscriptEntryPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;

  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  const [{ periods }, planSummary] = await Promise.all([
    fetchTranscriptServer(),
    fetchCareerPlanSummary(profile.careerPlanId),
  ]);

  const entry = periods.flatMap((p) => p.items).find((i) => i.id === enrollmentId);
  if (!entry) notFound();

  if (!planSummary) {
    return <CatalogUnavailable />;
  }

  // Si hay una reseña publicada anclada a esta cursada, volverla a "cursando" la manda a revisión
  // (ADR-0032). El form lo necesita para decidir si pide confirmación, y sin reseña publicada no
  // hay nada que confirmar: el consumer de Reviews no toca las que no están publicadas.
  const hasPublishedReview = await findPublishedReviewFor(enrollmentId);

  return (
    <div className="px-6 py-9 max-w-[640px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Editar cursada</Eyebrow>
      <DisplayHeading size={28} className="mt-2 mb-2">
        Corregí lo que cargaste.
      </DisplayHeading>
      <p className="text-ink-3 mb-6" style={{ fontSize: 14 }}>
        Cambiá el estado, la nota, la comisión o el cuatrimestre. Lo que guardes acá se refleja en
        el resto de Mi carrera.
      </p>

      <EditEnrollmentForm
        enrollment={{
          id: entry.id,
          subjectId: entry.subjectId,
          subjectCode: entry.subjectCode,
          subjectName: entry.subjectName,
          commissionId: entry.commissionId,
          termId: entry.termId,
          status: entry.status,
          approvalMethod: entry.approvalMethod,
          grade: entry.grade,
        }}
        universityId={planSummary.universityId}
        hasPublishedReview={hasPublishedReview}
      />

      <div className="mt-6">
        <Link
          href="/my-career?tab=transcript"
          className="inline-flex items-center text-accent-ink hover:text-accent-hover"
          style={{ fontSize: 13 }}
        >
          ← Volver al historial
        </Link>
      </div>
    </div>
  );
}

type CareerPlanSummary = {
  id: string;
  careerId: string;
  universityId: string;
  year: number;
};

async function fetchCareerPlanSummary(careerPlanId: string): Promise<CareerPlanSummary | null> {
  try {
    const r = await apiFetch(`/api/academic/career-plans/${encodeURIComponent(careerPlanId)}`, {
      cache: 'no-store',
    });
    if (r.status === 200) {
      return (await r.json()) as CareerPlanSummary;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Degrada a `false` si el listado de reseñas falla: sin poder confirmar que hay una reseña
 * publicada, la alternativa sería advertir sobre una consecuencia que quizás no existe. El backend
 * hace lo correcto igual (publica el evento o no según el dato real); lo único que se pierde es el
 * diálogo.
 */
async function findPublishedReviewFor(enrollmentId: string): Promise<boolean> {
  try {
    const { items } = await fetchMyReviewsServer();
    return items.some((r) => r.enrollmentId === enrollmentId && r.status === 'Published');
  } catch {
    return false;
  }
}

function CatalogUnavailable() {
  return (
    <div className="px-6 py-9 max-w-[640px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Editar cursada</Eyebrow>
      <DisplayHeading size={28} className="mt-2 mb-2">
        Catálogo no disponible.
      </DisplayHeading>
      <p className="text-ink-3 mb-6" style={{ fontSize: 14 }}>
        No pudimos resolver tu plan de estudios para listar cuatrimestres y comisiones. Intentá de
        nuevo en un rato.
      </p>
      <Link
        href="/my-career?tab=transcript"
        className="inline-flex items-center text-accent-ink hover:text-accent-hover"
        style={{ fontSize: 13 }}
      >
        ← Volver al historial
      </Link>
    </div>
  );
}

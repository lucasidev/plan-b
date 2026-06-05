import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EnrollmentForm } from '@/features/add-enrollment';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/my-career/transcript/add` page (US-013-f).
 *
 * Server component: resolves session → profile → the plan's universityId and passes
 * everything to the `EnrollmentForm` client component. The backend already gates with
 * its checks; this pre-resolve is to avoid flashes and so the form can do its
 * cascades (subjects per plan, terms per university) without an extra round-trip.
 *
 * If the `(member)` guard already redirected to `/onboarding/welcome` when the
 * profile was missing, this re-check is defense in depth for the race case (profile
 * deleted in between).
 */
export default async function AddTranscriptEntryPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  // Resolve the plan's universityId (needed to list academic-terms). If the lookup
  // fails we go back to the transcript with a message instead of crashing: the form
  // without a university is unusable.
  const planSummary = await fetchCareerPlanSummary(profile.careerPlanId);
  if (!planSummary) {
    return <CatalogUnavailable />;
  }

  return (
    <div className="px-6 py-9 max-w-[640px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Agregar materia</Eyebrow>
      <DisplayHeading size={28} className="mt-2 mb-2">
        Cargá una materia que rendiste.
      </DisplayHeading>
      <p className="text-ink-3 mb-6" style={{ fontSize: 14 }}>
        Elegí la materia, el estado de tu cursada y la nota si corresponde. Los datos alimentan tu
        historial y el resto de Mi carrera.
      </p>

      <EnrollmentForm careerPlanId={profile.careerPlanId} universityId={planSummary.universityId} />

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

function CatalogUnavailable() {
  return (
    <div className="px-6 py-9 max-w-[640px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Agregar materia</Eyebrow>
      <DisplayHeading size={28} className="mt-2 mb-2">
        Catálogo no disponible.
      </DisplayHeading>
      <p className="text-ink-3 mb-6" style={{ fontSize: 14 }}>
        No pudimos resolver tu plan de estudios para cargar materias. Intentá de nuevo en un rato.
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

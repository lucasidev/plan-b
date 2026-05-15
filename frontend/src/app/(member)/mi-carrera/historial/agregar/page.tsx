import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EnrollmentForm } from '@/features/add-enrollment';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * Página `/mi-carrera/historial/agregar` (US-013-f).
 *
 * Server component: resuelve session → profile → universityId del plan, y
 * pasa todo al <see cref="EnrollmentForm"/> client component. El backend ya
 * gatea con sus checks; este pre-resolve es para evitar flashes y para que
 * el form pueda hacer cascadas (subjects por plan, terms por uni) sin
 * round-trip extra.
 *
 * Si el guard del `(member)` ya redirigió a `/onboarding/welcome` cuando
 * faltaba el profile, este re-check es defense en profundidad para el caso
 * de race (profile borrado en el medio).
 */
export default async function AgregarHistorialPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  // Resolve universityId del plan (necesario para listar academic-terms).
  // Si la lookup falla devolvemos al historial con un mensaje en vez de
  // crashear: el form sin uni no es usable.
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
          href="/mi-carrera?tab=historial"
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
        href="/mi-carrera?tab=historial"
        className="inline-flex items-center text-accent-ink hover:text-accent-hover"
        style={{ fontSize: 13 }}
      >
        ← Volver al historial
      </Link>
    </div>
  );
}

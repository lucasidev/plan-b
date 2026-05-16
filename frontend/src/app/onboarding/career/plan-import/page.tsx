import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CareerPlanImportFlow } from '@/features/import-career-plan';
import { OnboardingShell } from '@/features/onboarding';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/career/plan-import` — sub-flow del paso 02 cuando el alumno no encuentra su
 * plan en las cascadas (US-088). Recibe via query params la universidad que ya eligió en el
 * paso anterior + el año de ingreso tipeado, para no perder ese state al navegar.
 *
 * Al confirmar el preview, el feature flow redirige a `/onboarding/career?planId=X` con el
 * plan recién creado, así el alumno completa el StudentProfile en el form principal sin
 * tener que re-seleccionar las cascadas.
 */
type SearchParams = {
  universityId?: string;
  enrollmentYear?: string;
};

export default async function OnboardingCareerPlanImportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (profile) redirect('/home');

  const params = await searchParams;
  const universityId = params.universityId ?? '';
  const defaultEnrollmentYear = params.enrollmentYear
    ? Number.parseInt(params.enrollmentYear, 10) || new Date().getFullYear()
    : new Date().getFullYear();

  if (!universityId) {
    return (
      <OnboardingShell
        step={2}
        heading="Necesitamos saber tu universidad"
        subheading="Volvé al paso anterior y elegí tu universidad antes de subir el plan."
      >
        <Link
          href="/onboarding/career"
          className="inline-flex items-center text-accent-ink hover:text-accent-hover"
          style={{ fontSize: 13 }}
        >
          ← Volver
        </Link>
      </OnboardingShell>
    );
  }

  // Resolve nombre de la universidad para mostrar en el form. Fallback: el id si la API falla.
  const universityName = await fetchUniversityName(universityId).catch(() => universityId);

  return (
    <OnboardingShell
      step={2}
      heading="Subí el PDF de tu plan de estudios"
      subheading="Detectamos las materias automáticamente. Después revisás el resultado antes de crear el plan."
    >
      <CareerPlanImportFlow
        universityId={universityId}
        universityName={universityName}
        defaultEnrollmentYear={defaultEnrollmentYear}
      />

      <div style={{ marginTop: 24 }}>
        <Link
          href={`/onboarding/career?universityId=${encodeURIComponent(universityId)}&enrollmentYear=${defaultEnrollmentYear}`}
          className="inline-flex items-center text-accent-ink hover:text-accent-hover"
          style={{ fontSize: 13 }}
        >
          ← Volver al paso anterior
        </Link>
      </div>
    </OnboardingShell>
  );
}

async function fetchUniversityName(universityId: string): Promise<string> {
  const r = await apiFetch('/api/academic/universities', { cache: 'no-store' });
  if (!r.ok) return universityId;
  const list = (await r.json()) as { id: string; name: string }[];
  return list.find((u) => u.id === universityId)?.name ?? universityId;
}

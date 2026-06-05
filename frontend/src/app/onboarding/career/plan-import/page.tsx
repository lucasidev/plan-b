import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CareerPlanImportFlow } from '@/features/import-career-plan';
import { OnboardingShell } from '@/features/onboarding';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/career/plan-import` sub-flow of step 02 when the student does not find
 * their plan in the cascades (US-088). Receives via query params the university
 * already picked in the previous step + the typed enrollment year, so that state is
 * not lost during navigation.
 *
 * When the preview is confirmed, the feature flow redirects to
 * `/onboarding/career?planId=X` with the freshly created plan, so the student
 * completes the StudentProfile in the main form without re-selecting the cascades.
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

  // Resolve the university name to display in the form. Fallback: the id if the API fails.
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

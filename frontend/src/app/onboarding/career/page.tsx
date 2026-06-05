import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CareerForm, OnboardingShell } from '@/features/onboarding';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/career` step 02 (US-037-f). Cascading form University → Career → Plan +
 * enrollment year.
 *
 * Guard: if the user already has a StudentProfile, redirect to /home (we could not
 * create another profile, the endpoint would return 409). Otherwise, show the form.
 *
 * The form is a client component (TanStack Query for the cascades + `useActionState`
 * for the submit). The page is a thin server component.
 */
export default async function OnboardingCareerPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (profile) redirect('/home');

  return (
    <OnboardingShell
      step={2}
      heading="Asociá tu carrera"
      subheading="Elegí tu universidad, carrera y plan vigente. Esto filtra todo lo que ves después en plan-b."
    >
      {/* Suspense boundary required by useSearchParams() inside CareerForm: without it
          the entire page bails out to client-side rendering
          (react-doctor/nextjs-no-use-search-params-without-suspense rule). */}
      <Suspense fallback={null}>
        <CareerForm />
      </Suspense>
    </OnboardingShell>
  );
}

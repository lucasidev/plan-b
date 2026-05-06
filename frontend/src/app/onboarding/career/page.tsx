import { redirect } from 'next/navigation';
import { CareerForm, OnboardingShell } from '@/features/onboarding';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/career` — paso 02 (US-037-f). Form de cascadas Universidad
 * → Carrera → Plan + año de ingreso.
 *
 * Guard: si el user ya tiene StudentProfile, redirect a /home (no podríamos
 * crear otro profile, el endpoint devolvería 409). Si no, mostramos el form.
 *
 * El form es client component (TanStack Query para las cascadas +
 * `useActionState` para el submit). La página es server component thin.
 */
export default async function OnboardingCareerPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile(session.userId);
  if (profile) redirect('/home');

  return (
    <OnboardingShell
      step={2}
      heading="Asociá tu carrera"
      subheading="Elegí tu universidad, carrera y plan vigente. Esto filtra todo lo que ves después en plan-b."
    >
      <CareerForm />
    </OnboardingShell>
  );
}

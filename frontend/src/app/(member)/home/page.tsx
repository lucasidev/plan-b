import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
import { CurrentSubjectsCard } from '@/features/home/components/current-subjects-card';
import { PeriodProgressCard } from '@/features/home/components/period-progress-card';
import { UpcomingSubjectsCard } from '@/features/home/components/upcoming-subjects-card';
import { activeSubjects } from '@/features/home/data/active-subjects';
import { currentPeriod } from '@/features/home/data/period';
import { greetingNameFromEmail } from '@/features/home/lib/greeting';
import { getSession } from '@/lib/session';

/**
 * Home v2 (US-044). Port literal del mock
 * `docs/design/reference/canvas-mocks/v2-screens.jsx::V2Inicio`.
 *
 * Estado: shell (US-044-a) + columna izquierda (US-044-b). La columna
 * derecha (Reseñá + Pensando en lo que viene + Movimientos) aterriza en
 * US-044-c y se inserta en el `<aside>` reservado.
 *
 * El guard de `(member)/layout.tsx` ya redirige al onboarding si el user
 * no tiene StudentProfile (US-037-f). Esta página asume sesión + profile
 * activos.
 */
export default async function HomePage() {
  const session = await getSession();
  const firstName = session ? greetingNameFromEmail(session.email) : 'alumno';

  const cursando = activeSubjects.filter((s) => s.week > 0);
  const futuras = activeSubjects.filter((s) => s.week === 0);

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <Eyebrow>Inicio</Eyebrow>
      <DisplayHeading size={56} className="mt-2 mb-3">
        Hola {firstName}.
      </DisplayHeading>
      <Lede className="mb-8 max-w-[640px]">
        Vas por la semana {currentPeriod.weekOfYear} del año. {cursando.length} materias cursando,{' '}
        {futuras.length} arrancan más adelante.
      </Lede>

      <PeriodProgressCard period={currentPeriod} />

      <section
        aria-label="Bloques secundarios del Inicio"
        className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4"
      >
        <div className="flex flex-col gap-[14px]">
          <CurrentSubjectsCard subjects={cursando} />
          <UpcomingSubjectsCard subjects={futuras} />
        </div>

        {/*
          TODO(US-044-c): columna derecha con PendingReviewsCard +
          NextPeriodCard + MovementsCard. Hasta que aterrice, el grid
          mantiene el ratio 1.55fr/1fr y la columna derecha queda vacía.
        */}
        <aside aria-label="Pendientes y actividad reciente" className="flex flex-col gap-[14px]" />
      </section>
    </div>
  );
}

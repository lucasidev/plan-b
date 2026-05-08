import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
import { CurrentSubjectsCard } from '@/features/home/components/current-subjects-card';
import { MovementsCard } from '@/features/home/components/movements-card';
import { NextPeriodCard } from '@/features/home/components/next-period-card';
import { PendingReviewsCard } from '@/features/home/components/pending-reviews-card';
import { PeriodProgressCard } from '@/features/home/components/period-progress-card';
import { UpcomingSubjectsCard } from '@/features/home/components/upcoming-subjects-card';
import { activeSubjects } from '@/features/home/data/active-subjects';
import { movements } from '@/features/home/data/movements';
import { currentPeriod } from '@/features/home/data/period';
import { pendingReviews } from '@/features/home/data/to-review';
import { greetingNameFromEmail } from '@/features/home/lib/greeting';
import { getSession } from '@/lib/session';

/**
 * Home v2 (US-044, completa). Port literal del mock
 * `docs/design/reference/canvas-mocks/v2-screens.jsx::V2Inicio`.
 *
 * Estructura: header (eyebrow + greeting + subtitle stats) + período
 * progress card + grid 2-col (En curso + Más adelante a la izquierda;
 * Reseñá lo que cursaste + Pensando en lo que viene + Movimientos a la
 * derecha).
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

        <aside aria-label="Pendientes y actividad reciente" className="flex flex-col gap-[14px]">
          <PendingReviewsCard reviews={pendingReviews} year={currentPeriod.year} />
          <NextPeriodCard nextYear={currentPeriod.year + 1} />
          <MovementsCard movements={movements} />
        </aside>
      </section>
    </div>
  );
}

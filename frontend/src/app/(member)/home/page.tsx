import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
import { PeriodProgressCard } from '@/features/home/components/period-progress-card';
import { currentPeriod } from '@/features/home/data/period';
import { greetingNameFromEmail } from '@/features/home/lib/greeting';
import { getSession } from '@/lib/session';

/**
 * Home v2 (US-044). Port literal del mock
 * `docs/design/reference/canvas-mocks/v2-screens.jsx::V2Inicio`.
 *
 * Esta es la US-044-a: shell (eyebrow + greeting + subtitle stats) + período
 * progress card. Deja la sección reservada para los bloques de columnas que
 * aterrizan en US-044-b (En curso + Más adelante en la izquierda) y US-044-c
 * (Reseñá + Pensando en lo que viene + Movimientos en la derecha).
 *
 * Hasta que `-b` aterrice, los counts del subtitle ("4 materias cursando, 1
 * arranca más adelante") se muestran como placeholder ("0 materias cursando").
 * Cuando US-044-b agregue el mock activo, el subtitle pasa a leer counts
 * reales desde `activeSubjects.filter(s => s.week > 0).length`.
 *
 * El guard de `(member)/layout.tsx` ya redirige al onboarding si el user no
 * tiene StudentProfile (US-037-f). Esta página asume sesión + profile activos.
 */
export default async function HomePage() {
  const session = await getSession();
  const firstName = session ? greetingNameFromEmail(session.email) : 'alumno';

  // TODO(US-044-b): reemplazar por counts reales del mock activeSubjects.
  // Mientras tanto, placeholder coherente con período "en curso".
  const cursandoCount = 0;
  const futurasCount = 0;

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <Eyebrow>Inicio</Eyebrow>
      <DisplayHeading size={56} className="mt-2 mb-3">
        Hola {firstName}.
      </DisplayHeading>
      <Lede className="mb-8 max-w-[640px]">
        Vas por la semana {currentPeriod.weekOfYear} del año. {cursandoCount} materias cursando,{' '}
        {futurasCount} arrancan más adelante.
      </Lede>

      <PeriodProgressCard period={currentPeriod} />

      {/*
        Sección reservada para los bloques secundarios.
        - US-044-b agrega columna izq: <CurrentSubjectsCard /> + <UpcomingSubjectsCard />.
        - US-044-c agrega columna der: <PendingReviewsCard /> + <NextPeriodCard /> + <MovementsCard />.
        El grid 1.55fr / 1fr del mock se materializa cuando -b y -c estén.
      */}
      <section
        aria-label="Bloques secundarios del Inicio"
        className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4"
      />
    </div>
  );
}

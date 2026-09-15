import { type SubjectCoverage, SubjectGrid } from '@/features/browse-catalog';
import {
  fetchPlanSubjectCoverageServer,
  fetchPlansByCareerServer,
  fetchSubjectsByPlanServer,
} from '@/features/browse-catalog/api.server';
import { fetchCareerFactsServer } from '@/features/career-facts';
import type { CareerFacts } from '@/features/career-facts/types';
import {
  CareerCoverageCard,
  type ChairNearFloor,
  ChairsNearFloorList,
  fetchChairsNearFloorServer,
  fetchMyReviewedChairTalliesServer,
  fetchMyReviewsServer,
  MyReviewsList,
} from '@/features/my-reviews';
import { fetchCurrentInstrumentServer } from '@/features/write-review';
import { fetchStudentProfile } from '@/lib/student-profile';

export const metadata = {
  title: 'Mis aportes · planb',
};

// Depende de la sesión y cambia con cada edición: se sirve fresca.
export const dynamic = 'force-dynamic';

type CareerBlocks = {
  chairsNearFloor: ChairNearFloor[];
  /** El plan vigente de la carrera declarada, o `null` si ninguno está `Active` (careerId sin
   * plan relevado, el caso de la mayoría del catálogo): sin eso no hay plan del que calcular los
   * bloques 3 y 4, así que los dos se ocultan en vez de mostrar "0 de 0". */
  hasActivePlan: boolean;
  subjects: Awaited<ReturnType<typeof fetchSubjectsByPlanServer>>;
  subjectCoverage: Map<string, SubjectCoverage>;
  facts: CareerFacts | null;
};

/**
 * Los tres bloques que dependen de la carrera declarada (US-231): las cátedras a una reseña de
 * publicar, el plan con su cobertura por materia, y cuánto de la carrera está medido en total.
 * Se piden juntos porque los tres cuelgan de `profile.careerId`, nunca si el perfil no existe
 * (N4): sin perfil no hay carrera de la que pedir nada.
 */
async function fetchCareerBlocks(careerId: string): Promise<CareerBlocks> {
  const [chairsNearFloor, plans, facts] = await Promise.all([
    fetchChairsNearFloorServer(careerId),
    fetchPlansByCareerServer(careerId),
    fetchCareerFactsServer(careerId),
  ]);

  const activePlan = plans.find((plan) => plan.status === 'Active') ?? null;
  if (!activePlan) {
    return {
      chairsNearFloor,
      hasActivePlan: false,
      subjects: [],
      subjectCoverage: new Map(),
      facts,
    };
  }

  const [subjects, coverage] = await Promise.all([
    fetchSubjectsByPlanServer(activePlan.id),
    fetchPlanSubjectCoverageServer(activePlan.id),
  ]);

  return {
    chairsNearFloor,
    hasActivePlan: true,
    subjects,
    subjectCoverage: new Map(coverage.map((c) => [c.subjectId, c])),
    facts,
  };
}

/**
 * Mis aportes (SC-018, US-231): absorbe lo que mostraba Inicio (retirada el 2026-09-14) y es la
 * pantalla a la que entra toda cuenta de alumno. Cuatro bloques: lo que reseñaste, las cátedras de
 * tu carrera a una reseña de publicar, el plan de tu carrera con su cobertura, y cuánto de tu
 * carrera está medido en total.
 *
 * El cuestionario baja acá porque el editor lo necesita para dibujar las preguntas. Si todavía no
 * hay uno publicado, la lista se ve igual pero sin poder editar: mostrar lo aportado no depende
 * de que exista un cuestionario vigente.
 *
 * Es también donde aterriza quien acaba de reseñar una cursada (`?published=1`): el acuse va acá y
 * no en la pantalla de reseñar porque lo que confirma es que la reseña ya está en la lista, con su
 * botón de editar al lado.
 *
 * Los bloques 2 a 4 dependen de que el perfil tenga una carrera declarada (N4): sin perfil no hay
 * plan del que calcular nada, así que se ocultan en vez de mostrar "0 de 0".
 */
export default async function MyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const [{ published }, reviews, instrument, tallies, profile] = await Promise.all([
    searchParams,
    fetchMyReviewsServer(),
    fetchCurrentInstrumentServer(),
    fetchMyReviewedChairTalliesServer(),
    fetchStudentProfile(),
  ]);

  const career = profile ? await fetchCareerBlocks(profile.careerId) : null;

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-8">
      <div className="mb-[18px]">
        <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">Mis aportes</h1>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Lo que reseñaste, y que solo ves vos. En las fichas nunca se muestra una reseña sola: se
          publican los conteos de todos juntos.
        </p>
      </div>

      {published === '1' && (
        <p
          role="status"
          className="mb-3 rounded-lg border border-line bg-bg-elev px-3.5 py-2.5 text-[13px] leading-relaxed text-ink"
        >
          Listo, quedó contada. Se suma a los conteos de su cátedra; acá la podés editar o sacar
          cuando quieras.
        </p>
      )}

      <section className="mb-5">
        <p className="mb-2 text-[12px] text-ink-3">Lo que reseñaste</p>
        <MyReviewsList reviews={reviews} instrument={instrument} tallies={tallies} />
      </section>

      {career && (
        <>
          <ChairsNearFloorList
            chairs={career.chairsNearFloor}
            reviewedChairIds={new Set(tallies.keys())}
          />

          {career.hasActivePlan && (
            <section className="mb-5">
              <p className="mb-2 text-[12px] text-ink-3">Tu carrera</p>
              <SubjectGrid subjects={career.subjects} subjectCoverage={career.subjectCoverage} />
            </section>
          )}

          {career.hasActivePlan && career.facts && <CareerCoverageCard facts={career.facts} />}
        </>
      )}
    </div>
  );
}

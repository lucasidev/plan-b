import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { availableSubjectsQueries, PlanShell, simulationDraftsQueries } from '@/features/plan';
import {
  fetchAcademicTermsServer,
  fetchAvailableSubjectsServer,
  fetchSimulationDraftsServer,
} from '@/features/plan/api.server';
import { pickDefaultTerm } from '@/features/plan/lib/default-term';
import { fetchStudentProfile } from '@/lib/student-profile';

export const metadata = {
  title: 'Planificar · planb',
};

// Per-user, depende de cookies (el drawer "Agregar materia" pega a /api/me/simulator/available).
// Dynamic para no intentar prerenderear en build con el backend caído.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ tab?: string; termId?: string }>;

/**
 * /plan (US-046 shell + US-016 simulador + US-096 comisiones/período + US-023 borradores). "En
 * curso" y "Borradores" ya son datos reales (`SimulationDraft`, agrupados por status + término en
 * `PlanShell`); el catálogo de materias + comisiones también. La página prefetchea ambas queries +
 * hidrata, así `PlanShell`/`ActiveTab`/el drawer "Agregar materia" consumen con useSuspenseQuery sin
 * un roundtrip extra al montar.
 */
export default async function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeTab = params.tab === 'draft' ? 'draft' : 'active';

  const profile = await fetchStudentProfile();
  // Degrada a lista vacía ante cualquier falla (backend caído, 5xx): el selector de período
  // muestra "sin períodos cargados" en vez de tirar abajo toda la página (mismo criterio que
  // `fetchStudentProfile`).
  const terms = profile?.universityId
    ? await fetchAcademicTermsServer(profile.universityId).catch(() => [])
    : [];

  const requestedTermId =
    params.termId && terms.some((t) => t.id === params.termId) ? params.termId : null;
  // Sin `?termId=` en la URL, el planificador arranca en el período que viene (ver
  // `pickDefaultTerm`): el alumno entra a armar lo próximo, no a mirar lo que ya cursó.
  const selectedTermId = requestedTermId ?? pickDefaultTerm(terms);

  const queryClient = new QueryClient();
  const availableOptions = availableSubjectsQueries.list(selectedTermId);
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: availableOptions.queryKey,
      queryFn: () => fetchAvailableSubjectsServer(selectedTermId),
    }),
    queryClient.prefetchQuery({
      queryKey: simulationDraftsQueries.list().queryKey,
      queryFn: fetchSimulationDraftsServer,
    }),
  ]);

  return (
    <div className="py-6">
      {/* DisplayHeading + Lede live in the shell; we keep an aliased export so the
          page still uses the same lookup as the rest. */}
      <div className="sr-only">
        <DisplayHeading>Planificar</DisplayHeading>
        <Lede>Tu cuatri en borrador y en curso.</Lede>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* Suspense porque PlanShell lee useSuspenseQuery(simulationDraftsQueries.list) +
            useSearchParams() directo. Resuelve al toque desde el cache recién hidratado; el
            boundary es la red de contención si algún día suspende de verdad. */}
        <Suspense fallback={null}>
          <PlanShell activeTab={activeTab} terms={terms} selectedTermId={selectedTermId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}

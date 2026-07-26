import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import {
  availableSubjectsQueries,
  MOCK_ACTIVE_SIMULATION,
  MOCK_DRAFTS,
  PlanShell,
} from '@/features/plan';
import { fetchAcademicTermsServer, fetchAvailableSubjectsServer } from '@/features/plan/api.server';
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
 * /plan (US-046 shell + US-016 backend + US-096 comisiones/período). "En curso" / "Borradores"
 * siguen con datos mock (US-023 storage pendiente), pero el catálogo de materias + comisiones ya
 * es real: la página prefetchea acá + hidrata, así el drawer "Agregar materia" y el picker de
 * comisión consumen con useSuspenseQuery sin un roundtrip extra al abrirse.
 */
export default async function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeTab = params.tab === 'draft' ? 'draft' : 'active';

  // Mock data for now. When US-023 (draft/active storage) lands, this is replaced by real
  // queries with the same shape.
  const active = MOCK_ACTIVE_SIMULATION;
  const drafts = MOCK_DRAFTS;

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
  await queryClient.prefetchQuery({
    queryKey: availableOptions.queryKey,
    queryFn: () => fetchAvailableSubjectsServer(selectedTermId),
  });

  return (
    <div className="py-6">
      {/* DisplayHeading + Lede live in the shell; we keep an aliased export so the
          page still uses the same lookup as the rest. */}
      <div className="sr-only">
        <DisplayHeading>Planificar</DisplayHeading>
        <Lede>Tu cuatri en borrador y en curso.</Lede>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <PlanShell
          active={active}
          drafts={drafts}
          activeTab={activeTab}
          terms={terms}
          selectedTermId={selectedTermId}
        />
      </HydrationBoundary>
    </div>
  );
}

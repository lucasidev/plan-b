import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import {
  availableSubjectsQueries,
  MOCK_ACTIVE_SIMULATION,
  MOCK_DRAFTS,
  PlanShell,
} from '@/features/plan';
import { fetchAvailableSubjectsServer } from '@/features/plan/api.server';

export const metadata = {
  title: 'Planificar · planb',
};

// Per-user, depende de cookies (el drawer "Agregar materia" pega a /api/me/simulator/available).
// Dynamic para no intentar prerenderear en build con el backend caído.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ tab?: string }>;

/**
 * /plan (US-046 shell + US-016 backend). "En curso" / "Borradores" siguen con datos mock (US-023
 * storage pendiente), pero el drawer "Agregar materia" ya es real: la página prefetchea acá +
 * hidrata, así `SubjectPickerDrawer` consume con useSuspenseQuery sin un roundtrip extra al abrirse.
 */
export default async function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeTab = params.tab === 'draft' ? 'draft' : 'active';

  // Mock data for now. When US-023 (draft/active storage) lands, this is replaced by real
  // queries with the same shape.
  const active = MOCK_ACTIVE_SIMULATION;
  const drafts = MOCK_DRAFTS;

  const queryClient = new QueryClient();
  const availableOptions = availableSubjectsQueries.list();
  await queryClient.prefetchQuery({
    queryKey: availableOptions.queryKey,
    queryFn: fetchAvailableSubjectsServer,
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
        <PlanShell active={active} drafts={drafts} activeTab={activeTab} />
      </HydrationBoundary>
    </div>
  );
}

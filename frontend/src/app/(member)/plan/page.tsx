import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { MOCK_ACTIVE_SIMULATION, MOCK_DRAFTS, PlanShell } from '@/features/plan';

export const metadata = {
  title: 'Planificar · planb',
};

type SearchParams = Promise<{ tab?: string }>;

/**
 * /plan (US-046). Mockup of the Plan shell with tabs (active / draft), mock data
 * aligned with the v2 canvas. Once US-016 (backend simulation) + US-023 (storage)
 * land, the data is replaced by real queries with the same shape.
 *
 * Thin server component: reads the tab from the query string, data comes from mocks
 * (does not require await; the `async` is kept for when the real fetch lands).
 */
export default async function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeTab = params.tab === 'draft' ? 'draft' : 'active';

  // Mock data for now. When the backend lands, this is replaced by
  // fetchMyActiveSimulation() and fetchMyDrafts() with apiFetchAuthenticated.
  const active = MOCK_ACTIVE_SIMULATION;
  const drafts = MOCK_DRAFTS;

  return (
    <div className="py-6">
      {/* DisplayHeading + Lede live in the shell; we keep an aliased export so the
          page still uses the same lookup as the rest. */}
      <div className="sr-only">
        <DisplayHeading>Planificar</DisplayHeading>
        <Lede>Tu cuatri en borrador y en curso.</Lede>
      </div>

      <PlanShell active={active} drafts={drafts} activeTab={activeTab} />
    </div>
  );
}

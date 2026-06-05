import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { MOCK_ACTIVE_SIMULATION, MOCK_DRAFTS, PlanificarShell } from '@/features/plan';

export const metadata = {
  title: 'Planificar · planb',
};

type SearchParams = Promise<{ tab?: string }>;

/**
 * /plan (US-046). Maqueta del shell de Planificar con tabs (en-curso / borrador), mock
 * data alineada al canvas v2. Cuando aterrice US-016 (simulación backend) + US-023 (storage)
 * la data se reemplaza por queries reales con el mismo shape.
 *
 * Server component thin: lee el tab del query string, los datos vienen de mocks (no requieren
 * await; el `async` queda para cuando exista el fetch real).
 */
export default async function PlanificarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const activeTab = params.tab === 'borrador' ? 'borrador' : 'en-curso';

  // Mock data por ahora. Cuando aterrice el backend, se reemplaza por fetchMyActiveSimulation()
  // y fetchMyDrafts() con apiFetchAuthenticated.
  const active = MOCK_ACTIVE_SIMULATION;
  const drafts = MOCK_DRAFTS;

  return (
    <div className="py-6">
      {/* DisplayHeading + Lede van en el shell; mantenemos export aliasado para que la página
          siga con el mismo lookup que el resto. */}
      <div className="sr-only">
        <DisplayHeading>Planificar</DisplayHeading>
        <Lede>Tu cuatri en borrador y en curso.</Lede>
      </div>

      <PlanificarShell active={active} drafts={drafts} activeTab={activeTab} />
    </div>
  );
}

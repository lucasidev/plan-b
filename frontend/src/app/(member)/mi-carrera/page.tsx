import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { PlanGrid } from '@/features/mi-carrera/components/plan-grid';
import { SubjectList } from '@/features/mi-carrera/components/subject-list';
import { TabStub } from '@/features/mi-carrera/components/tab-stub';
import { TabsNav } from '@/features/mi-carrera/components/tabs-nav';
import { TeacherList } from '@/features/mi-carrera/components/teacher-list';
import { plan } from '@/features/mi-carrera/data/plan';
import { type MiCarreraTabId, parseTab } from '@/features/mi-carrera/lib/tabs';

/**
 * Mi carrera: shell + nav de 5 tabs (US-045-a). Consolida lo que antes
 * vivía en 4 entries del sidebar (`/plan`, `/subjects`, `/professors`,
 * `/history`) en una sola ruta con tabs como query param.
 *
 * Server component: lee `?tab=` desde `searchParams`, valida con
 * `parseTab()` (cualquier valor inválido cae a `plan`), pasa el activo
 * a `TabsNav` para el highlight + a la sección que renderea el stub
 * correspondiente.
 *
 * Cuando los slices US-045-b/c/d/e aterricen, este `switch` reemplaza
 * los `<TabStub />` por los componentes reales (`<PlanGrid />`, etc.).
 *
 * El guard de `(member)/layout.tsx` ya redirige al onboarding si el
 * user no tiene StudentProfile (US-037-f).
 */
export default async function MiCarreraPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <Eyebrow>Mi carrera</Eyebrow>
      <DisplayHeading size={48} className="mt-2 mb-6">
        Tu carrera, en un solo lugar.
      </DisplayHeading>

      <TabsNav active={tab} />

      <TabContent tab={tab} />
    </div>
  );
}

/**
 * Render del tab activo. Por ahora todos son `TabStub`. Cuando aterricen
 * los slices, cada `case` reemplaza el stub por el componente real.
 */
function TabContent({ tab }: { tab: MiCarreraTabId }) {
  switch (tab) {
    case 'plan':
      return <PlanGrid plan={plan} />;
    case 'correlativas':
      return <TabStub label="Correlativas" futureUs="US-045-c" />;
    case 'catalogo':
      return <SubjectList plan={plan} />;
    case 'docentes':
      return <TeacherList />;
    case 'historial':
      return <TabStub label="Historial académico" futureUs="US-045-e" />;
  }
}

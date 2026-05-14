import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { CorrelativasGraph } from '@/features/mi-carrera/components/correlativas-graph';
import { HistoryTab } from '@/features/mi-carrera/components/history-tab';
import { PlanGrid } from '@/features/mi-carrera/components/plan-grid';
import { SubjectList } from '@/features/mi-carrera/components/subject-list';
import { TabsNav } from '@/features/mi-carrera/components/tabs-nav';
import { TeacherList } from '@/features/mi-carrera/components/teacher-list';
import { plan } from '@/features/mi-carrera/data/plan';
import { type MiCarreraTabId, parseTab } from '@/features/mi-carrera/lib/tabs';
import { cn } from '@/lib/utils';

/**
 * Mi carrera: shell + nav de 5 tabs (US-045-a). Consolida lo que antes
 * vivía en 4 entries del sidebar (`/plan`, `/subjects`, `/professors`,
 * `/history`) en una sola ruta con tabs como query param.
 *
 * Server component: lee `?tab=` desde `searchParams`, valida con
 * `parseTab()` (cualquier valor inválido cae a `plan`), pasa el activo
 * a `TabsNav` para el highlight + a la sección que renderea el componente
 * real del tab.
 *
 * Los 5 tabs ya tienen sus slices implementados:
 *   - `plan` → PlanGrid (US-045-b)
 *   - `correlativas` → CorrelativasGraph (US-045-c)
 *   - `catalogo` → SubjectList (US-045-d)
 *   - `docentes` → TeacherList (US-045-d)
 *   - `historial` → HistoryTab (US-045-e)
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

  // Header port literal del canvas `V2MiCarrera`:
  //   eyebrow="Mi carrera"
  //   title=`${user.career} · UNSTA`
  //   sub=`${pct}% del plan completado · X aprobadas · Y cursando · Z pendientes`
  //   pageRight=<button>Exportar plan</button>
  //
  // Datos hardcodeados temporalmente (career + stats) reemplazan al copy
  // inventado "Tu carrera, en un solo lugar." que aterrizó en US-045-a por
  // error. Quedan como TODO hasta que aterricen:
  //   - StudentProfile en sesión (US-012-f) → reemplaza `careerDisplay`.
  //   - Stats reales del plan + historial (US-061 + Enrollments) →
  //     reemplazan los conteos hardcodeados.
  const careerDisplay = 'Ingeniería en Sistemas · UNSTA';
  const stats = { approved: 18, coursing: 5, pending: 14 };
  const total = stats.approved + stats.coursing + stats.pending;
  const pct = total > 0 ? Math.round((stats.approved / total) * 100) : 0;

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Eyebrow>Mi carrera</Eyebrow>
          <DisplayHeading size={36} className="mt-2 mb-2">
            {careerDisplay}
          </DisplayHeading>
          <p className="text-sm text-ink-3">
            {pct}% del plan completado · {stats.approved} aprobadas · {stats.coursing} cursando ·{' '}
            {stats.pending} pendientes
          </p>
        </div>
        <button
          type="button"
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-bg-card border border-line text-ink-2',
            'hover:border-accent hover:text-ink transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
          aria-label="Exportar plan a PDF"
        >
          Exportar plan
        </button>
      </div>

      <TabsNav active={tab} />

      <TabContent tab={tab} />
    </div>
  );
}

/** Render del tab activo. */
function TabContent({ tab }: { tab: MiCarreraTabId }) {
  switch (tab) {
    case 'plan':
      return <PlanGrid plan={plan} />;
    case 'correlativas':
      return <CorrelativasGraph />;
    case 'catalogo':
      return <SubjectList plan={plan} />;
    case 'docentes':
      return <TeacherList />;
    case 'historial':
      return <HistoryTab />;
  }
}

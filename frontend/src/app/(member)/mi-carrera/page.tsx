import { redirect } from 'next/navigation';
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
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';
import { cn } from '@/lib/utils';

/**
 * Mi carrera: shell + nav de 5 tabs (US-045-a). Consolida lo que antes
 * vivía en 4 entries del sidebar en una sola ruta con tabs como query param.
 *
 * Server component: lee `?tab=` desde `searchParams`, valida con `parseTab()`
 * (cualquier valor inválido cae a `plan`), pasa el activo a `TabsNav` para
 * el highlight + a la sección que renderea el componente real del tab.
 *
 * Los 5 tabs:
 *   - `plan` → PlanGrid (US-045-b)
 *   - `correlativas` → CorrelativasGraph (US-045-c)
 *   - `catalogo` → SubjectList (US-045-d)
 *   - `docentes` → TeacherList (US-045-d)
 *   - `historial` → HistoryTab (US-045-e). Por default empty hasta que aterrice
 *     el read (GET /api/me/enrollment-records).
 *
 * El guard de `(member)/layout.tsx` ya redirige al onboarding si el user no
 * tiene StudentProfile (US-037-f); igual re-fetcheamos acá para mostrar el
 * año de ingreso en el header.
 *
 * **Deuda conocida** (lo arreglamos en sprints próximos):
 *   - El nombre de la carrera + name de la uni necesitan un endpoint
 *     `/api/academic/careers/{id}` que devuelva `{name, slug, universityId}`.
 *     Mientras tanto el header muestra "Mi carrera · plan {year}" sin
 *     el nombre específico, en lugar de mentir con "Ing. en Sistemas" o
 *     mostrar el dato hardcodeado de la persona seedeada.
 *   - Las stats (aprobadas / cursando / pendientes) salen de Enrollments BC.
 *     Hasta que aterrice el read del historial real, mostramos un copy
 *     honesto en lugar de números inventados.
 *   - Los tabs Plan / Catálogo / Correlativas / Docentes consumen un mock
 *     del plan TUDCS UNSTA. Cuando el user tenga otro plan, ese contenido
 *     no aplica. US-061 va a resolver el plan dinámicamente desde Academic.
 */
export default async function MiCarreraPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  // Defense en profundidad: si el layout falló al detectar la falta de profile,
  // acá también redirigimos. Sin profile no hay nada que mostrar.
  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Eyebrow>Mi carrera</Eyebrow>
          <DisplayHeading size={36} className="mt-2 mb-2">
            Tu carrera
          </DisplayHeading>
          <p className="text-sm text-ink-3">
            Ingreso {profile.enrollmentYear} · cargá tu historial para ver stats reales
          </p>
        </div>
        <button
          type="button"
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-bg-card border border-line text-ink-2',
            'hover:border-accent hover:text-ink transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Exportar plan a PDF (próximamente)"
          disabled
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

import { redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HistoryTab } from '@/features/my-career/components/history-tab';
import { PlanGrid } from '@/features/my-career/components/plan-grid';
import { PrerequisitesGraph } from '@/features/my-career/components/prerequisites-graph';
import { SubjectList } from '@/features/my-career/components/subject-list';
import { TabsNav } from '@/features/my-career/components/tabs-nav';
import { TeacherList } from '@/features/my-career/components/teacher-list';
import { plan } from '@/features/my-career/data/plan';
import { type MyCareerTabId, parseTab } from '@/features/my-career/lib/tabs';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';
import { cn } from '@/lib/utils';

/**
 * Mi carrera: shell + nav with 5 tabs (US-045-a). Consolidates what used to live as 4
 * separate sidebar entries into a single route with tabs as a query param.
 *
 * Server component: reads `?tab=` from `searchParams`, coerces it with `parseTab()`
 * (any invalid value falls back to `plan`), passes the active id to `TabsNav` for the
 * highlight + to the section that renders the active tab component.
 *
 * The five tabs:
 *   - `plan` → PlanGrid (US-045-b)
 *   - `prerequisites` → PrerequisitesGraph (US-045-c)
 *   - `catalog` → SubjectList (US-045-d)
 *   - `teachers` → TeacherList (US-045-d)
 *   - `transcript` → HistoryTab (US-045-e). Empty by default until the read endpoint
 *     lands (GET /api/me/enrollment-records).
 *
 * The `(member)/layout.tsx` guard already redirects to onboarding if the user has no
 * StudentProfile (US-037-f); we re-fetch here anyway to display the enrollment year in
 * the header.
 *
 * **Known debt** (we will fix it in upcoming sprints):
 *   - The career name + university name need an
 *     `/api/academic/careers/{id}` endpoint returning `{name, slug, universityId}`.
 *     Meanwhile the header reads "Mi carrera · plan {year}" without the specific name,
 *     rather than lying with "Ing. en Sistemas" or hard-coding the seeded persona's
 *     data.
 *   - The stats (approved / coursing / pending) come from the Enrollments BC. Until the
 *     real transcript read lands, we show an honest copy instead of made-up numbers.
 *   - The Plan / Catalog / Prerequisites / Teachers tabs consume a mock of the UNSTA
 *     TUDCS plan. When the user has a different plan, that content does not apply.
 *     US-061 will resolve the plan dynamically from Academic.
 */
export default async function MyCareerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  // Defense in depth: if the layout failed to detect the missing profile, we redirect
  // here too. Without a profile there is nothing to display.
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

/** Renders the active tab. */
function TabContent({ tab }: { tab: MyCareerTabId }) {
  switch (tab) {
    case 'plan':
      return <PlanGrid plan={plan} />;
    case 'prerequisites':
      return <PrerequisitesGraph />;
    case 'catalog':
      return <SubjectList plan={plan} />;
    case 'teachers':
      return <TeacherList />;
    case 'transcript':
      return <HistoryTab />;
  }
}

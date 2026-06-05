import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SubjectDrawer } from '@/features/my-career/components/subject-drawer';
import { plan } from '@/features/my-career/data/plan';

/**
 * Subject-detail drawer (US-045-d). Dedicated route with the subject resolved by
 * code. If the code does not exist in the student's plan, 404.
 *
 * Visually it is a panel over the app shell, not a modal yet. When a parallel-routes
 * pattern (`@modal`) lands, evaluate migrating; meanwhile a dedicated page gives a
 * shareable URL and simplicity.
 *
 * Replaces the US-045-b stub that was just "Próximamente".
 */
export default async function SubjectDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const found = findSubject(code);

  if (!found) {
    notFound();
  }

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <Link
          href="/my-career?tab=catalog"
          className="text-sm text-accent-ink hover:text-accent-hover inline-flex items-center"
        >
          ← Volver al catálogo
        </Link>
      </div>
      <SubjectDrawer subject={found} />
    </div>
  );
}

/**
 * Module-scope `code → subject + year` map so the lookup in findSubject is O(1)
 * instead of O(n*m) with a nested find (react-doctor/js-index-maps rule). The plan is
 * static data, so the Map is built once when the module loads.
 */
const subjectByCode = new Map(
  plan.flatMap((yearBlock) =>
    yearBlock.subjects.map((s) => [s.code, { ...s, year: yearBlock.year }] as const),
  ),
);

function findSubject(code: string) {
  return subjectByCode.get(code) ?? null;
}

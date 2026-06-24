import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InsightsPanel, ReviewsSection, SubjectHeader } from '@/features/view-subject';
import {
  fetchSubjectInsightsServer,
  fetchSubjectPassRateServer,
  fetchSubjectReviewsServer,
  fetchSubjectServer,
} from '@/features/view-subject/api.server';
import { getSession } from '@/lib/session';

// Public, per-request (reads ?page and the live review corpus). Anonymous visitors welcome.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const subject = await fetchSubjectServer(id);
  return {
    title: subject ? `${subject.code} · ${subject.name} · planb` : 'Materia · planb',
  };
}

/**
 * /subjects/[id] (US-002). Public subject detail: metadata + crowd insights (avg overall
 * rating, distribution, difficulty, hours, % recommend) + the paginated list of published,
 * anonymized reviews. Server-rendered; pagination is link-based via `?page=N`.
 *
 * 404 when the subject id does not exist. A subject with zero published reviews still renders
 * (metadata + empty state), per the US-002 AC.
 */
export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const subject = await fetchSubjectServer(id);
  if (!subject) {
    notFound();
  }

  const [insights, reviews, session, passRate] = await Promise.all([
    fetchSubjectInsightsServer(id),
    fetchSubjectReviewsServer(id, page),
    getSession(),
    fetchSubjectPassRateServer(id),
  ]);
  // Votar requiere sesión. Un visitante anónimo ve los conteos; los botones lo mandan a /sign-in.
  const canVote = session !== null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
      >
        ← plan-b
      </Link>
      <SubjectHeader subject={subject} insights={insights} passRate={passRate} />
      {insights.totalCount > 0 && <InsightsPanel insights={insights} />}
      <ReviewsSection reviews={reviews} canVote={canVote} />
    </main>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchMyTeacherClaimsServer } from '@/features/teacher-claim/api.server';
import {
  TeacherHeader,
  TeacherInsightsPanel,
  TeacherReviewsSection,
} from '@/features/view-teacher';
import {
  fetchTeacherInsightsServer,
  fetchTeacherReviewsServer,
  fetchTeacherServer,
} from '@/features/view-teacher/api.server';
import { getSession } from '@/lib/session';

// Public, per-request (reads ?page and the live review corpus). Anonymous visitors welcome.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const result = await fetchTeacherServer(id);
  if (result.kind !== 'ok') {
    return { title: 'Docente · planb' };
  }
  return { title: `${result.teacher.firstName} ${result.teacher.lastName} · planb` };
}

/**
 * /teachers/[id] (US-003). Public teacher detail: metadata (avatar, name, title, bio) + crowd
 * insights (avg rating, distribution, difficulty, hours, % recommend) + the paginated list of
 * published, anonymized reviews where the teacher was the `docente_reseñado`. Server-rendered;
 * pagination is link-based via `?page=N`.
 *
 * 404 when the id does not exist. A soft-deleted teacher (410 from the API) renders a "ya no figura"
 * notice instead of the page. A teacher with zero reviews still renders (metadata + empty state).
 */
export default async function TeacherPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);

  const result = await fetchTeacherServer(id);
  if (result.kind === 'notfound') {
    notFound();
  }
  if (result.kind === 'removed') {
    return <RemovedNotice />;
  }
  const teacher = result.teacher;

  const [insights, reviews, session] = await Promise.all([
    fetchTeacherInsightsServer(id),
    fetchTeacherReviewsServer(id, page),
    getSession(),
  ]);
  // Votar requiere sesión. Un visitante anónimo ve los conteos; los botones lo mandan a /sign-in.
  const canVote = session !== null;

  // Responder (US-040) lo habilita ser el docente verificado de esta página. Reusamos los claims del
  // viewer (GET /api/me/teacher-claims) en vez de un endpoint nuevo: la authz real la hace el backend.
  let canRespond = false;
  if (session) {
    const claims = await fetchMyTeacherClaimsServer();
    canRespond = claims.some((claim) => claim.teacherId === id && claim.isVerified);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <BackLink />
      <TeacherHeader teacher={teacher} insights={insights} />
      {insights.totalCount > 0 && <TeacherInsightsPanel insights={insights} />}
      <TeacherReviewsSection reviews={reviews} canVote={canVote} canRespond={canRespond} />
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
    >
      ← plan-b
    </Link>
  );
}

function RemovedNotice() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <BackLink />
      <section className="rounded-lg border border-line bg-bg-card p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink m-0">
          Este docente ya no figura en el catálogo.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Las reseñas históricas se conservan, pero el perfil fue dado de baja.
        </p>
      </section>
    </main>
  );
}

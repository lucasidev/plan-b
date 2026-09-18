import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { adminChairQueries } from '@/features/manage-chairs/api';
import {
  fetchAdminChairsServer,
  fetchChairSubjectContextServer,
} from '@/features/manage-chairs/api.server';
import { ChairContext } from '@/features/manage-chairs/components/chair-context';
import { ChairTeam } from '@/features/manage-chairs/components/chair-team';
import { fetchAdminTeachersServer } from '@/features/manage-teachers/api.server';
import { fetchTermsByUniversityServer } from '@/features/manage-terms/api.server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Equipo docente · planb' };

export default async function AdminChairPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const [{ id }, { subjectId }] = await Promise.all([params, searchParams]);
  if (
    !subjectId ||
    !z.string().uuid().safeParse(id).success ||
    !z.string().uuid().safeParse(subjectId).success
  )
    notFound();
  const context = await fetchChairSubjectContextServer(subjectId);
  if (!context) notFound();
  const [chairs, teachers, terms] = await Promise.all([
    fetchAdminChairsServer(context.subjectId),
    fetchAdminTeachersServer(),
    fetchTermsByUniversityServer(context.universityId),
  ]);
  const chair = chairs.find((c) => c.id === id);
  if (!chair) notFound();
  const client = new QueryClient();
  client.setQueryData(adminChairQueries.forSubject(context.subjectId).queryKey, chairs);
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8">
      <ChairContext context={context} chairName={chair.name} />
      <h1 className="mt-5 font-serif text-[28px] font-semibold text-ink">Cátedra {chair.name}</h1>
      <p className="mb-6 text-[13px] text-ink-2">
        {context.subjectName} · Plan {context.planYear}
      </p>
      <HydrationBoundary state={dehydrate(client)}>
        <ChairTeam
          chairId={id}
          context={context}
          teachers={teachers.filter((t) => t.universityId === context.universityId && t.isActive)}
          terms={terms}
        />
      </HydrationBoundary>
    </div>
  );
}

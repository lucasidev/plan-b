import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/auth');
  if (session.role !== 'member') redirect('/auth');
  // ADR-0023: teacher capabilities gated on verified TeacherProfile.
  if (!session.teacherVerified) redirect('/teacher-claim');
  return <>{children}</>;
}

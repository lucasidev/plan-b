import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');
  return <>{children}</>;
}

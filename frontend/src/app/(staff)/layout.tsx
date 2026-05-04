import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

const STAFF_ROLES = ['moderator', 'admin', 'university_staff'] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (!STAFF_ROLES.includes(session.role as StaffRole)) redirect('/sign-in');
  return <>{children}</>;
}

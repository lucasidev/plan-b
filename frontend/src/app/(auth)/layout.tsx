import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // ADR-0019: if already signed in, bounce to dashboard to avoid double-login loops.
  if (session) redirect('/home');
  return <>{children}</>;
}

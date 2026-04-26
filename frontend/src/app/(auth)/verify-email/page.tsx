import { redirect } from 'next/navigation';
import { VerifyEmailFlow } from '@/features/identity/components/verify-email-flow';

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  // Next 15 may surface `?token=a&token=b` as an array; the link in the email is always
  // single-valued so a duplicated param is malformed input → treat as missing.
  const single = typeof token === 'string' && token.length > 0 ? token : null;
  if (!single) redirect('/sign-up');

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <VerifyEmailFlow token={single} />
    </main>
  );
}

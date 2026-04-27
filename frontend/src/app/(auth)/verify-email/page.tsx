import { AuthSplit } from '@/components/layout/auth-split';
import { DisplayHeading } from '@/components/ui';
import { verifyEmail } from '@/features/verify-email/api';
import { VerifyEmailResult } from '@/features/verify-email/components/verify-email-result';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

/**
 * Verify-email route (US-011-f). Server component: reads `token` from the
 * URL, calls POST /api/identity/verify-email server-side, and hands the
 * mapped VerifyEmailResult to the result component. Done in RSC because
 * (a) we don't need client interactivity for read-only outcomes, (b) the
 * token consumption is a one-shot side effect we want to do once on
 * navigation, not on every client render.
 *
 * If the URL has no token, we render the missing_token state without
 * even hitting the backend — that's a wrong arrival, not a verification
 * attempt.
 *
 * Wrapped in AuthSplit (no AuthView, no tabs) because verifying isn't a
 * sign-in / sign-up flow — it's a one-off landing.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : ({ kind: 'missing_token' } as const);

  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Verificá tu <em>cuenta</em>
        </DisplayHeading>
      }
      description="Estamos confirmando tu email para activar tu cuenta de plan-b."
    >
      <VerifyEmailResult result={result} />
    </AuthSplit>
  );
}

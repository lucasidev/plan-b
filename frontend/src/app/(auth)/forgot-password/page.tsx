import { AuthSplit } from '@/components/layout/auth-split';
import { DisplayHeading } from '@/components/ui';
import { ForgotPasswordForm } from '@/features/forgot-password';

/**
 * /forgot-password (US-033-f). Mirrors the AuthSplit hero layout used by
 * /sign-in, /sign-up and /verify-email so the experience feels continuous:
 * the user that clicked "¿Olvidaste tu contraseña?" from sign-in lands on
 * the same visual grammar (hero on the left, form on the right) instead
 * of jumping into a different screen.
 *
 * No server-side data fetching: the action is a pure POST. The page is RSC
 * because there's no client-side state at this level.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Recuperá tu <em>contraseña</em>
        </DisplayHeading>
      }
      description="Ingresá el email con el que te registraste y te mandamos un link para elegir una nueva. Si la cuenta existe, te llega el mail."
    >
      <ForgotPasswordForm />
    </AuthSplit>
  );
}

import { AuthView } from '@/components/layout/auth-view';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';

/**
 * Sign-up route. The (auth) layout already redirects to /dashboard if the
 * caller has a session, so this page only renders when the user is logged
 * out. AuthView owns the marketing column and the tabs; this page just
 * mounts the form. (US-010-f, US-028-f share the AuthView shell.)
 */
export default function SignUpPage() {
  return (
    <AuthView mode="signup">
      <SignUpForm />
    </AuthView>
  );
}

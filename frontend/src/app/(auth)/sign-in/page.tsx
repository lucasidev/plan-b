import { AuthView } from '@/components/layout/auth-view';
import { SignInForm } from '@/features/identity/components/sign-in-form';

/**
 * Sign-in route. Counterpart to /sign-up; both render through AuthView so
 * the marketing column stays identical. The (auth) layout guard already
 * redirects logged-in users to /dashboard. (US-028-f)
 */
export default function SignInPage() {
  return (
    <AuthView mode="signin">
      <SignInForm />
    </AuthView>
  );
}

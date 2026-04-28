import { AuthView } from '@/components/layout/auth-view';

/**
 * Sign-in route. Counterpart to /sign-up; both render through AuthView so
 * the marketing column stays identical. The (auth) layout guard already
 * redirects logged-in users to /dashboard. The in-place switcher inside
 * AuthView lets the user flip to sign-up without navigating. (US-028-f)
 */
export default function SignInPage() {
  return <AuthView initialMode="signin" />;
}

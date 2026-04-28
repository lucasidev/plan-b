import { AuthView } from '@/components/layout/auth-view';

/**
 * Sign-up route. The (auth) layout already redirects to /dashboard if the
 * caller has a session, so this page only renders when the user is logged
 * out. AuthView mounts in client mode with initialMode="signup"; the in-place
 * switcher takes over from there. (US-010-f, US-028-f share the AuthView shell.)
 */
export default function SignUpPage() {
  return <AuthView initialMode="signup" />;
}
